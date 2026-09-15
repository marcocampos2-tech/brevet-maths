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

**Confirmé et complété (14/09)** : le récap journalier (`api/email.js`, `recap-journalier-user`) ne mentionne effectivement jamais le niveau atteint ni la progression de déblocage — seulement "acquis/à revoir" sur la journée. Découverte additionnelle : un quiz abandonné compte comme 0/5 dans la moyenne du jour et peut à lui seul faire basculer le ton de l'email (encourageant → "score faible") — à traiter dans ce même chantier, un abandon ne devrait probablement pas peser comme un échec dans la moyenne.

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
- **Résultats orphelins — corrigé et validé en prod (15/09/2026)** : cause racine identifiée, `connexion.html:107-112` — toute session valide redirige vers `quiz.html` sans vérifier le type de compte. C'est la seule porte vers `quiz.html`/`examen.html`/`resultats.html` en dehors d'une session déjà en cours (recherche exhaustive faite). Un parent connecté qui clique "Connexion" depuis n'importe quelle page marketing atterrit directement sur le quiz de son enfant, avec son propre compte — d'où les lignes `resultats` sans ligne `profils` (les comptes parents n'en ont jamais). Reproduit en production de bout en bout (inscription espace parent → nouvelle visite → clic "Connexion" → atterrissage direct sur `quiz.html`). Signal visible identifié : `quiz.html:520` affiche `prenom || user.email` — pour un compte parent, l'email s'affiche à la place du prénom, jamais repéré jusqu'ici.

  3 familles réelles concernées (sur 27 comptes, dont 10 hérités d'Academika 1.0 hors sujet) :
  - **Bertin** (sebastien.bertin86@gmail.com, enfant Juliette) — traité le 14/09 : doublons nettoyés (3 sessions Puissances identiques), 2 sessions réelles ré-attribuées au compte de Juliette, colonnes dénormalisées corrigées, email envoyé au parent avec la procédure de connexion.
  - **Niazale** (kids.niazale@gmail.com, enfants kabi et divine) — pas traité. 2 sessions sur le compte parent, impossible de savoir lequel des deux enfants a travaillé sans réponse du parent. Email à envoyer avec la question, ré-attribution une fois la réponse obtenue.
  - **Andrianarivelo** (Timothée) — cas résiduel déjà couvert par le chantier doublons précédent, 2 sessions sur un premier compte parent, l'enfant a son propre compte fonctionnel (16 sessions) — non prioritaire.

  **Nettoyage des comptes — fait le 15/09/2026** : base passée de 27 à 11 comptes (suppression des comptes de test et des 10 comptes hérités d'Academika 1.0, tous vides). Conservés : comptes de travail de CM, démo Lucas, et les 3 familles réelles ci-dessus. Les résultats orphelins restants sont volontaires : 2 sur le compte parent Niazale (en attente de réponse pour réattribution), 2 sur Andrianarivelo (résiduel non prioritaire).

  Correctif technique validé (recommandation A+B+C) — codé le 15/09/2026 :
  - A — `connexion.html` aiguille selon le type de compte (session + ligne `profils` → quiz ; session sans profil → `suivi-parent.html`)
  - B — gate sur les 3 pages élève (`quiz.html`, `examen.html`, `resultats.html`) : bloque si aucune ligne `profils`, message explicite ("vous êtes connecté en tant que parent — pour que {prénom} travaille, connectez-le avec son prénom, son nom et son mot de passe"), fail-open si la lecture échoue techniquement
  - C — gate serveur dans `api/quiz-resultat.js` : refuse l'écriture si `user_id` n'a pas de ligne `profils`
  - Discriminant : présence d'une ligne `profils`, jamais `user_metadata` (modifiable par l'utilisateur, même raison que l'audit RLS initial)
  - Exemption prof : `app_metadata.role` lu depuis le JWT de session côté client (A/B) ; côté serveur (C), pas de JWT reçu par `api/quiz-resultat.js` — appel à l'API Admin Supabase (`/auth/v1/admin/users/{user_id}`, clé service) uniquement quand `profils` est vide, pour ne pas faire confiance au client
  - Fail-open jamais silencieux sur les 4 gates (3 client + 1 serveur) : `console.log` systématique sur l'échec de lecture

  **Validé en prod le 15/09/2026, 5 tests** : non-régression élève (quiz enregistré, email de récap reçu) ; parent redirigé de `connexion.html` vers `suivi-parent.html` avec bandeau affiché et URL nettoyée ; bouton "Se déconnecter et connecter mon enfant" fonctionnel ; exemption prof confirmée côté client et côté serveur (écriture acceptée sans ligne `profils`, la double lecture de l'API Admin trouve bien `app_metadata.role`) ; non-régression du parcours recovery.

  Sujet distinct, déjà traité (14/09/2026, avant ce correctif) : le bloc "Les accès" ajouté à l'encart post-création de `suivi-parent.html` explique désormais explicitement au parent comment connecter son enfant (prénom, nom, mot de passe).

- **`examens_blancs` a le même trou, non traité ici (15/09/2026)** — découvert pendant la conception du correctif A+B+C ci-dessus. La policy RLS `"Eleve gere ses examens_blancs"` (`db/policies.sql`, `ALL`, `auth.uid() = user_id`) ne vérifie pas la présence d'une ligne `profils`, contrairement au gate tout juste codé pour `resultats`/`api/quiz-resultat.js`. Contrairement aux quiz, `examen.html` insère directement dans `examens_blancs` depuis le client (clé anon, aux points d'abandon et de fin d'examen) — pas d'intermédiaire serverless à gater comme le point C ci-dessus, donc pas de backstop serveur possible sans toucher RLS. Le gate client ajouté sur `examen.html` (point B) couvre le cas normal (redirection avant même d'atteindre l'examen), mais un appel direct à l'API Supabase avec le JWT du parent contournerait ce gate — seule une policy RLS peut fermer ça complètement. Pas traité dans ce commit : changement RLS, nécessite sa propre présentation, validation et test isolé (règle du dépôt).

## ✅ `profils` INSERT sans contrôle `email_parent` — confirmé déjà contrôlé, faux positif (14/09/2026)

Vérifié en prod le 14/09/2026 via une tentative d'insertion réelle (session parent authentifiée, `email_parent` usurpé différent de l'email du compte connecté) : rejetée par PostgreSQL, `403`, code `42501`, "new row violates row-level security policy for table profils". Le contrôle existe déjà — policy RLS `Insertion profils` avec `email_parent_valide()` (introduite le 05/09, PR #41), antérieure à l'ouverture de cet item le 14/09. L'item venait de l'audit cybersécurité original (avant le 05/09) et n'avait jamais été retiré après le correctif RLS. Aucune action de code nécessaire — item fermé sans correctif.

## ✅ Parcours de réinitialisation de mot de passe — réparé (14/09/2026)

Deux bugs empilés, découverts en test de bout en bout, tous deux dans `api/email.js` (handler `reset-password`) :

- **Bug 1** — `redirectTo` pointait sur `index.html`, qui n'a aucune logique de traitement du hash `type=recovery` (ni même le SDK Supabase chargé) — le lien atterrissait sur la page d'accueil avec un token valide mais inerte. Corrigé → `connexion.html`, qui porte l'écran "Créer un nouveau mot de passe".
- **Bug 2** — même après le bug 1 corrigé, le lien retombait toujours sur la Site URL du projet. Cause : l'API admin `generate_link` ne lit `redirect_to` qu'en paramètre de query string sur l'URL, jamais dans le body JSON — `options: { redirectTo }` est la convention du SDK client `supabase-js`, pas celle de l'API REST elle-même. Une clé non reconnue dans le body est ignorée silencieusement, sans erreur, d'où le repli permanent sur la Site URL. Vérifié directement dans le source de `gotrue-js`, pas supposé.

Conséquence : ce parcours n'avait probablement jamais abouti depuis sa mise en place. Validé de bout en bout en prod le 14/09/2026 : lien reçu → écran "Créer un nouveau mot de passe" → connexion de l'enfant avec le nouveau mot de passe.

## ✅ Reset mot de passe — cas "parent avec plusieurs enfants" (14/09/2026)

Trois défauts corrigés dans le même handler (`api/email.js`, `reset-password`) : `profils[0]` sans `order by` (enfant choisi arbitrairement sur un parent qui en a plusieurs), email ne nommant pas l'enfant ("votre compte ACADEMIKA", ambigu pour un parent), rate-limit de 3 min appliqué à toute la fratrie en lecture comme en écriture.

Corrigés : tous les enfants du parent récupérés et triés alphabétiquement, un lien de recovery par enfant, email listant un bouton par enfant nommé (prénom + nom, pour lever une éventuelle homonymie), rate-limit et `PATCH derniere_demande_reset` restreints aux enfants réellement inclus dans l'email envoyé.

Correctif additionnel dans le même chantier : recherche `email_parent` passée de `eq.` (exact) à `ilike.` (insensible à la casse) sur l'email normalisé, avec échappement des jokers `%` et `_` — testé contre un vrai Postgres local (le faux positif redouté, `marco_campos@x.fr` matchant à tort `marcoXcampos@x.fr` sans échappement, reproduit puis exclu une fois l'échappement en place).

Validé en prod le 14/09/2026 sur deux comptes de test créés pour l'occasion. **Jamais testé sur la configuration réelle de la famille Niazale** (2 enfants) — à faire si l'occasion se présente.

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

1. Cybersécurité avant Stripe live : `shouldCreateUser: true` exploitable, idempotency Stripe absente, `invoice.payment_failed` jamais écouté, `alerte_envoyee` sans NOT NULL, UTC vs Europe/Paris sur bilan périodique
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
19. `rappels_envoyes_user_id_fkey` sans `ON DELETE CASCADE` — bloque la suppression d'un compte `auth.users` ("Database error deleting user", rencontré le 15/09, contournement manuel en supprimant d'abord les lignes `rappels_envoyes`) ; impacte directement le futur chantier RGPD de suppression des comptes élèves en fin d'année ; à trancher : cascade sur la contrainte, ou nettoyage explicite dans le script de suppression
20. Pas de retour vers l'accueil depuis `suivi-parent.html` — logo non cliquable, aucune flèche retour, contrairement à `espace-parent.html` qui en a une ; constaté le 15/09 en test mobile, aucun moyen pour le parent de revenir au site
21. Pas d'œil pour révéler le mot de passe sur `suivi-parent.html` (formulaire de création d'enfant) — le parent choisit un mot de passe qu'il doit transmettre à son enfant sans pouvoir le relire ; l'écran de recovery de `connexion.html` a déjà cet œil, à répliquer ; vérifier aussi la saisie élève de `connexion.html`
22. Découvrabilité du reset de mot de passe — le mécanisme fonctionne désormais (cf. chantiers 14/09 ci-dessus), mais le lien ne vit que sur `connexion.html`, page dont la gate A+B+C éloigne justement le parent ; rien dans l'espace parent ne le mentionne
23. Affichage parent des examens blancs (constaté 15/09/2026 via vérification Claude Code) — aucune requête vers `examens_blancs` dans `suivi-parent.html` (confirmé par grep : seules `resultats` et `profils` sont interrogées, lignes 484/537/644/811/891/1155/1207) ; la policy RLS "Parent voit examens_blancs de son enfant" existe côté base (`db/policies.sql:118`, prête, jamais exploitée côté front) — l'infrastructure permet déjà au parent de lire les résultats d'examen blanc de son enfant, mais aucun affichage n'a été construit ; chantier important mais non urgent, à regrouper probablement avec la refonte "niveau atteint" déjà en discussion pour `suivi-parent.html` plutôt que de le traiter isolément

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
