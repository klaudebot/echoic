"use client";

import Link from "next/link";
import { useState } from "react";

/* ─── Plan Data ──────────────────────────────── */
const plans = [
  {
    name: "Starter",
    monthlyPrice: "$17.97",
    yearlyPrice: "$9.97",
    period: "/seat/mo",
    description: "For small teams getting started",
    features: [
      "30 hours of transcription / month",
      "AI summaries + action items",
      "3 integrations",
      "Up to 5 team members",
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
    description: "For growing teams with frequent meetings",
    features: [
      "Unlimited transcription",
      "AI Meeting Coach",
      "Decision Tracker",
      "Smart Clips",
      "All integrations",
      "Advanced analytics",
      "Up to 20 team members",
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
    description: "For organizations that need full control",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Admin controls & dashboard",
      "API access",
      "Custom vocabulary",
      "Priority support + Slack",
      "Unlimited team members",
    ],
    cta: "Get Started",
    highlighted: false,
    tier: "team",
  },
];

/* ─── Comparison Data ────────────────────────── */
const comparisonRows: (
  | { category: string }
  | { feature: string; starter: boolean | string; pro: boolean | string; team: boolean | string }
)[] = [
  { category: "Recording & Transcription" },
  { feature: "Transcription hours / month", starter: "30 hrs", pro: "Unlimited", team: "Unlimited" },
  { feature: "Transcription accuracy", starter: "99.2%", pro: "99.2%", team: "99.2%" },
  { feature: "Speaker identification", starter: true, pro: true, team: true },
  { feature: "Upload audio / video files", starter: true, pro: true, team: true },
  { feature: "Live recording", starter: true, pro: true, team: true },
  { feature: "Meetings per month", starter: "100", pro: "Unlimited", team: "Unlimited" },
  { category: "AI Features" },
  { feature: "Smart summaries", starter: true, pro: true, team: true },
  { feature: "Action item extraction", starter: true, pro: true, team: true },
  { feature: "Decision tracking", starter: false, pro: true, team: true },
  { feature: "AI Meeting Coach", starter: false, pro: true, team: true },
  { feature: "Smart Clips", starter: false, pro: true, team: true },
  { feature: "Custom vocabulary", starter: false, pro: false, team: true },
  { category: "Integrations" },
  { feature: "Integrations", starter: "3", pro: "All", team: "All" },
  { feature: "Loom import", starter: true, pro: true, team: true },
  { feature: "API access", starter: false, pro: false, team: true },
  { category: "Collaboration & Admin" },
  { feature: "Team members", starter: "5", pro: "20", team: "Unlimited" },
  { feature: "Shared meeting library", starter: true, pro: true, team: true },
  { feature: "Meeting sharing links", starter: true, pro: true, team: true },
  { feature: "Admin dashboard", starter: false, pro: false, team: true },
  { feature: "SSO / SAML", starter: false, pro: false, team: true },
  { category: "Analytics" },
  { feature: "Basic meeting stats", starter: true, pro: true, team: true },
  { feature: "Advanced analytics", starter: false, pro: true, team: true },
  { category: "Support" },
  { feature: "Support", starter: "Email", pro: "Priority email", team: "Priority + Slack" },
  { category: "Storage" },
  { feature: "Storage", starter: "5 GB", pro: "50 GB", team: "100 GB" },
  { feature: "Transcript history", starter: "Unlimited", pro: "Unlimited", team: "Unlimited" },
];

/* ─── Comparison Chart Component ─────────────── */
function ComparisonChart() {
  const [expanded, setExpanded] = useState(false);
  const previewCount = 10;
  const visibleRows = expanded ? comparisonRows : comparisonRows.slice(0, previewCount);

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
    <div className="mt-20">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-heading sm:text-3xl">
          Compare all <span className="text-brand-violet">features</span>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          See exactly what you get with each plan
        </p>
      </div>

      <div className="relative">
        <p className="text-xs text-muted-foreground mb-2 sm:hidden">Scroll to see all plans →</p>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
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
              {visibleRows.map((row, i) => {
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

        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-violet hover:text-brand-violet/80 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${comparisonRows.filter(r => "feature" in r).length} features`}
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── FAQ Data ───────────────────────────────── */
const faqs = [
  {
    question: "Can I try Reverbic before committing?",
    answer:
      "Absolutely. Our free tier gives you 3 hours of transcription per month with no credit card required. Use it as long as you need to evaluate Reverbic for your team.",
  },
  {
    question: "How does per-seat pricing work?",
    answer:
      "You pay for each team member who has an active Reverbic seat. Only users who need to record, transcribe, or access meeting intelligence require a seat. View-only sharing links don't count toward your seat limit.",
  },
  {
    question: "What happens when my team grows?",
    answer:
      "Adding seats is instant. New team members are prorated for the remainder of your billing cycle. If you outgrow your current plan's seat limit, you can upgrade at any time and only pay the difference.",
  },
  {
    question: "Do you offer annual discounts?",
    answer:
      "Yes. Annual billing saves you up to 44% compared to monthly pricing. All plans are available on both monthly and annual billing cycles, and you can switch between them at any time.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your meeting data is encrypted at rest and in transit. We use SOC 2-compliant infrastructure, and Team plan customers get SSO/SAML and admin controls for additional security governance. We never use your data to train AI models.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no long-term contracts. You can cancel your subscription at any time from your dashboard. Your data remains accessible until the end of your current billing period.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto">
      {faqs.map((faq, i) => (
        <div key={i} className="border-b border-border/50">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-5 text-left group"
          >
            <span className="text-base font-semibold text-foreground group-hover:text-brand-violet transition-colors pr-4">
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              openIndex === i ? "max-h-96 pb-5" : "max-h-0"
            }`}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────── */
export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"yearly" | "monthly">("yearly");

  return (
    <>
      {/* ──── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gray-500/[0.03] blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gray-400/[0.03] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-brand-violet mb-2">Pricing</p>
            <h1 className="text-4xl font-heading sm:text-5xl lg:text-6xl">
              Plans that scale with{" "}
              <span className="text-brand-violet">your team</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From early-stage startups to enterprise organizations, Reverbic has a plan
              that fits your meeting workflow. No hidden fees, no surprises.
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
          </div>
        </div>
      </section>

      {/* ──── PLAN CARDS ────────────────────────── */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const price = billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const showStrikethrough =
                billingInterval === "yearly" &&
                plan.monthlyPrice !== plan.yearlyPrice &&
                plan.monthlyPrice !== "$0";

              return (
                <div key={i}>
                  <div
                    className={`relative flex flex-col h-full rounded-sm p-8 transition-all duration-300 ${
                      plan.highlighted
                        ? "border-2 border-brand-violet bg-card shadow-xl shadow-brand-violet/10 scale-[1.02]"
                        : "border border-border/50 bg-card hover:shadow-lg"
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-violet px-4 py-1 text-xs font-semibold text-white rounded-sm">
                        Most Popular
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                      <div className="mt-4 flex items-baseline gap-1">
                        {showStrikethrough && (
                          <span className="text-lg font-medium text-muted-foreground line-through mr-1">
                            {plan.monthlyPrice}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-foreground">{price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                      {billingInterval === "yearly" && (
                        <p className="text-xs text-brand-emerald font-medium mt-1">billed annually</p>
                      )}
                    </div>
                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-foreground">
                          <svg
                            className="w-4 h-4 mt-0.5 shrink-0 text-brand-emerald"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/sign-up?plan=${plan.tier}&interval=${billingInterval}`}
                      className={`mt-8 block rounded-sm py-3 text-center text-sm font-semibold transition-all ${
                        plan.highlighted
                          ? "bg-brand-violet text-white shadow-lg shadow-brand-violet/25 hover:bg-brand-violet/90"
                          : "bg-muted text-foreground hover:bg-muted/70"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ──── FREE TIER BANNER ─────────────── */}
          <div className="mt-8 max-w-5xl mx-auto">
            <div className="rounded-sm border border-border/50 bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">Free</h3>
                  <span className="text-3xl font-bold text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Try Reverbic free — 3 hours of transcription per month, no credit card required
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["3 hrs transcription / mo", "Basic summaries", "1 integration", "10 meetings / mo"].map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-brand-emerald shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
              <Link
                href="/sign-up"
                className="shrink-0 rounded-sm bg-muted px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70 transition-all"
              >
                Start Free
              </Link>
            </div>
          </div>

          {/* ──── COMPARISON CHART ──────────────── */}
          <ComparisonChart />
        </div>
      </section>

      {/* ──── FAQ ────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-brand-violet mb-2">FAQ</p>
            <h2 className="text-3xl font-heading sm:text-4xl">
              Frequently asked{" "}
              <span className="text-brand-violet">questions</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Reverbic pricing and plans.
            </p>
          </div>

          <div>
            <FAQSection />
          </div>
        </div>
      </section>

      {/* ──── CUSTOM PLAN CTA ────────────────────── */}
      <div>
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-sm bg-brand-deep p-12 sm:p-20 text-center">
              <h2 className="text-3xl font-heading sm:text-4xl lg:text-5xl text-white">
                Need a custom plan?
              </h2>
              <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
                For large organizations with specific security, compliance, or volume requirements,
                we offer tailored plans with dedicated support.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:hello@reverbic.ai"
                  className="inline-flex items-center justify-center bg-white px-8 py-3 text-base font-semibold text-brand-deep shadow-lg hover:bg-white/90 transition-all rounded-sm"
                >
                  Contact Sales
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
                <span className="text-sm text-white/50">hello@reverbic.ai</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
