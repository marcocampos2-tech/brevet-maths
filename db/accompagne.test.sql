-- =====================================================================
-- db/accompagne.test.sql — tests de sécurité du statut « Accompagné »
-- À lancer par CM APRÈS db/accompagne.sql et la policy « Insertion profils »
-- (db/policies.sql, section « Lot gating 1 »). Chaque bloc est indépendant :
-- l'exécuter SEUL (une erreur interrompt la transaction), il finit par un
-- rollback. Remplacer les paramètres :
--   <UID_PROF>        fe4403c8-7a22-49be-8fcd-3fca73326977
--   <UID_PARENT>      un parent réel (email confirmé)
--   <EMAIL_PARENT>    son email
--   <UID_ELEVE>       un élève de ce parent
--   <UID_AUTRE_ELEVE> un élève qui n'est PAS rattaché à ce parent
-- =====================================================================

-- Test 0 (lecture seule ; avant ET après) : droits UPDATE sur profils
select grantee, privilege_type from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'profils' and privilege_type = 'UPDATE';
   -- attendu : aucune ligne pour anon, authenticated, PUBLIC
select grantee, column_name from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profils' and privilege_type = 'UPDATE';
   -- attendu : authenticated sur 'source' seulement
select has_column_privilege('authenticated', 'public.profils', 'cours_particuliers_actif', 'UPDATE') as cours,
       has_column_privilege('authenticated', 'public.profils', 'acces_offert_jusqu', 'UPDATE') as acces;
   -- attendu (après) : false, false

-- Test 1 : le prof peut appeler la fonction (attendu : une ligne renvoyée)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_PROF>","role":"authenticated","app_metadata":{"role":"prof"}}';
select * from public.definir_offre_eleve('<UID_ELEVE>', true, current_date + 7);
rollback;

-- Test 2 : le parent ne peut pas l'appeler (attendu : erreur 42501 « Accès réservé »)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_PARENT>","role":"authenticated","email":"<EMAIL_PARENT>"}';
select * from public.definir_offre_eleve('<UID_ELEVE>', true, null);
rollback;

-- Test 3 : le parent ne peut pas modifier les colonnes (attendu : « permission denied »)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_PARENT>","role":"authenticated","email":"<EMAIL_PARENT>"}';
update public.profils set cours_particuliers_actif = true where user_id = '<UID_ELEVE>';
rollback;
-- Répéter avec : update public.profils set acces_offert_jusqu = current_date + 30 where user_id = '<UID_ELEVE>';

-- Test 4 : le parent ne peut pas insérer avec des valeurs non par défaut
-- (attendu : erreur 42501 « row-level security »)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_PARENT>","role":"authenticated","email":"<EMAIL_PARENT>"}';
insert into public.profils (user_id, prenom, nom, prenom_affiche, nom_affiche, email_parent, faux_email, plan_actif, cours_particuliers_actif)
values (gen_random_uuid(), 'test', 'test', 'Test', 'Test', '<EMAIL_PARENT>', 't@x.invalid', false, true);
rollback;
-- Répéter avec acces_offert_jusqu = current_date + 30 (et cours_particuliers_actif omis).
-- Contrôle positif (valeurs par défaut) : l'erreur attendue est 23503 (clé étrangère
-- vers auth.users), PAS 42501 : elle prouve que la policy a laissé passer.

-- Test 5 : anon ne peut rien (attendu : « permission denied » dans les trois cas)
begin;
set local role anon;
select * from public.definir_offre_eleve('<UID_ELEVE>', true, null);
rollback;
begin; set local role anon; select public.est_accompagne('<UID_ELEVE>'::uuid); rollback;
begin; set local role anon; update public.profils set cours_particuliers_actif = true; rollback;

-- Test 6 : un élève (non prof) ne peut pas appeler la fonction (attendu : 42501)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_ELEVE>","role":"authenticated"}';
select * from public.definir_offre_eleve('<UID_ELEVE>', true, null);
rollback;

-- Test 7 : la règle (attendu : f, t, t, f, t, f)
select public.est_accompagne(false, false, (now() at time zone 'Europe/Paris')::date - 1) as veille,
       public.est_accompagne(false, false, (now() at time zone 'Europe/Paris')::date)     as jour,
       public.est_accompagne(false, false, (now() at time zone 'Europe/Paris')::date + 1) as lendemain,
       public.est_accompagne(false, false, null)                                          as aucune_date,
       public.est_accompagne(true,  false, null)                                          as abonnement,
       public.est_accompagne(null,  null,  null)                                          as tout_null;

-- Test 7 bis : la lecture par user_id respecte la RLS (attendu : f)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_PARENT>","role":"authenticated","email":"<EMAIL_PARENT>"}';
select public.est_accompagne('<UID_AUTRE_ELEVE>'::uuid);
rollback;

-- Test 8 (non-régression) : le parent peut toujours modifier `source` de son enfant
-- (attendu : UPDATE 1)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UID_PARENT>","role":"authenticated","email":"<EMAIL_PARENT>"}';
update public.profils set source = 'Flyer' where user_id = '<UID_ELEVE>';
rollback;
