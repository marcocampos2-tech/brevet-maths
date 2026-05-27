export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { theme, difficulte } = req.body

    const contexte = {
      'Nombres et calculs': `Types de nombres : entiers, décimaux, relatifs (positifs/négatifs), rationnels (fractions). Règles des signes (ex: -3×(-4)=+12 ; -5+(-2)=-7).
Opérations sur fractions : addition/soustraction (même dénominateur), multiplication (num×num/den×den), division (multiplier par l'inverse). Fractions de référence : 1/2=0,5 ; 1/4=0,25 ; 3/4=0,75 ; 1/10=0,1 ; 1/100=0,01.
Priorités opératoires : parenthèses > puissances > ×÷ > +-.
Nombres premiers (liste : 2,3,5,7,11,13,17,19,23), décomposition en facteurs premiers (ex: 120=2³×3×5), critères de divisibilité par 2/3/5/9/10, fractions irréductibles.
Puissances : règles (aⁿ×aᵐ=aⁿ⁺ᵐ), carrés de 1 à 12 (1²=1...12²=144), puissances de 10 (10³=1000 ; 10⁻²=0,01), écriture scientifique (a×10ⁿ avec 1≤a<10), racines carrées parfaites (√4=2...√144=12).
Calcul littéral : vocabulaire (double=2x, triple=3x, moitié=x/2, carré=x², successeur=x+1), réduction (3x+2x²-5+4x=2x²+7x-5).
Développement : simple distributivité k(a+b)=ka+kb, double distributivité (a+b)(c+d)=ac+ad+bc+bd, identités remarquables pour développer : (a+b)²=a²+2ab+b², (a-b)²=a²-2ab+b², (a+b)(a-b)=a²-b².
Factorisation : par facteur commun évident (ex: 5x²+3x=x(5x+3)), différence de carrés pour équation produit nul (ex: x²-9=0 → (x+3)(x-3)=0).
Équations : ax+b=c, ax+b=cx+d, équation-produit nul (ax+b)(cx+d)=0.
Proportionnalité : quatrième proportionnelle (produit en croix), pourcentages (taux augmentation/diminution : -20%→×0,80), ratios, vitesse v=d/t, conversions km/h en m/s.
INTERDIT : factoriser avec (a+b)² ou (a-b)², discriminant, systèmes d'équations.`,

      'Géométrie': `Pythagore : sens direct (calculer un côté dans un triangle rectangle), réciproque/contraposée (prouver si un triangle est rectangle en comparant le carré du plus grand côté avec la somme des deux autres).
Thalès : sens direct (configuration triangle imbriqué ou papillon, calculer une longueur), réciproque/contraposée (prouver si deux droites sont parallèles en vérifiant l'égalité des rapports).
Trigonométrie dans le triangle rectangle UNIQUEMENT : SOH CAH TOA (sin=Opposé/Hypoténuse, cos=Adjacent/Hypoténuse, tan=Opposé/Adjacent), calculer une longueur ou un angle en degrés avec la calculatrice (arcsin, arccos, arctan).
Transformations : symétrie axiale (effet miroir par rapport à une droite), symétrie centrale (demi-tour autour d'un point), translation (glissement selon un vecteur), rotation (centre+angle+sens horaire/anti-horaire), homothétie (agrandissement/réduction avec rapport k positif ou négatif).
Repérage : coordonnées (x;y) dans un repère orthogonal, lire et placer des points.
Solides : reconnaître cube, pavé droit, prisme, cylindre, pyramide, cône, sphère.
Aires : carré (c²), rectangle (L×l), triangle (b×h/2), disque (π×r²), périmètre cercle (2πr).
Volumes : cylindre (π×r²×h), cône (π×r²×h/3), pyramide (base×h/3), sphère (4/3×π×r³), cube (c³), pavé droit (L×l×h) — formules données dans l'énoncé.
Conversions : longueurs (m,cm,mm), aires (m²,cm²), volumes (m³,dm³,cm³), équivalence 1dm³=1L.
Effets agrandissements : longueurs ×k → aires ×k², volumes ×k³.
INTERDIT : démonstrations complexes, géométrie dans l'espace avancée.`,

      'Algèbre et équations': `Développement : simple distributivité k(a+b)=ka+kb, double distributivité (a+b)(c+d)=ac+ad+bc+bd.
Identités remarquables pour développer UNIQUEMENT : (a+b)²=a²+2ab+b², (a-b)²=a²-2ab+b², (a+b)(a-b)=a²-b².
Factorisation : par facteur commun évident (ex: 5x²+3x=x(5x+3)), différence de carrés pour résoudre équation produit nul (ex: x²-9=0 → (x+3)(x-3)=0).
Réduction d'expressions littérales (ex: 3x+2x²-5+4x=2x²+7x-5).
Équations : ax+b=c, ax+b=cx+d, équation-produit nul (ax+b)(cx+d)=0.
Inéquations simples du premier degré (ax+b > c).
Vocabulaire : double (2x), moitié (x/2), carré (x²), successeur (x+1), prédécesseur (x-1).
INTERDIT : factoriser avec (a+b)² ou (a-b)², discriminant, systèmes d'équations complexes.`,

      'Statistiques et probabilités': `Statistiques : moyenne simple (somme÷effectif), moyenne pondérée (avec coefficients/effectifs), médiane (valeur centrale si effectif impair ; moyenne des deux valeurs centrales si effectif pair), étendue (max-min).
Lecture et exploitation de tableaux de données et diagrammes (barres, circulaires, courbes).
Proportionnalité dans les stats : fréquence relative (effectif÷effectif total).
Probabilités : vocabulaire (univers, issue, événement impossible P=0, certain P=1, contraire P(non A)=1-P(A)), probabilité d'un événement simple en situation d'équiprobabilité (cas favorables÷cas totaux).
Arbre des possibles : représenter et calculer des probabilités sur deux épreuves successives INDÉPENDANTES (ex: lancer un dé PUIS tirer une carte, lancer deux pièces).
INTERDIT ABSOLUMENT : mode (valeur la plus fréquente), espérance, probabilité conditionnelle P(A|B), tirage sans remise, P(A∩B), P(A∪B), dénombrement complexe. Ne JAMAIS poser de question sur "la valeur la plus fréquente" ou "le mode".`,

      'Fonctions': `Vocabulaire fondamental : définition de f(x), image d'un nombre (se lit sur l'axe des ordonnées vertical), antécédent d'un nombre (se lit sur l'axe des abscisses horizontal).
Modes de représentation : passer de formule algébrique → tableau de valeurs → graphique et inversement.
Fonction linéaire : f(x)=ax, droite passant par l'origine (0;0), modélise la proportionnalité, déterminer le coefficient a depuis un graphique ou une situation.
Fonction affine : f(x)=ax+b, coefficient directeur a (pente de la droite), ordonnée à l'origine b, identifier a et b depuis un graphique ou par le calcul avec deux points.
Taux de variation entre deux valeurs, fonctions croissantes (a>0) et décroissantes (a<0).
Intersection de deux droites : résoudre f(x)=g(x).
INTERDIT : fonctions du second degré, parabole, discriminant, fonctions trigonométriques.`,

      'Algorithmique': `Lecture et analyse d'un script Scratch pour déterminer le résultat final ou la figure tracée.
Boucles : comprendre "Répéter N fois" — ex: dessiner un carré = répéter 4 fois (avancer 100 + tourner 90°), hexagone = répéter 6 fois (avancer + tourner 60°), triangle équilatéral = répéter 3 fois (avancer + tourner 120°).
Variables : suivre pas à pas la valeur d'une variable qui change (ex: "Mettre x à 5" puis "Ajouter 3 à x" → x vaut 8, puis "Multiplier x par 2" → x vaut 16).
Instructions conditionnelles : suivre le chemin logique "Si [condition] alors [instructions] sinon [autres instructions]".
Programmes de calcul : "Choisir un nombre, multiplier par 2, ajouter 5, soustraire le nombre de départ" → trouver le résultat pour une valeur donnée ou montrer que le résultat est toujours le même.
Événements : comprendre "Quand le drapeau vert est cliqué", "Quand la touche X est pressée".
Questions typiques brevet : "Si on choisit le nombre 4 au départ, quel résultat affiche le programme ?", "Combien de fois le lutin avance-t-il ?", "Quelle figure est dessinée ?".`,

      'Mélange de tous les thèmes': `Mélange équilibré de toutes les notions du brevet DNB :
Nombres : fractions, puissances, écriture scientifique, racines carrées, priorités opératoires, pourcentages, proportionnalité, vitesse.
Algèbre : développement (distributivité + identités remarquables), factorisation (facteur commun + différence de carrés), équations, équation-produit nul.
Géométrie : Pythagore, Thalès, trigonométrie SOH CAH TOA, transformations, aires, volumes, conversions, effets agrandissements.
Stats/Probas : moyenne, médiane, étendue, probabilité simple, arbre des possibles.
Fonctions : fonctions linéaires et affines, image, antécédent, tableau de valeurs, graphique.
Algorithmique : Scratch, boucles, variables, instructions conditionnelles.
INTERDIT : mode, espérance, probabilité conditionnelle, discriminant, factoriser avec (a+b)² ou (a-b)².`
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
Si la question mentionne un tableau ou des données chiffrées, tu DOIS fournir ces données dans le champ "tableau" EXACTEMENT dans ce format :
{"headers":["Colonne1","Colonne2","Colonne3"],"rows":[["Ligne1","valeur1","valeur2"]]}
Pour les statistiques, les valeurs doivent être EN COLONNES (headers) et les catégories EN LIGNES (rows).
La première cellule de headers doit toujours avoir un label descriptif (Notes, Taille, Valeur, Score...), jamais vide.
Exemple stats notes/effectifs : {"headers":["Notes","8","10","12","14","16"],"rows":[["Effectif","2","5","7","6","3"]]}
Exemple stats tailles/fréquences : {"headers":["Taille","140cm","150cm","160cm","170cm"],"rows":[["Effectif","3","8","12","5"]]}
Pour les fonctions, le tableau de valeurs doit avoir x en première ligne et f(x) en deuxième ligne.
Exemple fonctions : {"headers":["x","-2","-1","0","1","2"],"rows":[["f(x)","-3","0","3","6","9"]]}
N'utilise JAMAIS d'autres clés que "headers" et "rows".
INTERDIT : mentionner "le tableau ci-dessous" sans fournir le tableau dans le champ "tableau".
Si pas de tableau : écris "tableau": null.

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
