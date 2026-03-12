import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/billing/portal — Create a Stripe Customer Portal session.
 * Lets users manage their subscription (change plan, update payment, cancel).
 */
export async function POST(request: Request) {
  try {
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

    const { data: memberRows } = await admin
      .from("organization_members")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    const membership = memberRows?.[0];
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "No organization found or insufficient permissions" }, { status: 403 });
    }

    const { data: orgRows } = await admin
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .limit(1);

    const org = orgRows?.[0];
    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found. Please upgrade first." }, { status: 404 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reverbic.ai";

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create portal session";
    console.error("[billing] Portal error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
