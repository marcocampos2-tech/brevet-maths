const QUESTIONS_BANQUE = {
  "Nombres et calculs": {
    "facile": [
      { q: "Sarah a économisé 80€. Elle dépense 25% de ses économies pour acheter un livre. Combien lui reste-t-il ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "On calcule 25% de 80€. 25% de 80 = 0,25 × 80 = 20€. On soustrait la dépense : 80 − 20 = 60€. Il lui reste 60€.", tableau: null },
      { q: "Calcule 3² × 2³.", opts: ["36", "72", "48", "24"], answer: 1, explication: "On calcule chaque puissance séparément. 3² = 3 × 3 = 9. 2³ = 2 × 2 × 2 = 8. On multiplie : 9 × 8 = 72.", tableau: null },
      { q: "Une recette demande 3/4 de litre de lait et 1/2 litre de crème. Quelle est la quantité totale de liquide ?", opts: ["4/6 L", "5/4 L", "1/4 L", "2/3 L"], answer: 1, explication: "Pour additionner ces fractions, on met le même dénominateur. 1/2 = 2/4. Donc : 3/4 + 2/4 = 5/4 litres.", tableau: null },
      { q: "Dans une classe de 60 élèves, 15 ont eu 20/20. Quel pourcentage a eu 20/20 ?", opts: ["20%", "25%", "15%", "30%"], answer: 1, explication: "On divise le nombre d'élèves ayant eu 20/20 par le total, puis on multiplie par 100. 15 ÷ 60 = 0,25. 0,25 × 100 = 25%.", tableau: null },
      { q: "Calcule 2⁴.", opts: ["6", "8", "16", "12"], answer: 2, explication: "2⁴ signifie 2 multiplié 4 fois par lui-même. 2⁴ = 2 × 2 × 2 × 2 = 4 × 4 = 16.", tableau: null },
      { q: "Une pizza est coupée en 18 parts. Léa en mange 12. Quelle fraction simplifiée cela représente-t-il ?", opts: ["3/4", "2/3", "4/6", "1/2"], answer: 1, explication: "La fraction est 12/18. Le PGCD de 12 et 18 est 6. On divise : 12÷6 = 2 et 18÷6 = 3. La fraction simplifiée est 2/3.", tableau: null },
      { q: "La température était −5°C le matin. Elle monte de 8°C puis redescend de 3°C. Quelle est la température finale ?", opts: ["0°C", "6°C", "−6°C", "10°C"], answer: 0, explication: "On effectue les calculs dans l'ordre. −5 + 8 = +3°C. Puis 3 − 3 = 0°C. La température finale est 0°C.", tableau: null },
      { q: "Un jardinier plante 3 rangées de (x + 4) arbres. Développe pour trouver le nombre total d'arbres.", opts: ["3x + 4", "3x + 12", "x + 12", "3x − 12"], answer: 1, explication: "On multiplie 3 par chaque terme entre parenthèses. 3 × x = 3x et 3 × 4 = 12. Donc 3(x + 4) = 3x + 12.", tableau: null },
      { q: "Un t-shirt coûte 80€. Il est soldé à −25%. Quel est son nouveau prix ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "On calcule la réduction : 25% de 80 = 0,25 × 80 = 20€. Nouveau prix = 80 − 20 = 60€.", tableau: null },
      { q: "Calcule 10⁰.", opts: ["0", "10", "1", "100"], answer: 2, explication: "Tout nombre non nul élevé à la puissance 0 est égal à 1. Donc 10⁰ = 1. C'est une règle valable pour tous les nombres.", tableau: null },
      { q: "Parmi ces nombres : 15, 21, 17 et 25, lequel est un nombre premier ?", opts: ["15", "21", "17", "25"], answer: 2, explication: "Un nombre premier n'est divisible que par 1 et lui-même. 15 = 3×5, 21 = 3×7, 25 = 5×5 (non premiers). 17 n'est divisible que par 1 et 17 : c'est bien un nombre premier.", tableau: null },
      { q: "Un professeur veut répartir 12 élèves en groupes égaux. Quels sont tous les nombres de groupes possibles ?", opts: ["1,2,3,4,6,12", "1,2,4,8,12", "1,3,4,6,12", "2,3,4,6,12"], answer: 0, explication: "Les diviseurs de 12 sont tous les entiers qui divisent 12 exactement. 12 = 1×12 = 2×6 = 3×4. Les diviseurs sont donc : 1, 2, 3, 4, 6 et 12.", tableau: null },
      { q: "Un boulanger fait 36 croissants. Peut-il les répartir en 9 paniers avec le même nombre dans chaque ?", opts: ["Oui", "Non", "Seulement si pair", "Impossible à savoir"], answer: 0, explication: "On vérifie si 36 est divisible par 9. La somme des chiffres de 36 est 3+6 = 9, qui est divisible par 9. Donc 36 est divisible par 9 : 36 ÷ 9 = 4 croissants par panier.", tableau: null },
      { q: "Quelle est la décomposition en facteurs premiers de 12 ?", opts: ["2 × 6", "2² × 3", "3 × 4", "2 × 3 × 2"], answer: 1, explication: "On divise par les nombres premiers. 12 ÷ 2 = 6. 6 ÷ 2 = 3. 3 ÷ 3 = 1. Donc 12 = 2 × 2 × 3 = 2² × 3.", tableau: null },
      { q: "Comment vérifier rapidement si 123 est divisible par 3 ?", opts: ["Il se termine par 0 ou 5", "La somme de ses chiffres est divisible par 3", "Il est pair", "Il se termine par 3"], answer: 1, explication: "Critère de divisibilité par 3 : on additionne les chiffres du nombre. 1+2+3 = 6. Comme 6 est divisible par 3, alors 123 est divisible par 3. Vérification : 123 ÷ 3 = 41.", tableau: null }
    ],
    "moyen": [
      { q: "Factorise x² − 9.", opts: ["(x−3)²", "(x+3)(x−3)", "(x+9)(x−1)", "(x−9)(x+1)"], answer: 1, explication: "On reconnaît la différence de deux carrés : a²−b² = (a+b)(a−b). Ici x²−9 = x²−3². Donc a = x et b = 3. Résultat : (x+3)(x−3). Vérification : (x+3)(x−3) = x²−9 ✓", tableau: null },
      { q: "Une boîte cubique a un côté de 2/3 m. Calcule son volume.", opts: ["6/9 m³", "8/27 m³", "2/9 m³", "4/9 m³"], answer: 1, explication: "Volume = côté³ = (2/3)³. On élève le numérateur et le dénominateur au cube : 2³/3³ = 8/27 m³.", tableau: null },
      { q: "Un terrain rectangulaire a une longueur de (x+3)m et une largeur de (x−2)m. Calcule son aire développée.", opts: ["x²+x−6 m²", "x²−x−6 m²", "x²+x+6 m²", "x²−6 m²"], answer: 0, explication: "Aire = longueur × largeur = (x+3)(x−2). On développe : x×x=x², x×(−2)=−2x, 3×x=3x, 3×(−2)=−6. On regroupe : x² + (−2x+3x) − 6 = x²+x−6 m².", tableau: null },
      { q: "Un article coûte 100€. Il augmente de 20% puis baisse de 20%. Quel est le prix final ?", opts: ["100€", "96€", "104€", "80€"], answer: 1, explication: "Après +20% : 100 × 1,20 = 120€. Après −20% : 120 × 0,80 = 96€. Le prix final est 96€. Attention : +20% puis −20% ne donnent pas le prix initial car les bases sont différentes.", tableau: null },
      { q: "Calcule 3 × 10⁻².", opts: ["300", "0,3", "0,03", "30"], answer: 2, explication: "10⁻² = 1/10² = 1/100 = 0,01. Donc 3 × 10⁻² = 3 × 0,01 = 0,03.", tableau: null },
      { q: "Factorise 2x² + 4x.", opts: ["2(x²+2x)", "2x(x+2)", "x(2x+4)", "2(x+2)"], answer: 1, explication: "On cherche le facteur commun. 2x² = 2x × x et 4x = 2x × 2. Le facteur commun est 2x. Donc : 2x² + 4x = 2x(x+2). Vérification : 2x×x + 2x×2 = 2x²+4x ✓", tableau: null },
      { q: "Calcule le PGCD de 24 et 36.", opts: ["4", "6", "12", "18"], answer: 2, explication: "On décompose : 24 = 2³×3 et 36 = 2²×3². Le PGCD est le produit des facteurs communs avec le plus petit exposant : 2² × 3 = 4 × 3 = 12.", tableau: null },
      { q: "Décompose 60 en facteurs premiers.", opts: ["2×3×10", "2²×3×5", "2×5×6", "3×4×5"], answer: 1, explication: "On divise successivement par les nombres premiers. 60÷2=30, 30÷2=15, 15÷3=5, 5÷5=1. Donc 60 = 2×2×3×5 = 2²×3×5.", tableau: null },
      { q: "Deux cloches sonnent toutes les 4 et 6 minutes. Dans combien de minutes sonneront-elles ensemble pour la première fois ?", opts: ["2 min", "12 min", "24 min", "8 min"], answer: 1, explication: "On cherche le PPCM de 4 et 6. Multiples de 4 : 4, 8, 12... Multiples de 6 : 6, 12... Le premier multiple commun est 12. Les cloches sonneront ensemble dans 12 minutes.", tableau: null },
      { q: "Réduis la fraction 15/35 à sa forme irréductible.", opts: ["5/7", "3/7", "5/12", "3/5"], answer: 1, explication: "15 = 3×5 et 35 = 5×7. Le PGCD est 5. On divise : 15÷5 = 3 et 35÷5 = 7. La fraction irréductible est 3/7.", tableau: null }
    ],
    "difficile": [
      { q: "Simplifie l'expression (3x² × 2x³) ÷ (6x⁴).", opts: ["x", "x²", "6x", "x/6"], answer: 0, explication: "Numérateur : 3x²×2x³ = (3×2)×(x²×x³) = 6×x^(2+3) = 6x⁵. Division : 6x⁵ ÷ 6x⁴ = (6÷6) × x^(5-4) = x. Le résultat est x.", tableau: null },
      { q: "Développe et réduis (x+2)² − (x−2)².", opts: ["8x", "4x", "8", "4x²"], answer: 0, explication: "(x+2)² = x²+4x+4 et (x−2)² = x²−4x+4. On soustrait : (x²+4x+4) − (x²−4x+4) = x²+4x+4−x²+4x−4 = 8x.", tableau: null },
      { q: "Calcule (2×10³) × (3×10⁴).", opts: ["5×10⁷", "6×10⁷", "6×10¹²", "5×10¹²"], answer: 1, explication: "On sépare les calculs. Partie numérique : 2×3 = 6. Puissances de 10 : 10³×10⁴ = 10^(3+4) = 10⁷. Résultat final : 6×10⁷.", tableau: null },
      { q: "Factorise x² − 6x + 9.", opts: ["(x−3)²", "(x+3)²", "(x−3)(x+3)", "(x−9)(x+1)"], answer: 0, explication: "On reconnaît l'identité a²−2ab+b² = (a−b)². Ici a=x, b=3 et 2ab = 6x. Donc x²−6x+9 = (x−3)². Vérification : (x−3)² = x²−6x+9 ✓", tableau: null },
      { q: "Lucas place 1000€ à 5% d'intérêts composés pendant 2 ans. Quel est le montant final ?", opts: ["1100€", "1102,5€", "1105€", "1050€"], answer: 1, explication: "Avec les intérêts composés, les intérêts s'ajoutent au capital chaque année. Après 1 an : 1000×1,05 = 1050€. Après 2 ans : 1050×1,05 = 1102,5€.", tableau: null },
      { q: "Utilise l'algorithme d'Euclide pour calculer PGCD(84, 56).", opts: ["7", "14", "21", "28"], answer: 3, explication: "Algorithme d'Euclide : on divise et on garde le reste. Étape 1 : 84 = 56×1 + 28. Étape 2 : 56 = 28×2 + 0. Quand le reste est 0, le PGCD est le dernier diviseur non nul : PGCD = 28.", tableau: null },
      { q: "Quel est le plus petit entier divisible à la fois par 6, 8 et 9 ?", opts: ["72", "144", "36", "48"], answer: 0, explication: "On calcule le PPCM(6,8,9). 6=2×3, 8=2³, 9=3². PPCM = 2³×3² = 8×9 = 72. Vérification : 72÷6=12 ✓, 72÷8=9 ✓, 72÷9=8 ✓.", tableau: null },
      { q: "Donne la décomposition en facteurs premiers de 360.", opts: ["2³×3²×5", "2²×3×5²", "2³×3×5²", "2²×3²×5²"], answer: 0, explication: "On divise successivement. 360÷2=180, 180÷2=90, 90÷2=45, 45÷3=15, 15÷3=5, 5÷5=1. Donc 360 = 2×2×2×3×3×5 = 2³×3²×5.", tableau: null },
      { q: "Calcule (√3+1)(√3−1).", opts: ["2", "4", "3", "√3"], answer: 0, explication: "On reconnaît l'identité (a+b)(a−b) = a²−b². Ici a=√3 et b=1. Résultat : (√3)²−1² = 3−1 = 2.", tableau: null },
      { q: "Simplifie la fraction (x²−4)/(x+2) pour x≠−2.", opts: ["x−2", "x+2", "x²−2", "x"], answer: 0, explication: "On factorise le numérateur : x²−4 = (x+2)(x−2). La fraction devient (x+2)(x−2)/(x+2). On simplifie par (x+2) : le résultat est x−2.", tableau: null }
    ]
  },
  "Géométrie": {
    "facile": [
      { q: "Un charpentier a un triangle rectangle avec deux côtés de 3cm et 4cm. Quelle est la longueur de l'hypoténuse ?", opts: ["5cm", "6cm", "7cm", "√7cm"], answer: 0, explication: "Théorème de Pythagore : hypoténuse² = 3²+4² = 9+16 = 25. Hypoténuse = √25 = 5cm.", tableau: null },
      { q: "Un jardin rectangulaire mesure 8m de long et 5m de large. Calcule son périmètre pour le clôturer.", opts: ["40m", "26m", "13m", "20m"], answer: 1, explication: "Périmètre = 2×(longueur+largeur) = 2×(8+5) = 2×13 = 26m.", tableau: null },
      { q: "Un triangle a une base de 6cm et une hauteur de 4cm. Calcule son aire.", opts: ["24cm²", "12cm²", "10cm²", "18cm²"], answer: 1, explication: "Aire d'un triangle = (base × hauteur) ÷ 2 = (6×4) ÷ 2 = 24 ÷ 2 = 12cm².", tableau: null },
      { q: "Dans un triangle, deux angles mesurent 90° et 35°. Quelle est la mesure du troisième angle ?", opts: ["45°", "55°", "65°", "75°"], answer: 1, explication: "La somme des angles d'un triangle est toujours 180°. Troisième angle = 180°−90°−35° = 55°.", tableau: null },
      { q: "Une piscine circulaire a un diamètre de 14m. Quel est son rayon ?", opts: ["28m", "14m", "7m", "3,5m"], answer: 2, explication: "Le rayon est la moitié du diamètre. Rayon = 14÷2 = 7m.", tableau: null },
      { q: "Un carrelage carré a un côté de 6cm. Calcule son aire.", opts: ["24cm²", "12cm²", "36cm²", "18cm²"], answer: 2, explication: "Aire d'un carré = côté² = 6² = 6×6 = 36cm².", tableau: null },
      { q: "Une boîte cubique a un côté de 3cm. Calcule son volume.", opts: ["9cm³", "18cm³", "27cm³", "81cm³"], answer: 2, explication: "Volume d'un cube = côté³ = 3³ = 3×3×3 = 27cm³.", tableau: null },
      { q: "Un jardin circulaire a un rayon de 5m. Calcule sa clôture. (π≈3,14)", opts: ["31,4m", "15,7m", "78,5m", "10m"], answer: 0, explication: "Circonférence = 2×π×r = 2×3,14×5 = 31,4m.", tableau: null },
      { q: "Deux rails de chemin de fer sont parallèles. Une route les coupe. Que peut-on dire des angles alternes-internes ?", opts: ["Ils sont supplémentaires", "Ils sont complémentaires", "Ils sont égaux", "Ils sont différents"], answer: 2, explication: "Propriété : quand deux droites parallèles sont coupées par une sécante, les angles alternes-internes sont toujours égaux.", tableau: null },
      { q: "Un triangle ABC a AB=AC=5cm et BC=3cm. Quel type de triangle est-ce ?", opts: ["Équilatéral", "Isocèle", "Rectangle", "Scalène"], answer: 1, explication: "Un triangle isocèle a au moins deux côtés égaux. Ici AB=AC=5cm. C'est donc un triangle isocèle en A.", tableau: null }
    ],
    "moyen": [
      { q: "Dans un triangle rectangle en A, l'angle B mesure 37°. Si BC=10cm, calcule la longueur AC. (sin37°≈0,6)", opts: ["4cm", "6cm", "8cm", "5cm"], answer: 1, explication: "sin(B) = côté opposé / hypoténuse = AC/BC. Donc AC = sin(37°)×BC = 0,6×10 = 6cm.", tableau: null },
      { q: "Dans un triangle ABC, DE est parallèle à BC. Si AD=3cm, AB=9cm et DE=4cm, calcule BC.", opts: ["8cm", "12cm", "6cm", "10cm"], answer: 1, explication: "Théorème de Thalès : AD/AB = DE/BC. Donc 3/9 = 4/BC. BC = 4×9/3 = 12cm.", tableau: null },
      { q: "Un terrain en trapèze a des bases de 6m et 10m, et une hauteur de 4m. Calcule son aire.", opts: ["32m²", "40m²", "24m²", "16m²"], answer: 0, explication: "Aire d'un trapèze = (grande base + petite base) ÷ 2 × hauteur = (10+6) ÷ 2 × 4 = 8×4 = 32m².", tableau: null },
      { q: "Dans un triangle rectangle en A, tan(B)=3/4 et AB=8cm. Calcule la longueur AC.", opts: ["4cm", "6cm", "8cm", "12cm"], answer: 1, explication: "tan(B) = côté opposé / côté adjacent = AC/AB. Donc AC = tan(B)×AB = (3/4)×8 = 6cm.", tableau: null },
      { q: "Une citerne cylindrique a un rayon de 3m et une hauteur de 5m. Calcule son volume. (π≈3,14)", opts: ["94,2m³", "141,3m³", "47,1m³", "188,4m³"], answer: 1, explication: "Volume d'un cylindre = π×r²×h = 3,14×9×5 = 141,3m³.", tableau: null },
      { q: "Dans un triangle ABC rectangle en C, AC=6cm et BC=8cm. Quelle est la valeur de cos(A) ?", opts: ["3/5", "4/5", "3/4", "4/3"], answer: 0, explication: "Pythagore : AB² = 6²+8² = 36+64 = 100, donc AB=10cm. cos(A) = côté adjacent / hypoténuse = AC/AB = 6/10 = 3/5.", tableau: null },
      { q: "Une piscine circulaire a un diamètre de 10m. Calcule son aire. (π≈3,14)", opts: ["31,4m²", "78,5m²", "314m²", "15,7m²"], answer: 1, explication: "Rayon = 10÷2 = 5m. Aire = π×r² = 3,14×25 = 78,5m².", tableau: null },
      { q: "Un triangle a AB=12cm, BC=9cm, AC=15cm. Démontre s'il est rectangle.", opts: ["Oui, en A", "Oui, en B", "Oui, en C", "Non"], answer: 1, explication: "On teste la réciproque de Pythagore avec le plus grand côté. AB²+BC² = 144+81 = 225 = 15² = AC². Comme AB²+BC² = AC², le triangle est rectangle en B.", tableau: null },
      { q: "Deux triangles semblables ont un rapport de 2. Le premier a une aire de 12cm². Quelle est l'aire du second ?", opts: ["24cm²", "36cm²", "48cm²", "6cm²"], answer: 2, explication: "Pour deux figures semblables de rapport k, les aires sont dans le rapport k². Ici k=2, donc rapport des aires = 4. Aire du second = 12×4 = 48cm².", tableau: null },
      { q: "Dans un triangle ABC, AD est tracé vers D sur BC. Que signifie que AD est une médiane ?", opts: ["AD est la hauteur", "D est le milieu de BC", "D est le centre du cercle", "AD est la bissectrice"], answer: 1, explication: "Une médiane relie un sommet au milieu du côté opposé. Donc AD est une médiane signifie que D est le milieu de BC.", tableau: null }
    ],
    "difficile": [
      { q: "Un entonnoir conique a un rayon de 4cm et une hauteur de 3cm. Calcule son volume. (π≈3,14)", opts: ["12,56cm³", "50,24cm³", "75,36cm³", "25,12cm³"], answer: 1, explication: "Volume d'un cône = (1/3)×π×r²×h = (1/3)×3,14×16×3 = 50,24cm³.", tableau: null },
      { q: "Deux cercles ont des rayons de 3cm et 5cm. Leurs centres sont à 8cm. Quelle est leur position relative ?", opts: ["Sécants", "Extérieurs l'un à l'autre", "Intérieurs", "Tangents extérieurement"], answer: 3, explication: "Distance entre centres = 8cm. Somme des rayons = 3+5 = 8cm. Comme d = r1+r2, les cercles sont tangents extérieurement.", tableau: null },
      { q: "Dans un triangle, les médianes se coupent en G. Si la médiane issue de A mesure m, quelle est la longueur AG ?", opts: ["m/2", "2m/3", "m/3", "3m/4"], answer: 1, explication: "Le centre de gravité G divise chaque médiane dans le rapport 2:1 depuis le sommet. Donc AG = (2/3)×m.", tableau: null },
      { q: "Une balle sphérique a un rayon de 6cm. Calcule son volume. (π≈3,14)", opts: ["904,32cm³", "452,16cm³", "113,04cm³", "226,08cm³"], answer: 0, explication: "Volume d'une sphère = (4/3)×π×r³ = (4/3)×3,14×216 = 904,32cm³.", tableau: null },
      { q: "Une pyramide à base carrée a un côté de 6cm et une hauteur de 4cm. Calcule son volume.", opts: ["48cm³", "72cm³", "24cm³", "96cm³"], answer: 0, explication: "Volume d'une pyramide = (1/3)×Aire base×hauteur = (1/3)×36×4 = 48cm³.", tableau: null },
      { q: "Dans un triangle rectangle en C, l'altitude CH coupe AB. Si AH=2cm et BH=8cm, calcule CH.", opts: ["4cm", "6cm", "8cm", "10cm"], answer: 0, explication: "Relation métrique dans un triangle rectangle : CH² = AH×BH = 2×8 = 16. CH = √16 = 4cm.", tableau: null },
      { q: "Un réservoir cylindrique a un rayon de 5m et une hauteur de 8m. Calcule son volume. (π≈3,14)", opts: ["628m³", "314m³", "1256m³", "200m³"], answer: 0, explication: "Volume = π×r²×h = 3,14×25×8 = 628m³.", tableau: null },
      { q: "Dans un triangle ABC, AB=13cm, BC=5cm, AC=12cm. Calcule sin(B).", opts: ["12/13", "5/13", "12/5", "5/12"], answer: 0, explication: "On vérifie : BC²+AC² = 25+144 = 169 = 13² = AB². Le triangle est rectangle en C, et AB est l'hypoténuse. sin(B) = côté opposé/hypoténuse = AC/AB = 12/13.", tableau: null },
      { q: "La réciproque du théorème de Pythagore sert à faire quoi ?", opts: ["Calculer une aire", "Démontrer qu'un triangle est rectangle", "Trouver un angle", "Calculer un périmètre"], answer: 1, explication: "La réciproque dit : si a²+b²=c² dans un triangle, alors il est rectangle. Elle permet donc de démontrer qu'un triangle est rectangle.", tableau: null },
      { q: "Dans un triangle, DE∥BC avec AD/DB=2/3. Quelle est la valeur de AE/EC ?", opts: ["2/3", "3/2", "2/5", "3/5"], answer: 0, explication: "Par le théorème de Thalès, si DE∥BC alors AD/DB = AE/EC. Donc AE/EC = 2/3.", tableau: null }
    ]
  },
  "Algèbre et équations": {
    "facile": [
      { q: "Emma pense à un nombre. Elle le multiplie par 2 et ajoute 3. Elle obtient 11. Quel est ce nombre ?", opts: ["x = 3", "x = 4", "x = 5", "x = 7"], answer: 1, explication: "On écrit l'équation : 2x+3 = 11. On soustrait 3 des deux membres : 2x = 8. On divise par 2 : x = 4.", tableau: null },
      { q: "Un magasin a 3x−5 articles. Il reçoit des livraisons pour en avoir 10 au total. Quelle est la valeur de x ?", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 2, explication: "On résout 3x−5 = 10. On ajoute 5 aux deux membres : 3x = 15. On divise par 3 : x = 5.", tableau: null },
      { q: "Un tiers d'un nombre inconnu vaut 4. Quelle est la valeur de ce nombre ?", opts: ["7", "12", "1,3", "4/3"], answer: 1, explication: "On écrit x/3 = 4. On multiplie les deux membres par 3 : x = 4×3 = 12.", tableau: null },
      { q: "La température est de 5°C. Elle baisse de 2x degrés et tombe à 1°C. Quelle est la valeur de x ?", opts: ["x = 2", "x = 3", "x = −2", "x = −3"], answer: 0, explication: "On écrit 5−2x = 1. On soustrait 5 des deux membres : −2x = −4. On divise par −2 : x = 2.", tableau: null },
      { q: "Développe l'expression 2(3x − 4).", opts: ["6x − 4", "6x − 8", "5x − 6", "6x + 8"], answer: 1, explication: "On multiplie le 2 par chaque terme. 2×3x = 6x et 2×(−4) = −8. Donc 2(3x−4) = 6x−8.", tableau: null },
      { q: "Emma a plus de 6 bonbons. Elle en prend 2x. Pour quelles valeurs de x a-t-elle plus de 3 bonbons ?", opts: ["x > 4", "x > 3", "x < 3", "x > 12"], answer: 1, explication: "On résout 2x > 6. On divise les deux membres par 2 (positif, sens inchangé) : x > 3.", tableau: null },
      { q: "Un fleuriste range 6x+9 fleurs en bouquets. Factorise cette expression.", opts: ["3(2x+3)", "6(x+3)", "3(2x+9)", "9(x+1)"], answer: 0, explication: "On cherche le facteur commun à 6x et 9. 6x = 3×2x et 9 = 3×3. Le facteur commun est 3. Donc 6x+9 = 3(2x+3).", tableau: null },
      { q: "Lucas a 4x billes. Il en donne 2x à Marie. Il lui reste 10 billes. Calcule x.", opts: ["x = 4", "x = 5", "x = 6", "x = 10"], answer: 1, explication: "On écrit 4x−2x = 10, soit 2x = 10. On divise par 2 : x = 5.", tableau: null },
      { q: "Un jardinier plante 3 fois (x+2) arbres et obtient 15 arbres au total. Quelle est la valeur de x ?", opts: ["x = 3", "x = 4", "x = 5", "x = 6"], answer: 0, explication: "On résout 3(x+2) = 15. On divise par 3 : x+2 = 5. On soustrait 2 : x = 3.", tableau: null },
      { q: "Une étagère contient x livres. Elle peut en contenir plus de 8. Si elle en contient déjà 5, combien peut-on en ajouter ?", opts: ["x > 3", "x > 13", "x < 3", "x > 40"], answer: 0, explication: "On résout x+5 > 8. On soustrait 5 des deux membres : x > 3. On peut ajouter plus de 3 livres.", tableau: null }
    ],
    "moyen": [
      { q: "Deux amis ont ensemble 7€ et leur différence est 3€. Combien a chacun ?", opts: ["x=4€, y=3€", "x=5€, y=2€", "x=3€, y=4€", "x=2€, y=5€"], answer: 1, explication: "Système : x+y=7 et x−y=3. On additionne : 2x=10, donc x=5. On substitue : 5+y=7, donc y=2.", tableau: null },
      { q: "Les côtés (x−3) et (x+2) d'un rectangle donnent une aire nulle. Quelles sont les valeurs de x ?", opts: ["x=3 ou x=−2", "x=−3 ou x=2", "x=3 ou x=2", "x=−3 ou x=−2"], answer: 0, explication: "Un produit est nul si l'un des facteurs est nul. x−3=0 → x=3. x+2=0 → x=−2. Les solutions sont x=3 ou x=−2.", tableau: null },
      { q: "Résous par produit nul : (2x−4)(x+1) = 0.", opts: ["x=2 ou x=1", "x=2 ou x=−1", "x=4 ou x=−1", "x=−2 ou x=1"], answer: 1, explication: "Un produit est nul si l'un des facteurs est nul. 2x−4=0 → 2x=4 → x=2. x+1=0 → x=−1. Les solutions sont x=2 ou x=−1.", tableau: null },
      { q: "Résous par produit nul : x(x−5) = 0.", opts: ["x=0 ou x=5", "x=0 ou x=−5", "x=5", "x=−5"], answer: 0, explication: "Un produit est nul si l'un des facteurs est nul. x=0 ou x−5=0 → x=5. Les solutions sont x=0 ou x=5. Ne pas oublier x=0 !", tableau: null },
      { q: "Résous par produit nul : (3x+6)(x−4) = 0.", opts: ["x=−2 ou x=4", "x=2 ou x=4", "x=−6 ou x=4", "x=2 ou x=−4"], answer: 0, explication: "3x+6=0 → 3x=−6 → x=−2. x−4=0 → x=4. Les solutions sont x=−2 ou x=4.", tableau: null },
      { q: "Dans un problème, on a 2x+y=8 et x−y=1. Calcule x et y.", opts: ["x=3, y=2", "x=2, y=4", "x=4, y=0", "x=3, y=3"], answer: 0, explication: "On additionne les deux équations : 3x=9, donc x=3. On substitue dans la première : 6+y=8, donc y=2.", tableau: null },
      { q: "Résous l'inéquation 3x − 2 ≤ 7.", opts: ["x ≤ 3", "x ≤ 5", "x ≥ 3", "x ≤ 9"], answer: 0, explication: "On ajoute 2 aux deux membres : 3x ≤ 9. On divise par 3 (positif, sens inchangé) : x ≤ 3.", tableau: null },
      { q: "Un terrain rectangulaire a une longueur de (x+4)m et une largeur de (x−1)m. Développe et réduis l'expression de son aire.", opts: ["x²+3x−4 m²", "x²−3x−4 m²", "x²+3x+4 m²", "x²+4 m²"], answer: 0, explication: "(x+4)(x−1) = x²−x+4x−4 = x²+3x−4 m².", tableau: null },
      { q: "Résous par produit nul : (x+3)² = 0.", opts: ["x=3", "x=−3", "x=9", "Pas de solution"], answer: 1, explication: "Un carré est nul uniquement quand sa base est nulle. x+3=0 → x=−3. Il n'y a qu'une seule solution : x=−3.", tableau: null },
      { q: "Dans un problème, on a 3x−2y=1 et x+y=2. Calcule x et y.", opts: ["x=1, y=1", "x=2, y=0", "x=0, y=2", "x=1, y=2"], answer: 0, explication: "De x+y=2 : x=2−y. On substitue : 3(2−y)−2y=1 → 6−5y=1 → y=1. Puis x=2−1=1.", tableau: null }
    ],
    "difficile": [
      { q: "Résous par produit nul : x² − 5x + 6 = 0.", opts: ["x=2 ou x=3", "x=−2 ou x=−3", "x=1 ou x=6", "x=2 ou x=−3"], answer: 0, explication: "On cherche deux nombres de produit 6 et de somme 5 : ce sont 2 et 3. Factorisation : (x−2)(x−3)=0. Solutions : x=2 ou x=3.", tableau: null },
      { q: "Résous par produit nul : x² − 7x = 0.", opts: ["x=0 ou x=7", "x=7 seulement", "x=0 seulement", "x=0 ou x=−7"], answer: 0, explication: "On factorise par x : x(x−7)=0. x=0 ou x−7=0 → x=7. Les solutions sont x=0 ou x=7. Ne jamais diviser par x, on perdrait la solution x=0.", tableau: null },
      { q: "Résous par produit nul : 2x² − 8 = 0.", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2 seulement", "x=√8"], answer: 0, explication: "On factorise : 2(x²−4)=0 → x²=4 → x=2 ou x=−2.", tableau: null },
      { q: "Résous par produit nul : x² + 4x + 4 = 0.", opts: ["x=−2 seulement", "x=2 seulement", "x=−2 ou x=2", "Pas de solution"], answer: 0, explication: "On reconnaît (x+2)²=0. Un carré est nul uniquement si sa base est nulle : x+2=0 → x=−2. C'est une racine double.", tableau: null },
      { q: "Résous par produit nul : 3x² − 12x + 9 = 0.", opts: ["x=1 ou x=3", "x=3 ou x=−1", "x=1 ou x=−3", "x=4 ou x=1"], answer: 0, explication: "On divise par 3 : x²−4x+3=0. Deux nombres de produit 3 et somme 4 : 1 et 3. (x−1)(x−3)=0 → x=1 ou x=3.", tableau: null },
      { q: "Résous par produit nul : x³ − x = 0.", opts: ["x=0, x=1 ou x=−1", "x=1 ou x=−1", "x=0 ou x=1", "x=0 seulement"], answer: 0, explication: "On factorise : x(x²−1)=x(x−1)(x+1)=0. Les trois solutions sont x=0, x=1 et x=−1.", tableau: null },
      { q: "Résous l'équation (x+1)/(x−1) = 2 pour x≠1.", opts: ["x=3", "x=−3", "x=1/3", "x=−1/3"], answer: 0, explication: "On multiplie par (x−1) : x+1=2(x−1)=2x−2. On isole x : 1+2=2x−x → x=3.", tableau: null },
      { q: "Résous par produit nul : (x²−1)(x+3) = 0.", opts: ["x=1, x=−1 ou x=−3", "x=1 ou x=−3", "x=−1 ou x=3", "x=1, x=−1 et x=3"], answer: 0, explication: "x²−1=(x−1)(x+1). Donc (x−1)(x+1)(x+3)=0 → x=1, x=−1 ou x=−3.", tableau: null },
      { q: "Pour quelles valeurs de x a-t-on x² − 4 > 0 ?", opts: ["x>2 ou x<−2", "−2<x<2", "x>2 seulement", "x<−2 seulement"], answer: 0, explication: "(x−2)(x+2)>0 quand les deux facteurs ont le même signe. Les deux positifs : x>2. Les deux négatifs : x<−2. Solution : x>2 ou x<−2.", tableau: null },
      { q: "Résous par produit nul : 2x²+x−6 = 0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "On cherche à factoriser. (2x−3)(x+2) = 2x²+4x−3x−6 = 2x²+x−6 ✓. 2x−3=0 → x=3/2. x+2=0 → x=−2.", tableau: null }
    ]
  },
  "Statistiques et probabilités": {
    "facile": [
      { q: "Cinq élèves ont eu : 8, 12, 14, 10 et 16. Calcule la moyenne de la classe.", opts: ["11", "12", "13", "10"], answer: 1, explication: "Somme = 8+12+14+10+16 = 60. Nombre de notes = 5. Moyenne = 60÷5 = 12.", tableau: null },
      { q: "Les âges triés de 5 enfants sont : 5, 8, 10, 14, 17 ans. Quelle est la médiane ?", opts: ["8 ans", "10 ans", "12 ans", "14 ans"], answer: 1, explication: "La médiane est la valeur centrale d'une série triée. Il y a 5 valeurs, la centrale est la 3ème : 10 ans.", tableau: null },
      { q: "Léo lance un dé équilibré à 6 faces. Quelle est la probabilité d'obtenir un 3 ?", opts: ["1/3", "1/2", "1/6", "1/4"], answer: 2, explication: "Le dé a 6 faces équiprobables. Une seule face montre un 3. P(3) = 1/6.", tableau: null },
      { q: "Dans une classe de 30 élèves, 18 sont des filles. Quelle est la fréquence des garçons ?", opts: ["18/30", "12/30", "18/12", "30/18"], answer: 1, explication: "Nombre de garçons = 30−18 = 12. Fréquence = 12/30 = 2/5 = 40%.", tableau: null },
      { q: "Les températures de la semaine sont : 3, 7, 2, 9, 5°C. Calcule l'étendue.", opts: ["5°C", "6°C", "7°C", "9°C"], answer: 2, explication: "L'étendue = valeur max − valeur min = 9−2 = 7°C.", tableau: null },
      { q: "Marie tire une carte dans un jeu de 52 cartes. Quelle est la probabilité de tirer un as ?", opts: ["1/13", "1/52", "4/13", "1/4"], answer: 0, explication: "Il y a 4 as dans 52 cartes. P(as) = 4/52 = 1/13.", tableau: null },
      { q: "Voici les notes d'une classe. Calcule l'effectif total.", tableau: { headers: ["Note", "0-5", "6-10", "11-15", "16-20"], rows: [["Nb élèves", "3", "8", "12", "7"]] }, opts: ["30 élèves", "28 élèves", "32 élèves", "25 élèves"], answer: 0, explication: "Effectif total = somme de tous les effectifs. 3+8+12+7 = 30 élèves." },
      { q: "Voici les températures du lundi au vendredi. Calcule la moyenne.", tableau: { headers: ["Jour", "Lun", "Mar", "Mer", "Jeu", "Ven"], rows: [["Temp (°C)", "12", "15", "11", "14", "18"]] }, opts: ["14°C", "13°C", "15°C", "12°C"], answer: 0, explication: "Somme = 12+15+11+14+18 = 70. Nombre de jours = 5. Moyenne = 70÷5 = 14°C." },
      { q: "Voici les membres d'un club sportif. Quel pourcentage pratique le football ?", tableau: { headers: ["Sport", "Football", "Tennis", "Natation", "Basket"], rows: [["Membres", "40", "25", "20", "15"]] }, opts: ["40%", "25%", "20%", "15%"], answer: 0, explication: "Total = 40+25+20+15 = 100. Fréquence football = 40/100 = 40%." },
      { q: "Voici les âges de 6 enfants. Calcule la moyenne d'âge.", tableau: { headers: ["Enfant", "A", "B", "C", "D", "E", "F"], rows: [["Âge", "8", "10", "9", "11", "8", "10"]] }, opts: ["9,3 ans", "10 ans", "9 ans", "9,5 ans"], answer: 0, explication: "Somme = 8+10+9+11+8+10 = 56. Nombre d'enfants = 6. Moyenne = 56÷6 ≈ 9,3 ans." }
    ],
    "moyen": [
      { q: "Tom a eu 12/20 (coeff 2) et 16/20 (coeff 3). Calcule sa moyenne pondérée.", opts: ["13,6", "14", "14,4", "15"], answer: 2, explication: "Moyenne pondérée = (12×2+16×3)÷(2+3) = (24+48)÷5 = 72÷5 = 14,4.", tableau: null },
      { q: "La probabilité qu'il pleuve est 0,3 et qu'il fasse du vent est 0,5. Ces événements sont indépendants. Calcule la probabilité qu'il pleuve ET qu'il vente en même temps.", opts: ["0,8", "0,15", "0,2", "0,35"], answer: 1, explication: "Pour des événements indépendants : P(A et B) = P(A)×P(B) = 0,3×0,5 = 0,15.", tableau: null },
      { q: "Un sac contient 4 billes rouges, 3 bleues et 3 vertes. Calcule la probabilité de NE PAS tirer une bille rouge.", opts: ["4/10", "6/10", "3/10", "7/10"], answer: 1, explication: "Total = 10 billes. Pas rouge = 3+3 = 6 billes. P(pas rouge) = 6/10. On peut aussi faire : 1−4/10 = 6/10.", tableau: null },
      { q: "Clara lance deux dés en même temps. Calcule la probabilité d'obtenir deux 6.", opts: ["1/6", "2/6", "1/36", "1/12"], answer: 2, explication: "Les deux lancers sont indépendants. P(6 au 1er dé) = 1/6 et P(6 au 2ème) = 1/6. P(deux 6) = 1/6×1/6 = 1/36.", tableau: null },
      { q: "Voici les notes d'un contrôle de 26 élèves. Calcule la moyenne.", tableau: { headers: ["Note", "4", "8", "10", "12", "16", "18"], rows: [["Effectif", "2", "5", "8", "6", "4", "1"]] }, opts: ["10,8", "10", "11", "10,5"], answer: 0, explication: "Somme = 4×2+8×5+10×8+12×6+16×4+18×1 = 8+40+80+72+64+18 = 282. Moyenne = 282÷26 ≈ 10,8." },
      { q: "Voici les billes dans un sac. Calcule la probabilité de tirer une bille rouge.", tableau: { headers: ["Couleur", "Rouge", "Bleue", "Verte", "Jaune"], rows: [["Nombre", "6", "4", "3", "2"]] }, opts: ["2/5", "1/5", "3/10", "1/3"], answer: 0, explication: "Total = 6+4+3+2 = 15 billes. P(rouge) = 6/15 = 2/5." },
      { q: "Voici les temps de trajet de 20 élèves. Quelle est la classe modale ?", tableau: { headers: ["Temps (min)", "0-10", "10-20", "20-30", "30-40"], rows: [["Effectif", "4", "9", "5", "2"]] }, opts: ["10-20 min", "0-10 min", "20-30 min", "30-40 min"], answer: 0, explication: "La classe modale est celle avec le plus grand effectif. La classe 10-20 min a 9 élèves, c'est la plus représentée." },
      { q: "Voici les ventes mensuelles d'une boulangerie. Calcule la moyenne mensuelle.", tableau: { headers: ["Mois", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun"], rows: [["Ventes (€)", "1200", "980", "1450", "1300", "1600", "1800"]] }, opts: ["1388€", "1400€", "1350€", "1450€"], answer: 0, explication: "Somme = 1200+980+1450+1300+1600+1800 = 8330€. Moyenne = 8330÷6 ≈ 1388€." },
      { q: "Emma lance une pièce 3 fois de suite. Calcule la probabilité d'obtenir pile les 3 fois.", opts: ["1/4", "1/8", "3/8", "1/6"], answer: 1, explication: "P(pile) = 1/2 à chaque lancer. Les lancers sont indépendants. P(3 fois pile) = (1/2)³ = 1/8.", tableau: null },
      { q: "Dans une série de 9 valeurs triées, quel est le rang de la médiane ?", opts: ["4ème", "5ème", "6ème", "7ème"], answer: 1, explication: "Le rang de la médiane = (n+1)/2 = (9+1)/2 = 5. La médiane est donc la 5ème valeur.", tableau: null }
    ],
    "difficile": [
      { q: "Un sac contient 5 billes rouges et 3 bleues. On tire une bille sans la remettre, puis une deuxième. Calcule la probabilité que les deux soient rouges.", opts: ["5/14", "25/64", "10/28", "1/2"], answer: 0, explication: "P(rouge au 1er tirage) = 5/8. Il reste 4 rouges sur 7 billes. P(rouge au 2ème) = 4/7. P(2 rouges) = 5/8 × 4/7 = 20/56 = 5/14.", tableau: null },
      { q: "Dans une classe, 40% font du sport (A) et 50% font de la musique (B), 20% font les deux. Calcule la probabilité qu'un élève fasse du sport OU de la musique.", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "Formule de l'union : P(A∪B) = P(A)+P(B)−P(A∩B) = 0,4+0,5−0,2 = 0,7.", tableau: null },
      { q: "Lucas lance deux dés. Il gagne si au moins l'un affiche un 6. Calcule la probabilité qu'il gagne.", opts: ["1/6", "11/36", "1/3", "12/36"], answer: 1, explication: "On calcule le complémentaire. P(aucun 6) = 5/6×5/6 = 25/36. P(au moins un 6) = 1−25/36 = 11/36.", tableau: null },
      { q: "Voici les salaires dans une entreprise. Calcule le salaire moyen.", tableau: { headers: ["Salaire (€)", "1200", "1500", "1800", "2200", "3000"], rows: [["Nb employés", "8", "15", "20", "10", "2"]] }, opts: ["1727€", "1740€", "1800€", "1650€"], answer: 0, explication: "N = 8+15+20+10+2 = 55. Somme = 1200×8+1500×15+1800×20+2200×10+3000×2 = 9600+22500+36000+22000+6000 = 96100. Moyenne = 96100÷55 ≈ 1747€." },
      { q: "Voici les temps d'écran quotidiens d'élèves. Calcule la moyenne.", tableau: { headers: ["Temps (h)", "1", "2", "3", "4", "5"], rows: [["Nb élèves", "3", "5", "8", "4", "2"]] }, opts: ["2,86h", "3h", "2,5h", "3,2h"], answer: 0, explication: "N = 3+5+8+4+2 = 22. Somme = 1×3+2×5+3×8+4×4+5×2 = 3+10+24+16+10 = 63. Moyenne = 63÷22 ≈ 2,86h." },
      { q: "La probabilité qu'il pleuve sachant qu'il fait nuageux vaut P(pluie∩nuageux)/P(nuageux) = 0,12/0,4. Calcule cette probabilité.", opts: ["0,048", "0,3", "0,28", "0,52"], answer: 1, explication: "P(pluie|nuageux) = P(pluie∩nuageux) / P(nuageux) = 0,12 / 0,4 = 0,3.", tableau: null },
      { q: "Sophie joue 3 fois avec P(succès)=0,5 à chaque fois. Calcule la probabilité d'avoir au moins un succès.", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "P(0 succès) = (1−0,5)³ = (0,5)³ = 1/8. P(au moins 1 succès) = 1−1/8 = 7/8.", tableau: null },
      { q: "Un QCM a 4 questions avec 4 choix chacune. En répondant au hasard, calcule la probabilité d'avoir tout bon.", opts: ["1/16", "1/64", "1/256", "1/4"], answer: 2, explication: "P(bonne réponse) = 1/4 par question. Les questions sont indépendantes. P(4 bonnes) = (1/4)⁴ = 1/256.", tableau: null },
      { q: "On tire 3 cartes d'un jeu de 52 sans remise. Calcule la probabilité de tirer 3 as.", opts: ["4/52×3/51×2/50", "4/52³", "1/13³", "4/52×4/52×4/52"], answer: 0, explication: "Sans remise : P(as1)=4/52, P(as2)=3/51, P(as3)=2/50. P(3 as) = 4/52 × 3/51 × 2/50.", tableau: null },
      { q: "On lance un dé équilibré. Calcule l'espérance de gain pour une loi uniforme sur {1,2,3,4,5,6}.", opts: ["3", "3,5", "4", "3,2"], answer: 1, explication: "E(X) = (1+2+3+4+5+6)/6 = 21/6 = 3,5.", tableau: null }
    ]
  },
  "Fonctions": {
    "facile": [
      { q: "Un taxi facture f(x)=2x+3€ pour x km. Calcule le prix pour 4km.", opts: ["10€", "11€", "12€", "14€"], answer: 1, explication: "On remplace x par 4 : f(4) = 2×4+3 = 8+3 = 11€.", tableau: null },
      { q: "La température d'un four suit f(x)=3x−1°C. Pour quelle valeur de x obtient-on 8°C ?", opts: ["x=2", "x=3", "x=4", "x=9"], answer: 1, explication: "On résout 3x−1=8. On ajoute 1 : 3x=9. On divise par 3 : x=3.", tableau: null },
      { q: "Un boulanger fait f(x)=2x gâteaux par heure. Quel type de fonction est-ce ?", opts: ["Affine", "Linéaire", "Constante", "Quadratique"], answer: 1, explication: "f(x)=2x est une fonction linéaire car elle passe par l'origine (0,0) et est de la forme f(x)=ax. Si c'était 2x+1, ce serait affine.", tableau: null },
      { q: "Un plombier facture f(x)=5x+2€ pour x heures. Quel est son tarif horaire ?", opts: ["2€/h", "5€/h", "7€/h", "10€/h"], answer: 1, explication: "Dans f(x)=ax+b, le coefficient directeur a=5 représente le tarif horaire. Le tarif est donc 5€/h. Le 2 est le déplacement fixe.", tableau: null },
      { q: "La fonction f(x)=−3x+6 représente le carburant restant. Quelle est la valeur initiale (x=0) ?", opts: ["−3 L", "3 L", "6 L", "−6 L"], answer: 2, explication: "L'ordonnée à l'origine est f(0) = −3×0+6 = 6 L. C'est la valeur quand x=0.", tableau: null },
      { q: "Voici les ventes journalières d'un marchand. Quelle est la formule f(x) ?", tableau: { headers: ["Jour (x)", "-2", "-1", "0", "1", "2", "3"], rows: [["Ventes f(x)", "-3", "0", "3", "6", "9", "12"]] }, opts: ["f(x)=3x+3", "f(x)=3x", "f(x)=x+3", "f(x)=2x+3"], answer: 0, explication: "f(0)=3, donc b=3. Variation entre deux valeurs consécutives : 3−0=3, donc a=3. Formule : f(x)=3x+3." },
      { q: "Voici les prix d'un taxi selon la distance. Quelle est la valeur manquante pour x=0 ?", tableau: { headers: ["Distance x (km)", "0", "1", "2", "3", "4"], rows: [["Prix f(x) (€)", "?", "1", "3", "5", "7"]] }, opts: ["−1€", "0€", "1€", "−2€"], answer: 0, explication: "La variation entre deux valeurs est +2. En reculant d'un rang depuis f(1)=1 : f(0) = 1−2 = −1€." },
      { q: "Voici les économies hebdomadaires de Léa. Quelle est la formule f(x) ?", tableau: { headers: ["Semaine x", "1", "2", "3", "4", "5"], rows: [["Économies f(x) (€)", "5", "8", "11", "14", "17"]] }, opts: ["f(x)=3x+2", "f(x)=2x+3", "f(x)=3x−1", "f(x)=4x+1"], answer: 0, explication: "Variation constante de 3, donc a=3. f(1)=5=3×1+b → b=2. Formule : f(x)=3x+2." },
      { q: "Voici la quantité de nourriture donnée à un animal. La fonction est-elle croissante ou décroissante ?", tableau: { headers: ["Jour x", "0", "2", "4", "6", "8"], rows: [["Quantité f(x) (g)", "10", "7", "4", "1", "-2"]] }, opts: ["Décroissante", "Croissante", "Constante", "Ni l'un ni l'autre"], answer: 0, explication: "Quand x augmente, f(x) diminue (10, 7, 4, 1, −2). La fonction est donc décroissante." },
      { q: "Une voiture roule à f(x)=2x km/h. Calcule l'antécédent de 10 par f.", opts: ["5", "20", "12", "8"], answer: 0, explication: "L'antécédent de 10 est la valeur x telle que f(x)=10. On résout 2x=10 → x=5.", tableau: null }
    ],
    "moyen": [
      { q: "La hauteur d'une balle suit f(x)=x²−4. Calcule la hauteur pour x=−3.", opts: ["5m", "13m", "−13m", "7m"], answer: 0, explication: "f(−3) = (−3)²−4 = 9−4 = 5m. (−3)²=+9 car le carré est toujours positif.", tableau: null },
      { q: "Une droite passe par les points (0,3) et (2,7). Quelle est son équation ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "b=3 (ordonnée à l'origine). a=(7−3)/(2−0)=4/2=2. Équation : y=2x+3.", tableau: null },
      { q: "Deux tarifs : f(x)=3x+1€ et g(x)=x−5€. Pour quelle valeur de x les prix sont-ils égaux ?", opts: ["x=−3", "x=3", "x=−2", "x=2"], answer: 0, explication: "On résout 3x+1=x−5. On regroupe : 2x=−6. On divise : x=−3.", tableau: null },
      { q: "Voici les consommations d'eau d'un ménage et d'une école. Pour quelle valeur de x sont-elles égales ?", tableau: { headers: ["Personnes x", "0", "1", "2", "3", "4"], rows: [["Ménage f(x)", "0", "2", "4", "6", "8"], ["École g(x)", "8", "6", "4", "2", "0"]] }, opts: ["x=2", "x=1", "x=3", "x=4"], answer: 0, explication: "On cherche x tel que f(x)=g(x). Pour x=2 : f(2)=4 et g(2)=4. Les consommations sont égales pour x=2." },
      { q: "Voici le barème d'un taxi. Quelle est la formule du prix ?", tableau: { headers: ["Distance (km)", "0", "5", "10", "15", "20"], rows: [["Prix (€)", "3", "8", "13", "18", "23"]] }, opts: ["f(x)=x+3", "f(x)=5x+3", "f(x)=0,5x+3", "f(x)=2x+3"], answer: 0, explication: "Prise en charge = 3€ (b=3). Tarif/km = (8−3)/5 = 1€/km (a=1). Formule : f(x)=x+3." },
      { q: "Voici le coût d'un abonnement de salle de sport. Quel est le tarif mensuel ?", tableau: { headers: ["Mois x", "1", "2", "3", "6", "12"], rows: [["Coût total (€)", "25", "45", "65", "125", "245"]] }, opts: ["20€/mois + 5€ d'inscription", "25€/mois sans frais", "15€/mois + 10€ d'inscription", "20€/mois sans frais"], answer: 0, explication: "Variation mensuelle = (45−25)/1 = 20€/mois. Frais fixes = 25−20×1 = 5€. Formule : f(x) = 20x+5." },
      { q: "La hauteur d'un objet suit f(x)=2x²−3x+1. Calcule f(2).", opts: ["1m", "3m", "5m", "7m"], answer: 1, explication: "f(2) = 2×4−3×2+1 = 8−6+1 = 3m.", tableau: null },
      { q: "La parabole f(x)=−x²+4 représente la hauteur d'un objet. Pour quelles valeurs de x touche-t-elle le sol (f(x)=0) ?", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2 seulement", "x=√4 seulement"], answer: 0, explication: "On résout −x²+4=0 → x²=4 → x=2 ou x=−2.", tableau: null },
      { q: "Une fonction linéaire vérifie f(3)=12. Calcule f(5).", opts: ["15", "20", "18", "25"], answer: 1, explication: "f(x)=ax. f(3)=12 → 3a=12 → a=4. f(5)=4×5=20.", tableau: null },
      { q: "Un plombier facture f(x)=2x+b€. Pour x=1h, il facture 7€. Calcule b (frais de déplacement).", opts: ["3€", "5€", "7€", "9€"], answer: 1, explication: "f(1)=2×1+b=7 → 2+b=7 → b=5€.", tableau: null }
    ],
    "difficile": [
      { q: "La parabole f(x)=x²−6x+8 coupe l'axe des x. Calcule ses racines.", opts: ["x=2 ou x=4", "x=−2 ou x=−4", "x=2 ou x=−4", "x=3 ou x=5"], answer: 0, explication: "Deux nombres de produit 8 et somme 6 : 2 et 4. Factorisation : (x−2)(x−4)=0. Racines : x=2 ou x=4.", tableau: null },
      { q: "La parabole f(x)=x²−4x+3 a un minimum. En quelle abscisse se trouve-t-il ?", opts: ["x=2", "x=3", "x=1", "x=4"], answer: 0, explication: "Le sommet d'une parabole f(x)=ax²+bx+c est en x=−b/(2a). Ici a=1, b=−4. x=4/2=2. f(2)=4−8+3=−1 (minimum).", tableau: null },
      { q: "Voici les tarifs de deux forfaits téléphoniques. À partir de combien de Go les tarifs sont-ils égaux ?", tableau: { headers: ["Go (x)", "0", "50", "100", "200", "500"], rows: [["Forfait A (€)", "200", "350", "500", "800", "1700"], ["Forfait B (€)", "0", "250", "500", "1000", "2500"]] }, opts: ["Pour 100 Go exactement", "Avant 100 Go", "Après 100 Go", "Jamais"], answer: 0, explication: "A : f(x)=3x+200. B : g(x)=5x. On résout 3x+200=5x → 200=2x → x=100 Go." },
      { q: "Calcule les racines de f(x)=2x²+4x−6.", opts: ["x=1 ou x=−3", "x=−1 ou x=3", "x=2 ou x=−3", "x=1 ou x=3"], answer: 0, explication: "On divise par 2 : x²+2x−3=0. Deux nombres de produit −3 et somme 2 : 3 et −1. (x+3)(x−1)=0 → x=−3 ou x=1.", tableau: null },
      { q: "Avec f(x)=3x+2, calcule g(x)=f(f(x)).", opts: ["9x+8", "6x+4", "9x+2", "3x+8"], answer: 0, explication: "g(x)=f(f(x))=f(3x+2)=3(3x+2)+2=9x+6+2=9x+8.", tableau: null },
      { q: "Pour quelles valeurs de x la parabole f(x)=x²−2x−3 est-elle sous l'axe des x (f(x)≤0) ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "Racines : (x+1)(x−3)=0 → x=−1 et x=3. La parabole (a=1>0) est sous l'axe entre ses racines. Solution : −1≤x≤3.", tableau: null },
      { q: "La fonction f(x)=(x−3)²+2 représente la hauteur d'un objet. Quelle est sa valeur minimale ?", opts: ["2", "3", "5", "0"], answer: 0, explication: "(x−3)²≥0 toujours. Il est nul quand x=3. Donc la valeur minimale de f est 0+2=2, atteinte en x=3.", tableau: null },
      { q: "La droite y=3x+2 et la parabole y=x² se croisent. Calcule le nombre de points d'intersection.", opts: ["0", "1", "2", "3"], answer: 2, explication: "On résout x²=3x+2 → x²−3x−2=0. Discriminant Δ=9+8=17>0. Comme Δ>0, il y a 2 solutions donc 2 points d'intersection.", tableau: null },
      { q: "Calcule l'abscisse du sommet de la parabole f(x)=2x²−8x+6.", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "Abscisse du sommet : x=−b/(2a)=8/(2×2)=8/4=2. f(2)=8−16+6=−2 (minimum).", tableau: null },
      { q: "Pour quelles valeurs de x a-t-on f(x)=x²−2x−3≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "Racines : (x+1)(x−3)=0 → x=−1 et x=3. La parabole est sous l'axe entre ses racines. Solution : −1≤x≤3.", tableau: null }
    ]
  },
  "Mélange de tous les thèmes": {
    "facile": [
      { q: "Calcule 2³ + 3².", opts: ["13", "17", "15", "72"], answer: 1, explication: "2³=8 et 3²=9. Somme : 8+9=17.", tableau: null },
      { q: "Un charpentier a un triangle avec deux côtés de 6cm et 8cm formant un angle droit. Calcule l'hypoténuse.", opts: ["10cm", "12cm", "14cm", "7cm"], answer: 0, explication: "Pythagore : c²=6²+8²=36+64=100 → c=10cm.", tableau: null },
      { q: "Emma pense à un nombre. Elle le multiplie par 3 et ajoute 6. Elle obtient 15. Quel est ce nombre ?", opts: ["x=2", "x=3", "x=4", "x=7"], answer: 1, explication: "3x+6=15 → 3x=9 → x=3.", tableau: null },
      { q: "Calcule la moyenne de 5, 10, 15 et 20.", opts: ["10", "12", "12,5", "15"], answer: 2, explication: "Somme=5+10+15+20=50. Nombre de valeurs=4. Moyenne=50÷4=12,5.", tableau: null },
      { q: "Un taxi facture f(x)=3x−2€. Calcule le prix pour x=3km.", opts: ["5€", "7€", "9€", "11€"], answer: 1, explication: "f(3)=3×3−2=9−2=7€.", tableau: null },
      { q: "Parmi 15, 21, 17 et 25, lequel est un nombre premier ?", opts: ["15", "21", "17", "25"], answer: 2, explication: "17 n'est divisible que par 1 et 17 : c'est un nombre premier. 15=3×5, 21=3×7 et 25=5×5 ne le sont pas.", tableau: null },
      { q: "Lucas lance un dé. Calcule la probabilité d'obtenir un nombre pair.", opts: ["1/3", "1/2", "2/3", "1/6"], answer: 1, explication: "Nombres pairs : 2, 4, 6 → 3 cas favorables sur 6. P(pair)=3/6=1/2.", tableau: null },
      { q: "Développe 4(2x − 3).", opts: ["8x−3", "8x−12", "6x−12", "8x+12"], answer: 1, explication: "4×2x=8x et 4×(−3)=−12. Résultat : 8x−12.", tableau: null },
      { q: "Calcule le périmètre d'un carré de côté 7cm.", opts: ["14cm", "21cm", "28cm", "49cm"], answer: 2, explication: "Périmètre=4×côté=4×7=28cm.", tableau: null },
      { q: "Réduis la fraction 15/25.", opts: ["3/5", "5/3", "1/5", "3/4"], answer: 0, explication: "PGCD(15,25)=5. 15÷5=3 et 25÷5=5. Fraction : 3/5.", tableau: null }
    ],
    "moyen": [
      { q: "Résous par produit nul : (x−2)(x+5)=0.", opts: ["x=2 ou x=−5", "x=−2 ou x=5", "x=2 ou x=5", "x=−2 ou x=−5"], answer: 0, explication: "x−2=0 → x=2. x+5=0 → x=−5. Les solutions sont x=2 ou x=−5.", tableau: null },
      { q: "Dans un triangle ABC, DE∥BC avec AD=4cm, AB=10cm et DE=6cm. Calcule BC.", opts: ["12cm", "15cm", "24cm", "8cm"], answer: 1, explication: "Thalès : AD/AB=DE/BC → 4/10=6/BC → BC=6×10/4=15cm.", tableau: null },
      { q: "Tom a eu 14/20 (coeff 3) et 8/20 (coeff 1). Calcule sa moyenne pondérée.", opts: ["11", "12,5", "12", "13"], answer: 1, explication: "(14×3+8×1)÷(3+1)=(42+8)÷4=50÷4=12,5.", tableau: null },
      { q: "La hauteur d'un objet suit f(x)=x²+2x−3. Calcule f(2).", opts: ["3m", "5m", "7m", "9m"], answer: 1, explication: "f(2)=4+4−3=5m.", tableau: null },
      { q: "Un réservoir cylindrique a un rayon de 2m et une hauteur de 5m. Calcule son volume. (π≈3,14)", opts: ["62,8m³", "31,4m³", "20m³", "125,6m³"], answer: 0, explication: "V=π×r²×h=3,14×4×5=62,8m³.", tableau: null },
      { q: "Calcule le PGCD de 48 et 36.", opts: ["6", "12", "18", "24"], answer: 1, explication: "48=2⁴×3 et 36=2²×3². PGCD=2²×3=4×3=12.", tableau: null },
      { q: "P(pluie)=0,4 et P(vent)=0,3, indépendants. Calcule P(pluie ET vent).", opts: ["0,7", "0,1", "0,12", "0,012"], answer: 2, explication: "P(A et B)=P(A)×P(B)=0,4×0,3=0,12.", tableau: null },
      { q: "Deux amis ont x+y=10€ et 2x−y=5€. Calcule x et y.", opts: ["x=5€, y=5€", "x=4€, y=6€", "x=6€, y=4€", "x=3€, y=7€"], answer: 0, explication: "Addition des équations : 3x=15 → x=5. Substitution : y=10−5=5.", tableau: null },
      { q: "Les âges triés sont : 3, 7, 9, 11, 15, 19 ans. Calcule la médiane.", opts: ["9 ans", "10 ans", "11 ans", "9,5 ans"], answer: 1, explication: "6 valeurs → médiane = (3ème+4ème)/2 = (9+11)/2 = 10 ans.", tableau: null },
      { q: "Une droite passe par (0,3) et (2,7). Quelle est son équation ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "b=3 (ordonnée en x=0). a=(7−3)/2=2. Équation : y=2x+3.", tableau: null }
    ],
    "difficile": [
      { q: "Résous par produit nul : x²−9x+20=0.", opts: ["x=4 ou x=5", "x=−4 ou x=−5", "x=4 ou x=−5", "x=2 ou x=10"], answer: 0, explication: "Produit 20, somme 9 : 4 et 5. (x−4)(x−5)=0 → x=4 ou x=5.", tableau: null },
      { q: "Calcule l'abscisse du sommet de f(x)=2x²−8x+6.", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "x=−b/(2a)=8/4=2. f(2)=8−16+6=−2 (minimum).", tableau: null },
      { q: "Emma lance 3 fois une pièce. Calcule la probabilité d'obtenir au moins une fois pile.", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "P(0 pile)=(1/2)³=1/8. P(au moins 1 pile)=1−1/8=7/8.", tableau: null },
      { q: "Simplifie (x²−4x+4)/(x−2) pour x≠2.", opts: ["x−2", "x+2", "x²−2", "2"], answer: 0, explication: "x²−4x+4=(x−2)². La fraction devient (x−2)²/(x−2)=x−2.", tableau: null },
      { q: "Calcule le volume d'une sphère de rayon 3cm. (π≈3,14)", opts: ["113,04cm³", "56,52cm³", "28,26cm³", "339,12cm³"], answer: 0, explication: "V=(4/3)×π×r³=(4/3)×3,14×27=113,04cm³.", tableau: null },
      { q: "Calcule PGCD(84,56) par l'algorithme d'Euclide.", opts: ["7", "14", "21", "28"], answer: 3, explication: "84=56×1+28. 56=28×2+0. Le PGCD est le dernier reste non nul : 28.", tableau: null },
      { q: "Résous par produit nul : 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "(2x−3)(x+2)=0 → x=3/2 ou x=−2.", tableau: null },
      { q: "Pour quelles valeurs de x a-t-on f(x)=x²−2x−3≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "Racines x=−1 et x=3. Parabole sous l'axe entre les racines : −1≤x≤3.", tableau: null },
      { q: "Calcule P(A∪B) avec P(A)=0,4, P(B)=0,5 et P(A∩B)=0,2.", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "P(A∪B)=P(A)+P(B)−P(A∩B)=0,4+0,5−0,2=0,7.", tableau: null },
      { q: "Calcule le taux de variation de f(x)=x² entre x=2 et x=5.", opts: ["7", "9", "21", "3"], answer: 0, explication: "Taux = (f(5)−f(2))/(5−2) = (25−4)/3 = 21/3 = 7.", tableau: null }
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
      'Nombres et calculs': 'puissances et racines carrées, notation scientifique, fractions irréductibles, PGCD par algorithme d\'Euclide, PPCM, nombres premiers, critères de divisibilité (2/3/5/9/10), décomposition en facteurs premiers, pourcentages, proportionnalité, calcul littéral, factorisation, développement',
      'Géométrie': 'théorème de Pythagore et sa réciproque, théorème de Thalès et sa réciproque, trigonométrie (sin/cos/tan), angles, triangles, cercles, transformations, aires et volumes (cylindre, cône, sphère, pyramide)',
      'Algèbre et équations': 'équations du premier degré, systèmes d\'équations à deux inconnues, inéquations, identités remarquables, équations du second degré par produit nul, développement et factorisation',
      'Statistiques et probabilités': 'moyenne arithmétique et pondérée, médiane, étendue, mode, fréquence relative, probabilité simple, événements indépendants, probabilité conditionnelle, tableaux de données',
      'Fonctions': 'fonctions linéaires et affines, tableau de valeurs, représentation graphique, taux de variation, fonctions croissantes/décroissantes, fonctions du second degré (parabole, racines, extremum), intersection de courbes',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations et systèmes, probabilités, fonctions affines et second degré, statistiques, PGCD/PPCM, nombres premiers, factorisation'
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
INTERDIT : "Attendez...", "Non erreur...", "Révision...", "En fait...", "Correction..."
L'explication doit aller dans un seul sens et se terminer par la réponse finale.
Mauvais : "x=5... Attendez, non, en fait x=3."
Bon : "On isole x. 2x=6. x=6÷2=3. La réponse est x=3."

RÈGLE 4 — TABLEAUX :
Pour stats/fonctions avec des données : crée un objet "tableau" structuré.
Sinon : écris "tableau": null.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.
Format : [{"q":"question claire","tableau":null,"opts":["A","B","C","D"],"bonne_reponse":"A","explication":"explication claire et définitive"}]`

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
