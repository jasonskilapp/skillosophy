-- Discova database schema for Supabase (Postgres).
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Design note: all application data access goes through the server using the
-- service-role key (which bypasses RLS). RLS is enabled to lock out direct
-- anon/authenticated access; the only client-scoped read needed is a user
-- reading their own profile (used to resolve role on login).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, carrying role + display info
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('admin', 'recruiter', 'seeker')),
  full_name   text,
  email       text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user may read their own profile (needed to resolve their role).
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read"
  on public.profiles for select
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- invites: a recruiter's shareable invite link
-- ---------------------------------------------------------------------------
create table if not exists public.invites (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,
  recruiter_id    uuid references public.profiles (id) on delete set null,
  recruiter_name  text,
  candidate_name  text,
  candidate_email text,
  seeker_id       uuid references public.profiles (id) on delete set null,
  meeting_date    timestamptz,
  status          text not null default 'pending',
  created_at      timestamptz not null default now(),
  expires_at      timestamptz
);

alter table public.invites enable row level security;
-- No policies: only the service-role server can read/write invites.

create index if not exists invites_seeker_idx on public.invites (seeker_id);

-- ---------------------------------------------------------------------------
-- candidates: a resume upload plus its analysis (status + report jsonb)
-- ---------------------------------------------------------------------------
create table if not exists public.candidates (
  id              uuid primary key default gen_random_uuid(),
  recruiter_id    uuid references public.profiles (id) on delete set null,
  recruiter_name  text,
  seeker_id       uuid references public.profiles (id) on delete set null,
  invite_id       uuid references public.invites (id) on delete set null,
  name            text not null,
  email           text,
  meeting_date    timestamptz,
  file_path       text not null,
  file_name       text,
  uploaded_at     timestamptz not null default now(),
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'done', 'failed')),
  headline        text,
  report          jsonb,
  model_used      text,
  analyzed_at     timestamptz,
  error           text
);

alter table public.candidates enable row level security;
-- No policies: only the service-role server can read/write candidates.

create index if not exists candidates_recruiter_idx on public.candidates (recruiter_id);
create index if not exists candidates_seeker_idx on public.candidates (seeker_id);
create index if not exists candidates_uploaded_idx on public.candidates (uploaded_at desc);

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded resumes (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;
-- No storage policies needed: uploads/downloads happen via the service-role
-- key on the server, which bypasses storage RLS.
