import { NextResponse } from "next/server";
import { getUploadPresignedUrl, buildRecordingKey } from "@/lib/s3";

const ALLOWED_CONTENT_TYPES = new Set([
  "audio/webm",
  "video/webm",
  "video/mp4",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "video/ogg",
]);

function generateUUID(): string {
  return crypto.randomUUID();
}

function extFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "video/webm": "webm",
    "video/mp4": "mp4",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "video/ogg": "ogg",
  };
  return map[contentType] ?? "webm";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType, accountId, userId } = body;

    console.log(`[upload] Presign request: file=${fileName} type=${contentType} account=${accountId}`);

    if (!fileName || !contentType || !accountId || !userId) {
      console.log("[upload] ERROR: missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: fileName, contentType, accountId, userId" },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      console.log(`[upload] ERROR: unsupported content type: ${contentType}`);
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}. Allowed: webm, mp4, m4a, mp3, wav, ogg` },
        { status: 400 }
      );
    }

    const recordingId = generateUUID();
    const ext = extFromContentType(contentType);
    const key = buildRecordingKey(accountId, userId, recordingId, ext);

    const uploadUrl = await getUploadPresignedUrl(key, contentType);

    console.log(`[upload] Presigned URL generated: id=${recordingId} key=${key}`);

    return NextResponse.json({
      uploadUrl,
      recordingId,
      key,
    });
  } catch (error) {
    console.error("[upload] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
