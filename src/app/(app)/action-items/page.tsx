"use client";

import { useState, useMemo } from "react";
import {
  ListChecks,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { getAllActionItems, demoMeetings } from "@/lib/demo-data";
import type { ActionItem } from "@/lib/demo-data";
import { AppLink } from "@/components/DemoContext";

type GroupBy = "none" | "meeting" | "assignee" | "status" | "priority";

function getMeetingTitle(meetingId: string): string {
  return demoMeetings.find((m) => m.id === meetingId)?.title ?? meetingId;
}

function StatusBadge({ status }: { status: ActionItem["status"] }) {
  const config = {
    pending: { label: "Pending", bg: "bg-brand-amber/10", text: "text-brand-amber", ring: "ring-brand-amber/20" },
    in_progress: { label: "In Progress", bg: "bg-brand-cyan/10", text: "text-brand-cyan", ring: "ring-brand-cyan/20" },
    completed: { label: "Completed", bg: "bg-brand-emerald/10", text: "text-brand-emerald", ring: "ring-brand-emerald/20" },
    overdue: { label: "Overdue", bg: "bg-brand-rose/10", text: "text-brand-rose", ring: "ring-brand-rose/20" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      {status === "overdue" && <span className="w-1.5 h-1.5 rounded-full bg-brand-rose animate-pulse" />}
      {c.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ActionItem["priority"] }) {
  const config = {
    high: { label: "High", bg: "bg-brand-rose/10", text: "text-brand-rose" },
    medium: { label: "Medium", bg: "bg-brand-amber/10", text: "text-brand-amber" },
    low: { label: "Low", bg: "bg-brand-slate/10", text: "text-brand-slate" },
  };
  const c = config[priority];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export default function ActionItemsPage() {
  const allItems = useMemo(() => getAllActionItems(), []);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  // Derive effective items with local "mark complete" overrides
  const items = useMemo(() => {
    return allItems.map((item) =>
      completedItems.has(item.id) ? { ...item, status: "completed" as const } : item
    );
  }, [allItems, completedItems]);

  // Filter
  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.text.toLowerCase().includes(q) ||
          i.assignee.toLowerCase().includes(q) ||
          getMeetingTitle(i.meetingId).toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, statusFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const open = items.filter((i) => i.status === "pending").length;
    const inProgress = items.filter((i) => i.status === "in_progress").length;
    const completed = items.filter((i) => i.status === "completed").length;
    const overdue = items.filter((i) => i.status === "overdue").length;
    return { open, inProgress, completed, overdue };
  }, [items]);

  // Group
  const grouped = useMemo(() => {
    if (groupBy === "none") return { "": filtered };
    const map: Record<string, typeof filtered> = {};
    for (const item of filtered) {
      let key: string;
      switch (groupBy) {
        case "meeting":
          key = getMeetingTitle(item.meetingId);
          break;
        case "assignee":
          key = item.assignee;
          break;
        case "status":
          key = item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ");
          break;
        case "priority":
          key = item.priority.charAt(0).toUpperCase() + item.priority.slice(1);
          break;
        default:
          key = "";
      }
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [filtered, groupBy]);

  function markComplete(id: string) {
    setCompletedItems((prev) => new Set(prev).add(id));
  }

  const statCards = [
    { label: "Open", value: stats.open, icon: Clock, color: "text-brand-amber", bg: "bg-brand-amber/10" },
    { label: "In Progress", value: stats.inProgress, icon: Loader2, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-brand-emerald", bg: "bg-brand-emerald/10" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-brand-rose", bg: "bg-brand-rose/10" },
  ];

  const groupOptions: { value: GroupBy; label: string }[] = [
    { value: "none", label: "No Grouping" },
    { value: "meeting", label: "Meeting" },
    { value: "assignee", label: "Assignee" },
    { value: "status", label: "Status" },
    { value: "priority", label: "Priority" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Action Items</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage action items across all your meetings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search action items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-brand-violet/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-muted rounded-lg px-3 py-2 border-0 outline-none focus:ring-2 focus:ring-brand-violet/30 text-foreground"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Group by dropdown */}
          <div className="relative">
            <button
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2 text-foreground hover:bg-muted/80 transition-colors"
            >
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span>Group</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {groupDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setGroupDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 py-1 w-40">
                  {groupOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setGroupBy(opt.value);
                        setGroupDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between text-foreground"
                    >
                      {opt.label}
                      {groupBy === opt.value && <Check className="w-3.5 h-3.5 text-brand-violet" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group}>
            {group && (
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-heading text-lg text-foreground">{group}</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {groupItems.length}
                </span>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-[1fr_180px_130px_100px_90px_90px_80px] gap-3 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div>Task</div>
                <div>Meeting</div>
                <div>Assignee</div>
                <div>Due Date</div>
                <div>Priority</div>
                <div>Status</div>
                <div></div>
              </div>

              {groupItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No action items match your filters.
                </div>
              ) : (
                groupItems.map((item) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-1 md:grid-cols-[1fr_180px_130px_100px_90px_90px_80px] gap-2 md:gap-3 px-4 py-3 border-b border-border last:border-b-0 items-center hover:bg-muted/30 transition-colors ${
                      item.status === "completed" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <ListChecks className="w-4 h-4 text-brand-violet mt-0.5 shrink-0 hidden md:block" />
                      <span
                        className={`text-sm text-foreground ${
                          item.status === "completed" ? "line-through" : ""
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                    <div>
                      <AppLink
                        href={`/meetings/${item.meetingId}`}
                        className="text-xs text-brand-violet hover:underline truncate block"
                      >
                        {getMeetingTitle(item.meetingId)}
                      </AppLink>
                    </div>
                    <div className="text-sm text-foreground">{item.assignee}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "--"}
                    </div>
                    <div>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div>
                      {item.status !== "completed" && (
                        <button
                          onClick={() => markComplete(item.id)}
                          className="text-xs text-brand-emerald hover:text-brand-emerald/80 font-medium transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
