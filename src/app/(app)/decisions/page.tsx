"use client";

import { useState, useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { useMeetings } from "@/hooks/use-meetings";
import {
  Target,
  Mic,
  ChevronDown,
  ChevronRight,
  Calendar,
  Search,
  ArrowUpDown,
  User,
} from "lucide-react";
import { PlanGate } from "@/components/PlanGate";

interface Decision {
  text: string;
  madeBy: string | null;
}

interface MeetingDecisionGroup {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTags: string[];
  decisions: Decision[];
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

export default function DecisionsPage() {
  const { meetings: rawMeetings, loading } = useMeetings();
  const loaded = !loading;
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const groups = useMemo(() => {
    const result: MeetingDecisionGroup[] = [];

    for (const m of rawMeetings) {
      if (m.decisions.length > 0) {
        result.push({
          meetingId: m.id,
          meetingTitle: m.title,
          meetingDate: m.createdAt,
          meetingTags: m.tags,
          decisions: m.decisions.map((d) => ({ ...d })),
        });
      }
    }

    return result;
  }, [rawMeetings]);

  const toggleGroup = (meetingId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) next.delete(meetingId);
      else next.add(meetingId);
      return next;
    });
  };

  // Counts
  const totalDecisions = groups.reduce((sum, g) => sum + g.decisions.length, 0);
  const meetingsWithDecisions = groups.length;

  // Filter + sort
  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = groups
      .map((g) => {
        if (!query) return g;

        // Match on meeting title or decision text
        const titleMatch = g.meetingTitle.toLowerCase().includes(query);
        const matchingDecisions = g.decisions.filter((d) =>
          d.text.toLowerCase().includes(query) ||
          (d.madeBy && d.madeBy.toLowerCase().includes(query))
        );

        if (titleMatch) return g; // show all decisions if meeting title matches
        if (matchingDecisions.length > 0) return { ...g, decisions: matchingDecisions };
        return null;
      })
      .filter((g): g is MeetingDecisionGroup => g !== null);

    // Sort by date
    return filtered.sort((a, b) => {
      const diff = new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime();
      return sortNewestFirst ? diff : -diff;
    });
  }, [groups, searchQuery, sortNewestFirst]);

  return (
    <PlanGate feature="decisions">
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Decision Log</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A living record of every decision made across your meetings.
        </p>
      </div>

      {/* Empty state */}
      {loaded && totalDecisions === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center fade-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
            <Target className="w-7 h-7 text-brand-violet" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Decisions surface here automatically</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            When your meetings include decisions, Reverbic logs them here with context — so nothing falls through the cracks.
          </p>
          <AppLink
            href="/meetings/record"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Record a Meeting
          </AppLink>
        </div>
      )}

      {/* Content when decisions exist */}
      {loaded && totalDecisions > 0 && (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{totalDecisions}</span>{" "}
              {totalDecisions === 1 ? "decision" : "decisions"}
            </span>
            <span className="text-muted-foreground">
              across{" "}
              <span className="font-semibold text-brand-violet">{meetingsWithDecisions}</span>{" "}
              {meetingsWithDecisions === 1 ? "meeting" : "meetings"}
            </span>
          </div>

          {/* Search + sort controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decisions, meetings, people..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/40 transition-shadow"
              />
            </div>
            <button
              onClick={() => setSortNewestFirst((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortNewestFirst ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {/* Grouped decisions */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No decisions match your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
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
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-brand-violet/10 text-brand-violet"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan shrink-0">
                        {group.decisions.length} {group.decisions.length === 1 ? "decision" : "decisions"}
                      </span>
                    </button>

                    {/* Decision items */}
                    {!collapsed && (
                      <div className="border-t border-border">
                        {group.decisions.map((decision, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-brand-violet/[0.02] transition-colors border-l-[3px] border-l-brand-cyan/40"
                          >
                            <div className="w-5 h-5 rounded-md bg-brand-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Target className="w-3 h-3 text-brand-cyan" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{decision.text}</p>
                              {decision.madeBy && (
                                <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-violet/8 text-brand-violet">
                                  <User className="w-3 h-3" />
                                  {decision.madeBy}
                                </span>
                              )}
                            </div>
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
    </PlanGate>
  );
}
