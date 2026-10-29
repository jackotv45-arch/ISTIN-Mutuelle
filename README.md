# ISTIN MUTUELLE

Plateforme web responsive pour la Mutuelle ISTIN, réalisée avec Next.js, React, TypeScript et Supabase. L’interface reprend l’identité bleu-blanc-rouge, les images fournies et les animations du site source.

## Fonctionnalités reliées

- /actualites — actualités publiées depuis Supabase; filtres, recherche, détail et images modifiables par l’administration.
- /evenements — agenda Supabase, filtres, fiches détaillées et compte à rebours.
- /admin — espace protégé : actualités, événements, codes étudiants et gestion des rubriques.
- /inscription — création d’un compte étudiant avec invitation, e-mail et mot de passe personnels.
- /connexion — authentification Supabase pour les étudiants.
- /espace — espace étudiant protégé; profil et préférences modifiables.
- /mot-de-passe-oublie — demande de lien de récupération Supabase.
- /mot-de-passe/nouveau — choix du nouveau mot de passe depuis le lien reçu.

## Rubriques du site

Les contenus Bureau, Finances, Médias et Paramètres (coordonnées) peuvent être modifiés depuis l’administration. Les rubriques sans information enregistrée affichent un état vide élégant. Aucun nom, montant, actualité ou événement d’exemple n’est ajouté automatiquement.

Les inscriptions réelles aux événements, transactions financières, votes, propositions étudiantes, notifications, billets QR et journal d’audit restent à développer.

## Configuration locale

1. Renseigne `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans `.env.local`.
2. Applique les scripts SQL dans l’ordre de `supabase/SETUP_GUIDE.md`. Si les scripts de base, d’actualités et d’événements sont déjà appliqués, exécute dans l’ordre :
   - `setup_student_access.sql`
   - `setup_admin_sections.sql`
   - `setup_public_contact.sql`
3. Si une ancienne version avait inséré des exemples, exécute `remove_legacy_sample_content.sql`.
4. Crée le premier compte administrateur et attribue-lui le rôle (voir le guide).
5. Vérifie la configuration avec `supabase/verify_setup.sql` (lecture seule).
6. Démarre le serveur avec `npm run dev`.

Aucune mise en production n’a été effectuée.

## Structure

- src/app — routes publiques, connexion et espaces protégés.
- src/components/admin — gestion des actualités, événements, invitations et rubriques.
- src/components/student — connexion, inscription, profil et récupération de compte.
- src/lib/platform-store.tsx — chargement et écritures Supabase des actualités et événements.
- src/lib/site-settings.ts — contenus publics des rubriques modifiables.
- src/lib/supabase — clients SSR et fonctions de mapping/persistance.
- supabase — schéma, règles d’accès et guide d’installation.