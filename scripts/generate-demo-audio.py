#!/usr/bin/env python3
"""
Generate demo meeting audio from transcript data in demo-data.ts.
Uses edge-tts for voice synthesis, ffmpeg to concatenate, and uploads to S3.
"""

import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import boto3
import edge_tts

# Force unbuffered output
import functools
print = functools.partial(print, flush=True)

FFMPEG = "/home/primary/.local/bin/ffmpeg"
S3_BUCKET = "reverbic-recordings"
S3_PREFIX = "demo/"

# Speaker → edge-tts voice mapping
# Working voices: GuyNeural, JennyNeural, NeerjaNeural, AriaNeural,
#   NatashaNeural, ChristopherNeural, MichelleNeural, RyanNeural, EricNeural
VOICES = {
    "You": "en-US-GuyNeural",
    "Alex Kim": "en-US-ChristopherNeural",
    "Sarah Chen": "en-US-JennyNeural",
    "Marcus Johnson": "en-US-EricNeural",
    "Priya Patel": "en-IN-NeerjaNeural",
    "David Park": "en-US-ChristopherNeural",
    "Lisa Wang": "en-US-AriaNeural",
    "James Rodriguez": "en-GB-RyanNeural",
    "Emily Foster": "en-US-MichelleNeural",
    "Ryan Mitchell": "en-US-EricNeural",
    "Olivia Taylor": "en-AU-NatashaNeural",
    "Chris Nakamura": "en-US-EricNeural",
    "Jessica Brown": "en-US-MichelleNeural",
    "Tom Wright": "en-GB-RyanNeural",
    "Tom Nakamura": "en-GB-RyanNeural",
    "Anna Kowalski": "en-US-AriaNeural",
    "Mike Chen": "en-US-EricNeural",
    "Rachel Torres": "en-US-MichelleNeural",
    "Nina Okafor": "en-AU-NatashaNeural",
    "Jordan Lee": "en-US-EricNeural",
    "Michelle Park": "en-US-MichelleNeural",
    "Jake Morrison": "en-GB-RyanNeural",
    "Elena Vasquez": "en-US-AriaNeural",
    "Sophie Bennett": "en-US-AriaNeural",
    "Chris Yamamoto": "en-US-ChristopherNeural",
    "Ryan O'Dell": "en-US-EricNeural",
    "Team (42 attendees)": "en-US-ChristopherNeural",
    "Daniel Okafor": "en-US-EricNeural",
    "Sandra Blake": "en-US-MichelleNeural",
    "Kevin Park": "en-US-ChristopherNeural",
    "Diana Reed": "en-US-MichelleNeural",
    "Raj Gupta": "en-IN-NeerjaNeural",
    "External Auditor": "en-GB-RyanNeural",
    "Board Member (Diana Wells)": "en-US-AriaNeural",
    "Board Member (Raj Gupta)": "en-IN-NeerjaNeural",
}

DEFAULT_VOICE = "en-US-GuyNeural"


def parse_transcripts_from_ts(filepath: str) -> list[dict]:
    """Extract meeting IDs, titles, and transcript segments from demo-data.ts"""
    with open(filepath) as f:
        content = f.read()

    meetings = []
    # Split by meeting blocks
    blocks = re.split(r'\{\s*\n\s*id:\s*"(mtg-\d+)"', content)

    for i in range(1, len(blocks), 2):
        mid = blocks[i]
        block = blocks[i + 1]

        # Get title
        title_match = re.search(r'title:\s*"([^"]+)"', block)
        title = title_match.group(1) if title_match else mid

        # Find transcript array
        t_match = re.search(r'transcript:\s*\[', block)
        if not t_match:
            continue

        # Extract segments
        segments = []
        seg_pattern = re.finditer(
            r'\{\s*speaker:\s*"([^"]+)",\s*text:\s*"([^"]+)"',
            block[t_match.start():]
        )
        for seg in seg_pattern:
            segments.append({
                "speaker": seg.group(1),
                "text": seg.group(2),
            })

        if segments:
            meetings.append({
                "id": mid,
                "title": title,
                "segments": segments,
            })

    return meetings


def sanitize_text(text: str) -> str:
    """Clean text for TTS — replace special chars that can cause issues."""
    text = text.replace("—", " - ")
    text = text.replace("–", " - ")
    text = text.replace("'", "'")
    text = text.replace(""", '"').replace(""", '"')
    text = text.replace("…", "...")
    return text


