-- Skillosophy — Phase 1: organizations (multi-tenant) migration.
-- Run ONCE in the Supabase SQL editor on the existing project. Additive and
-- idempotent. For a fresh project, run supabase/schema.sql instead (it already
-- includes everything below).

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  type        text not null default 'campus' check (type in ('campus', 'newcomer')),
  seat_limit  integer not null default 5,
  status      text not null default 'active' check (status in ('active', 'suspended')),
  created_by  uuid,
  created_at  timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- ---------------------------------------------------------------------------
-- team_invites (org admin invites a colleague)
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
-- profiles: add the multi-tenant columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists account_type text
    check (account_type in ('platform_admin', 'org_member', 'seeker')),
  add column if not exists organization_id uuid references public.organizations (id) on delete set null,
  add column if not exists org_role text
    check (org_role in ('org_admin', 'member'));

-- Backfill account_type from the legacy role column.
update public.profiles
  set account_type = case role
    when 'admin' then 'platform_admin'
    when 'recruiter' then 'org_member'
    when 'seeker' then 'seeker'
    else account_type
  end
  where account_type is null;

-- ---------------------------------------------------------------------------
-- invites & candidates: add organization_id
-- ---------------------------------------------------------------------------
alter table public.invites
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;
alter table public.candidates
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;

create index if not exists candidates_org_idx on public.candidates (organization_id);
create index if not exists invites_org_idx on public.invites (organization_id);

-- ---------------------------------------------------------------------------
-- Default organization + backfill existing data into it
-- ---------------------------------------------------------------------------
do $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.organizations where slug = 'default';
  if default_org_id is null then
    insert into public.organizations (name, slug, type, seat_limit, status)
      values ('Default Organization', 'default', 'campus', 25, 'active')
      returning id into default_org_id;
  end if;

  -- Existing org members (formerly recruiters) join the default org as admins so
  -- they retain full access; existing data is stamped with the default org.
  update public.profiles
    set organization_id = default_org_id,
        org_role = coalesce(org_role, 'org_admin')
    where account_type = 'org_member' and organization_id is null;

  update public.candidates set organization_id = default_org_id where organization_id is null;
  update public.invites set organization_id = default_org_id where organization_id is null;
end $$;
