-- ISTIN MUTUELLE — nettoyage des données de démonstration précédemment ajoutées
-- Supprime uniquement les brouillons connus créés par l’ancienne version du script
-- et les réglages encore marqués comme exemples. Les autres contenus sont conservés.

begin;

delete from public.announcements
where slug in ('exemple-bienvenue-istin', 'exemple-solidarite-etudiante')
  and title like 'EXEMPLE À REMPLACER — %';

delete from public.events
where slug = 'exemple-rencontre-etudiante'
  and title like 'EXEMPLE À REMPLACER — %';

delete from public.site_settings
where key in (
    'admin.section.finances',
    'admin.section.inscriptions',
    'admin.section.propositions',
    'admin.section.sondages',
    'admin.section.medias',
    'admin.section.bureau',
    'admin.section.rapports',
    'admin.section.demandes',
    'admin.section.parametres'
  )
  and value ->> 'isExample' = 'true';

commit;