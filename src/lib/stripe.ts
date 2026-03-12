import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Plan tier + interval → Stripe price ID mapping */
export const PLAN_PRICES: Record<string, Record<string, string>> = {
  starter: {
    monthly: (process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "").trim(),
    yearly: (process.env.STRIPE_PRICE_STARTER_YEARLY ?? "").trim(),
  },
  pro: {
    monthly: (process.env.STRIPE_PRICE_PRO_MONTHLY ?? "").trim(),
    yearly: (process.env.STRIPE_PRICE_PRO_YEARLY ?? "").trim(),
  },
  team: {
    monthly: (process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "").trim(),
    yearly: (process.env.STRIPE_PRICE_TEAM_YEARLY ?? "").trim(),
  },
};

/** Get the Stripe price ID for a tier + interval */
export function getPriceId(tier: string, interval: "monthly" | "yearly"): string | null {
  return PLAN_PRICES[tier]?.[interval] || null;
}

/** Price ID → plan tier reverse lookup */
export function tierFromPriceId(priceId: string): string {
  for (const [tier, intervals] of Object.entries(PLAN_PRICES)) {
    if (intervals.monthly === priceId || intervals.yearly === priceId) return tier;
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
