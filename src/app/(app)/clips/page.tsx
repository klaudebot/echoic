"use client";

import { AppLink } from "@/components/DemoContext";
import { Scissors, Mic } from "lucide-react";

export default function ClipsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Smart Clips</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-generated shareable audio clips from your meetings
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
          <Scissors className="w-7 h-7 text-brand-violet" />
        </div>
        <h2 className="font-heading text-2xl text-foreground mb-2">No smart clips yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Smart clips are automatically generated from your meetings, highlighting key decisions, action items, and important moments.
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
