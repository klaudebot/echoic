import { NextResponse } from "next/server";
import { getDownloadPresignedUrl } from "@/lib/s3";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Recording ID is required" },
        { status: 400 }
      );
    }

    // In a full implementation this would look up the recording metadata
    // from the database to get the exact S3 key. For now, we accept
    // an optional `key` query param or construct a placeholder.
    const url = new URL(_request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing key query parameter" },
        { status: 400 }
      );
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
