// Test manuel : node lib/figure-pythagore-compose-angles.manual-test.js
// Extensions de figurePythagoreComposeSVG (quiz.html, prof.html, examen.html) :
//  1. clé facultative « angles » {point: texte} : arc au point visé, texte sur la bissectrice (à l'intérieur, sinon à l'extérieur si l'angle est faible),
//     sans rien recouvrir (autres textes, points, segments, carrés d'angle droit, arcs) et dans la figure ;
//  2. angle_droit égal à sommet : carré au sommet EN PLUS du carré au pied.
// Rétrocompatibilité : sans « angles » et sans angle_droit égal au sommet, la sortie est identique à celle de FIGURES_AVANT (octet pour octet)
// sur les figures de lib/figure-pythagore-compose.manual-test.js et de lib/figure-pythagore-compose-etiquettes.manual-test.js.
// Variables : FIGURES_AVANT=<html> (version de référence, p. ex. un git show HEAD:quiz.html), FIGURES_DIR / FIGURES_NOM (page HTML pour captures).
const fs = require('fs'), path = require('path'), vm = require('vm')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }
const extraire = fichier => { const s = fs.readFileSync(fichier, 'utf8'); const d = s.indexOf('function figurePythagoreComposeSVG('); return s.slice(d, s.indexOf('\n}\n', d) + 3) }
const charger = fichier => { const c = {}; vm.createContext(c); vm.runInContext(extraire(fichier), c); return c.figurePythagoreComposeSVG }
const fichiers = ['quiz.html', 'prof.html', 'examen.html'].map(f => path.join(racine, f))
verif(fichiers.map(extraire).every(x => x === extraire(fichiers[0])), 'les trois copies doivent être identiques')
const fig = charger(fichiers[0])

// x = h / tan(angle) : abscisses cohérentes avec les angles
const tan = d => Math.tan(d * Math.PI / 180)
const arr = n => Math.round(n * 100) / 100
const DH = (h, aB, aC, extra) => { const xb = h / tan(aB), xc = h / tan(aC); return Object.assign({ type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'H', h, points: [{ nom: 'B', x: 0 }, { nom: 'H', x: arr(xb) }, { nom: 'C', x: arr(xb + xc) }], segments: ['AB', 'AH', 'AC'], longueurs: { AH: h + ' cm', BC: '?' }, angles: { B: aB + '°', C: aC + '°' }, unite: 'cm' }, extra) }
const cas = [
  // 1. cas de l'énoncé, JSON tel quel
  { nom: 'DH 44°/31° (JSON de l\'énoncé)', c: { type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'H', h: 6, points: [{ nom: 'B', x: 0 }, { nom: 'H', x: 6.21 }, { nom: 'C', x: 16.2 }], segments: ['AB', 'AH', 'AC'], longueurs: { AH: '6 cm', BC: '?' }, angles: { B: '44°', C: '31°' }, unite: 'cm' }, angles: 2 },
  { nom: 'DH angle faible 25° / 70°', c: DH(6, 70, 25), angles: 2 },
  { nom: 'DH angle faible 25° en B / 60° en C', c: DH(6, 25, 60), angles: 2 },
  { nom: 'DH angle très faible 15° / 50°', c: DH(6, 50, 15), angles: 2 },
  { nom: 'DH base asymétrique 80° / 35°', c: DH(8, 80, 35), angles: 2 },
  { nom: 'DH base asymétrique 30° / 82°', c: DH(8, 30, 82), angles: 2 },
  { nom: 'DH un seul angle (B) + AB connue', c: DH(6, 44, 31, { angles: { B: '44°' }, longueurs: { AH: '6 cm', AB: '?', BC: '9 cm' } }), angles: 1 },
  { nom: 'DH angle inconnu « ? »', c: DH(6, 44, 31, { angles: { B: '44°', C: '?' } }), angles: 2 },
  { nom: 'DH AH inconnue', c: DH(6, 44, 31, { longueurs: { AH: '?', BH: '6,2 cm', HC: '10 cm' } }), angles: 2 },
  { nom: 'DH figure étroite 40° / 65°', c: DH(12, 65, 40, { longueurs: { AH: '12 cm', AB: '13,2 cm', AC: '18,7 cm' } }), angles: 2 },
  // 2. DA, JSON de l'énoncé
  { nom: 'DA (JSON de l\'énoncé)', c: { type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'H', h: 5.28, points: [{ nom: 'B', x: 0 }, { nom: 'H', x: 6.02 }, { nom: 'C', x: 10.63 }], segments: ['AB', 'AH', 'AC'], longueurs: { AB: '8 cm', AC: '7 cm', AH: '?' }, angle_droit: 'A', unite: 'cm' }, angles: 0, carreSommet: true },
  { nom: 'DA retournée (C à gauche)', c: { type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'H', h: 5.28, points: [{ nom: 'C', x: 0 }, { nom: 'H', x: 4.61 }, { nom: 'B', x: 10.63 }], segments: ['AC', 'AH', 'AB'], longueurs: { AB: '8 cm', AC: '7 cm', AH: '?' }, angle_droit: 'A', unite: 'cm' }, angles: 0, carreSommet: true },
  { nom: 'DA avec BC et BH', c: { type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'H', h: 5.28, points: [{ nom: 'B', x: 0 }, { nom: 'H', x: 6.02 }, { nom: 'C', x: 10.63 }], segments: ['AB', 'AH', 'AC'], longueurs: { AB: '8 cm', AC: '7 cm', AH: '?', BC: '10,63 cm' }, angle_droit: 'A', unite: 'cm' }, angles: 0, carreSommet: true },
  { nom: 'DA + angles (les deux extensions)', c: { type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'H', h: 5.28, points: [{ nom: 'B', x: 0 }, { nom: 'H', x: 6.02 }, { nom: 'C', x: 10.63 }], segments: ['AB', 'AH', 'AC'], longueurs: { AB: '8 cm', AH: '?' }, angle_droit: 'A', angles: { B: '41°' }, unite: 'cm' }, angles: 1, carreSommet: true },
]
module.exports = { cas, fig }

