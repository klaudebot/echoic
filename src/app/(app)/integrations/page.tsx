"use client";

import { useState } from "react";
import { AppLink } from "@/components/DemoContext";
import {
  Plug,
  Video,
  Calendar,
  MessageSquare,
  FileText,
  ListChecks,
  Building2,
  ExternalLink,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

const integrations: Integration[] = [
  { id: "zoom", name: "Zoom", description: "Automatically record and transcribe Zoom meetings", icon: "video", category: "video" },
  { id: "google-meet", name: "Google Meet", description: "Connect Google Meet for seamless meeting capture", icon: "video", category: "video" },
  { id: "teams", name: "Microsoft Teams", description: "Record and analyze your Teams meetings", icon: "video", category: "video" },
  { id: "google-calendar", name: "Google Calendar", description: "Sync your calendar to auto-join scheduled meetings", icon: "calendar", category: "productivity" },
  { id: "outlook", name: "Outlook Calendar", description: "Connect Outlook to manage meeting schedules", icon: "calendar", category: "productivity" },
  { id: "slack", name: "Slack", description: "Share meeting summaries and clips directly in Slack channels", icon: "message", category: "productivity" },
  { id: "notion", name: "Notion", description: "Export meeting notes and action items to Notion pages", icon: "file", category: "productivity" },
  { id: "linear", name: "Linear", description: "Create Linear issues from meeting action items", icon: "task", category: "task" },
  { id: "jira", name: "Jira", description: "Sync action items to Jira tickets automatically", icon: "task", category: "task" },
  { id: "asana", name: "Asana", description: "Push action items and decisions to Asana projects", icon: "task", category: "task" },
  { id: "hubspot", name: "HubSpot", description: "Log meeting notes to HubSpot CRM contacts", icon: "crm", category: "crm" },
  { id: "salesforce", name: "Salesforce", description: "Sync meeting data with Salesforce records", icon: "crm", category: "crm" },
];

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
  { key: "video", label: "Video Conferencing" },
  { key: "productivity", label: "Productivity" },
  { key: "task", label: "Project Management" },
  { key: "crm", label: "CRM" },
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = integrations.filter((int) => {
    if (activeCategory === "all") return true;
    return int.category === activeCategory;
  });

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

      {/* Integration cards */}
      <div>
        <h2 className="font-heading text-lg text-foreground mb-3">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((integration) => {
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Plug className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No integrations match this category</p>
        </div>
      )}
    </div>
  );
}
