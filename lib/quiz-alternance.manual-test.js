// /lib/quiz-alternance.manual-test.js
// Test manuel (`node lib/quiz-alternance.manual-test.js`) : alternance tableau/graphique de quiz.html
// (attribuerModes, lireDernierMode). Les fonctions sont extraites du vrai quiz.html a chaque execution.
const fs = require('fs'), path = require('path')
const src = fs.readFileSync(path.join(__dirname, '..', 'quiz.html'), 'utf8')
function extraire(nom) {
  const d = src.indexOf(`function ${nom}(`); if (d < 0) throw new Error(nom + ' introuvable')
  let i = src.indexOf('{', d), p = 0
  for (; i < src.length; i++) { if (src[i] === '{') p++; else if (src[i] === '}') { p--; if (!p) break } }
  return src.slice(d, i + 1)
}
const store = {}
let casse = false
const localStorage = { getItem: k => { if (casse) throw new Error('x'); return k in store ? store[k] : null }, setItem: (k, v) => { if (casse) throw new Error('x'); store[k] = v } }
const noms = ['detecterTypeGraphique', 'attribuerModes', 'lireDernierMode', 'memoriserDernierMode']
const f = new Function('localStorage', noms.map(extraire).join('\n') + '\nreturn {attribuerModes,lireDernierMode}')(localStorage)
let ko = 0
const ok = (c, m) => { console.log((c ? 'OK  ' : 'ECHEC ') + m); if (!c) ko++ }
const fn = { headers: ['x', '0', '1'], rows: [['f(x)', '1', '3']] }
const barres = { headers: ['Valeur', '1', '2'], rows: [['Effectif', '2', '3']] }
const multi = { headers: ['a', 'b'], rows: [['1', '2'], ['3', '4']] }
const qs = [{ tableau: fn }, { tableau: null }, { tableau: barres }, { tableau: multi }, { tableau: fn }]
let m = f.attribuerModes(qs, 'tableau')
ok(m[0] === 'tableau' && m[2] === 'graphique' && m[4] === 'tableau', 'alternance stricte sur les questions eligibles (fonction ET barres)')
ok(m[1] === 'tableau' && m[3] === 'tableau', 'non eligibles : toujours tableau')
ok(store.academika_dernier_mode === 'tableau', 'dernier mode eligible memorise')
ok(f.lireDernierMode() === 'graphique', 'quiz suivant commence par l\'inverse')
m = f.attribuerModes(qs, f.lireDernierMode())
ok(m[0] === 'graphique' && m[2] === 'tableau', 'enchainement entre deux quiz')
const vus = new Set(); for (let i = 0; i < 40; i++) vus.add(f.attribuerModes([{ tableau: fn }], null)[0])
ok(vus.size === 2, 'sans memoire : premier mode tire au hasard (les deux sortent)')
casse = true
m = f.attribuerModes(qs, f.lireDernierMode())
ok(f.lireDernierMode() === null && m[0] !== m[2], 'localStorage en panne : pas d\'erreur, alternance conservee')
m = f.attribuerModes([{ tableau: null }, { tableau: multi }], null)
ok(m[0] === 'tableau' && m[1] === 'tableau', 'aucune question eligible : tout en tableau')
console.log(ko ? ko + ' echec(s)' : 'Tous les tests passent'); process.exit(ko ? 1 : 0)
