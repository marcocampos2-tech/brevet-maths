export default async function handler(req, res) {
  // Configuration des entêtes CORS pour autoriser les requêtes
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

    // ÉTAPE 1 : Prompt envoyé à Claude pour générer les 5 questions
    const prompt1 = `Tu es un professeur de mathématiques expert au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions à couvrir absolument : ${contexte[theme] || theme}.

RÈGLE ABSOLUE POUR LES TABLEAUX :
Si la question utilise ou nécessite un tableau de valeurs (notamment pour le thème "Fonctions" ou "Statistiques"), tu as l'INTERDICTION FORMELLE de dessiner le tableau avec du texte brut (comme des barres "|"). 
Tu DOIS obligatoirement créer et remplir l'objet "tableau" structuré dans le JSON.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte décoratif avant ou après, sans balises de code markdown.

Format EXACT de la structure :
[
  {
    "q": "énoncé de la question",
    "tableau": {
      "headers": ["x", "-2", "0", "2"],
      "rows": [["f(x)", "-7", "-3", "1"]]
    },
    "opts": ["opt0","opt1","opt2","opt3"],
    "bonne_reponse": "opt_correct",
    "explication": "calcul détaillé"
  }
]
Si la question ne nécessite aucun tableau, écris strictement "tableau": null.`

    const response1 = await claudeCall(prompt1)
    
    // Si l'IA sature, on renvoie l'erreur d'attente à l'écran
    if (response1.error) {
      return res.status(500).json({ error: '❌ ⏳ Claude est surchargé. Réessaie dans 1 minute !' })
    }

    const match = response1.text.match(/\[[\s\S]*\]/)
    if (!match) {
      return res.status(500).json({ error: '❌ Format de réponse invalide de la part de l’IA.' })
    }

    let questions = JSON.parse(match[0])

    // ÉTAPE 2 : Nettoyage et calcul automatique de l'index de la bonne réponse
    questions = questions.map(q => {
      const cleanString = (str) => str?.replace(/\s+/g, '').toLowerCase();
      const bonneReponseNettoyee = cleanString(q.bonne_reponse);
      let answer = q.opts.findIndex(opt => cleanString(opt) === bonneReponseNettoyee);
      
      return {
        q: q.q,
        tableau: q.tableau && q.tableau.headers ? q.tableau : null, 
        opts: q.opts,
        answer: answer !== -1 ? answer : 0, 
        explication: q.explication
      }
    })

    // ÉTAPE 3 : Double vérification de l'index par Claude pour éviter les décalages de réponses
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const prompt2 = `Résous cette question. Donne UNIQUEMENT le numéro de la bonne réponse (0, 1, 2 ou 3).\nQuestion : ${q.q}\n${q.tableau ? `Tableau : ${JSON.stringify(q.tableau)}` : ''}\nOptions :\n${q.opts.map((o, j) => `${j} : ${o}`).join('\n')}`

      const response2 = await claudeCall(prompt2)
      if (!response2.error) {
        const matchChiffre = response2.text.trim().match(/^[0-3]/);
        if (matchChiffre) {
          const verifIndex = parseInt(matchChiffre[0], 10);
          if (verifIndex !== q.answer) {
            questions[i].answer = verifIndex
          }
        }
      }
    }

    // Succès : envoi des 5 questions fraîches au frontend
    res.status(200).json({ questions })

  } catch(e) {
    console.log('Erreur générale :', e.message)
    res.status(500).json({ error: '❌ Une erreur est survenue lors de la génération.' })
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
        model: 'claude-3-5-sonnet-20241022',
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
