-- Skillosophy — add an immutable, human-readable customer code per organization.
-- Run ONCE in the Supabase SQL editor (after 0002_organizations.sql). Additive.
-- Format: SK-0001. Auto-suggested + editable at create time; app enforces it.

alter table public.organizations
  add column if not exists customer_code text;

-- Backfill existing orgs in creation order, continuing after any existing codes.
do $$
declare
  base integer;
begin
  select coalesce(
    max((regexp_replace(customer_code, '\D', '', 'g'))::integer), 0)
    into base
    from public.organizations
    where customer_code ~ '^SK-\d+$';

  with ordered as (
    select id, row_number() over (order by created_at) as rn
      from public.organizations
      where customer_code is null
  )
  update public.organizations o
    set customer_code = 'SK-' || lpad((base + ordered.rn)::text, 4, '0')
    from ordered
    where o.id = ordered.id;
end $$;

create unique index if not exists organizations_customer_code_idx
  on public.organizations (customer_code);

alter table public.organizations
  alter column customer_code set not null;
