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

-- Rejeu de "Insertion profils" : email_parent = auth.jwt()->>'email' devient
-- email_parent_valide(email_parent) — même normalisation et même contrôle
-- email_confirmed_at que ci-dessus, appliqués à un droit d'écriture. Rôle
-- {public} conservé (idem ci-dessus, hors périmètre).
drop policy if exists "Insertion profils" on profils;
create policy "Insertion profils"
on profils
for insert
with check (email_parent_valide(email_parent));

-- Rejeu de "Parent modifie source de son enfant" : même remplacement,
-- qual et with_check. Rôle {authenticated} déjà correctement cadré dans
-- l'existant, conservé.
drop policy if exists "Parent modifie source de son enfant" on profils;
create policy "Parent modifie source de son enfant"
on profils
for update
to authenticated
using (email_parent_valide(email_parent))
with check (email_parent_valide(email_parent));
