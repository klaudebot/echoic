import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getOpenAI } from "@/lib/openai";
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

/** Upload limit — we can now handle large files via server-side compression */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
/** Whisper API limit */
const WHISPER_LIMIT = 25 * 1024 * 1024; // 25 MB
/** We start compressing when the file exceeds this threshold */
const COMPRESS_THRESHOLD = 24 * 1024 * 1024; // 24 MB
/** Target chunk size when splitting (leave headroom below Whisper limit) */
const CHUNK_TARGET = 24 * 1024 * 1024; // 24 MB

const SILENCE_THRESHOLD_PERCENT = 80;

const SUMMARIZE_SYSTEM_PROMPT = `You are a professional meeting summarization assistant. Given a meeting transcript, produce a structured JSON analysis. Use a professional, concise business voice.

Output ONLY valid JSON in this exact format:
{
  "summary": "2-3 paragraph professional summary of the meeting",
  "keyPoints": ["point 1", "point 2", ...],
  "actionItems": [
    { "text": "description", "assignee": "person name or null", "priority": "high|medium|low" }
  ],
  "decisions": [
    { "text": "what was decided", "madeBy": "person name or null" }
  ]
}

Rules:
- summary: 2-3 paragraphs capturing the purpose, discussion, and outcomes
- keyPoints: 3-8 concise bullet points of the most important topics discussed
- actionItems: extract every follow-up task; infer priority from context
- decisions: capture explicit decisions or agreements
- Do NOT invent information not in the transcript`;

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function analyzeAudioLevels(buffer: Buffer): {
  isSilent: boolean;
  silencePercent: number;
  peakDb: number;
  recommendation: string;
} {
  if (buffer.length < 44) {
    return {
      isSilent: true,
      silencePercent: 100,
      peakDb: -Infinity,
      recommendation:
        "This recording appears to be blank. Check your microphone settings.",
    };
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

  const silencePercent =
    sampleCount > 0
      ? Math.round((silentSamples / sampleCount) * 10000) / 100
      : 100;
  const peakDb =
    peak > 0 ? Math.round(20 * Math.log10(peak) * 100) / 100 : -Infinity;

  let recommendation: string;
  if (silencePercent > SILENCE_THRESHOLD_PERCENT) {
    recommendation =
      "This recording appears to be blank. Check your microphone settings.";
  } else if (peakDb < -30) {
    recommendation =
      "Audio levels are low. Consider re-recording or using volume boost.";
  } else {
    recommendation = "Audio levels look good.";
  }

  return { isSilent: silencePercent > SILENCE_THRESHOLD_PERCENT, silencePercent, peakDb, recommendation };
}

// ---------------------------------------------------------------------------
// FFmpeg helpers
// ---------------------------------------------------------------------------

/** Compress an audio buffer to mono MP3 at 64kbps / 16kHz */
async function compressAudio(
  inputBuffer: Buffer,
  inputExt: string
): Promise<Buffer> {
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

/** Get the duration (in seconds) of an audio file on disk */
async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}

/**
 * Split a compressed MP3 buffer into chunks that each fit under CHUNK_TARGET.
 * Uses ffmpeg -ss / -t to extract time-based segments.
 * Returns an array of { buffer, offsetSeconds } objects.
 */
async function splitAudioIntoChunks(
  compressedBuffer: Buffer
): Promise<{ buffer: Buffer; offsetSeconds: number }[]> {
  const tmpDir = os.tmpdir();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const srcPath = path.join(tmpDir, `reverbic-split-src-${id}.mp3`);
  const chunkPaths: string[] = [];

  try {
    await fs.writeFile(srcPath, compressedBuffer);
    const totalDuration = await getAudioDuration(srcPath);

    if (totalDuration <= 0) {
      return [{ buffer: compressedBuffer, offsetSeconds: 0 }];
    }

    // Estimate bitrate from file size and duration to calculate chunk duration
    const bytesPerSecond = compressedBuffer.length / totalDuration;
    const chunkDurationSec = Math.floor(CHUNK_TARGET / bytesPerSecond);
    // Ensure at least 30 seconds per chunk
    const segmentDuration = Math.max(30, chunkDurationSec);

    const chunks: { buffer: Buffer; offsetSeconds: number }[] = [];
    let offset = 0;
    let chunkIndex = 0;

    while (offset < totalDuration) {
      const chunkPath = path.join(
        tmpDir,
        `reverbic-chunk-${id}-${chunkIndex}.mp3`
      );
      chunkPaths.push(chunkPath);

      const duration = Math.min(segmentDuration, totalDuration - offset);

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
      chunks.push({ buffer: chunkBuffer, offsetSeconds: offset });

      offset += duration;
      chunkIndex++;
    }

    return chunks;
  } finally {
    await fs.unlink(srcPath).catch(() => {});
    for (const p of chunkPaths) {
      await fs.unlink(p).catch(() => {});
    }
  }
}

/** Transcribe a single buffer with Whisper and return raw result */
async function transcribeBuffer(
  buffer: Buffer,
  filename: string,
  language?: string
) {
  const file = new File([new Uint8Array(buffer)], filename, {
    type: "audio/mpeg",
  });

  const transcription = await getOpenAI().audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    ...(language ? { language } : {}),
  });

  return transcription;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

