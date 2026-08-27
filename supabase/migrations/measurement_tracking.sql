-- Run this in Supabase → SQL Editor
-- Appointment completion, follow-up links, and the usefulness survey.
-- See docs/measurement-plan.md.

-- 1. Appointment completion + optional advisor feedback on the candidate.
--    appointment_completed_at is the sole authoritative "done" signal for
--    metrics — workflow_status can still be changed freely for display and
--    is not trusted for counting.
alter table public.candidates
  add column if not exists appointment_completed_at timestamptz;
alter table public.candidates
  add column if not exists useful_rating smallint check (useful_rating between 1 and 5);
alter table public.candidates
  add column if not exists time_saved_min integer;
alter table public.candidates
  add column if not exists appointment_note text;

-- 2. Follow-up links (next-steps summary + 4-week self-report), sent after
--    a completed appointment. No expires_at — a token only unlocks a short
--    survey/ack, not account creation or resume access.
create table if not exists public.followups (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid not null references public.candidates(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  member_id       uuid references public.profiles(id) on delete set null,
  member_name     text,
  type            text not null check (type in ('next_steps', 'self_report')),
  status          text not null default 'sent' check (status in ('pending', 'sent', 'responded')),
  token           text unique not null,
  content         text,
  sent_at         timestamptz,
  responded_at    timestamptz,
  response        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists followups_candidate_idx on public.followups (candidate_id);
create index if not exists followups_org_idx on public.followups (organization_id);
create index if not exists followups_member_idx on public.followups (member_id);

alter table public.followups enable row level security;
-- Access is exclusively through the service-role admin client; no RLS policies needed.

-- 3. Usefulness survey responses, shown to an advisor every 10th completed
--    appointment.
create table if not exists public.survey_responses (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  member_id         uuid references public.profiles(id) on delete set null,
  member_name       text,
  milestone         integer not null check (milestone > 0 and milestone % 10 = 0),
  usefulness_score  smallint not null check (usefulness_score between 1 and 5),
  answers           jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  unique (member_id, milestone)
);

create index if not exists survey_responses_org_idx on public.survey_responses (organization_id);
create index if not exists survey_responses_member_idx on public.survey_responses (member_id);

alter table public.survey_responses enable row level security;
-- Access is exclusively through the service-role admin client; no RLS policies needed.
