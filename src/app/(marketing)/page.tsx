"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─── Waveform Visualizer ─────────────────────── */
function WaveformVisualizer() {
  const bars = 32;
  return (
    <div className="flex items-center justify-center gap-[3px] h-24">
      {[...Array(bars)].map((_, i) => {
        const center = bars / 2;
        const dist = Math.abs(i - center) / center;
        const maxH = 96 * (1 - dist * 0.6);
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-brand-violet to-brand-cyan"
            style={{
              height: `${maxH}px`,
              animation: `wave-pulse ${1 + Math.random() * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.06}s`,
              opacity: 0.5 + (1 - dist) * 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Scroll Reveal Hook ─────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

/* ─── Feature Data ────────────────────────────── */
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    title: "AI Transcription",
    description: "99.2% accuracy across 50+ languages. Real-time transcription with speaker diarization and smart punctuation.",
    color: "brand-violet",
    gradient: "from-brand-violet/10 to-brand-violet/5",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Smart Summaries",
    description: "Key points, decisions, and action items auto-extracted in seconds. Never write meeting notes again.",
    color: "brand-cyan",
    gradient: "from-brand-cyan/10 to-brand-cyan/5",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Meeting Coach",
    description: "Real-time speaking analytics: talk ratio, filler words, pace, and clarity. Get personalized improvement tips.",
    whyItMatters: "Teams using Meeting Coach reduce filler words by 40% and improve talk-to-listen ratios within 2 weeks.",
    color: "brand-emerald",
    gradient: "from-brand-violet/10 via-brand-emerald/10 to-brand-cyan/5",
    badge: "Only on Reverbic",
    exclusive: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Decision Tracker",
    description: "A living log of every decision across all your meetings. Never lose track of what was agreed upon.",
    whyItMatters: "No more 'didn't we already decide this?' moments. Every decision is tracked, timestamped, and searchable.",
    color: "brand-amber",
    gradient: "from-brand-violet/10 via-brand-amber/10 to-brand-cyan/5",
    badge: "Only on Reverbic",
    exclusive: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25H12" />
      </svg>
    ),
    title: "Smart Clips",
    description: "Auto-generated shareable audio clips of key moments. Share decisions and insights without rewatching entire meetings.",
    whyItMatters: "Async teams save 5+ hours per week by sharing 30-second clips instead of scheduling recap calls.",
    color: "brand-rose",
    gradient: "from-brand-violet/10 via-brand-rose/10 to-brand-cyan/5",
    badge: "Only on Reverbic",
    exclusive: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    title: "Copy for AI",
    description: "One-click AI-formatted exports: dev tasks, email recaps, exec briefs, standup updates. Paste into ChatGPT, Claude, or Codex.",
    whyItMatters: "Turn meeting outcomes into ready-to-use prompts. Your meetings become the input layer for every AI tool in your stack.",
    color: "brand-violet",
    gradient: "from-brand-violet/10 via-brand-cyan/10 to-brand-emerald/5",
    badge: "Only on Reverbic",
    exclusive: true,
  },
];

const colorMap: Record<string, string> = {
  "brand-violet": "text-brand-violet bg-brand-violet/10",
  "brand-cyan": "text-brand-cyan bg-brand-cyan/10",
  "brand-emerald": "text-brand-emerald bg-brand-emerald/10",
  "brand-amber": "text-brand-amber bg-brand-amber/10",
  "brand-rose": "text-brand-rose bg-brand-rose/10",
};

/* ─── Pricing ─────────────────────────────────── */
const plans = [
  {
    name: "Starter",
    monthlyPrice: "$17.97",
    yearlyPrice: "$9.97",
    period: "/seat/mo",
    description: "For professionals who run meetings",
    features: [
      "30 hours of transcription / month",
      "AI summaries + action items",
      "3 integrations",
      "Unlimited transcript history",
    ],
    cta: "Get Started",
    highlighted: false,
    tier: "starter",
  },
  {
    name: "Pro",
    monthlyPrice: "$28.97",
    yearlyPrice: "$18.97",
    period: "/seat/mo",
    description: "For power users who live in meetings",
    features: [
      "Unlimited transcription",
      "AI Coach",
      "Decision Tracker",
      "Smart Clips",
      "All integrations",
      "Advanced analytics",
    ],
    cta: "Get Started",
    highlighted: true,
    tier: "pro",
  },
  {
    name: "Team",
    monthlyPrice: "$38.97",
    yearlyPrice: "$24.97",
    period: "/seat/mo",
    description: "For teams that need full control",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Admin controls & dashboard",
      "API access",
      "Priority support",
      "Custom vocabulary",
    ],
    cta: "Get Started",
    highlighted: false,
    tier: "team",
  },
];

/* ─── Page ────────────────────────────────────── */
export default function MarketingPage() {
  const [billingInterval, setBillingInterval] = useState<"yearly" | "monthly">("yearly");

  return (
    <>
      {/* ──── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gray-500/[0.03] blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gray-400/[0.03] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 border border-brand-violet/20 bg-brand-violet/5 px-4 py-1.5 text-sm font-medium text-brand-violet">
              <span className="recording-dot inline-block h-2 w-2 rounded-full bg-brand-violet" />
              AI-Powered Meeting Intelligence
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-heading tracking-tight sm:text-6xl lg:text-7xl">
              Your meetings,{" "}
              <span className="gradient-text">remembered.</span>
            </h1>

            {/* Subtext */}
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              AI transcription with 99.2% accuracy. Smart summaries, action items, and
              decision tracking — all generated in real time. Stop losing insights to bad notes.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center bg-brand-violet px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-violet/25 hover:bg-brand-violet/90 transition-all hover:shadow-xl hover:shadow-brand-violet/30 rounded-[4px]"
              >
                Start Free
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a href="#pricing" className="inline-flex items-center justify-center border border-border bg-white px-8 py-3 text-base font-semibold text-foreground shadow-sm hover:bg-muted/50 transition-all rounded-[4px]">
                View Pricing
              </a>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">99.2%</span> accuracy
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">50+</span> languages
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">&lt;2 min</span> setup
              </div>
            </div>

            {/* Waveform */}
            <div className="mt-16 w-full max-w-2xl">
              <WaveformVisualizer />
            </div>

            {/* Product Preview Card */}
            <div className="mt-8 w-full max-w-4xl glass-card p-6 shadow-2xl shadow-brand-violet/5 rounded-[4px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground font-mono rounded-[2px]">
                  app.reverbic.ai/meeting/q1-roadmap-review
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[4px] bg-gradient-to-br from-brand-violet/5 to-brand-cyan/5 p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Summary</div>
                  <div className="text-sm text-foreground leading-relaxed">
                    AI features on track for April. Mobile redesign pushed to Q2.
                    Hiring 2 frontend devs approved...
                  </div>
                </div>
                <div className="rounded-[4px] bg-gradient-to-br from-brand-emerald/5 to-brand-cyan/5 p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Action Items</div>
                  <div className="space-y-2">
                    {["Draft 2 frontend JDs", "Finalize pipeline plan", "Update pricing page"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${i === 2 ? "border-brand-emerald bg-brand-emerald" : "border-border"}`}>
                          {i === 2 && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={i === 2 ? "line-through text-muted-foreground" : ""}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[4px] bg-gradient-to-br from-brand-amber/5 to-brand-rose/5 p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Decisions</div>
                  <div className="space-y-2">
                    {["Hire 2 frontend developers", "Approve $50K pipeline budget"].map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <svg className="w-4 h-4 text-brand-amber mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── INTEGRATIONS BAR ─────────────────── */}
      <RevealSection>
        <section className="border-y border-border/50 bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8">
              Works with the tools you already use
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {[
                { name: "Zoom", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.585 4.585A2.08 2.08 0 006.17 4h11.66c.59 0 1.16.21 1.585.585A2.08 2.08 0 0120 6.17v7.66h-4l-4 4v-4H4V6.17c0-.59.21-1.16.585-1.585zM16 10v4h4v3.83a2.08 2.08 0 01-.585 1.585A2.08 2.08 0 0117.83 20H6.17a2.08 2.08 0 01-1.585-.585A2.08 2.08 0 014 17.83V14h8v4l4-4z"/></svg> },
                { name: "Google Meet", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
                { name: "Slack", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z"/></svg> },
                { name: "Notion", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.49 2.37c-.42-.326-.98-.7-2.055-.607L3.48 2.88c-.466.047-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM3.2 1.24l13.542-1c1.635-.14 2.055-.047 3.083.7l4.25 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.632-1.681 1.726l-15.458.933c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.92c0-.84.373-1.54 1.215-1.68z"/></svg> },
                { name: "Teams", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.404 4.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM22.5 9.75a1.5 1.5 0 00-1.5-1.5h-4.5a1.5 1.5 0 00-1.5 1.5v4.5a1.5 1.5 0 001.5 1.5h.75v3l3-3h.75a1.5 1.5 0 001.5-1.5v-4.5zM14.154 6a3 3 0 11-6 0 3 3 0 016 0zM1.5 18a6 6 0 0112 0v.75a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75V18z"/></svg> },
              ].map((item) => (
                <span
                  key={item.name}
                  className="inline-flex items-center gap-2 text-lg font-medium tracking-tight text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none"
                >
                  {item.icon}
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ──── FEATURES ──────────────────────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-violet mb-2">Features</p>
            <h2 className="text-3xl font-heading sm:text-4xl lg:text-5xl">
              Everything your meetings{" "}
              <span className="gradient-text">need</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From real-time transcription to AI coaching, Reverbic captures every detail so you can focus on what matters.
            </p>
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <RevealSection key={i}>
                <div className={`group relative rounded-[4px] p-6 hover:shadow-lg hover:shadow-${f.color}/5 transition-all duration-300 h-full bg-gradient-to-br ${f.gradient} ${
                  f.exclusive
                    ? "border-2 border-transparent bg-clip-padding shadow-md"
                    : "border border-border/50"
                }`}
                  style={f.exclusive ? {
                    borderImage: "linear-gradient(135deg, #7c3aed, #06b6d4) 1",
                    borderImageSlice: 1,
                  } : undefined}
                >
                  {f.badge && (
                    <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-[2px] text-[11px] font-semibold ${
                      f.exclusive
                        ? "bg-gradient-to-r from-brand-violet to-brand-cyan text-white"
                        : "bg-brand-violet/10 text-brand-violet"
                    }`}>
                      {f.badge}
                    </span>
                  )}
                  <div className={`inline-flex rounded-[4px] p-3 ${colorMap[f.color] || "text-brand-violet bg-brand-violet/10"}`}>
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold font-sans text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                  {f.whyItMatters && (
                    <p className="mt-3 text-xs leading-relaxed text-brand-violet font-medium italic">
                      {f.whyItMatters}
                    </p>
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ──── WHY REVERBIC ──────────────────────── */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-[#0a0c10] via-[#111318] to-[#0a0c10] relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-cyan mb-2">Only on Reverbic</p>
            <h2 className="text-3xl font-heading sm:text-4xl lg:text-5xl text-white">
              Why{" "}
              <span className="gradient-text">Reverbic?</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Other tools transcribe. Reverbic transforms how your team communicates.
            </p>
          </RevealSection>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Meeting Coach */}
            <RevealSection>
              <div className="relative h-full rounded-[4px] border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:bg-white/10 transition-all duration-300">
                <div className="inline-flex rounded-[4px] p-3 bg-brand-emerald/20 text-brand-emerald mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold font-sans text-white">Meeting Coach</h3>
                <p className="mt-2 text-base font-medium text-brand-cyan">
                  Most tools transcribe. Reverbic coaches.
                </p>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  Real-time feedback on talk-to-listen ratio, filler words, and speaking pace.
                  Teams see a 40% reduction in filler words and 2x improvement in meeting efficiency
                  within the first month.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="rounded-[3px] bg-brand-emerald/10 px-3 py-1.5">
                    <span className="text-xs font-semibold text-brand-emerald">-40% filler words</span>
                  </div>
                  <div className="rounded-[3px] bg-brand-cyan/10 px-3 py-1.5">
                    <span className="text-xs font-semibold text-brand-cyan">2x efficiency</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Decision Tracker */}
            <RevealSection>
              <div className="relative h-full rounded-[4px] border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:bg-white/10 transition-all duration-300">
                <div className="inline-flex rounded-[4px] p-3 bg-brand-amber/20 text-brand-amber mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold font-sans text-white">Decision Tracker</h3>
                <p className="mt-2 text-base font-medium text-brand-amber">
                  Never lose a decision again.
                </p>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  Every decision is automatically extracted, timestamped, and linked to its meeting context.
                  Track decisions across hundreds of meetings with cross-meeting search, so your team
                  always knows what was agreed and when.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="rounded-[3px] bg-brand-amber/10 px-3 py-1.5">
                    <span className="text-xs font-semibold text-brand-amber">Cross-meeting tracking</span>
                  </div>
                  <div className="rounded-[3px] bg-brand-violet/10 px-3 py-1.5">
                    <span className="text-xs font-semibold text-brand-violet">Auto-linked</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Smart Clips */}
            <RevealSection>
              <div className="relative h-full rounded-[4px] border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:bg-white/10 transition-all duration-300">
                <div className="inline-flex rounded-[4px] p-3 bg-brand-rose/20 text-brand-rose mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25H12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold font-sans text-white">Smart Clips</h3>
                <p className="mt-2 text-base font-medium text-brand-rose">
                  Share the moment, skip the meeting.
                </p>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  AI automatically identifies key moments and generates shareable 30-second audio clips.
                  Async teams save 5+ hours per week by sharing clips instead of scheduling recap calls
                  or watching full recordings.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="rounded-[3px] bg-brand-rose/10 px-3 py-1.5">
                    <span className="text-xs font-semibold text-brand-rose">5+ hrs saved/week</span>
                  </div>
                  <div className="rounded-[3px] bg-brand-cyan/10 px-3 py-1.5">
                    <span className="text-xs font-semibold text-brand-cyan">Async-first</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──────────────────────── */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-cyan mb-2">How It Works</p>
            <h2 className="text-3xl font-heading sm:text-4xl lg:text-5xl">
              Three steps to{" "}
              <span className="gradient-text">meeting clarity</span>
            </h2>
          </RevealSection>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Record",
                description: "Join your meeting as usual. Reverbic connects to Zoom, Google Meet, or Teams and starts recording automatically. Or upload any audio file.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                ),
                color: "brand-violet",
              },
              {
                step: "02",
                title: "AI Processes",
                description: "Our AI transcribes in real time with 99.2% accuracy, identifies speakers, and extracts summaries, action items, and decisions instantly.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                color: "brand-cyan",
              },
              {
                step: "03",
                title: "Review & Act",
                description: "Browse searchable transcripts, share smart clips, assign action items, and track decisions. Your meeting knowledge, always accessible.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: "brand-emerald",
              },
            ].map((s, i) => (
              <RevealSection key={i}>
                <div className="relative text-center p-8 rounded-[4px] border border-border/50 bg-card hover:shadow-lg transition-all duration-300">
                  <div className={`inline-flex rounded-[4px] p-4 mb-4 ${colorMap[s.color] || "text-brand-violet bg-brand-violet/10"}`}>
                    {s.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-5xl font-heading text-muted-foreground/10 font-bold">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-semibold font-sans text-foreground">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ──── PRICING ───────────────────────────── */}
      <section id="pricing" className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-violet mb-2">Pricing</p>
            <h2 className="text-3xl font-heading sm:text-4xl lg:text-5xl">
              Simple, transparent{" "}
              <span className="gradient-text">pricing</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. No credit card required.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 bg-card border border-border rounded-full p-1.5">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingInterval === "monthly"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all relative ${
                  billingInterval === "yearly"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="absolute -top-2.5 -right-3 bg-brand-emerald text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  Save up to 44%
                </span>
              </button>
            </div>
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const price = billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const showStrikethrough = billingInterval === "yearly" && plan.monthlyPrice !== plan.yearlyPrice && plan.monthlyPrice !== "$0";

              return (
              <RevealSection key={i}>
                <div
                  className={`relative flex flex-col h-full rounded-[4px] p-8 transition-all duration-300 ${
                    plan.highlighted
                      ? "border-2 border-brand-violet bg-card shadow-xl shadow-brand-violet/10 scale-[1.02]"
                      : "border border-border/50 bg-card hover:shadow-lg"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-violet px-4 py-1 text-xs font-semibold text-white rounded-[2px]">
                      Most Popular
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold font-sans text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      {showStrikethrough && (
                        <span className="text-lg font-medium text-muted-foreground line-through mr-1">{plan.monthlyPrice}</span>
                      )}
                      <span className="text-4xl font-bold font-sans text-foreground">{price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    {billingInterval === "yearly" && plan.tier && (
                      <p className="text-xs text-brand-emerald font-medium mt-1">
                        billed annually
                      </p>
                    )}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-foreground">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/sign-up?plan=${plan.tier}&interval=${billingInterval}`}
                    className={`mt-8 block rounded-[4px] py-3 text-center text-sm font-semibold transition-all ${
                      plan.highlighted
                        ? "bg-brand-violet text-white shadow-lg shadow-brand-violet/25 hover:bg-brand-violet/90"
                        : "bg-muted text-foreground hover:bg-muted/70"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </RevealSection>
              );
            })}
          </div>

          {/* ──── FREE TIER BANNER ─────────────── */}
          <RevealSection className="mt-8 max-w-5xl mx-auto">
            <div className="rounded-[4px] border border-border/50 bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h3 className="text-xl font-semibold font-sans text-foreground">Free</h3>
                  <span className="text-3xl font-bold font-sans text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  For individuals getting started — no credit card required
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["3 hrs transcription / mo", "Basic summaries", "1 integration", "10 meetings / mo"].map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-brand-emerald shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
              <Link
                href="/sign-up"
                className="shrink-0 rounded-[4px] bg-muted px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70 transition-all"
              >
                Start Free
              </Link>
            </div>
          </RevealSection>

          {/* ──── COMPARISON CHART ──────────────── */}
          <RevealSection className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-heading sm:text-3xl">
                Compare all <span className="gradient-text">features</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                See exactly what you get with each plan
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-4 text-left font-semibold text-foreground w-[40%]">Feature</th>
                    <th className="py-4 px-4 text-center font-semibold text-foreground">Starter</th>
                    <th className="py-4 px-4 text-center font-semibold text-brand-violet">Pro</th>
                    <th className="py-4 px-4 text-center font-semibold text-foreground">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { category: "Recording & Transcription" },
                    { feature: "Transcription hours / month", starter: "30 hrs", pro: "Unlimited", team: "Unlimited" },
                    { feature: "Transcription accuracy", starter: "99.2%", pro: "99.2%", team: "99.2%" },
                    { feature: "Speaker identification", starter: true, pro: true, team: true },
                    { feature: "Upload audio / video files", starter: true, pro: true, team: true },
                    { feature: "Live recording", starter: true, pro: true, team: true },
                    { feature: "Meetings per month", starter: "100", pro: "Unlimited", team: "Unlimited" },
                    { feature: "Custom vocabulary", starter: false, pro: false, team: true },

                    { category: "AI & Meeting Notes" },
                    { feature: "AI summaries", starter: true, pro: true, team: true },
                    { feature: "Action item extraction", starter: true, pro: true, team: true },
                    { feature: "Decision tracking", starter: false, pro: true, team: true },
                    { feature: "AI Meeting Coach", starter: false, pro: true, team: true },
                    { feature: "Smart Clips", starter: false, pro: true, team: true },
                    { feature: "Advanced analytics", starter: false, pro: true, team: true },
                    { feature: "Keyword & topic detection", starter: false, pro: true, team: true },
                    { feature: "Sentiment analysis", starter: false, pro: true, team: true },

                    { category: "Collaboration & Sharing" },
                    { feature: "Shareable meeting links", starter: true, pro: true, team: true },
                    { feature: "Team workspace", starter: true, pro: true, team: true },
                    { feature: "Comments & reactions", starter: true, pro: true, team: true },
                    { feature: "Team members", starter: "5", pro: "20", team: "Unlimited" },

                    { category: "Integrations" },
                    { feature: "Integrations", starter: "3", pro: "All", team: "All" },
                    { feature: "Slack notifications", starter: true, pro: true, team: true },
                    { feature: "Calendar sync", starter: true, pro: true, team: true },
                    { feature: "API access", starter: false, pro: false, team: true },
                    { feature: "Webhooks", starter: false, pro: false, team: true },

                    { category: "Security & Admin" },
                    { feature: "SSO / SAML", starter: false, pro: false, team: true },
                    { feature: "Admin dashboard", starter: false, pro: false, team: true },
                    { feature: "Audit logs", starter: false, pro: false, team: true },
                    { feature: "Data retention controls", starter: false, pro: false, team: true },

                    { category: "Support" },
                    { feature: "Email support", starter: true, pro: true, team: true },
                    { feature: "Priority support", starter: false, pro: true, team: true },
                    { feature: "Dedicated account manager", starter: false, pro: false, team: true },

                    { category: "Storage" },
                    { feature: "Storage", starter: "5 GB", pro: "50 GB", team: "100 GB" },
                    { feature: "Transcript history", starter: "Unlimited", pro: "Unlimited", team: "Unlimited" },
                  ].map((row, i) => {
                    if ("category" in row && !("feature" in row)) {
                      return (
                        <tr key={i} className="border-b border-border/50">
                          <td colSpan={4} className="pt-8 pb-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-violet">
                            {row.category}
                          </td>
                        </tr>
                      );
                    }

                    const r = row as { feature: string; starter: boolean | string; pro: boolean | string; team: boolean | string };

                    const renderCell = (value: boolean | string) => {
                      if (value === true) {
                        return (
                          <svg className="w-5 h-5 text-brand-emerald mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        );
                      }
                      if (value === false) {
                        return (
                          <svg className="w-4 h-4 text-muted-foreground/30 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                          </svg>
                        );
                      }
                      return <span className="text-foreground font-medium">{value}</span>;
                    };

                    return (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 text-muted-foreground">{r.feature}</td>
                        <td className="py-3.5 px-4 text-center">{renderCell(r.starter)}</td>
                        <td className="py-3.5 px-4 text-center bg-brand-violet/[0.03]">{renderCell(r.pro)}</td>
                        <td className="py-3.5 px-4 text-center">{renderCell(r.team)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ──── FINAL CTA ─────────────────────────── */}
      <RevealSection>
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[4px] bg-gradient-to-br from-[#0a0c10] via-[#161920] to-[#0a0c10] p-12 sm:p-20 text-center">
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/[0.03] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/[0.02] blur-3xl" />

              <h2 className="relative text-3xl font-heading sm:text-4xl lg:text-5xl text-white">
                Stop losing decisions to bad notes
              </h2>
              <p className="relative mt-4 text-lg text-white/70 max-w-xl mx-auto">
                Join 1,000+ teams who never miss a meeting insight. Start free today.
              </p>
              <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center bg-white px-8 py-3 text-base font-semibold text-brand-deep shadow-lg hover:bg-white/90 transition-all rounded-[4px]"
                >
                  Get Started Free
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <span className="text-sm text-white/50">No credit card required</span>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ──── FOOTER ────────────────────────────── */}
      <footer className="border-t border-border/50 bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="wave-bar w-[3px] rounded-full bg-brand-violet"
                      style={{ height: `${10 + Math.random() * 10}px` }}
                    />
                  ))}
                </div>
                <span className="font-heading text-xl tracking-tight text-foreground">
                  Reverbic
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered meeting transcription and intelligence. Your meetings, remembered.
              </p>
              {/* Social Icons */}
              <div className="mt-4 flex gap-3">
                <a
                  href="https://x.com/reverbic"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-muted text-muted-foreground hover:bg-brand-violet hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/reverbic"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-muted text-muted-foreground hover:bg-brand-violet hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/reverbic"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-muted text-muted-foreground hover:bg-brand-violet hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "/#features" },
                  { label: "Pricing", href: "/#pricing" },
                  { label: "How It Works", href: "/#how-it-works" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "Contact", href: "mailto:hello@reverbic.ai" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold font-sans text-foreground mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 Reverbic. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
