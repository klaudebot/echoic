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

/**
 * Extract video metadata and HLS URL from a Loom share page.
 */
async function extractLoomData(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Loom page: ${res.status}`);
  }

  const html = await res.text();

  // Extract title from og:title or page title
  const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i)
    || html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/ \| Loom$/, "").trim() || "Loom Recording";

  // Extract duration from Apollo state or og:video:duration
  const durationMatch = html.match(/"durationInSeconds":\s*(\d+(?:\.\d+)?)/);
  const duration = durationMatch ? parseFloat(durationMatch[1]) : null;

  // Extract HLS URL from Apollo state
  // Loom embeds signed CloudFront URLs in the __APOLLO_STATE__ object
  const hlsMatch = html.match(/"(https:\/\/[^"]*\.m3u8[^"]*)"/);

  if (!hlsMatch) {
    // Try the Loom API endpoint as fallback
    const videoIdMatch = url.match(LOOM_URL_RE);
    if (!videoIdMatch) throw new Error("Could not extract Loom video ID");

    const apiRes = await fetch(`https://www.loom.com/v1/videos/${videoIdMatch[2]}/access-grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      body: JSON.stringify({}),
    });

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      const hlsUrl = apiData?.video?.play?.raw_cdn_hls_url;
      if (hlsUrl) {
        return { title, duration, hlsUrl };
      }
    }

    throw new Error("Could not extract video URL from Loom page. The video may be private or require authentication.");
  }

  // Unescape any escaped characters in the URL
  const hlsUrl = hlsMatch[1].replace(/\\u0026/g, "&").replace(/\\/g, "");

  return { title, duration, hlsUrl };
}

/**
 * Download audio from HLS stream using ffmpeg.
 * Returns the path to the downloaded MP3 file.
 */
async function downloadHlsAudio(hlsUrl: string): Promise<{ filePath: string; fileSize: number }> {
  const tmpDir = os.tmpdir();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const outputPath = path.join(tmpDir, `reverbic-loom-${id}.mp3`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(hlsUrl)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate("64k")
      .format("mp3")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });

  const stat = await fs.stat(outputPath);
  return { filePath: outputPath, fileSize: stat.size };
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
    log(`Found: title="${title}" duration=${duration}s hlsUrl=${hlsUrl.slice(0, 80)}...`);

    // Step 2: Download audio via ffmpeg
    log("Downloading audio from HLS stream...");
    const { filePath, fileSize } = await downloadHlsAudio(hlsUrl);
    tmpPath = filePath;
    log(`Downloaded: ${(fileSize / 1024 / 1024).toFixed(1)}MB → ${filePath}`);

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
