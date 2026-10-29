-- ISTIN MUTUELLE
-- À exécuter après 001_initial_schema.sql et setup_news_security.sql.
-- Publie uniquement les événements validés; réserve la gestion aux administrateurs.

begin;

grant usage on schema public to anon, authenticated;
alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

drop policy if exists "Public reads visible ISTIN events" on public.events;
create policy "Public reads visible ISTIN events"
  on public.events for select to anon
  using (status <> 'draft');

drop policy if exists "Signed-in users read visible events or admin drafts" on public.events;
create policy "Signed-in users read visible events or admin drafts"
  on public.events for select to authenticated
  using (
    status <> 'draft'
    or exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins create ISTIN events" on public.events;
create policy "Admins create ISTIN events"
  on public.events for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins update ISTIN events" on public.events;
create policy "Admins update ISTIN events"
  on public.events for update to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins delete ISTIN events" on public.events;
create policy "Admins delete ISTIN events"
  on public.events for delete to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

commit;