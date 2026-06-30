export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { theme, difficulte } = req.body

    // ── BANQUE EN PREMIER ──────────────────────────────────
    const questions = await getBanqueSupabase(theme, difficulte)
    if (questions.length > 0) {
      return res.status(200).json({ questions, source: 'banque' })
    }

    // ── IA EN SECOURS (si banque vide) ────────────────────
    const exemples = {

      'Nombres et calculs': `
Exemples de BONNES questions pour ce domaine :
Sous-thème Fractions et priorités opératoires :
- "Calcule : 3/4 + 2/3"
- "Calcule en respectant les priorités : 3 + 2 × (5 - 1)"
Sous-thème Puissances et écriture scientifique :
- "Écris 0,000045 en notation scientifique."
- "Calcule : 2³ × 2⁴"
Sous-thème Arithmétique (nombres premiers, divisibilité) :
- "Décompose 84 en produit de facteurs premiers."
- "Le nombre 91 est-il premier ?"
Sous-thème Pourcentages et proportionnalité :
- "Une pizza coûte 12€. Le restaurant offre une réduction de 25%. Quel est le nouveau prix ?"
- "Un article coûte 80€. Son prix augmente de 15%. Quel est le nouveau prix ?"
Sous-thème Calcul littéral (développer, factoriser, identités remarquables) :
- "Développe et réduis : 3(2x+5) - 2(x-1)"
- "Factorise : 6x² + 9x"
- "Développe : (x+5)²"
- "Factorise : x² - 16"
Sous-thème Équations du 1er degré et équations-produit :
- "Lucas pense à un nombre. Il le multiplie par 3 puis ajoute 7. Il obtient 28. Quel est ce nombre ?"
- "Résous : 5x - 3 = 2x + 9"
- "Résous : (x-2)(3x+6) = 0"
- "Une piscine rectangulaire a un périmètre de 36m. Sa longueur est le double de sa largeur. Quelles sont ses dimensions ?"`,

      'Organisation et gestion de données, fonctions': `
Exemples de BONNES questions pour ce domaine :
Sous-thème Statistiques (moyenne, médiane, étendue) :
- "Les notes d'un élève sont 8, 12, 15, 10, 14, 11. Calcule la moyenne."
- "Voici 7 notes classées : 8, 10, 11, 12, 13, 14, 16. Quelle est la médiane ?"
- "Les températures min et max ce mois sont 5° et 28°. Quelle est l'étendue ?"
Sous-thème Probabilités :
- "Un sac contient 3 billes rouges et 5 bleues. On tire une bille au hasard. Quelle est la probabilité de tirer une bille bleue ?"
- "On lance un dé équilibré. Quelle est la probabilité de NE PAS obtenir un 6 ?"
- "On lance une pièce puis un dé. Quelle est la probabilité d'obtenir pile ET un nombre impair ?"
Sous-thème Proportionnalité (pourcentages, vitesses, échelles) :
- "Un train roule à 180 km/h. Combien de temps met-il pour parcourir 270 km ?"
- "Sur une carte à l'échelle 1/25000, deux villes sont à 4 cm. Quelle est la distance réelle ?"
Sous-thème Fonctions affines et linéaires :
- "Un plombier facture 50€ de déplacement plus 30€ par heure. Exprime le prix p(x) en fonction du nombre d'heures x."
- "La fonction f est définie par f(x) = 3x - 5. Calcule f(4)."
- "Quel est l'antécédent de 7 par la fonction f(x) = 2x - 1 ?"
- "Une fonction affine passe par A(0;2) et B(3;8). Quelle est son expression ?"
INTERDITS ABSOLUS : mode, classe modale, P(A∩B), P(A∪B), probabilité conditionnelle, tirage sans remise, composition de fonctions, fonctions du second degré, discriminant, systèmes d'équations, notation abstraite sans contexte.`,

      'Espace et géométrie': `
Exemples de BONNES questions pour ce domaine :
Sous-thème Théorème de Pythagore :
- "Une échelle de 5m est appuyée contre un mur. Son pied est à 2m du mur. À quelle hauteur touche-t-elle le mur ?"
- "Un triangle a les côtés 6cm, 8cm et 10cm. Est-il rectangle ?"
- "Un rectangle mesure 8cm sur 6cm. Quelle est la longueur de sa diagonale ?"
Sous-thème Théorème de Thalès :
- "Dans un triangle ABC, MN est parallèle à BC. AM=4cm, AB=6cm, AN=3cm. Calcule AC."
Sous-thème Trigonométrie :
- "Dans un triangle rectangle, l'angle A vaut 35° et l'hypoténuse mesure 10cm. Calcule le côté opposé à A."
Sous-thème Aires, périmètres et volumes :
- "Un jardin circulaire a un rayon de 5m. Calcule son aire. (π≈3,14)"
- "Une boîte cylindrique a un rayon de 3cm et une hauteur de 10cm. Calcule son volume."
Sous-thème Transformations (symétrie, translation, rotation, homothétie) :
- "Le point A(2;3) subit une translation de vecteur (1;-2). Quelles sont les coordonnées de l'image ?"
Sous-thème Géométrie dans l'espace :
- "Une pyramide a une base carrée de 4cm de côté et une hauteur de 6cm. Calcule son volume."`,

      'Grandeurs, mesures et algorithmique': `
Exemples de BONNES questions pour ce domaine :
Sous-thème Aires et volumes :
- "Un carré a un périmètre de 24cm. Calcule son aire."
- "Un cylindre a un rayon de 5cm et une hauteur de 8cm. Calcule son volume. (π≈3,14)"
Sous-thème Conversions d'unités et vitesses :
- "Convertis 2,5 km en mètres."
- "Une voiture roule à 90 km/h. Quelle distance parcourt-elle en 20 minutes ?"
Sous-thème Agrandissement et réduction :
- "Une figure est agrandie avec un coefficient 3. Si un côté mesure 4cm, quelle est la mesure du côté agrandi ?"
Sous-thème Algorithmique Scratch :
- "Un programme Scratch répète 4 fois : avancer de 100 pas, tourner de 90°. Quelle figure est tracée ?"
- "Un programme met x à 3, puis ajoute 5 à x, puis multiplie x par 2. Quelle est la valeur finale de x ?"
- "Un programme répète 6 fois : avancer de 50 pas, tourner de 60°. Quelle figure est tracée ?"
- "Un programme : mettre n à 10, répéter 3 fois (ajouter 4 à n). Quelle est la valeur finale de n ?"
INTERDITS ABSOLUS : boucles Python, variables Python, fonctions Python — ce domaine utilise uniquement Scratch au niveau 3ème.`
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes et simples',
      'moyen': 'de niveau examen Brevet DNB, situations réalistes',
      'difficile': 'de niveau Brevet mention Très Bien, plusieurs étapes'
    }

    const chapitres = {
      'Nombres et calculs': [
        'Fractions', 'Priorités opératoires', 'Puissances', 'Écriture scientifique',
        'Nombres premiers', 'Divisibilité', 'PGCD', 'Pourcentages', 'Proportionnalité',
        'Vitesse', 'Calcul littéral', 'Développement', 'Factorisation',
        'Identités remarquables', 'Équations du 1er degré', 'Équations-produit'
      ],
      'Organisation et gestion de données, fonctions': [
        'Moyenne', 'Médiane', 'Étendue', 'Statistiques descriptives',
        'Probabilités simples', 'Événement contraire', 'Arbre des possibles',
        'Proportionnalité', 'Échelles', 'Vitesse',
        'Fonction affine', 'Fonction linéaire', 'Image et antécédent',
        'Tableau de valeurs', 'Graphique de fonction'
      ],
      'Espace et géométrie': [
        'Théorème de Pythagore', 'Théorème de Thalès', 'Trigonométrie',
        'Aires et périmètres', 'Volumes', 'Symétrie centrale',
        'Translation', 'Rotation', 'Homothétie', 'Géométrie dans l\'espace'
      ],
      'Grandeurs, mesures et algorithmique': [
        'Aires', 'Volumes', 'Conversions d\'unités', 'Vitesse',
        'Agrandissement', 'Réduction', 'Boucles Scratch',
        'Variables Scratch', 'Programmes de calcul'
      ]
    }

    const chapitresList = (chapitres[theme] || []).join('", "')

    const prompt1 = `Tu es un professeur de mathématiques expert au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le domaine "${theme}".

${exemples[theme] || ''}

RÈGLES OBLIGATOIRES :
1. Chaque question DOIT être ancrée dans une situation concrète du quotidien (sport, argent, cuisine, construction, voyages).
2. Les 4 options de réponse doivent être plausibles — pas trop faciles à éliminer.
3. L'explication doit être claire, étape par étape, sans contradiction.
4. Si la question nécessite un tableau de données, fournis-le dans le champ "tableau" : {"headers":["Notes","8","10","12","14"],"rows":[["Effectif","3","5","8","4"]]}
5. Pour les fonctions : tableau de valeurs dans "tableau" si nécessaire : {"headers":["x","-2","0","2","4"],"rows":[["f(x)","-1","3","7","11"]]}
6. La bonne réponse ne doit PAS toujours être en position A — varie les positions (A, B, C ou D).
7. L'explication DOIT correspondre exactement à la bonne réponse indiquée dans "bonne_reponse".
8. Pour le champ "chapitre", utilise UNIQUEMENT un de ces chapitres : "${chapitresList}"

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.
Format : [{"q":"question","chapitre":"Théorème de Thalès","tableau":null,"opts":["A","B","C","D"],"bonne_reponse":"A","explication":"explication étape par étape"}]`

    const response1 = await claudeCall(prompt1)

    if (response1.error) {
      return res.status(503).json({ error: '⏳ Service indisponible. Réessaie dans 1 minute !' })
    }

    const match = response1.text.match(/\[[\s\S]*\]/)
    if (!match) {
      return res.status(500).json({ error: '❌ Format invalide.' })
    }

    let questionsIA = JSON.parse(match[0])

    questionsIA = questionsIA.map(q => {
      const cleanString = (str) => str?.replace(/\s+/g, '').toLowerCase()
      const bonneReponseNettoyee = cleanString(q.bonne_reponse)
      let answer = q.opts.findIndex(opt => cleanString(opt) === bonneReponseNettoyee)
      return {
        q: q.q,
        chapitre: q.chapitre || '',
        tableau: q.tableau && q.tableau.headers ? q.tableau : null,
        figure: null,
        opts: q.opts,
        answer: answer !== -1 ? answer : 0,
        explication: q.explication
      }
    })

    const prompt2 = `Vérifie ces 5 questions de mathématiques et donne le numéro correct de la bonne réponse pour chacune (0=A, 1=B, 2=C, 3=D).
${questionsIA.map((q,i) => `Question ${i+1}: ${q.q}\n${q.tableau ? `Tableau: ${JSON.stringify(q.tableau)}\n` : ''}Options:\n${q.opts.map((o,j) => `${j}: ${o}`).join('\n')}`).join('\n\n')}
Réponds UNIQUEMENT avec un tableau JSON de 5 chiffres : [0, 2, 1, 3, 0]`

    const response2 = await claudeCall(prompt2)
    if (!response2.error) {
      const matchArray = response2.text.match(/\[[\s\S]*?\]/)
      if (matchArray) {
        try {
          const indices = JSON.parse(matchArray[0])
          indices.forEach((idx, i) => {
            if (typeof idx === 'number' && idx >= 0 && idx <= 3 && i < questionsIA.length) {
              questionsIA[i].answer = idx
            }
          })
        } catch(e) { console.log('Erreur vérification:', e.message) }
      }
    }

    res.status(200).json({ questions: questionsIA, source: 'ia' })

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

    const unique = data.filter((q, idx, arr) =>
      arr.findIndex(x => x.question.trim() === q.question.trim()) === idx
    )

    const shuffled = unique.sort(() => Math.random() - 0.5).slice(0, 5)

    return shuffled.map(q => {
      const opts = typeof q.opts === 'string' ? JSON.parse(q.opts) : q.opts
      const correcte = opts[q.answer]
      const shuffledOpts = [...opts].sort(() => Math.random() - 0.5)
      const newAnswer = shuffledOpts.indexOf(correcte)
      return {
        q: q.question,
        chapitre: q.chapitre || '',
        opts: shuffledOpts,
        answer: newAnswer,
        explication: q.explication,
        tableau: q.tableau ? (typeof q.tableau === 'string' ? JSON.parse(q.tableau) : q.tableau) : null,
        figure: q.figure ? (typeof q.figure === 'string' ? JSON.parse(q.figure) : q.figure) : null
      }
    })
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
        model: 'claude-sonnet-4-5',
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
