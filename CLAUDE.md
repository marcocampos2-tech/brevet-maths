# CLAUDE.md — Academika

Contexte permanent pour Claude Code sur ce dépôt. Lu automatiquement à chaque session.

## Qui est l'utilisateur

Marco Campos (CM) — Responsable Qualité chez Maison La Hulotte (métier principal), fondateur solo d'Academika en parallèle. Ingénieur agroalimentaire, 10 ans de tutorat privé. Communique en français, direct et concis. Applique une méthodologie stricte : Analyse → Validation → Conception → Validation → Exécution. Jamais de code écrit sans validation explicite. Toujours présenter les options, risques et une recommandation avant d'exécuter quoi que ce soit — ne jamais sauter à l'implémentation.

## Le projet

Academika (academika.fr) — plateforme de préparation au Brevet des collèges (maths, niveau 3ème), en auto-entrepreneur. Stack : Vercel (serverless functions `/api`), Supabase (Postgres + Auth OTP + Storage), Stripe (abonnement Suivi), Resend (emails).

Fichiers clés déjà connus : `espace-parent.html`, `suivi-parent.html`, `prof.html`, `quiz.html`, `index.html`, `tarifs.html`, `examen.html`, `brevet-blanc.html`, `stages-vacances.html`, `connexion.html`, `desabonner.html`, `api/stripe-checkout.js`, `api/stripe-webhook.js`, `api/email.js`, `api/cron-rappel.js`, `api/desabonner.js`, `api/examen.js`, `api/generer.js`, `api/generer-brevet.js`, `api/inscription-brevet.js`, `api/inscription-stage.js`, `vercel.json`.

Fichiers non encore audités, à lire en priorité si pertinent : `resultats.html`, `quiz-resultat.js`.

## Décisions commerciales verrouillées (ne pas remettre en question)

* Grille tarifaire définitive (validée 22/07/2026) : Autonomie 0€ · Suivi 7,90€/mois · Cours visio 30€/h · Cours présentiel 40€/h · Stages vacances 200€/semaine
* Pas de gratuit croisé sur Suivi
* Cours présentiel individuel retiré de l'offre publique (conflit avec activité salariée)
* CM ne travaille jamais le samedi ; présentiel bassin Melun = dimanches uniquement

## CHANTIER — Audit sécurité & correction RLS

Un audit complet a été mené (8 fichiers, 13 tables, 1 fonction, 1 bucket Storage, 2 configurations) et a identifié 19 items de sécurité, dont plusieurs critiques et exploitables sans authentification. Correction menée par étapes indépendantes, chacune testée avant de passer à la suivante.

### Terminé et validé

**Étape 1 — `app_metadata` + `prof.html`**

* Rôle `role: prof` posé sur `auth.users` (id `fe4403c8-7a22-49be-8fcd-3fca73326977`, email `marcocampos2@gmail.com`) via SQL direct (`raw_app_meta_data || '{"role":"prof"}'`)
* `prof.html` : contrôle d'accès dans `init()` réécrit pour vérifier `session.user.app_metadata?.role === 'prof'` au lieu de `user_metadata`/`profils` (modifiables par n'importe quel utilisateur)
* Testé : dashboard prof fonctionnel après reconnexion avec jeton frais

**Étape 2 — refonte de `is_prof()`**

* Ancienne version (FAILLE CRITIQUE) : vérifiait une ligne dans `profils` où `email_parent = 'marcocampos2@gmail.com'` — table où n'importe qui pouvait insérer une ligne sur son propre compte, donnant un accès équivalent admin à quiconque
* Nouvelle version, appliquée et testée :

```sql
create or replace function is_prof()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'prof',
    false
  );
$$;
```

* Testé positif (compte prof, dashboard intact) et négatif (compte tiers en navigation privée → `select * from inscriptions_brevet` renvoie `[]`)

**Nettoyage cosmétique**

* Bouton « 🎓 Prof » retiré de `quiz.html` (nav + condition JS + constante `PROF_EMAIL` + CSS) — n'était qu'un affichage conditionnel sans valeur de sécurité, mais dépendait du même schéma de donnée faillible que l'ancien `is_prof()`

**Étape 3 — les 6 policies à `qual = true`** (SQL exécuté directement par CM sur Supabase, hors Claude Code — confirmé terminé et testé)

