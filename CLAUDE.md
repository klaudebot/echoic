# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Reverbic?

Reverbic is an AI-powered meeting intelligence SaaS. Users upload or record audio, which goes through a processing pipeline (prepare → transcribe via OpenAI Whisper → summarize via GPT-4o) to produce transcripts, summaries, key points, action items, and decisions.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript)
npm run start    # Start production server
```

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router) with React 19, TypeScript (strict mode)
- **Supabase** for auth (email/password + Google/Apple OAuth) and Postgres database with RLS
- **Tailwind CSS v4** with **shadcn/ui** (base-nova style, Lucide icons, CSS variables for theming)
- **AWS S3** for recording storage via presigned URLs
- **OpenAI** (Whisper for transcription, GPT-4o for summarization)
- **Stripe** for billing; **Resend** for emails
- **Integrations**: Slack, Zoom, Notion (OAuth flows in `/src/lib/integrations/`)

## Architecture

### Path alias
`@/*` maps to `./src/*` (configured in tsconfig.json).

### Route groups
- `(app)/*` — Protected dashboard routes (meetings, library, action-items, decisions, coach, clips, analytics, team, integrations, settings)
- `(auth)/*` — Sign-in/sign-up pages
- `(marketing)/*` — Public pages (pricing, privacy, terms)
- `demo/*` — Demo mode (no auth, uses fixture data from `lib/demo-data.ts`)
- `share/[token]` — Public meeting sharing
- `api/*` — 40+ REST API routes

### Middleware (`src/middleware.ts`)
Refreshes Supabase session cookies on every request. Redirects unauthenticated users to `/sign-in` for protected routes, and authenticated users away from `/sign-in` to `/dashboard`.

### Key modules in `src/lib/`
- **`supabase/`** — Three client variants: `client.ts` (browser singleton), `server.ts` (per-request with cookies), `admin.ts` (service role, bypasses RLS). Types in `types.ts`.
- **`process-pipeline.ts`** — Staged meeting processing: prepare (audio analysis + chunking) → transcribe (per-chunk Whisper) → summarize (GPT-4o). Uses pipeline IDs to prevent concurrent processing.
- **`meeting-store.ts`** — Meetings CRUD against Supabase
- **`s3.ts`** — Presigned URL generation for uploads/playback
- **`api-auth.ts`** — `requireAuth()` helper + S3 key ownership verification
- **`stripe.ts`** — Stripe SDK + plan limit definitions
- **`audio-compress.ts`** — Client-side MP3 encoding via lamejs

### Components (`src/components/`)
- **`AppShell.tsx`** — Main dashboard layout (sidebar + header + search)
- **`UserContext.tsx`** — React Context providing user profile, org membership, and auth state
- **`AuthGuard.tsx`** — Route protection wrapper
- **`PlanGate.tsx`** — Feature gating by subscription plan
- **`DemoContext.tsx`** — Demo mode state provider
- **`ui/`** — shadcn/ui primitives (don't edit directly; use `npx shadcn add`)

### Fonts
- Body: Inter, Headings: Instrument Serif, Mono: JetBrains Mono (all via Google Fonts in root layout)

### Database
Schema lives in `supabase/migrations/`. Key tables: profiles, organizations, organization_members, meetings, transcript_segments, meeting_action_items, meeting_decisions, meeting_clips, integrations, shared_content.

### Environment variables
**Public**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
**Private**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `SLACK_CLIENT_*`, `ZOOM_CLIENT_*`, `NOTION_CLIENT_*`

### Data patterns
- No Redux/Zustand — direct Supabase queries via custom hooks (`use-meetings.ts`, `use-notifications.ts`)
- `useMeeting(id)` auto-polls every 2s while meeting status is "processing"
- Forms use react-hook-form + Zod validation
- Theme switching via next-themes (light/dark)

### Server external packages
`next.config.ts` marks ffmpeg-related packages as `serverExternalPackages` to avoid bundling issues.
