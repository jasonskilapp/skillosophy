-- Run this in Supabase → SQL Editor
-- Adds member_status to profiles for suspend/inactivate support.

alter table public.profiles
  add column if not exists member_status text not null default 'active';

alter table public.profiles
  drop constraint if exists profiles_member_status_check;

alter table public.profiles
  add constraint profiles_member_status_check
  check (member_status in ('active', 'suspended', 'inactive'));
