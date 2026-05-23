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

    // ÉTAPE 1 : Générer les questions SANS index - Claude donne la bonne réponse en texte
    const prompt1 = `Tu es un professeur de mathématiques expert au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions : ${contexte[theme] || theme}.

IMPORTANT : Pour chaque question, tu dois :
1. Calculer la bonne réponse
2. Écrire la bonne réponse dans le champ "bonne_reponse" EXACTEMENT comme elle apparaît dans "opts"
3. Ne PAS mettre de champ "answer"

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans markdown.
Format EXACT :
[{"q":"question","opts":["opt0","opt1","opt2","opt3"],"bonne_reponse":"opt_correct","explication":"calcul détaillé"}]

Exemple :
[{"q":"Combien font 3x+2=11 ?","opts":["x=2","x=3","x=4","x=5"],"bonne_reponse":"x=3","explication":"3x=9 donc x=3"}]`

    const response1 = await claudeCall(prompt1)
    if (response1.error) return res.status(500).json({ error: response1.error })

    const match = response1.text.match(/\[[\s\S]*\]/)
    if (!match) return res.status(500).json({ error: '❌ Réponse inattendue. Réessaie !' })

    let questions = JSON.parse(match[0])

    // ÉTAPE 2 : On calcule nous-mêmes l'index correct
    questions = questions.map(q => {
      const bonneReponse = q.bonne_reponse?.trim()
      let answer = q.opts.findIndex(opt => opt.trim() === bonneReponse)
      
      // Si pas trouvé exactement, cherche une correspondance partielle
      if (answer === -1) {
        answer = q.opts.findIndex(opt => 
          opt.trim().toLowerCase() === bonneReponse?.toLowerCase()
        )
      }
      
      // Si toujours pas trouvé, vérifie avec Claude
      if (answer === -1) answer = 0

      return {
        q: q.q,
        opts: q.opts,
        answer,
        explication: q.explication
      }
    })

    // ÉTAPE 3 : Vérification — Claude confirme la bonne réponse pour chaque question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const prompt2 = `Résous cette question de mathématiques et réponds UNIQUEMENT avec la bonne réponse parmi les options, EXACTEMENT comme écrite.

Question : ${q.q}
Options : ${q.opts.map((o,j) => `${j}: "${o}"`).join(', ')}

Réponds UNIQUEMENT avec le texte exact de la bonne réponse, rien d'autre.`

      const response2 = await claudeCall(prompt2)
      if (!response2.error) {
        const verifReponse = response2.text.trim()
        const verifIndex = q.opts.findIndex(opt => 
          opt.trim().toLowerCase() === verifReponse.toLowerCase() ||
          verifReponse.toLowerCase().includes(opt.trim().toLowerCase())
        )
        if (verifIndex !== -1 && verifIndex !== q.answer) {
          console.log(`Q${i+1} corrigée: "${q.opts[q.answer]}" → "${q.opts[verifIndex]}"`)
          questions[i].answer = verifIndex
        }
      }
    }

    res.status(200).json({ questions })

  } catch(e) {
    console.log('Erreur:', e.message)
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
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      return { error: '⏳ Claude est surchargé. Réessaie dans 1 minute !' }
    }

    const data = await response.json()
    if (data.error) {
      if (data.error.type === 'overloaded_error') {
        return { error: '⏳ Claude est surchargé. Réessaie dans 1 minute !' }
      }
      return { error: `Erreur : ${data.error.message}` }
    }

    const text = data.content.map(i => i.text || '').join('').trim()
    return { text }

  } catch(e) {
    return { error: e.message }
  }
}