// Allow up to 300s for large file processing
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { s3Key, title, language } = body;

    if (!s3Key || typeof s3Key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid s3Key" },
        { status: 400 }
      );
    }

    // Step 1: Download audio from S3
    const getCommand = new GetObjectCommand({ Bucket: getBucket(), Key: s3Key });
    let s3Response;
    try {
      s3Response = await getS3Client().send(getCommand);
    } catch (err: unknown) {
      const code = (err as { name?: string }).name;
      if (code === "NoSuchKey") {
        return NextResponse.json(
          { error: "Audio file not found in S3" },
          { status: 404 }
        );
      }
      throw err;
    }

    if (!s3Response.Body) {
      return NextResponse.json(
        { error: "Empty response from S3" },
        { status: 500 }
      );
    }

    const audioBuffer = await streamToBuffer(s3Response.Body as Readable);

    if (audioBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${Math.round(audioBuffer.length / 1024 / 1024)}MB). Maximum upload size is 500MB.`,
        },
        { status: 413 }
      );
    }

    // Step 2: Analyze audio for silence
    const audioAnalysis = analyzeAudioLevels(audioBuffer);

    if (audioAnalysis.isSilent) {
      return NextResponse.json({
        status: "silent",
        audioAnalysis,
        transcript: null,
        summary: null,
        keyPoints: null,
        actionItems: null,
        decisions: null,
      });
    }

    // Step 3: Prepare audio for Whisper (compress if needed)
    const ext = s3Key.split(".").pop()?.toLowerCase() ?? "webm";
    let whisperBuffer: Buffer;
    let whisperFilename: string;
    let needsChunking = false;

    if (audioBuffer.length > COMPRESS_THRESHOLD) {
      // Compress large files with ffmpeg
      console.log(
        `Audio file is ${Math.round(audioBuffer.length / 1024 / 1024)}MB — compressing with ffmpeg...`
      );
      whisperBuffer = await compressAudio(audioBuffer, ext);
      whisperFilename = `compressed-${Date.now()}.mp3`;
      console.log(
        `Compressed to ${Math.round(whisperBuffer.length / 1024 / 1024)}MB`
      );

      if (whisperBuffer.length > WHISPER_LIMIT) {
        needsChunking = true;
      }
    } else {
      // File is small enough — send directly
      whisperBuffer = audioBuffer;
      whisperFilename = s3Key.split("/").pop() ?? `audio.${ext}`;
    }

    // Step 4: Transcribe with Whisper
    let fullText: string;
    let allSegments: { start: number; end: number; text: string }[] = [];
    let detectedLanguage: string | undefined;
    let totalDuration: number | undefined;

    if (needsChunking) {
      // Split into chunks and transcribe each separately
      console.log(
        "Compressed file still exceeds 25MB — splitting into chunks..."
      );
      const chunks = await splitAudioIntoChunks(whisperBuffer);
      console.log(`Split into ${chunks.length} chunks`);

      const textParts: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(
          `Transcribing chunk ${i + 1}/${chunks.length} (offset: ${chunk.offsetSeconds}s, size: ${Math.round(chunk.buffer.length / 1024 / 1024)}MB)...`
        );

        const result = await transcribeBuffer(
          chunk.buffer,
          `chunk-${i}.mp3`,
          language
        );

        textParts.push(result.text);

        // Adjust segment timestamps by the chunk offset
        const chunkSegments =
          (
            result as unknown as {
              segments?: { start: number; end: number; text: string }[];
            }
          ).segments ?? [];

        for (const seg of chunkSegments) {
          allSegments.push({
            start: seg.start + chunk.offsetSeconds,
            end: seg.end + chunk.offsetSeconds,
            text: seg.text.trim(),
          });
        }

        // Use language/duration from first chunk
        if (i === 0) {
          detectedLanguage = (result as unknown as { language?: string })
            .language;
        }

        // Accumulate total duration
        const chunkDuration = (result as unknown as { duration?: number })
          .duration;
        if (chunkDuration != null) {
          totalDuration = (totalDuration ?? 0) + chunkDuration;
        }
      }

      fullText = textParts.join(" ");
    } else {
      // Single transcription
      const mimeType =
        whisperFilename.endsWith(".mp3")
          ? "audio/mpeg"
          : `audio/${ext === "mp3" ? "mpeg" : ext}`;
      const file = new File([new Uint8Array(whisperBuffer)], whisperFilename, {
        type: mimeType,
      });

      const transcription = await getOpenAI().audio.transcriptions.create({
        file,
        model: "whisper-1",
        response_format: "verbose_json",
        ...(language ? { language } : {}),
      });

      fullText = transcription.text;
      detectedLanguage = (transcription as unknown as { language?: string })
        .language;
      totalDuration = (transcription as unknown as { duration?: number })
        .duration;

      allSegments =
        (
          transcription as unknown as {
            segments?: { start: number; end: number; text: string }[];
          }
        ).segments?.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(),
        })) ?? [];
    }

    const transcript = {
      text: fullText,
      language: detectedLanguage,
      duration: totalDuration,
      segments: allSegments,
    };

    // Step 5: Summarize with GPT-4o
    if (!fullText || fullText.trim().length < 20) {
      return NextResponse.json({
        status: "completed",
        audioAnalysis,
        transcript,
        summary: null,
        keyPoints: [],
        actionItems: [],
        decisions: [],
        note: "Transcript too short to summarize.",
      });
    }

    const userPrompt = title
      ? `Meeting Title: ${title}\n\nTranscript:\n${fullText}`
      : `Transcript:\n${fullText}`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    let parsed: Record<string, unknown> = {};

    if (content) {
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse GPT-4o summary response");
      }
    }

    // Step 6: Return complete result
    return NextResponse.json({
      status: "completed",
      audioAnalysis,
      transcript,
      summary: parsed.summary ?? null,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? (parsed.actionItems as { text?: string; assignee?: string; priority?: string }[]).map((item) => ({
            text: item.text ?? "",
            assignee: item.assignee ?? null,
            priority: item.priority ?? "medium",
          }))
        : [],
      decisions: Array.isArray(parsed.decisions)
        ? (parsed.decisions as { text?: string; madeBy?: string }[]).map((item) => ({
            text: item.text ?? "",
            madeBy: item.madeBy ?? null,
          }))
        : [],
    });
  } catch (err: unknown) {
    console.error("Meeting processing error:", err);

    const message =
      err instanceof Error ? err.message : "Meeting processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
