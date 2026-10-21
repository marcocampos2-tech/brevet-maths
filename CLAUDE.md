# CLAUDE.md — Academika

Contexte permanent pour Claude Code sur ce dépôt. Lu automatiquement à chaque session.

## Qui est l'utilisateur

Marco Campos (CM) — Responsable Qualité chez Maison La Hulotte (métier principal), fondateur solo d'Academika en parallèle. Ingénieur agroalimentaire, 10 ans de tutorat privé. Communique en français, direct et concis. Applique une méthodologie stricte : Analyse → Validation → Conception → Validation → Exécution. Jamais de code écrit sans validation explicite. Toujours présenter les options, risques et une recommandation avant d'exécuter quoi que ce soit — ne jamais sauter à l'implémentation.

## Le projet

Academika (academika.fr) — plateforme de préparation au Brevet des collèges (maths, niveau 3ème), en auto-entrepreneur. Stack : Vercel (serverless functions `/api`), Supabase (Postgres + Auth OTP + Storage), Stripe (abonnement Suivi), Resend (emails).

Fichiers clés déjà connus : `espace-parent.html`, `suivi-parent.html`, `prof.html`, `quiz.html`, `index.html`, `tarifs.html`, `examen.html`, `brevet-blanc.html`, `stages-vacances.html`, `connexion.html`, `desabonner.html`, `api/stripe-checkout.js`, `api/stripe-webhook.js`, `api/email.js`, `api/cron-rappel.js`, `api/desabonner.js`, `api/examen.js`, `api/generer.js`, `api/generer-brevet.js`, `api/inscription-brevet.js`, `api/inscription-stage.js`, `vercel.json`.

Fichiers non encore audités, à lire en priorité si pertinent : `resultats.html`, `quiz-resultat.js`.

## Décisions commerciales verrouillées (ne pas remettre en question)

