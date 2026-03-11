"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { AppLink } from "@/components/DemoContext";
import { updateMeeting, snapshotTranscriptVersion, restoreTranscriptVersion, type Meeting, type TranscriptVersion } from "@/lib/meeting-store";
import { useMeeting } from "@/hooks/use-meetings";
import { useUser } from "@/components/UserContext";
import { runProcessingPipeline, isPipelineOrphaned } from "@/lib/process-pipeline";
import {
  ArrowLeft,
  FileQuestion,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Tag,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ListChecks,
  Lightbulb,
  Gavel,
  StickyNote,
  RefreshCw,
  Download,
  FileText,
  History,
  RotateCcw,
  Pencil,
} from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimecode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

function AudioBadge({ analysis }: { analysis: Meeting["audioAnalysis"] }) {
  if (!analysis) return null;
  const { isSilent, peakDb } = analysis;
  if (isSilent) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-rose/10 text-brand-rose">
        <VolumeX className="w-3 h-3" /> Silent
      </span>
    );
  }
  if (peakDb < -30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-amber/10 text-brand-amber">
        <Volume2 className="w-3 h-3" /> Low Audio
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">
      <Volume2 className="w-3 h-3" /> Good Audio
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === "high") {
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-rose/10 text-brand-rose">High</span>;
  }
  if (p === "medium") {
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-amber/10 text-brand-amber">Medium</span>;
  }
  return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">Low</span>;
}

