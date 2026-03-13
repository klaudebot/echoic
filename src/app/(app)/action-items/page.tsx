"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLink } from "@/components/DemoContext";
import { updateMeeting, type Meeting } from "@/lib/meeting-store";
import { useMeetings } from "@/hooks/use-meetings";
import {
  ListChecks,
  Mic,
  CheckCircle2,
  Circle,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Filter,
  Calendar,
} from "lucide-react";
import dynamic from "next/dynamic";

const CopyForAI = dynamic(() => import("@/components/CopyForAI"), {
  loading: () => null,
  ssr: false,
});
type MeetingContext = import("@/components/CopyForAI").MeetingContext;

interface ActionItem {
  text: string;
  assignee: string | null;
  priority: string;
  completed?: boolean;
}

interface MeetingActionGroup {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTags: string[];
  items: ActionItem[];
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === "high") {
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-rose/10 text-brand-rose">High</span>;
  }
  if (p === "medium") {
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-amber/10 text-brand-amber">Medium</span>;
  }
  return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">Low</span>;
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

export default function ActionItemsPage() {
  const { meetings, loading: meetingsLoading, refresh } = useMeetings();
  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{ groupIdx: number; itemIdx: number } | null>(null);

  const groups: MeetingActionGroup[] = [];
  for (const m of meetings) {
    if (m.actionItems.length > 0) {
      groups.push({
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.createdAt,
        meetingTags: m.tags,
        items: m.actionItems.map((item) => ({
          ...item,
          completed: (item as ActionItem).completed ?? false,
        })),
      });
    }
  }

  const loaded = !meetingsLoading;

  const toggleItem = useCallback(
    async (meetingId: string, itemIdx: number) => {
      const group = groups.find((g) => g.meetingId === meetingId);
      if (!group) return;
      const newItems = [...group.items];
      newItems[itemIdx] = { ...newItems[itemIdx], completed: !newItems[itemIdx].completed };

      // Persist to meeting store
      await updateMeeting(meetingId, {
        actionItems: newItems.map(({ text, assignee, priority, completed }) => ({
          text,
          assignee,
          priority,
          completed,
        })) as Meeting["actionItems"],
      });
      await refresh();
    },
    [groups, refresh]
  );

  const toggleGroup = (meetingId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) next.delete(meetingId);
      else next.add(meetingId);
      return next;
    });
  };

  // Drag and drop within a group
  const handleDragStart = (groupIdx: number, itemIdx: number) => {
    setDragState({ groupIdx, itemIdx });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (groupIdx: number, targetIdx: number) => {
    if (!dragState || dragState.groupIdx !== groupIdx) {
      setDragState(null);
      return;
    }

    const sourceIdx = dragState.itemIdx;
    if (sourceIdx === targetIdx) {
      setDragState(null);
      return;
    }

    const group = groups[groupIdx];
    const newItems = [...group.items];
    const [moved] = newItems.splice(sourceIdx, 1);
    newItems.splice(targetIdx, 0, moved);

    // Persist reorder
    await updateMeeting(group.meetingId, {
      actionItems: newItems.map(({ text, assignee, priority, completed }) => ({
        text,
        assignee,
        priority,
        completed,
      })) as Meeting["actionItems"],
    });
    await refresh();

    setDragState(null);
  };

  // Counts
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const openItems = groups.reduce(
    (sum, g) => sum + g.items.filter((i) => !i.completed).length,
    0
  );
  const completedItems = totalItems - openItems;

  // Filter items
  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (filter === "open" && item.completed) return false;
        if (filter === "completed" && !item.completed) return false;
        if (priorityFilter !== "all" && item.priority.toLowerCase() !== priorityFilter) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Action Items</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage action items across all your meetings
          </p>
        </div>
        {totalItems > 0 && (
          <CopyForAI
            context={{
              title: "Action Items — All Meetings",
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              summary: `${totalItems} action items across ${groups.length} meetings. ${openItems} open, ${completedItems} completed.`,
              keyPoints: [],
              actionItems: groups.flatMap((g) =>
                g.items.map((item) => ({
                  text: `${item.text} (from: ${g.meetingTitle})`,
                  assignee: item.assignee,
                  priority: item.priority,
                  completed: item.completed,
                }))
              ),
              decisions: [],
            }}
          />
        )}
      </div>

      {loaded && totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center fade-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-5">
            <ListChecks className="w-7 h-7 text-brand-orange" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Action items appear here automatically</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            When you process a meeting, Reverbic extracts action items with assignees and priorities — no manual work needed.
          </p>
          <AppLink
            href="/meetings/record"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Record a Meeting
          </AppLink>
        </div>
      )}

      {loaded && totalItems > 0 && (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{totalItems}</span> total
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-brand-orange">{openItems}</span> open
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-brand-emerald">{completedItems}</span> done
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(["all", "open", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-brand-orange text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "open" ? "Open" : "Completed"}
              </button>
            ))}
            <span className="w-px h-4 bg-border mx-1" />
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  priorityFilter === p
                    ? "bg-brand-orange text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "all" ? "Any Priority" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Grouped items */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No action items match your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group, groupIdx) => {
                const collapsed = collapsedGroups.has(group.meetingId);
                return (
                  <div
                    key={group.meetingId}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.meetingId)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      {collapsed ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {group.meetingTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(group.meetingDate)}
                          </span>
                          {group.meetingTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-brand-orange/10 text-brand-orange"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {group.items.filter((i) => !i.completed).length}/{group.items.length}
                      </span>
                    </button>

                    {/* Items */}
                    {!collapsed && (
                      <div className="border-t border-border">
                        {group.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            draggable
                            onDragStart={() => handleDragStart(groupIdx, itemIdx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(groupIdx, itemIdx)}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                              dragState?.groupIdx === groupIdx && dragState?.itemIdx === itemIdx
                                ? "opacity-40"
                                : ""
                            } ${item.completed ? "bg-muted/20" : "hover:bg-muted/10"}`}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
                            <button
                              onClick={() => toggleItem(group.meetingId, itemIdx)}
                              className="shrink-0 mt-0.5"
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-brand-emerald check-pop" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-muted-foreground/40 hover:text-brand-orange transition-colors" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  item.completed
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}
                              >
                                {item.text}
                              </p>
                              {item.assignee && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.assignee}
                                </p>
                              )}
                            </div>
                            <PriorityBadge priority={item.priority} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
