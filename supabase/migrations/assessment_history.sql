-- Run this in Supabase → SQL Editor
-- Assessment history: one row per accepted re-analysis, enabling progression tracking.
-- Also adds verified_skills to candidates for caseworker-confirmed skills.

-- 1. Assessment history table
create table if not exists public.candidate_assessments (
  id                uuid primary key default gen_random_uuid(),
  candidate_id      uuid not null references public.candidates(id) on delete cascade,
  assessment_number integer not null,
  report            jsonb not null,
  pathway_snapshot  jsonb,
  accepted_at       timestamptz not null default now(),
  accepted_by_name  text,
  unique (candidate_id, assessment_number)
);

create index if not exists candidate_assessments_candidate_idx
  on public.candidate_assessments (candidate_id, assessment_number);

alter table public.candidate_assessments enable row level security;
-- Access is exclusively through the service-role admin client; no RLS policies needed.

-- 2. Verified skills on candidates (array of "hard:Skill Name" / "soft:Skill Name" keys)
alter table public.candidates
  add column if not exists verified_skills jsonb default '[]'::jsonb;
