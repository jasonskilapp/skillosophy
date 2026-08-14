-- Allow authenticated users to read the organization they belong to.
-- This is needed so the getSession() join (profiles → organizations) can
-- return the org name and type when using the non-admin Supabase client.

create policy "members can read their own org"
  on public.organizations
  for select
  to authenticated
  using (
    id = (
      select organization_id
      from public.profiles
      where id = auth.uid()
      limit 1
    )
  );
