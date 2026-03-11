import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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

/**
 * Analyze raw audio bytes for silence and volume levels.
 * Works on the raw byte data — treats it as 16-bit signed PCM samples
 * which is a reasonable heuristic for WAV/WebM audio data.
 */
function analyzeAudioLevels(buffer: Buffer): {
  isSilent: boolean;
  silencePercent: number;
  peakDb: number;
} {
  if (buffer.length < 44) {
    // Too small to be valid audio
    return { isSilent: true, silencePercent: 100, peakDb: -Infinity };
  }

  // Interpret as 16-bit signed PCM samples
  const sampleCount = Math.floor(buffer.length / 2);
  const silenceThreshold = 0.00316; // -50 dB in linear amplitude
  let silentSamples = 0;
  let peak = 0;

  for (let i = 0; i < sampleCount; i++) {
    const sample = buffer.readInt16LE(i * 2);
    const normalized = Math.abs(sample) / 32768; // Normalize to 0..1

    if (normalized < silenceThreshold) {
      silentSamples++;
    }

    if (normalized > peak) {
      peak = normalized;
    }
  }

  const silencePercent =
    sampleCount > 0
      ? Math.round((silentSamples / sampleCount) * 10000) / 100
      : 100;

  const peakDb = peak > 0 ? Math.round(20 * Math.log10(peak) * 100) / 100 : -Infinity;

  return {
    isSilent: silencePercent > 80,
    silencePercent,
    peakDb,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { s3Key } = body;

    if (!s3Key || typeof s3Key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid s3Key" },
        { status: 400 }
      );
    }

    // Download from S3
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
    const analysis = analyzeAudioLevels(audioBuffer);

    let recommendation: string;
    if (analysis.silencePercent > 80) {
      recommendation =
        "This recording appears to be blank. Check your microphone settings.";
    } else if (analysis.peakDb < -30) {
      recommendation =
        "Audio levels are low. Consider re-recording or using volume boost.";
    } else {
      recommendation = "Audio levels look good.";
    }

    return NextResponse.json({
      isSilent: analysis.isSilent,
      silencePercent: analysis.silencePercent,
      peakDb: analysis.peakDb,
      recommendation,
    });
  } catch (err: unknown) {
    console.error("Audio analysis error:", err);

    const message =
      err instanceof Error ? err.message : "Audio analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
