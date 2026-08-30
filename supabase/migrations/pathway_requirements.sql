-- Run this in Supabase → SQL Editor
-- Persistent, status-trackable requirement nodes for the newcomer pathway.
-- One row per step; seeded automatically from AI-generated fullPath.steps.

create table if not exists public.pathway_requirements (
  id                    uuid primary key default gen_random_uuid(),
  candidate_id          uuid not null references public.candidates(id) on delete cascade,

  sort_order            integer not null default 0,
  title                 text not null,
  description           text,
  category              text,   -- 'eca' | 'language' | 'licensing' | 'exam' | 'bridging' | 'other'

  status                text not null default 'not_started'
                          check (status in (
                            'not_started', 'in_progress', 'waiting_external',
                            'blocked', 'complete', 'not_applicable', 'needs_review'
                          )),

  estimated_cost_cad    text,
  estimated_timeline    text,
  source_url            text,

  caseworker_note       text,
  caseworker_updated_at timestamptz,
  caseworker_updated_by text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists pathway_requirements_candidate_idx
  on public.pathway_requirements (candidate_id, sort_order);

alter table public.pathway_requirements enable row level security;
-- Access is exclusively through the service-role admin client; no RLS policies needed.
