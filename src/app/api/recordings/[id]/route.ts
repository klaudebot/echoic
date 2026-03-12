import { NextResponse } from "next/server";
import { getDownloadPresignedUrl } from "@/lib/s3";
import { requireAuth, verifyS3KeyOwnership } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Recording ID is required" },
        { status: 400 }
      );
    }

    const url = new URL(_request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing key query parameter" },
        { status: 400 }
      );
    }

    // Verify S3 key ownership
    const ownsKey = await verifyS3KeyOwnership(key, user!.id);
    if (!ownsKey) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const downloadUrl = await getDownloadPresignedUrl(key);

    return NextResponse.json({
      recordingId: id,
      key,
      downloadUrl,
    });
  } catch (error) {
    console.error("Recording fetch error:", error);
    return NextResponse.json(
      { error: "Failed to get recording" },
      { status: 500 }
    );
  }
}
