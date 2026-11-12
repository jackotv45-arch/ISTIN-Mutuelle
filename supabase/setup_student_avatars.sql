-- ISTIN MUTUELLE — photos de profil privées
-- À exécuter après setup_news_security.sql et setup_student_access.sql.
-- Chaque étudiant peut gérer uniquement les photos placées dans son dossier UUID.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'istin-student-avatars',
  'istin-student-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set name = excluded.name,
      public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students read own ISTIN profile avatars" on storage.objects;
create policy "Students read own ISTIN profile avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'istin-student-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role = 'student'
    )
  );

drop policy if exists "Students upload own ISTIN profile avatars" on storage.objects;
create policy "Students upload own ISTIN profile avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'istin-student-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role = 'student'
    )
  );

drop policy if exists "Students delete own ISTIN profile avatars" on storage.objects;
create policy "Students delete own ISTIN profile avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'istin-student-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role = 'student'
    )
  );

commit;
