import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
 * Build an S3 object key for a recording.
 * Format: {accountId}/{userId}/{recordingId}.{ext}
 */
export function buildRecordingKey(
  accountId: string,
  userId: string,
  recordingId: string,
  ext: string
): string {
  return `${accountId}/${userId}/${recordingId}.${ext}`;
}

/**
 * Generate a presigned PUT URL for uploading a file to S3.
 * Expires in 1 hour.
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

/**
 * Generate a presigned GET URL for downloading a file from S3.
 * Expires in 1 hour.
 */
export async function getDownloadPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}
