# TODO consolidé — 02/09/2026

*Document de référence reconstitué à partir de la mémoire du chantier et de plusieurs passes de recherche dans l'historique des conversations. Pas de garantie d'exhaustivité à 100% (limite structurelle d'une recherche par mots-clés) — à compléter vous-même si un sujet manque encore.*

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
4. **`index.html`** — corriger "après chaque session" en "après chaque journée d'activité"
5. **Design system unifié** (`style.css` marketing vs CSS inline `quiz.html`/`resultats.html`) — plan déjà validé (Claude Design pour le design system, puis handoff Claude Code), jamais exécuté ; plus pertinent maintenant que le compte Instagram est actif et peut montrer ces pages
6. **Réflexion produit non tranchée** : extension à un site dédié 4ème et/ou 2nde pour septembre 2026, mentionnée à deux reprises, jamais retranchée
7. **URL trackée dédiée pour le flyer** (`/flyer`, sur le modèle de `/insta`) — le bouton "Flyer / affiche" de l'encart origine capture une déclaration du parent, pas une mesure fiable : un parent ayant vu le flyer puis cherché sur Google répondra "Recherche internet" en toute bonne foi. Les deux mécanismes sont complémentaires (l'URL trackée ne capte pas un parent qui tape academika.fr directement plutôt que de scanner le QR code)

---

## 🔵 La Hulotte

1. **PPWR Aluplast** — attestation en cours, écart déclaration PFAS à combler
2. **PMS gap analysis** — écarts critiques identifiés (Food Fraud/VACCP absent, rappel simulé non documenté, validations DLC organoleptiques seulement) — pas de suite actée
3. **Écart consommation Crème UHT** (1%→21% T1 2026) — signalé, pas de suite actée

---

## ⚪ Projet conseil IA/data (agri-food)

1. **Phase 0** — objectif reformulé : accumuler 3-5 problèmes business chiffrables (comme le cas mascarpone) avant de formuler une offre. Dernier point d'étape : bascule vers un test IoT décidée, résultat jamais confirmé
