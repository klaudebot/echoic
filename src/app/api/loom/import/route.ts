import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

let _s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _s3Client;
}

function getBucket(): string {
  return process.env.AWS_S3_BUCKET ?? "";
}

export const maxDuration = 120;

const LOOM_URL_RE = /^https?:\/\/(www\.)?loom\.com\/share\/([a-f0-9]+)/;

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://www.loom.com/",
  "Origin": "https://www.loom.com",
};

/**
 * Extract video metadata and HLS master URL from a Loom share page.
 */
async function extractLoomData(url: string) {
  const res = await fetch(url, {
    headers: { ...FETCH_HEADERS, Accept: "text/html,application/xhtml+xml" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Loom page: ${res.status}`);
  }

  const html = await res.text();

  // Extract title
  const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i)
    || html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/ \| Loom$/, "").trim() || "Loom Recording";

  // Extract duration
  const durationMatch = html.match(/"durationInSeconds":\s*(\d+(?:\.\d+)?)/);
  const duration = durationMatch ? parseFloat(durationMatch[1]) : null;

  // Extract HLS URL from Apollo state — look for the m3u8 URL
  const hlsMatch = html.match(/"(https:\/\/luna\.loom\.com\/[^"]*\.m3u8[^"]*)"/);

  if (!hlsMatch) {
    throw new Error("Could not extract video URL from Loom page. The video may be private or require authentication.");
  }

  // Unescape JSON-encoded characters
  const hlsUrl = hlsMatch[1]
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u002f/g, "/")
    .replace(/\\\//g, "/")
    .replace(/\\/g, "");

  return { title, duration, hlsUrl };
}

/**
 * Download audio from Loom HLS stream by:
 * 1. Fetching the master playlist
 * 2. Fetching the audio-only media playlist
 * 3. Downloading all .ts segments
 * 4. Concatenating and converting to MP3 with ffmpeg
 */
async function downloadLoomAudio(hlsUrl: string, log: (msg: string) => void): Promise<{ filePath: string; fileSize: number }> {
  const tmpDir = os.tmpdir();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const tmpFiles: string[] = [];

  try {
    // Step 1: Fetch master playlist
    log("Fetching master playlist...");
    const masterRes = await fetch(hlsUrl, { headers: FETCH_HEADERS });
    if (!masterRes.ok) throw new Error(`Master playlist fetch failed: ${masterRes.status}`);
    const masterPlaylist = await masterRes.text();

    // Extract base URL from the master playlist URL
    const baseUrl = hlsUrl.substring(0, hlsUrl.lastIndexOf("/") + 1);
    // Extract query params (CloudFront signed params) from the master URL
    const queryParams = hlsUrl.includes("?") ? hlsUrl.substring(hlsUrl.indexOf("?")) : "";

    // Step 2: Find the audio playlist reference
    // Look for TYPE=AUDIO URI or fallback to any media playlist
    let audioPlaylistPath: string | null = null;

    const audioMediaMatch = masterPlaylist.match(/URI="([^"]*audio[^"]*)"/i);
    if (audioMediaMatch) {
      audioPlaylistPath = audioMediaMatch[1];
    } else {
      // No separate audio track — use the lowest bitrate video+audio stream
      const lines = masterPlaylist.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          audioPlaylistPath = trimmed;
          break;
        }
      }
    }

    if (!audioPlaylistPath) {
      throw new Error("Could not find audio playlist in HLS manifest");
    }

    // Step 3: Fetch audio media playlist
    const audioPlaylistUrl = `${baseUrl}${audioPlaylistPath}${queryParams}`;
    log(`Fetching audio playlist: ${audioPlaylistPath}`);
    const audioRes = await fetch(audioPlaylistUrl, { headers: FETCH_HEADERS });
    if (!audioRes.ok) throw new Error(`Audio playlist fetch failed: ${audioRes.status}`);
    const audioPlaylist = await audioRes.text();

    // Parse segment file names
    const segmentNames = audioPlaylist
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    log(`Found ${segmentNames.length} audio segments`);

    // Step 4: Download all segments in parallel (batches of 5)
    const segmentBuffers: Buffer[] = [];
    const batchSize = 5;

    for (let i = 0; i < segmentNames.length; i += batchSize) {
      const batch = segmentNames.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (segName) => {
          const segUrl = `${baseUrl}${segName}${queryParams}`;
          const segRes = await fetch(segUrl, { headers: FETCH_HEADERS });
          if (!segRes.ok) throw new Error(`Segment ${segName} fetch failed: ${segRes.status}`);
          const arrayBuf = await segRes.arrayBuffer();
          return Buffer.from(arrayBuf);
        })
      );
      segmentBuffers.push(...results);
    }

    // Step 5: Concatenate all segments into one .ts file
    const totalSize = segmentBuffers.reduce((sum, buf) => sum + buf.length, 0);
    log(`Downloaded ${segmentBuffers.length} segments, total ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

    const tsPath = path.join(tmpDir, `reverbic-loom-${id}.ts`);
    tmpFiles.push(tsPath);
    await fs.writeFile(tsPath, Buffer.concat(segmentBuffers));

    // Step 6: Convert to MP3 with ffmpeg (local file, no network issues)
    const mp3Path = path.join(tmpDir, `reverbic-loom-${id}.mp3`);
    tmpFiles.push(mp3Path);

    log("Converting to MP3...");
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tsPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .audioBitrate("64k")
        .format("mp3")
        .output(mp3Path)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(new Error(`FFmpeg conversion error: ${err.message}`)))
        .run();
    });

    const stat = await fs.stat(mp3Path);
    log(`Converted to MP3: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);

    // Clean up .ts file but keep .mp3
    await fs.unlink(tsPath).catch(() => {});

    return { filePath: mp3Path, fileSize: stat.size };
  } catch (err) {
    // Clean up on error
    for (const f of tmpFiles) {
      await fs.unlink(f).catch(() => {});
    }
    throw err;
  }
}

/**
 * POST /api/loom/import
 * Body: { url: string }
 *
 * Fetches a Loom video, extracts audio, uploads to S3.
 * Returns { recordingId, s3Key, title, duration } for the client
 * to create a meeting record and start processing.
 */
export async function POST(request: Request) {
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[loom] ${msg} (+${Date.now() - t0}ms)`);

  let tmpPath: string | null = null;

  try {
    const { url } = await request.json();

    if (!url || !LOOM_URL_RE.test(url)) {
      return NextResponse.json(
        { error: "Invalid Loom URL. Expected format: https://www.loom.com/share/..." },
        { status: 400 }
      );
    }

    log(`Importing: ${url}`);

    // Step 1: Extract metadata and HLS URL
    log("Extracting video data from Loom page...");
    const { title, duration, hlsUrl } = await extractLoomData(url);
    log(`Found: title="${title}" duration=${duration}s`);

    // Step 2: Download audio via HLS segments
    const { filePath, fileSize } = await downloadLoomAudio(hlsUrl, log);
    tmpPath = filePath;

    // Step 3: Upload to S3
    const recordingId = crypto.randomUUID();
    const s3Key = `default-account/default-user/${recordingId}.mp3`;

    log(`Uploading to S3: ${s3Key}...`);
    const audioBuffer = await fs.readFile(filePath);
    await getS3Client().send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: s3Key,
      Body: audioBuffer,
      ContentType: "audio/mpeg",
    }));
    log(`Uploaded ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB to S3`);

    // Clean up temp file
    await fs.unlink(filePath).catch(() => {});
    tmpPath = null;

    log("DONE");
    return NextResponse.json({
      recordingId,
      s3Key,
      title,
      duration,
      fileSize,
      source: "loom",
      sourceUrl: url,
    });
  } catch (err) {
    log(`ERROR: ${err}`);
    console.error("[loom] Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to import Loom video" },
      { status: 500 }
    );
  } finally {
    if (tmpPath) {
      await fs.unlink(tmpPath).catch(() => {});
    }
  }
}
