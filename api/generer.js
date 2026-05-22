export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  try {
    const { theme, difficulte } = req.body

    const contexte = {
      'Nombres et calculs': 'puissances, fractions, nombres relatifs, calcul littéral, factorisation, développement, pourcentages, proportionnalité',
      'Géométrie': 'théorème de Pythagore, théorème de Thalès, trigonométrie (sin/cos/tan), angles, triangles, cercles, transformations (symétrie, translation, rotation)',
      'Algèbre et équations': 'équations du premier degré, systèmes d\'équations, inéquations, problèmes algébriques',
      'Statistiques et probabilités': 'moyenne, médiane, étendue, fréquences, probabilités, tableaux de données, diagrammes',
      'Fonctions': 'fonctions linéaires et affines, tableau de valeurs, représentation graphique, lecture graphique, taux de variation',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations, probabilités, fonctions affines, statistiques'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début d\'année, questions directes sur les définitions et calculs simples',
      'moyen': 'de niveau examen du Brevet, similaires aux questions des annales officielles DNB 2022-2024',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes nécessitant plusieurs étapes de raisonnement'
    }

    const prompt = `Tu es un professeur de mathématiques expert en préparation au Brevet des collèges français (DNB).
Génère exactement 5 questions QCM ${niveaux[difficulte]} sur le thème "${theme}".
Les notions à couvrir sont : ${contexte[theme]}.
Inspire-toi du style des vrais sujets du Brevet DNB des années 2022, 2023 et 2024.
Chaque question doit avoir exactement 4 propositions plausibles dont une seule est correcte.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown.
Format exact : [{"q":"énoncé de la question","opts":["proposition A","proposition B","proposition C","proposition D"],"answer":0,"explication":"explication pédagogique de la bonne réponse"}]
"answer" est l'index 0-3 de la bonne réponse. Varie les bonnes réponses entre les questions.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    if (data.error) {
      if (data.error.type === 'overloaded_error') {
        return res.status(503).json({ error: '⏳ Claude est surchargé, réessaie dans 1 minute !' })
      }
      return res.status(500).json({ error: `Erreur : ${data.error.message}` })
    }
    const text = data.content.map(i => i.text || '').join('').trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return res.status(500).json({ error: "Format invalide, réessaie !" })
    const questions = JSON.parse(match[0])
    res.status(200).json({ questions })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  try {
    const { theme, difficulte } = req.body

    const contexte = {
      'Nombres et calculs': 'puissances, fractions, nombres relatifs, calcul littéral, factorisation, développement, pourcentages, proportionnalité',
      'Géométrie': 'théorème de Pythagore, théorème de Thalès, trigonométrie (sin/cos/tan), angles, triangles, cercles, transformations (symétrie, translation, rotation)',
      'Algèbre et équations': 'équations du premier degré, systèmes d\'équations, inéquations, problèmes algébriques',
      'Statistiques et probabilités': 'moyenne, médiane, étendue, fréquences, probabilités, tableaux de données, diagrammes',
      'Fonctions': 'fonctions linéaires et affines, tableau de valeurs, représentation graphique, lecture graphique, taux de variation',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations, probabilités, fonctions affines, statistiques'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début d\'année, questions directes sur les définitions et calculs simples',
      'moyen': 'de niveau examen du Brevet, similaires aux questions des annales officielles DNB 2022-2024',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes nécessitant plusieurs étapes de raisonnement'
    }

    const prompt = `Tu es un professeur de mathématiques expert en préparation au Brevet des collèges français (DNB).
Génère exactement 5 questions QCM ${niveaux[difficulte]} sur le thème "${theme}".
Les notions à couvrir sont : ${contexte[theme]}.
Inspire-toi du style des vrais sujets du Brevet DNB des années 2022, 2023 et 2024.
Chaque question doit avoir exactement 4 propositions plausibles dont une seule est correcte.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown.
Format exact : [{"q":"énoncé de la question","opts":["proposition A","proposition B","proposition C","proposition D"],"answer":0,"explication":"explication pédagogique de la bonne réponse"}]
"answer" est l'index 0-3 de la bonne réponse. Varie les bonnes réponses entre les questions.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    if (data.error) {
      if (data.error.type === 'overloaded_error') {
        return res.status(503).json({ error: '⏳ Claude est surchargé, réessaie dans 1 minute !' })
      }
      return res.status(500).json({ error: `Erreur : ${data.error.message}` })
    }
    const text = data.content.map(i => i.text || '').join('').trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return res.status(500).json({ error: "Format invalide, réessaie !" })
    const questions = JSON.parse(match[0])
    res.status(200).json({ questions })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
