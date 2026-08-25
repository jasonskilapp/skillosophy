-- Stores a revised AI analysis pending caseworker acceptance.
alter table public.candidates
  add column if not exists pending_report jsonb,
  add column if not exists pending_pathway jsonb;
