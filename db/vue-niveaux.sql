-- =====================================================================
-- db/vue-niveaux.sql
-- Vue public.niveaux_sous_theme : état de chaque niveau par élève et
-- par sous-thème commencé. Source unique de la règle de déblocage ET de
-- la règle « à surveiller ».
--
-- Règles validées par CM le 10/10/2026 (déblocage) et le 21/10/2026
-- (à surveiller) :
--   - réussite       = round(score/total*100) >= 70 (4/5 avec 5 questions)
--   - niveau acquis  = 5 réussites à ce niveau
--   - Moyen ouvert   = Facile acquis
--   - Difficile ouvert = Facile ET Moyen acquis (version stricte)
--   - abandons exclus de tous les comptes
--   - à surveiller   = niveau en cours FACILE ou MOYEN non acquis ET au moins
--                      4 essais à ce niveau ET au plus 1 réussite sur les 4
--                      DERNIERS essais à ce niveau (par date de création,
--                      sans limite d'ancienneté). Le signal disparaît dès 2
--                      réussites sur les 4 derniers. JAMAIS au niveau
--                      Difficile (décision du 21/10/2026) : un blocage en
--                      Difficile reste visible dans la grille comme une case
--                      en cours, sans être mis en avant. Remplace l'ancienne
--                      règle « 6 essais ou plus sans acquérir ». Seuils (4
--                      essais, 1 réussite sur 4) à réévaluer avec des données
--                      d'usage réelles (docs/TODO.md).
--
-- États possibles d'une case :
--   'acquis'      5 réussites
--   'verrouille'  le niveau précédent n'est pas acquis
--   'jamais_joue' niveau ouvert, 0 essai
--   'en_cours'    tous les autres cas
--
-- Colonnes : les 16 d'origine (noms, types et ordre inchangés, CREATE OR REPLACE
-- VIEW l'impose) puis, ajoutées à la FIN le 21/10/2026 :
--   derniers_essais      nombre d'essais pris en compte AU NIVEAU COURANT
--                        (4 au plus) ; sert aux phrases
--   dernieres_reussites  réussites parmi ces essais
--
-- Historique : modifiée EN PRODUCTION le 21/10/2026, exécutée et vérifiée par CM
-- (signalés : Marco test · Statistiques Facile, Lucas Démo · Thalès Facile ; non
-- signalés : Divine · Pythagore Difficile, Timothée · Calcul littéral). La
-- définition ci-dessous est celle exécutée, mot pour mot. Seules différences de
-- ce fichier avec l'exécution du 21/10 : begin/commit, le commentaire de la vue
-- et revoke/grant (idempotents, sans effet sur la définition ni sur les droits
-- existants que CREATE OR REPLACE conserve).
--
-- Compatibilité : les lecteurs d'origine (quiz.html, resultats.html) ne lisent
-- que les colonnes d'origine, inchangées ; seule la valeur de a_surveiller a
-- changé. Les pages qui lisent derniers_essais / dernieres_reussites (carte
-- « À surveiller », fiche prof, PDF, email) supposent ce fichier exécuté.
--
-- Sécurité : security_invoker = true. La vue applique les policies RLS
-- de resultats à la personne qui la lit (élève : ses lignes ; parent :
-- celles de son enfant ; prof : tout). Aucun accès pour anon.
--
-- Exécution : coller le fichier ENTIER dans l'éditeur SQL Supabase et
-- lancer une seule fois. Tout est dans une transaction : en cas
-- d'erreur, rien n'est créé.
-- Retour arrière : db/vue-niveaux.rollback.sql (fichier séparé).
-- =====================================================================

begin;

create or replace view public.niveaux_sous_theme
with (security_invoker = true) as
with base as (
  select r.user_id, r.theme, r.sous_theme, r.difficulte, r.created_at,
         r.total > 0 and round(r.score::numeric / r.total::numeric * 100::numeric) >= 70::numeric as reussie
  from resultats r
  where not r.abandonne and r.user_id is not null
    and coalesce(r.sous_theme, ''::text) <> ''::text
    and r.difficulte = any (array['facile'::text, 'moyen'::text, 'difficile'::text])
),
rang as (
  select b.*, row_number() over (partition by b.user_id, b.theme, b.sous_theme, b.difficulte
                                 order by b.created_at desc) as rn
  from base b
),
agg as (
  select user_id, theme, sous_theme,
    count(*) filter (where difficulte = 'facile' and reussie) as f_reussites,
    count(*) filter (where difficulte = 'facile') as f_essais,
    count(*) filter (where difficulte = 'moyen' and reussie) as m_reussites,
    count(*) filter (where difficulte = 'moyen') as m_essais,
    count(*) filter (where difficulte = 'difficile' and reussie) as d_reussites,
    count(*) filter (where difficulte = 'difficile') as d_essais,
    count(*) as sessions_total,
    max(created_at) as derniere_session,
    count(*) filter (where difficulte = 'facile' and rn <= 4) as f_rec_essais,
    count(*) filter (where difficulte = 'facile' and rn <= 4 and reussie) as f_rec_reussites,
    count(*) filter (where difficulte = 'moyen' and rn <= 4) as m_rec_essais,
    count(*) filter (where difficulte = 'moyen' and rn <= 4 and reussie) as m_rec_reussites,
    count(*) filter (where difficulte = 'difficile' and rn <= 4) as d_rec_essais,
    count(*) filter (where difficulte = 'difficile' and rn <= 4 and reussie) as d_rec_reussites
  from rang
  group by user_id, theme, sous_theme
),
ouv as (
  select a.*,
    a.f_reussites >= 5 as m_ouvert,
    a.f_reussites >= 5 and a.m_reussites >= 5 as d_ouvert
  from agg a
)
select user_id, theme, sous_theme,
  f_reussites, f_essais, m_reussites, m_essais, d_reussites, d_essais,
  case when f_reussites >= 5 then 'acquis'::text
       when f_essais = 0 then 'jamais_joue'::text
       else 'en_cours'::text end as f_etat,
  case when not m_ouvert then 'verrouille'::text
       when m_reussites >= 5 then 'acquis'::text
       when m_essais = 0 then 'jamais_joue'::text
       else 'en_cours'::text end as m_etat,
  case when not d_ouvert then 'verrouille'::text
       when d_reussites >= 5 then 'acquis'::text
       when d_essais = 0 then 'jamais_joue'::text
       else 'en_cours'::text end as d_etat,
  case when not m_ouvert then 'facile'::text
       when not d_ouvert then 'moyen'::text
       else 'difficile'::text end as niveau_courant,
  case when not m_ouvert then f_reussites < 5 and f_rec_essais >= 4 and f_rec_reussites <= 1
       when not d_ouvert then m_reussites < 5 and m_rec_essais >= 4 and m_rec_reussites <= 1
       else false end as a_surveiller,
  sessions_total,
  derniere_session,
  case when not m_ouvert then f_rec_essais
       when not d_ouvert then m_rec_essais
       else d_rec_essais end as derniers_essais,
  case when not m_ouvert then f_rec_reussites
       when not d_ouvert then m_rec_reussites
       else d_rec_reussites end as dernieres_reussites
from ouv;

notify pgrst, 'reload schema';

comment on view public.niveaux_sous_theme is
  'État des niveaux par élève et sous-thème commencé (règle de déblocage du 10/10/2026 ; règle « à surveiller » du 21/10/2026 : Facile ou Moyen non acquis, au moins 4 essais et au plus 1 réussite sur les 4 derniers, jamais en Difficile). security_invoker : RLS de resultats appliquée au lecteur.';

-- Droits : aucun accès public ni anonyme, lecture pour les comptes connectés.
revoke all on public.niveaux_sous_theme from public, anon, authenticated;
grant select on public.niveaux_sous_theme to authenticated, service_role;

commit;