async def generate_segment_audio(text: str, voice: str, output_path: str, retries: int = 3):
    """Generate audio for a single segment using edge-tts with retry."""
    text = sanitize_text(text)
    for attempt in range(retries):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            # Verify the file was actually created with content
            if os.path.getsize(output_path) > 0:
                return
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(2 * (attempt + 1))
            else:
                raise e
    raise RuntimeError(f"Failed to generate audio after {retries} attempts")


def generate_silence(duration_ms: int, output_path: str):
    """Generate a silence audio file using ffmpeg."""
    subprocess.run([
        FFMPEG, "-y", "-f", "lavfi",
        "-i", f"anullsrc=r=24000:cl=mono",
        "-t", str(duration_ms / 1000),
        "-c:a", "libmp3lame", "-q:a", "9",
        output_path,
    ], capture_output=True, check=True)


def concatenate_audio(file_list: list[str], output_path: str):
    """Concatenate audio files using ffmpeg."""
    list_file = output_path + ".list"
    with open(list_file, "w") as f:
        for fp in file_list:
            f.write(f"file '{fp}'\n")

    subprocess.run([
        FFMPEG, "-y", "-f", "concat", "-safe", "0",
        "-i", list_file,
        "-c:a", "libmp3lame", "-q:a", "4",
        "-ar", "24000", "-ac", "1",
        output_path,
    ], capture_output=True, check=True)

    os.unlink(list_file)


def upload_to_s3(filepath: str, key: str):
    """Upload file to S3."""
    s3 = boto3.client("s3",
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.upload_file(filepath, S3_BUCKET, key, ExtraArgs={
        "ContentType": "audio/mpeg",
    })
    print(f"  ✓ Uploaded to s3://{S3_BUCKET}/{key}")


async def process_meeting(meeting: dict, tmpdir: str) -> str:
    """Generate full audio for a meeting, return S3 key."""
    mid = meeting["id"]
    title = meeting["title"]
    segments = meeting["segments"]
    print(f"\n▸ {mid}: {title} ({len(segments)} segments)")

    audio_files = []
    silence_path = os.path.join(tmpdir, f"{mid}_silence.mp3")
    generate_silence(800, silence_path)

    for idx, seg in enumerate(segments):
        speaker = seg["speaker"]
        text = seg["text"]
        voice = VOICES.get(speaker, DEFAULT_VOICE)
        seg_path = os.path.join(tmpdir, f"{mid}_seg{idx:03d}.mp3")

        print(f"  [{idx+1}/{len(segments)}] {speaker}: {text[:50]}...")
        await generate_segment_audio(text, voice, seg_path)
        # Small delay to avoid rate limiting
        await asyncio.sleep(0.5)

        # Convert to mp3 if edge-tts outputs non-mp3
        mp3_path = os.path.join(tmpdir, f"{mid}_seg{idx:03d}_conv.mp3")
        subprocess.run([
            FFMPEG, "-y", "-i", seg_path,
            "-c:a", "libmp3lame", "-q:a", "4",
            "-ar", "24000", "-ac", "1",
            mp3_path,
        ], capture_output=True, check=True)

        if idx > 0:
            audio_files.append(silence_path)
        audio_files.append(mp3_path)

    # Concatenate all segments
    output_path = os.path.join(tmpdir, f"{mid}.mp3")
    concatenate_audio(audio_files, output_path)

    # Get file size
    size = os.path.getsize(output_path)
    print(f"  Generated: {size / 1024:.0f} KB")

    # Upload to S3
    s3_key = f"{S3_PREFIX}{mid}.mp3"
    upload_to_s3(output_path, s3_key)

    return s3_key


async def main():
    # Load env
    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())

    # Check required env vars
    for var in ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]:
        if var not in os.environ:
            print(f"ERROR: {var} not set")
            sys.exit(1)

    ts_path = Path(__file__).parent.parent / "src" / "lib" / "demo-data.ts"
    meetings = parse_transcripts_from_ts(str(ts_path))
    print(f"Found {len(meetings)} meetings with transcripts")

    with tempfile.TemporaryDirectory() as tmpdir:
        s3_keys = {}
        for meeting in meetings:
            try:
                key = await process_meeting(meeting, tmpdir)
                s3_keys[meeting["id"]] = key
            except Exception as e:
                print(f"  ✗ FAILED: {e}")

    print(f"\n✓ Done! Generated {len(s3_keys)}/{len(meetings)} audio files")
    print("\nS3 keys:")
    for mid, key in sorted(s3_keys.items()):
        print(f"  {mid}: {key}")


if __name__ == "__main__":
    asyncio.run(main())
