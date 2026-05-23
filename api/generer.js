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
Génère exactement 10 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
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

    // ÉTAPE 2 : On calcule l'index correct (avec nettoyage strict des espaces)
    questions = questions.map(q => {
      // Nettoie la chaîne en enlevant tous les espaces et en mettant en minuscule
      const cleanString = (str) => str?.replace(/\s+/g, '').toLowerCase();
      
      const bonneReponseNettoyee = cleanString(q.bonne_reponse);
      let answer = q.opts.findIndex(opt => cleanString(opt) === bonneReponseNettoyee);
      
      return {
        q: q.q,
        opts: q.opts,
        answer: answer !== -1 ? answer : 0, // Sécurité par défaut si introuvable
        explication: q.explication
      }
    })

    // ÉTAPE 3 : Vérification stricte par Index numérique auprès de Claude
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const prompt2 = `Résous cette question de mathématiques. Regarde les options numérotées de 0 à 3 et donne UNIQUEMENT le numéro de la bonne réponse.

Question : ${q.q}
Options :
${q.opts.map((o, j) => `${j} : ${o}`).join('\n')}

Réponds UNIQUEMENT avec le chiffre de l'index (0, 1, 2 ou 3), rien d'autre.`

      const response2 = await claudeCall(prompt2)
      if (!response2.error) {
        // On extrait le premier chiffre entre 0 et 3 trouvé dans la réponse
        const matchChiffre = response2.text.trim().match(/^[0-3]/);
        
        if (matchChiffre) {
          const verifIndex = parseInt(matchChiffre[0], 10);
          
          if (verifIndex !== q.answer) {
            console.log(`Q${i+1} corrigée par index: ${q.answer} → ${verifIndex} ("${q.opts[verifIndex]}")`)
            questions[i].answer = verifIndex
          }
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
