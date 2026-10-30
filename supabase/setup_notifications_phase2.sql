-- ISTIN MUTUELLE — Notifications Phase 2 (rappels événements)
-- Exécuter après setup_notifications_phase1.sql. Planifie un passage quotidien à 02:00 UTC.

begin;

create or replace function public.dispatch_event_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_row record;
  v_inserted integer;
  v_day date := (timezone('Africa/Libreville', now()))::date;
begin
  -- Événements publiés dont la date (Libreville) est dans 3 jours, 1 jour ou aujourd'hui
  for v_row in
    select
      e.id,
      e.slug,
      e.title,
      (timezone('Africa/Libreville', e.starts_at))::date as local_day,
      ((timezone('Africa/Libreville', e.starts_at))::date - v_day) as days_left
    from public.events e
    where e.status = 'published'
      and e.starts_at is not null
      and (timezone('Africa/Libreville', e.starts_at))::date in (v_day, v_day + 1, v_day + 3)
  loop
    if v_row.days_left = 3 then
      insert into public.notifications (user_id, title, body, link, type, meta)
      select ur.user_id,
             'Dans 3 jours',
             v_row.title || ' a lieu dans 3 jours.',
             '/evenements/' || v_row.slug,
             'event_reminder_3d',
             jsonb_build_object('event_id', v_row.id, 'slug', v_row.slug, 'days_left', 3)
      from public.user_roles ur
      where ur.role = 'student'
        and not exists (
          select 1 from public.notifications n
          where n.user_id = ur.user_id
            and n.type = 'event_reminder_3d'
            and n.meta->>'slug' = v_row.slug
            and n.created_at > now() - interval '2 days'
        );
      get diagnostics v_inserted = row_count;
      v_count := v_count + v_inserted;
    elsif v_row.days_left = 1 then
      insert into public.notifications (user_id, title, body, link, type, meta)
      select ur.user_id,
             'Demain',
             v_row.title || ' a lieu demain.',
             '/evenements/' || v_row.slug,
             'event_reminder_1d',
             jsonb_build_object('event_id', v_row.id, 'slug', v_row.slug, 'days_left', 1)
      from public.user_roles ur
      where ur.role = 'student'
        and not exists (
          select 1 from public.notifications n
          where n.user_id = ur.user_id
            and n.type = 'event_reminder_1d'
            and n.meta->>'slug' = v_row.slug
            and n.created_at > now() - interval '2 days'
        );
      get diagnostics v_inserted = row_count;
      v_count := v_count + v_inserted;
    elsif v_row.days_left = 0 then
      insert into public.notifications (user_id, title, body, link, type, meta)
      select ur.user_id,
             'Aujourd''hui',
             v_row.title || ' a lieu aujourd''hui.',
             '/evenements/' || v_row.slug,
             'event_today',
             jsonb_build_object('event_id', v_row.id, 'slug', v_row.slug, 'days_left', 0)
      from public.user_roles ur
      where ur.role = 'student'
        and not exists (
          select 1 from public.notifications n
          where n.user_id = ur.user_id
            and n.type = 'event_today'
            and n.meta->>'slug' = v_row.slug
            and n.created_at > now() - interval '20 hours'
        );
      get diagnostics v_inserted = row_count;
      v_count := v_count + v_inserted;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.dispatch_event_reminders() from public, anon, authenticated;
grant execute on function public.dispatch_event_reminders() to service_role;

create extension if not exists pg_cron;
select cron.schedule(
  'istin-event-reminders',
  '0 2 * * *',
  'select public.dispatch_event_reminders();'
);

commit;
