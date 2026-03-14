# UX Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the sidebar from 11 items to 5 (Home, Meetings, AI Coach, Team, Settings) by merging overlapping features, deleting redundant pages, and rewriting the dashboard as an activity hub.

**Architecture:** The sidebar nav array in `AppShell.tsx` drives all navigation. Pages being removed (library, action-items, decisions, clips, analytics, integrations) get deleted after their functionality is absorbed into Home (action items, decisions), Coach (analytics), and Settings (integrations). A new `SoftPlanGate` component provides inline blur-gating for decisions on Home.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase, Lucide icons

---

## File Structure

### New files:
- `src/components/SoftPlanGate.tsx` — inline blur + upgrade nudge overlay component
- `src/components/IntegrationsPanel.tsx` — integrations UI extracted from integrations page (used in Settings tab)

### Files modified:
- `src/components/AppShell.tsx` — sidebar nav items reduced to 5, search placeholder updated
- `src/middleware.ts` — protectedPaths cleaned up
- `src/components/PlanGate.tsx` — remove clips/analytics from feature map, add decisions_home
- `src/app/(app)/dashboard/page.tsx` — full rewrite as Home (activity hub)
- `src/app/(app)/coach/page.tsx` — absorb analytics sections (meeting frequency chart, stats grid)
- `src/app/(app)/settings/page.tsx` — add Integrations tab

### Files deleted:
- `src/app/(app)/library/page.tsx`
- `src/app/(app)/action-items/page.tsx`
- `src/app/(app)/decisions/page.tsx`
- `src/app/(app)/clips/page.tsx`
- `src/app/(app)/analytics/page.tsx`
- `src/app/(app)/integrations/page.tsx`
- `src/app/demo/library/page.tsx`
- `src/app/demo/action-items/page.tsx`
- `src/app/demo/decisions/page.tsx`
- `src/app/demo/clips/page.tsx`
- `src/app/demo/analytics/page.tsx`
- `src/app/demo/integrations/page.tsx`

---

## Chunk 1: Navigation & Infrastructure

### Task 1: Update sidebar navigation

**Files:**
- Modify: `src/components/AppShell.tsx:1-70` (imports + nav items array)

- [ ] **Step 1: Update imports — remove unused icons**

Remove from the lucide-react import: `Scissors`, `BarChart3`, `Plug`, `FolderOpen`, `Target`.

These icons were used by nav items being removed (Library, Action Items, Decision Log, Smart Clips, Analytics, Integrations).

- [ ] **Step 2: Replace navItems array**

Replace lines 49-70 with:

```typescript
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  {
    href: "/meetings",
    label: "Meetings",
    icon: Mic,
    children: [
      { href: "/meetings", label: "All Meetings" },
      { href: "/meetings/upload", label: "Upload Recording" },
      { href: "/meetings/record", label: "Record" },
    ],
  },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];
```

- [ ] **Step 3: Update search placeholder text**

Find the search input placeholder that contains "clips" and change it to:
```
"Search meetings, transcripts, actions..."
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. Nav items render correctly. Old pages still exist (just not linked in nav).

- [ ] **Step 5: Commit**

```bash
git add src/components/AppShell.tsx
git commit -m "refactor: reduce sidebar from 11 to 5 nav items

Remove Library, Action Items, Decision Log, Smart Clips, Analytics,
and Integrations from sidebar. Rename Dashboard to Home."
```

---

### Task 2: Update middleware protectedPaths

**Files:**
- Modify: `src/middleware.ts:4-7`

- [ ] **Step 1: Replace protectedPaths array**

Replace lines 4-7 with:

```typescript
const protectedPaths = [
  "/dashboard", "/meetings", "/coach", "/team", "/settings",
];
```

Removed: `/library`, `/action-items`, `/decisions`, `/clips`, `/analytics`, `/integrations`.

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "chore: remove deleted routes from middleware protectedPaths"
```

---

### Task 3: Create SoftPlanGate component

**Files:**
- Create: `src/components/SoftPlanGate.tsx`

- [ ] **Step 1: Write the SoftPlanGate component**

