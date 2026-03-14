"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLink, useBasePrefix } from "@/components/DemoContext";
import { type Meeting, deleteMeeting, archiveMeeting, unarchiveMeeting } from "@/lib/meeting-store";
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
  Archive,
  ArchiveRestore,
  MoreVertical,
  Trash2,
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-violet/10 text-brand-violet">
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
      <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
        <Video className="w-7 h-7 text-brand-violet" />
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
  );
}

function MeetingCardMenu({ meeting, onAction }: { meeting: Meeting; onAction: (action: "archive" | "unarchive" | "delete") => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); setConfirming(false); }}
        className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground/50 rounded-md hover:text-foreground hover:bg-muted transition-colors"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {!confirming ? (
            <>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onAction(meeting.archived ? "unarchive" : "archive"); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {meeting.archived ? (
                  <><ArchiveRestore className="w-4 h-4" /> Unarchive</>
                ) : (
                  <><Archive className="w-4 h-4" /> Archive</>
                )}
              </button>
              <div className="border-t border-border" />
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-rose hover:bg-brand-rose/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          ) : (
            <div className="p-3 space-y-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <p className="text-xs text-foreground font-medium">Delete this meeting?</p>
              <p className="text-xs text-muted-foreground">Permanently removes recording, transcript, and all data.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setOpen(false); setConfirming(false); onAction("delete"); }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-brand-rose text-white hover:bg-brand-rose/90 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, onAction }: { meeting: Meeting; onAction: (action: "archive" | "unarchive" | "delete") => void }) {
  const router = useRouter();
  const prefix = useBasePrefix();

  return (
    <div
      onClick={() => router.push(`${prefix}/meetings/${meeting.id}`)}
      className="block bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-brand-violet/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {meeting.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-violet/50" />
              {formatDate(meeting.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-cyan/50" />
              {formatDuration(meeting.duration)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={meeting.status} />
          <MeetingCardMenu meeting={meeting} onAction={onAction} />
        </div>
      </div>

      {/* Tags */}
      {meeting.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <Tag className="w-3 h-3 text-brand-violet/50" />
          {meeting.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-brand-violet/8 text-brand-violet"
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
    </div>
  );
}

export default function MeetingsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { meetings, loading, refresh } = useMeetings({ includeArchived: showArchived });
  const loaded = !loading;

  const activeMeetings = meetings.filter((m) => !m.archived);
  const archivedMeetings = meetings.filter((m) => m.archived);

  const handleAction = async (meetingId: string, action: "archive" | "unarchive" | "delete") => {
    if (action === "archive") {
      await archiveMeeting(meetingId);
    } else if (action === "unarchive") {
      await unarchiveMeeting(meetingId);
    } else {
      await deleteMeeting(meetingId);
    }
    await refresh();
  };

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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
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

      {loaded && meetings.length === 0 && !showArchived && <EmptyState />}

      {loaded && activeMeetings.length > 0 && (
        <div className="space-y-3">
          {activeMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onAction={(action) => handleAction(meeting.id, action)} />
          ))}
        </div>
      )}

      {/* Show archived toggle */}
      {loaded && (activeMeetings.length > 0 || showArchived) && (
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Archive className="w-3.5 h-3.5" />
          {showArchived
            ? `Hide archived${archivedMeetings.length > 0 ? ` (${archivedMeetings.length})` : ""}`
            : "Show archived"}
        </button>
      )}

      {/* Archived meetings */}
      {showArchived && archivedMeetings.length > 0 && (
        <div className="space-y-3 opacity-60">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Archived</h3>
          {archivedMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onAction={(action) => handleAction(meeting.id, action)} />
          ))}
        </div>
      )}

      {showArchived && archivedMeetings.length === 0 && (
        <p className="text-xs text-muted-foreground">No archived meetings</p>
      )}
    </div>
  );
}
