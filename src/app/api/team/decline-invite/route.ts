import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

/**
 * POST /api/team/decline-invite — Decline a team invitation.
 * Body: { token: string }
 */
export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { data: invite } = await admin
    .from("team_invites")
    .select("id, email, status, organization_id")
    .eq("token", token)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: `This invitation has already been ${invite.status}` },
      { status: 400 }
    );
  }

  // Verify the declining user's email matches
  if (user!.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invitation was sent to a different email" },
      { status: 403 }
    );
  }

  await admin
    .from("team_invites")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Audit log
  await admin.from("audit_log").insert({
    organization_id: invite.organization_id,
    actor_id: user!.id,
    action: "invite_declined",
    resource_type: "team_invite",
    resource_id: invite.id,
    metadata: { email: invite.email },
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ success: true });
}
