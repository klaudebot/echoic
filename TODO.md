# Reverbic — Production TODO

## Status: UI Prototype → Production App

Every page has polished UI but zero backend. This file tracks what needs to be built.

---

## P0 — Core Infrastructure (Must Have)

### Storage & Upload Pipeline
- [ ] Create S3 bucket `reverbic-recordings` with folder structure: `/{account_id}/{user_id}/{recording_id}.webm`
- [ ] API route `POST /api/recordings/upload` — presigned URL generation for direct browser→S3 upload
- [ ] API route `GET /api/recordings/[id]` — fetch recording metadata + signed playback URL
- [ ] Wire upload page to actually upload files to S3 with real progress tracking
- [ ] Support audio formats: webm, mp4, m4a, mp3, wav, ogg
- [ ] File size limit: 500MB per recording
- [ ] Validate audio file before upload (not empty, has audio track)

### Audio Recording (Browser)
- [ ] Implement Web Audio API / MediaRecorder in record page
- [ ] Request microphone permission with fallback UI
- [ ] Real waveform visualization from live audio stream
- [ ] Pause/resume recording
- [ ] Auto-upload to S3 on stop
- [ ] Show recording duration and file size estimate

### AI Transcription Pipeline
- [ ] API route `POST /api/transcription/start` — trigger transcription job
- [ ] Integrate OpenAI Whisper API for transcription
- [ ] Speaker diarization (identify who said what)
- [ ] Store transcript segments with timestamps in database
- [ ] Handle long recordings (chunk into segments if needed)
- [ ] Support 50+ languages (Whisper supports this natively)
- [ ] Webhook/polling for transcription job status

### AI Summarization
- [ ] API route `POST /api/summarize` — generate meeting summary
- [ ] Use GPT-4o to generate:
  - Professional meeting summary (paragraph format)
  - Key points (bullet list)
  - Action items with assignees
  - Decisions made
- [ ] Professional voice/tone in all generated text
- [ ] Store summaries linked to meeting record

### Audio Quality
- [ ] Volume amplifier — detect low audio levels and offer gain boost
- [ ] Silence detector — flag recordings that are blank/silent (mic issues)
  - Analyze RMS levels across recording
  - Alert user if >80% of recording is silence
  - Prevent wasted transcription credits on blank recordings
- [ ] Audio normalization before transcription

---

## P1 — Auth & Data Layer

### Supabase Auth
- [ ] Create Supabase project and configure
- [ ] Wire sign-up page to `supabase.auth.signUp()`
- [ ] Wire sign-in page to `supabase.auth.signInWithPassword()`
- [ ] Wire Google OAuth to `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] Wire Apple OAuth
- [ ] Middleware: enforce auth on protected routes (redirect to /sign-in)
- [ ] Session management with `@supabase/ssr`
- [ ] Password reset flow
- [ ] Email verification

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

### API Routes
- [ ] `GET /api/meetings` — list user's meetings (paginated)
- [ ] `GET /api/meetings/[id]` — single meeting with transcript + summary
- [ ] `POST /api/meetings` — create meeting from upload/recording
- [ ] `PATCH /api/meetings/[id]` — update meeting title/details
- [ ] `DELETE /api/meetings/[id]` — delete meeting + recording
- [ ] `GET /api/action-items` — list across all meetings
- [ ] `PATCH /api/action-items/[id]` — toggle status, update
- [ ] `GET /api/decisions` — list across all meetings
- [ ] `GET /api/clips` — list smart clips
- [ ] `POST /api/clips` — create clip from time range
- [ ] `GET /api/analytics` — aggregated meeting stats
- [ ] `PATCH /api/user/profile` — update name, email, preferences

---

## P2 — Feature Completion

### Meeting Detail Page (`/meetings/[id]`)
- [ ] Full transcript viewer with timestamps and speaker labels
- [ ] Audio player with waveform, seek, playback speed
- [ ] AI summary panel (collapsible)
- [ ] Action items list with inline edit/complete
- [ ] Decisions list
- [ ] Clip creation (select time range → save clip)
- [ ] Share meeting via link
- [ ] Download transcript as TXT/PDF

### Meetings List Page
- [ ] Show real meetings from database (not demo data)
- [ ] Search by title, transcript content
- [ ] Filter by date range, platform, status
- [ ] Sort by date, duration
- [ ] Pagination

### Action Items Page
- [ ] Real data from database
- [ ] Filter by status (open/completed), priority, assignee
- [ ] Inline edit, mark complete
- [ ] Group by meeting

### Decisions Page
- [ ] Real data from database
- [ ] Cross-meeting search
- [ ] Filter by date, meeting

### AI Coach Page
- [ ] Analyze speaking patterns from transcript data
- [ ] Talk-to-listen ratio per user
- [ ] Filler word count and trends
- [ ] Speaking pace (words per minute)
- [ ] Weekly coaching tips generated by AI
- [ ] Score trending chart

### Smart Clips Page
- [ ] List clips with audio preview
- [ ] Share clip via link
- [ ] Auto-generate clips from key moments (AI-detected)

### Analytics Page
- [ ] Meeting frequency chart (last 30 days)
- [ ] Total hours transcribed
- [ ] Action item completion rate
- [ ] Top speakers / talk time distribution
- [ ] Trends over time

### Library Page
- [ ] Searchable meeting archive
- [ ] Folder organization
- [ ] Full-text search across all transcripts

### Team Page
- [ ] Real invite email via Resend
- [ ] Team member list from database
- [ ] Role management (admin, member)
- [ ] Usage stats per member

### Integrations Page
- [ ] Actually connect to Zoom, Google Meet, Teams via OAuth
- [ ] Slack notifications for meeting summaries
- [ ] Notion export for meeting notes
- [ ] Show connected vs disconnected state from database
- [ ] OAuth callback routes for each provider

### Settings Page
- [ ] Persist all settings to database
- [ ] Stripe Customer Portal link for billing
- [ ] Real API key generation and management
- [ ] Account deletion flow with confirmation

---

## P3 — Payments & Polish

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

### Dashboard (Authenticated)
- [ ] Show real stats (meetings this week, hours, action items)
- [ ] Today's meetings from calendar integration
- [ ] Recent activity feed from database
- [ ] Weekly digest with AI insights

---

## Bugs & Polish

- [ ] Integrations page — shows flat list of cards with "Connect" that does nothing. Needs real OAuth flows or at minimum "Coming Soon" badges
- [ ] Google/Apple OAuth buttons on sign-in/sign-up do nothing (redirect to dashboard without auth)
- [ ] No loading states on page transitions
- [ ] No error boundaries
- [ ] No 404 page
- [ ] Demo mode indicator should link back to sign-up
- [ ] Mobile recording page needs testing
- [ ] API key in settings is always the same fake key
- [ ] "Export All Data" and "Delete Account" buttons do nothing
- [ ] No toast notifications for save actions (except settings)

---

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=reverbic-recordings

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://reverbic.ai
```
