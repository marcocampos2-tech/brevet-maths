// Banque de questions intégrée directement (pas d'import nécessaire)
const QUESTIONS_BANQUE = {
  "Nombres et calculs": {
    "facile": [
      { q: "Quel est le résultat de 3² × 2³ ?", opts: ["36", "72", "48", "24"], answer: 1, explication: "3² = 9 et 2³ = 8, donc 9 × 8 = 72.", tableau: null },
      { q: "Quelle est la valeur de (-3) × (-4) ?", opts: ["−12", "12", "7", "−7"], answer: 1, explication: "Le produit de deux nombres négatifs est positif : (-3) × (-4) = 12.", tableau: null },
      { q: "Quel est le résultat de 3/4 + 1/2 ?", opts: ["4/6", "5/4", "1/4", "2/3"], answer: 1, explication: "1/2 = 2/4, donc 3/4 + 2/4 = 5/4.", tableau: null },
      { q: "Quel est le pourcentage de 15 sur 60 ?", opts: ["20%", "25%", "15%", "30%"], answer: 1, explication: "15 ÷ 60 = 0,25 = 25%.", tableau: null },
      { q: "Quel est le résultat de 2⁴ ?", opts: ["6", "8", "16", "12"], answer: 2, explication: "2⁴ = 2 × 2 × 2 × 2 = 16.", tableau: null },
      { q: "Simplifie la fraction 12/18.", opts: ["3/4", "2/3", "4/6", "1/2"], answer: 1, explication: "PGCD(12,18) = 6, donc 12/18 = 2/3.", tableau: null },
      { q: "Quel est le résultat de (-5) + 8 − 3 ?", opts: ["0", "6", "−6", "10"], answer: 0, explication: "−5 + 8 = 3, puis 3 − 3 = 0.", tableau: null },
      { q: "Développe 3(x + 4).", opts: ["3x + 4", "3x + 12", "x + 12", "3x − 12"], answer: 1, explication: "3 × x + 3 × 4 = 3x + 12.", tableau: null },
      { q: "Une veste coûte 80€ soldée à −25%. Quel est son nouveau prix ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "25% de 80 = 20€. Nouveau prix = 80 − 20 = 60€.", tableau: null },
      { q: "Quel est le résultat de 10⁰ ?", opts: ["0", "10", "1", "100"], answer: 2, explication: "Tout nombre non nul à la puissance 0 est égal à 1.", tableau: null }
    ],
    "moyen": [
      { q: "Factorise x² − 9.", opts: ["(x−3)²", "(x+3)(x−3)", "(x+9)(x−1)", "(x−9)(x+1)"], answer: 1, explication: "x² − 9 est une différence de carrés : (x+3)(x−3).", tableau: null },
      { q: "Quel est le résultat de (2/3)³ ?", opts: ["6/9", "8/27", "2/9", "4/9"], answer: 1, explication: "(2/3)³ = 2³/3³ = 8/27.", tableau: null },
      { q: "Développe et réduis (x+3)(x−2).", opts: ["x²+x−6", "x²−x−6", "x²+x+6", "x²−6"], answer: 0, explication: "x²−2x+3x−6 = x²+x−6.", tableau: null },
      { q: "Un article a augmenté de 20% puis baissé de 20%. Quel est le prix final ?", opts: ["Identique", "4% de moins", "4% de plus", "20% de moins"], answer: 1, explication: "1,2 × 0,8 = 0,96, donc le prix a baissé de 4%.", tableau: null },
      { q: "Quel est le résultat de 3 × 10⁻² ?", opts: ["300", "0,3", "0,03", "30"], answer: 2, explication: "10⁻² = 0,01, donc 3 × 0,01 = 0,03.", tableau: null },
      { q: "Factorise 2x² + 4x.", opts: ["2(x²+2x)", "2x(x+2)", "x(2x+4)", "2(x+2)"], answer: 1, explication: "On factorise par 2x : 2x(x+2).", tableau: null },
      { q: "Quel est le résultat de (-2)⁵ ?", opts: ["32", "−32", "10", "−10"], answer: 1, explication: "(-2)⁵ = −32.", tableau: null },
      { q: "Développe (2x−1)².", opts: ["4x²−1", "4x²+1", "4x²−4x+1", "4x²+4x+1"], answer: 2, explication: "(2x−1)² = 4x² − 4x + 1.", tableau: null },
      { q: "Un prix passe de 50€ à 65€. Quel est le taux d'augmentation ?", opts: ["15%", "20%", "25%", "30%"], answer: 3, explication: "(65−50)/50 × 100 = 30%.", tableau: null },
      { q: "Quel est le résultat de √144 ?", opts: ["11", "12", "13", "14"], answer: 1, explication: "12 × 12 = 144, donc √144 = 12.", tableau: null }
    ],
    "difficile": [
      { q: "Simplifie (3x² × 2x³) / (6x⁴).", opts: ["x", "x²", "6x", "x/6"], answer: 0, explication: "3×2=6, x²×x³=x⁵, 6x⁵/(6x⁴) = x.", tableau: null },
      { q: "Développe et réduis (x+2)² − (x−2)².", opts: ["8x", "4x", "8", "4x²"], answer: 0, explication: "(x²+4x+4) − (x²−4x+4) = 8x.", tableau: null },
      { q: "Quel est le résultat de (2×10³) × (3×10⁴) ?", opts: ["5×10⁷", "6×10⁷", "6×10¹²", "5×10¹²"], answer: 1, explication: "2×3=6 et 10³×10⁴=10⁷, donc 6×10⁷.", tableau: null },
      { q: "Factorise x² − 6x + 9.", opts: ["(x−3)²", "(x+3)²", "(x−3)(x+3)", "(x−9)(x+1)"], answer: 0, explication: "x² − 6x + 9 = (x−3)².", tableau: null },
      { q: "Un capital de 1000€ est placé à 5% pendant 2 ans. Quel est le montant final ?", opts: ["1100€", "1102,5€", "1105€", "1050€"], answer: 1, explication: "1000 × 1,05² = 1102,5€.", tableau: null },
      { q: "Simplifie (x²−4)/(x+2).", opts: ["x−2", "x+2", "x²−2", "x"], answer: 0, explication: "x²−4 = (x+2)(x−2), donc (x+2)(x−2)/(x+2) = x−2.", tableau: null },
      { q: "Quel est le résultat de 2⁻³ + 2⁻² ?", opts: ["3/8", "1/8", "1/4", "5/8"], answer: 0, explication: "2⁻³=1/8, 2⁻²=2/8, donc 3/8.", tableau: null },
      { q: "Un article soldé à −30% coûte 56€. Quel était son prix initial ?", opts: ["70€", "75€", "80€", "85€"], answer: 2, explication: "Prix × 0,7 = 56, donc prix = 80€.", tableau: null },
      { q: "Quel est le résultat de (√3 + 1)(√3 − 1) ?", opts: ["2", "4", "3", "√3"], answer: 0, explication: "(√3)² − 1² = 3 − 1 = 2.", tableau: null },
      { q: "Développe et réduis (x+1)(x+2)(x+3).", opts: ["x³+6x²+11x+6", "x³+3x²+6x+6", "x³+6x+6", "x³+6x²+6"], answer: 0, explication: "(x+1)(x+2)=x²+3x+2, puis ×(x+3) = x³+6x²+11x+6.", tableau: null }
    ]
  },
  "Géométrie": {
    "facile": [
      { q: "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent 3cm et 4cm. Quelle est l'hypoténuse ?", opts: ["5cm", "6cm", "7cm", "√7cm"], answer: 0, explication: "3²+4² = 25 = 5². Hypoténuse = 5cm.", tableau: null },
      { q: "Quel est le périmètre d'un rectangle de longueur 8cm et largeur 5cm ?", opts: ["40cm", "26cm", "13cm", "20cm"], answer: 1, explication: "P = 2×(8+5) = 26cm.", tableau: null },
      { q: "Quelle est l'aire d'un triangle de base 6cm et hauteur 4cm ?", opts: ["24cm²", "12cm²", "10cm²", "18cm²"], answer: 1, explication: "Aire = (6×4)/2 = 12cm².", tableau: null },
      { q: "Un angle d'un triangle mesure 90° et un autre 35°. Quel est le troisième angle ?", opts: ["45°", "55°", "65°", "75°"], answer: 1, explication: "180−90−35 = 55°.", tableau: null },
      { q: "Quel est le rayon d'un cercle de diamètre 14cm ?", opts: ["28cm", "14cm", "7cm", "3,5cm"], answer: 2, explication: "Rayon = 14/2 = 7cm.", tableau: null },
      { q: "Quelle est l'aire d'un carré de côté 6cm ?", opts: ["24cm²", "12cm²", "36cm²", "18cm²"], answer: 2, explication: "Aire = 6² = 36cm².", tableau: null },
      { q: "Quel est le volume d'un cube de côté 3cm ?", opts: ["9cm³", "18cm³", "27cm³", "81cm³"], answer: 2, explication: "Volume = 3³ = 27cm³.", tableau: null },
      { q: "Quelle est la circonférence d'un cercle de rayon 5cm ? (π≈3,14)", opts: ["31,4cm", "15,7cm", "78,5cm", "10cm"], answer: 0, explication: "C = 2×3,14×5 = 31,4cm.", tableau: null },
      { q: "Deux droites parallèles coupées par une sécante. Les angles alternes-internes sont...", opts: ["Supplémentaires", "Complémentaires", "Égaux", "Différents"], answer: 2, explication: "Les angles alternes-internes sont égaux.", tableau: null },
      { q: "Dans un triangle ABC, si AB = AC, le triangle est...", opts: ["Équilatéral", "Isocèle", "Rectangle", "Scalène"], answer: 1, explication: "Un triangle avec deux côtés égaux est isocèle.", tableau: null }
    ],
    "moyen": [
      { q: "Dans un triangle rectangle en A, sin(B) = 0,6 et BC = 10cm. Quelle est la longueur AC ?", opts: ["4cm", "6cm", "8cm", "5cm"], answer: 1, explication: "sin(B) = AC/BC = 0,6, donc AC = 6cm.", tableau: null },
      { q: "Dans un triangle ABC, DE∥BC avec AD=3, AB=9 et DE=4. Quelle est BC ?", opts: ["8cm", "12cm", "6cm", "10cm"], answer: 1, explication: "Thalès : BC/DE = AB/AD = 3, donc BC = 12cm.", tableau: null },
      { q: "Quelle est l'aire d'un trapèze de bases 6cm et 10cm, hauteur 4cm ?", opts: ["32cm²", "40cm²", "24cm²", "16cm²"], answer: 0, explication: "Aire = (10+6)/2 × 4 = 32cm².", tableau: null },
      { q: "Dans un triangle rectangle en A, tan(B) = 3/4 et AB = 8cm. Quelle est AC ?", opts: ["4cm", "6cm", "8cm", "12cm"], answer: 1, explication: "tan(B) = AC/AB, donc AC = (3/4)×8 = 6cm.", tableau: null },
      { q: "Quel est le volume d'un cylindre de rayon 3cm et hauteur 5cm ? (π≈3,14)", opts: ["94,2cm³", "141,3cm³", "47,1cm³", "188,4cm³"], answer: 1, explication: "V = 3,14×9×5 = 141,3cm³.", tableau: null },
      { q: "Dans un triangle ABC rectangle en C, AC=6cm et BC=8cm. Que vaut cos(A) ?", opts: ["3/5", "4/5", "3/4", "4/3"], answer: 0, explication: "AB=10cm. cos(A)=AC/AB=6/10=3/5.", tableau: null },
      { q: "Quelle est l'aire d'un disque de diamètre 10cm ? (π≈3,14)", opts: ["31,4cm²", "78,5cm²", "314cm²", "15,7cm²"], answer: 1, explication: "r=5cm. Aire = 3,14×25 = 78,5cm².", tableau: null },
      { q: "Dans un triangle ABC, AB=12cm, BC=9cm, AC=15cm. Le triangle est-il rectangle ?", opts: ["Oui, en A", "Oui, en B", "Oui, en C", "Non"], answer: 1, explication: "9²+12²=225=15². Rectangle en B.", tableau: null },
      { q: "Deux triangles semblables avec rapport 2. Le premier a aire 12cm². Quelle est l'aire du second ?", opts: ["24cm²", "36cm²", "48cm²", "6cm²"], answer: 2, explication: "L'aire est multipliée par 2² = 4. 12×4 = 48cm².", tableau: null },
      { q: "Dans un triangle ABC, AD est la médiane. D est...", opts: ["Le pied de la hauteur", "Le milieu de BC", "Le centre du cercle", "Le pied de la bissectrice"], answer: 1, explication: "La médiane relie un sommet au milieu du côté opposé.", tableau: null }
    ],
    "difficile": [
      { q: "Un cône a rayon 4cm et hauteur 3cm. Quel est son volume ? (π≈3,14)", opts: ["12,56cm³", "50,24cm³", "75,36cm³", "25,12cm³"], answer: 1, explication: "V=(1/3)×3,14×16×3=50,24cm³.", tableau: null },
      { q: "Deux cercles de rayons 3cm et 5cm, centres distants de 8cm. Sont-ils sécants ?", opts: ["Oui", "Non, extérieurs", "Non, intérieurs", "Tangents"], answer: 3, explication: "r1+r2=8cm = distance. Ils sont tangents extérieurement.", tableau: null },
      { q: "Quelle est l'aire d'un hexagone régulier de côté 4cm ?", opts: ["24√3cm²", "48cm²", "16√3cm²", "32√3cm²"], answer: 0, explication: "6 triangles équilatéraux : 6×(√3/4)×16 = 24√3cm².", tableau: null },
      { q: "Dans un triangle ABC, les médianes se coupent en G. AG = ?", opts: ["1/2 de la médiane", "2/3 de la médiane", "1/3 de la médiane", "3/4 de la médiane"], answer: 1, explication: "Le centre de gravité divise chaque médiane dans le rapport 2/3.", tableau: null },
      { q: "Quel est le volume d'une sphère de rayon 6cm ? (π≈3,14)", opts: ["904,32cm³", "452,16cm³", "113,04cm³", "226,08cm³"], answer: 0, explication: "V=(4/3)×3,14×216=904,32cm³.", tableau: null },
      { q: "Une pyramide carrée base 6cm côté et hauteur 4cm. Quel est son volume ?", opts: ["48cm³", "72cm³", "24cm³", "96cm³"], answer: 0, explication: "V=(1/3)×36×4=48cm³.", tableau: null },
      { q: "Dans un triangle ABC rectangle en C, CH altitude avec AH=2cm et CH=4cm. Quelle est AC ?", opts: ["2√5cm", "√20cm", "√18cm", "6cm"], answer: 0, explication: "AC²=AH×AB=2×10=20. AC=√20=2√5cm.", tableau: null },
      { q: "Dans un triangle, si les médianes se coupent en G, BG = ?", opts: ["1/3 de la médiane", "2/3 de la médiane", "1/2 de la médiane", "3/4 de la médiane"], answer: 1, explication: "Le centre de gravité divise chaque médiane dans le rapport 2/3 depuis le sommet.", tableau: null },
      { q: "Quel est le volume d'un cylindre de rayon 5cm et hauteur 8cm ? (π≈3,14)", opts: ["628cm³", "314cm³", "1256cm³", "200cm³"], answer: 0, explication: "V=3,14×25×8=628cm³.", tableau: null },
      { q: "Dans un triangle ABC, AB=13, BC=5, AC=12. Calculez sin(B).", opts: ["12/13", "5/13", "12/5", "5/12"], answer: 0, explication: "AB=13 est l'hypoténuse. sin(B)=AC/AB=12/13.", tableau: null }
    ]
  },
  "Algèbre et équations": {
    "facile": [
      { q: "Résous l'équation 2x + 3 = 11.", opts: ["x = 3", "x = 4", "x = 5", "x = 7"], answer: 1, explication: "2x = 8, donc x = 4.", tableau: null },
      { q: "Résous 3x − 5 = 10.", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 2, explication: "3x = 15, donc x = 5.", tableau: null },
      { q: "Quelle est la solution de x/3 = 4 ?", opts: ["x = 7", "x = 12", "x = 1,3", "x = 4/3"], answer: 1, explication: "x = 4 × 3 = 12.", tableau: null },
      { q: "Résous 5 − 2x = 1.", opts: ["x = 2", "x = 3", "x = −2", "x = −3"], answer: 0, explication: "−2x = −4, donc x = 2.", tableau: null },
      { q: "Développe 2(3x − 4).", opts: ["6x − 4", "6x − 8", "5x − 6", "6x + 8"], answer: 1, explication: "2×3x − 2×4 = 6x − 8.", tableau: null },
      { q: "Résous l'inéquation 2x > 6.", opts: ["x > 4", "x > 3", "x < 3", "x > 12"], answer: 1, explication: "x > 3.", tableau: null },
      { q: "Factorise 6x + 9.", opts: ["3(2x+3)", "6(x+3)", "3(2x+9)", "9(x+1)"], answer: 0, explication: "3(2x+3).", tableau: null },
      { q: "Résous 4x = 2x + 10.", opts: ["x = 4", "x = 5", "x = 6", "x = 10"], answer: 1, explication: "2x = 10, x = 5.", tableau: null },
      { q: "Quelle est la solution de 3(x+2) = 15 ?", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 0, explication: "x+2 = 5, donc x = 3.", tableau: null },
      { q: "Résous x + 5 > 8.", opts: ["x > 3", "x > 13", "x < 3", "x > 40"], answer: 0, explication: "x > 3.", tableau: null }
    ],
    "moyen": [
      { q: "Résous le système : x + y = 7 et x − y = 3.", opts: ["x=4, y=3", "x=5, y=2", "x=3, y=4", "x=2, y=5"], answer: 1, explication: "2x=10, x=5. y=2.", tableau: null },
      { q: "Résous par produit nul : (x−3)(x+2) = 0.", opts: ["x=3 ou x=−2", "x=−3 ou x=2", "x=3 ou x=2", "x=−3 ou x=−2"], answer: 0, explication: "x=3 ou x=−2.", tableau: null },
      { q: "Résous par produit nul : (2x−4)(x+1) = 0.", opts: ["x=2 ou x=1", "x=2 ou x=−1", "x=4 ou x=−1", "x=−2 ou x=1"], answer: 1, explication: "2x−4=0→x=2 ou x+1=0→x=−1.", tableau: null },
      { q: "Résous par produit nul : x(x−5) = 0.", opts: ["x=0 ou x=5", "x=0 ou x=−5", "x=5", "x=−5"], answer: 0, explication: "x=0 ou x=5.", tableau: null },
      { q: "Résous par produit nul : (3x+6)(x−4) = 0.", opts: ["x=−2 ou x=4", "x=2 ou x=4", "x=−6 ou x=4", "x=2 ou x=−4"], answer: 0, explication: "3x+6=0→x=−2 ou x=4.", tableau: null },
      { q: "Résous le système : 2x + y = 8 et x − y = 1.", opts: ["x=3, y=2", "x=2, y=4", "x=4, y=0", "x=3, y=3"], answer: 0, explication: "3x=9, x=3. y=2.", tableau: null },
      { q: "Résous l'inéquation 3x − 2 ≤ 7.", opts: ["x ≤ 3", "x ≤ 5", "x ≥ 3", "x ≤ 9"], answer: 0, explication: "3x ≤ 9, x ≤ 3.", tableau: null },
      { q: "Développe et réduis (x+4)(x−1).", opts: ["x²+3x−4", "x²−3x−4", "x²+3x+4", "x²+4"], answer: 0, explication: "x²−x+4x−4 = x²+3x−4.", tableau: null },
      { q: "Résous par produit nul : (x+3)² = 0.", opts: ["x=3", "x=−3", "x=9", "Pas de solution"], answer: 1, explication: "x+3=0→x=−3.", tableau: null },
      { q: "Résous le système : 3x − 2y = 1 et x + y = 2.", opts: ["x=1, y=1", "x=2, y=0", "x=0, y=2", "x=1, y=2"], answer: 0, explication: "x=2−y. 3(2−y)−2y=1→y=1, x=1.", tableau: null }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 5x + 6 = 0.", opts: ["x=2 ou x=3", "x=−2 ou x=−3", "x=1 ou x=6", "x=2 ou x=−3"], answer: 0, explication: "(x−2)(x−3)=0→x=2 ou x=3.", tableau: null },
      { q: "Résous par produit nul : x² − 7x = 0.", opts: ["x=0 ou x=7", "x=7", "x=0", "x=0 ou x=−7"], answer: 0, explication: "x(x−7)=0→x=0 ou x=7.", tableau: null },
      { q: "Résous par produit nul : 2x² − 8 = 0.", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√8"], answer: 0, explication: "2(x−2)(x+2)=0→x=2 ou x=−2.", tableau: null },
      { q: "Résous par produit nul : x² + 4x + 4 = 0.", opts: ["x=−2", "x=2", "x=−2 ou x=2", "Pas de solution"], answer: 0, explication: "(x+2)²=0→x=−2.", tableau: null },
      { q: "Résous par produit nul : 3x² − 12x + 9 = 0.", opts: ["x=1 ou x=3", "x=3 ou x=−1", "x=1 ou x=−3", "x=4 ou x=1"], answer: 0, explication: "3(x−1)(x−3)=0→x=1 ou x=3.", tableau: null },
      { q: "Résous par produit nul : x³ − x = 0.", opts: ["x=0, x=1 ou x=−1", "x=1 ou x=−1", "x=0 ou x=1", "x=0"], answer: 0, explication: "x(x−1)(x+1)=0→x=0, x=1 ou x=−1.", tableau: null },
      { q: "Résous : (x+1)/(x−1) = 2.", opts: ["x=3", "x=−3", "x=1/3", "x=−1/3"], answer: 0, explication: "x+1=2(x−1)→x=3.", tableau: null },
      { q: "Résous par produit nul : (x²−1)(x+3) = 0.", opts: ["x=1, x=−1 ou x=−3", "x=1 ou x=−3", "x=−1 ou x=3", "x=1, x=−1, x=3"], answer: 0, explication: "(x−1)(x+1)(x+3)=0→x=1, x=−1 ou x=−3.", tableau: null },
      { q: "Résous l'inéquation x² − 4 > 0.", opts: ["x>2 ou x<−2", "−2<x<2", "x>2", "x<−2"], answer: 0, explication: "(x−2)(x+2)>0→x>2 ou x<−2.", tableau: null },
      { q: "Résous par produit nul : 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "(2x−3)(x+2)=0→x=3/2 ou x=−2.", tableau: null }
    ]
  },
  "Statistiques et probabilités": {
    "facile": [
      { q: "Notes : 8, 12, 14, 10, 16. Quelle est la moyenne ?", opts: ["11", "12", "13", "10"], answer: 1, explication: "(8+12+14+10+16)/5 = 12.", tableau: null },
      { q: "Série triée : 5, 8, 10, 14, 17. Quelle est la médiane ?", opts: ["8", "10", "12", "14"], answer: 1, explication: "La valeur centrale est 10.", tableau: null },
      { q: "Un dé à 6 faces. Quelle est la probabilité d'obtenir un 3 ?", opts: ["1/3", "1/2", "1/6", "1/4"], answer: 2, explication: "P(3) = 1/6.", tableau: null },
      { q: "Classe de 30 élèves : 18 filles. Quelle est la fréquence des garçons ?", opts: ["18/30", "12/30", "18/12", "30/18"], answer: 1, explication: "12/30.", tableau: null },
      { q: "Quelle est l'étendue de : 3, 7, 2, 9, 5 ?", opts: ["5", "6", "7", "9"], answer: 2, explication: "9 − 2 = 7.", tableau: null },
      { q: "Probabilité de tirer un as dans 52 cartes ?", opts: ["1/13", "1/52", "4/13", "1/4"], answer: 0, explication: "4/52 = 1/13.", tableau: null },
      { q: "Moyenne de : 4, 6, 8, 10 ?", opts: ["6", "7", "8", "9"], answer: 1, explication: "28/4 = 7.", tableau: null },
      { q: "Sac : 3 rouges et 7 bleues. P(rouge) = ?", opts: ["3/7", "7/10", "3/10", "7/3"], answer: 2, explication: "3/10.", tableau: null },
      { q: "Série triée : 2, 4, 6, 8, 10, 12. Quelle est la médiane ?", opts: ["6", "7", "8", "6,5"], answer: 1, explication: "(6+8)/2 = 7.", tableau: null },
      { q: "Sur 20 lancers, 8 fois face. Fréquence de face ?", opts: ["0,3", "0,4", "0,5", "0,8"], answer: 1, explication: "8/20 = 0,4.", tableau: null }
    ],
    "moyen": [
      { q: "Notes avec coeff : 12 (coeff 2) et 16 (coeff 3). Moyenne pondérée ?", opts: ["13,6", "14", "14,4", "15"], answer: 2, explication: "(24+48)/5 = 14,4.", tableau: null },
      { q: "P(A)=0,3 et P(B)=0,5 indépendants. P(A et B) ?", opts: ["0,8", "0,15", "0,2", "0,35"], answer: 1, explication: "0,3 × 0,5 = 0,15.", tableau: null },
      { q: "Urne : 4 rouges, 3 bleues, 3 vertes. P(pas rouge) ?", opts: ["4/10", "6/10", "3/10", "7/10"], answer: 1, explication: "6/10.", tableau: null },
      { q: "On lance deux dés. P(deux 6) ?", opts: ["1/6", "2/6", "1/36", "1/12"], answer: 2, explication: "1/6 × 1/6 = 1/36.", tableau: null },
      { q: "P(A) = 0,6. P(non A) ?", opts: ["0,6", "0,4", "1,6", "0,3"], answer: 1, explication: "1 − 0,6 = 0,4.", tableau: null },
      { q: "25 élèves, 60% ont réussi. Combien ?", opts: ["12", "13", "15", "18"], answer: 2, explication: "0,6 × 25 = 15.", tableau: null },
      { q: "P(3 fois pile en 3 lancers) ?", opts: ["1/4", "1/8", "3/8", "1/6"], answer: 1, explication: "(1/2)³ = 1/8.", tableau: null },
      { q: "Étendue de : 15, 22, 8, 31, 17, 9 ?", opts: ["16", "20", "23", "15"], answer: 2, explication: "31 − 8 = 23.", tableau: null },
      { q: "Médiane d'une série de 9 valeurs triées est la... valeur.", opts: ["4ème", "5ème", "6ème", "7ème"], answer: 1, explication: "(9+1)/2 = 5ème.", tableau: null },
      { q: "Moyenne de : 5, 8, 8, 10, 12, 13 ?", opts: ["8", "9,33", "10", "9"], answer: 1, explication: "56/6 ≈ 9,33.", tableau: null }
    ],
    "difficile": [
      { q: "Urne : 5 rouges et 3 bleues. On tire 2 sans remise. P(2 rouges) ?", opts: ["5/14", "25/64", "10/28", "1/2"], answer: 0, explication: "(5/8)×(4/7) = 20/56 = 5/14.", tableau: null },
      { q: "P(A∪B) avec P(A)=0,4, P(B)=0,5, P(A∩B)=0,2 ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "0,4+0,5−0,2 = 0,7.", tableau: null },
      { q: "P(au moins un 6 en lançant deux dés) ?", opts: ["1/6", "11/36", "1/3", "12/36"], answer: 1, explication: "1 − (5/6)² = 11/36.", tableau: null },
      { q: "Médiane de 10 valeurs triées = moyenne des... valeurs.", opts: ["4ème et 5ème", "5ème et 6ème", "4ème et 6ème", "6ème et 7ème"], answer: 1, explication: "5ème et 6ème.", tableau: null },
      { q: "Espérance E(X) pour loi uniforme sur {1,2,3,4,5,6} ?", opts: ["3", "3,5", "4", "3,2"], answer: 1, explication: "21/6 = 3,5.", tableau: null },
      { q: "QCM 4 questions, 4 choix chacune. P(tout bon au hasard) ?", opts: ["1/16", "1/64", "1/256", "1/4"], answer: 2, explication: "(1/4)⁴ = 1/256.", tableau: null },
      { q: "La variance est la moyenne des... écarts à la moyenne.", opts: ["Absolus", "Carrés", "Relatifs", "Simples"], answer: 1, explication: "Carrés des écarts.", tableau: null },
      { q: "P(A|B) avec P(A∩B)=0,12 et P(B)=0,4 ?", opts: ["0,048", "0,3", "0,28", "0,52"], answer: 1, explication: "0,12/0,4 = 0,3.", tableau: null },
      { q: "P(au moins 1 succès en 3 essais indépendants avec P=0,5) ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "1−(1/2)³ = 7/8.", tableau: null },
      { q: "On tire 3 cartes d'un jeu de 52. P(3 as) ?", opts: ["4/52×3/51×2/50", "4/52³", "1/13³", "4/52×4/52×4/52"], answer: 0, explication: "Sans remise : (4/52)×(3/51)×(2/50).", tableau: null }
    ]
  },
  "Fonctions": {
    "facile": [
      { q: "f(x) = 2x + 3. Quelle est f(4) ?", opts: ["10", "11", "12", "14"], answer: 1, explication: "2×4+3 = 11.", tableau: null },
      { q: "f(x) = 3x − 1. Pour quelle valeur de x, f(x) = 8 ?", opts: ["x=2", "x=3", "x=4", "x=9"], answer: 1, explication: "3x=9→x=3.", tableau: null },
      { q: "La fonction f(x) = 2x est une fonction...", opts: ["Affine", "Linéaire", "Constante", "Quadratique"], answer: 1, explication: "Linéaire car elle passe par l'origine.", tableau: null },
      { q: "f(x) = 5x + 2. Quel est le coefficient directeur ?", opts: ["2", "5", "7", "10"], answer: 1, explication: "a = 5.", tableau: null },
      { q: "f(x) = −3x + 6. Quelle est l'ordonnée à l'origine ?", opts: ["−3", "3", "6", "−6"], answer: 2, explication: "b = 6.", tableau: null },
      { q: "La droite y = −2x + 5 est...", opts: ["Croissante", "Décroissante", "Constante", "Parabolique"], answer: 1, explication: "Coefficient directeur −2 < 0 → décroissante.", tableau: null },
      { q: "f(x) = x + 3. Quelle est f(−2) ?", opts: ["−5", "1", "5", "−1"], answer: 1, explication: "−2+3 = 1.", tableau: null },
      { q: "Quelle est l'image de 0 par f(x) = 3x − 7 ?", opts: ["3", "−7", "7", "0"], answer: 1, explication: "f(0) = −7.", tableau: null },
      { q: "Quel est l'antécédent de 10 par f(x) = 2x ?", opts: ["5", "20", "12", "8"], answer: 0, explication: "2x=10→x=5.", tableau: null },
      { q: "f(x) = 4x. Taux de variation entre x=1 et x=3 ?", opts: ["2", "4", "8", "12"], answer: 1, explication: "(12−4)/2 = 4.", tableau: null }
    ],
    "moyen": [
      { q: "f(x) = x² − 4. Quelle est f(−3) ?", opts: ["5", "13", "−13", "7"], answer: 0, explication: "(−3)²−4 = 5.", tableau: null },
      { q: "Quelle droite passe par (0,3) et (2,7) ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "a=2, b=3.", tableau: null },
      { q: "f(x)=3x+1 et g(x)=x−5. Pour quelle valeur f(x)=g(x) ?", opts: ["x=−3", "x=3", "x=−2", "x=2"], answer: 0, explication: "3x+1=x−5→x=−3.", tableau: null },
      { q: "f(x)=x². Taux de variation entre 1 et 3 ?", opts: ["2", "4", "6", "8"], answer: 1, explication: "(9−1)/2 = 4.", tableau: null },
      { q: "f(x) = 2x² − 3x + 1. Quelle est f(2) ?", opts: ["1", "3", "5", "7"], answer: 1, explication: "8−6+1 = 3.", tableau: null },
      { q: "Équation droite passant par (1,5) et (3,11) ?", opts: ["y=3x+2", "y=2x+3", "y=3x−1", "y=4x+1"], answer: 0, explication: "a=3, b=2.", tableau: null },
      { q: "f(x) = −x² + 4. Pour quels x, f(x) = 0 ?", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√4"], answer: 0, explication: "x²=4→x=2 ou x=−2.", tableau: null },
      { q: "f linéaire et f(3)=12. Quelle est f(5) ?", opts: ["15", "20", "18", "25"], answer: 1, explication: "a=4. f(5)=20.", tableau: null },
      { q: "f(x)=2x+b et f(1)=7. Valeur de b ?", opts: ["3", "5", "7", "9"], answer: 1, explication: "2+b=7→b=5.", tableau: null },
      { q: "Fonction affine passant par (0,−2) avec coeff directeur 3 ?", opts: ["y=3x", "y=3x−2", "y=−2x+3", "y=x−2"], answer: 1, explication: "y=3x−2.", tableau: null }
    ],
    "difficile": [
      { q: "f(x) = x² − 6x + 8. Racines de f ?", opts: ["x=2 ou x=4", "x=−2 ou x=−4", "x=2 ou x=−4", "x=3 ou x=5"], answer: 0, explication: "(x−2)(x−4)=0.", tableau: null },
      { q: "f(x) = x² − 4x + 3. Abscisse du minimum ?", opts: ["x=2", "x=3", "x=1", "x=4"], answer: 0, explication: "x=4/2=2.", tableau: null },
      { q: "f(x) = 2x² + 4x − 6. Racines ?", opts: ["x=1 ou x=−3", "x=−1 ou x=3", "x=2 ou x=−3", "x=1 ou x=3"], answer: 0, explication: "2(x−1)(x+3)=0→x=1 ou x=−3.", tableau: null },
      { q: "f(x)=3x+2 et g(x)=f(f(x)). g(x) = ?", opts: ["9x+8", "6x+4", "9x+2", "3x+8"], answer: 0, explication: "f(3x+2)=9x+6+2=9x+8.", tableau: null },
      { q: "f(x) = x² − 2x − 3. Pour quels x, f(x) ≤ 0 ?", opts: ["−1 ≤ x ≤ 3", "x ≤ −1 ou x ≥ 3", "−3 ≤ x ≤ 1", "x ≤ −3 ou x ≥ 1"], answer: 0, explication: "(x+1)(x−3)≤0→−1≤x≤3.", tableau: null },
      { q: "Valeur minimale de f(x) = (x−3)² + 2 ?", opts: ["2", "3", "5", "0"], answer: 0, explication: "Minimum = 2 en x=3.", tableau: null },
      { q: "f(x)=x³. Taux de variation entre x=1 et x=2 ?", opts: ["3", "7", "4", "6"], answer: 1, explication: "(8−1)/1 = 7.", tableau: null },
      { q: "f(x)=1/x. f(f(2)) = ?", opts: ["2", "1/2", "4", "1/4"], answer: 0, explication: "f(2)=1/2, f(1/2)=2.", tableau: null },
      { q: "La droite y=3x+2 et la parabole y=x² se coupent en combien de points ?", opts: ["0", "1", "2", "3"], answer: 2, explication: "Discriminant=17>0→2 points.", tableau: null },
      { q: "f(x)=2x²−8x+6. Abscisse du minimum ?", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "x=8/4=2.", tableau: null }
    ]
  },
  "Mélange de tous les thèmes": {
    "facile": [
      { q: "Quel est le résultat de 2³ + 3² ?", opts: ["13", "17", "15", "11"], answer: 1, explication: "8+9=17.", tableau: null },
      { q: "Triangle rectangle : côtés 6cm et 8cm. Hypoténuse ?", opts: ["10cm", "12cm", "14cm", "7cm"], answer: 0, explication: "6²+8²=100=10².", tableau: null },
      { q: "Résous 3x + 6 = 15.", opts: ["x=2", "x=3", "x=4", "x=7"], answer: 1, explication: "3x=9, x=3.", tableau: null },
      { q: "Moyenne de 5, 10, 15, 20 ?", opts: ["10", "12", "12,5", "15"], answer: 2, explication: "50/4=12,5.", tableau: null },
      { q: "f(x) = 3x − 2. f(3) = ?", opts: ["5", "7", "9", "11"], answer: 1, explication: "9−2=7.", tableau: null },
      { q: "P(nombre pair sur un dé) ?", opts: ["1/3", "1/2", "2/3", "1/6"], answer: 1, explication: "3/6=1/2.", tableau: null },
      { q: "Développe 4(2x − 3).", opts: ["8x−3", "8x−12", "6x−12", "8x+12"], answer: 1, explication: "8x−12.", tableau: null },
      { q: "Périmètre d'un carré de côté 7cm ?", opts: ["14cm", "21cm", "28cm", "49cm"], answer: 2, explication: "4×7=28cm.", tableau: null },
      { q: "Étendue de 3, 7, 1, 9, 5 ?", opts: ["6", "7", "8", "9"], answer: 2, explication: "9−1=8.", tableau: null },
      { q: "Simplifie 15/25.", opts: ["3/5", "5/3", "1/5", "3/4"], answer: 0, explication: "3/5.", tableau: null }
    ],
    "moyen": [
      { q: "Résous par produit nul : (x−2)(x+5) = 0.", opts: ["x=2 ou x=−5", "x=−2 ou x=5", "x=2 ou x=5", "x=−2 ou x=−5"], answer: 0, explication: "x=2 ou x=−5.", tableau: null },
      { q: "Triangle : DE∥BC, AD=4, AB=10, DE=6. BC = ?", opts: ["12cm", "15cm", "24cm", "8cm"], answer: 1, explication: "BC=6×10/4=15cm.", tableau: null },
      { q: "Notes : 14 (coeff 3) et 8 (coeff 1). Moyenne ?", opts: ["11", "12,5", "12", "13"], answer: 1, explication: "(42+8)/4=12,5.", tableau: null },
      { q: "f(x) = x² + 2x − 3. f(2) = ?", opts: ["3", "5", "7", "9"], answer: 1, explication: "4+4−3=5.", tableau: null },
      { q: "Volume cylindre rayon 2cm hauteur 5cm ? (π≈3,14)", opts: ["62,8cm³", "31,4cm³", "20cm³", "125,6cm³"], answer: 0, explication: "3,14×4×5=62,8cm³.", tableau: null },
      { q: "P(A)=0,4 et P(B)=0,3 indépendants. P(A et B) ?", opts: ["0,7", "0,1", "0,12", "0,012"], answer: 2, explication: "0,4×0,3=0,12.", tableau: null },
      { q: "Résous : x+y=10 et 2x−y=5.", opts: ["x=5, y=5", "x=4, y=6", "x=6, y=4", "x=3, y=7"], answer: 0, explication: "3x=15, x=5, y=5.", tableau: null },
      { q: "Développe (2x+3)(x−4).", opts: ["2x²−5x−12", "2x²+5x−12", "2x²−8x−12", "2x²−5x+12"], answer: 0, explication: "2x²−8x+3x−12=2x²−5x−12.", tableau: null },
      { q: "Médiane de : 3, 7, 9, 11, 15, 19 ?", opts: ["9", "10", "11", "9,5"], answer: 1, explication: "(9+11)/2=10.", tableau: null },
      { q: "Droite passant par (0,3) et (2,7) ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "a=2, b=3.", tableau: null }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 9x + 20 = 0.", opts: ["x=4 ou x=5", "x=−4 ou x=−5", "x=4 ou x=−5", "x=2 ou x=10"], answer: 0, explication: "(x−4)(x−5)=0.", tableau: null },
      { q: "f(x)=2x²−8x+6. Abscisse du minimum ?", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "x=8/4=2.", tableau: null },
      { q: "P(au moins 1 succès en 3 essais, P=0,5) ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "1−(1/2)³=7/8.", tableau: null },
      { q: "Simplifie (x²−4x+4)/(x−2).", opts: ["x−2", "x+2", "x²−2", "2"], answer: 0, explication: "(x−2)²/(x−2)=x−2.", tableau: null },
      { q: "Volume boule rayon 3cm ? (π≈3,14)", opts: ["113,04cm³", "56,52cm³", "28,26cm³", "339,12cm³"], answer: 0, explication: "(4/3)×3,14×27=113,04cm³.", tableau: null },
      { q: "Dans triangle ABC, tan(A)=4/3 et AB=6cm. BC = ?", opts: ["4,5cm", "6cm", "8cm", "9cm"], answer: 2, explication: "BC=6×4/3=8cm.", tableau: null },
      { q: "Résous par produit nul : 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "(2x−3)(x+2)=0.", tableau: null },
      { q: "f(x)=x²−2x−3. Pour quels x, f(x)≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "(x+1)(x−3)≤0.", tableau: null },
      { q: "P(A∪B) avec P(A)=0,4, P(B)=0,5, P(A∩B)=0,2 ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "0,4+0,5−0,2=0,7.", tableau: null },
      { q: "Taux variation f(x)=x² entre x=2 et x=5 ?", opts: ["7", "9", "21", "3"], answer: 0, explication: "(25−4)/3=7.", tableau: null }
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
      'Nombres et calculs': 'puissances, fractions, nombres relatifs, calcul littéral, factorisation, développement, pourcentages, proportionnalité',
      'Géométrie': 'théorème de Pythagore, théorème de Thalès, trigonométrie (sin/cos/tan), angles, triangles, cercles, transformations',
      'Algèbre et équations': 'équations du premier degré, systèmes equations, inéquations, problèmes algébriques, équations du second degré par produit nul',
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
Si la question utilise un tableau de valeurs, tu DOIS créer l'objet "tableau" structuré dans le JSON.
Si la question ne nécessite aucun tableau, écris strictement "tableau": null.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown.

Format EXACT :
[{"q":"énoncé","tableau":{"headers":["x","-2","0","2"],"rows":[["f(x)","-7","-3","1"]]},"opts":["opt0","opt1","opt2","opt3"],"bonne_reponse":"opt_correct","explication":"calcul détaillé"}]`

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
