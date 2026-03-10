"use client";

import { AppLink } from "@/components/DemoContext";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function MeetingDetailPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <FileQuestion className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="font-heading text-2xl text-foreground mb-2">Meeting not found</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-md">
        The meeting you are looking for does not exist or has not been recorded yet.
      </p>
      <AppLink
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-brand-violet hover:underline font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Meetings
      </AppLink>
    </div>
  );
}
