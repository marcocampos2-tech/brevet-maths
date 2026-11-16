// /lib/figure-grille.manual-test.js
//
// Test manuel (`node lib/figure-grille.manual-test.js`) après toute modification
// de js/figure-grille.js, de css/figure-grille.css ou de leurs points d'appel.
// Aucune dépendance, aucun réseau.
//
// 1. Géométrie : sens des rotations (horaire / antihoraire), symétries (axes
//    horizontal, vertical, diagonaux, demi-entier), homothétie, translation.
// 2. Validation : limites (12 colonnes, 10 lignes, 12 formes, 8 points, 2 droites),
//    sommets hors quadrillage ou non entiers, images hors nœuds, noms invalides ou
//    en double, transformations incomplètes → figure vide + erreur lisible.
// 3. Rendu : structure du SVG, couleurs, droite coupée aux bords, étiquettes.
// 4. Unicité (contrôle du Bloc A) : sur les scènes de la maquette validée le
//    16/11/2026, un seul type de transformation convient ; une forme qui a elle-même
//    une symétrie (triangle isocèle) est signalée comme ambiguë.
// 5. Largeur : lisible à 300 px (case d'au moins 22 px).
// 6. Câblage : chaque page charge le script et la feuille, et sa fonction de figure
//    traite le type « grille » AVANT les types historiques (un oubli ne se verrait
//    qu'en production, par une figure absente, sans aucune erreur).
const fs = require('fs')
const path = require('path')
const FG = require('../js/figure-grille.js')

let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + JSON.stringify(detail) : '')) }
  else console.log('ok     ' + nom)
}
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
const compte = (h, motif) => (h.match(motif) || []).length
const egal = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9
const memeSet = (A, B) => {
  const cle = p => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000)
  const sa = new Set(A.map(cle)), sb = new Set(B.map(cle))
  return sa.size === sb.size && [...sa].every(k => sb.has(k))
}

// ── Scènes de la maquette du 16/11/2026 ────────────────────────────────
// Scène « reconnaître » : triangle SANS symétrie propre (côtés 2 et 3), rotation de 90°.
const sceneRotation = {
  type: 'grille', cols: 10, lignes: 8,
  formes: [
    { nom: '1', couleur: 'bleu', pts: [[1, 5], [3, 5], [1, 8]] },
    { nom: '2', couleur: 'vert', image: { de: '1', transformation: 'rotation', centre: [5, 4], angle: 90, sens: 'antihoraire' } }
  ]
}
// Scène « homothétie » : carré A, carré B deux fois plus grand de l'autre côté de O.
const sceneHomothetie = {
  type: 'grille', cols: 10, lignes: 6,
  formes: [
    { nom: 'A', couleur: 'bleu', pts: [[6, 3], [7, 3], [7, 4], [6, 4]] },
    { nom: 'B', couleur: 'vert', image: { de: 'A', transformation: 'homothetie', centre: [5, 3], rapport: -2 } }
  ],
  points: [{ nom: 'O', pos: [5, 3] }]
}
// Scène « candidates » : image de F par la symétrie d'axe d parmi quatre candidates neutres.
const AXE_D = { a: [6, 0], b: [6, 8] }
const sceneCandidates = {
  type: 'grille', cols: 12, lignes: 8,
  droites: [{ nom: 'd', a: AXE_D.a, b: AXE_D.b }],
  formes: [
    { nom: 'F', couleur: 'bleu', pts: [[1, 5], [3, 5], [1, 8]], etiquette: false },
    { nom: '1', couleur: 'neutre', image: { de: 'F', transformation: 'symetrie_axiale', axe: AXE_D } },
    { nom: '2', couleur: 'neutre', image: { de: 'F', transformation: 'translation', vecteur: [6, -5] } },
    { nom: '3', couleur: 'neutre', image: { de: 'F', transformation: 'symetrie_axiale', axe: { a: [0, 4], b: [12, 4] } } },
    { nom: '4', couleur: 'neutre', image: { de: 'F', transformation: 'symetrie_centrale', centre: [6.5, 4] } }
  ]
}
// Motif de 12 formes : le plafond de lisibilité (douze carrés numérotés).
const sceneMotif = {
  type: 'grille', cols: 12, lignes: 8,
  formes: Array.from({ length: 12 }, (_, i) => ({
    nom: String(i + 1), couleur: i === 0 ? 'bleu' : (i % 2 ? 'neutre' : 'gris'),
    pts: [[i, 3], [i + 1, 3], [i + 1, 4], [i, 4]]
  }))
}

