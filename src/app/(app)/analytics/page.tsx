"use client";

import { useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { type Meeting } from "@/lib/meeting-store";
import { useMeetings } from "@/hooks/use-meetings";
import {
  BarChart3,
  Mic,
  Clock,
  ListChecks,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Tag,
  Activity,
  Hash,
  Timer,
} from "lucide-react";
import { PlanGate } from "@/components/PlanGate";

/* ── helpers ── */

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatHours(seconds: number): string {
  const h = seconds / 3600;
  return h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(seconds / 60)}m`;
}

function dayKey(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

function shortDay(key: string): string {
  try {
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return key;
  }
}

function weekdayLabel(key: string): string {
  try {
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return "";
  }
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ── status color map ── */

const statusConfig: Record<
  Meeting["status"],
  { label: string; dotClass: string; bgClass: string }
> = {
  uploading: {
    label: "Uploading",
    dotClass: "bg-brand-violet",
    bgClass: "bg-brand-violet/10",
  },
  processing: {
    label: "Processing",
    dotClass: "bg-brand-violet",
    bgClass: "bg-brand-violet/10",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-brand-emerald",
    bgClass: "bg-brand-emerald/10",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-brand-rose",
    bgClass: "bg-brand-rose/10",
  },
  silent: {
    label: "Silent",
    dotClass: "bg-brand-amber",
    bgClass: "bg-brand-amber/10",
  },
};

/* ── analytics computation ── */

interface Analytics {
  totalMeetings: number;
  totalSeconds: number;
  totalActionItems: number;
  completedActionItems: number;
  completionRate: number;
  avgDurationSeconds: number;
  statusCounts: Record<string, number>;
  dailyCounts: { key: string; count: number }[];
  topTags: { tag: string; count: number }[];
  thisWeekMeetings: number;
  lastWeekMeetings: number;
  thisWeekSeconds: number;
  lastWeekSeconds: number;
}

function computeAnalytics(meetings: Meeting[]): Analytics {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  let totalSeconds = 0;
  let totalActionItems = 0;
  let completedActionItems = 0;
  let durationsCount = 0;
  let durationsSum = 0;
  let thisWeekMeetings = 0;
  let lastWeekMeetings = 0;
  let thisWeekSeconds = 0;
  let lastWeekSeconds = 0;
  const statusCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const dailyMap: Record<string, number> = {};

  for (const m of meetings) {
    // Duration
    const dur = m.transcript?.duration ?? m.duration ?? 0;
    totalSeconds += dur;

    if (dur > 0) {
      durationsCount++;
      durationsSum += dur;
    }

    // Action items
    for (const ai of m.actionItems) {
      totalActionItems++;
      if (ai.completed) completedActionItems++;
    }

    // Status
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;

    // Tags
    for (const tag of m.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    // Daily
    const dk = dayKey(m.createdAt);
    dailyMap[dk] = (dailyMap[dk] || 0) + 1;

    // Weekly comparison
    const created = new Date(m.createdAt);
    if (created >= thisWeekStart) {
      thisWeekMeetings++;
      thisWeekSeconds += dur;
    } else if (created >= lastWeekStart && created < thisWeekStart) {
      lastWeekMeetings++;
      lastWeekSeconds += dur;
    }
  }

  // Build last 30 days array
  const dailyCounts: { key: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d.toISOString());
    dailyCounts.push({ key: k, count: dailyMap[k] || 0 });
  }

  // Top tags sorted by count
  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const completionRate =
    totalActionItems > 0
      ? Math.round((completedActionItems / totalActionItems) * 100)
      : 0;

  const avgDurationSeconds =
    durationsCount > 0 ? Math.round(durationsSum / durationsCount) : 0;

  return {
    totalMeetings: meetings.length,
    totalSeconds,
    totalActionItems,
    completedActionItems,
    completionRate,
    avgDurationSeconds,
    statusCounts,
    dailyCounts,
    topTags,
    thisWeekMeetings,
    lastWeekMeetings,
    thisWeekSeconds,
    lastWeekSeconds,
  };
}

/* ── sub-components ── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    violet: "bg-brand-violet/10",
    emerald: "bg-brand-emerald/10",
    amber: "bg-brand-amber/10",
    rose: "bg-brand-rose/10",
  };
  const textMap: Record<string, string> = {
    violet: "text-brand-violet",
    emerald: "text-brand-emerald",
    amber: "text-brand-amber",
    rose: "text-brand-rose",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-lg ${bgMap[color] || bgMap.violet} flex items-center justify-center`}
        >
          <Icon className={`w-4.5 h-4.5 ${textMap[color] || textMap.violet}`} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      )}
    </div>
  );
}

