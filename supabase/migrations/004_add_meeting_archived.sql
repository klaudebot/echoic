-- Add archived column to meetings table
alter table public.meetings add column archived boolean default false;

-- Index for filtering archived meetings efficiently
create index idx_meetings_archived on public.meetings(archived) where archived = true;
