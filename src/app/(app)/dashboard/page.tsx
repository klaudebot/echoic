"use client";

import { useState } from "react";
import { AppLink } from "@/components/DemoContext";
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
  Search,
} from "lucide-react";

const onboardingSteps = [
  {
    id: "connect",
    title: "Connect your calendar",
    description: "Link Google Calendar or Outlook so Echoic can auto-join your meetings.",
    icon: Calendar,
    cta: "Connect Calendar",
    href: "/integrations",
  },
  {
    id: "record",
    title: "Record your first meeting",
    description: "Upload a recording, start a live recording, or let Echoic join your next call.",
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

export default function DashboardPage() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completedSteps.length / onboardingSteps.length) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-3xl text-foreground">Welcome to Echoic</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Let&apos;s get you set up. Complete these steps to start capturing meeting intelligence.
        </p>
      </div>

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

      {/* Empty Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Meetings" value="0" icon={Calendar} accent="brand-violet" />
        <StatCard label="Hours Recorded" value="0h" icon={Clock} accent="brand-cyan" />
        <StatCard label="Action Items" value="0" icon={ListChecks} accent="brand-emerald" />
        <StatCard label="Coach Score" value="--" icon={Sparkles} accent="brand-violet" />
      </div>
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
