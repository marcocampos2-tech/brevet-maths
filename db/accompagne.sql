-- =====================================================================
-- db/accompagne.sql
-- Statut « Accompagné » (lot 1 du gating) : deux colonnes sur profils, la
-- règle unique est_accompagne(), et l'écriture réservée au prof via
-- definir_offre_eleve().
--
-- À EXÉCUTER par CM, dans l'ordre : (1) ce fichier, (2) la policy
-- « Insertion profils » de db/policies.sql (section « Lot gating 1 »),
-- (3) les tests de db/accompagne.test.sql. Idempotent. Rien n'est exécuté
-- automatiquement ; le code de la PR fonctionne avant l'exécution (le badge
-- affiche « Libre », seul l'enregistrement échoue avec un message).
--
-- Règle : un élève est Accompagné si plan_actif = true OU
-- cours_particuliers_actif = true OU acces_offert_jusqu >= date du jour à
-- Paris (accès valable jusqu'à la fin de la journée indiquée). Statut par
-- élève (ligne profils). Pas de plafond sur la date (décision de CM).
--
-- Sécurité : aucun droit UPDATE n'est accordé sur ces colonnes. Le seul droit
-- UPDATE d'authenticated sur profils est celui de la colonne `source`
-- (db/policies.sql, section profils) : une colonne ajoutée n'en hérite pas.
-- L'écriture passe par definir_offre_eleve() (SECURITY DEFINER, is_prof()).
-- =====================================================================

alter table public.profils
  add column if not exists cours_particuliers_actif boolean not null default false,
  add column if not exists acces_offert_jusqu date;

comment on column public.profils.cours_particuliers_actif is
  'Accompagné par cours particuliers en cours. Écrit par le prof via definir_offre_eleve() uniquement.';
comment on column public.profils.acces_offert_jusqu is
  'Accès Accompagné offert jusqu''à cette date incluse (heure de Paris). NULL = aucun. Écrit par le prof via definir_offre_eleve() uniquement.';

-- Règle unique, sur valeurs : ne lit aucune table, utilisable sur une ligne,
-- dans une vue ou dans une policy. Date du jour = date à Paris.
create or replace function public.est_accompagne(
  p_plan_actif boolean, p_cours boolean, p_acces_jusqu date)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(p_plan_actif, false)
      or coalesce(p_cours, false)
      or coalesce(p_acces_jusqu >= (now() at time zone 'Europe/Paris')::date, false);
$$;

-- Même règle, par user_id : enrobage de la précédente (une seule règle). Lit
-- profils avec les droits de l'appelant (security invoker) : sous la RLS de
-- profils, un tiers n'obtient que false.
create or replace function public.est_accompagne(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select public.est_accompagne(p.plan_actif, p.cours_particuliers_actif, p.acces_offert_jusqu)
       from public.profils p
      where p.user_id = p_user_id),
    false);
$$;

-- Seul chemin d'écriture de ces deux colonnes. Refuse tout appelant qui n'est
-- pas prof ; ne met à jour QUE ces deux colonnes ; renvoie les valeurs
-- enregistrées. Noms de colonnes de retour distincts de ceux de profils.
create or replace function public.definir_offre_eleve(
  p_user_id uuid, p_cours boolean, p_acces_jusqu date)
returns table (cours_actif boolean, acces_jusqu date)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_prof() then
    raise exception 'Accès réservé' using errcode = '42501';
  end if;
  if p_user_id is null or p_cours is null then
    raise exception 'Paramètres invalides' using errcode = '22023';
  end if;
  return query
    update public.profils p
       set cours_particuliers_actif = p_cours,
           acces_offert_jusqu = p_acces_jusqu
     where p.user_id = p_user_id
    returning p.cours_particuliers_actif, p.acces_offert_jusqu;
  if not found then
    raise exception 'Élève introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.definir_offre_eleve(uuid, boolean, date) from public, anon;
grant execute on function public.definir_offre_eleve(uuid, boolean, date) to authenticated;

revoke all on function public.est_accompagne(boolean, boolean, date) from public, anon;
revoke all on function public.est_accompagne(uuid) from public, anon;
grant execute on function public.est_accompagne(boolean, boolean, date) to authenticated, service_role;
grant execute on function public.est_accompagne(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
