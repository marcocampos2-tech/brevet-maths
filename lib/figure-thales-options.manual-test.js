// Test manuel : node lib/figure-thales-options.manual-test.js
// Vérifie les options facultatives de la figure « thales » (noms, angles_droits, arcs_egaux) dans quiz.html et prof.html :
// 1. les fonctions d'options sont identiques dans les deux fichiers ;
// 2. rétrocompatibilité : sans option, le rendu est strictement identique à celui du dernier commit (HEAD) ;
// 3. lettres libres, marques d'angle, clés invalides, absence de NaN.
// Avec FIGURES_DIR=<dossier> écrit une page HTML par fichier (pour les captures d'écran).
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }

const CIBLES = [
  { fichier: 'quiz.html', fn: 'renderFigure', debutFn: 'function renderFigure(fig){' },
  { fichier: 'prof.html', fn: 'renderFigureSVG', debutFn: 'function renderFigureSVG(fig) {' },
]
const finFonction = (s, d) => s.indexOf('\n}\n', d) + 3
const charger = (src, fn) => { const ctx = {}; vm.createContext(ctx); vm.runInContext(src + '\nthis.__fn=' + fn, ctx); return ctx.__fn }
const helpersDe = s => s.slice(s.indexOf('// Options facultatives de la figure « thales »'), s.indexOf('function thalesMarquesSVG(')) +
                       s.slice(s.indexOf('function thalesMarquesSVG('), finFonction(s, s.indexOf('function thalesMarquesSVG(')))

const rendus = {}
CIBLES.forEach(c => {
  const neuf = fs.readFileSync(path.join(racine, c.fichier), 'utf8')
  const ancien = cp.execSync('git show HEAD:' + c.fichier, { cwd: racine, maxBuffer: 1 << 26 }).toString()
  const dN = neuf.indexOf('// Options facultatives de la figure « thales »')
  verif(dN >= 0, c.fichier + ' : fonctions d\'options présentes')
  const srcN = neuf.slice(dN, finFonction(neuf, neuf.indexOf(c.debutFn)))
  const dA = ancien.indexOf(c.debutFn)
  const srcA = ancien.slice(dA, finFonction(ancien, dA))
  c.rN = charger(srcN, c.fn); c.rA = charger(srcA, c.fn); c.helpers = helpersDe(neuf)
  rendus[c.fichier] = c
})
verif(rendus['quiz.html'].helpers === rendus['prof.html'].helpers, 'fonctions d\'options identiques dans quiz.html et prof.html')

// 2. rétrocompatibilité : sans option, sortie identique à HEAD
const anciens = []
;['emboitee', 'papillon', undefined].forEach(cfg => {
  ;[['6', '3'], ['8', '2'], ['10', '9'], ['?', '4'], ['9', '?'], ['6', '6'], [12, 5]].forEach(([ab, am]) => {
    const f = { type: 'thales', ab, am }
    if (cfg) f.configuration = cfg
    anciens.push(f)
  })
})
CIBLES.forEach(c => anciens.forEach((f, i) => {
  const a = c.rA(JSON.parse(JSON.stringify(f))), n = c.rN(JSON.parse(JSON.stringify(f)))
  verif(a === n, c.fichier + ' : rendu historique inchangé, cas ' + i)
  verif(a.length > 100, c.fichier + ' : rendu historique non vide, cas ' + i)
}))
// et en chaîne JSON
CIBLES.forEach(c => verif(c.rA(JSON.stringify(anciens[0])) === c.rN(JSON.stringify(anciens[0])), c.fichier + ' : figure en chaîne JSON'))

