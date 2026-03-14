# UX Navigation Redesign

## Problem

The current sidebar has 11 items with significant feature overlap. Action items, decisions, and key points appear across 6 different pages. Users don't know where to go or what to do next. The experience feels like a brain dump rather than a focused workflow tool.

Overlap clusters:
- **Meetings vs Library** — same list of recordings, two nav items
- **Action Items vs Decisions vs Smart Clips** — three sidebar items showing the same meeting-extracted data in different wrappers
- **AI Coach vs Analytics** — both show productivity metrics, split across two pages
- **Dashboard** — stats overview that duplicates what's on dedicated pages

## Industry Context

Research across 9 competitors (Otter.ai, Fireflies.ai, Fellow, Fathom, Grain, tl;dv, Avoma, Gong, Chorus.ai) shows:
- Standard sidebar has 4-7 items, not 11
- No competitor has a separate "Decisions" page — decisions live in meeting summaries
- No competitor has a standalone "Clips" page — clips are created within meeting views
- Action items surface on the home/landing page, with full detail in the meeting view
- Analytics and coaching are one destination, not two
- "Meetings" is the universal term; no one uses a separate "Library"

## Decision

Consolidate from 11 sidebar items to 5, following the industry-standard pattern with Reverbic's differentiators preserved (AI Coach scoring, decisions as a data type).

---

## New Sidebar Navigation

### Before (11 items)
Dashboard, Meetings, Library, Action Items, Decision Log, AI Coach, Smart Clips, Analytics, Team, Integrations, Settings

### After (5 items)

| Nav Item | Icon | Route | Description |
|----------|------|-------|-------------|
| Home | LayoutDashboard | `/dashboard` | Activity hub — what needs attention (keeps existing route) |
| Meetings | Mic | `/meetings` | All recordings + upload/record (expandable sub-menu) |
| AI Coach | Sparkles | `/coach` | Score, analytics, tips — "how am I doing" |
| Team | Users | `/team` | Members, invites |
| Settings | Settings | `/settings` | Profile, billing, integrations |

Meetings sub-menu (expandable): All Meetings, Upload Recording, Record.

---

## Page Designs

### Home (`/dashboard`)

Keeps the existing `/dashboard` route (preserving middleware redirect for authenticated users). Label changes from "Dashboard" to "Home" in the sidebar. Full page rewrite. Answers "what do I need to do?" and "what just happened?"

**Layout (top to bottom):**

**1. Greeting + Quick Stats Bar**
- "Good morning, {name}" with inline stat pills: open action items count, meetings this week, coach score
- Upload and Record buttons top-right for quick access (these supplement the sidebar Meetings sub-menu — same actions, faster access from Home)

**2. My Action Items (primary section)**
- Open action items assigned to the user, across all meetings
- Each item: text, priority badge, source meeting name (clickable link to meeting detail)
- Checkbox to mark complete inline
- Collapsed "completed" section at bottom
- Replaces the entire `/action-items` page

**3. Recent Meetings**
- Last 5-7 meetings: title, date, duration, summary snippet
- Inline pills: "3 decisions, 2 action items, 1 key point"
- Click through to meeting detail
- "View all" link → `/meetings`

**4. Recent Decisions (secondary section)**
- Last ~5 decisions across meetings
- Each with source meeting link and who made it
- Read-only awareness, no interactivity needed
- Replaces the entire `/decisions` page

**Not on Home:** charts, analytics, meeting frequency graphs, team activity. Those belong in Coach.

**Feature gating:** Action items section available to all plans. Decisions section uses a soft gate on Free: a new `SoftPlanGate` component that wraps the section content with `filter: blur(4px)` and `pointer-events: none`, overlaid with an absolutely-positioned centered nudge ("Unlock decisions — Upgrade to Pro" with a subtle upgrade button). This is distinct from the existing `PlanGate` component which renders a full-page lock screen — `SoftPlanGate` is inline and non-blocking. Create as a new component at `src/components/SoftPlanGate.tsx`.

### Meetings (`/meetings`)

Replaces both Meetings and Library. One unified view of all recordings.

**Top bar:**
- Search input (titles, transcripts, tags, content)
- Filter dropdowns: status (all/ready/processing/failed), date range, tags
- Sort: newest first (default), oldest, duration
- Upload + Record buttons

**Meeting list:**
- Card per meeting: title, date, duration, status badge, tags
- Summary snippet (~100 chars)
- Inline insight pills: "2 decisions, 4 action items, 3 key points"
- Click to open meeting detail

**Meeting detail page (`/meetings/[id]`):** No changes. Already shows transcript, summary, key points, action items, decisions, notes, audio player. Action item checkboxes work here (same behavior as Home).

### AI Coach (`/coach`)

Absorbs Analytics. Becomes the single "how am I doing over time" destination.

**Layout:**

