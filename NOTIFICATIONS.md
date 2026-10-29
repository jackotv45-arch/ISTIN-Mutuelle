# Notifications in-app — Phase 1

## SQL à exécuter (Supabase → SQL Editor)

1. `supabase/setup_platform_features.sql` (si pas déjà fait)
2. `supabase/setup_notifications_phase1.sql` (**obligatoire** pour `type`, `notify_user`, `notify_all_students` enrichi)

## Types Phase 1 branchés

| Type | Déclencheur |
|------|-------------|
| `event_published` | Publication d’un événement (admin) |
| `poll_opened` | Ouverture d’un sondage |
| `ticket_answered` / `ticket_in_progress` / `ticket_closed` | Mise à jour d’une demande |
| `proposal_*` | Changement de statut d’une proposition |
| `news_published` | Publication d’actualité avec option notifier |

## Côté étudiant

- `/espace/notifications` — liste, marquer lu, tout marquer lu, lien « Ouvrir »

## Test rapide

1. Compte admin : publier un événement → vérifier en SQL ou en étudiant que des lignes `notifications` sont créées.
2. Ouvrir un sondage → même vérif.
3. Répondre à un ticket → seule l’auteur reçoit la notif.
4. Compte étudiant : `/espace/notifications` affiche les alertes.
