import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Plan tier → Stripe price ID mapping */
export const PLAN_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  team: process.env.STRIPE_PRICE_TEAM ?? "",
};

/** Price ID → plan tier reverse lookup */
export function tierFromPriceId(priceId: string): string {
  for (const [tier, id] of Object.entries(PLAN_PRICES)) {
    if (id === priceId) return tier;
  }
  return "free";
}

/** Plan limits by tier */
export const PLAN_LIMITS: Record<string, {
  transcriptionHours: number;
  storageMb: number;
  membersLimit: number;
  meetingsPerMonth: number;
}> = {
  free: { transcriptionHours: 3, storageMb: 500, membersLimit: 1, meetingsPerMonth: 10 },
  starter: { transcriptionHours: 30, storageMb: 5000, membersLimit: 5, meetingsPerMonth: 100 },
  pro: { transcriptionHours: -1, storageMb: 50000, membersLimit: 20, meetingsPerMonth: -1 },
  team: { transcriptionHours: -1, storageMb: 100000, membersLimit: -1, meetingsPerMonth: -1 },
};
