export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { theme, difficulte } = req.body

    const exemples = {
      'Nombres et calculs': `
Exemples de BONNES questions pour ce thème :
- "Une pizza coûte 12€. Le restaurant offre une réduction de 25%. Quel est le nouveau prix ?"
- "Un train roule à 180 km/h. Combien de temps met-il pour parcourir 270 km ?"
- "Écris 0,000045 en notation scientifique."
- "Simplifie la fraction 36/48."
- "Développe et réduis : 3(2x+5) - 2(x-1)"
- "Décompose 84 en produit de facteurs premiers."
- "Calcule : 2³ × 2⁴"
- "Un article coûte 80€. Son prix augmente de 15%. Quel est le nouveau prix ?"`,

      'Géométrie': `
Exemples de BONNES questions pour ce thème :
- "Une échelle de 5m est appuyée contre un mur. Son pied est à 2m du mur. À quelle hauteur touche-t-elle le mur ?"
- "Un triangle a les côtés 6cm, 8cm et 10cm. Est-il rectangle ?"
- "Dans un triangle ABC, MN est parallèle à BC. AM=4cm, AB=6cm, AN=3cm. Calcule AC."
- "Un jardin circulaire a un rayon de 5m. Calcule son aire. (π≈3,14)"
- "Un rectangle mesure 8cm sur 6cm. Quelle est la longueur de sa diagonale ?"
- "Dans un triangle rectangle, l'angle A vaut 35° et l'hypoténuse mesure 10cm. Calcule le côté opposé à A."`,

      'Algèbre et équations': `
Exemples de BONNES questions pour ce thème :
- "Lucas pense à un nombre. Il le multiplie par 3 puis ajoute 7. Il obtient 28. Quel est ce nombre ?"
- "Développe et réduis : (2x+3)(x-4)"
- "Résous : 5x - 3 = 2x + 9"
- "Factorise : 6x² + 9x"
- "Résous : (x-2)(3x+6) = 0"
- "Développe : (x+5)² "
- "Une piscine rectangulaire a un périmètre de 36m. Sa longueur est le double de sa largeur. Quelles sont ses dimensions ?"
- "Factorise : x² - 16"`,

      'Statistiques et probabilités': `
Exemples de BONNES questions pour ce thème :
- "Les notes d'un élève sont 8, 12, 15, 10, 14, 11. Calcule la moyenne."
- "Voici les températures de la semaine : 12°, 18°, 15°, 20°, 9°, 16°, 14°. Quelle est la médiane ?"
- "Les températures min et max ce mois sont 5° et 28°. Quelle est l'étendue ?"
- "Un sac contient 3 billes rouges, 5 bleues et 2 vertes. On tire une bille au hasard. Quelle est la probabilité de tirer une bille bleue ?"
- "On lance un dé équilibré. Quelle est la probabilité de NE PAS obtenir un 6 ?"
- "On lance une pièce puis un dé. Quelle est la probabilité d'obtenir pile ET un nombre impair ?"
- "Dans une classe de 25 élèves, 10 ont eu plus de 12. Quelle est la fréquence relative ?"

INTERDITS ABSOLUS : mode, classe modale, système d'équations à deux inconnues, P(A∩B), P(A∪B), probabilité conditionnelle, tirage sans remise, notation abstraite sans contexte (ex: "P(A)=0,6").`,

      'Fonctions': `
Exemples de BONNES questions pour ce thème :
- "Un plombier facture 50€ de déplacement plus 30€ par heure. Exprime le prix p(x) en fonction du nombre d'heures x."
- "La fonction f est définie par f(x) = 3x - 5. Calcule f(4)."
- "Une fonction affine passe par A(0;2) et B(3;8). Quelle est son expression ?"
- "La fonction f(x) = 2x + 1 est-elle croissante ou décroissante ?"
- "Quel est l'antécédent de 7 par la fonction f(x) = 2x - 1 ?"
- "Un taxi facture 2€ par km plus 5€ de prise en charge. Quelle est la fonction donnant le prix en fonction des km ?"

INTERDITS ABSOLUS : composition de fonctions g(x)=f(f(x)), fonctions du second degré, discriminant, systèmes d'équations.`,

      'Algorithmique': `
Exemples de BONNES questions pour ce thème :
- "Un programme Scratch répète 4 fois : avancer de 100 pas, tourner de 90°. Quelle figure est tracée ?"
- "Un programme met x à 3, puis ajoute 5 à x, puis multiplie x par 2. Quelle est la valeur finale de x ?"
- "Un programme répète 6 fois : avancer de 50 pas, tourner de 60°. Quelle figure est tracée ?"
- "Un programme : mettre n à 10, répéter 3 fois (ajouter 4 à n). Quelle est la valeur finale de n ?"
- "Un programme affiche les nombres de 1 à 5 en ajoutant 1 à chaque répétition. Combien de fois la boucle s'exécute-t-elle ?"`,

      'Mélange de tous les thèmes': `
Génère 5 questions variées, UNE par thème parmi : Nombres et calculs, Géométrie, Algèbre, Statistiques, Fonctions.
Chaque question doit être dans le style des exemples suivants :
- Nombres : "Un article coûte 80€ soldé à 30%. Quel est le prix final ?"
- Géométrie : "Une échelle de 5m a son pied à 2m du mur. À quelle hauteur touche-t-elle le mur ?"
- Algèbre : "Résous : 3x + 5 = 2x + 12"
- Stats : "Un sac a 4 billes rouges et 6 bleues. Probabilité de tirer une rouge ?"
- Fonctions : "f(x) = 2x + 3. Calcule f(5)."

INTERDITS : mode, classe modale, composition de fonctions, systèmes d'équations, probabilité conditionnelle, notation abstraite.`
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes et simples',
      'moyen': 'de niveau examen Brevet DNB, situations réalistes',
      'difficile': 'de niveau Brevet mention Très Bien, plusieurs étapes'
    }

    const prompt1 = `Tu es un professeur de mathématiques expert au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".

${exemples[theme] || exemples['Mélange de tous les thèmes']}

RÈGLES OBLIGATOIRES :
1. Chaque question DOIT être ancrée dans une situation concrète du quotidien (sport, argent, cuisine, construction, voyages).
2. Les 4 options de réponse doivent être plausibles — pas trop faciles à éliminer.
3. L'explication doit être claire, étape par étape, sans contradiction.
4. Si la question nécessite un tableau de données, fournis-le dans le champ "tableau" : {"headers":["Notes","8","10","12","14"],"rows":[["Effectif","3","5","8","4"]]}
5. Pour les fonctions : tableau de valeurs dans "tableau" si nécessaire : {"headers":["x","-2","0","2","4"],"rows":[["f(x)","-1","3","7","11"]]}

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.
Format : [{"q":"question","tableau":null,"opts":["A","B","C","D"],"bonne_reponse":"A","explication":"explication étape par étape"}]`

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
