"use client";

import { useState, useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { useMeetings } from "@/hooks/use-meetings";
import { type Meeting } from "@/lib/meeting-store";
import { PlanGate } from "@/components/PlanGate";
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
  LayoutGrid,
  Columns3,
  GitBranchPlus,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

/* ─── Types ─── */

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

type ViewMode = "timeline" | "board" | "grid";

/* ─── Extraction logic (unchanged) ─── */

function extractClips(meetings: Meeting[]): SmartClip[] {
  const clips: SmartClip[] = [];

  for (const m of meetings) {
    if (m.status !== "completed") continue;
    const segments = m.transcript?.segments ?? [];

    for (const [i, decision] of (m.decisions ?? []).entries()) {
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

  clips.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  return clips;
}

function findBestSegment(
  segments: { start: number; end: number; text: string }[],
  targetText: string
): { start: number; end: number; text: string } | null {
  if (segments.length === 0) return null;
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
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── Config ─── */

const typeConfig = {
  decision: {
    label: "Decision",
    icon: Target,
    bg: "bg-brand-orange/10",
    text: "text-brand-orange",
    border: "border-brand-orange/20",
    dot: "bg-brand-orange",
    gradient: "from-brand-orange/20 to-brand-orange/5",
  },
  action_item: {
    label: "Action Item",
    icon: ListChecks,
    bg: "bg-brand-rose/10",
    text: "text-brand-rose",
    border: "border-brand-rose/20",
    dot: "bg-brand-rose",
    gradient: "from-brand-rose/20 to-brand-rose/5",
  },
  key_point: {
    label: "Key Point",
    icon: Lightbulb,
    bg: "bg-brand-amber/10",
    text: "text-brand-amber",
    border: "border-brand-amber/20",
    dot: "bg-brand-amber",
    gradient: "from-brand-amber/20 to-brand-amber/5",
  },
};

/* ─── Group clips by meeting ─── */

interface MeetingGroup {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  clips: SmartClip[];
  decisions: SmartClip[];
  actionItems: SmartClip[];
  keyPoints: SmartClip[];
}

function groupByMeeting(clips: SmartClip[]): MeetingGroup[] {
  const map = new Map<string, MeetingGroup>();
  for (const c of clips) {
    let group = map.get(c.meetingId);
    if (!group) {
      group = {
        meetingId: c.meetingId,
        meetingTitle: c.meetingTitle,
        meetingDate: c.meetingDate,
        clips: [],
        decisions: [],
        actionItems: [],
        keyPoints: [],
      };
      map.set(c.meetingId, group);
    }
    group.clips.push(c);
    if (c.type === "decision") group.decisions.push(c);
    else if (c.type === "action_item") group.actionItems.push(c);
    else group.keyPoints.push(c);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  return groups;
}

/* ─── Clip Card (shared across views) ─── */

function ClipCard({
  clip,
  onShare,
  copiedId,
  compact,
}: {
  clip: SmartClip;
  onShare: (clip: SmartClip) => void;
  copiedId: string | null;
  compact?: boolean;
}) {
  const config = typeConfig[clip.type];
  const Icon = config.icon;
  const isCopied = copiedId === clip.id;

  if (compact) {
    return (
      <div className="group flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot} mt-2 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground leading-snug">{clip.title}</p>
          {clip.speaker && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{clip.speaker}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <AppLink
            href={`/meetings/${clip.meetingId}`}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Go to meeting"
          >
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </AppLink>
          <button
            onClick={() => onShare(clip)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Copy link"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-brand-emerald" />
            ) : (
              <Share2 className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border rounded-xl p-4 hover:shadow-md transition-all group ${config.border} hover:border-opacity-60`}>
      <div className="flex items-start gap-3 mb-2.5">
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${config.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {clip.title}
          </h3>
          {clip.speaker && (
            <p className="text-xs text-muted-foreground mt-0.5">{clip.speaker}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
        {clip.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
            title="Copy link"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-brand-emerald" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Timeline View ─── */

function TimelineView({
  groups,
  onShare,
  copiedId,
  expandedMeetings,
  toggleMeeting,
}: {
  groups: MeetingGroup[];
  onShare: (clip: SmartClip) => void;
  copiedId: string | null;
  expandedMeetings: Set<string>;
  toggleMeeting: (id: string) => void;
}) {
  return (
    <div className="relative">
      {/* Vertical thread line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-1">
        {groups.map((group) => {
          const isExpanded = expandedMeetings.has(group.meetingId);
          const dCount = group.decisions.length;
          const aCount = group.actionItems.length;
          const kCount = group.keyPoints.length;

          return (
            <div key={group.meetingId} className="relative">
              {/* Meeting node */}
              <button
                onClick={() => toggleMeeting(group.meetingId)}
                className="relative z-10 flex items-center gap-3 w-full text-left group py-3 pl-0 pr-3"
              >
                {/* Timeline dot */}
                <div className="w-[39px] flex items-center justify-center shrink-0">
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    isExpanded
                      ? "bg-brand-orange border-brand-orange"
                      : "bg-card border-border group-hover:border-brand-orange/50"
                  }`} />
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-brand-orange transition-colors">
                      {group.meetingTitle}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatFullDate(group.meetingDate)}
                    </p>
                  </div>

                  {/* Clip count pills */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {dCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange text-[10px] font-medium">
                        <Target className="w-2.5 h-2.5" /> {dCount}
                      </span>
                    )}
                    {aCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-rose/10 text-brand-rose text-[10px] font-medium">
                        <ListChecks className="w-2.5 h-2.5" /> {aCount}
                      </span>
                    )}
                    {kCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-amber/10 text-brand-amber text-[10px] font-medium">
                        <Lightbulb className="w-2.5 h-2.5" /> {kCount}
                      </span>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </button>

              {/* Expanded: meeting flow map */}
              {isExpanded && (
                <div className="ml-[39px] pb-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Flow: Decisions → Action Items → Key Points */}
                    {group.decisions.length > 0 && (
                      <div className="border-b border-border">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-orange/5 to-transparent">
                          <Target className="w-3.5 h-3.5 text-brand-orange" />
                          <span className="text-xs font-semibold text-brand-orange uppercase tracking-wider">
                            Decisions
                          </span>
                          <span className="text-[10px] text-brand-orange/60 ml-auto">{dCount}</span>
                        </div>
                        <div className="px-1 py-1">
                          {group.decisions.map((clip) => (
                            <ClipCard key={clip.id} clip={clip} onShare={onShare} copiedId={copiedId} compact />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flow arrow connector */}
                    {group.decisions.length > 0 && group.actionItems.length > 0 && (
                      <div className="flex items-center justify-center py-1 bg-muted/30">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ArrowRight className="w-3 h-3" />
                          <span>led to</span>
                        </div>
                      </div>
                    )}

                    {group.actionItems.length > 0 && (
                      <div className="border-b border-border">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-rose/5 to-transparent">
                          <ListChecks className="w-3.5 h-3.5 text-brand-rose" />
                          <span className="text-xs font-semibold text-brand-rose uppercase tracking-wider">
                            Action Items
                          </span>
                          <span className="text-[10px] text-brand-rose/60 ml-auto">{aCount}</span>
                        </div>
                        <div className="px-1 py-1">
                          {group.actionItems.map((clip) => (
                            <ClipCard key={clip.id} clip={clip} onShare={onShare} copiedId={copiedId} compact />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flow arrow connector */}
                    {(group.decisions.length > 0 || group.actionItems.length > 0) && group.keyPoints.length > 0 && (
                      <div className="flex items-center justify-center py-1 bg-muted/30">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Sparkles className="w-3 h-3" />
                          <span>key insights</span>
                        </div>
                      </div>
                    )}

                    {group.keyPoints.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-amber/5 to-transparent">
                          <Lightbulb className="w-3.5 h-3.5 text-brand-amber" />
                          <span className="text-xs font-semibold text-brand-amber uppercase tracking-wider">
                            Key Points
                          </span>
                          <span className="text-[10px] text-brand-amber/60 ml-auto">{kCount}</span>
                        </div>
                        <div className="px-1 py-1">
                          {group.keyPoints.map((clip) => (
                            <ClipCard key={clip.id} clip={clip} onShare={onShare} copiedId={copiedId} compact />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meeting link footer */}
                    <div className="px-4 py-2 bg-muted/30 border-t border-border">
                      <AppLink
                        href={`/meetings/${group.meetingId}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-orange hover:underline"
                      >
                        View full meeting
                        <ExternalLink className="w-3 h-3" />
                      </AppLink>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Board View (Kanban-style) ─── */

function BoardView({
  clips,
  onShare,
  copiedId,
}: {
  clips: SmartClip[];
  onShare: (clip: SmartClip) => void;
  copiedId: string | null;
}) {
  const decisions = clips.filter((c) => c.type === "decision");
  const actions = clips.filter((c) => c.type === "action_item");
  const keyPoints = clips.filter((c) => c.type === "key_point");

  const columns = [
    { key: "decision" as const, label: "Decisions", items: decisions, config: typeConfig.decision },
    { key: "action_item" as const, label: "Action Items", items: actions, config: typeConfig.action_item },
    { key: "key_point" as const, label: "Key Points", items: keyPoints, config: typeConfig.key_point },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {columns.map((col) => {
        const Icon = col.config.icon;
        return (
          <div key={col.key} className="flex flex-col">
            {/* Column header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl bg-gradient-to-r ${col.config.gradient} border border-b-0 ${col.config.border}`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md ${col.config.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${col.config.text}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.config.bg} ${col.config.text}`}>
                {col.items.length}
              </span>
            </div>

            {/* Column body */}
            <div className={`flex-1 border border-t-0 ${col.config.border} rounded-b-xl bg-muted/20 p-2 space-y-2 min-h-[200px]`}>
              {col.items.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                  No {col.label.toLowerCase()} yet
                </div>
              ) : (
                col.items.map((clip) => (
                  <div key={clip.id} className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all group">
                    <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-3 mb-2">
                      {clip.title}
                    </p>
                    {clip.speaker && (
                      <p className="text-[11px] text-muted-foreground mb-2">{clip.speaker}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {clip.meetingTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(clip.meetingDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AppLink
                          href={`/meetings/${clip.meetingId}`}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </AppLink>
                        <button onClick={() => onShare(clip)} className="p-1 rounded hover:bg-muted transition-colors">
                          {copiedId === clip.id ? (
                            <Check className="w-3 h-3 text-brand-emerald" />
                          ) : (
                            <Share2 className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Grid View ─── */

function GridView({
  clips,
  onShare,
  copiedId,
}: {
  clips: SmartClip[];
  onShare: (clip: SmartClip) => void;
  copiedId: string | null;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} onShare={onShare} copiedId={copiedId} />
      ))}
    </div>
  );
}

/* ─── Main Page ─── */

export default function ClipsPage() {
  const { meetings, loading } = useMeetings();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "decision" | "action_item" | "key_point">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());

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

  const groups = useMemo(() => groupByMeeting(filteredClips), [filteredClips]);

  // Auto-expand first meeting on load
  useMemo(() => {
    if (groups.length > 0 && expandedMeetings.size === 0) {
      setExpandedMeetings(new Set([groups[0].meetingId]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  const loaded = !loading;
  const hasClips = allClips.length > 0;

  const decisionCount = allClips.filter((c) => c.type === "decision").length;
  const actionCount = allClips.filter((c) => c.type === "action_item").length;
  const keyPointCount = allClips.filter((c) => c.type === "key_point").length;

  const handleShare = (clip: SmartClip) => {
    const url = `${window.location.origin}/meetings/${clip.meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleMeeting = (id: string) => {
    setExpandedMeetings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const viewModes: { key: ViewMode; icon: React.ElementType; label: string }[] = [
    { key: "timeline", icon: GitBranchPlus, label: "Timeline" },
    { key: "board", icon: Columns3, label: "Board" },
    { key: "grid", icon: LayoutGrid, label: "Grid" },
  ];

  return (
    <PlanGate feature="clips">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-rose flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="font-heading text-2xl text-foreground">Smart Clips</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Your meetings, distilled. Every decision, action, and insight — organized and connected.
          </p>
        </div>

        {/* View mode switcher */}
        {hasClips && (
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {viewModes.map(({ key, icon: VIcon, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={label}
              >
                <VIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {loaded && !hasClips && (
        <div className="flex flex-col items-center justify-center py-20 text-center fade-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-5">
            <Scissors className="w-7 h-7 text-brand-orange" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Smart clips appear here automatically</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Reverbic highlights key decisions, action items, and important moments from your meetings as shareable clips.
          </p>
          <AppLink
            href="/meetings/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Upload a Recording
          </AppLink>
        </div>
      )}

      {/* Content */}
      {loaded && hasClips && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTypeFilter(typeFilter === "decision" ? "all" : "decision")}
              className={`bg-card border rounded-xl p-3.5 text-left transition-all ${
                typeFilter === "decision" ? "border-brand-orange/40 ring-1 ring-brand-orange/20" : "border-border hover:border-brand-orange/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-brand-orange" />
                <span className="text-xs text-muted-foreground">Decisions</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{decisionCount}</div>
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === "action_item" ? "all" : "action_item")}
              className={`bg-card border rounded-xl p-3.5 text-left transition-all ${
                typeFilter === "action_item" ? "border-brand-rose/40 ring-1 ring-brand-rose/20" : "border-border hover:border-brand-rose/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ListChecks className="w-4 h-4 text-brand-rose" />
                <span className="text-xs text-muted-foreground">Action Items</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{actionCount}</div>
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === "key_point" ? "all" : "key_point")}
              className={`bg-card border rounded-xl p-3.5 text-left transition-all ${
                typeFilter === "key_point" ? "border-brand-amber/40 ring-1 ring-brand-amber/20" : "border-border hover:border-brand-amber/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-brand-amber" />
                <span className="text-xs text-muted-foreground">Key Points</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{keyPointCount}</div>
            </button>
          </div>

          {/* Search + active filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clips, meetings, people..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-orange/40 transition-shadow"
              />
            </div>
            {typeFilter !== "all" && (
              <button
                onClick={() => setTypeFilter("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${typeConfig[typeFilter].bg} ${typeConfig[typeFilter].text}`}
              >
                {typeConfig[typeFilter].label}
                <X className="w-3 h-3" />
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredClips.length} clip{filteredClips.length !== 1 ? "s" : ""}
              {viewMode === "timeline" && ` across ${groups.length} meeting${groups.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* View content */}
          {filteredClips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No clips match your search</p>
            </div>
          ) : (
            <>
              {viewMode === "timeline" && (
                <TimelineView
                  groups={groups}
                  onShare={handleShare}
                  copiedId={copiedId}
                  expandedMeetings={expandedMeetings}
                  toggleMeeting={toggleMeeting}
                />
              )}
              {viewMode === "board" && (
                <BoardView clips={filteredClips} onShare={handleShare} copiedId={copiedId} />
              )}
              {viewMode === "grid" && (
                <GridView clips={filteredClips} onShare={handleShare} copiedId={copiedId} />
              )}
            </>
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
    </PlanGate>
  );
}