console.log('\n[1] géométrie')
const T = (t, p) => FG.appliquer(t, p)
const rot = (angle, sens) => ({ transformation: 'rotation', centre: [0, 0], angle, sens })
verifie('rotation 90° antihoraire : (1,0) → (0,1)', egal(T(rot(90, 'antihoraire'), [1, 0]), [0, 1]))
verifie('rotation 90° horaire : (1,0) → (0,−1)', egal(T(rot(90, 'horaire'), [1, 0]), [0, -1]))
verifie('rotation 270° antihoraire = 90° horaire', egal(T(rot(270, 'antihoraire'), [2, 1]), T(rot(90, 'horaire'), [2, 1])))
verifie('rotation 270° horaire = 90° antihoraire', egal(T(rot(270, 'horaire'), [2, 1]), T(rot(90, 'antihoraire'), [2, 1])))
verifie('rotation 180° dans les deux sens', egal(T(rot(180, 'horaire'), [3, 2]), [-3, -2]) && egal(T(rot(180, 'antihoraire'), [3, 2]), [-3, -2]))
verifie('rotation autour d\'un centre quelconque', egal(T({ transformation: 'rotation', centre: [5, 4], angle: 90, sens: 'antihoraire' }, [1, 5]), [4, 0]))
verifie('symétrie centrale', egal(T({ transformation: 'symetrie_centrale', centre: [6.5, 4] }, [1, 5]), [12, 3]))
verifie('translation', egal(T({ transformation: 'translation', vecteur: [6, -5] }, [1, 5]), [7, 0]))
verifie('homothétie de rapport négatif', egal(T({ transformation: 'homothetie', centre: [5, 3], rapport: -2 }, [6, 4]), [3, 1]))
verifie('homothétie de rapport 1,5', egal(T({ transformation: 'homothetie', centre: [0, 0], rapport: 1.5 }, [2, 4]), [3, 6]))
verifie('symétrie axiale verticale', egal(T({ transformation: 'symetrie_axiale', axe: AXE_D }, [1, 5]), [11, 5]))
verifie('symétrie axiale horizontale', egal(T({ transformation: 'symetrie_axiale', axe: { a: [0, 4], b: [12, 4] } }, [1, 5]), [1, 3]))
verifie('symétrie axiale diagonale y = x', egal(T({ transformation: 'symetrie_axiale', axe: { a: [0, 0], b: [1, 1] } }, [2, 5]), [5, 2]))
verifie('symétrie axiale diagonale x + y = 3', egal(T({ transformation: 'symetrie_axiale', axe: { a: [0, 3], b: [3, 0] } }, [1, 1]), [2, 2]))
verifie('symétrie axiale d\'axe demi-entier x = 5,5', egal(T({ transformation: 'symetrie_axiale', axe: { a: [5.5, 0], b: [5.5, 1] } }, [3, 2]), [8, 2]))

