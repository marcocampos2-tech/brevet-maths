# TODO consolidé — 02/09/2026

*Document de référence reconstitué à partir de la mémoire du chantier et de plusieurs passes de recherche dans l'historique des conversations. Pas de garantie d'exhaustivité à 100% (limite structurelle d'une recherche par mots-clés) — à compléter vous-même si un sujet manque encore.*

---

## 🚨 BUG BLOQUANT — les parents ne voient pas les résultats de leur enfant (découvert 03/09/2026)

La table `resultats` n'a que deux policies RLS en SELECT : « Les élèves voient leurs résultats » (`auth.uid() = user_id`) et « Prof voit tout resultats » (`is_prof()`). Le cas parent est absent, alors qu'il existe sur `profils`. Trois points d'appel cassés dans `suivi-parent.html` : `chargerDonnees()` l.360 (graphe du dashboard), `getRangeEtGranularite()` l.527 et `genererPDF()` l.607 (les trois boutons d'export PDF). Aucune erreur remontée : la RLS filtre silencieusement et la page affiche « Aucun quiz effectué ». **C'est le produit facturé 7,90€/mois qui ne fonctionne pas.**

- **Cause** : oubli lors du chantier RLS, pas une régression — la chronologie par OID le confirme (« Lecture profils » 19041 et « Prof voit tout resultats » 19136 posées dans la même session ; le cas parent a été traité sur `profils` et oublié sur `resultats`)
- **Jamais détecté parce que** le seul compte parent testé (`marcocampos2@gmail.com`) porte aussi le rôle prof, et `is_prof()` masquait l'absence de policy parent. Révélé par le compte démo créé le même jour pour les captures d'écran
- **Correctif validé, SQL sorti dans `db/policies.sql` (05/09/2026), pas encore exécuté sur Supabase** : fonction `est_parent_de(uuid)` en `SECURITY DEFINER` lisant `auth.users` (et non le claim JWT), policy SELECT dédiée sur `resultats` et sur `examens_blancs`, plus rejeu de `Lecture profils`/`Insertion profils`/`Parent modifie source de son enfant` sur `profils` avec la même normalisation d'email (`lower(trim(...))`) et le même contrôle `email_confirmed_at`. Reste : revérifier au besoin `email_confirmed_at` dans `auth.users`, puis exécuter et suivre le plan de test
- **Point tranché** : la clause `email_confirmed_at is not null` est **gardée** — la clé anon étant publique, n'importe qui peut s'inscrire sur l'email d'un parent sans le posséder. Vérifié le 05/09/2026 : les 4 parents en base ont un email confirmé (l'OTP de connexion vaut confirmation), donc aucun n'est rendu aveugle par cette clause
- **Vérifié en même temps** : `api/quiz-resultat.js` écrit dans `resultats` exclusivement via `SUPABASE_SERVICE_KEY` (clé service, contourne la RLS) — confirme qu'aucune policy INSERT/UPDATE n'est nécessaire sur cette table, documenté dans `db/policies.sql`

## 🚨 PRÉVENTION — la RLS n'est pas versionnée (cause racine)

Aucune migration versionnée (`supabase_migrations.schema_migrations` n'existe pas), aucun DDL RLS dans les 79 commits, pilotage 100 % dashboard. Un pan entier de la logique de sécurité est invisible en revue de code. Décision prise : mettre en place `db/policies.sql` (idempotent) ET `db/policies.test.sql` (les blocs `set local role authenticated` avec le test sans clause `where`). Le fichier seul n'aurait rien attrapé — il aurait fidèlement reproduit l'absence de la policy. **`db/policies.sql` créé le 05/09/2026** avec le lot B complet ; `db/policies.test.sql` reste à faire.

## ⏸️ REFONTE `suivi-parent.html` — en pause jusqu'au correctif RLS

Indicateur central : le **niveau atteint** par sous-thème remplace le score (un score qui baisse peut signifier que l'élève est monté de niveau — colorer le score peut afficher l'inverse de la réalité). Affichage : niveau atteint + progression X/5 vers le prochain déblocage ; quatre états (`decouverte` < 3 sessions, `en_cours`, `en_difficulte` ≥ 6 sessions sans déblocage, `maitrise` = 5 réussites au niveau difficile) ; tri par priorité d'action avec repli ; dénominateur par `COUNT` dynamique sur les sous-thèmes actifs, jamais en dur. Règle de déblocage inchangée (5 sessions à ≥70%). Le module de calcul est partagé (`lib/progression.js` en UMD), avec refactor de `quiz.html` pour supprimer la duplication — vérifier que Vercel sert `/lib/*.js` AVANT de toucher `quiz.html`. L'email de bilan (`api/cron-rappel.js`) s'aligne dans le même chantier : son `sous_themes_snapshot` mesure la difficulté tentée sur la fenêtre, pas le niveau débloqué, ce qui produit des régressions fantômes.

## 📸 Captures d'écran pour le site — bloquées par le bug RLS

Le compte démo est prêt mais la page n'affiche rien tant que la policy manque. Une fois corrigé : capture « avant » (le graphe à 66 % montre un élève ayant débloqué deux niveaux comme une suite de journées dorées — c'est la démonstration visuelle du problème), puis capture « après ». Cibles : `suivi-parent.html`, les barres de déblocage de `quiz.html`, l'email de bilan.

⚠️ **Les dates du jeu de démo sont ancrées au 03/09/2026.** La fenêtre 14 jours se dégrade chaque jour qui passe (jours actifs qui baissent, traînée de jours vides). Pour des captures ultérieures, décaler les dates.

## 🖼️ Images sur `index.html` — sujet initial, jamais traité

Maquette validée mais non implémentée : icônes dans les 3 étapes de « Comment ça marche », icônes dans les 3 cartes d'offres, photo réelle à la place de l'avatar initiales « MC » du bloc Méthode. Aucune ne modifie la structure. Écarté pour l'instant : une illustration dans le hero, qui passerait le bloc en 2 colonnes.

---

## ⚠️ Échéance critique — Bascule décembre 2026

*Corrigé le 02/09 après lecture de CLAUDE.md : le code est déjà fait (confirmation, pas hypothèse).*

- L'offre **Libre** reste gratuite **à vie** ; seul le **Suivi** (7,90€/mois) devient payant à l'échéance. Trois éléments masqués pendant la période gratuite via `enPeriodeGratuite()` (`lib/gating.js`, constante `FIN_OFFRE_LANCEMENT`) : bandeau "Suivi de la progression", sélecteur d'offre à la création de compte (forcé sur Autonomie), détail complet du récap journalier. **Terminé et déployé** (16/08).
- **Le vrai point ouvert, formulé par CLAUDE.md lui-même** : ces trois éléments se réactivent automatiquement le 01/12/2026, sans déploiement — il faut vérifier à cette date que Stripe est réellement opérationnel (SIRET obtenu, mode live actif) avant qu'ils ne réapparaissent. Un rappel agenda existe déjà mi-novembre pour cette session de bascule.
- Formulation marketing validée le 13/08 ("Gratuit jusqu'en décembre 2026, sans carte bancaire...") — à vérifier qu'elle est bien reprise partout (site, emails), pas seulement sur le flyer.

---

## 🔴 Banque de questions — chantier en cours

1. **Angles** — périmètre validé le 02/09, calibrage facile/moyen/difficile encore à faire
2. **9 sous-thèmes restants du tour des 20** : Algorithmique, Pythagore, Trigonométrie, Transformations, Triangles semblables, Représentation de l'espace, Agrandissement, Aires et volumes (Proportionnalité est rédigeable)
3. **Transformations/difficile** — 2 questions actives seulement (sous le seuil minimum de 5), sans garde-fou serveur
4. **Représentation de l'espace** — 0 question, format QCM pas confirmé (risque contenu dessin/figure)
5. **6 sous-thèmes de prérequis validés, aucun construit** : Proportionnalité, Fractions, Nombres relatifs, Opérations, Opérations combinées, Angles — position 1 des points ouverts, après le tour des 20
6. **Équations** — 3 questions manquantes à identifier par niveau avant clôture du lot
7. **Bloc C dette sur Statistiques** — non-répétition inter-niveaux non vérifiée (bascule partielle V2)
8. **Mention "figure pas en vraie grandeur"** — rétroactivité sur les sous-thèmes basculés avant le 27/08 : décision restée ouverte
9. **Dénominateur de sous-thèmes possiblement codé en dur** (ex. "2/21 sous-thèmes travaillés") — à localiser par grep, généraliser en COUNT dynamique
10. **`api/generer.js`** — "Triangles semblables" absent de `chapitres['Espace et géométrie']`, sans impact actuel, à corriger en fin de chantier
11. **Refonte de `examen_questions` (chantier 2) — jamais entamée, symétrique à celle de `questions_banque`.** 180 questions, jamais auditées, aucune application de la grille Bloc A/B/C, aucune colonne `statut`. `scoresExamen()` reste volontairement sur l'ancienne nomenclature à 4 clés en attendant cet audit (5 clés distinctes visées, sans `||` de repli). Pas de trafic élève réel dessus actuellement, ce qui laisse de la marge, mais le chantier n'a pas de date ni de position dans la file d'attente — contrairement à `questions_banque`. Confirmé par CLAUDE.md : **pas de dédoublonnage par énoncé** sur cette table (contrairement à `questions_banque`) — deux lignes au même texte sous des ids différents ne sont pas protégées entre elles par le mécanisme anti-répétition
12. **Stratification par difficulté inopérante dans `api/examen.js`** — le découpage en tiers (facile/moyen/difficile) a lieu *après* un `sort(() => Math.random()-0.5)`, donc ne trie rien réellement ; tirage aléatoire pur en pratique. Corriger imposerait de revoir le seuil de reboucle à 6 (actuellement calé dessus)
13. **Shuffle biaisé** (`sort(() => Math.random()-0.5)`) — motif présent dans tout le dépôt, documenté mais jamais corrigé

---

## 🟠 Plateforme Academika — technique

1. **Cybersécurité, avant activation Stripe live** — confirmé par CLAUDE.md comme chantier différé « intégrité des comptes », toujours ouvert (⚠️ contredit un diff vu le 14/08 dans l'historique de conversation, qui semblait montrer un correctif conçu — à vérifier lequel des deux est à jour) :
   - **`profils` INSERT** : la policy ne contrôle pas `email_parent`, un utilisateur peut s'attribuer n'importe quel email parent à l'insertion
   - **`shouldCreateUser: true`** (`espace-parent.html`) : permet à n'importe qui de créer un compte Auth sur une adresse email arbitraire — c'est le vecteur d'entrée qui rend exploitable la faille `profils` ci-dessus
   - **Idempotency Stripe (C1/C2)** : clé checkout actuelle (`Date.now()`) ne protège de rien ; pas de table de log DB pour le webhook
   - **C3, nouveau** : `invoice.payment_failed` jamais écouté — un échec de paiement (carte expirée) ne coupe l'accès qu'après l'abandon définitif des relances Stripe (`customer.subscription.deleted`), délai potentiellement long où l'accès reste actif sans paiement
   - Items mineurs : `alerte_envoyee` (table `resultats`) sans `NOT NULL` appliqué ; `jours_actifs` du bilan périodique calculé en UTC au lieu d'Europe/Paris (confirme et précise le point UTC ci-dessous)
2. **Abandon d'examen blanc non enregistré** — aucune trace en base ni pour le parent (contrairement au quiz) ; questions ouvertes : affichage à prévoir ? reprise de session nécessaire (80 min, refresh accidentel coûteux) ?
3. **Email récap parent** ne distingue pas abandon vs quiz terminé à 0% — colonne `abandonne` absente de `resultats`
4. **Double email à l'inscription au brevet blanc présentiel** — repéré dès le 08/06/2026, jamais vérifié comme résolu depuis (dernière mention 27/07)
5. **Erreurs SVG `NaN`** dans l'examen blanc (cosmétique, sans symptôme visible élève)
6. **Déconnexion lente** — piste : `logout()` attend la fin d'appels réseau avant de rediriger
7. **Chevauchement de contenu** dans l'email récap si plusieurs sessions le même jour (mineur, jugé acceptable à l'époque)
8. **Bug fuseau horaire (UTC)** — seule la table `resultats` a été corrigée ; pas de vérification généralisée sur les autres pages/calculs de dates
9. **Warning console** — meta tag `apple-mobile-web-app-capable` déprécié
10. **Cause racine du cron Vercel Hobby** qui ne se déclenche pas seul — non résolue (fix côté client la rend bénigne)
11. **⚠️ Incertitude trouvée** : une décision du 20/08 basculait le déclenchement du récap journalier sur GitHub Actions (Vercel cron désactivé) ; la mémoire du 24/08 parle encore du cron Vercel — mécanisme réel actuellement en place à vérifier directement dans le repo/Vercel
12. **Stages "Réserver une place"** — bouton mailto seulement, formulaire réel à construire (modèle : examen blanc présentiel)
13. **Distinction gratuit/abonnement** — gating email fait (`lib/gating.js`), mais gating dashboard/PDF/examen blanc encore à construire ; sans lui un compte gratuit peut voir du contenu payant
14. **Espace parent persistant (option B)** — en attente depuis le 24/07, sans date
15. **`is_prof()` sans `search_path` figé** — contrairement à `verifier_disponibilite` et `verifier_login`. Exposition faible (la fonction n'appelle que `auth.jwt()`, pas de nom de table à détourner), à aligner au passage du correctif RLS parent
16. **Presque toutes les policies ciblent le rôle `{public}` et non `{authenticated}`** — pas exploitable aujourd'hui (`auth.uid()` est nul pour un anonyme), mais fragile : une future policy à condition moins stricte deviendrait publique sans qu'on le veuille. Seule « Parent modifie source de son enfant » est correctement cadrée
17. **`historique_bilans`, `rappels_envoyes` et `email_rate_limit`** ont la RLS activée et ZERO policy (refus total, accessibles seulement en clé service) — sans impact aujourd'hui, mais `historique_bilans` aura besoin d'une policy parent le jour où on l'exposera au tableau de bord
18. **Le bandeau commercial de `suivi-parent.html` vend cinq bénéfices dont au moins un n'est pas implémenté** : « le résultat de chaque examen blanc en ligne » — la page ne lit jamais `examens_blancs`. Masqué jusqu'au 01/12/2026 par `enPeriodeGratuite()`, donc pas urgent, mais à traiter avant la bascule

---

## 🟡 Plateforme Academika — légal

1. **CGV** — finalisation : case à cocher Art. A1 (acceptation CGV, `espace-parent.html`) et Art. B4 (renonciation rétractation 14 jours, `suivi-parent.html`) — confirmées manquantes par CLAUDE.md. **Contenu à corriger** : Art. C1 dit "pas de présentiel" alors que stages/examens blancs présentiels existent ; Art. B2 mentionne une périodicité annuelle abandonnée ; placeholders de tarifs à retirer (grille verrouillée depuis le 22/07)
2. **⚠️ Conformité résiliation "3 clics" (Art. L215-1-1)** — contradiction trouvée : CLAUDE.md dit encore non fait (portail Stripe en espagnol, nom d'entreprise "XXXXX", pas d'email de confirmation sur support durable) ; l'historique de conversation du 12/08 disait ces trois points corrigés (PR #14). À vérifier directement lequel est exact avant de considérer ce point clos ou non
3. **Politique de confidentialité** — page inexistante, nécessaire indépendamment des cookies ; champ resté vide dans la configuration Stripe faute de page à lier
3. **Consultation juridique** (Point-Justice ou équivalent) — jamais initiée, bloque la finalisation des CGV et la distribution des flyers
4. **SIRET/SAP** — SIRET obtenu (24/08), dossier INPI activité secondaire déposé, en attente validation INSEE/URSSAF ; une fois débloqué : déclaration SAP sur NOVA, puis prix présentiel réel + mention crédit d'impôt sur le site
5. **Bandeau cookies** — pas nécessaire aujourd'hui (Supabase auth, Analytics, Stripe exemptés), mais deviendra obligatoire si Meta/Facebook Ads est activé (actuellement repoussé après lancement)
6. **RGPD** — rétention comptes élèves (suppression fin d'année scolaire, précédent Sésamath 18 mois) : politique définie, à vérifier si documentée dans les mentions légales/registre de traitement

---

## 🟢 Plateforme Academika — marketing / produit

1. **Distribution flyer A5** — bloquée en attente de consultation juridique
2. **SEO Phase 7bis** — pages statiques indexables par sous-thème, analysé mais pas implémenté
3. **`tarifs.html`** — reformuler le texte de l'offre parent pour cohérence avec `espace-parent.html`
5. **Design system unifié** (`style.css` marketing vs CSS inline `quiz.html`/`resultats.html`) — plan déjà validé (Claude Design pour le design system, puis handoff Claude Code), jamais exécuté ; plus pertinent maintenant que le compte Instagram est actif et peut montrer ces pages
6. **Réflexion produit non tranchée** : extension à un site dédié 4ème et/ou 2nde pour septembre 2026, mentionnée à deux reprises, jamais retranchée
7. **URL trackée dédiée pour le flyer** (`/flyer`, sur le modèle de `/insta`) — le bouton "Flyer / affiche" de l'encart origine capture une déclaration du parent, pas une mesure fiable : un parent ayant vu le flyer puis cherché sur Google répondra "Recherche internet" en toute bonne foi. Les deux mécanismes sont complémentaires (l'URL trackée ne capte pas un parent qui tape academika.fr directement plutôt que de scanner le QR code)

- [ ] **Captures d'écran de `suivi-parent.html` pour le site** — jeu de données de démo prêt (`scripts/demo-lucas.sql`) : compte « Lucas Démo » isolé, 40 sessions du 04/08 au 03/09/2026, élève moyen à 66% avec 2 sous-thèmes en Moyen débloqué. Reste à exécuter le SQL puis à prendre les captures (page parent, barres de déblocage de `quiz.html`, email de bilan)
- [ ] **Réserve sur le jeu de démo — l'état `maitrise` n'est pas couvert** : il vit au niveau Difficile, volontairement exclu du jeu de données (non crédible sur 1 mois d'historique, et incompatible avec un élève moyen sur le même compte). Les états `decouverte`, `en_cours`, `en_difficulte` et « Moyen atteint » le sont. À vérifier manuellement lors de la refonte de `suivi-parent.html`, ou à couvrir par un second élève de démo « cas avancé »
- [ ] **Ne jamais coller `scripts/demo-lucas.sql` en entier dans l'éditeur SQL** : les quatre blocs s'exécutent à la suite et le bloc 4 supprime ce que le bloc 2 vient de créer. Arrivé une fois le 03/09

---

## 🔵 La Hulotte

1. **PPWR Aluplast** — attestation en cours, écart déclaration PFAS à combler
2. **PMS gap analysis** — écarts critiques identifiés (Food Fraud/VACCP absent, rappel simulé non documenté, validations DLC organoleptiques seulement) — pas de suite actée
3. **Écart consommation Crème UHT** (1%→21% T1 2026) — signalé, pas de suite actée

---

## ⚪ Projet conseil IA/data (agri-food)

1. **Phase 0** — objectif reformulé : accumuler 3-5 problèmes business chiffrables (comme le cas mascarpone) avant de formuler une offre. Dernier point d'étape : bascule vers un test IoT décidée, résultat jamais confirmé
