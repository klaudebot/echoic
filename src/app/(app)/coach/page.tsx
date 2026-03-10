"use client";

import { useMemo } from "react";
import {
  Sparkles,
  Mic,
  Volume2,
  Gauge,
  HelpCircle,
  Timer,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Zap,
  Target,
  Brain,
} from "lucide-react";
import { demoCoachMetrics, demoMeetings, demoWeeklyDigests } from "@/lib/demo-data";
import { AppLink } from "@/components/DemoContext";

function getMeetingTitle(meetingId: string): string {
  return demoMeetings.find((m) => m.id === meetingId)?.title ?? meetingId;
}

function getMeetingDate(meetingId: string): string {
  const m = demoMeetings.find((m) => m.id === meetingId);
  if (!m) return "";
  return new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorClass =
    score >= 80
      ? "stroke-brand-emerald"
      : score >= 60
      ? "stroke-brand-violet"
      : score >= 40
      ? "stroke-brand-amber"
      : "stroke-brand-rose";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClass}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function MetricRating({ value, good, warning }: { value: number; good: boolean; warning: boolean }) {
  if (good) return <span className="text-brand-emerald text-xs font-medium">Good</span>;
  if (warning) return <span className="text-brand-amber text-xs font-medium">Needs Work</span>;
  return <span className="text-brand-rose text-xs font-medium">Improve</span>;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CoachPage() {
  const currentDigest = demoWeeklyDigests[0];
  const coachScore = currentDigest.coachScore;
  const trend = currentDigest.trend;

  // Averages
  const averages = useMemo(() => {
    const metrics = demoCoachMetrics;
    const len = metrics.length;
    return {
      talkRatio: Math.round(metrics.reduce((s, m) => s + m.talkRatio, 0) / len),
      fillerWords: Math.round(metrics.reduce((s, m) => s + m.fillerWords, 0) / len),
      pace: Math.round(metrics.reduce((s, m) => s + m.pace, 0) / len),
      questionsAsked: Math.round((metrics.reduce((s, m) => s + m.questionsAsked, 0) / len) * 10) / 10,
      longestMonologue: Math.round(metrics.reduce((s, m) => s + m.longestMonologue, 0) / len),
      interruptionCount: Math.round((metrics.reduce((s, m) => s + m.interruptionCount, 0) / len) * 10) / 10,
    };
  }, []);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-brand-emerald"
      : trend === "down"
      ? "text-brand-rose"
      : "text-brand-amber";

  const metricCards = [
    {
      label: "Talk Ratio",
      value: `${averages.talkRatio}%`,
      detail: "Target: <40%",
      icon: Mic,
      progress: averages.talkRatio,
      progressMax: 100,
      progressColor:
        averages.talkRatio <= 40 ? "bg-brand-emerald" : averages.talkRatio <= 50 ? "bg-brand-amber" : "bg-brand-rose",
      good: averages.talkRatio <= 40,
      warning: averages.talkRatio > 40 && averages.talkRatio <= 50,
    },
    {
      label: "Filler Words",
      value: `${averages.fillerWords}`,
      detail: "Per meeting avg",
      icon: Volume2,
      progress: averages.fillerWords,
      progressMax: 25,
      progressColor:
        averages.fillerWords <= 8 ? "bg-brand-emerald" : averages.fillerWords <= 15 ? "bg-brand-amber" : "bg-brand-rose",
      good: averages.fillerWords <= 8,
      warning: averages.fillerWords > 8 && averages.fillerWords <= 15,
    },
    {
      label: "Speaking Pace",
      value: `${averages.pace} WPM`,
      detail: "Optimal: 130-150",
      icon: Gauge,
      progress: averages.pace,
      progressMax: 200,
      progressColor:
        averages.pace >= 130 && averages.pace <= 150 ? "bg-brand-emerald" : "bg-brand-amber",
      good: averages.pace >= 130 && averages.pace <= 150,
      warning: !(averages.pace >= 130 && averages.pace <= 150),
    },
    {
      label: "Questions Asked",
      value: `${averages.questionsAsked}`,
      detail: "Per meeting avg",
      icon: HelpCircle,
      progress: averages.questionsAsked,
      progressMax: 20,
      progressColor:
        averages.questionsAsked >= 8 ? "bg-brand-emerald" : averages.questionsAsked >= 5 ? "bg-brand-amber" : "bg-brand-rose",
      good: averages.questionsAsked >= 8,
      warning: averages.questionsAsked >= 5 && averages.questionsAsked < 8,
    },
    {
      label: "Longest Monologue",
      value: `${averages.longestMonologue}s`,
      detail: "Target: <60s",
      icon: Timer,
      progress: averages.longestMonologue,
      progressMax: 180,
      progressColor:
        averages.longestMonologue <= 60 ? "bg-brand-emerald" : averages.longestMonologue <= 90 ? "bg-brand-amber" : "bg-brand-rose",
      good: averages.longestMonologue <= 60,
      warning: averages.longestMonologue > 60 && averages.longestMonologue <= 90,
    },
    {
      label: "Interruptions",
      value: `${averages.interruptionCount}`,
      detail: "Per meeting avg",
      icon: AlertCircle,
      progress: averages.interruptionCount,
      progressMax: 5,
      progressColor:
        averages.interruptionCount <= 1 ? "bg-brand-emerald" : averages.interruptionCount <= 2 ? "bg-brand-amber" : "bg-brand-rose",
      good: averages.interruptionCount <= 1,
      warning: averages.interruptionCount > 1 && averages.interruptionCount <= 2,
    },
  ];

  const tips = [
    {
      icon: MessageSquare,
      title: "Ask, Then Wait",
      description:
        "After asking a question, pause for 3-5 seconds before speaking again. This gives others space to think and respond more thoughtfully.",
      color: "text-brand-violet",
      bg: "bg-brand-violet/10",
    },
    {
      icon: Zap,
      title: "Replace Filler Words",
      description:
        "When you feel an 'um' or 'like' coming, try a brief pause instead. Silence is more powerful than filler and makes you sound more confident.",
      color: "text-brand-cyan",
      bg: "bg-brand-cyan/10",
    },
    {
      icon: Target,
      title: "The 60-Second Rule",
      description:
        "Keep individual speaking turns under 60 seconds in team meetings. If you need more time, break it into segments with check-in questions.",
      color: "text-brand-emerald",
      bg: "bg-brand-emerald/10",
    },
    {
      icon: Brain,
      title: "Active Listening Signals",
      description:
        "Summarize what others say before adding your perspective. 'What I hear you saying is...' builds trust and ensures alignment.",
      color: "text-brand-amber",
      bg: "bg-brand-amber/10",
    },
  ];

  return (
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
          Personalized insights to help you become a more effective communicator.
        </p>
      </div>

      {/* Hero: Overall Score + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
            Overall Coach Score
          </div>
          <CircularGauge score={coachScore} size={180} />
          <div className={`flex items-center gap-1.5 mt-4 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {trend === "up" ? "+4 from last week" : trend === "down" ? "-6 from last week" : "Same as last week"}
            </span>
          </div>
        </div>

        {/* AI Insight */}
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-violet/5 via-card to-brand-cyan/5 border border-brand-violet/20 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-brand-violet/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-brand-violet" />
            </div>
            <span className="text-sm font-semibold text-brand-violet">AI Coach Insight</span>
            <span className="text-xs text-muted-foreground ml-auto">
              Week of {new Date(currentDigest.weekOf).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <p className="text-foreground leading-relaxed flex-1">{currentDigest.insight}</p>
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Meetings</div>
              <div className="text-lg font-semibold text-foreground">{currentDigest.totalMeetings}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Hours</div>
              <div className="text-lg font-semibold text-foreground">{currentDigest.totalHours}h</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Decisions Made</div>
              <div className="text-lg font-semibold text-foreground">{currentDigest.decisionsLogged}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h2 className="font-heading text-lg text-foreground mb-3">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{card.label}</span>
                  </div>
                  <MetricRating value={0} good={card.good} warning={card.warning} />
                </div>
                <div className="text-3xl font-bold text-foreground">{card.value}</div>
                <ProgressBar
                  value={card.progress}
                  max={card.progressMax}
                  color={card.progressColor}
                />
                <div className="text-xs text-muted-foreground">{card.detail}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-heading text-lg text-foreground">Weekly Trend</h2>
        </div>
        <div className="flex items-end justify-center gap-6 h-48">
          {[...demoWeeklyDigests].reverse().map((digest, i) => {
            const height = (digest.coachScore / 100) * 160;
            const isLatest = i === demoWeeklyDigests.length - 1;
            return (
              <div key={digest.weekOf} className="flex flex-col items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{digest.coachScore}</span>
                <div
                  className={`w-16 sm:w-20 rounded-t-lg transition-all duration-500 ${
                    isLatest
                      ? "bg-gradient-to-t from-brand-violet to-brand-violet-light"
                      : "bg-muted"
                  }`}
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(digest.weekOf).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Meeting Breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-heading text-lg text-foreground">Per-Meeting Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Meeting
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Talk %
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Fillers
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Pace
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Questions
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Monologue
                </th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Clarity
                </th>
              </tr>
            </thead>
            <tbody>
              {demoCoachMetrics.map((metric) => {
                const talkColor =
                  metric.talkRatio <= 40
                    ? "text-brand-emerald"
                    : metric.talkRatio <= 50
                    ? "text-brand-amber"
                    : "text-brand-rose";
                const fillerColor =
                  metric.fillerWords <= 8
                    ? "text-brand-emerald"
                    : metric.fillerWords <= 15
                    ? "text-brand-amber"
                    : "text-brand-rose";
                const paceColor =
                  metric.pace >= 130 && metric.pace <= 150
                    ? "text-brand-emerald"
                    : "text-brand-amber";
                const monoColor =
                  metric.longestMonologue <= 60
                    ? "text-brand-emerald"
                    : metric.longestMonologue <= 90
                    ? "text-brand-amber"
                    : "text-brand-rose";

                return (
                  <tr
                    key={metric.meetingId}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <AppLink
                        href={`/meetings/${metric.meetingId}`}
                        className="text-brand-violet hover:underline font-medium truncate block max-w-[200px]"
                      >
                        {getMeetingTitle(metric.meetingId)}
                      </AppLink>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {getMeetingDate(metric.meetingId)}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${talkColor}`}>
                      {metric.talkRatio}%
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${fillerColor}`}>
                      {metric.fillerWords}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${paceColor}`}>
                      {metric.pace}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">
                      {metric.questionsAsked}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${monoColor}`}>
                      {metric.longestMonologue}s
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${
                          metric.clarity >= 8
                            ? "text-brand-emerald"
                            : metric.clarity >= 6
                            ? "text-brand-amber"
                            : "text-brand-rose"
                        }`}
                      >
                        {metric.clarity}/10
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvement Tips */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-brand-amber" />
          <h2 className="font-heading text-lg text-foreground">Improvement Tips</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.title}
                className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start hover:border-brand-violet/20 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${tip.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${tip.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
