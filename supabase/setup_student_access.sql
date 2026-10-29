-- ISTIN MUTUELLE — comptes étudiants et invitations
-- À exécuter après 001_initial_schema.sql, setup_news_security.sql
-- et setup_events_security.sql. Les codes sont consommés à la création du compte Auth.

begin;

grant usage on schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.access_codes enable row level security;

-- Un étudiant ne lit et ne modifie que son profil. Les colonnes de rôle,
-- d’adresse et de vérification ne sont pas modifiables par l’étudiant.
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, notification_prefs, updated_at) on public.profiles to authenticated;

drop policy if exists "Users read own ISTIN profile" on public.profiles;
create policy "Users read own ISTIN profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users update own editable ISTIN profile" on public.profiles;
create policy "Users update own editable ISTIN profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Les invitations ne sont jamais visibles par les visiteurs ou les étudiants.
revoke all on public.access_codes from anon, authenticated;
grant select, insert on public.access_codes to authenticated;
grant update (is_active) on public.access_codes to authenticated;

drop policy if exists "Administrators read ISTIN access codes" on public.access_codes;
create policy "Administrators read ISTIN access codes"
  on public.access_codes for select to authenticated
  using (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "Administrators revoke ISTIN access codes" on public.access_codes;
create policy "Administrators revoke ISTIN access codes"
  on public.access_codes for update to authenticated
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

drop policy if exists "Administrators create ISTIN access codes" on public.access_codes;
create policy "Administrators create ISTIN access codes"
  on public.access_codes for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role in ('admin', 'superadmin')
    )
  );

-- Seuls les administrateurs peuvent créer des codes. La fonction vérifie le rôle,
-- limite chaque lot, et renvoie les codes créés à l’administrateur appelant.
create or replace function public.create_student_access_codes(
  p_count integer,
  p_max_uses integer,
  p_expires_at timestamptz default null,
  p_note text default null
)
returns table (id uuid, code text, max_uses integer, expires_at timestamptz, note text)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_admin_id uuid;
  v_code text;
  v_id uuid;
  v_note text;
  v_i integer;
begin
  v_admin_id := (select auth.uid());
  if v_admin_id is null or not exists (
    select 1 from public.user_roles as roles
    where roles.user_id = v_admin_id
      and roles.role in ('admin', 'superadmin')
  ) then
    raise exception using errcode = '42501', message = 'Accès administrateur requis.';
  end if;

  if p_count is null or p_count < 1 or p_count > 100 then
    raise exception using errcode = '22023', message = 'Le nombre de codes doit être compris entre 1 et 100.';
  end if;
  if p_max_uses is null or p_max_uses < 1 or p_max_uses > 500 then
    raise exception using errcode = '22023', message = 'Le nombre d’utilisations doit être compris entre 1 et 500.';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception using errcode = '22023', message = 'La date d’expiration doit être dans le futur.';
  end if;
  if pg_catalog.length(pg_catalog.btrim(coalesce(p_note, ''))) > 160 then
    raise exception using errcode = '22023', message = 'La note ne peut pas dépasser 160 caractères.';
  end if;
  v_note := nullif(pg_catalog.btrim(coalesce(p_note, '')), '');

  for v_i in 1..p_count loop
    loop
      v_code := pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 20));
      exit when not exists (select 1 from public.access_codes as existing where existing.code = v_code);
    end loop;

    insert into public.access_codes (code, max_uses, uses_count, expires_at, is_active, created_by, note)
    values (v_code, p_max_uses, 0, p_expires_at, true, v_admin_id, v_note)
    returning public.access_codes.id into v_id;

    return query select v_id, v_code, p_max_uses, p_expires_at, v_note;
  end loop;
end;
$function$;

revoke all on function public.create_student_access_codes(integer, integer, timestamptz, text) from public, anon;
grant execute on function public.create_student_access_codes(integer, integer, timestamptz, text) to authenticated;

-- Un code valide, actif, non expiré et non épuisé est consommé atomiquement
-- pendant l’insertion Auth. Une erreur annule la création du compte.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create or replace function private.handle_istin_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_code text;
  v_code_id uuid;
  v_full_name text;
begin
  v_full_name := nullif(pg_catalog.btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  v_code := pg_catalog.upper(pg_catalog.regexp_replace(coalesce(new.raw_user_meta_data ->> 'access_code', ''), '[^A-Za-z0-9]', '', 'g'));

  if v_code <> '' then
    if v_full_name is null or pg_catalog.length(v_full_name) < 2 or pg_catalog.length(v_full_name) > 100 then
      raise exception using errcode = '22023', message = 'Le nom complet est obligatoire pour un compte étudiant.';
    end if;

    update public.access_codes as codes
      set uses_count = codes.uses_count + 1
      where pg_catalog.upper(codes.code) = v_code
        and codes.is_active
        and codes.uses_count < codes.max_uses
        and (codes.expires_at is null or codes.expires_at > now())
      returning codes.id into v_code_id;

    if v_code_id is null then
      raise exception using errcode = 'P0001', message = 'Code étudiant invalide, désactivé, expiré ou déjà utilisé.';
    end if;
  end if;

  insert into public.profiles (id, full_name, email, is_verified)
  values (new.id, v_full_name, new.email, v_code_id is not null)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        is_verified = public.profiles.is_verified or excluded.is_verified;

  if v_code_id is not null then
    insert into public.user_roles (user_id, role, granted_by)
    select new.id, 'student'::public.app_role, codes.created_by
    from public.access_codes as codes
    where codes.id = v_code_id
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$;

revoke all on function private.handle_istin_auth_user_created() from public, anon, authenticated;
drop trigger if exists on_istin_auth_user_created on auth.users;
create trigger on_istin_auth_user_created
after insert on auth.users
for each row execute function private.handle_istin_auth_user_created();

commit;
