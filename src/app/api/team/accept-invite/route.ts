import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";
import { PLAN_LIMITS } from "@/lib/stripe";

/**
 * POST /api/team/accept-invite — Accept a team invitation.
 * Body: { token: string }
 *
 * Validates token, checks expiry, enforces seat limit,
 * creates org membership, marks invite accepted, notifies inviter.
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

  // Look up the invite
  const { data: invite, error: inviteError } = await admin
    .from("team_invites")
    .select("*, organizations(name, plan, members_limit)")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
  }

  // Check invite status
  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: `This invitation has already been ${invite.status}` },
      { status: 400 }
    );
  }

  // Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await admin
      .from("team_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
  }

  // Verify the accepting user's email matches the invite
  if (user!.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: "This invitation was sent to a different email address",
        invitedEmail: invite.email,
        yourEmail: user!.email,
      },
      { status: 403 }
    );
  }

  // Check if user is already a member of this org
  const { data: existingMembership } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", invite.organization_id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existingMembership) {
    // Already a member — mark invite as accepted and return success
    await admin
      .from("team_invites")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", invite.id);
    return NextResponse.json({ success: true, alreadyMember: true });
  }

  // Enforce seat limit server-side
  const org = invite.organizations;
  const membersLimit = org?.members_limit ?? PLAN_LIMITS[org?.plan ?? "free"]?.membersLimit ?? 1;

  if (membersLimit !== -1) {
    const { count } = await admin
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", invite.organization_id);

    if ((count ?? 0) >= membersLimit) {
      return NextResponse.json(
        { error: `This team has reached its seat limit (${membersLimit}). Ask an admin to upgrade.` },
        { status: 403 }
      );
    }
  }

  // Create organization membership
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: user!.id,
      role: invite.role ?? "member",
    });

  if (memberError) {
    console.error("[accept-invite] Failed to create membership:", memberError);
    return NextResponse.json({ error: "Failed to join team" }, { status: 500 });
  }

  // Mark invite as accepted
  await admin
    .from("team_invites")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Write audit log
  await admin.from("audit_log").insert({
    organization_id: invite.organization_id,
    actor_id: user!.id,
    action: "invite_accepted",
    resource_type: "team_invite",
    resource_id: invite.id,
    metadata: { email: invite.email, role: invite.role },
  }).then(() => {}).catch(() => {});

  // Create in-app notification for the inviter
  if (invite.invited_by) {
    await admin.from("notifications").insert({
      user_id: invite.invited_by,
      organization_id: invite.organization_id,
      type: "team_invite_accepted",
      title: `${user!.user_metadata?.full_name || user!.email} joined your team`,
      body: `They accepted your invitation and are now a ${invite.role} on the team.`,
      metadata: { member_email: user!.email, member_name: user!.user_metadata?.full_name },
    }).then(() => {}).catch(() => {});

    // Send email notification to inviter
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", invite.invited_by)
      .single();

    if (inviterProfile?.email) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://reverbic.ai"}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team-invite-accepted",
          to: inviterProfile.email,
          newMemberName: user!.user_metadata?.full_name || user!.email?.split("@")[0] || "Someone",
          newMemberEmail: user!.email,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    success: true,
    organizationId: invite.organization_id,
    orgName: org?.name,
    role: invite.role,
  });
}
