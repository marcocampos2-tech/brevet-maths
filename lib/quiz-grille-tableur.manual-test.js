// /lib/quiz-grille-tableur.manual-test.js
//
// Test manuel (`node lib/quiz-grille-tableur.manual-test.js`) après toute modification de `estGrilleTableur`,
// `renderGrilleTableur`, `renderVisuel` ou `renderGraphique` (quiz.html), ou de leurs copies dans prof.html.
// Même montage que lib/quiz-graphique.manual-test.js : les fonctions sont extraites des fichiers du dépôt à chaque
// exécution et évaluées via `new Function` — le test porte sur le code réel. Aucune dépendance, aucun réseau.
const fs = require('fs')
const path = require('path')
const Exposants = require('../js/exposants.js')

function extraireFonction(src, nom) {
  const debut = src.indexOf(`function ${nom}(`)
  if (debut === -1) throw new Error(`fonction ${nom} introuvable`)
  let i = src.indexOf('{', debut), n = 0
  for (; i < src.length; i++) {
    if (src[i] === '{') n++
    else if (src[i] === '}' && --n === 0) return src.slice(debut, i + 1)
  }
  throw new Error(`accolades non refermées pour ${nom}`)
}

const NOMS = ['estGrilleTableur', 'renderGrilleTableur', 'estCaseATrouver', 'nombreTableau', 'detecterTypeGraphique', 'renderTableau', 'renderGraphique', 'renderVisuel']
const sources = {}
for (const f of ['quiz.html', 'prof.html']) sources[f] = fs.readFileSync(path.join(__dirname, '..', f), 'utf8')

function charger(fichier) {
  const src = sources[fichier]
  // prof.html : renderTableauHTML / renderGraphiqueProf sont les équivalents de renderTableau / renderGraphique.
  const noms = fichier === 'quiz.html' ? NOMS : ['estGrilleTableur', 'renderGrilleTableur', 'estCaseATrouver', 'nombreTableau', 'detecterTypeGraphique', 'renderTableauHTML', 'renderGraphiqueProf']
  const code = noms.map((n) => extraireFonction(src, n)).join('\n')
  const faux = { window: { matchMedia: () => ({ matches: false }) }, document: { getElementById: () => ({}) }, charts: {}, console: { warn() {}, log() {} }, setTimeout() {}, Chart: function () {} }
  const retour = fichier === 'quiz.html'
    ? '{ estGrilleTableur, renderGrilleTableur, renderTableau, renderGraphique, renderVisuel }'
    : '{ estGrilleTableur, renderGrilleTableur, renderTableau: renderTableauHTML, renderGraphique: renderGraphiqueProf }'
  return new Function('window', 'document', 'charts', 'console', 'setTimeout', 'Chart', 'Exposants', 'modeAffichage',
    `var PROF_CHARTS = {}\n${code}\nreturn ${retour}`)(faux.window, faux.document, faux.charts, faux.console, faux.setTimeout, faux.Chart, Exposants, {})
}

let ko = 0
const check = (nom, cond, info = '') => { console.log(`${cond ? '  ok  ' : ' ÉCHEC'} ${nom}${info ? ' — ' + info : ''}`); if (!cond) ko++ }

const grille = { headers: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], rows: [['1', '12', '15', '9', '14', '10', '11', '13'], ['2', '4', '8', '6', '5', '7', '9', '3']] }
const grilleAvecCible = { headers: ['', 'A', 'B', 'C'], rows: [['1', '12', '15', '9'], ['2', '4', '?', '6'], ['3', '1', '2', '?']] }
const ordinaire = { headers: ['Note', '8', '12', '15'], rows: [['Élèves', '3', '5', '2']] }
const effectifs = { headers: ['Note', '8', '12', '15'], rows: [['Effectif', '3', '5', '2']] }

