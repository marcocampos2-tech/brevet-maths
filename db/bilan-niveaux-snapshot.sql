-- =====================================================================
-- db/bilan-niveaux-snapshot.sql
-- Lot 3 gating (20/10/2026) : colonne historique_bilans.niveaux_snapshot.
--
-- À chaque bilan envoyé, api/cron-rappel.js enregistre l'état des niveaux
-- ACQUIS de l'élève, lu dans la vue public.niveaux_sous_theme :
--   { "<sous-thème>": ["facile", "moyen"], ... }
-- (seuls f_etat / m_etat / d_etat = 'acquis' comptent). Le bilan suivant s'en
-- sert pour la ligne « Nouveaux niveaux validés depuis le dernier bilan » :
-- niveaux acquis maintenant - niveaux acquis dans ce snapshot.
--
-- Pourquoi une NOUVELLE colonne et pas sous_themes_snapshot : celle-ci mesure
-- la difficulté TENTÉE dans la fenêtre de 21 jours (et un pourcentage), pas le
-- niveau débloqué. Réutiliser le nom avec un autre contenu rendrait les
-- anciennes lignes trompeuses.
--
-- Anciennes lignes : niveaux_snapshot reste NULL -> le bilan suivant n'affiche
-- pas la ligne « Nouveaux niveaux » (aucune comparaison fausse) et enregistre
-- son propre snapshot. Premier bilan d'un élève (aucune ligne) : référence
-- vide, tout l'acquis est « validé depuis le début ».
--
-- Colonnes devenues inutiles pour les nouvelles lignes (nullables, relevé du
-- 20/10/2026 : moy_globale, total_sessions, jours_actifs, sous_themes_snapshot) :
--   - moy_globale, sous_themes_snapshot : plus écrites (NULL), plus lues ;
--   - total_sessions : sessions TERMINÉES de la période (abandons exclus) ;
--   - jours_actifs   : jours calendaires Paris avec au moins une session terminée.
-- Aucune colonne n'est supprimée.
--
-- Aucun droit à modifier : historique_bilans reste en RLS sans policy, droits
-- retirés à anon et authenticated (db/policies.sql), accès service_role seul.
--
-- Ordre de déploiement : exécuter ce fichier AVANT de fusionner la PR. Sinon le
-- code se replie (lecture et écriture sans la colonne, console.error) : aucun
-- bilan perdu, mais aucun snapshot enregistré tant que la colonne manque.
--
-- Exécution : coller dans l'éditeur SQL Supabase (idempotent), puis :
--   notify pgrst, 'reload schema';
-- Retour arrière : alter table public.historique_bilans drop column niveaux_snapshot;
-- =====================================================================

alter table public.historique_bilans
  add column if not exists niveaux_snapshot jsonb;

comment on column public.historique_bilans.niveaux_snapshot is
  'Niveaux acquis au moment du bilan : {"<sous-thème>": ["facile","moyen"]}, lus dans niveaux_sous_theme. NULL pour les bilans antérieurs au 20/10/2026.';

notify pgrst, 'reload schema';
