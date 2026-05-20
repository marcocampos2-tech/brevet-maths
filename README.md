# 📐 Brevet Maths — Application QCM IA

Application de préparation au Brevet des collèges avec QCM générés par Claude (Anthropic).

## Stack
- **Next.js** (React) — frontend + API routes
- **Supabase** — base de données + authentification
- **Anthropic Claude** — génération des questions IA
- **Vercel** — hébergement gratuit

## Déploiement sur Vercel

### 1. Mettre le code sur GitHub
1. Va sur github.com → "New repository"
2. Nom : `brevet-maths`
3. Uploade tous ces fichiers

### 2. Connecter à Vercel
1. Va sur vercel.com → "Add New Project"
2. Importe ton repo GitHub `brevet-maths`
3. Ajoute les variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vkkgadwqumqqwpaayjac.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_3nwxCHSPliLzSB6B7BZYhw__sp7ToXI` |
| `ANTHROPIC_API_KEY` | Ta clé API Anthropic |
| `NEXT_PUBLIC_PROF_EMAIL` | Ton email professeur |

4. Clique "Deploy" !

### 3. Activer l'auth Supabase
Dans Supabase → Authentication → Settings :
- Désactive "Confirm email" pour que les élèves puissent se connecter sans confirmation (pour commencer)

## Pages
- `/` — Connexion / Inscription élève
- `/quiz` — Interface QCM pour les élèves
- `/resultats` — Historique des scores de l'élève
- `/prof` — Tableau de bord professeur (accès réservé à ton email)

## Fonctionnalités
- ✅ Inscription / connexion email + mot de passe
- ✅ Génération IA de 5 questions par session
- ✅ 6 thèmes du programme Brevet
- ✅ 3 niveaux de difficulté
- ✅ Correction immédiate avec explication
- ✅ Sauvegarde des scores en base de données
- ✅ Tableau de bord prof : scores, thèmes, questions ratées
