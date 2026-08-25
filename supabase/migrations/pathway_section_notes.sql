-- Caseworker notes per pathway section (keyed by section code: "6a"–"6g").
alter table public.candidate_pathway
  add column if not exists section_notes jsonb not null default '{}'::jsonb;
