-- =====================================================================
-- db/vue-niveaux.sql
-- Vue public.niveaux_sous_theme : état de chaque niveau par élève et
-- par sous-thème commencé. Source unique de la règle de déblocage.
--
-- Règles validées par CM le 10/10/2026 :
--   - réussite       = round(score/total*100) >= 70 (4/5 avec 5 questions)
--   - niveau acquis  = 5 réussites à ce niveau
--   - Moyen ouvert   = Facile acquis
--   - Difficile ouvert = Facile ET Moyen acquis (version stricte)
--   - abandons exclus de tous les comptes
--   - à surveiller   = 6 essais ou plus au niveau en cours sans l'acquérir
--
-- États possibles d'une case :
--   'acquis'      5 réussites
--   'verrouille'  le niveau précédent n'est pas acquis
--   'jamais_joue' niveau ouvert, 0 essai
--   'en_cours'    tous les autres cas
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
  select r.user_id,
         r.theme,
         r.sous_theme,
         r.difficulte,
         r.created_at,
         (r.total > 0
          and round(r.score::numeric / r.total * 100) >= 70) as reussie
  from public.resultats r
  where not r.abandonne
    and r.user_id is not null
    and coalesce(r.sous_theme, '') <> ''
    and r.difficulte in ('facile', 'moyen', 'difficile')
),
agg as (
  select user_id,
         theme,
         sous_theme,
         count(*) filter (where difficulte = 'facile'    and reussie) as f_reussites,
         count(*) filter (where difficulte = 'facile')                as f_essais,
         count(*) filter (where difficulte = 'moyen'     and reussie) as m_reussites,
         count(*) filter (where difficulte = 'moyen')                 as m_essais,
         count(*) filter (where difficulte = 'difficile' and reussie) as d_reussites,
         count(*) filter (where difficulte = 'difficile')             as d_essais,
         count(*)                                                     as sessions_total,
         max(created_at)                                              as derniere_session
  from base
  group by user_id, theme, sous_theme
),
ouv as (
  select a.*,
         (a.f_reussites >= 5)                        as m_ouvert,
         (a.f_reussites >= 5 and a.m_reussites >= 5) as d_ouvert
  from agg a
)
select user_id,
       theme,
       sous_theme,
       f_reussites,
       f_essais,
       m_reussites,
       m_essais,
       d_reussites,
       d_essais,
       case
         when f_reussites >= 5 then 'acquis'
         when f_essais = 0     then 'jamais_joue'
         else 'en_cours'
       end as f_etat,
       case
         when not m_ouvert     then 'verrouille'
         when m_reussites >= 5 then 'acquis'
         when m_essais = 0     then 'jamais_joue'
         else 'en_cours'
       end as m_etat,
       case
         when not d_ouvert     then 'verrouille'
         when d_reussites >= 5 then 'acquis'
         when d_essais = 0     then 'jamais_joue'
         else 'en_cours'
       end as d_etat,
       case
         when not m_ouvert then 'facile'
         when not d_ouvert then 'moyen'
         else 'difficile'
       end as niveau_courant,
       case
         when not m_ouvert then (f_essais >= 6 and f_reussites < 5)
         when not d_ouvert then (m_essais >= 6 and m_reussites < 5)
         else                   (d_essais >= 6 and d_reussites < 5)
       end as a_surveiller,
       sessions_total,
       derniere_session
from ouv;

comment on view public.niveaux_sous_theme is
  'État des niveaux par élève et sous-thème commencé (règle de déblocage unique, validée le 10/10/2026). security_invoker : RLS de resultats appliquée au lecteur.';

-- Droits : aucun accès public ni anonyme, lecture pour les comptes connectés.
revoke all on public.niveaux_sous_theme from public, anon, authenticated;
grant select on public.niveaux_sous_theme to authenticated, service_role;

commit;