1. `resultats` — `"Le prof voit tout"` (qual=true) remplacée par `is_prof()`. Policy élève (`auth.uid()=user_id`) conservée.
2. `inscriptions_stages` — lecture publique retirée, INSERT public conservé. Vérifié avant correction : `api/inscription-stage.js` ne fait aucun `select()` après l'`insert()` (confirmation client basée sur `{success:true}`, pas sur une lecture Supabase) — la lecture publique retirée ne casse donc rien.
3. `questions_banque` — lecture publique retirée. Point additionnel découvert et corrigé en amont (PR #1) : `api/generer.js` lisait cette table avec un fallback codé en dur sur la clé anon (`SUPABASE_KEY`) — basculé sur `SUPABASE_SERVICE_KEY` avant la correction RLS, pour ne pas casser le repli "banque" du générateur de questions.
4. `brevets_blancs` / `resultats_brevet_blanc` — n'apparaissaient dans aucun fichier du dépôt (recherche exhaustive sur tout l'historique Git, aucune occurrence). Vérifié directement en base : `brevets_blancs` contenait 2 lignes de test datées du 24/05/2026 (« Brevet blanc test 1 », « Brevet blanc 2 »), avec des `user_id` inexistants dans `profils` ; `resultats_brevet_blanc` était vide. Un prototype antérieur au système actuel (`sessions_examen_blanc`/`inscriptions_brevet`), jamais branché au produit. Les deux tables ont été supprimées (`DROP TABLE`) — n'existent plus.
5. `examens_blancs` — confirmé lu ET écrit directement côté client (clé anon) dans `examen.html` (INSERT à l'abandon et à la fin d'examen, SELECT pour l'historique). Policy prof (`is_prof()`) et policy élève (`auth.uid()=user_id`) toutes les deux nécessaires et conservées.

**Bucket Storage `figures`** — écriture (INSERT/UPDATE/DELETE) restreinte à `is_prof()`, lecture publique conservée (nécessaire à l'affichage des figures dans les quiz élèves). Terminé et testé.

**`api/email.js` — échappement HTML + rate-limit** (PR #2, mergée)

* Fonction `esc()` appliquée à tous les champs interpolés dans les templates HTML des 8 branches d'emails (`prenom`, `nom`, `date`, `heure`, `adresse`, `messageCompl`, `libelle`, `commentaire`, `emailParent`, `prenom_affiche`, noms de thèmes/sous-thèmes, entrées de `questions_ratees`/`topRatees`) — corrige l'injection HTML confirmée sur ces champs.
* `verifierRateLimit(destinataire)` : 10 emails/heure/destinataire, table `email_rate_limit` (`destinataire` text PK, `compteur` int, `fenetre_debut` timestamptz), fail-open si la vérification échoue techniquement. Appliqué avant l'envoi dans les 8 branches ; pour `inscription` (2 emails), seul l'email vers le parent est compté.
* Table `email_rate_limit` créée côté Supabase, comportement confirmé en production.

**`vercel.json` — headers de sécurité HTTP** (PR #3, mergée)

* `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` appliqués sur `/(.*)`.
* Pas de CSP (hors périmètre). `rewrites` et `crons` existants intacts.

**Parcours de désabonnement — correction de la faille GET** (PR #4, mergée)

* Problème : le lien de désabonnement dans les emails déclenchait le désabonnement directement en GET — exploitable par les scanners de sécurité email (Outlook Safe Links etc.) qui suivent les liens automatiquement, désabonnant des parents à leur insu.
* `api/desabonner.js` : GET ne modifie plus rien, redirige vers `/desabonner.html?email=...` (compatibilité anciens liens). POST (déclenché uniquement par une action explicite) fait le `PATCH email_actif=false` réel et répond en JSON. Autre méthode → 405.
* `desabonner.html` : nouvel état de confirmation (email affiché, échappé) avec bouton qui déclenche le POST ; résultat affiché sans redirection.
* `api/email.js` et `api/cron-rappel.js` : les 8 liens de désabonnement basculés vers `/desabonner.html` ; les occurrences qui n'encodaient pas l'email (`esc()` au lieu d'un encodage URL) corrigées avec `encodeURIComponent`.
* Déploiement Production confirmé après un redéploiement forcé (le premier push n'avait pas déclenché le webhook Vercel — commit vide poussé sur `main` pour forcer un nouveau déclenchement, déploiement confirmé côté GitHub Deployments API).

**Chantier Stripe — item A : annulation d'abonnement**

* `stripe-webhook.js` écoute désormais `customer.subscription.deleted` en plus de `invoice.payment_succeeded` : à l'annulation côté Stripe, `plan_actif` repasse à `false` dans `profils`. Terminé, testé en conditions réelles.

**Chantier Stripe — item B : anti-doublon d'abonnement + portail client** (PR #6, PR #7)

* `stripe-checkout.js` : avant toute création de session Checkout, vérifie si le customer Stripe du foyer (email_parent) a déjà un abonnement actif dont `metadata.user_id` correspond à l'enfant ciblé → refus **409** si oui, plutôt qu'un doublon d'abonnement.
* Portail client Stripe (gestion d'un abonnement déjà actif — moyen de paiement, annulation, historique) : ajouté d'abord en fonction séparée `api/stripe-portal.js` (PR #6), puis **fusionné dans `api/stripe-checkout.js`** (PR #7) — le plan Vercel Hobby limite à 12 Serverless Functions par déploiement et `stripe-portal.js` était la 13ᵉ, faisant échouer le déploiement Production. `stripe-checkout.js` accepte maintenant un paramètre `action` (`'checkout'` par défaut, ou `'portal'`), logique d'authentification et de recherche du customer Stripe factorisée une seule fois, chaque action dans sa propre fonction (`gererCheckout` / `gererPortal`).
* `suivi-parent.html` : bouton "Gérer mon abonnement" affiché **uniquement en fallback sur le 409** (pas de bouton systématique) — le bandeau "Passer à Suivi" étant déjà masqué quand `plan_actif=true` en base, le seul cas réel où le portail est utile côté UI est une désynchronisation Stripe/Supabase détectée au moment du 409.
* Terminé, testé en conditions réelles.

**`connexion.html` — suppression du parcours d'inscription autonome de l'élève**

* Retiré : l'onglet "Créer un compte", tous les champs du bloc d'inscription (prénom/nom élève, email parent, mot de passe, source du trafic), et la branche `signUp` + `insert` dans `profils` de `soumettre()`.
* Raison (sécurité, pas que cosmétique) : `email_parent` y était saisi **librement par l'élève**, sans aucune vérification — n'importe qui pouvait créer un compte élève et router le suivi scolaire d'un mineur vers une adresse email arbitraire.
* Décision produit confirmée : seul le parent crée les comptes, depuis `espace-parent.html` puis `suivi-parent.html` (`creerEnfant()`), où `email_parent` provient de la session authentifiée du parent, pas d'un champ libre. **Ne pas réintroduire** de parcours d'inscription autonome dans `connexion.html`.
* `connexion.html` ne sert plus qu'à connecter un élève dont le compte existe déjà (`verifier_login` + `signInWithPassword`) et au reset de mot de passe.
* Effet de bord à traiter dans un chantier suivant (déjà validé) : la collecte d'origine du trafic (champ radio "comment avez-vous connu Academika ?", colonne `source` de `profils`) a disparu avec ce bloc. Elle doit être réimplantée dans `suivi-parent.html` (`creerEnfant()`) plutôt que restaurée ici.

### Reste ouvert — chantier différé « intégrité des comptes »

À traiter avant le passage Stripe live :

* **`profils` INSERT** : la policy INSERT actuelle (`with_check: auth.uid()=user_id`) ne contrôle pas `email_parent` — un utilisateur peut s'attribuer n'importe quel email parent à l'insertion. Concrètement observé dans `suivi-parent.html` (`creerEnfant()`) : l'INSERT se fait avec la session de l'**enfant** (`sbEleve`, pas celle du parent), et `email_parent` est envoyé correctement par ce flux applicatif précis — mais RLS seule ne l'impose pas, donc rien n'empêche un appel direct à l'API Supabase avec une session valide et n'importe quel `email_parent`. Solution probable : valider `email_parent` côté serveur avant l'insertion plutôt qu'en RLS pur (RLS ne peut pas facilement comparer à une valeur externe).
* **`shouldCreateUser: true`** : dans `espace-parent.html`, l'appel `sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })` (seule occurrence dans le dépôt) permet à n'importe qui de créer un compte Auth sur une adresse email arbitraire. C'est le vecteur d'entrée qui rend exploitable la faille `profils` INSERT ci-dessus — d'où leur regroupement dans ce même chantier.

### Reste ouvert — chantier Stripe (idempotency)

* **C1** — `stripe-checkout.js` : clé d'idempotency basée sur `Date.now()` — unique à chaque appel, donc n'idempotise rien (le bouton désactivé au clic protège du double-clic côté UI, mais pas d'un retry réseau ou d'un appel API direct).
* **C2** — `stripe-webhook.js` : pas d'idempotency au niveau DB (pas de table de log d'événements Stripe) — sans dégât aujourd'hui car l'opération actuelle est un simple `set` (idempotent par nature), mais deviendra un risque dès qu'une action non-idempotente (email, log) sera ajoutée à ce handler.

### Items mineurs restants, hors RLS et hors chantier Stripe

* `alerte_envoyee` (table `resultats`) : `NOT NULL` non appliqué, `DEFAULT false` confirmé — risque résiduel faible mais réel si une valeur `NULL` explicite est un jour insérée.
* `jours_actifs` dans le bilan périodique (`cron-rappel.js`) calculé via `toISOString()` (UTC) au lieu de `Europe/Paris` comme le reste du code — sous-estime l'activité pour les sessions tardives.

### Reste hors du périmètre Claude Code (à traiter dans les échanges avec Claude sur claude.ai)

* SIRET toujours en attente (dossier déposé 21/07/2026) — bloque le passage Stripe live, la déclaration SAP, la facturation
* Gating produit (frontière Autonomie/Suivi sur `suivi-parent.html`) — décision produit prise, non codée, dépend de l'étape 3 terminée pour avoir un sens (étape 3 terminée — à coder)
* Mise à jour rédactionnelle des CGV et relecture juridique avant passage Stripe live (cf. chantier « Conformité CGV et résiliation » ci-dessous)
* Décisions stratégiques générales, priorisation, calendrier

## CHANTIER — Conformité CGV et résiliation

Basé sur la lecture du document CGV (fourni en pièce jointe dans une conversation Claude.ai, **non présent dans ce dépôt**). À recroiser avec le fichier réel si/quand il est ajouté au dépôt.

**Cases à cocher manquantes dans le parcours d'inscription — chantier prioritaire avant le live (risque financier de remboursement, aucun contrat valablement formé sans ça) :**

* **Art. A1** — acceptation expresse des CGV : case à cocher manquante, non pré-sélectionnée, au moment de la création du Compte Parent dans `espace-parent.html`.
* **Art. B4** — renonciation expresse au droit de rétractation de 14 jours (nécessaire pour un service numérique à exécution immédiate) : case à cocher manquante, **distincte** de l'acceptation générale des CGV, au moment précis de la souscription payante dans `suivi-parent.html`.

**Conformité du parcours de résiliation — obligation légale (article L215-1-1 du Code de la consommation, "résiliation en 3 clics") :**

* Le portail client Stripe fonctionne mais s'affiche en **espagnol** — la locale n'est pas forcée dans `billingPortal.sessions.create` (`api/stripe-checkout.js`, action `portal`).
* Le nom de l'entreprise n'est pas configuré dans Stripe — affiche « XXXXX » sur le portail et les factures.
* Email de confirmation de résiliation sur support durable (pas juste un message à l'écran) : probablement requis par la loi, pas encore en place — à déclencher depuis le webhook `customer.subscription.deleted` (`api/stripe-webhook.js`).

**CGV non finalisées (rédactionnel, pas du code) :**

* Art. C1 contredit l'offre actuelle : dit « présentiel non proposé » alors que les stages vacances et les examens blancs présentiels existent.
* Art. B2 mentionne une périodicité mensuelle/annuelle alors que l'offre verrouillée (cf. Décisions commerciales verrouillées) est mensuelle uniquement.
* Tarifs encore en placeholder alors que la grille est verrouillée depuis le 22/07/2026.
* SIRET et médiateur de la consommation en attente.

**Relecture juridique professionnelle requise avant le passage en live** — le document CGV le demande lui-même en préambule.

### Reste à faire — récapitulatif (tous chantiers, par ordre de priorité)

1. Cases à cocher A1/B4 manquantes (risque financier de remboursement) — cf. chantier CGV ci-dessus.
2. Conformité du parcours de résiliation (obligation légale) — cf. chantier CGV ci-dessus.
3. Idempotency Stripe checkout et webhook DB (C1, C2) — cf. chantier Stripe ci-dessus.
4. Chantier différé « intégrité des comptes » (`profils` INSERT + `shouldCreateUser`) — cf. section dédiée ci-dessus.
5. Mise à jour rédactionnelle des CGV.
6. Relecture juridique avant passage Stripe live.

## CHANTIER — Bascule décembre 2026 (fin de l'offre de lancement)

Deux points d'UI masquent volontairement tout ce qui mène à l'offre payante pendant la gratuité de lancement (jusqu'au 01/12/2026, `FIN_OFFRE_LANCEMENT` — la même constante existe indépendamment dans `api/stripe-checkout.js:231` et doit rester synchronisée si la date change).

* **Bandeau "Suivi de la progression"** (`suivi-parent.html`, `afficherBandeauSuivi()`) — masqué en dur pendant la période gratuite (constat 16/08/2026 : le bandeau "{prénom} est en Libre" / accordéon détail Accompagné / CTA "Passer à Accompagné" s'affichaient malgré `plan_actif=false` voulu, et le clic sur le CTA échouait visiblement — Stripe non garanti opérationnel, SIRET en attente). Fix : garde étendue à `enPeriodeGratuite()` (`new Date() < FIN_OFFRE_LANCEMENT`), en plus de `plan_actif`.
* **Sélecteur d'offre à la création de compte** (`suivi-parent.html`, `afficherFormulaireAjout()`, cartes `#offre-autonomie`/`#offre-suivi`) — même traitement, constat 16/08/2026 : impact plus fort que le bandeau puisqu'il intervient au tout premier contact d'un parent avec le produit. Choisir "Accompagné" pendant `creerEnfant()` déclenchait le même appel à `/api/stripe-checkout` en échec, avec un risque d'abandon avant même la création du compte. Fix : le bloc "Choisir une offre" (label + grid + note) est masqué pendant `enPeriodeGratuite()`, et `offreSelectionnee` est forcé à `'autonomie'` — le compte créé pendant le lancement ne peut plus passer par Stripe.
* **`enPeriodeGratuite()`** — fonction partagée par les deux fixes ci-dessus (`suivi-parent.html`), basée sur la constante `FIN_OFFRE_LANCEMENT` (même valeur que `api/stripe-checkout.js:231`, à garder synchronisée si la date change). **Auto-réactivation des deux éléments le 01/12/2026 sans déploiement** — vérifier à cette date que Stripe est réellement opérationnel (SIRET obtenu) avant que les deux ne réapparaissent. Décision actée le 16/08/2026 : date seule, pas de flag manuel supplémentaire (un rappel agenda mi-novembre existe déjà pour la session de bascule ; un second mécanisme à ne pas oublier augmenterait le risque plutôt que de le réduire).

## Note — Gating du bilan manuel (`api/email.js`, type `bilan`)

**`bilan` (bouton manuel "Envoyer bilan parents", `prof.html`) — gating volontairement absent.** Contrairement à `recap-journalier-user`, ce flux n'applique pas `peutRecevoirEmailDetaille`. C'est un choix commercial assumé : ce bouton sert au prof à envoyer manuellement un échantillon détaillé (sous-thème, Acquis/À revoir, tout l'historique de l'élève) à un parent en offre Libre, dans une logique de conversion vers l'offre Accompagné. Ne pas "corriger" en ajoutant le gating lors d'un futur audit.

## Rappel méthodologique

Ne jamais exécuter de SQL, modifier RLS, ou toucher aux tables ci-dessus sans présenter d'abord : ce qui va changer, pourquoi, le risque principal, et un plan de test précis — puis attendre validation explicite. Tester une table/un changement à la fois, jamais un lot entier d'un coup. En cas de doute sur un usage client (une table lue/écrite directement depuis un fichier HTML), vérifier dans le code avant de formuler une hypothèse — ne pas supposer.