```typescript
"use client";

import { useUser } from "@/components/UserContext";
import { hasFeatureAccess } from "@/components/PlanGate";
import { AppLink } from "@/components/DemoContext";
import { Lock, ArrowRight } from "lucide-react";

interface SoftPlanGateProps {
  feature: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Inline soft gate — shows blurred content with an upgrade nudge overlay.
 * Unlike PlanGate (full-page lock), this is used within a page to gate
 * individual sections while keeping the rest accessible.
 */
export function SoftPlanGate({ feature, children, title, description }: SoftPlanGateProps) {
  const { user } = useUser();
  const plan = user?.orgPlan;

  // In demo mode or if user has access, render normally
  if (!user || hasFeatureAccess(plan, feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(4px)" }}>
        {children}
      </div>

      {/* Overlay nudge */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
        <div className="text-center space-y-3 max-w-xs">
          <div className="mx-auto w-10 h-10 rounded-xl bg-brand-violet/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-brand-violet" />
          </div>
          {title && (
            <p className="text-sm font-semibold text-foreground">{title}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          <AppLink
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-violet text-white hover:bg-brand-violet/90 transition-colors"
          >
            Upgrade to Pro
            <ArrowRight className="w-3.5 h-3.5" />
          </AppLink>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SoftPlanGate.tsx
git commit -m "feat: add SoftPlanGate component for inline section gating"
```

---

### Task 4: Update PlanGate feature map

**Files:**
- Modify: `src/components/PlanGate.tsx:8-36`

- [ ] **Step 1: Update FEATURE_PLANS — remove clips/analytics, add decisions_home**

Replace lines 8-13 with:

```typescript
const FEATURE_PLANS: Record<string, string[]> = {
  coach: ["pro", "team", "enterprise"],
  decisions: ["pro", "team", "enterprise"],
  decisions_home: ["pro", "team", "enterprise"],
};
```

- [ ] **Step 2: Update FEATURE_LABELS — remove clips/analytics entries, add decisions_home**

Replace lines 15-36 with:

```typescript
const FEATURE_LABELS: Record<string, { name: string; description: string; requiredPlan: string }> = {
  coach: {
    name: "AI Coach",
    description: "Get AI-powered feedback on your meeting performance, communication style, and actionable improvement tips.",
    requiredPlan: "Pro",
  },
  decisions: {
    name: "Decision Tracker",
    description: "Track every decision made across all your meetings in one place. Never lose track of what was agreed.",
    requiredPlan: "Pro",
  },
  decisions_home: {
    name: "Decisions",
    description: "See recent decisions from your meetings. Upgrade to unlock full decision tracking.",
    requiredPlan: "Pro",
  },
};
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/PlanGate.tsx
git commit -m "chore: update PlanGate feature map — remove clips/analytics, add decisions_home"
```

---

## Chunk 2: Home Page Rewrite

### Task 5: Rewrite dashboard as Home (activity hub)

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Write the new Home page**

Full rewrite of `src/app/(app)/dashboard/page.tsx`. The new Home page has four sections:

1. **Greeting + Quick Stats Bar** — welcome message, stat pills, upload/record buttons
2. **My Action Items** — cross-meeting action items with inline completion toggle
3. **Recent Meetings** — last 5 meetings with summary snippets and insight pills
4. **Recent Decisions** — last 5 decisions, soft-gated for free users

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { AppLink } from "@/components/DemoContext";
import { useUser } from "@/components/UserContext";
import { updateMeeting, type Meeting } from "@/lib/meeting-store";
import { useMeetings } from "@/hooks/use-meetings";
import { SoftPlanGate } from "@/components/SoftPlanGate";
import {
  Upload,
  Mic,
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  Clock,
  ListChecks,
  Target,
  FileText,
  ChevronDown,
  Sparkles,
} from "lucide-react";

// ─── Helpers ───

