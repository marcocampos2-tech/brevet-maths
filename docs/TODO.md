# TODO consolidé — 09/09/2026

---

## ✅ RLS parent — corrigé et déployé (05/09/2026)

Les parents peuvent désormais voir les résultats de leur enfant (PR #41 mergée, testée : cas négatif, positif, non-régression tous OK). Fonctions `est_parent_de(uuid)` et `email_parent_valide(text)` créées, policies SELECT ajoutées sur `resultats` et `examens_blancs`, normalisation email sur `profils`.

**Reste ouvert :**
- `db/policies.test.sql` — jamais fait (seul `db/policies.sql` existe)
- `historique_bilans` — RLS active, ZÉRO policy dumpée, possiblement invisible pour tout le monde y compris en clé service selon le contexte — à vérifier
- Normaliser l'email dans le formulaire d'inscription (au lieu de dépendre du rattrapage `lower(trim(...))` en lecture)
- Lecture positive de `examens_blancs` par un parent — jamais testée, faute d'examen dans le jeu de données démo

## ✅ Refonte `suivi-parent.html` — livrée (PR #43, 07/09/2026)

Indicateur central = niveau atteint par sous-thème (remplace le score brut). Écarts assumés par rapport au plan initial :
- Dénominateur = liste `SOUS_THEMES` codée en dur (pas de `COUNT` dynamique, lecture publique de `questions_banque` retirée par l'audit sécurité)
- Pas de module partagé `lib/progression.js` — algorithme de déblocage dupliqué entre `quiz.html` et `suivi-parent.html`

**⚠️ RISQUE ACTIF — duplication `quiz.html`/`suivi-parent.html`** : à contrôler à chaque future modification touchant l'un des deux fichiers (ajout/retrait sous-thème, changement de seuils, logique de déblocage). Aucune erreur, aucun log en cas de divergence — juste un état affiché faux. Ne retirer ce point que si `lib/progression.js` est créé (vérifier d'abord que Vercel sert `/lib/*.js`).

## 🟠 Ouvert — aligner `cron-rappel.js` sur la logique niveau

Le mail récap journalier affiche encore le score brut de la session + seuil "Acquis ≥70%/À revoir <70%" plaqué sur une session isolée — trompeur (une session à 60% peut faire partie d'une progression normale). Tant que ce n'est pas fait, la phrase de synthèse de `suivi-parent.html` reste en mode dégradé (descriptive, sans comparaison temporelle).

**À faire** : réutiliser la logique niveau/progression de la refonte suivi-parent, étendre à `cron-rappel.js` (récap journalier) et au bilan périodique (21 jours, `sous_themes_snapshot`, qui mesure la difficulté tentée sur la fenêtre et non le niveau débloqué — source de régressions fantômes).

**Point de contenu à trancher à la conception** : garder une mention de la session du jour en plus du niveau global, ou basculer entièrement sur niveau/progression.

## ✅ Cron bilan périodique (21 jours) — vérifié fonctionnel de bout en bout (08/09/2026)

POST serverless + écriture dans `historique_bilans` confirmés. Les deux items d'incertitude précédents (cause racine Vercel Hobby, doute Vercel vs GitHub Actions) sont clos.

## ✅ Captures d'écran pour le site — intégrées (09/09/2026)

`/img/` créé, 4 images WebP produites et intégrées (`produit-quiz-correction`, `produit-suivi-regularite`, `produit-suivi-bilan-pdf`, `produit-suivi-progression`), toutes <100 Ko. Bloc quiz (offre Libre) sur `index.html` et `tarifs.html`, 3 blocs Suivi (offre Accompagné) sur `tarifs.html` uniquement — pas sur `espace-parent.html` (retiré : redondant sous un formulaire de connexion pour un parent déjà abonné). Sur `tarifs.html`, organisation finale en pleine largeur, groupe après groupe : carte Libre → légende "Ce que Libre contient" → capture quiz → carte Accompagné → légende "Ce que Accompagné ajoute" → 3 blocs Suivi (une disposition à 2 colonnes carte+preuve a été tentée puis abandonnée, déséquilibre de hauteur trop marqué entre les deux offres). Layout mobile 1 colonne partout ; desktop 2 colonnes image/texte pour le bloc quiz, 3 colonnes pour les blocs Suivi (alignées sur une même hauteur via des lignes de grille communes, pas 3 colonnes indépendantes).

⚠️ Dates du jeu de démo ancrées au 03/09/2026, se dégradent chaque jour (fenêtre 14 jours).

**Réserve** : état `maitrise` non couvert par le jeu de données (niveau Difficile, exclu volontairement) — à vérifier manuellement ou via un second compte démo.

**Piège** : ne jamais coller `scripts/demo-lucas.sql` en entier dans l'éditeur SQL (le bloc 4 supprime ce que le bloc 2 crée) — arrivé une fois le 03/09.

## ✅ Doublons `resultats` — corrigé et déployé (13/09/2026)

Diagnostic initial (double-tap mobile probable sur `quiz.html`, ayant fait passer à tort un compteur de déblocage de 4 à 5 sessions chez Timothée) traité en 4 points, chacun validé séparément. PR #52 mergée :
- **Gardes client** (`quiz.html`) : garde de ré-entrance dans `valider(qi)` sur le modèle de `pick()` ; verrou optimiste dans `sauvegarder()` (`saved=true` posé avant le `fetch`, relâché explicitement sur échec).
- **Idempotence serveur par fenêtre** (`api/quiz-resultat.js`) : rejet d'une écriture au fingerprint identique (`user_id`+`theme`+`sous_theme`+`difficulte`+`score`+`total`) déjà enregistrée il y a moins de 5 s, fail-open si le contrôle échoue.
- **Fermeture du TOCTOU résiduel** — le contrôle par fenêtre est un check-then-insert, pas atomique. Clé de déduplication `client_key` (UUID généré une fois côté client par soumission réelle) + contrainte unique `resultats_client_key_unique` en base, upsert atomique via `Prefer: resolution=ignore-duplicates` (Postgres résout le conflit lui-même, sans lecture préalable). Couvre les deux chemins d'écriture vers `resultats` : `sauvegarder()` et `sauvegarderAbandonne()`.
- **Migration SQL** exécutée et vérifiée en base : colonne nullable, aucune des lignes existantes affectée, doublon volontaire en test rejeté avec `23505`.
- **Nettoyage** : 5 doublons identifiés chez Timothée (seul élève réel) supprimés par `id` figés après validation d'un `select` préalable — 21 → 16 lignes, requête de détection revérifiée à vide après coup. Conséquence acceptée : reverrouille mécaniquement le niveau Moyen de Calcul littéral débloqué à tort.
- PR #50 (diagnostic initial, jamais mergée) fermée sans merge — remplacée par cette entrée.

**Reste ouvert (découvert pendant ce chantier) :**
- **Résultats orphelins** — 12 lignes `resultats` + 1 ligne `examens_blancs` rattachées à 4 `user_id` sans aucune ligne `profils` correspondante : `d2275364-e958-4f2d-bd76-1bbd6cf56314`, `b2236cc4-f3be-4bd5-8644-342efb67c667`, `27adbec9-b380-4a43-991b-ee3a92a9b6fd`, `fe4403c8-7a22-49be-8fcd-3fca73326977`. Ce dernier identifié : c'est le compte prof de CM lui-même (cf. section app_metadata ci-dessus) — n'a jamais eu de ligne `profils` car ce n'est pas un compte élève, résultats probablement issus de tests manuels sur `quiz.html`. **Seuls les 3 autres restent à expliquer.** Symptôme visible : `prof.html` affiche `—` à la place du prénom dans "30 dernières activités" — `PROFILS[r.user_id]` introuvable (le fallback ne se déclenche que si la ligne `profils` est totalement absente, pas si un champ interne est vide). Policy `Lecture profils` vérifiée (branche `is_prof()` présente) → cause RLS écartée. Deux hypothèses non départagées pour les 3 comptes restants : comptes supprimés (profil parti, résultats restés — bénin) ou création de compte qui échoue à écrire dans `profils` tout en laissant l'élève accéder au quiz (sérieux, prioritaire si confirmé).
- **Doublons non nettoyés sur ces comptes orphelins** — nettoyage de ce chantier volontairement restreint à Timothée. Les comptes ci-dessus contiennent eux-mêmes des doublons du même type (ex. `d2275364…` : trois sessions "Puissances" à 10:15:07/10/11 le 13/09 ; `27adbec9…` : deux "Équations" à 1,2 s d'écart le 09/09). À traiter avec le point précédent, une fois l'origine de ces comptes établie — ne pas nettoyer avant d'avoir diagnostiqué cette fois.

## 🖼️ Images sur `index.html` — jamais traité

Maquette validée, non implémentée : icônes 3 étapes "Comment ça marche", icônes 3 cartes d'offres, photo réelle à la place de l'avatar "MC". Écarté : illustration hero (passerait le bloc en 2 colonnes).

---

## ⚠️ Échéance critique — Bascule décembre 2026

Offre Libre gratuite à vie ; seul Suivi (7,90€/mois) devient payant à l'échéance. Code fait et déployé (16/08) : bandeau, sélecteur d'offre, détail récap masqués via `enPeriodeGratuite()`. **Point ouvert** : vérifier au 01/12/2026 que Stripe est opérationnel (SIRET, mode live) avant réactivation automatique. Rappel agenda mi-novembre déjà posé. Vérifier la formulation marketing validée le 13/08 reprise partout (pas que sur le flyer).

---

## 🔴 Banque de questions — chantier en cours

1. Angles — périmètre validé 02/09, calibrage facile/moyen/difficile à faire
2. 9 sous-thèmes restants du tour des 20 : Algorithmique, Pythagore, Trigonométrie, Transformations, Triangles semblables, Représentation de l'espace, Agrandissement, Aires et volumes (Proportionnalité rédigeable)
3. Transformations/difficile — 2 questions actives seulement, sans garde-fou serveur
4. Représentation de l'espace — 0 question, format QCM pas confirmé
5. 6 sous-thèmes de prérequis validés, aucun construit : Proportionnalité, Fractions, Nombres relatifs, Opérations, Opérations combinées, Angles
6. Équations — 3 questions manquantes à identifier par niveau
7. Bloc C dette sur Statistiques — non-répétition inter-niveaux non vérifiée
8. Mention "figure pas en vraie grandeur" — rétroactivité sous-thèmes basculés avant 27/08, décision ouverte
9. Dénominateur sous-thèmes possiblement codé en dur — à généraliser en COUNT dynamique
10. `api/generer.js` — "Triangles semblables" absent de `chapitres['Espace et géométrie']`
11. Refonte `examen_questions` (chantier 2) — jamais entamée, 180 questions non auditées, pas de dédoublonnage par énoncé
12. Stratification par difficulté inopérante dans `api/examen.js` — tri après `sort(() => Math.random()-0.5)`, tirage aléatoire pur en pratique
13. Shuffle biaisé — motif présent dans tout le dépôt

---

## 🟠 Plateforme Academika — technique

1. Cybersécurité avant Stripe live : `profils` INSERT sans contrôle `email_parent`, `shouldCreateUser: true` exploitable, idempotency Stripe absente, `invoice.payment_failed` jamais écouté, `alerte_envoyee` sans NOT NULL, UTC vs Europe/Paris sur bilan périodique
2. Abandon examen blanc non enregistré — aucune trace en base ni pour le parent
3. Email récap parent ne distingue pas abandon vs quiz terminé à 0% — colonne `abandonne` absente de `resultats`
4. Double email inscription brevet blanc présentiel — jamais vérifié résolu depuis 08/06
5. Erreurs SVG `NaN` dans l'examen blanc — cosmétique
6. Déconnexion lente — piste : `logout()` attend fin d'appels réseau
7. Chevauchement contenu email récap si plusieurs sessions le même jour — mineur
8. Bug fuseau horaire UTC — seule `resultats` corrigée, pas de vérification généralisée
9. Warning console — meta tag `apple-mobile-web-app-capable` déprécié
10. Stages "Réserver une place" — mailto seulement, formulaire réel à construire
11. Distinction gratuit/abonnement — gating email fait, dashboard/PDF/examen blanc à construire
12. Espace parent persistant (option B) — en attente depuis 24/07, sans date
13. `is_prof()` sans `search_path` figé — exposition faible, à aligner au passage
14. Policies ciblant `{public}` au lieu de `{authenticated}` — pas exploitable aujourd'hui, fragile
15. `historique_bilans`/`rappels_envoyes`/`email_rate_limit` — RLS active, zéro policy
16. Bandeau commercial `suivi-parent.html` vend "résultat examen blanc en ligne" — jamais implémenté, masqué jusqu'au 01/12
17. Deux seuils désalignés "abordé" (1 session) vs "À découvrir" (<3 sessions) — assumé, pas un bug
18. Lien "Offres" corrigé (`#quiz`→`#offres`) sur `index.html`/`tarifs.html` (09/09) ; même décalage nom/cible jamais corrigé sur `stages-vacances.html`, `connexion.html`, `cours-particuliers.html`, `abonnement-confirme.html` (liens vers `index.html#quiz`)

---

## 🟡 Plateforme Academika — légal

1. CGV — case à cocher Art. A1/B4 manquantes ; contenu à corriger (Art. C1, B2, placeholders tarifs)
2. Conformité résiliation "3 clics" — statut contradictoire entre CLAUDE.md et historique du 12/08, à vérifier
3. Politique de confidentialité — page inexistante
4. Consultation juridique — jamais initiée, bloque CGV et flyers
5. SIRET/SAP — SIRET obtenu, dossier INPI déposé, en attente INSEE/URSSAF
6. Bandeau cookies — pas nécessaire aujourd'hui, deviendra obligatoire si Meta Ads activé
7. RGPD rétention comptes élèves — politique définie, à vérifier documentation mentions légales

---

## 🟢 Plateforme Academika — marketing / produit

1. Distribution flyer A5 — bloquée en attente consultation juridique
2. SEO Phase 7bis — pages statiques indexables par sous-thème, analysé non implémenté
3. Design system unifié — plan validé, jamais exécuté
4. Extension site dédié 4ème/2nde — non tranchée
5. URL trackée dédiée flyer (`/flyer`) — à faire, complémentaire au champ source déclaratif
6. Constat concret pendant le chantier captures produit (09-13/09) : `index.html`/`tarifs.html` partagent `style.css`, `espace-parent.html` a son propre `<style>` local avec des noms de variables différents pour les mêmes couleurs (`--navy`/`--bordeaux` vs `--marine`/`--bordeaux`, etc.) — a nécessité une duplication de `.produit-shot`/`.section-label` avant qu'on ne retire finalement tout ce contenu d'`espace-parent.html`. Illustration concrète du point 3 ci-dessus.

---

## 🔵 La Hulotte

1. PPWR Aluplast — attestation en cours, écart PFAS à combler
2. PMS gap analysis — écarts critiques identifiés, pas de suite actée
3. Écart consommation Crème UHT (1%→21% T1 2026) — signalé, pas de suite actée

---

## ⚪ Projet conseil IA/data (agri-food)

1. Phase 0 — accumuler 3-5 problèmes business chiffrables avant offre. Bascule test IoT décidée, résultat jamais confirmé
