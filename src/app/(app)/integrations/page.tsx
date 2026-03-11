"use client";

import { AppLink } from "@/components/DemoContext";
import {
  Plug,
  Video,
  MessageSquare,
  FileText,
  ListChecks,
  Building2,
  Sparkles,
  Clock,
  Send,
  Zap,
  ArrowRight,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  brandColor: string;
  brandBg: string;
}

interface Category {
  title: string;
  description: string;
  integrations: Integration[];
}

const categories: Category[] = [
  {
    title: "Meeting Platforms",
    description: "Automatically capture, transcribe, and analyze every conversation",
    integrations: [
      {
        id: "zoom",
        name: "Zoom",
        description: "Record and transcribe Zoom meetings automatically",
        icon: Video,
        brandColor: "text-blue-500",
        brandBg: "bg-blue-500/10",
      },
      {
        id: "google-meet",
        name: "Google Meet",
        description: "Seamless capture for all your Google Meet calls",
        icon: Video,
        brandColor: "text-emerald-500",
        brandBg: "bg-emerald-500/10",
      },
      {
        id: "teams",
        name: "Microsoft Teams",
        description: "Record and analyze your Teams meetings effortlessly",
        icon: Video,
        brandColor: "text-indigo-500",
        brandBg: "bg-indigo-500/10",
      },
    ],
  },
  {
    title: "Productivity",
    description: "Push insights and action items where your team already works",
    integrations: [
      {
        id: "slack",
        name: "Slack",
        description: "Share summaries and clips directly in channels",
        icon: MessageSquare,
        brandColor: "text-purple-500",
        brandBg: "bg-purple-500/10",
      },
      {
        id: "notion",
        name: "Notion",
        description: "Export meeting notes and decisions to Notion pages",
        icon: FileText,
        brandColor: "text-stone-600 dark:text-stone-400",
        brandBg: "bg-stone-500/10",
      },
      {
        id: "linear",
        name: "Linear",
        description: "Create issues from meeting action items instantly",
        icon: ListChecks,
        brandColor: "text-violet-500",
        brandBg: "bg-violet-500/10",
      },
      {
        id: "jira",
        name: "Jira",
        description: "Sync action items to Jira tickets automatically",
        icon: ListChecks,
        brandColor: "text-blue-600",
        brandBg: "bg-blue-600/10",
      },
      {
        id: "asana",
        name: "Asana",
        description: "Push action items and decisions to Asana projects",
        icon: ListChecks,
        brandColor: "text-rose-500",
        brandBg: "bg-rose-500/10",
      },
    ],
  },
  {
    title: "CRM",
    description: "Keep your customer records enriched with meeting intelligence",
    integrations: [
      {
        id: "hubspot",
        name: "HubSpot",
        description: "Log meeting notes and sentiment to HubSpot contacts",
        icon: Building2,
        brandColor: "text-orange-500",
        brandBg: "bg-orange-500/10",
      },
      {
        id: "salesforce",
        name: "Salesforce",
        description: "Sync meeting data with Salesforce records and opportunities",
        icon: Building2,
        brandColor: "text-sky-500",
        brandBg: "bg-sky-500/10",
      },
    ],
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = integration.icon;

  return (
    <div className="group bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-brand-violet/30 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl ${integration.brandBg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-5 h-5 ${integration.brandColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {integration.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {integration.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Clock className="w-3 h-3" />
          Coming Soon
        </span>
        <button
          disabled
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-muted text-muted-foreground/50 cursor-not-allowed"
        >
          <Plug className="w-3 h-3" />
          Connect
        </button>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-10">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-violet/10 via-card to-card border border-border p-8 md:p-10">
        <div className="absolute top-4 right-4 opacity-[0.04]">
          <Zap className="w-40 h-40" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/10 text-brand-violet text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            10 integrations planned
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-2">
            Integrations
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
            Connect your favorite tools to supercharge your workflow. Automatically
            push meeting insights, action items, and transcripts to the apps your
            team uses every day.
          </p>
        </div>
      </div>

      {/* Category sections */}
      {categories.map((category) => (
        <section key={category.title} className="space-y-4">
          <div>
            <h2 className="font-heading text-lg text-foreground">
              {category.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {category.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {category.integrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </section>
      ))}

      {/* Request integration CTA */}
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-violet/10 flex items-center justify-center mx-auto mb-4">
          <Send className="w-5 h-5 text-brand-violet" />
        </div>
        <h3 className="font-heading text-lg text-foreground mb-1.5">
          Missing an integration?
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
          We&apos;re building integrations based on what our users need most. Let us
          know which tools you&apos;d like to see connected.
        </p>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors">
          Request an Integration
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
