import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

/**
 * POST /api/account/delete — Permanently delete the user's account.
 *
 * Checks:
 * 1. If user is org owner with other members, they must remove all members first.
 * 2. Cancels any active Stripe subscription.
 * 3. Deletes all user data (meetings, transcripts, etc.) via cascade.
 * 4. Deletes the Supabase auth user.
 */
export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: "You must confirm deletion by sending { confirm: \"DELETE\" }" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Get user's org membership
  const { data: membership } = await admin
    .from("organization_members")
    .select("id, organization_id, role")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  if (membership) {
    // If owner, check for other members
    if (membership.role === "owner") {
      const { count } = await admin
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .neq("user_id", user!.id);

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          {
            error: "You must remove all team members before deleting your account",
            code: "HAS_TEAM_MEMBERS",
            memberCount: count,
          },
          { status: 400 }
        );
      }

      // Also check for pending invites
      const { count: inviteCount } = await admin
        .from("team_invites")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .eq("status", "pending");

      if ((inviteCount ?? 0) > 0) {
        return NextResponse.json(
          {
            error: "You must cancel all pending invites before deleting your account",
            code: "HAS_PENDING_INVITES",
            inviteCount,
          },
          { status: 400 }
        );
      }
    }

    // Cancel Stripe subscription if one exists
    const { data: org } = await admin
      .from("organizations")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", membership.organization_id)
      .single();

    if (org?.stripe_subscription_id) {
      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
        if (stripeKey) {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(stripeKey);
          await stripe.subscriptions.cancel(org.stripe_subscription_id);
          console.log(`[account-delete] Cancelled subscription ${org.stripe_subscription_id} for user ${user!.id}`);
        }
      } catch (err) {
        console.error("[account-delete] Failed to cancel Stripe subscription:", err);
        // Continue with deletion even if Stripe cancel fails
      }
    }

    // If owner, delete the entire organization (cascades to meetings, members, etc.)
    if (membership.role === "owner") {
      await admin
        .from("organizations")
        .delete()
        .eq("id", membership.organization_id);
    } else {
      // Non-owner: just remove membership
      await admin
        .from("organization_members")
        .delete()
        .eq("id", membership.id);
    }
  }

  // Delete the profile
  await admin
    .from("profiles")
    .delete()
    .eq("id", user!.id);

  // Delete the auth user
  const { error: deleteError } = await admin.auth.admin.deleteUser(user!.id);
  if (deleteError) {
    console.error("[account-delete] Failed to delete auth user:", deleteError);
    return NextResponse.json(
      { error: "Account data was removed but auth deletion failed. Contact support." },
      { status: 500 }
    );
  }

  console.log(`[account-delete] Successfully deleted account for user ${user!.id} (${user!.email})`);

  return NextResponse.json({ success: true });
}
