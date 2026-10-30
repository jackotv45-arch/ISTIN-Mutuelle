-- ISTIN Mutuelle — schéma initial (PostgreSQL / Supabase)
-- À exécuter après création du projet Supabase.
-- Montants financiers en centimes de FCFA (entiers).
-- Appliquer les règles d’accès des scripts setup_news_security.sql et setup_events_security.sql.

-- Extensions
create extension if not exists "pgcrypto";

-- Rôles applicatifs (pas de self-promotion admin)
create type public.app_role as enum ('visitor', 'student', 'admin', 'superadmin');

create type public.announcement_status as enum ('draft', 'published', 'archived');
create type public.event_status as enum ('draft', 'published', 'full', 'ended', 'cancelled');
create type public.suggestion_status as enum ('received', 'reviewing', 'accepted', 'rejected', 'done');
create type public.poll_status as enum ('draft', 'open', 'closed');
create type public.tx_type as enum ('income', 'expense', 'adjustment');
create type public.tx_status as enum ('pending', 'validated', 'rejected');

-- Profils (lié à auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  student_id text,
  is_verified boolean not null default false,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rôles séparés du profil (sécurité)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'student',
  granted_by uuid references public.profiles (id),
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Codes d'accès / invitations
create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  max_uses int not null default 1,
  uses_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  note text
);

-- Actualités
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_url text,
  category text,
  author_label text,
  status public.announcement_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Événements
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  body text,
  cover_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  organizer text,
  capacity int,
  registration_deadline timestamptz,
  registration_enabled boolean not null default false,
  status public.event_status not null default 'draft',
  practical_info text[],
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'registered',
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (event_id, user_id)
);

create table public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.event_registrations (id) on delete cascade,
  ticket_code text not null unique,
  qr_payload text not null,
  validated_at timestamptz,
  validated_by uuid references public.profiles (id),
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Finances
create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opening_balance_cents bigint not null default 0,
  opening_date date not null,
  currency text not null default 'XAF',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.financial_accounts (id),
  tx_type public.tx_type not null,
  amount_cents bigint not null check (amount_cents > 0),
  category text,
  label text not null,
  tx_date date not null,
  status public.tx_status not null default 'pending',
  attachment_url text,
  created_by uuid references public.profiles (id),
  validated_by uuid references public.profiles (id),
  validated_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- Propositions
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  is_anonymous boolean not null default false,
  title text not null,
  category text,
  body text not null,
  status public.suggestion_status not null default 'received',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suggestion_responses (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  author_id uuid references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Sondages
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.poll_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  results_public boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null,
  position int not null default 0
);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

-- Médias
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_url text,
  event_id uuid references public.events (id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  url text not null,
  thumb_url text,
  media_type text not null default 'image',
  caption text,
  taken_at date,
  created_at timestamptz not null default now()
);

-- Bureau
create table public.committee_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text not null,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Audit
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Index utiles
create index idx_announcements_status on public.announcements (status, published_at desc);
create index idx_events_starts on public.events (starts_at);
create index idx_event_reg_user on public.event_registrations (user_id);
create index idx_tx_account_status on public.financial_transactions (account_id, status, tx_date);
create index idx_notifications_user on public.notifications (user_id, is_read, created_at desc);
create index idx_audit_created on public.audit_logs (created_at desc);

-- Vue solde : ouverture + recettes validées - dépenses validées
-- À adapter selon account_id
comment on table public.financial_transactions is
  'Montants en centimes XAF (entiers). Solde = ouverture + income validés - expense validés + adjustments validés.';
