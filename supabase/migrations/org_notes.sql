-- Run this in Supabase → SQL Editor
-- Creates the org_notes table for timestamped admin notes on organizations.

create table if not exists public.org_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content         text not null,
  created_by      uuid references auth.users(id) on delete set null,
  created_by_name text,
  created_at      timestamptz not null default now()
);

create index if not exists org_notes_org_idx on public.org_notes (organization_id);

alter table public.org_notes enable row level security;
-- The app uses the service role key (admin client), so no RLS policies are needed.
-- Platform admins access notes exclusively through the server-side admin client.
