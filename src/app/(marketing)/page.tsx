import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

/* ─── Feature Data ────────────────────────────── */
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    title: "AI Transcription",
    description: "99.2% accuracy across 50+ languages with speaker identification.",
    color: "brand-violet",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Smart Summaries",
    description: "Key points, decisions, and action items auto-extracted instantly.",
    color: "brand-cyan",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Meeting Coach",
    description: "Talk ratio, filler words, pace — with personalized improvement tips.",
    color: "brand-emerald",
    badge: "Exclusive",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Decisions & Actions",
    description: "Every decision and action item auto-extracted and surfaced on your Home feed.",
    color: "brand-amber",
    badge: "Exclusive",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Activity Hub",
    description: "One home screen for open actions, recent decisions, and meeting highlights.",
    color: "brand-rose",
    badge: "Exclusive",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    title: "Copy for AI",
    description: "One-click exports for ChatGPT, Claude, standup notes, exec briefs.",
    color: "brand-violet",
    badge: "Exclusive",
  },
];

const colorMap: Record<string, string> = {
  "brand-violet": "text-brand-violet bg-brand-violet/10",
  "brand-cyan": "text-brand-cyan bg-brand-cyan/10",
  "brand-emerald": "text-brand-emerald bg-brand-emerald/10",
  "brand-amber": "text-brand-amber bg-brand-amber/10",
  "brand-rose": "text-brand-rose bg-brand-rose/10",
};

