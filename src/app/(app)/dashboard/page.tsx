"use client";

import { useState, useMemo, useCallback } from "react";
import { AppLink } from "@/components/DemoContext";
import { SoftPlanGate } from "@/components/SoftPlanGate";
import { useUser } from "@/components/UserContext";
import { type Meeting, updateMeeting } from "@/lib/meeting-store";
import { useMeetings } from "@/hooks/use-meetings";
import {
  Upload,
  Mic,
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  Clock,
  ListChecks,
  Target,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lightbulb,
} from "lucide-react";

/* ─── Helpers ─── */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(seconds: number): string {
  const hours = seconds / 3600;
  if (hours === 0) return "0h";
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusLabel(status: Meeting["status"]): { text: string; className: string } {
  switch (status) {
    case "completed":
      return { text: "Completed", className: "bg-brand-emerald/10 text-brand-emerald" };
    case "processing":
      return { text: "Processing", className: "bg-brand-cyan/10 text-brand-cyan" };
    case "uploading":
      return { text: "Uploading", className: "bg-brand-violet/10 text-brand-violet" };
    case "failed":
      return { text: "Failed", className: "bg-brand-rose/10 text-brand-rose" };
    case "silent":
      return { text: "Silent", className: "bg-muted text-muted-foreground" };
    default:
      return { text: status, className: "bg-muted text-muted-foreground" };
  }
}

function priorityBadge(priority: string): { className: string } {
  switch (priority.toLowerCase()) {
    case "high":
      return { className: "bg-brand-rose/10 text-brand-rose" };
    case "medium":
      return { className: "bg-brand-amber/10 text-brand-amber" };
    case "low":
      return { className: "bg-brand-emerald/10 text-brand-emerald" };
    default:
      return { className: "bg-muted text-muted-foreground" };
  }
}

/* ─── Types ─── */

interface FlatActionItem {
  meetingId: string;
  meetingTitle: string;
  itemIdx: number;
  text: string;
  assignee: string | null;
  priority: string;
  completed: boolean;
}

interface FlatDecision {
  meetingId: string;
  meetingTitle: string;
  text: string;
  madeBy: string | null;
}

/* ─── Main Component ─── */

export default function DashboardPage() {
  const { user } = useUser();
  const { meetings, loading, refresh } = useMeetings();
  const [showCompleted, setShowCompleted] = useState(false);

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  // Compute stats
  const stats = useMemo(() => {
    let totalSeconds = 0;
    let openActions = 0;
    let totalDecisions = 0;

    for (const m of meetings) {
      const dur = m.transcript?.duration ?? m.duration ?? 0;
      totalSeconds += dur;
      for (const item of m.actionItems ?? []) {
        if (!item.completed) openActions++;
      }
      totalDecisions += (m.decisions ?? []).length;
    }

    return {
      totalMeetings: meetings.length,
      totalSeconds,
      openActions,
      totalDecisions,
    };
  }, [meetings]);

  // Flat action items across all meetings
  const allActionItems = useMemo(() => {
    const items: FlatActionItem[] = [];
    for (const m of meetings) {
      (m.actionItems ?? []).forEach((ai, idx) => {
        items.push({
          meetingId: m.id,
          meetingTitle: m.title,
          itemIdx: idx,
          text: ai.text,
          assignee: ai.assignee,
          priority: ai.priority,
          completed: !!ai.completed,
        });
      });
    }
    return items;
  }, [meetings]);

  const openItems = allActionItems.filter((i) => !i.completed);
  const completedItems = allActionItems.filter((i) => i.completed);

  // Flat decisions across all meetings, most recent first
  const allDecisions = useMemo(() => {
    const decs: FlatDecision[] = [];
    for (const m of meetings) {
      (m.decisions ?? []).forEach((d) => {
        decs.push({
          meetingId: m.id,
          meetingTitle: m.title,
          text: d.text,
          madeBy: d.madeBy,
        });
      });
    }
    return decs.slice(0, 5);
  }, [meetings]);

  // Recent 7 meetings
  const recentMeetings = meetings.slice(0, 7);

  // Toggle action item completion
  const toggleActionItem = useCallback(
    async (meetingId: string, itemIdx: number) => {
      const meeting = meetings.find((m) => m.id === meetingId);
      if (!meeting) return;

      const updatedItems = [...(meeting.actionItems ?? [])];
      if (!updatedItems[itemIdx]) return;

      updatedItems[itemIdx] = {
        ...updatedItems[itemIdx],
        completed: !updatedItems[itemIdx].completed,
      };

      await updateMeeting(meetingId, { actionItems: updatedItems });
      refresh();
    },
    [meetings, refresh]
  );

  const hasMeetings = meetings.length > 0;
  const mounted = !loading;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  /* ─── Empty state for new users ─── */
  if (!hasMeetings) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome to Reverbic. Upload or record your first meeting to get started.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-violet/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-brand-violet" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-foreground">
              Capture your first meeting
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Upload a recording or start a live recording. Reverbic will transcribe it, extract
              action items, decisions, and key points automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <AppLink
              href="/meetings/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-violet text-white text-sm font-semibold hover:bg-brand-violet/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Recording
            </AppLink>
            <AppLink
              href="/meetings/record"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </AppLink>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main home hub ─── */
  return (
    <div className="space-y-8">
      {/* ── Section 1: Greeting + Quick Stats Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s what&apos;s happening across your meetings.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AppLink
            href="/meetings/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-violet text-white text-sm font-semibold hover:bg-brand-violet/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </AppLink>
          <AppLink
            href="/meetings/record"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Record
          </AppLink>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-rose/10 flex items-center justify-center shrink-0">
            <ListChecks className="w-4.5 h-4.5 text-brand-rose" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground leading-tight">
              {stats.openActions}
            </div>
            <div className="text-xs text-muted-foreground">Open Actions</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5 text-brand-violet" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground leading-tight">
              {stats.totalMeetings}
            </div>
            <div className="text-xs text-muted-foreground">Meetings</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-cyan/10 flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5 text-brand-cyan" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground leading-tight">
              {formatDuration(stats.totalSeconds)}
            </div>
            <div className="text-xs text-muted-foreground">Hours Recorded</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-amber/10 flex items-center justify-center shrink-0">
            <Target className="w-4.5 h-4.5 text-brand-amber" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground leading-tight">
              {stats.totalDecisions}
            </div>
            <div className="text-xs text-muted-foreground">Decisions</div>
          </div>
        </div>
      </div>

      {/* ── Section 2: My Action Items ── */}
      {allActionItems.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-base text-foreground">My Action Items</h2>
            <span className="text-xs text-muted-foreground">
              {openItems.length} open
            </span>
          </div>

          {/* Open items */}
          <div className="divide-y divide-border">
            {openItems.length === 0 && (
              <div className="px-5 py-6 text-center">
                <CheckCircle2 className="w-5 h-5 text-brand-emerald mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All action items completed!</p>
              </div>
            )}
            {openItems.map((item) => (
              <div
                key={`${item.meetingId}-${item.itemIdx}`}
                className="flex items-start gap-3 px-5 py-3"
              >
                <button
                  onClick={() => toggleActionItem(item.meetingId, item.itemIdx)}
                  className="mt-0.5 shrink-0"
                >
                  <Circle className="w-4.5 h-4.5 text-muted-foreground/40 hover:text-brand-violet transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <AppLink
                      href={`/meetings/${item.meetingId}`}
                      className="text-xs text-muted-foreground hover:text-brand-violet transition-colors truncate max-w-[200px]"
                    >
                      {item.meetingTitle}
                    </AppLink>
                    {item.assignee && (
                      <span className="text-xs text-muted-foreground">
                        &middot; {item.assignee}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityBadge(item.priority).className}`}
                >
                  {item.priority}
                </span>
              </div>
            ))}
          </div>

          {/* Completed items (collapsible) */}
          {completedItems.length > 0 && (
            <>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full px-5 py-3 border-t border-border flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                {completedItems.length} completed item{completedItems.length === 1 ? "" : "s"}
              </button>
              {showCompleted && (
                <div className="divide-y divide-border">
                  {completedItems.map((item) => (
                    <div
                      key={`${item.meetingId}-${item.itemIdx}`}
                      className="flex items-start gap-3 px-5 py-3 opacity-60"
                    >
                      <button
                        onClick={() => toggleActionItem(item.meetingId, item.itemIdx)}
                        className="mt-0.5 shrink-0"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5 text-brand-emerald" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-through">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <AppLink
                            href={`/meetings/${item.meetingId}`}
                            className="text-xs text-muted-foreground hover:text-brand-violet transition-colors truncate max-w-[200px]"
                          >
                            {item.meetingTitle}
                          </AppLink>
                          {item.assignee && (
                            <span className="text-xs text-muted-foreground">
                              &middot; {item.assignee}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityBadge(item.priority).className}`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Section 3: Recent Meetings ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-heading text-base text-foreground">Recent Meetings</h2>
          <AppLink
            href="/meetings"
            className="text-xs font-medium text-brand-violet hover:text-brand-violet/80 transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </AppLink>
        </div>
        <div className="divide-y divide-border">
          {recentMeetings.map((meeting) => {
            const badge = statusLabel(meeting.status);
            const actionCount = (meeting.actionItems ?? []).length;
            const decisionCount = (meeting.decisions ?? []).length;
            const keyPointCount = (meeting.keyPoints ?? []).length;

            return (
              <AppLink
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-brand-violet" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {meeting.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(meeting.createdAt)}
                    </span>
                    {meeting.duration != null && meeting.duration > 0 && (
                      <span className="text-xs text-muted-foreground">
                        &middot; {formatDuration(meeting.duration)}
                      </span>
                    )}
                    {meeting.summary && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                        &middot; {meeting.summary.slice(0, 60)}...
                      </span>
                    )}
                  </div>
                  {/* Insight pills */}
                  {meeting.status === "completed" && (actionCount > 0 || decisionCount > 0 || keyPointCount > 0) && (
                    <div className="flex items-center gap-2 mt-1.5">
                      {decisionCount > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-amber/10 text-brand-amber">
                          {decisionCount} decision{decisionCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {actionCount > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-rose/10 text-brand-rose">
                          {actionCount} action{actionCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {keyPointCount > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan">
                          {keyPointCount} key point{keyPointCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}
                >
                  {badge.text}
                </span>
              </AppLink>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Recent Decisions ── */}
      {allDecisions.length > 0 && (
        <SoftPlanGate
          feature="decisions"
          title="Unlock Decisions"
          description="Upgrade to Pro to see decisions extracted from your meetings."
        >
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-heading text-base text-foreground">Recent Decisions</h2>
              <span className="text-xs text-muted-foreground">
                Latest from your meetings
              </span>
            </div>
            <div className="divide-y divide-border">
              {allDecisions.map((decision, idx) => (
                <div key={`${decision.meetingId}-${idx}`} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 shrink-0">
                    <Lightbulb className="w-4 h-4 text-brand-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{decision.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <AppLink
                        href={`/meetings/${decision.meetingId}`}
                        className="text-xs text-muted-foreground hover:text-brand-violet transition-colors truncate max-w-[200px]"
                      >
                        {decision.meetingTitle}
                      </AppLink>
                      {decision.madeBy && (
                        <span className="text-xs text-muted-foreground">
                          &middot; {decision.madeBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SoftPlanGate>
      )}
    </div>
  );
}
