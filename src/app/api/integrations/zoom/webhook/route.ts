import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  verifyWebhookSignature,
  generateWebhookValidationHash,
  downloadAndUploadToS3,
  refreshAccessToken,
  type ZoomRecordingFile,
} from "@/lib/integrations/zoom";

/**
 * POST /api/integrations/zoom/webhook
 *
 * Receives Zoom webhook events. Handles:
 * - endpoint.url_validation: Zoom's webhook URL verification challenge
 * - recording.completed: Downloads recording, uploads to S3, creates meeting, triggers pipeline
 */
export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[zoom:webhook] ${msg} (+${Date.now() - t0}ms)`);

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    log("ERROR: Invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event as string | undefined;
  log(`Received event: ${event || "unknown"}`);

  // ─── URL Validation Challenge ───
  if (event === "endpoint.url_validation") {
    try {
      const challengePayload = payload.payload as { plainToken: string } | undefined;
      const plainToken = challengePayload?.plainToken;

      if (!plainToken) {
        log("ERROR: Missing plainToken in url_validation payload");
        return NextResponse.json({ error: "Missing plainToken" }, { status: 400 });
      }

      const encryptedToken = await generateWebhookValidationHash(plainToken);
      log("URL validation challenge responded");

      return NextResponse.json({
        plainToken,
        encryptedToken,
      });
    } catch (err) {
      log(`ERROR: URL validation failed: ${err}`);
      return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
  }

  // ─── Verify Webhook Signature ───
  const timestamp = request.headers.get("x-zm-request-timestamp") || "";
  const signature = request.headers.get("x-zm-signature") || "";

  if (!timestamp || !signature) {
    log("ERROR: Missing webhook signature headers");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = await verifyWebhookSignature(rawBody, timestamp, signature);
  if (!isValid) {
    log("ERROR: Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ─── Handle recording.completed ───
  if (event === "recording.completed") {
    try {
      await handleRecordingCompleted(payload, log);
      return NextResponse.json({ status: "ok" });
    } catch (err) {
      log(`ERROR: recording.completed handler failed: ${err}`);
      console.error("[zoom:webhook] recording.completed error:", err);
      // Return 200 to prevent Zoom from retrying (we log the error)
      return NextResponse.json({ status: "error", message: "Processing failed" });
    }
  }

  // Acknowledge all other events
  log(`Ignoring unhandled event: ${event}`);
  return NextResponse.json({ status: "ignored" });
}

// ─── Recording Completed Handler ───

interface ZoomWebhookRecordingPayload {
  account_id: string;
  object: {
    uuid: string;
    id: number;
    host_id: string;
    host_email: string;
    topic: string;
    start_time: string;
    duration: number;
    total_size: number;
    recording_count: number;
    recording_files: ZoomRecordingFile[];
  };
}

async function handleRecordingCompleted(
  payload: Record<string, unknown>,
  log: (msg: string) => void
) {
  const data = payload.payload as ZoomWebhookRecordingPayload | undefined;
  if (!data?.object) {
    log("ERROR: Missing recording payload object");
    throw new Error("Invalid recording.completed payload");
  }

  const { object } = data;
  const zoomAccountId = data.account_id;
  const meetingTopic = object.topic || "Zoom Meeting";
  const meetingDuration = object.duration; // in minutes
  const recordingFiles = object.recording_files || [];

  log(`Recording completed: "${meetingTopic}" (${meetingDuration}min, ${recordingFiles.length} files)`);

  // Find the audio-only file, or fall back to shared_screen_with_speaker_view (mp4)
  const audioFile = recordingFiles.find(
    (f) => f.recording_type === "audio_only" && f.status === "completed"
  );
  const videoFile = recordingFiles.find(
    (f) =>
      (f.recording_type === "shared_screen_with_speaker_view" ||
        f.recording_type === "speaker_view" ||
        f.recording_type === "active_speaker") &&
      f.status === "completed"
  );

  const targetFile = audioFile || videoFile;
  if (!targetFile) {
    log("WARN: No usable recording file found in completed recording");
    log(`Available files: ${recordingFiles.map((f) => `${f.recording_type}(${f.file_type}/${f.status})`).join(", ")}`);
    return;
  }

  log(`Using file: type=${targetFile.recording_type} format=${targetFile.file_type} size=${(targetFile.file_size / 1024 / 1024).toFixed(1)}MB`);

  // Find the integration for this Zoom account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Find all zoom integrations and match by checking if the token works for this account
  // Zoom webhook sends account_id, but we store by org_id. We need to find which org
  // has a Zoom integration connected.
  const { data: integrations, error: intError } = await admin
    .from("integrations")
    .select("*")
    .eq("provider", "zoom")
    .eq("enabled", true);

  if (intError || !integrations || integrations.length === 0) {
    log("ERROR: No active Zoom integrations found");
    throw new Error("No Zoom integration configured");
  }

  // Try each integration — in most cases there will be just one.
  // We store the zoom_account_id in config after first successful match.
  let matchedIntegration = integrations.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (i: any) => i.config?.zoom_account_id === zoomAccountId
  );

  if (!matchedIntegration && integrations.length === 1) {
    // Single integration — assume it matches and store the account_id
    matchedIntegration = integrations[0];
    await admin
      .from("integrations")
      .update({
        config: { ...matchedIntegration.config, zoom_account_id: zoomAccountId },
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchedIntegration.id);
    log(`Linked zoom_account_id ${zoomAccountId} to integration ${matchedIntegration.id}`);
  }

  if (!matchedIntegration) {
    log(`ERROR: No integration found for Zoom account ${zoomAccountId}`);
    throw new Error(`No integration found for Zoom account ${zoomAccountId}`);
  }

  const orgId = matchedIntegration.organization_id;
  log(`Matched org: ${orgId}`);

  // Ensure access token is fresh
  let accessToken = matchedIntegration.access_token;
  const tokenExpiry = new Date(matchedIntegration.token_expires_at);
  if (tokenExpiry <= new Date(Date.now() + 60_000)) {
    log("Access token expired or expiring soon, refreshing...");
    try {
      const newTokens = await refreshAccessToken(matchedIntegration.refresh_token);
      accessToken = newTokens.access_token;

      await admin
        .from("integrations")
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchedIntegration.id);

      log("Token refreshed successfully");
    } catch (refreshErr) {
      log(`ERROR: Token refresh failed: ${refreshErr}`);
      throw new Error("Failed to refresh Zoom access token");
    }
  }

  // Download the recording and upload to S3
  const recordingId = crypto.randomUUID();
  const { s3Key, fileSize } = await downloadAndUploadToS3(
    targetFile.download_url,
    accessToken,
    orgId,
    recordingId,
    targetFile.file_extension || (audioFile ? "m4a" : "mp4")
  );

  log(`Recording uploaded to S3: ${s3Key} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);

  // Create meeting record in the database
  const meetingId = crypto.randomUUID();
  const { error: insertError } = await admin.from("meetings").insert({
    id: meetingId,
    organization_id: orgId,
    title: meetingTopic,
    s3_key: s3Key,
    file_name: `${meetingTopic}.${targetFile.file_extension || "m4a"}`,
    file_size: fileSize,
    duration: meetingDuration ? meetingDuration * 60 : null, // convert minutes to seconds
    status: "processing",
    source: "zoom",
    notes: "",
    language: "en",
  });

  if (insertError) {
    log(`ERROR: Failed to create meeting record: ${JSON.stringify(insertError)}`);
    throw new Error(`Failed to create meeting: ${insertError.message}`);
  }

  log(`Meeting record created: ${meetingId}`);

  // Trigger the server-side processing pipeline
  // Call the prepare endpoint to kick off transcription
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reverbic.ai";
  try {
    const pipelineRes = await fetch(`${appUrl}/api/meetings/process/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3Key, meetingId }),
    });

    if (pipelineRes.ok) {
      log(`Processing pipeline triggered for meeting ${meetingId}`);
    } else {
      const errBody = await pipelineRes.text();
      log(`WARN: Pipeline trigger returned ${pipelineRes.status}: ${errBody}`);
      // Don't throw — the meeting is created, user can manually reprocess
    }
  } catch (pipelineErr) {
    log(`WARN: Failed to trigger pipeline: ${pipelineErr}`);
    // Don't throw — the meeting is saved, pipeline can be triggered later
  }

  log(`DONE: Meeting "${meetingTopic}" (${meetingId}) processed from Zoom recording`);
}
