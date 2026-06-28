-- Run this in Supabase → SQL Editor

-- 1. Recruiter workflow status on the candidates table.
alter table public.candidates
  add column if not exists workflow_status text
  check (workflow_status in (
    'intake_in_progress',
    'appointment_scheduled',
    'profile_reviewed',
    'appointment_completed'
  ));

-- 2. Notes per candidate, surviving re-analysis.
create table if not exists public.candidate_notes (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid not null references public.candidates(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content         text not null,
  tags            text[] not null default '{}',
  created_by      uuid references auth.users(id) on delete set null,
  created_by_name text,
  created_at      timestamptz not null default now()
);

create index if not exists candidate_notes_candidate_idx
  on public.candidate_notes (candidate_id);

alter table public.candidate_notes enable row level security;
-- Access is exclusively through the service-role admin client; no RLS policies needed.
