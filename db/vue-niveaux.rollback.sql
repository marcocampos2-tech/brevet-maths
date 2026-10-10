-- =====================================================================
-- db/vue-niveaux.rollback.sql
-- RETOUR ARRIÈRE : supprime la vue public.niveaux_sous_theme.
--
-- À N'EXÉCUTER QU'EN CAS DE PROBLÈME, et seulement si aucune page en
-- production ne lit encore la vue (sinon la page perd son déblocage).
-- Ne touche à aucune donnée : la table resultats reste intacte.
-- =====================================================================

drop view if exists public.niveaux_sous_theme;

-- Contrôle : doit renvoyer « No rows returned ».
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name = 'niveaux_sous_theme';
