"""
Generate a full-episode audio drama using Google Cloud Text-to-Speech's
Chirp 3: HD voices — the next option after Indic Parler-TTS (wrong accent)
and Edge TTS (correct accent, but flat/no humor).

WHY THIS ONE MIGHT ACTUALLY WORK BETTER
- Hindi (hi-IN) is a supported Chirp 3: HD language (confirmed in Google's
  own docs), and these are Google's newest, most expressive voices —
  described by Google as delivering "realism and emotional resonance."
- There are ~30 named voices, roughly half male, so Shyam and Salim can be
  two genuinely different voices instead of one voice with rate/pitch
  nudged apart (the Edge TTS limitation).
- There's a real, documented pause-control mechanism — `[pause short]` /
  `[pause long]` tags inside a `markup` field — confirmed available for
  hi-IN. This script maps the script's own stage directions (हंसते हुए,
  रुककर, etc.) onto that, instead of the ad-hoc rate/pitch guessing the
  Edge script used.

HONEST CAVEATS
- I haven't been able to actually run this (no network access to Google
  Cloud from this sandbox), so the exact call shape is taken directly
  from Google's published documentation samples, not from a live test.
  If something errors, paste it back and I'll fix it.
- Chirp 3: HD's pause/pace controls are listed as "Preview" features by
  Google — they could change.
- This needs a Google Cloud project with billing enabled (even to use
  free-tier quota) and the Text-to-Speech API turned on — check current
  Chirp 3: HD pricing/quota before heavy use, since premium voice tiers
  aren't always covered by the same free allowance as Standard/WaveNet.

SETUP (one-time)
    # Install the gcloud CLI if you don't have it:
    brew install --cask google-cloud-sdk

    gcloud auth application-default login     # browser login, no JSON key needed
    gcloud config set project YOUR_PROJECT_ID
    # Then enable the API for that project (one-time, via console or):
    gcloud services enable texttospeech.googleapis.com

    pip install google-cloud-texttospeech pydub

USAGE
    python scripts/tts/generate_episode_audio_google.py \\
        --script episode3_script_devanagari.txt \\
        --out episode3_test.mp3 \\
        --limit 10

Then store the result the same way as before:
    npm run audio:attach -- <episode-slug> episode3_test.mp3
"""

import argparse
import re
import sys
from pathlib import Path

SPEAKER_LINE = re.compile(r"^([A-Z][A-Z\s.]{1,20}):\s*(.*)$")
STAGE_CUE = re.compile(r"\(([^)]*)\)")

# Pick two voices with genuinely different documented personalities
# (per Google's Gemini-voice descriptions — preview them yourself in
# Vertex AI Studio before committing, since I can't verify tone myself).
SPEAKER_VOICE = {
    "SHYAM": "Umbriel",  # "Easy-going" — calm, dry delivery
    "SALIM": "Fenrir",  # "Excitable" — energetic, quick to react
    "NARRATOR": "Sulafat",  # "Warm"
}

SPEAKER_BASE_RATE = {
    "SHYAM": 1.0,
    "SALIM": 1.08,
    "NARRATOR": 0.95,
}

# Maps a stage-direction cue to a markup pause tag + a speaking_rate
# override for that line. Same idea as the Edge script's cue hints, but
# using Google's actual pause mechanism instead of guessing with
# rate/pitch alone.
CUE_HINTS: list[tuple[tuple[str, ...], dict]] = [
    (("हंसते", "हंसी", "मुस्कुराते", "गर्मजोशी", "उत्साहित"), {"rate_mult": 1.1, "pause": "[pause short]"}),
    (("चिढ़कर",), {"rate_mult": 1.08, "pause": "[pause short]"}),
    (("चौंककर", "नाराज़", "शर्मिंदा", "कन्फ्यूज़"), {"rate_mult": 1.05, "pause": "[pause short]"}),
    (("बेभाव", "शांत भाव", "संदेह"), {"rate_mult": 0.92, "pause": "[pause short]"}),
    (("धीरे, साफ़",), {"rate_mult": 0.85, "pause": "[pause long]"}),
    (("रुककर", "चुप्पी", "झुककर"), {"rate_mult": 0.9, "pause": "[pause long]"}),
    (("कराहते", "थककर"), {"rate_mult": 0.88, "pause": "[pause short]"}),
    (("सीरियस",), {"rate_mult": 0.95, "pause": "[pause short]"}),
    (("जल्दी-जल्दी",), {"rate_mult": 1.15, "pause": ""}),
]