function TrendIndicator({
  current,
  previous,
  label,
}: {
  current: number;
  previous: number;
  label: string;
}) {
  const diff = current - previous;
  const pct =
    previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;

  return (
    <div className="flex items-center gap-2">
      {diff > 0 ? (
        <TrendingUp className="w-4 h-4 text-brand-emerald" />
      ) : diff < 0 ? (
        <TrendingDown className="w-4 h-4 text-brand-rose" />
      ) : (
        <Minus className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="text-sm text-foreground font-medium">{current}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      {diff !== 0 && (
        <span
          className={`text-xs font-medium ${
            diff > 0 ? "text-brand-emerald" : "text-brand-rose"
          }`}
        >
          {diff > 0 ? "+" : ""}
          {pct}%
        </span>
      )}
    </div>
  );
}

/* ── main page ── */

export default function AnalyticsPage() {
  const { meetings, loading } = useMeetings();
  const loaded = !loading;

  const analytics = useMemo(() => computeAnalytics(meetings), [meetings]);

  const maxDaily = Math.max(...analytics.dailyCounts.map((d) => d.count), 1);

  /* ── empty state ── */
  if (loaded && meetings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Meeting insights and productivity metrics
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
            <BarChart3 className="w-7 h-7 text-brand-violet" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">
            No analytics data yet
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Start recording meetings to see analytics on meeting volume, talk
            time distribution, sentiment trends, and action item completion
            rates.
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

  /* ── data state ── */
  return (
    <PlanGate feature="analytics">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Meeting insights and productivity metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Hash}
          label="Total Meetings"
          value={String(analytics.totalMeetings)}
          color="violet"
        />
        <StatCard
          icon={Clock}
          label="Hours Transcribed"
          value={formatHours(analytics.totalSeconds)}
          sub={`${formatDuration(analytics.totalSeconds)} total`}
          color="emerald"
        />
        <StatCard
          icon={ListChecks}
          label="Action Items"
          value={String(analytics.totalActionItems)}
          sub={`${analytics.completedActionItems} completed`}
          color="amber"
        />
        <StatCard
          icon={Timer}
          label="Avg Duration"
          value={
            analytics.avgDurationSeconds > 0
              ? formatDuration(analytics.avgDurationSeconds)
              : "--"
          }
          sub="per meeting"
          color="rose"
        />
      </div>

      {/* Action item completion + Status breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion rate */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
              <h3 className="text-sm font-semibold text-foreground">
                Action Item Completion
              </h3>
            </div>
            <span className="text-2xl font-heading font-bold text-foreground">
              {analytics.completionRate}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-emerald rounded-full transition-all duration-500"
              style={{ width: `${analytics.completionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {analytics.completedActionItems} of{" "}
              {analytics.totalActionItems} completed
            </span>
            <span>
              {analytics.totalActionItems - analytics.completedActionItems}{" "}
              remaining
            </span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-violet" />
            <h3 className="text-sm font-semibold text-foreground">
              Meetings by Status
            </h3>
          </div>
          <div className="space-y-3">
            {(
              ["completed", "processing", "uploading", "failed", "silent"] as const
            ).map((status) => {
              const count = analytics.statusCounts[status] || 0;
              if (count === 0) return null;
              const cfg = statusConfig[status];
              const pct =
                analytics.totalMeetings > 0
                  ? Math.round((count / analytics.totalMeetings) * 100)
                  : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass} shrink-0`}
                  />
                  <span className="text-sm text-foreground flex-1">
                    {cfg.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {count}
                  </span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.dotClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meeting frequency chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-brand-violet" />
          <h3 className="text-sm font-semibold text-foreground">
            Meeting Frequency
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Last 30 days</p>

        {/* Chart */}
        <div className="flex items-end gap-[3px] h-36">
          {analytics.dailyCounts.map((day, i) => {
            const heightPct =
              day.count > 0 ? Math.max((day.count / maxDaily) * 100, 6) : 0;
            const isToday = day.key === dayKey(new Date().toISOString());
            // Gradient: older bars are more transparent, recent are more opaque
            const opacity = 0.3 + (i / 29) * 0.7;
            return (
              <div
                key={day.key}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap z-10 pointer-events-none">
                  {shortDay(day.key)}: {day.count}{" "}
                  {day.count === 1 ? "meeting" : "meetings"}
                </div>
                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    day.count === 0
                      ? "bg-muted/50"
                      : isToday
                        ? "bg-brand-violet"
                        : "bg-brand-violet group-hover:bg-brand-violet"
                  }`}
                  style={{
                    height: day.count === 0 ? "2px" : `${heightPct}%`,
                    opacity: day.count === 0 ? undefined : (isToday ? 1 : opacity),
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels (show every 5th day) */}
        <div className="flex gap-[3px] mt-2">
          {analytics.dailyCounts.map((day, i) => (
            <div
              key={day.key}
              className="flex-1 text-center text-[9px] text-muted-foreground"
            >
              {i % 5 === 0 ? weekdayLabel(day.key) : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Trends + Tags row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly trends */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
            <h3 className="text-sm font-semibold text-foreground">
              Weekly Trends
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            This week vs last week
          </p>
          <div className="space-y-4">
            <TrendIndicator
              current={analytics.thisWeekMeetings}
              previous={analytics.lastWeekMeetings}
              label="meetings this week"
            />
            <TrendIndicator
              current={Math.round(analytics.thisWeekSeconds / 60)}
              previous={Math.round(analytics.lastWeekSeconds / 60)}
              label="minutes this week"
            />
          </div>
        </div>

        {/* Top tags */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-brand-amber" />
            <h3 className="text-sm font-semibold text-foreground">Top Tags</h3>
          </div>
          {analytics.topTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No tags used yet. Add tags to your meetings to see them here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analytics.topTags.map((t, i) => {
                const tagColors = [
                  { bg: "bg-brand-violet/10", text: "text-brand-violet", badge: "bg-brand-violet/20" },
                  { bg: "bg-brand-cyan/10", text: "text-brand-cyan", badge: "bg-brand-cyan/20" },
                  { bg: "bg-brand-emerald/10", text: "text-brand-emerald", badge: "bg-brand-emerald/20" },
                  { bg: "bg-brand-amber/10", text: "text-brand-amber", badge: "bg-brand-amber/20" },
                  { bg: "bg-brand-rose/10", text: "text-brand-rose", badge: "bg-brand-rose/20" },
                ];
                const c = tagColors[i % tagColors.length];
                return (
                <span
                  key={t.tag}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg ${c.bg} ${c.text}`}
                >
                  {t.tag}
                  <span className={`w-5 h-5 rounded-full ${c.badge} flex items-center justify-center text-[10px] font-bold`}>
                    {t.count}
                  </span>
                </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </PlanGate>
  );
}
