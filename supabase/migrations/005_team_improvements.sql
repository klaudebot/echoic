-- 005: Team invite improvements + meeting visibility
-- Adds composite index for pending invite lookups
-- Adds meeting visibility column for team vs private meetings
-- Adds function to auto-expire stale invites

-- Index for quickly finding pending invites by email (used by /api/team/pending-invites)
create index if not exists idx_team_invites_email_status
  on public.team_invites (email, status)
  where status = 'pending';

-- Meeting visibility: 'team' (visible to all org members) or 'private' (creator only)
alter table public.meetings
  add column if not exists visibility text default 'team'
  check (visibility in ('team', 'private'));

-- Index for efficient visibility filtering
create index if not exists idx_meetings_visibility
  on public.meetings (organization_id, visibility);

-- Function to auto-expire stale invites (can be called via cron or on-demand)
create or replace function public.expire_stale_invites()
returns integer
language plpgsql
security definer
as $$
declare
  expired_count integer;
begin
  update public.team_invites
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

-- RLS: Update meetings policy to respect visibility
-- Private meetings should only be visible to their creator
-- (This replaces the existing meeting select policy if one exists)
do $$
begin
  -- Drop the existing policy if it exists, then recreate with visibility check
  if exists (
    select 1 from pg_policies
    where policyname = 'Users can view meetings in their org'
      and tablename = 'meetings'
  ) then
    drop policy "Users can view meetings in their org" on public.meetings;
  end if;
end $$;

create policy "Users can view meetings in their org"
  on public.meetings for select
  using (
    organization_id in (select public.user_org_ids())
    and (
      visibility = 'team'
      or visibility is null
      or created_by = auth.uid()
    )
  );
