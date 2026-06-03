// /api/generer-brevet.js
// Génère 60 nouvelles questions pour l'examen blanc (brevet DNB)
// et les insère dans examen_questions
// Appel : POST /api/generer-brevet { "secret": "academika2025" }

export default async function handler(req, res) {

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  const { secret } = req.body || {}
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const supaHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY,
    'Prefer': 'return=minimal'
  }

  // Récupérer le numéro max existant
  const maxRes = await fetch(
    `${SUPA_URL}/rest/v1/examen_questions?select=numero&order=numero.desc&limit=1`,
    { headers: supaHeaders }
  )
  const maxData = await maxRes.json()
  const startNumero = maxData && maxData.length > 0 ? maxData[0].numero + 1 : 1

  // ── Les 4 parties du brevet DNB ──────────────────────────
  const parties = [
    {
      partie: 1,
      theme: 'Nombres et calculs',
      instructions: `Génère exactement 15 questions sur :
- 3 questions : Fractions avec priorités opératoires
- 3 questions : Puissances de 10 / écriture scientifique  
- 3 questions : Décomposition en facteurs premiers / PGCD
- 3 questions : Calcul littéral (développer ou réduire)
- 3 questions : Pourcentages / proportionnalité
Difficulté : questions 1-5 facile, 6-10 moyen, 11-15 difficile`
    },
    {
      partie: 2,
      theme: 'Organisation, données, fonctions',
      instructions: `Génère exactement 15 questions sur :
- 3 questions : Probabilité simple (urne, dé, roue)
- 3 questions : Probabilité avec événement contraire
- 3 questions : Médiane / étendue
- 3 questions : Moyenne pondérée (avec tableau de données dans la question)
- 3 questions : Fonctions affines (image, antécédent, graphique)
Difficulté : questions 1-5 facile, 6-10 moyen, 11-15 difficile`
    },
    {
      partie: 3,
      theme: 'Espace et géométrie',
      instructions: `Génère exactement 15 questions sur :
- 3 questions : Théorème de Pythagore
- 3 questions : Théorème de Thalès
- 3 questions : Trigonométrie (sin, cos, tan)
- 3 questions : Transformations (symétrie, rotation, translation)
- 3 questions : Aires et volumes
Difficulté : questions 1-5 facile, 6-10 moyen, 11-15 difficile`
    },
    {
      partie: 4,
      theme: 'Grandeurs, mesures, algorithmique',
      instructions: `Génère exactement 15 questions sur :
- 3 questions : Volume (cône, pyramide, boule)
- 3 questions : Agrandissement/réduction sur aires ou volumes
- 3 questions : Conversion de grandeurs
- 3 questions : Algorithmique — valeur finale après boucle
- 3 questions : Algorithmique — figure tracée par Scratch
Difficulté : questions 1-5 facile, 6-10 moyen, 11-15 difficile`
    }
  ]

  const prompt = (partie) => `Tu es un enseignant de mathématiques expert en classe de troisième et concepteur officiel de sujets pour le Diplôme National du Brevet (DNB) en France. Tu travailles avec des élèves en difficulté scolaire — les questions doivent être accessibles MAIS rigoureuses. Pas de cadeau, mais pas de piège inutile.

Mission : Génère exactement 15 questions QCM indépendantes, strictement conformes au programme officiel du Brevet des Collèges, inspirées des annales 2022-2025.

${partie.instructions}

STRUCTURE DE DIFFICULTÉ OBLIGATOIRE par groupe de 5 questions :
— Questions 1 à 5 (ACCESSIBLE) : 1 seule notion, calcul direct, contexte simple, nombres entiers ou décimaux simples, énoncé court (2 lignes max)
— Questions 6 à 10 (STANDARD) : 2 notions combinées, contexte réaliste du quotidien, calcul en 2 étapes, proche du vrai brevet
— Questions 11 à 15 (EXPERT) : plusieurs étapes de raisonnement, formulation proche du vrai brevet DNB, contexte plus élaboré, nécessite de bien réfléchir

Format obligatoire — réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans backticks :
[
  {
    "numero_local": 1,
    "chapitre": "nom du chapitre",
    "question": "texte de la question",
    "opts": ["option A", "option B", "option C", "option D"],
    "answer": 2,
    "explication": "explication détaillée étape par étape, encourageante et bienveillante"
  }
]

Règles OBLIGATOIRES :
- Exactement 4 options par question — une seule correcte
- Les 3 mauvaises options = erreurs classiques d'élèves réalistes et crédibles — pas trop évidentes
- La position de la bonne réponse (answer) DOIT varier équitablement : environ 3-4 fois chaque position (0,1,2,3) sur les 15 questions — JAMAIS la même position plus de 2 fois consécutives
- L'EXPLICATION suit ce format obligatoire en 3 étapes maximum :
  Étape 1 : rappel de la formule ou méthode en français simple (ex: "Pour trouver X, j'utilise...")
  Étape 2 : application avec les valeurs de la question (ex: "Ici, X = ...")
  Étape 3 : calcul final et réponse claire
  → Ton bienveillant, JAMAIS de correction en cours de route, JAMAIS de félicitations dans l'explication, maximum 4 lignes
- Pour les stats : inclure le tableau de données DANS le texte de la question
- Chaque question dans un contexte différent — AUCUNE répétition de contexte
- Langage simple et direct — une phrase = une idée

INTERDITS ABSOLUS :
- Mode, classe modale
- Probabilité conditionnelle, tirage sans remise, P(A∩B), P(A∪B)
- Fonctions du second degré, discriminant
- Notation abstraite sans contexte concret
- Questions identiques ou très proches des 180 questions déjà existantes
- Dans l'explication : hésiter, corriger en cours de route, utiliser "Correction :", "Revenons à..."`

  try {
    let allRows = []
    let numeroActuel = startNumero

    for (const partie of parties) {
      console.log(`Génération partie ${partie.partie}: ${partie.theme}`)

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt(partie) }]
        })
      })

      const claudeData = await claudeRes.json()
      if (!claudeRes.ok) throw new Error(`Erreur Claude partie ${partie.partie}: ` + JSON.stringify(claudeData))

      const rawText = claudeData.content[0].text

      // Parser JSON
      let questions
      try {
        const clean = rawText.replace(/```json|```/g, '').trim()
        questions = JSON.parse(clean)
      } catch(e) {
        throw new Error(`JSON invalide partie ${partie.partie}: ` + rawText.substring(0, 300))
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error(`Aucune question générée pour partie ${partie.partie}`)
      }

      // Construire les lignes pour Supabase
      const rows = questions.map((q, idx) => ({
        numero: numeroActuel + idx,
        theme: partie.theme,
        chapitre: q.chapitre || '',
        question: q.question,
        opts: q.opts,
        answer: q.answer,
        explication: q.explication,
        annee: '2026',
        partie: partie.partie
      }))

      allRows = [...allRows, ...rows]
      numeroActuel += questions.length

      console.log(`✅ Partie ${partie.partie}: ${questions.length} questions générées`)

      // Pause entre les appels pour éviter le rate limiting
      if (partie.partie < 4) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    // Insérer toutes les questions dans Supabase
    const insertRes = await fetch(`${SUPA_URL}/rest/v1/examen_questions`, {
      method: 'POST',
      headers: supaHeaders,
      body: JSON.stringify(allRows)
    })

    if (!insertRes.ok) {
      const err = await insertRes.json()
      throw new Error('Erreur insertion Supabase: ' + JSON.stringify(err))
    }

    // Vérification finale
    const stats = parties.map(p => ({
      partie: p.partie,
      theme: p.theme,
      nb: allRows.filter(r => r.partie === p.partie).length,
      distribution_answer: [0,1,2,3].map(a => ({
        position: a,
        nb: allRows.filter(r => r.partie === p.partie && r.answer === a).length
      }))
    }))

    console.log(`✅ Total: ${allRows.length} questions insérées (numéros ${startNumero} à ${numeroActuel-1})`)

    return res.status(200).json({
      success: true,
      total_insere: allRows.length,
      numero_debut: startNumero,
      numero_fin: numeroActuel - 1,
      stats
    })

  } catch(e) {
    console.error('Erreur generer-brevet:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