console.log('\n[2] validation')
for (const [nom, s] of [['rotation', sceneRotation], ['homothétie', sceneHomothetie], ['candidates', sceneCandidates], ['motif de 12 formes', sceneMotif]]) {
  verifie('scène « ' + nom + ' » valide', FG.valider(s).ok, FG.erreurs(s))
}
verifie('figure donnée en chaîne JSON', FG.valider(JSON.stringify(sceneRotation)).ok)
verifie('estGrille', FG.estGrille(sceneRotation) && FG.estGrille(JSON.stringify(sceneRotation)) && !FG.estGrille({ type: 'script' }) && !FG.estGrille(null))
verifie('chaîne JSON invalide : figure vide', FG.html('{pas du json') === '' && !FG.valider('{pas du json').ok)
verifie('type autre que grille refusé', !FG.valider({ type: 'cercle', rayon: 3 }).ok)
const avec = modif => { const c = JSON.parse(JSON.stringify(sceneCandidates)); modif(c); return c }
const refuse = (nom, fig, motif) => {
  const e = FG.erreurs(fig).join(' | ')
  verifie(nom, !FG.valider(fig).ok && FG.html(fig) === '' && (!motif || motif.test(e)), e)
}
refuse('13 colonnes', avec(c => { c.cols = 13 }), /cols/)
refuse('11 lignes', avec(c => { c.lignes = 11 }), /lignes/)
refuse('colonnes non entières', avec(c => { c.cols = 6.5 }), /cols/)
refuse('13 formes', avec(c => { c.formes = Array.from({ length: 13 }, (_, i) => ({ nom: String(i), pts: [[0, 0], [1, 0], [0, 1]] })) }), /plus de 12 formes/)
refuse('formes absentes', avec(c => { delete c.formes }), /formes/)
refuse('9 points', avec(c => { c.points = Array.from({ length: 9 }, (_, i) => ({ nom: 'P' + i, pos: [i, 0] })) }), /points/)
refuse('3 droites', avec(c => { c.droites = [0, 1, 2].map(i => ({ a: [i, 0], b: [i, 8] })) }), /droites/)
refuse('sommet hors du quadrillage', avec(c => { c.formes[0].pts = [[1, 5], [3, 5], [1, 9]] }), /hors du quadrillage/)
refuse('sommet non entier', avec(c => { c.formes[0].pts = [[1, 5], [3.5, 5], [1, 8]] }), /entiers/)
refuse('moins de 3 sommets', avec(c => { c.formes[0].pts = [[1, 5], [3, 5]] }), /sommets/)
refuse('sommets alignés (aire nulle)', avec(c => { c.formes[0].pts = [[1, 5], [2, 5], [3, 5]] }), /aire nulle/)
refuse('sommets confondus', avec(c => { c.formes[0].pts = [[1, 5], [1, 5], [3, 5], [1, 8]] }), /confondus/)
refuse('pts ET image', avec(c => { c.formes[1].pts = [[1, 1], [2, 1], [1, 2]] }), /pts|image/)
refuse('ni pts ni image', avec(c => { delete c.formes[1].image }), /pts|image/)
refuse('image d\'une forme inconnue', avec(c => { c.formes[1].image.de = 'Z' }), /déjà déclarée/)
refuse('image d\'une forme déclarée PLUS TARD', avec(c => { c.formes.unshift(c.formes.pop()) }), /déjà déclarée/)
refuse('transformation inconnue', avec(c => { c.formes[1].image.transformation = 'glissement' }), /inconnue/)
refuse('rotation d\'angle 45°', avec(c => { c.formes[1].image = { de: 'F', transformation: 'rotation', centre: [6, 4], angle: 45, sens: 'horaire' } }), /angle/)
refuse('rotation sans sens', avec(c => { c.formes[1].image = { de: 'F', transformation: 'rotation', centre: [6, 4], angle: 90 } }), /sens/)
refuse('axe oblique', avec(c => { c.formes[1].image.axe = { a: [0, 0], b: [2, 1] } }), /horizontal, vertical ou diagonal/)
refuse('axe réduit à un point', avec(c => { c.formes[1].image.axe = { a: [3, 3], b: [3, 3] } }), /horizontal, vertical ou diagonal/)
refuse('homothétie de rapport 1', avec(c => { c.formes[1].image = { de: 'F', transformation: 'homothetie', centre: [6, 4], rapport: 1 } }), /rapport/)
refuse('homothétie de rapport −1', avec(c => { c.formes[1].image = { de: 'F', transformation: 'homothetie', centre: [6, 4], rapport: -1 } }), /rapport/)
refuse('homothétie de rapport 0', avec(c => { c.formes[1].image = { de: 'F', transformation: 'homothetie', centre: [6, 4], rapport: 0 } }), /rapport/)
refuse('homothétie de rapport 5', avec(c => { c.formes[1].image = { de: 'F', transformation: 'homothetie', centre: [6, 4], rapport: 5 } }), /rapport/)
refuse('homothétie de rapport 1/3', avec(c => { c.formes[1].image = { de: 'F', transformation: 'homothetie', centre: [6, 4], rapport: 1 / 3 } }), /rapport/)
refuse('image hors du quadrillage', avec(c => { c.formes[1].image = { de: 'F', transformation: 'translation', vecteur: [20, 0] } }), /nœud|quadrillage/)
refuse('image hors des nœuds (homothétie ½ sur sommets impairs)', avec(c => { c.formes[1].image = { de: 'F', transformation: 'homothetie', centre: [0, 0], rapport: 0.5 } }), /nœud/)
refuse('nom de forme avec balise', avec(c => { c.formes[0].nom = '<b>' }), /nom/)
refuse('nom de forme de 3 signes', avec(c => { c.formes[0].nom = 'ABC' }), /nom/)
refuse('forme déclarée deux fois', avec(c => { c.formes[2].nom = '1' }), /déjà déclarée/)
refuse('couleur inconnue', avec(c => { c.formes[0].couleur = 'rouge' }), /couleur/)
refuse('sommets nommés en double', avec(c => { c.formes[0].sommets = ['A', 'A', 'B'] }), /déjà utilisé/)
refuse('sommets : mauvais nombre', avec(c => { c.formes[0].sommets = ['A', 'B'] }), /sommets/)
refuse('point sur un demi-nœud', avec(c => { c.points = [{ nom: 'O', pos: [1.5, 2] }] }), /nœud/)
refuse('point nommé comme une droite', avec(c => { c.points = [{ nom: 'd', pos: [1, 2] }] }), /déjà utilisé/)
refuse('position d\'étiquette inconnue', avec(c => { c.points = [{ nom: 'O', pos: [1, 2], lab: 'dessous' }] }), /lab/)
refuse('style de droite inconnu', avec(c => { c.droites[0].style = 'gras' }), /style/)
refuse('droite oblique', avec(c => { c.droites[0] = { a: [0, 0], b: [3, 1] } }), /horizontale, verticale ou diagonale/)
verifie('l\'image est calculée, pas saisie', JSON.stringify(FG.analyser(sceneRotation).formes[1].pts) === JSON.stringify([[4, 0], [4, 2], [1, 0]]), FG.analyser(sceneRotation).formes[1].pts)

