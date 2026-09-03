-- ═══════════════════════════════════════════════════════════════════════
-- COMPTE DE DÉMONSTRATION — « Lucas Démo »
-- Créé le 03/09/2026
--
-- Objet : jeu de données d'un élève moyen crédible sur ~1 mois, destiné à
--   (a) alimenter les captures d'écran de suivi-parent.html et de quiz.html,
--   (b) servir de jeu de test à la refonte de suivi-parent.html, où le
--       NIVEAU ATTEINT remplace le score comme indicateur central.
--
-- À EXÉCUTER DANS L'ÉDITEUR SQL SUPABASE, dans l'ordre des blocs.
-- Les comptes auth (parent + élève) ont été créés par l'UI, pas ici :
-- écrire auth.users à la main produit un compte sans ligne `identities`,
-- qui se crée sans erreur et ne se connecte jamais.
--
--   BLOC 1 — isolement du compte           (à passer EN PREMIER)
--   BLOC 2 — insertion des 40 sessions
--   BLOC 3 — vérification (lecture seule)
--   BLOC 4 — suppression complète          (ne pas exécuter par défaut)
--
-- Identifiants :
--   élève   user_id      70bd9ff0-4cae-42ef-b2f7-2fbc166ca889
--           faux_email   lucas_demo_dkma@academika.app
--   parent  email        marcocampos2+demo@gmail.com
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- BLOC 1 — ISOLEMENT
--
-- À exécuter AVANT le bloc 2. Le cron passe une fois par jour à 19h UTC ;
-- tant que ce bloc n'est pas passé, une insertion de sessions ouvre une
-- fenêtre pendant laquelle le compte est un profil ordinaire.
--
-- Trois barrières, aucune colonne nouvelle :
--
--   1. email_actif = false — coupe les QUATRE chemins d'envoi :
--      bilan périodique, été et fin d'année (api/cron-rappel.js, garde
--      `if (!email_parent || email_actif === false) continue`) ainsi que
--      le récap journalier (api/email.js, branche 'recap-journalier-user',
--      même garde). C'est le mécanisme du désabonnement parent, déjà en
--      production — pas un flag inventé pour l'occasion.
--
--   2. alerte_envoyee = true sur chaque ligne insérée (bloc 2) — le bloc
--      de rattrapage du cron filtre sur `alerte_envoyee=eq.false` et ne
--      sélectionne donc même pas ces lignes. Défense en profondeur : la
--      barrière tient encore si la barrière 1 tombait.
--
--   3. source = 'demo' + nom_affiche = 'Démo' — deux colonnes existantes,
--      toutes deux affichées dans prof.html. Le compte reste visible dans
--      le dashboard prof (4e élève, ~38 sessions) : décision assumée,
--      l'identification à l'œil suffit, prof.html n'est pas modifié.
--
-- La colonne `nom` (minuscules) n'est PAS touchée : verifier_login et
-- verifier_disponibilite s'appuient dessus, la modifier casserait la
-- connexion de l'élève. Seul nom_affiche, qui est de l'affichage, change.
-- ═══════════════════════════════════════════════════════════════════════

