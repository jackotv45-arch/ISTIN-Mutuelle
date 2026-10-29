-- ISTIN MUTUELLE — lecture publique des coordonnées (paramètres)
-- À exécuter après setup_admin_sections.sql.
-- Permet d’afficher e-mail, téléphone, adresse et horaires sur /contact
-- lorsque les responsables les ont renseignés dans l’administration.

begin;

-- Étend la politique de lecture publique aux paramètres (coordonnées uniquement)
drop policy if exists "Public reads published ISTIN editable sections" on public.site_settings;
create policy "Public reads published ISTIN editable sections"
  on public.site_settings for select to anon, authenticated
  using (
    key in (
      'admin.section.bureau',
      'admin.section.finances',
      'admin.section.medias',
      'admin.section.parametres'
    )
  );

commit;
