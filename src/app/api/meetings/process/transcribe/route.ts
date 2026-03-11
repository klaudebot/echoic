import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getOpenAI } from "@/lib/openai";
import type { Readable } from "stream";

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

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export const maxDuration = 120;

/**
 * Stage 2: Transcribe — Transcribe a single audio chunk with Whisper.
 * Called once per chunk. Client stitches segments together.
 */
export async function POST(request: Request) {
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[transcribe] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const body = await request.json();
    const { s3Key, startTime, language } = body;
    log(`START s3Key=${s3Key} startTime=${startTime ?? 0} language=${language ?? "auto"}`);

    if (!s3Key || typeof s3Key !== "string") {
      log("ERROR: missing s3Key");
      return NextResponse.json({ error: "Missing or invalid s3Key" }, { status: 400 });
    }

    // Download chunk from S3
    log("Downloading chunk from S3...");
    const getCommand = new GetObjectCommand({ Bucket: getBucket(), Key: s3Key });
    let s3Response;
    try {
      s3Response = await getS3Client().send(getCommand);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "NoSuchKey") {
        log("ERROR: chunk not found in S3");
        return NextResponse.json({ error: "Chunk not found in S3" }, { status: 404 });
      }
      throw err;
    }

    if (!s3Response.Body) {
      log("ERROR: empty chunk body");
      return NextResponse.json({ error: "Empty chunk" }, { status: 500 });
    }

    const buffer = await streamToBuffer(s3Response.Body as Readable);
    log(`Downloaded chunk: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);

    // Transcribe with Whisper
    log("Sending to Whisper API...");
    const file = new File([new Uint8Array(buffer)], "chunk.mp3", { type: "audio/mpeg" });

    const transcription = await getOpenAI().audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      ...(language ? { language } : {}),
    });

    const offsetSeconds = startTime ?? 0;
    const rawSegments = (transcription as unknown as {
      segments?: { start: number; end: number; text: string }[];
    }).segments ?? [];

    const segments = rawSegments.map((seg) => ({
      start: seg.start + offsetSeconds,
      end: seg.end + offsetSeconds,
      text: seg.text.trim(),
    }));

    const detectedLanguage = (transcription as unknown as { language?: string }).language;
    const duration = (transcription as unknown as { duration?: number }).duration;

    log(`DONE: ${segments.length} segments, ${transcription.text.length} chars, lang=${detectedLanguage} duration=${duration?.toFixed(1)}s`);

    return NextResponse.json({
      text: transcription.text,
      segments,
      language: detectedLanguage,
      duration,
    });
  } catch (err: unknown) {
    log(`ERROR: ${err}`);
    console.error("Transcribe error:", err);
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
