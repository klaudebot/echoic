"use client";

import { AppLink } from "@/components/DemoContext";
import { Video, Upload, Mic } from "lucide-react";

export default function MeetingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Meetings</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse, search, and filter all your recorded meetings</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
          <Video className="w-7 h-7 text-brand-violet" />
        </div>
        <h2 className="font-heading text-2xl text-foreground mb-2">No meetings yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Upload a recording or start a live recording to get your first meeting transcribed and analyzed by AI.
        </p>
        <div className="flex items-center gap-3">
          <AppLink
            href="/meetings/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Recording
          </AppLink>
          <AppLink
            href="/meetings/record"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            <Mic className="w-4 h-4" />
            Record Meeting
          </AppLink>
        </div>
      </div>
    </div>
  );
}
