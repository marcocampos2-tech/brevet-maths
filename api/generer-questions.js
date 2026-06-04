// /api/generer-questions.js
// Génère 15 questions pour le quiz quotidien (questions_banque)
// Appel : POST /api/generer-questions { "secret": "academika2026", "theme": "Nombres et calculs", "difficulte": "facile" }

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  const { secret, theme, difficulte } = req.body || {}
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  if (!theme || !difficulte) {
    return res.status(400).json({ error: 'theme et difficulte requis' })
  }

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const supaHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY,
    'Prefer': 'return=minimal'
  }

  // Mapping thème → chapitres
  const chapitres = {
    'Nombres et calculs': 'Fractions, Puissances, PGCD, Calcul littéral, Pourcentages, Proportionnalité',
    'Algèbre et équations': 'Équations du premier degré, Inéquations, Systèmes, Développement, Factorisation',
    'Géométrie': 'Pythagore, Thalès, Trigonométrie, Aires, Volumes, Transformations',
    'Statistiques et probabilités': 'Moyenne, Médiane, Étendue, Probabilité simple, Événement contraire',
    'Fonctions': 'Fonctions affines, Image, Antécédent, Représentation graphique, Tableau de valeurs',
    'Algorithmique': 'Boucles, Conditions, Variables, Scratch, Valeur finale après boucle'
  }

  const niveauDesc = {
    'facile': '1 seule notion, calcul direct, contexte simple, nombres entiers, énoncé court (2 lignes max). Un élève de 3e en difficulté doit pouvoir répondre en moins de 2 minutes.',
    'moyen': '2 notions combinées, contexte réaliste du quotidien, calcul en 2 étapes. Niveau attendu pour la moyenne au brevet.',
    'difficile': 'Plusieurs étapes de raisonnement, formulation proche du vrai brevet DNB, contexte plus élaboré. Nécessite de bien réfléchir.'
  }

  const prompt = `Tu es un enseignant de mathématiques expert en classe de troisième. Tu travailles avec des élèves en difficulté scolaire — les questions doivent être accessibles MAIS rigoureuses.

Mission : Génère exactement 15 questions QCM sur le thème "${theme}", niveau "${difficulte}".
Chapitres couverts : ${chapitres[theme] || theme}
Description du niveau : ${niveauDesc[difficulte]}

Format obligatoire — réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans backticks :
[
  {
    "question": "texte de la question",
    "opts": ["option A", "option B", "option C", "option D"],
    "answer": 2,
    "explication": "explication en 3 étapes"
  }
]

Règles OBLIGATOIRES :
- Exactement 4 options — une seule correcte
- Les 3 mauvaises options = erreurs classiques d'élèves, crédibles mais clairement fausses
- La position de answer DOIT varier : utilise 0, 1, 2 et 3 de façon équilibrée — environ 3-4 fois chaque position sur 15 questions
- L'EXPLICATION en 3 étapes maximum :
  Étape 1 : rappel de la formule ou méthode en français simple
  Étape 2 : application avec les valeurs de la question
  Étape 3 : calcul final et réponse claire
  → JAMAIS de félicitations, JAMAIS de "Bravo", "Excellent", "Parfait", "Tu gères", "Continue"
  → JAMAIS de correction en cours de route
  → Maximum 4 lignes
- Situations concrètes du quotidien : sport, argent, cuisine, construction, voyages
- Chaque question dans un contexte DIFFÉRENT
- Langage simple — une phrase = une idée
- Écrire "probabilité de..." en toutes lettres — JAMAIS P(), P(A)
- Écrire les formules en français — "Volume = base × hauteur" pas "V = Bh"

INTERDITS ABSOLUS :
- Mode, classe modale
- Probabilité conditionnelle, tirage sans remise
- Fonctions du second degré
- Notation abstraite sans contexte
- Répétition de contextes similaires entre questions`

  try {
    console.log(`Génération: ${theme} / ${difficulte}`)

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
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const claudeData = await claudeRes.json()
    if (!claudeRes.ok) throw new Error('Erreur Claude: ' + JSON.stringify(claudeData))

    const rawText = claudeData.content[0].text
    let questions
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      questions = JSON.parse(clean)
    } catch(e) {
      throw new Error('JSON invalide: ' + rawText.substring(0, 300))
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Aucune question générée')
    }

    // Construire les lignes pour questions_banque
    const rows = questions.map(q => ({
      theme,
      difficulte,
      question: q.question,
      opts: q.opts,
      answer: q.answer,
      explication: q.explication,
      tableau: null,
      figure: null
    }))

    // Insérer dans questions_banque
    const insertRes = await fetch(`${SUPA_URL}/rest/v1/questions_banque`, {
      method: 'POST',
      headers: supaHeaders,
      body: JSON.stringify(rows)
    })

    if (!insertRes.ok) {
      const err = await insertRes.json()
      throw new Error('Erreur insertion: ' + JSON.stringify(err))
    }

    // Distribution des answers
    const dist = [0,1,2,3].map(a => ({
      position: a,
      nb: rows.filter(r => r.answer === a).length
    }))

    console.log(`✅ ${rows.length} questions insérées — ${theme} / ${difficulte}`)

    return res.status(200).json({
      success: true,
      theme,
      difficulte,
      inserted: rows.length,
      distribution_answer: dist
    })

  } catch(e) {
    console.error('Erreur:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
