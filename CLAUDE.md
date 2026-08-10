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

### Reste ouvert — chantier différé « intégrité des comptes »

À traiter avant le passage Stripe live :

* **`profils` INSERT** : la policy INSERT actuelle (`with_check: auth.uid()=user_id`) ne contrôle pas `email_parent` — un utilisateur peut s'attribuer n'importe quel email parent à l'insertion. Concrètement observé dans `suivi-parent.html` (`creerEnfant()`) : l'INSERT se fait avec la session de l'**enfant** (`sbEleve`, pas celle du parent), et `email_parent` est envoyé correctement par ce flux applicatif précis — mais RLS seule ne l'impose pas, donc rien n'empêche un appel direct à l'API Supabase avec une session valide et n'importe quel `email_parent`. Solution probable : valider `email_parent` côté serveur avant l'insertion plutôt qu'en RLS pur (RLS ne peut pas facilement comparer à une valeur externe).
* **`shouldCreateUser: true`** : dans `espace-parent.html`, l'appel `sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })` (seule occurrence dans le dépôt) permet à n'importe qui de créer un compte Auth sur une adresse email arbitraire. C'est le vecteur d'entrée qui rend exploitable la faille `profils` INSERT ci-dessus — d'où leur regroupement dans ce même chantier.

### Prochain chantier prévu : Stripe

* `stripe-checkout.js` : clé d'idempotency basée sur `Date.now()` — unique à chaque appel, donc n'idempotise rien ; pas de vérification qu'un abonnement n'est pas déjà actif avant d'en créer un nouveau (risque de double facturation).
* `stripe-webhook.js` : pas d'idempotency au niveau DB (pas de table de log d'événements Stripe) — sans dégât aujourd'hui car l'opération actuelle est un simple `set`, mais deviendra un risque dès qu'une action non-idempotente (email, log) sera ajoutée à ce handler.
* `customer.subscription.deleted` non écouté par le webhook — un parent qui annule son abonnement garde `plan_actif=true` indéfiniment.

### Items mineurs restants, hors RLS et hors chantier Stripe

* `alerte_envoyee` (table `resultats`) : `NOT NULL` non appliqué, `DEFAULT false` confirmé — risque résiduel faible mais réel si une valeur `NULL` explicite est un jour insérée.
* `jours_actifs` dans le bilan périodique (`cron-rappel.js`) calculé via `toISOString()` (UTC) au lieu de `Europe/Paris` comme le reste du code — sous-estime l'activité pour les sessions tardives.

### Reste hors du périmètre Claude Code (à traiter dans les échanges avec Claude sur claude.ai)

* SIRET toujours en attente (dossier déposé 21/07/2026) — bloque le passage Stripe live, la déclaration SAP, la facturation
* Gating produit (frontière Autonomie/Suivi sur `suivi-parent.html`) — décision produit prise, non codée, dépend de l'étape 3 terminée pour avoir un sens (étape 3 terminée — à coder)
* Décisions stratégiques générales, priorisation, calendrier

## Rappel méthodologique

Ne jamais exécuter de SQL, modifier RLS, ou toucher aux tables ci-dessus sans présenter d'abord : ce qui va changer, pourquoi, le risque principal, et un plan de test précis — puis attendre validation explicite. Tester une table/un changement à la fois, jamais un lot entier d'un coup. En cas de doute sur un usage client (une table lue/écrite directement depuis un fichier HTML), vérifier dans le code avant de formuler une hypothèse — ne pas supposer.
