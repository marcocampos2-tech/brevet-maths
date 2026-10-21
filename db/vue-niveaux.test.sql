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
--  sous_theme              f_reu/f_ess  m_reu/m_ess  f_etat    m_etat      d_etat      niveau  surv.  sessions  derniers  dern.réuss.
--  Aires et volumes        2/3          0/0          en_cours  verrouille  verrouille  facile  false  3         3         2
--  Équations               3/5          0/0          en_cours  verrouille  verrouille  facile  false  5         4         3
--  Fractions               5/6          0/1          acquis    en_cours    verrouille  moyen   false  7         1         0
--  Pourcentages            2/4          0/0          en_cours  verrouille  verrouille  facile  false  4         4         2
--  Proportionnalité        3/4          0/0          en_cours  verrouille  verrouille  facile  false  4         4         3
--  Puissances              1/1          0/0          en_cours  verrouille  verrouille  facile  false  1         1         1
--  Théorème de Pythagore   5/7          1/2          acquis    en_cours    verrouille  moyen   false  9         2         1
--  Théorème de Thalès      0/5          0/0          en_cours  verrouille  verrouille  facile  TRUE   5         4         0
-- (valeurs tirées du script de démo et de la règle « à surveiller » du
--  21/10/2026 : seul Théorème de Thalès est signalé — 4 derniers essais, 0
--  réussite ; un écart peut venir d'une modification ultérieure des données,
--  à analyser avant de conclure. « derniers » = derniers_essais et
--  « dern.réuss. » = dernieres_reussites, au niveau courant.)
-- ---------------------------------------------------------------------
select sous_theme,
       f_reussites || '/' || f_essais as facile,
       m_reussites || '/' || m_essais as moyen,
       d_reussites || '/' || d_essais as difficile,
       f_etat, m_etat, d_etat,
       niveau_courant, a_surveiller, sessions_total,
       derniers_essais, dernieres_reussites
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


-- ---------------------------------------------------------------------
-- TEST 9 : colonnes de la vue (ordre et types)
-- Attendu : les 16 colonnes d'origine dans cet ordre, types inchangés :
--  1 user_id uuid · 2 theme text · 3 sous_theme text · 4 f_reussites bigint ·
--  5 f_essais bigint · 6 m_reussites bigint · 7 m_essais bigint ·
--  8 d_reussites bigint · 9 d_essais bigint · 10 f_etat text · 11 m_etat text ·
--  12 d_etat text · 13 niveau_courant text · 14 a_surveiller boolean ·
--  15 sessions_total bigint · 16 derniere_session timestamp
-- puis, ajoutées à la FIN (21/10/2026) :
--  17 derniers_essais bigint · 18 dernieres_reussites bigint
-- ---------------------------------------------------------------------
select ordinal_position, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'niveaux_sous_theme'
order by ordinal_position;


-- ---------------------------------------------------------------------
-- TEST 10 : règle « à surveiller » sur des cas construits. ROLLBACK : rien
-- n'est conservé. Les lignes sont créées pour Lucas Démo avec des sous-thèmes
-- « ZZ … » et des dates en 2030 (aucun mélange avec ses vraies données), puis
-- annulées. Sélectionner le bloc ENTIER, de « begin » à « rollback ».
--
-- Attendu (une ligne par cas ; scores = résultats dans l'ordre chronologique,
-- une réussite = 4 ou 5 sur 5) :
--  ZZ A  3 échecs                   facile     false  3  0
--  ZZ B  4 derniers : 1 réussite    facile     true   4  1   (4,0,0,0)
--  ZZ C  4 derniers : 2 réussites   facile     false  4  2   (4,4,0,0)
--  ZZ D  anciens échecs, 2 récentes facile     false  4  2   (0,0,0,0,0,4,4)
--  ZZ E  Facile acquis              moyen      false  0  0   (niveau en cours : Moyen, 0 essai)
--  ZZ F  4 échecs                   facile     true   4  0   (0,0,0,0)
--  ZZ G  signal au niveau Moyen     moyen      true   4  1   (Facile acquis ; Moyen 0,0,0,4)
--  ZZ H  Difficile : 4 échecs       difficile  false  4  0   (Facile et Moyen acquis ; JAMAIS signalé en Difficile)
--  ZZ I  abandons exclus            facile     false  2  2   (2 terminées + 3 abandons à 0/5 ignorés)
--  ZZ J  abandon réussi ignoré      facile     true   4  0   (4 échecs ; l'abandon à 5/5 ne compte pas)
--  ZZ K  ordre par date             facile     true   4  1   (4,4,0,0,0 : les 4 derniers = 4,0,0,0)
-- ---------------------------------------------------------------------
begin;

create temp table _cas (nom text, niveau text, n0 int, scores int[], abandon boolean) on commit drop;
insert into _cas values
  ('ZZ A 3 échecs',               'facile',    0,    '{0,0,0}', false),
  ('ZZ B 4 derniers 1 réussite',  'facile',    0,    '{4,0,0,0}', false),
  ('ZZ C 4 derniers 2 réussites', 'facile',    0,    '{4,4,0,0}', false),
  ('ZZ D anciens échecs',         'facile',    0,    '{0,0,0,0,0,4,4}', false),
  ('ZZ E Facile acquis',          'facile',    0,    '{4,4,4,4,4}', false),
  ('ZZ F 4 échecs',               'facile',    0,    '{0,0,0,0}', false),
  ('ZZ G niveau Moyen',           'facile',    0,    '{4,4,4,4,4}', false),
  ('ZZ G niveau Moyen',           'moyen',     1000, '{0,0,0,4}', false),
  ('ZZ H Difficile 4 échecs',     'facile',    0,    '{4,4,4,4,4}', false),
  ('ZZ H Difficile 4 échecs',     'moyen',     1000, '{4,4,4,4,4}', false),
  ('ZZ H Difficile 4 échecs',     'difficile', 2000, '{0,0,0,0}', false),
  ('ZZ I abandons exclus',        'facile',    0,    '{4,4}', false),
  ('ZZ I abandons exclus',        'facile',    5000, '{0,0,0}', true),
  ('ZZ J abandon réussi ignoré',  'facile',    0,    '{0,0,0,0}', false),
  ('ZZ J abandon réussi ignoré',  'facile',    5000, '{5}', true),
  ('ZZ K ordre par date',         'facile',    0,    '{4,4,0,0,0}', false);

insert into resultats
  (user_id, email, prenom, email_parent, theme, sous_theme, difficulte,
   score, total, questions_ratees, temps_secondes, aucune_idee,
   source_questions, alerte_envoyee, abandonne, created_at)
select '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas',
       'marcocampos2+demo@gmail.com', 'Nombres et calculs', c.nom, c.niveau,
       s.score, 5, '[]'::jsonb, 60, 0, 'ia', true, c.abandon,
       timestamp '2030-01-01 10:00' + ((c.n0 + s.i) * interval '1 minute')
from _cas c
cross join lateral unnest(c.scores) with ordinality as s(score, i);

select sous_theme, niveau_courant, a_surveiller, derniers_essais, dernieres_reussites
from public.niveaux_sous_theme
where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889'
  and sous_theme like 'ZZ %'
order by sous_theme;

rollback;
