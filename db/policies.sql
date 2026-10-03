-- db/policies.sql
--
-- Source versionnée des policies RLS Academika (Supabase Postgres).
-- Pilotage historique 100 % dashboard Supabase, sans DDL versionné — voir
-- CLAUDE.md, section « CHANTIER — Audit sécurité & correction RLS » pour le
-- contexte. Ce fichier est la contre-mesure : chaque changement de policy
-- doit désormais transiter par ici avant d'être exécuté sur Supabase, pour
-- rester visible en revue de code.
--
-- Idempotent : chaque bloc peut être rejoué sans erreur sur un état déjà à
-- jour (`create or replace function`, `drop policy if exists` + `create
-- policy`). Ne rien exécuter directement sur Supabase sans une lecture ligne
-- à ligne au préalable et sans avoir dumpé `pg_policies` pour confirmer
-- l'état réel avant modification — ce fichier n'est lui-même pas garanti à
-- jour tant qu'il n'a pas été recroisé avec ce dump.
--
-- ⚠️ CLAUDE.md n'est pas la source de vérité sur l'état des policies, et ce
-- fichier ne l'est pas davantage tant qu'il n'a pas été confirmé exécuté.
-- Toujours dumper `pg_policies` avant toute décision touchant à la RLS.
--
-- État (04/10/2026, lot 3 bis) : à partir de cette date, ce fichier documente
-- l'état RELEVÉ de la base de production et n'est plus destiné à être rejoué.
-- Les sections antérieures (Lot B, Lot C) gardent leur forme idempotente ; la
-- section « Lot 3 (04/10/2026) » en fin de fichier ne l'est pas (alter table
-- add constraint) et son ordre n'est pas la chronologie d'exécution. Relevé
-- du 04/10/2026 : contraintes, définitions de fonctions, droits EXECUTE,
-- GRANT de table et policies de profils, inscriptions_stages, sessions_stages
-- et historique_bilans. Les autres tables (resultats, examens_blancs,
-- questions_banque…) n'ont pas été relevées à cette date.

-- ============================================================================
-- Lot B (05/09/2026) — correctif « un parent ne voit pas les résultats de
-- son enfant » (cf. docs/TODO.md). Périmètre : resultats, examens_blancs,
-- et rejeu de trois policies existantes sur profils avec la même
-- normalisation d'email et le même contrôle email_confirmed_at.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Fonctions
-- ---------------------------------------------------------------------------

-- est_parent_de(uuid) — l'utilisateur authentifié courant (auth.uid()) est-il
-- le parent de l'enfant p_enfant_user_id ? Ancre le contrôle sur le compte
-- réellement connecté (pas sur un email libre dans le JWT) : va chercher
-- l'email et email_confirmed_at de ce compte dans auth.users (nécessite
-- SECURITY DEFINER, auth.users n'est pas lisible par le rôle authenticated),
-- puis compare à profils.email_parent de l'enfant visé — les deux côtés
-- normalisés en lower(trim(...)).
--
-- email_confirmed_at is not null gardé volontairement (et pas retiré) :
-- la clé anon étant publique, n'importe qui peut s'inscrire sur l'email d'un
-- parent sans le posséder. Vérifié le 05/09/2026 : les 4 parents actuellement
-- en base ont un email confirmé (l'OTP de connexion vaut confirmation) — donc
-- aucun d'eux n'est rendu aveugle par cette clause. À revérifier si le mode
-- d'inscription change (ex. « Confirm email » désactivé pour de nouveaux
-- comptes créés autrement que par OTP).
create or replace function est_parent_de(p_enfant_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join profils p on lower(trim(p.email_parent)) = lower(trim(u.email))
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and p.user_id = p_enfant_user_id
  );
$$;

