"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

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

/* ─── Testimonials ────────────────────────────── */
const testimonials = [
  {
    quote: "Reverbic saved our team 15 hours per week on meeting notes. The smart summaries are eerily accurate - it catches decisions I didn't even realize we'd made.",
    name: "Sarah Mitchell",
    role: "VP Engineering, ScaleUp",
    avatar: "SM",
  },
  {
    quote: "The Meeting Coach feature transformed how I run standups. My talk-to-listen ratio went from 60% to 30%, and my team is way more engaged now.",
    name: "Daniel Reyes",
    role: "Product Manager, Streamline",
    avatar: "DR",
  },
  {
    quote: "We used to lose track of decisions across 40+ weekly meetings. Reverbic's Decision Tracker is like having an organizational memory. Game-changer for remote teams.",
    name: "Priya Sharma",
    role: "COO, Nexus Health",
    avatar: "PS",
  },
];

/* ─── Pricing ─────────────────────────────────── */
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "For individuals getting started",
    features: [
      "3 hours of transcription / month",
      "Basic summaries",
      "1 integration",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/seat/mo",
    description: "For professionals who run meetings",
    features: [
      "30 hours of transcription / month",
      "AI summaries + action items",
      "3 integrations",
      "Unlimited transcript history",
    ],
    cta: "Start Starter Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
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
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$39",
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
    cta: "Contact Sales",
    highlighted: false,
  },
];

/* ─── Page ────────────────────────────────────── */
export default function MarketingPage() {
  return (
    <>
      {/* ──── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-violet/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-cyan/5 blur-3xl" />
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
              <button className="inline-flex items-center justify-center border border-border bg-white px-8 py-3 text-base font-semibold text-foreground shadow-sm hover:bg-muted/50 transition-all rounded-[4px]">
                <svg className="mr-2 w-5 h-5 text-brand-violet" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">1,000+</span> teams
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">2M+</span> meetings transcribed
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">99.2%</span> accuracy
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

      {/* ──── LOGO BAR ──────────────────────────── */}
      <RevealSection>
        <section className="border-y border-border/50 bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {["Stripe", "Notion", "Linear", "Figma", "Vercel"].map((name) => (
                <span
                  key={name}
                  className="text-xl font-heading tracking-tight text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none"
                >
                  {name}
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
      <section className="py-24 sm:py-32 bg-gradient-to-br from-brand-deep via-[#1a1040] to-brand-deep relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-cyan/10 blur-3xl" />

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

      {/* ──── SOCIAL PROOF ──────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-emerald mb-2">Testimonials</p>
            <h2 className="text-3xl font-heading sm:text-4xl lg:text-5xl">
              Loved by{" "}
              <span className="gradient-text">modern teams</span>
            </h2>
          </RevealSection>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <RevealSection key={i}>
                <div className="flex flex-col h-full rounded-[4px] border border-border/50 bg-card p-6 hover:shadow-lg transition-all duration-300">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-brand-amber fill-brand-amber" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan text-xs font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
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
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
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
                      <span className="text-4xl font-bold font-sans text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
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
                    href="/sign-up"
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
            ))}
          </div>
        </div>
      </section>

      {/* ──── FINAL CTA ─────────────────────────── */}
      <RevealSection>
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[4px] bg-gradient-to-br from-brand-deep via-brand-violet/90 to-brand-deep p-12 sm:p-20 text-center animated-gradient">
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand-cyan/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-brand-violet/20 blur-3xl" />

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
                {["X", "LI", "GH"].map((icon) => (
                  <a
                    key={icon}
                    href="#"
                    className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-muted text-xs font-semibold text-muted-foreground hover:bg-brand-violet hover:text-white transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Integrations", "Security", "Changelog"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact", "Press"],
              },
              {
                title: "Resources",
                links: ["Documentation", "API Reference", "Help Center", "Status", "Privacy Policy"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold font-sans text-foreground mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
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
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
