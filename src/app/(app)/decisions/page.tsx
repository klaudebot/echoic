"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Search,
  Calendar,
  User,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getAllDecisions, demoMeetings, demoWeeklyDigests } from "@/lib/demo-data";
import type { Decision } from "@/lib/demo-data";
import { AppLink } from "@/components/DemoContext";

function getMeetingTitle(meetingId: string): string {
  return demoMeetings.find((m) => m.id === meetingId)?.title ?? meetingId;
}

function getMeetingDate(meetingId: string): string {
  return demoMeetings.find((m) => m.id === meetingId)?.date ?? "";
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Find related decisions by keyword overlap
function findRelated(decision: Decision, all: Decision[]): Decision[] {
  const words = new Set(
    decision.text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
  );
  return all
    .filter((d) => d.id !== decision.id)
    .filter((d) => {
      const dWords = d.text.toLowerCase().split(/\s+/);
      return dWords.some((w) => words.has(w));
    })
    .slice(0, 2);
}

export default function DecisionsPage() {
  const allDecisions = useMemo(() => {
    const decisions = getAllDecisions();
    // Sort by createdAt descending
    return [...decisions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  const [search, setSearch] = useState("");
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [makerFilter, setMakerFilter] = useState("all");
  const [expandedTrail, setExpandedTrail] = useState<string | null>(null);

  // Unique meetings and decision makers
  const meetings = useMemo(() => {
    const ids = [...new Set(allDecisions.map((d) => d.meetingId))];
    return ids.map((id) => ({ id, title: getMeetingTitle(id) }));
  }, [allDecisions]);

  const makers = useMemo(() => {
    return [...new Set(allDecisions.map((d) => d.madeBy))];
  }, [allDecisions]);

  // Filter
  const filtered = useMemo(() => {
    let result = allDecisions;
    if (meetingFilter !== "all") {
      result = result.filter((d) => d.meetingId === meetingFilter);
    }
    if (makerFilter !== "all") {
      result = result.filter((d) => d.madeBy === makerFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.text.toLowerCase().includes(q) ||
          d.context.toLowerCase().includes(q) ||
          d.madeBy.toLowerCase().includes(q) ||
          getMeetingTitle(d.meetingId).toLowerCase().includes(q)
      );
    }
    return result;
  }, [allDecisions, meetingFilter, makerFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = allDecisions.length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = allDecisions.filter((d) => new Date(d.createdAt) >= weekAgo).length;
    // Top decision maker
    const counts: Record<string, number> = {};
    for (const d of allDecisions) {
      counts[d.madeBy] = (counts[d.madeBy] || 0) + 1;
    }
    const topMaker = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total,
      thisWeek,
      topMaker: topMaker ? { name: topMaker[0], count: topMaker[1] } : null,
    };
  }, [allDecisions]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const d of filtered) {
      const dateStr = new Date(d.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(d);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Decision Log</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A living record of every decision made across your meetings. Trace, search, and connect decisions over time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Target className="w-3.5 h-3.5" />
            Total Decisions
          </div>
          <div className="text-3xl font-semibold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" />
            This Week
          </div>
          <div className="text-3xl font-semibold text-brand-violet">{stats.thisWeek}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Top Decision Maker
          </div>
          <div className="text-lg font-semibold text-foreground">
            {stats.topMaker?.name ?? "--"}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.topMaker ? `${stats.topMaker.count} decisions` : ""}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search decisions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-brand-violet/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={meetingFilter}
          onChange={(e) => setMeetingFilter(e.target.value)}
          className="text-sm bg-muted rounded-lg px-3 py-2 border-0 outline-none focus:ring-2 focus:ring-brand-violet/30 text-foreground"
        >
          <option value="all">All Meetings</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <select
          value={makerFilter}
          onChange={(e) => setMakerFilter(e.target.value)}
          className="text-sm bg-muted rounded-lg px-3 py-2 border-0 outline-none focus:ring-2 focus:ring-brand-violet/30 text-foreground"
        >
          <option value="all">All Decision Makers</option>
          {makers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedByDate).map(([date, decisions]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-brand-violet ring-4 ring-brand-violet/10" />
              <h2 className="font-heading text-lg text-foreground">{date}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {decisions.length} decision{decisions.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="ml-1.5 border-l-2 border-brand-violet/20 pl-6 space-y-4">
              {decisions.map((decision) => {
                const related = findRelated(decision, allDecisions);
                const isExpanded = expandedTrail === decision.id;
                const meetingDate = getMeetingDate(decision.meetingId);

                return (
                  <div
                    key={decision.id}
                    className="relative bg-card border border-border rounded-xl p-5 hover:border-brand-violet/30 transition-colors group"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] top-6 w-2.5 h-2.5 rounded-full bg-brand-violet/40 group-hover:bg-brand-violet transition-colors ring-2 ring-background" />

                    <div className="flex flex-col gap-3">
                      {/* Decision text */}
                      <p className="text-foreground font-medium leading-relaxed">
                        {decision.text}
                      </p>

                      {/* Context */}
                      <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">{decision.context}</p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{decision.madeBy}</span>
                        </span>
                        <AppLink
                          href={`/meetings/${decision.meetingId}`}
                          className="flex items-center gap-1.5 text-brand-violet hover:underline"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {getMeetingTitle(decision.meetingId)}
                        </AppLink>
                        <span>
                          at {formatTimestamp(decision.timestamp)} in meeting
                        </span>
                        {meetingDate && (
                          <span>
                            {new Date(meetingDate).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Decision Trail */}
                      {related.length > 0 && (
                        <div>
                          <button
                            onClick={() =>
                              setExpandedTrail(isExpanded ? null : decision.id)
                            }
                            className="flex items-center gap-1.5 text-xs text-brand-violet hover:text-brand-violet/80 font-medium transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Decision Trail ({related.length} related)
                            <ArrowRight
                              className={`w-3 h-3 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="mt-3 space-y-2 ml-4 border-l-2 border-brand-violet/10 pl-4">
                              {related.map((rel) => (
                                <div
                                  key={rel.id}
                                  className="bg-brand-violet/5 rounded-lg p-3"
                                >
                                  <p className="text-sm text-foreground font-medium">
                                    {rel.text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                    <span>{rel.madeBy}</span>
                                    <AppLink
                                      href={`/meetings/${rel.meetingId}`}
                                      className="text-brand-violet hover:underline"
                                    >
                                      {getMeetingTitle(rel.meetingId)}
                                    </AppLink>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No decisions match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