-- email_parent_valide(text) — variante d'est_parent_de() pour les policies
-- d'écriture sur profils (INSERT / UPDATE), où il n'existe pas encore de
-- ligne profils à interroger (cas de l'INSERT) : compare directement la
-- valeur d'email_parent proposée dans la ligne écrite à l'email confirmé de
-- l'utilisateur authentifié courant, avec la même normalisation. Ne remplace
-- pas est_parent_de() (gardée inchangée) — logique volontairement dupliquée
-- plutôt que factorisée, pour ne pas modifier une fonction déjà validée.
create or replace function email_parent_valide(p_email_parent text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and lower(trim(u.email)) = lower(trim(p_email_parent))
  );
$$;

-- a_un_profil(uuid) — p_user_id a-t-il une ligne profils ? Ferme le trou
-- documenté dans docs/TODO.md (« examens_blancs a le même trou ») : la
-- policy élève sur examens_blancs ne vérifiait que auth.uid() = user_id, pas
-- la présence d'un profil élève — un parent connecté (qui n'a jamais de
-- ligne profils) pouvait donc lire/écrire examens_blancs par un appel direct
-- à l'API Supabase avec son propre JWT, en contournant le gate client ajouté
-- sur examen.html. SECURITY DEFINER nécessaire : la policy elle-même
-- restreint déjà la lecture de profils, il faut pouvoir la vérifier sans
-- dépendre de cette même policy.
create or replace function a_un_profil(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from profils p
    where p.user_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- resultats
-- ---------------------------------------------------------------------------

-- Policy neuve, additive : les policies SELECT élève (auth.uid() = user_id)
-- et prof (is_prof()) existantes ne sont pas touchées. Postgres additionne
-- les policies permissives par OR pour une même commande.
drop policy if exists "Parent voit resultats de son enfant" on resultats;
create policy "Parent voit resultats de son enfant"
on resultats
for select
to authenticated
using (est_parent_de(user_id));

-- Pas de policy INSERT/UPDATE créée sur resultats : vérifié le 05/09/2026
-- dans api/quiz-resultat.js (insererResultat()) — l'écriture des résultats
-- passe exclusivement par ce endpoint serveur, qui utilise
-- SUPABASE_SERVICE_KEY (clé service, contourne la RLS). Aucun insert client
-- direct dans resultats trouvé dans le dépôt. Ne rien créer ici tant que ce
-- endpoint reste le seul chemin d'écriture — une policy INSERT/UPDATE serait
-- un droit d'écriture mort, jamais emprunté, et une fausse impression de
-- contrôle.

-- ---------------------------------------------------------------------------
-- examens_blancs
-- ---------------------------------------------------------------------------

-- Policy neuve, additive : "Eleve gere ses examens_blancs" (ALL,
-- auth.uid() = user_id) et "Prof gere examens_blancs" (ALL, is_prof())
-- existantes ne sont pas touchées.
drop policy if exists "Parent voit examens_blancs de son enfant" on examens_blancs;
create policy "Parent voit examens_blancs de son enfant"
on examens_blancs
for select
to authenticated
using (est_parent_de(user_id));

-- Historique : "Eleve gere ses examens_blancs" a été rejouée le 15/09/2026
-- avec ajout de a_un_profil(auth.uid()) en plus de auth.uid() = user_id, sur
-- qual et with_check, pour corriger le trou décrit ci-dessus (voir
-- a_un_profil()) — validé en base positif (compte élève réel, 14 lignes
-- toujours visibles) et négatif (compte tiers sans profil, 0 ligne, aucune
-- erreur), directement en SQL Editor. Cette policy ALL a depuis été
-- remplacée par la policy SELECT ci-dessous et n'existe plus en production.

-- Resserrement de "Eleve gere ses examens_blancs" (ALL) en lecture seule.
-- Depuis la PR #71 (api/examen.js, action 'enregistrer'), toute écriture
-- dans examens_blancs passe par le service serveur (clé service) ; le front
-- n'écrit plus jamais directement dans cette table — confirmé par recherche
-- exhaustive dans le dépôt avant cette migration (aucun insert/update/
-- delete/upsert client restant, dans aucun fichier .html). Les droits
-- INSERT/UPDATE/DELETE de l'ancienne policy ALL étaient donc un accès mort,
-- jamais emprunté par le code, et une fausse impression de contrôle.
--
-- Renommée "Eleve lit ses examens_blancs" plutôt que rejouée sous le même
-- nom : "gere" décrivait un droit ALL qui n'existe plus, et Postgres
-- interdit deux policies de même nom sur une même table — la migration
-- réelle crée la policy SELECT avant de supprimer l'ancienne (pour ne
-- laisser aucune fenêtre sans lecture élève), ce qui imposait de toute
-- façon un nom distinct le temps que les deux coexistent.
--
-- qual strictement identique à l'ancienne policy ALL : auth.uid() = user_id
-- and a_un_profil(auth.uid()). Aucun changement de portée pour la lecture
-- élève. Hors périmètre de cette migration, non touchées : "Prof gere
-- examens_blancs" (ALL, is_prof() — ses droits d'écriture ne sont pas non
-- plus exercés côté client, mais on ne resserre pas deux policies dans la
-- même migration) et "Parent voit examens_blancs de son enfant".
--
-- ⚠️ Ordre de ce fichier (drop puis create) différent de l'ordre exécuté en
-- production pour cette migration (create de la nouvelle policy d'abord,
-- puis drop de l'ancienne) : ce fichier documente l'état final voulu,
-- rejouable depuis n'importe quel état de départ — il ne reflète pas la
-- chronologie exacte des deux instructions passées en SQL Editor.
drop policy if exists "Eleve gere ses examens_blancs" on examens_blancs;
create policy "Eleve lit ses examens_blancs"
on examens_blancs
for select
to authenticated
using (auth.uid() = user_id and a_un_profil(auth.uid()));

-- ---------------------------------------------------------------------------
-- profils
-- ---------------------------------------------------------------------------

-- Rejeu de "Lecture profils" : la branche parent (email_parent =
-- auth.jwt()->>'email', comparaison brute et non normalisée) est remplacée
-- par est_parent_de(user_id). Les deux autres branches (user_id = auth.uid()
-- pour la lecture de soi-même — utilisée par quiz.html et examen.html sous
-- session élève — et is_prof() pour prof.html) sont conservées à l'identique.
-- Rôle {public} conservé tel quel (pas {authenticated}) : item déjà tracké
-- séparément dans docs/TODO.md, hors périmètre de ce correctif.
drop policy if exists "Lecture profils" on profils;
create policy "Lecture profils"
on profils
for select
using (
  (user_id = auth.uid())
  or is_prof()
  or est_parent_de(user_id)
);

-- Rejeu de "Insertion profils" (05/09/2026) : email_parent = auth.jwt()->>'email'
-- devient email_parent_valide(email_parent) — même normalisation et même
-- contrôle email_confirmed_at que ci-dessus, appliqués à un droit d'écriture.
-- Rôle {public} conservé (idem ci-dessus, hors périmètre).
--
-- ⚠️ MODIFIÉE le 04/10/2026 (lot 3 SQL). Raison : la version du 05/09 ne
-- contrôlait que email_parent — rien n'empêchait de créer un profil avec
-- plan_actif = true (abonnement actif sans paiement). La clause
-- coalesce(plan_actif, false) = false ferme ce trou. Complément : contrainte
-- UNIQUE(user_id) sur profils (section Lot 3 ci-dessous) contre la greffe
-- d'un compte sur un élève existant via est_parent_de(). Rôle {public}
-- toujours conservé ; anon n'ayant plus aucun droit de table sur profils
-- (REVOKE ALL, section Lot 3), la policy ne joue en pratique que pour
-- authenticated. Définition conforme au relevé pg_policies du 04/10/2026 :
-- with_check = (email_parent_valide(email_parent) AND
-- (COALESCE(plan_actif, false) = false)).
drop policy if exists "Insertion profils" on profils;
create policy "Insertion profils"
on profils
for insert
with check (email_parent_valide(email_parent) and coalesce(plan_actif, false) = false);

-- Rejeu de "Parent modifie source de son enfant" : même remplacement,
-- qual et with_check. Rôle {authenticated} déjà correctement cadré dans
-- l'existant, conservé. (Relevé du 04/10/2026 : inchangée. Le droit UPDATE
-- d'authenticated sur profils est limité par droit de colonne à `source` —
-- cf. section Lot 3.)
drop policy if exists "Parent modifie source de son enfant" on profils;
create policy "Parent modifie source de son enfant"
on profils
for update
to authenticated
using (email_parent_valide(email_parent))
with check (email_parent_valide(email_parent));

