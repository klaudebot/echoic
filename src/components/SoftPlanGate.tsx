"use client";

import { useUser } from "@/components/UserContext";
import { hasFeatureAccess } from "@/components/PlanGate";
import { AppLink } from "@/components/DemoContext";
import { Lock, ArrowRight } from "lucide-react";

interface SoftPlanGateProps {
  feature: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function SoftPlanGate({ feature, children, title, description }: SoftPlanGateProps) {
  const { user } = useUser();
  const plan = user?.orgPlan;

  if (!user || hasFeatureAccess(plan, feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="pointer-events-none select-none" style={{ filter: "blur(4px)" }}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
        <div className="text-center space-y-3 max-w-xs">
          <div className="mx-auto w-10 h-10 rounded-xl bg-brand-violet/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-brand-violet" />
          </div>
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          <AppLink
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-violet text-white hover:bg-brand-violet/90 transition-colors"
          >
            Upgrade to Pro
            <ArrowRight className="w-3.5 h-3.5" />
          </AppLink>
        </div>
      </div>
    </div>
  );
}
