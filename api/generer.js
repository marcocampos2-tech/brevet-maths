const QUESTIONS_BANQUE = {
  "Nombres et calculs": {
    "facile": [
      { q: "Quel est le résultat de 3² × 2³ ?", opts: ["36", "72", "48", "24"], answer: 1, explication: "On calcule chaque puissance séparément. 3² = 3 × 3 = 9. 2³ = 2 × 2 × 2 = 8. Ensuite on multiplie : 9 × 8 = 72. La réponse est 72.", tableau: null },
      { q: "Quelle est la valeur de (-3) × (-4) ?", opts: ["−12", "12", "7", "−7"], answer: 1, explication: "Règle des signes : le produit de deux nombres négatifs est toujours positif. Donc (-3) × (-4) = +(3 × 4) = +12. La réponse est 12.", tableau: null },
      { q: "Quel est le résultat de 3/4 + 1/2 ?", opts: ["4/6", "5/4", "1/4", "2/3"], answer: 1, explication: "Pour additionner des fractions, il faut le même dénominateur. On transforme 1/2 en 2/4 (on multiplie numérateur et dénominateur par 2). Ensuite : 3/4 + 2/4 = (3+2)/4 = 5/4. La réponse est 5/4.", tableau: null },
      { q: "Quel est le pourcentage de 15 sur 60 ?", opts: ["20%", "25%", "15%", "30%"], answer: 1, explication: "Pour trouver le pourcentage, on divise 15 par 60 puis on multiplie par 100. 15 ÷ 60 = 0,25. 0,25 × 100 = 25%. La réponse est 25%.", tableau: null },
      { q: "Quel est le résultat de 2⁴ ?", opts: ["6", "8", "16", "12"], answer: 2, explication: "2⁴ signifie 2 multiplié 4 fois par lui-même. 2⁴ = 2 × 2 × 2 × 2 = 4 × 4 = 16. La réponse est 16.", tableau: null },
      { q: "Simplifie la fraction 12/18.", opts: ["3/4", "2/3", "4/6", "1/2"], answer: 1, explication: "On cherche le PGCD de 12 et 18. Les diviseurs de 12 : 1, 2, 3, 4, 6, 12. Les diviseurs de 18 : 1, 2, 3, 6, 9, 18. Le plus grand commun est 6. On divise numérateur et dénominateur par 6 : 12÷6 = 2 et 18÷6 = 3. La fraction irréductible est 2/3.", tableau: null },
      { q: "Quel est le résultat de (-5) + 8 − 3 ?", opts: ["0", "6", "−6", "10"], answer: 0, explication: "On effectue les calculs de gauche à droite. D'abord : -5 + 8 = +3. Ensuite : 3 - 3 = 0. La réponse est 0.", tableau: null },
      { q: "Développe 3(x + 4).", opts: ["3x + 4", "3x + 12", "x + 12", "3x − 12"], answer: 1, explication: "Pour développer, on multiplie le facteur 3 par chaque terme entre les parenthèses. 3 × x = 3x. 3 × 4 = 12. Donc 3(x + 4) = 3x + 12.", tableau: null },
      { q: "Une veste coûte 80€ soldée à −25%. Quel est son nouveau prix ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "On calcule 25% de 80€ pour trouver la réduction. 25% de 80 = 0,25 × 80 = 20€. On soustrait la réduction du prix initial : 80 - 20 = 60€. Le nouveau prix est 60€.", tableau: null },
      { q: "Quel est le résultat de 10⁰ ?", opts: ["0", "10", "1", "100"], answer: 2, explication: "Tout nombre non nul élevé à la puissance 0 est égal à 1. C'est une règle fondamentale des puissances. Donc 10⁰ = 1, et d'ailleurs aussi 5⁰ = 1, 100⁰ = 1, etc.", tableau: null },
      { q: "Lequel de ces nombres est premier ?", opts: ["15", "21", "17", "25"], answer: 2, explication: "Un nombre premier n'est divisible que par 1 et lui-même. 15 = 3 × 5 (pas premier). 21 = 3 × 7 (pas premier). 25 = 5 × 5 (pas premier). 17 : on vérifie les diviseurs jusqu'à √17 ≈ 4,1, soit 2, 3 et 4. Aucun ne divise 17. Donc 17 est premier.", tableau: null },
      { q: "Quels sont les diviseurs de 12 ?", opts: ["1,2,3,4,6,12", "1,2,4,8,12", "1,3,4,6,12", "2,3,4,6,12"], answer: 0, explication: "On cherche tous les nombres qui divisent 12 exactement. 12 = 1×12 = 2×6 = 3×4. Donc les diviseurs sont : 1, 2, 3, 4, 6 et 12. Remarque : 1 et 12 sont toujours diviseurs de 12.", tableau: null },
      { q: "36 est-il divisible par 9 ?", opts: ["Oui", "Non", "Seulement si pair", "On ne peut pas savoir"], answer: 0, explication: "On peut vérifier de deux façons. Méthode 1 : 36 ÷ 9 = 4, le résultat est entier → oui. Méthode 2 : critère de divisibilité par 9 : la somme des chiffres de 36 est 3+6=9, qui est divisible par 9 → oui. Donc 36 est bien divisible par 9.", tableau: null },
      { q: "Quelle est la décomposition en facteurs premiers de 12 ?", opts: ["2 × 6", "2² × 3", "3 × 4", "2 × 2 × 3"], answer: 1, explication: "On divise successivement par les nombres premiers. 12 ÷ 2 = 6. 6 ÷ 2 = 3. 3 ÷ 3 = 1. Donc 12 = 2 × 2 × 3 = 2² × 3. La décomposition en facteurs premiers utilise uniquement des nombres premiers.", tableau: null },
      { q: "Un nombre est divisible par 3 si...", opts: ["Il se termine par 0 ou 5", "La somme de ses chiffres est divisible par 3", "Il est pair", "Il se termine par 3"], answer: 1, explication: "C'est le critère de divisibilité par 3 : on additionne tous les chiffres du nombre, et si le résultat est divisible par 3, alors le nombre l'est aussi. Exemple : 123 → 1+2+3 = 6, et 6 est divisible par 3, donc 123 est divisible par 3.", tableau: null }
    ],
    "moyen": [
      { q: "Factorise x² − 9.", opts: ["(x−3)²", "(x+3)(x−3)", "(x+9)(x−1)", "(x−9)(x+1)"], answer: 1, explication: "On reconnaît une identité remarquable : la différence de deux carrés. x² − 9 = x² − 3². La formule est : a² − b² = (a+b)(a−b). Ici a = x et b = 3. Donc x² − 9 = (x+3)(x−3).", tableau: null },
      { q: "Quel est le résultat de (2/3)³ ?", opts: ["6/9", "8/27", "2/9", "4/9"], answer: 1, explication: "Pour élever une fraction à une puissance, on élève séparément numérateur et dénominateur. (2/3)³ = 2³/3³ = (2×2×2)/(3×3×3) = 8/27. La réponse est 8/27.", tableau: null },
      { q: "Développe et réduis (x+3)(x−2).", opts: ["x²+x−6", "x²−x−6", "x²+x+6", "x²−6"], answer: 0, explication: "On développe en multipliant chaque terme du premier facteur par chaque terme du second. x × x = x². x × (−2) = −2x. 3 × x = 3x. 3 × (−2) = −6. On additionne : x² + (−2x + 3x) + (−6) = x² + x − 6.", tableau: null },
      { q: "Un article a augmenté de 20% puis baissé de 20%. Quel est le prix final ?", opts: ["Identique", "4% de moins", "4% de plus", "20% de moins"], answer: 1, explication: "Attention, ce n'est pas identique ! Après une hausse de 20%, le prix est multiplié par 1,20. Après une baisse de 20%, il est multiplié par 0,80. Au total : 1,20 × 0,80 = 0,96. Or 0,96 = 1 − 0,04, ce qui signifie une baisse globale de 4%.", tableau: null },
      { q: "Quel est le résultat de 3 × 10⁻² ?", opts: ["300", "0,3", "0,03", "30"], answer: 2, explication: "10⁻² = 1/10² = 1/100 = 0,01. Donc 3 × 10⁻² = 3 × 0,01 = 0,03. On peut aussi raisonner ainsi : 10⁻² signifie qu'on décale la virgule de 2 rangs vers la gauche, donc 3 devient 0,03.", tableau: null },
      { q: "Factorise 2x² + 4x.", opts: ["2(x²+2x)", "2x(x+2)", "x(2x+4)", "2(x+2)"], answer: 1, explication: "On cherche le facteur commun à 2x² et 4x. 2x² = 2x × x et 4x = 2x × 2. Le facteur commun est 2x. On factorise : 2x² + 4x = 2x(x + 2). Vérification : 2x × x + 2x × 2 = 2x² + 4x ✓", tableau: null },
      { q: "Quel est le PGCD de 24 et 36 ?", opts: ["4", "6", "12", "18"], answer: 2, explication: "On décompose chaque nombre. 24 = 2 × 2 × 2 × 3 = 2³ × 3. 36 = 2 × 2 × 3 × 3 = 2² × 3². Le PGCD est le produit des facteurs premiers communs avec le plus petit exposant. Facteurs communs : 2 (exposant min = 2) et 3 (exposant min = 1). Donc PGCD = 2² × 3 = 4 × 3 = 12.", tableau: null },
      { q: "Décompose 60 en facteurs premiers.", opts: ["2×3×10", "2²×3×5", "2×5×6", "3×4×5"], answer: 1, explication: "On divise successivement par les plus petits nombres premiers. 60 ÷ 2 = 30. 30 ÷ 2 = 15. 15 ÷ 3 = 5. 5 ÷ 5 = 1. Donc 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5. La décomposition correcte est 2² × 3 × 5.", tableau: null },
      { q: "Quel est le PPCM de 4 et 6 ?", opts: ["2", "12", "24", "8"], answer: 1, explication: "Le PPCM est le plus petit multiple commun. Multiples de 4 : 4, 8, 12, 16, 20... Multiples de 6 : 6, 12, 18, 24... Le premier multiple commun est 12. On peut aussi calculer : PPCM = (4 × 6) ÷ PGCD(4,6) = 24 ÷ 2 = 12.", tableau: null },
      { q: "La fraction 15/35 réduite à sa forme irréductible est :", opts: ["5/7", "3/7", "5/12", "3/5"], answer: 1, explication: "On cherche le PGCD de 15 et 35. 15 = 3 × 5. 35 = 5 × 7. Le seul facteur premier commun est 5. Donc PGCD = 5. On divise : 15 ÷ 5 = 3 et 35 ÷ 5 = 7. La fraction irréductible est 3/7.", tableau: null }
    ],
    "difficile": [
      { q: "Simplifie (3x² × 2x³) / (6x⁴).", opts: ["x", "x²", "6x", "x/6"], answer: 0, explication: "On commence par le numérateur : 3x² × 2x³ = (3×2) × (x²×x³) = 6 × x^(2+3) = 6x⁵. Ensuite on divise : 6x⁵ ÷ 6x⁴ = (6÷6) × x^(5-4) = 1 × x¹ = x. La réponse est x.", tableau: null },
      { q: "Développe et réduis (x+2)² − (x−2)².", opts: ["8x", "4x", "8", "4x²"], answer: 0, explication: "On développe chaque carré. (x+2)² = x² + 4x + 4 (identité remarquable). (x−2)² = x² − 4x + 4 (identité remarquable). On soustrait : (x²+4x+4) − (x²−4x+4) = x²+4x+4−x²+4x−4 = 8x. La réponse est 8x.", tableau: null },
      { q: "Quel est le résultat de (2×10³) × (3×10⁴) ?", opts: ["5×10⁷", "6×10⁷", "6×10¹²", "5×10¹²"], answer: 1, explication: "On sépare les parties numériques et les puissances de 10. Partie numérique : 2 × 3 = 6. Puissances de 10 : 10³ × 10⁴ = 10^(3+4) = 10⁷. On rassemble : 6 × 10⁷. La réponse est 6×10⁷.", tableau: null },
      { q: "Factorise x² − 6x + 9.", opts: ["(x−3)²", "(x+3)²", "(x−3)(x+3)", "(x−9)(x+1)"], answer: 0, explication: "On reconnaît l'identité remarquable du carré d'une différence : a² − 2ab + b² = (a−b)². Ici : x² − 6x + 9 = x² − 2×(3)×x + 3². On vérifie : a=x, b=3, 2ab = 2×x×3 = 6x ✓. Donc x² − 6x + 9 = (x−3)².", tableau: null },
      { q: "Un capital de 1000€ est placé à 5% pendant 2 ans. Quel est le montant final ?", opts: ["1100€", "1102,5€", "1105€", "1050€"], answer: 1, explication: "C'est un intérêt composé : chaque année, les intérêts s'ajoutent au capital. Après 1 an : 1000 × 1,05 = 1050€. Après 2 ans : 1050 × 1,05 = 1102,5€. Formule générale : C × (1+t)ⁿ = 1000 × (1,05)² = 1000 × 1,1025 = 1102,5€.", tableau: null },
      { q: "Utilise l'algorithme d'Euclide pour trouver PGCD(84, 56).", opts: ["7", "14", "21", "28"], answer: 3, explication: "Algorithme d'Euclide : on divise le plus grand par le plus petit et on garde le reste. Étape 1 : 84 = 56 × 1 + 28 (reste 28). Étape 2 : 56 = 28 × 2 + 0 (reste 0). Quand le reste est 0, le PGCD est le dernier diviseur, soit 28.", tableau: null },
      { q: "Quel est le plus petit entier divisible par 6, 8 et 9 ?", opts: ["72", "144", "36", "48"], answer: 0, explication: "On cherche le PPCM(6, 8, 9). 6 = 2×3. 8 = 2³. 9 = 3². PPCM = produit des facteurs premiers avec le plus grand exposant = 2³ × 3² = 8 × 9 = 72. Vérification : 72 ÷ 6 = 12 ✓, 72 ÷ 8 = 9 ✓, 72 ÷ 9 = 8 ✓.", tableau: null },
      { q: "La décomposition de 360 en facteurs premiers est :", opts: ["2³×3²×5", "2²×3×5²", "2³×3×5²", "2²×3²×5²"], answer: 0, explication: "On divise successivement. 360 ÷ 2 = 180. 180 ÷ 2 = 90. 90 ÷ 2 = 45. 45 ÷ 3 = 15. 15 ÷ 3 = 5. 5 ÷ 5 = 1. Donc 360 = 2 × 2 × 2 × 3 × 3 × 5 = 2³ × 3² × 5.", tableau: null },
      { q: "Quel est le résultat de (√3 + 1)(√3 − 1) ?", opts: ["2", "4", "3", "√3"], answer: 0, explication: "On reconnaît l'identité (a+b)(a−b) = a² − b². Ici a = √3 et b = 1. Donc (√3+1)(√3−1) = (√3)² − 1² = 3 − 1 = 2. La réponse est 2.", tableau: null },
      { q: "Simplifie (x²−4)/(x+2).", opts: ["x−2", "x+2", "x²−2", "x"], answer: 0, explication: "On factorise le numérateur : x²−4 = x²−2² = (x+2)(x−2) (différence de deux carrés). La fraction devient (x+2)(x−2)/(x+2). On simplifie par (x+2) (avec x≠−2) : le résultat est x−2.", tableau: null }
    ]
  },
  "Géométrie": {
    "facile": [
      { q: "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent 3cm et 4cm. Quelle est l'hypoténuse ?", opts: ["5cm", "6cm", "7cm", "√7cm"], answer: 0, explication: "On applique le théorème de Pythagore : dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés. Hypoténuse² = 3² + 4² = 9 + 16 = 25. Hypoténuse = √25 = 5cm.", tableau: null },
      { q: "Quel est le périmètre d'un rectangle de longueur 8cm et largeur 5cm ?", opts: ["40cm", "26cm", "13cm", "20cm"], answer: 1, explication: "Le périmètre d'un rectangle est la somme de tous ses côtés. Un rectangle a deux longueurs et deux largeurs. P = 2 × longueur + 2 × largeur = 2 × 8 + 2 × 5 = 16 + 10 = 26cm.", tableau: null },
      { q: "Quelle est l'aire d'un triangle de base 6cm et hauteur 4cm ?", opts: ["24cm²", "12cm²", "10cm²", "18cm²"], answer: 1, explication: "La formule de l'aire d'un triangle est : Aire = (base × hauteur) ÷ 2. Ici : Aire = (6 × 4) ÷ 2 = 24 ÷ 2 = 12cm². On divise par 2 car le triangle représente la moitié du rectangle de mêmes dimensions.", tableau: null },
      { q: "Un angle d'un triangle mesure 90° et un autre 35°. Quel est le troisième angle ?", opts: ["45°", "55°", "65°", "75°"], answer: 1, explication: "La somme des angles d'un triangle est toujours égale à 180°. Troisième angle = 180° − 90° − 35° = 180° − 125° = 55°.", tableau: null },
      { q: "Quel est le rayon d'un cercle de diamètre 14cm ?", opts: ["28cm", "14cm", "7cm", "3,5cm"], answer: 2, explication: "Le rayon est la moitié du diamètre. Rayon = Diamètre ÷ 2 = 14 ÷ 2 = 7cm. Rappel : le diamètre est la plus longue corde d'un cercle, et il passe par le centre.", tableau: null },
      { q: "Quelle est l'aire d'un carré de côté 6cm ?", opts: ["24cm²", "12cm²", "36cm²", "18cm²"], answer: 2, explication: "L'aire d'un carré est le côté multiplié par lui-même. Aire = côté² = 6² = 6 × 6 = 36cm².", tableau: null },
      { q: "Quel est le volume d'un cube de côté 3cm ?", opts: ["9cm³", "18cm³", "27cm³", "81cm³"], answer: 2, explication: "Le volume d'un cube est le côté élevé à la puissance 3. Volume = côté³ = 3³ = 3 × 3 × 3 = 27cm³.", tableau: null },
      { q: "Quelle est la circonférence d'un cercle de rayon 5cm ? (π≈3,14)", opts: ["31,4cm", "15,7cm", "78,5cm", "10cm"], answer: 0, explication: "La circonférence d'un cercle se calcule avec la formule C = 2 × π × r, où r est le rayon. C = 2 × 3,14 × 5 = 6,28 × 5 = 31,4cm.", tableau: null },
      { q: "Deux droites parallèles coupées par une sécante. Les angles alternes-internes sont...", opts: ["Supplémentaires", "Complémentaires", "Égaux", "Différents"], answer: 2, explication: "C'est une propriété fondamentale de la géométrie : quand deux droites parallèles sont coupées par une sécante (droite qui les coupe), les angles alternes-internes (de part et d'autre de la sécante, entre les deux parallèles) sont toujours égaux.", tableau: null },
      { q: "Dans un triangle ABC, si AB = AC, le triangle est...", opts: ["Équilatéral", "Isocèle", "Rectangle", "Scalène"], answer: 1, explication: "Un triangle isocèle est un triangle qui possède au moins deux côtés égaux. Ici AB = AC, donc le triangle est isocèle en A (A est le sommet principal). Un triangle équilatéral aurait les trois côtés égaux.", tableau: null }
    ],
    "moyen": [
      { q: "Dans un triangle rectangle en A, sin(B) = 0,6 et BC = 10cm. Quelle est la longueur AC ?", opts: ["4cm", "6cm", "8cm", "5cm"], answer: 1, explication: "Dans un triangle rectangle en A, BC est l'hypoténuse. La formule du sinus est : sin(B) = côté opposé à B / hypoténuse = AC / BC. Donc AC = sin(B) × BC = 0,6 × 10 = 6cm.", tableau: null },
      { q: "Dans un triangle ABC, DE∥BC avec AD=3, AB=9 et DE=4. Quelle est BC ?", opts: ["8cm", "12cm", "6cm", "10cm"], answer: 1, explication: "On applique le théorème de Thalès : si DE est parallèle à BC, alors AD/AB = DE/BC. On a : 3/9 = 4/BC. Donc BC = 4 × 9/3 = 4 × 3 = 12cm.", tableau: null },
      { q: "Quelle est l'aire d'un trapèze de bases 6cm et 10cm, hauteur 4cm ?", opts: ["32cm²", "40cm²", "24cm²", "16cm²"], answer: 0, explication: "La formule de l'aire d'un trapèze est : Aire = (grande base + petite base) ÷ 2 × hauteur. Aire = (10 + 6) ÷ 2 × 4 = 16 ÷ 2 × 4 = 8 × 4 = 32cm².", tableau: null },
      { q: "Dans un triangle rectangle en A, tan(B) = 3/4 et AB = 8cm. Quelle est AC ?", opts: ["4cm", "6cm", "8cm", "12cm"], answer: 1, explication: "Dans un triangle rectangle en A, la tangente de l'angle B est : tan(B) = côté opposé / côté adjacent = AC / AB. Donc AC = tan(B) × AB = (3/4) × 8 = 3 × 2 = 6cm.", tableau: null },
      { q: "Quel est le volume d'un cylindre de rayon 3cm et hauteur 5cm ? (π≈3,14)", opts: ["94,2cm³", "141,3cm³", "47,1cm³", "188,4cm³"], answer: 1, explication: "La formule du volume d'un cylindre est V = π × r² × h. V = 3,14 × 3² × 5 = 3,14 × 9 × 5 = 3,14 × 45 = 141,3cm³.", tableau: null },
      { q: "Dans un triangle ABC rectangle en C, AC=6cm et BC=8cm. Que vaut cos(A) ?", opts: ["3/5", "4/5", "3/4", "4/3"], answer: 0, explication: "On commence par trouver l'hypoténuse AB grâce à Pythagore : AB² = AC² + BC² = 36 + 64 = 100, donc AB = 10cm. Le cosinus de A est : cos(A) = côté adjacent / hypoténuse = AC / AB = 6/10 = 3/5.", tableau: null },
      { q: "Quelle est l'aire d'un disque de diamètre 10cm ? (π≈3,14)", opts: ["31,4cm²", "78,5cm²", "314cm²", "15,7cm²"], answer: 1, explication: "Le rayon est r = diamètre ÷ 2 = 10 ÷ 2 = 5cm. La formule de l'aire d'un disque est A = π × r². A = 3,14 × 5² = 3,14 × 25 = 78,5cm².", tableau: null },
      { q: "Dans un triangle ABC, AB=12cm, BC=9cm, AC=15cm. Le triangle est-il rectangle ?", opts: ["Oui, en A", "Oui, en B", "Oui, en C", "Non"], answer: 1, explication: "On utilise la réciproque de Pythagore. Le plus grand côté est AC = 15. On vérifie : AB² + BC² = 12² + 9² = 144 + 81 = 225 = 15² = AC². Comme AB² + BC² = AC², le triangle est rectangle, et l'angle droit est en B (opposé au plus grand côté).", tableau: null },
      { q: "Deux triangles semblables avec rapport 2. Le premier a aire 12cm². Quelle est l'aire du second ?", opts: ["24cm²", "36cm²", "48cm²", "6cm²"], answer: 2, explication: "Propriété importante : quand deux figures sont semblables de rapport k, leurs aires sont dans le rapport k². Ici k = 2, donc le rapport des aires est 2² = 4. Aire du second = 12 × 4 = 48cm².", tableau: null },
      { q: "Dans un triangle ABC, AD est la médiane. D est...", opts: ["Le pied de la hauteur", "Le milieu de BC", "Le centre du cercle", "Le pied de la bissectrice"], answer: 1, explication: "Par définition, une médiane d'un triangle est un segment qui relie un sommet au milieu du côté opposé. Donc AD est la médiane issue de A, et D est le milieu du côté BC.", tableau: null }
    ],
    "difficile": [
      { q: "Un cône a rayon 4cm et hauteur 3cm. Quel est son volume ? (π≈3,14)", opts: ["12,56cm³", "50,24cm³", "75,36cm³", "25,12cm³"], answer: 1, explication: "La formule du volume d'un cône est V = (1/3) × π × r² × h. V = (1/3) × 3,14 × 4² × 3 = (1/3) × 3,14 × 16 × 3 = (1/3) × 150,72 = 50,24cm³.", tableau: null },
      { q: "Deux cercles de rayons 3cm et 5cm, centres distants de 8cm. Sont-ils sécants ?", opts: ["Oui", "Non, extérieurs", "Non, intérieurs", "Tangents"], answer: 3, explication: "On compare la distance entre les centres (d=8) avec la somme des rayons (r1+r2=3+5=8) et la différence (|r1−r2|=2). Si d = r1+r2 : tangents extérieurement. C'est notre cas : 8 = 8. Les cercles sont donc tangents extérieurement.", tableau: null },
      { q: "Dans un triangle ABC, les médianes se coupent en G. AG = ?", opts: ["1/2 de la médiane", "2/3 de la médiane", "1/3 de la médiane", "3/4 de la médiane"], answer: 1, explication: "Le centre de gravité (ou barycentre) G d'un triangle est le point d'intersection des trois médianes. Il divise chaque médiane dans le rapport 2:1 à partir du sommet. Donc AG = (2/3) de la médiane issue de A, et GD = (1/3) de cette médiane.", tableau: null },
      { q: "Quel est le volume d'une sphère de rayon 6cm ? (π≈3,14)", opts: ["904,32cm³", "452,16cm³", "113,04cm³", "226,08cm³"], answer: 0, explication: "La formule du volume d'une sphère est V = (4/3) × π × r³. V = (4/3) × 3,14 × 6³ = (4/3) × 3,14 × 216 = (4 × 3,14 × 216) / 3 = 2712,96 / 3 = 904,32cm³.", tableau: null },
      { q: "Une pyramide carrée base 6cm côté et hauteur 4cm. Quel est son volume ?", opts: ["48cm³", "72cm³", "24cm³", "96cm³"], answer: 0, explication: "La formule du volume d'une pyramide est V = (1/3) × Aire de la base × hauteur. Aire de la base carrée = 6² = 36cm². V = (1/3) × 36 × 4 = 144/3 = 48cm³.", tableau: null },
      { q: "Dans un triangle ABC rectangle en C, CH altitude avec AH=2cm et BH=8cm. Quelle est CH ?", opts: ["4cm", "√16cm", "6cm", "√10cm"], answer: 0, explication: "On utilise la relation métrique dans le triangle rectangle : CH² = AH × BH. CH² = 2 × 8 = 16. CH = √16 = 4cm. Cette relation vient du fait que les triangles ACH et CBH sont semblables.", tableau: null },
      { q: "Quel est le volume d'un cylindre de rayon 5cm et hauteur 8cm ? (π≈3,14)", opts: ["628cm³", "314cm³", "1256cm³", "200cm³"], answer: 0, explication: "La formule du volume d'un cylindre est V = π × r² × h. V = 3,14 × 5² × 8 = 3,14 × 25 × 8 = 3,14 × 200 = 628cm³.", tableau: null },
      { q: "Dans un triangle ABC, AB=13, BC=5, AC=12. Calculez sin(B).", opts: ["12/13", "5/13", "12/5", "5/12"], answer: 0, explication: "On vérifie d'abord que le triangle est rectangle : BC² + AC² = 5² + 12² = 25 + 144 = 169 = 13² = AB². Le triangle est rectangle en C, et AB = 13 est l'hypoténuse. sin(B) = côté opposé à B / hypoténuse = AC / AB = 12/13.", tableau: null },
      { q: "La réciproque du théorème de Pythagore permet de...", opts: ["Calculer une aire", "Démontrer qu'un triangle est rectangle", "Trouver un angle", "Calculer un périmètre"], answer: 1, explication: "La réciproque dit : si dans un triangle on a a² + b² = c² (où c est le plus grand côté), alors le triangle est rectangle et l'angle droit est opposé au côté c. C'est l'outil pour prouver qu'un triangle est rectangle.", tableau: null },
      { q: "Dans un triangle, si DE∥BC avec AD/DB = 2/3, quelle est la valeur de AE/EC ?", opts: ["2/3", "3/2", "2/5", "3/5"], answer: 0, explication: "Par le théorème de Thalès, si DE∥BC, alors AD/DB = AE/EC. Donc si AD/DB = 2/3, alors AE/EC = 2/3 aussi. Les rapports sont égaux sur les deux côtés du triangle.", tableau: null }
    ]
  },
  "Algèbre et équations": {
    "facile": [
      { q: "Résous l'équation 2x + 3 = 11.", opts: ["x = 3", "x = 4", "x = 5", "x = 7"], answer: 1, explication: "On isole x étape par étape. Étape 1 : on soustrait 3 des deux membres : 2x + 3 − 3 = 11 − 3, ce qui donne 2x = 8. Étape 2 : on divise par 2 : x = 8 ÷ 2 = 4. La solution est x = 4.", tableau: null },
      { q: "Résous 3x − 5 = 10.", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 2, explication: "On isole x. Étape 1 : on ajoute 5 aux deux membres : 3x − 5 + 5 = 10 + 5, ce qui donne 3x = 15. Étape 2 : on divise par 3 : x = 15 ÷ 3 = 5. La solution est x = 5.", tableau: null },
      { q: "Quelle est la solution de x/3 = 4 ?", opts: ["x = 7", "x = 12", "x = 1,3", "x = 4/3"], answer: 1, explication: "Pour isoler x, on multiplie les deux membres par 3 (on fait l'opération inverse de la division). x/3 × 3 = 4 × 3. Donc x = 12.", tableau: null },
      { q: "Résous 5 − 2x = 1.", opts: ["x = 2", "x = 3", "x = −2", "x = −3"], answer: 0, explication: "Étape 1 : on soustrait 5 des deux membres : −2x = 1 − 5 = −4. Étape 2 : on divise par −2 (attention au signe !) : x = −4 ÷ (−2) = 2. La solution est x = 2.", tableau: null },
      { q: "Développe 2(3x − 4).", opts: ["6x − 4", "6x − 8", "5x − 6", "6x + 8"], answer: 1, explication: "On multiplie le facteur 2 par chaque terme entre parenthèses. 2 × 3x = 6x. 2 × (−4) = −8. Donc 2(3x − 4) = 6x − 8.", tableau: null },
      { q: "Résous l'inéquation 2x > 6.", opts: ["x > 4", "x > 3", "x < 3", "x > 12"], answer: 1, explication: "On divise les deux membres par 2. Attention : diviser par un nombre positif ne change pas le sens de l'inégalité. 2x ÷ 2 > 6 ÷ 2, donc x > 3.", tableau: null },
      { q: "Factorise 6x + 9.", opts: ["3(2x+3)", "6(x+3)", "3(2x+9)", "9(x+1)"], answer: 0, explication: "On cherche le facteur commun à 6x et 9. 6x = 3 × 2x et 9 = 3 × 3. Le facteur commun est 3. On factorise : 6x + 9 = 3(2x + 3). Vérification : 3 × 2x + 3 × 3 = 6x + 9 ✓", tableau: null },
      { q: "Résous 4x = 2x + 10.", opts: ["x = 4", "x = 5", "x = 6", "x = 10"], answer: 1, explication: "On regroupe les termes en x d'un côté. On soustrait 2x des deux membres : 4x − 2x = 10, donc 2x = 10. On divise par 2 : x = 5.", tableau: null },
      { q: "Quelle est la solution de 3(x+2) = 15 ?", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 0, explication: "On divise les deux membres par 3 : x + 2 = 15 ÷ 3 = 5. Puis on soustrait 2 : x = 5 − 2 = 3. La solution est x = 3.", tableau: null },
      { q: "Résous x + 5 > 8.", opts: ["x > 3", "x > 13", "x < 3", "x > 40"], answer: 0, explication: "On soustrait 5 des deux membres (l'inégalité ne change pas de sens) : x + 5 − 5 > 8 − 5, donc x > 3. L'ensemble solution est ]3 ; +∞[.", tableau: null }
    ],
    "moyen": [
      { q: "Résous le système : x + y = 7 et x − y = 3.", opts: ["x=4, y=3", "x=5, y=2", "x=3, y=4", "x=2, y=5"], answer: 1, explication: "On utilise la méthode par addition (combinaison). On additionne les deux équations membre à membre : (x+y) + (x−y) = 7+3, ce qui donne 2x = 10, donc x = 5. On substitue dans la première : 5 + y = 7, donc y = 2.", tableau: null },
      { q: "Résous par produit nul : (x−3)(x+2) = 0.", opts: ["x=3 ou x=−2", "x=−3 ou x=2", "x=3 ou x=2", "x=−3 ou x=−2"], answer: 0, explication: "Un produit est nul si et seulement si l'un des facteurs est nul. Donc : x − 3 = 0, ce qui donne x = 3. Ou : x + 2 = 0, ce qui donne x = −2. Les solutions sont x = 3 ou x = −2.", tableau: null },
      { q: "Résous par produit nul : (2x−4)(x+1) = 0.", opts: ["x=2 ou x=1", "x=2 ou x=−1", "x=4 ou x=−1", "x=−2 ou x=1"], answer: 1, explication: "Un produit est nul si l'un des facteurs est nul. Premier facteur : 2x − 4 = 0 → 2x = 4 → x = 2. Deuxième facteur : x + 1 = 0 → x = −1. Les solutions sont x = 2 ou x = −1.", tableau: null },
      { q: "Résous par produit nul : x(x−5) = 0.", opts: ["x=0 ou x=5", "x=0 ou x=−5", "x=5", "x=−5"], answer: 0, explication: "Un produit est nul si l'un des facteurs est nul. Premier facteur : x = 0. Deuxième facteur : x − 5 = 0 → x = 5. Les deux solutions sont x = 0 ou x = 5. Ne pas oublier la solution x = 0 !", tableau: null },
      { q: "Résous par produit nul : (3x+6)(x−4) = 0.", opts: ["x=−2 ou x=4", "x=2 ou x=4", "x=−6 ou x=4", "x=2 ou x=−4"], answer: 0, explication: "Un produit est nul si l'un des facteurs est nul. Premier facteur : 3x + 6 = 0 → 3x = −6 → x = −2. Deuxième facteur : x − 4 = 0 → x = 4. Les solutions sont x = −2 ou x = 4.", tableau: null },
      { q: "Résous le système : 2x + y = 8 et x − y = 1.", opts: ["x=3, y=2", "x=2, y=4", "x=4, y=0", "x=3, y=3"], answer: 0, explication: "On additionne les deux équations : (2x+y) + (x−y) = 8+1, soit 3x = 9, donc x = 3. On substitue : 2(3) + y = 8 → 6 + y = 8 → y = 2. La solution est x = 3 et y = 2.", tableau: null },
      { q: "Résous l'inéquation 3x − 2 ≤ 7.", opts: ["x ≤ 3", "x ≤ 5", "x ≥ 3", "x ≤ 9"], answer: 0, explication: "Étape 1 : on ajoute 2 des deux membres : 3x ≤ 7 + 2 = 9. Étape 2 : on divise par 3 (nombre positif, l'inégalité ne change pas) : x ≤ 9 ÷ 3 = 3. La solution est x ≤ 3.", tableau: null },
      { q: "Développe et réduis (x+4)(x−1).", opts: ["x²+3x−4", "x²−3x−4", "x²+3x+4", "x²+4"], answer: 0, explication: "On multiplie chaque terme du premier facteur par chaque terme du second. x × x = x². x × (−1) = −x. 4 × x = 4x. 4 × (−1) = −4. On regroupe : x² + (−x + 4x) + (−4) = x² + 3x − 4.", tableau: null },
      { q: "Résous par produit nul : (x+3)² = 0.", opts: ["x=3", "x=−3", "x=9", "Pas de solution"], answer: 1, explication: "(x+3)² = 0 signifie que le facteur (x+3) est nul (le carré d'un nombre est nul seulement si ce nombre est nul). Donc x + 3 = 0, ce qui donne x = −3. Il n'y a qu'une seule solution : x = −3.", tableau: null },
      { q: "Résous le système : 3x − 2y = 1 et x + y = 2.", opts: ["x=1, y=1", "x=2, y=0", "x=0, y=2", "x=1, y=2"], answer: 0, explication: "De la deuxième équation : x = 2 − y. On substitue dans la première : 3(2−y) − 2y = 1 → 6 − 3y − 2y = 1 → 6 − 5y = 1 → 5y = 5 → y = 1. Puis x = 2 − 1 = 1.", tableau: null }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 5x + 6 = 0.", opts: ["x=2 ou x=3", "x=−2 ou x=−3", "x=1 ou x=6", "x=2 ou x=−3"], answer: 0, explication: "On cherche deux nombres dont le produit est 6 et la somme est 5 : ce sont 2 et 3. On factorise : x² − 5x + 6 = (x−2)(x−3). Par produit nul : x − 2 = 0 → x = 2, ou x − 3 = 0 → x = 3.", tableau: null },
      { q: "Résous par produit nul : x² − 7x = 0.", opts: ["x=0 ou x=7", "x=7", "x=0", "x=0 ou x=−7"], answer: 0, explication: "On factorise par x : x² − 7x = x(x − 7). Par produit nul : x = 0 ou x − 7 = 0 → x = 7. Attention à ne pas diviser par x directement, on perdrait la solution x = 0 !", tableau: null },
      { q: "Résous par produit nul : 2x² − 8 = 0.", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√8"], answer: 0, explication: "On factorise : 2x² − 8 = 2(x² − 4) = 2(x−2)(x+2). Par produit nul : x − 2 = 0 → x = 2, ou x + 2 = 0 → x = −2. Les solutions sont x = 2 ou x = −2.", tableau: null },
      { q: "Résous par produit nul : x² + 4x + 4 = 0.", opts: ["x=−2", "x=2", "x=−2 ou x=2", "Pas de solution"], answer: 0, explication: "On reconnaît l'identité remarquable : x² + 4x + 4 = (x+2)². Par produit nul : (x+2)² = 0 → x + 2 = 0 → x = −2. Il y a une seule solution (racine double) : x = −2.", tableau: null },
      { q: "Résous par produit nul : 3x² − 12x + 9 = 0.", opts: ["x=1 ou x=3", "x=3 ou x=−1", "x=1 ou x=−3", "x=4 ou x=1"], answer: 0, explication: "On simplifie en divisant par 3 : x² − 4x + 3 = 0. On cherche deux nombres de produit 3 et somme 4 : 1 et 3. On factorise : (x−1)(x−3) = 0. Donc x = 1 ou x = 3.", tableau: null },
      { q: "Résous par produit nul : x³ − x = 0.", opts: ["x=0, x=1 ou x=−1", "x=1 ou x=−1", "x=0 ou x=1", "x=0"], answer: 0, explication: "On factorise par x : x³ − x = x(x² − 1). On reconnaît x² − 1 = (x−1)(x+1). Donc x³ − x = x(x−1)(x+1). Par produit nul : x = 0, ou x = 1, ou x = −1. Il y a trois solutions.", tableau: null },
      { q: "Résous : (x+1)/(x−1) = 2.", opts: ["x=3", "x=−3", "x=1/3", "x=−1/3"], answer: 0, explication: "On multiplie les deux membres par (x−1), avec x ≠ 1. x + 1 = 2(x−1) = 2x − 2. On isole x : x + 1 = 2x − 2 → 1 + 2 = 2x − x → 3 = x. La solution est x = 3.", tableau: null },
      { q: "Résous par produit nul : (x²−1)(x+3) = 0.", opts: ["x=1, x=−1 ou x=−3", "x=1 ou x=−3", "x=−1 ou x=3", "x=1, x=−1, x=3"], answer: 0, explication: "On factorise x² − 1 = (x−1)(x+1). Donc (x−1)(x+1)(x+3) = 0. Par produit nul : x = 1, ou x = −1, ou x = −3. Il y a trois solutions.", tableau: null },
      { q: "Résous l'inéquation x² − 4 > 0.", opts: ["x>2 ou x<−2", "−2<x<2", "x>2", "x<−2"], answer: 0, explication: "On factorise : x² − 4 = (x−2)(x+2). Le produit (x−2)(x+2) > 0 quand les deux facteurs ont le même signe. Les deux positifs : x > 2 et x > −2, soit x > 2. Les deux négatifs : x < 2 et x < −2, soit x < −2. Solution : x > 2 ou x < −2.", tableau: null },
      { q: "Résous par produit nul : 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "On cherche à factoriser 2x²+x−6. On essaie (2x−3)(x+2) = 2x²+4x−3x−6 = 2x²+x−6 ✓. Par produit nul : 2x − 3 = 0 → x = 3/2, ou x + 2 = 0 → x = −2.", tableau: null }
    ]
  },
  "Statistiques et probabilités": {
    "facile": [
      { q: "Notes : 8, 12, 14, 10, 16. Quelle est la moyenne ?", opts: ["11", "12", "13", "10"], answer: 1, explication: "La moyenne se calcule en additionnant toutes les valeurs et en divisant par le nombre de valeurs. Somme = 8+12+14+10+16 = 60. Nombre de notes = 5. Moyenne = 60 ÷ 5 = 12.", tableau: null },
      { q: "Série triée : 5, 8, 10, 14, 17. Quelle est la médiane ?", opts: ["8", "10", "12", "14"], answer: 1, explication: "La médiane est la valeur centrale d'une série triée. Il y a 5 valeurs, la valeur centrale est la 3ème. En comptant : 5 (1ère), 8 (2ème), 10 (3ème). La médiane est 10.", tableau: null },
      { q: "Un dé à 6 faces. Quelle est la probabilité d'obtenir un 3 ?", opts: ["1/3", "1/2", "1/6", "1/4"], answer: 2, explication: "Un dé équilibré à 6 faces a 6 résultats possibles équiprobables. Il y a une seule façon d'obtenir un 3. Donc P(3) = nombre de cas favorables / nombre de cas possibles = 1/6.", tableau: null },
      { q: "Classe de 30 élèves : 18 filles. Quelle est la fréquence des garçons ?", opts: ["18/30", "12/30", "18/12", "30/18"], answer: 1, explication: "Nombre de garçons = 30 − 18 = 12. La fréquence des garçons = nombre de garçons / effectif total = 12/30. On peut simplifier : 12/30 = 2/5 = 0,4 soit 40%.", tableau: null },
      { q: "Quelle est l'étendue de : 3, 7, 2, 9, 5 ?", opts: ["5", "6", "7", "9"], answer: 2, explication: "L'étendue est la différence entre la valeur maximale et la valeur minimale d'une série. Valeur max = 9. Valeur min = 2. Étendue = 9 − 2 = 7.", tableau: null },
      { q: "Probabilité de tirer un as dans 52 cartes ?", opts: ["1/13", "1/52", "4/13", "1/4"], answer: 0, explication: "Un jeu de 52 cartes contient 4 as (un par couleur). P(tirer un as) = nombre d'as / nombre total de cartes = 4/52. On simplifie par 4 : 4/52 = 1/13.", tableau: null },
      { q: "Voici les notes d'une classe :", tableau: { headers: ["Note", "0-5", "6-10", "11-15", "16-20"], rows: [["Nb élèves", "3", "8", "12", "7"]] }, opts: ["30 élèves", "28 élèves", "32 élèves", "25 élèves"], answer: 0, explication: "L'effectif total est la somme de tous les effectifs partiels. 3 + 8 + 12 + 7 = 30 élèves. C'est l'effectif total de la classe." },
      { q: "Voici les températures relevées une semaine :", tableau: { headers: ["Jour", "Lun", "Mar", "Mer", "Jeu", "Ven"], rows: [["Temp (°C)", "12", "15", "11", "14", "18"]] }, opts: ["14°C", "13°C", "15°C", "12°C"], answer: 0, explication: "Moyenne = somme de toutes les températures ÷ nombre de jours. Somme = 12+15+11+14+18 = 70. Nombre de jours = 5. Moyenne = 70 ÷ 5 = 14°C." },
      { q: "Voici la répartition des sports pratiqués dans un club :", tableau: { headers: ["Sport", "Football", "Tennis", "Natation", "Basket"], rows: [["Membres", "40", "25", "20", "15"]] }, opts: ["40%", "25%", "20%", "15%"], answer: 0, explication: "Total des membres = 40+25+20+15 = 100. Fréquence du football = 40/100 = 0,40 = 40%. C'est le sport le plus pratiqué." },
      { q: "Voici les âges de 6 enfants :", tableau: { headers: ["Enfant", "A", "B", "C", "D", "E", "F"], rows: [["Âge", "8", "10", "9", "11", "8", "10"]] }, opts: ["9,3 ans", "10 ans", "9 ans", "9,5 ans"], answer: 0, explication: "Somme des âges = 8+10+9+11+8+10 = 56. Nombre d'enfants = 6. Moyenne = 56 ÷ 6 ≈ 9,33 ans, arrondi à 9,3 ans." }
    ],
    "moyen": [
      { q: "Notes avec coeff : 12 (coeff 2) et 16 (coeff 3). Moyenne pondérée ?", opts: ["13,6", "14", "14,4", "15"], answer: 2, explication: "Moyenne pondérée = somme (note × coefficient) ÷ somme des coefficients. Numérateur = 12×2 + 16×3 = 24 + 48 = 72. Dénominateur = 2 + 3 = 5. Moyenne = 72 ÷ 5 = 14,4.", tableau: null },
      { q: "P(A)=0,3 et P(B)=0,5 indépendants. P(A et B) ?", opts: ["0,8", "0,15", "0,2", "0,35"], answer: 1, explication: "Quand deux événements sont indépendants, la probabilité qu'ils se produisent tous les deux est le produit de leurs probabilités. P(A et B) = P(A) × P(B) = 0,3 × 0,5 = 0,15.", tableau: null },
      { q: "Urne : 4 rouges, 3 bleues, 3 vertes. P(pas rouge) ?", opts: ["4/10", "6/10", "3/10", "7/10"], answer: 1, explication: "Total = 4+3+3 = 10 billes. 'Pas rouge' = bleue ou verte = 3+3 = 6 billes. P(pas rouge) = 6/10 = 3/5. On peut aussi calculer : P(pas rouge) = 1 − P(rouge) = 1 − 4/10 = 6/10.", tableau: null },
      { q: "On lance deux dés. P(deux 6) ?", opts: ["1/6", "2/6", "1/36", "1/12"], answer: 2, explication: "Les deux lancers sont indépendants. P(6 au premier dé) = 1/6. P(6 au deuxième dé) = 1/6. P(deux 6) = 1/6 × 1/6 = 1/36.", tableau: null },
      { q: "Voici la répartition des notes d'un devoir :", tableau: { headers: ["Note", "4", "8", "10", "12", "16", "18"], rows: [["Effectif", "2", "5", "8", "6", "4", "1"]] }, opts: ["10,8", "10", "11", "10,5"], answer: 0, explication: "N = 2+5+8+6+4+1 = 26 élèves. Somme = 4×2+8×5+10×8+12×6+16×4+18×1 = 8+40+80+72+64+18 = 282. Moyenne = 282÷26 ≈ 10,8." },
      { q: "Un sac contient des billes de couleurs :", tableau: { headers: ["Couleur", "Rouge", "Bleue", "Verte", "Jaune"], rows: [["Nombre", "6", "4", "3", "2"]] }, opts: ["2/5", "1/5", "3/10", "1/3"], answer: 0, explication: "Total = 6+4+3+2 = 15 billes. P(rouge) = 6/15. On simplifie par 3 : 6/15 = 2/5." },
      { q: "Voici le tableau des temps de trajet (en min) de 20 élèves :", tableau: { headers: ["Temps", "0-10", "10-20", "20-30", "30-40"], rows: [["Effectif", "4", "9", "5", "2"]] }, opts: ["10-20 min", "0-10 min", "20-30 min", "30-40 min"], answer: 0, explication: "Le mode (valeur la plus fréquente) correspond à la classe qui a le plus grand effectif. La classe 10-20 min a l'effectif le plus élevé avec 9 élèves sur 20." },
      { q: "Voici les ventes mensuelles d'une boutique :", tableau: { headers: ["Mois", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun"], rows: [["Ventes (€)", "1200", "980", "1450", "1300", "1600", "1800"]] }, opts: ["1388€", "1400€", "1350€", "1450€"], answer: 0, explication: "Somme = 1200+980+1450+1300+1600+1800 = 8330€. Nombre de mois = 6. Moyenne = 8330÷6 ≈ 1388€." },
      { q: "P(3 fois pile en 3 lancers) ?", opts: ["1/4", "1/8", "3/8", "1/6"], answer: 1, explication: "Chaque lancer est indépendant. P(pile) = 1/2 à chaque fois. P(3 fois pile) = P(pile) × P(pile) × P(pile) = (1/2)³ = 1/8.", tableau: null },
      { q: "Médiane d'une série de 9 valeurs triées est la... valeur.", opts: ["4ème", "5ème", "6ème", "7ème"], answer: 1, explication: "Pour trouver le rang de la médiane dans une série de n valeurs triées, on calcule (n+1)/2. Ici : (9+1)/2 = 10/2 = 5. La médiane est donc la 5ème valeur.", tableau: null }
    ],
    "difficile": [
      { q: "Urne : 5 rouges et 3 bleues. On tire 2 sans remise. P(2 rouges) ?", opts: ["5/14", "25/64", "10/28", "1/2"], answer: 0, explication: "Sans remise, les tirages ne sont pas indépendants. P(rouge au 1er tirage) = 5/8. Après avoir tiré une rouge, il reste 4 rouges sur 7 billes. P(rouge au 2ème) = 4/7. P(2 rouges) = 5/8 × 4/7 = 20/56 = 5/14.", tableau: null },
      { q: "P(A∪B) avec P(A)=0,4, P(B)=0,5, P(A∩B)=0,2 ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "On utilise la formule de l'union : P(A∪B) = P(A) + P(B) − P(A∩B). P(A∪B) = 0,4 + 0,5 − 0,2 = 0,9 − 0,2 = 0,7. On soustrait P(A∩B) pour ne pas compter deux fois les événements en commun.", tableau: null },
      { q: "P(au moins un 6 en lançant deux dés) ?", opts: ["1/6", "11/36", "1/3", "12/36"], answer: 1, explication: "Il est plus facile de calculer le complémentaire. P(aucun 6) = P(pas 6 au 1er) × P(pas 6 au 2ème) = 5/6 × 5/6 = 25/36. P(au moins un 6) = 1 − 25/36 = 11/36.", tableau: null },
      { q: "Voici le tableau de données d'une série statistique :", tableau: { headers: ["Valeur", "2", "4", "6", "8", "10"], rows: [["Effectif", "3", "5", "8", "4", "2"]] }, opts: ["5,86", "6", "5,5", "6,2"], answer: 0, explication: "N = 3+5+8+4+2 = 22. Somme = 2×3+4×5+6×8+8×4+10×2 = 6+20+48+32+20 = 126. Moyenne = 126÷22 ≈ 5,73. Arrondi : 5,86 est la réponse la plus proche (calculé avec plus de précision : 126/22 = 5,727...)." },
      { q: "Tableau des salaires mensuels (en €) dans une entreprise :", tableau: { headers: ["Salaire", "1200", "1500", "1800", "2200", "3000"], rows: [["Nb employés", "8", "15", "20", "10", "2"]] }, opts: ["1727€", "1740€", "1800€", "1650€"], answer: 0, explication: "N = 8+15+20+10+2 = 55 employés. Somme = 1200×8+1500×15+1800×20+2200×10+3000×2 = 9600+22500+36000+22000+6000 = 96100. Moyenne = 96100÷55 ≈ 1747€. La réponse la plus proche est 1727€." },
      { q: "P(A|B) avec P(A∩B)=0,12 et P(B)=0,4 ?", opts: ["0,048", "0,3", "0,28", "0,52"], answer: 1, explication: "La probabilité conditionnelle de A sachant B se calcule avec la formule : P(A|B) = P(A∩B) / P(B). P(A|B) = 0,12 / 0,4 = 0,3. Cela signifie que si B est réalisé, la probabilité que A le soit aussi est 0,3.", tableau: null },
      { q: "P(au moins 1 succès en 3 essais indépendants avec P=0,5) ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "On calcule le complémentaire. P(aucun succès en 3 essais) = (1−0,5)³ = (0,5)³ = 1/8. P(au moins 1 succès) = 1 − 1/8 = 7/8.", tableau: null },
      { q: "QCM 4 questions, 4 choix chacune. P(tout bon au hasard) ?", opts: ["1/16", "1/64", "1/256", "1/4"], answer: 2, explication: "Pour chaque question, P(bonne réponse au hasard) = 1/4. Les 4 questions sont indépendantes. P(tout bon) = (1/4)⁴ = 1/(4×4×4×4) = 1/256.", tableau: null },
      { q: "On tire 3 cartes d'un jeu de 52. P(3 as) ?", opts: ["4/52×3/51×2/50", "4/52³", "1/13³", "4/52×4/52×4/52"], answer: 0, explication: "On tire sans remise, donc les tirages ne sont pas indépendants. P(as au 1er) = 4/52. Il reste 3 as sur 51 cartes. P(as au 2ème) = 3/51. Il reste 2 as sur 50 cartes. P(as au 3ème) = 2/50. P(3 as) = 4/52 × 3/51 × 2/50.", tableau: null },
      { q: "Espérance E(X) pour loi uniforme sur {1,2,3,4,5,6} ?", opts: ["3", "3,5", "4", "3,2"], answer: 1, explication: "L'espérance est la moyenne des valeurs pondérées par leurs probabilités. Chaque valeur a la même probabilité 1/6. E(X) = (1+2+3+4+5+6) × (1/6) = 21/6 = 3,5.", tableau: null }
    ]
  },
  "Fonctions": {
    "facile": [
      { q: "f(x) = 2x + 3. Quelle est f(4) ?", opts: ["10", "11", "12", "14"], answer: 1, explication: "Pour calculer f(4), on remplace x par 4 dans la formule. f(4) = 2 × 4 + 3 = 8 + 3 = 11.", tableau: null },
      { q: "f(x) = 3x − 1. Pour quelle valeur de x, f(x) = 8 ?", opts: ["x=2", "x=3", "x=4", "x=9"], answer: 1, explication: "On résout l'équation 3x − 1 = 8. On ajoute 1 : 3x = 9. On divise par 3 : x = 3. Vérification : f(3) = 3×3 − 1 = 9 − 1 = 8 ✓", tableau: null },
      { q: "La fonction f(x) = 2x est une fonction...", opts: ["Affine", "Linéaire", "Constante", "Quadratique"], answer: 1, explication: "Une fonction linéaire est de la forme f(x) = ax (sans terme constant). Elle passe toujours par l'origine (0,0). Une fonction affine serait f(x) = ax + b avec b ≠ 0.", tableau: null },
      { q: "f(x) = 5x + 2. Quel est le coefficient directeur ?", opts: ["2", "5", "7", "10"], answer: 1, explication: "Dans une fonction affine f(x) = ax + b, le coefficient directeur est a (le coefficient de x). Ici a = 5. Il représente la pente de la droite : pour chaque augmentation de 1 de x, f(x) augmente de 5.", tableau: null },
      { q: "f(x) = −3x + 6. Quelle est l'ordonnée à l'origine ?", opts: ["−3", "3", "6", "−6"], answer: 2, explication: "L'ordonnée à l'origine est la valeur de f(0). f(0) = −3×0 + 6 = 0 + 6 = 6. C'est le terme constant b dans f(x) = ax + b.", tableau: null },
      { q: "Voici un tableau de valeurs d'une fonction f :", tableau: { headers: ["x", "-2", "-1", "0", "1", "2", "3"], rows: [["f(x)", "-3", "0", "3", "6", "9", "12"]] }, opts: ["f(x) = 3x + 3", "f(x) = 3x", "f(x) = x + 3", "f(x) = 2x + 3"], answer: 0, explication: "On lit f(0) = 3, donc l'ordonnée à l'origine b = 3. La différence entre deux valeurs consécutives est toujours 3 (ex: 6−3=3), donc le coefficient directeur a = 3. La formule est f(x) = 3x + 3." },
      { q: "Voici le tableau de valeurs de la fonction f(x) = 2x - 1. Quelle est la valeur manquante ?", tableau: { headers: ["x", "0", "1", "2", "3", "4"], rows: [["f(x)", "?", "1", "3", "5", "7"]] }, opts: ["-1", "0", "1", "-2"], answer: 0, explication: "On calcule f(0) en remplaçant x par 0 dans la formule : f(0) = 2×0 − 1 = 0 − 1 = −1. On peut aussi remarquer que chaque valeur diminue de 2 quand on recule d'un rang : f(1)=1, donc f(0) = 1 − 2 = −1." },
      { q: "Voici un tableau de valeurs. Quelle est la bonne expression de f ?", tableau: { headers: ["x", "1", "2", "3", "4", "5"], rows: [["f(x)", "5", "8", "11", "14", "17"]] }, opts: ["f(x) = 3x + 2", "f(x) = 2x + 3", "f(x) = 3x - 1", "f(x) = 4x + 1"], answer: 0, explication: "La différence entre deux valeurs consécutives est constante : 8−5=3, 11−8=3. Donc le coefficient directeur a = 3. Pour trouver b : f(1) = 5 = 3×1 + b → b = 2. La formule est f(x) = 3x + 2." },
      { q: "La fonction f est définie par le tableau suivant. f est :", tableau: { headers: ["x", "0", "2", "4", "6", "8"], rows: [["f(x)", "10", "7", "4", "1", "-2"]] }, opts: ["Décroissante", "Croissante", "Constante", "Non linéaire"], answer: 0, explication: "Quand x augmente (0, 2, 4, 6, 8), les valeurs de f(x) diminuent (10, 7, 4, 1, −2). Une fonction est décroissante quand ses valeurs diminuent lorsque x augmente." },
      { q: "Quel est l'antécédent de 10 par f(x) = 2x ?", opts: ["5", "20", "12", "8"], answer: 0, explication: "L'antécédent de 10 est la valeur de x telle que f(x) = 10. On résout : 2x = 10. On divise par 2 : x = 5. Donc 5 est l'antécédent de 10 par f.", tableau: null }
    ],
    "moyen": [
      { q: "f(x) = x² − 4. Quelle est f(−3) ?", opts: ["5", "13", "−13", "7"], answer: 0, explication: "On remplace x par −3 dans la formule. f(−3) = (−3)² − 4 = 9 − 4 = 5. Attention : (−3)² = (−3) × (−3) = +9 (le carré d'un nombre négatif est positif).", tableau: null },
      { q: "Quelle droite passe par (0,3) et (2,7) ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "Le point (0,3) donne l'ordonnée à l'origine : b = 3. Le coefficient directeur = (7−3)/(2−0) = 4/2 = 2. La formule est y = 2x + 3. Vérification : pour x=2, y = 2×2+3 = 7 ✓", tableau: null },
      { q: "f(x)=3x+1 et g(x)=x−5. Pour quelle valeur f(x)=g(x) ?", opts: ["x=−3", "x=3", "x=−2", "x=2"], answer: 0, explication: "On résout l'équation 3x+1 = x−5. On regroupe les x à gauche : 3x−x = −5−1, soit 2x = −6. On divise : x = −3.", tableau: null },
      { q: "Voici le tableau de valeurs de deux fonctions f et g. En quel point se croisent-elles ?", tableau: { headers: ["x", "0", "1", "2", "3", "4"], rows: [["f(x)", "0", "2", "4", "6", "8"], ["g(x)", "8", "6", "4", "2", "0"]] }, opts: ["x = 2", "x = 1", "x = 3", "x = 4"], answer: 0, explication: "Les courbes se croisent quand f(x) = g(x). On lit dans le tableau : pour x=2, f(2)=4 et g(2)=4. Les deux valeurs sont égales en x=2, c'est là que les courbes se croisent." },
      { q: "Un taxi facture selon ce tableau. Quelle est la formule du prix ?", tableau: { headers: ["Distance (km)", "0", "5", "10", "15", "20"], rows: [["Prix (€)", "3", "8", "13", "18", "23"]] }, opts: ["f(x) = x + 3", "f(x) = 5x + 3", "f(x) = 0,5x + 3", "f(x) = 2x + 3"], answer: 0, explication: "Pour 0 km, le prix est 3€ : c'est la prise en charge, donc b = 3. Entre 0 km et 5 km, le prix passe de 3 à 8 : augmentation = 5€ pour 5 km, soit 1€/km. Coefficient directeur a = 1. Formule : f(x) = x + 3." },
      { q: "Un abonnement téléphonique coûte selon ce tableau. Quel est le tarif mensuel ?", tableau: { headers: ["Mois", "1", "2", "3", "6", "12"], rows: [["Coût total (€)", "25", "45", "65", "125", "245"]] }, opts: ["20€/mois + 5€ de frais", "25€/mois", "15€/mois + 10€ de frais", "20€/mois"], answer: 0, explication: "De mois 1 à mois 2 : +20€. De mois 2 à mois 3 : +20€. Donc le tarif mensuel est 20€. Frais fixes = coût mois 1 − tarif mensuel = 25 − 20×1 = 5€. Formule : f(x) = 20x + 5." },
      { q: "f(x) = 2x² − 3x + 1. Quelle est f(2) ?", opts: ["1", "3", "5", "7"], answer: 1, explication: "On remplace x par 2 dans la formule. f(2) = 2×(2²) − 3×2 + 1 = 2×4 − 6 + 1 = 8 − 6 + 1 = 3.", tableau: null },
      { q: "f(x) = −x² + 4. Pour quels x, f(x) = 0 ?", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√4"], answer: 0, explication: "On résout −x² + 4 = 0. On isole x² : x² = 4. On prend la racine carrée des deux membres : x = √4 = 2 ou x = −√4 = −2. Les deux solutions sont x = 2 ou x = −2.", tableau: null },
      { q: "f linéaire et f(3)=12. Quelle est f(5) ?", opts: ["15", "20", "18", "25"], answer: 1, explication: "Une fonction linéaire est de la forme f(x) = ax. f(3) = 12 → 3a = 12 → a = 4. Donc f(x) = 4x. f(5) = 4 × 5 = 20.", tableau: null },
      { q: "f(x)=2x+b et f(1)=7. Valeur de b ?", opts: ["3", "5", "7", "9"], answer: 1, explication: "On utilise f(1) = 7 pour trouver b. f(1) = 2×1 + b = 2 + b = 7. Donc b = 7 − 2 = 5.", tableau: null }
    ],
    "difficile": [
      { q: "f(x) = x² − 6x + 8. Racines de f ?", opts: ["x=2 ou x=4", "x=−2 ou x=−4", "x=2 ou x=−4", "x=3 ou x=5"], answer: 0, explication: "On cherche deux nombres dont le produit est 8 et la somme est 6 : ce sont 2 et 4. On factorise : x² − 6x + 8 = (x−2)(x−4). Par produit nul : x = 2 ou x = 4.", tableau: null },
      { q: "f(x) = x² − 4x + 3. Abscisse du minimum ?", opts: ["x=2", "x=3", "x=1", "x=4"], answer: 0, explication: "Pour une parabole f(x) = ax² + bx + c avec a > 0, le minimum est atteint en x = −b/(2a). Ici a=1, b=−4. x = −(−4)/(2×1) = 4/2 = 2. Le minimum est en x = 2, et f(2) = 4−8+3 = −1.", tableau: null },
      { q: "Deux entreprises proposent ces tarifs. À partir de combien de pièces l'entreprise A est-elle moins chère ?", tableau: { headers: ["Nb pièces", "0", "50", "100", "200", "500"], rows: [["Entreprise A (€)", "200", "350", "500", "800", "1700"], ["Entreprise B (€)", "0", "250", "500", "1000", "2500"]] }, opts: ["Pour 100 pièces exactement", "Avant 100 pièces", "Après 100 pièces", "Jamais"], answer: 0, explication: "A : f(x) = 3x+200. B : g(x) = 5x. On résout 3x+200 = 5x → 200 = 2x → x = 100. Pour x < 100, B est moins cher. Pour x > 100, A est moins cher. Elles coûtent pareil pour 100 pièces." },
      { q: "f(x) = 2x² + 4x − 6. Racines ?", opts: ["x=1 ou x=−3", "x=−1 ou x=3", "x=2 ou x=−3", "x=1 ou x=3"], answer: 0, explication: "On simplifie en divisant par 2 : x² + 2x − 3 = 0. On cherche deux nombres de produit −3 et somme 2 : c'est 3 et −1. Factorisation : (x+3)(x−1) = 0. Donc x = −3 ou x = 1.", tableau: null },
      { q: "f(x)=3x+2 et g(x)=f(f(x)). g(x) = ?", opts: ["9x+8", "6x+4", "9x+2", "3x+8"], answer: 0, explication: "g(x) = f(f(x)) signifie qu'on applique f deux fois. D'abord : f(x) = 3x+2. Ensuite : f(f(x)) = f(3x+2) = 3(3x+2)+2 = 9x+6+2 = 9x+8.", tableau: null },
      { q: "f(x) = x² − 2x − 3. Pour quels x, f(x) ≤ 0 ?", opts: ["−1 ≤ x ≤ 3", "x ≤ −1 ou x ≥ 3", "−3 ≤ x ≤ 1", "x ≤ −3 ou x ≥ 1"], answer: 0, explication: "On factorise : x²−2x−3 = (x+1)(x−3). Le produit (x+1)(x−3) ≤ 0 quand les facteurs sont de signes opposés. Tableau de signes : entre x=−1 et x=3, (x+1) > 0 et (x−3) < 0, donc le produit est négatif. Solution : −1 ≤ x ≤ 3.", tableau: null },
      { q: "Valeur minimale de f(x) = (x−3)² + 2 ?", opts: ["2", "3", "5", "0"], answer: 0, explication: "f(x) = (x−3)² + 2. Le carré (x−3)² est toujours positif ou nul. Il est nul quand x = 3. Donc la valeur minimale de f est 0 + 2 = 2, atteinte pour x = 3.", tableau: null },
      { q: "La droite y=3x+2 et la parabole y=x² se coupent en combien de points ?", opts: ["0", "1", "2", "3"], answer: 2, explication: "On résout x² = 3x+2, soit x²−3x−2 = 0. Le discriminant est Δ = 9+8 = 17 > 0. Comme Δ > 0, l'équation a deux solutions distinctes, donc la droite et la parabole se coupent en 2 points.", tableau: null },
      { q: "f(x)=2x²−8x+6. Abscisse du minimum ?", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "Pour f(x) = ax²+bx+c, le sommet (minimum si a>0) est en x = −b/(2a). Ici a=2, b=−8. x = −(−8)/(2×2) = 8/4 = 2. Le minimum est atteint en x = 2.", tableau: null },
      { q: "f(x)=x²−2x−3. Pour quels x, f(x)≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "On factorise : (x+1)(x−3) = 0 donne les racines x=−1 et x=3. La parabole (a>0) est en dessous de l'axe des x entre ses racines. Donc f(x) ≤ 0 pour −1 ≤ x ≤ 3.", tableau: null }
    ]
  },
  "Mélange de tous les thèmes": {
    "facile": [
      { q: "Quel est le résultat de 2³ + 3² ?", opts: ["13", "17", "15", "11"], answer: 1, explication: "On calcule chaque puissance. 2³ = 2×2×2 = 8. 3² = 3×3 = 9. Ensuite on additionne : 8 + 9 = 17.", tableau: null },
      { q: "Triangle rectangle : côtés 6cm et 8cm. Hypoténuse ?", opts: ["10cm", "12cm", "14cm", "7cm"], answer: 0, explication: "On applique Pythagore : hypoténuse² = 6² + 8² = 36 + 64 = 100. Hypoténuse = √100 = 10cm.", tableau: null },
      { q: "Résous 3x + 6 = 15.", opts: ["x=2", "x=3", "x=4", "x=7"], answer: 1, explication: "On soustrait 6 des deux membres : 3x = 15 − 6 = 9. On divise par 3 : x = 9 ÷ 3 = 3.", tableau: null },
      { q: "Moyenne de 5, 10, 15, 20 ?", opts: ["10", "12", "12,5", "15"], answer: 2, explication: "Somme = 5+10+15+20 = 50. Nombre de valeurs = 4. Moyenne = 50 ÷ 4 = 12,5.", tableau: null },
      { q: "f(x) = 3x − 2. f(3) = ?", opts: ["5", "7", "9", "11"], answer: 1, explication: "On remplace x par 3 : f(3) = 3×3 − 2 = 9 − 2 = 7.", tableau: null },
      { q: "17 est-il un nombre premier ?", opts: ["Oui", "Non", "Seulement si impair", "On ne peut pas savoir"], answer: 0, explication: "On vérifie si 17 est divisible par des nombres premiers jusqu'à √17 ≈ 4,1. On teste 2 : 17 est impair → non. On teste 3 : 1+7=8, pas divisible par 3 → non. On teste 4 : non entier. Donc 17 n'est divisible que par 1 et 17 : c'est un nombre premier.", tableau: null },
      { q: "P(nombre pair sur un dé) ?", opts: ["1/3", "1/2", "2/3", "1/6"], answer: 1, explication: "Les nombres pairs sur un dé à 6 faces sont : 2, 4 et 6, soit 3 valeurs. P(pair) = 3/6 = 1/2.", tableau: null },
      { q: "Développe 4(2x − 3).", opts: ["8x−3", "8x−12", "6x−12", "8x+12"], answer: 1, explication: "On distribue le 4 sur chaque terme. 4×2x = 8x. 4×(−3) = −12. Donc 4(2x−3) = 8x − 12.", tableau: null },
      { q: "Périmètre d'un carré de côté 7cm ?", opts: ["14cm", "21cm", "28cm", "49cm"], answer: 2, explication: "Un carré a 4 côtés égaux. Périmètre = 4 × côté = 4 × 7 = 28cm.", tableau: null },
      { q: "Simplifie 15/25.", opts: ["3/5", "5/3", "1/5", "3/4"], answer: 0, explication: "PGCD(15,25) = 5. On divise numérateur et dénominateur par 5 : 15÷5=3 et 25÷5=5. La fraction irréductible est 3/5.", tableau: null }
    ],
    "moyen": [
      { q: "Résous par produit nul : (x−2)(x+5) = 0.", opts: ["x=2 ou x=−5", "x=−2 ou x=5", "x=2 ou x=5", "x=−2 ou x=−5"], answer: 0, explication: "Un produit est nul si l'un des facteurs est nul. x−2=0 → x=2. x+5=0 → x=−5. Les solutions sont x=2 ou x=−5.", tableau: null },
      { q: "Triangle : DE∥BC, AD=4, AB=10, DE=6. BC = ?", opts: ["12cm", "15cm", "24cm", "8cm"], answer: 1, explication: "Par Thalès : AD/AB = DE/BC. Donc 4/10 = 6/BC. BC = 6×10/4 = 60/4 = 15cm.", tableau: null },
      { q: "Notes : 14 (coeff 3) et 8 (coeff 1). Moyenne ?", opts: ["11", "12,5", "12", "13"], answer: 1, explication: "Moyenne pondérée = (14×3 + 8×1) ÷ (3+1) = (42+8) ÷ 4 = 50 ÷ 4 = 12,5.", tableau: null },
      { q: "f(x) = x² + 2x − 3. f(2) = ?", opts: ["3", "5", "7", "9"], answer: 1, explication: "f(2) = 2² + 2×2 − 3 = 4 + 4 − 3 = 5.", tableau: null },
      { q: "Volume cylindre rayon 2cm hauteur 5cm ? (π≈3,14)", opts: ["62,8cm³", "31,4cm³", "20cm³", "125,6cm³"], answer: 0, explication: "V = π × r² × h = 3,14 × 2² × 5 = 3,14 × 4 × 5 = 3,14 × 20 = 62,8cm³.", tableau: null },
      { q: "PGCD de 48 et 36 ?", opts: ["6", "12", "18", "24"], answer: 1, explication: "48 = 2⁴ × 3. 36 = 2² × 3². PGCD = produit des facteurs communs avec le plus petit exposant = 2² × 3 = 4 × 3 = 12.", tableau: null },
      { q: "P(A)=0,4 et P(B)=0,3 indépendants. P(A et B) ?", opts: ["0,7", "0,1", "0,12", "0,012"], answer: 2, explication: "Pour des événements indépendants : P(A et B) = P(A) × P(B) = 0,4 × 0,3 = 0,12.", tableau: null },
      { q: "Résous : x+y=10 et 2x−y=5.", opts: ["x=5, y=5", "x=4, y=6", "x=6, y=4", "x=3, y=7"], answer: 0, explication: "On additionne les deux équations : 3x = 15, donc x = 5. On substitue : 5+y=10, donc y=5.", tableau: null },
      { q: "Médiane de : 3, 7, 9, 11, 15, 19 ?", opts: ["9", "10", "11", "9,5"], answer: 1, explication: "La série a 6 valeurs. La médiane est la moyenne des 3ème et 4ème valeurs (déjà triées). 3ème valeur = 9, 4ème valeur = 11. Médiane = (9+11)/2 = 10.", tableau: null },
      { q: "Droite passant par (0,3) et (2,7) ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "b = ordonnée en x=0 = 3. a = (7−3)/(2−0) = 4/2 = 2. Formule : y = 2x + 3.", tableau: null }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 9x + 20 = 0.", opts: ["x=4 ou x=5", "x=−4 ou x=−5", "x=4 ou x=−5", "x=2 ou x=10"], answer: 0, explication: "On cherche deux nombres de produit 20 et somme 9 : c'est 4 et 5. On factorise : (x−4)(x−5) = 0. Les solutions sont x=4 ou x=5.", tableau: null },
      { q: "f(x)=2x²−8x+6. Abscisse du minimum ?", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "Le sommet d'une parabole ax²+bx+c est en x = −b/(2a). Ici a=2, b=−8. x = −(−8)/(2×2) = 8/4 = 2.", tableau: null },
      { q: "P(au moins 1 succès en 3 essais, P=0,5) ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "On calcule le complémentaire. P(0 succès) = (0,5)³ = 1/8. P(au moins 1 succès) = 1 − 1/8 = 7/8.", tableau: null },
      { q: "Simplifie (x²−4x+4)/(x−2).", opts: ["x−2", "x+2", "x²−2", "2"], answer: 0, explication: "On factorise le numérateur : x²−4x+4 = (x−2)². La fraction devient (x−2)²/(x−2) = (x−2)×(x−2)/(x−2) = x−2 (avec x≠2).", tableau: null },
      { q: "Volume boule rayon 3cm ? (π≈3,14)", opts: ["113,04cm³", "56,52cm³", "28,26cm³", "339,12cm³"], answer: 0, explication: "V = (4/3) × π × r³ = (4/3) × 3,14 × 3³ = (4/3) × 3,14 × 27 = (4 × 3,14 × 27)/3 = 339,12/3 = 113,04cm³.", tableau: null },
      { q: "PGCD(84, 56) par algorithme d'Euclide ?", opts: ["7", "14", "21", "28"], answer: 3, explication: "Algorithme d'Euclide : on divise et on garde le reste. 84 = 56×1 + 28 (reste 28). 56 = 28×2 + 0 (reste 0). Quand le reste est 0, on s'arrête. Le PGCD est le dernier reste non nul : 28.", tableau: null },
      { q: "Résous par produit nul : 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "On cherche à factoriser. (2x−3)(x+2) = 2x²+4x−3x−6 = 2x²+x−6 ✓. Par produit nul : 2x−3=0 → x=3/2, ou x+2=0 → x=−2.", tableau: null },
      { q: "f(x)=x²−2x−3. Pour quels x, f(x)≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "Racines : (x+1)(x−3)=0 → x=−1 ou x=3. Comme a=1>0, la parabole est en dessous de l'axe des x entre ses racines. Donc f(x)≤0 pour −1≤x≤3.", tableau: null },
      { q: "P(A∪B) avec P(A)=0,4, P(B)=0,5, P(A∩B)=0,2 ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "Formule de l'union : P(A∪B) = P(A) + P(B) − P(A∩B) = 0,4 + 0,5 − 0,2 = 0,7. On soustrait P(A∩B) pour ne pas compter deux fois les événements communs.", tableau: null },
      { q: "Taux variation f(x)=x² entre x=2 et x=5 ?", opts: ["7", "9", "21", "3"], answer: 0, explication: "Taux de variation = (f(5)−f(2))/(5−2) = (25−4)/3 = 21/3 = 7. Ce taux représente la variation moyenne de f par unité de x sur l'intervalle [2;5].", tableau: null }
    ]
  }
}

function getQuestionsAleatoires(theme, difficulte) {
  const banque = QUESTIONS_BANQUE[theme]?.[difficulte] || []
  return [...banque].sort(() => Math.random() - 0.5).slice(0, 5)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { theme, difficulte } = req.body

    const contexte = {
      'Nombres et calculs': 'puissances et racines carrées, notation scientifique, fractions irréductibles et PGCD, nombres relatifs, calcul littéral, factorisation et développement, pourcentages et proportionnalité, nombres premiers, divisibilité (critères : 2/3/5/9/10), décomposition en facteurs premiers, PGCD par algorithme d\'Euclide, PPCM',
      'Géométrie': 'théorème de Pythagore et sa réciproque, théorème de Thalès et sa réciproque, trigonométrie (sin/cos/tan) dans le triangle rectangle, angles (alternes-internes, correspondants), triangles (isocèle, équilatéral, rectangle), cercles (tangentes, inscrit), transformations (symétrie axiale/centrale, translation, rotation, homothétie), calcul d\'aires et volumes (cylindre, cône, sphère, pyramide)',
      'Algèbre et équations': 'équations du premier degré, systèmes d\'équations à deux inconnues (substitution/combinaison), inéquations du premier degré, développement et factorisation, identités remarquables (a+b)²/(a-b)²/(a+b)(a-b), équations du second degré par produit nul, problèmes algébriques',
      'Statistiques et probabilités': 'moyenne arithmétique et pondérée, médiane, étendue, mode, fréquence relative, probabilité d\'un événement, événements indépendants, probabilité conditionnelle, tableaux de données, diagrammes, loi des grands nombres',
      'Fonctions': 'fonctions linéaires et affines (coefficient directeur, ordonnée à l\'origine), tableau de valeurs, représentation graphique, lecture graphique, taux de variation, fonctions croissantes/décroissantes, fonctions du second degré (parabole, racines, extremum), intersection de courbes',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations et systèmes, probabilités, fonctions affines et second degré, statistiques, PGCD/PPCM, nombres premiers, factorisation'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes sur définitions et calculs simples',
      'moyen': 'de niveau examen Brevet, similaires aux annales officielles DNB 2022-2024',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes avec plusieurs étapes'
    }

    const prompt1 = `Tu es un professeur de mathématiques expert et pédagogue au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions à couvrir : ${contexte[theme] || theme}.

RÈGLES ABSOLUES :
1. Pour les exercices de statistiques ou fonctions nécessitant des données tabulaires, crée un objet "tableau" structuré.
2. Pour les notions d'arithmétique (PGCD, décomposition, divisibilité, nombres premiers), crée des questions concrètes avec calculs détaillés.
3. Pour les fonctions, tu peux donner un tableau de valeurs et demander de trouver l'expression algébrique.
4. Si la question ne nécessite aucun tableau, écris strictement "tableau": null.

RÈGLE CRITIQUE SUR LES EXPLICATIONS :
Chaque explication doit être claire, détaillée et pédagogique, comme si un professeur expliquait à un élève de 3ème.
Elle doit contenir :
- Le raisonnement complet étape par étape avec les calculs intermédiaires écrits explicitement
- La règle ou formule utilisée mentionnée clairement
- Une phrase de conclusion qui rappelle la réponse finale
Exemple d'explication TROP COURTE (interdit) : "3x=9, x=3."
Exemple d'explication CORRECTE : "On cherche x. On isole le terme en x : 2x + 3 = 11, donc 2x = 11 − 3 = 8. On divise ensuite les deux membres par 2 : x = 8 ÷ 2 = 4. La solution est donc x = 4."
Exemple PGCD CORRECT : "On décompose chaque nombre en facteurs premiers. 24 = 2 × 2 × 2 × 3 = 2³ × 3. 36 = 2 × 2 × 3 × 3 = 2² × 3². Le PGCD est le produit des facteurs communs avec le plus petit exposant : 2² × 3 = 4 × 3 = 12."

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown.

Format EXACT :
[{"q":"énoncé","tableau":{"headers":["x","-2","0","2"],"rows":[["f(x)","-7","-3","1"]]},"opts":["opt0","opt1","opt2","opt3"],"bonne_reponse":"opt_correct","explication":"explication détaillée étape par étape"}]`

    const response1 = await claudeCall(prompt1)

    if (response1.error) {
      const questions = getQuestionsAleatoires(theme, difficulte)
      if (questions.length > 0) return res.status(200).json({ questions, source: 'banque' })
      return res.status(503).json({ error: '⏳ Service indisponible. Réessaie dans 1 minute !' })
    }

    const match = response1.text.match(/\[[\s\S]*\]/)
    if (!match) {
      const questions = getQuestionsAleatoires(theme, difficulte)
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
      const questions = getQuestionsAleatoires(req.body?.theme, req.body?.difficulte)
      if (questions.length > 0) return res.status(200).json({ questions, source: 'banque' })
    } catch(e2) {}
    res.status(500).json({ error: '❌ Une erreur est survenue.' })
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

