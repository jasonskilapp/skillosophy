alter table public.candidate_pathway
  add column if not exists licensing_scenarios jsonb;
