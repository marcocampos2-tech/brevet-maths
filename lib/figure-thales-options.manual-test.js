// Test manuel : node lib/figure-thales-options.manual-test.js
// Vérifie les options facultatives de la figure « thales » (noms, angles_droits, arcs_egaux, forme) dans quiz.html et prof.html :
// 1. les fonctions d'options sont identiques dans les deux fichiers ;
// 2. rétrocompatibilité : avec forme « isocele », le rendu est strictement identique à celui d'une référence git
//    (THALES_REF=<commit>, ou HEAD si quiz.html / prof.html ont des modifications non commitées ; sinon cette étape est ignorée) ;
// 3. lettres libres, marques d'angle, clés invalides, absence de NaN ;
// 4. sommet décalé par défaut (30 % de la base), centré avec forme « isocele » : parallélisme, alignements, cadrage, forme invalide ;
//    couleurs des pastilles par droite parallèle (emboîtée comme papillon).
// Avec FIGURES_DIR=<dossier> écrit une page HTML par fichier (pour les captures d'écran).
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }
const sale = cp.spawnSync('git', ['diff', '--quiet', 'HEAD', '--', 'quiz.html', 'prof.html'], { cwd: racine }).status !== 0
const REF = process.env.THALES_REF || (sale ? 'HEAD' : null)

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
  const dN = neuf.indexOf('// Options facultatives de la figure « thales »')
  verif(dN >= 0, c.fichier + ' : fonctions d\'options présentes')
  const srcN = neuf.slice(dN, finFonction(neuf, neuf.indexOf(c.debutFn)))
  c.rN = charger(srcN, c.fn); c.helpers = helpersDe(neuf)
  if (REF) {
    const ancien = cp.execSync('git show ' + REF + ':' + c.fichier, { cwd: racine, maxBuffer: 1 << 26 }).toString()
    const dA = ancien.indexOf(c.debutFn)
    const dA0 = ancien.indexOf('// Options facultatives de la figure « thales »')
    c.rA = charger(ancien.slice(dA0 >= 0 ? dA0 : dA, finFonction(ancien, dA)), c.fn)
  }
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
// Le rendu par défaut change (sommet décalé) ; avec forme « isocele » il doit rester strictement celui de la référence.
// La classe (couleur) des pastilles est ignorée dans cette comparaison : elle est vérifiée à part (section 4) ;
// elle a changé en emboîtée (coloriage par droite parallèle) par rapport aux références antérieures à ce changement.
if (REF) {
  const iso = f => Object.assign(JSON.parse(JSON.stringify(f)), { forme: 'isocele' })
  const sansCouleur = s => s.replace(/<circle class="[^"]*"/g, '<circle')
  CIBLES.forEach(c => anciens.forEach((f, i) => {
    const a = c.rA(iso(f)), n = c.rN(iso(f))   // une référence antérieure à `forme` ignore la clé et rend le triangle symétrique
    verif(sansCouleur(a) === sansCouleur(n), c.fichier + ' : forme isocele = rendu de ' + REF + ', cas ' + i)
    verif(a.length > 100, c.fichier + ' : rendu de référence non vide, cas ' + i)
  }))
  // et en chaîne JSON
  CIBLES.forEach(c => verif(sansCouleur(c.rA(JSON.stringify(iso(anciens[0])))) === sansCouleur(c.rN(JSON.stringify(iso(anciens[0])))), c.fichier + ' : figure en chaîne JSON'))
} else console.log('Note : comparaison à une référence git ignorée (définir THALES_REF=<commit> pour l\'exécuter)')

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

