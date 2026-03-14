import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

/**
 * POST /api/team/transfer-ownership — Transfer org ownership to another member.
 * Body: { memberId: string } — the organization_members.id of the new owner
 * Only the current owner can do this.
 */
export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { memberId } = await request.json();
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Get the target member
  const { data: target } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("id", memberId)
    .single();

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Get caller's membership in same org
  const { data: caller } = await admin
    .from("organization_members")
    .select("id, organization_id, user_id, role")
    .eq("organization_id", target.organization_id)
    .eq("user_id", user!.id)
    .single();

  if (!caller) {
    return NextResponse.json({ error: "You are not a member of this organization" }, { status: 403 });
  }

  if (caller.role !== "owner") {
    return NextResponse.json({ error: "Only the current owner can transfer ownership" }, { status: 403 });
  }

  if (caller.id === target.id) {
    return NextResponse.json({ error: "You are already the owner" }, { status: 400 });
  }

  // Swap roles: new owner becomes "owner", old owner becomes "admin"
  const { error: err1 } = await admin
    .from("organization_members")
    .update({ role: "owner" })
    .eq("id", target.id);

  if (err1) {
    return NextResponse.json({ error: "Failed to transfer ownership" }, { status: 500 });
  }

  const { error: err2 } = await admin
    .from("organization_members")
    .update({ role: "admin" })
    .eq("id", caller.id);

  if (err2) {
    // Rollback
    await admin.from("organization_members").update({ role: "owner" }).eq("id", caller.id);
    await admin.from("organization_members").update({ role: target.role }).eq("id", target.id);
    return NextResponse.json({ error: "Failed to transfer ownership" }, { status: 500 });
  }

  // Update organizations.owner_id
  await admin
    .from("organizations")
    .update({ owner_id: target.user_id })
    .eq("id", target.organization_id);

  // Audit log
  await admin.from("audit_log").insert({
    organization_id: target.organization_id,
    actor_id: user!.id,
    action: "ownership_transferred",
    resource_type: "organization",
    resource_id: target.organization_id,
    metadata: { from_user_id: user!.id, to_user_id: target.user_id },
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ success: true });
}
