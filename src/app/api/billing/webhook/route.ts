import { NextResponse } from "next/server";
import { getStripe, tierFromPriceId, PLAN_LIMITS } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  sendSubscriptionConfirmationEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
  sendAdminNewSubscriberEmail,
} from "@/lib/resend";
import type Stripe from "stripe";

/**
 * POST /api/billing/webhook — Stripe webhook handler.
 * Verifies signature, processes subscription lifecycle events.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("[webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  console.log(`[webhook] Received ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook processing failed";
    console.error(`[webhook] Error processing ${event.type}:`, msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutCompleted(session: any) {
  const orgId = session.metadata?.organizationId;
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier ?? "starter";

  if (!orgId || !session.subscription) {
    console.error("[webhook] checkout.session.completed missing orgId or subscription");
    return;
  }

  const stripe = getStripe();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription: any = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0]?.price.id;
  const resolvedTier = tierFromPriceId(priceId) || tier;
  const limits = PLAN_LIMITS[resolvedTier] ?? PLAN_LIMITS.free;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  const { error: updateError } = await admin.from("organizations").update({
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan: resolvedTier as "starter" | "pro" | "team",
    plan_status: "active",
    plan_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    plan_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    transcription_hours_limit: limits.transcriptionHours,
    storage_bytes_limit: limits.storageMb * 1024 * 1024,
    members_limit: limits.membersLimit,
    meetings_per_month_limit: limits.meetingsPerMonth,
  }).eq("id", orgId);

  if (updateError) {
    console.error(`[webhook] CRITICAL: Failed to update org ${orgId}:`, updateError.message);
    throw new Error(`Database update failed for org ${orgId}: ${updateError.message}`);
  }

  console.log(`[webhook] Org ${orgId} upgraded to ${resolvedTier}`);

  // Create in-app notification for the user
  if (userId) {
    const planName = resolvedTier.charAt(0).toUpperCase() + resolvedTier.slice(1);
    await admin.from("notifications").insert({
      user_id: userId,
      type: "plan_upgraded",
      title: `Welcome to ${planName}!`,
      message: `Your account has been upgraded to the ${planName} plan. Enjoy your new features!`,
    }).then(({ error: notifError }: { error: { message: string } | null }) => {
      if (notifError) console.error("[webhook] Failed to create upgrade notification:", notifError.message);
    });
  }

  // Send confirmation email to the buyer
  if (session.customer_email || userId) {
    const email = session.customer_email ?? await getUserEmail(userId!);
    if (email) {
      const planName = resolvedTier.charAt(0).toUpperCase() + resolvedTier.slice(1);
      const amount = subscription.items.data[0]?.price.unit_amount;
      const priceStr = amount ? `$${(amount / 100).toFixed(0)}` : "";
      await sendSubscriptionConfirmationEmail(email, planName, priceStr).catch(e =>
        console.error("[webhook] Confirmation email failed:", e.message)
      );
    }
  }

  // Notify admin
  const buyerEmail = session.customer_email ?? (userId ? await getUserEmail(userId) : null);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const planName = resolvedTier.charAt(0).toUpperCase() + resolvedTier.slice(1);
    const amount = subscription.items.data[0]?.price.unit_amount;
    const priceStr = amount ? `$${(amount / 100).toFixed(0)}/mo` : "";
    await sendAdminNewSubscriberEmail(adminEmail, buyerEmail ?? "unknown", planName, priceStr).catch(e =>
      console.error("[webhook] Admin notification email failed:", e.message)
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any) {
  const orgId = subscription.metadata?.organizationId;
  if (!orgId) {
    // Try to find org by stripe_subscription_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();
    if (org) return handleSubscriptionChange(org.id, subscription);
    console.error("[webhook] subscription.updated: no org found for", subscription.id);
    return;
  }
  await handleSubscriptionChange(orgId, subscription);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionChange(orgId: string, subscription: any) {
  const priceId = subscription.items.data[0]?.price.id;
  const tier = tierFromPriceId(priceId);
  const limits = PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;

  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    trialing: "active",
    incomplete: "active",
    incomplete_expired: "canceled",
    paused: "canceled",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  await admin.from("organizations").update({
    stripe_price_id: priceId,
    plan: (tier === "free" ? "free" : tier) as "free" | "starter" | "pro" | "team",
    plan_status: (statusMap[subscription.status] ?? "active") as "active" | "past_due" | "canceled" | "unpaid",
    plan_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    plan_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    transcription_hours_limit: limits.transcriptionHours,
    storage_bytes_limit: limits.storageMb * 1024 * 1024,
    members_limit: limits.membersLimit,
    meetings_per_month_limit: limits.meetingsPerMonth,
  }).eq("id", orgId);

  console.log(`[webhook] Org ${orgId} subscription updated: tier=${tier} status=${subscription.status}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscription: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Find org
  let orgId = subscription.metadata?.organizationId;
  if (!orgId) {
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();
    orgId = org?.id;
  }

  if (!orgId) {
    console.error("[webhook] subscription.deleted: no org found for", subscription.id);
    return;
  }

  const freeLimits = PLAN_LIMITS.free;
  await admin.from("organizations").update({
    plan: "free",
    plan_status: "canceled",
    stripe_subscription_id: null,
    stripe_price_id: null,
    transcription_hours_limit: freeLimits.transcriptionHours,
    storage_bytes_limit: freeLimits.storageMb * 1024 * 1024,
    members_limit: freeLimits.membersLimit,
    meetings_per_month_limit: freeLimits.meetingsPerMonth,
  }).eq("id", orgId);

  console.log(`[webhook] Org ${orgId} subscription cancelled — reverted to free`);

  // Send cancellation email
  const customerId = subscription.customer as string;
  if (customerId) {
    try {
      const stripe = getStripe();
      const customer: any = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) {
        await sendSubscriptionCancelledEmail(customer.email);
      }
    } catch (e) {
      console.error("[webhook] Cancellation email failed:", e);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (org) {
    await admin.from("organizations").update({
      plan_status: "past_due",
    }).eq("id", org.id);
    console.log(`[webhook] Org ${org.id} payment failed — marked past_due`);
  }

  // Notify user
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.email) {
      await sendPaymentFailedEmail(customer.email);
    }
  } catch (e) {
    console.error("[webhook] Payment failed email error:", e);
  }

  // Notify admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      const stripe = getStripe();
      const customer = await stripe.customers.retrieve(customerId);
      const email = !customer.deleted ? customer.email : "unknown";
      console.log(`[webhook] Payment failed for customer ${email} — admin notified`);
    } catch { /* non-critical */ }
  }
}

async function getUserEmail(userId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  const { data } = await admin.from("profiles").select("email").eq("id", userId).single();
  return data?.email ?? null;
}
