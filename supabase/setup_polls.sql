-- ISTIN MUTUELLE — sondages et votes
-- À exécuter après setup_student_access.sql

begin;

grant select on public.polls to anon, authenticated;
grant insert, update, delete on public.polls to authenticated;
grant select on public.poll_options to anon, authenticated;
grant insert, update, delete on public.poll_options to authenticated;
grant select, insert on public.poll_votes to authenticated;

-- Lecture : sondages ouverts pour tous les authentifiés ; tout pour les admins
drop policy if exists "Read polls" on public.polls;
create policy "Read polls"
  on public.polls for select to authenticated
  using (
    status = 'open'
    or exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Public reads open polls" on public.polls;
create policy "Public reads open polls"
  on public.polls for select to anon
  using (status = 'open' and results_public = true);

drop policy if exists "Admins manage polls" on public.polls;
create policy "Admins manage polls"
  on public.polls for all to authenticated
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role in ('admin', 'superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Read poll options" on public.poll_options;
create policy "Read poll options"
  on public.poll_options for select to anon, authenticated
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (
          p.status = 'open'
          or p.results_public = true
          or exists (
            select 1 from public.user_roles r
            where r.user_id = (select auth.uid())
              and r.role in ('admin', 'superadmin')
          )
        )
    )
  );

drop policy if exists "Admins manage poll options" on public.poll_options;
create policy "Admins manage poll options"
  on public.poll_options for all to authenticated
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role in ('admin', 'superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role in ('admin', 'superadmin')
    )
  );

-- Votes : un étudiant vote une fois ; lit son propre vote ; admin lit tout
drop policy if exists "Students insert own vote" on public.poll_votes;
create policy "Students insert own vote"
  on public.poll_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'student'
    )
    and exists (
      select 1 from public.polls p
      where p.id = poll_id and p.status = 'open'
    )
  );

drop policy if exists "Read votes" on public.poll_votes;
create policy "Read votes"
  on public.poll_votes for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role in ('admin', 'superadmin')
    )
    or exists (
      select 1 from public.polls p
      where p.id = poll_id and p.results_public = true and p.status in ('open', 'closed')
    )
  );

commit;
