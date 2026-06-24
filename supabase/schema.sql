-- Skillosophy database schema for Supabase (Postgres) — full multi-tenant model.
-- Run this in the Supabase SQL Editor for a FRESH project (e.g. the Canadian
-- project at go-live). For an existing project already on the pre-org schema,
-- run supabase/migrations/0002_organizations.sql instead.
--
-- Tenant isolation: all application data access goes through the server using
-- the service-role key (which bypasses RLS). RLS is enabled to lock out direct
-- anon/authenticated access; the only client-scoped read needed is a user
-- reading their own profile (to resolve account type + org on login).

-- ---------------------------------------------------------------------------
-- organizations: a tenant (career centre or settlement agency)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  -- Immutable business handle (e.g. SK-0001); assigned by the app at create time.
  customer_code text unique not null,
  type          text not null default 'campus' check (type in ('campus', 'newcomer')),
  seat_limit    integer not null default 5,
  status        text not null default 'active' check (status in ('active', 'suspended')),
  created_by    uuid,
  created_at    timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  account_type    text not null check (account_type in ('platform_admin', 'org_member', 'seeker')),
  organization_id uuid references public.organizations (id) on delete set null,
  org_role        text check (org_role in ('org_admin', 'member')),
  full_name       text,
  email           text,
  created_at      timestamptz not null default now(),
  -- legacy column retained for compatibility with older code paths
  role            text
);
alter table public.profiles enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read"
  on public.profiles for select
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- team_invites: an org admin invites a colleague
-- ---------------------------------------------------------------------------
create table if not exists public.team_invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token           text unique not null,
  email           text,
  name            text,
  org_role        text not null default 'member' check (org_role in ('org_admin', 'member')),
  invited_by      uuid references public.profiles (id) on delete set null,
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz
);
alter table public.team_invites enable row level security;
create index if not exists team_invites_org_idx on public.team_invites (organization_id);

-- ---------------------------------------------------------------------------
-- invites: a member's candidate invite link (org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
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
create index if not exists invites_seeker_idx on public.invites (seeker_id);
create index if not exists invites_org_idx on public.invites (organization_id);

-- ---------------------------------------------------------------------------
-- candidates: a resume upload plus its analysis (org-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.candidates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  recruiter_id    uuid references public.profiles (id) on delete set null,
  recruiter_name  text,
  seeker_id       uuid references public.profiles (id) on delete set null,
  invite_id       uuid references public.invites (id) on delete set null,
  name            text not null,
  email           text,
  meeting_date    timestamptz,
  file_path       text,
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
create index if not exists candidates_recruiter_idx on public.candidates (recruiter_id);
create index if not exists candidates_seeker_idx on public.candidates (seeker_id);
create index if not exists candidates_org_idx on public.candidates (organization_id);
create index if not exists candidates_uploaded_idx on public.candidates (uploaded_at desc);

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded resumes (private; files deleted after analysis)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;
