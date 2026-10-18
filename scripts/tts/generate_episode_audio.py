"""
Generate a full-episode audio drama from Shyam & Salim's script format,
using Indic Parler-TTS (AI4Bharat / Hugging Face, Apache 2.0).

Script format (same as `episode.audio.script`):

    SHYAM: (सहज भाव से) तेरी अलमारी में।
    [SFX: पेज पलटने की आवाज़]      -> skipped (add real SFX in an editor)
    [Beat]                          -> rendered as a longer pause
    SALIM: (चौंककर) तूने मेरी डायरी पढ़ी?!

USAGE
    pip install -r scripts/tts/requirements.txt
    python scripts/tts/generate_episode_audio.py --script episode3_script.txt --out episode3.mp3
    python scripts/tts/generate_episode_audio.py --script episode3_script.txt --out test.mp3 --limit 8

Then:
    npm run audio:attach -- data-mein-kachra-kahan-se-aata-hai episode3.mp3

WHAT CHANGED VS. THE PREVIOUS VERSION
1. Devanagari text is never sent to the transliterator. Only Latin words
   (e.g. "YES", "ABC") are transliterated, so the already-Hindi script
   can't get mangled.
2. SHYAM and SALIM use the model's named Hindi speakers (Rohit / Aman),
   plus a fixed seed per speaker, so each character keeps the same voice
   from line to line instead of drifting.
3. attention_mask and prompt_attention_mask are passed to generate(), as
   in the official model card example.
4. Long lines are split into sentence chunks (~140 chars). Parler-TTS
   tends to drift, mumble or cut off on long inputs.
5. [Beat] lines become a longer pause instead of being dropped.
6. Each clip is trimmed and loudness-normalized so volume doesn't jump
   between lines.
7. Warns about digits left in the text: numbers should be written as
   Hindi words (147 -> एक सौ सैंतालीस), otherwise they're read inconsistently.
"""

import argparse
import io
import re
import sys
from pathlib import Path

DEFAULT_VOICES = {
    # Named speakers keep the voice consistent across lines. Descriptions are
    # kept plain (no emotional adjectives), which kept the Hindi accent intact
    # in earlier tests on this project.
    "SHYAM": (
        "Rohit speaks fluent Hindi with a natural Hindi accent at a moderate, steady pace. "
        "The recording is very clear with no background noise."
    ),
    "SALIM": (
        "Aman speaks fluent Hindi with a natural Hindi accent at a slightly fast pace. "
        "The recording is very clear with no background noise."
    ),
    "NARRATOR": (
        "A warm, unhurried Indian male voice speaks fluent Hindi with a natural Hindi accent, "
        "calmly, like a friend setting a scene over chai. Clear recording, no background noise."
    ),
}
SEEDS = {"SHYAM": 11, "SALIM": 22, "NARRATOR": 33}

SPEAKER_LINE = re.compile(r"^([A-Z][A-Z\s.]{1,20}):\s*(.*)$")
STAGE_CUE = re.compile(r"\([^)]*\)")
LATIN_WORD = re.compile(r"[A-Za-z']+")
DIGITS = re.compile(r"[0-9०-९]")
SENTENCE_END = re.compile(r"(?<=[।?!])\s+")


def parse_script(text: str):
    """Yields ("LINE", speaker, text) or ("PAUSE", None, None)."""
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("["):
            if line[1:].lower().startswith("beat"):
                yield "PAUSE", None, None
            continue  # pure SFX lines are skipped
        match = SPEAKER_LINE.match(line)
        if not match:
            continue
        speaker, spoken = match.groups()
        spoken = re.sub(r"\s{2,}", " ", STAGE_CUE.sub("", spoken)).strip()
        if spoken:
            yield "LINE", speaker.strip().upper(), spoken


def chunk_text(text: str, max_chars: int = 140):
    """Splits a long line into sentence groups of at most ~max_chars."""
    chunks, current = [], ""
    for sentence in SENTENCE_END.split(text):
        if current and len(current) + len(sentence) + 1 > max_chars:
            chunks.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        chunks.append(current)
    return chunks


