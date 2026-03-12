import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/lib/api-auth";
import type { Readable } from "stream";
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

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const WHISPER_LIMIT = 25 * 1024 * 1024;
const SILENCE_THRESHOLD_PERCENT = 80;

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function analyzeAudioLevels(buffer: Buffer) {
  if (buffer.length < 44) {
    return { isSilent: true, silencePercent: 100, peakDb: -Infinity as number, recommendation: "This recording appears to be blank." };
  }

  const sampleCount = Math.floor(buffer.length / 2);
  const silenceThreshold = 0.00316;
  let silentSamples = 0;
  let peak = 0;

  for (let i = 0; i < sampleCount; i++) {
    const sample = buffer.readInt16LE(i * 2);
    const normalized = Math.abs(sample) / 32768;
    if (normalized < silenceThreshold) silentSamples++;
    if (normalized > peak) peak = normalized;
  }

  const silencePercent = sampleCount > 0 ? Math.round((silentSamples / sampleCount) * 10000) / 100 : 100;
  const peakDb = peak > 0 ? Math.round(20 * Math.log10(peak) * 100) / 100 : -Infinity;

  let recommendation: string;
  if (silencePercent > SILENCE_THRESHOLD_PERCENT) {
    recommendation = "This recording appears to be blank. Check your microphone settings.";
  } else if (peakDb < -30) {
    recommendation = "Audio levels are low. Consider re-recording or using volume boost.";
  } else {
    recommendation = "Audio levels look good.";
  }

  return { isSilent: silencePercent > SILENCE_THRESHOLD_PERCENT, silencePercent, peakDb, recommendation };
}

async function amplifyAudio(inputBuffer: Buffer, inputExt: string, gainDb: number): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const inputPath = path.join(tmpDir, `reverbic-amp-in-${id}.${inputExt}`);
  const outputPath = path.join(tmpDir, `reverbic-amp-out-${id}.${inputExt}`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioFilters(`volume=${gainDb}dB`)
        .audioCodec("copy")
        .format(inputExt === "webm" ? "webm" : inputExt === "m4a" ? "ipod" : inputExt)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", () => {
          ffmpeg(inputPath)
            .noVideo()
            .audioFilters(`volume=${gainDb}dB`)
            .format(inputExt === "webm" ? "webm" : inputExt === "m4a" ? "ipod" : inputExt)
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", (err: Error) => reject(err))
            .run();
        })
        .run();
    });
    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

async function compressAudio(inputBuffer: Buffer, inputExt: string): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const inputPath = path.join(tmpDir, `reverbic-in-${id}.${inputExt}`);
  const outputPath = path.join(tmpDir, `reverbic-out-${id}.mp3`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .audioBitrate("64k")
        .format("mp3")
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });
    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}

/** Split a compressed MP3 buffer into chunks, upload each to S3, return chunk metadata */
async function splitAndUploadChunks(
  compressedBuffer: Buffer,
  baseS3Key: string
): Promise<{ chunks: { s3Key: string; index: number; startTime: number; duration: number }[]; totalDuration: number }> {
  const tmpDir = os.tmpdir();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const srcPath = path.join(tmpDir, `reverbic-split-src-${id}.mp3`);
  const chunkPaths: string[] = [];

  try {
    await fs.writeFile(srcPath, compressedBuffer);
    const totalDuration = await getAudioDuration(srcPath);

    if (totalDuration <= 0) {
      // Single chunk - upload directly
      const chunkKey = `${baseS3Key}-chunk-0.mp3`;
      await getS3Client().send(new PutObjectCommand({
        Bucket: getBucket(),
        Key: chunkKey,
        Body: compressedBuffer,
        ContentType: "audio/mpeg",
      }));
      return {
        chunks: [{ s3Key: chunkKey, index: 0, startTime: 0, duration: totalDuration }],
        totalDuration,
      };
    }

    // Calculate chunk duration: target each chunk < WHISPER_LIMIT
    const bytesPerSecond = compressedBuffer.length / totalDuration;
    const chunkDurationSec = Math.max(30, Math.floor(WHISPER_LIMIT / bytesPerSecond));

    const chunks: { s3Key: string; index: number; startTime: number; duration: number }[] = [];
    let offset = 0;
    let chunkIndex = 0;

    console.log(`[prepare] Splitting: totalDuration=${totalDuration.toFixed(1)}s chunkDuration=${chunkDurationSec}s estimatedChunks=${Math.ceil(totalDuration / chunkDurationSec)}`);

    while (offset < totalDuration) {
      const chunkPath = path.join(tmpDir, `reverbic-chunk-${id}-${chunkIndex}.mp3`);
      chunkPaths.push(chunkPath);

      const duration = Math.min(chunkDurationSec, totalDuration - offset);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(srcPath)
          .setStartTime(offset)
          .duration(duration)
          .noVideo()
          .audioChannels(1)
          .audioFrequency(16000)
          .audioBitrate("64k")
          .format("mp3")
          .output(chunkPath)
          .on("end", () => resolve())
          .on("error", (err: Error) => reject(err))
          .run();
      });

      const chunkBuffer = await fs.readFile(chunkPath);
      const chunkKey = `${baseS3Key}-chunk-${chunkIndex}.mp3`;

      console.log(`[prepare] Uploading chunk ${chunkIndex}: ${(chunkBuffer.length / 1024 / 1024).toFixed(1)}MB offset=${offset.toFixed(1)}s duration=${duration.toFixed(1)}s → ${chunkKey}`);
      await getS3Client().send(new PutObjectCommand({
        Bucket: getBucket(),
        Key: chunkKey,
        Body: chunkBuffer,
        ContentType: "audio/mpeg",
      }));

      chunks.push({ s3Key: chunkKey, index: chunkIndex, startTime: offset, duration });
      offset += duration;
      chunkIndex++;
    }

    return { chunks, totalDuration };
  } finally {
    await fs.unlink(srcPath).catch(() => {});
    for (const p of chunkPaths) {
      await fs.unlink(p).catch(() => {});
    }
  }
}

