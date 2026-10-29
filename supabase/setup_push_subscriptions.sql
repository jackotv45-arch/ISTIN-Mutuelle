-- ISTIN MUTUELLE — Abonnements Web Push (PWA)
-- Après setup_notifications_phase1.sql

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

revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

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

commit;
