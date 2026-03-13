"use client";

import { useUser, type OrgPlan } from "@/components/UserContext";
import { AppLink } from "@/components/DemoContext";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

/** Which plans can access each feature */
const FEATURE_PLANS: Record<string, string[]> = {
  coach: ["pro", "team", "enterprise"],
  clips: ["pro", "team", "enterprise"],
  decisions: ["pro", "team", "enterprise"],
  analytics: ["pro", "team", "enterprise"],
};

const FEATURE_LABELS: Record<string, { name: string; description: string; requiredPlan: string }> = {
  coach: {
    name: "AI Coach",
    description: "Get AI-powered feedback on your meeting performance, communication style, and actionable improvement tips.",
    requiredPlan: "Pro",
  },
  clips: {
    name: "Smart Clips",
    description: "Automatically extract key moments, decisions, and action items as shareable clips from your meetings.",
    requiredPlan: "Pro",
  },
  decisions: {
    name: "Decision Tracker",
    description: "Track every decision made across all your meetings in one place. Never lose track of what was agreed.",
    requiredPlan: "Pro",
  },
  analytics: {
    name: "Advanced Analytics",
    description: "Deep insights into meeting patterns, time spent, speaker distribution, and team trends.",
    requiredPlan: "Pro",
  },
};

/** Check if a plan has access to a feature */
export function hasFeatureAccess(plan: OrgPlan | null | undefined, feature: string): boolean {
  if (!plan) return false;
  const allowed = FEATURE_PLANS[feature];
  if (!allowed) return true; // Unknown features are accessible by default
  return allowed.includes(plan.plan);
}

/** Check if the plan has an active subscription (not canceled/unpaid) */
export function isPlanActive(plan: OrgPlan | null | undefined): boolean {
  if (!plan) return true; // No plan data = assume free, which is always active
  return plan.planStatus === "active" || plan.planStatus === "trialing";
}

/** Check transcription hours remaining */
export function canTranscribe(plan: OrgPlan | null | undefined): { allowed: boolean; hoursUsed: number; hoursLimit: number; hoursRemaining: number } {
  const hoursUsed = plan?.transcriptionHoursUsed ?? 0;
  const hoursLimit = plan?.transcriptionHoursLimit ?? 3;
  // -1 means unlimited
  if (hoursLimit === -1) return { allowed: true, hoursUsed, hoursLimit, hoursRemaining: Infinity };
  const hoursRemaining = Math.max(0, hoursLimit - hoursUsed);
  return { allowed: hoursRemaining > 0, hoursUsed, hoursLimit, hoursRemaining };
}

interface PlanGateProps {
  feature: string;
  children: React.ReactNode;
}

/**
 * Wraps a page/section that requires a specific plan.
 * Shows upgrade prompt if user's plan doesn't include the feature.
 */
export function PlanGate({ feature, children }: PlanGateProps) {
  const { user } = useUser();
  const plan = user?.orgPlan;

  // In demo mode or if plan data not loaded yet, show content
  if (!user || hasFeatureAccess(plan, feature)) {
    return <>{children}</>;
  }

  const info = FEATURE_LABELS[feature] ?? {
    name: feature,
    description: "This feature requires an upgraded plan.",
    requiredPlan: "Pro",
  };

  return <UpgradePrompt {...info} />;
}

function UpgradePrompt({ name, description, requiredPlan }: { name: string; description: string; requiredPlan: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-brand-orange" />
        </div>

        <div>
          <h2 className="font-heading text-2xl text-foreground mb-2">{name}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 border border-border">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-brand-amber" />
            <span className="text-foreground font-medium">Available on {requiredPlan} plan and above</span>
          </div>
        </div>

        <AppLink
          href="/settings"
          className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-brand-orange/90 transition-colors"
        >
          Upgrade Now
          <ArrowRight className="w-4 h-4" />
        </AppLink>

        <p className="text-xs text-muted-foreground">
          You can upgrade or manage your plan in Settings.
        </p>
      </div>
    </div>
  );
}

/**
 * Banner shown when transcription hours are running low or exhausted.
 */
export function TranscriptionLimitBanner() {
  const { user } = useUser();
  const plan = user?.orgPlan;
  const { allowed, hoursUsed, hoursLimit, hoursRemaining } = canTranscribe(plan);

  // Don't show for unlimited plans
  if (hoursLimit === -1) return null;

  // Show warning when less than 1 hour remaining
  if (hoursRemaining > 1) return null;

  return (
    <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${
      allowed
        ? "bg-brand-amber/10 border border-brand-amber/20 text-brand-amber"
        : "bg-brand-rose/10 border border-brand-rose/20 text-brand-rose"
    }`}>
      <div>
        {allowed ? (
          <span>You have less than 1 hour of transcription remaining this month ({hoursUsed.toFixed(1)}/{hoursLimit}hrs used).</span>
        ) : (
          <span>You&apos;ve used all {hoursLimit} hours of transcription this month. Upgrade to continue.</span>
        )}
      </div>
      <AppLink
        href="/settings"
        className="text-xs font-semibold px-3 py-1 rounded-md bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors whitespace-nowrap ml-3"
      >
        Upgrade
      </AppLink>
    </div>
  );
}
