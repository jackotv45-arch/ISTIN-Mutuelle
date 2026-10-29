# Notifications ISTIN MUTUELLE

## Scripts SQL (ordre)

1. `setup_platform_features.sql` — table + RLS de base  
2. `setup_notifications_phase1.sql` — colonnes `type` / `meta`, `notify_user`, `notify_all_students`  
3. `setup_notifications_phase2.sql` — `dispatch_event_reminders()` (J-3, J-1, jour J)

## Phase 1 — automatique à l’action admin

| Type | Déclencheur |
|------|-------------|
| `event_published` | Publication d’un événement |
| `poll_opened` | Ouverture d’un sondage |
| `ticket_*` | Mise à jour d’une demande |
| `proposal_*` | Changement de statut proposition |
| `news_published` | Actualité publiée + confirmation « Notifier » |
| `account_welcome` | Inscription étudiant réussie |

## Phase 2 — rappels événements

Appeler périodiquement (SQL Editor ou cron Supabase) :

```sql
select public.dispatch_event_reminders();
```

Crée les notifs `event_reminder_3d`, `event_reminder_1d`, `event_today` sans doublon récent.

## UI étudiant

- `/espace/notifications` — liste complète  
- Cloche flottante (badge non lus) sur l’espace étudiant  

## PWA

- `manifest.webmanifest` + `sw.js` (cache v2)  
- Bannière d’installation (`PwaRegister`)  
- Push système téléphone = phase ultérieure (permissions + clés VAPID)
