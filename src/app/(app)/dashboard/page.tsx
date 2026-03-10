"use client";

import { AppLink } from "@/components/DemoContext";
import {
  demoMeetings,
  demoWeeklyDigests,
  demoSmartClips,
  getAllActionItems,
  getAllDecisions,
  getDashboardStats,
} from "@/lib/demo-data";
import { formatDuration, formatTime, formatRelative } from "@/lib/utils";
import {
  Calendar,
  Clock,
  ListChecks,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Video,
  Upload,
  Mic,
  Search,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
  Play,
  AlertCircle,
  Minus,
} from "lucide-react";

const platformConfig: Record<string, { color: string; label: string }> = {
  zoom: { color: "text-blue-600 bg-blue-50", label: "Zoom" },
  google_meet: { color: "text-green-600 bg-green-50", label: "Google Meet" },
  teams: { color: "text-purple-600 bg-purple-50", label: "Teams" },
  upload: { color: "text-gray-600 bg-gray-50", label: "Upload" },
  recording: { color: "text-brand-rose bg-red-50", label: "Recording" },
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-brand-emerald", label: "Completed" },
  processing: { icon: Clock, color: "text-brand-amber", label: "Processing" },
  live: { icon: Play, color: "text-brand-rose", label: "Live" },
  scheduled: { icon: Circle, color: "text-brand-slate", label: "Scheduled" },
};