update profils
set email_actif  = false,       -- barrière 1
    source       = 'demo',      -- barrière 3 (l'UI avait enregistré 'flyer')
    nom_affiche  = 'Démo'       -- barrière 3 (l'UI avait normalisé en 'DEMO')
where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';

-- Contrôle : doit renvoyer exactement 1 ligne, email_actif = false.
select user_id, prenom_affiche, nom_affiche, email_parent, email_actif, source, plan_actif
from profils
where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';


-- ═══════════════════════════════════════════════════════════════════════
-- BLOC 2 — LES 40 SESSIONS
--
-- 38 sessions + 2 abandons, du 4 août au 3 septembre 2026.
-- 14 jours actifs sur 31, dont 9 sur les 14 derniers (trou de 2 jours le
-- week-end du 29-30 août).
--
-- Colonnes et formats repris de insererResultat() (api/quiz-resultat.js) :
--   email            le faux_email de l'élève, comme le fait quiz.html
--   prenom           user_metadata.prenom, soit 'Lucas'
--   questions_ratees jsonb, longueur = total - score, entrées au format
--                    `${theme} — ${q.chapitre}` avec les chapitres que
--                    api/generer.js impose au modèle (l. 119-146). Les
--                    entrées comptées dans aucune_idee portent le préfixe
--                    '[Aucune idée] '.
--   abandon          score 0, total 5, questions_ratees ["Quiz abandonné"]
--                    — c'est cette chaîne que suivi-parent.html détecte
--                    (estAbandon, `q.includes('abandonné')`).
--   alerte_envoyee   true partout (barrière 2, cf. bloc 1)
--
-- created_at est `timestamp without time zone` : les littéraux sont en UTC
-- et volontairement cadrés entre 15h et 18h UTC, soit 17h-20h à Paris.
-- Quel que soit le fuseau de la session SQL au moment de l'exécution, un
-- décalage de ±2h ne fait pas changer la date calendaire d'une session —
-- donc ni le nombre de jours actifs ni le découpage des fenêtres.
--
-- ÉTAT FINAL DES DÉBLOCAGES
-- Règle appliquée : round(score/total*100) >= 70 sur difficulte='facile',
-- seuil 5 sessions, sur tout l'historique sans filtre de date
-- (quiz.html, verifierDeblocage, l. 377-391). Avec total=5, seuls 4/5 et
-- 5/5 comptent — 3/5 vaut 60%.
--
--   Théorème de Pythagore  7 Facile · 5 réussies  → Moyen débloqué le 27/08
--                          2 Moyen  · 1 réussie   → Difficile 1/5
--   Fractions              6 Facile · 5 réussies  → Moyen débloqué le 27/08
--                          1 Moyen  · 0 réussie   → Difficile 0/5
--   Équations              5 Facile · 3 réussies  → Moyen 3/5
--   Proportionnalité       4 Facile · 3 réussies  → Moyen 3/5
--   Pourcentages           4 Facile · 2 réussies  → Moyen 2/5
--   Aires et volumes       3 Facile · 2 réussies  → Moyen 2/5
--   Théorème de Thalès     5 Facile · 0 réussie   → moyenne 40%, ça coince
--   Puissances             1 Facile · 1 réussie   → Moyen 1/5, découverte
--
-- Aucun niveau Difficile atteint. Les trois sessions Moyen (28/08, 01/09)
-- sont toutes POSTÉRIEURES au 27/08, jour de la 5e réussite Facile des
-- deux sous-thèmes concernés : aucune session ne se joue à un niveau qui
-- n'était pas encore débloqué à sa date.
--
-- Sous-thèmes et thèmes : libellés exacts de SOUS_THEMES (quiz.html
-- l. 288-304).
-- ═══════════════════════════════════════════════════════════════════════

insert into resultats
  (user_id, email, prenom, email_parent, theme, sous_theme, difficulte,
   score, total, questions_ratees, temps_secondes, aucune_idee,
   source_questions, alerte_envoyee, created_at)
values
  -- mercredi 5 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'facile', 3, 5, '["Nombres et calculs — Fractions", "Nombres et calculs — Fractions"]'::jsonb, 428, 0, 'ia', true, '2026-08-05 16:12:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'facile', 4, 5, '["Nombres et calculs — Fractions"]'::jsonb, 331, 0, 'ia', true, '2026-08-05 16:24:00'),
  -- vendredi 7 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Équations', 'facile', 2, 5, '["Nombres et calculs — Équations du 1er degré", "Nombres et calculs — Équations-produit", "[Aucune idée] Nombres et calculs — Équations du 1er degré"]'::jsonb, 465, 1, 'ia', true, '2026-08-07 15:38:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Équations', 'facile', 4, 5, '["Nombres et calculs — Équations-produit"]'::jsonb, 352, 0, 'ia', true, '2026-08-07 15:52:00'),
  -- mardi 11 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 3, 5, '["Espace et géométrie — Théorème de Pythagore", "Espace et géométrie — Théorème de Pythagore"]'::jsonb, 441, 0, 'ia', true, '2026-08-11 17:05:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 4, 5, '["Espace et géométrie — Théorème de Pythagore"]'::jsonb, 338, 0, 'ia', true, '2026-08-11 17:19:00'),
  -- lundi 17 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'facile', 4, 5, '["Nombres et calculs — Fractions"]'::jsonb, 302, 0, 'banque', true, '2026-08-17 16:47:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Thalès', 'facile', 2, 5, '["Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès", "[Aucune idée] Espace et géométrie — Théorème de Thalès"]'::jsonb, 489, 1, 'ia', true, '2026-08-17 17:02:00'),
  -- mercredi 19 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 4, 5, '["Espace et géométrie — Théorème de Pythagore"]'::jsonb, 327, 0, 'ia', true, '2026-08-19 15:24:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Proportionnalité', 'facile', 3, 5, '["Organisation et gestion de données, fonctions — Proportionnalité", "Organisation et gestion de données, fonctions — Vitesse"]'::jsonb, 418, 0, 'ia', true, '2026-08-19 15:37:00'),
  -- vendredi 21 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 5, 5, '[]'::jsonb, 268, 0, 'ia', true, '2026-08-21 16:08:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'facile', 4, 5, '["Nombres et calculs — Fractions"]'::jsonb, 306, 0, 'ia', true, '2026-08-21 16:21:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Proportionnalité', 'facile', 4, 5, '["Organisation et gestion de données, fonctions — Proportionnalité"]'::jsonb, 298, 0, 'banque', true, '2026-08-21 16:33:00'),
  -- samedi 22 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Thalès', 'facile', 2, 5, '["Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès", "[Aucune idée] Espace et géométrie — Théorème de Thalès"]'::jsonb, 478, 1, 'ia', true, '2026-08-22 15:02:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Thalès', 'facile', 2, 5, '["Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès"]'::jsonb, 462, 0, 'ia', true, '2026-08-22 15:16:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Pourcentages', 'facile', 2, 5, '["Organisation et gestion de données, fonctions — Fréquence relative", "Organisation et gestion de données, fonctions — Pourcentages", "[Aucune idée] Organisation et gestion de données, fonctions — Fréquence relative"]'::jsonb, 441, 1, 'ia', true, '2026-08-22 15:33:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Pourcentages', 'facile', 4, 5, '["Organisation et gestion de données, fonctions — Pourcentages"]'::jsonb, 389, 0, 'ia', true, '2026-08-22 15:47:00'),
  -- lundi 24 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 4, 5, '["Espace et géométrie — Théorème de Pythagore"]'::jsonb, 324, 0, 'ia', true, '2026-08-24 17:12:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'facile', 4, 5, '["Nombres et calculs — Fractions"]'::jsonb, 297, 0, 'banque', true, '2026-08-24 17:25:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Équations', 'facile', 4, 5, '["Nombres et calculs — Équations-produit"]'::jsonb, 341, 0, 'ia', true, '2026-08-24 17:38:00'),
  -- mercredi 26 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 2, 5, '["Espace et géométrie — Théorème de Pythagore", "Espace et géométrie — Théorème de Pythagore", "Espace et géométrie — Théorème de Pythagore"]'::jsonb, 447, 0, 'ia', true, '2026-08-26 16:30:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Équations', 'facile', 2, 5, '["Nombres et calculs — Équations-produit", "Nombres et calculs — Équations du 1er degré", "[Aucune idée] Nombres et calculs — Équations-produit"]'::jsonb, 468, 1, 'ia', true, '2026-08-26 16:44:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Thalès', 'facile', 1, 5, '["Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès", "[Aucune idée] Espace et géométrie — Théorème de Thalès"]'::jsonb, 502, 1, 'ia', true, '2026-08-26 17:01:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Thalès', 'facile', 0, 5, '["Quiz abandonné"]'::jsonb, 88, 0, 'ia', true, '2026-08-26 17:16:00'),
  -- jeudi 27 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'facile', 4, 5, '["Espace et géométrie — Théorème de Pythagore"]'::jsonb, 311, 0, 'ia', true, '2026-08-27 15:45:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'facile', 4, 5, '["Nombres et calculs — Fractions"]'::jsonb, 289, 0, 'ia', true, '2026-08-27 15:58:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Grandeurs et mesures', 'Aires et volumes', 'facile', 4, 5, '["Grandeurs et mesures — Aires"]'::jsonb, 352, 0, 'banque', true, '2026-08-27 16:11:00'),
  -- vendredi 28 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'moyen', 3, 5, '["Espace et géométrie — Théorème de Pythagore", "Espace et géométrie — Théorème de Pythagore"]'::jsonb, 512, 0, 'ia', true, '2026-08-28 16:20:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'moyen', 0, 5, '["Quiz abandonné"]'::jsonb, 104, 0, 'ia', true, '2026-08-28 16:35:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Fractions', 'moyen', 2, 5, '["Nombres et calculs — Fractions", "Nombres et calculs — Fractions", "[Aucune idée] Nombres et calculs — Fractions"]'::jsonb, 547, 1, 'ia', true, '2026-08-28 16:42:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Proportionnalité', 'facile', 4, 5, '["Organisation et gestion de données, fonctions — Proportionnalité"]'::jsonb, 318, 0, 'ia', true, '2026-08-28 16:58:00'),
  -- lundi 31 août
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Pourcentages', 'facile', 4, 5, '["Organisation et gestion de données, fonctions — Fréquence relative"]'::jsonb, 341, 0, 'ia', true, '2026-08-31 17:08:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Grandeurs et mesures', 'Aires et volumes', 'facile', 2, 5, '["Grandeurs et mesures — Aires", "Grandeurs et mesures — Volumes", "[Aucune idée] Grandeurs et mesures — Aires"]'::jsonb, 452, 1, 'banque', true, '2026-08-31 17:22:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Puissances', 'facile', 4, 5, '["Nombres et calculs — Écriture scientifique"]'::jsonb, 322, 0, 'ia', true, '2026-08-31 17:36:00'),
  -- mardi 1 septembre
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Pythagore', 'moyen', 4, 5, '["Espace et géométrie — Théorème de Pythagore"]'::jsonb, 468, 0, 'ia', true, '2026-09-01 16:15:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Proportionnalité', 'facile', 4, 5, '["Organisation et gestion de données, fonctions — Échelles"]'::jsonb, 306, 0, 'ia', true, '2026-09-01 16:30:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Espace et géométrie', 'Théorème de Thalès', 'facile', 3, 5, '["Espace et géométrie — Théorème de Thalès", "Espace et géométrie — Théorème de Thalès"]'::jsonb, 421, 0, 'ia', true, '2026-09-01 16:42:00'),
  -- jeudi 3 septembre
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Nombres et calculs', 'Équations', 'facile', 4, 5, '["Nombres et calculs — Équations-produit"]'::jsonb, 328, 0, 'ia', true, '2026-09-03 15:50:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Grandeurs et mesures', 'Aires et volumes', 'facile', 4, 5, '["Grandeurs et mesures — Aires"]'::jsonb, 334, 0, 'ia', true, '2026-09-03 16:03:00'),
  ('70bd9ff0-4cae-42ef-b2f7-2fbc166ca889', 'lucas_demo_dkma@academika.app', 'Lucas', 'marcocampos2+demo@gmail.com', 'Organisation et gestion de données, fonctions', 'Pourcentages', 'facile', 2, 5, '["Organisation et gestion de données, fonctions — Fréquence relative", "Organisation et gestion de données, fonctions — Pourcentages", "Organisation et gestion de données, fonctions — Fréquence relative"]'::jsonb, 429, 0, 'banque', true, '2026-09-03 16:16:00');

