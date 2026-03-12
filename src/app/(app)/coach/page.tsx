"use client";

import { useState, useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { useMeetings } from "@/hooks/use-meetings";
import { type Meeting } from "@/lib/meeting-store";
import {
  Sparkles,
  Mic,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Target,
  ListChecks,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Zap,
  Brain,
  Activity,
  Timer,
  Award,
} from "lucide-react";
import { PlanGate } from "@/components/PlanGate";

// ─── Types ───

interface MeetingMetrics {
  meetingId: string;
  title: string;
  date: string;
  duration: number;
  wordCount: number;
  wordsPerMinute: number;
  sentenceCount: number;
  avgSentenceLength: number;
  segmentCount: number;
  actionItemCount: number;
  decisionCount: number;
  keyPointCount: number;
  hasTranscript: boolean;
}

interface WeeklyStats {
  weekOf: string;
  meetings: number;
  hours: number;
  actionItemsCreated: number;
  actionItemsCompleted: number;
  decisions: number;
  avgWordsPerMinute: number;
  score: number;
  trend: "up" | "down" | "stable";
}

// ─── Metrics computation ───

function computeMetrics(meeting: Meeting): MeetingMetrics {
  const text = meeting.transcript?.text ?? "";
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const durationMinutes = (meeting.transcript?.duration ?? meeting.duration ?? 0) / 60;

  return {
    meetingId: meeting.id,
    title: meeting.title,
    date: meeting.createdAt,
    duration: meeting.transcript?.duration ?? meeting.duration ?? 0,
    wordCount: words.length,
    wordsPerMinute: durationMinutes > 0 ? Math.round(words.length / durationMinutes) : 0,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    segmentCount: meeting.transcript?.segments?.length ?? 0,
    actionItemCount: (meeting.actionItems ?? []).length,
    decisionCount: (meeting.decisions ?? []).length,
    keyPointCount: (meeting.keyPoints ?? []).length,
    hasTranscript: !!meeting.transcript?.text,
  };
}

function groupByWeek(meetings: Meeting[]): Map<string, Meeting[]> {
  const weeks = new Map<string, Meeting[]>();

  for (const m of meetings) {
    const date = new Date(m.createdAt);
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const weekKey = monday.toISOString().split("T")[0];

    if (!weeks.has(weekKey)) weeks.set(weekKey, []);
    weeks.get(weekKey)!.push(m);
  }

  return weeks;
}

function computeWeeklyStats(weekOf: string, meetings: Meeting[], prevScore: number | null): WeeklyStats {
  let totalSeconds = 0;
  let totalWords = 0;
  let totalMinutes = 0;
  let actionItems = 0;
  let completedActions = 0;
  let decisions = 0;

  for (const m of meetings) {
    const dur = m.transcript?.duration ?? m.duration ?? 0;
    totalSeconds += dur;
    const durationMins = dur / 60;
    totalMinutes += durationMins;

    const text = m.transcript?.text ?? "";
    totalWords += text.split(/\s+/).filter((w) => w.length > 0).length;

    for (const item of m.actionItems ?? []) {
      actionItems++;
      if (item.completed) completedActions++;
    }
    decisions += (m.decisions ?? []).length;
  }

  const avgWPM = totalMinutes > 0 ? Math.round(totalWords / totalMinutes) : 0;

  // Compute a coaching score based on:
  // - Meeting productivity (decisions + action items per hour)
  // - Action item completion rate
  // - Having transcripts
  const hours = totalSeconds / 3600;
  const productivityPerHour = hours > 0 ? (decisions + actionItems) / hours : 0;
  const completionRate = actionItems > 0 ? completedActions / actionItems : 0;
  const transcriptRate = meetings.filter((m) => m.transcript?.text).length / Math.max(meetings.length, 1);

  // Score out of 100
  const rawScore = Math.min(
    100,
    Math.round(
      productivityPerHour * 8 + // ~5 items/hr = 40 points
      completionRate * 30 + // full completion = 30 points
      transcriptRate * 20 + // all transcribed = 20 points
      Math.min(meetings.length * 2, 10) // up to 10 points for volume
    )
  );

  const score = Math.max(rawScore, 10); // minimum 10
  const trend: "up" | "down" | "stable" =
    prevScore === null ? "stable" : score > prevScore + 3 ? "up" : score < prevScore - 3 ? "down" : "stable";

  return {
    weekOf,
    meetings: meetings.length,
    hours: Math.round(hours * 10) / 10,
    actionItemsCreated: actionItems,
    actionItemsCompleted: completedActions,
    decisions,
    avgWordsPerMinute: avgWPM,
    score,
    trend,
  };
}

// ─── Helper components ───

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg bg-${accent}/10 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-${accent}`} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-0.5">{subtext}</div>}
    </div>
  );
}

function TrendBadge({ trend, score }: { trend: "up" | "down" | "stable"; score: number }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-emerald">
        <TrendingUp className="w-3.5 h-3.5" />
        Improving
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-rose">
        <TrendingDown className="w-3.5 h-3.5" />
        Needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Minus className="w-3.5 h-3.5" />
      Stable
    </span>
  );
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 75 ? "text-brand-emerald" : score >= 50 ? "text-brand-amber" : "text-brand-rose";
  const strokeColor =
    score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#F43F5E";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${color}`}>{score}</span>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatWeek(iso: string): string {
  try {
    const date = new Date(iso);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } catch {
    return iso;
  }
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function generateInsight(stats: WeeklyStats): string {
  const parts: string[] = [];

  if (stats.hours > 8) {
    parts.push(`Heavy meeting week with ${stats.hours}h of meetings. Consider making some async.`);
  } else if (stats.hours > 0) {
    parts.push(`${stats.hours}h in meetings this week — a manageable load.`);
  }

  if (stats.actionItemsCreated > 0) {
    const rate = stats.actionItemsCompleted / stats.actionItemsCreated;
    if (rate >= 0.7) {
      parts.push(`Strong action item follow-through at ${Math.round(rate * 100)}% completion.`);
    } else if (rate >= 0.4) {
      parts.push(`Action item completion at ${Math.round(rate * 100)}% — try closing items before creating new ones.`);
    } else {
      parts.push(`Low action item completion (${Math.round(rate * 100)}%). Consider reducing scope or delegating more.`);
    }
  }

  if (stats.avgWordsPerMinute > 160) {
    parts.push("Your pace is quite fast — consider slowing down for clarity.");
  } else if (stats.avgWordsPerMinute > 0 && stats.avgWordsPerMinute < 100) {
    parts.push("Transcript pace is slow — this may indicate audio quality issues or long pauses.");
  }

  if (stats.decisions > 0 && stats.meetings > 0) {
    const dpm = stats.decisions / stats.meetings;
    if (dpm >= 2) {
      parts.push("Great decision velocity — meetings are productive.");
    } else if (dpm < 0.5) {
      parts.push("Few decisions logged. Consider setting decision agendas before meetings.");
    }
  }

  return parts.join(" ") || "Keep recording meetings to unlock more personalized insights.";
}

// ─── Main page ───

export default function CoachPage() {
  const { meetings, loading } = useMeetings();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const loaded = !loading;
  const completedMeetings = useMemo(
    () => meetings.filter((m) => m.status === "completed"),
    [meetings]
  );
  const hasMeetings = completedMeetings.length > 0;

  // Compute per-meeting metrics
  const meetingMetrics = useMemo(
    () => completedMeetings.map(computeMetrics),
    [completedMeetings]
  );

  // Compute weekly stats
  const weeklyStats = useMemo(() => {
    const weeks = groupByWeek(completedMeetings);
    const sortedWeeks = Array.from(weeks.entries()).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );

    const stats: WeeklyStats[] = [];
    for (let i = sortedWeeks.length - 1; i >= 0; i--) {
      const [weekOf, weekMeetings] = sortedWeeks[i];
      const prevScore = stats.length > 0 ? stats[stats.length - 1].score : null;
      stats.push(computeWeeklyStats(weekOf, weekMeetings, prevScore));
    }

    return stats.reverse(); // newest first
  }, [completedMeetings]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalHours = completedMeetings.reduce((sum, m) => {
      return sum + ((m.transcript?.duration ?? m.duration ?? 0) / 3600);
    }, 0);
    const totalActions = completedMeetings.reduce(
      (sum, m) => sum + (m.actionItems ?? []).length,
      0
    );
    const completedActions = completedMeetings.reduce(
      (sum, m) => sum + (m.actionItems ?? []).filter((a) => a.completed).length,
      0
    );
    const totalDecisions = completedMeetings.reduce(
      (sum, m) => sum + (m.decisions ?? []).length,
      0
    );
    const totalWords = meetingMetrics.reduce((sum, m) => sum + m.wordCount, 0);
    const totalMinutes = completedMeetings.reduce(
      (sum, m) => sum + ((m.transcript?.duration ?? m.duration ?? 0) / 60),
      0
    );

    return {
      meetings: completedMeetings.length,
      hours: Math.round(totalHours * 10) / 10,
      totalActions,
      completedActions,
      completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      totalDecisions,
      avgWPM: totalMinutes > 0 ? Math.round(totalWords / totalMinutes) : 0,
    };
  }, [completedMeetings, meetingMetrics]);

  const currentScore = weeklyStats[0]?.score ?? 0;
  const currentTrend = weeklyStats[0]?.trend ?? "stable";

  return (
    <PlanGate feature="coach">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet via-brand-cyan to-brand-emerald flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">AI Meeting Coach</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalized insights to help you run better, more productive meetings.
        </p>
      </div>

      {/* Empty state */}
      {loaded && !hasMeetings && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-brand-violet" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">No coaching insights yet</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Record meetings to unlock AI coaching insights. Reverbic analyzes your meeting patterns, productivity, and communication to help you improve.
          </p>
          <AppLink
            href="/meetings/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Upload a Recording
          </AppLink>
        </div>
      )}

      {/* Content */}
      {loaded && hasMeetings && (
        <>
          {/* Score + Weekly Insight */}
          {weeklyStats.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing score={currentScore} size={88} />
                  <span className="text-xs text-muted-foreground font-medium">Coach Score</span>
                  <TrendBadge trend={currentTrend} score={currentScore} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-foreground mb-1">
                    This Week&apos;s Insight
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {generateInsight(weeklyStats[0])}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {weeklyStats[0].meetings} meeting{weeklyStats[0].meetings !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {weeklyStats[0].hours}h
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {weeklyStats[0].decisions} decision{weeklyStats[0].decisions !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ListChecks className="w-3 h-3" />
                      {weeklyStats[0].actionItemsCompleted}/{weeklyStats[0].actionItemsCreated} actions done
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aggregate Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Meetings"
              value={String(aggregateStats.meetings)}
              subtext="All time"
              icon={Calendar}
              accent="brand-violet"
            />
            <MetricCard
              label="Hours"
              value={`${aggregateStats.hours}h`}
              subtext="Recorded"
              icon={Clock}
              accent="brand-cyan"
            />
            <MetricCard
              label="Completion Rate"
              value={`${aggregateStats.completionRate}%`}
              subtext={`${aggregateStats.completedActions}/${aggregateStats.totalActions} actions`}
              icon={ListChecks}
              accent="brand-emerald"
            />
            <MetricCard
              label="Decisions"
              value={String(aggregateStats.totalDecisions)}
              subtext={`${(aggregateStats.meetings > 0 ? (aggregateStats.totalDecisions / aggregateStats.meetings).toFixed(1) : "0")} per meeting`}
              icon={Target}
              accent="brand-rose"
            />
          </div>

          {/* Weekly Breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Weekly Breakdown</h2>
            <div className="space-y-3">
              {weeklyStats.map((week) => {
                const isExpanded = expandedWeek === week.weekOf;
                const weekMeetings = meetingMetrics.filter((m) => {
                  const date = new Date(m.date);
                  const weekStart = new Date(week.weekOf);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekEnd.getDate() + 7);
                  return date >= weekStart && date < weekEnd;
                });

                return (
                  <div
                    key={week.weekOf}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : week.weekOf)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">
                          {formatWeek(week.weekOf)}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{week.meetings} meeting{week.meetings !== 1 ? "s" : ""}</span>
                          <span>&middot;</span>
                          <span>{week.hours}h</span>
                          <span>&middot;</span>
                          <span>{week.decisions} decisions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <TrendBadge trend={week.trend} score={week.score} />
                        <ScoreRing score={week.score} size={44} />
                      </div>
                    </button>

                    {isExpanded && weekMeetings.length > 0 && (
                      <div className="border-t border-border">
                        {weekMeetings.map((m) => (
                          <AppLink
                            key={m.meetingId}
                            href={`/meetings/${m.meetingId}`}
                            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/10 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-3.5 h-3.5 text-brand-violet" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {m.title}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                <span>{formatDate(m.date)}</span>
                                {m.duration > 0 && (
                                  <span>{formatDuration(m.duration)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                              {m.decisionCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Target className="w-3 h-3 text-brand-violet" />
                                  {m.decisionCount}
                                </span>
                              )}
                              {m.actionItemCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <ListChecks className="w-3 h-3 text-brand-rose" />
                                  {m.actionItemCount}
                                </span>
                              )}
                              {m.wordsPerMinute > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-brand-cyan" />
                                  {m.wordsPerMinute} wpm
                                </span>
                              )}
                            </div>
                          </AppLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-brand-violet" />
              <h2 className="text-sm font-semibold text-foreground">Coaching Tips</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TipCard
                icon={Zap}
                title="Set a decision agenda"
                description="Meetings with a clear decision list produce 2x more actionable outcomes."
              />
              <TipCard
                icon={Timer}
                title="Keep it under 30 minutes"
                description="Shorter meetings have higher decision density. Use async updates for status reports."
              />
              <TipCard
                icon={ListChecks}
                title="Close before you open"
                description="Review last meeting's action items before creating new ones. It improves follow-through by 40%."
              />
              <TipCard
                icon={Award}
                title="End with a recap"
                description="Meetings that end with a verbal summary of decisions have 60% higher execution rates."
              />
            </div>
          </div>
        </>
      )}
    </div>
    </PlanGate>
  );
}

function TipCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <div className="w-7 h-7 rounded-md bg-brand-violet/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-brand-violet" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
