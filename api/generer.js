// Banque de secours intelligente classée par thèmes et difficultés en cas claude plainte
const banqueDeSecours = [
  // --- THÈME : FONCTIONS ---
  {
    "theme": "Fonctions",
    "difficulte": "facile",
    "q": "Soit la fonction g définie par g(x) = 4x. Quelle est l'image de 3 par g ?",
    "tableau": null,
    "opts": ["7", "12", "1", "34"],
    "answer": 1,
    "explication": "Pour trouver l'image de 3, on remplace x par 3 dans l'expression : g(3) = 4 * 3 = 12."
  },
  {
    "theme": "Fonctions",
    "difficulte": "moyen",
    "q": "À l'aide du tableau de valeurs ci-dessous, détermine l'image de 2 par la fonction f :",
    "tableau": { 
      "headers": ["x", "-1", "0", "2", "5"], 
      "rows": [["f(x)", "4", "1", "-3", "-9"]] 
    },
    "opts": ["4", "1", "-3", "2"],
    "answer": 2,
    "explication": "On cherche 2 sur la première ligne (x). On lit sa valeur correspondante juste en dessous sur la ligne f(x), qui est -3."
  },
  {
    "theme": "Fonctions",
    "difficulte": "difficile",
    "q": "Une fonction affine f est telle que f(0) = 2 et f(3) = 11. Quelle est son expression ?",
    "tableau": null,
    "opts": ["f(x) = 3x + 2", "f(x) = 2x + 3", "f(x) = 3x - 2", "f(x) = 4x + 2"],
    "answer": 0,
    "explication": "Le taux de variation est (11 - 2) / (3 - 0) = 9 / 3 = 3. L'ordonnée à l'origine est f(0) = 2. L'expression est donc f(x) = 3x + 2."
  },

  // --- THÈME : GÉOMÉTRIE ---
  {
    "theme": "Géométrie",
    "difficulte": "facile",
    "q": "Un triangle ABC est rectangle en A tel que AB = 3 cm et AC = 4 cm. Combien mesure l'hypoténuse BC ?",
    "tableau": null,
    "opts": ["5 cm", "7 cm", "25 cm", "12 cm"],
    "answer": 0,
    "explication": "D'après le théorème de Pythagore : BC² = AB² + AC² = 3² + 4² = 9 + 16 = 25. Donc BC = √25 = 5 cm."
  },
  {
    "theme": "Géométrie",
    "difficulte": "moyen",
    "q": "Dans un triangle RST rectangle en R, on sait que RS = 5 cm et l'angle S mesure 30°. Quelle formule utiliser pour calculer l'hypoténuse ST ?",
    "tableau": null,
    "opts": ["Le sinus de l'angle S", "Le cosinus de l'angle S", "La tangente de l'angle S", "Le théorème de Thalès"],
    "answer": 1,
    "explication": "On connaît le côté adjacent (RS) et on cherche l'hypoténuse (ST). On utilise donc le Cosinus : cos(S) = adjacent / hypoténuse."
  },
  {
    "theme": "Géométrie",
    "difficulte": "difficile",
    "q": "Des droites (AB) et (CD) sont coupées par des droites sécantes en un point O formant une configuration de Thalès. Si OA = 3, OB = 6, OC = 2, et les droites (AC) et (BD) sont parallèles, combien mesure OD ?",
    "tableau": null,
    "opts": ["4", "5", "1", "9"],
    "answer": 0,
    "explication": "D'après le théorème de Thalès, OA/OB = OC/OD, soit 3/6 = 2/OD. Par produit en croix, OD = (6 * 2) / 3 = 12 / 3 = 4."
  },

  // --- THÈME : NOMBRES ET CALCULS / ALGÈBRE ---
  {
    "theme": "Nombres et calculs",
    "difficulte": "facile",
    "q": "Calcule la valeur de la fraction suivante : A = 3/4 + 1/2",
    "tableau": null,
    "opts": ["4/6", "5/4", "1/3", "3/8"],
    "answer": 1,
    "explication": "On met au même dénominateur : 3/4 + 2/4 = 5/4."
  },
  {
    "theme": "Algèbre et équations",
    "difficulte": "moyen",
    "q": "Développe et réduis l'expression littérale suivante : A = 3(x + 2) - 5",
    "tableau": null,
    "opts": ["3x + 1", "3x + 6", "3x - 3", "3x + 11"],
    "answer": 0,
    "explication": "On distribue : 3 * x + 3 * 2 = 3x + 6. Puis on réduit : 3x + 6 - 5 = 3x + 1."
  },
  {
    "theme": "Algèbre et équations",
    "difficulte": "difficile",
    "q": "Résous l'équation suivante : 4x - 7 = 2x + 9",
    "tableau": null,
    "opts": ["x = 1", "x = 8", "x = -2", "x = 4"],
    "answer": 1,
    "explication": "On rassemble les x : 4x - 2x = 9 + 7, ce qui donne 2x = 16, donc x = 16 / 2 = 8."
  },

  // --- THÈME : STATISTIQUES ET PROBABILITÉS ---
  {
    "theme": "Statistiques et probabilités",
    "difficulte": "facile",
    "q": "Quelle est la probabilité d'obtenir un chiffre impair en lançant un dé équilibré à 6 faces ?",
    "tableau": null,
    "opts": ["1/6", "1/2", "1/3", "2/3"],
    "answer": 1,
    "explication": "Il y a 3 chiffres impairs (1, 3, 5) sur 6 faces, soit 3/6 = 1/2."
  },
  {
    "theme": "Statistiques et probabilités",
    "difficulte": "moyen",
    "q": "Voici la liste des notes d'un élève : 10, 12, 15, 11, 17. Quelle est la médiane de cette série ?",
    "tableau": null,
    "opts": ["11", "13", "12", "15fx"],
    "answer": 2,
    "explication": "On ordonne les notes : 10, 11, 12, 15, 17. La valeur centrale qui partage la série en deux groupes égaux est 12."
  },
  {
    "theme": "Statistiques et probabilités",
    "difficulte": "moyen",
    "q": "Voici les effectifs d'un groupe d'élèves. Quel est l'effectif total ?",
    "tableau": {
      "headers": ["Notes", "8", "11", "14"],
      "rows": [["Effectifs", "3", "5", "2"]]
    },
    "opts": ["10 élèves", "33 élèves", "3 élèves", "14 élèves"],
    "answer": 0,
    "explication": "L'effectif total est la somme de la ligne du bas : 3 + 5 + 2 = 10 élèves."
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  const { theme, difficulte } = req.body

  // Fonction interne pour générer un quiz sur-mesure à partir de la banque de secours
  const distribuerSecoursSurMesure = () => {
    console.log(`🚨 Mode Secours activé pour le thème: ${theme} (${difficulte})`);
    
    // 1. Filtrer selon le thème choisi
    let secoursFiltre = banqueDeSecours.filter(q => {
      const matchTheme = theme === 'Mélange de tous les thèmes' || q.theme === theme || (theme === 'Algèbre et équations' && q.theme === 'Nombres et calculs');
      const matchDiff = q.difficulte === difficulte;
      return matchTheme && matchDiff;
    });

    // Si pas de correspondance parfaite niveau+thème, on élargit à tout le thème
    if (secoursFiltre.length === 0) {
      secoursFiltre = banqueDeSecours.filter(q => theme === 'Mélange de tous les thèmes' || q.theme === theme);
    }
    
    // Si toujours vide, on prend toute la banque
    if (secoursFiltre.length === 0) secoursFiltre = banqueDeSecours;

    // 2. Mélanger aléatoirement et extraire 5 questions
    const melange = secoursFiltre.sort(() => 0.5 - Math.random());
    return melange.slice(0, 5);
  };

  try {
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

    const prompt1 = `Tu es un professeur de mathématiques expert au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions à couvrir absolument : ${contexte[theme] || theme}.

RÈGLE ABSOLUE POUR LES TABLEAUX :
Si la question utilise ou nécessite un tableau de valeurs (notamment pour le thème "Fonctions" ou "Statistiques"), tu as l'INTERDICTION FORMELLE de dessiner le tableau avec du texte brut (comme des barres "|"). 
Tu DOIS obligatoirement créer et remplir l'objet "tableau" structuré dans le JSON. La consigne dans "q" doit simplement introduire le tableau (ex: "Quelle fonction correspond au tableau de valeurs suivant ?").

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte décoratif avant ou après, sans balises de code markdown.

Format EXACT de la structure :
[
  {
    "q": "énoncé de la question",
    "tableau": {
      "headers": ["x", "-2", "0", "2"],
      "rows": [
        ["f(x)", "-7", "-3", "1"]
      ]
    },
    "opts": ["opt0","opt1","opt2","opt3"],
    "bonne_reponse": "opt_correct",
    "explication": "calcul détaillé"
  }
]
Si la question ne nécessite aucun tableau, écris strictement "tableau": null.`

    const response1 = await claudeCall(prompt1)
    
    if (response1.error) {
      return res.status(200).json({ questions: distribuerSecoursSurMesure() })
    }

    const match = response1.text.match(/\[[\s\S]*\]/)
    if (!match) {
      return res.status(200).json({ questions: distribuerSecoursSurMesure() })
    }

    let questions = JSON.parse(match[0])

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

    // ÉTAPE 3 : Double vérification
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const prompt2 = `Résous cette question de mathématiques de niveau Brevet. Regarde les options numérotées de 0 à 3 et donne UNIQUEMENT le numéro de la bonne réponse.
Question : ${q.q}
${q.tableau ? `Tableau : ${JSON.stringify(q.tableau)}` : ''}
Options :
${q.opts.map((o, j) => `${j} : ${o}`).join('\n')}
Réponds UNIQUEMENT avec l'index (0, 1, 2 ou 3).`

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

    res.status(200).json({ questions })

  } catch(e) {
    res.status(200).json({ questions: distribuerSecoursSurMesure() })
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
