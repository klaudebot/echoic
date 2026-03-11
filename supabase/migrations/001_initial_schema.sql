-- ═══════════════════════════════════════════════════════════════════════
-- REVERBIC — Complete Database Schema
-- Migration 001: Initial schema
-- ═══════════════════════════════════════════════════════════════════════

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════
-- 1. PROFILES — extends auth.users with app-specific data
-- ═══════════════════════════════════════════════════════════════════════

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  timezone      text default 'UTC',
  onboarded     boolean default false,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

comment on table public.profiles is 'User profiles extending Supabase Auth. One per auth.users row.';

create index idx_profiles_email on public.profiles(email);


-- ═══════════════════════════════════════════════════════════════════════
-- 2. ORGANIZATIONS — multi-tenant workspace
-- ═══════════════════════════════════════════════════════════════════════

create table public.organizations (
  id                          uuid primary key default uuid_generate_v4(),
  name                        text not null,
  slug                        text unique,
  owner_id                    uuid references public.profiles(id) on delete set null,

  -- Stripe billing
  stripe_customer_id          text,
  stripe_subscription_id      text,
  stripe_price_id             text,
  plan                        text default 'free' check (plan in ('free', 'starter', 'pro', 'team', 'enterprise')),
  plan_status                 text default 'active' check (plan_status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  plan_period_start           timestamptz,
  plan_period_end             timestamptz,

  -- Usage limits
  transcription_hours_used    numeric(10,2) default 0,
  transcription_hours_limit   numeric(10,2) default 5,       -- 5 hrs free tier
  storage_bytes_used          bigint default 0,
  storage_bytes_limit         bigint default 1073741824,      -- 1 GB free tier
  members_limit               int default 3,                  -- free tier member cap
  meetings_per_month_limit    int default 25,                 -- free tier meeting cap

  created_at                  timestamptz default now() not null,
  updated_at                  timestamptz default now() not null
);

comment on table public.organizations is 'Multi-tenant workspace. Every user belongs to at least one org.';

create index idx_organizations_owner on public.organizations(owner_id);
create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_stripe_customer on public.organizations(stripe_customer_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 3. ORGANIZATION MEMBERS — who belongs where, with what role
-- ═══════════════════════════════════════════════════════════════════════

create table public.organization_members (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  role              text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at         timestamptz default now() not null,

  unique(organization_id, user_id)
);

comment on table public.organization_members is 'Junction table linking users to organizations with roles.';

create index idx_org_members_org on public.organization_members(organization_id);
create index idx_org_members_user on public.organization_members(user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 4. TEAM INVITES — pending/accepted/declined/expired invitations
-- ═══════════════════════════════════════════════════════════════════════

create table public.team_invites (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  invited_by        uuid references public.profiles(id) on delete set null,
  email             text not null,
  role              text default 'member' check (role in ('admin', 'member', 'viewer')),
  status            text default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  token             text unique default encode(gen_random_bytes(32), 'hex'),
  invited_at        timestamptz default now() not null,
  responded_at      timestamptz,
  expires_at        timestamptz default (now() + interval '7 days'),

  unique(organization_id, email)
);

comment on table public.team_invites is 'Team invitations with secure token-based acceptance.';

create index idx_team_invites_org on public.team_invites(organization_id);
create index idx_team_invites_email on public.team_invites(email);
create index idx_team_invites_token on public.team_invites(token);
create index idx_team_invites_status on public.team_invites(status);


-- ═══════════════════════════════════════════════════════════════════════
-- 5. TAGS — reusable meeting labels, scoped per org
-- ═══════════════════════════════════════════════════════════════════════

create table public.tags (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  name              text not null,
  color             text,        -- hex color e.g. '#7C3AED'
  created_at        timestamptz default now() not null
);

create unique index idx_tags_org_name on public.tags(organization_id, lower(name));

comment on table public.tags is 'Reusable labels for categorizing meetings within an org.';


-- ═══════════════════════════════════════════════════════════════════════
-- 6. MEETINGS — the core entity
-- ═══════════════════════════════════════════════════════════════════════

create table public.meetings (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid references public.organizations(id) on delete cascade not null,
  created_by            uuid references public.profiles(id) on delete set null,

  -- Titles
  title                 text not null,
  original_title        text,            -- date/time based, for "Use date/time" revert

  -- Status
  status                text default 'uploading' check (status in ('uploading', 'processing', 'completed', 'failed', 'silent')),
  processing_step       text check (processing_step in ('preparing', 'transcribing', 'summarizing', null)),
  processing_progress   text,
  error_message         text,

  -- File info
  s3_key                text,
  file_name             text,
  file_size             bigint,
  content_type          text,
  source                text default 'upload' check (source in ('upload', 'record', 'zoom', 'google_meet', 'teams', 'api')),

  -- Audio analysis
  duration              numeric(10,2),
  language              text default 'en',
  speaker_count         int,
  is_silent             boolean default false,
  silence_percent       numeric(5,2),
  peak_db               numeric(6,2),
  audio_recommendation  text,

  -- AI summary
  summary               text,

  -- User notes
  notes                 text default '',

  -- Sharing
  share_token           text unique default encode(gen_random_bytes(16), 'hex'),
  is_public             boolean default false,

  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

comment on table public.meetings is 'Core meeting entity with recording metadata and AI analysis.';

create index idx_meetings_org on public.meetings(organization_id);
create index idx_meetings_created_by on public.meetings(created_by);
create index idx_meetings_status on public.meetings(status);
create index idx_meetings_created_at on public.meetings(created_at desc);
create index idx_meetings_share_token on public.meetings(share_token);


-- ═══════════════════════════════════════════════════════════════════════
-- 7. MEETING TAGS — many-to-many junction
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_tags (
  meeting_id  uuid references public.meetings(id) on delete cascade not null,
  tag_id      uuid references public.tags(id) on delete cascade not null,
  primary key (meeting_id, tag_id)
);


-- ═══════════════════════════════════════════════════════════════════════
-- 8. MEETING PARTICIPANTS — who was in the meeting
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_participants (
  id            uuid primary key default uuid_generate_v4(),
  meeting_id    uuid references public.meetings(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete set null,
  name          text,           -- display name (may not be a registered user)
  email         text,
  role          text default 'participant' check (role in ('host', 'participant', 'observer')),
  speaker_label text,           -- AI-assigned speaker label (Speaker 1, etc.)
  created_at    timestamptz default now() not null
);

comment on table public.meeting_participants is 'People who attended or were mentioned in a meeting.';

create index idx_meeting_participants_meeting on public.meeting_participants(meeting_id);
create index idx_meeting_participants_user on public.meeting_participants(user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 9. TRANSCRIPT SEGMENTS — timestamped transcript chunks
-- ═══════════════════════════════════════════════════════════════════════

create table public.transcript_segments (
  id              uuid primary key default uuid_generate_v4(),
  meeting_id      uuid references public.meetings(id) on delete cascade not null,
  version_id      uuid,          -- null = current version, non-null = historical
  segment_index   int not null,
  start_time      numeric(10,3) not null,
  end_time        numeric(10,3) not null,
  text            text not null,
  speaker         text,          -- speaker name or label
  speaker_id      uuid references public.meeting_participants(id) on delete set null,
  confidence      numeric(4,3),  -- 0.000 to 1.000
  created_at      timestamptz default now() not null
);

comment on table public.transcript_segments is 'Individual timestamped transcript lines with optional speaker attribution.';

create index idx_transcript_segments_meeting on public.transcript_segments(meeting_id);
create index idx_transcript_segments_version on public.transcript_segments(version_id);
create index idx_transcript_segments_meeting_order on public.transcript_segments(meeting_id, segment_index);


-- ═══════════════════════════════════════════════════════════════════════
-- 10. KEY POINTS — AI-extracted important topics
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_key_points (
  id            uuid primary key default uuid_generate_v4(),
  meeting_id    uuid references public.meetings(id) on delete cascade not null,
  text          text not null,
  sort_order    int default 0,
  created_at    timestamptz default now() not null
);

create index idx_key_points_meeting on public.meeting_key_points(meeting_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 11. ACTION ITEMS — tasks extracted from meetings
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_action_items (
  id              uuid primary key default uuid_generate_v4(),
  meeting_id      uuid references public.meetings(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  text            text not null,
  assignee_name   text,
  assigned_to     uuid references public.profiles(id) on delete set null,
  priority        text default 'medium' check (priority in ('high', 'medium', 'low')),
  completed       boolean default false,
  completed_at    timestamptz,
  completed_by    uuid references public.profiles(id) on delete set null,
  due_date        date,
  sort_order      int default 0,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

comment on table public.meeting_action_items is 'Follow-up tasks extracted from meetings. Org-scoped for cross-meeting views.';

create index idx_action_items_meeting on public.meeting_action_items(meeting_id);
create index idx_action_items_org on public.meeting_action_items(organization_id);
create index idx_action_items_assigned on public.meeting_action_items(assigned_to);
create index idx_action_items_completed on public.meeting_action_items(completed);
create index idx_action_items_due on public.meeting_action_items(due_date) where due_date is not null;


-- ═══════════════════════════════════════════════════════════════════════
-- 12. DECISIONS — explicit decisions captured from meetings
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_decisions (
  id              uuid primary key default uuid_generate_v4(),
  meeting_id      uuid references public.meetings(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  text            text not null,
  made_by_name    text,
  decided_by      uuid references public.profiles(id) on delete set null,
  sort_order      int default 0,
  created_at      timestamptz default now() not null
);

comment on table public.meeting_decisions is 'Explicit decisions captured from meetings. Org-scoped for cross-meeting views.';

create index idx_decisions_meeting on public.meeting_decisions(meeting_id);
create index idx_decisions_org on public.meeting_decisions(organization_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 13. TRANSCRIPT VERSIONS — reprocessing history
-- ═══════════════════════════════════════════════════════════════════════

create table public.transcript_versions (
  id                    uuid primary key default uuid_generate_v4(),
  meeting_id            uuid references public.meetings(id) on delete cascade not null,
  label                 text not null,
  summary               text,
  peak_db               numeric(6,2),
  is_silent             boolean,
  silence_percent       numeric(5,2),
  audio_recommendation  text,
  segment_count         int default 0,
  created_at            timestamptz default now() not null
);

comment on table public.transcript_versions is 'Snapshot of previous transcript results before reprocessing.';

create index idx_transcript_versions_meeting on public.transcript_versions(meeting_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 14. CLIPS — shareable meeting excerpts
-- ═══════════════════════════════════════════════════════════════════════

create table public.clips (
  id                uuid primary key default uuid_generate_v4(),
  meeting_id        uuid references public.meetings(id) on delete cascade not null,
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  created_by        uuid references public.profiles(id) on delete set null,
  title             text not null,
  description       text,
  start_time        numeric(10,3) not null,
  end_time          numeric(10,3) not null,
  transcript_text   text,
  share_token       text unique default encode(gen_random_bytes(16), 'hex'),
  is_public         boolean default false,
  view_count        int default 0,
  created_at        timestamptz default now() not null
);

comment on table public.clips is 'Shareable excerpts from meetings with their own share links.';

create index idx_clips_meeting on public.clips(meeting_id);
create index idx_clips_org on public.clips(organization_id);
create index idx_clips_share_token on public.clips(share_token);


-- ═══════════════════════════════════════════════════════════════════════
-- 15. NOTIFICATIONS — in-app notification center
-- ═══════════════════════════════════════════════════════════════════════

create table public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  type          text not null check (type in (
    'upload_complete', 'transcript_ready', 'processing_failed',
    'silent_recording', 'team_invite', 'team_invite_accepted',
    'action_item_assigned', 'action_item_completed', 'action_item_due',
    'meeting_shared', 'clip_shared', 'comment_added',
    'weekly_digest', 'usage_warning', 'plan_upgraded', 'plan_expiring'
  )),
  title         text not null,
  message       text,
  meeting_id    uuid references public.meetings(id) on delete cascade,
  action_url    text,
  read          boolean default false,
  archived      boolean default false,
  created_at    timestamptz default now() not null
);

comment on table public.notifications is 'In-app notification center. Supports multiple notification types.';

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_user_unread on public.notifications(user_id) where read = false;
create index idx_notifications_created on public.notifications(created_at desc);


-- ═══════════════════════════════════════════════════════════════════════
-- 16. MEETING COMMENTS — threaded discussion on meetings
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_comments (
  id            uuid primary key default uuid_generate_v4(),
  meeting_id    uuid references public.meetings(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  parent_id     uuid references public.meeting_comments(id) on delete cascade,
  text          text not null,
  timestamp_ref numeric(10,3),   -- optional reference to a transcript timestamp
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

comment on table public.meeting_comments is 'Threaded comments on meetings, optionally anchored to transcript timestamps.';

create index idx_comments_meeting on public.meeting_comments(meeting_id);
create index idx_comments_parent on public.meeting_comments(parent_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 17. USER SETTINGS — preferences per user
-- ═══════════════════════════════════════════════════════════════════════

create table public.user_settings (
  user_id                     uuid primary key references public.profiles(id) on delete cascade,

  -- Email preferences
  email_transcript_ready      boolean default true,
  email_processing_failed     boolean default true,
  email_team_invites          boolean default true,
  email_action_item_assigned  boolean default true,
  email_weekly_digest         boolean default false,
  email_meeting_shared        boolean default true,

  -- App preferences
  default_language            text default 'en',
  auto_detect_speakers        boolean default true,
  default_speaker_count       int,
  theme                       text default 'system' check (theme in ('light', 'dark', 'system')),
  compact_transcript          boolean default false,
  auto_play_audio             boolean default false,

  -- Keyboard shortcuts
  shortcuts_enabled           boolean default true,

  created_at                  timestamptz default now() not null,
  updated_at                  timestamptz default now() not null
);


-- ═══════════════════════════════════════════════════════════════════════
-- 18. INTEGRATIONS — connected third-party services
-- ═══════════════════════════════════════════════════════════════════════

create table public.integrations (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  provider          text not null check (provider in (
    'zoom', 'google_meet', 'teams', 'slack', 'notion', 'linear',
    'google_calendar', 'outlook_calendar', 'jira', 'asana', 'trello', 'webhooks'
  )),
  access_token      text,
  refresh_token     text,
  token_expires_at  timestamptz,
  config            jsonb default '{}',
  enabled           boolean default true,
  connected_by      uuid references public.profiles(id) on delete set null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null,

  unique(organization_id, provider)
);

create index idx_integrations_org on public.integrations(organization_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 19. USAGE EVENTS — granular usage tracking for billing
-- ═══════════════════════════════════════════════════════════════════════

create table public.usage_events (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete set null,
  event_type        text not null check (event_type in (
    'transcription', 'summarization', 'upload', 'recording',
    'export', 'clip_create', 'api_call', 'ai_query'
  )),
  meeting_id        uuid references public.meetings(id) on delete set null,
  duration_seconds  numeric(10,2),
  file_size_bytes   bigint,
  tokens_used       int,
  metadata          jsonb default '{}',
  created_at        timestamptz default now() not null
);

comment on table public.usage_events is 'Granular usage tracking for billing, analytics, and rate limiting.';

create index idx_usage_org on public.usage_events(organization_id);
create index idx_usage_org_type on public.usage_events(organization_id, event_type);
create index idx_usage_created on public.usage_events(created_at desc);


-- ═══════════════════════════════════════════════════════════════════════
-- 20. API KEYS — for programmatic access
-- ═══════════════════════════════════════════════════════════════════════

create table public.api_keys (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  created_by        uuid references public.profiles(id) on delete set null,
  name              text not null,
  key_hash          text not null,
  key_prefix        text not null,     -- first 8 chars for identification
  scopes            text[] default '{}',
  last_used_at      timestamptz,
  expires_at        timestamptz,
  revoked           boolean default false,
  created_at        timestamptz default now() not null
);

create index idx_api_keys_org on public.api_keys(organization_id);
create index idx_api_keys_prefix on public.api_keys(key_prefix);


-- ═══════════════════════════════════════════════════════════════════════
-- 21. AUDIT LOG — security and compliance trail
-- ═══════════════════════════════════════════════════════════════════════

create table public.audit_log (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete set null,
  action            text not null,
  resource_type     text,
  resource_id       uuid,
  metadata          jsonb default '{}',
  ip_address        inet,
  user_agent        text,
  created_at        timestamptz default now() not null
);

comment on table public.audit_log is 'Immutable audit trail for security-sensitive actions.';

create index idx_audit_org on public.audit_log(organization_id);
create index idx_audit_user on public.audit_log(user_id);
create index idx_audit_action on public.audit_log(action);
create index idx_audit_created on public.audit_log(created_at desc);


-- ═══════════════════════════════════════════════════════════════════════
-- 22. MEETING TEMPLATES — saved meeting configurations
-- ═══════════════════════════════════════════════════════════════════════

create table public.meeting_templates (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid references public.organizations(id) on delete cascade not null,
  created_by        uuid references public.profiles(id) on delete set null,
  name              text not null,
  description       text,
  language          text default 'en',
  speaker_count     int,
  tags              text[] default '{}',
  prompt_additions  text,        -- extra instructions for AI summarization
  is_default        boolean default false,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

create index idx_templates_org on public.meeting_templates(organization_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 23. SAVED SEARCHES — user-saved meeting filters
-- ═══════════════════════════════════════════════════════════════════════

create table public.saved_searches (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  name          text not null,
  filters       jsonb not null default '{}',
  pinned        boolean default false,
  created_at    timestamptz default now() not null
);

create index idx_saved_searches_user on public.saved_searches(user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGERS — auto-update timestamps
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.organizations
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.meetings
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.meeting_action_items
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.meeting_comments
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.user_settings
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.integrations
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.meeting_templates
  for each row execute function public.handle_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE + PERSONAL ORG ON SIGN-UP
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
declare
  org_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );

  -- Create personal organization
  org_id := uuid_generate_v4();
  insert into public.organizations (id, name, slug, owner_id)
  values (
    org_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)) || '''s Workspace',
    'org-' || substring(new.id::text, 1, 8),
    new.id
  );

  -- Add as owner member
  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  -- Initialize user settings
  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Helper: get org IDs the current user belongs to
create or replace function public.user_org_ids()
returns setof uuid as $$
  select organization_id from public.organization_members
  where user_id = auth.uid();
$$ language sql stable security definer;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.tags enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_tags enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.meeting_key_points enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.meeting_decisions enable row level security;
alter table public.transcript_versions enable row level security;
alter table public.clips enable row level security;
alter table public.notifications enable row level security;
alter table public.meeting_comments enable row level security;
alter table public.user_settings enable row level security;
alter table public.integrations enable row level security;
alter table public.usage_events enable row level security;
alter table public.api_keys enable row level security;
alter table public.audit_log enable row level security;
alter table public.meeting_templates enable row level security;
alter table public.saved_searches enable row level security;

-- ── Profiles ──
create policy "Users can view own profile"
  on public.profiles for select using (id = auth.uid());
create policy "Users can view profiles in their orgs"
  on public.profiles for select using (
    id in (select user_id from public.organization_members where organization_id in (select public.user_org_ids()))
  );
create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

-- ── Organizations ──
create policy "Members can view their orgs"
  on public.organizations for select using (id in (select public.user_org_ids()));
create policy "Owners can update their orgs"
  on public.organizations for update using (
    id in (select organization_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- ── Organization Members ──
create policy "Members can view org members"
  on public.organization_members for select using (organization_id in (select public.user_org_ids()));
create policy "Admins can manage org members"
  on public.organization_members for all using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- ── Team Invites ──
create policy "Members can view org invites"
  on public.team_invites for select using (organization_id in (select public.user_org_ids()));
create policy "Admins can manage invites"
  on public.team_invites for all using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin', 'member'))
  );
create policy "Invited users can view their own invites"
  on public.team_invites for select using (
    email = (select email from public.profiles where id = auth.uid())
  );

-- ── Tags ──
create policy "Members can view org tags"
  on public.tags for select using (organization_id in (select public.user_org_ids()));
create policy "Members can manage org tags"
  on public.tags for all using (organization_id in (select public.user_org_ids()));

-- ── Meetings ──
create policy "Members can view org meetings"
  on public.meetings for select using (organization_id in (select public.user_org_ids()));
create policy "Members can insert meetings"
  on public.meetings for insert with check (organization_id in (select public.user_org_ids()));
create policy "Members can update org meetings"
  on public.meetings for update using (organization_id in (select public.user_org_ids()));
create policy "Public shared meetings are viewable"
  on public.meetings for select using (is_public = true);

-- ── Meeting Tags ──
create policy "Members can manage meeting tags"
  on public.meeting_tags for all using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );

-- ── Meeting Participants ──
create policy "Members can view meeting participants"
  on public.meeting_participants for all using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );

-- ── Transcript Segments ──
create policy "Members can view segments"
  on public.transcript_segments for select using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );
create policy "Server can manage segments"
  on public.transcript_segments for all using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );

-- ── Key Points ──
create policy "Members can view key points"
  on public.meeting_key_points for all using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );

-- ── Action Items ──
create policy "Members can view org action items"
  on public.meeting_action_items for select using (organization_id in (select public.user_org_ids()));
create policy "Members can manage org action items"
  on public.meeting_action_items for all using (organization_id in (select public.user_org_ids()));

-- ── Decisions ──
create policy "Members can view org decisions"
  on public.meeting_decisions for select using (organization_id in (select public.user_org_ids()));
create policy "Members can manage org decisions"
  on public.meeting_decisions for all using (organization_id in (select public.user_org_ids()));

-- ── Transcript Versions ──
create policy "Members can view transcript versions"
  on public.transcript_versions for all using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );

-- ── Clips ──
create policy "Members can manage org clips"
  on public.clips for all using (organization_id in (select public.user_org_ids()));
create policy "Public clips viewable"
  on public.clips for select using (is_public = true);

-- ── Notifications ──
create policy "Users can view own notifications"
  on public.notifications for select using (user_id = auth.uid());
create policy "Users can update own notifications"
  on public.notifications for update using (user_id = auth.uid());
create policy "System can insert notifications"
  on public.notifications for insert with check (true);

-- ── Comments ──
create policy "Members can view meeting comments"
  on public.meeting_comments for select using (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );
create policy "Users can manage own comments"
  on public.meeting_comments for all using (user_id = auth.uid());
create policy "Members can insert comments"
  on public.meeting_comments for insert with check (
    meeting_id in (select id from public.meetings where organization_id in (select public.user_org_ids()))
  );

-- ── User Settings ──
create policy "Users can manage own settings"
  on public.user_settings for all using (user_id = auth.uid());

-- ── Integrations ──
create policy "Admins can manage integrations"
  on public.integrations for all using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );
create policy "Members can view integrations"
  on public.integrations for select using (organization_id in (select public.user_org_ids()));

-- ── Usage Events ──
create policy "Members can view org usage"
  on public.usage_events for select using (organization_id in (select public.user_org_ids()));
create policy "System can insert usage"
  on public.usage_events for insert with check (true);

-- ── API Keys ──
create policy "Admins can manage API keys"
  on public.api_keys for all using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- ── Audit Log ──
create policy "Admins can view audit log"
  on public.audit_log for select using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );
create policy "System can insert audit entries"
  on public.audit_log for insert with check (true);

-- ── Meeting Templates ──
create policy "Members can view org templates"
  on public.meeting_templates for select using (organization_id in (select public.user_org_ids()));
create policy "Members can manage org templates"
  on public.meeting_templates for all using (organization_id in (select public.user_org_ids()));

-- ── Saved Searches ──
create policy "Users manage own searches"
  on public.saved_searches for all using (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- REALTIME — enable for collaborative features
-- ═══════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.meetings;
alter publication supabase_realtime add table public.meeting_comments;
alter publication supabase_realtime add table public.meeting_action_items;
alter publication supabase_realtime add table public.team_invites;
