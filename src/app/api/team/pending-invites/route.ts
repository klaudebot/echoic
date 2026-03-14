import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/team/pending-invites — Check if the current user has pending team invites.
 * Returns invites matching the user's email that are still pending and not expired.
 */
export async function GET() {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  if (!user!.email) {
    return NextResponse.json({ invites: [] });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { data: invites } = await admin
    .from("team_invites")
    .select("id, token, email, role, status, expires_at, organization_id, organizations(name)")
    .eq("email", user!.email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  return NextResponse.json({
    invites: (invites ?? []).map((inv: { id: string; token: string; role: string; expires_at: string; organizations?: { name: string } }) => ({
      id: inv.id,
      token: inv.token,
      role: inv.role,
      expiresAt: inv.expires_at,
      orgName: inv.organizations?.name ?? "a team",
    })),
  });
}
