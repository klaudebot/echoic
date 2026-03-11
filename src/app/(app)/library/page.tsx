"use client";

import { useEffect, useState } from "react";
import { AppLink } from "@/components/DemoContext";
import { getMeetings, type Meeting } from "@/lib/meeting-store";
import {
  FolderOpen,
  Upload,
  Mic,
  Clock,
  Calendar,
  Search,
  CheckCircle2,
  Loader2,
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-violet/10 text-brand-violet">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">
          <CheckCircle2 className="w-3 h-3" /> Ready
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

export default function LibraryPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMeetings(getMeetings());
    setLoaded(true);
  }, []);

  const filtered = search.trim()
    ? meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.transcript?.text.toLowerCase().includes(search.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : meetings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search and browse all your meeting recordings and transcripts
        </p>
      </div>

      {loaded && meetings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
            <FolderOpen className="w-7 h-7 text-brand-violet" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Your library is empty</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Upload recordings or start recording meetings to build your library.
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
      )}

      {loaded && meetings.length > 0 && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, transcript, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No meetings match &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((meeting) => (
                <AppLink
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-brand-violet/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4.5 h-4.5 text-brand-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(meeting.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(meeting.duration)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={meeting.status} />
                </AppLink>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
