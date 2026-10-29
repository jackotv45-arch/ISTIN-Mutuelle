-- ISTIN MUTUELLE — profil enrichi, tickets, notifications, audit
-- À exécuter après setup_student_access.sql

begin;

-- Profil étudiant
alter table public.profiles
  add column if not exists program text,
  add column if not exists study_year text;

-- Autoriser la mise à jour des nouveaux champs par le propriétaire
grant update (full_name, avatar_url, notification_prefs, program, study_year, updated_at)
  on public.profiles to authenticated;

-- Tickets / demandes au bureau
do $$ begin
  create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  body text not null,
  status public.ticket_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user on public.support_tickets (user_id, created_at desc);
create index if not exists idx_support_tickets_status on public.support_tickets (status, created_at desc);

alter table public.support_tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.support_tickets from anon;
grant select, insert on public.support_tickets to authenticated;
grant update (status, admin_note, updated_at) on public.support_tickets to authenticated;

drop policy if exists "Students manage own tickets" on public.support_tickets;
create policy "Students manage own tickets"
  on public.support_tickets for all to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
    )
  );

-- Notifications
revoke all on public.notifications from anon;
grant select, update (is_read) on public.notifications to authenticated;
grant insert on public.notifications to authenticated;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users mark own notifications read" on public.notifications;
create policy "Users mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins insert notifications" on public.notifications;
create policy "Admins insert notifications"
  on public.notifications for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
    )
    or user_id = auth.uid()
  );

-- Audit logs (lecture admin, écriture via fonction)
revoke all on public.audit_logs from anon;
grant select on public.audit_logs to authenticated;

drop policy if exists "Admins read audit logs" on public.audit_logs;
create policy "Admins read audit logs"
  on public.audit_logs for select to authenticated
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
    )
  );

-- Écrire un log d’audit
create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, meta)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_meta, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.write_audit_log(text, text, uuid, jsonb) from public, anon;
grant execute on function public.write_audit_log(text, text, uuid, jsonb) to authenticated;

-- Notifier tous les étudiants (admin)
create or replace function public.notify_all_students(
  p_title text,
  p_body text default null,
  p_link text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
  ) then
    raise exception 'Réservé aux administrateurs';
  end if;

  insert into public.notifications (user_id, title, body, link)
  select ur.user_id, p_title, p_body, p_link
  from public.user_roles ur
  where ur.role = 'student';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.notify_all_students(text, text, text) from public, anon;
grant execute on function public.notify_all_students(text, text, text) to authenticated;

commit;
