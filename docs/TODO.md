# TODO consolidé — 13/10/2026

---

## 🟠 Ouvert — RLS parent : reliquats

- Écrire `db/policies.test.sql` (jamais fait ; seul `db/policies.sql` existe)
- Normaliser l'email dans le formulaire d'inscription (au lieu de dépendre du rattrapage `lower(trim(...))` en lecture)

## 🟠 Ouvert — bilan périodique : suites du lot 3

Le bilan 21 jours et le bouton prof lisent désormais la vue `niveaux_sous_theme` (`lib/bilan-email.js`, `CLAUDE.md` § Bilan parent). Reste :

- Exécuter `db/bilan-niveaux-snapshot.sql` (avant le merge), puis tester en preview (procédure dans la PR) et vérifier le premier bilan réel de production (cron de 21 jours : envoi, ligne `historique_bilans` avec `niveaux_snapshot`).
- `api/cron-rappel.js` : les emails de fin d'année et d'été interpolent `prenom_affiche` sans échappement HTML (le bilan, lui, est échappé par `lib/bilan-email.js`).
- Généraliser le garde d'envoi (`lib/garde-envoi.js`, hors production = un seul destinataire de test) aux autres envois : types `adresse-brevet`, `stage`, `resultats-brevet`, `resiliation-confirmee` de `api/email.js`, `api/inscription-brevet.js`, `api/inscription-stage.js`. Une preview partage la base et la clé Resend de la production : ces envois partent aujourd'hui à de vrais destinataires.
- Email du bilan : le bouton « Voir le suivi complet dans l'espace parent → » est violet (`#3730a3`), hors charte (bleu marine `#1B2A4A` / or `#D4A23C`) ; même violet dans les liens et boutons des autres emails (`api/email.js`, `api/cron-rappel.js`). Hors périmètre de la PR #136.
- PDF du bilan (`js/bilan-pdf.js`, `generer()`, section « Activité sur la période »), hors périmètre de la PR #136 :
  - [ ] « Quiz abandonnés » affiché en grand (41 sur le PDF vu) : alarmant pour un parent. Vérifier l'origine (tests de CM en août-septembre ?) puis réduire (petite ligne, comme « (+ M interrompue(s) ) » de l'email) ou retirer.
  - [ ] La section commence sur une page 3 alors que la page 2 est presque vide : la remonter (contrôle de saut de page avant la section).
  - [ ] Graphique : retirer le titre d'axe « Date » (~l.1057) et utiliser des graduations rondes (10, 20…).
