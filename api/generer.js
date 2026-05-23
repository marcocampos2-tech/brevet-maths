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
      'Algèbre et équations': 'équations du premier degré, systèmes equations, inéquations, problèmes algébriques',
      'Statistiques et probabilités': 'moyenne, médiane, étendue, fréquences, probabilités, tableaux de données',
      'Fonctions': 'fonctions linéaires et affines, tableau de valeurs, représentation graphique, taux de variation',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations, probabilités, fonctions affines, statistiques'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes sur définitions et calculs simples',
      'moyen': 'de niveau examen Brevet, similaires aux annales officielles DNB 2022-2024',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes avec plusieurs étapes'
    }

    // ÉTAPE 1 : Générer les questions
    const promptGeneration = `Tu es un professeur de mathématiques expert en préparation au Brevet des collèges français (DNB).
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions à couvrir : ${contexte[theme] || theme}.

RÈGLES STRICTES :
1. Calcule la bonne réponse AVANT d'écrire les options
2. Les 3 mauvaises réponses doivent être plausibles et proches de la bonne
3. Varie les positions de la bonne réponse (pas toujours index 0 ou 1)
4. Explique le calcul en détail dans "explication"
5. NE génère PAS d'option "je ne sais pas" - seulement 4 vraies propositions mathématiques

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans markdown.
Format : [{"q":"question","opts":["opt0","opt1","opt2","opt3"],"answer":0,"explication":"calcul détaillé"}]`

    const response1 = await claudeCall(promptGeneration)
    if (response1.error) return res.status(500).json({ error: response1.error })

    const text1 = response1.text
    const match1 = text1.match(/\[[\s\S]*\]/)
    if (!match1) return res.status(500).json({ error: '❌ Réponse inattendue. Réessaie !' })
    let questions = JSON.parse(match1[0])

    // ÉTAPE 2 : Vérification de chaque réponse
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const promptVerif = `Tu es un professeur de mathématiques. Voici une question QCM :

Question : ${q.q}
Options :
0 : ${q.opts[0]}
1 : ${q.opts[1]}
2 : ${q.opts[2]}
3 : ${q.opts[3]}

Calcule soigneusement et réponds UNIQUEMENT avec le chiffre 0, 1, 2 ou 3 correspondant à la bonne réponse. Rien d'autre.`

      const response2 = await claudeCall(promptVerif)
      if (!response2.error) {
        const verifText = response2.text.trim()
        const verifIndex = parseInt(verifText.match(/[0-3]/)?.[0])
        if (!isNaN(verifIndex) && verifIndex !== q.answer) {
          console.log(`Question ${i+1} corrigée : ${q.answer} → ${verifIndex}`)
          questions[i].answer = verifIndex
        }
      }
    }

    res.status(200).json({ questions })

  } catch(e) {
    res.status(500).json({ error: '❌ Une erreur est survenue. Réessaie.' })
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
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      return { error: '⏳ Claude est surchargé en ce moment. Réessaie dans 1 minute !' }
    }

    const data = await response.json()

    if (data.error) {
      if (data.error.type === 'overloaded_error') {
        return { error: '⏳ Claude est surchargé en ce moment. Réessaie dans 1 minute !' }
      }
      return { error: `Erreur : ${data.error.message}` }
    }

    const text = data.content.map(i => i.text || '').join('').trim()
    return { text }

  } catch(e) {
    return { error: e.message }
  }
}
