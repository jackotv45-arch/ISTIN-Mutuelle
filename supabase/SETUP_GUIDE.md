# Configuration Supabase — ISTIN MUTUELLE

Supabase gère les comptes administrateurs et étudiants, les invitations, les actualités, les images et les événements.

## 1. Variables locales

À la racine du projet, dans .env.local :

~~~env
NEXT_PUBLIC_SUPABASE_URL=https://<référence-du-projet>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé-publishable>
~~~

Ne place jamais une clé secret ou service_role dans une variable NEXT_PUBLIC_*. Le fichier .env.local est exclu du ZIP et de Git. Après toute modification, redémarre le serveur Next.js.

## 2. Préparer les tables et règles

Dans Supabase → SQL Editor, exécute les scripts dans cet ordre :

1. migrations/001_initial_schema.sql — crée les tables et types.
2. setup_news_security.sql — configure les actualités et le stockage des images.
3. setup_events_security.sql — configure l’agenda public et les droits de gestion.
4. setup_event_registrations.sql — active les inscriptions en ligne aux événements.
5. setup_student_access.sql — configure les profils, les codes d’invitation et l’inscription étudiante.
6. setup_admin_sections.sql — sécurise l’édition des contenus du site.
7. setup_public_contact.sql — autorise la lecture publique des coordonnées (page Contact).
8. setup_suggestions.sql — active le dépôt et la modération des propositions étudiantes.
9. setup_polls.sql — active les sondages et les votes étudiants.

Les trois premiers scripts ont déjà été appliqués dans le projet actuel. Exécute setup_event_registrations.sql une fois, puis setup_student_access.sql pour activer les invitations, puis setup_admin_sections.sql, setup_public_contact.sql, setup_suggestions.sql et setup_polls.sql. Ne relance pas les scripts précédents s’ils fonctionnent déjà.

Si tu avais exécuté une ancienne version du script qui ajoutait des brouillons d’exemple, exécute une fois remove_legacy_sample_content.sql. Ce nettoyage vise uniquement les brouillons connus et les rubriques encore marquées comme exemples.

Le bucket istin-news sert aux images des actualités et événements. Il doit rester public uniquement pour la lecture des images ; seuls les administrateurs peuvent ajouter ou supprimer des fichiers.

## 3. Créer un compte administrateur

Dans Authentication → Users, crée ou invite le compte de l’administrateur. Aucun formulaire d’inscription administrateur n’est exposé sur le site.

Dans SQL Editor, remplace ADMIN_EMAIL_HERE par l’adresse exacte du compte et exécute :

~~~sql
with target_user as (
  select id, email
  from auth.users
  where lower(email) = lower('ADMIN_EMAIL_HERE')
)
insert into public.profiles (id, email)
select id, email
from target_user
on conflict (id) do update set email = excluded.email;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id, role) do nothing;
~~~

Connecte-toi ensuite sur /admin/connexion.

## 4. Générer et transmettre les invitations

Après avoir exécuté setup_student_access.sql, connecte-toi à /admin, puis ouvre Codes étudiants :

- laisse Nombre de codes à 1 et Utilisations par code à 1 pour une invitation personnelle;
- ajoute une expiration si nécessaire;
- clique sur Générer les codes, puis copie le code affiché;
- transmets-le directement à l’étudiant concerné.

L’étudiant ouvre /inscription, saisit son nom, son adresse e-mail, le code et choisit son mot de passe. Il utilisera ensuite son adresse e-mail et ce mot de passe sur /connexion. Le code d’invitation n’est pas un mot de passe. Un code individuel ne peut créer qu’un compte; tu peux le désactiver dans l’administration.

Si l’option de confirmation d’adresse e-mail est activée dans Supabase Auth, configure les URL de redirection autorisées pour http://localhost:3000/** et, plus tard, pour le domaine officiel.

## 5. Vérification de la configuration

Exécute le script complet `verify_setup.sql` (lecture seule) dans le SQL Editor. Il contrôle :

- présence de toutes les tables et types ;
- activation de la RLS ;
- politiques principales ;
- trigger d’inscription étudiante et générateur de codes ;
- comptes administrateurs ;
- rubriques `site_settings` ;
- nombre d’actualités et d’événements publiés.

En cas de résultat inattendu, ne relance pas les scripts de création : corrige uniquement la partie manquante.

## 6. Coordonnées de contact

Dans l’administration → **Paramètres**, renseigne les champs :

- Adresse e-mail
- Téléphone
- Adresse
- Horaires

Laisse vides ceux qui ne sont pas encore officiels. Les champs non vides apparaissent automatiquement sur `/contact`.

## Fonctions disponibles et rubriques à connecter

La connexion administrateur, les invitations étudiantes, les profils, les actualités et les événements utilisent Supabase. Les rubriques Bureau, Finances, Médias et Paramètres (coordonnées) lisent leurs contenus dans `site_settings`. Aucun contenu fictif n’est préchargé.

Les notifications in-app et push Web couvrent les actions administrateur (événements, actualités, sondages, demandes, propositions), les messages de bienvenue et les rappels SQL. Le script de phase 2 planifie les rappels chaque jour à 02:00 UTC. Les étudiants peuvent s’inscrire en ligne aux événements pour lesquels l’administrateur a activé l’option. Les billets QR et les transactions financières traçables restent à développer.

## Invitations administrateur
Exécuter `setup_admin_invites.sql` après `setup_student_access.sql`.
Ensuite : Admin → Codes admin → générer un code → la personne s’inscrit sur `/admin/inscription`.

## Profil, tickets, notifications, audit
Exécuter `setup_platform_features.sql`.

Pour les notifications complètes, exécuter ensuite dans cet ordre :

1. `setup_notifications_phase1.sql`
2. `setup_notifications_phase2.sql`
3. `setup_push_subscriptions.sql`

Déployer d’abord le site et configurer les clés VAPID, `SUPABASE_SERVICE_ROLE_KEY` et `PUSH_DISPATCH_SECRET` dans son environnement serveur. Activer `pg_cron` et `pg_net` dans Supabase, créer dans Vault `push_dispatch_url` (origine HTTPS du site) et `push_dispatch_secret` (même valeur que `PUSH_DISPATCH_SECRET`), puis exécuter `setup_push_subscriptions.sql`. Le script `setup_notifications_phase2.sql` planifie les rappels quotidiens à 02:00 UTC. L’étudiant active ensuite les notifications depuis `/espace/notifications` sur chaque appareil. Un message de bienvenue non lu est envoyé à la prochaine ouverture après activation.