export const maxDuration = 300;

/**
 * Stage 1: Prepare — Download from S3, analyze, amplify, compress, split into chunks.
 * Returns audio analysis + chunk metadata for the transcribe stage.
 */
export async function POST(request: Request) {
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[prepare] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const { s3Key } = body;
    log(`START s3Key=${s3Key}`);

    if (!s3Key || typeof s3Key !== "string") {
      log("ERROR: missing s3Key");
      return NextResponse.json({ error: "Missing or invalid s3Key" }, { status: 400 });
    }

    // Step 1: Download from S3
    log("Downloading from S3...");
    const getCommand = new GetObjectCommand({ Bucket: getBucket(), Key: s3Key });
    let s3Response;
    try {
      s3Response = await getS3Client().send(getCommand);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "NoSuchKey") {
        log("ERROR: file not found in S3");
        return NextResponse.json({ error: "Audio file not found in S3" }, { status: 404 });
      }
      throw err;
    }

    if (!s3Response.Body) {
      log("ERROR: empty S3 response");
      return NextResponse.json({ error: "Empty response from S3" }, { status: 500 });
    }

    const audioBuffer = await streamToBuffer(s3Response.Body as Readable);
    log(`Downloaded ${Math.round(audioBuffer.length / 1024 / 1024)}MB from S3`);

    if (audioBuffer.length > MAX_FILE_SIZE) {
      log(`ERROR: file too large (${Math.round(audioBuffer.length / 1024 / 1024)}MB)`);
      return NextResponse.json({
        error: `File too large (${Math.round(audioBuffer.length / 1024 / 1024)}MB). Maximum is 500MB.`,
      }, { status: 413 });
    }

    // Step 2: Analyze audio levels
    log("Analyzing audio levels...");
    const audioAnalysis = analyzeAudioLevels(audioBuffer);
    log(`Audio analysis: peak=${audioAnalysis.peakDb}dB silence=${audioAnalysis.silencePercent}% silent=${audioAnalysis.isSilent}`);

    if (audioAnalysis.isSilent) {
      log("DONE: silent recording detected");
      return NextResponse.json({ status: "silent", audioAnalysis, chunks: [] });
    }

    // Step 3: Auto-amplify if needed
    const ext = s3Key.split(".").pop()?.toLowerCase() ?? "webm";
    let processBuffer = audioBuffer;

    if (audioAnalysis.peakDb < -20) {
      const gainNeeded = Math.min(30, Math.round(-6 - audioAnalysis.peakDb));
      log(`Low audio — amplifying by ${gainNeeded}dB...`);
      try {
        processBuffer = await amplifyAudio(audioBuffer, ext, gainNeeded);
        audioAnalysis.recommendation = `Audio was automatically amplified by ${gainNeeded}dB for better transcription.`;
        log(`Amplified: ${Math.round(processBuffer.length / 1024 / 1024)}MB`);
      } catch (err) {
        log(`Amplification failed, using original: ${err}`);
      }
    }

    // Step 4: Compress to mono MP3 64kbps
    log(`Compressing ${Math.round(processBuffer.length / 1024 / 1024)}MB → mono MP3 64kbps...`);
    const compressed = await compressAudio(processBuffer, ext);
    log(`Compressed to ${Math.round(compressed.length / 1024 / 1024)}MB (${(compressed.length / 1024 / 1024).toFixed(1)}MB)`);

    // Step 5: Split into chunks and upload to S3
    const baseKey = s3Key.replace(/\.[^.]+$/, ""); // strip extension
    const needsChunking = compressed.length > WHISPER_LIMIT;

    if (!needsChunking) {
      const chunkKey = `${baseKey}-chunk-0.mp3`;
      log(`Single chunk — uploading to S3 as ${chunkKey}...`);
      await getS3Client().send(new PutObjectCommand({
        Bucket: getBucket(),
        Key: chunkKey,
        Body: compressed,
        ContentType: "audio/mpeg",
      }));

      const tmpPath = path.join(os.tmpdir(), `reverbic-dur-${Date.now()}.mp3`);
      await fs.writeFile(tmpPath, compressed);
      let totalDuration = 0;
      try {
        totalDuration = await getAudioDuration(tmpPath);
      } catch { /* fallback: 0 */ }
      await fs.unlink(tmpPath).catch(() => {});

      log(`DONE: 1 chunk, duration=${totalDuration.toFixed(1)}s`);
      return NextResponse.json({
        status: "prepared",
        audioAnalysis,
        totalDuration,
        chunks: [{ s3Key: chunkKey, index: 0, startTime: 0, duration: totalDuration }],
      });
    }

    // Multiple chunks needed
    log(`Compressed file ${(compressed.length / 1024 / 1024).toFixed(1)}MB > 25MB — splitting into chunks...`);
    const { chunks, totalDuration } = await splitAndUploadChunks(compressed, baseKey);
    log(`DONE: ${chunks.length} chunks, totalDuration=${totalDuration.toFixed(1)}s`);

    return NextResponse.json({
      status: "prepared",
      audioAnalysis,
      totalDuration,
      chunks,
    });
  } catch (err: unknown) {
    log(`ERROR: ${err}`);
    console.error("Prepare error:", err);
    const message = err instanceof Error ? err.message : "Preparation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