-- ═══════════════════════════════════════════════════════════════════════
-- BLOC 3 — VÉRIFICATION (lecture seule, aucune écriture)
--
-- À passer juste après le bloc 2. Les valeurs attendues sont indiquées :
-- un écart signifie que l'insertion n'est pas conforme, pas qu'il faut
-- ajuster les attentes.
-- ═══════════════════════════════════════════════════════════════════════

-- 3.1 — Volume inséré. Attendu : 40 lignes, 2 abandons, alerte_envoyee
--       true partout, du 2026-08-05 au 2026-09-03.
select count(*)                                             as lignes,
       count(*) filter (where questions_ratees @> '["Quiz abandonné"]'::jsonb) as abandons,
       count(*) filter (where alerte_envoyee is not true)    as sans_barriere_2,
       min(created_at)::date                                 as premiere,
       max(created_at)::date                                 as derniere
from resultats
where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';
-- attendu : 40 | 2 | 0 | 2026-08-05 | 2026-09-03

-- 3.2 — Déblocages. Reproduit exactement verifierDeblocage() de quiz.html :
--       une session est « réussie » si round(score/total*100) >= 70.
--       Le cast en numeric est indispensable — score/total en entiers
--       ferait une division entière et fausserait tout le calcul.
select sous_theme,
       difficulte,
       count(*)                                                       as sessions,
       count(*) filter (where round((score::numeric / total) * 100) >= 70) as reussies,
       (count(*) filter (where round((score::numeric / total) * 100) >= 70) >= 5)
                                                                      as seuil_atteint