const attr = (l, n) => +l.match(new RegExp(' ' + n + '="([-\\d.]+)"'))[1]
const chev = (A, B) => A.x1 < B.x2 && B.x1 < A.x2 && A.y1 < B.y2 && B.y1 < A.y2
const ech = (L, pas) => { const n = Math.max(2, Math.ceil(Math.hypot(L[2] - L[0], L[3] - L[1]) / pas)); return Array.from({ length: n + 1 }, (_, k) => [L[0] + (L[2] - L[0]) * k / n, L[1] + (L[3] - L[1]) * k / n]) }
const dans = (R, pts) => pts.some(q => q[0] >= R.x1 && q[0] <= R.x2 && q[1] >= R.y1 && q[1] <= R.y2)
const gonfle = (R, m) => ({ x1: R.x1 - m, x2: R.x2 + m, y1: R.y1 - m, y2: R.y2 + m })
// rectangle d'un texte (même estimation que le rendu : 7,4 px par caractère en 13,5, 9,5 en 15)
const rectTexte = t => { const x = attr(t, 'x'), y = attr(t, 'y'), a = t.match(/text-anchor="(\w+)"/)[1], size = +t.match(/font-size="([\d.]+)"/)[1], tt = t.replace(/<[^>]*>/g, ''), w = tt.length * (size >= 15 ? 9.5 : 7.4) + 2, x1 = a === 'end' ? x - w : a === 'start' ? x : x - w / 2; return { t: tt, brut: t, size, R: { x1, x2: x1 + w, y1: y - size * 0.8, y2: y + 3 } } }

