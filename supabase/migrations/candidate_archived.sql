-- Soft-delete column for candidate profiles.
-- Archived candidates are hidden from the default dashboard list but kept in the
-- database so they can be restored or hard-deleted by an org admin.
alter table public.candidates
  add column if not exists archived_at timestamptz;
