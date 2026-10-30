-- Active les inscriptions en ligne aux événements publiés.
-- Exécuter une fois dans Supabase SQL Editor après setup_events_security.sql.

begin;

alter table public.events
  add column if not exists registration_enabled boolean not null default false;

alter table public.event_registrations enable row level security;
revoke all on public.event_registrations from anon, authenticated;
grant select, insert on public.event_registrations to authenticated;

drop policy if exists "Users and admins read event registrations" on public.event_registrations;
create policy "Users and admins read event registrations"
  on public.event_registrations for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Students register for open events" on public.event_registrations;
create policy "Students register for open events"
  on public.event_registrations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role = 'student'
    )
    and exists (
      select 1 from public.events as event
      where event.id = event_id
        and event.status = 'published'
        and event.registration_enabled
        and event.starts_at > now()
        and (event.registration_deadline is null or event.registration_deadline > now())
    )
  );

commit;
