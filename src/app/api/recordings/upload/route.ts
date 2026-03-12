import { NextResponse } from "next/server";
import { getUploadPresignedUrl, buildRecordingKey } from "@/lib/s3";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

    // Enforce transcription hours limit
    if (accountId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = getSupabaseAdmin() as any;
        const { data: org } = await admin
          .from("organizations")
          .select("plan, plan_status, transcription_hours_used, transcription_hours_limit")
          .eq("id", accountId)
          .single();

        if (org) {
          // Block uploads if subscription is canceled/unpaid
          if (org.plan !== "free" && (org.plan_status === "canceled" || org.plan_status === "unpaid")) {
            console.log(`[upload] BLOCKED: org=${accountId} plan=${org.plan} status=${org.plan_status}`);
            return NextResponse.json(
              { error: "Your subscription is inactive. Please update your billing to continue." },
              { status: 403 }
            );
          }

          // Block if transcription hours exceeded (skip for unlimited = -1)
          const limit = org.transcription_hours_limit ?? 3;
          const used = org.transcription_hours_used ?? 0;
          if (limit !== -1 && used >= limit) {
            console.log(`[upload] BLOCKED: org=${accountId} hours ${used}/${limit} exceeded`);
            return NextResponse.json(
              { error: `You've used all ${limit} hours of transcription this month. Upgrade your plan to continue.` },
              { status: 403 }
            );
          }
        }
      } catch (e) {
        // Don't block on plan check failure — log and proceed
        console.error("[upload] Plan check failed (proceeding):", e);
      }
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
