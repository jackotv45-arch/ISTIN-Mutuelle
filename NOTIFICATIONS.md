# Notifications ISTIN MUTUELLE

## Scripts SQL (ordre)

1. `setup_platform_features.sql` — table + RLS de base  
2. `setup_notifications_phase1.sql` — colonnes `type` / `meta`, `notify_user`, `notify_all_students`  
3. `setup_notifications_phase2.sql` — rappels événements (J-3, J-1, jour J)  
4. `setup_push_subscriptions.sql` — abonnements des appareils

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

Cette fonction crée les rappels in-app et le trigger push les envoie aux appareils abonnés. Le script `setup_notifications_phase2.sql` planifie son exécution quotidienne à 02:00 UTC avec Supabase Cron :

```sql
select public.dispatch_event_reminders();
```

Crée les notifs `event_reminder_3d`, `event_reminder_1d`, `event_today` sans doublon récent.

## UI étudiant

- `/espace/notifications` — liste complète  
- Cloche flottante (badge non lus) sur l’espace étudiant  

## PWA et notifications système

- `manifest.webmanifest` + `sw.js`  
- Bannière d’installation (`PwaRegister`)  
- Le service worker peut afficher les notifications push lorsque le site est fermé.
- Le badge de l’icône est pris en charge selon l’OS et le navigateur : l’application synchronise le nombre de non-lus quand elle est ouverte; en arrière-plan, le push pose un indicateur générique lorsqu’il est disponible.
- Sur Android, le système peut afficher son propre indicateur à partir des notifications. Sur iOS/iPadOS, l’app doit être installée et les notifications autorisées. Le rendu exact dépend de l’appareil.

### Configuration Web Push

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
- `PUSH_DISPATCH_SECRET` = secret partagé entre Vercel et Supabase Vault (**serveur uniquement**)

Dans Supabase → **Database → Extensions**, active `pg_net`. Dans **Vault**, crée les secrets `push_dispatch_url` (origine HTTPS du site en production) et `push_dispatch_secret` (la même valeur que `PUSH_DISPATCH_SECRET`). Déploie d’abord le site et configure ses variables, puis exécute `setup_push_subscriptions.sql`; le trigger envoie les lots en arrière-plan vers `/api/push/notify`.

### UI étudiant
`/espace/notifications` → bloc « Notifications sur l’appareil » (activer / désactiver).

### Envoi et périmètre actuel

Les actions admin (événements, actualités, sondages, demandes et propositions) envoient le push après l’écriture in-app. Le trigger SQL envoie les messages de bienvenue et les rappels générés directement par la base. Si le message de bienvenue est créé avant l’activation des push, il reste en attente et est envoyé au prochain chargement de l’espace étudiant, s’il est encore non lu. La route `/api/push/notify` vérifie soit le rôle administrateur, soit le secret serveur partagé; elle utilise `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur.

Sans les clés VAPID, les secrets Vault, `pg_net` et `pg_cron`, les notifications restent enregistrées in-app mais aucun push ou rappel automatique n’est envoyé.

Les notifications **in-app** restent le canal principal ; le push est un complément opt-in.
