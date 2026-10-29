-- ISTIN MUTUELLE — propositions étudiantes (suggestions)
-- À exécuter après setup_student_access.sql dans Supabase SQL Editor.

begin;

grant select, insert on public.suggestions to authenticated;
grant select, update on public.suggestions to authenticated;
grant select, insert on public.suggestion_responses to authenticated;

-- Étudiant : lit ses propres propositions + les propositions publiques publiées
drop policy if exists "Students read own or public suggestions" on public.suggestions;
create policy "Students read own or public suggestions"
  on public.suggestions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (is_public = true and status in ('accepted', 'done', 'reviewing'))
    or exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

-- Visiteur : lit uniquement les propositions explicitement publiques
drop policy if exists "Public reads published suggestions" on public.suggestions;
create policy "Public reads published suggestions"
  on public.suggestions for select to anon
  using (is_public = true and status in ('accepted', 'done', 'reviewing'));

-- Étudiant vérifié : peut déposer une proposition (son user_id uniquement)
drop policy if exists "Students insert own suggestions" on public.suggestions;
create policy "Students insert own suggestions"
  on public.suggestions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role = 'student'
    )
  );

-- Admin : peut tout modifier (statut, public, etc.)
drop policy if exists "Admins update suggestions" on public.suggestions;
create policy "Admins update suggestions"
  on public.suggestions for update to authenticated
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

-- Réponses : lecture pour auteur de la proposition + admins
drop policy if exists "Read suggestion responses" on public.suggestion_responses;
create policy "Read suggestion responses"
  on public.suggestion_responses for select to authenticated
  using (
    exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id
        and (
          s.user_id = (select auth.uid())
          or exists (
            select 1 from public.user_roles as roles
            where roles.user_id = (select auth.uid())
              and roles.role in ('admin', 'superadmin')
          )
        )
    )
  );

drop policy if exists "Admins insert suggestion responses" on public.suggestion_responses;
create policy "Admins insert suggestion responses"
  on public.suggestion_responses for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

commit;
