"use client";

import { useState, useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { useMeetings } from "@/hooks/use-meetings";
import { type Meeting } from "@/lib/meeting-store";
import {
  Scissors,
  Mic,
  Target,
  ListChecks,
  Lightbulb,
  Search,
  Share2,
  ExternalLink,
  Calendar,
  Clock,
  Check,
  Filter,
} from "lucide-react";

interface SmartClip {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  type: "decision" | "action_item" | "key_point";
  speaker: string | null;
}

function extractClips(meetings: Meeting[]): SmartClip[] {
  const clips: SmartClip[] = [];

  for (const m of meetings) {
    if (m.status !== "completed") continue;

    const segments = m.transcript?.segments ?? [];

    // Create clips from decisions
    for (const [i, decision] of (m.decisions ?? []).entries()) {
      // Find the closest transcript segment by text similarity
      const seg = findBestSegment(segments, decision.text);
      clips.push({
        id: `${m.id}-decision-${i}`,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.createdAt,
        title: truncate(decision.text, 60),
        description: decision.text,
        startTime: seg?.start ?? 0,
        endTime: seg?.end ?? 30,
        type: "decision",
        speaker: decision.madeBy,
      });
    }

    // Create clips from action items (high priority only to avoid noise)
    for (const [i, action] of (m.actionItems ?? []).entries()) {
      if (action.priority !== "high") continue;
      const seg = findBestSegment(segments, action.text);
      clips.push({
        id: `${m.id}-action-${i}`,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.createdAt,
        title: truncate(action.text, 60),
        description: action.text,
        startTime: seg?.start ?? 0,
        endTime: seg?.end ?? 30,
        type: "action_item",
        speaker: action.assignee,
      });
    }

    // Create clips from key points
    for (const [i, kp] of (m.keyPoints ?? []).entries()) {
      const seg = findBestSegment(segments, kp);
      clips.push({
        id: `${m.id}-kp-${i}`,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.createdAt,
        title: truncate(kp, 60),
        description: kp,
        startTime: seg?.start ?? 0,
        endTime: seg?.end ?? 30,
        type: "key_point",
        speaker: null,
      });
    }
  }

  // Sort by date, newest first
  clips.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  return clips;
}

function findBestSegment(
  segments: { start: number; end: number; text: string }[],
  targetText: string
): { start: number; end: number; text: string } | null {
  if (segments.length === 0) return null;

  // Simple keyword overlap scoring
  const targetWords = new Set(
    targetText.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );
  if (targetWords.size === 0) return segments[0];

  let bestScore = 0;
  let bestSeg = segments[0];

  for (const seg of segments) {
    const segWords = seg.text.toLowerCase().split(/\W+/);
    let score = 0;
    for (const w of segWords) {
      if (targetWords.has(w)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSeg = seg;
    }
  }

  return bestSeg;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const typeConfig = {
  decision: {
    label: "Decision",
    icon: Target,
    className: "bg-brand-violet/10 text-brand-violet",
    iconColor: "text-brand-violet",
  },
  action_item: {
    label: "Action Item",
    icon: ListChecks,
    className: "bg-brand-rose/10 text-brand-rose",
    iconColor: "text-brand-rose",
  },
  key_point: {
    label: "Key Point",
    icon: Lightbulb,
    className: "bg-brand-amber/10 text-brand-amber",
    iconColor: "text-brand-amber",
  },
};

function ClipCard({
  clip,
  onShare,
}: {
  clip: SmartClip;
  onShare: (clip: SmartClip) => void;
}) {
  const config = typeConfig[clip.type];
  const Icon = config.icon;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-brand-violet/20 transition-all group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg ${config.className} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
            {clip.title}
          </h3>
          {clip.speaker && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {clip.speaker}
            </p>
          )}
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${config.className}`}>
          {config.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {clip.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(clip.meetingDate)}
          </span>
          {clip.startTime > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(clip.startTime)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AppLink
            href={`/meetings/${clip.meetingId}`}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title="Go to meeting"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </AppLink>
          <button
            onClick={() => onShare(clip)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title="Copy clip link"
          >
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClipsPage() {
  const { meetings, loading } = useMeetings();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "decision" | "action_item" | "key_point">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allClips = useMemo(() => extractClips(meetings), [meetings]);

  const filteredClips = useMemo(() => {
    let result = allClips;

    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.meetingTitle.toLowerCase().includes(q) ||
          (c.speaker && c.speaker.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allClips, typeFilter, searchQuery]);

  const loaded = !loading;
  const hasClips = allClips.length > 0;

  // Stats
  const decisionCount = allClips.filter((c) => c.type === "decision").length;
  const actionCount = allClips.filter((c) => c.type === "action_item").length;
  const keyPointCount = allClips.filter((c) => c.type === "key_point").length;

  const handleShare = (clip: SmartClip) => {
    const url = `${window.location.origin}/meetings/${clip.meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-rose flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Smart Clips</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Auto-generated highlights from your meetings — decisions, action items, and key moments.
        </p>
      </div>

      {/* Empty state */}
      {loaded && !hasClips && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
            <Scissors className="w-7 h-7 text-brand-violet" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">No smart clips yet</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Smart clips are automatically generated from your meetings, highlighting key decisions, action items, and important moments.
          </p>
          <AppLink
            href="/meetings/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Upload a Recording
          </AppLink>
        </div>
      )}

      {/* Content */}
      {loaded && hasClips && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-brand-violet" />
                <span className="text-xs text-muted-foreground">Decisions</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{decisionCount}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ListChecks className="w-4 h-4 text-brand-rose" />
                <span className="text-xs text-muted-foreground">Action Items</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{actionCount}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-brand-amber" />
                <span className="text-xs text-muted-foreground">Key Points</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{keyPointCount}</div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clips, meetings, people..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/40 transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(
                [
                  { key: "all", label: "All" },
                  { key: "decision", label: "Decisions" },
                  { key: "action_item", label: "Actions" },
                  { key: "key_point", label: "Key Points" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    typeFilter === key
                      ? "bg-brand-violet text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clips Grid */}
          {filteredClips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No clips match your search</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClips.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}

          {/* Copied toast */}
          {copiedId && (
            <div className="fixed bottom-6 right-6 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <Check className="w-4 h-4" />
              Link copied to clipboard
            </div>
          )}
        </>
      )}
    </div>
  );
}
