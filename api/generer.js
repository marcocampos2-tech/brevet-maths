export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  try {
    const { theme, difficulte } = req.body

    const contexte = {
      'Nombres et calculs': 'puissances, fractions, nombres relatifs, calcul littéral, factorisation, développement, pourcentages, proportionnalité',
      'Géométrie': 'théorème de Pythagore, théorème de Thalès, trigonométrie (sin/cos/tan), angles, triangles, cercles, transformations',
      'Algèbre et équations': 'équations du premier degré, systèmes d équations, inéquations, problèmes algébriques',
      'Statistiques et probabilités': 'moyenne, médiane, étendue, fréquences, probabilités, tableaux de données',
      'Fonctions': 'fonctions linéaires et affines, tableau de valeurs, représentation graphique, taux de variation',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations, probabilités, fonctions affines, statistiques'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes sur définitions et calculs simples',
      'moyen': 'de niveau examen Brevet, similaires aux annales officielles DNB 2022-2024',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes avec plusieurs étapes'
    }

    const prompt = `Tu es un professeur de mathématiques expert en préparation au Brevet des collèges français (DNB).
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions à couvrir : ${contexte[theme] || theme}.
Inspire-toi du style des vrais sujets du Brevet DNB 2022-2024.
Chaque question a 4 propositions plausibles dont une seule est correcte.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans markdown.
Format : [{"q":"question","opts":["A","B","C","D"],"answer":0,"explication":"explication"}]
answer est l index 0-3 de la bonne réponse. Varie les bonnes réponses.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ error: `Erreur serveur (${response.status}). Réessaie dans quelques secondes.` })
    }

    const data = await response.json()

    if (data.error) {
      if (data.error.type === 'overloaded_error') {
        return res.status(503).json({ error: '⏳ Le service est surchargé en ce moment. Réessaie dans 1 minute !' })
      }
      if (data.error.type === 'authentication_error') {
        return res.status(401).json({ error: '🔑 Clé API invalide. Contacte ton professeur.' })
      }
      return res.status(500).json({ error: `Erreur : ${data.error.message}. Réessaie dans quelques secondes.` })
    }

    const text = data.content.map(i => i.text || '').join('').trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return res.status(500).json({ error: '❌ Réponse inattendue. Réessaie !' })
    const questions = JSON.parse(match[0])
    res.status(200).json({ questions })

  } catch(e) {
    res.status(500).json({ error: '❌ Une erreur est survenue. Vérifie ta connexion et réessaie.' })
  }
}
