-- =====================================================================
-- db/vue-niveaux.test.sql
-- Tests de la vue public.niveaux_sous_theme. LECTURE SEULE.
-- Exécuter chaque TEST séparément (sélectionner le bloc entier, de
-- « begin » à « rollback » quand il y en a un). Rien n'est modifié :
-- les blocs avec changement de rôle se terminent par rollback.
--
-- Lucas Démo  : 70bd9ff0-4cae-42ef-b2f7-2fbc166ca889
-- Compte test : 711bc196-928d-4b54-8e4b-e19763e83eb8
-- Parent démo : marcocampos2+demo@gmail.com
-- =====================================================================


-- ---------------------------------------------------------------------
-- TEST 1 : configuration de la vue
-- Attendu : reloptions = {security_invoker=true}
-- ---------------------------------------------------------------------
select c.relname, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'niveaux_sous_theme';


-- ---------------------------------------------------------------------
-- TEST 2 : droits
-- Attendu : SELECT pour authenticated et service_role (plus les droits
-- de postgres). AUCUNE ligne pour anon.
-- ---------------------------------------------------------------------
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'niveaux_sous_theme'
order by grantee, privilege_type;


-- ---------------------------------------------------------------------
-- TEST 3 : valeurs de Lucas Démo (lecture en tant qu'administrateur)
-- Attendu : 8 lignes.
--  sous_theme              f_reu/f_ess  m_reu/m_ess  f_etat    m_etat      d_etat      niveau  surv.  sessions
--  Aires et volumes        2/3          0/0          en_cours  verrouille  verrouille  facile  false  3
--  Équations               3/5          0/0          en_cours  verrouille  verrouille  facile  false  5
--  Fractions               5/6          0/1          acquis    en_cours    verrouille  moyen   false  7
--  Pourcentages            2/4          0/0          en_cours  verrouille  verrouille  facile  false  4
--  Proportionnalité        3/4          0/0          en_cours  verrouille  verrouille  facile  false  4
--  Puissances              1/1          0/0          en_cours  verrouille  verrouille  facile  false  1
--  Théorème de Pythagore   5/7          1/2          acquis    en_cours    verrouille  moyen   false  9
--  Théorème de Thalès      0/5          0/0          en_cours  verrouille  verrouille  facile  false  5
-- (valeurs tirées du script de démo ; un écart peut venir d'une
--  modification ultérieure des données, à analyser avant de conclure)
-- ---------------------------------------------------------------------
select sous_theme,
       f_reussites || '/' || f_essais as facile,
       m_reussites || '/' || m_essais as moyen,
       d_reussites || '/' || d_essais as difficile,
       f_etat, m_etat, d_etat,
       niveau_courant, a_surveiller, sessions_total
from public.niveaux_sous_theme
where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889'
order by sous_theme;


-- ---------------------------------------------------------------------
-- TEST 4 : cohérence avec les requêtes du 10/10 (élèves réels)
-- Attendu : moyen_ouvert = 4, difficile_ouvert = 0
-- ---------------------------------------------------------------------
select count(*) filter (where m_etat <> 'verrouille') as moyen_ouvert,
       count(*) filter (where d_etat <> 'verrouille') as difficile_ouvert
from public.niveaux_sous_theme
where user_id not in ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889',
                      '711bc196-928d-4b54-8e4b-e19763e83eb8');


-- ---------------------------------------------------------------------
-- TEST 5 : accès ÉLÈVE (Lucas connecté)
-- Attendu : lignes = 8, eleves_distincts = 1, autres_eleves = 0
-- ---------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"70bd9ff0-4cae-42ef-b2f7-2fbc166ca889","role":"authenticated"}',
  true);
set local role authenticated;
select count(*)                                       as lignes,
       count(distinct user_id)                        as eleves_distincts,
       count(*) filter (where user_id <> '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889') as autres_eleves
from public.niveaux_sous_theme;
rollback;


-- ---------------------------------------------------------------------
-- TEST 6 : accès PARENT (parent démo connecté)
-- Attendu : lignes_lucas = 8, autres_eleves = 0
-- ---------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  json_build_object(
    'sub',  (select id from auth.users
             where lower(email) = 'marcocampos2+demo@gmail.com'),
    'role', 'authenticated')::text,
  true);
set local role authenticated;
select count(*) filter (where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889')  as lignes_lucas,
       count(*) filter (where user_id <> '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889') as autres_eleves
from public.niveaux_sous_theme;
rollback;


-- ---------------------------------------------------------------------
-- TEST 7 : accès TIERS (compte test connecté, sans lien avec Lucas)
-- Attendu : lignes_lucas = 0 (le compte test ne voit que ses propres
-- lignes, éventuellement 0 si ses sessions test-rendu ont été nettoyées)
-- ---------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"711bc196-928d-4b54-8e4b-e19763e83eb8","role":"authenticated"}',
  true);
set local role authenticated;
select count(*) filter (where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889')  as lignes_lucas,
       count(*) filter (where user_id <> '711bc196-928d-4b54-8e4b-e19763e83eb8') as lignes_autres
from public.niveaux_sous_theme;
rollback;


-- ---------------------------------------------------------------------
-- TEST 8 : accès ANONYME
-- Attendu : ERREUR « permission denied for view niveaux_sous_theme ».
-- L'erreur est le bon résultat. Rien n'est modifié.
-- ---------------------------------------------------------------------
begin;
set local role anon;
select count(*) from public.niveaux_sous_theme;
rollback;
