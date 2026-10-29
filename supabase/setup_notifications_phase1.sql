-- ISTIN MUTUELLE — Notifications Phase 1
-- À exécuter après setup_platform_features.sql

begin;

alter table public.notifications
  add column if not exists type text not null default 'general',
  add column if not exists meta jsonb not null default '{}'::jsonb;

create index if not exists idx_notifications_type
  on public.notifications (user_id, type, created_at desc);

-- Notifier un utilisateur précis (admin uniquement)
create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_type text default 'general',
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
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
  ) then
    raise exception 'Réservé aux administrateurs';
  end if;

  insert into public.notifications (user_id, title, body, link, type, meta)
  values (p_user_id, p_title, p_body, p_link, coalesce(p_type, 'general'), coalesce(p_meta, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.notify_user(uuid, text, text, text, text, jsonb) to authenticated;

-- Notifier tous les étudiants (signature enrichie)
create or replace function public.notify_all_students(
  p_title text,
  p_body text default null,
  p_link text default null,
  p_type text default 'general',
  p_meta jsonb default '{}'::jsonb
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

  insert into public.notifications (user_id, title, body, link, type, meta)
  select ur.user_id, p_title, p_body, p_link, coalesce(p_type, 'general'), coalesce(p_meta, '{}'::jsonb)
  from public.user_roles ur
  where ur.role = 'student';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.notify_all_students(text, text, text, text, jsonb) from public, anon;
grant execute on function public.notify_all_students(text, text, text, text, jsonb) to authenticated;

-- Compat : ancienne signature 3 args (si encore référencée)
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
begin
  return public.notify_all_students(p_title, p_body, p_link, 'general', '{}'::jsonb);
end;
$$;

revoke all on function public.notify_all_students(text, text, text) from public, anon;
grant execute on function public.notify_all_students(text, text, text) to authenticated;

commit;
