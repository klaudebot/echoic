-- Add columns needed by the app that were missing from the initial schema
alter table public.meetings add column if not exists transcript_text text;
alter table public.meetings add column if not exists processing_pid text;
