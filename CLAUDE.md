# CLAUDE.md — Academika

Contexte permanent pour Claude Code sur ce dépôt. Lu automatiquement à chaque session.

## Qui est l'utilisateur

Marco Campos (CM) — Responsable Qualité chez Maison La Hulotte (métier principal), fondateur solo d'Academika en parallèle. Ingénieur agroalimentaire, 10 ans de tutorat privé. Communique en français, direct et concis. Applique une méthodologie stricte : Analyse → Validation → Conception → Validation → Exécution. Jamais de code écrit sans validation explicite. Toujours présenter les options, risques et une recommandation avant d'exécuter quoi que ce soit — ne jamais sauter à l'implémentation.

## Le projet

Academika (academika.fr) — plateforme de préparation au Brevet des collèges (maths, niveau 3ème), en auto-entrepreneur. Stack : Vercel (serverless functions `/api`), Supabase (Postgres + Auth OTP + Storage), Stripe (abonnement Suivi), Resend (emails).

Fichiers clés déjà connus : `espace-parent.html`, `suivi-parent.html`, `prof.html`, `quiz.html`, `index.html`, `tarifs.html`, `api/stripe-checkout.js`, `api/stripe-webhook.js`, `api/email.js`, `api/cron-rappel.js`, `api/desabonner.js`, `vercel.json`.

Fichiers non encore audités, à lire en priorité si pertinent : `examen.html`, le script d'inscription aux stages (probablement lié à la table `inscriptions_stages`), `resultats.html`, `quiz-resultat.js`, `api/examen.js`, `api/generer.js`.

## Décisions commerciales verrouillées (ne pas remettre en question)

* Grille tarifaire définitive (validée 22/07/2026) : Autonomie 0€ · Suivi 7,90€/mois · Cours visio 30€/h · Cours présentiel 40€/h · Stages vacances 200€/semaine
* Pas de gratuit croisé sur Suivi
* Cours présentiel individuel retiré de l'offre publique (conflit avec activité salariée)
* CM ne travaille jamais le samedi ; présentiel bassin Melun = dimanches uniquement

## CHANTIER EN COURS — Audit sécurité & correction RLS (priorité actuelle)

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

### À faire — Étape 3 : les 6 policies à `qual = true`

Toutes ces tables ont RLS activé mais des policies qui laissent passer `anon`/`public` sans condition réelle. Plan conçu, pas encore exécuté. Ordre du plus sûr au plus risqué, un test après chaque table avant de passer à la suivante :

1. `resultats` — confiance élevée. Remplacer `"Le prof voit tout"` (qual=true) par `is_prof()`. La policy élève (`auth.uid()=user_id`) reste.
2. `inscriptions_stages` — confiance moyenne. Retirer la lecture publique (fuite RGPD : noms, emails, téléphones), garder l'INSERT public (formulaire non authentifié probablement légitime). Vérifier avant d'exécuter : le script d'inscription fait-il un `select()` après l'`insert()` pour confirmer à l'utilisateur ? Si oui, la lecture publique retirée casserait ce message de confirmation — chercher ce fichier.
3. `questions_banque` — confiance moyenne. Retirer la lecture publique, garder les policies d'écriture prof (déjà correctes). Vérifier : `quiz.html` passe par `/api/generer` (serveur) — confirmer qu'aucun autre fichier ne lit cette table en direct côté client.
4. `brevets_blancs` — confiance faible. Actuellement `ALL` avec `true`. Passer à `is_prof()` pour tout. Vérifier avant tout : `examen.html` lit-il cette table en direct côté client, ou uniquement via `/api/examen.js` (service_role) ? Si lecture directe côté client, la correction casse l'examen en ligne.
5. `resultats_brevet_blanc` — même famille de risque que ci-dessus, même vérification nécessaire dans `examen.html`.
6. `examens_blancs` — risque le plus élevé de l'étape. SELECT/INSERT/DELETE actuellement `true`, pas de policy UPDATE. Hypothèse : l'écriture des résultats passe par un score calculé serveur (comme `quiz-resultat.js` pour les quiz). À confirmer absolument dans `examen.html` avant d'exécuter quoi que ce soit — si l'INSERT se fait côté client, le retirer casse l'enregistrement des examens blancs.

