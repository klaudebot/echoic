import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/team/invite-details?token=xxx — Public endpoint to look up invite details.
 * Does NOT require auth — used by the /invite/[token] page for unauthenticated users.
 * Returns only safe, non-sensitive fields.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { data: invite, error } = await admin
    .from("team_invites")
    .select("id, email, role, status, expires_at, organization_id, invited_by, organizations(name), profiles!team_invites_invited_by_fkey(full_name, email)")
    .eq("token", token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // Return only safe fields — no tokens, no org IDs, no internal data
  return NextResponse.json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expires_at,
    orgName: invite.organizations?.name ?? null,
    inviterName: invite.profiles?.full_name ?? null,
    inviterEmail: invite.profiles?.email ?? null,
    invitedById: invite.invited_by,
  });
}