- Idempotency du bilan : si l'écriture de `historique_bilans` échoue après l'envoi, la cadence ne bouge pas et le bilan est renvoyé le lendemain (l'échec est journalisé et fait passer le ping Healthchecks en `/fail`).

## 🟠 Ouvert — règle « à surveiller » : à réévaluer avec des données réelles

- [ ] Réévaluer les seuils de la règle du 21/10/2026 (au moins 4 essais, au plus 1 réussite sur les 4 derniers essais, jamais en Difficile ; `db/vue-niveaux.sql`) avec des données d'usage réelles : nombre d'élèves signalés, signaux qui s'éteignent d'eux-mêmes, retours de parents.
- [ ] Vérifier que les parents comprennent la différence entre la grille (réussites cumulées vers 5, « 4 / 5 réussites en 6 essais ») et la phrase « 1 réussite sur ses 4 derniers essais ».

## 🟠 Ouvert — captures d'écran : état `maitrise`

À vérifier manuellement ou via un second compte démo : l'état `maitrise` n'est pas couvert par le jeu de données de démo (niveau Difficile, exclu volontairement).

Jeu démo Lucas : dates ancrées au 03/09/2026 (fenêtre 14 jours dégradée) — décaler les dates avant toute nouvelle capture d'écran.

Captures produit de `tarifs.html` (et `index.html` si concernée) à refaire : le visuel « Voyez où il en est » montre l'ancien bloc niveaux (En difficulté / En cours / À découvrir, 19 sous-thèmes, « x/5 vers Moyen ») ; le visuel « Suivez son travail » affiche un « Score moyen ». À refaire depuis Lucas Démo après le lot 3, en décalant d'abord les dates du jeu de démo.

## 🟠 Ouvert — résultats orphelins : réattribution

- Famille Niazale : 2 sessions sont restées sur le compte parent. Écrire au parent pour savoir lequel des deux enfants a travaillé, puis les ré-attribuer à son compte.
- Famille Andrianarivelo : 2 sessions sur un premier compte parent, l'enfant a son propre compte fonctionnel — non prioritaire.

## 🟠 Ouvert — reset mot de passe multi-enfants

Reset mot de passe multi-enfants : à tester sur une famille réelle à plusieurs enfants

## 🖼️ Images sur `index.html` — jamais traité

Maquette validée, non implémentée : icônes 3 étapes "Comment ça marche", icônes 3 cartes d'offres, photo réelle à la place de l'avatar "MC". Écarté : illustration hero (passerait le bloc en 2 colonnes).

---

## ⚠️ Échéance critique — Bascule décembre 2026

Offre Libre gratuite à vie ; seul Suivi (7,90€/mois) devient payant à l'échéance. Code fait et déployé (16/08) : encart d'abonnement, sélecteur d'offre, détail récap masqués via `enPeriodeGratuite()`. **Point ouvert** : vérifier au 01/12/2026 que Stripe est opérationnel (SIRET, mode live) avant réactivation automatique. Rappel agenda mi-novembre déjà posé. Vérifier la formulation marketing validée le 13/08 reprise partout (pas que sur le flyer).

**Distinction gratuit/abonnement — à appliquer avant le 01/12/2026** (gating email, verrous du lot 2 et bilan 21 jours du lot 3 faits) :
- vérifier en conditions réelles les verrous du lot 2 (page parent, examen blanc) en aperçu avec `?simuler=apres-bascule`, puis après la bascule ;
- vérifier en aperçu le bilan tronqué du lot 3 (cron de test avec `test_user_id` et `simuler_bascule=1`, cf. `CLAUDE.md` § Bilan parent), puis le premier bilan réel après la bascule.

---

## 🔴 Banque de questions — chantier en cours

1. Angles — périmètre validé 02/09, calibrage facile/moyen/difficile à faire
2. 7 sous-thèmes restants du tour des 20 : Algorithmique, Transformations, Triangles semblables, Représentation de l'espace, Agrandissement, Aires et volumes (Proportionnalité rédigeable)
    - Supprimer les tables `backup_explications_pyth_20261013` et `backup_explications_thales_20261013` quand CM le décide
    - Thalès : un quiz contient au plus 2 questions de calcul sur 5 (une par famille) — garder, ou autoriser 2 par famille ?
    - Mesurer combien d'élèves bouclent leur pool (`questions_vues`) avant de décider d'écrire 10 ou 20 questions de plus par famille
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
12. Stratification par difficulté inopérante dans `api/examen.js` (l. 127-130) — tri après `sort(() => Math.random()-0.5)`, tirage aléatoire pur en pratique
13. Shuffle biaisé (`sort(() => Math.random() - 0.5)`) — reste dans le mélange des options (`api/generer.js` l. 367), `api/examen.js` (l. 127-130 et 152) et `questions.js` (l. 234)
14. **Audit doublons numériques (22/09/2026)** — 13 questions remontées par script SQL, 6 corrigées en base directement (`examen_questions` 116/122/125/186, `questions_banque` 234/627 — bonne réponse dupliquée dans les options). Sur `questions_banque` 234, premier distracteur proposé (`6/8`) lui-même invalide — simplification incomplète de `36/48`, donc toujours égal à `3/4` — corrigé en `4/3` (inversion numérateur/dénominateur). Audit relancé après corrections : 8 lignes restantes, toutes des cas déjà identifiés, aucune nouvelle anomalie, bonne réponse distincte des doublons dans tous les cas restants. Reste pour la refonte :
    - `examen_questions` 181 (roue de loterie, 2/8 vs 1/4) — les deux options sont mathématiquement justes et l'explication le reconnaît elle-même ; à reformuler (ex. demander la forme irréductible), pas une simple substitution d'option
    - `examen_questions` 113 (126/180) — faux positif assumé : les 4 options valent 0,7, mais c'est le principe même de la question (identifier la seule écriture irréductible)
    - Doublons bénins entre deux mauvaises réponses uniquement, bonne réponse toujours unique, aucun élève pénalisé : `examen_questions` 106, 120, 122, 125 ; `questions_banque` 492, 772
15. **Pythagore/difficile — aucune figure** (30 questions sans dessin, choix assumé du 12/10/2026). Si des figures y sont voulues un jour, il faut un nouveau type de figure (autre PR). Thalès/difficile : 15 questions sur 30 sans figure.

---

## 🔒 Chantier sécurité — lots (octobre 2026)

- [ ] Lot 4 — validation des API d'entrée (cf. technique n°40)
- [ ] Lot 5 — échappement des pages parent et publiques, avant le 01/12/2026 (cf. technique n°41)

---

## 🟠 Plateforme Academika — technique

> **Note de numérotation (04/10/2026)** : les numéros 2, 3, 7, 10, 13, 20, 21, 33, 35, 38, 43, 49 et 65 sont absents de cette liste et ne sont volontairement pas réattribués (renvois croisés ; les points terminés sont supprimés). Le n°25 renvoie à un « item 20 » (message d'erreur de `sauvegarder()` de `examen.html`) qui n'existe plus dans ce fichier — son contenu exact n'est pas retrouvable ici. Les nouveaux points sont ajoutés à la suite du dernier numéro.

1. Cybersécurité avant Stripe live : `shouldCreateUser: true` exploitable, idempotency Stripe absente, `invoice.payment_failed` jamais écouté, `alerte_envoyee` sans NOT NULL

   `/api/email` : l'endpoint `reset-password` n'a aucune vérification d'authentification, de CSRF ni d'origine, avec CORS ouvert à `*` (constaté 15/09/2026). Le rate-limiting limite les dégâts (3 min par enfant via `derniere_demande_reset`, 10/h par adresse via `email_rate_limit`) et l'anti-énumération est correctement implémenté (réponse uniforme même en cas d'erreur). Risque = nuisance (déclenchement d'emails vers des adresses de parents inscrits), pas compromission. À arbitrer avec le reste de l'audit.
4. Double email inscription brevet blanc présentiel — jamais vérifié résolu depuis 08/06
5. Erreurs SVG `NaN` dans l'examen blanc — cosmétique
6. **Sortie de page lente et muette : « Terminer et se déconnecter » (`terminer()`) et « Déconnexion » (`logout()`), `quiz.html`** — constaté sur iPhone le 15/10/2026, antérieur à la PR #126 (code identique sur `main`).
    - **Cause (mesurée avec récap et `signOut` à 4 s chacun)** : la navigation attend, en série, `envoyerRecapJournalier()` (`await fetch('/api/email')` : vérification du jeton, lecture `profils`, lecture des sessions, rate-limit, Resend) puis `sb.auth.signOut()` (appel réseau). Résultat déjà confirmé : 8 s ; cliqué pendant l'enregistrement : 12 s.
    - **Cause principale traitée par le n°74 c** (retirer l'envoi du récap au clic) : `terminer()` / `logout()` n'attendront plus que `signOut`.
    - [ ] **Reste à faire, avec ou après le n°74 c** : retour visuel immédiat au clic sur « Terminer » et « Déconnexion » (boutons désactivés, libellé « Déconnexion… »). Aujourd'hui le bouton reste actif et inchangé pendant toute l'attente. Test à ajouter à `lib/quiz-fin.manual-test.js` : retour visuel à 300 ms avec serveur et auth à 4 s.
8. Fuseaux horaires — recensé le 17/09/2026, aucun bug actif, deux points de fragilité. (a) Pour le récap journalier, la lecture de `created_at` est désormais explicitement UTC (`lib/recap-journalier.js`, `parseUTC()` et `dateParis()`, PR #113, 11/10/2026) ; `api/stripe-webhook.js:247` est correct (timestamp Stripe en secondes + `timeZone: 'Europe/Paris'`). Restent implicites, car dépendants du fuseau du runtime Vercel (UTC aujourd'hui, silencieusement faux s'il changeait) : `api/cron-rappel.js` — branche saisonnière, `maintenant.getMonth()` / `getDate()` (l. 295-296, mois et jour pris en heure serveur et non en heure de Paris) ; `api/inscription-brevet.js:41` et `api/inscription-stage.js:45`, `new Date().toISOString().split('T')[0]` pour « aujourd'hui » (jour UTC : entre minuit et 1 h-2 h à Paris, c'est encore la veille). Les lectures `new Date(dateISO + 'T00:00:00')` suivies de `getDate()` / `getMonth()` (`api/inscription-brevet.js:6`, `api/inscription-stage.js:12`) sont cohérentes quel que soit le fuseau et ne sont pas concernées. Le bilan périodique n'est plus concerné depuis le lot 3 (`lib/bilan-email.js` : `parseUTC`, jours et dates en `Europe/Paris`). Hypothèse à documenter ou à corriger au fil des modifications de ces fichiers, pas d'urgence. (b) `suivi-parent.html` (lignes 728, 866, 973) regroupe les sessions par jour selon le fuseau du NAVIGATEUR du parent (`dateLocaleISO`), pas selon Paris : identique pour un parent en France, découpage des journées différent de l'email reçu pour un parent à l'étranger. Cas limite jamais rencontré, correction non prioritaire.
9. Warning console — meta tag `apple-mobile-web-app-capable` déprécié (ajouter `mobile-web-app-capable`) ; `favicon.ico` en 404 en production (constaté le 04/10/2026). Pour `quiz.html`, à glisser dans la prochaine modification du fichier (cosmétique) : ajouter `<meta name="mobile-web-app-capable" content="yes">` (avertissement Chrome) et corriger l'espace manquante `deblocageCache[cle] ={` dans `verifierDeblocage()`
12. Espace parent persistant (option B) — en attente depuis 24/07, sans date
14. Policies ciblant `{public}` au lieu de `{authenticated}` — pas exploitable aujourd'hui, fragile
15. `historique_bilans`/`rappels_envoyes`/`email_rate_limit` — RLS active, zéro policy

    Sur les trois, seule `historique_bilans` a été vérifiée (17/09/2026) : état voulu, accès serveur uniquement (`api/cron-rappel.js`, clé service, qui contourne RLS). `rappels_envoyes` et `email_rate_limit` restent à vérifier — probablement le même cas, non confirmé.

    **Mise à jour (04/10/2026)** : pour `historique_bilans`, les droits de table sont désormais retirés à `anon` et `authenticated` (`REVOKE ALL`) en plus de la RLS sans policy — documenté dans `db/policies.sql`. `rappels_envoyes` et `email_rate_limit` : le relevé Supabase du 21/10/2026 montre qu'elles n'ont pas de `REVOKE` pour `anon` / `authenticated` (protégées par la RLS seule) — à traiter avec le n°86.
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
22. **Compteur « Sessions quiz » du bandeau de `prof.html` (`ROWS.length`) : abandons inclus** — depuis le 18/10/2026, « Liste des élèves » (« Sessions terminées ») et « Résultats par domaine » (« Sessions ») ne comptent que les sessions terminées (colonne `abandonne`). Reste le bandeau du haut, qui affiche toutes les lignes de `resultats`, abandons compris. À trancher : le filtrer sur les sessions terminées, ou renommer son libellé.
23. **Asymétrie quiz/examen dans "30 dernières activités" (`prof.html`)** — constatée le 17/09/2026, partiellement corrigée le 20/09/2026 : les quiz abandonnés affichent désormais le badge "Abandonné" (même motif que le tableau "Résultats Examens En Ligne") au lieu d'un "0/5" indiscernable d'un vrai zéro. Reste ouvert : les examens blancs abandonnés, eux, sont toujours exclus de cette liste en amont (`EXAMENS.filter(e=>!e.abandonne)`) plutôt que d'y apparaître avec ce même badge — à trancher (aligner sur le badge pour les deux types, ou assumer l'exclusion différenciée pour les examens), pas traité dans le lot du 20/09/2026.
24. **Champ de code de connexion (`prof.html`, `espace-parent.html`) — production ne reflète pas `main`, diagnostic suspendu le 20/09/2026.** Le champ n'affiche pas 28px/gras sur https://www.academika.fr, alors que `main` est confirmé correct : le commit `69a9998` (merge PR #78) contient bien `.login-code-input { font-size: 28px; font-weight: 600; ... }` et le même changement sur `espace-parent.html`. Le déploiement Vercel associé à ce commit est marqué "Ready" en Production. Malgré ça, un rechargement forcé (Ctrl+Shift+R) sur l'URL de production continue d'afficher l'ancien rendu (20px, sans gras) au 20/09/2026.

    Pistes non encore vérifiées : alias de domaine `www.academika.fr` pointant peut-être vers un déploiement figé plutôt que la production courante (Vercel → Settings → Domains) ; cache CDN Vercel/Cloudflare en amont du navigateur ; ou un délai de propagation plus long que quelques minutes. Aucune de ces pistes n'a été testée à ce stade — l'investigation s'est arrêtée avant de les vérifier.

    À ne pas refaire en reprenant ce point : le diagnostic a déjà établi que le code source sur `main` est correct et que le diff des deux PR (#78, deux commits) est conforme à ce qui était voulu. Le problème est côté déploiement/cache, pas côté code.
25. **Aucun échec de `sauvegarder()` (`examen.html`) n'est remonté côté serveur** — constaté le 20/09/2026 en corrigeant le message d'erreur affiché à l'élève (item 20). Le `console.error` en cas d'échec meurt dans le navigateur de l'élève ; tant qu'il n'y a pas de trafic, personne ne le voit. Le jour où il y aura du trafic, un échec sera découvert par un parent mécontent, pas par le prof. À cadrer séparément (remontée serveur, alerte prof, ou autre mécanisme).
26. **Libellés de domaines tronqués dans `renderResultats()` (`examen.html:686`)** — `theme.split(' ')[0]` coupe au premier espace, laissant une virgule parasite sur les domaines multi-mots (« Organisation, », « Grandeurs, »). Antérieur aux PR #81/#82, découvert en cours de chantier reprise de session (21/09/2026), non traité ici. Idée à valider : libellé court explicite par domaine, ou retrait de la ponctuation finale.
27. **Intégrité du score de `api/quiz-resultat.js` falsifiable** — reporté le 23/09/2026. Le « recalcul serveur » compare `reponses` à `questions[i].answer`, tous deux fournis par le client dans la même requête : ce n'est pas une vérité serveur indépendante. Une vérité serveur par `id` de question n'est possible que pour `source_questions==='banque'`, pas pour `'ia'` (questions générées à la volée, jamais persistées). À reprendre une fois le chemin IA supprimé en fin de refonte de la banque de questions (socle 540 puis 1080).
    - Reconfirmé le 15/10/2026 (PR « fin de quiz ») : le serveur recalcule le score à partir des `questions` (champ `answer` compris) envoyées par le navigateur, y compris via le `sendBeacon` de `pagehide`, qui emprunte le même chemin. Non traité : le score affiché instantanément côté navigateur ne change rien à l'exposition.

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


36. **Test de bout en bout de la résiliation Stripe avant le passage en live** — constaté le 04/10/2026. L'email `resiliation-confirmee` part sur `customer.subscription.updated` (`cancel_at_period_end` de `false` à `true`), pas sur `customer.subscription.deleted`. Depuis la PR #94, `api/stripe-webhook.js` envoie `CRON_SECRET` et `api/email.js` l'exige : `CRON_SECRET` doit être posé sur les scopes Vercel Preview ET Production, sinon la confirmation échoue (webhook en 500, log « Erreur envoi email confirmation résiliation », Stripe rejoue l'événement). Jamais testé en conditions réelles depuis ce changement. Ferme aussi la partie (b) de « légal » n°2 (validation en conditions réelles de l'email de résiliation).

37. **`email_rate_limit` : compteur encore partagé par adresse pour les autres types d'email** — constaté le 04/10/2026. Les types autres que `brevet-blanc` et `inscription` (`reset-password` notamment) incrémentent le même compteur (10 emails/heure par adresse, clé = email en minuscules) que les emails légitimes : un appel anonyme peut épuiser le quota d'une adresse et bloquer ses vrais emails. (`contact-cours` utilise une clé préfixée, `contact-cours:<email>`, donc n'est pas concerné.) De plus, `verifierRateLimit` reste fail-open (une panne technique laisse l'envoi passer) et non atomique (lecture puis écriture).

39. **`prof.html` : l'alerte « Email non envoyé : recharge la page » s'affiche aussi sur un 429** (limite de 10 emails/heure par destinataire) **ou un 400**, alors que recharger la page n'y change rien ; dans les boucles d'annulation de session (brevet et stage), N inscrits en échec donnent N alertes consécutives. Constaté le 04/10/2026 (fonction `appelerEmail`, PR #94). Message à distinguer par code de réponse, alertes à regrouper.

40. **Lot 4 — validation des API d'entrée** — non traité, constaté le 04/10/2026 : `api/inscription-stage.js`, `api/inscription-brevet.js` et `api/quiz-resultat.js` n'ont pas de validation systématique de leurs entrées (types, longueurs, formats). À noter en particulier : `api/inscription-brevet.js` n'échappe aucune des valeurs insérées dans ses emails (`prenom`, `nom`, `email_parent`, `telephone`), contrairement à `api/inscription-stage.js` (`esc()`).
    - `api/quiz-resultat.js` renvoie au client le texte brut de l'erreur Supabase en cas d'échec d'insertion (`errText`, l. 162-163, repris dans le 500 des l. 54 et 90) : un corps d'erreur PostgREST peut révéler des noms de contraintes, de colonnes ou de policies. Constaté le 15/10/2026, antérieur à la PR « fin de quiz », non corrigé. Cible : message générique au client, détail dans le log Vercel seulement (même principe que le préfixe `[questions_vues]`). Vérifier si d'autres endpoints font de même.

41. **Lot 5 — échappement HTML des pages parent et publiques, avant le 01/12/2026** — non traité : `suivi-parent.html` et les pages publiques `stages-vacances.html` / `brevet-blanc.html` (`resultats.html` traité : `esc()` appliqué au tableau des niveaux et à l'onglet Historique). Même motif que le lot 1 (PR #93, qui n'a traité que `prof.html`) : valeurs issues de la base insérées dans `innerHTML` sans échappement.

42. **Contenu de la banque de questions non échappé dans `prof.html`** (énoncés, options, tableaux, figures SVG) — hors périmètre du lot 1 (PR #93). Une sonde SQL est à lancer avant toute décision, pour mesurer ce que la base contient réellement (balises, guillemets, SVG légitimes) : échapper un contenu volontairement riche (tableaux, SVG) casserait l'affichage.

44. **`stages-vacances.html` : les stages passés restent affichés** — constaté le 04/10/2026. La page affiche toujours les sessions dont la date de début est passée, marquées « Terminé » (filigrane) et non cliquables (`s.termine`, `stages-vacances.html:165-172`) : aucun filtre ne les retire de la liste.

46. **`api/email.js` : la branche d'erreur de `brevet-blanc` renvoie au client le corps de l'erreur Resend** — constaté le 04/10/2026 (PR #97). Réponse 500 du type `'Erreur envoi email : ' + JSON.stringify(responseData)`. Fuite d'information mineure.

47. **Suppression de compte non prévue proprement** — constat SQL du 04/10/2026, complète le n°19 (chantier RGPD non cadré). `examens_blancs` et `questions_vues` n'ont aucune clé étrangère vers `auth.users` : supprimer un compte laisse des lignes orphelines. `resultats` et `rappels_envoyes` ont une clé étrangère sans cascade (`ON DELETE NO ACTION`) : elle bloque la suppression d'un compte qui a des lignes. `profils` et `examens_progression` sont en cascade. Le relevé du 21/10/2026 confirme le même état et précise que `historique_bilans` n'a, lui non plus, aucune clé étrangère (lignes orphelines après suppression, comme `examens_blancs` et `questions_vues`). À traiter avant toute demande de suppression RGPD réelle.
    - [ ] **Avant toute correction** : compter les lignes déjà orphelines (`examens_blancs`, `questions_vues`, `historique_bilans` dont le `user_id` n'existe plus dans `auth.users`) pour mesurer ce qui est à nettoyer. Les choix de mécanisme restent ceux du n°19 (CASCADE ou suppression orchestrée, périmètre, traçabilité) : ne pas modifier les clés étrangères avant.

48. **Domaine canonique : `academika.fr` redirige vers `www.academika.fr`** — constaté en production le 04/10/2026. Les liens de désabonnement des emails, écrits en apex (`https://academika.fr/desabonner.html?...`), passent donc par cette redirection. À harmoniser à l'occasion.

50. **`inscription` : `prenom` et `nom` envoyés au prof non vérifiés contre un enfant réel du parent** — constaté le 04/10/2026 (PR #97). Le texte est borné, échappé et limité (10 envois par heure et par compte), mais un parent légitime peut faire envoyer à `contact@academika.fr` un nom qui ne correspond à aucun de ses enfants. Faible priorité.

51. **Dette : `purgerSessionLocale()` existe en 3 copies (`examen.html`, `connexion.html`, `quiz.html`) et `estRefusAuthentification()` en 2 copies (`connexion.html`, `quiz.html`)** — factoriser dans un helper client partagé.

52. **Commentaires de code renvoyant à des entrées TODO supprimées** (`db/policies.sql:98`, `:334-335`, `:538`) — remplacer par le numéro de PR correspondant.

53. **Fonctions Vercel : 12 sur 12, plus aucune marge** (`api/connexion-eleve.js` est la 12ᵉ) — consolider (fusionner des endpoints) avant toute nouvelle fonction.

54. **`index.js` (racine) : code mort** d'une ancienne version (page Next.js qui importe `../lib/supabase`, absent) — supprimer, après avoir vérifié que Vercel ne le sert pas publiquement.

55. **CAPTCHA Supabase Auth à étudier** — attention : il s'applique à toutes les connexions et inscriptions, pas seulement à celle des élèves.

56. **Réglages Supabase « Secure password change » et « Require current password » désactivés** — à étudier.

57. **`verifier_disponibilite` reste appelable par tout compte connecté** (donc par quiconque crée un compte parent, cf. `shouldCreateUser`) : permet de savoir si un couple (prénom, nom) existe — à traiter avec le n°1. Retrait du droit d'exécution : cf. n°86.

58. **Compteurs de connexion (`login_tentatives`) : prévoir une purge des lignes expirées** (une ligne par prénom+nom ou IP ayant échoué, y compris des noms inventés).

59. **Connexion élève : une IP partagée (établissement scolaire) peut être bloquée pour tous après 20 échecs en 15 min** — à surveiller avec du trafic réel.

61. **Connexion élève : uniformité de durée au démarrage à froid** — la réponse de `api/connexion-eleve.js` attend 1 s au minimum, mais un démarrage à froid de la fonction peut allonger la durée d'une réponse et la distinguer des autres ; à mesurer.

62. **Réglage Supabase « leaked passwords » (mots de passe compromis)** — disponible avec l'offre Pro ; à étudier.

63. **Formulaire d'ajout d'un enfant : le message d'erreur de paiement (offre Suivi, ~l.1315) sera suivi d'un rechargement de la page 2,5 s plus tard** ; à revérifier avant le 01/12/2026, quand l'offre Suivi redeviendra payante.

64. **Délivrabilité des emails d'Academika (constaté le 05/10/2026)** : un email du formulaire de contact (noreply@academika.fr, envoyé par Resend vers contact@academika.fr) est tombé en spam. contact@academika.fr est hébergé chez Hostinger et redirigé vers un Gmail lu uniquement sur mobile. À faire : (1) côté CM, depuis le mobile : ajouter noreply@academika.fr aux contacts du compte Google et marquer l'email en « non-spam » ; filtre Gmail « ne jamais envoyer dans le spam » possible via le navigateur en mode ordinateur ; (2) vérifier dans Resend (Domains, academika.fr) que le domaine est « Verified » avec SPF et DKIM ; (3) vérifier DMARC et la cohabitation des SPF de Hostinger et de Resend (un seul enregistrement SPF par domaine) ; (4) à l'occasion, lire SPF/DKIM/DMARC dans « Afficher l'original » d'un email reçu. Les emails envoyés aux parents arrivent directement de Resend : seule l'authentification du domaine les protège.

66. **`api/stripe-webhook.js:249` construit encore `https://${req.headers.host}/api/email`** (email `resiliation-confirmee`) — même motif que le correctif de `api/cron-rappel.js` du 07/10/2026, laissé volontairement hors périmètre. Le webhook Stripe frappe sans doute le domaine de production (pas l'URL `*.vercel.app`), donc probablement non bloqué, mais l'hypothèse n'est pas vérifiée. À traiter avec le n°36 (test de bout en bout de la résiliation) : si l'email de confirmation échoue, passer par le domaine de production.

67. **`scripts/demo-lucas.sql` n'écrit pas la colonne `abandonne`** : l'INSERT du bloc 2 ne la renseigne pas, les 2 abandons de Lucas Démo ne sont reconnaissables qu'à `questions_ratees = ["Quiz abandonné"]`. Si le script est rejoué, ces 2 lignes repartent à `abandonne = false` et sont comptées comme essais par `niveaux_sous_theme` et `suivi-parent.html` (Thalès passerait de 5 à 6 essais, donc `a_surveiller`). À faire : ajouter `abandonne` à l'INSERT (`true` sur les 2 abandons) et à la vérification du bloc 3.

68. **Policies SELECT élève et prof de `resultats` : rôle `{public}` à restreindre à `{authenticated}`, et non relevées dans `db/policies.sql`** (seule « Parent voit resultats de son enfant » y figure). À faire : dumper `pg_policies` pour `resultats`, versionner les policies réelles dans `db/policies.sql`, puis restreindre les deux au rôle `authenticated` (cf. point 14).

69. **Migration de la liste des sous-thèmes vers `js/catalogue.js`** — `resultats.html` (PR #111), `suivi-parent.html` (depuis le 11/10/2026) et `prof.html` (18/10/2026) la chargent. Seul `quiz.html` garde sa copie de `SOUS_THEMES` ; `api/generer.js` garde sa propre liste côté serveur. À faire : supprimer la copie locale de `quiz.html` et charger `/js/catalogue.js?v=N`. À rapprocher du n°9 de la section « Banque de questions » (arbitrage écart assumé / dette sur le `SOUS_THEMES` codé en dur).

71. **Chantier « Mes erreurs à revoir »** — décidé par CM le 11/10/2026, **à concevoir avant toute ligne de code** (remplace l'ancien point « `questions_ratees` : correction de fond »). Aujourd'hui `questions_ratees` ne stocke qu'un texte tronqué (sauf, depuis le 18/10/2026, la colonne `questions_ratees_detail` : id et énoncé complet des questions de la banque, cf. `CLAUDE.md`) (« thème — chapitre » côté IA, « thème — 40 premiers caractères » côté banque, cf. la boucle de calcul du score de `api/quiz-resultat.js`) ; `libelleRatee()` (`resultats.html`) nettoie l'affichage en attendant.
    - **Objectif élève** : onglet « Mes erreurs » dans `resultats.html` (erreurs regroupées par sous-thème, énoncé complet + bonne réponse + explication) et bouton « Refaire mes erreurs » (quiz de révision, 5 questions maximum ; une question réussie sort de la liste).
    - **Trois briques, dans cet ordre (reste (2) et (3))** : (1) collecte des identifiants des questions ratées / « aucune idée » — **faite le 18/10/2026** autrement que prévu : colonne `resultats.questions_ratees_detail` (jsonb, banque seulement, énoncé complet inclus) au lieu d'une table dédiée ; reste à décider si une table dédiée devient nécessaire pour le mode révision ; (2) affichage via une vue protégée limitée aux erreurs de l'élève (`questions_banque` n'est pas lisible par l'élève) ; (3) mode révision dans `api/generer.js` et `quiz.html`, sans nouvelle fonction Vercel (12 sur 12 : aucune marge).
    - **Ne dépend PAS de la suppression du chemin IA** : identifiants pour les questions de la banque, texte conservé pour les questions IA.
    - **Un quiz de révision ne compte pas pour le déblocage** : exclu de `niveaux_sous_theme`, du récap email et des statistiques parent.
    - **Décisions ouvertes** : une erreur est « corrigée » après 1 ou 2 bonnes réponses ? une bonne réponse en quiz normal la retire-t-elle de la liste ? le parent voit-il les erreurs ? (les anciennes sessions n'y figureront pas, faute d'identifiants.)
    - **Impacts à inventorier à la conception** : `api/quiz-resultat.js`, colonne `questions_ratees` de `resultats`, récap email (`api/email.js`, `topRatees`), `api/cron-rappel.js`, `prof.html` et `suivi-parent.html` s'ils lisent `questions_ratees`.
    - **Lien avec le n°27 (intégrité du score)** : même moment (`api/quiz-resultat.js`, identifiants de questions côté serveur) ; une vérité serveur par `id` n'existe que pour `source_questions==='banque'`. À concevoir ensemble.

72. **`scripts/demo-lucas.sql` désynchronisé de la base** — les dates de Lucas Démo ont été décalées de +5 jours en production (dernière session le 08/09/2026 en base, 03/09/2026 dans le script). Si le script est rejoué, les dates reviennent en arrière. À traiter avec le n°67 (même script, même rejeu).

73. **`suivi-parent.html`, Régularité — message de fenêtre vide trompeur** : « Aucun quiz effectué pour l'instant. Dès que <prénom> aura terminé sa première session… » s'affiche aussi pour un élève qui a déjà joué mais rien sur la fenêtre 7/14/21 jours (`chargerDonnees()`). À remplacer dans ce cas par « Aucun quiz sur les N derniers jours. » (N = 7, 14 ou 21) ; le message actuel reste pour un élève qui n'a jamais joué.

74. **Récap journalier — suite du chantier du 08-12/10/2026** (ordre à respecter)
    - **b. Bouton « Envoyer un récap de test »** dans `prof.html`, utilisable sur mobile : élève et date au choix, envoi TOUJOURS vers l'adresse du prof (jamais au parent), ne modifie jamais `alerte_envoyee`, contrôle prof côté serveur.
    - **c. Canal unique** : retirer l'envoi du récap au clic (`logout()` / `terminer()` dans `quiz.html`), puis réserver le récap de `/api/email` au cron (`CRON_SECRET`). Préalables : bouton b en place + 3 soirs sans alerte Healthchecks. Motifs : double email cumulatif constaté (09/10/2026 et 12/10/2026 sur le compte de test) ; un élève peut aujourd'hui déclencher un email vers ses parents ; décision « cron seul déclencheur » déjà prise le 16/08/2026. Reprend l'ancien point « chevauchement du contenu du récap si plusieurs sessions le même jour ». Règle aussi la cause principale du n°6 (sortie de page lente) : sans l'envoi du récap au clic, `terminer()` / `logout()` n'attendent plus que `signOut` ; voir le n°6.
    - **d. `Reply-To: contact@academika.fr`** sur les envois Resend (~17 appels, 4 fichiers : `api/email.js`, `api/cron-rappel.js`, `api/inscription-brevet.js`, `api/inscription-stage.js`), à faire avec c. Contexte : `noreply@academika.fr` n'existait pas chez Hostinger (réponses des parents rejetées « 550 User doesn't exist ») ; corrigé le 12/10/2026 par un alias Hostinger noreply@ → contact@, testé OK. Le `Reply-To` reste la solution propre.

75. **Abandons de quiz : deux défauts d'intégrité (constat du 10/10/2026)**
    - `quiz.html` (~l.477, `sauvegarderAbandonne`) : `saved = true` est posé même si le POST échoue (401/500) ; conséquence possible : le vrai résultat n'est jamais enregistré, seule une ligne 0/5 reste, et l'UI affiche « ok ».
    - `temps_secondes` d'un abandon (compteur `setInterval`) sous-estime le temps réel après un passage en arrière-plan (surtout iOS) ; il sert au calcul du début de la ligne « Activité » du récap.
    - À tester sur un vrai téléphone (iOS Safari, Chrome Android) : `pagehide` et `persisted` lors d'un changement d'app, mise en veille, retour.

76. **Contrôles à faire** (supprimer ce point une fois les deux contrôles faits)
    - Libellé « hier » : faire une session après le passage du cron sans se déconnecter, puis vérifier le récap du lendemain.
    - 25/10/2026 vers 23 h (passage à l'heure d'hiver) : la check Healthchecks doit être verte, ping entre 22 h et 23 h Paris.

77. **`suivi-parent.html`, `estAbandon()` (déf. ~l.846, utilisée ~l.629) détecte les abandons par le texte « Quiz abandonné » dans `questions_ratees`** au lieu de la colonne `resultats.abandonne` (incohérence avec le récap, la vue `niveaux_sous_theme` et `resultats.html`). PR séparée.

78. **`prof.html` charge `resultats` par `select('*')` sans pagination** (`init()`). Si le plafond de lignes de l'API Supabase s'applique (1000 par défaut, réglage du projet à vérifier), les chiffres affichés au prof (sessions terminées, interrompues, durée, dernière activité, questions ratées, bilan manuel) seraient tronqués sans signal. À faire : vérifier le réglage « Max rows » du projet ; paginer ou agréger côté base si le plafond s'applique.

79. **`prof.html` : plusieurs affichages restent sur l'ancienne logique en %, en contradiction avec la fiche élève alignée sur la vue `niveaux_sous_theme`** (constat du 18/10/2026) : le tableau comparatif du dashboard (global et % par thème, légende « ≥70 % Maîtrisé / 50-69 % En cours / <50 % À retravailler »), le bandeau « Moyenne générale » et la colonne « Moyenne » de l'onglet Thèmes ; s'y ajoutent les verdicts par % sur les examens en ligne — `mentionBadge(p)` (colonne mention du tableau Examens) et `mentionLabel(p)` (colonne « Examen en ligne » du tableau comparatif), échelle Excellent / Très bon / Bon / Correct / À retravailler — et, côté élève, `getStatut(pct)` de `resultats.html` (« Maîtrisé / En cours / À retravailler », vérifié : appelée l.371 sur l'historique des quiz, pas des examens ; elle ne colore que le score de chaque session). Les verdicts de `examen.html` (historique et écran de fin) ont été retirés. À arbitrer : les aligner sur la vue (acquis, en progression, à surveiller), les retirer, ou les garder comme indicateurs bruts assumés.

80. **`prof.html`, onglet Sessions (« 30 dernières activités ») : débordement horizontal de la page à 390 px** — constaté le 18/10/2026 en testant la largeur du conteneur : la page atteint 447 px pour 390 px de fenêtre, déjà avant le passage du conteneur à 1440 px. Le tableau `.tbl` n'a pas de conteneur à défilement (l'onglet Examens et la liste des élèves en ont un). À faire : l'entourer de `<div style="overflow-x:auto">`, comme les autres tableaux.

81. **`instagram.html` : mot de passe « academika2026 » vérifié côté navigateur** (`prompt`, l.144-145), lisible dans le code source — constaté le 18/10/2026. Vérifié le même jour : la page n'appelle aucune API (aucun `fetch`, aucune clé, aucun appel Supabase) et n'écrit rien ; elle dessine des visuels (canvas) à partir de 15 questions écrites en dur dans la page, déjà lisibles dans le source quel que soit le mot de passe. Risque faible. À décider : retirer le mot de passe (il ne protège rien), le garder comme simple filtre, ou protéger la page côté serveur. À corriger aussi : les commentaires d'en-tête de `api/generer-brevet.js` (l.4) et de `scripts/generer-questions.js` (l.3) citent ce même mot de passe alors que le code compare à `CRON_SECRET` (`generer-brevet.js` l.15, `generer-questions.js` l.13) — commentaires trompeurs.

82. **`api/generer.js` bascule silencieusement sur le chemin IA quand la banque est en panne** (erreur Supabase ou exception : `getBanqueSupabase`, l.290, 299, 382-384) — constaté le 18/10/2026. À la suppression du chemin IA (n°27), décider du comportement en cas de panne de la banque : message à l'élève, alerte au prof, ou les deux.

83. **Baseline Supabase rejouable : le schéma `public` n'existe que dans le dashboard** — relevé Supabase du 21/10/2026, aucun risque immédiat. Le dépôt ne contient que `db/*.sql` (correctifs ponctuels exécutés à la main), aucune migration : impossible de recréer la base à l'identique (environnement de test, reprise après incident). À faire : créer `supabase/migrations/` avec une baseline identique à la production (tables, vues, fonctions, policies, `GRANT` et `REVOKE` explicites), testée par `supabase db reset` en PostgreSQL 17 et comparée à la production. **Bloqué** : demande un poste avec Supabase CLI et Docker (impossible depuis une session cloud). À rapprocher du n°52 (références à `db/policies.sql`).

84. **Connexion élève : homonymes** — relevé Supabase du 21/10/2026, aucun n'est connu à ce jour. Aucune unicité sur `profils (prenom, nom)` ; `verifier_login` (désormais fermée, sans appelant) faisait un `limit 1` sans ordre : deux homonymes se voyaient renvoyer un compte au hasard. Depuis `api/connexion-eleve.js`, un doublon donne le 401 uniforme (comme « élève inconnu » et « mot de passe faux ») : un homonyme serait bloqué sans explication plutôt que mal connecté (à revérifier dans le code avant toute décision). À faire : d'abord chercher les homonymes existants en base (`profils` groupé par `lower(trim(prenom))`, `lower(trim(nom))`), puis décider (contrainte d'unicité, identifiant supplémentaire, ou refus à la création d'un enfant dans `suivi-parent.html`). Aucune contrainte avant ce contrôle. À rapprocher du n°57 (`verifier_disponibilite`).

85. **Anti-brute-force de la connexion élève : fail-open silencieux** — relevé Supabase du 21/10/2026. Les fonctions `login_*` ne sont pas `SECURITY DEFINER` et dépendent des droits de `service_role` sur `login_tentatives` ; si ces droits manquent ou sont retirés, `api/connexion-eleve.js` désactive la protection sans erreur visible (fail-open voulu pour ne pas bloquer un élève, mais sans signal). À faire : passer en échec fermé, ou conserver le fail-open et ajouter une alerte (log d'erreur surveillé, ping Healthchecks, ou test de santé des droits). Arbitrage à faire : un élève bloqué à tort contre une protection éteinte sans que personne le voie. À rapprocher des n°58 (purge de `login_tentatives`), n°59 et n°61.

86. **Resserrement des droits SQL (défense en profondeur)** — relevé Supabase du 21/10/2026, aucune faille exploitable connue : la RLS protège les lignes. À traiter table par table, jamais en un lot (règle de CLAUDE.md), chaque changement précédé de la lecture du code qui appelle la table :
    - `anon` et `authenticated` ont tous les droits SQL (`TRUNCATE` compris) sur la plupart des tables, protégées par la RLS seule (`TRUNCATE` ignore la RLS). Cible : droits minimaux par rôle d'après ce que fait réellement le navigateur.
    - `examen_questions`, `examens_progression`, `rappels_envoyes`, `email_rate_limit` n'ont aucun `REVOKE` (cf. n°15).
    - `verifier_disponibilite` exécutable par `authenticated` : oracle « cet élève existe » (cf. n°57).
    - Sept fonctions `SECURITY DEFINER` ont `search_path = public` : `a_un_profil`, `email_parent_valide`, `est_parent_de`, `inscription_stage_valide`, `verifier_disponibilite`, `verifier_email_parent`, `verifier_login` (`is_prof()` et `definir_offre_eleve` ont déjà un `search_path` vide, non concernées). Cible : `search_path` vide, schémas qualifiés dans le corps.
    - La policy INSERT de `profils` n'exige pas `user_id = auth.uid()` ; sans effet aujourd'hui (la contrainte `UNIQUE(user_id)` bloque la greffe), hygiène seulement.

87. **Mineurs, faible priorité (relevé Supabase du 21/10/2026)** :
    - `verifier_email_parent` compare l'email sans `lower(trim())` (cf. aussi la normalisation en tête de ce fichier).
    - `verifier_login` et `verifier_email_parent` sont fermées à `anon` et `authenticated` (seul `service_role` peut encore les exécuter) et sans appelant : fonctions mortes, à supprimer (ce qui règle aussi leur `search_path` et le défaut de `lower(trim())` ci-dessus).
    - `inscription_stage_valide` n'est pas atomique : deux inscriptions simultanées peuvent dépasser le nombre de places.
    - Pas d'index sur `resultats.user_id`, `examens_blancs.user_id`, `profils.email_parent` : à poser quand le volume le justifie.
    - 7 tables de sauvegarde `questions_banque_backup_*` / `backup_explications_*` à purger en fin de refonte de la banque (les deux tables `backup_explications_*_20261013` sont déjà suivies dans la section « Banque de questions »).

88. **`examen.html` : en-tête (`.nav-left`) non aligné** — 18 px, graisse 600, sans police serif, alors que `quiz.html`, `resultats.html`, `espace-parent.html` et `suivi-parent.html` utilisent Newsreader 22 px / 500, couleur marine, sans `letter-spacing`. À harmoniser (logo « ∑ ACADEMIKA »).

89. **`resultats.html` (tableau de bord élève) : cases de niveau à l'ancien format** — `celluleNiveau()` affiche encore « N réussite(s) sur 5 » et « 🔒 Verrouillé » (légende comprise), alors que `Niveaux.cellule` (`js/niveaux.js`) donne « N / 5 réussites », « en M essais » et « Après le Facile / Moyen ». À faire : aligner `resultats.html` sur `Niveaux.cellule` pour que l'élève et le parent voient les mêmes textes (le bloc « Dernier sous-thème travaillé » et sa phrase « N réussites sur 5 » sont à vérifier dans la foulée). `resultats.html` garde sa propre copie `niv-*`, hors du mécanisme `js/niveaux.js` (cf. `CLAUDE.md`, « Règle de déblocage des niveaux ») : choisir entre charger `js/niveaux.js` + `css/niveaux.css` et recopier les textes. Hors périmètre de la PR #138.
90. **`lib/quiz-enonce.manual-test.js` (2 échecs sur 47) et `lib/quiz-graphique.manual-test.js` (3 échecs sur 50) échouent déjà sur `main`** — constaté le 22/10/2026 en préparant le bouton « PDF du bilan » (mêmes comptes sur `main` et sur la branche, donc sans rapport avec ce travail). À diagnostiquer : test devenu obsolète ou régression du code testé ; les autres suites `lib/*.manual-test.js` passent.

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
9. Question produit : laisser le parent choisir par type d'email (récapitulatif quotidien, bilans) au lieu d'un désabonnement tout ou rien.

---

## 🔵 La Hulotte

1. PPWR Aluplast — attestation en cours, écart PFAS à combler
2. PMS gap analysis — écarts critiques identifiés, pas de suite actée
3. Écart consommation Crème UHT (1%→21% T1 2026) — signalé, pas de suite actée

---

## ⚪ Projet conseil IA/data (agri-food)

1. Phase 0 — accumuler 3-5 problèmes business chiffrables avant offre. Bascule test IoT décidée, résultat jamais confirmé