function formatDuration(hours: number): string {
  if (hours === 0) return "0h";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusLabel(status: Meeting["status"]): { text: string; className: string } {
  switch (status) {
    case "completed":
      return { text: "Completed", className: "bg-brand-emerald/10 text-brand-emerald" };
    case "processing":
      return { text: "Processing", className: "bg-brand-cyan/10 text-brand-cyan" };
    case "uploading":
      return { text: "Uploading", className: "bg-brand-violet/10 text-brand-violet" };
    case "failed":
      return { text: "Failed", className: "bg-brand-rose/10 text-brand-rose" };
    case "silent":
      return { text: "Silent", className: "bg-muted text-muted-foreground" };
    default:
      return { text: status, className: "bg-muted text-muted-foreground" };
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === "high")
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-rose/10 text-brand-rose">High</span>;
  if (p === "medium")
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-amber/10 text-brand-amber">Medium</span>;
  return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">Low</span>;
}

// ─── Data computation ───

interface ActionItemFlat {
  meetingId: string;
  meetingTitle: string;
  itemIdx: number;
  text: string;
  assignee: string | null;
  priority: string;
  completed: boolean;
}

interface DecisionFlat {
  meetingId: string;
  meetingTitle: string;
  text: string;
  madeBy: string | null;
}

function extractActionItems(meetings: Meeting[]): ActionItemFlat[] {
  const items: ActionItemFlat[] = [];
  for (const m of meetings) {
    for (let i = 0; i < m.actionItems.length; i++) {
      const ai = m.actionItems[i];
      items.push({
        meetingId: m.id,
        meetingTitle: m.title,
        itemIdx: i,
        text: ai.text,
        assignee: ai.assignee,
        priority: ai.priority,
        completed: !!(ai as { completed?: boolean }).completed,
      });
    }
  }
  return items;
}

function extractDecisions(meetings: Meeting[]): DecisionFlat[] {
  const decisions: DecisionFlat[] = [];
  for (const m of meetings) {
    for (const d of m.decisions) {
      decisions.push({
        meetingId: m.id,
        meetingTitle: m.title,
        text: d.text,
        madeBy: d.madeBy,
      });
    }
  }
  return decisions.slice(0, 5);
}

// ─── Main page ───

export default function HomePage() {
  const { user } = useUser();
  const { meetings, loading, refresh } = useMeetings();
  const [showCompleted, setShowCompleted] = useState(false);

  const loaded = !loading;

  const allActions = useMemo(() => extractActionItems(meetings), [meetings]);
  const openActions = useMemo(() => allActions.filter((a) => !a.completed), [allActions]);
  const completedActions = useMemo(() => allActions.filter((a) => a.completed), [allActions]);
  const recentDecisions = useMemo(() => extractDecisions(meetings), [meetings]);
  const recentMeetings = useMemo(() => meetings.slice(0, 7), [meetings]);

  const totalHours = useMemo(
    () => meetings.reduce((sum, m) => sum + ((m.transcript?.duration ?? m.duration ?? 0) / 3600), 0),
    [meetings]
  );

  const toggleActionItem = useCallback(
    async (meetingId: string, itemIdx: number) => {
      const meeting = meetings.find((m) => m.id === meetingId);
      if (!meeting) return;
      const newItems = [...meeting.actionItems];
      const item = newItems[itemIdx] as { text: string; assignee: string | null; priority: string; completed?: boolean };
      newItems[itemIdx] = { ...item, completed: !item.completed } as Meeting["actionItems"][number];
      await updateMeeting(meetingId, { actionItems: newItems });
      await refresh();
    },
    [meetings, refresh]
  );

  const hasMeetings = meetings.length > 0;

  return (
    <div className="space-y-8">
      {/* ── Greeting + Quick Stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hasMeetings
              ? `${openActions.length} open action item${openActions.length === 1 ? "" : "s"} · ${meetings.length} meeting${meetings.length === 1 ? "" : "s"} this month`
              : "Upload or record your first meeting to get started."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AppLink
            href="/meetings/upload"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </AppLink>
          <AppLink
            href="/meetings/record"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-brand-violet text-white hover:bg-brand-violet/90 transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            Record
          </AppLink>
        </div>
      </div>

      {/* ── Stat Pills ── */}
      {loaded && hasMeetings && (
        <div className="flex flex-wrap gap-3">
          <StatPill icon={ListChecks} label="Open Actions" value={String(openActions.length)} accent="brand-rose" />
          <StatPill icon={Calendar} label="Meetings" value={String(meetings.length)} accent="brand-violet" />
          <StatPill icon={Clock} label="Hours" value={formatDuration(totalHours)} accent="brand-cyan" />
          <StatPill icon={Target} label="Decisions" value={String(recentDecisions.length)} accent="brand-amber" />
        </div>
      )}

      {/* ── My Action Items ── */}
      {loaded && hasMeetings && openActions.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-brand-rose" />
              <h2 className="text-sm font-semibold text-foreground">My Action Items</h2>
              <span className="text-xs text-muted-foreground">({openActions.length} open)</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {openActions.map((item, i) => (
              <div key={`${item.meetingId}-${item.itemIdx}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/10 transition-colors">
                <button onClick={() => toggleActionItem(item.meetingId, item.itemIdx)} className="shrink-0 mt-0.5">
                  <Circle className="w-4.5 h-4.5 text-muted-foreground/40 hover:text-brand-violet transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.assignee && (
                      <span className="text-xs text-muted-foreground">{item.assignee}</span>
                    )}
                    <AppLink
                      href={`/meetings/${item.meetingId}`}
                      className="text-xs text-brand-violet hover:text-brand-violet/80 transition-colors"
                    >
                      {item.meetingTitle}
                    </AppLink>
                  </div>
                </div>
                <PriorityBadge priority={item.priority} />
              </div>
            ))}
          </div>

          {/* Completed toggle */}
          {completedActions.length > 0 && (
            <>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center gap-2 px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCompleted ? "" : "-rotate-90"}`} />
                {completedActions.length} completed
              </button>
              {showCompleted && (
                <div className="divide-y divide-border border-t border-border">
                  {completedActions.map((item) => (
                    <div key={`${item.meetingId}-${item.itemIdx}`} className="flex items-start gap-3 px-5 py-3 bg-muted/20">
                      <button onClick={() => toggleActionItem(item.meetingId, item.itemIdx)} className="shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-brand-emerald" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground line-through">{item.text}</p>
                        <AppLink
                          href={`/meetings/${item.meetingId}`}
                          className="text-xs text-brand-violet/60 hover:text-brand-violet transition-colors"
                        >
                          {item.meetingTitle}
                        </AppLink>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Empty state for new users ── */}
      {loaded && !hasMeetings && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-violet/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-brand-violet" />
          </div>
          <h2 className="font-heading text-xl text-foreground mb-2">
            Your meeting intelligence hub
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Upload or record a meeting and Reverbic will extract action items, decisions, and key points automatically.
          </p>
          <div className="flex items-center justify-center gap-3">
            <AppLink
              href="/meetings/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 border border-border transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Recording
            </AppLink>
            <AppLink
              href="/meetings/record"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </AppLink>
          </div>
        </div>
      )}

      {/* ── Recent Meetings ── */}
      {loaded && recentMeetings.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Meetings</h2>
            <AppLink
              href="/meetings"
              className="text-xs font-medium text-brand-violet hover:text-brand-violet/80 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </AppLink>
          </div>
          <div className="divide-y divide-border">
            {recentMeetings.map((meeting) => {
              const badge = statusLabel(meeting.status);
              const actionCount = meeting.actionItems?.length ?? 0;
              const decisionCount = meeting.decisions?.length ?? 0;
              const keyPointCount = meeting.keyPoints?.length ?? 0;
              return (
                <AppLink
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-brand-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {meeting.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{formatRelativeDate(meeting.createdAt)}</span>
                      {meeting.duration != null && meeting.duration > 0 && (
                        <span>&middot; {formatDuration(meeting.duration / 3600)}</span>
                      )}
                      {meeting.status === "completed" && (actionCount > 0 || decisionCount > 0 || keyPointCount > 0) && (
                        <span className="flex items-center gap-1.5">
                          &middot;
                          {decisionCount > 0 && <span>{decisionCount} decision{decisionCount !== 1 ? "s" : ""}</span>}
                          {actionCount > 0 && <span>{actionCount} action{actionCount !== 1 ? "s" : ""}</span>}
                          {keyPointCount > 0 && <span>{keyPointCount} key point{keyPointCount !== 1 ? "s" : ""}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                    {badge.text}
                  </span>
                </AppLink>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Decisions (soft-gated for free) ── */}
      {loaded && recentDecisions.length > 0 && (
        <SoftPlanGate
          feature="decisions_home"
          title="Unlock Decisions"
          description="See every decision from your meetings. Upgrade to Pro to access."
        >
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-cyan" />
              <h2 className="text-sm font-semibold text-foreground">Recent Decisions</h2>
            </div>
            <div className="divide-y divide-border">
              {recentDecisions.map((decision, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-5 h-5 rounded-md bg-brand-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-3 h-3 text-brand-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{decision.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {decision.madeBy && (
                        <span className="text-xs text-muted-foreground">{decision.madeBy}</span>
                      )}
                      <AppLink
                        href={`/meetings/${decision.meetingId}`}
                        className="text-xs text-brand-violet hover:text-brand-violet/80 transition-colors"
                      >
                        {decision.meetingTitle}
                      </AppLink>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SoftPlanGate>
      )}
    </div>
  );
}

// ─── Sub-components ───

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    "brand-violet": { bg: "bg-brand-violet/10", text: "text-brand-violet" },
    "brand-cyan": { bg: "bg-brand-cyan/10", text: "text-brand-cyan" },
    "brand-rose": { bg: "bg-brand-rose/10", text: "text-brand-rose" },
    "brand-emerald": { bg: "bg-brand-emerald/10", text: "text-brand-emerald" },
    "brand-amber": { bg: "bg-brand-amber/10", text: "text-brand-amber" },
  };
  const c = colorMap[accent] || colorMap["brand-violet"];

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
      <div className={`w-7 h-7 rounded-md ${c.bg} flex items-center justify-center`}>
        <Icon className={`w-3.5 h-3.5 ${c.text}`} />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. Home page renders with action items, recent meetings, decisions.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: rewrite dashboard as Home activity hub

New Home page shows greeting, stat pills, cross-meeting action items
with inline completion, recent meetings with insight counts, and
recent decisions (soft-gated for free users)."
```

---

## Chunk 3: Coach Absorbs Analytics & Settings Absorbs Integrations

### Task 6: Add analytics sections to Coach page

**Files:**
- Modify: `src/app/(app)/coach/page.tsx`

- [ ] **Step 1: Add meeting frequency chart and stats grid from analytics**

Add the following after the existing "Aggregate Stats Grid" section (before the `{/* Weekly Breakdown */}` comment). Note: the stats grid already exists in Coach and does not need to be ported from Analytics — only the meeting frequency chart is new.

1. Add to imports at top of file:
```typescript
import { BarChart3 } from "lucide-react";
```

2. Add helper functions (before the main component):
```typescript
function dayKey(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

function weekdayLabel(key: string): string {
  try {
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return "";
  }
}

function shortDay(key: string): string {
  try {
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return key;
  }
}
```

3. Add a `dailyCounts` computed value inside the component (alongside `weeklyStats` and `aggregateStats`):
```typescript
const dailyCounts = useMemo(() => {
  const now = new Date();
  const dailyMap: Record<string, number> = {};
  for (const m of completedMeetings) {
    const dk = dayKey(m.createdAt);
    dailyMap[dk] = (dailyMap[dk] || 0) + 1;
  }
  const counts: { key: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d.toISOString());
    counts.push({ key: k, count: dailyMap[k] || 0 });
  }
  return counts;
}, [completedMeetings]);

const maxDaily = Math.max(...dailyCounts.map((d) => d.count), 1);
```

4. Add the Meeting Frequency chart JSX after the Aggregate Stats Grid section and before the Weekly Breakdown heading:
```tsx
{/* Meeting Frequency Chart */}
<div className="bg-card border border-border rounded-xl p-5">
  <div className="flex items-center gap-2 mb-1">
    <BarChart3 className="w-4 h-4 text-brand-violet" />
    <h3 className="text-sm font-semibold text-foreground">Meeting Frequency</h3>
  </div>
  <p className="text-xs text-muted-foreground mb-5">Last 30 days</p>
  <div className="flex items-end gap-[3px] h-36">
    {dailyCounts.map((day, i) => {
      const heightPct = day.count > 0 ? Math.max((day.count / maxDaily) * 100, 6) : 0;
      const isToday = day.key === dayKey(new Date().toISOString());
      const opacity = 0.3 + (i / 29) * 0.7;
      return (
        <div key={day.key} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap z-10 pointer-events-none">
            {shortDay(day.key)}: {day.count} {day.count === 1 ? "meeting" : "meetings"}
          </div>
          <div
            className={`w-full rounded-t-sm transition-all duration-300 ${
              day.count === 0 ? "bg-muted/50" : isToday ? "bg-brand-violet" : "bg-brand-violet group-hover:bg-brand-violet"
            }`}
            style={{
              height: day.count === 0 ? "2px" : `${heightPct}%`,
              opacity: day.count === 0 ? undefined : (isToday ? 1 : opacity),
            }}
          />
        </div>
      );
    })}
  </div>
  <div className="flex gap-[3px] mt-2">
    {dailyCounts.map((day, i) => (
      <div key={day.key} className="flex-1 text-center text-[9px] text-muted-foreground">
        {i % 5 === 0 ? weekdayLabel(day.key) : ""}
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. Coach page now has the meeting frequency chart between the stats grid and weekly breakdown.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/coach/page.tsx
git commit -m "feat: absorb analytics meeting frequency chart into Coach page"
```

---

### Task 7: Add Integrations tab to Settings

**Files:**
- Modify: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Add tab navigation to Settings**

At the top of the SettingsPage component (inside the return), add a tab bar before the existing sections. Add a `tab` state variable:

```typescript
const [activeTab, setActiveTab] = useState<"general" | "integrations">("general");
```

Add tab bar JSX at the top of the return (before the profile section):

```tsx
{/* Tab navigation */}
<div className="flex items-center gap-1 border-b border-border mb-8">
  <button
    onClick={() => setActiveTab("general")}
    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
      activeTab === "general"
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    General
    {activeTab === "general" && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-violet rounded-full" />
    )}
  </button>
  <button
    onClick={() => setActiveTab("integrations")}
    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
      activeTab === "integrations"
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    Integrations
    {activeTab === "integrations" && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-violet rounded-full" />
    )}
  </button>
</div>
```

- [ ] **Step 2: Wrap existing sections in the "general" tab conditional**

Wrap all existing settings sections (Profile, Notifications, Transcription, Billing, API, Data) inside:

```tsx
{activeTab === "general" && (
  <>
    {/* ...existing sections... */}
  </>
)}
```

- [ ] **Step 3: Create IntegrationsPanel component**

Create `src/components/IntegrationsPanel.tsx`:
1. Copy the entire content of `src/app/(app)/integrations/page.tsx`
2. Rename `export default function IntegrationsPage()` to `export function IntegrationsPanel()`
3. Remove the hero header section (the `<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br...">` block at the top of the return) — it's too prominent for a settings tab. Keep everything from the `{loading ? ...}` block onward.
4. No other changes needed — all imports, state, and logic stay the same.

Then in the settings page, add the import and render it:

```typescript
import { IntegrationsPanel } from "@/components/IntegrationsPanel";
```

In the JSX, after the general tab conditional:

```tsx
{activeTab === "integrations" && <IntegrationsPanel />}
```

- [ ] **Step 4: Also handle URL params for integrations**

Check if the URL has `?tab=integrations` and set the active tab accordingly. Add to the settings page:

```typescript
const searchParams = useSearchParams();

useEffect(() => {
  if (searchParams.get("tab") === "integrations") {
    setActiveTab("integrations");
  }
}, [searchParams]);
```

Update the onboarding step in the Home page that linked to `/integrations` to link to `/settings?tab=integrations` instead.

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. Settings page has two tabs. Integrations tab shows the full integrations UI.

- [ ] **Step 6: Commit**

```bash
git add src/components/IntegrationsPanel.tsx src/app/(app)/settings/page.tsx
git commit -m "feat: add Integrations tab to Settings page

Move integrations UI to shared IntegrationsPanel component and render
it as a tab within Settings."
```

---

## Chunk 4: Delete Old Pages & Cleanup

### Task 8: Delete removed pages and demo counterparts

**Files:**
- Delete: `src/app/(app)/library/page.tsx`
- Delete: `src/app/(app)/action-items/page.tsx`
- Delete: `src/app/(app)/decisions/page.tsx`
- Delete: `src/app/(app)/clips/page.tsx`
- Delete: `src/app/(app)/analytics/page.tsx`
- Delete: `src/app/(app)/integrations/page.tsx`
- Delete: `src/app/demo/library/page.tsx`
- Delete: `src/app/demo/action-items/page.tsx`
- Delete: `src/app/demo/decisions/page.tsx`
- Delete: `src/app/demo/clips/page.tsx`
- Delete: `src/app/demo/analytics/page.tsx`
- Delete: `src/app/demo/integrations/page.tsx`

- [ ] **Step 1: Delete all old app pages**

```bash
rm src/app/\(app\)/library/page.tsx
rm src/app/\(app\)/action-items/page.tsx
rm src/app/\(app\)/decisions/page.tsx
rm src/app/\(app\)/clips/page.tsx
rm src/app/\(app\)/analytics/page.tsx
rm src/app/\(app\)/integrations/page.tsx
```

- [ ] **Step 2: Delete all old demo pages**

```bash
rm src/app/demo/library/page.tsx
rm src/app/demo/action-items/page.tsx
rm src/app/demo/decisions/page.tsx
rm src/app/demo/clips/page.tsx
rm src/app/demo/analytics/page.tsx
rm src/app/demo/integrations/page.tsx
```

- [ ] **Step 3: Clean up empty directories**

```bash
rmdir src/app/\(app\)/library src/app/\(app\)/action-items src/app/\(app\)/decisions src/app/\(app\)/clips src/app/\(app\)/analytics src/app/\(app\)/integrations 2>/dev/null
rmdir src/app/demo/library src/app/demo/action-items src/app/demo/decisions src/app/demo/clips src/app/demo/analytics src/app/demo/integrations 2>/dev/null
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. No broken imports (all references to deleted pages should already be gone from the sidebar).

If build fails, check for remaining imports of the deleted pages and fix them.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "chore: delete removed pages — library, action-items, decisions, clips, analytics, integrations

These features have been absorbed into Home (action items, decisions),
Coach (analytics), and Settings (integrations). Smart Clips and Library
removed entirely."
```

---

### Task 9: Final cleanup and build verification

**Files:**
- Possibly modify: any files with broken references to deleted routes

- [ ] **Step 1: Search for remaining references to deleted routes**

Search the codebase for links to `/library`, `/action-items`, `/decisions`, `/clips`, `/analytics`, `/integrations` and update them:

- `/integrations` → `/settings?tab=integrations`
- `/action-items` → `/dashboard`
- `/decisions` → `/dashboard`
- `/library` → `/meetings`
- `/clips` → `/dashboard`
- `/analytics` → `/coach`

Common places: `AppShell.tsx` (search placeholder already done), email templates, API routes, any remaining `AppLink` or `Link` components.

- [ ] **Step 1b: Verify demo dashboard still works**

The demo dashboard at `src/app/demo/dashboard/page.tsx` is a 1-line re-export (`export { default } from "@/app/(app)/dashboard/page"`) so it automatically picks up the Home rewrite. No changes needed — but verify the demo data path works by confirming `useMeetings()` in demo mode returns `getDemoMeetingsForStore()` data which includes `actionItems` and `decisions` fields.

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Clean build with no errors.

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No new lint errors.

- [ ] **Step 4: Final commit**

```bash
git add -u
git commit -m "chore: fix remaining references to deleted routes"
```

- [ ] **Step 5: Push all changes**

```bash
git push
```