def resolve_cue(cue: str) -> dict:
    for keywords, hint in CUE_HINTS:
        if any(k in cue for k in keywords):
            return hint
    return {}


def parse_script(text: str):
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or (line.startswith("[") and line.endswith("]")):
            continue
        match = SPEAKER_LINE.match(line)
        if not match:
            continue
        speaker, spoken = match.groups()
        cue_match = STAGE_CUE.search(spoken)
        cue = cue_match.group(1) if cue_match else ""
        spoken_clean = STAGE_CUE.sub("", spoken).strip()
        if spoken_clean:
            yield speaker.strip().upper(), spoken_clean, cue


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--script", required=True, type=Path, help="Path to the Devanagari script file")
    parser.add_argument("--out", required=True, type=Path, help="Output MP3 path")
    parser.add_argument("--language-code", default="hi-IN")
    parser.add_argument("--pause-ms", type=int, default=350, help="Silence between lines, in milliseconds")
    parser.add_argument("--bitrate", default="64k", help="Output MP3 bitrate")
    parser.add_argument("--limit", type=int, default=None, help="Only synthesize the first N lines")
    args = parser.parse_args()

    try:
        from google.cloud import texttospeech
        from pydub import AudioSegment
    except ImportError as exc:
        print(
            f"Missing dependency ({exc}). Run: pip install google-cloud-texttospeech pydub",
            file=sys.stderr,
        )
        return 1

    try:
        client = texttospeech.TextToSpeechClient()
    except Exception as exc:  # noqa: BLE001 - surface auth problems clearly
        print(
            f"Could not create a Text-to-Speech client ({exc}).\n"
            "Make sure you've run:\n"
            "  gcloud auth application-default login\n"
            "  gcloud config set project YOUR_PROJECT_ID\n"
            "  gcloud services enable texttospeech.googleapis.com",
            file=sys.stderr,
        )
        return 1

    script_text = args.script.read_text(encoding="utf-8")
    lines = list(parse_script(script_text))
    if not lines:
        print("No speaker lines found — check the script format.", file=sys.stderr)
        return 1

    if args.limit:
        lines = lines[: args.limit]
        print(f"--limit {args.limit}: synthesizing only the first {len(lines)} lines for a quick test.")

    combined = AudioSegment.silent(duration=0)
    tmp_dir = args.out.parent / ".google_tts_tmp"
    tmp_dir.mkdir(exist_ok=True)

    for index, (speaker, text, cue) in enumerate(lines):
        voice_name = SPEAKER_VOICE.get(speaker, SPEAKER_VOICE["NARRATOR"])
        base_rate = SPEAKER_BASE_RATE.get(speaker, SPEAKER_BASE_RATE["NARRATOR"])
        hint = resolve_cue(cue)
        rate = base_rate * hint.get("rate_mult", 1.0)
        rate = max(0.25, min(2.0, rate))  # Google's documented valid range
        pause_tag = hint.get("pause", "")

        cue_note = f" ({cue})" if cue else ""
        print(f"[{index + 1}/{len(lines)}] {speaker}{cue_note} [{voice_name}, rate={rate:.2f}]: {text[:60]}{'...' if len(text) > 60 else ''}")

        markup_text = f"{pause_tag} {text}" if pause_tag else None
        synthesis_input = (
            texttospeech.SynthesisInput(markup=markup_text) if markup_text else texttospeech.SynthesisInput(text=text)
        )
        voice = texttospeech.VoiceSelectionParams(
            language_code=args.language_code,
            name=f"{args.language_code}-Chirp3-HD-{voice_name}",
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=rate,
        )

        response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)

        line_path = tmp_dir / f"line_{index:04d}.mp3"
        line_path.write_bytes(response.audio_content)

        combined += AudioSegment.from_mp3(line_path) + AudioSegment.silent(duration=args.pause_ms)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    combined.export(args.out, format="mp3", bitrate=args.bitrate, parameters=["-ac", "1"])

    for f in tmp_dir.glob("line_*.mp3"):
        f.unlink()
    tmp_dir.rmdir()

    print(f"\nDone: {args.out} ({len(lines)} lines, {combined.duration_seconds:.1f}s)")
    print(f"Next: npm run audio:attach -- <episode-slug> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
