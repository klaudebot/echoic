"use client";

import { AppLink } from "@/components/DemoContext";
import { ListChecks, Mic } from "lucide-react";

export default function ActionItemsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Action Items</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage action items across all your meetings.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
          <ListChecks className="w-7 h-7 text-brand-violet" />
        </div>
        <h2 className="font-heading text-2xl text-foreground mb-2">No action items yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Record a meeting to get started. Reverbic will automatically extract action items from your conversations.
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