Chaque correction SQL est déjà rédigée dans l'historique de la conversation Claude.ai correspondante — redemander si besoin, ou les reconstruire selon le même principe (`is_prof()` pour le prof, `auth.uid()=user_id` pour l'élève propriétaire, jamais `true` nu).

### À faire — Étape 4 : INSERT `profils` + bucket Storage

* `profils` : la policy INSERT actuelle (`with_check: auth.uid()=user_id`) ne contrôle pas `email_parent` — un utilisateur peut s'attribuer n'importe quel email parent à l'insertion. Concevoir une contrainte plus stricte (probablement : valider `email_parent` côté serveur avant l'insertion, pas en RLS pur, puisque RLS ne peut pas facilement comparer à une valeur externe).
* Bucket `figures` (Storage, `public=true`) : policy actuelle `FOR ALL` avec seule condition `bucket_id='figures'` — écriture/suppression ouvertes à `anon`. Restreindre l'écriture (INSERT/UPDATE/DELETE) à `is_prof()`, garder la lecture publique (nécessaire à l'affichage des figures dans les quiz élèves, le bucket étant public la lecture ne passe pas par RLS de toute façon).

### Items hors RLS, déjà identifiés mais non traités

* `api/email.js` : endpoint totalement non authentifié, CORS ouvert (`*`), injection HTML sur plusieurs champs (`commentaire`, `messageCompl`, `adresse`, `prenom`, `nom`, `libelle`) — item le plus critique de tout l'audit, risque de relais de spam/phishing depuis le domaine `academika.fr`. Corriger en même temps que `api/cron-rappel.js`, qui appelle `/api/email` sans authentification (dépendance confirmée).
* `api/desabonner.js` : désabonnement en GET, sans token — risque de désabonnements accidentels via crawlers de sécurité email (Outlook Safe Links etc.), pas seulement risque d'abus volontaire.
* `vercel.json` : aucun header de sécurité (`Referrer-Policy`, `X-Frame-Options`, CSP) — fuite du `user_id` de l'enfant via Referer sur la page de confirmation Stripe (`success_url` contient `?enfant=<user_id>`).
* `stripe-checkout.js` : clé d'idempotency basée sur `Date.now()` — unique à chaque appel, donc n'idempotise rien ; pas de vérification qu'un abonnement n'est pas déjà actif avant d'en créer un nouveau (risque de double facturation).
* `stripe-webhook.js` : pas d'idempotency au niveau DB (pas de table de log d'événements Stripe) — sans dégât aujourd'hui car l'opération actuelle est un simple `set`, mais deviendra un risque dès qu'une action non-idempotente (email, log) sera ajoutée à ce handler.
* `customer.subscription.deleted` non écouté par le webhook — un parent qui annule son abonnement garde `plan_actif=true` indéfiniment.
* `alerte_envoyee` (table `resultats`) : `NOT NULL` non appliqué, `DEFAULT false` confirmé — risque résiduel faible mais réel si une valeur `NULL` explicite est un jour insérée.
* `jours_actifs` dans le bilan périodique (`cron-rappel.js`) calculé via `toISOString()` (UTC) au lieu de `Europe/Paris` comme le reste du code — sous-estime l'activité pour les sessions tardives.

### Reste hors du périmètre Claude Code (à traiter dans les échanges avec Claude sur claude.ai)

* SIRET toujours en attente (dossier déposé 21/07/2026) — bloque le passage Stripe live, la déclaration SAP, la facturation
* Gating produit (frontière Autonomie/Suivi sur `suivi-parent.html`) — décision produit prise, non codée, dépend de l'étape 3 terminée pour avoir un sens
* Décisions stratégiques générales, priorisation, calendrier

## Rappel méthodologique

Ne jamais exécuter de SQL, modifier RLS, ou toucher aux tables ci-dessus sans présenter d'abord : ce qui va changer, pourquoi, le risque principal, et un plan de test précis — puis attendre validation explicite. Tester une table/un changement à la fois, jamais un lot entier d'un coup. En cas de doute sur un usage client (une table lue/écrite directement depuis un fichier HTML), vérifier dans le code avant de formuler une hypothèse — ne pas supposer.
