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

## Phase 3 — Web Push (appareil)

### SQL
`supabase/setup_push_subscriptions.sql`

### Variables d’environnement

```bash
npx web-push generate-vapid-keys
```

Dans `.env.local` / Vercel :

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = clé publique
- `VAPID_PRIVATE_KEY` = clé privée (**serveur uniquement**)
- `VAPID_SUBJECT` = `mailto:ton-email@exemple.com`
- `SUPABASE_SERVICE_ROLE_KEY` = clé service_role (**serveur uniquement, jamais NEXT_PUBLIC_**)
- `PUSH_ADMIN_SECRET` = (optionnel) secret pour protéger `POST /api/push/notify`

```bash
npm install web-push
```

### UI étudiant
`/espace/notifications` → bloc « Notifications sur l’appareil » (activer / désactiver).

### Envoi
`POST /api/push/notify` avec `{ "title", "body", "url?", "userId?" }`.

Les notifications **in-app** restent le canal principal ; le push est un complément opt-in.