console.log('\n[3] rendu')
const h = FG.html(sceneCandidates)
verifie('un <svg> avec role="img"', /^<svg [^>]*role="img"/.test(h) && compte(h, /<svg /g) === 1 && h.endsWith('</svg>'))
verifie('5 polygones (F + 4 candidates)', compte(h, /<polygon /g) === 5, compte(h, /<polygon /g))
verifie('F en bleu, candidates en neutre (aucune couleur ne désigne la réponse)', compte(h, /fg-forme fg-bleu/g) === 1 && compte(h, /fg-forme fg-neutre/g) === 4)
verifie('quadrillage : un seul tracé', compte(h, /class="fg-grille"/g) === 1)
verifie('droite d en pointillés, coupée aux bords (x = 152, de y = 16 à y = 208)', /class="fg-droite fg-pointille" x1="152" y1="(16|208)" x2="152" y2="(208|16)"/.test(h), h.match(/<line[^>]*>/))
verifie('nom de la droite écrit', /class="fg-nom-droite"[^>]*>d<\/text>/.test(h))
verifie('F sans étiquette de forme, candidates numérotées 1 à 4', compte(h, /class="fg-nom"/g) === 4 && ['1', '2', '3', '4'].every(n => h.includes('>' + n + '</text>')))
const hHomo = FG.html(sceneHomothetie)
verifie('point O dessiné et nommé', compte(hHomo, /class="fg-point"/g) === 1 && />O<\/text>/.test(hHomo))
const hSommets = FG.html(avec(c => { c.formes[0].sommets = ["A", "B", "C"]; c.formes[1].sommets = ["A'", "B'", "C'"] }))
verifie('sommets nommés écrits à l\'extérieur (A, B, C et A\', B\', C\')', ['A', 'B', 'C', "A'", "B'", "C'"].every(n => hSommets.includes('>' + n + '</text>')))
verifie('droite horizontale : étiquette alignée à droite', /text-anchor="end"/.test(FG.html(avec(c => { c.droites = [{ nom: 'e', a: [0, 4], b: [12, 4] }] }))))
verifie('droite diagonale coupée aux bords', /<line[^>]*class="fg-droite/.test(FG.html(avec(c => { c.droites = [{ a: [0, 0], b: [4, 4] }] }))) || /class="fg-droite[^"]*"/.test(FG.html(avec(c => { c.droites = [{ a: [0, 0], b: [4, 4] }] }))))
verifie('figure mal formée : aucun SVG (jamais une figure tronquée)', FG.html(avec(c => { c.formes[1].image.de = 'Z' })) === '')
verifie('les 12 formes du motif sont dessinées', compte(FG.html(sceneMotif), /<polygon /g) === 12 && compte(FG.html(sceneMotif), /class="fg-nom"/g) === 12)

console.log('\n[4] unicité du type de transformation')
const pts = (s, nom) => FG.analyser(s).formes.find(f => f.nom === nom).pts
const types = (s, a, b) => FG.typesCompatibles(pts(s, a), pts(s, b), s.cols, s.lignes)
verifie('rotation de 90° (forme sans symétrie) : un seul type', JSON.stringify(types(sceneRotation, '1', '2')) === '["rotation"]', types(sceneRotation, '1', '2'))
verifie('homothétie k = −2 : un seul type', JSON.stringify(types(sceneHomothetie, 'A', 'B')) === '["homothetie"]', types(sceneHomothetie, 'A', 'B'))
{
  const A = pts(sceneHomothetie, 'A'), B = pts(sceneHomothetie, 'B')
  const rapports = [-4, -3, -2, -1.5, -0.5, 0.5, 1.5, 2, 3, 4].filter(k => memeSet(A.map(p => T({ transformation: 'homothetie', centre: [5, 3], rapport: k }, p)), B))
  verifie('centre O imposé : un seul rapport possible (−2)', JSON.stringify(rapports) === '[-2]', rapports)
}
verifie('candidate 1 : symétrie axiale', JSON.stringify(types(sceneCandidates, 'F', '1')) === '["symetrie_axiale"]', types(sceneCandidates, 'F', '1'))
verifie('candidate 2 : translation', JSON.stringify(types(sceneCandidates, 'F', '2')) === '["translation"]', types(sceneCandidates, 'F', '2'))
verifie('candidate 3 : symétrie axiale (autre axe)', JSON.stringify(types(sceneCandidates, 'F', '3')) === '["symetrie_axiale"]', types(sceneCandidates, 'F', '3'))
verifie('candidate 4 : rotation ET symétrie centrale (180°)', JSON.stringify(types(sceneCandidates, 'F', '4')) === '["rotation","symetrie_centrale"]', types(sceneCandidates, 'F', '4'))
{
  const F = pts(sceneCandidates, 'F')
  const image = F.map(p => T({ transformation: 'symetrie_axiale', axe: AXE_D }, p))
  const egales = ['1', '2', '3', '4'].filter(n => memeSet(pts(sceneCandidates, n), image))
  verifie('une seule candidate est l\'image de F par la symétrie d\'axe d', JSON.stringify(egales) === '["1"]', egales)
}
{
  // Piège documenté : un triangle isocèle est envoyé sur son image par plusieurs types à la fois.
  const iso = { type: 'grille', cols: 6, lignes: 6, formes: [
    { nom: 'A', pts: [[1, 1], [3, 1], [2, 3]] },
    { nom: 'B', image: { de: 'A', transformation: 'symetrie_axiale', axe: { a: [0, 3], b: [6, 3] } } }
  ] }
  const t = types(iso, 'A', 'B')
  verifie('triangle isocèle : AMBIGU (plusieurs types) et le contrôle le signale', t.length > 1 && t.includes('symetrie_axiale') && t.includes('rotation'), t)
  const sceneIso = { type: 'grille', cols: 10, lignes: 6, formes: [
    { nom: '1', pts: [[2, 4], [4, 4], [2, 6]] },
    { nom: '2', image: { de: '1', transformation: 'rotation', centre: [5, 3], angle: 90, sens: 'antihoraire' } }
  ] }
  verifie('triangle rectangle isocèle de la première maquette : une seule transformation compatible (la position lève l\'ambiguïté)', JSON.stringify(types(sceneIso, '1', '2')) === '["rotation"]', types(sceneIso, '1', '2'))
}
verifie('formes de tailles différentes : aucune isométrie compatible', !FG.typesCompatibles([[0, 0], [1, 0], [0, 1]], [[0, 0], [2, 0], [0, 2]], 6, 6).some(t => t !== 'homothetie'))

console.log('\n[5] largeur')
{
  const W = FG.constantes.MARGE.g + FG.constantes.MARGE.d + FG.constantes.CELLULE * 12
  const svgW = parseInt((h.match(/width="(\d+)"/) || [])[1], 10)
  verifie('12 colonnes : 304 px au plus', svgW === W && W <= 310, [svgW, W])
  verifie('case de 22 px au moins à 300 px de large', FG.constantes.CELLULE * 300 / W >= 22, FG.constantes.CELLULE * 300 / W)
  verifie('case de 20 px au moins à 280 px de large', FG.constantes.CELLULE * 280 / W >= 20, FG.constantes.CELLULE * 280 / W)
}

console.log('\n[6] câblage')
const css = lire('css/figure-grille.css')
verifie('la feuille écrase le plafond « .q-figure svg » des pages', /\.q-figure \.fg-fig\s*\{[^}]*max-width:\s*none/.test(css))
verifie('la feuille définit les quatre couleurs de forme', ['bleu', 'vert', 'neutre', 'gris'].every(c => new RegExp('\\.fg-fig \\.fg-' + c + '\\s*\\{').test(css)))
for (const [page, motifBranche, motifHistorique] of [
  ['quiz.html', "f.type==='grille'", "f.type==='triangle_rect'&&f.base==='?'"],
  ['examen.html', "f.type === 'grille'", "f.type === 'triangle_rect' && f.base === '?'"],
  ['prof.html', "f.type === 'grille'", "f.type === 'triangle_rect' && f.base === '?'"]
]) {
  const src = lire(page)
  verifie(page + ' charge js/figure-grille.js', /<script src="\/js\/figure-grille\.js\?v=\d+"><\/script>/.test(src))
  verifie(page + ' charge css/figure-grille.css', /<link rel="stylesheet" href="\/css\/figure-grille\.css\?v=\d+">/.test(src))
  const i = src.indexOf(motifBranche), j = src.indexOf(motifHistorique)
  verifie(page + ' traite « grille » avant les types historiques', i > 0 && j > 0 && i < j, [i, j])
  verifie(page + ' : le script est chargé avant la première utilisation', src.indexOf('figure-grille.js') < src.indexOf('FigureGrille.html'))
}
{
  const versions = ['quiz.html', 'examen.html', 'prof.html'].map(p => (lire(p).match(/figure-grille\.js\?v=(\d+)/) || [])[1])
  verifie('même version de script dans les trois pages', new Set(versions).size === 1, versions)
  const versionsCss = ['quiz.html', 'examen.html', 'prof.html'].map(p => (lire(p).match(/figure-grille\.css\?v=(\d+)/) || [])[1])
  verifie('même version de feuille dans les trois pages', new Set(versionsCss).size === 1, versionsCss)
}
verifie('prof.html : badge « Grille » et message d\'erreur lisible', /🔲 Grille/.test(lire('prof.html')) && /Grille invalide/.test(lire('prof.html')))
verifie('aucune figure grille n\'est lue par les API (le jsonb passe tel quel)', !/figure-grille|FigureGrille/.test(lire('api/generer.js') + lire('api/examen.js')))

console.log(echecs ? '\n' + echecs + ' échec(s)' : '\nTout est ok')
process.exit(echecs ? 1 : 0)
