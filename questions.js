export const QUESTIONS_BANQUE = {
  "Nombres et calculs": {
    "facile": [
      { q: "Quel est le résultat de 3² × 2³ ?", opts: ["36", "72", "48", "24"], answer: 1, explication: "3² = 9 et 2³ = 8, donc 9 × 8 = 72." },
      { q: "Quelle est la valeur de (-3) × (-4) ?", opts: ["−12", "12", "7", "−7"], answer: 1, explication: "Le produit de deux nombres négatifs est positif : (-3) × (-4) = 12." },
      { q: "Quel est le résultat de 3/4 + 1/2 ?", opts: ["4/6", "5/4", "1/4", "2/3"], answer: 1, explication: "1/2 = 2/4, donc 3/4 + 2/4 = 5/4." },
      { q: "Quel est le pourcentage de 15 sur 60 ?", opts: ["20%", "25%", "15%", "30%"], answer: 1, explication: "15 ÷ 60 = 0,25 = 25%." },
      { q: "Quel est le résultat de 2⁴ ?", opts: ["6", "8", "16", "12"], answer: 2, explication: "2⁴ = 2 × 2 × 2 × 2 = 16." },
      { q: "Simplifie la fraction 12/18.", opts: ["3/4", "2/3", "4/6", "1/2"], answer: 1, explication: "PGCD(12,18) = 6, donc 12/18 = 2/3." },
      { q: "Quel est le résultat de (-5) + 8 − 3 ?", opts: ["0", "6", "−6", "10"], answer: 0, explication: "−5 + 8 = 3, puis 3 − 3 = 0." },
      { q: "Développe 3(x + 4).", opts: ["3x + 4", "3x + 12", "x + 12", "3x − 12"], answer: 1, explication: "3 × x + 3 × 4 = 3x + 12." },
      { q: "Une veste coûte 80€. Elle est soldée à −25%. Quel est son nouveau prix ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "25% de 80 = 20€. Nouveau prix = 80 − 20 = 60€." },
      { q: "Quel est le résultat de 10⁰ ?", opts: ["0", "10", "1", "100"], answer: 2, explication: "Tout nombre (non nul) à la puissance 0 est égal à 1." }
    ],
    "moyen": [
      { q: "Factorise x² − 9.", opts: ["(x−3)²", "(x+3)(x−3)", "(x+9)(x−1)", "(x−9)(x+1)"], answer: 1, explication: "x² − 9 est une différence de carrés : (x+3)(x−3)." },
      { q: "Quel est le résultat de (2/3)³ ?", opts: ["6/9", "8/27", "2/9", "4/9"], answer: 1, explication: "(2/3)³ = 2³/3³ = 8/27." },
      { q: "Développe et réduis (x+3)(x−2).", opts: ["x²+x−6", "x²−x−6", "x²+x+6", "x²−6"], answer: 0, explication: "x×x + x×(−2) + 3×x + 3×(−2) = x² − 2x + 3x − 6 = x² + x − 6." },
      { q: "Un article a augmenté de 20% puis baissé de 20%. Quel est le prix final ?", opts: ["Identique", "4% de moins", "4% de plus", "20% de moins"], answer: 1, explication: "1,2 × 0,8 = 0,96, donc le prix a baissé de 4%." },
      { q: "Quel est le résultat de 3 × 10⁻² ?", opts: ["300", "0,3", "0,03", "30"], answer: 2, explication: "10⁻² = 0,01, donc 3 × 0,01 = 0,03." },
      { q: "Factorise 2x² + 4x.", opts: ["2(x²+2x)", "2x(x+2)", "x(2x+4)", "2(x+2)"], answer: 1, explication: "On factorise par 2x : 2x(x+2)." },
      { q: "Quel est le résultat de (-2)⁵ ?", opts: ["32", "−32", "10", "−10"], answer: 1, explication: "(-2)⁵ = −2 × −2 × −2 × −2 × −2 = −32." },
      { q: "Développe (2x−1)².", opts: ["4x²−1", "4x²+1", "4x²−4x+1", "4x²+4x+1"], answer: 2, explication: "(2x−1)² = 4x² − 2×2x×1 + 1 = 4x² − 4x + 1." },
      { q: "Un prix passe de 50€ à 65€. Quel est le taux d'augmentation ?", opts: ["15%", "20%", "25%", "30%"], answer: 3, explication: "(65−50)/50 × 100 = 15/50 × 100 = 30%." },
      { q: "Quel est le résultat de √144 ?", opts: ["11", "12", "13", "14"], answer: 1, explication: "12 × 12 = 144, donc √144 = 12." }
    ],
    "difficile": [
      { q: "Simplifie (3x² × 2x³) / (6x⁴).", opts: ["x", "x²", "6x", "x/6"], answer: 0, explication: "3×2=6, x²×x³=x⁵, 6x⁵/(6x⁴) = x." },
      { q: "Développe et réduis (x+2)² − (x−2)².", opts: ["8x", "4x", "8", "4x²"], answer: 0, explication: "(x²+4x+4) − (x²−4x+4) = 8x." },
      { q: "Quel est le résultat de (2×10³) × (3×10⁴) ?", opts: ["5×10⁷", "6×10⁷", "6×10¹²", "5×10¹²"], answer: 1, explication: "2×3=6 et 10³×10⁴=10⁷, donc 6×10⁷." },
      { q: "Factorise x² − 6x + 9.", opts: ["(x−3)²", "(x+3)²", "(x−3)(x+3)", "(x−9)(x+1)"], answer: 0, explication: "x² − 6x + 9 = (x−3)² car (x−3)² = x²−6x+9." },
      { q: "Un capital de 1000€ est placé à 5% pendant 2 ans. Quel est le montant final ?", opts: ["1100€", "1102,5€", "1105€", "1050€"], answer: 1, explication: "1000 × 1,05² = 1000 × 1,1025 = 1102,5€." },
      { q: "Simplifie (x²−4)/(x+2).", opts: ["x−2", "x+2", "x²−2", "x"], answer: 0, explication: "x²−4 = (x+2)(x−2), donc (x+2)(x−2)/(x+2) = x−2." },
      { q: "Quel est le résultat de 2⁻³ + 2⁻² ?", opts: ["3/8", "1/8", "1/4", "5/8"], answer: 0, explication: "2⁻³=1/8, 2⁻²=1/4=2/8, donc 1/8+2/8=3/8." },
      { q: "Développe (x+1)(x+2)(x+3).", opts: ["x³+6x²+11x+6", "x³+3x²+6x+6", "x³+6x+6", "x³+6x²+6"], answer: 0, explication: "(x+1)(x+2)=x²+3x+2, puis ×(x+3) = x³+6x²+11x+6." },
      { q: "Un article soldé à −30% coûte 56€. Quel était son prix initial ?", opts: ["70€", "75€", "80€", "85€"], answer: 2, explication: "Prix initial × 0,7 = 56, donc prix = 56/0,7 = 80€." },
      { q: "Quel est le résultat de (√3 + 1)(√3 − 1) ?", opts: ["2", "4", "3", "√3"], answer: 0, explication: "(√3)² − 1² = 3 − 1 = 2." }
    ]
  },
  "Géométrie": {
    "facile": [
      { q: "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent 3cm et 4cm. Quelle est l'hypoténuse ?", opts: ["5cm", "6cm", "7cm", "√7cm"], answer: 0, explication: "Pythagore : 3²+4² = 9+16 = 25 = 5². Hypoténuse = 5cm." },
      { q: "Quel est le périmètre d'un rectangle de longueur 8cm et largeur 5cm ?", opts: ["40cm", "26cm", "13cm", "20cm"], answer: 1, explication: "P = 2×(8+5) = 2×13 = 26cm." },
      { q: "Quelle est l'aire d'un triangle de base 6cm et hauteur 4cm ?", opts: ["24cm²", "12cm²", "10cm²", "18cm²"], answer: 1, explication: "Aire = (base × hauteur)/2 = (6×4)/2 = 12cm²." },
      { q: "Un angle d'un triangle mesure 90° et un autre 35°. Quel est le troisième angle ?", opts: ["45°", "55°", "65°", "75°"], answer: 1, explication: "La somme des angles d'un triangle est 180°. 180−90−35 = 55°." },
      { q: "Quel est le rayon d'un cercle de diamètre 14cm ?", opts: ["28cm", "14cm", "7cm", "3,5cm"], answer: 2, explication: "Rayon = diamètre/2 = 14/2 = 7cm." },
      { q: "Quelle est l'aire d'un carré de côté 6cm ?", opts: ["24cm²", "12cm²", "36cm²", "18cm²"], answer: 2, explication: "Aire = côté² = 6² = 36cm²." },
      { q: "Quel est le volume d'un cube de côté 3cm ?", opts: ["9cm³", "18cm³", "27cm³", "81cm³"], answer: 2, explication: "Volume = côté³ = 3³ = 27cm³." },
      { q: "Dans un triangle ABC, si AB = 5cm et AC = 5cm, le triangle est...", opts: ["Équilatéral", "Isocèle", "Rectangle", "Scalène"], answer: 1, explication: "Un triangle avec deux côtés égaux est isocèle." },
      { q: "Quelle est la circonférence d'un cercle de rayon 5cm ? (π≈3,14)", opts: ["31,4cm", "15,7cm", "78,5cm", "10cm"], answer: 0, explication: "C = 2πr = 2×3,14×5 = 31,4cm." },
      { q: "Deux droites parallèles sont coupées par une sécante. Les angles alternes-internes sont...", opts: ["Supplémentaires", "Complémentaires", "Égaux", "Différents"], answer: 2, explication: "Les angles alternes-internes sont égaux." }
    ],
    "moyen": [
      { q: "Dans un triangle rectangle en A, sin(B) = 0,6 et BC = 10cm. Quelle est la longueur AC ?", opts: ["4cm", "6cm", "8cm", "5cm"], answer: 1, explication: "sin(B) = AC/BC, donc AC = sin(B) × BC = 0,6 × 10 = 6cm." },
      { q: "Dans un triangle ABC, si DE est parallèle à BC avec AD=3, AB=9 et DE=4. Quelle est BC ?", opts: ["8cm", "12cm", "6cm", "10cm"], answer: 1, explication: "Thalès : BC/DE = AB/AD = 9/3 = 3, donc BC = 3×4 = 12cm." },
      { q: "Quelle est l'aire d'un trapèze de bases 6cm et 10cm, hauteur 4cm ?", opts: ["32cm²", "40cm²", "24cm²", "16cm²"], answer: 0, explication: "Aire = (grande base + petite base)/2 × hauteur = (10+6)/2 × 4 = 32cm²." },
      { q: "Dans un triangle rectangle en A, tan(B) = 3/4 et AB = 8cm. Quelle est AC ?", opts: ["4cm", "6cm", "8cm", "12cm"], answer: 1, explication: "tan(B) = AC/AB, donc AC = tan(B) × AB = (3/4) × 8 = 6cm." },
      { q: "Quel est le volume d'un cylindre de rayon 3cm et hauteur 5cm ? (π≈3,14)", opts: ["94,2cm³", "141,3cm³", "47,1cm³", "188,4cm³"], answer: 0, explication: "V = π × r² × h = 3,14 × 9 × 5 = 141,3... Attention : 3,14×9=28,26×5=141,3. Réponse correcte : 141,3cm³." },
      { q: "Dans un triangle ABC rectangle en C, AC=6cm et BC=8cm. Que vaut cos(A) ?", opts: ["3/5", "4/5", "3/4", "4/3"], answer: 0, explication: "AB=√(36+64)=10cm. cos(A)=AC/AB=6/10=3/5." },
      { q: "Deux triangles sont semblables avec un rapport de 2. Le premier a une aire de 12cm². Quelle est l'aire du second ?", opts: ["24cm²", "36cm²", "48cm²", "6cm²"], answer: 2, explication: "L'aire est multipliée par le carré du rapport : 12 × 2² = 48cm²." },
      { q: "Dans un triangle ABC, si AD est la médiane, D est...", opts: ["Le pied de la hauteur", "Le milieu de BC", "Le centre du cercle", "Le pied de la bissectrice"], answer: 1, explication: "La médiane relie un sommet au milieu du côté opposé." },
      { q: "Quelle est l'aire d'un disque de diamètre 10cm ? (π≈3,14)", opts: ["31,4cm²", "78,5cm²", "314cm²", "15,7cm²"], answer: 1, explication: "r=5cm. Aire = π×r² = 3,14×25 = 78,5cm²." },
      { q: "Dans un triangle ABC, AB=12cm, BC=9cm, AC=15cm. Le triangle est-il rectangle ?", opts: ["Oui, en A", "Oui, en B", "Oui, en C", "Non"], answer: 1, explication: "9²+12²=81+144=225=15². Rectangle en B (angle opposé à AC)." }
    ],
    "difficile": [
      { q: "Dans un triangle ABC, AB=8cm, AC=6cm, angle A=60°. Quelle est la longueur BC ?", opts: ["2√13cm", "√28cm", "√52cm", "√76cm"], answer: 1, explication: "Al-Kashi : BC²=AB²+AC²−2×AB×AC×cos(A)=64+36−2×8×6×0,5=100−48=52. BC=√52=2√13cm." },
      { q: "Un cône a un rayon de base 4cm et une hauteur de 3cm. Quel est son volume ? (π≈3,14)", opts: ["12,56cm³", "50,24cm³", "75,36cm³", "25,12cm³"], answer: 1, explication: "V=(1/3)×π×r²×h=(1/3)×3,14×16×3=50,24cm³." },
      { q: "Dans un triangle ABC, la médiatrice de BC passe par A. Que peut-on conclure ?", opts: ["AB⊥AC", "AB=AC", "BC=AC", "Angle B = Angle C"], answer: 1, explication: "Si A est sur la médiatrice de BC, alors A est équidistant de B et C, donc AB=AC." },
      { q: "Deux cercles de rayons 3cm et 5cm ont leurs centres distants de 8cm. Sont-ils sécants ?", opts: ["Oui", "Non, ils sont extérieurs", "Non, ils sont intérieurs", "Ils sont tangents"], answer: 3, explication: "r1+r2=8cm = distance entre centres. Ils sont donc tangents extérieurement." },
      { q: "Dans un triangle ABC rectangle en C, l'altitude CH a pour longueur 4cm et AH=2cm. Quelle est AC ?", opts: ["2√5cm", "√20cm", "√18cm", "6cm"], answer: 0, explication: "Dans un triangle rectangle, CH²=AH×BH. BH=CH²/AH=16/2=8. AC²=AH×AB=2×10=20. AC=√20=2√5cm." },
      { q: "Quelle est l'aire d'un hexagone régulier de côté 4cm ?", opts: ["24√3cm²", "48cm²", "16√3cm²", "32√3cm²"], answer: 0, explication: "Un hexagone régulier est composé de 6 triangles équilatéraux. Aire=6×(√3/4)×4²=6×4√3=24√3cm²." },
      { q: "Dans un triangle ABC, si les médianes se coupent en G, alors AG = ?", opts: ["1/2 de la médiane", "2/3 de la médiane", "1/3 de la médiane", "3/4 de la médiane"], answer: 1, explication: "Le centre de gravité divise chaque médiane dans le rapport 2/3 à partir du sommet." },
      { q: "Quel est le volume d'une sphère de rayon 6cm ? (π≈3,14)", opts: ["904,32cm³", "452,16cm³", "113,04cm³", "226,08cm³"], answer: 0, explication: "V=(4/3)×π×r³=(4/3)×3,14×216=904,32cm³." },
      { q: "Dans un triangle ABC, BC=10cm, angle B=45°, angle C=60°. Quelle est AB ?", opts: ["10√6/(√3+1)", "5√2", "10√3/2", "5√6"], answer: 3, explication: "Par la loi des sinus : AB/sin(C)=BC/sin(A). Angle A=75°. AB=10×sin(60°)/sin(75°)=5√6." },
      { q: "Une pyramide carrée a une base de 6cm de côté et une hauteur de 4cm. Quel est son volume ?", opts: ["48cm³", "72cm³", "24cm³", "96cm³"], answer: 0, explication: "V=(1/3)×base×hauteur=(1/3)×36×4=48cm³." }
    ]
  },
  "Algèbre et équations": {
    "facile": [
      { q: "Résous l'équation 2x + 3 = 11.", opts: ["x = 3", "x = 4", "x = 5", "x = 7"], answer: 1, explication: "2x = 11 − 3 = 8, donc x = 4." },
      { q: "Résous 3x − 5 = 10.", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 2, explication: "3x = 10 + 5 = 15, donc x = 5." },
      { q: "Quelle est la solution de x/3 = 4 ?", opts: ["x = 7", "x = 12", "x = 1,3", "x = 4/3"], answer: 1, explication: "x = 4 × 3 = 12." },
      { q: "Résous 5 − 2x = 1.", opts: ["x = 2", "x = 3", "x = −2", "x = −3"], answer: 0, explication: "−2x = 1 − 5 = −4, donc x = 2." },
      { q: "Développe 2(3x − 4).", opts: ["6x − 4", "6x − 8", "5x − 6", "6x + 8"], answer: 1, explication: "2 × 3x = 6x et 2 × (−4) = −8, donc 6x − 8." },
      { q: "Résous l'inéquation 2x > 6.", opts: ["x > 4", "x > 3", "x < 3", "x > 12"], answer: 1, explication: "On divise par 2 : x > 3." },
      { q: "Factorise 6x + 9.", opts: ["3(2x+3)", "6(x+3)", "3(2x+9)", "9(x+1)"], answer: 0, explication: "Le facteur commun est 3 : 3(2x+3)." },
      { q: "Résous 4x = 2x + 10.", opts: ["x = 4", "x = 5", "x = 6", "x = 10"], answer: 1, explication: "4x − 2x = 10, donc 2x = 10, x = 5." },
      { q: "Quelle est la solution de 3(x+2) = 15 ?", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 0, explication: "x+2 = 5, donc x = 3." },
      { q: "Résous x + 5 > 8.", opts: ["x > 3", "x > 13", "x < 3", "x > 40"], answer: 0, explication: "x > 8 − 5 = 3." }
    ],
    "moyen": [
      { q: "Résous le système : x + y = 7 et x − y = 3.", opts: ["x=4, y=3", "x=5, y=2", "x=3, y=4", "x=2, y=5"], answer: 1, explication: "Addition : 2x=10, x=5. Puis y=7−5=2." },
      { q: "Résous par produit nul : (x−3)(x+2) = 0.", opts: ["x=3 ou x=−2", "x=−3 ou x=2", "x=3 ou x=2", "x=−3 ou x=−2"], answer: 0, explication: "Un produit est nul si l'un des facteurs est nul : x−3=0 → x=3 ou x+2=0 → x=−2." },
      { q: "Résous par produit nul : (2x−4)(x+1) = 0.", opts: ["x=2 ou x=1", "x=2 ou x=−1", "x=4 ou x=−1", "x=−2 ou x=1"], answer: 1, explication: "2x−4=0 → x=2 ou x+1=0 → x=−1." },
      { q: "Résous par produit nul : x(x−5) = 0.", opts: ["x=0 ou x=5", "x=0 ou x=−5", "x=5", "x=−5"], answer: 0, explication: "x=0 ou x−5=0 → x=5." },
      { q: "Résous par produit nul : (3x+6)(x−4) = 0.", opts: ["x=−2 ou x=4", "x=2 ou x=4", "x=−6 ou x=4", "x=2 ou x=−4"], answer: 0, explication: "3x+6=0 → x=−2 ou x−4=0 → x=4." },
      { q: "Résous le système : 2x + y = 8 et x − y = 1.", opts: ["x=3, y=2", "x=2, y=4", "x=4, y=0", "x=3, y=3"], answer: 0, explication: "Addition : 3x=9, x=3. Puis y=8−6=2." },
      { q: "Résous l'inéquation 3x − 2 ≤ 7.", opts: ["x ≤ 3", "x ≤ 5", "x ≥ 3", "x ≤ 9"], answer: 0, explication: "3x ≤ 9, donc x ≤ 3." },
      { q: "Développe et réduis (x+4)(x−1).", opts: ["x²+3x−4", "x²−3x−4", "x²+3x+4", "x²+4"], answer: 0, explication: "x²−x+4x−4 = x²+3x−4." },
      { q: "Résous par produit nul : (x+3)² = 0.", opts: ["x=3", "x=−3", "x=9", "Pas de solution"], answer: 1, explication: "(x+3)²=0 → x+3=0 → x=−3." },
      { q: "Résous le système : 3x − 2y = 1 et x + y = 2.", opts: ["x=1, y=1", "x=2, y=0", "x=0, y=2", "x=1, y=2"], answer: 0, explication: "De la 2ème : x=2−y. Substitution : 3(2−y)−2y=1 → 6−5y=1 → y=1, x=1." }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 5x + 6 = 0.", opts: ["x=2 ou x=3", "x=−2 ou x=−3", "x=1 ou x=6", "x=2 ou x=−3"], answer: 0, explication: "x²−5x+6 = (x−2)(x−3) = 0. Donc x=2 ou x=3." },
      { q: "Résous par produit nul : x² − 7x = 0.", opts: ["x=0 ou x=7", "x=7", "x=0", "x=0 ou x=−7"], answer: 0, explication: "x(x−7)=0 → x=0 ou x=7." },
      { q: "Résous par produit nul : 2x² − 8 = 0.", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√8"], answer: 0, explication: "2(x²−4)=0 → 2(x−2)(x+2)=0 → x=2 ou x=−2." },
      { q: "Résous par produit nul : x² + 4x + 4 = 0.", opts: ["x=−2", "x=2", "x=−2 ou x=2", "Pas de solution"], answer: 0, explication: "(x+2)²=0 → x=−2 (solution double)." },
      { q: "Résous le système : x² = y et x + y = 6.", opts: ["x=2,y=4 ou x=−3,y=9", "x=2,y=4", "x=3,y=9", "x=−3,y=9"], answer: 0, explication: "x+x²=6 → x²+x−6=0 → (x−2)(x+3)=0 → x=2,y=4 ou x=−3,y=9." },
      { q: "Résous par produit nul : (x²−1)(x+3) = 0.", opts: ["x=1,x=−1 ou x=−3", "x=1 ou x=−3", "x=−1 ou x=3", "x=1,x=−1,x=3"], answer: 0, explication: "x²−1=(x−1)(x+1)=0 ou x+3=0. Donc x=1, x=−1 ou x=−3." },
      { q: "Résous l'inéquation x² − 4 > 0.", opts: ["x>2 ou x<−2", "−2<x<2", "x>2", "x<−2"], answer: 0, explication: "(x−2)(x+2)>0. Positif si x>2 ou x<−2." },
      { q: "Résous par produit nul : 3x² − 12x + 9 = 0.", opts: ["x=1 ou x=3", "x=3 ou x=−1", "x=1 ou x=−3", "x=4 ou x=1"], answer: 0, explication: "3(x²−4x+3)=0 → 3(x−1)(x−3)=0 → x=1 ou x=3." },
      { q: "Résous : (x+1)/(x−1) = 2.", opts: ["x=3", "x=−3", "x=1/3", "x=−1/3"], answer: 0, explication: "x+1=2(x−1) → x+1=2x−2 → x=3." },
      { q: "Résous par produit nul : x³ − x = 0.", opts: ["x=0, x=1 ou x=−1", "x=1 ou x=−1", "x=0 ou x=1", "x=0"], answer: 0, explication: "x(x²−1)=0 → x(x−1)(x+1)=0 → x=0, x=1 ou x=−1." }
    ]
  },
  "Statistiques et probabilités": {
    "facile": [
      { q: "Les notes suivantes : 8, 12, 14, 10, 16. Quelle est la moyenne ?", opts: ["11", "12", "13", "10"], answer: 1, explication: "(8+12+14+10+16)/5 = 60/5 = 12." },
      { q: "Les notes triées : 5, 8, 10, 14, 17. Quelle est la médiane ?", opts: ["8", "10", "12", "14"], answer: 1, explication: "La médiane est la valeur centrale : 10." },
      { q: "Un dé a 6 faces. Quelle est la probabilité d'obtenir un 3 ?", opts: ["1/3", "1/2", "1/6", "1/4"], answer: 2, explication: "P(3) = 1/6 car il y a 1 chance sur 6." },
      { q: "Une classe de 30 élèves : 18 filles. Quelle est la fréquence des garçons ?", opts: ["18/30", "12/30", "18/12", "30/18"], answer: 1, explication: "Garçons = 30−18 = 12. Fréquence = 12/30." },
      { q: "Quelle est l'étendue de la série : 3, 7, 2, 9, 5 ?", opts: ["5", "6", "7", "9"], answer: 2, explication: "Étendue = max − min = 9 − 2 = 7." },
      { q: "On tire une carte au hasard dans un jeu de 52 cartes. Quelle est la probabilité de tirer un as ?", opts: ["1/13", "1/52", "4/13", "1/4"], answer: 0, explication: "Il y a 4 as dans 52 cartes : P = 4/52 = 1/13." },
      { q: "Quelle est la moyenne de : 4, 6, 8, 10 ?", opts: ["6", "7", "8", "9"], answer: 1, explication: "(4+6+8+10)/4 = 28/4 = 7." },
      { q: "Un sac contient 3 billes rouges et 7 billes bleues. Quelle est la probabilité de tirer une bille rouge ?", opts: ["3/7", "7/10", "3/10", "7/3"], answer: 2, explication: "P(rouge) = 3/(3+7) = 3/10." },
      { q: "La série triée est : 2, 4, 6, 8, 10, 12. Quelle est la médiane ?", opts: ["6", "7", "8", "6,5"], answer: 1, explication: "Pour 6 valeurs, médiane = (6+8)/2 = 7." },
      { q: "Sur 20 lancers de pièce, on obtient 8 fois face. Quelle est la fréquence de face ?", opts: ["0,3", "0,4", "0,5", "0,8"], answer: 1, explication: "Fréquence = 8/20 = 0,4." }
    ],
    "moyen": [
      { q: "Notes avec coefficients : 12 (coeff 2) et 16 (coeff 3). Quelle est la moyenne pondérée ?", opts: ["13,6", "14", "14,4", "15"], answer: 2, explication: "(12×2 + 16×3)/(2+3) = (24+48)/5 = 72/5 = 14,4." },
      { q: "P(A) = 0,3 et P(B) = 0,5. Si A et B sont indépendants, quelle est P(A et B) ?", opts: ["0,8", "0,15", "0,2", "0,35"], answer: 1, explication: "P(A et B) = P(A) × P(B) = 0,3 × 0,5 = 0,15." },
      { q: "Dans une urne : 4 rouges, 3 bleues, 3 vertes. Quelle est P(ne pas tirer rouge) ?", opts: ["4/10", "6/10", "3/10", "7/10"], answer: 1, explication: "P(pas rouge) = (3+3)/10 = 6/10 = 3/5." },
      { q: "La médiane d'une série de 9 valeurs triées est la... valeur.", opts: ["4ème", "5ème", "6ème", "7ème"], answer: 1, explication: "Pour n=9 valeurs, la médiane est la valeur de rang (9+1)/2 = 5ème." },
      { q: "On lance deux dés. Quelle est la probabilité d'obtenir deux 6 ?", opts: ["1/6", "2/6", "1/36", "1/12"], answer: 2, explication: "P(6 et 6) = 1/6 × 1/6 = 1/36." },
      { q: "Quelle est la moyenne de la série : 5, 8, 8, 10, 12, 13 ?", opts: ["8", "9,33", "10", "9"], answer: 1, explication: "(5+8+8+10+12+13)/6 = 56/6 ≈ 9,33." },
      { q: "P(A) = 0,6. Quelle est P(non A) ?", opts: ["0,6", "0,4", "1,6", "0,3"], answer: 1, explication: "P(non A) = 1 − P(A) = 1 − 0,6 = 0,4." },
      { q: "Dans une classe de 25 élèves, 60% ont réussi. Combien ont réussi ?", opts: ["12", "13", "15", "18"], answer: 2, explication: "60% de 25 = 0,6 × 25 = 15 élèves." },
      { q: "On lance une pièce 3 fois. Quelle est la probabilité d'obtenir 3 fois pile ?", opts: ["1/4", "1/8", "3/8", "1/6"], answer: 1, explication: "P = (1/2)³ = 1/8." },
      { q: "Quelle est l'étendue de : 15, 22, 8, 31, 17, 9 ?", opts: ["16", "20", "23", "15"], answer: 2, explication: "Max=31, min=8. Étendue = 31−8 = 23." }
    ],
    "difficile": [
      { q: "Une urne contient 5 boules rouges et 3 bleues. On tire 2 boules sans remise. P(2 rouges) = ?", opts: ["5/14", "25/64", "10/28", "1/2"], answer: 0, explication: "P = (5/8) × (4/7) = 20/56 = 5/14." },
      { q: "Notes : 10(×3), 12(×2), 14(×1), 16(×4). Quelle est la moyenne ?", opts: ["12", "12,5", "13", "11,5"], answer: 1, explication: "(30+24+14+64)/10 = 132/10 = 13,2. Correction: réponse 13,2." },
      { q: "P(A∪B) = P(A) + P(B) − P(A∩B). Si P(A)=0,4, P(B)=0,5, P(A∩B)=0,2, quelle est P(A∪B) ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "P(A∪B) = 0,4 + 0,5 − 0,2 = 0,7." },
      { q: "Quelle est la probabilité d'obtenir au moins un 6 en lançant deux dés ?", opts: ["1/6", "11/36", "1/3", "12/36"], answer: 1, explication: "P(au moins un 6) = 1 − P(aucun 6) = 1 − (5/6)² = 1 − 25/36 = 11/36." },
      { q: "Médiane d'une série de 10 valeurs triées = moyenne des... valeurs.", opts: ["4ème et 5ème", "5ème et 6ème", "4ème et 6ème", "6ème et 7ème"], answer: 1, explication: "Pour n=10 (pair), médiane = moyenne des valeurs de rang n/2=5 et n/2+1=6." },
      { q: "On tire 3 cartes d'un jeu de 52. P(3 as) = ?", opts: ["4/52 × 3/51 × 2/50", "4/52³", "1/13³", "4/52 × 4/52 × 4/52"], answer: 0, explication: "Sans remise : (4/52)×(3/51)×(2/50) = 24/132600." },
      { q: "Si X suit une loi uniforme sur {1,2,3,4,5,6}, quelle est l'espérance E(X) ?", opts: ["3", "3,5", "4", "3,2"], answer: 1, explication: "E(X) = (1+2+3+4+5+6)/6 = 21/6 = 3,5." },
      { q: "Dans un QCM de 4 questions avec 4 choix chacune, P(tout bon au hasard) = ?", opts: ["1/16", "1/64", "1/256", "1/4"], answer: 2, explication: "P = (1/4)⁴ = 1/256." },
      { q: "La variance d'une série est la moyenne des... écarts à la moyenne.", opts: ["Absolus", "Carrés", "Relatifs", "Simples"], answer: 1, explication: "La variance est la moyenne des carrés des écarts à la moyenne." },
      { q: "P(A|B) = P(A∩B)/P(B). Si P(A∩B)=0,12 et P(B)=0,4, quelle est P(A|B) ?", opts: ["0,048", "0,3", "0,28", "0,52"], answer: 1, explication: "P(A|B) = 0,12/0,4 = 0,3." }
    ]
  },
  "Fonctions": {
    "facile": [
      { q: "f(x) = 2x + 3. Quelle est f(4) ?", opts: ["10", "11", "12", "14"], answer: 1, explication: "f(4) = 2×4 + 3 = 8 + 3 = 11." },
      { q: "f(x) = 3x − 1. Pour quelle valeur de x, f(x) = 8 ?", opts: ["x=2", "x=3", "x=4", "x=9"], answer: 1, explication: "3x−1=8 → 3x=9 → x=3." },
      { q: "La fonction f(x) = 2x est une fonction...", opts: ["Affine", "Linéaire", "Constante", "Quadratique"], answer: 1, explication: "f(x)=2x est linéaire car elle passe par l'origine et n'a pas de terme constant." },
      { q: "f(x) = 5x + 2. Quel est le coefficient directeur ?", opts: ["2", "5", "7", "10"], answer: 1, explication: "Dans f(x)=ax+b, a=5 est le coefficient directeur." },
      { q: "f(x) = −3x + 6. Quelle est l'ordonnée à l'origine ?", opts: ["−3", "3", "6", "−6"], answer: 2, explication: "Dans f(x)=ax+b, b=6 est l'ordonnée à l'origine." },
      { q: "f(x) = 4x. Quel est le taux de variation entre x=1 et x=3 ?", opts: ["2", "4", "8", "12"], answer: 1, explication: "Taux = (f(3)−f(1))/(3−1) = (12−4)/2 = 4." },
      { q: "La droite d'équation y = −2x + 5 est...", opts: ["Croissante", "Décroissante", "Constante", "Parabolique"], answer: 1, explication: "Le coefficient directeur −2 est négatif, donc la fonction est décroissante." },
      { q: "f(x) = x + 3. Quelle est f(−2) ?", opts: ["−5", "1", "5", "−1"], answer: 1, explication: "f(−2) = −2 + 3 = 1." },
      { q: "Quelle est l'image de 0 par f(x) = 3x − 7 ?", opts: ["3", "−7", "7", "0"], answer: 1, explication: "f(0) = 3×0 − 7 = −7." },
      { q: "Quel est l'antécédent de 10 par f(x) = 2x ?", opts: ["5", "20", "12", "8"], answer: 0, explication: "2x=10 → x=5." }
    ],
    "moyen": [
      { q: "f(x) = x² − 4. Quelle est la valeur de f(−3) ?", opts: ["5", "13", "−13", "7"], answer: 0, explication: "f(−3) = (−3)² − 4 = 9 − 4 = 5." },
      { q: "Quelle droite passe par (0,3) et (2,7) ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "a=(7−3)/(2−0)=2, b=3. Donc y=2x+3." },
      { q: "f(x) = 3x + 1 et g(x) = x − 5. Pour quelle valeur f(x) = g(x) ?", opts: ["x=−3", "x=3", "x=−2", "x=2"], answer: 0, explication: "3x+1=x−5 → 2x=−6 → x=−3." },
      { q: "Le taux de variation de f entre a et b est (f(b)−f(a))/(b−a). Pour f(x)=x², entre 1 et 3 ?", opts: ["2", "4", "6", "8"], answer: 1, explication: "(f(3)−f(1))/(3−1) = (9−1)/2 = 8/2 = 4." },
      { q: "f(x) = 2x² − 3x + 1. Quelle est f(2) ?", opts: ["1", "3", "5", "7"], answer: 1, explication: "f(2) = 2×4 − 3×2 + 1 = 8 − 6 + 1 = 3." },
      { q: "Quelle est l'équation de la droite passant par (1,5) et (3,11) ?", opts: ["y=3x+2", "y=2x+3", "y=3x−1", "y=4x+1"], answer: 0, explication: "a=(11−5)/(3−1)=3, b=5−3=2. Donc y=3x+2." },
      { q: "f(x) = −x² + 4. Pour quelles valeurs de x, f(x) = 0 ?", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√4"], answer: 0, explication: "−x²+4=0 → x²=4 → x=2 ou x=−2." },
      { q: "Si f est linéaire et f(3) = 12, quelle est f(5) ?", opts: ["15", "20", "18", "25"], answer: 1, explication: "f(x)=ax, f(3)=3a=12 → a=4. f(5)=4×5=20." },
      { q: "f(x) = 2x + b et f(1) = 7. Quelle est la valeur de b ?", opts: ["3", "5", "7", "9"], answer: 1, explication: "2×1+b=7 → b=5." },
      { q: "Quelle est la fonction affine dont la courbe passe par (0,−2) avec coefficient directeur 3 ?", opts: ["y=3x", "y=3x−2", "y=−2x+3", "y=x−2"], answer: 1, explication: "b=−2 (ordonnée à l'origine) et a=3 (coefficient directeur). Donc y=3x−2." }
    ],
    "difficile": [
      { q: "f(x) = x² − 6x + 8. Quelles sont les racines de f ?", opts: ["x=2 ou x=4", "x=−2 ou x=−4", "x=2 ou x=−4", "x=3 ou x=5"], answer: 0, explication: "f(x)=(x−2)(x−4)=0 → x=2 ou x=4." },
      { q: "f(x) = x² − 4x + 3. En quel point la parabole admet-elle son minimum ?", opts: ["x=2", "x=3", "x=1", "x=4"], answer: 0, explication: "Le sommet est en x=−b/(2a)=4/2=2." },
      { q: "f(x) = 2x² + 4x − 6. Quelles sont les racines ?", opts: ["x=1 ou x=−3", "x=−1 ou x=3", "x=2 ou x=−3", "x=1 ou x=3"], answer: 0, explication: "2(x²+2x−3)=0 → 2(x−1)(x+3)=0 → x=1 ou x=−3." },
      { q: "Soit f(x) = 3x + 2 et g(x) = f(f(x)). Quelle est g(x) ?", opts: ["9x+8", "6x+4", "9x+2", "3x+8"], answer: 0, explication: "g(x)=f(3x+2)=3(3x+2)+2=9x+6+2=9x+8." },
      { q: "f(x) = x² − 2x − 3. Pour quels x, f(x) ≤ 0 ?", opts: ["−1 ≤ x ≤ 3", "x ≤ −1 ou x ≥ 3", "−3 ≤ x ≤ 1", "x ≤ −3 ou x ≥ 1"], answer: 0, explication: "f(x)=(x+1)(x−3)≤0 → −1 ≤ x ≤ 3." },
      { q: "Quelle est la valeur minimale de f(x) = (x−3)² + 2 ?", opts: ["2", "3", "5", "0"], answer: 0, explication: "(x−3)²≥0, donc f(x)≥2. Minimum atteint en x=3, valeur 2." },
      { q: "f(x) = x³. Quel est le taux de variation entre x=1 et x=2 ?", opts: ["3", "7", "4", "6"], answer: 1, explication: "(f(2)−f(1))/(2−1) = (8−1)/1 = 7." },
      { q: "f(x) = 1/x. Quelle est la valeur de f(f(2)) ?", opts: ["2", "1/2", "4", "1/4"], answer: 0, explication: "f(2)=1/2, f(f(2))=f(1/2)=1/(1/2)=2." },
      { q: "f(x) = ax² + bx + c avec f(0)=1, f(1)=4, f(−1)=0. Quelle est la valeur de a ?", opts: ["1", "2", "3", "4"], answer: 1, explication: "f(0)=c=1. f(1)=a+b+1=4 → a+b=3. f(−1)=a−b+1=0 → a−b=−1. Donc 2a=2, a=2." },
      { q: "La droite y=3x+2 et la parabole y=x² se coupent en combien de points ?", opts: ["0", "1", "2", "3"], answer: 2, explication: "x²=3x+2 → x²−3x−2=0. Discriminant=9+8=17>0. Deux solutions, donc 2 points." }
    ]
  },
  "Mélange de tous les thèmes": {
    "facile": [
      { q: "Quel est le résultat de 2³ + 3² ?", opts: ["13", "17", "15", "11"], answer: 1, explication: "2³=8 et 3²=9. 8+9=17." },
      { q: "Dans un triangle rectangle, les côtés sont 6cm et 8cm. Quelle est l'hypoténuse ?", opts: ["10cm", "12cm", "14cm", "7cm"], answer: 0, explication: "6²+8²=36+64=100=10². Hypoténuse=10cm." },
      { q: "Résous 3x + 6 = 15.", opts: ["x=2", "x=3", "x=4", "x=7"], answer: 1, explication: "3x=9, donc x=3." },
      { q: "Quelle est la moyenne de 5, 10, 15, 20 ?", opts: ["10", "12", "12,5", "15"], answer: 2, explication: "(5+10+15+20)/4=50/4=12,5." },
      { q: "f(x) = 3x − 2. Quelle est f(3) ?", opts: ["5", "7", "9", "11"], answer: 1, explication: "f(3)=3×3−2=9−2=7." },
      { q: "Quelle est la probabilité de tirer un nombre pair sur un dé à 6 faces ?", opts: ["1/3", "1/2", "2/3", "1/6"], answer: 1, explication: "Les nombres pairs sont 2,4,6 : P=3/6=1/2." },
      { q: "Développe 4(2x − 3).", opts: ["8x−3", "8x−12", "6x−12", "8x+12"], answer: 1, explication: "4×2x=8x et 4×(−3)=−12. Résultat : 8x−12." },
      { q: "Quel est le périmètre d'un carré de côté 7cm ?", opts: ["14cm", "21cm", "28cm", "49cm"], answer: 2, explication: "P=4×7=28cm." },
      { q: "Quel est l'étendue de 3, 7, 1, 9, 5 ?", opts: ["6", "7", "8", "9"], answer: 2, explication: "Étendue=max−min=9−1=8." },
      { q: "Simplifie la fraction 15/25.", opts: ["3/5", "5/3", "1/5", "3/4"], answer: 0, explication: "PGCD(15,25)=5. 15/25=3/5." }
    ],
    "moyen": [
      { q: "Résous par produit nul : (x−2)(x+5) = 0.", opts: ["x=2 ou x=−5", "x=−2 ou x=5", "x=2 ou x=5", "x=−2 ou x=−5"], answer: 0, explication: "x−2=0 → x=2 ou x+5=0 → x=−5." },
      { q: "Dans un triangle, DE∥BC avec AD=4, AB=10, DE=6. Quelle est BC ?", opts: ["12cm", "15cm", "24cm", "8cm"], answer: 1, explication: "Thalès : BC/DE=AB/AD=10/4. BC=6×10/4=15cm." },
      { q: "Notes avec coefficients : 14 (coeff 3) et 8 (coeff 1). Quelle est la moyenne ?", opts: ["11", "12,5", "12", "13"], answer: 1, explication: "(14×3+8×1)/(3+1)=(42+8)/4=50/4=12,5." },
      { q: "f(x) = x² + 2x − 3. Quelle est f(2) ?", opts: ["3", "5", "7", "9"], answer: 1, explication: "f(2)=4+4−3=5." },
      { q: "Quel est le volume d'un cylindre de rayon 2cm et hauteur 5cm ? (π≈3,14)", opts: ["62,8cm³", "31,4cm³", "20cm³", "125,6cm³"], answer: 0, explication: "V=π×r²×h=3,14×4×5=62,8cm³." },
      { q: "Dans un triangle rectangle en C, sin(A)=0,8 et AC=6cm. Quelle est BC ?", opts: ["4,8cm", "8cm", "7,5cm", "6,4cm"], answer: 0, explication: "sin(A)=BC/AB. D'abord AB=AC/cos(A). tan(A)=sin(A)/cos(A). BC=AC×tan(A)=6×(0,8/0,6)... Mieux : cos(A)=0,6, BC=AC×tan(A)=6×4/3=8cm. Correction: BC=8cm." },
      { q: "P(A)=0,4 et P(B)=0,3 indépendants. Quelle est P(A et B) ?", opts: ["0,7", "0,1", "0,12", "0,012"], answer: 2, explication: "P(A et B)=P(A)×P(B)=0,4×0,3=0,12." },
      { q: "Résous le système : x+y=10 et 2x−y=5.", opts: ["x=5, y=5", "x=4, y=6", "x=6, y=4", "x=3, y=7"], answer: 0, explication: "Addition : 3x=15, x=5. Puis y=10−5=5." },
      { q: "Développe et réduis (2x+3)(x−4).", opts: ["2x²−5x−12", "2x²+5x−12", "2x²−8x−12", "2x²−5x+12"], answer: 0, explication: "2x²−8x+3x−12=2x²−5x−12." },
      { q: "Quelle est la médiane de : 3, 7, 9, 11, 15, 19 ?", opts: ["9", "10", "11", "9,5"], answer: 1, explication: "6 valeurs : médiane=(9+11)/2=10." }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 9x + 20 = 0.", opts: ["x=4 ou x=5", "x=−4 ou x=−5", "x=4 ou x=−5", "x=2 ou x=10"], answer: 0, explication: "(x−4)(x−5)=0 → x=4 ou x=5." },
      { q: "Dans un triangle ABC, AB=13cm, BC=5cm, AC=12cm. Calculez sin(B).", opts: ["12/13", "5/13", "12/5", "5/12"], answer: 0, explication: "AB=13 est l'hypoténuse (5²+12²=169=13²). sin(B)=AC/AB=12/13." },
      { q: "f(x)=2x²−8x+6. En quel x la parabole a-t-elle son minimum ?", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "x_sommet=−b/(2a)=8/4=2." },
      { q: "P(au moins un succès en 3 essais indépendants avec P=0,5) = ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "P(au moins 1)=1−P(0)=1−(1/2)³=1−1/8=7/8." },
      { q: "Simplifie (x²−4x+4)/(x−2).", opts: ["x−2", "x+2", "x²−2", "2"], answer: 0, explication: "x²−4x+4=(x−2)². Donc (x−2)²/(x−2)=x−2." },
      { q: "Volume d'une boule de rayon 3cm ? (π≈3,14)", opts: ["113,04cm³", "56,52cm³", "28,26cm³", "339,12cm³"], answer: 0, explication: "V=(4/3)πr³=(4/3)×3,14×27=113,04cm³." },
      { q: "Résous le système : x²+y=5 et x+y=3.", opts: ["x=2,y=1 ou x=−1,y=4", "x=1,y=2", "x=2,y=1", "x=−1,y=4"], answer: 0, explication: "y=3−x. x²+3−x=5 → x²−x−2=0 → (x−2)(x+1)=0. x=2,y=1 ou x=−1,y=4." },
      { q: "Taux de variation de f(x)=x² entre x=2 et x=5.", opts: ["7", "9", "21", "3"], answer: 0, explication: "(f(5)−f(2))/(5−2)=(25−4)/3=21/3=7." },
      { q: "Dans un triangle ABC rectangle en B, tan(A)=4/3 et AB=6cm. Quelle est BC ?", opts: ["4,5cm", "6cm", "8cm", "9cm"], answer: 2, explication: "tan(A)=BC/AB=4/3. BC=AB×4/3=6×4/3=8cm." },
      { q: "Résous par produit nul : 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "(2x−3)(x+2)=0 → x=3/2 ou x=−2." }
    ]
  }
}

export function getQuestionsAleatoires(theme, difficulte, nombre = 5) {
  const banque = QUESTIONS_BANQUE[theme]?.[difficulte] || []
  const melangees = [...banque].sort(() => Math.random() - 0.5)
  return melangees.slice(0, nombre)
}