// --- Processing state ---
function ProcessingState({ step, progress }: { step?: string; progress?: string }) {
  const stepLabels: Record<string, { title: string; pct: number }> = {
    preparing: { title: "Preparing audio", pct: 20 },
    transcribing: { title: "Transcribing", pct: 55 },
    summarizing: { title: "Generating insights", pct: 85 },
  };

  const current = step ? stepLabels[step] : null;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Loader2 className="w-10 h-10 text-brand-violet animate-spin mb-5" />
      <h2 className="font-heading text-2xl text-foreground mb-2">
        {current?.title ?? "Processing your recording"}...
      </h2>
      <p className="text-muted-foreground text-sm max-w-md">
        {progress ?? "We're transcribing and analyzing your meeting. This usually takes a few minutes."}
      </p>

      {/* Step progress bar */}
      {current && (
        <div className="w-full max-w-xs mt-6">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-violet transition-all duration-700"
              style={{ width: `${current.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
            <span className={step === "preparing" ? "text-brand-violet font-medium" : ""}>Prepare</span>
            <span className={step === "transcribing" ? "text-brand-violet font-medium" : ""}>Transcribe</span>
            <span className={step === "summarizing" ? "text-brand-violet font-medium" : ""}>Summarize</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Silent state ---
function SilentState({ recommendation }: { recommendation: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-amber/10 flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-brand-amber" />
      </div>
      <h2 className="font-heading text-2xl text-foreground mb-2">Silent Recording Detected</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-4">
        This recording appears to contain mostly silence or very low audio levels.
      </p>
      <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-xl p-4 max-w-md text-left">
        <p className="text-sm text-foreground font-medium mb-1">Recommendation</p>
        <p className="text-sm text-muted-foreground">{recommendation}</p>
      </div>
    </div>
  );
}

// --- Failed state ---
function FailedState({ errorMessage, onRetry }: { errorMessage?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-rose/10 flex items-center justify-center mb-5">
        <XCircle className="w-7 h-7 text-brand-rose" />
      </div>
      <h2 className="font-heading text-2xl text-foreground mb-2">Processing Failed</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        {errorMessage || "Something went wrong while processing this recording. Please try uploading it again."}
      </p>
      <div className="flex items-center gap-3 mt-6">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-violet text-white rounded-lg text-sm font-medium hover:bg-brand-violet/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        )}
        <AppLink
          href="/meetings/upload"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          Upload New File
        </AppLink>
      </div>
    </div>
  );
}

// --- Not found state ---
function NotFoundState() {
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

// --- Transcript download helpers ---
function buildTranscriptSections(meeting: Meeting) {
  const date = formatDate(meeting.createdAt);
  const segments = meeting.transcript?.segments ?? [];

  const transcriptLines = segments.map(
    (seg) => `[${formatTimecode(seg.start)}] ${seg.text}`
  );

  const sections: string[] = [];

  // Header
  sections.push(meeting.title);
  sections.push(`Date: ${date}`);
  sections.push("");

  // Transcript
  if (transcriptLines.length > 0) {
    sections.push("─".repeat(60));
    sections.push("TRANSCRIPT");
    sections.push("─".repeat(60));
    sections.push("");
    sections.push(...transcriptLines);
    sections.push("");
  }

  // Summary
  if (meeting.summary) {
    sections.push("─".repeat(60));
    sections.push("AI SUMMARY");
    sections.push("─".repeat(60));
    sections.push("");
    sections.push(meeting.summary);
    sections.push("");
  }

  // Key Points
  if (meeting.keyPoints.length > 0) {
    sections.push("─".repeat(60));
    sections.push("KEY POINTS");
    sections.push("─".repeat(60));
    sections.push("");
    meeting.keyPoints.forEach((p) => sections.push(`• ${p}`));
    sections.push("");
  }

  // Action Items
  if (meeting.actionItems.length > 0) {
    sections.push("─".repeat(60));
    sections.push("ACTION ITEMS");
    sections.push("─".repeat(60));
    sections.push("");
    meeting.actionItems.forEach((item) => {
      let line = `• ${item.text}`;
      if (item.priority) line += ` [${item.priority}]`;
      if (item.assignee) line += ` — ${item.assignee}`;
      sections.push(line);
    });
    sections.push("");
  }

  // Decisions
  if (meeting.decisions.length > 0) {
    sections.push("─".repeat(60));
    sections.push("DECISIONS");
    sections.push("─".repeat(60));
    sections.push("");
    meeting.decisions.forEach((dec) => {
      let line = `• ${dec.text}`;
      if (dec.madeBy) line += ` — Made by ${dec.madeBy}`;
      sections.push(line);
    });
    sections.push("");
  }

  return sections;
}

function buildMarkdownContent(meeting: Meeting) {
  const date = formatDate(meeting.createdAt);
  const segments = meeting.transcript?.segments ?? [];
  const lines: string[] = [];

  lines.push(`# ${meeting.title}`);
  lines.push("");
  lines.push(`**Date:** ${date}`);
  lines.push("");

  if (segments.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Transcript");
    lines.push("");
    segments.forEach((seg) => {
      lines.push(`**[${formatTimecode(seg.start)}]** ${seg.text}`);
      lines.push("");
    });
  }

  if (meeting.summary) {
    lines.push("---");
    lines.push("");
    lines.push("## AI Summary");
    lines.push("");
    lines.push(meeting.summary);
    lines.push("");
  }

  if (meeting.keyPoints.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Key Points");
    lines.push("");
    meeting.keyPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }

  if (meeting.actionItems.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Action Items");
    lines.push("");
    meeting.actionItems.forEach((item) => {
      let line = `- ${item.text}`;
      if (item.priority) line += ` \`${item.priority}\``;
      if (item.assignee) line += ` — *${item.assignee}*`;
      lines.push(line);
    });
    lines.push("");
  }

  if (meeting.decisions.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Decisions");
    lines.push("");
    meeting.decisions.forEach((dec) => {
      let line = `- ${dec.text}`;
      if (dec.madeBy) line += ` — *Made by ${dec.madeBy}*`;
      lines.push(line);
    });
    lines.push("");
  }

  return lines.join("\n");
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAsTxt(meeting: Meeting) {
  const content = buildTranscriptSections(meeting).join("\n");
  const filename = `Reverbic - ${meeting.title} - Transcript.txt`;
  triggerDownload(content, filename, "text/plain;charset=utf-8");
}

function downloadAsMd(meeting: Meeting) {
  const content = buildMarkdownContent(meeting);
  const filename = `Reverbic - ${meeting.title} - Transcript.md`;
  triggerDownload(content, filename, "text/markdown;charset=utf-8");
}

// --- Completed meeting view ---
function VersionHistory({
  versions,
  meetingId,
  onRestore,
}: {
  versions: TranscriptVersion[];
  meetingId: string;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (versions.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <History className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-heading text-lg text-foreground">Version History</h2>
        <span className="text-xs text-muted-foreground ml-1">({versions.length} previous)</span>
        <div className="flex-1" />
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {[...versions].reverse().map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{v.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {v.audioAnalysis && ` · Peak: ${v.audioAnalysis.peakDb}dB`}
                  {v.transcript && ` · ${v.transcript.segments.length} segments`}
                </p>
              </div>
              <button
                onClick={async () => {
                  await restoreTranscriptVersion(meetingId, v.id);
                  onRestore();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-violet bg-brand-violet/10 rounded-lg hover:bg-brand-violet/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableTitle({ meeting }: { meeting: Meeting }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meeting.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save(value: string) {
    const trimmed = value.trim();
    if (trimmed && trimmed !== meeting.title) {
      await updateMeeting(meeting.id, { title: trimmed });
    }
    setEditing(false);
  }

  async function useDateTime() {
    const dtTitle = meeting.originalTitle ?? `Recording ${formatDate(meeting.createdAt)}`;
    await updateMeeting(meeting.id, { title: dtTitle });
    setDraft(dtTitle);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => save(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save(draft);
            if (e.key === "Escape") { setDraft(meeting.title); setEditing(false); }
          }}
          className="font-heading text-2xl text-foreground bg-transparent border-b-2 border-brand-violet outline-none w-full py-0.5"
        />
        {meeting.originalTitle && meeting.title !== meeting.originalTitle && (
          <button
            onClick={useDateTime}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="w-3 h-3" />
            Use date/time
          </button>
        )}
      </div>
    );
  }

  return (
    <h1
      onClick={() => { setDraft(meeting.title); setEditing(true); }}
      className="font-heading text-2xl text-foreground cursor-pointer hover:text-brand-violet transition-colors group"
      title="Click to rename"
    >
      {meeting.title}
      <Pencil className="w-3.5 h-3.5 inline ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
    </h1>
  );
}

function CompletedView({ meeting, onReprocess, onRestore }: { meeting: Meeting; onReprocess: () => void; onRestore: () => void }) {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  const handleSeekToTimestamp = useCallback((time: number) => {
    // Use a new value each time so effect fires even if same timestamp clicked twice
    setSeekToTime(time + Math.random() * 0.001);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <EditableTitle meeting={meeting} />
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(meeting.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(meeting.duration)}
              </span>
              <AudioBadge analysis={meeting.audioAnalysis} />
            </div>
          </div>
          <button
            onClick={onReprocess}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-muted transition-colors"
            title="Reprocess audio with latest pipeline (auto-amplify, re-transcribe)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reprocess
          </button>
        </div>

        {/* Tags */}
        {meeting.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {meeting.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-medium rounded-md bg-brand-violet/10 text-brand-violet"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {meeting.s3Key && (
        <AudioPlayer
          meetingId={meeting.id}
          s3Key={meeting.s3Key}
          knownDuration={meeting.transcript?.duration ?? meeting.duration}
          seekToTime={seekToTime}
        />
      )}

      {/* Transcript */}
      {meeting.transcript && meeting.transcript.segments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg text-foreground">Transcript</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadAsTxt(meeting)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .txt
              </button>
              <button
                onClick={() => downloadAsMd(meeting)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Download .md
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {meeting.transcript.segments.map((seg, i) => (
              <div key={i} className="flex gap-3">
                <button
                  onClick={() => handleSeekToTimestamp(seg.start)}
                  className="text-xs text-brand-violet/70 hover:text-brand-violet font-mono shrink-0 pt-0.5 w-12 text-right transition-colors cursor-pointer hover:underline"
                  title="Click to seek audio to this timestamp"
                >
                  {formatTimecode(seg.start)}
                </button>
                <p className="text-sm text-foreground leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {meeting.summary && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-violet" />
              <h2 className="font-heading text-lg text-foreground">AI Summary</h2>
            </div>
            {summaryOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {summaryOpen && (
            <div className="px-5 pb-5">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {meeting.summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Key Points */}
      {meeting.keyPoints.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-brand-amber" />
            <h2 className="font-heading text-lg text-foreground">Key Points</h2>
          </div>
          <ul className="space-y-2">
            {meeting.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-amber mt-1.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {meeting.actionItems.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4 text-brand-violet" />
            <h2 className="font-heading text-lg text-foreground">Action Items</h2>
          </div>
          <div className="space-y-3">
            {meeting.actionItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 bg-muted/30 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  {item.assignee && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned to {item.assignee}
                    </p>
                  )}
                </div>
                <PriorityBadge priority={item.priority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {meeting.decisions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-4 h-4 text-brand-cyan" />
            <h2 className="font-heading text-lg text-foreground">Decisions</h2>
          </div>
          <div className="space-y-3">
            {meeting.decisions.map((dec, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{dec.text}</p>
                  {dec.madeBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Decided by {dec.madeBy}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {meeting.notes && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="w-4 h-4 text-brand-emerald" />
            <h2 className="font-heading text-lg text-foreground">Notes</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {meeting.notes}
          </p>
        </div>
      )}

      {/* Version History */}
      {meeting.transcriptVersions && meeting.transcriptVersions.length > 0 && (
        <VersionHistory
          versions={meeting.transcriptVersions}
          meetingId={meeting.id}
          onRestore={onRestore}
        />
      )}
    </div>
  );
}

// --- Main page ---
export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { meeting, loading, refresh, setMeeting } = useMeeting(id);
  const { user } = useUser();
  const resumedRef = useRef(false);

  // Auto-resume orphaned pipeline (e.g. after page refresh)
  useEffect(() => {
    if (!meeting || meeting.status !== "processing") return;
    if (resumedRef.current) return;

    (async () => {
      // Check if this pipeline is orphaned (no tab is running it)
      if (await isPipelineOrphaned(id)) {
        resumedRef.current = true;
        console.log(`[detail] Resuming orphaned pipeline for ${id.slice(0, 8)}...`);
        runProcessingPipeline(
          id,
          meeting.s3Key,
          meeting.title,
          user!.id,
          meeting.language?.toLowerCase().slice(0, 2),
          { onStep: () => refresh(), onComplete: () => refresh(), onError: () => refresh() }
        );
      }
    })();
  }, [meeting, id, refresh, user]);

  // Auto-poll when processing
  useEffect(() => {
    if (meeting?.status !== "processing") return;
    const interval = setInterval(() => {
      refresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [meeting?.status, refresh]);

  // Loading
  if (loading) {
    return null;
  }

  // Not found
  if (meeting === null) {
    return <NotFoundState />;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <AppLink
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Meetings
      </AppLink>

      {meeting.status === "processing" && <ProcessingState step={meeting.processingStep} progress={meeting.processingProgress} />}
      {meeting.status === "uploading" && <ProcessingState />}
      {meeting.status === "silent" && (
        <SilentState recommendation={meeting.audioAnalysis?.recommendation ?? "Try re-recording with a better microphone or in a quieter environment."} />
      )}
      {meeting.status === "failed" && (
        <FailedState
          errorMessage={meeting.errorMessage}
          onRetry={async () => {
            if (meeting.transcript) {
              await snapshotTranscriptVersion(id, "Before retry");
            }
            await updateMeeting(id, { status: "processing", errorMessage: undefined });
            setMeeting({ ...meeting, status: "processing", errorMessage: undefined });
            runProcessingPipeline(
              id,
              meeting.s3Key,
              meeting.title,
              user!.id,
              meeting.language?.toLowerCase().slice(0, 2),
              { onStep: () => refresh(), onComplete: () => refresh(), onError: () => refresh() }
            );
          }}
        />
      )}
      {meeting.status === "completed" && (
        <CompletedView
          meeting={meeting}
          onRestore={refresh}
          onReprocess={async () => {
            const label = meeting.audioAnalysis
              ? `Transcript (peak: ${meeting.audioAnalysis.peakDb}dB)`
              : "Previous transcript";
            await snapshotTranscriptVersion(id, label);

            await updateMeeting(id, { status: "processing", errorMessage: undefined });
            setMeeting({ ...meeting, status: "processing", errorMessage: undefined });
            runProcessingPipeline(
              id,
              meeting.s3Key,
              meeting.title,
              user!.id,
              meeting.language?.toLowerCase().slice(0, 2),
              { onStep: () => refresh(), onComplete: () => refresh(), onError: () => refresh() }
            );
          }}
        />
      )}
    </div>
  );
}
