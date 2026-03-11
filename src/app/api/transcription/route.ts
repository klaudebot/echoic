import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { openai } from "@/lib/openai";
import type { Readable } from "stream";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET ?? "";

// Whisper has a 25 MB file size limit
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const SUPPORTED_FORMATS = [
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "m4a",
  "wav",
  "webm",
  "ogg",
  "flac",
];

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { s3Key, language } = body;

    if (!s3Key || typeof s3Key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid s3Key" },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = s3Key.split(".").pop()?.toLowerCase();
    if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${ext}. Supported: ${SUPPORTED_FORMATS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Download from S3
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
    let s3Response;
    try {
      s3Response = await s3Client.send(getCommand);
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
          error: `File too large (${Math.round(audioBuffer.length / 1024 / 1024)}MB). Whisper limit is 25MB.`,
        },
        { status: 413 }
      );
    }

    // Build the File object Whisper expects
    const filename = s3Key.split("/").pop() ?? `audio.${ext}`;
    const file = new File([new Uint8Array(audioBuffer)], filename, {
      type: `audio/${ext === "mp3" ? "mpeg" : ext}`,
    });

    // Call Whisper
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      ...(language ? { language } : {}),
    });

    // Extract segments with timestamps
    const segments =
      (
        transcription as unknown as {
          segments?: { start: number; end: number; text: string }[];
        }
      ).segments?.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      })) ?? [];

    return NextResponse.json({
      text: transcription.text,
      language: (transcription as unknown as { language?: string }).language,
      duration: (transcription as unknown as { duration?: number }).duration,
      segments,
    });
  } catch (err: unknown) {
    console.error("Transcription error:", err);

    const message =
      err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