for (const fichier of ['quiz.html', 'prof.html']) {
  console.log(`\n══ ${fichier} ══`)
  const m = charger(fichier)

  console.log('── Détection ──')
  check('grille A..G reconnue', m.estGrilleTableur(grille))
  check('grille donnée en chaîne JSON reconnue', m.estGrilleTableur(JSON.stringify(grille)))
  check('tableau ordinaire non reconnu', !m.estGrilleTableur(ordinaire))
  check('tableau d’effectifs non reconnu', !m.estGrilleTableur(effectifs))
  check('en-tête vide mais valeurs non-lettres : non reconnu', !m.estGrilleTableur({ headers: ['', '1', '2'], rows: [] }))
  check('lettre minuscule ou double : non reconnu', !m.estGrilleTableur({ headers: ['', 'a'], rows: [] }) && !m.estGrilleTableur({ headers: ['', 'AB'], rows: [] }))
  check('première cellule non vide : non reconnu', !m.estGrilleTableur({ headers: ['x', 'A', 'B'], rows: [] }))
  check('null / sans headers : non reconnu, sans erreur', !m.estGrilleTableur(null) && !m.estGrilleTableur({}) && !m.estGrilleTableur('pas du json'))

  console.log('── Grille normale ──')
  const h = m.renderGrilleTableur(grille)
  check('rendue en table q-grille', h.startsWith('<table class="q-grille">'))
  check('aucune barre de formule sans « ? »', !h.includes('q-fx'))
  check('aucune cellule à trouver sans « ? »', !h.includes('q-gr-cible') && !h.includes('q-gr-hl'))
  check('7 lettres A..G en en-tête', ['A', 'B', 'C', 'D', 'E', 'F', 'G'].every((l) => h.includes(`<th>${l}</th>`)))
  check('numéros de ligne en colonne grise fixe', h.includes('<th class="q-gr-num">1</th>') && h.includes('<th class="q-gr-num">2</th>'))
  check('données en <td>', (h.match(/<td/g) || []).length === 14)

  console.log('── Grille avec « ? » ──')
  const c = m.renderGrilleTableur(grilleAvecCible)
  check('barre de formule présente, avant la table', c.startsWith('<div class="q-fx">') && c.indexOf('q-fx') < c.indexOf('<table'))
  check('adresse de la PREMIÈRE cellule « ? » (B2)', c.includes('<span class="q-fx-adr">B2</span>'))
  check('« fx » puis champ vide', c.includes('<span class="q-fx-sym">fx</span><span class="q-fx-champ"></span>'))
  check('les deux « ? » sont marquées', (c.match(/class="q-gr-cible"/g) || []).length === 2)
  check('lettres B et C mises en évidence', c.includes('<th class="q-gr-hl">B</th>') && c.includes('<th class="q-gr-hl">C</th>') && !c.includes('<th class="q-gr-hl">A</th>'))
  check('numéros 2 et 3 mis en évidence, pas 1', c.includes('<th class="q-gr-num q-gr-hl">2</th>') && c.includes('<th class="q-gr-num q-gr-hl">3</th>') && !c.includes('<th class="q-gr-num q-gr-hl">1</th>'))
  check('« ? » avec espace insécable reconnu', m.renderGrilleTableur({ headers: ['', 'A'], rows: [['1', ' ? ']] }).includes('q-gr-cible'))

  console.log('── Priorité sur le graphique et les autres tableaux ──')
  check('renderGraphique(grille) → grille', m.renderGraphique(grille, 0).startsWith('<table class="q-grille">'))
  check('renderGraphique(grille « effectif » en cellule 1) → grille, jamais barres',
    m.renderGraphique({ headers: ['', 'A', 'B'], rows: [['Effectif', '3', '5']] }, 0).startsWith('<table class="q-grille">'))
  check('grille sans ligne (rows vide) → grille, pas de chaîne vide', m.renderGraphique({ headers: ['', 'A'], rows: [] }, 0).includes('q-grille'))
  check('tableau ordinaire inchangé', m.renderGraphique(ordinaire, 0) === m.renderTableau(ordinaire) && m.renderTableau(ordinaire).startsWith('<table class="q-tableau">'))
  check('tableau d’effectifs toujours en graphique (canvas)', m.renderGraphique(effectifs, 0).includes('<canvas') && !m.renderGraphique(effectifs, 0).includes('q-grille'))
  check('renderTableau(ordinaire) : sortie exacte inchangée',
    m.renderTableau(ordinaire) === '<table class="q-tableau"><tr><th>Note</th><th>8</th><th>12</th><th>15</th></tr><tr><td>Élèves</td><td>3</td><td>5</td><td>2</td></tr></table>')
  if (m.renderVisuel) {
    check('renderVisuel(grille) → grille, même si le mode demandé est « graphique »', m.renderVisuel({ tableau: grille }, 0).startsWith('<table class="q-grille">'))
    check('renderVisuel(sans tableau) → vide', m.renderVisuel({}, 0) === '')
  }
}

console.log('\n── Copies identiques ──')
for (const nom of ['estGrilleTableur', 'renderGrilleTableur']) {
  check(`${nom} identique dans quiz.html et prof.html`, extraireFonction(sources['quiz.html'], nom) === extraireFonction(sources['prof.html'], nom))
}
if (ko) { console.log(`\n${ko} échec(s)`); process.exit(1) }
console.log('\nTout est ok')
