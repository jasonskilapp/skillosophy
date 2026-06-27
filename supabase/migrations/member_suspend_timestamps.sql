-- Run this in Supabase → SQL Editor
-- Adds timestamps for tracking how long a member has been suspended.

alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspend_review_sent_at timestamptz;