-- ============================================================================
-- Lot C (21/09/2026) — chantier reprise de session d'examen blanc.
-- Table examens_progression : DDL exécuté directement par Marco sur
-- Supabase (create table + alter table examens_blancs add column
-- tentative_id), pas versionné ici (ce fichier ne porte que des policies).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- examens_progression
-- ---------------------------------------------------------------------------

-- RLS activée, AUCUNE policy créée — délibéré, pas un oubli. Toute lecture et
-- toute écriture passent exclusivement par api/examen.js (clé service, qui
-- bypass RLS nativement), lui-même protégé par une vérification réelle du
-- jeton (fetch /auth/v1/user, même modèle que api/stripe-checkout.js) : le
-- user_id du corps de la requête n'est jamais utilisé comme identité pour
-- cette table. Même motif que historique_bilans/rappels_envoyes/
-- email_rate_limit (docs/TODO.md, item 15) : RLS active + zéro policy =
-- accès refusé à tout rôle autre que service_role.
--
-- Ne pas "corriger" lors d'un futur audit en ajoutant une policy SELECT pour
-- l'élève (auth.uid() = user_id) : ce serait retirer la seule garantie
-- structurelle qui rend la reprise invisible à toute lecture RLS-scoped, et
-- rouvrirait la table à un appel direct à l'API Supabase avec un JWT valide
-- mais sans passer par la validation de tentative_id/heure_fin côté serveur.