// 4. sommet décalé par défaut, centré avec forme « isocele »
const SZ = { 'quiz.html': 220, 'prof.html': 180 }
const points = s => [...s.matchAll(/<circle [^>]*cx="([-\d.e]+)" cy="([-\d.e]+)"/g)].map(t => ({ x: +t[1], y: +t[2] }))   // ordre A, M, N, B, C
const croix = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
CIBLES.forEach(c => {
  const S = SZ[c.fichier]
  ;['emboitee', 'papillon'].forEach(cfg => {
    ;[['6', '3'], ['8', '2'], ['10', '9'], ['6', '6'], ['12', '5'], ['3', '6'], ['2', '9'], ['?', '?']].forEach(([ab, am]) => {
      const f = { type: 'thales', ab, am, configuration: cfg }
      const etiq = c.fichier + ' ' + cfg + ' ' + ab + '/' + am
      const d = points(c.rN(f)), iso = points(c.rN(Object.assign({}, f, { forme: 'isocele' })))
      verif(d.length === 5 && iso.length === 5, etiq + ' : cinq points')
      if (d.length !== 5 || iso.length !== 5) return
      ;[['défaut', d], ['isocele', iso]].forEach(([k, p]) => {
        const [A, M, N, B, C] = p, nom = etiq + ' ' + k
        const xs = p.map(q => q.x)
        verif(p.every(q => isFinite(q.x) && isFinite(q.y) && q.x >= 20 && q.x <= S - 20 && q.y >= 4 && q.y <= S - 4), nom + ' : points dans le cadre')
        verif(Math.abs(M.y - N.y) < 1e-9 && Math.abs(B.y - C.y) < 1e-9, nom + ' : (MN) // (BC)')
        verif(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - S / 2) < 1e-6, nom + ' : figure centrée')
        verif(Math.abs(croix(A, M, B)) < 1e-6 && Math.abs(croix(A, N, C)) < 1e-6, nom + ' : A, M, B alignés et A, N, C alignés')
      })
      // couleurs : pastilles coloriées par droite parallèle (M et N comme (MN) en bleu, B et C comme (BC) en vert), dans les deux configurations
      const attendu = JSON.stringify(['fig-dot', 'fig-dot', 'fig-dot', 'fig-dotg', 'fig-dotg'])   // A, M, N, B, C
      const classes = s => JSON.stringify([...s.matchAll(/<circle class="([^"]*)" cx=/g)].map(t => t[1]))
      verif(classes(c.rN(f)) === attendu, etiq + ' : pastilles coloriées par parallèle, défaut')
      verif(classes(c.rN(Object.assign({}, f, { forme: 'isocele' }))) === attendu, etiq + ' : pastilles coloriées par parallèle, isocele')
      const m = c.rN(f), yBleue = m.match(/class="fig-lnb" x1="[^"]*" y1="([^"]*)"/), yVerte = m.match(/class="fig-lng" x1="[^"]*" y1="([^"]*)"/)
      verif(yBleue && yVerte && Math.abs(+yBleue[1] - d[1].y) < 1e-9 && Math.abs(+yVerte[1] - d[3].y) < 1e-9, etiq + ' : droite bleue = (MN), droite verte = (BC)')
      verif(Math.abs(iso[0].x - (iso[3].x + iso[4].x) / 2) < 1e-9, etiq + ' : isocele => A au milieu de BC')
      verif(Math.abs(d[0].x - (d[3].x + d[4].x) / 2) > 3, etiq + ' : défaut => A décalé')
      verif(Math.abs((d[0].x - d[3].x) / (d[4].x - d[3].x) - 0.3) < 1e-9, etiq + ' : défaut => A à 30 % de la base')
    })
  })
  // forme : valeurs invalides => pas de figure ; null ou absente => même rendu
  ;['scalene', 'Isocele', '', 1, true, [], {}].forEach((v, i) => verif(c.rN({ type: 'thales', ab: '6', am: '3', forme: v }) === '', c.fichier + ' : forme invalide ' + i + ' => vide'))
  verif(c.rN({ type: 'thales', ab: '6', am: '3', forme: null }) === c.rN({ type: 'thales', ab: '6', am: '3' }), c.fichier + ' : forme null = forme absente')
  // forme et autres options ensemble
  const mix = c.rN({ type: 'thales', ab: '6', am: '3', forme: 'isocele', angles_droits: ['B'], arcs_egaux: ['M', 'N'] })
  verif(mix.includes('class="fig-rt"') && !/NaN|undefined|Infinity/.test(mix), c.fichier + ' : forme isocele avec marques d\'angle')
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
