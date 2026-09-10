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

## 📸 Captures d'écran pour le site — en cours

Plus bloqué par le bug RLS. 4 images WebP produites (`produit-quiz-correction`, `produit-suivi-regularite`, `produit-suivi-bilan-pdf`, `produit-suivi-progression`). PR #47 mergée (reformulation phrase de synthèse sur la capture progression). Textes d'accompagnement validés pour `index.html` (bloc quiz) et `espace-parent.html` (3 blocs : Régularité, PDF bilans, Progression).

**Reste à faire** : conversion WebP finale via Squoosh (<100 Ko/image) côté fondateur, confirmation existence du dossier `/img/`, puis spec d'intégration.

⚠️ Dates du jeu de démo ancrées au 03/09/2026, se dégradent chaque jour (fenêtre 14 jours).

**Réserve** : état `maitrise` non couvert par le jeu de données (niveau Difficile, exclu volontairement) — à vérifier manuellement ou via un second compte démo.

**Piège** : ne jamais coller `scripts/demo-lucas.sql` en entier dans l'éditeur SQL (le bloc 4 supprime ce que le bloc 2 crée) — arrivé une fois le 03/09.

## 🖼️ Images sur `index.html` — jamais traité

Maquette validée, non implémentée : icônes 3 étapes "Comment ça marche", icônes 3 cartes d'offres, photo réelle à la place de l'avatar "MC". Écarté : illustration hero (passerait le bloc en 2 colonnes).

## Doublons d'enregistrement dans `resultats` (découvert 09/09/2026)

**Statut** : diagnostiqué, non corrigé. Hypothèse non reproduite.

### Constat
Sur l'élève Timothée Andrianarivelo (`user_id 1af38361-a852-42de-9852-da19e530b84f`, 21 lignes le 09/09 entre 13:04 et 13:59) : 5 paires de lignes identiques (même sous-thème, même difficulté, même score) écrites à 0,4–1,2 s d'intervalle. 21 lignes en base = 16 sessions réelles.

Paires : 13:04:30.779/31.217 (Calcul littéral 3/5) · 13:11:24.065/24.854 (CL 4/5) · 13:37:00.270/01.439 (CL 2/5) · 13:38:40.889/41.431 (CL 2/5) · 13:59:58.119/58.655 (Équations 3/5).

### Conséquence avérée
Le doublon de 13:11 a fait passer le compteur de `verifierDeblocage` de 4 à 5 sessions facile ≥70% sur Calcul littéral → **niveau Moyen débloqué à tort** (première session moyen à 13:42:16).
En comparaison, le déblocage d'Équations (5 sessions distinctes 13:44→13:55, puis moyen à 13:59) est légitime : la règle 5/70% fonctionne sur données propres.

Portée plus large : ces doublons polluent tout ce qui lit `resultats` — nombre de sessions affiché au parent, moyennes du récap journalier, compteurs du bilan, et le futur calcul de niveau du chantier `suivi-parent.html`. Invisibles : ils ressemblent à des sessions normales.

### Cause probable (à confirmer)
Dans `quiz.html` :
- `valider(qi)` n'a que la garde `if(answers[qi] === undefined) return` — pas de `if(submitted[qi] !== undefined) return` comme dans `pick()`. Un double-tap sur « Valider » de la dernière question déclenche deux fois `renderResultats()`.
- `sauvegarder()` positionne `saved=true` APRÈS le `await fetch` : les deux appels franchissent la garde `if(saved...)` avant que le premier ait terminé.

Cohérent avec un trafic majoritairement mobile (double-tap involontaire fréquent). Non exclu sans vérification : un retry réseau navigateur donnerait le même symptôme.

### Pistes de correction (non arbitrées)
1. Garde de ré-entrance dans `valider()` — une ligne.
2. Verrou optimiste dans `sauvegarder()` — `saved=true` avant le `fetch`, relâché sur échec.
3. Idempotence serveur dans `api/quiz-resultat.js` — rejet d'une écriture identique dans une fenêtre courte. Seul niveau qui protège quel que soit le client ; cohérent avec l'exigence d'idempotence déjà listée dans l'audit cyber du 09/08.
4. Nettoyage des lignes existantes — reverrouillerait mécaniquement le Moyen de Calcul littéral pour Timothée. Décision produit autant que technique.

1+2 = correctif de surface. 3 = le seul durable. 4 = à trancher séparément.

### À faire avant de coder
- Audit : combien d'élèves et de lignes concernés (requête à écrire).
- Reproduction du double-tap sur compte démo pour confirmer l'hypothèse.

### Point connexe (distinct, non urgent)
`api/generer.js` accepte `difficulte` du `req.body` sans revérifier le déblocage côté serveur — le gating n'existe qu'en dur dans `quiz.html`. Pas la cause du bug ci-dessus. À traiter dans le chantier `suivi-parent.html`, qui doit de toute façon recalculer le niveau depuis `resultats` : extraire la règle (`SEUIL_SESSIONS`, `SEUIL_PCT`, calcul `score/total`) dans un module partagé sur le modèle de `lib/questions-vues.js`, plutôt que de laisser diverger trois implémentations (quiz.html, cron-rappel.js, suivi-parent).

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

---

## 🔵 La Hulotte

1. PPWR Aluplast — attestation en cours, écart PFAS à combler
2. PMS gap analysis — écarts critiques identifiés, pas de suite actée
3. Écart consommation Crème UHT (1%→21% T1 2026) — signalé, pas de suite actée

---

## ⚪ Projet conseil IA/data (agri-food)

1. Phase 0 — accumuler 3-5 problèmes business chiffrables avant offre. Bascule test IoT décidée, résultat jamais confirmé