-- ============================================================================
-- Lot 3 (04/10/2026) — durcissement des droits de table, des policies et des
-- fonctions : profils, inscriptions_stages, sessions_stages, historique_bilans.
--
-- Raison : le RLS seul ne suffisait pas — anon et authenticated gardaient des
-- droits de table inutiles (ALL, TRUNCATE, TRIGGER, REFERENCES), une policy
-- d'INSERT publique subsistait sur inscriptions_stages alors que
-- api/inscription-stage.js écrit avec la clé service, un profil pouvait être
-- créé avec plan_actif = true ou greffé sur un user_id déjà existant, et
-- plusieurs fonctions SECURITY DEFINER étaient exécutables par tous.
--
-- ⚠️ SECTION D'ÉTAT, PAS DE MIGRATION : SQL exécuté directement par CM sur
-- Supabase le 04/10/2026 (hors Claude Code), état ensuite relevé dans la base
-- de production le même jour (pg_constraint, pg_policies, fonctions,
-- privilèges). Ce fichier documente le résultat ; il ne sera pas rejoué, et
-- l'ordre des blocs ci-dessous n'est pas la chronologie d'exécution.
--
-- Tests faits par CM après exécution : insertion anonyme refusée (permission
-- denied) ; inscription à un stage via le site OK ; greffe d'un compte
-- refusée (23505) ; création d'un profil avec plan_actif = true refusée (RLS) ;
-- prof.html complet OK ; création d'un enfant par un parent OK ; mise à jour
-- de `source` par un parent OK.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Contraintes (relevé du 04/10/2026)
-- ---------------------------------------------------------------------------
--   historique_bilans / historique_bilans_pkey                PRIMARY KEY (id)
--   historique_bilans / historique_bilans_type_bilan_check    CHECK (type_bilan = ANY (ARRAY['periodique','annuel']))
--   inscriptions_stages / inscriptions_stages_pkey            PRIMARY KEY (id)
--   inscriptions_stages / inscriptions_stages_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions_stages(id)
--   profils / profils_pkey                                    PRIMARY KEY (id)
--   profils / profils_user_id_fkey                            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
--   profils / profils_user_id_unique                          UNIQUE (user_id)   ← ajoutée le 04/10/2026
--   sessions_stages / sessions_stages_pkey                    PRIMARY KEY (id)
-- Aucune autre contrainte (ni CHECK, ni UNIQUE) sur ces quatre tables à cette
-- date. Les deux clés étrangères sont sans ON DELETE : supprimer les
-- inscriptions avant leurs sessions.

-- profils_user_id_unique — ajoutée le 04/10/2026. Raison : sans elle, un
-- compte pouvait insérer une seconde ligne profils portant le user_id d'un
-- élève existant et devenir « parent » de cet élève via est_parent_de()
-- (greffe). Test CM : tentative de greffe refusée, erreur 23505.
alter table profils add constraint profils_user_id_unique unique (user_id);

-- ---------------------------------------------------------------------------
-- Fonctions (définitions relevées le 04/10/2026)
-- ---------------------------------------------------------------------------

-- est_parent_de(uuid) et email_parent_valide(text) : définitions strictement
-- identiques à celles du Lot B ci-dessus (relevé du 04/10/2026), non rejouées.