* Grille tarifaire définitive (validée 22/07/2026) : Autonomie 0€ · Suivi 7,90€/mois · Cours visio 30€/h · Cours présentiel 40€/h · Stages vacances 20€/h
  * **Format de stage actuel (choix du 04/10/2026) : 3 jours, 120€ pour 6h** (lundi/mercredi/vendredi, 2h/jour ; `stages-vacances.html`, PR #90) ; à réévaluer après les tests Toussaint et Noël 2026. Le format 5 jours / 200€ (10h/semaine) est écarté pour l'instant ; plus de règle de repli automatique.
  * **Stage Toussaint 2026 = test des canaux (Instagram, Facebook, proches) et de la demande**, pas un test du format. Critère fixé le 04/10/2026 : demande confirmée si au moins 3 inscrits dont au moins 1 hors proches ; 1-2 inscrits = signal faible, test reconduit à Noël avant toute conclusion ; 0 inscrit = analyser le trafic avant de conclure. Pas de minimum d'inscrits pour maintenir une session.
* Pas de gratuit croisé sur Suivi
* Cours présentiel individuel retiré de l'offre publique (conflit avec activité salariée)
* CM ne travaille jamais le samedi ; présentiel bassin Melun = dimanches uniquement

## CHANTIER — Audit sécurité & correction RLS

⚠️ **CLAUDE.md n'est pas la source de vérité sur l'état des policies.** Erreur factuelle trouvée et corrigée le 03/09/2026 (cf. section « intégrité des comptes » ci-dessous) : ce document peut décrire une policy qui n'a jamais existé sous cette forme. Toujours dumper `pg_policies` avant toute décision touchant à la RLS — ne jamais se fier à la description ci-dessous sans revérifier.

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
2. `inscriptions_stages` — lecture publique retirée, INSERT public conservé *(état d'alors : la policy d'INSERT public a été supprimée le 04/10/2026, devenue inutile — `api/inscription-stage.js` écrit avec la clé service ; cf. `db/policies.sql`, section « Lot 3 »)*. Vérifié avant correction : `api/inscription-stage.js` ne fait aucun `select()` après l'`insert()` (confirmation client basée sur `{success:true}`, pas sur une lecture Supabase) — la lecture publique retirée ne casse donc rien.
3. `questions_banque` — lecture publique retirée. Point additionnel découvert et corrigé en amont (PR #1) : `api/generer.js` lisait cette table avec un fallback codé en dur sur la clé anon (`SUPABASE_KEY`) — basculé sur `SUPABASE_SERVICE_KEY` avant la correction RLS, pour ne pas casser le repli "banque" du générateur de questions.
4. `brevets_blancs` / `resultats_brevet_blanc` — n'apparaissaient dans aucun fichier du dépôt (recherche exhaustive sur tout l'historique Git, aucune occurrence). Vérifié directement en base : `brevets_blancs` contenait 2 lignes de test datées du 24/05/2026 (« Brevet blanc test 1 », « Brevet blanc 2 »), avec des `user_id` inexistants dans `profils` ; `resultats_brevet_blanc` était vide. Un prototype antérieur au système actuel (`sessions_examen_blanc`/`inscriptions_brevet`), jamais branché au produit. Les deux tables ont été supprimées (`DROP TABLE`) — n'existent plus.
5. `examens_blancs` — confirmé lu ET écrit directement côté client (clé anon) dans `examen.html` (INSERT à l'abandon et à la fin d'examen, SELECT pour l'historique). Policy prof (`is_prof()`) et policy élève (`auth.uid()=user_id`) toutes les deux nécessaires et conservées.

**Bucket Storage `figures`** — écriture (INSERT/UPDATE/DELETE) restreinte à `is_prof()`, lecture publique conservée (nécessaire à l'affichage des figures dans les quiz élèves). Terminé et testé.

**`api/email.js` — échappement HTML + rate-limit** (PR #2, mergée)

* Fonction `esc()` appliquée à tous les champs interpolés dans les templates HTML des 8 branches d'emails (`prenom`, `nom`, `date`, `heure`, `adresse`, `messageCompl`, `libelle`, `commentaire`, `emailParent`, `prenom_affiche`, noms de thèmes/sous-thèmes, entrées de `questions_ratees`/`topRatees`) — corrige l'injection HTML confirmée sur ces champs.
* `verifierRateLimit(destinataire)` : 10 emails/heure/destinataire, table `email_rate_limit` (`destinataire` text PK, `compteur` int, `fenetre_debut` timestamptz), fail-open si la vérification échoue techniquement. Appliqué avant l'envoi dans les 8 branches. Clé = adresse du destinataire, sauf pour `brevet-blanc` (clé `brevet-blanc:<user_id>`) et `inscription` (clé `inscription:<id du compte>`, un seul contrôle couvrant l'email au parent ET celui vers `contact@academika.fr`) depuis le Lot 2 bis (PR #97) ; ces deux types exigent désormais un jeton Supabase et déduisent le destinataire côté serveur.
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
* `suivi-parent.html` : bouton "Gérer mon abonnement" affiché **uniquement en fallback sur le 409** (pas de bouton systématique) — l'encart « Suivre la progression… » étant déjà masqué quand l'élève est Accompagné, le seul cas réel où le portail est utile côté UI est une désynchronisation Stripe/Supabase détectée au moment du 409.
* Terminé, testé en conditions réelles.

**`connexion.html` — suppression du parcours d'inscription autonome de l'élève**

* Retiré : l'onglet "Créer un compte", tous les champs du bloc d'inscription (prénom/nom élève, email parent, mot de passe, source du trafic), et la branche `signUp` + `insert` dans `profils` de `soumettre()`.
* Raison (sécurité, pas que cosmétique) : `email_parent` y était saisi **librement par l'élève**, sans aucune vérification — n'importe qui pouvait créer un compte élève et router le suivi scolaire d'un mineur vers une adresse email arbitraire.
* Décision produit confirmée : seul le parent crée les comptes, depuis `espace-parent.html` puis `suivi-parent.html` (`creerEnfant()`), où `email_parent` provient de la session authentifiée du parent, pas d'un champ libre. **Ne pas réintroduire** de parcours d'inscription autonome dans `connexion.html`.
* `connexion.html` ne sert plus qu'à connecter un élève dont le compte existe déjà (par `api/connexion-eleve.js`, cf. section suivante) et au reset de mot de passe.
* Effet de bord à traiter dans un chantier suivant (déjà validé) : la collecte d'origine du trafic (champ radio "comment avez-vous connu Academika ?", colonne `source` de `profils`) a disparu avec ce bloc. Elle doit être réimplantée dans `suivi-parent.html` (`creerEnfant()`) plutôt que restaurée ici.

**Connexion élève par le serveur — `api/connexion-eleve.js`** (PR #100 ; validée en production le 04/10/2026 : connexion, réinitialisation, refus 42501 de verifier_login depuis le site, et connexion de l'élève toujours fonctionnelle)

* `connexion.html` n'appelle plus `verifier_login` ni `signInWithPassword` : `soumettre()` poste `{ prenom, nom, password }` à `/api/connexion-eleve`, qui cherche l'élève avec la clé service, tente la connexion auprès de Supabase Auth (`/auth/v1/token?grant_type=password`) et renvoie `{ access_token, refresh_token }` ; le navigateur installe la session avec `sb.auth.setSession()`. Le faux email ne transite plus par le navigateur. Réponses : 401 identifiants (réponse unique : élève inconnu, doublon ou mot de passe faux — seul le 400 de Supabase Auth compte comme échec d'identifiants ; un 401 de Supabase, apikey invalide, donne un 503 technique sans compter d'échec), 429 bloqué, 503 saturé/technique, 400 saisie. Durée minimale de réponse de 1 s pour toutes les réponses.
* Blocage : clés `eleve:<prenom>|<nom>` (5 échecs / fenêtre 900 s / blocage 900 s) et `ip:<ip>` (20 échecs / 900 s / 900 s), via les RPC `login_est_bloque`, `login_enregistrer_echec` et `login_reinitialiser` (table `login_tentatives` — RLS active sans policy, droits retirés à `anon` et `authenticated` — et fonctions `login_est_bloque(p_cles text[]) → boolean`, `login_enregistrer_echec(p_cle text, p_seuil integer, p_fenetre_s integer, p_blocage_s integer) → void` et `login_reinitialiser(p_cle text) → void`, `EXECUTE` réservé à `service_role` : non `SECURITY DEFINER`, `search_path` vide : **créées en base le 04/10/2026, versionnées dans `db/policies.sql`**, section « Connexion élève par le serveur »). Les RPC sont **fail-open** : une panne du mécanisme n'empêche jamais un élève de se connecter (statut journalisé, jamais le contenu). IP lue dans `x-real-ip`, sinon premier élément de `x-forwarded-for` ; sans IP valide, pas de clé IP.
* **`SUPABASE_SECRET_KEY`** (facultative) : si elle est définie, elle sert d'`apikey` et l'IP du client est transmise à Supabase (en-tête `Sb-Forwarded-For`) pour que ses limites portent sur l'élève et non sur le serveur Vercel. Sinon : clé anon (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), sans transfert d'IP, avec un log d'avertissement.
* **`verifier_login` (et `verifier_email_parent`) fermées** : `EXECUTE` retiré à `PUBLIC`, `anon` et `authenticated` (relevé du 04/10/2026), `service_role` garde l'accès (défaut, ne pas le révoquer). `verifier_login` n'a plus aucun appelant dans le code.
* Mots de passe : minimum 8 caractères à la création d'un enfant (`suivi-parent.html`) et à la réinitialisation (`connexion.html`). La connexion n'impose aucun minimum : les mots de passe existants de 6 ou 7 caractères restent valides.

### Reste ouvert — chantier différé « intégrité des comptes »

**Statut (30/09/2026, corrigé le 04/10/2026)** : le volet `profils` INSERT est clos, mais en deux temps à ne pas confondre. Le 14/09/2026, une insertion réelle rejetée (403, `42501`) a établi un faux positif **pour le seul volet `email_parent`** (le contrôle `email_parent_valide()` existait déjà) ; cf. `docs/TODO.md`. Les volets `user_id` (greffe d'un compte sur un élève existant) et `plan_actif` (profil créé avec un abonnement actif) étaient, eux, réels et ont été fermés le 04/10/2026 : contrainte `UNIQUE(user_id)` sur `profils` et clause `coalesce(plan_actif, false) = false` dans la policy « Insertion profils » (cf. `db/policies.sql`, section « Lot 3 »). Seul `shouldCreateUser: true` reste ouvert. Le premier bullet ci-dessous est conservé comme historique de l'erreur du 03/09.

À traiter avant le passage Stripe live :

* ✅ **CLOS — volet `email_parent` : faux positif (vérifié en prod le 14/09/2026) ; volets `user_id` et `plan_actif` : fermés le 04/10/2026 — cf. statut ci-dessus. Le texte qui suit est conservé comme historique de l'erreur du 03/09.**

  **`profils` INSERT — ⚠️ CORRECTION FACTUELLE (03/09/2026)** : ce chantier reposait sur une description erronée de la policy. Ce qui était écrit ici (`with_check: auth.uid()=user_id`, policy ne contrôlant pas `email_parent`) **est faux**. Le dump réel de `pg_policies` donne :

  ```
  "Insertion profils" INSERT {public} with_check: (email_parent = (auth.jwt() ->> 'email'))
  ```

  Soit exactement ce que dit le commentaire de `suivi-parent.html` l.905-906 — la policy contrôle bien `email_parent` contre l'email du JWT de la session qui fait l'INSERT, elle ne se contente pas de `auth.uid()=user_id`. **Les conclusions de ce chantier (diagnostic de faille et solution proposée) sont donc à rejouer entièrement** à partir de la policy réelle avant toute action : reste à déterminer si `email_parent = auth.jwt()->>'email'` suffit à couvrir le scénario redouté (session enfant + email arbitraire) ou si un trou subsiste sous une autre forme.
* **`shouldCreateUser: true`** : dans `espace-parent.html`, l'appel `sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })` (seule occurrence dans le dépôt) permet à n'importe qui de créer un compte Auth sur une adresse email arbitraire. Était présenté comme le vecteur d'entrée rendant exploitable la faille `profils` INSERT ci-dessus — faille inexistante pour le volet `email_parent` (cf. statut ci-dessus), les volets `user_id` et `plan_actif`, eux réels, ayant été fermés le 04/10/2026 ; reste un point ouvert en soi (création de comptes Auth sur adresse arbitraire).

### Reste ouvert — chantier Stripe (idempotency)

* **C1** — `stripe-checkout.js` : clé d'idempotency basée sur `Date.now()` — unique à chaque appel, donc n'idempotise rien (le bouton désactivé au clic protège du double-clic côté UI, mais pas d'un retry réseau ou d'un appel API direct).
* **C2** — `stripe-webhook.js` : pas d'idempotency au niveau DB (pas de table de log d'événements Stripe) — sans dégât aujourd'hui car l'opération actuelle est un simple `set` (idempotent par nature), mais deviendra un risque dès qu'une action non-idempotente (email, log) sera ajoutée à ce handler.
* **C3** — `stripe-webhook.js` : `invoice.payment_failed` n'est pas écouté (seuls `invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated` le sont). Un échec de paiement (carte expirée, etc.) après la bascule payante ne désactive `plan_actif` que via `customer.subscription.deleted` — donc seulement une fois que Stripe a définitivement abandonné ses tentatives de relance, avec un délai potentiellement long pendant lequel l'accès reste actif sans paiement. Pas une idempotency, une vraie lacune de couverture d'événements — à traiter avant que des paiements réels échouent.

### Items mineurs restants, hors RLS et hors chantier Stripe

* `alerte_envoyee` (table `resultats`) : `NOT NULL` non appliqué, `DEFAULT false` confirmé — risque résiduel faible mais réel si une valeur `NULL` explicite est un jour insérée.

### Reste hors du périmètre Claude Code (à traiter dans les échanges avec Claude sur claude.ai)

* SIRET obtenu (10786402700019, 24/08/2026) ; la déclaration SAP attend l'ajout de l'activité 85.59B à l'INPI (formalité J00274516137). Statut Stripe live : à confirmer par CM
* Gating produit (frontière Autonomie/Suivi sur `suivi-parent.html`) — décision produit prise, non codée, dépend de l'étape 3 terminée pour avoir un sens (étape 3 terminée — à coder)
* Mise à jour rédactionnelle des CGV et relecture juridique avant passage Stripe live (cf. chantier « Conformité CGV et résiliation » ci-dessous)
* Décisions stratégiques générales, priorisation, calendrier

## CHANTIER — Conformité CGV et résiliation

Basé sur la lecture du document CGV (fourni en pièce jointe dans une conversation Claude.ai, **non présent dans ce dépôt**). À recroiser avec le fichier réel si/quand il est ajouté au dépôt.

**Cases à cocher manquantes dans le parcours d'inscription — chantier prioritaire avant le live (risque financier de remboursement, aucun contrat valablement formé sans ça) :**

* **Art. A1** — acceptation expresse des CGV : case à cocher manquante, non pré-sélectionnée, au moment de la création du Compte Parent dans `espace-parent.html`.
* **Art. B4** — renonciation expresse au droit de rétractation de 14 jours (nécessaire pour un service numérique à exécution immédiate) : case à cocher manquante, **distincte** de l'acceptation générale des CGV, au moment précis de la souscription payante dans `suivi-parent.html`.

**Conformité du parcours de résiliation — obligation légale (article L215-1-1 du Code de la consommation, "résiliation en 3 clics") :**

* ✅ Le portail client Stripe s'affichait en **espagnol** — corrigé : locale forcée à `fr` (`api/stripe-checkout.js:262-265`, action `portal`).
* Le nom de l'entreprise n'est pas configuré dans Stripe — affiche « XXXXX » sur le portail et les factures.
* Email de confirmation de résiliation sur support durable (pas juste un message à l'écran ; probablement requis par la loi) : code présent (`api/email.js:1070`, type `resiliation-confirmee`, déclenché depuis `api/stripe-webhook.js`) ; validation en conditions réelles non consignée.

**CGV non finalisées (rédactionnel, pas du code) :**

* Art. C1 contredit l'offre actuelle : dit « présentiel non proposé » alors que les stages vacances et les examens blancs présentiels existent.
* Art. B2 mentionne une périodicité mensuelle/annuelle alors que l'offre verrouillée (cf. Décisions commerciales verrouillées) est mensuelle uniquement.
* Tarifs encore en placeholder alors que la grille est verrouillée depuis le 22/07/2026.
* SIRET obtenu (10786402700019, 24/08/2026) ; la déclaration SAP attend l'ajout de l'activité 85.59B à l'INPI. Médiateur de la consommation toujours en attente.

**Relecture juridique professionnelle requise avant le passage en live** — le document CGV le demande lui-même en préambule.

### Reste à faire — récapitulatif (tous chantiers, par ordre de priorité)

1. Cases à cocher A1/B4 manquantes (risque financier de remboursement) — cf. chantier CGV ci-dessus.
2. Conformité du parcours de résiliation (obligation légale) — cf. chantier CGV ci-dessus.
3. Idempotency Stripe checkout et webhook DB, et lacune `invoice.payment_failed` (C1, C2, C3) — cf. chantier Stripe ci-dessus.
4. Chantier différé « intégrité des comptes » : volet `profils` INSERT **clos** (14/09/2026 : volet `email_parent`, faux positif ; 04/10/2026 : volets `user_id` et `plan_actif` fermés — cf. `docs/TODO.md`) ; reste ouvert uniquement `shouldCreateUser: true` (`docs/TODO.md`, section technique n°1) — cf. section dédiée ci-dessus.
5. Mise à jour rédactionnelle des CGV.
6. Relecture juridique avant passage Stripe live.

## CHANTIER — Bascule décembre 2026 (fin de l'offre de lancement)

Trois points masquent volontairement tout ce qui suppose un accès payant pendant la gratuité de lancement (jusqu'au 01/12/2026). La date est centralisée une seule fois, `FIN_OFFRE_LANCEMENT` dans `lib/gating.js` — **source unique**, importée par `api/stripe-checkout.js` et `api/email.js`. Exception inévitable : `suivi-parent.html` (fichier HTML statique, pas de bundler pour importer ce module) garde sa propre constante identique, à resynchroniser manuellement si cette date change.

* **Encart « Suivre la progression de {prénom} en détail »** (`suivi-parent.html`, `afficherEncartSuivi()`, en bas de page ; il a remplacé le bandeau du haut le lot 2) — affiché UNIQUEMENT après la bascule et si l'élève est verrouillé (cf. « Verrous du lot 2 ») ; avant la bascule rien n'est affiché (constat 16/08/2026 : un CTA qui menait à un paiement en échec — Stripe non garanti opérationnel, SIRET en attente — était pire que pas de CTA). Il réutilise `passerASuivi()` (parcours `/api/stripe-checkout`).
* **Sélecteur d'offre à la création de compte** (`suivi-parent.html`, `afficherFormulaireAjout()`, cartes `#offre-autonomie`/`#offre-suivi`) — même traitement, constat 16/08/2026 : impact plus fort que le bandeau puisqu'il intervient au tout premier contact d'un parent avec le produit. Choisir "Accompagné" pendant `creerEnfant()` déclenchait le même appel à `/api/stripe-checkout` en échec, avec un risque d'abandon avant même la création du compte. Fix : le bloc "Choisir une offre" (label + grid + note) est masqué pendant `enPeriodeGratuite()`, et `offreSelectionnee` est forcé à `'autonomie'` — le compte créé pendant le lancement ne peut plus passer par Stripe.
* **Récap journalier — constat factuel, sans verdict par sous-thème** (`api/email.js`, `recap-journalier-user` ; fonctions pures `resumeJour()`, `formatDuree()` et `ligneActivite()` dans `lib/recap-journalier.js`). Décision du 12/10/2026 : le « Acquis » (≥ 70 % sur la journée) de l'ancien email contredisait l'« acquis » de la vue parent (5 réussites par niveau, vue `niveaux_sous_theme`) ; l'email ne porte plus aucun verdict, moyenne, score ni pourcentage. Un seul gabarit, sujet `{Prénom} a révisé {quand} — ACADEMIKA` : « {Prénom} a révisé {quand} : N session(s), {durée} », complété de « (+ M interrompue(s)) » s'il y en a ; puis la plage horaire d'activité en petit gris (sans décompte de sessions ; calculée sur **toutes** les sessions du jour, abandons compris) ; puis le lien vers l'espace parent, libellé « Voir son niveau par sous-thème → » (version complète) ou « Voir son espace parent → » (version gratuite, même URL). **Session interrompue = `abandonne = true`, sans seuil de durée** ; elle n'entre ni dans le décompte, ni dans la durée, ni dans la liste des sous-thèmes (un sous-thème joué uniquement en sessions interrompues n'apparaît pas ; une session terminée sans `sous_theme` compte dans le total mais pas dans la liste). Durée = somme de `temps_secondes` des sessions terminées : « moins d'une minute » sous 60 s, sinon arrondi à la minute la plus proche. Une journée sans aucune session terminée n'envoie rien (les sessions sont quand même marquées `alerte_envoyee`). `detailComplet` garde sa définition (`peutRecevoirEmailDetaille({ plan_actif }) || enPeriodeGratuite()`) : si vrai, section « Sous-thèmes travaillés » (une ligne « · {nom} (K session(s)) », tri sessions décroissant puis nom en ordre alphabétique français) ; sinon la phrase « Le détail par sous-thème est disponible avec l'offre Accompagné. » — la bascule du 01/12/2026 reste automatique. La réponse JSON ne renvoie plus de moyenne (`{ success, envoye, totalSessions }`).
* **`enPeriodeGratuite()`** — fonction partagée par les fixes ci-dessus, exportée depuis `lib/gating.js` avec `FIN_OFFRE_LANCEMENT`. **Auto-réactivation des trois éléments le 01/12/2026 sans déploiement** — vérifier à cette date que Stripe est réellement opérationnel (SIRET obtenu) avant que les trois ne réapparaissent/se re-restreignent. Décision actée le 16/08/2026 : date seule, pas de flag manuel supplémentaire (un rappel agenda mi-novembre existe déjà pour la session de bascule ; un second mécanisme à ne pas oublier augmenterait le risque plutôt que de le réduire).

## Statut « Accompagné » (lot 1 du gating, `db/accompagne.sql`)

**Règle unique** : un élève est Accompagné si `plan_actif = true` OU `cours_particuliers_actif = true` OU `acces_offert_jusqu >= date du jour à Paris` (l'accès offert court jusqu'à la fin de la journée indiquée, heure de Paris ; **pas de plafond** sur la date, décision de CM). Statut **par élève** (ligne `profils`). Ordre d'affichage du motif : abonnement > cours particuliers > accès offert.

**Colonnes** (`profils`) : `cours_particuliers_actif boolean not null default false`, `acces_offert_jusqu date null`. `plan_actif` reste écrit par `api/stripe-webhook.js` seulement.

**Une définition, trois copies à garder alignées** : la fonction SQL `public.est_accompagne(boolean, boolean, date)` (sur valeurs ; surcharge `est_accompagne(uuid)` par `user_id`, `security invoker`, donc sous la RLS de l'appelant), `estAccompagne(profil, maintenant)` dans `lib/gating.js` (tests : `lib/gating.manual-test.js`), et `statutOffre()` dans `prof.html` (copie, la page n'importe pas `lib/`). Toute modification de la règle se fait aux trois endroits. Lot 1 : rien n'est encore bloqué pour personne, `estAccompagne` n'est appelée par aucun fichier métier (lot 2).

**Sécurité — écriture réservée au prof, par la fonction seulement.** `public.definir_offre_eleve(p_user_id, p_cours, p_acces_jusqu)` : `SECURITY DEFINER`, `search_path` vide, refuse si `is_prof()` est faux (42501), ne met à jour QUE ces deux colonnes, `EXECUTE` retiré à `public` et `anon`, accordé à `authenticated`. **Aucun droit `UPDATE` sur ces deux colonnes** (le seul `UPDATE` d'`authenticated` sur `profils` est la colonne `source`, droit par colonne : une colonne ajoutée n'en hérite pas ; à revérifier si un `GRANT UPDATE` de table est un jour ajouté). La policy « Insertion profils » exige aussi `cours_particuliers_actif = false` et `acces_offert_jusqu is null` : un parent ne peut pas s'offrir l'accès à la création (`db/policies.sql`, section « Lot gating 1 »). Tests de sécurité : `db/accompagne.test.sql`. Parents et élève lisent ces colonnes (policy « Lecture profils »), sans pouvoir les modifier.

**Interface** : bloc « Offre » en haut de la fiche élève de `prof.html` (badge, abonnement en lecture seule, case « Cours particuliers en cours », date « Accès offert jusqu'au », « Enregistrer » → `sb.rpc('definir_offre_eleve')`, « Retirer l'accès » = date vidée, valeur **enregistrée** de « cours » conservée).

## Verrous du lot 2 (gating, `suivi-parent.html`, `api/examen.js`)

**Condition unique** : verrouillé = (date du jour >= `FIN_OFFRE_LANCEMENT`) ET NON `estAccompagne(profil de l'élève)` (cf. « Statut Accompagné »). Avant la bascule, ou pour un élève Accompagné, **rien ne change**. Une définition serveur : `estVerrouille()` / `apresBascule()` dans `lib/gating.js` (tests : `lib/gating.manual-test.js`) ; une copie dans `suivi-parent.html` (`estVerrouille`, `estAccompagne`), à garder alignée avec `lib/gating.js`, `prof.html` et la fonction SQL. La page recalcule le verrou **par enfant** à chaque `choisirEnfant()`.

**Verrou SOUPLE, côté page** (`suivi-parent.html`) : contournable par quelqu'un qui appelle l'API Supabase directement (la RLS parent donne toujours accès aux données), assumé. Élève verrouillé : période 7 jours par défaut, boutons 14 j et 21 j désactivés avec cadenas ; carte « Niveau atteint par sous-thème » **sans lire la vue** (titre, cadenas, mini-grille grisée de 3 lignes × 4 colonnes, mention) ; export PDF désactivé et `genererPDF()` refuse ; examens blancs **sans lire `examens_blancs`** ; encart d'abonnement en bas. Les styles du verrou sont dans `suivi-parent.html` (pas dans `css/niveaux.css`, partagé avec `prof.html`).

**Verrou STRICT, côté serveur** (`api/examen.js`, action `demarrer` seulement) : après la bascule, lecture du profil de l'élève avec la clé service ; refus `403 { success:false, code:'offre_requise', error }` ; `examen.html` affiche un message lisible. **Avant la bascule : aucune lecture supplémentaire.** Sans ligne `profils`, seul le compte prof est exempté (`verifierProf`). **Lecture du profil en échec : fail-open** avec `console.error` (convention du dépôt : bloquer un élève Accompagné qui paie est pire que laisser passer ponctuellement un élève Libre). **Une tentative déjà en cours se reprend et se termine** (`reprise`, `progression`, `enregistrer` ne sont pas verrouillées). Limite connue : `enregistrer` appelé directement sans `demarrer` n'est pas bloqué (vérification du score par id, `docs/TODO.md` n°27) ; le verrou empêche seulement d'obtenir les questions.

**Simuler l'après-bascule AVANT le 01/12, en aperçu seulement.** Ouvrir une page d'un déploiement Preview (`*.vercel.app`) avec `?simuler=apres-bascule` (mémorisé dans `sessionStorage`, donc propre à l'onglet ; `?simuler=non` désactive ; un bandeau orange s'affiche). `js/simulation-bascule.js` (`window.SimulationBascule`) ne l'honore que sur un hôte `.vercel.app` ; `examen.html` envoie alors `simuler_bascule: true` à l'API, que `lib/gating.js` (`apresBascule()`) ne prend en compte **que si `process.env.VERCEL_ENV === 'preview'`** (variable posée par Vercel par déploiement, jamais par une requête ; en production elle vaut `production`, le drapeau est ignoré). La simulation ne peut que **restreindre** l'accès, jamais l'ouvrir. **Limite côté page, acceptée** : les déploiements de production restent joignables sur une adresse `.vercel.app`, où la simulation peut verrouiller l'affichage de son propre onglet (aucun effet sur les droits ni les données ; le contrôle strict reste au serveur). Les aperçus partagent la base et probablement les clés Stripe de la production : ne pas finaliser un paiement en aperçu si la clé est live. L'élève Accompagné ou Libre se règle depuis le bloc « Offre » de la fiche prof.

**Retour visuel de « Comment avez-vous connu Academika ? »** (`repondreOrigine()`) : boutons désactivés et « Enregistrement… » immédiatement, l'encart **reste affiché** jusqu'au rechargement (le masquer laissait un écran vide pendant l'écriture puis le rechargement complet de la page : trois scripts CDN bloquants dans le `<head>`, puis `init()`). « Passer » n'écrit plus rien (`source` est déjà `NULL` à la création).

## Règle de déblocage des niveaux

**Source unique : la vue `public.niveaux_sous_theme`** (`db/vue-niveaux.sql`, créée en production le 10/10/2026 ; tests dans `db/vue-niveaux.test.sql`, retour arrière dans `db/vue-niveaux.rollback.sql`). `security_invoker = true` : la RLS de `resultats` s'applique à celui qui lit. Une ligne par élève et par sous-thème commencé (au moins une session non abandonnée).

* Réussite = `round(score/total*100) >= 70`. Niveau acquis = 5 réussites à ce niveau.
* Moyen ouvert si Facile acquis ; **Difficile ouvert si Facile ET Moyen acquis** (version stricte).
* Abandons (`resultats.abandonne = true`) exclus de tous les comptes.
* **À surveiller** (règle du 21/10/2026, remplace « 6 essais ou plus sans acquérir » ; exécutée en production le 21/10/2026, versionnée dans `db/vue-niveaux.sql`) : niveau en cours **Facile ou Moyen** non acquis, au moins **4 essais** à ce niveau ET au plus **1 réussite sur les 4 derniers** (par date, abandons exclus, sans limite d'ancienneté) ; le signal disparaît dès 2 réussites sur les 4 derniers. **Jamais au niveau Difficile** (décision du 21/10/2026) : un blocage en Difficile reste visible dans la grille comme une case « en cours » dorée, sans être mis en avant ; **aucun cas particulier côté pages** (elles lisent `a_surveiller`). Colonnes ajoutées en FIN de vue : `derniers_essais`, `dernieres_reussites` (au niveau courant ; 4 au plus) pour les phrases. Seuils (4 essais, 1 réussite sur 4) à réévaluer avec des données d'usage réelles (`docs/TODO.md`). Tests : `db/vue-niveaux.test.sql` (TEST 3, 9, 10). Compatibilité : `quiz.html` et `resultats.html` ne lisent que les colonnes d'origine ; seule la valeur de `a_surveiller` a changé.
* `resultats.html` (onglet « Tableau de bord ») lit aussi la vue pour son bloc « Dernier sous-thème travaillé » (ligne la plus récente, avec `niveau_courant`) et son tableau sous-thèmes × niveaux. Il charge **`js/catalogue.js`** (`SOUS_THEMES`, source destinée à devenir unique pour la liste des sous-thèmes) pour calculer les sous-thèmes « pas encore commencés » ; `suivi-parent.html` le charge aussi ; seul `quiz.html` garde sa copie de la liste (migration progressive), `api/generer.js` aussi (serveur).
* `quiz.html` (`verifierDeblocage()`) lit la vue et ne recalcule plus rien. `SEUIL_SESSIONS` / `SEUIL_PCT` y restent pour les textes et les barres, **sans valeur de règle** : toute modification de la règle se fait dans la vue.
* **`suivi-parent.html`** lit la vue (carte « Niveau atteint par sous-thème ») et charge `js/catalogue.js`. **Carte (21/10/2026)** : en-tête (« N commencés sur M »), bloc **« À surveiller » seul** (en premier, orange `#FFF1E3`, fine bordure `#E8892B` tout autour, absent s'il est vide ; phrase d'aide « Une aide ponctuelle peut l'aider à débloquer. » + lien cours particuliers seulement avec `cta: true`), puis la **grille sous-thème × niveau toujours visible** (plus de `<details>`, plus de blocs Acquis / En progression), puis la légende en carrés (Acquis / En cours / À surveiller / Pas encore ouvert, couleurs de `css/niveaux.css`) et, texte exact (`Niveaux.PHRASE_REGLE`) : « « 4 / 5 réussites » = 4 réussites obtenues sur les 5 nécessaires pour valider le niveau. Une réussite = au moins 4 bonnes réponses sur 5. Un niveau validé ouvre le niveau suivant. ». **Cases de la grille (format validé le 21/10/2026, option A)** : case ouverte non acquise = ligne 1 en gras « N / 5 réussites » (toujours au pluriel : 5 réussites nécessaires), ligne 2 plus petite (opacité 0,85) « en M essais » (« en 1 essai » au singulier ; M = `f_essais` / `m_essais` / `d_essais` de la vue, sessions terminées à CE niveau pour ce sous-thème, jamais le total du sous-thème), barre de 4 px (largeur N/5, `#D4A23C` en cours, `#E8892B` à surveiller, case à surveiller = même contenu sur fond orange) ; « ✓ Acquis » (vert, sans nombre d'essais) ; « Après le Facile » / « Après le Moyen » (gris) ; niveau ouvert jamais joué = style « en cours » (beige `#FBF4E4` / `#8a6416`, jamais le gris, réservé à « Pas encore ouvert »), ligne 1 « 0 / 5 réussites », ligne 2 « aucun essai », barre vide (piste visible, remplissage 0 %), identique sur la page, la fiche prof, le PDF et l'email. Jamais « en 0 essai ». **Un seul rendu** : `Niveaux.cellule(l, niveau)` renvoie `{ type, texte, detail, reussites, essais }` ; la page et la fiche prof (`celluleNiveau`), le PDF (`pdfCelluleNiveau`, avec barre dessinée en rectangles) et l'email (`celluleHtml` de `lib/bilan-email.js`, barre en cellules de tableau) en dérivent. **Phrase** : « [Sous-thème] : [N] réussite(s) sur ses 4 derniers essais au niveau [Niveau]. » (`phraseSurveiller`, lit `dernieres_reussites`) ; les cases de la grille, elles, affichent les réussites **cumulées** vers les 5 nécessaires (« 4 réussites sur 5 ») : deux informations différentes. Plus aucune copie locale de la règle. Le classement et le rendu de la carte vivent dans **`js/niveaux.js`** (script classique, un seul global `window.Niveaux`, échappement HTML interne ; `rendreCarteNiveaux(lignes, { cta })` avec `cta: true` par défaut, l'ancienne option `deplie` n'existe plus ; `Niveaux.cellule` = contenu des cases, `classerNiveaux` ne renvoie plus que `{ surveiller }` ; `js/catalogue.js` à charger avant) et ses styles dans **`css/niveaux.css`** (variables `--niv-*` propres au fichier, classe de titre `niv-titre`). `suivi-parent.html` les charge, PDF compris, et ne garde que la lecture de la vue (`chargerNiveaux`) et le dessin PDF (`pdfCelluleNiveau`, `pdfSectionNiveaux` : « À surveiller » en tête si non vide, puis la grille pleine largeur, en-tête répété à chaque page, une ligne n'est jamais coupée, légende en texte simple réservée avec la dernière ligne). `prof.html` les utilise aussi pour sa fiche élève (`rendreCarteNiveaux(lignes, { cta: false })`) et charge `js/catalogue.js`. Tests : `node lib/niveaux.manual-test.js` (faux navigateur, dont le format des cases : singulier / pluriel, jamais « en 0 essai », barre à 0 % et 80 %). `resultats.html` garde sa propre copie `niv-*`, hors de ce mécanisme.

## Détail des questions ratées (`resultats.questions_ratees_detail`)

Colonne `jsonb` **nullable**, ajoutée en production le 18/10/2026 (`db/resultats-questions-ratees-detail.sql`, exécuté à la main ; `notify pgrst, 'reload schema'` fait). Elle s'ajoute à `questions_ratees`, qui **continue d'être écrite exactement comme avant** (chaînes « thème — chapitre ou 40 premiers caractères de l'énoncé », préfixe `[Aucune idée] `, `["Quiz abandonné"]`) : aucun lecteur existant n'a changé de comportement à l'introduction de la colonne (`suivi-parent.html` et son `estAbandon()`, `prof.html` pour les anciennes sessions).

**Format** : liste de `{ id, enonce, aucune_idee }`, une entrée par question de la **banque** ratée ou marquée « je ne sais pas » (`aucune_idee: true`), dans l'ordre des questions du quiz. `id` = `questions_banque.id` ; `enonce` = énoncé **complet** tel que servi (`q.q`), plafonné à 2000 caractères ; la liste est plafonnée à 20 entrées.

| Valeur | Sens |
|---|---|
| `NULL` | session abandonnée, ou antérieure au 18/10/2026 |
| `[]` | aucune question ratée **avec id** : quiz parfait, ou quiz IA (les questions IA n'y figurent jamais ; leurs échecs restent dans `questions_ratees`) |
| liste non vide | détail des questions ratées de la banque |

**Écriture** (`api/quiz-resultat.js`) : la décision « avec ou sans détail » se prend sur la présence d'un **id entier** sur l'objet question (`api/generer.js` ajoute `id` aux questions de la banque, pas à celles de l'IA), jamais sur `source_questions` (champ du client). Un élément mal formé (null, énoncé absent) ne fait plus échouer l'enregistrement. **Repli** : si Supabase refuse l'insertion en citant `questions_ratees_detail`, un seul nouvel essai sans la colonne (avec `console.error`) — le résultat de l'élève passe avant le détail.

**Énoncé et id fournis par le client, non vérifiés** (comme le score aujourd'hui) : un élève peut y mettre n'importe quel texte, que le prof voit échappé sur ses propres données. La correction propre (lecture de l'énoncé par id côté serveur) relève de la vérification du score par id (`docs/TODO.md` n°27).

**Lecture** (`prof.html`, onglet Questions ratées, `agregerRatees`) : détail **non vide** → notion = énoncé complet normalisé (trim, espaces réduits), regroupement par énoncé normalisé (plusieurs ids peuvent partager un énoncé), ids affichés en petit (« #753 ») ; sinon (détail `NULL` ou `[]`) → chaînes de `questions_ratees`, comme avant. Domaine et sous-thème viennent toujours des colonnes `theme` / `sous_theme` de la ligne. Pendant la transition, une même question peut apparaître en version tronquée (anciennes sessions) et en version complète (nouvelles) : pas de fusion voulue.

**Lecture élève** (`resultats.html`, onglet Historique, `libellesRatees`) : détail **non vide** → un énoncé complet par entrée, dans l'ordre du détail, précédé de « [Aucune idée] » si `aucune_idee` est vrai, échappé par `esc()` ; sinon (détail `NULL` ou `[]`) → `questions_ratees` via `libelleRatee()`, qui retire le préfixe `r.theme — ` ou, à défaut, un préfixe « X — » où X est l'un des domaines de `SOUS_THEMES` (`js/catalogue.js`), jamais un « — » ailleurs. Sessions abandonnées : « Abandonné », inchangé. `prof.html` (onglet Questions ratées) trie les domaines par total d'échecs affichés décroissant, puis ordre de `THEMES`, puis ordre alphabétique.

**Droits** : les policies SELECT de `resultats` (élève, parent, prof) sont au niveau de la ligne et couvrent la colonne sans changement (aucun droit par colonne dans `db/`, à confirmer en base : `information_schema.column_privileges`). L'élève reçoit la colonne dans `select('*')` (`resultats.html`), qui l'affiche depuis le 18/10/2026 (cf. « Lecture » ci-dessus).

## CHANTIER — Mémoire des questions vues (terminé)

Quiz normal PR #24, durcissement du diagnostic PR #25, examen blanc PR #26, extraction du socle commun dans la PR qui a ajouté cette section.

Avant ce chantier, rien n'empêchait un élève de revoir indéfiniment les mêmes questions : ni mémoire des questions servies, ni filtre au tirage, sur **aucun** des deux parcours.

### Le mécanisme

Table `questions_vues` (`user_id`, `question_id`, `source`, contrainte unique sur le triplet, RLS `auth.uid() = user_id`). `source` vaut `'banque'` (quiz normal) ou `'examen'` (examen blanc) — les deux tables de questions partagent le même espace d'ids, c'est cette colonne qui les sépare.

Socle commun dans **`lib/questions-vues.js`** : contexte élève, lecture, purge, marquage, étanchéité des erreurs. L'accès passe par `memoireQuestionsVues('banque' | 'examen')`, qui lie la source une fois pour tout le fichier appelant — une source erronée répétée aux points d'appel enverrait un `DELETE` sur les questions vues de l'autre parcours, sans rien signaler.

**Ordre imposé partout : purge → tirage → marquage.** Purger après le marquage effacerait les questions qu'on vient de servir. Une session en cours n'est jamais affectée : le client garde ses questions en mémoire et ne relit pas la base pendant le quiz ou l'examen.

**Le marquage a lieu au tirage, pas à la correction.** C'est ce qui rend le test rapide : démarrer, noter les ids en console, abandonner, recommencer et vérifier le non-recouvrement. `api/quiz-resultat.js` n'a délibérément aucun rôle ici — il ne reçoit pas les ids des questions, et il n'est pas appelé de façon fiable en cas d'abandon (`beforeunload` est best-effort).

### Les deux seuils — ne pas les aligner

| Parcours | Seuil | Pourquoi |
|---|---|---|
| `api/generer.js` | **5** | Taille d'un tirage de quiz |
| `api/examen.js` | **6** | Le découpage en tiers ne rend 5 questions qu'à partir d'un pool de 6 (à 5, `floor(5/3)=1` donne 1+1+1=3) |

**Le 6 de l'examen n'est pas un réglage de confort.** Le filtrage fait rétrécir le pool à chaque examen ; avec un seuil à 5, on aurait fini par tirer dans un pool filtré de 5 → 3 questions par partie → **un examen à 17 questions noté sur 20**. Et `20` est codé en dur à une douzaine d'endroits de `examen.html` (`total:20` des deux `insert` `examens_blancs`, `pct: nbOk/20` du payload email, tous les libellés). L'examen serait parti au parent avec un score faux, sans aucune erreur visible. **Ne pas ramener ce seuil à 5 « par cohérence » avec `generer.js` : ce sont deux contraintes différentes.**

### Comportement

* **Quiz normal** — filtrage sur la combinaison thème/sous-thème/difficulté. Purge bornée à cette seule combinaison, les autres sous-thèmes intacts. Un pool de 5 énoncés distincts ou moins court-circuite tout le mécanisme (le tirage sert le pool entier de toute façon).
* **Examen blanc** — seuil et purge **par partie** : la purge ne porte que sur les ids des parties en reboucle. Trois requêtes au maximum quel que soit le nombre de parties concernées. Une partie de moins de 6 questions est laissée entièrement de côté : ni lue, ni purgée, ni marquée.
* **Chiffres de référence** : 45 questions par partie → **8 examens sans recouvrement, reboucle au 9ᵉ** (pas 9 : après 8 examens il reste 5 non-vues par partie, sous le seuil de 6).

### Le champ `vues` de la réponse — vocabulaire clos

| Champ | Valeurs |
|---|---|
| `raison` | `filtre` · `reboucle` · `pool_insuffisant` · `non_filtre` · `anonyme` · `config_absente` — et `applique` côté examen, où le détail est dans `parties` |
| `parties` | examen seulement, par partie : `filtre` · `reboucle` · `pool_insuffisant` |
| `echec` | `lecture` · `purge` · `marquage` · `inconnu` — **n'écrase jamais `raison`** |
| `statut` | code HTTP nu, absent si l'échec n'est pas une réponse HTTP |

**Aucune chaîne provenant de PostgREST ou de `fetch` ne part au client** : un corps d'erreur PostgREST révèle des noms de contraintes, de colonnes et de policies. Le détail complet ne va que dans le log Vercel, préfixe `[questions_vues]`.

### Trois choix délibérés — ne pas « corriger » lors d'un futur audit

* **Le filtre `user_id` dans les URL est redondant avec la RLS.** C'est une défense en profondeur voulue : il borne la lecture et surtout le `DELETE` même si la policy sautait, ou si ces requêtes passaient un jour par la clé service (qui contourne la RLS).
* **Le fail-open est assumé.** Toute panne du mécanisme laisse le quiz ou l'examen partir avec un tirage non filtré. Un mécanisme de confort ne doit pas empêcher un élève de travailler. Il n'est jamais silencieux pour autant : log Vercel + champ `vues`.
* **Une partie sous le seuil n'est pas marquée.** Elle n'est ni lue ni purgée, donc la marquer créerait des lignes que rien ne viendrait jamais nettoyer.

### Configuration

`NEXT_PUBLIC_SUPABASE_ANON_KEY` doit être posée sur les **trois scopes Vercel** (Production, Preview, Development). Il n'y a plus de repli en dur : son absence donne `raison: 'config_absente'` et un log explicite, plutôt qu'un fonctionnement apparent masquant une mauvaise configuration.

`lib/` ne compte pas dans la limite de 12 fonctions serverless du plan Hobby — Vercel ne compte que les fichiers sous `api/`, qui sont exactement **12 sur 12 depuis l'ajout d'`api/connexion-eleve.js` : plus aucune marge**, toute nouvelle fonction suppose d'en fusionner une autre (11 après la suppression d'`api/contact-cours.js`, le 04/10/2026, PR #96).

### Tests

**`node lib/questions-vues.manual-test.js`** — 107 assertions, faux Supabase en mémoire, les deux handlers exercés de bout en bout. Aucune dépendance, aucun accès réseau. À relancer après toute modification du mécanisme. Le fichier explique pourquoi il recopie les sources en `.mjs` dans un répertoire temporaire, et pourquoi il ne faut **pas** ajouter `"type": "module"` à `package.json` pour éviter ce détour.

**`node lib/tirage-familles.manual-test.js`** — tirage des 5 questions d'un quiz avec au plus une question par famille (colonne `questions_banque.famille`), complété au hasard s'il y a moins de 5 familles ; une question sans famille se comporte comme avant. Aucune dépendance.

### Reste ouvert

* **Découpage en tiers inopérant** (`api/examen.js`) : `acc`/`std`/`exp` sont découpés *après* `sort(() => Math.random() - 0.5)`, la stratification par difficulté ne produit rien. C'est aussi ce qui impose le seuil à 6 — le corriger rendrait le 9ᵉ examen sans recouvrement. À traiter avec le vrai sujet derrière : stratification réelle par difficulté, ou tirage aléatoire assumé.
* **Pas de dédoublonnage par énoncé sur `examen_questions`**, contrairement à `questions_banque`. Si deux lignes portent le même texte sous des ids différents, marquer l'une ne protège pas de l'autre.
* **`sort(() => Math.random() - 0.5)`** est un mélange biaisé, motif présent dans tout le dépôt.

## Note — Bilan manuel (`api/email.js`, type `bilan`) et désabonnement

**`bilan` (bouton manuel "Envoyer bilan parents", `prof.html`) — gating d'offre volontairement absent, désabonnement respecté.** Contrairement à `recap-journalier-user`, ce flux n'applique pas `peutRecevoirEmailDetaille` : il envoie TOUJOURS la version complète du bilan (cf. § Bilan parent ci-dessous). C'est un choix commercial assumé : ce bouton sert au prof à envoyer manuellement un échantillon détaillé à un parent en offre Libre, dans une logique de conversion vers l'offre Accompagné. Ne pas "corriger" en ajoutant le gating lors d'un futur audit. En revanche il **respecte `email_actif`** (depuis le 05/10/2026, TODO n°45 close) : depuis le 20/10/2026 le destinataire est lu dans le profil de l'élève (le navigateur n'envoie que `user_id`), et `parentDesabonne()` interroge `profils` (comparaison sans casse) ; si un profil portant cette adresse a `email_actif = false`, réponse `200 { success: false, raison: 'desabonne' }`, sans envoi, avant le quota ; `prof.html` affiche « Parent désabonné : bilan non envoyé. ». Une vérification impossible techniquement donne un 500 (le consentement prime, pas de fail-open).

### Emails : suivi contre démarches

* **Suivi — respectent `email_actif`, portent un lien « Se désabonner »** : `recap-journalier-user`, `brevet-blanc` (`raison: 'desabonne'` avant le quota), `bilan`, ainsi que les emails de `api/cron-rappel.js` (fin d'année, été, bilan périodique).
* **Démarches — ignorent `email_actif`, sans lien de désabonnement** : `inscription` (bienvenue), `resiliation-confirmee`, `reset-password`, `adresse-brevet`, `stage`, `resultats-brevet`. Ce sont des réponses à une action du parent ou des confirmations de service (la résiliation est une confirmation sur support durable). `contact-cours` n'est pas concerné (destiné à `contact@academika.fr`).
* **Page de désabonnement** (`desabonner.html`, `api/desabonner.js`) : promet la fin des « emails de suivi (récapitulatifs, bilans, résultats des examens en ligne) » et dit que les emails de démarches continuent. Le désabonnement porte sur **tout le foyer** (tous les profils de l'`email_parent`), comparaison sans casse (`ilike`, `*` refusé : joker PostgREST). Une adresse inconnue donne la même réponse qu'un succès (journal « 0 ligne », sans adresse). La colonne est versionnée dans `db/policies.sql` (`boolean NOT NULL DEFAULT true`).
* **Risque accepté (05/10/2026) : lien de désabonnement non signé** (désabonnement possible par simple adresse ; réabonnement manuel via contact@academika.fr). À revoir si : trafic réel, plainte, ou volume d'emails imposant le désabonnement en un clic (List-Unsubscribe).
* **Recherche `ilike` sur une saisie utilisateur : toujours via `escapeIlike()`** (échappe `\` `%` `_` et refuse `*`, joker PostgREST), avec refus explicite avant la requête. Faille constatée le 05/10/2026 : `*` dans `reset-password` visait tous les profils. `api/desabonner.js` applique sa propre validation équivalente.
* **Rattrapage du récap journalier (`api/cron-rappel.js`) : appels internes via le domaine de production.** Le cron appelle `https://www.academika.fr/api/email` (constante `BASE_URL_PROD`), pas `https://${req.headers.host}/api/email`. Constat du 07/10/2026 : 4 POST sans email envoyé ni session marquée ; cause supposée, non prouvée : l'URL propre au déploiement (`*.vercel.app`) est soumise à la Deployment Protection, sans en-tête de contournement. Domaine canonique `www` (l'apex redirige, ce qui ferait perdre `Authorization`). Une ligne de log par POST, préfixe `[cron-rappel][rattrapage]` (user_id tronqué à 8 caractères, date, statut, type de réponse, skip / erreur / « envoyé »), plus une synthèse ; **jamais d'adresse email dans ces logs** (`pourLog()` masque tout motif d'adresse). `api/stripe-webhook.js:249` garde l'ancien motif (cf. `docs/TODO.md` n°66).
* **Surveillance du cron (`api/cron-rappel.js`) : heartbeat Healthchecks.io.** Variable `HEALTHCHECK_URL_CRON_RAPPEL` (format `https://hc-ping.com/<uuid>`), posée sur Vercel en **Production uniquement** : ne pas la poser en Preview ni en Development, sinon les passages de test pingueraient la vraie check. Absente, le ping est ignoré (log `[cron-rappel][healthcheck] variable absente, ping ignoré`). Le handler envoie `/start` après la vérification du secret, puis à la fin (rattrapage et branche saisonnière terminés) un ping de succès **seulement si** `erreurs === 0` du rattrapage, `erreurs_saison === 0` (envois Resend non OK en fin d'année, été ou bilan périodique) **et** lecture des sessions réussie (statut OK et réponse tableau) ; sinon `/fail`, et une lecture en échec ajoute `lecture_sessions=echec` au corps. Une exception remontée au `catch` du handler envoie `/fail` avec le nom de l'erreur. Corps = compteurs uniquement (couples, traites, ignores, erreurs, `erreurs_saison`, emails de la branche saisonnière), jamais de user_id, prénom ni email. L'URL contient un identifiant secret : jamais en dur, jamais journalisée (les logs ne citent que le statut ou le nom de l'erreur). Un ping raté (délai max 5 s, erreurs attrapées) ne change ni le code de retour ni le déroulement du cron. **Horaire : `0 21 * * *` (UTC) dans `vercel.json` depuis le 11/10/2026 ; l'expression de la check Healthchecks doit rester identique à celle de `vercel.json` (`0 21 * * *`, UTC)** — toute modification de l'une impose celle de l'autre le même soir, sinon fausses alertes ou silence.

## Bilan parent (lot 3 du gating — cron de 21 jours et bouton prof)

**Un seul module : `lib/bilan-email.js`** (rendu, choix de version, lectures, écriture de l'historique), utilisé par `api/cron-rappel.js` (bilan périodique) ET par `api/email.js` (type `bilan`, bouton prof) : pas de nouvelle fonction Vercel (12/12). Tests : `node lib/bilan-email.manual-test.js` (151 assertions, fixture = sortie réelle de la vue pour 711bc196 au 21/10/2026 avec la nouvelle règle : seul Statistiques est à surveiller ; faux Supabase / Resend, horloge figée ; inclut les 17 lignes réelles de la vue de l'élève 711bc196, relevées le 20/10/2026, comparées à `js/niveaux.js` exécuté dans un faux navigateur : bloc « À surveiller » et grille identiques à la page parent, ligne à ligne).

* **Niveaux : une seule source.** Le bilan lit la vue `niveaux_sous_theme` (clé service, filtre `user_id`) et la classe avec `Niveaux.classerNiveaux` / `Niveaux.cellule` de `js/niveaux.js`, que le serveur `require()` : ce fichier exporte en CommonJS sous Node (`module.exports`) et pose `window.Niveaux` dans un navigateur. `Niveaux.cellule(l, niveau)` renvoie `{ type, texte, reussites }` (texte des cases) ; `celluleNiveau()` (page) et la grille de l'email en dérivent : **aucune copie de la règle ni du texte des cases**. Plus aucune moyenne, note /20, mention ni pourcentage de verdict (l'ancien bilan affichait « Calcul littéral · Difficile · Acquis » sur une difficulté seulement tentée : constat du 19/10/2026). **Aucun plafond de lignes** (décision du 20/10/2026), longueur bornée par le catalogue (au plus 20 sous-thèmes).
* **Version complète** (décision du 20/10/2026, phrase « à surveiller » du 21/10/2026) : activité de la période (sessions terminées, jours actifs en jours Paris, durée ; abandons exclus des trois chiffres, « (+ M interrompue(s)) » en petit) ; « Nouveaux niveaux validés depuis le dernier bilan » ; **bloc « À surveiller » seul** (les blocs Acquis et En progression n'existent plus dans l'email), mêmes phrases que la page parent (« [Sous-thème] : [N] réussite(s) sur ses 4 derniers essais au niveau [Niveau]. »), orange `#FFF1E3` / `#8A3F05` avec fine bordure `#E8892B` tout autour (pas de barre à gauche), suivi de « Une aide ponctuelle peut l'aider à débloquer. » + lien « Découvrir les cours particuliers » (`cours-particuliers.html`), absent s'il n'y a rien à surveiller ; **grille sous-thème × niveau** (Sous-thème | Facile | Moyen | Difficile, même ordre de lignes que le « détail par niveau » de `suivi-parent.html`, mêmes contenus de cases, couleurs de `css/niveaux.css`, barres en cellules de tableau, lisible à 360 px) ; légende (Acquis / En cours / À surveiller / Pas encore ouvert) et la phrase de règle `Niveaux.PHRASE_REGLE` (« « 4 / 5 réussites » = … Un niveau validé ouvre le niveau suivant. ») ; cases au format « N / 5 réussites » + « en M essais » + barre (cf. § suivi-parent ci-dessus) ; lien espace parent. **Version tronquée** : activité seule, « Le détail par sous-thème est disponible avec l'offre Accompagné. », bouton « Passer à Accompagné · 7,90 €/mois » (`suivi-parent.html`). Rendu en tableaux et styles en ligne, sans `<details>` ni CSS externe, tout texte de la base échappé.
* **Qui reçoit quoi (`choisirVersion`)** : avant `FIN_OFFRE_LANCEMENT` (ou simulation en aperçu) : complet pour tous ; après : complet si `estAccompagne` (aucune règle nouvelle) ; sinon complet pour le **premier bilan « utile »** (aucune ligne `historique_bilans` de cet élève avec `total_sessions > 0`), tronqué ensuite. Les bilans envoyés avant la bascule comptent. Une lecture de l'historique qui échoue **saute l'élève ce soir** (jamais de version devinée ; le cron repasse demain). Le texte « premier bilan » de l'intro (première ligne de l'historique) est distinct : simple rédaction. « Accès complet offert jusqu'au JJ/MM/AAAA » + lien espace parent : affiché dans le cron comme dans le bouton quand l'accès offert est le motif (ni abonnement ni cours particuliers, date non dépassée).
* **« Nouveaux niveaux validés »** : colonne `historique_bilans.niveaux_snapshot jsonb` (nullable ; `db/bilan-niveaux-snapshot.sql`, exécuté à la main), format `{ "<sous-thème>": ["facile","moyen"] }` = niveaux **acquis** à l'envoi, écrite pour tous les bilans (tronqués compris). Ancienne ligne à snapshot NULL : pas de ligne « nouveaux niveaux » (jamais de comparaison fausse) ; premier bilan : référence vide. Le bouton prof compare au dernier snapshot du cron et **n'écrit jamais `historique_bilans`** (la cadence de 21 jours n'est pas touchée). `moy_globale` et `sous_themes_snapshot` ne sont plus écrites (nullables, colonnes conservées). Repli si la colonne n'existe pas encore : lecture et écriture sans elle, `console.error`.
* **Bouton prof** : `POST /api/email { type:'bilan', user_id, apercu?, version? }` (jeton prof). **Période = les 21 derniers jours glissants** (et non « depuis le dernier bilan » comme le cron, qui garde sa période) ; le dernier bilan du cron ne sert qu'à comparer les niveaux. `apercu: true` renvoie `{ sujet, html }` sans envoi, sans quota ni écriture ; `version: 'complet' | 'tronque'` n'est honorée qu'avec `apercu`. Bouton « Aperçu du bilan » dans la fiche prof (iframe `sandbox` + `srcdoc`, choix complet / tronqué). L'ancien format (`emailParent`, `sousThemes`…) n'est plus lu : 400.
* **Garde d'envoi (`lib/garde-envoi.js`) — fail-closed.** Seul `VERCEL_ENV === 'production'` envoie à l'`email_parent` réel. Partout ailleurs (preview, development, variable absente) le **seul** destinataire possible est `EMAIL_TEST_DESTINATAIRE` (une adresse, variable du scope **Preview** uniquement, jamais lue dans une requête ; absente ou invalide : aucun envoi). `envoyerA()` revérifie au moment d'appeler Resend. Hors production, `api/cron-rappel.js` ne boucle JAMAIS sur les profils : ni rattrapage du récap, ni branches saisonnières, ni bilan de masse ; il exige `?test_user_id=<UUID>`, traite cet élève seul, n'écrit rien (ni `historique_bilans`, ni `alerte_envoyee`), cadence et pause ignorées, sujet `[TEST]` + bandeau, lien de désabonnement = adresse de test. `?simuler_bascule=1` (preview seulement, via `apresBascule`) simule l'après-bascule. Les crons Vercel ne tournent qu'en production : l'appel manuel d'une preview avec `CRON_SECRET` appelait auparavant le rattrapage, qui contacte la PRODUCTION (`BASE_URL_PROD`) et y envoie de vrais récaps. **Limite connue** : les autres envois (`adresse-brevet`, `stage`, `resultats-brevet`, `api/inscription-*.js`) n'ont pas ce garde (`docs/TODO.md`).

## Rappel — Workflow Git

**Une fois une PR mergée, ouvrir une nouvelle branche pour tout travail supplémentaire — ne jamais continuer à pousser sur une branche dont la PR est déjà fusionnée.** Incident constaté le 16/08/2026 : la branche `claude/academika-offers-pricing-9o9bjx` a reçu 6 commits après le merge de sa PR #21 ; seuls les 4 premiers ont été récupérés dans `main` par la suite, les 2 derniers (`992e5a1` — court-circuit `detailComplet` pendant la gratuité — et `628139d` — documentation associée dans CLAUDE.md) sont restés orphelins, jamais mergés, jusqu'à leur redécouverte fortuite ce même jour. Rien n'a été perdu (les commits existent toujours, `git show <hash>` les retrouve), mais le travail n'est jamais arrivé en production et sa disparition n'a été remarquée qu'après un test réel en boîte mail.

**Une branche neuve par chantier, pas la réutilisation de la même branche de session.** Renforce la règle ci-dessus plutôt que de la remplacer. Constaté le 15/09/2026 : trois pushes successifs sur `claude/ecstatic-fermi-epwhjr` alors que sa PR était déjà mergée — détecté et rattrapé à chaque fois (reset sur `main`, nouvelle PR), mais toujours après coup, jamais anticipé. Plutôt que de réutiliser la même branche pour chaque nouveau chantier et vérifier après coup si sa PR précédente est mergée, créer une branche neuve depuis `main` à jour au début de chaque chantier distinct.

**Ne jamais merger — c'est Marco qui merge, toujours.** Ne pas le proposer non plus : la décision de fusionner lui appartient, elle n'a pas à être remise sur la table à chaque PR.

**Toujours ouvrir la PR après avoir poussé une branche.** Sans PR, le travail reste invisible et on croit à tort le correctif déployé alors qu'il dort sur une branche.

**Ne jamais pousser directement sur `main`.**

## Arrêt obligatoire avant commit

Quand Marco a demandé à voir un diff avant commit, ou quand Claude propose lui-même de montrer quelque chose avant de committer :

**TERMINE TON TOUR après avoir affiché le diff.** N'exécute aucun `git commit`, `git push` ni ouverture de PR dans la même réponse.

Une phrase du type « je committe dès ton feu vert » suivie d'un commit dans la même réponse est une violation de cette règle, même si le contenu est correct. Le feu vert est un message de la part de Marco, pas une formule dans celle de Claude.

Cette règle s'applique aussi quand Claude est certain que le changement est trivial : c'est précisément dans ces cas-là qu'elle est facile à enfreindre sans conséquence visible, et c'est ce qui la rend inopérante le jour où le changement ne l'est pas.

## Rappel — tenue de docs/TODO.md

**La TODO ne contient que ce qui reste à faire.** À chaque clôture, supprimer le point terminé (ne pas cocher, ne pas marquer « traité ») ; ne garder, réécrit en action, que le reliquat éventuellement ouvert. L'historique est dans Git et les PR.

Chaque fois qu'un travail effectué dans une session résout, clôt, ou rend obsolète un point présent dans docs/TODO.md, appliquer cette règle dans le même commit que le travail effectué, sans qu'on ait besoin de le redemander. Si un sujet nouveau et non trivial apparaît en cours de session et n'est pas traité immédiatement, l'ajouter à docs/TODO.md dans la section la plus pertinente, sous forme de case à cocher non cochée. Ne pas reformuler ni réorganiser les lignes existantes à cette occasion — seulement supprimer, réécrire en action le reliquat, ou ajouter.

## Modification de docs/TODO.md

Avant de fermer ou modifier un point dans docs/TODO.md :
1. Chercher (grep) le sujet dans tout le fichier pour repérer TOUTES
   les sections qui en parlent, pas seulement celle qu'on modifie
   (un même sujet peut être mentionné à plusieurs endroits).
2. Montrer le diff complet avant de committer.
3. Ne jamais laisser un titre de section à jour au-dessus d'un texte
   resté périmé, ni l'inverse.

## Rappel — jeu de démo (`scripts/demo-lucas.sql`)

**Ne jamais coller le fichier entier dans l'éditeur SQL** (le bloc 4 supprime ce que les blocs précédents créent) ; exécuter bloc par bloc.

## Rappel méthodologique

Ne jamais exécuter de SQL, modifier RLS, ou toucher aux tables ci-dessus sans présenter d'abord : ce qui va changer, pourquoi, le risque principal, et un plan de test précis — puis attendre validation explicite. Tester une table/un changement à la fois, jamais un lot entier d'un coup. En cas de doute sur un usage client (une table lue/écrite directement depuis un fichier HTML), vérifier dans le code avant de formuler une hypothèse — ne pas supposer.
