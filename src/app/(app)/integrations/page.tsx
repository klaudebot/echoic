"use client";

import { useState } from "react";
import {
  Plug,
  Video,
  Calendar,
  MessageSquare,
  FileText,
  ListChecks,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { demoIntegrations } from "@/lib/demo-data";

const iconMap: Record<string, React.ElementType> = {
  video: Video,
  calendar: Calendar,
  message: MessageSquare,
  file: FileText,
  task: ListChecks,
  crm: Building2,
};

const categories = [
  { key: "all", label: "All" },
  { key: "video", label: "Video Conferencing", icons: ["video"] },
  { key: "productivity", label: "Productivity", icons: ["calendar", "message", "file"] },
  { key: "task", label: "Project Management", icons: ["task"] },
  { key: "crm", label: "CRM", icons: ["crm"] },
];

function formatLastSync(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date("2026-03-10T12:00:00");
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = demoIntegrations.filter((int) => {
    if (activeCategory === "all") return true;
    const cat = categories.find((c) => c.key === activeCategory);
    if (!cat || !("icons" in cat)) return true;
    return (cat as { icons: string[] }).icons.includes(int.icon);
  });

  const connected = demoIntegrations.filter((i) => i.status === "connected");
  const available = demoIntegrations.filter((i) => i.status === "available");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your favorite tools to streamline your workflow
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeCategory === cat.key
                ? "bg-brand-violet text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Connected */}
      {filtered.some((i) => i.status === "connected") && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">Connected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered
              .filter((i) => i.status === "connected")
              .map((integration) => {
                const Icon = iconMap[integration.icon] ?? Plug;
                return (
                  <div key={integration.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-brand-emerald" />
                            <span className="text-xs text-brand-emerald font-medium">Connected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Last sync: {formatLastSync(integration.lastSync)}
                      </span>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Available */}
      {filtered.some((i) => i.status === "available") && (
        <div>
          <h2 className="font-heading text-lg text-foreground mb-3">Available</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered
              .filter((i) => i.status === "available")
              .map((integration) => {
                const Icon = iconMap[integration.icon] ?? Plug;
                return (
                  <div key={integration.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                          <span className="text-xs text-muted-foreground">Not connected</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                    <div className="pt-2 border-t border-border">
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-violet text-white hover:bg-brand-violet/90 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        Connect
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Plug className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No integrations match this category</p>
        </div>
      )}
    </div>
  );
}
