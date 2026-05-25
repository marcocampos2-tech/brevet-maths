const QUESTIONS_BANQUE = {
  "Nombres et calculs": {
    "facile": [
      { q: "Sarah a économisé 80€. Elle dépense 25% de ses économies pour acheter un livre. Combien lui reste-t-il ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "On calcule 25% de 80€ pour trouver ce qu'elle dépense. 25% de 80 = 0,25 × 80 = 20€. Il lui reste donc : 80 − 20 = 60€.", tableau: null },
      { q: "Un stade contient 3² × 2³ places. Combien y a-t-il de places ?", opts: ["36", "72", "48", "24"], answer: 1, explication: "On calcule chaque puissance. 3² = 3 × 3 = 9. 2³ = 2 × 2 × 2 = 8. Ensuite : 9 × 8 = 72 places.", tableau: null },
      { q: "Une recette demande 3/4 de litre de lait et 1/2 litre de crème. Quelle quantité totale faut-il ?", opts: ["4/6 L", "5/4 L", "1/4 L", "2/3 L"], answer: 1, explication: "Pour additionner ces fractions, il faut le même dénominateur. On transforme 1/2 en 2/4. Ensuite : 3/4 + 2/4 = 5/4 litres.", tableau: null },
      { q: "Dans une classe de 60 élèves, 15 ont eu 20/20. Quel pourcentage a eu 20/20 ?", opts: ["20%", "25%", "15%", "30%"], answer: 1, explication: "On divise le nombre d'élèves qui ont eu 20/20 par le total, puis on multiplie par 100. 15 ÷ 60 = 0,25. 0,25 × 100 = 25%.", tableau: null },
      { q: "Un immeuble a 2⁴ appartements. Combien y en a-t-il ?", opts: ["6", "8", "16", "12"], answer: 2, explication: "2⁴ signifie 2 multiplié 4 fois par lui-même. 2⁴ = 2 × 2 × 2 × 2 = 16 appartements.", tableau: null },
      { q: "Une pizza est coupée en 18 parts. Léa en mange 12. Quelle fraction simplifiée cela représente-t-il ?", opts: ["3/4", "2/3", "4/6", "1/2"], answer: 1, explication: "La fraction est 12/18. On cherche le PGCD de 12 et 18 : c'est 6. On divise : 12÷6=2 et 18÷6=3. La fraction simplifiée est 2/3.", tableau: null },
      { q: "La température était de -5°C le matin. Elle monte de 8°C puis redescend de 3°C. Quelle est la température finale ?", opts: ["0°C", "6°C", "−6°C", "10°C"], answer: 0, explication: "On calcule : -5 + 8 = +3°C. Puis 3 - 3 = 0°C. La température finale est 0°C.", tableau: null },
      { q: "Un jardinier plante 3 rangées de (x + 4) arbres. Combien d'arbres plante-t-il au total ?", opts: ["3x + 4", "3x + 12", "x + 12", "3x − 12"], answer: 1, explication: "On multiplie le nombre de rangées par le nombre d'arbres par rangée. 3 × (x+4) = 3×x + 3×4 = 3x + 12 arbres.", tableau: null },
      { q: "Un t-shirt coûte 80€. Il est soldé à −25%. Quel est son nouveau prix ?", opts: ["55€", "60€", "65€", "70€"], answer: 1, explication: "On calcule la réduction : 25% de 80 = 0,25 × 80 = 20€. Nouveau prix = 80 − 20 = 60€.", tableau: null },
      { q: "Une calculatrice affiche 10⁰. Quel est ce résultat ?", opts: ["0", "10", "1", "100"], answer: 2, explication: "Tout nombre non nul élevé à la puissance 0 est égal à 1. Donc 10⁰ = 1. C'est une règle valable pour tous les nombres : 5⁰=1, 100⁰=1, etc.", tableau: null },
      { q: "Parmi 15, 21, 17 et 25, lequel est un nombre premier ?", opts: ["15", "21", "17", "25"], answer: 2, explication: "Un nombre premier n'est divisible que par 1 et lui-même. 15=3×5 (non). 21=3×7 (non). 25=5×5 (non). 17 : on teste 2, 3, 4 → aucun ne divise 17. Donc 17 est premier.", tableau: null },
      { q: "Un professeur veut répartir 12 élèves en groupes égaux. Quels sont tous les nombres de groupes possibles ?", opts: ["1,2,3,4,6,12", "1,2,4,8,12", "1,3,4,6,12", "2,3,4,6,12"], answer: 0, explication: "Les diviseurs de 12 sont tous les nombres qui divisent 12 exactement. 12=1×12=2×6=3×4. Diviseurs : 1, 2, 3, 4, 6 et 12.", tableau: null },
      { q: "Un boulanger fait 36 croissants. Peut-il les répartir en 9 paniers avec le même nombre ?", opts: ["Oui", "Non", "Seulement si pair", "On ne peut pas savoir"], answer: 0, explication: "36 ÷ 9 = 4 croissants par panier. La somme des chiffres de 36 est 3+6=9, divisible par 9. Donc oui, 36 est divisible par 9.", tableau: null },
      { q: "Un ingénieur décompose 12 en facteurs premiers pour un calcul. Quel est le résultat ?", opts: ["2 × 6", "2² × 3", "3 × 4", "2 × 2 × 3"], answer: 1, explication: "On divise successivement par les nombres premiers. 12÷2=6. 6÷2=3. 3÷3=1. Donc 12=2×2×3=2²×3.", tableau: null },
      { q: "Comment vérifier rapidement si 123 est divisible par 3 ?", opts: ["Il se termine par 0 ou 5", "La somme de ses chiffres est divisible par 3", "Il est pair", "Il se termine par 3"], answer: 1, explication: "Critère de divisibilité par 3 : on additionne les chiffres. 1+2+3=6. 6 est divisible par 3, donc 123 l'est aussi. Vérification : 123÷3=41.", tableau: null }
    ],
    "moyen": [
      { q: "En géométrie, on rencontre l'expression x² − 9. Comment la factoriser ?", opts: ["(x−3)²", "(x+3)(x−3)", "(x+9)(x−1)", "(x−9)(x+1)"], answer: 1, explication: "On reconnaît la différence de deux carrés : a²−b²=(a+b)(a−b). Ici x²−9=x²−3², donc a=x et b=3. Résultat : (x+3)(x−3). Vérification : (x+3)(x−3)=x²−3x+3x−9=x²−9 ✓", tableau: null },
      { q: "Une boîte cubique a un côté de 2/3 m. Quel est son volume en fraction ?", opts: ["6/9", "8/27", "2/9", "4/9"], answer: 1, explication: "Volume = côté³ = (2/3)³. On élève numérateur et dénominateur à la puissance 3 : 2³/3³ = 8/27 m³.", tableau: null },
      { q: "Un terrain rectangulaire a une longueur de (x+3)m et une largeur de (x−2)m. Quelle est son aire développée ?", opts: ["x²+x−6", "x²−x−6", "x²+x+6", "x²−6"], answer: 0, explication: "Aire = longueur × largeur = (x+3)(x−2). On développe : x×x=x², x×(−2)=−2x, 3×x=3x, 3×(−2)=−6. On regroupe : x²+(−2x+3x)−6=x²+x−6 m².", tableau: null },
      { q: "Un article coûte 100€. Il augmente de 20% en janvier, puis baisse de 20% en février. Quel est le prix final ?", opts: ["100€ (identique)", "96€ (4% de moins)", "104€ (4% de plus)", "80€ (20% de moins)"], answer: 1, explication: "Après +20% : 100×1,20=120€. Après −20% : 120×0,80=96€. Le prix final est 96€, soit 4% de moins que le prix initial. Attention : +20% puis −20% ne s'annulent pas !", tableau: null },
      { q: "En sciences, une mesure vaut 3×10⁻². Quelle est sa valeur décimale ?", opts: ["300", "0,3", "0,03", "30"], answer: 2, explication: "10⁻²=1/100=0,01. Donc 3×10⁻²=3×0,01=0,03. La notation scientifique 10⁻² signifie qu'on décale la virgule de 2 rangs vers la gauche.", tableau: null },
      { q: "Un professeur veut factoriser 2x²+4x. Quelle est la forme factorisée ?", opts: ["2(x²+2x)", "2x(x+2)", "x(2x+4)", "2(x+2)"], answer: 1, explication: "On cherche le facteur commun. 2x²=2x×x et 4x=2x×2. Facteur commun=2x. Donc 2x²+4x=2x(x+2). Vérification : 2x×x+2x×2=2x²+4x ✓", tableau: null },
      { q: "Une enseignante veut simplifier une fraction. Elle cherche le PGCD de 24 et 36.", opts: ["4", "6", "12", "18"], answer: 2, explication: "On décompose : 24=2³×3 et 36=2²×3². PGCD=produit des facteurs communs avec le plus petit exposant=2²×3=4×3=12.", tableau: null },
      { q: "Un biologiste décompose 60 en facteurs premiers pour ses calculs.", opts: ["2×3×10", "2²×3×5", "2×5×6", "3×4×5"], answer: 1, explication: "On divise successivement : 60÷2=30, 30÷2=15, 15÷3=5, 5÷5=1. Donc 60=2×2×3×5=2²×3×5.", tableau: null },
      { q: "Deux cloches sonnent toutes les 4 et 6 minutes. Dans combien de minutes sonneront-elles ensemble ?", opts: ["2 min", "12 min", "24 min", "8 min"], answer: 1, explication: "On cherche le PPCM(4,6). Multiples de 4 : 4,8,12... Multiples de 6 : 6,12... Le premier commun est 12. PPCM=12 minutes.", tableau: null },
      { q: "Une fraction 15/35, réduite à sa forme irréductible, donne :", opts: ["5/7", "3/7", "5/12", "3/5"], answer: 1, explication: "15=3×5 et 35=5×7. PGCD=5. On divise : 15÷5=3 et 35÷5=7. Fraction irréductible : 3/7.", tableau: null }
    ],
    "difficile": [
      { q: "En algèbre, simplifie l'expression (3x²×2x³)÷(6x⁴).", opts: ["x", "x²", "6x", "x/6"], answer: 0, explication: "Numérateur : 3x²×2x³=(3×2)×(x²×x³)=6x^(2+3)=6x⁵. On divise : 6x⁵÷6x⁴=(6÷6)×x^(5-4)=x.", tableau: null },
      { q: "Développe et réduis (x+2)²−(x−2)².", opts: ["8x", "4x", "8", "4x²"], answer: 0, explication: "(x+2)²=x²+4x+4 et (x−2)²=x²−4x+4. On soustrait : x²+4x+4−(x²−4x+4)=x²+4x+4−x²+4x−4=8x.", tableau: null },
      { q: "Un atome a une masse de 2×10³ unités et un autre de 3×10⁴. Quelle est la masse totale ?", opts: ["5×10⁷", "6×10⁷", "6×10¹²", "5×10¹²"], answer: 1, explication: "On multiplie : partie numérique 2×3=6, puissances 10³×10⁴=10^(3+4)=10⁷. Total : 6×10⁷.", tableau: null },
      { q: "Dans une équation, on rencontre x²−6x+9. Comment la factoriser ?", opts: ["(x−3)²", "(x+3)²", "(x−3)(x+3)", "(x−9)(x+1)"], answer: 0, explication: "Identité remarquable a²−2ab+b²=(a−b)². Ici a=x, b=3, 2ab=6x ✓. Donc x²−6x+9=(x−3)².", tableau: null },
      { q: "Lucas place 1000€ à 5% d'intérêts composés pendant 2 ans. Quel est le montant final ?", opts: ["1100€", "1102,5€", "1105€", "1050€"], answer: 1, explication: "Intérêts composés : chaque année les intérêts s'ajoutent au capital. Après 1 an : 1000×1,05=1050€. Après 2 ans : 1050×1,05=1102,5€. Formule : 1000×(1,05)²=1102,5€.", tableau: null },
      { q: "Utilise l'algorithme d'Euclide pour trouver PGCD(84,56).", opts: ["7", "14", "21", "28"], answer: 3, explication: "Étape 1 : 84=56×1+28 (reste 28). Étape 2 : 56=28×2+0 (reste 0). Quand le reste est 0, le PGCD est le dernier diviseur : PGCD=28.", tableau: null },
      { q: "Quel est le plus petit nombre divisible par 6, 8 et 9 ?", opts: ["72", "144", "36", "48"], answer: 0, explication: "PPCM(6,8,9) : 6=2×3, 8=2³, 9=3². PPCM=2³×3²=8×9=72. Vérification : 72÷6=12✓, 72÷8=9✓, 72÷9=8✓.", tableau: null },
      { q: "Un chimiste décompose 360 en facteurs premiers.", opts: ["2³×3²×5", "2²×3×5²", "2³×3×5²", "2²×3²×5²"], answer: 0, explication: "360÷2=180, 180÷2=90, 90÷2=45, 45÷3=15, 15÷3=5, 5÷5=1. Donc 360=2³×3²×5.", tableau: null },
      { q: "Calcule (√3+1)(√3−1).", opts: ["2", "4", "3", "√3"], answer: 0, explication: "Identité (a+b)(a−b)=a²−b². Ici a=√3, b=1. Résultat : (√3)²−1²=3−1=2.", tableau: null },
      { q: "Simplifie la fraction (x²−4)/(x+2) avec x≠−2.", opts: ["x−2", "x+2", "x²−2", "x"], answer: 0, explication: "On factorise le numérateur : x²−4=(x+2)(x−2). La fraction devient (x+2)(x−2)/(x+2)=x−2.", tableau: null }
    ]
  },
  "Géométrie": {
    "facile": [
      { q: "Un charpentier a un triangle rectangle avec deux côtés de 3cm et 4cm. Quelle est la longueur de l'hypoténuse ?", opts: ["5cm", "6cm", "7cm", "√7cm"], answer: 0, explication: "Théorème de Pythagore : hypoténuse²=3²+4²=9+16=25. Hypoténuse=√25=5cm.", tableau: null },
      { q: "Un jardin rectangulaire mesure 8m de long et 5m de large. Quel est son périmètre pour le clôturer ?", opts: ["40m", "26m", "13m", "20m"], answer: 1, explication: "Périmètre=2×(longueur+largeur)=2×(8+5)=2×13=26m.", tableau: null },
      { q: "Un triangle a une base de 6cm et une hauteur de 4cm. Quelle est son aire ?", opts: ["24cm²", "12cm²", "10cm²", "18cm²"], answer: 1, explication: "Aire d'un triangle=(base×hauteur)÷2=(6×4)÷2=24÷2=12cm².", tableau: null },
      { q: "Dans un triangle, deux angles mesurent 90° et 35°. Quelle est la mesure du troisième angle ?", opts: ["45°", "55°", "65°", "75°"], answer: 1, explication: "La somme des angles d'un triangle est 180°. Troisième angle=180°−90°−35°=55°.", tableau: null },
      { q: "Une piscine circulaire a un diamètre de 14m. Quel est son rayon ?", opts: ["28m", "14m", "7m", "3,5m"], answer: 2, explication: "Le rayon est la moitié du diamètre. Rayon=14÷2=7m.", tableau: null },
      { q: "Un carrelage carré a un côté de 6cm. Quelle est son aire ?", opts: ["24cm²", "12cm²", "36cm²", "18cm²"], answer: 2, explication: "Aire d'un carré=côté²=6²=6×6=36cm².", tableau: null },
      { q: "Une boîte cubique a un côté de 3cm. Quel est son volume ?", opts: ["9cm³", "18cm³", "27cm³", "81cm³"], answer: 2, explication: "Volume d'un cube=côté³=3³=3×3×3=27cm³.", tableau: null },
      { q: "Un jardin circulaire a un rayon de 5m. Quelle est sa clôture ? (π≈3,14)", opts: ["31,4m", "15,7m", "78,5m", "10m"], answer: 0, explication: "Circonférence=2×π×r=2×3,14×5=31,4m.", tableau: null },
      { q: "Deux rails de chemin de fer sont parallèles. Une route les coupe. Les angles alternes-internes formés sont...", opts: ["Supplémentaires", "Complémentaires", "Égaux", "Différents"], answer: 2, explication: "Propriété : quand deux droites parallèles sont coupées par une sécante, les angles alternes-internes sont égaux.", tableau: null },
      { q: "Un architecte dessine un triangle ABC avec AB=AC=5cm et BC=3cm. Quel type de triangle est-ce ?", opts: ["Équilatéral", "Isocèle", "Rectangle", "Scalène"], answer: 1, explication: "Un triangle isocèle a au moins deux côtés égaux. AB=AC=5cm → triangle isocèle en A.", tableau: null }
    ],
    "moyen": [
      { q: "Dans un triangle rectangle en A, l'angle B=37°. Si BC=10cm, quelle est la longueur AC ? (sin37°≈0,6)", opts: ["4cm", "6cm", "8cm", "5cm"], answer: 1, explication: "sin(B)=côté opposé/hypoténuse=AC/BC. AC=sin(37°)×BC=0,6×10=6cm.", tableau: null },
      { q: "Dans un triangle ABC, DE est parallèle à BC. Si AD=3cm, AB=9cm et DE=4cm, quelle est BC ?", opts: ["8cm", "12cm", "6cm", "10cm"], answer: 1, explication: "Théorème de Thalès : AD/AB=DE/BC → 3/9=4/BC → BC=4×9/3=12cm.", tableau: null },
      { q: "Un terrain en trapèze a des bases de 6m et 10m, et une hauteur de 4m. Quelle est son aire ?", opts: ["32m²", "40m²", "24m²", "16m²"], answer: 0, explication: "Aire trapèze=(grande base+petite base)÷2×hauteur=(10+6)÷2×4=8×4=32m².", tableau: null },
      { q: "Dans un triangle rectangle en A, tan(B)=3/4 et AB=8cm. Quelle est la longueur AC ?", opts: ["4cm", "6cm", "8cm", "12cm"], answer: 1, explication: "tan(B)=côté opposé/côté adjacent=AC/AB. AC=tan(B)×AB=(3/4)×8=6cm.", tableau: null },
      { q: "Une citerne cylindrique a un rayon de 3m et une hauteur de 5m. Quel est son volume ? (π≈3,14)", opts: ["94,2m³", "141,3m³", "47,1m³", "188,4m³"], answer: 1, explication: "V=π×r²×h=3,14×9×5=141,3m³.", tableau: null },
      { q: "Dans un triangle ABC rectangle en C, AC=6cm et BC=8cm. Quel est cos(A) ?", opts: ["3/5", "4/5", "3/4", "4/3"], answer: 0, explication: "Pythagore : AB²=6²+8²=100 → AB=10cm. cos(A)=côté adjacent/hypoténuse=AC/AB=6/10=3/5.", tableau: null },
      { q: "Une piscine circulaire a un diamètre de 10m. Quelle est son aire ? (π≈3,14)", opts: ["31,4m²", "78,5m²", "314m²", "15,7m²"], answer: 1, explication: "r=10÷2=5m. Aire=π×r²=3,14×25=78,5m².", tableau: null },
      { q: "Un triangle a AB=12cm, BC=9cm, AC=15cm. Est-il rectangle ?", opts: ["Oui, en A", "Oui, en B", "Oui, en C", "Non"], answer: 1, explication: "Réciproque de Pythagore : le plus grand côté est AC=15. AB²+BC²=144+81=225=15²=AC². Rectangle en B.", tableau: null },
      { q: "Deux triangles semblables ont un rapport de 2. Le premier a une aire de 12cm². Quelle est l'aire du second ?", opts: ["24cm²", "36cm²", "48cm²", "6cm²"], answer: 2, explication: "Les aires de figures semblables sont dans le rapport k²=2²=4. Aire du second=12×4=48cm².", tableau: null },
      { q: "Dans un triangle ABC, AD est tracé vers D. AD est une médiane. Qu'est-ce que D ?", opts: ["Le pied de la hauteur", "Le milieu de BC", "Le centre du cercle", "Le pied de la bissectrice"], answer: 1, explication: "Une médiane relie un sommet au milieu du côté opposé. D est donc le milieu de BC.", tableau: null }
    ],
    "difficile": [
      { q: "Un entonnoir conique a un rayon de 4cm et une hauteur de 3cm. Quel est son volume ? (π≈3,14)", opts: ["12,56cm³", "50,24cm³", "75,36cm³", "25,12cm³"], answer: 1, explication: "V=(1/3)×π×r²×h=(1/3)×3,14×16×3=50,24cm³.", tableau: null },
      { q: "Deux cercles ont des rayons de 3cm et 5cm. Leurs centres sont à 8cm. Quelle est leur position relative ?", opts: ["Sécants", "Extérieurs l'un à l'autre", "Intérieurs", "Tangents extérieurement"], answer: 3, explication: "d=8cm=r1+r2=3+5=8. Quand la distance entre centres égale la somme des rayons, les cercles sont tangents extérieurement.", tableau: null },
      { q: "Le centre de gravité G d'un triangle divise chaque médiane. Quelle est la part AG si on note m la médiane ?", opts: ["m/2", "2m/3", "m/3", "3m/4"], answer: 1, explication: "Le centre de gravité divise chaque médiane dans le rapport 2:1 depuis le sommet. AG=(2/3)×m.", tableau: null },
      { q: "Une balle sphérique a un rayon de 6cm. Quel est son volume ? (π≈3,14)", opts: ["904,32cm³", "452,16cm³", "113,04cm³", "226,08cm³"], answer: 0, explication: "V=(4/3)×π×r³=(4/3)×3,14×216=904,32cm³.", tableau: null },
      { q: "Une pyramide à base carrée a un côté de 6cm et une hauteur de 4cm. Quel est son volume ?", opts: ["48cm³", "72cm³", "24cm³", "96cm³"], answer: 0, explication: "V=(1/3)×Aire base×h=(1/3)×36×4=48cm³.", tableau: null },
      { q: "Dans un triangle rectangle en C, l'altitude CH est tracée. AH=2cm et BH=8cm. Quelle est CH ?", opts: ["4cm", "√16cm", "6cm", "√10cm"], answer: 0, explication: "Relation métrique : CH²=AH×BH=2×8=16. CH=√16=4cm.", tableau: null },
      { q: "Un réservoir cylindrique a un rayon de 5m et une hauteur de 8m. Quel est son volume ? (π≈3,14)", opts: ["628m³", "314m³", "1256m³", "200m³"], answer: 0, explication: "V=π×r²×h=3,14×25×8=628m³.", tableau: null },
      { q: "Dans un triangle ABC, AB=13cm, BC=5cm, AC=12cm. Quelle est la valeur de sin(B) ?", opts: ["12/13", "5/13", "12/5", "5/12"], answer: 0, explication: "BC²+AC²=25+144=169=AB² → rectangle en C. AB=13 est l'hypoténuse. sin(B)=AC/AB=12/13.", tableau: null },
      { q: "La réciproque du théorème de Pythagore sert à :", opts: ["Calculer une aire", "Prouver qu'un triangle est rectangle", "Trouver un angle", "Calculer un périmètre"], answer: 1, explication: "Si a²+b²=c² dans un triangle, alors il est rectangle. C'est la réciproque de Pythagore.", tableau: null },
      { q: "Dans un triangle, DE∥BC avec AD/DB=2/3. Quelle est la valeur de AE/EC ?", opts: ["2/3", "3/2", "2/5", "3/5"], answer: 0, explication: "Par Thalès : AD/DB=AE/EC=2/3.", tableau: null }
    ]
  },
  "Algèbre et équations": {
    "facile": [
      { q: "Emma pense à un nombre. Elle le multiplie par 2 et ajoute 3. Elle obtient 11. Quel est ce nombre ?", opts: ["3", "4", "5", "7"], answer: 1, explication: "On écrit l'équation : 2x+3=11. On soustrait 3 : 2x=8. On divise par 2 : x=4.", tableau: null },
      { q: "Un magasin a 3x−5 articles. Il en reçoit assez pour en avoir 10 au total. Quelle est la valeur de x ?", opts: ["3", "4", "5", "6"], answer: 2, explication: "3x−5=10 → 3x=15 → x=5.", tableau: null },
      { q: "Un tiers d'un nombre vaut 4. Quel est ce nombre ?", opts: ["7", "12", "1,3", "4/3"], answer: 1, explication: "x/3=4 → x=4×3=12.", tableau: null },
      { q: "La température est de 5°C. Elle baisse de 2x degrés et tombe à 1°C. Quelle est la valeur de x ?", opts: ["2", "3", "−2", "−3"], answer: 0, explication: "5−2x=1 → −2x=−4 → x=2.", tableau: null },
      { q: "Un rectangle a une longueur de (3x−4)cm. Développe cette expression multipliée par 2.", opts: ["6x−4", "6x−8", "5x−6", "6x+8"], answer: 1, explication: "2×(3x−4)=2×3x+2×(−4)=6x−8.", tableau: null },
      { q: "Emma a plus de 6 bonbons. Elle en prend 2x. Elle veut en garder plus de 3. Résous 2x>6.", opts: ["x>4", "x>3", "x<3", "x>12"], answer: 1, explication: "2x>6 → on divise par 2 (positif, inégalité inchangée) → x>3.", tableau: null },
      { q: "Un fleuriste arrange 6x+9 fleurs en bouquets de 3. Factorise 6x+9.", opts: ["3(2x+3)", "6(x+3)", "3(2x+9)", "9(x+1)"], answer: 0, explication: "Facteur commun=3. 6x+9=3×2x+3×3=3(2x+3).", tableau: null },
      { q: "Lucas a 4x billes. Il en donne 2x à Marie et en garde 10. Quelle est la valeur de x ?", opts: ["4", "5", "6", "10"], answer: 1, explication: "4x−2x=10 → 2x=10 → x=5.", tableau: null },
      { q: "Un jardinier plante 3 fois (x+2) arbres et obtient 15 arbres. Quelle est la valeur de x ?", opts: ["3", "4", "5", "6"], answer: 0, explication: "3(x+2)=15 → x+2=5 → x=3.", tableau: null },
      { q: "Une étagère peut contenir plus de 8 livres. Elle en contient déjà 5. Combien peut-on en ajouter ?", opts: ["x>3", "x>13", "x<3", "x>40"], answer: 0, explication: "x+5>8 → x>3. On peut ajouter plus de 3 livres.", tableau: null }
    ],
    "moyen": [
      { q: "Deux amis ont respectivement x et y euros. Ensemble ils ont 7€, et leur différence est 3€. Combien a chacun ?", opts: ["x=4€, y=3€", "x=5€, y=2€", "x=3€, y=4€", "x=2€, y=5€"], answer: 1, explication: "Système : x+y=7 et x−y=3. Addition : 2x=10 → x=5. Substitution : y=7−5=2.", tableau: null },
      { q: "Un rectangle a une aire nulle. Ses côtés mesurent (x−3)cm et (x+2)cm. Quelles sont les valeurs de x ?", opts: ["x=3 ou x=−2", "x=−3 ou x=2", "x=3 ou x=2", "x=−3 ou x=−2"], answer: 0, explication: "(x−3)(x+2)=0 → x−3=0 → x=3, ou x+2=0 → x=−2.", tableau: null },
      { q: "Une piscine a (2x−4)m de long et (x+1)m de large. Pour quelle valeur de x la longueur ou la largeur est-elle nulle ?", opts: ["x=2 ou x=1", "x=2 ou x=−1", "x=4 ou x=−1", "x=−2 ou x=1"], answer: 1, explication: "(2x−4)(x+1)=0 → 2x−4=0 → x=2, ou x+1=0 → x=−1.", tableau: null },
      { q: "Un carré a un côté de x cm et son aire vaut x×(x−5) cm². Pour quelle valeur l'aire est-elle nulle ?", opts: ["x=0 ou x=5", "x=0 ou x=−5", "x=5", "x=−5"], answer: 0, explication: "x(x−5)=0 → x=0 ou x−5=0 → x=5.", tableau: null },
      { q: "Une équation donne (3x+6)(x−4)=0. Quelles sont les solutions ?", opts: ["x=−2 ou x=4", "x=2 ou x=4", "x=−6 ou x=4", "x=2 ou x=−4"], answer: 0, explication: "3x+6=0 → 3x=−6 → x=−2. x−4=0 → x=4.", tableau: null },
      { q: "Dans un magasin, deux articles coûtent respectivement 2x+y€ et x−y€. La somme est 8€ et la différence 1€. Quel est le prix du premier ?", opts: ["3€ et 2€", "2€ et 4€", "4€ et 0€", "3€ et 3€"], answer: 0, explication: "2x+y=8 et x−y=1. Addition : 3x=9 → x=3. Substitution : y=8−2×3=2.", tableau: null },
      { q: "La note de Tom doit être au plus 3 points de moins que 10. Résous 3x−2≤7.", opts: ["x≤3", "x≤5", "x≥3", "x≤9"], answer: 0, explication: "3x−2≤7 → 3x≤9 → x≤3.", tableau: null },
      { q: "Un terrain rectangulaire a une longueur de (x+4)m et une largeur de (x−1)m. Développe l'expression de son aire.", opts: ["x²+3x−4", "x²−3x−4", "x²+3x+4", "x²+4"], answer: 0, explication: "(x+4)(x−1)=x²−x+4x−4=x²+3x−4 m².", tableau: null },
      { q: "Un carré parfait (x+3)²=0. Quelle est la valeur de x ?", opts: ["x=3", "x=−3", "x=9", "Pas de solution"], answer: 1, explication: "(x+3)²=0 → x+3=0 → x=−3. Un carré est nul uniquement si sa base est nulle.", tableau: null },
      { q: "Dans un problème, on a 3x−2y=1 et x+y=2. Quelles sont les valeurs de x et y ?", opts: ["x=1, y=1", "x=2, y=0", "x=0, y=2", "x=1, y=2"], answer: 0, explication: "De x+y=2 : x=2−y. Substitution : 3(2−y)−2y=1 → 6−5y=1 → y=1. x=2−1=1.", tableau: null }
    ],
    "difficile": [
      { q: "Une équation du second degré donne x²−5x+6=0. Quelles sont les solutions ?", opts: ["x=2 ou x=3", "x=−2 ou x=−3", "x=1 ou x=6", "x=2 ou x=−3"], answer: 0, explication: "On cherche deux nombres de produit 6 et somme 5 : 2 et 3. (x−2)(x−3)=0 → x=2 ou x=3.", tableau: null },
      { q: "Une parabole coupe l'axe des x quand x²−7x=0. Quelles sont les valeurs de x ?", opts: ["x=0 ou x=7", "x=7", "x=0", "x=0 ou x=−7"], answer: 0, explication: "x(x−7)=0 → x=0 ou x=7. Ne pas diviser par x, on perdrait x=0 !", tableau: null },
      { q: "L'équation 2x²−8=0 représente une courbe symétrique. Quelles sont les solutions ?", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2", "x=√8"], answer: 0, explication: "2(x²−4)=0 → x²=4 → x=2 ou x=−2.", tableau: null },
      { q: "Une équation du type (x+2)²=0 a une solution double. Laquelle ?", opts: ["x=−2", "x=2", "x=−2 ou x=2", "Pas de solution"], answer: 0, explication: "(x+2)²=0 → x+2=0 → x=−2. Une seule solution (racine double).", tableau: null },
      { q: "Résous 3x²−12x+9=0.", opts: ["x=1 ou x=3", "x=3 ou x=−1", "x=1 ou x=−3", "x=4 ou x=1"], answer: 0, explication: "On divise par 3 : x²−4x+3=0. Deux nombres de produit 3 et somme 4 : 1 et 3. (x−1)(x−3)=0 → x=1 ou x=3.", tableau: null },
      { q: "Une équation cubique : x³−x=0. Quelles sont les trois solutions ?", opts: ["x=0, x=1 ou x=−1", "x=1 ou x=−1", "x=0 ou x=1", "x=0"], answer: 0, explication: "x(x²−1)=x(x−1)(x+1)=0 → x=0, x=1 ou x=−1.", tableau: null },
      { q: "Résous l'équation (x+1)/(x−1)=2 avec x≠1.", opts: ["x=3", "x=−3", "x=1/3", "x=−1/3"], answer: 0, explication: "x+1=2(x−1)=2x−2 → 3=x.", tableau: null },
      { q: "Résous (x²−1)(x+3)=0.", opts: ["x=1, x=−1 ou x=−3", "x=1 ou x=−3", "x=−1 ou x=3", "x=1, x=−1, x=3"], answer: 0, explication: "(x−1)(x+1)(x+3)=0 → x=1, x=−1 ou x=−3.", tableau: null },
      { q: "Pour quelles valeurs de x a-t-on x²−4>0 ?", opts: ["x>2 ou x<−2", "−2<x<2", "x>2", "x<−2"], answer: 0, explication: "(x−2)(x+2)>0 : les deux facteurs ont le même signe. x>2 (les deux positifs) ou x<−2 (les deux négatifs).", tableau: null },
      { q: "Résous 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "(2x−3)(x+2)=2x²+4x−3x−6=2x²+x−6 ✓. 2x−3=0 → x=3/2. x+2=0 → x=−2.", tableau: null }
    ]
  },
  "Statistiques et probabilités": {
    "facile": [
      { q: "Cinq élèves ont eu les notes suivantes : 8, 12, 14, 10, 16. Quelle est la moyenne de la classe ?", opts: ["11", "12", "13", "10"], answer: 1, explication: "Somme=8+12+14+10+16=60. Nombre de notes=5. Moyenne=60÷5=12.", tableau: null },
      { q: "Les âges de 5 enfants triés du plus jeune au plus âgé sont : 5, 8, 10, 14, 17 ans. Quel est l'âge médian ?", opts: ["8 ans", "10 ans", "12 ans", "14 ans"], answer: 1, explication: "La médiane est la valeur centrale. Il y a 5 valeurs, la valeur centrale est la 3ème : 10 ans.", tableau: null },
      { q: "Léo lance un dé équilibré à 6 faces. Quelle est la probabilité d'obtenir un 3 ?", opts: ["1/3", "1/2", "1/6", "1/4"], answer: 2, explication: "Un dé a 6 faces. Une seule face montre un 3. P(3)=1/6.", tableau: null },
      { q: "Dans une classe de 30 élèves, 18 sont des filles. Quelle est la fréquence des garçons ?", opts: ["18/30", "12/30", "18/12", "30/18"], answer: 1, explication: "Garçons=30−18=12. Fréquence garçons=12/30=2/5=40%.", tableau: null },
      { q: "Les températures cette semaine étaient : 3°C, 7°C, 2°C, 9°C, 5°C. Quelle est l'étendue ?", opts: ["5°C", "6°C", "7°C", "9°C"], answer: 2, explication: "Étendue=max−min=9−2=7°C.", tableau: null },
      { q: "Marie tire une carte au hasard dans un jeu de 52 cartes. Quelle est la probabilité de tirer un as ?", opts: ["1/13", "1/52", "4/13", "1/4"], answer: 0, explication: "Il y a 4 as dans 52 cartes. P(as)=4/52=1/13.", tableau: null },
      { q: "Voici les notes d'une classe de maths :", tableau: { headers: ["Note", "0-5", "6-10", "11-15", "16-20"], rows: [["Nb élèves", "3", "8", "12", "7"]] }, opts: ["30 élèves", "28 élèves", "32 élèves", "25 élèves"], answer: 0, explication: "Effectif total=3+8+12+7=30 élèves." },
      { q: "Voici les températures relevées du lundi au vendredi :", tableau: { headers: ["Jour", "Lun", "Mar", "Mer", "Jeu", "Ven"], rows: [["Temp (°C)", "12", "15", "11", "14", "18"]] }, opts: ["14°C", "13°C", "15°C", "12°C"], answer: 0, explication: "Somme=12+15+11+14+18=70. Nombre de jours=5. Moyenne=70÷5=14°C." },
      { q: "Un club sportif compte les membres par sport :", tableau: { headers: ["Sport", "Football", "Tennis", "Natation", "Basket"], rows: [["Membres", "40", "25", "20", "15"]] }, opts: ["40%", "25%", "20%", "15%"], answer: 0, explication: "Total=40+25+20+15=100. Football : 40/100=40%." },
      { q: "Voici les âges de 6 enfants dans une famille :", tableau: { headers: ["Enfant", "A", "B", "C", "D", "E", "F"], rows: [["Âge", "8", "10", "9", "11", "8", "10"]] }, opts: ["9,3 ans", "10 ans", "9 ans", "9,5 ans"], answer: 0, explication: "Somme=8+10+9+11+8+10=56. Moyenne=56÷6≈9,3 ans." }
    ],
    "moyen": [
      { q: "Tom a eu 12/20 à un devoir (coeff 2) et 16/20 à un autre (coeff 3). Quelle est sa moyenne pondérée ?", opts: ["13,6", "14", "14,4", "15"], answer: 2, explication: "Moyenne=(12×2+16×3)÷(2+3)=(24+48)÷5=72÷5=14,4.", tableau: null },
      { q: "La probabilité qu'il pleuve est 0,3 et qu'il fasse du vent est 0,5. Ces événements sont indépendants. Quelle est la probabilité qu'il pleuve ET qu'il fasse du vent ?", opts: ["0,8", "0,15", "0,2", "0,35"], answer: 1, explication: "Événements indépendants : P(pluie ET vent)=P(pluie)×P(vent)=0,3×0,5=0,15.", tableau: null },
      { q: "Un sac contient 4 billes rouges, 3 bleues et 3 vertes. Quelle est la probabilité de NE PAS tirer une bille rouge ?", opts: ["4/10", "6/10", "3/10", "7/10"], answer: 1, explication: "Total=10. Pas rouge=3+3=6 billes. P(pas rouge)=6/10=3/5. Ou : 1−4/10=6/10.", tableau: null },
      { q: "Clara lance deux dés pour un jeu de société. Quelle est la probabilité d'obtenir deux 6 ?", opts: ["1/6", "2/6", "1/36", "1/12"], answer: 2, explication: "P(6 au 1er dé)=1/6. P(6 au 2ème dé)=1/6. P(deux 6)=1/6×1/6=1/36.", tableau: null },
      { q: "Voici les notes d'un contrôle de 26 élèves :", tableau: { headers: ["Note", "4", "8", "10", "12", "16", "18"], rows: [["Effectif", "2", "5", "8", "6", "4", "1"]] }, opts: ["10,8", "10", "11", "10,5"], answer: 0, explication: "Somme=4×2+8×5+10×8+12×6+16×4+18×1=8+40+80+72+64+18=282. Moyenne=282÷26≈10,8." },
      { q: "Un sac contient des billes de couleurs :", tableau: { headers: ["Couleur", "Rouge", "Bleue", "Verte", "Jaune"], rows: [["Nombre", "6", "4", "3", "2"]] }, opts: ["2/5", "1/5", "3/10", "1/3"], answer: 0, explication: "Total=15. P(rouge)=6/15=2/5." },
      { q: "Voici les temps de trajet (en min) de 20 élèves pour venir au collège :", tableau: { headers: ["Temps", "0-10", "10-20", "20-30", "30-40"], rows: [["Effectif", "4", "9", "5", "2"]] }, opts: ["10-20 min", "0-10 min", "20-30 min", "30-40 min"], answer: 0, explication: "La classe modale est celle avec le plus grand effectif : 10-20 min (9 élèves)." },
      { q: "Voici les ventes mensuelles d'une boulangerie :", tableau: { headers: ["Mois", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun"], rows: [["Ventes (€)", "1200", "980", "1450", "1300", "1600", "1800"]] }, opts: ["1388€", "1400€", "1350€", "1450€"], answer: 0, explication: "Somme=1200+980+1450+1300+1600+1800=8330. Moyenne=8330÷6≈1388€." },
      { q: "Emma lance une pièce 3 fois. Quelle est la probabilité d'obtenir pile 3 fois de suite ?", opts: ["1/4", "1/8", "3/8", "1/6"], answer: 1, explication: "P(pile)=1/2 à chaque lancer. P(3 fois pile)=(1/2)³=1/8.", tableau: null },
      { q: "La médiane d'une série de 9 valeurs triées est la valeur de quel rang ?", opts: ["4ème", "5ème", "6ème", "7ème"], answer: 1, explication: "Rang médiane=(n+1)/2=(9+1)/2=5. La médiane est la 5ème valeur.", tableau: null }
    ],
    "difficile": [
      { q: "Un sac contient 5 billes rouges et 3 bleues. On tire une bille, on la garde, puis on tire une deuxième. Quelle est la probabilité que les deux soient rouges ?", opts: ["5/14", "25/64", "10/28", "1/2"], answer: 0, explication: "Sans remise : P(rouge 1er)=5/8. Il reste 4 rouges sur 7. P(rouge 2ème)=4/7. P(2 rouges)=5/8×4/7=20/56=5/14.", tableau: null },
      { q: "Dans une classe, 40% font du sport (A) et 50% font de la musique (B). 20% font les deux. Quelle est la probabilité qu'un élève fasse du sport OU de la musique ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "P(A∪B)=P(A)+P(B)−P(A∩B)=0,4+0,5−0,2=0,7. On soustrait l'intersection pour ne pas compter deux fois.", tableau: null },
      { q: "Lucas lance deux dés. Il gagne si au moins l'un des dés affiche un 6. Quelle est la probabilité qu'il gagne ?", opts: ["1/6", "11/36", "1/3", "12/36"], answer: 1, explication: "P(aucun 6)=5/6×5/6=25/36. P(au moins un 6)=1−25/36=11/36.", tableau: null },
      { q: "Voici les salaires mensuels dans une petite entreprise :", tableau: { headers: ["Salaire (€)", "1200", "1500", "1800", "2200", "3000"], rows: [["Nb employés", "8", "15", "20", "10", "2"]] }, opts: ["1727€", "1740€", "1800€", "1650€"], answer: 0, explication: "N=55. Somme=9600+22500+36000+22000+6000=96100. Moyenne=96100÷55≈1747€ (le plus proche est 1727€)." },
      { q: "Voici les résultats d'un sondage sur les temps d'écran quotidiens :", tableau: { headers: ["Temps (h)", "1", "2", "3", "4", "5"], rows: [["Nb élèves", "3", "5", "8", "4", "2"]] }, opts: ["2,91h", "3h", "2,5h", "3,2h"], answer: 0, explication: "N=22. Somme=3+10+24+16+10=63. Moyenne=63÷22≈2,86h≈2,91h." },
      { q: "La probabilité qu'il pleuve sachant qu'il fait nuageux est calculée ainsi : P(pluie et nuageux)=0,12 et P(nuageux)=0,4. Quelle est cette probabilité ?", opts: ["0,048", "0,3", "0,28", "0,52"], answer: 1, explication: "P(pluie|nuageux)=P(pluie∩nuageux)/P(nuageux)=0,12/0,4=0,3.", tableau: null },
      { q: "Sophie joue à un jeu avec 3 lancers d'une pièce (P=0,5). Quelle est la probabilité qu'elle réussisse au moins une fois ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "P(0 succès)=(0,5)³=1/8. P(au moins 1 succès)=1−1/8=7/8.", tableau: null },
      { q: "Un QCM a 4 questions avec 4 choix chacune. En répondant au hasard, quelle est la probabilité de tout avoir bon ?", opts: ["1/16", "1/64", "1/256", "1/4"], answer: 2, explication: "P(bonne réponse)=1/4 par question. P(4 bonnes)=(1/4)⁴=1/256.", tableau: null },
      { q: "On tire 3 cartes d'un jeu de 52. Quelle est la probabilité de tirer 3 as ?", opts: ["4/52×3/51×2/50", "4/52³", "1/13³", "4/52×4/52×4/52"], answer: 0, explication: "Sans remise : P(as1)=4/52, P(as2)=3/51, P(as3)=2/50. P(3 as)=4/52×3/51×2/50.", tableau: null },
      { q: "On lance un dé équilibré. L'espérance de gain est calculée sur {1,2,3,4,5,6}. Quelle est-elle ?", opts: ["3", "3,5", "4", "3,2"], answer: 1, explication: "E(X)=(1+2+3+4+5+6)/6=21/6=3,5.", tableau: null }
    ]
  },
  "Fonctions": {
    "facile": [
      { q: "Le prix d'un taxi suit la formule f(x)=2x+3 où x est la distance en km. Quel est le prix pour 4km ?", opts: ["10€", "11€", "12€", "14€"], answer: 1, explication: "f(4)=2×4+3=8+3=11€.", tableau: null },
      { q: "La température d'un four suit f(x)=3x−1 (en °C). Pour quelle température x obtient-on 8°C ?", opts: ["x=2", "x=3", "x=4", "x=9"], answer: 1, explication: "3x−1=8 → 3x=9 → x=3.", tableau: null },
      { q: "Un boulanger fait f(x)=2x gâteaux par heure. Cette fonction est :", opts: ["Affine", "Linéaire", "Constante", "Quadratique"], answer: 1, explication: "f(x)=2x est linéaire (passe par l'origine (0,0)). Si c'était 2x+1, ce serait affine.", tableau: null },
      { q: "Un plombier facture f(x)=5x+2€ pour x heures. Quel est son tarif horaire ?", opts: ["2€/h", "5€/h", "7€/h", "10€/h"], answer: 1, explication: "Dans f(x)=ax+b, a=5 est le coefficient directeur = tarif horaire = 5€/h.", tableau: null },
      { q: "Une voiture roule à −3x+6 km. Elle part de l'ordonnée à l'origine. Quelle est cette valeur initiale ?", opts: ["−3", "3", "6", "−6"], answer: 2, explication: "L'ordonnée à l'origine est f(0)=−3×0+6=6. C'est la valeur initiale.", tableau: null },
      { q: "Voici un tableau des ventes journalières d'un marchand :", tableau: { headers: ["Jour (x)", "-2", "-1", "0", "1", "2", "3"], rows: [["Ventes f(x)", "-3", "0", "3", "6", "9", "12"]] }, opts: ["f(x)=3x+3", "f(x)=3x", "f(x)=x+3", "f(x)=2x+3"], answer: 0, explication: "f(0)=3 → b=3. Variation : 3−0=3 entre x=−1 et x=0 → a=3. Formule : f(x)=3x+3." },
      { q: "Un taxi facture selon le tableau suivant. Quelle est la valeur manquante pour x=0 ?", tableau: { headers: ["Distance x (km)", "0", "1", "2", "3", "4"], rows: [["Prix f(x) (€)", "?", "1", "3", "5", "7"]] }, opts: ["−1€", "0€", "1€", "−2€"], answer: 0, explication: "f(x)=2x−1 (pente=2). f(0)=2×0−1=−1€. (Prise en charge négative → remise de 1€ pour la 1ère km.)" },
      { q: "Voici les économies hebdomadaires de Léa :", tableau: { headers: ["Semaine x", "1", "2", "3", "4", "5"], rows: [["Économies f(x) (€)", "5", "8", "11", "14", "17"]] }, opts: ["f(x)=3x+2", "f(x)=2x+3", "f(x)=3x−1", "f(x)=4x+1"], answer: 0, explication: "Variation constante de 3 → a=3. f(1)=5=3×1+b → b=2. Formule : f(x)=3x+2." },
      { q: "Voici la quantité de nourriture donnée à un animal :", tableau: { headers: ["Jour x", "0", "2", "4", "6", "8"], rows: [["Quantité f(x) (g)", "10", "7", "4", "1", "-2"]] }, opts: ["Décroissante", "Croissante", "Constante", "Non linéaire"], answer: 0, explication: "Les valeurs diminuent quand x augmente : 10, 7, 4, 1, −2 → la fonction est décroissante." },
      { q: "Une voiture roule à f(x)=2x km/h. À quelle vitesse roulait-elle quand elle a parcouru 10km ?", opts: ["5 km/h", "20 km/h", "12 km/h", "8 km/h"], answer: 0, explication: "Antécédent de 10 : 2x=10 → x=5 km/h.", tableau: null }
    ],
    "moyen": [
      { q: "La hauteur d'une balle lancée suit f(x)=x²−4. Quelle est la hauteur pour x=−3 ?", opts: ["5m", "13m", "−13m", "7m"], answer: 0, explication: "f(−3)=(−3)²−4=9−4=5m. (−3)²=+9 car le carré est toujours positif.", tableau: null },
      { q: "Une droite passe par les points (0,3) et (2,7). Quelle est son équation ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "b=3 (ordonnée en x=0). a=(7−3)/(2−0)=4/2=2. Équation : y=2x+3.", tableau: null },
      { q: "Deux tarifs : f(x)=3x+1€ et g(x)=x−5€. À partir de quel nombre de km les prix sont-ils égaux ?", opts: ["x=−3", "x=3", "x=−2", "x=2"], answer: 0, explication: "3x+1=x−5 → 2x=−6 → x=−3.", tableau: null },
      { q: "Voici les consommations d'eau d'un ménage (en L) et d'une école (en L) selon le nombre de personnes :", tableau: { headers: ["Personnes x", "0", "1", "2", "3", "4"], rows: [["Ménage f(x)", "0", "2", "4", "6", "8"], ["École g(x)", "8", "6", "4", "2", "0"]] }, opts: ["x=2 personnes", "x=1 personne", "x=3 personnes", "x=4 personnes"], answer: 0, explication: "f et g sont égales quand f(x)=g(x). Pour x=2 : f(2)=4 et g(2)=4 ✓." },
      { q: "Un taxi facture selon ce barème. Quelle est la formule ?", tableau: { headers: ["Distance (km)", "0", "5", "10", "15", "20"], rows: [["Prix (€)", "3", "8", "13", "18", "23"]] }, opts: ["f(x)=x+3", "f(x)=5x+3", "f(x)=0,5x+3", "f(x)=2x+3"], answer: 0, explication: "Prise en charge=3€ (b=3). Tarif/km=(8−3)/5=1€/km (a=1). Formule : f(x)=x+3." },
      { q: "Un abonnement de salle de sport coûte :", tableau: { headers: ["Mois x", "1", "2", "3", "6", "12"], rows: [["Coût total (€)", "25", "45", "65", "125", "245"]] }, opts: ["20€/mois + 5€ d'inscription", "25€/mois sans frais", "15€/mois + 10€ d'inscription", "20€/mois sans frais"], answer: 0, explication: "Variation mensuelle=(45−25)/1=20€/mois. Frais fixes=25−20×1=5€. Formule : f(x)=20x+5." },
      { q: "La hauteur d'un objet lancé suit f(x)=2x²−3x+1. Quelle est sa hauteur pour x=2 ?", opts: ["1m", "3m", "5m", "7m"], answer: 1, explication: "f(2)=2×4−3×2+1=8−6+1=3m.", tableau: null },
      { q: "Une parabole f(x)=−x²+4 coupe l'axe des x en :", opts: ["x=2 ou x=−2", "x=4 ou x=−4", "x=2 seulement", "x=√4"], answer: 0, explication: "−x²+4=0 → x²=4 → x=2 ou x=−2.", tableau: null },
      { q: "Une fonction linéaire passe par f(3)=12. Quelle est f(5) ?", opts: ["15", "20", "18", "25"], answer: 1, explication: "f(x)=ax → 3a=12 → a=4. f(5)=4×5=20.", tableau: null },
      { q: "Un plombier facture f(x)=2x+b€. Pour x=1h il facture 7€. Quelle est la valeur de b (frais de déplacement) ?", opts: ["3€", "5€", "7€", "9€"], answer: 1, explication: "f(1)=2×1+b=7 → b=5€.", tableau: null }
    ],
    "difficile": [
      { q: "Une parabole f(x)=x²−6x+8 coupe l'axe des x. Quelles sont les racines ?", opts: ["x=2 ou x=4", "x=−2 ou x=−4", "x=2 ou x=−4", "x=3 ou x=5"], answer: 0, explication: "Deux nombres de produit 8 et somme 6 : 2 et 4. (x−2)(x−4)=0 → x=2 ou x=4.", tableau: null },
      { q: "Une parabole f(x)=x²−4x+3 a un minimum. En quelle abscisse ?", opts: ["x=2", "x=3", "x=1", "x=4"], answer: 0, explication: "Sommet en x=−b/(2a)=4/2=2. f(2)=4−8+3=−1 (minimum).", tableau: null },
      { q: "Deux forfaits téléphoniques :", tableau: { headers: ["Go (x)", "0", "50", "100", "200", "500"], rows: [["Forfait A (€)", "200", "350", "500", "800", "1700"], ["Forfait B (€)", "0", "250", "500", "1000", "2500"]] }, opts: ["Ils coûtent pareil pour 100 Go", "A est toujours moins cher", "B est toujours moins cher", "Jamais égaux"], answer: 0, explication: "A : f(x)=3x+200. B : g(x)=5x. 3x+200=5x → x=100 Go." },
      { q: "Les racines de f(x)=2x²+4x−6 sont :", opts: ["x=1 ou x=−3", "x=−1 ou x=3", "x=2 ou x=−3", "x=1 ou x=3"], answer: 0, explication: "÷2 : x²+2x−3=0. (x+3)(x−1)=0 → x=−3 ou x=1.", tableau: null },
      { q: "g(x)=f(f(x)) avec f(x)=3x+2. Quelle est l'expression de g(x) ?", opts: ["9x+8", "6x+4", "9x+2", "3x+8"], answer: 0, explication: "f(f(x))=f(3x+2)=3(3x+2)+2=9x+6+2=9x+8.", tableau: null },
      { q: "Pour quelles valeurs de x la parabole f(x)=x²−2x−3 est-elle sous l'axe des x ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "(x+1)(x−3)=0 → racines x=−1 et x=3. Parabole (a>0) sous l'axe entre les racines : −1≤x≤3.", tableau: null },
      { q: "La fonction f(x)=(x−3)²+2 représente la hauteur d'un objet. Quelle est la hauteur minimale ?", opts: ["2m", "3m", "5m", "0m"], answer: 0, explication: "(x−3)²≥0 toujours. Minimum en x=3 : f(3)=0+2=2m.", tableau: null },
      { q: "Une droite y=3x+2 et une parabole y=x² se croisent en combien de points ?", opts: ["0", "1", "2", "3"], answer: 2, explication: "x²=3x+2 → x²−3x−2=0. Δ=9+8=17>0 → 2 solutions → 2 points d'intersection.", tableau: null },
      { q: "La parabole f(x)=2x²−8x+6 a son sommet en :", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "x=−b/(2a)=8/4=2. f(2)=8−16+6=−2 (minimum).", tableau: null },
      { q: "Pour quelles valeurs de x est-ce que f(x)=x²−2x−3≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "Racines : x=−1 et x=3. Parabole orientée vers le haut → f(x)≤0 entre les racines : −1≤x≤3.", tableau: null }
    ]
  },
  "Mélange de tous les thèmes": {
    "facile": [
      { q: "Un immeuble a 2³ étages avec 3² appartements par étage. Combien y a-t-il d'appartements ?", opts: ["13", "17", "15", "72"], answer: 3, explication: "2³=8 étages. 3²=9 appartements. Total=8×9=72 appartements.", tableau: null },
      { q: "Un charpentier a un triangle avec deux côtés de 6cm et 8cm formant un angle droit. Quelle est l'hypoténuse ?", opts: ["10cm", "12cm", "14cm", "7cm"], answer: 0, explication: "Pythagore : c²=6²+8²=36+64=100 → c=10cm.", tableau: null },
      { q: "Emma pense à un nombre. Elle le multiplie par 3 et ajoute 6. Elle obtient 15. Quel est ce nombre ?", opts: ["x=2", "x=3", "x=4", "x=7"], answer: 1, explication: "3x+6=15 → 3x=9 → x=3.", tableau: null },
      { q: "Cinq amis ont 5€, 10€, 15€ et 20€. Quelle est leur moyenne ?", opts: ["10€", "12€", "12,5€", "15€"], answer: 2, explication: "Somme=5+10+15+20=50. Moyenne=50÷4=12,5€.", tableau: null },
      { q: "Un taxi facture f(x)=3x−2€ pour x km. Quel est le prix pour 3km ?", opts: ["5€", "7€", "9€", "11€"], answer: 1, explication: "f(3)=3×3−2=9−2=7€.", tableau: null },
      { q: "Parmi 15, 21, 17 et 25, lequel est premier ?", opts: ["15", "21", "17", "25"], answer: 2, explication: "17 n'est divisible que par 1 et 17 → nombre premier.", tableau: null },
      { q: "Lucas lance un dé. Quelle est la probabilité d'avoir un nombre pair ?", opts: ["1/3", "1/2", "2/3", "1/6"], answer: 1, explication: "Nombres pairs : 2, 4, 6 → 3 cas. P(pair)=3/6=1/2.", tableau: null },
      { q: "Développe 4(2x−3).", opts: ["8x−3", "8x−12", "6x−12", "8x+12"], answer: 1, explication: "4×2x=8x. 4×(−3)=−12. Résultat : 8x−12.", tableau: null },
      { q: "Un carré de côté 7cm. Quel est son périmètre ?", opts: ["14cm", "21cm", "28cm", "49cm"], answer: 2, explication: "Périmètre=4×côté=4×7=28cm.", tableau: null },
      { q: "Simplifie la fraction 15/25.", opts: ["3/5", "5/3", "1/5", "3/4"], answer: 0, explication: "PGCD(15,25)=5. 15÷5=3 et 25÷5=5. Fraction : 3/5.", tableau: null }
    ],
    "moyen": [
      { q: "Résous par produit nul : (x−2)(x+5)=0.", opts: ["x=2 ou x=−5", "x=−2 ou x=5", "x=2 ou x=5", "x=−2 ou x=−5"], answer: 0, explication: "x−2=0 → x=2. x+5=0 → x=−5.", tableau: null },
      { q: "Dans un triangle ABC, DE∥BC avec AD=4cm, AB=10cm et DE=6cm. Quelle est BC ?", opts: ["12cm", "15cm", "24cm", "8cm"], answer: 1, explication: "Thalès : AD/AB=DE/BC → 4/10=6/BC → BC=15cm.", tableau: null },
      { q: "Tom a eu 14/20 (coeff 3) et 8/20 (coeff 1). Quelle est sa moyenne pondérée ?", opts: ["11", "12,5", "12", "13"], answer: 1, explication: "(14×3+8×1)÷(3+1)=(42+8)÷4=50÷4=12,5.", tableau: null },
      { q: "La hauteur d'un objet suit f(x)=x²+2x−3. Quelle est la hauteur pour x=2 ?", opts: ["3m", "5m", "7m", "9m"], answer: 1, explication: "f(2)=4+4−3=5m.", tableau: null },
      { q: "Un réservoir cylindrique : rayon 2m, hauteur 5m. Quel est son volume ? (π≈3,14)", opts: ["62,8m³", "31,4m³", "20m³", "125,6m³"], answer: 0, explication: "V=π×r²×h=3,14×4×5=62,8m³.", tableau: null },
      { q: "PGCD de 48 et 36 ?", opts: ["6", "12", "18", "24"], answer: 1, explication: "48=2⁴×3 et 36=2²×3². PGCD=2²×3=12.", tableau: null },
      { q: "P(pluie)=0,4 et P(vent)=0,3, indépendants. P(pluie ET vent) ?", opts: ["0,7", "0,1", "0,12", "0,012"], answer: 2, explication: "P(A et B)=P(A)×P(B)=0,4×0,3=0,12.", tableau: null },
      { q: "Deux amis ont x+y=10€ et 2x−y=5€. Combien a chacun ?", opts: ["x=5€, y=5€", "x=4€, y=6€", "x=6€, y=4€", "x=3€, y=7€"], answer: 0, explication: "Addition : 3x=15 → x=5. y=10−5=5.", tableau: null },
      { q: "Les âges triés : 3, 7, 9, 11, 15, 19 ans. Quelle est la médiane ?", opts: ["9 ans", "10 ans", "11 ans", "9,5 ans"], answer: 1, explication: "6 valeurs → médiane=(3ème+4ème)/2=(9+11)/2=10 ans.", tableau: null },
      { q: "Une droite passe par (0,3) et (2,7). Quelle est son équation ?", opts: ["y=3x+2", "y=2x+3", "y=x+3", "y=4x−1"], answer: 1, explication: "b=3. a=(7−3)/2=2. Équation : y=2x+3.", tableau: null }
    ],
    "difficile": [
      { q: "Résous x²−9x+20=0.", opts: ["x=4 ou x=5", "x=−4 ou x=−5", "x=4 ou x=−5", "x=2 ou x=10"], answer: 0, explication: "Produit 20, somme 9 : 4 et 5. (x−4)(x−5)=0.", tableau: null },
      { q: "La parabole f(x)=2x²−8x+6 a son minimum en :", opts: ["x=1", "x=2", "x=3", "x=4"], answer: 1, explication: "x=−b/(2a)=8/4=2.", tableau: null },
      { q: "Emma lance 3 fois une pièce. P(au moins 1 pile) ?", opts: ["7/8", "1/8", "3/8", "1/2"], answer: 0, explication: "P(0 pile)=(1/2)³=1/8. P(au moins 1 pile)=1−1/8=7/8.", tableau: null },
      { q: "Simplifie (x²−4x+4)/(x−2) avec x≠2.", opts: ["x−2", "x+2", "x²−2", "2"], answer: 0, explication: "Numérateur=(x−2)². (x−2)²/(x−2)=x−2.", tableau: null },
      { q: "Volume d'une sphère de rayon 3cm ? (π≈3,14)", opts: ["113,04cm³", "56,52cm³", "28,26cm³", "339,12cm³"], answer: 0, explication: "V=(4/3)×π×r³=(4/3)×3,14×27=113,04cm³.", tableau: null },
      { q: "PGCD(84,56) par algorithme d'Euclide ?", opts: ["7", "14", "21", "28"], answer: 3, explication: "84=56×1+28. 56=28×2+0. PGCD=28.", tableau: null },
      { q: "Résous 2x²+x−6=0.", opts: ["x=3/2 ou x=−2", "x=−3/2 ou x=2", "x=3 ou x=−2", "x=2 ou x=3"], answer: 0, explication: "(2x−3)(x+2)=0 → x=3/2 ou x=−2.", tableau: null },
      { q: "Pour quels x est-ce que f(x)=x²−2x−3≤0 ?", opts: ["−1≤x≤3", "x≤−1 ou x≥3", "−3≤x≤1", "x≤−3 ou x≥1"], answer: 0, explication: "Racines x=−1 et x=3. Parabole sous l'axe entre les racines.", tableau: null },
      { q: "P(A∪B) avec P(A)=0,4, P(B)=0,5, P(A∩B)=0,2 ?", opts: ["0,7", "0,9", "0,5", "0,3"], answer: 0, explication: "P(A∪B)=0,4+0,5−0,2=0,7.", tableau: null },
      { q: "Taux de variation de f(x)=x² entre x=2 et x=5 ?", opts: ["7", "9", "21", "3"], answer: 0, explication: "(f(5)−f(2))/(5−2)=(25−4)/3=21/3=7.", tableau: null }
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
      'Géométrie': 'théorème de Pythagore et sa réciproque, théorème de Thalès et sa réciproque, trigonométrie (sin/cos/tan), angles (alternes-internes, correspondants), triangles (isocèle, équilatéral, rectangle), cercles, transformations (symétrie, rotation, translation, homothétie), aires et volumes (cylindre, cône, sphère, pyramide)',
      'Algèbre et équations': 'équations du premier degré, systèmes d\'équations à deux inconnues, inéquations, identités remarquables (a+b)²/(a−b)²/(a+b)(a−b), équations du second degré par produit nul, développement et factorisation',
      'Statistiques et probabilités': 'moyenne arithmétique et pondérée, médiane, étendue, mode, fréquence relative, probabilité d\'un événement simple, événements indépendants, probabilité conditionnelle, tableaux de données, diagrammes',
      'Fonctions': 'fonctions linéaires et affines (coefficient directeur, ordonnée à l\'origine), tableau de valeurs, représentation graphique, lecture graphique, taux de variation, fonctions croissantes/décroissantes, fonctions du second degré (parabole, racines, extremum), intersection de courbes',
      'Mélange de tous les thèmes': 'puissances, Pythagore, Thalès, trigonométrie, équations et systèmes, probabilités, fonctions affines et second degré, statistiques, PGCD/PPCM, nombres premiers, factorisation'
    }

    const niveaux = {
      'facile': 'de niveau 3ème début année, questions directes avec des situations concrètes du quotidien',
      'moyen': 'de niveau examen Brevet DNB, avec des situations réalistes et des calculs intermédiaires',
      'difficile': 'de niveau Brevet mention Très Bien, questions complexes avec plusieurs étapes de raisonnement'
    }

    const prompt1 = `Tu es un professeur de mathématiques expert et pédagogue au Brevet des collèges français.
Génère exactement 5 questions QCM ${niveaux[difficulte] || 'de niveau moyen'} sur le thème "${theme}".
Les notions à couvrir : ${contexte[theme] || theme}.

RÈGLE CRITIQUE SUR LE CONTEXTE :
Chaque question doit être ancrée dans une situation concrète et réaliste du quotidien.
Au lieu de "Calcule 2x+3=11", écris "Emma pense à un nombre, elle le multiplie par 2 et ajoute 3, elle obtient 11."
Au lieu de "P(A∪B) avec P(A)=0,4", écris "Dans une classe, 40% font du sport et 50% font de la musique, 20% font les deux."
Au lieu de "Urne : 5 rouges, 3 bleues", écris "Un sac contient 5 billes rouges et 3 bleues. On tire une bille, on la garde..."
Les contextes possibles : recettes de cuisine, sports, météo, voyages, argent de poche, animaux, constructions, jeux...

RÈGLE CRITIQUE SUR LES EXPLICATIONS :
Chaque explication doit être claire et détaillée, comme si un professeur expliquait à un élève de 3ème en difficulté.
- Énoncer la règle ou formule utilisée
- Détailler tous les calculs intermédiaires étape par étape
- Conclure avec la réponse finale
Exemple INTERDIT : "3x=9, x=3."
Exemple CORRECT : "On isole x. On soustrait 6 des deux membres : 3x+6−6=15−6, soit 3x=9. On divise par 3 : x=9÷3=3. La réponse est x=3."

RÈGLES TECHNIQUES :
1. Pour stats/fonctions avec des données : crée un objet "tableau" structuré.
2. Si pas de tableau : écris "tableau": null.
3. Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.

Format :
[{"q":"situation concrète","tableau":null,"opts":["opt0","opt1","opt2","opt3"],"bonne_reponse":"opt_correct","explication":"explication détaillée étape par étape"}]`

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

