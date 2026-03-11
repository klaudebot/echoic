-- Add column to store AI-censored meeting content for public sharing
alter table public.meetings add column if not exists shared_content jsonb;

comment on column public.meetings.shared_content is 'AI-censored version of meeting content for public share links. Contains sanitized summary, key points, action items, and decisions with PII removed.';
