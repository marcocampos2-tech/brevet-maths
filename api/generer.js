export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { theme, difficulte } = req.body

    const contexte = {
      'Nombres et calculs': 'puissances et racines carrées, notation scientifique, fractions irréductibles, PGCD par algorithme d\'Euclide, PPCM, nombres premiers, critères de divisibilité (2/3/5/9/10), décomposition en facteurs premiers, pourcentages, proportionnalité, calcul littéral, factorisation, développement',
      'Géométrie': 'théorème de Pythagore et sa réciproque, théorème de Thalès et sa réciproque, trigonométrie (sin/cos/tan), angles, triangles, cercles, transformations, aires et volumes (cylindre, cône, sphère, pyramide)',
      'Algèbre et équations': 'équations du premier degré, systèmes d\'équations à deux inconnues, inéquations, identités remarquables, équations du second degré par produit nul, développement et factorisation',
      'Statistiques et probabilités': 'moyenne arithmétique et pondérée, médiane, étendue, mode, fréquence relative, probabilité simple, événements indépendants, probabilité conditionnelle, tableaux de données',
      'Fonctions': 'fonctions linéaires et affines, tableau de valeurs, représentation graphique, taux de variation, fonctions croissantes/décroissantes, fonctions du second degré (parabole, racines, extremum), intersection de courbes',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations et systèmes, probabilités, fonctions affines et second degré, statistiques, PGCD/PPCM, nombres premiers, factorisation'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes avec des situations concrètes du quotidien',
      'moyen': 'de niveau examen Brevet DNB, avec des situations réalistes',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes avec plusieurs étapes'
    }

    const prompt1 = `Tu es un professeur de mathématiques expert au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Notions à couvrir : ${contexte[theme] || theme}.

RÈGLE 1 — CONTEXTE CONCRET :
Chaque question doit être ancrée dans une situation réelle du quotidien.
Exemples : recettes, sport, météo, voyages, argent, construction, jeux...
Mauvais : "Calcule P(A∪B) avec P(A)=0,4"
Bon : "Dans une classe, 40% font du sport et 50% de la musique, 20% font les deux. Calcule la probabilité qu'un élève fasse l'un ou l'autre."

RÈGLE 2 — QUESTION CLAIRE :
Chaque question doit clairement indiquer ce qu'on cherche.
La question doit commencer ou se terminer par un verbe d'action : Calcule, Trouve, Quelle est, Détermine, Résous...
Mauvais : "Un triangle a des côtés 3, 4 et 5."
Bon : "Un triangle a des côtés 3cm, 4cm et 5cm. Calcule l'aire de ce triangle."

RÈGLE 3 — EXPLICATION CLAIRE ET DÉFINITIVE :
L'explication doit être pédagogique, étape par étape, et ne JAMAIS se contredire.
INTERDIT absolument : "Attendez...", "Non erreur...", "Révision...", "En fait...", "Correction..."
L'explication doit aller dans un seul sens et se terminer par la réponse finale.
Mauvais : "x=5... Attendez, non, en fait x=3."
Bon : "On isole x. 2x=6. x=6÷2=3. La réponse est x=3."

RÈGLE 4 — TABLEAUX :
Pour stats/fonctions avec des données : crée un objet "tableau" structuré.
Sinon : écris "tableau": null.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.
Format : [{"q":"question claire","tableau":null,"opts":["A","B","C","D"],"bonne_reponse":"A","explication":"explication claire et définitive"}]`

    const response1 = await claudeCall(prompt1)

    if (response1.error) {
      const questions = await getBanqueSupabase(theme, difficulte)
      if (questions.length > 0) return res.status(200).json({ questions, source: 'banque' })
      return res.status(503).json({ error: '⏳ Service indisponible. Réessaie dans 1 minute !' })
    }

    const match = response1.text.match(/\[[\s\S]*\]/)
    if (!match) {
      const questions = await getBanqueSupabase(theme, difficulte)
      if (questions.length > 0) return res.status(200).json({ questions, source: 'banque' })
      return res.status(500).json({ error: '❌ Format invalide.' })
    }

    let questions = JSON.parse(match[0])

    questions = questions.map(q => {
      const cleanString = (str) => str?.replace(/\s+/g, '').toLowerCase()
      const bonneReponseNettoyee = cleanString(q.bonne_reponse)
      let answer = q.opts.findIndex(opt => cleanString(opt) === bonneReponseNettoyee)
      return {
        q: q.q,
        tableau: q.tableau && q.tableau.headers ? q.tableau : null,
        figure: null,
        opts: q.opts,
        answer: answer !== -1 ? answer : 0,
        explication: q.explication
      }
    })

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const prompt2 = `Résous cette question. Donne UNIQUEMENT le numéro de la bonne réponse (0, 1, 2 ou 3).\nQuestion : ${q.q}\n${q.tableau ? `Tableau : ${JSON.stringify(q.tableau)}` : ''}\nOptions :\n${q.opts.map((o, j) => `${j} : ${o}`).join('\n')}`
      const response2 = await claudeCall(prompt2)
      if (!response2.error) {
        const matchChiffre = response2.text.trim().match(/^[0-3]/)
        if (matchChiffre) {
          const verifIndex = parseInt(matchChiffre[0], 10)
          if (verifIndex !== q.answer) questions[i].answer = verifIndex
        }
      }
    }

    res.status(200).json({ questions, source: 'ia' })

  } catch(e) {
    console.log('Erreur générale:', e.message)
    try {
      const questions = await getBanqueSupabase(req.body?.theme, req.body?.difficulte)
      if (questions.length > 0) return res.status(200).json({ questions, source: 'banque' })
    } catch(e2) {}
    res.status(500).json({ error: '❌ Une erreur est survenue.' })
  }
}

async function getBanqueSupabase(theme, difficulte) {
  try {
    const SUPABASE_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_3nwxCHSPliLzSB6B7BZYhw__sp7ToXI'

    const url = `${SUPABASE_URL}/rest/v1/questions_banque?theme=eq.${encodeURIComponent(theme)}&difficulte=eq.${encodeURIComponent(difficulte)}&select=question,opts,answer,explication,tableau,figure`

    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return []

    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 5)

    return shuffled.map(q => ({
      q: q.question,
      opts: typeof q.opts === 'string' ? JSON.parse(q.opts) : q.opts,
      answer: q.answer,
      explication: q.explication,
      tableau: q.tableau ? (typeof q.tableau === 'string' ? JSON.parse(q.tableau) : q.tableau) : null,
      figure: q.figure ? (typeof q.figure === 'string' ? JSON.parse(q.figure) : q.figure) : null
    }))
  } catch(e) {
    console.log('Erreur Supabase:', e.message)
    return []
  }
}

async function claudeCall(prompt) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-fake-model',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!response.ok) return { error: 'Surchargé' }
    const data = await response.json()
    if (data.error) return { error: 'Erreur API' }
    const text = data.content.map(i => i.text || '').join('').trim()
    return { text }
  } catch(e) {
    return { error: e.message }
  }
}
