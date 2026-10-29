-- ISTIN MUTUELLE
-- À exécuter dans Supabase SQL Editor APRÈS 001_initial_schema.sql.
-- Crée des règles d’accès minimales pour les actualités et leurs images.
-- Les autres tables restent fermées aux rôles anon/authenticated.

begin;

grant usage on schema public to anon, authenticated;

alter table public.announcements enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.access_codes enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_tickets enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.suggestions enable row level security;
alter table public.suggestion_responses enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.albums enable row level security;
alter table public.media_items enable row level security;
alter table public.committee_members enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.profiles, public.user_roles, public.access_codes, public.announcements,
  public.events, public.event_registrations, public.event_tickets, public.financial_accounts,
  public.financial_transactions, public.suggestions, public.suggestion_responses, public.polls,
  public.poll_options, public.poll_votes, public.albums, public.media_items, public.committee_members,
  public.notifications, public.audit_logs, public.site_settings from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant select on public.user_roles to authenticated;

drop policy if exists "Public reads published announcements" on public.announcements;
create policy "Public reads published announcements"
  on public.announcements for select to anon
  using (status = 'published');

drop policy if exists "Signed-in users read published or their admin-visible announcements" on public.announcements;
create policy "Signed-in users read published or their admin-visible announcements"
  on public.announcements for select to authenticated
  using (
    status = 'published'
    or exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins create announcements" on public.announcements;
create policy "Admins create announcements"
  on public.announcements for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins update announcements" on public.announcements;
create policy "Admins update announcements"
  on public.announcements for update to authenticated
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

drop policy if exists "Admins delete announcements" on public.announcements;
create policy "Admins delete announcements"
  on public.announcements for delete to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Users read their own roles" on public.user_roles;
create policy "Users read their own roles"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('istin-news', 'istin-news', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "Public reads ISTIN news image objects" on storage.objects;
create policy "Public reads ISTIN news image objects"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'istin-news');

drop policy if exists "Admins upload ISTIN news images" on storage.objects;
create policy "Admins upload ISTIN news images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'istin-news'
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins update ISTIN news images" on storage.objects;
create policy "Admins update ISTIN news images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'istin-news'
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  )
  with check (
    bucket_id = 'istin-news'
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Admins delete ISTIN news images" on storage.objects;
create policy "Admins delete ISTIN news images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'istin-news'
    and exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

commit;
