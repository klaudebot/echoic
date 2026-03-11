# Reverbic — Production TODO

## Status: Working Prototype (Core Pipeline Functional)

The core upload → transcription → summarization pipeline works end-to-end. Data is stored in localStorage (no database yet). Auth is faked (localStorage only). This file tracks what's done and what still needs building.

---

## P0 — Core Infrastructure ✅ MOSTLY DONE

### Storage & Upload Pipeline ✅
- [x] S3 bucket `reverbic-recordings` with folder structure `/{account_id}/{user_id}/{recording_id}.ext`
- [x] API route `POST /api/recordings/upload` — presigned URL generation
- [x] API route `GET /api/recordings/[id]` — signed playback URL
- [x] Upload page wired to S3 with real progress tracking
- [x] Support audio formats: webm, mp4, m4a, mp3, wav, ogg
- [x] File size limit: 500MB per recording
- [x] Client-side compression for large files (lamejs MP3 encoder)
- [x] Server-side ffmpeg fallback for compression failures
- [ ] Validate audio file before upload (check for audio track)

### Audio Recording (Browser) ✅
- [x] Web Audio API + MediaRecorder
- [x] Microphone permission request with fallback UI
- [x] Real waveform visualization (canvas + AnalyserNode)
- [x] Pause/resume recording
- [x] Auto-upload to S3 on stop
- [x] Recording duration display

### AI Transcription Pipeline ✅
- [x] Integrated pipeline via `POST /api/meetings/process`
- [x] OpenAI Whisper API transcription
- [x] Transcript segments with timestamps
- [x] Large file handling (ffmpeg compress → chunk → transcribe each)
- [x] Multi-language support (Whisper natively)
- [x] Auto-polling on meeting detail page during processing
- [ ] Speaker diarization (who said what) — Whisper doesn't do this natively
- [ ] Store transcripts in database (currently localStorage only)

### AI Summarization ✅
- [x] GPT-4o generates: summary, key points, action items, decisions
- [x] Professional voice/tone
- [x] JSON-mode structured output
- [ ] Store summaries in database

### Audio Quality ✅
- [x] Silence detector (RMS analysis, flags >80% silence)
- [x] Audio level analysis (peak dB detection)
- [x] User-facing warnings for silent/low recordings
- [ ] Volume amplifier — ffmpeg gain boost endpoint exists but not wired to UI
- [ ] Audio normalization before transcription

---

## P1 — Auth & Data Layer ❌ NOT STARTED

### Supabase Auth
- [ ] Create Supabase project and configure
- [ ] Wire sign-up to `supabase.auth.signUp()`
- [ ] Wire sign-in to `supabase.auth.signInWithPassword()`
- [ ] Wire Google OAuth
- [ ] Wire Apple OAuth
- [ ] Middleware: enforce auth on protected routes
- [ ] Session management with `@supabase/ssr`
- [ ] Password reset flow
- [ ] Email verification

**Current state:** Sign-up/sign-in save name+email to localStorage and redirect to /dashboard. OAuth buttons redirect without authenticating. No real auth.

### Database Schema (Supabase Postgres)
- [ ] `accounts` — organization/team accounts
- [ ] `users` — linked to auth, belongs to account
- [ ] `recordings` — S3 key, duration, file size, upload status
- [ ] `meetings` — title, date, participants, recording_id
- [ ] `transcripts` — meeting_id, segments (jsonb), language
- [ ] `summaries` — meeting_id, text, key_points, generated_at
- [ ] `action_items` — meeting_id, text, assignee, status, due_date
- [ ] `decisions` — meeting_id, text, made_by, timestamp
- [ ] `clips` — meeting_id, start_time, end_time, title
- [ ] `integrations` — account_id, provider, access_token, status
- [ ] Row-level security policies for multi-tenant isolation

**Current state:** All data lives in localStorage under `reverbic_meetings` key. Cleared if user clears browser data. No multi-user support.

### API Routes (Database-backed)
- [ ] `GET /api/meetings` — list user's meetings (paginated)
- [ ] `GET /api/meetings/[id]` — single meeting with transcript + summary
- [ ] `POST /api/meetings` — create meeting from upload/recording
- [ ] `PATCH /api/meetings/[id]` — update meeting title/details
- [ ] `DELETE /api/meetings/[id]` — delete meeting + recording from S3
- [ ] `GET /api/action-items` — list across all meetings
- [ ] `PATCH /api/action-items/[id]` — toggle status, update
- [ ] `GET /api/decisions` — list across all meetings
- [ ] `GET /api/clips` — list smart clips
- [ ] `POST /api/clips` — create clip from time range
- [ ] `GET /api/analytics` — aggregated meeting stats
- [ ] `PATCH /api/user/profile` — update name, email, preferences

---

## P2 — Feature Completion (Mixed)

### Meeting Detail Page (`/meetings/[id]`) — MOSTLY DONE
- [x] Full transcript viewer with timestamps
- [x] AI summary panel (collapsible)
- [x] Key points display
- [x] Action items with priority badges
- [x] Decisions list
- [x] Notes section
- [x] Audio quality badge (good/low/silent)
- [x] Auto-poll during processing
- [x] Try Again button on failure
- [ ] Speaker labels in transcript (needs diarization)
- [ ] Audio player with waveform, seek, playback speed
- [ ] Clip creation (select time range → save clip)
- [ ] Share meeting via link
- [ ] Download transcript as TXT/PDF

