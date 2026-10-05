# TODO consolidé — 04/10/2026

---

## 🟠 Ouvert — RLS parent : reliquats

- Écrire `db/policies.test.sql` (jamais fait ; seul `db/policies.sql` existe)
- Normaliser l'email dans le formulaire d'inscription (au lieu de dépendre du rattrapage `lower(trim(...))` en lecture)

## 🟠 Ouvert — duplication du déblocage `quiz.html` / `suivi-parent.html`

L'algorithme de déblocage est dupliqué entre les deux fichiers (pas de module partagé `lib/progression.js`). À contrôler à chaque modification touchant l'un des deux (ajout/retrait de sous-thème, changement de seuils, logique de déblocage) : aucune erreur ni log en cas de divergence, juste un état affiché faux. Action de fond : créer `lib/progression.js` (vérifier d'abord que Vercel sert `/lib/*.js`).

## 🟠 Ouvert — aligner `cron-rappel.js` sur la logique niveau

Le mail récap journalier affiche encore le score brut de la session + seuil "Acquis ≥70%/À revoir <70%" plaqué sur une session isolée — trompeur (une session à 60% peut faire partie d'une progression normale). Tant que ce n'est pas fait, la phrase de synthèse de `suivi-parent.html` reste en mode dégradé (descriptive, sans comparaison temporelle).

**À faire** : réutiliser la logique niveau/progression de la refonte suivi-parent, étendre à `cron-rappel.js` (récap journalier) et au bilan périodique (21 jours, `sous_themes_snapshot`, qui mesure la difficulté tentée sur la fenêtre et non le niveau débloqué — source de régressions fantômes).

**Point de contenu à trancher à la conception** : garder une mention de la session du jour en plus du niveau global, ou basculer entièrement sur niveau/progression.

**Confirmé et complété (14/09)** : le récap journalier (`api/email.js`, `recap-journalier-user`) ne mentionne effectivement jamais le niveau atteint ni la progression de déblocage — seulement "acquis/à revoir" sur la journée. Découverte additionnelle : un quiz abandonné compte comme 0/5 dans la moyenne du jour et peut à lui seul faire basculer le ton de l'email (encourageant → "score faible") — à traiter dans ce même chantier, un abandon ne devrait probablement pas peser comme un échec dans la moyenne.

## 🟠 Ouvert — captures d'écran : état `maitrise`

À vérifier manuellement ou via un second compte démo : l'état `maitrise` n'est pas couvert par le jeu de données de démo (niveau Difficile, exclu volontairement).

Jeu démo Lucas : dates ancrées au 03/09/2026 (fenêtre 14 jours dégradée) — décaler les dates avant toute nouvelle capture d'écran.

## 🟠 Ouvert — résultats orphelins : réattribution

- Famille Niazale : 2 sessions sont restées sur le compte parent. Écrire au parent pour savoir lequel des deux enfants a travaillé, puis les ré-attribuer à son compte.
- Famille Andrianarivelo : 2 sessions sur un premier compte parent, l'enfant a son propre compte fonctionnel — non prioritaire.

## 🟠 Ouvert — reset mot de passe multi-enfants

Reset mot de passe multi-enfants : à tester sur une famille réelle à plusieurs enfants

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
    ⚠️ **Contradiction à arbitrer par CM (constatée le 30/09/2026, non tranchée)** : ce point traite le `SOUS_THEMES` codé en dur comme une dette à généraliser, alors que la refonte de `suivi-parent.html` (PR #43) l'avait retenu comme un écart assumé (pas de `COUNT` dynamique, lecture publique de `questions_banque` retirée par l'audit sécurité). Écart assumé ou dette ?
10. `api/generer.js` — "Triangles semblables" absent de `chapitres['Espace et géométrie']`
11. Refonte `examen_questions` (chantier 2) — jamais entamée, 180 questions non auditées, pas de dédoublonnage par énoncé
12. Stratification par difficulté inopérante dans `api/examen.js` — tri après `sort(() => Math.random()-0.5)`, tirage aléatoire pur en pratique
13. Shuffle biaisé — motif présent dans tout le dépôt
14. **Audit doublons numériques (22/09/2026)** — 13 questions remontées par script SQL, 6 corrigées en base directement (`examen_questions` 116/122/125/186, `questions_banque` 234/627 — bonne réponse dupliquée dans les options). Sur `questions_banque` 234, premier distracteur proposé (`6/8`) lui-même invalide — simplification incomplète de `36/48`, donc toujours égal à `3/4` — corrigé en `4/3` (inversion numérateur/dénominateur). Audit relancé après corrections : 8 lignes restantes, toutes des cas déjà identifiés, aucune nouvelle anomalie, bonne réponse distincte des doublons dans tous les cas restants. Reste pour la refonte :
    - `examen_questions` 181 (roue de loterie, 2/8 vs 1/4) — les deux options sont mathématiquement justes et l'explication le reconnaît elle-même ; à reformuler (ex. demander la forme irréductible), pas une simple substitution d'option
    - `examen_questions` 113 (126/180) — faux positif assumé : les 4 options valent 0,7, mais c'est le principe même de la question (identifier la seule écriture irréductible)
    - Doublons bénins entre deux mauvaises réponses uniquement, bonne réponse toujours unique, aucun élève pénalisé : `examen_questions` 106, 120, 122, 125 ; `questions_banque` 492, 772

---

## 🔒 Chantier sécurité — lots (octobre 2026)

- [ ] Lot 4 — validation des API d'entrée (cf. technique n°40)
- [ ] Lot 5 — échappement des pages parent et publiques, avant le 01/12/2026 (cf. technique n°41)

---

## 🟠 Plateforme Academika — technique

> **Note de numérotation (04/10/2026)** : les numéros 2, 3, 10, 13, 20, 21, 33, 35, 38, 43 et 49 sont absents de cette liste et ne sont volontairement pas réattribués (renvois croisés ; les points terminés sont supprimés). Le n°25 renvoie à un « item 20 » (message d'erreur de `sauvegarder()` de `examen.html`) qui n'existe plus dans ce fichier — son contenu exact n'est pas retrouvable ici. Les nouveaux points sont ajoutés à la suite du dernier numéro.

1. Cybersécurité avant Stripe live : `shouldCreateUser: true` exploitable, idempotency Stripe absente, `invoice.payment_failed` jamais écouté, `alerte_envoyee` sans NOT NULL, UTC vs Europe/Paris sur bilan périodique

   `/api/email` : l'endpoint `reset-password` n'a aucune vérification d'authentification, de CSRF ni d'origine, avec CORS ouvert à `*` (constaté 15/09/2026). Le rate-limiting limite les dégâts (3 min par enfant via `derniere_demande_reset`, 10/h par adresse via `email_rate_limit`) et l'anti-énumération est correctement implémenté (réponse uniforme même en cas d'erreur). Risque = nuisance (déclenchement d'emails vers des adresses de parents inscrits), pas compromission. À arbitrer avec le reste de l'audit.
4. Double email inscription brevet blanc présentiel — jamais vérifié résolu depuis 08/06
5. Erreurs SVG `NaN` dans l'examen blanc — cosmétique
6. Déconnexion lente — piste : `logout()` attend fin d'appels réseau
7. Chevauchement contenu email récap si plusieurs sessions le même jour — mineur
8. Fuseaux horaires — recensé le 17/09/2026, aucun bug actif, deux points de fragilité. (a) Les conversions serveur vers la date Paris sont correctes (`api/cron-rappel.js:86`, `api/email.js:764` et `774`, `api/stripe-webhook.js:247` utilisent toutes `timeZone: 'Europe/Paris'`), mais elles reposent implicitement sur le fait que Vercel tourne en UTC : `new Date()` sur un timestamp naïf de `resultats` l'interprète comme heure locale du serveur. Juste aujourd'hui, silencieusement faux si le fuseau du runtime changeait — hypothèse à documenter, pas à corriger. (b) `suivi-parent.html` (lignes 728, 866, 973) regroupe les sessions par jour selon le fuseau du NAVIGATEUR du parent (`dateLocaleISO`), pas selon Paris : identique pour un parent en France, découpage des journées différent de l'email reçu pour un parent à l'étranger. Cas limite jamais rencontré, correction non prioritaire.
9. Warning console — meta tag `apple-mobile-web-app-capable` déprécié (ajouter `mobile-web-app-capable`) ; `favicon.ico` en 404 en production (constaté le 04/10/2026)
11. Distinction gratuit/abonnement — gating email fait, dashboard/PDF/examen blanc à construire
12. Espace parent persistant (option B) — en attente depuis 24/07, sans date
14. Policies ciblant `{public}` au lieu de `{authenticated}` — pas exploitable aujourd'hui, fragile
15. `historique_bilans`/`rappels_envoyes`/`email_rate_limit` — RLS active, zéro policy

    Sur les trois, seule `historique_bilans` a été vérifiée (17/09/2026) : état voulu, accès serveur uniquement (`api/cron-rappel.js`, clé service, qui contourne RLS). `rappels_envoyes` et `email_rate_limit` restent à vérifier — probablement le même cas, non confirmé.

    **Mise à jour (04/10/2026)** : pour `historique_bilans`, les droits de table sont désormais retirés à `anon` et `authenticated` (`REVOKE ALL`) en plus de la RLS sans policy — documenté dans `db/policies.sql`. `rappels_envoyes` et `email_rate_limit` : toujours non vérifiés.
16. Bandeau commercial `suivi-parent.html` vend "résultat examen blanc en ligne" — jamais implémenté, masqué jusqu'au 01/12
17. Deux seuils désalignés "abordé" (1 session) vs "À découvrir" (<3 sessions) — assumé, pas un bug
18. Lien "Offres" corrigé (`#quiz`→`#offres`) sur `index.html`/`tarifs.html` (09/09) ; même décalage nom/cible jamais corrigé sur `stages-vacances.html`, `connexion.html`, `cours-particuliers.html`, `abonnement-confirme.html` (liens vers `index.html#quiz`)
19. **Chantier RGPD suppression des comptes — NON CADRÉ** (constat du 15/09/2026). La contrainte `rappels_envoyes_user_id_fkey` sans `ON DELETE CASCADE` n'est pas un chantier isolé mais le symptôme d'un chantier jamais conçu.

    Incident réel rencontré le 15/09/2026 : erreur « Database error deleting user » à la suppression d'un compte `auth.users` ; contourné manuellement en supprimant d'abord les lignes `rappels_envoyes` de l'élève concerné. Le blocage n'est donc pas théorique et se reproduira à chaque suppression tant que le mécanisme n'est pas conçu.

    État réel du schéma (dump `pg_constraint` du 15/09/2026) :
    - `profils` : `ON DELETE CASCADE` (se nettoie seul)
    - `resultats`, `rappels_envoyes` : FK sans CASCADE (bloquent un `DELETE` sur `auth.users` — garde-fou, pas défaut)
    - `examens_blancs`, `historique_bilans`, `questions_vues` : colonne `user_id` mais AUCUNE FK (lignes orphelines après suppression, jamais nettoyées)
    - `inscriptions_stages`, `inscriptions_brevet`, `sessions_examen_blanc` : pas de `user_id`, probablement liées par email/prénom — contiennent potentiellement des données de mineurs NON couvertes par une suppression basée sur `user_id`

    Points à trancher AVANT toute modification de contrainte :
    1. Périmètre réel des données personnelles à supprimer (au-delà des tables à `user_id`)
    2. Mécanisme : CASCADE vs suppression applicative orchestrée (la seconde est traçable, la première détruit sans trace)
    3. Traçabilité de la suppression (preuve de conformité)
    4. Déclenchement (cron ? manuel ? notification parent préalable ?)

    **Ne PAS modifier les contraintes FK maintenant** : elles doivent être décidées pendant la conception du mécanisme, pas avant.
22. **Deux compteurs "Sessions" homonymes divergents dans `prof.html`** — constaté le 17/09/2026 en corrigeant le filtrage des abandons sur les moyennes (lot RLS/fuseaux/abandons). Le tableau "Résultats par domaine" (`s.n`, colonne "Sessions") compte désormais uniquement les sessions non abandonnées, effet de bord du filtre posé en PR #76 — alors que la colonne "Sessions" de "Liste des élèves" (`e.sessions++`) compte volontairement tout, abandons inclus, comme mesure d'activité. Même mot, deux définitions, dans le même fichier. À trancher : harmoniser sur une seule définition, ou renommer l'une des deux colonnes pour lever l'ambiguïté.
23. **Asymétrie quiz/examen dans "30 dernières activités" (`prof.html`)** — constatée le 17/09/2026, partiellement corrigée le 20/09/2026 : les quiz abandonnés affichent désormais le badge "Abandonné" (même motif que le tableau "Résultats Examens En Ligne") au lieu d'un "0/5" indiscernable d'un vrai zéro. Reste ouvert : les examens blancs abandonnés, eux, sont toujours exclus de cette liste en amont (`EXAMENS.filter(e=>!e.abandonne)`) plutôt que d'y apparaître avec ce même badge — à trancher (aligner sur le badge pour les deux types, ou assumer l'exclusion différenciée pour les examens), pas traité dans le lot du 20/09/2026.
24. **Champ de code de connexion (`prof.html`, `espace-parent.html`) — production ne reflète pas `main`, diagnostic suspendu le 20/09/2026.** Le champ n'affiche pas 28px/gras sur https://www.academika.fr, alors que `main` est confirmé correct : le commit `69a9998` (merge PR #78) contient bien `.login-code-input { font-size: 28px; font-weight: 600; ... }` et le même changement sur `espace-parent.html`. Le déploiement Vercel associé à ce commit est marqué "Ready" en Production. Malgré ça, un rechargement forcé (Ctrl+Shift+R) sur l'URL de production continue d'afficher l'ancien rendu (20px, sans gras) au 20/09/2026.

    Pistes non encore vérifiées : alias de domaine `www.academika.fr` pointant peut-être vers un déploiement figé plutôt que la production courante (Vercel → Settings → Domains) ; cache CDN Vercel/Cloudflare en amont du navigateur ; ou un délai de propagation plus long que quelques minutes. Aucune de ces pistes n'a été testée à ce stade — l'investigation s'est arrêtée avant de les vérifier.

    À ne pas refaire en reprenant ce point : le diagnostic a déjà établi que le code source sur `main` est correct et que le diff des deux PR (#78, deux commits) est conforme à ce qui était voulu. Le problème est côté déploiement/cache, pas côté code.
25. **Aucun échec de `sauvegarder()` (`examen.html`) n'est remonté côté serveur** — constaté le 20/09/2026 en corrigeant le message d'erreur affiché à l'élève (item 20). Le `console.error` en cas d'échec meurt dans le navigateur de l'élève ; tant qu'il n'y a pas de trafic, personne ne le voit. Le jour où il y aura du trafic, un échec sera découvert par un parent mécontent, pas par le prof. À cadrer séparément (remontée serveur, alerte prof, ou autre mécanisme).
26. **Libellés de domaines tronqués dans `renderResultats()` (`examen.html:686`)** — `theme.split(' ')[0]` coupe au premier espace, laissant une virgule parasite sur les domaines multi-mots (« Organisation, », « Grandeurs, »). Antérieur aux PR #81/#82, découvert en cours de chantier reprise de session (21/09/2026), non traité ici. Idée à valider : libellé court explicite par domaine, ou retrait de la ponctuation finale.
27. **Intégrité du score de `api/quiz-resultat.js` falsifiable** — reporté le 23/09/2026. Le « recalcul serveur » compare `reponses` à `questions[i].answer`, tous deux fournis par le client dans la même requête : ce n'est pas une vérité serveur indépendante. Une vérité serveur par `id` de question n'est possible que pour `source_questions==='banque'`, pas pour `'ia'` (questions générées à la volée, jamais persistées). À reprendre une fois le chemin IA supprimé en fin de refonte de la banque de questions (socle 540 puis 1080).

28. **Gate `profils` de `examen.html` (comptes orphelins) : un jeton corrompu fait échouer techniquement la lecture, fail-open prévu laisse passer l'élève** — constaté le 22/09/2026 en testant le correctif d'authentification par jeton (chantier reprise de session). Comportement volontaire et déjà documenté ailleurs (`errProfil` → `console.log` + pas de blocage), mais jamais spécifiquement croisé avec le cas d'un jeton corrompu/périmé avant ce test. Non bloquant : l'élève laissé passer par ce gate se heurte de toute façon au 401 de `/api/examen` juste après (couvert par `appelExamenApi`/écran de reconnexion). Constat seulement, non corrigé ici.
29. **Gate de session des pages dégradées à auditer** — même motif que le correctif de `connexion.html` (session « présente » acceptée sans vérification serveur), non audité individuellement sur `quiz.html` (sa propre garde `init()`), `prof.html`, `suivi-parent.html`, `resultats.html`, `espace-parent.html` et `abonnement-confirme.html`. À vérifier au cas par cas avant de généraliser le correctif.

30. **Dates de quiz affichées en heure UTC, pas heure de Paris (`resultats.html`)** — constaté le 22/09/2026 : un quiz passé à 21:52 heure de Paris s'affiche 19:52. La colonne `created_at` de `resultats` est un `timestamp` sans fuseau, contrairement à `examens_blancs`. À vérifier aussi sur `prof.html` et `suivi-parent.html`.
31. **`supabase-js` chargé en `@2` sans version épinglée** (`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`, présent sur toutes les pages HTML du dépôt) — constaté le 23/09/2026 en travaillant sur la classification des erreurs `getUser()`/`refreshSession()` (`error.name`, `error.status`), qui dépend de la forme exacte des classes d'erreur de `@supabase/auth-js`. Toute mise à jour mineure/patch de la librairie s'applique automatiquement en production sans revue ni contrôle de version, avec un risque de changement de comportement non maîtrisé (forme des erreurs, comportement de `getSession()`/`refreshSession()`, etc.). Constat seulement, non traité ici.
32. **Écran de fin de quiz (`quiz.html`) — suivi lot 2 « session corrompue »** — constats faits le 24/09/2026 en revue du lot qui a introduit `renderResultats()`/`tenterSauvegarde()`/`appelQuizResultatApi()` (PR #87), non traités dans ce lot :

    1. **Attente très longue (> 15 s) quand `refreshSession()` échoue pour raison réseau** (`appelQuizResultatApi()`) : `supabase-js` réessaie en interne environ 8 fois avant d'abandonner, pendant lesquelles l'écran de fin (`renderResultats()`) n'apparaît pas — aucun signe donné à l'élève pendant ce temps. Même chose au clic sur « Réessayer » (`reessayerSauvegarde()`), qui passe par le même chemin. Piste à creuser : un plafond d'attente propre à l'appel (~8 s, par exemple via `Promise.race`) qui bascule en statut `'transitoire'` sans attendre la fin des réessais internes de la librairie.
    2. **Afficher le score immédiatement**, avant tout appel réseau, avec un statut `⏳ Enregistrement en cours…` dans le bandeau (`#statut-enregistrement`), puis le mettre à jour une fois `sauvegarder()` résolu — plutôt que d'attendre la fin de l'enregistrement (donc potentiellement l'attente du point 1) avant de montrer quoi que ce soit à l'élève.
    3. **Le bloc Progression (`prog-msg`/`prog-bloc`, calculé via `verifierDeblocage(theme, sousTheme)`) est calculé une seule fois, avant l'enregistrement, et jamais recalculé après un « Réessayer » réussi** — un élève dont la première tentative échoue puis réussit au retry voit une progression figée sur l'état d'avant cette session (ex. « 0/5 » alors que la session vient d'être comptabilisée), affichée à tort comme à jour.
    4. **Le message « ✅ Session réussie ! » (`prog-msg`, ligne ~1020/1026/1028) s'affiche même quand le résultat n'est pas enregistré** (cas `'definitif'`) — puisque `progMsg` est construit indépendamment du statut de `sauvegarder()`, sur le seul score local (`pct >= SEUIL_PCT`). À rendre neutre (ou conditionner à un enregistrement réussi) dans ce cas, pour ne pas contredire le bandeau `❌ Résultat non enregistré` juste au-dessus.
    5. **Titre trompeur `Progression — ${themeCourt}` (ligne ~1063)** : le thème entier est affiché en titre, alors que les compteurs de la section (`ligneMoyen`/`ligneDifficile`, sessions `SEUIL_SESSIONS`) sont en réalité comptés **par sous-thème**, pas par thème — un élève ayant progressé sur un sous-thème du thème peut lire un titre qui laisse croire à une progression sur le thème entier.

34. **Bilan périodique 21 jours : les abandons de quiz sont comptés comme des sessions à 0/5** — constaté le 30/09/2026 en vérifiant la prise en compte des abandons dans le récap journalier. `api/cron-rappel.js:295-297` lit `resultats` avec `select=score,total,sous_theme,difficulte,created_at` sans `abandonne` : aucun filtre, contrairement au récap journalier (`api/email.js:838-841`). Fausse à la baisse la moyenne et les compteurs de sessions du bilan. À traiter avec le chantier « aligner `cron-rappel.js` sur la logique niveau » (section 🟠 de tête), qui en héberge déjà la conception.

36. **Test de bout en bout de la résiliation Stripe avant le passage en live** — constaté le 04/10/2026. L'email `resiliation-confirmee` part sur `customer.subscription.updated` (`cancel_at_period_end` de `false` à `true`), pas sur `customer.subscription.deleted`. Depuis la PR #94, `api/stripe-webhook.js` envoie `CRON_SECRET` et `api/email.js` l'exige : `CRON_SECRET` doit être posé sur les scopes Vercel Preview ET Production, sinon la confirmation échoue (webhook en 500, log « Erreur envoi email confirmation résiliation », Stripe rejoue l'événement). Jamais testé en conditions réelles depuis ce changement. Ferme aussi la partie (b) de « légal » n°2 (validation en conditions réelles de l'email de résiliation).

37. **`email_rate_limit` : compteur encore partagé par adresse pour les autres types d'email** — constaté le 04/10/2026. Les types autres que `brevet-blanc` et `inscription` (`reset-password` notamment) incrémentent le même compteur (10 emails/heure par adresse, clé = email en minuscules) que les emails légitimes : un appel anonyme peut épuiser le quota d'une adresse et bloquer ses vrais emails. (`contact-cours` utilise une clé préfixée, `contact-cours:<email>`, donc n'est pas concerné.) De plus, `verifierRateLimit` reste fail-open (une panne technique laisse l'envoi passer) et non atomique (lecture puis écriture).

39. **`prof.html` : l'alerte « Email non envoyé : recharge la page » s'affiche aussi sur un 429** (limite de 10 emails/heure par destinataire) **ou un 400**, alors que recharger la page n'y change rien ; dans les boucles d'annulation de session (brevet et stage), N inscrits en échec donnent N alertes consécutives. Constaté le 04/10/2026 (fonction `appelerEmail`, PR #94). Message à distinguer par code de réponse, alertes à regrouper.

40. **Lot 4 — validation des API d'entrée** — non traité, constaté le 04/10/2026 : `api/inscription-stage.js`, `api/inscription-brevet.js` et `api/quiz-resultat.js` n'ont pas de validation systématique de leurs entrées (types, longueurs, formats). À noter en particulier : `api/inscription-brevet.js` n'échappe aucune des valeurs insérées dans ses emails (`prenom`, `nom`, `email_parent`, `telephone`), contrairement à `api/inscription-stage.js` (`esc()`).

41. **Lot 5 — échappement HTML des pages parent et publiques, avant le 01/12/2026** — non traité : `suivi-parent.html`, `resultats.html` et les pages publiques `stages-vacances.html` / `brevet-blanc.html`. Même motif que le lot 1 (PR #93, qui n'a traité que `prof.html`) : valeurs issues de la base insérées dans `innerHTML` sans échappement.

42. **Contenu de la banque de questions non échappé dans `prof.html`** (énoncés, options, tableaux, figures SVG) — hors périmètre du lot 1 (PR #93). Une sonde SQL est à lancer avant toute décision, pour mesurer ce que la base contient réellement (balises, guillemets, SVG légitimes) : échapper un contenu volontairement riche (tableaux, SVG) casserait l'affichage.

44. **`stages-vacances.html` : les stages passés restent affichés** — constaté le 04/10/2026. La page affiche toujours les sessions dont la date de début est passée, marquées « Terminé » (filigrane) et non cliquables (`s.termine`, `stages-vacances.html:165-172`) : aucun filtre ne les retire de la liste.

45. **`brevet-blanc` ignore `profils.email_actif`** — constaté le 04/10/2026 (PR #97). Un parent désabonné (`email_actif = false`) reçoit encore le bilan d'examen après chaque examen de son enfant ; `recap-journalier-user` en tient compte, pas `brevet-blanc`. Question de consentement, à traiter.

46. **`api/email.js` : la branche d'erreur de `brevet-blanc` renvoie au client le corps de l'erreur Resend** — constaté le 04/10/2026 (PR #97). Réponse 500 du type `'Erreur envoi email : ' + JSON.stringify(responseData)`. Fuite d'information mineure.

47. **Suppression de compte non prévue proprement** — constat SQL du 04/10/2026, complète le n°19 (chantier RGPD non cadré). `examens_blancs` et `questions_vues` n'ont aucune clé étrangère vers `auth.users` : supprimer un compte laisse des lignes orphelines. `resultats` et `rappels_envoyes` ont une clé étrangère sans cascade (`ON DELETE NO ACTION`) : elle bloque la suppression d'un compte qui a des lignes. `profils` et `examens_progression` sont en cascade. (`historique_bilans`, listé au n°19 sans clé étrangère, n'est pas repris dans ce constat.) À traiter avant toute demande de suppression RGPD réelle.

48. **Domaine canonique : `academika.fr` redirige vers `www.academika.fr`** — constaté en production le 04/10/2026. Les liens de désabonnement des emails, écrits en apex (`https://academika.fr/desabonner.html?...`), passent donc par cette redirection. À harmoniser à l'occasion.

50. **`inscription` : `prenom` et `nom` envoyés au prof non vérifiés contre un enfant réel du parent** — constaté le 04/10/2026 (PR #97). Le texte est borné, échappé et limité (10 envois par heure et par compte), mais un parent légitime peut faire envoyer à `contact@academika.fr` un nom qui ne correspond à aucun de ses enfants. Faible priorité.

51. **Dette : `purgerSessionLocale()` existe en 3 copies (`examen.html`, `connexion.html`, `quiz.html`) et `estRefusAuthentification()` en 2 copies (`connexion.html`, `quiz.html`)** — factoriser dans un helper client partagé.

52. **Commentaires de code renvoyant à des entrées TODO supprimées** (`db/policies.sql:98`, `:334-335`, `:538`) — remplacer par le numéro de PR correspondant.

53. **Fonctions Vercel : 12 sur 12, plus aucune marge** (`api/connexion-eleve.js` est la 12ᵉ) — consolider (fusionner des endpoints) avant toute nouvelle fonction.

54. **`index.js` (racine) : code mort** d'une ancienne version (page Next.js qui importe `../lib/supabase`, absent) — supprimer, après avoir vérifié que Vercel ne le sert pas publiquement.

55. **CAPTCHA Supabase Auth à étudier** — attention : il s'applique à toutes les connexions et inscriptions, pas seulement à celle des élèves.

56. **Réglages Supabase « Secure password change » et « Require current password » désactivés** — à étudier.

57. **`verifier_disponibilite` reste appelable par tout compte connecté** (donc par quiconque crée un compte parent, cf. `shouldCreateUser`) : permet de savoir si un couple (prénom, nom) existe — à traiter avec le n°1.

58. **Compteurs de connexion (`login_tentatives`) : prévoir une purge des lignes expirées** (une ligne par prénom+nom ou IP ayant échoué, y compris des noms inventés).

59. **Connexion élève : une IP partagée (établissement scolaire) peut être bloquée pour tous après 20 échecs en 15 min** — à surveiller avec du trafic réel.

61. **Connexion élève : uniformité de durée au démarrage à froid** — la réponse de `api/connexion-eleve.js` attend 1 s au minimum, mais un démarrage à froid de la fonction peut allonger la durée d'une réponse et la distinguer des autres ; à mesurer.

62. **Réglage Supabase « leaked passwords » (mots de passe compromis)** — disponible avec l'offre Pro ; à étudier.

63. **Formulaire d'ajout d'un enfant : le message d'erreur de paiement (offre Suivi, ~l.1315) sera suivi d'un rechargement de la page 2,5 s plus tard** ; à revérifier avant le 01/12/2026, quand l'offre Suivi redeviendra payante.

64. **Délivrabilité des emails d'Academika (constaté le 05/10/2026)** : un email du formulaire de contact (noreply@academika.fr, envoyé par Resend vers contact@academika.fr) est tombé en spam. contact@academika.fr est hébergé chez Hostinger et redirigé vers un Gmail lu uniquement sur mobile. À faire : (1) côté CM, depuis le mobile : ajouter noreply@academika.fr aux contacts du compte Google et marquer l'email en « non-spam » ; filtre Gmail « ne jamais envoyer dans le spam » possible via le navigateur en mode ordinateur ; (2) vérifier dans Resend (Domains, academika.fr) que le domaine est « Verified » avec SPF et DKIM ; (3) vérifier DMARC et la cohabitation des SPF de Hostinger et de Resend (un seul enregistrement SPF par domaine) ; (4) à l'occasion, lire SPF/DKIM/DMARC dans « Afficher l'original » d'un email reçu. Les emails envoyés aux parents arrivent directement de Resend : seule l'authentification du domaine les protège.

---

## 🟡 Plateforme Academika — légal

1. CGV — case à cocher Art. A1/B4 manquantes ; contenu à corriger (Art. C1, B2, placeholders tarifs)
2. Conformité résiliation "3 clics" — ✅ bug du portail en espagnol corrigé (locale forcée à `fr`, `api/stripe-checkout.js:262-265`, constaté le 30/09/2026). **Reste ouvert** : (a) nom d'entreprise non configuré dans Stripe (« XXXXX » sur le portail et les factures) ; (b) email de résiliation sur support durable — le code existe (`api/email.js:1070`, type `resiliation-confirmee`, déclenché depuis `api/stripe-webhook.js`), mais sa validation en conditions réelles n'est pas consignée ici.
3. Politique de confidentialité — page inexistante
4. Consultation juridique — jamais initiée, bloque CGV et flyers
5. SIRET/SAP — SIRET obtenu (10786402700019) depuis le 24/08/2026. Seul le dossier INPI d'ajout de l'activité 85.59B (formalité J00274516137) reste en attente de l'INSEE/URSSAF.
6. Bandeau cookies — pas nécessaire aujourd'hui, deviendra obligatoire si Meta Ads activé
7. RGPD rétention comptes élèves — politique définie, à vérifier documentation mentions légales

---

## 🟢 Plateforme Academika — marketing / produit

1. Distribution flyer A5 — bloquée en attente consultation juridique
2. SEO Phase 7bis — pages statiques indexables par sous-thème, analysé non implémenté
3. Design system unifié — plan validé, jamais exécuté
4. Refonte design de `suivi-parent.html` — envisagée le 15/09/2026, pas encore cadrée. Contrainte à respecter : le bloc "Examens blancs" (ajouté le 16/09/2026, `chargerExamensBlancs()` + `#zone-examens`) doit être conservé — il expose une donnée qui n'est visible nulle part ailleurs pour le parent. Sa présentation peut évoluer, son existence non. Autre point déjà identifié : le bouton "+ Ajouter un enfant" est une action de contenu placée dans la barre de navigation, à déplacer probablement dans la page ; noter qu'un compte parent sans aucun enfant masque déjà ce bouton et affiche une action dédiée dans l'état vide.
4 bis. Extension site dédié 4ème/2nde — non tranchée
5. URL trackée dédiée flyer (`/flyer`) — à faire, complémentaire au champ source déclaratif
6. Constat concret pendant le chantier captures produit (09-13/09) : `index.html`/`tarifs.html` partagent `style.css`, `espace-parent.html` a son propre `<style>` local avec des noms de variables différents pour les mêmes couleurs (`--navy`/`--bordeaux` vs `--marine`/`--bordeaux`, etc.) — a nécessité une duplication de `.produit-shot`/`.section-label` avant qu'on ne retire finalement tout ce contenu d'`espace-parent.html`. Illustration concrète du point 3 ci-dessus.
8. Évaluer le stage Toussaint 2026 selon le critère du 04/10/2026 (`CLAUDE.md`, décisions commerciales) : nombre d'inscrits et origine de chacun (Instagram, Facebook, proches), effort fourni par canal, trafic de `stages-vacances.html` et de `/insta` dans Vercel Analytics.

---

## 🔵 La Hulotte

1. PPWR Aluplast — attestation en cours, écart PFAS à combler
2. PMS gap analysis — écarts critiques identifiés, pas de suite actée
3. Écart consommation Crème UHT (1%→21% T1 2026) — signalé, pas de suite actée

---

## ⚪ Projet conseil IA/data (agri-food)

1. Phase 0 — accumuler 3-5 problèmes business chiffrables avant offre. Bascule test IoT décidée, résultat jamais confirmé
