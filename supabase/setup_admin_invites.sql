-- ISTIN MUTUELLE — invitations administrateurs
-- Exécuter après setup_student_access.sql
-- Les codes admin sont des codes d’accès ciblés (target_role = admin).

begin;

-- Colonne de cible : student (défaut) ou admin
alter table public.access_codes
  add column if not exists target_role public.app_role not null default 'student';

-- Les anciens codes restent étudiants
update public.access_codes
set target_role = 'student'
where target_role is null;

-- Génération de codes administrateurs (usage unique recommandé)
create or replace function public.create_admin_access_codes(
  p_count integer default 1,
  p_max_uses integer default 1,
  p_expires_at timestamptz default null,
  p_note text default null
)
returns table (
  id uuid,
  code text,
  max_uses integer,
  expires_at timestamptz,
  note text
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_is_admin boolean;
  v_i integer;
  v_code text;
  v_id uuid;
begin
  select exists (
    select 1 from public.user_roles as roles
    where roles.user_id = auth.uid()
      and roles.role in ('admin', 'superadmin')
  ) into v_is_admin;

  if not v_is_admin then
    raise exception using errcode = '42501', message = 'Seuls les administrateurs peuvent créer des invitations admin.';
  end if;

  if p_count is null or p_count < 1 or p_count > 20 then
    raise exception using errcode = '22023', message = 'Le nombre de codes doit être entre 1 et 20.';
  end if;

  if p_max_uses is null or p_max_uses < 1 or p_max_uses > 5 then
    raise exception using errcode = '22023', message = 'Un code admin doit avoir entre 1 et 5 utilisations.';
  end if;

  for v_i in 1..p_count loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));

    insert into public.access_codes (code, max_uses, uses_count, expires_at, is_active, created_by, note, target_role)
    values (v_code, p_max_uses, 0, p_expires_at, true, auth.uid(), nullif(btrim(coalesce(p_note, '')), ''), 'admin')
    returning public.access_codes.id into v_id;

    id := v_id;
    code := v_code;
    max_uses := p_max_uses;
    expires_at := p_expires_at;
    note := nullif(btrim(coalesce(p_note, '')), '');
    return next;
  end loop;
end;
$function$;

revoke all on function public.create_admin_access_codes(integer, integer, timestamptz, text) from public, anon;
grant execute on function public.create_admin_access_codes(integer, integer, timestamptz, text) to authenticated;

-- Mise à jour du trigger Auth : le rôle suit target_role du code
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
  v_target_role public.app_role;
  v_created_by uuid;
begin
  v_full_name := nullif(pg_catalog.btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  v_code := pg_catalog.upper(pg_catalog.regexp_replace(coalesce(new.raw_user_meta_data ->> 'access_code', ''), '[^A-Za-z0-9]', '', 'g'));

  if v_code <> '' then
    if v_full_name is null or pg_catalog.length(v_full_name) < 2 or pg_catalog.length(v_full_name) > 100 then
      raise exception using errcode = '22023', message = 'Le nom complet est obligatoire.';
    end if;

    update public.access_codes as codes
      set uses_count = codes.uses_count + 1
      where pg_catalog.upper(codes.code) = v_code
        and codes.is_active
        and codes.uses_count < codes.max_uses
        and (codes.expires_at is null or codes.expires_at > now())
      returning codes.id, codes.target_role, codes.created_by
        into v_code_id, v_target_role, v_created_by;

    if v_code_id is null then
      raise exception using errcode = 'P0001', message = 'Code invalide, désactivé, expiré ou déjà utilisé.';
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
    values (
      new.id,
      coalesce(v_target_role, 'student'::public.app_role),
      v_created_by
    )
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$;

-- Permettre à un compte déjà existant d’activer un code admin
create or replace function public.redeem_admin_invite_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_code text;
  v_code_id uuid;
  v_created_by uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'Authentification requise.';
  end if;

  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_code = '' then
    raise exception using errcode = '22023', message = 'Code requis.';
  end if;

  update public.access_codes as codes
    set uses_count = codes.uses_count + 1
    where upper(codes.code) = v_code
      and codes.is_active
      and codes.target_role = 'admin'
      and codes.uses_count < codes.max_uses
      and (codes.expires_at is null or codes.expires_at > now())
    returning codes.id, codes.created_by into v_code_id, v_created_by;

  if v_code_id is null then
    raise exception using errcode = 'P0001', message = 'Code administrateur invalide, expiré ou déjà utilisé.';
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (v_uid, 'admin'::public.app_role, v_created_by)
  on conflict (user_id, role) do nothing;

  update public.profiles
    set is_verified = true
    where id = v_uid;

  return true;
end;
$function$;

revoke all on function public.redeem_admin_invite_code(text) from public, anon;
grant execute on function public.redeem_admin_invite_code(text) to authenticated;

commit;
