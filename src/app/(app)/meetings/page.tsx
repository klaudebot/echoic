"use client";

import { AppLink } from "@/components/DemoContext";
import { type Meeting } from "@/lib/meeting-store";
import { useMeetings } from "@/hooks/use-meetings";
import {
  Video,
  Upload,
  Mic,
  Clock,
  Calendar,
  Tag,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  VolumeX,
} from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: Meeting["status"] }) {
  switch (status) {
    case "uploading":
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-orange/10 text-brand-orange">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-rose/10 text-brand-rose">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    case "silent":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-amber/10 text-brand-amber">
          <VolumeX className="w-3 h-3" /> Silent
        </span>
      );
    default:
      return null;
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center fade-up">
      <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-5">
        <Video className="w-7 h-7 text-brand-orange" />
      </div>
      <h2 className="font-heading text-2xl text-foreground mb-2">Your meetings will live here</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-2">
        Upload a recording or start one in your browser. Reverbic will transcribe, summarize, and extract action items automatically.
      </p>
      <p className="text-muted-foreground/60 text-xs max-w-sm mb-6">
        Supports MP3, WAV, M4A, WebM, and most audio/video formats up to 500 MB.
      </p>
      <div className="flex items-center gap-3 stagger-children">
        <AppLink
          href="/meetings/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors"
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
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <AppLink
      href={`/meetings/${meeting.id}`}
      className="block bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-brand-orange/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {meeting.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-orange/50" />
              {formatDate(meeting.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-teal/50" />
              {formatDuration(meeting.duration)}
            </span>
          </div>
        </div>
        <StatusBadge status={meeting.status} />
      </div>

      {/* Tags */}
      {meeting.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <Tag className="w-3 h-3 text-brand-orange/50" />
          {meeting.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-brand-orange/8 text-brand-orange"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary preview for completed meetings */}
      {meeting.status === "completed" && meeting.summary && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
          {meeting.summary}
        </p>
      )}
    </AppLink>
  );
}

export default function MeetingsPage() {
  const { meetings, loading } = useMeetings();
  const loaded = !loading;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Meetings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse, search, and filter all your recorded meetings
          </p>
        </div>
        {loaded && meetings.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <AppLink
              href="/meetings/upload"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </AppLink>
            <AppLink
              href="/meetings/record"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              <Mic className="w-4 h-4" />
              Record
            </AppLink>
          </div>
        )}
      </div>

      {loaded && meetings.length === 0 && <EmptyState />}

      {loaded && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