from resultats
where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889'
  and total > 0
group by sous_theme, difficulte
order by sous_theme, difficulte;
-- attendu, seuil_atteint = true UNIQUEMENT sur ces deux lignes :
--   Fractions            / facile : 6 sessions, 5 réussies, true
--   Théorème de Pythagore/ facile : 7 sessions, 5 réussies, true
-- toutes les autres lignes à false, et AUCUNE ligne difficulte='difficile'.

-- 3.3 — Tuiles de la fenêtre 14 jours (défaut de suivi-parent.html), telles
--       que chargerDonnees() les calcule : les abandons sont exclus des
--       sessions, du score, de la durée et des jours actifs, et comptés
--       à part. Fenêtre figée au 2026-08-21 pour rester déterministe.
with fenetre as (
  select *, (questions_ratees @> '["Quiz abandonné"]'::jsonb) as est_abandon
  from resultats
  where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889'
    and created_at >= timestamp '2026-08-21 00:00:00'
)
select count(*) filter (where not est_abandon)                       as sessions,
       sum(total) filter (where not est_abandon)                     as exercices,
       round(sum(score) filter (where not est_abandon) * 100.0
             / sum(total) filter (where not est_abandon))            as score_moyen,
       count(distinct sous_theme) filter (where not est_abandon)     as sous_themes,
       round(sum(temps_secondes) filter (where not est_abandon) / 60.0) as duree_min,
       count(distinct created_at::date) filter (where not est_abandon)  as jours_actifs,
       count(*) filter (where est_abandon)                           as abandons