/* ─── Page ────────────────────────────────────── */
export default function MarketingPage() {

  return (
    <>
      {/* ──── HERO ──────────────────────────────── */}
      <section className="pt-40 pb-24 sm:pt-48 sm:pb-32 lg:pt-56 lg:pb-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <ScrollReveal delay={100}>
              <div className="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
                <span className="recording-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-violet" />
                Meeting Intelligence
              </div>
            </ScrollReveal>

            {/* Heading — dramatic scale */}
            <ScrollReveal delay={200}>
              <h1 className="max-w-5xl text-6xl font-heading tracking-tight sm:text-7xl lg:text-8xl xl:text-[6.5rem] leading-[0.9]">
                Your meetings,{" "}
                <span className="text-brand-violet">remembered.</span>
              </h1>
            </ScrollReveal>

            {/* Subtext — restrained */}
            <ScrollReveal delay={350}>
              <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
                99.2% accurate transcription, AI summaries, action items, and
                decision tracking for your team.
              </p>
            </ScrollReveal>

            {/* CTAs — bigger, more commanding */}
            <ScrollReveal delay={500}>
              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center bg-brand-violet px-10 py-4 text-base font-semibold text-white hover:bg-brand-violet/90 transition-colors rounded-sm"
                >
                  Start Free Trial
                  <svg className="ml-2.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link href="/demo/dashboard" className="inline-flex items-center justify-center border border-border bg-card px-10 py-4 text-base font-semibold text-foreground hover:bg-muted/50 transition-colors rounded-sm">
                  Live Demo
                </Link>
              </div>
            </ScrollReveal>

            {/* Product Preview Card */}
            <ScrollReveal delay={650} variant="scale">
              <div className="mt-20 w-full max-w-4xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-brand-deep/5 rounded-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground font-mono rounded-sm">
                    reverbic.ai/demo/dashboard
                  </div>
                  <a
                    href="/demo/dashboard"
                    className="shrink-0 inline-flex items-center gap-1.5 bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Preview
                  </a>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-sm bg-muted/30 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</div>
                    <div className="text-sm text-foreground leading-relaxed">
                      AI features on track for April. Mobile redesign pushed to Q2.
                      Hiring 2 frontend devs approved...
                    </div>
                  </div>
                  <div className="rounded-sm bg-muted/30 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Action Items</div>
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
                  <div className="rounded-sm bg-muted/30 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Decisions</div>
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
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ──── INTEGRATIONS BAR ─────────────────── */}
      <ScrollReveal variant="fade-in">
        <section className="border-y border-border/30 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
              {[
                { name: "Zoom", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M1.5 6a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0116.5 6v4.5l4.72-3.14a.75.75 0 011.28.53v8.22a.75.75 0 01-1.28.53L16.5 13.5V18a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6z"/></svg> },
                { name: "Google Meet", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
                { name: "Slack", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z"/></svg> },
                { name: "Notion", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.49 2.37c-.42-.326-.98-.7-2.055-.607L3.48 2.88c-.466.047-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM3.2 1.24l13.542-1c1.635-.14 2.055-.047 3.083.7l4.25 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.632-1.681 1.726l-15.458.933c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.92c0-.84.373-1.54 1.215-1.68z"/></svg> },
                { name: "Teams", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.404 4.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM22.5 9.75a1.5 1.5 0 00-1.5-1.5h-4.5a1.5 1.5 0 00-1.5 1.5v4.5a1.5 1.5 0 001.5 1.5h.75v3l3-3h.75a1.5 1.5 0 001.5-1.5v-4.5zM14.154 6a3 3 0 11-6 0 3 3 0 016 0zM1.5 18a6 6 0 0112 0v.75a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75V18z"/></svg> },
              ].map((item) => (
                <span
                  key={item.name}
                  className="inline-flex items-center gap-2.5 text-sm font-medium tracking-tight text-muted-foreground/50 select-none"
                >
                  {item.icon}
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ──── FEATURES ──────────────────────────── */}
      <section id="features" className="py-32 sm:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-violet mb-3">Capabilities</p>
              <h2 className="text-4xl font-heading sm:text-5xl lg:text-6xl leading-[0.95]">
                Everything your team needs
              </h2>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                From transcription to coaching, every meeting becomes searchable knowledge.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border">
            {features.map((f, i) => (
              <ScrollReveal key={i} delay={i * 100} variant="fade-up">
                <div className="relative bg-card p-8 sm:p-10 hover:bg-muted/30 transition-colors h-full">
                  {f.badge && (
                    <span className="absolute top-6 right-6 text-[10px] font-semibold tracking-widest uppercase text-brand-violet">
                      {f.badge}
                    </span>
                  )}
                  <div className={`inline-flex rounded-sm p-3 ${colorMap[f.color] || "text-brand-violet bg-brand-violet/10"}`}>
                    {f.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──── WHY REVERBIC ──────────────────────── */}
      <section className="py-32 sm:py-40 bg-brand-deep">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-cyan mb-3">Only on Reverbic</p>
              <h2 className="text-4xl font-heading sm:text-5xl lg:text-6xl text-white leading-[0.95]">
                Beyond transcription
              </h2>
              <p className="mt-5 text-lg text-white/50 leading-relaxed">
                Other tools transcribe. Reverbic transforms how your team communicates.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Meeting Coach",
                tagline: "Most tools transcribe. Reverbic coaches.",
                description: "Real-time feedback on talk-to-listen ratio, filler words, and speaking pace. Teams see a 40% reduction in filler words within the first month.",
                stats: ["-40% filler words", "2x efficiency"],
                icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
              },
              {
                title: "Decisions & Actions",
                tagline: "Never lose a decision again.",
                description: "Every decision and action item is automatically extracted and linked to its meeting context. They surface on your Home feed so nothing falls through the cracks.",
                stats: ["Cross-meeting", "Auto-surfaced"],
                icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
              {
                title: "Activity Hub",
                tagline: "Your meetings, one glance.",
                description: "Open action items, recent decisions, and meeting highlights — all on one screen. No switching between tabs. Your team knows what to do the moment they log in.",
                stats: ["Zero context-switching", "Instant clarity"],
                icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
              },
            ].map((card, i) => (
              <ScrollReveal key={i} delay={i * 150} variant="fade-up">
                <div className="rounded-sm border border-white/10 bg-white/[0.03] p-10 flex flex-col h-full">
                  <div className="inline-flex w-fit rounded-sm p-3 bg-brand-violet-light/15 text-brand-violet-light mb-6">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-base font-medium text-brand-violet-light">
                    {card.tagline}
                  </p>
                  <p className="mt-4 text-sm text-white/50 leading-relaxed flex-1">
                    {card.description}
                  </p>
                  <div className="mt-8 flex items-center gap-3">
                    {card.stats.map((stat, j) => (
                      <span key={j} className="rounded-sm px-3 py-1.5 text-xs font-semibold text-white/70 bg-white/[0.06]">
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──────────────────────── */}
      <section id="how-it-works" className="py-32 sm:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-cyan mb-3">How It Works</p>
              <h2 className="text-4xl font-heading sm:text-5xl lg:text-6xl leading-[0.95]">
                Three steps to clarity
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-0 md:grid-cols-3">
            {[
              { step: "01", title: "Record", description: "Connect Zoom, Google Meet, or Teams. Reverbic records automatically. Or upload any audio file.", color: "brand-violet" },
              { step: "02", title: "AI Processes", description: "99.2% accurate transcription with speaker identification. Summaries, action items, and decisions extracted instantly.", color: "brand-cyan" },
              { step: "03", title: "Review & Act", description: "Searchable transcripts, action items, and decisions surface on your Home feed. Meeting knowledge for everyone.", color: "brand-emerald" },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 200} variant="fade-up">
                <div className="relative p-10 md:p-12 border-b md:border-b-0 md:border-r border-border last:border-0">
                  <span className="block text-7xl sm:text-8xl font-heading text-muted-foreground/8 font-bold leading-none mb-6">
                    {s.step}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──── PRICING TEASER ─────────────────────── */}
      <section id="pricing" className="py-32 sm:py-40 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <p className="text-xs font-semibold tracking-widest uppercase text-brand-violet mb-3">Pricing</p>
            <h2 className="text-4xl font-heading sm:text-5xl lg:text-6xl leading-[0.95]">
              Plans that scale with your team
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Start free. Paid plans from $9.97/seat/mo.
            </p>
            <div className="mt-10">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center bg-brand-violet px-10 py-4 text-base font-semibold text-white hover:bg-brand-violet/90 transition-colors rounded-sm"
              >
                View Pricing
                <svg className="ml-2.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ──── FINAL CTA ─────────────────────────── */}
      <ScrollReveal variant="scale">
        <section className="py-32 sm:py-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-sm bg-brand-deep px-8 py-20 sm:px-16 sm:py-28 text-center">
              <h2 className="text-4xl font-heading sm:text-5xl lg:text-6xl text-white leading-[0.95]">
                Stop losing decisions<br className="hidden sm:block" /> to bad notes
              </h2>
              <p className="mt-6 text-lg text-white/50 max-w-lg mx-auto leading-relaxed">
                Start your free trial today. No credit card required.
              </p>
              <div className="mt-10">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center bg-white px-10 py-4 text-base font-semibold text-brand-deep hover:bg-white/90 transition-colors rounded-sm"
                >
                  Start Free Trial
                  <svg className="ml-2.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ──── FOOTER ────────────────────────────── */}
      <footer className="border-t border-border/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-in">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2.5 mb-5">
                  <img src="/icon-transparent.svg" alt="" width={22} height={22} className="shrink-0" />
                  <span className="font-heading text-xl tracking-tight text-foreground">
                    Reverbic
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Meeting intelligence for teams.
                </p>
                <div className="mt-6 flex gap-3">
                  {[
                    { label: "X (Twitter)", href: "https://x.com/reverbic", icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
                    { label: "LinkedIn", href: "https://linkedin.com/company/reverbic", icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /> },
                    { label: "GitHub", href: "https://github.com/reverbic", icon: <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /> },
                  ].map((social) => (
                    <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{social.icon}</svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Links */}
              {[
                { title: "Product", links: [{ label: "Features", href: "/#features" }, { label: "Pricing", href: "/pricing" }, { label: "How It Works", href: "/#how-it-works" }] },
                { title: "Company", links: [{ label: "Contact", href: "mailto:hello@reverbic.ai" }] },
                { title: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-5">{col.title}</h4>
                  <ul className="space-y-3">
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
          </ScrollReveal>

          <div className="mt-16 border-t border-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/60">
              &copy; 2026 Reverbic
            </p>
            <div className="flex gap-8">
              <Link href="/terms" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