-- is_prof() — MODIFIÉE le 04/10/2026 : search_path figé à '' (docs/TODO.md,
-- techniques n°13 et n°33). Raison : une fonction SECURITY DEFINER sans
-- search_path figé résout ses noms selon le search_path de l'appelant. Le
-- corps n'appelle que des objets qualifiés (auth.jwt) et des fonctions
-- natives, donc search_path = '' est sans effet sur le résultat. Logique
-- inchangée depuis l'étape 2 du chantier RLS (rôle lu dans app_metadata du
-- jeton, jamais dans user_metadata ni dans profils — cf. CLAUDE.md).
create or replace function is_prof()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'prof', false);
$$;

-- verifier_disponibilite(text, text) — le couple (prénom, nom) est-il déjà
-- pris dans profils ? Appelée par suivi-parent.html (creerEnfant) sous
-- session parent authentifiée. Non STABLE (déclarée sans), search_path
-- public. EXECUTE restreint à authenticated le 04/10/2026 (cf. ci-dessous).
create or replace function verifier_disponibilite(p_prenom text, p_nom text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from profils where prenom = p_prenom and nom = p_nom);
$$;

-- verifier_login(text, text) — renvoie le faux_email du compte élève portant
-- ce (prénom, nom), ou null. Appelée par connexion.html (rpc) AVANT toute
-- session : EXECUTE reste ouvert à anon, c'est nécessaire à la connexion
-- élève. Conséquence connue : la fonction répond sans session — cf.
-- docs/TODO.md, chantier « connexion élève » (énumération prénom/nom).
create or replace function verifier_login(p_prenom text, p_nom text)
returns text
language sql
security definer
set search_path = public
as $$
  select faux_email from profils where prenom = p_prenom and nom = p_nom limit 1;
$$;

