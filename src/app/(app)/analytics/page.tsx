"use client";

import {
  BarChart3,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Target,
  Zap,
} from "lucide-react";
import {
  demoMeetings,
  demoWeeklyDigests,
  getAllActionItems,
  getAllDecisions,
} from "@/lib/demo-data";

function formatHours(seconds: number) {
  return Math.round((seconds / 3600) * 10) / 10;
}

export default function AnalyticsPage() {
  const allItems = getAllActionItems();
  const allDecisions = getAllDecisions();
  const completedItems = allItems.filter((a) => a.status === "completed");
  const totalHours = demoMeetings.reduce((s, m) => s + m.duration, 0) / 3600;

  // Stats row
  const stats = [
    { label: "Total Meetings", value: demoMeetings.length, icon: BarChart3, color: "text-brand-violet" },
    { label: "Hours Saved", value: `${Math.round(totalHours * 0.6)}h`, icon: Zap, color: "text-brand-cyan" },
    { label: "Actions Completed", value: completedItems.length, icon: CheckCircle2, color: "text-brand-emerald" },
    { label: "Decisions Made", value: allDecisions.length, icon: Target, color: "text-brand-amber" },
  ];

  // Meeting volume: group by week
  const weeklyData = demoWeeklyDigests.map((w) => ({
    label: new Date(w.weekOf).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    meetings: w.totalMeetings,
    hours: w.totalHours,
  })).reverse();
  const maxMeetings = Math.max(...weeklyData.map((w) => w.meetings));

  // Time breakdown by folder
  const folderTime: Record<string, number> = {};
  demoMeetings.forEach((m) => {
    const folder = m.folder ?? "Other";
    folderTime[folder] = (folderTime[folder] ?? 0) + m.duration;
  });
  const folderEntries = Object.entries(folderTime).sort((a, b) => b[1] - a[1]);
  const totalTime = folderEntries.reduce((s, [, v]) => s + v, 0);
  const folderColors = ["bg-brand-violet", "bg-brand-cyan", "bg-brand-emerald", "bg-brand-amber", "bg-brand-rose", "bg-brand-slate", "bg-brand-violet-light", "bg-muted-foreground"];

  // Talk time per participant
  const participantTime: Record<string, number> = {};
  demoMeetings.forEach((m) =>
    m.participants.forEach((p) => {
      participantTime[p.name] = (participantTime[p.name] ?? 0) + p.talkTime;
    })
  );
  const participantEntries = Object.entries(participantTime).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxTalkTime = Math.max(...participantEntries.map(([, v]) => v));

  // Action item completion
  const completionRate = allItems.length > 0 ? Math.round((completedItems.length / allItems.length) * 100) : 0;

  // Sentiment trends
  const sentimentData = demoMeetings
    .filter((m) => m.sentiment != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      label: m.title.length > 20 ? m.title.slice(0, 20) + "..." : m.title,
      value: m.sentiment!,
    }));
  const maxSentiment = 100;

  // Top collaborators
  const collaboratorCount: Record<string, number> = {};
  demoMeetings.forEach((m) =>
    m.participants.forEach((p) => {
      if (p.name !== "You" && !p.name.startsWith("Team")) {
        collaboratorCount[p.name] = (collaboratorCount[p.name] ?? 0) + 1;
      }
    })
  );
  const topCollaborators = Object.entries(collaboratorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Meeting insights and productivity metrics
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting Volume */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Meeting Volume</h2>
          <div className="flex items-end gap-3 h-40">
            {weeklyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-foreground">{w.meetings}</span>
                <div
                  className="w-full bg-brand-violet rounded-t-md transition-all"
                  style={{ height: `${(w.meetings / maxMeetings) * 120}px` }}
                />
                <span className="text-[10px] text-muted-foreground text-center">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Time Breakdown</h2>
          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-6 mb-4">
            {folderEntries.map(([folder, time], i) => (
              <div
                key={folder}
                className={`${folderColors[i % folderColors.length]} transition-all`}
                style={{ width: `${(time / totalTime) * 100}%` }}
                title={`${folder}: ${formatHours(time)}h`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {folderEntries.map(([folder, time], i) => (
              <div key={folder} className="flex items-center gap-2 text-xs">
                <div className={`w-2.5 h-2.5 rounded-full ${folderColors[i % folderColors.length]}`} />
                <span className="text-muted-foreground flex-1">{folder}</span>
                <span className="font-medium text-foreground">{formatHours(time)}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Talk Time Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Talk Time Distribution</h2>
          <div className="space-y-2.5">
            {participantEntries.map(([name, time]) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">{name}</span>
                  <span className="text-muted-foreground">{Math.round(time / 60)}m</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-brand-cyan rounded-full h-2 transition-all"
                    style={{ width: `${(time / maxTalkTime) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Item Completion */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Action Item Completion</h2>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" className="text-muted" strokeWidth="10" />
                <circle
                  cx="64" cy="64" r="56"
                  fill="none"
                  stroke="currentColor"
                  className="text-brand-emerald"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(completionRate / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{completionRate}%</span>
                <span className="text-[10px] text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">{completedItems.length}</div>
              <div className="text-[10px] text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{allItems.filter((a) => a.status === "in_progress").length}</div>
              <div className="text-[10px] text-muted-foreground">In Progress</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{allItems.filter((a) => a.status === "pending").length}</div>
              <div className="text-[10px] text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>

        {/* Sentiment Trends */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Sentiment Trends</h2>
          <div className="relative h-40">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((v) => (
              <div
                key={v}
                className="absolute left-0 right-0 border-t border-border"
                style={{ bottom: `${v}%` }}
              >
                <span className="absolute -left-0 -top-2 text-[9px] text-muted-foreground">{v}</span>
              </div>
            ))}
            {/* Line chart via SVG */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={sentimentData
                  .map((d, i) => {
                    const x = (i / (sentimentData.length - 1)) * 100;
                    const y = 100 - d.value;
                    return `${x}%,${y}%`;
                  })
                  .join(" ")}
                vectorEffect="non-scaling-stroke"
              />
              {sentimentData.map((d, i) => {
                const x = (i / (sentimentData.length - 1)) * 100;
                const y = 100 - d.value;
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="white"
                    stroke="#7C3AED"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between mt-2">
            {sentimentData.map((d, i) => (
              <div key={i} className="text-center" style={{ width: `${100 / sentimentData.length}%` }}>
                <div className="text-[9px] text-muted-foreground truncate px-0.5">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Collaborators */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Top Collaborators</h2>
          <div className="space-y-3">
            {topCollaborators.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-violet/10 flex items-center justify-center text-xs font-medium text-brand-violet shrink-0">
                  {name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{name}</div>
                  <div className="text-xs text-muted-foreground">{count} meetings together</div>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