def build_transliterator():
    """Transliterates only Latin-script words; Devanagari passes through untouched."""
    from ai4bharat.transliteration import XlitEngine

    engine = XlitEngine("hi", beam_width=4, rescore=False)

    def one_word(match):
        word = match.group(0)
        try:
            result = engine.translit_word(word, topk=1)
            candidates = result.get("hi") if isinstance(result, dict) else result
            return candidates[0] if candidates else word
        except Exception:
            return word

    return lambda text: LATIN_WORD.sub(one_word, text)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--script", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--model", default="ai4bharat/indic-parler-tts")
    parser.add_argument("--shyam-voice", default=DEFAULT_VOICES["SHYAM"])
    parser.add_argument("--salim-voice", default=DEFAULT_VOICES["SALIM"])
    parser.add_argument("--narrator-voice", default=DEFAULT_VOICES["NARRATOR"])
    parser.add_argument("--pause-ms", type=int, default=350, help="Pause between lines")
    parser.add_argument("--chunk-pause-ms", type=int, default=150, help="Pause between chunks of one line")
    parser.add_argument("--beat-ms", type=int, default=900, help="Pause for [Beat]")
    parser.add_argument("--max-chars", type=int, default=140, help="Max characters per synthesized chunk")
    parser.add_argument("--bitrate", default="64k")
    parser.add_argument("--limit", type=int, default=None, help="Only render the first N spoken lines")
    parser.add_argument("--no-transliterate", action="store_true")
    args = parser.parse_args()

    try:
        import torch
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer
        import soundfile as sf
        from pydub import AudioSegment
        from pydub.effects import normalize
        from pydub.silence import detect_leading_silence
    except ImportError as exc:
        print(f"Missing dependency ({exc}). Run: pip install -r scripts/tts/requirements.txt", file=sys.stderr)
        return 1

    transliterate = None
    if not args.no_transliterate:
        try:
            transliterate = build_transliterator()
        except ImportError:
            print("ai4bharat-transliteration isn't installed. Install it or pass --no-transliterate.", file=sys.stderr)
            return 1

    voices = {"SHYAM": args.shyam_voice, "SALIM": args.salim_voice, "NARRATOR": args.narrator_voice}

    events = list(parse_script(args.script.read_text(encoding="utf-8")))
    if args.limit:
        kept, spoken = [], 0
        for event in events:
            if event[0] == "LINE":
                if spoken == args.limit:
                    break
                spoken += 1
            kept.append(event)
        events = kept
    total = sum(1 for e in events if e[0] == "LINE")
    if not total:
        print("No speaker lines found. Check the script format.", file=sys.stderr)
        return 1

    for _, speaker, text in (e for e in events if e[0] == "LINE"):
        if DIGITS.search(text):
            print(f"WARNING: digits in {speaker} line, write them as Hindi words: {text[:70]}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading {args.model} on {device} (first run downloads several GB)...")
    model = ParlerTTSForConditionalGeneration.from_pretrained(args.model).to(device)
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    rate = model.config.sampling_rate

    def trim(seg, thresh=-45.0):
        start = detect_leading_silence(seg, silence_threshold=thresh)
        end = len(seg) - detect_leading_silence(seg.reverse(), silence_threshold=thresh)
        return seg[start:end] if end > start else seg

    def synthesize(speaker, text):
        torch.manual_seed(SEEDS.get(speaker, 0))
        desc = description_tokenizer(voices.get(speaker, voices["NARRATOR"]), return_tensors="pt").to(device)
        prompt = tokenizer(text, return_tensors="pt").to(device)
        audio = model.generate(
            input_ids=desc.input_ids,
            attention_mask=desc.attention_mask,
            prompt_input_ids=prompt.input_ids,
            prompt_attention_mask=prompt.attention_mask,
        ).cpu().numpy().squeeze()
        buffer = io.BytesIO()
        sf.write(buffer, audio, rate, format="WAV")
        buffer.seek(0)
        return normalize(trim(AudioSegment.from_wav(buffer)), headroom=1.0)

    combined = AudioSegment.silent(duration=0)
    index = 0
    for kind, speaker, text in events:
        if kind == "PAUSE":
            combined += AudioSegment.silent(duration=args.beat_ms)
            continue
        index += 1
        if transliterate:
            text = transliterate(text)
        print(f"[{index}/{total}] {speaker}: {text[:60]}{'...' if len(text) > 60 else ''}")
        for n, chunk in enumerate(chunk_text(text, args.max_chars)):
            if n:
                combined += AudioSegment.silent(duration=args.chunk_pause_ms)
            combined += synthesize(speaker, chunk)
        combined += AudioSegment.silent(duration=args.pause_ms)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    combined.export(args.out, format="mp3", bitrate=args.bitrate, parameters=["-ac", "1"])
    print(f"\nDone: {args.out} ({total} lines, {combined.duration_seconds:.1f}s)")
    print(f"Next: npm run audio:attach -- <episode-slug> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
