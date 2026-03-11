"use client";

import { useState, useEffect, useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { useUser } from "@/components/UserContext";
import { type Meeting } from "@/lib/meeting-store";
import { useMeetings } from "@/hooks/use-meetings";
import {
  Upload,
  Mic,
  Video,
  CheckCircle2,
  Circle,
  ArrowRight,
  Plug,
  Sparkles,
  Calendar,
  Clock,
  ListChecks,
  BarChart3,
  Target,
  FileText,
  AlertCircle,
} from "lucide-react";

const onboardingSteps = [
  {
    id: "connect",
    title: "Connect your calendar",
    description: "Link Google Calendar or Outlook so Reverbic can auto-join your meetings.",
    icon: Calendar,
    cta: "Connect Calendar",
    href: "/integrations",
  },
  {
    id: "record",
    title: "Record your first meeting",
    description: "Upload a recording, start a live recording, or let Reverbic join your next call.",
    icon: Mic,
    cta: "Upload or Record",
    href: "/meetings/upload",
  },
  {
    id: "integrations",
    title: "Set up integrations",
    description: "Connect Zoom, Google Meet, Teams, Slack, or Notion to supercharge your workflow.",
    icon: Plug,
    cta: "Browse Integrations",
    href: "/integrations",
  },
  {
    id: "team",
    title: "Invite your team",
    description: "Share meeting insights, action items, and decisions with your whole team.",
    icon: Video,
    cta: "Invite Members",
    href: "/team",
  },
];

interface DashboardStats {
  totalMeetings: number;
  totalHours: number;
  openActionItems: number;
  completedActionItems: number;
  totalDecisions: number;
  recentMeetings: Meeting[];
}

function computeStats(meetings: Meeting[]): DashboardStats {
  let totalSeconds = 0;
  let openActionItems = 0;
  let completedActionItems = 0;
  let totalDecisions = 0;

  for (const m of meetings) {
    // Duration can come from transcript.duration (seconds) or meeting.duration (seconds)
    const dur = m.transcript?.duration ?? m.duration ?? 0;
    totalSeconds += dur;

    for (const item of m.actionItems ?? []) {
      if (item.completed) {
        completedActionItems++;
      } else {
        openActionItems++;
      }
    }

    totalDecisions += (m.decisions ?? []).length;
  }

  return {
    totalMeetings: meetings.length,
    totalHours: totalSeconds / 3600,
    openActionItems,
    completedActionItems,
    totalDecisions,
    recentMeetings: meetings.slice(0, 5),
  };
}

function formatDuration(hours: number): string {
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

export default function DashboardPage() {
  const { user } = useUser();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { meetings, loading } = useMeetings();
  const mounted = !loading;

  const stats = useMemo(() => computeStats(meetings), [meetings]);

  // Auto-mark "record" step if user has at least one meeting
  useEffect(() => {
    if (stats.totalMeetings > 0 && !completedSteps.includes("record")) {
      setCompletedSteps((prev) =>
        prev.includes("record") ? prev : [...prev, "record"]
      );
    }
  }, [stats.totalMeetings, completedSteps]);

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completedSteps.length / onboardingSteps.length) * 100);
  const hasMeetings = stats.totalMeetings > 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-3xl text-foreground">
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : " to Reverbic"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {hasMeetings
            ? `You have ${stats.totalMeetings} meeting${stats.totalMeetings === 1 ? "" : "s"} and ${stats.openActionItems} open action item${stats.openActionItems === 1 ? "" : "s"}.`
            : "Let\u0027s get you set up. Complete these steps to start capturing meeting intelligence."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Meetings"
          value={mounted ? String(stats.totalMeetings) : "0"}
          icon={Calendar}
          accent="brand-violet"
        />
        <StatCard
          label="Hours Recorded"
          value={mounted ? formatDuration(stats.totalHours) : "0h"}
          icon={Clock}
          accent="brand-cyan"
        />
        <StatCard
          label="Open Actions"
          value={mounted ? String(stats.openActionItems) : "0"}
          icon={ListChecks}
          accent="brand-rose"
        />
        <StatCard
          label="Completed"
          value={mounted ? String(stats.completedActionItems) : "0"}
          icon={CheckCircle2}
          accent="brand-emerald"
        />
        <StatCard
          label="Decisions"
          value={mounted ? String(stats.totalDecisions) : "0"}
          icon={Target}
          accent="brand-violet"
        />
      </div>

      {/* Recent Meetings + Activity (side by side on large screens) */}
      {hasMeetings && mounted && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Meetings */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Meetings</h2>
              <AppLink
                href="/meetings"
                className="text-xs font-medium text-brand-violet hover:text-brand-violet/80 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </AppLink>
            </div>
            <div className="divide-y divide-border">
              {stats.recentMeetings.map((meeting) => {
                const badge = statusLabel(meeting.status);
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
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeDate(meeting.createdAt)}
                        {meeting.duration != null && meeting.duration > 0 && (
                          <span> &middot; {formatDuration(meeting.duration / 3600)}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                      {badge.text}
                    </span>
                  </AppLink>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Activity</h2>
            </div>
            <div className="divide-y divide-border">
              {stats.recentMeetings.map((meeting) => (
                <div key={meeting.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {meeting.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                      ) : meeting.status === "failed" ? (
                        <AlertCircle className="w-4 h-4 text-brand-rose" />
                      ) : meeting.status === "processing" ? (
                        <Clock className="w-4 h-4 text-brand-cyan" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {meeting.status === "completed" && (
                          <>
                            <span className="font-medium">{meeting.title}</span> was processed
                            {(meeting.actionItems?.length ?? 0) > 0 && (
                              <> with {meeting.actionItems.length} action item{meeting.actionItems.length === 1 ? "" : "s"}</>
                            )}
                            {(meeting.decisions?.length ?? 0) > 0 && (
                              <> and {meeting.decisions.length} decision{meeting.decisions.length === 1 ? "" : "s"}</>
                            )}
                          </>
                        )}
                        {meeting.status === "processing" && (
                          <>
                            <span className="font-medium">{meeting.title}</span> is being processed...
                          </>
                        )}
                        {meeting.status === "uploading" && (
                          <>
                            <span className="font-medium">{meeting.title}</span> is uploading...
                          </>
                        )}
                        {meeting.status === "failed" && (
                          <>
                            <span className="font-medium">{meeting.title}</span> processing failed
                          </>
                        )}
                        {meeting.status === "silent" && (
                          <>
                            <span className="font-medium">{meeting.title}</span> had no audible speech
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeDate(meeting.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          href="/meetings/upload"
          icon={Upload}
          label="Upload Recording"
          description="Drag & drop any audio or video file"
          color="brand-violet"
        />
        <QuickAction
          href="/meetings/record"
          icon={Mic}
          label="Start Recording"
          description="Record directly in your browser"
          color="brand-rose"
        />
        <QuickAction
          href="/integrations"
          icon={Plug}
          label="Integrations"
          description="Connect Zoom, Meet, Teams & more"
          color="brand-cyan"
        />
        <QuickAction
          href="/settings"
          icon={Sparkles}
          label="Preferences"
          description="Customize AI summaries & alerts"
          color="brand-emerald"
        />
      </div>

      {/* Onboarding (show collapsed once user has meetings, always visible until all done) */}
      {completedSteps.length < onboardingSteps.length && (
        <>
          {/* Progress */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Setup Progress</h2>
              <span className="text-sm font-medium text-brand-violet">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-violet rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedSteps.length} of {onboardingSteps.length} steps completed
            </p>
          </div>

          {/* Onboarding Steps */}
          <div className="space-y-3">
            {onboardingSteps.map((step) => {
              const done = completedSteps.includes(step.id);
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`bg-card border rounded-xl p-5 transition-all ${
                    done ? "border-brand-emerald/30 bg-brand-emerald/[0.02]" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="mt-0.5 shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-brand-emerald" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${done ? "text-brand-emerald" : "text-brand-violet"}`} />
                        <h3 className={`text-sm font-semibold ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {!done && (
                        <AppLink
                          href={step.href}
                          className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-brand-violet hover:text-brand-violet/80 transition-colors"
                        >
                          {step.cta}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </AppLink>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <AppLink
      href={href}
      className={`bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-${color}/30 transition-all group`}
    >
      <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 text-${color}`} />
      </div>
      <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-violet transition-colors">{label}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </AppLink>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg bg-${accent}/10 flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 text-${accent}`} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