-- inscription_stage_valide(uuid, text) — fonction conservée mais DEVENUE
-- INUTILE : plus exécutable par public, anon ni authenticated depuis le
-- 04/10/2026 (cf. EXECUTE ci-dessous) et référencée par aucune policy du
-- relevé de cette date. Contrôlait qu'une session de stage existe, n'est pas
-- annulée, a encore de la place et que l'email n'y est pas déjà inscrit ;
-- ces contrôles sont faits côté serveur par api/inscription-stage.js. search_path
-- = public appliqué le 04/10/2026.
create or replace function inscription_stage_valide(p_session_id uuid, p_email_parent text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_max_places int;
  v_annulee boolean;
  v_places_prises int;
  v_doublon int;
BEGIN
  SELECT max_places, annulee INTO v_max_places, v_annulee
  FROM sessions_stages WHERE id = p_session_id;

  IF v_annulee IS NULL OR v_annulee THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_places_prises
  FROM inscriptions_stages WHERE session_id = p_session_id;

  IF v_places_prises >= v_max_places THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_doublon
  FROM inscriptions_stages
  WHERE session_id = p_session_id
    AND lower(trim(email_parent)) = lower(trim(p_email_parent));

  RETURN v_doublon = 0;
END;
$$;

-- ---------------------------------------------------------------------------
-- Droits EXECUTE (relevé du 04/10/2026)
-- ---------------------------------------------------------------------------
--   email_parent_valide        PUBLIC, anon, authenticated
--   est_parent_de              PUBLIC, anon, authenticated
--   is_prof                    PUBLIC, anon, authenticated
--   verifier_login             PUBLIC, anon, authenticated
--   verifier_disponibilite     authenticated uniquement
--   inscription_stage_valide   aucun (absente de la liste EXECUTE)
--
-- email_parent_valide, est_parent_de, is_prof : ouverts à tous, et c'est
-- NÉCESSAIRE — les policies les appellent avec les droits de l'appelant,
-- y compris pour anon. Ne pas les révoquer. verifier_login : cf. ci-dessus.
--
-- Appliqué le 04/10/2026 :
revoke execute on function inscription_stage_valide(uuid, text) from public, anon, authenticated;
revoke execute on function verifier_disponibilite(text, text) from public, anon;
-- (EXECUTE de verifier_disponibilite conservé pour authenticated — seul
-- appelant : suivi-parent.html, sous session parent.)

-- ---------------------------------------------------------------------------
-- profils
-- ---------------------------------------------------------------------------

-- RLS active (constaté le 04/10/2026). Policies : "Lecture profils" et
-- "Parent modifie source de son enfant" inchangées (Lot B) ; "Insertion
-- profils" modifiée le 04/10/2026 (cf. section profils du Lot B). Aucune
-- policy DELETE : le droit de table DELETE d'authenticated (ci-dessous) est
-- donc sans effet sous RLS (déduction, non testée).
alter table profils enable row level security;

-- Droits de table appliqués le 04/10/2026 :
revoke all on profils from anon;
revoke truncate, trigger, references on profils from authenticated;
-- Relevé : authenticated a DELETE, INSERT, SELECT sur la table. UPDATE n'est
-- accordé QUE sur la colonne `source` (droit de colonne) — état constaté le
-- 04/10/2026, déjà en place avant le lot (non appliqué ce jour-là) : c'est ce
-- qui borne "Parent modifie source de son enfant" à cette seule colonne.
grant update (source) on profils to authenticated;

-- ---------------------------------------------------------------------------
-- inscriptions_stages
-- ---------------------------------------------------------------------------

-- RLS active (constaté le 04/10/2026).
alter table inscriptions_stages enable row level security;

-- Supprimée le 04/10/2026 : "Ecriture publique inscriptions_stages insert".
-- Raison : inutile — l'inscription publique passe par api/inscription-stage.js,
-- qui écrit avec la clé service (RLS contournée) ; le formulaire du site ne
-- touche jamais la table avec la clé anon. Test CM : inscription à un stage
-- via le site OK après suppression.
drop policy if exists "Ecriture publique inscriptions_stages insert" on inscriptions_stages;

-- Policies restantes, relevées le 04/10/2026 (durcissement du 26/09/2026) :
drop policy if exists "Prof lit inscriptions_stages" on inscriptions_stages;
create policy "Prof lit inscriptions_stages"
on inscriptions_stages
for select
using (is_prof());

drop policy if exists "Ecriture prof inscriptions_stages update" on inscriptions_stages;
create policy "Ecriture prof inscriptions_stages update"
on inscriptions_stages
for update
using (is_prof())
with check (is_prof());

drop policy if exists "Ecriture prof inscriptions_stages delete" on inscriptions_stages;
create policy "Ecriture prof inscriptions_stages delete"
on inscriptions_stages
for delete
using (is_prof());

-- Droits de table appliqués le 04/10/2026 :
revoke all on inscriptions_stages from anon;
revoke truncate, trigger, references on inscriptions_stages from authenticated;
-- Relevé : authenticated a DELETE, INSERT, SELECT, UPDATE. Aucune policy
-- INSERT n'existe plus : le droit INSERT est donc sans effet sous RLS
-- (déduction, non testée) — toute création d'inscription passe par la clé
-- service.

-- ---------------------------------------------------------------------------
-- sessions_stages
-- ---------------------------------------------------------------------------

-- RLS active (constaté le 04/10/2026).
alter table sessions_stages enable row level security;

-- Policies relevées le 04/10/2026 (durcissement du 26/09/2026), inchangées :
drop policy if exists "Ecriture prof sessions_stages" on sessions_stages;
create policy "Ecriture prof sessions_stages"
on sessions_stages
for all
using (is_prof())
with check (is_prof());

drop policy if exists "Lecture publique sessions_stages" on sessions_stages;
create policy "Lecture publique sessions_stages"
on sessions_stages
for select
using (true);
-- ⚠️ Le nom « Lecture publique » n'est plus littéral depuis le 04/10/2026 :
-- anon n'a plus aucun droit de table sur sessions_stages (REVOKE ALL
-- ci-dessous), la policy ne s'applique donc qu'à authenticated. La lecture
-- publique des sessions par stages-vacances.html passe par
-- api/inscription-stage.js (GET), qui lit avec la clé service.

-- Droits de table appliqués le 04/10/2026 :
revoke all on sessions_stages from anon;
revoke truncate, trigger, references on sessions_stages from authenticated;
-- Relevé : authenticated a DELETE, INSERT, SELECT, UPDATE.

-- ---------------------------------------------------------------------------
-- historique_bilans
-- ---------------------------------------------------------------------------

-- RLS active SANS AUCUNE POLICY — par conception, pas un oubli (cf.
-- docs/TODO.md, section « RLS parent » et technique n°15) : la table n'est
-- lue et écrite que par api/cron-rappel.js avec la clé service, seul accès
-- prévu (service_role). Aucun accès client n'existe ni n'est prévu. Ne pas
-- « corriger » en ajoutant une policy.
alter table historique_bilans enable row level security;

-- Droits de table appliqués le 04/10/2026 (plus aucun droit pour anon ni
-- authenticated — ceinture en plus de la RLS) :
revoke all on historique_bilans from anon, authenticated;