from fenetre;
-- attendu : 28 | 140 | 66 | 8 | 179 (soit « 2 h 59 min ») | 9 | 2

-- 3.4 — Aucune session Moyen antérieure au déblocage de son sous-thème.
--       Attendu : 0 ligne. Toute ligne renvoyée est une incohérence
--       chronologique (l'élève aurait joué à un niveau encore verrouillé).
with reussites_facile as (
  select sous_theme, created_at,
         row_number() over (partition by sous_theme order by created_at) as rang
  from resultats
  where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889'
    and difficulte = 'facile' and total > 0
    and round((score::numeric / total) * 100) >= 70
),
deblocage as (
  select sous_theme, created_at as debloque_le from reussites_facile where rang = 5
)
select m.sous_theme, m.created_at as session_moyen, d.debloque_le
from resultats m
left join deblocage d on d.sous_theme = m.sous_theme
where m.user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889'
  and m.difficulte = 'moyen'
  and (d.debloque_le is null or m.created_at <= d.debloque_le);
-- attendu : 0 ligne


-- ═══════════════════════════════════════════════════════════════════════
-- BLOC 4 — SUPPRESSION COMPLÈTE
--
-- ⚠️  NE PAS EXÉCUTER par défaut. Ce bloc supprime le compte de démo et
--     tout son historique, sans confirmation.
--
-- Ordre imposé : les tables filles avant `profils`, sinon une éventuelle
-- contrainte de clé étrangère bloque la suppression du profil.
-- Les DELETE sur les tables que le compte de démo n'a jamais alimentées
-- (questions_vues, examens_blancs, historique_bilans, rappels_envoyes)
-- sont volontairement conservés : ils renvoient 0 ligne aujourd'hui, mais
-- couvrent le cas où de vrais quiz ou examens auraient été passés sur ce
-- compte entre-temps pour d'autres captures.
-- ═══════════════════════════════════════════════════════════════════════

-- 4.1 — Historique et données dérivées
delete from resultats          where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';
delete from questions_vues     where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';
delete from examens_blancs     where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';
delete from historique_bilans  where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';
delete from rappels_envoyes    where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';

-- 4.2 — Compteur de rate-limit du parent de démo (api/email.js).
--       Sans effet fonctionnel, mais ne laisse pas de trace derrière.
delete from email_rate_limit   where destinataire = 'marcocampos2+demo@gmail.com';

-- 4.3 — Le profil élève
delete from profils            where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';

-- 4.4 — Les deux comptes auth. Décommenter pour les supprimer.
--       La suppression en cascade emporte `identities` et les sessions.
--       Alternative recommandée : Dashboard Supabase > Authentication >
--       Users, plus explicite et moins facile à lancer par accident.
--
-- delete from auth.users where id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889';
-- delete from auth.users where email = 'marcocampos2+demo@gmail.com';

-- 4.5 — Contrôle. Attendu : 0 partout.
select (select count(*) from resultats where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889') as resultats,
       (select count(*) from profils   where user_id = '70bd9ff0-4cae-42ef-b2f7-2fbc166ca889') as profils,
       (select count(*) from profils   where email_parent = 'marcocampos2+demo@gmail.com')     as profils_du_parent;
