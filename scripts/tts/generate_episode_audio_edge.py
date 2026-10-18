"""
Generate a full-episode audio drama using Microsoft's Edge neural voices
(via the free, unofficial `edge-tts` package) instead of Indic Parler-TTS.

WHY THIS EXISTS
Indic Parler-TTS kept producing an English-accented read of the Hindi
dialogue — confirmed across several attempts (plain Latin-script text,
Devanagari transliteration, simplified voice descriptions). The likely
cause (see generate_episode_audio.py's docstring) is that its
emotion/tone conditioning was trained overwhelmingly on English clips.
Edge's hi-IN voices sidestep that entirely: they're production voices
built specifically for Hindi, not conditioned by a free-text description,
so there's no equivalent failure mode to debug.

TRADE-OFF: this is NOT open-source or self-hosted. It calls Microsoft's
public Edge "Read aloud" service over the network (free, no API key, no
account) via the community-maintained `edge-tts` package. Treat it as a
way to validate everything downstream (the MongoDB storage, the player,
the attach script) with a definitely-correct accent, while a true
open-source model (AI4Bharat's non-Parler Indic-TTS is the next
candidate) gets set up properly.

VOICE AVAILABILITY
As of this writing, Microsoft ships one Hindi male neural voice
(hi-IN-MadhurNeural) and one female (hi-IN-SwaraNeural) — there isn't a
second distinct male Hindi voice to assign Shyam and Salim separately.
This script differentiates them instead via rate/pitch (Salim faster and
slightly higher, Shyam steadier) rather than a different voice identity.
Run `edge-tts --list-voices | grep hi-IN` yourself to confirm what's
currently available — Microsoft adds voices over time and this list may
be out of date.

USAGE
    pip install edge-tts pydub
    python scripts/tts/generate_episode_audio_edge.py \\
        --script episode3_script_devanagari.txt \\
        --out episode3_test.mp3 \\
        --limit 10

Use the Devanagari script file (not the Romanized one) — Azure's hi-IN
voices are tuned for Devanagari input and may mispronounce Romanized text
the same way Parler did.

Then store the result the same way as before:
    npm run audio:attach -- <episode-slug> episode3_test.mp3
"""

import argparse
import asyncio
import re
import sys
from pathlib import Path

SPEAKER_LINE = re.compile(r"^([A-Z][A-Z\s.]{1,20}):\s*(.*)$")
STAGE_CUE = re.compile(r"\(([^)]*)\)")

# Base (rate%, pitchHz) per speaker — Edge TTS's own prosody controls,
# applied on top of the same base voice since only one male Hindi neural
# voice is currently available. Numeric (not pre-formatted) so cue-based
# deltas below can be added on top per line.
SPEAKER_BASE_PROSODY = {
    "SHYAM": {"rate": 0, "pitch": 0},
    "SALIM": {"rate": 12, "pitch": 15},
    "NARRATOR": {"rate": -5, "pitch": -5},
}

# Azure's hi-IN voices have no "express-as" emotional styles and the
# edge-tts wrapper dropped SSML injection, so there's no built-in way to
# make a line sound "amused" or "deadpan". The closest approximation
# available is nudging rate/pitch/pause per line based on the stage
# direction already written into the script — e.g. a laughing line reads
# faster and a touch higher, a deadpan line reads slower and flatter.
# This is a real ceiling on expressiveness, not a complete substitute for
# genuine comedic timing (see the module docstring's XTTS v2 note for
# what would actually get closer to that).
CUE_PROSODY_HINTS: list[tuple[tuple[str, ...], dict]] = [
    (("हंसते", "हंसी", "मुस्कुराते", "गर्मजोशी", "उत्साहित"), {"rate": 14, "pitch": 18, "pause_ms": 120}),
    (("चिढ़कर",), {"rate": 10, "pitch": 12, "pause_ms": 100}),
    (("चौंककर", "नाराज़", "शर्मिंदा", "कन्फ्यूज़"), {"rate": 8, "pitch": 14, "pause_ms": 150}),
    (("बेभाव", "शांत भाव", "संदेह"), {"rate": -10, "pitch": -8, "pause_ms": 150}),
    (("धीरे, साफ़",), {"rate": -15, "pitch": -5, "pause_ms": 250}),
    (("रुककर", "चुप्पी", "झुककर"), {"rate": -8, "pitch": 0, "pause_ms": 400}),
    (("कराहते", "थककर"), {"rate": -12, "pitch": -10, "pause_ms": 200}),
    (("सीरियस", "मज़ाक में सीरियस"), {"rate": -6, "pitch": -4, "pause_ms": 150}),
    (("जल्दी-जल्दी",), {"rate": 18, "pitch": 6, "pause_ms": 80}),
    (("सहज भाव",), {"rate": -3, "pitch": 0, "pause_ms": 80}),
    (("पढ़ते हुए",), {"rate": 0, "pitch": 0, "pause_ms": 100}),
]


def resolve_cue_adjustment(cue: str) -> dict:
    for keywords, adjustment in CUE_PROSODY_HINTS:
        if any(keyword in cue for keyword in keywords):
            return adjustment
    return {}


def parse_script(text: str):
    """Yields (speaker, spoken_text, cue) — the parenthetical stage
    direction is kept (not discarded) so prosody can react to it."""
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


async def synthesize_line(text: str, voice: str, rate: str, pitch: str, out_path: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(out_path))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--script", required=True, type=Path, help="Path to the Devanagari script file")
    parser.add_argument("--out", required=True, type=Path, help="Output MP3 path")
    parser.add_argument("--voice", default="hi-IN-MadhurNeural", help="Edge voice id for all speakers")
    parser.add_argument("--pause-ms", type=int, default=350, help="Silence between lines, in milliseconds")
    parser.add_argument("--bitrate", default="64k", help="Output MP3 bitrate")
    parser.add_argument("--limit", type=int, default=None, help="Only synthesize the first N lines")
    args = parser.parse_args()

    try:
        import edge_tts  # noqa: F401
        from pydub import AudioSegment
    except ImportError as exc:
        print(f"Missing dependency ({exc}). Run: pip install edge-tts pydub", file=sys.stderr)
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
    tmp_dir = args.out.parent / ".edge_tts_tmp"
    tmp_dir.mkdir(exist_ok=True)

    for index, (speaker, text, cue) in enumerate(lines):
        base = SPEAKER_BASE_PROSODY.get(speaker, SPEAKER_BASE_PROSODY["NARRATOR"])
        adjustment = resolve_cue_adjustment(cue)
        rate = base["rate"] + adjustment.get("rate", 0)
        pitch = base["pitch"] + adjustment.get("pitch", 0)
        pause_ms = args.pause_ms + adjustment.get("pause_ms", 0)

        cue_note = f" ({cue})" if cue else ""
        print(f"[{index + 1}/{len(lines)}] {speaker}{cue_note}: {text[:60]}{'...' if len(text) > 60 else ''}")

        line_path = tmp_dir / f"line_{index:04d}.mp3"
        asyncio.run(synthesize_line(text, args.voice, f"{rate:+d}%", f"{pitch:+d}Hz", line_path))

        combined += AudioSegment.from_mp3(line_path) + AudioSegment.silent(duration=pause_ms)

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