if (require.main === module) {
  cas.forEach(({ nom, c, angles, carreSommet }) => {
    const s = fig(c, 400)
    if (s === '') { verif(false, nom + ' : la figure ne s\'affiche pas'); return }
    verif(s.startsWith('<svg') && s.endsWith('</svg>'), nom + ' rendu')
    verif(!/NaN|undefined|Infinity/.test(s), nom + ' pas de NaN')
    const [W0, H0] = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number)
    const arcs = s.match(/<path d="M[^"]*A[^"]*"/g) || []
    verif(arcs.length === angles, nom + ' : ' + angles + ' arc(s) dessiné(s) (' + arcs.length + ')')
    Object.keys(c.angles || {}).forEach(k => verif(s.includes('>' + c.angles[k] + '</text>'), nom + ' : texte d\'angle « ' + c.angles[k] + ' »'))
    const lignes = (s.match(/<line [^>]*stroke-width="2.5"[^>]*>/g) || []).map(l => [attr(l, 'x1'), attr(l, 'y1'), attr(l, 'x2'), attr(l, 'y2')])
    const textes = (s.match(/<text [^>]*>[^<]*<\/text>/g) || []).map(rectTexte)
    const angTextes = textes.filter(x => Object.values(c.angles || {}).includes(x.t))
    const circ = (s.match(/<circle [^>]*>/g) || []).map(ci => ({ x1: attr(ci, 'cx') - 3.5, x2: attr(ci, 'cx') + 3.5, y1: attr(ci, 'cy') - 3.5, y2: attr(ci, 'cy') + 3.5 }))
    const polys = (s.match(/<polyline points="[^"]*"/g) || []).map(p => p.match(/points="([^"]*)"/)[1].split(' ').map(z => z.split(',').map(Number)))
    const carres = polys.map(P => ({ x1: Math.min(...P.map(q => q[0])), x2: Math.max(...P.map(q => q[0])), y1: Math.min(...P.map(q => q[1])), y2: Math.max(...P.map(q => q[1])) }))
    // fonds blancs des étiquettes (rect rx=3) : les étiquettes obliques, hauteur
    const blancs = [...s.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)" rx="3" fill="#fff"\/>/g)].map(m => ({ x1: +m[1], y1: +m[2], x2: +m[1] + +m[3], y2: +m[2] + +m[4] }))
    // points des arcs
    const ptsArcs = arcs.flatMap(a => { const m = a.match(/M([-\d.]+) ([-\d.]+) A([-\d.]+) [-\d.]+ 0 0 (\d) ([-\d.]+) ([-\d.]+)/); return m ? [[+m[1], +m[2]], [+m[5], +m[6]]] : [] })
    verif(arcs.every(a => /A[-\d.]+ [-\d.]+ 0 0 [01] /.test(a)), nom + ' : arcs au format « A r r 0 0 sweep »')
    angTextes.forEach(x => {
      const R = x.R
      verif(R.x1 >= 0 && R.x2 <= W0 && R.y1 >= 0 && R.y2 <= H0, nom + ' : « ' + x.t + ' » dans la figure')
      textes.filter(y => y.brut !== x.brut).forEach(y => verif(!chev(R, y.R), nom + ' : « ' + x.t + ' » ne recouvre pas le texte « ' + y.t + ' »'))
      circ.forEach(ci => verif(!chev(R, ci), nom + ' : « ' + x.t + ' » ne recouvre pas un point'))
      carres.forEach(q => verif(!chev(R, q), nom + ' : « ' + x.t + ' » ne recouvre pas un carré d\'angle droit'))
      blancs.forEach(b => verif(!chev(R, b), nom + ' : « ' + x.t + ' » ne recouvre pas un fond d\'étiquette'))
      // aucun segment ni la base ne passe sous le texte
      lignes.forEach((L, k) => verif(!dans(gonfle(R, 1), ech(L, 1)), nom + ' : « ' + x.t + ' » ne touche pas le trait n°' + (k + 1)))
      // ne recouvre pas l'arc
      verif(!dans(gonfle(R, 1), ptsArcs), nom + ' : « ' + x.t + ' » ne touche pas l\'extrémité d\'un arc')
    })
    // les étiquettes obliques (fond blanc) ne recouvrent ni le texte d'angle ni l'arc
    blancs.forEach(b => { angTextes.forEach(x => verif(!chev(b, x.R), nom + ' : un fond d\'étiquette ne recouvre pas « ' + x.t + ' »')); verif(!dans(b, ptsArcs), nom + ' : un fond d\'étiquette ne recouvre pas un arc') })
    // carrés : au pied toujours (angle_droit omis, pied ou sommet) ; au sommet si angle_droit === sommet
    const nbCarres = polys.filter(P => P.length === 3).length
    verif(nbCarres === (carreSommet ? 2 : (c.angle_droit === undefined || c.angle_droit === c.pied ? 1 : 0)), nom + ' : nombre de carrés d\'angle droit (' + nbCarres + ')')
    if (carreSommet) {
      const ap = (s.match(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="3.5" fill="#14304F"\/><text[^>]*>A</) || []), axA = +ap[1], ayA = +ap[2]
      const P = polys.find(P => Math.abs(P[0][0] - axA) > 0.5 || Math.abs(P[0][1] - ayA) < 40) // carré du sommet : le plus haut
      const hauts = polys.slice().sort((u, v) => Math.min(...u.map(q => q[1])) - Math.min(...v.map(q => q[1])))[0]
      verif(Math.min(...hauts.map(q => q[1])) >= ayA - 0.2 && Math.max(...hauts.map(q => q[1])) < ayA + 40, nom + ' : carré du sommet juste sous A')
      // les deux côtés du carré partent de A le long de [AB] et [AC] : on vérifie l'alignement avec les extrémités de la base
      const ext = [lignes[1], lignes[lignes.length - 1]]
      const base = lignes[0]
      const dirOk = (Q, L) => { const u = [L[2] - L[0], L[3] - L[1]], v = [Q[0] - axA, Q[1] - ayA], n = Math.hypot(...u) * Math.hypot(...v); return n > 0 && Math.abs(u[0] * v[1] - u[1] * v[0]) / n < 0.02 }
      const bout = [[base[0], base[1]], [base[2], base[3]]]
      const longs = ext.map(L => L)
      void P; void longs
      // premier et dernier sommets du polyline = A + c·u (alignés avec A→extrémité de la base)
      verif((dirOk(hauts[0], [axA, ayA, bout[0][0], bout[0][1]]) && dirOk(hauts[2], [axA, ayA, bout[1][0], bout[1][1]])) || (dirOk(hauts[0], [axA, ayA, bout[1][0], bout[1][1]]) && dirOk(hauts[2], [axA, ayA, bout[0][0], bout[0][1]])), nom + ' : côtés du carré du sommet le long de [AB] et [AC]')
      // carré du sommet : aucune étiquette ne le recouvre
      const cs = carres.reduce((m, q) => (q.y1 < m.y1 ? q : m))
      textes.forEach(y => verif(!chev(y.R, cs), nom + ' : « ' + y.t + ' » ne recouvre pas le carré du sommet'))
      blancs.forEach(b => verif(!chev(b, cs), nom + ' : un fond d\'étiquette ne recouvre pas le carré du sommet'))
    }
  })

  // intérieur / extérieur : angle confortable → texte DANS le triangle (sous la ligne [AB], au-dessus de la base) ; angle faible → texte hors du triangle admis
  {
    const s = fig(cas[0].c, 400), t = s.match(/<text [^>]*>44°<\/text>/)[0], x = attr(t, 'x'), y = attr(t, 'y')
    const L = (s.match(/<line [^>]*stroke-width="2.5"[^>]*>/g) || []).map(l => [attr(l, 'x1'), attr(l, 'y1'), attr(l, 'x2'), attr(l, 'y2')])
    // dans le triangle ABH (B à gauche) : à droite de [AB] et au-dessus de la base
    const AB = L[1], base = L[0], onSide = (P, A, B) => (B[0] - A[0]) * (P[1] - A[1]) - (B[1] - A[1]) * (P[0] - A[0])
    verif(y < base[1] && Math.sign(onSide([x, y - 5], [AB[0], AB[1]], [AB[2], AB[3]])) === Math.sign(onSide([AB[2] + 40, base[1] - 3], [AB[0], AB[1]], [AB[2], AB[3]])), 'DH 44° : le texte « 44° » est à l\'intérieur du triangle')
  }

  // sans « angles » : même sortie qu'avant ; avec angles: {} : même sortie qu'avec la clé absente ; avec null : idem
  {
    const sans = Object.assign({}, cas[0].c); delete sans.angles
    const A = fig(sans, 400)
    verif(A !== '' && !/<path d="M[^"]*A/.test(A), 'sans angles : aucun arc')
    verif(fig(Object.assign({}, sans, { angles: {} }), 400) === A, 'angles : {} identique à la clé absente')
    verif(fig(Object.assign({}, sans, { angles: null }), 400) === A, 'angles : null identique à la clé absente')
    verif(fig(cas[0].c, 400).replace(/<path [^>]*\/><text[^>]*>[^<]*<\/text>/g, '') !== '', 'avec angles : rendu non vide')
  }
  // angle_droit : omis, pied → un carré (inchangé) ; sommet → deux carrés ; autre lettre → aucun
  {
    const da = cas.find(x => x.nom.startsWith('DA (')).c, nbP = s => (s.match(/<polyline /g) || []).length
    verif(nbP(fig(Object.assign({}, da, { angle_droit: undefined }), 400)) === 1, 'angle_droit omis : un carré (au pied)')
    verif(nbP(fig(Object.assign({}, da, { angle_droit: 'H' }), 400)) === 1, 'angle_droit = pied : un carré')
    verif(nbP(fig(da, 400)) === 2, 'angle_droit = sommet : deux carrés (sommet + pied)')
    verif(nbP(fig(Object.assign({}, da, { angle_droit: 'Z' }), 400)) === 0, 'angle_droit autre lettre : aucun carré')
    // pied à une extrémité : pas de carré au sommet (il ne serait pas droit), carré au pied conservé
    verif(nbP(fig(Object.assign({}, da, { points: [{ nom: 'H', x: 0 }, { nom: 'C', x: 4.6 }], segments: ['AH', 'AC'] }), 400)) === 1, 'angle_droit = sommet, pied à une extrémité : seul le carré du pied')
  }
  // clés invalides : chaîne vide, jamais d'exception
  const base0 = cas[0].c
  ;[
    { angles: 'x' }, { angles: [] }, { angles: 42 }, { angles: { Z: '44°' } }, { angles: { H: '90°' } }, { angles: { A: '44°' } }, { angles: { B: '' } }, { angles: { B: '   ' } },
    { angles: { B: 'x'.repeat(9) } }, { angles: { B: null } }, { angles: { B: {} } }, { angles: { BC: '44°' } }, { angles: { B: '44°', C: '31°', H: '1°', A: '2°', Q: '3°', R: '4°', S: '5°' } },
    { segments: ['AH', 'AC'], angles: { B: '44°' } }, // angle en B sans segment [AB]
  ].forEach((m, i) => { let r; try { r = fig(Object.assign({}, base0, m), 400) } catch (e) { r = 'EXC' } verif(r === '', 'angles invalides n°' + (i + 1) + ' : chaîne vide') })
  // texte assaini : pas de balise injectée
  { const r = fig(Object.assign({}, base0, { angles: { B: '<b>4' } }), 400); verif(r !== '' && !/<b>/.test(r), 'texte d\'angle assaini') }
  // un nombre est accepté comme texte
  verif(fig(Object.assign({}, base0, { angles: { B: 44 } }), 400).includes('>44<'), 'angle numérique accepté')

  // rétrocompatibilité : sortie identique octet pour octet à FIGURES_AVANT
  if (process.env.FIGURES_AVANT) {
    const avant = charger(process.env.FIGURES_AVANT)
    const { tous } = require('./figure-pythagore-compose-etiquettes.manual-test.js')
    let n = 0
    const variantes = [{}, { angle_droit: undefined }, { angle_droit: 'Z' }, { angle_droit: 'H' }, { angle_droit: 'C' }, { angle_droit: 'B' }]
    tous.forEach(({ nom, c }) => variantes.forEach(v => {
      const g = Object.assign({}, c, v)
      if (g.angle_droit === g.sommet) return // changement voulu : carré au sommet + carré au pied
      ;[400, 300].forEach(w => { n++; verif(fig(g, w) === avant(g, w), 'rétrocompatibilité ' + nom + ' ' + JSON.stringify(v) + ' ' + w + ' : sortie identique') })
    }))
    console.log('Rétrocompatibilité : ' + n + ' sorties comparées à ' + process.env.FIGURES_AVANT)
  } else console.log('NOTE : FIGURES_AVANT non défini : rétrocompatibilité non comparée (FIGURES_AVANT=<html de référence>).')

  if (process.env.FIGURES_DIR) {
    fs.mkdirSync(process.env.FIGURES_DIR, { recursive: true })
    const cartes = cas.map(({ nom, c }) => '<div class="carte"><div class="t">' + nom + '</div><div class="q-figure">' + fig(c, 400) + '</div></div>').join('')
    const css = ':root{--bg:#f6f4ef;--fg:#14304F;--cr:#faf8f2;--card:#fff;--bd:#e2e0d8}@media(prefers-color-scheme:dark){:root{--bg:#14161c;--fg:#e8eaf0;--cr:#22252e;--card:#1c1f27;--bd:#363a47}}body{margin:0;padding:12px;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.carte{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:10px}.t{font-size:13px;font-weight:600;margin-bottom:8px}.q-figure{display:flex;justify-content:center;background:var(--cr);border-radius:8px;padding:12px}.q-figure svg{max-width:400px;height:auto;display:block}'
    fs.writeFileSync(path.join(process.env.FIGURES_DIR, process.env.FIGURES_NOM || 'figures.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style><div class="grille">' + cartes + '</div>')
  }
  console.log(ok + ' ok, ' + ko + ' échec(s)')
  process.exit(ko ? 1 : 0)
}
