"use client";

import { useState } from "react";
import {
  Scissors,
  Play,
  Share2,
  Link2,
  Eye,
  Filter,
  Sparkles,
  CircleDot,
  CheckCircle2,
  MessageCircle,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { demoSmartClips, demoMeetings } from "@/lib/demo-data";

const typeConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  decision: { label: "Decision", color: "text-brand-violet", bg: "bg-brand-violet/10", icon: CheckCircle2 },
  action_item: { label: "Action Item", color: "text-brand-amber", bg: "bg-brand-amber/10", icon: CircleDot },
  highlight: { label: "Highlight", color: "text-brand-cyan", bg: "bg-brand-cyan/10", icon: Sparkles },
  question: { label: "Question", color: "text-brand-emerald", bg: "bg-brand-emerald/10", icon: HelpCircle },
  insight: { label: "Insight", color: "text-brand-rose", bg: "bg-brand-rose/10", icon: Lightbulb },
};

function formatDuration(start: number, end: number) {
  const dur = end - start;
  const m = Math.floor(dur / 60);
  const s = dur % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Static waveform bars
function Waveform() {
  const heights = [12, 20, 8, 24, 14, 18, 10, 22, 16, 12, 20, 8, 24, 14, 18, 10, 22, 16, 12, 20, 8, 24, 14, 18, 10, 22, 16, 12, 20, 14];
  return (
    <div className="flex items-end gap-[1.5px] h-8 w-full">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full bg-brand-violet/30"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export default function ClipsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [meetingFilter, setMeetingFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const clips = demoSmartClips.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (meetingFilter !== "all" && c.meetingId !== meetingFilter) return false;
    return true;
  });

  const totalViews = demoSmartClips.reduce((s, c) => s + c.views, 0);
  const sharedCount = demoSmartClips.filter((c) => c.shared).length;

  const uniqueMeetings = Array.from(new Set(demoSmartClips.map((c) => c.meetingId))).map((id) => ({
    id,
    title: demoMeetings.find((m) => m.id === id)?.title ?? id,
  }));

  function handleCopyLink(clipId: string) {
    setCopiedId(clipId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Smart Clips</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-generated shareable audio clips from your meetings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Clips", value: demoSmartClips.length, icon: Scissors, color: "text-brand-violet" },
          { label: "Shared", value: sharedCount, icon: Share2, color: "text-brand-cyan" },
          { label: "Total Views", value: totalViews, icon: Eye, color: "text-brand-emerald" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filter:
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={meetingFilter}
          onChange={(e) => setMeetingFilter(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
        >
          <option value="all">All Meetings</option>
          {uniqueMeetings.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clips.map((clip) => {
          const cfg = typeConfig[clip.type];
          const TypeIcon = cfg.icon;
          return (
            <div key={clip.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <TypeIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    {clip.shared && (
                      <span className="text-xs text-brand-emerald font-medium flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        Shared
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">{clip.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{clip.description}</p>
                </div>
              </div>

              {/* Meeting + Speaker info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="truncate">{clip.meetingTitle}</span>
                <span>-</span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {clip.speaker}
                </span>
              </div>

              {/* Audio player bar */}
              <div className="bg-muted rounded-lg p-2.5 space-y-1.5">
                <Waveform />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatTimestamp(clip.startTime)}</span>
                  <span className="font-medium">{formatDuration(clip.startTime, clip.endTime)}</span>
                  <span>{formatTimestamp(clip.endTime)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  {clip.views} views
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(clip.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {copiedId === clip.id ? "Copied!" : "Copy Link"}
                  </button>
                  <button className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-brand-violet text-white hover:bg-brand-violet/90 transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clips.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Scissors className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No clips match your filters</p>
        </div>
      )}
    </div>
  );
}
