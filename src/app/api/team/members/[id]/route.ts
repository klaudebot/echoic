import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

/**
 * Helper: get the requesting user's org membership and verify they're in the same org
 * as the target member.
 */
async function getCallerAndTarget(
  callerId: string,
  targetMemberId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Get target membership
  const { data: target } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("id", targetMemberId)
    .single();

  if (!target) return { error: "Member not found", status: 404 };

  // Get caller's membership in the same org
  const { data: caller } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("organization_id", target.organization_id)
    .eq("user_id", callerId)
    .single();

  if (!caller) return { error: "You are not a member of this organization", status: 403 };

  return { caller, target, admin };
}

/**
 * PATCH /api/team/members/[id] — Change a member's role.
 * Body: { role: "admin" | "member" | "viewer" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const { role } = await request.json();

  if (!role || !["admin", "member", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const result = await getCallerAndTarget(user!.id, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { caller, target, admin } = result;

  // Authorization checks
  if (caller.role !== "owner" && caller.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can change roles" }, { status: 403 });
  }

  // Can't change the owner's role
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot change the owner's role. Use ownership transfer instead." }, { status: 403 });
  }

  // Admins can't promote to admin (only owner can)
  if (caller.role === "admin" && role === "admin") {
    return NextResponse.json({ error: "Only the owner can promote members to admin" }, { status: 403 });
  }

  // Admins can't change other admins
  if (caller.role === "admin" && target.role === "admin") {
    return NextResponse.json({ error: "Admins cannot modify other admins" }, { status: 403 });
  }

  const { error: updateError } = await admin
    .from("organization_members")
    .update({ role })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  // Audit log
  await admin.from("audit_log").insert({
    organization_id: target.organization_id,
    actor_id: user!.id,
    action: "role_changed",
    resource_type: "organization_member",
    resource_id: id,
    metadata: { previous_role: target.role, new_role: role, target_user_id: target.user_id },
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ success: true, role });
}

/**
 * DELETE /api/team/members/[id] — Remove a member from the organization.
 * Owner/admin can remove others. Any member can remove themselves (leave).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const result = await getCallerAndTarget(user!.id, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { caller, target, admin } = result;

  const isSelf = caller.user_id === target.user_id;

  // Owner cannot be removed
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "The owner cannot be removed. Transfer ownership first." },
      { status: 403 }
    );
  }

  // Must be owner/admin, or removing self
  if (!isSelf && caller.role !== "owner" && caller.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
  }

  // Admins can't remove other admins
  if (!isSelf && caller.role === "admin" && target.role === "admin") {
    return NextResponse.json({ error: "Admins cannot remove other admins" }, { status: 403 });
  }

  const { error: deleteError } = await admin
    .from("organization_members")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  // Audit log
  await admin.from("audit_log").insert({
    organization_id: target.organization_id,
    actor_id: user!.id,
    action: isSelf ? "member_left" : "member_removed",
    resource_type: "organization_member",
    resource_id: id,
    metadata: { removed_user_id: target.user_id, role: target.role },
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ success: true });
}
