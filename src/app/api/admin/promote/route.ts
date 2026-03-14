import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/stripe";

/**
 * POST /api/admin/promote — Manually promote a user to a paid plan.
 * Protected by ADMIN_SECRET header.
 *
 * Body: { email: string, plan: "starter" | "pro" | "team" }
 *
 * Usage:
 *   curl -X POST https://app.reverbic.ai/api/admin/promote \
 *     -H "Content-Type: application/json" \
 *     -H "x-admin-secret: $ADMIN_SECRET" \
 *     -d '{"email":"michael@apexrush.com","plan":"pro"}'
 */
export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = request.headers.get("x-admin-secret");

  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, plan } = await request.json();

  if (!email || !plan) {
    return NextResponse.json({ error: "email and plan are required" }, { status: 400 });
  }

  const validPlans = ["starter", "pro", "team"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: `plan must be one of: ${validPlans.join(", ")}` }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Find user by email
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
  }

  // Find their organization
  const { data: membership, error: memberError } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", profile.id)
    .limit(1)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: `No organization found for user: ${email}` }, { status: 404 });
  }

  const orgId = membership.organization_id;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  // Update the organization plan
  const { error: updateError } = await admin.from("organizations").update({
    plan,
    plan_status: "active",
    transcription_hours_limit: limits.transcriptionHours,
    storage_bytes_limit: limits.storageMb * 1024 * 1024,
    members_limit: limits.membersLimit,
    meetings_per_month_limit: limits.meetingsPerMonth,
  }).eq("id", orgId);

  if (updateError) {
    return NextResponse.json({ error: `Failed to update: ${updateError.message}` }, { status: 500 });
  }

  // Create in-app notification
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  await admin.from("notifications").insert({
    user_id: profile.id,
    type: "plan_upgraded",
    title: `Welcome to ${planName}!`,
    message: `Your account has been upgraded to the ${planName} plan. Enjoy your new features!`,
  });

  console.log(`[admin] Manually promoted ${email} (org ${orgId}) to ${plan}`);

  return NextResponse.json({
    success: true,
    email,
    plan,
    organizationId: orgId,
  });
}
