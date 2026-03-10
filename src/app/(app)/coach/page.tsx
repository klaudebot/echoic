"use client";

import { AppLink } from "@/components/DemoContext";
import { Sparkles, Mic } from "lucide-react";

export default function CoachPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet via-brand-cyan to-brand-emerald flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">AI Meeting Coach</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalized insights to help you become a more effective communicator.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-brand-violet" />
        </div>
        <h2 className="font-heading text-2xl text-foreground mb-2">No coaching insights yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Record meetings to unlock AI coaching insights. Echoic will analyze your speaking patterns, talk ratio, filler words, and more to help you improve.
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
