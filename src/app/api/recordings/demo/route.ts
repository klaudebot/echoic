import { NextResponse } from "next/server";
import { getDownloadPresignedUrl } from "@/lib/s3";

/**
 * Serve demo meeting audio without auth.
 * Only allows keys under the demo/ prefix.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key || !key.startsWith("demo/")) {
      return NextResponse.json({ error: "Invalid demo key" }, { status: 400 });
    }

    const downloadUrl = await getDownloadPresignedUrl(key);

    return NextResponse.json({ downloadUrl, key });
  } catch (error) {
    console.error("Demo recording fetch error:", error);
    return NextResponse.json(
      { error: "Failed to get demo recording" },
      { status: 500 }
    );
  }
}
