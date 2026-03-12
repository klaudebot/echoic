import { NextResponse } from "next/server";
import { getStripe, getPriceId, PLAN_PRICES } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/billing/checkout — Create a Stripe Checkout session.
 * Body: { tier: "starter" | "pro" | "team" }
 */
export async function POST(request: Request) {
  try {
    const { tier, interval = "yearly" } = await request.json();

    if (!tier || !PLAN_PRICES[tier]) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
    }

    const priceId = getPriceId(tier, interval === "monthly" ? "monthly" : "yearly");
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured for this plan" }, { status: 400 });
    }

    // Get authenticated user from auth header
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
    const { data: memberRows } = await admin
      .from("organization_members")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    const membership = memberRows?.[0];
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "No organization found or insufficient permissions" }, { status: 403 });
    }

    // Get org to check for existing Stripe customer
    const { data: orgRows } = await admin
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .limit(1);

    const org = orgRows?.[0];
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const stripe = getStripe();
    let customerId = org.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: {
          organizationId: org.id,
          userId: user.id,
        },
      });
      customerId = customer.id;

      await admin
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reverbic.ai";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?billing=success&plan=${tier}`,
      cancel_url: `${appUrl}/settings?billing=cancelled`,
      subscription_data: {
        metadata: {
          organizationId: org.id,
          tier,
        },
      },
      metadata: {
        organizationId: org.id,
        userId: user.id,
        tier,
      },
      allow_promotion_codes: true,
    });

    console.log(`[billing] Checkout session created: ${session.id} for org=${org.id} tier=${tier}`);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[billing] Checkout error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
