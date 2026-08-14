-- Run this in Supabase → SQL Editor
-- Newcomer credential recognition & licensing pathway (Part 6 of the v8 prompt).
-- One row per candidate; each Part 6 sub-section is a JSONB column so sections
-- can be updated independently without touching the others.

create table if not exists public.candidate_pathway (
  id                   uuid primary key default gen_random_uuid(),
  candidate_id         uuid not null references public.candidates(id) on delete cascade,

  -- 6A: Profession & Regulatory Status
  regulatory_status    jsonb,

  -- 6B: Educational Credential Assessment
  eca                  jsonb,

  -- 6C: Licensing & Registration (array — one entry per target province)
  licensing            jsonb,

  -- 6D: Language Proficiency
  language_proficiency jsonb,

  -- 6E: Bridging Programs
  bridging             jsonb,

  -- 6F: Full Pathway — Step by Step
  full_path            jsonb,

  -- 6G: Superior Role Pathway
  superior_roles       jsonb,

  -- Tracks whether this row was AI-generated or manually entered
  ai_generated_at      timestamptz,

  updated_at           timestamptz not null default now(),
  updated_by_name      text,
  created_at           timestamptz not null default now(),

  unique (candidate_id)
);

create index if not exists candidate_pathway_candidate_idx
  on public.candidate_pathway (candidate_id);

alter table public.candidate_pathway enable row level security;
-- Access is exclusively through the service-role admin client; no RLS policies needed.