export default function DashboardPage() {
  const stats = getDashboardStats();
  const digest = demoWeeklyDigests[0];
  const allActions = getAllActionItems();
  const allDecisions = getAllDecisions();

  // Today's meetings (March 10, 2026)
  const todayMeetings = demoMeetings.filter((m) => m.date.startsWith("2026-03-10"));

  // Recent activity: combine action items, decisions, clips — sort by date
  const recentActivity = [
    ...allActions.slice(0, 5).map((a) => ({
      type: "action" as const,
      text: a.text,
      meta: `Assigned to ${a.assignee}`,
      date: a.createdAt,
      priority: a.priority,
      status: a.status,
    })),
    ...allDecisions.slice(0, 3).map((d) => ({
      type: "decision" as const,
      text: d.text,
      meta: `by ${d.madeBy}`,
      date: d.createdAt,
      priority: undefined,
      status: undefined,
    })),
    ...demoSmartClips.slice(0, 3).map((c) => ({
      type: "clip" as const,
      text: c.title,
      meta: c.meetingTitle,
      date: c.createdAt,
      priority: undefined,
      status: undefined,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const thisWeekMeetings = demoMeetings.filter((m) => {
    const d = new Date(m.date);
    return d >= new Date("2026-03-09") && d <= new Date("2026-03-15");
  });
  const hoursThisWeek = Math.round(
    thisWeekMeetings.reduce((s, m) => s + m.duration, 0) / 3600 * 10
  ) / 10;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Good morning, Jamie</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You have <span className="font-semibold text-foreground">{todayMeetings.length} meetings</span> today
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date("2026-03-10").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Meetings This Week"
          value={thisWeekMeetings.length.toString()}
          icon={Calendar}
          accent="brand-violet"
        />
        <StatCard
          label="Hours in Meetings"
          value={`${hoursThisWeek}h`}
          icon={Clock}
          accent="brand-cyan"
        />
        <StatCard
          label="Open Action Items"
          value={stats.actionItemsOpen.toString()}
          icon={ListChecks}
          accent="brand-emerald"
        />
        <StatCard
          label="Coach Score"
          value={digest.coachScore.toString()}
          icon={Sparkles}
          accent="brand-violet"
          trend={digest.trend}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Meetings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-foreground">Today&apos;s Meetings</h2>
              <AppLink href="/meetings" className="text-sm text-brand-violet hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </AppLink>
            </div>
            {todayMeetings.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No meetings today</p>
            ) : (
              <div className="space-y-3">
                {todayMeetings.map((meeting) => {
                  const platform = platformConfig[meeting.platform];
                  const status = statusConfig[meeting.status];
                  const StatusIcon = status.icon;
                  return (
                    <AppLink
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="text-sm font-mono text-muted-foreground w-16 shrink-0">
                        {formatTime(meeting.date)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm group-hover:text-brand-violet transition-colors truncate">
                          {meeting.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${platform.color}`}>
                            {platform.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {meeting.participants.length} participants
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(meeting.duration)}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>
                    </AppLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-heading text-xl text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === "action"
                      ? "bg-brand-emerald/10 text-brand-emerald"
                      : item.type === "decision"
                        ? "bg-brand-violet/10 text-brand-violet"
                        : "bg-brand-cyan/10 text-brand-cyan"
                  }`}>
                    {item.type === "action" && <ListChecks className="w-3.5 h-3.5" />}
                    {item.type === "decision" && <AlertCircle className="w-3.5 h-3.5" />}
                    {item.type === "clip" && <Play className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{item.meta}</span>
                      <span className="text-xs text-muted-foreground">{formatRelative(item.date)}</span>
                    </div>
                  </div>
                  {item.priority && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                      item.priority === "high"
                        ? "bg-red-50 text-red-600"
                        : item.priority === "medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Weekly Digest */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-brand-violet" />
              <h2 className="font-heading text-xl text-foreground">Weekly Digest</h2>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl font-semibold text-brand-violet">{digest.coachScore}</div>
              <div>
                <div className="text-sm font-medium text-foreground">Coach Score</div>
                <div className={`flex items-center gap-1 text-xs ${
                  digest.trend === "up"
                    ? "text-brand-emerald"
                    : digest.trend === "down"
                      ? "text-brand-rose"
                      : "text-muted-foreground"
                }`}>
                  {digest.trend === "up" && <TrendingUp className="w-3 h-3" />}
                  {digest.trend === "down" && <TrendingDown className="w-3 h-3" />}
                  {digest.trend === "stable" && <Minus className="w-3 h-3" />}
                  {digest.trend === "up" ? "Improving" : digest.trend === "down" ? "Declining" : "Stable"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-semibold text-foreground">{digest.totalMeetings}</div>
                <div className="text-[11px] text-muted-foreground">Meetings</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-semibold text-foreground">{digest.totalHours}h</div>
                <div className="text-[11px] text-muted-foreground">Total Hours</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-semibold text-foreground">{digest.actionItemsCompleted}/{digest.actionItemsCreated}</div>
                <div className="text-[11px] text-muted-foreground">Items Done</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-semibold text-foreground">{digest.decisionsLogged}</div>
                <div className="text-[11px] text-muted-foreground">Decisions</div>
              </div>
            </div>
            <div className="bg-brand-violet/5 border border-brand-violet/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{digest.insight}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-heading text-xl text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <AppLink
                href="/meetings/upload"
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-brand-violet/5 hover:border-brand-violet/20 border border-transparent transition-colors text-center"
              >
                <Upload className="w-5 h-5 text-brand-violet" />
                <span className="text-xs font-medium text-foreground">Upload</span>
              </AppLink>
              <AppLink
                href="/meetings/record"
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-brand-rose/5 hover:border-brand-rose/20 border border-transparent transition-colors text-center"
              >
                <Mic className="w-5 h-5 text-brand-rose" />
                <span className="text-xs font-medium text-foreground">Record</span>
              </AppLink>
              <AppLink
                href="/library"
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-brand-cyan/5 hover:border-brand-cyan/20 border border-transparent transition-colors text-center"
              >
                <Search className="w-5 h-5 text-brand-cyan" />
                <span className="text-xs font-medium text-foreground">Search</span>
              </AppLink>
              <AppLink
                href="/analytics"
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-brand-emerald/5 hover:border-brand-emerald/20 border border-transparent transition-colors text-center"
              >
                <BarChart3 className="w-5 h-5 text-brand-emerald" />
                <span className="text-xs font-medium text-foreground">Analytics</span>
              </AppLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  trend?: "up" | "down" | "stable";
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg bg-${accent}/10 flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 text-${accent}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${
            trend === "up"
              ? "text-brand-emerald"
              : trend === "down"
                ? "text-brand-rose"
                : "text-muted-foreground"
          }`}>
            {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
            {trend === "stable" && <Minus className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
