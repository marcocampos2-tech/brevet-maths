-- =====================================================================
-- db/resultats-questions-ratees-detail.sql
-- Colonne public.resultats.questions_ratees_detail : détail des questions
-- ratées issues de la banque (id et énoncé complet).
--
-- Migration EXÉCUTÉE en production le 18/10/2026 (par CM), avec le texte
-- exact ci-dessous. Versionnée ici ; ne rien exécuter sans relecture.
-- Idempotente (add column if not exists) : sans effet sur un état à jour.
--
-- Format de la colonne et règles de lecture : CLAUDE.md, section « Détail des
-- questions ratées ». Écriture : api/quiz-resultat.js. Aucune policy ni droit
-- modifié : les policies SELECT de resultats sont au niveau de la ligne.
-- =====================================================================

alter table public.resultats
  add column if not exists questions_ratees_detail jsonb;

comment on column public.resultats.questions_ratees_detail is
  'Questions ratées issues de la banque : liste de { id, enonce, aucune_idee }. NULL = session abandonnée ou antérieure au 18/10/2026. Les questions IA n''y figurent pas.';

notify pgrst, 'reload schema';
