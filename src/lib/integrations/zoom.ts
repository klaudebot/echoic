/**
 * Zoom OAuth + API helpers for Reverbic meeting integration.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ─── OAuth ───

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

function getZoomCredentials() {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = process.env.ZOOM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, or ZOOM_REDIRECT_URI");
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Build the Zoom OAuth authorization URL.
 * State param encodes the org_id as base64 for the callback to identify the org.
 */
export function buildZoomOAuthUrl(orgId: string): string {
  const { clientId, redirectUri } = getZoomCredentials();

  const state = Buffer.from(JSON.stringify({ org_id: orgId })).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${ZOOM_AUTH_URL}?${params.toString()}`;
}

/**
 * Decode the state parameter from the OAuth callback.
 */
export function decodeOAuthState(state: string): { org_id: string } {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (!parsed.org_id || typeof parsed.org_id !== "string") {
      throw new Error("Invalid state: missing org_id");
    }
    return parsed;
  } catch {
    throw new Error("Invalid or corrupted OAuth state parameter");
  }
}

// ─── Token Management ───

export interface ZoomTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<ZoomTokens> {
  const { clientId, clientSecret, redirectUri } = getZoomCredentials();

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[zoom] Token exchange failed:", res.status, body);
    throw new Error(`Zoom token exchange failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<ZoomTokens> {
  const { clientId, clientSecret } = getZoomCredentials();

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[zoom] Token refresh failed:", res.status, body);
    throw new Error(`Zoom token refresh failed: ${res.status}`);
  }

  return res.json();
}

// ─── Zoom API ───

export interface ZoomRecordingFile {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  download_url: string;
  status: string;
  recording_type: string;
}

export interface ZoomRecordingDetail {
  uuid: string;
  id: number;
  host_id: string;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  recording_files: ZoomRecordingFile[];
}

/**
 * Fetch recording details from the Zoom API.
 */
export async function getRecordingDetails(
  meetingId: string,
  accessToken: string
): Promise<ZoomRecordingDetail> {
  // Double-encode the meeting UUID if it contains / or //
  const encodedId = meetingId.includes("/")
    ? encodeURIComponent(encodeURIComponent(meetingId))
    : meetingId;

  const res = await fetch(`${ZOOM_API_BASE}/meetings/${encodedId}/recordings`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[zoom] Get recording details failed:", res.status, body);
    throw new Error(`Zoom API error: ${res.status}`);
  }

  return res.json();
}

// ─── S3 Upload ───

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

/**
 * Download a Zoom recording file and upload it to S3.
 * Returns the S3 key and file size.
 *
 * Zoom requires the access token as a query param for download URLs.
 */
export async function downloadAndUploadToS3(
  downloadUrl: string,
  accessToken: string,
  orgId: string,
  recordingId: string,
  fileExtension: string
): Promise<{ s3Key: string; fileSize: number }> {
  const log = (msg: string) => console.log(`[zoom:s3] ${msg}`);

  // Zoom download URL needs token as query param
  const separator = downloadUrl.includes("?") ? "&" : "?";
  const authedUrl = `${downloadUrl}${separator}access_token=${accessToken}`;

  log(`Downloading recording: ${recordingId}`);
  const res = await fetch(authedUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to download Zoom recording: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileSize = buffer.length;
  log(`Downloaded ${(fileSize / 1024 / 1024).toFixed(1)}MB`);

  // Build S3 key following existing pattern: {orgId}/zoom/{recordingId}.{ext}
  const ext = fileExtension.toLowerCase() || "mp4";
  const s3Key = `${orgId}/zoom/${recordingId}.${ext}`;

  const contentTypeMap: Record<string, string> = {
    mp4: "video/mp4",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    vtt: "text/vtt",
    txt: "text/plain",
  };

  log(`Uploading to S3: ${s3Key}`);
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: s3Key,
      Body: buffer,
      ContentType: contentTypeMap[ext] ?? "application/octet-stream",
    })
  );

  log(`Upload complete: ${s3Key}`);
  return { s3Key, fileSize };
}

// ─── Webhook Verification ───

/**
 * Verify a Zoom webhook request using the webhook secret token.
 * Zoom sends a hash in the x-zm-signature header that we must validate.
 */
export async function verifyWebhookSignature(
  body: string,
  timestamp: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) {
    console.error("[zoom] ZOOM_WEBHOOK_SECRET_TOKEN not configured");
    return false;
  }

  const message = `v0:${timestamp}:${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const expectedSignature = `v0=${Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  return signature === expectedSignature;
}

/**
 * Generate the response hash for Zoom's endpoint URL validation challenge.
 */
export async function generateWebhookValidationHash(plainToken: string): Promise<string> {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) {
    throw new Error("ZOOM_WEBHOOK_SECRET_TOKEN not configured");
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(plainToken));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
