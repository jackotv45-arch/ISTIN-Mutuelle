-- ISTIN MUTUELLE — Vérification en lecture seule de la configuration
-- À exécuter dans Supabase → SQL Editor.
-- Aucune donnée n’est modifiée. Utilise ce script après avoir appliqué les scripts setup_*.

-- 1. Tables principales
select
  to_regclass('public.profiles') is not null as profiles,
  to_regclass('public.user_roles') is not null as user_roles,
  to_regclass('public.access_codes') is not null as access_codes,
  to_regclass('public.announcements') is not null as announcements,
  to_regclass('public.events') is not null as events,
  to_regclass('public.event_registrations') is not null as event_registrations,
  to_regclass('public.event_tickets') is not null as event_tickets,
  to_regclass('public.financial_accounts') is not null as financial_accounts,
  to_regclass('public.financial_transactions') is not null as financial_transactions,
  to_regclass('public.suggestions') is not null as suggestions,
  to_regclass('public.polls') is not null as polls,
  to_regclass('public.albums') is not null as albums,
  to_regclass('public.media_items') is not null as media_items,
  to_regclass('public.notifications') is not null as notifications,
  to_regclass('public.push_subscriptions') is not null as push_subscriptions,
  to_regclass('public.audit_logs') is not null as audit_logs,
  to_regclass('public.site_settings') is not null as site_settings,
  to_regclass('public.committee_members') is not null as committee_members;

-- 2. Types applicatifs
select
  exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'app_role') as type_app_role,
  exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'announcement_status') as type_announcement_status,
  exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'event_status') as type_event_status,
  exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'tx_type') as type_tx_type,
  exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'tx_status') as type_tx_status;

-- 3. Trigger d’inscription étudiante + générateur de codes
select
  exists (
    select 1 from pg_trigger
    where tgname = 'on_istin_auth_user_created' and not tgisinternal
  ) as student_signup_trigger,
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_student_access_codes'
  ) as code_generator_fn;

-- 4. RLS activé sur les tables critiques
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles', 'user_roles', 'access_codes', 'announcements', 'events',
    'event_registrations', 'event_tickets', 'financial_accounts', 'financial_transactions',
    'suggestions', 'polls', 'albums', 'media_items', 'notifications', 'audit_logs',
    'site_settings', 'committee_members', 'push_subscriptions'
  )
order by c.relname;

-- 5. Politiques utiles (aperçu)
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('announcements', 'events', 'site_settings', 'profiles', 'user_roles', 'access_codes', 'push_subscriptions')
order by tablename, policyname;

-- 6. Accès push, trigger de livraison et exécution du répartiteur de rappels
select
  to_regclass('public.push_subscriptions') is not null as push_table_exists,
  case when to_regclass('public.push_subscriptions') is not null then
    has_table_privilege('authenticated', 'public.push_subscriptions', 'SELECT')
  else false end as authenticated_can_select_push_subscriptions,
  case when to_regclass('public.push_subscriptions') is not null then
    has_table_privilege('authenticated', 'public.push_subscriptions', 'INSERT')
  else false end as authenticated_can_register_push_subscription,
  case when to_regclass('public.push_subscriptions') is not null then
    has_table_privilege('authenticated', 'public.push_subscriptions', 'UPDATE')
  else false end as authenticated_can_update_push_subscription,
  case when to_regclass('public.push_subscriptions') is not null then
    has_table_privilege('service_role', 'public.push_subscriptions', 'SELECT')
  else false end as service_role_can_select_push_subscriptions,
  case when to_regclass('public.push_subscriptions') is not null then
    has_table_privilege('service_role', 'public.push_subscriptions', 'DELETE')
  else false end as service_role_can_clean_push_subscriptions,
  exists (
    select 1 from pg_trigger
    where tgname = 'push_after_notification_insert'
      and tgrelid = to_regclass('public.notifications')
      and not tgisinternal
  ) as notification_push_trigger_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'push_sent_at'
  ) as push_delivery_tracking_exists,
  exists (select 1 from pg_extension where extname = 'pg_net') as pg_net_enabled,
  to_regprocedure('public.dispatch_event_reminders()') is not null as reminder_function_exists,
  case when to_regprocedure('public.dispatch_event_reminders()') is not null then
    has_function_privilege('service_role', to_regprocedure('public.dispatch_event_reminders()'), 'EXECUTE')
  else false end as service_role_can_run_reminders,
  case when to_regprocedure('public.dispatch_event_reminders()') is not null then
    not has_function_privilege('authenticated', to_regprocedure('public.dispatch_event_reminders()'), 'EXECUTE')
  else false end as authenticated_cannot_run_reminders;

-- 7. Comptes administrateurs existants
select
  u.email,
  r.role,
  r.granted_at
from public.user_roles r
join auth.users u on u.id = r.user_id
where r.role in ('admin', 'superadmin')
order by r.granted_at;

-- 8. Rubriques site_settings présentes
select key, updated_at
from public.site_settings
where key like 'admin.section.%' or key like 'site.%'
order by key;

-- 9. Contenu publié (nombres uniquement)
select
  (select count(*) from public.announcements where status = 'published') as published_news,
  (select count(*) from public.events where status = 'published') as published_events,
  (select count(*) from public.access_codes where is_active) as active_access_codes,
  (select count(*) from public.profiles) as profiles_count;
