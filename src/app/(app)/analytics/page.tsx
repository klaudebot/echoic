"use client";

import { AppLink } from "@/components/DemoContext";
import { BarChart3, Mic } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Meeting insights and productivity metrics
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
          <BarChart3 className="w-7 h-7 text-brand-violet" />
        </div>
        <h2 className="font-heading text-2xl text-foreground mb-2">No analytics data yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Start recording meetings to see analytics on meeting volume, talk time distribution, sentiment trends, and action item completion rates.
        </p>
        <AppLink
          href="/meetings/record"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
        >
          <Mic className="w-4 h-4" />
          Record a Meeting
        </AppLink>
      </div>
    </div>
  );
}
