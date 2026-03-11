import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/share/[token]
 * Returns censored meeting content for public share pages.
 * Uses admin client to bypass RLS.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { data: meeting, error } = await admin
    .from("meetings")
    .select("id, title, shared_content, is_public, share_token, created_at, duration")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (error || !meeting) {
    return NextResponse.json({ error: "Meeting not found or not shared" }, { status: 404 });
  }

  return NextResponse.json({
    id: meeting.id,
    title: meeting.shared_content?.title || meeting.title,
    createdAt: meeting.created_at,
    duration: meeting.duration,
    content: meeting.shared_content || null,
  });
}