**1. Coach Score Card** (existing design)
- Score ring, trend badge, "This Week's Insight" AI text
- Metadata: meetings, hours, decisions, actions completed

**2. Stats Grid** (from Analytics)
- Total meetings, hours transcribed, completion rate, decisions per meeting
- This week vs last week trend arrows

**3. Meeting Frequency Chart** (from Analytics)
- 30-day bar chart

**4. Weekly Breakdowns** (existing design)
- Collapsible week cards with meeting-level detail

**5. Coaching Tips** (existing design)
- 4 tips grid at bottom

**Dropped from Analytics:**
- "Meetings by Status" chart — status is visible in the Meetings list
- "Top Tags" chart — nice-to-have but not actionable

**Feature gating:** Pro+ feature (unchanged).

### Settings (`/settings`)

Gains Integrations as a tab.

**Tabbed layout:**
- **Profile** — name, email, avatar, password (unchanged)
- **Billing** — plan, usage, upgrade (unchanged)
- **Integrations** — Slack, Zoom, Notion OAuth cards with connect/disconnect (moved from `/integrations`)

### Team (`/team`)

Unchanged.

---

## What Gets Deleted

### Pages removed (code deleted):
- `src/app/(app)/library/page.tsx`
- `src/app/(app)/action-items/page.tsx`
- `src/app/(app)/decisions/page.tsx`
- `src/app/(app)/clips/page.tsx`
- `src/app/(app)/analytics/page.tsx`
- `src/app/(app)/integrations/page.tsx`

### Pages modified:
- `src/app/(app)/dashboard/page.tsx` → full rewrite as Home
- `src/app/(app)/coach/page.tsx` → gains analytics sections
- `src/app/(app)/settings/page.tsx` → gains Integrations tab
- `src/components/AppShell.tsx` → sidebar reduced to 5 items

### Demo pages removed:
- `src/app/demo/library/page.tsx`
- `src/app/demo/action-items/page.tsx`
- `src/app/demo/decisions/page.tsx`
- `src/app/demo/clips/page.tsx`
- `src/app/demo/analytics/page.tsx`
- `src/app/demo/integrations/page.tsx`

The demo Home page (`src/app/demo/dashboard/`) needs the same rewrite as the real Home, using fixture data from `lib/demo-data.ts`.

### Other files modified:
- `src/middleware.ts` — remove deleted routes from `protectedPaths` array
- `src/components/AppShell.tsx` — sidebar reduced to 5 items, update global search placeholder (remove "clips" reference), update logo link if needed
- `src/components/PlanGate.tsx` — remove `clips` and `analytics` from feature map

### New components:
- `src/components/SoftPlanGate.tsx` — inline blur + upgrade nudge overlay for gating sections within a page (used for decisions on Home for Free users)

### Feature gating changes:
- `PlanGate.tsx` feature map updates:
  - Remove: `clips`, `analytics` (pages no longer exist)
  - Keep: `coach` (Pro+)
  - Add: `decisions_home` — soft gate for decisions section on Home (blurred + upgrade nudge on Free)
  - `action-items` on Home: available to all plans (core value)

### No backward-compatibility redirects
Old routes (`/library`, `/action-items`, `/decisions`, `/clips`, `/analytics`, `/integrations`) are simply deleted. The app is pre-production.

---

## Data Flow Changes

### Action items
- **Before:** Dedicated page queries all meetings, extracts action items, allows reorder/filter/complete
- **After:** Home page queries all meetings, shows user's action items with complete toggle. Meeting detail page also allows completing items. Same data, two access points instead of a dedicated page.

### Decisions
- **Before:** Dedicated page queries all meetings, shows grouped decisions with search/sort
- **After:** Home page shows last ~5 decisions. Meeting detail shows all decisions for that meeting. Free users see blurred decisions on Home with upgrade nudge.

### Smart Clips
- **Before:** Client-side extraction from meetings into a gallery with timeline/board/grid views
- **After:** Removed entirely. The underlying data (decisions, action items, key points) is still shown in meeting detail and on Home. The "clip" abstraction (with start/end times and transcript segments) is dropped.

### Analytics
- **Before:** Standalone page with charts: meeting frequency, completion rates, status breakdown, weekly trends, top tags
- **After:** Meeting frequency chart and stats grid move into Coach. Status breakdown and top tags dropped.

### Integrations
- **Before:** Standalone page at `/integrations`
- **After:** Tab within Settings. Same component, different mount point.

---

## Landing Page / Marketing Impact

The marketing/pricing page currently promotes Smart Clips, Decision Log, and Analytics as separate features. These pages need copy updates to reflect the consolidated experience:
- "Smart Clips" → remove or reframe as "AI-extracted insights in every meeting"
- "Decision Log" → "Decisions tracked automatically"
- "Analytics" → "AI Coach with built-in analytics"

This is a copy change, not a structural change to the marketing pages. Marketing page updates are out of scope for this implementation plan — they will be handled separately.
