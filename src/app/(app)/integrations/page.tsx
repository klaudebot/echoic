"use client";

import { useEffect, useState, useCallback } from "react";
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
  Check,
  Loader2,
  Unplug,
  Info,
  X,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  brandColor: string;
  brandBg: string;
  live?: boolean;
  connectPath?: string;
  disconnectPath?: string;
  statusPath?: string;
  howItWorks?: string; // info tooltip text
}

interface Category {
  title: string;
  description: string;
  accentColor?: string;
  integrations: Integration[];
}

const categories: Category[] = [
  {
    title: "Meeting Platforms",
    description:
      "Automatically capture, transcribe, and analyze every conversation",
    accentColor: "brand-teal",
    integrations: [
      {
        id: "zoom",
        name: "Zoom",
        description: "Record and transcribe Zoom meetings automatically",
        icon: Video,
        brandColor: "text-blue-500",
        brandBg: "bg-blue-500/10",
        live: true,
        connectPath: "/api/integrations/zoom/connect",
        disconnectPath: "/api/integrations/zoom/disconnect",
        statusPath: "/api/integrations/zoom/status",
        howItWorks: "Once connected, Zoom cloud recordings are automatically imported into Reverbic when a meeting ends. The recording is transcribed and summarized with AI — no manual upload needed. Requires a Zoom plan with cloud recording enabled.",
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
    description:
      "Push insights and action items where your team already works",
    accentColor: "brand-orange",
    integrations: [
      {
        id: "slack",
        name: "Slack",
        description: "Share summaries and clips directly in channels",
        icon: MessageSquare,
        brandColor: "text-purple-500",
        brandBg: "bg-purple-500/10",
        live: true,
        connectPath: "/api/integrations/slack/connect",
        disconnectPath: "/api/integrations/slack/disconnect",
        statusPath: "/api/integrations/slack/status",
        howItWorks: "After connecting, open any completed meeting and click the \"Send to Slack\" button. Pick a channel, and the meeting summary, key points, and action items are posted as a rich message your team can see instantly.",
      },
      {
        id: "notion",
        name: "Notion",
        description: "Export meeting notes and decisions to Notion pages",
        icon: FileText,
        brandColor: "text-stone-600 dark:text-stone-400",
        brandBg: "bg-stone-500/10",
        live: true,
        connectPath: "/api/integrations/notion/connect",
        disconnectPath: "/api/integrations/notion/disconnect",
        statusPath: "/api/integrations/notion/status",
        howItWorks: "After connecting, open any completed meeting and click \"Export to Notion\". A formatted page is created in your Notion workspace with the summary, key points, action items as to-do blocks, and decisions.",
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
    description:
      "Keep your customer records enriched with meeting intelligence",
    accentColor: "brand-amber",
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
        description:
          "Sync meeting data with Salesforce records and opportunities",
        icon: Building2,
        brandColor: "text-sky-500",
        brandBg: "bg-sky-500/10",
      },
    ],
  },
];

// Extract live integration IDs for status fetching
const liveIntegrationIds = categories
  .flatMap((c) => c.integrations)
  .filter((i) => i.live)
  .map((i) => i.id);

type ConnectionStatus = {
  connected: boolean;
  detail?: string; // e.g. team name or workspace name
};

function IntegrationCard({
  integration,
  status,
  onDisconnect,
}: {
  integration: Integration;
  status?: ConnectionStatus;
  onDisconnect: (id: string) => void;
}) {
  const Icon = integration.icon;
  const isLive = integration.live;
  const isConnected = status?.connected ?? false;
  const [disconnecting, setDisconnecting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleDisconnect = async () => {
    if (!integration.disconnectPath) return;
    setDisconnecting(true);
    try {
      await fetch(integration.disconnectPath, { method: "POST" });
      onDisconnect(integration.id);
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="group bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-brand-orange/30 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl ${integration.brandBg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-5 h-5 ${integration.brandColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                {integration.name}
              </h3>
              {integration.howItWorks && (
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-muted-foreground/50 hover:text-brand-orange transition-colors"
                  title="How it works"
                >
                  {showInfo ? <X className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {integration.description}
            </p>
          </div>
        </div>
      </div>

      {showInfo && integration.howItWorks && (
        <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-lg px-3.5 py-3 text-xs text-foreground/80 leading-relaxed">
          <span className="font-medium text-brand-orange">How it works:</span>{" "}
          {integration.howItWorks}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        {isConnected ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-emerald/10 text-brand-emerald">
              <Check className="w-3 h-3" />
              Connected{status?.detail ? ` \u2022 ${status.detail}` : ""}
            </span>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-brand-rose/10 text-brand-rose hover:bg-brand-rose/20 transition-colors"
            >
              {disconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Unplug className="w-3 h-3" />
              )}
              Disconnect
            </button>
          </>
        ) : isLive ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange">
              <Zap className="w-3 h-3" />
              Available
            </span>
            <a
              href={integration.connectPath}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors"
            >
              <Plug className="w-3 h-3" />
              Connect
            </a>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-amber/10 text-brand-amber">
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
          </>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    const allIntegrations = categories.flatMap((c) => c.integrations);
    const results: Record<string, ConnectionStatus> = {};

    await Promise.all(
      liveIntegrationIds.map(async (id) => {
        const integration = allIntegrations.find((i) => i.id === id);
        if (!integration?.statusPath) return;
        try {
          const res = await fetch(integration.statusPath);
          if (!res.ok) return;
          const data = await res.json();
          let detail = "";
          if (id === "slack" && data.teamName) detail = data.teamName;
          if (id === "notion" && data.workspace_name)
            detail = data.workspace_name;
          results[id] = { connected: !!data.connected, detail };
        } catch {
          // not connected
        }
      })
    );

    setStatuses(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Check URL params for success/error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("success") || params.has("error")) {
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      // Re-fetch after OAuth redirect
      fetchStatuses();
    }
  }, [fetchStatuses]);

  const handleDisconnect = (id: string) => {
    setStatuses((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const liveCount = liveIntegrationIds.length;
  const connectedCount = Object.values(statuses).filter(
    (s) => s.connected
  ).length;

  return (
    <div className="space-y-10">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-orange/10 via-card to-card border border-border p-8 md:p-10">
        <div className="absolute top-4 right-4 opacity-[0.04]">
          <Zap className="w-40 h-40" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {liveCount} integrations live &middot; {connectedCount} connected
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-2">
            Integrations
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
            Connect your favorite tools to supercharge your workflow.
            Automatically push meeting insights, action items, and transcripts
            to the apps your team uses every day.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Category sections */}
          {categories.map((category) => {
            const accentMap: Record<string, string> = {
              "brand-teal": "from-brand-teal/20",
              "brand-orange": "from-brand-orange/20",
              "brand-amber": "from-brand-amber/20",
            };
            const accentGrad = accentMap[category.accentColor || "brand-orange"] || "from-brand-orange/20";
            return (
            <section key={category.title} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${accentGrad} to-transparent shrink-0 mt-0.5`} />
                <div>
                  <h2 className="font-heading text-lg text-foreground">
                    {category.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {category.integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    status={statuses[integration.id]}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </div>
            </section>
            );
          })}

          {/* Request integration CTA */}
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-5 h-5 text-brand-orange" />
            </div>
            <h3 className="font-heading text-lg text-foreground mb-1.5">
              Missing an integration?
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              We&apos;re building integrations based on what our users need
              most. Let us know which tools you&apos;d like to see connected.
            </p>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors">
              Request an Integration
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
