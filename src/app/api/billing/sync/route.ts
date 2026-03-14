import { NextResponse } from "next/server";
import { getStripe, tierFromPriceId, PLAN_LIMITS } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/billing/sync — Reconcile Stripe subscription state with the database.
 *
 * If the user's org has a stripe_customer_id, checks Stripe for an active
 * subscription and updates the DB if it's out of sync (e.g. webhook was slow).
 *
 * Returns the current plan after reconciliation.
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const authHeader = request.headers.get("authorization");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Get user's organization
    const { data: membership } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { data: org } = await admin
      .from("organizations")
      .select("id, plan, plan_status, stripe_customer_id, stripe_subscription_id")
      .eq("id", membership.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // If no Stripe customer, nothing to sync
    if (!org.stripe_customer_id) {
      return NextResponse.json({
        plan: org.plan ?? "free",
        planStatus: org.plan_status ?? "active",
        synced: false,
        reason: "no_stripe_customer",
      });
    }

    const stripe = getStripe();

    // Check for active subscriptions on this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    // Also check trialing
    const trialingSubs = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: "trialing",
      limit: 1,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSub: any = subscriptions.data[0] || trialingSubs.data[0];

    if (!activeSub) {
      // No active sub in Stripe — if DB says they're on a paid plan, something is wrong
      // but we don't downgrade here (that's the webhook's job on cancellation)
      return NextResponse.json({
        plan: org.plan ?? "free",
        planStatus: org.plan_status ?? "active",
        synced: false,
        reason: "no_active_subscription",
      });
    }

    // We have an active subscription — check if DB is out of sync
    const priceId = activeSub.items.data[0]?.price.id;
    const stripeTier = tierFromPriceId(priceId);
    const dbPlan = org.plan ?? "free";

    if (dbPlan === stripeTier && org.plan_status === "active") {
      // Already in sync
      return NextResponse.json({
        plan: dbPlan,
        planStatus: "active",
        synced: false,
        reason: "already_in_sync",
      });
    }

    // DB is out of sync — reconcile
    const limits = PLAN_LIMITS[stripeTier] ?? PLAN_LIMITS.free;
    const { error: updateError } = await admin.from("organizations").update({
      stripe_subscription_id: activeSub.id,
      stripe_price_id: priceId,
      plan: stripeTier,
      plan_status: "active",
      plan_period_start: new Date(activeSub.current_period_start * 1000).toISOString(),
      plan_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
      transcription_hours_limit: limits.transcriptionHours,
      storage_bytes_limit: limits.storageMb * 1024 * 1024,
      members_limit: limits.membersLimit,
      meetings_per_month_limit: limits.meetingsPerMonth,
    }).eq("id", org.id);

    if (updateError) {
      console.error(`[billing/sync] Failed to update org ${org.id}:`, updateError.message);
      return NextResponse.json({ error: "Failed to sync plan" }, { status: 500 });
    }

    console.log(`[billing/sync] Reconciled org ${org.id}: ${dbPlan} → ${stripeTier} (sub: ${activeSub.id})`);

    // Create notification if this was an upgrade from free
    if (dbPlan === "free" && stripeTier !== "free") {
      const planName = stripeTier.charAt(0).toUpperCase() + stripeTier.slice(1);
      await admin.from("notifications").insert({
        user_id: user.id,
        type: "plan_upgraded",
        title: `Welcome to ${planName}!`,
        message: `Your account has been upgraded to the ${planName} plan. Enjoy your new features!`,
      }).then(({ error: notifError }: { error: { message: string } | null }) => {
        if (notifError) console.error("[billing/sync] Notification insert failed:", notifError.message);
      });
    }

    return NextResponse.json({
      plan: stripeTier,
      planStatus: "active",
      synced: true,
      previousPlan: dbPlan,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[billing/sync] Error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
