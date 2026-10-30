-- Autorise les administrateurs à consulter les coordonnées des étudiants inscrits
-- à au moins un événement, tout en gardant les autres profils privés.
-- Exécuter après setup_student_access.sql et setup_event_registrations.sql.

begin;

grant select on public.profiles to authenticated;

drop policy if exists "Admins read profiles of event participants" on public.profiles;
create policy "Admins read profiles of event participants"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
    and exists (
      select 1 from public.event_registrations as registration
      where registration.user_id = profiles.id
        and registration.status = 'registered'
    )
  );

commit;
