-- ISTIN MUTUELLE — Abonnements Web Push (PWA)
-- Après setup_notifications_phase1.sql. Active aussi les push pour les messages de bienvenue et rappels SQL.

begin;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_push_subs_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
alter table public.notifications
  add column if not exists push_sent_at timestamptz;

revoke all on public.push_subscriptions from public, anon;
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, delete on public.push_subscriptions to service_role;
grant update on public.notifications to service_role;

drop policy if exists "Users manage own push subs" on public.push_subscriptions;
create policy "Users manage own push subs"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins read push subs" on public.push_subscriptions;
create policy "Admins read push subs"
  on public.push_subscriptions for select to authenticated
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'superadmin')
    )
  );

-- Push asynchrone pour les notifications créées directement par SQL.
-- Les actions admin passant par notifyAllStudents/notifyUser envoient déjà leur push côté application.
-- Prérequis Supabase Vault : secrets nommés push_dispatch_url et push_dispatch_secret.
-- Prérequis extension : pg_net.
create extension if not exists pg_net;

create or replace function public.dispatch_inserted_notification_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_net_schema text;
  v_group record;
  v_request_id bigint;
begin
  begin
    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'push_dispatch_url';

    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'push_dispatch_secret';
  exception
    when undefined_table or undefined_function or invalid_schema_name then
      return null;
  end;

  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
    return null;
  end if;

  select n.nspname into v_net_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_net';

  if v_net_schema is null then
    return null;
  end if;

  for v_group in
    select
      n.title,
      n.body,
      n.link,
      array_agg(distinct n.user_id) as user_ids,
      array_agg(distinct n.id) as notification_ids
    from inserted_notifications n
    where n.push_sent_at is null
      and n.type in ('account_welcome', 'event_reminder_3d', 'event_reminder_1d', 'event_today')
    group by n.title, n.body, n.link
  loop
    execute format(
      'select %I.http_post(url := $1, body := $2, headers := $3)',
      v_net_schema
    )
    into v_request_id
    using
      rtrim(v_url, '/') || '/api/push/notify',
      jsonb_build_object(
        'title', left(v_group.title, 150),
        'body', left(coalesce(v_group.body, ''), 1000),
        'url', coalesce(v_group.link, '/espace/notifications'),
        'userIds', v_group.user_ids,
        'notificationIds', v_group.notification_ids
      ),
      jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-secret', v_secret
      );
  end loop;

  return null;
exception
  when undefined_function or invalid_schema_name then
    -- Keep in-app notification inserts working if pg_net is not enabled yet.
    return null;
end;
$$;

revoke all on function public.dispatch_inserted_notification_push() from public, anon, authenticated;

drop trigger if exists push_after_notification_insert on public.notifications;
create trigger push_after_notification_insert
  after insert on public.notifications
  referencing new table as inserted_notifications
  for each statement
  execute function public.dispatch_inserted_notification_push();

commit;
