-- ISTIN MUTUELLE — contenu éditable des rubriques administratives
-- À exécuter après setup_student_access.sql dans Supabase SQL Editor.
-- Les rubriques sans contenu restent vides jusqu’à la saisie des informations réelles.

begin;

grant usage on schema public to anon, authenticated;
alter table public.site_settings enable row level security;

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

drop policy if exists "Public reads published ISTIN editable sections" on public.site_settings;
create policy "Public reads published ISTIN editable sections"
  on public.site_settings for select to anon, authenticated
  using (key in ('admin.section.bureau', 'admin.section.finances', 'admin.section.medias'));

drop policy if exists "Administrators read ISTIN editable sections" on public.site_settings;
create policy "Administrators read ISTIN editable sections"
  on public.site_settings for select to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Administrators insert ISTIN editable sections" on public.site_settings;
create policy "Administrators insert ISTIN editable sections"
  on public.site_settings for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Administrators update ISTIN editable sections" on public.site_settings;
create policy "Administrators update ISTIN editable sections"
  on public.site_settings for update to authenticated
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

drop policy if exists "Administrators delete ISTIN editable sections" on public.site_settings;
create policy "Administrators delete ISTIN editable sections"
  on public.site_settings for delete to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

commit;