// 3. nouveautés
const noms = { A: 'R', M: 'S', N: 'T', B: 'U', C: 'W' }
const cas = {
  emb_noms: { type: 'thales', ab: '?', am: '?', noms },
  pap_noms: { type: 'thales', ab: '?', am: '?', configuration: 'papillon', noms },
  droit_B: { type: 'thales', ab: '6', am: '3', angles_droits: ['B'] },
  droits_BM: { type: 'thales', ab: '6', am: '3', angles_droits: ['B', 'M'] },
  arcs_A: { type: 'thales', ab: '6', am: '3', configuration: 'papillon', arcs_egaux: ['A'] },
  arcs_BN_pap: { type: 'thales', ab: '6', am: '3', configuration: 'papillon', arcs_egaux: ['B', 'N'] },
  tout: { type: 'thales', ab: '?', am: '?', configuration: 'papillon', noms, angles_droits: ['U', 'W'], arcs_egaux: ['R'] },
}
CIBLES.forEach(c => {
  Object.keys(cas).forEach(k => {
    const s = c.rN(JSON.parse(JSON.stringify(cas[k])))
    verif(s.includes('<svg') && s.endsWith('</svg>') || s.endsWith('</svg></div>'), c.fichier + ' ' + k + ' : rendu')
    verif(!/NaN|undefined|Infinity/.test(s), c.fichier + ' ' + k + ' : pas de NaN')
  })
  const lettres = s => (s.match(/class="fig-lb"[^>]*>([^<]*)<\/text>/g) || []).map(t => t.replace(/.*>([^<]*)<\/text>/, '$1'))
  verif(JSON.stringify(lettres(c.rN(cas.emb_noms))) === JSON.stringify(['R', 'S', 'T', 'U', 'W']), c.fichier + ' : lettres libres (emboîtée) ' + JSON.stringify(lettres(c.rN(cas.emb_noms))))
  verif(JSON.stringify(lettres(c.rN(cas.pap_noms))) === JSON.stringify(['R', 'S', 'T', 'U', 'W']), c.fichier + ' : lettres libres (papillon)')
  verif(c.rN(cas.droit_B).includes('class="fig-rt"'), c.fichier + ' : marque d\'angle droit')
  verif((c.rN(cas.droits_BM).match(/class="fig-rt"/g) || []).length === 2, c.fichier + ' : deux marques d\'angle droit')
  verif((c.rN(cas.arcs_BN_pap).match(/stroke="#3730a3" stroke-width="1"\/>/g) || []).length === 2, c.fichier + ' : deux arcs égaux')
  verif((c.rN(cas.arcs_A).match(/stroke="#3730a3" stroke-width="1"\/>/g) || []).length === 1, c.fichier + ' : un arc')
  verif(c.rN(cas.tout).includes('class="fig-rt"') && c.rN(cas.tout).includes('<path d="M'), c.fichier + ' : cas complet')
  // aucun nombre écrit par les options (les seules étiquettes sont des lettres)
  verif(lettres(c.rN(cas.tout)).every(t => /^[A-Za-z]$/.test(t)), c.fichier + ' : étiquettes = lettres seulement')

  // clés invalides : pas de figure
  const invalides = [
    { noms: { A: 'R', M: 'S', N: 'T', B: 'U' } },                       // clé manquante
    { noms: { A: 'R', M: 'S', N: 'T', B: 'U', C: 'U' } },               // lettre répétée
    { noms: { A: 'R', M: 'S', N: 'T', B: 'U', C: 'WW' } },              // deux lettres
    { noms: { A: 'R', M: 'S', N: 'T', B: 'U', C: '1' } },               // pas une lettre
    { noms: ['R', 'S', 'T', 'U', 'W'] },                                // tableau
    { noms: 'RSTUW' },                                                  // chaîne
    { angles_droits: ['Z'] },                                           // lettre inconnue
    { angles_droits: 'B' },                                             // pas une liste
    { angles_droits: ['B', 'B'] },                                      // répétée
    { arcs_egaux: ['A', 'M', 'N', 'B', 'C', 'A'] },                     // trop longue
    { noms, angles_droits: ['A'] },                                     // lettre par défaut alors que renommée
  ]
  invalides.forEach((o, i) => verif(c.rN(Object.assign({ type: 'thales', ab: '6', am: '3' }, o)) === '', c.fichier + ' : clé invalide ' + i + ' => vide'))
  // lettres par défaut conservées quand noms absent
  verif(c.rN({ type: 'thales', ab: '6', am: '3', angles_droits: ['B'] }).includes('>B<'), c.fichier + ' : B affiché sans noms')
})

if (process.env.FIGURES_DIR) {
  fs.mkdirSync(process.env.FIGURES_DIR, { recursive: true })
  CIBLES.forEach(c => {
    const html = '<body style="font-family:sans-serif;display:flex;flex-wrap:wrap;gap:12px;padding:12px">' +
      Object.keys(cas).map(k => '<div style="border:1px solid #ccc;padding:4px"><div style="font-size:12px">' + c.fichier + ' ' + k + '</div>' + c.rN(JSON.parse(JSON.stringify(cas[k]))) + '</div>').join('') + '</body>'
    fs.writeFileSync(path.join(process.env.FIGURES_DIR, c.fichier.replace('.html', '') + '.html'), html)
  })
}
console.log(ko ? ko + ' échec(s), ' + ok + ' ok' : 'OK : ' + ok + ' vérifications')
process.exit(ko ? 1 : 0)