### Meetings List Page — MOSTLY DONE
- [x] Real meetings from store
- [x] Status badges (processing, completed, failed, silent)
- [x] Duration, date, tags display
- [x] Summary preview for completed meetings
- [ ] Search by title, transcript content
- [ ] Filter by date range, status
- [ ] Sort options (date, duration)
- [ ] Pagination

### Action Items Page — DONE ✅
- [x] Real data from meeting store
- [x] Grouped by meeting
- [x] Filter by status (open/completed) and priority
- [x] Toggle completion (persisted)
- [x] Drag-and-drop reorder within groups
- [x] Meeting tags displayed
- [ ] Inline text editing
- [ ] Assignee editing
- [ ] Due dates

### Decisions Page — ❌ NOT WIRED
- [ ] Wire to meeting store (data exists in `meeting.decisions[]`)
- [ ] Cross-meeting search
- [ ] Filter by date, meeting

**Current state:** Empty state page. Decision data is extracted by GPT-4o but the page doesn't read it.

### AI Coach Page — ❌ NOT BUILT
- [ ] Analyze speaking patterns from transcript data
- [ ] Talk-to-listen ratio per user
- [ ] Filler word count and trends
- [ ] Speaking pace (words per minute)
- [ ] Weekly coaching tips generated by AI
- [ ] Score trending chart

**Current state:** Empty state page.

### Smart Clips Page — ❌ NOT BUILT
- [ ] List clips with audio preview
- [ ] Share clip via link
- [ ] Auto-generate clips from key moments (AI-detected)
- [ ] Clip creation UI (time range selector on meeting detail)

**Current state:** Empty state page. No clips data model.

### Analytics Page — ❌ NOT BUILT
- [ ] Meeting frequency chart (last 30 days)
- [ ] Total hours transcribed
- [ ] Action item completion rate
- [ ] Top speakers / talk time distribution
- [ ] Trends over time

**Current state:** Empty state page. Could be partially built from localStorage data.

### Library Page — DONE ✅
- [x] Searchable meeting archive
- [x] Search by title, transcript content, tags
- [x] Status badges and duration
- [ ] Folder organization
- [ ] Bulk actions

### Team Page — ❌ FAKE
- [ ] Real invite email via Resend
- [ ] Team member list from database
- [ ] Role management (admin, member)
- [ ] Usage stats per member

**Current state:** Invite form shows success toast but doesn't send emails.

### Integrations Page — DISPLAY ONLY
- [x] Categorized layout with 10 integrations
- [x] "Coming Soon" badges on all
- [ ] OAuth flows for Zoom, Google Meet, Teams
- [ ] Slack notifications for meeting summaries
- [ ] Notion export for meeting notes
- [ ] Connection status from database
- [ ] OAuth callback routes

### Settings Page — PARTIALLY WORKING
- [x] Profile form (name/email from UserContext, saves to localStorage)
- [x] Notification toggles (UI only, no persistence)
- [x] Transcription language/vocabulary (UI only)
- [x] Billing plan display
- [ ] Persist all settings to database
- [ ] Stripe Customer Portal link
- [ ] Real API key generation and management
- [ ] Account deletion flow with confirmation
- [ ] "Export All Data" — download all meetings as ZIP

---

## P3 — Payments & Polish ❌ NOT STARTED

### Stripe Billing
- [ ] Create Stripe products/prices for Free, Starter ($9), Pro ($19), Team ($39)
- [ ] Checkout session API route
- [ ] Webhook handler for subscription events
- [ ] Usage-based limits (hours per plan)
- [ ] Upgrade/downgrade flow
- [ ] Customer portal for managing subscription

### Email (Resend)
- [ ] Welcome email on sign-up
- [ ] Weekly meeting digest email
- [ ] Action item reminder emails
- [ ] Team invite emails
- [ ] Meeting shared notification

### Dashboard — PARTIALLY DONE
- [x] Personalized greeting from UserContext
- [x] Onboarding checklist (4 steps, local toggle)
- [x] Quick action buttons (wired to real pages)
- [ ] Real stats (meetings this week, hours recorded, open action items)
- [ ] Recent activity feed
- [ ] Weekly digest with AI insights

---

## Bugs & Polish

- [x] ~~Integrations page flat/ugly~~ → Categorized with Coming Soon badges
- [ ] Google/Apple OAuth buttons redirect to dashboard without authenticating
- [ ] Header search bar is non-functional (placeholder only)
- [ ] No loading states on page transitions
- [ ] No error boundaries
- [ ] No 404 page
- [ ] API key in settings is hardcoded fake key
- [ ] "Export All Data" and "Delete Account" buttons do nothing
- [ ] No toast notifications for most save actions
- [ ] Dashboard stats show hardcoded zeros
- [ ] Mobile recording page needs testing

---

## Environment Variables

```env
# AWS S3 ✅ CONFIGURED
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=reverbic-recordings

# OpenAI ✅ CONFIGURED
OPENAI_API_KEY=

# App ✅ CONFIGURED
NEXT_PUBLIC_APP_URL=https://reverbic.ai

# Supabase — NOT YET SET UP
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe — NOT YET SET UP
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend — NOT YET SET UP
RESEND_API_KEY=
```

---

## Quick Wins (Can Do Without External Services)

These can be built now using only localStorage data:

1. **Wire Decisions page** — data already exists in `meeting.decisions[]`
2. **Dashboard real stats** — count meetings, sum durations, count open action items from store
3. **Analytics page** — basic charts from localStorage meeting data
4. **Header search** — search across meetings/transcripts in store
5. **Meeting detail audio player** — generate S3 presigned URL, use `<audio>` tag
6. **Download transcript** — export as .txt from stored transcript text
