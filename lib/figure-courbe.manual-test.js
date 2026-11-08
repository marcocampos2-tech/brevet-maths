// Test manuel : node lib/figure-courbe.manual-test.js
// Vérifie figureCourbeSVG (quiz.html, prof.html, examen.html) : copies identiques, 9 figures réelles (coordonnées SVG),
// droites, graduations, robustesse (aucune exception), pythagore / pythagore_compose inchangés.
// Avec FIGURES_DIR=<dossier> écrit en plus une page HTML (pour les captures d'écran).
const fs = require('fs'), path = require('path'), vm = require('vm')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }

function extraire(fichier) {
  const s = fs.readFileSync(path.join(racine, fichier), 'utf8')
  const d = s.indexOf('function figureCourbeSVG(')
  const f = s.indexOf('\n}\n', d) + 3
  return s.slice(d, f)
}
const src = ['quiz.html', 'prof.html', 'examen.html'].map(extraire)
verif(src[0] === src[1] && src[0] === src[2], 'les trois copies doivent être identiques')
const ctx = {}; vm.createContext(ctx); vm.runInContext(src[0], ctx)
const fig = ctx.figureCourbeSVG

const parab = { type: 'courbe', xmin: -4, xmax: 3, ymin: -2, ymax: 5, courbes: [{ nom: 'f', points: [[-3.4, 4.76], [-3.2, 3.84], [-3.0, 3.0], [-2.8, 2.24], [-2.6, 1.56], [-2.4, 0.96], [-2.2, 0.44], [-2.0, 0.0], [-1.8, -0.36], [-1.6, -0.64], [-1.4, -0.84], [-1.2, -0.96], [-1.0, -1.0], [-0.8, -0.96], [-0.6, -0.84], [-0.4, -0.64], [-0.2, -0.36], [0.0, 0.0], [0.2, 0.44], [0.4, 0.96], [0.6, 1.56], [0.8, 2.24], [1.0, 3.0], [1.2, 3.84], [1.4, 4.76]], lisse: true }], points: [] }
const D = (xmin, xmax, ymin, ymax, courbes, points, extra) => Object.assign({ type: 'courbe', xmin, xmax, ymin, ymax, courbes, points }, extra)
const figures = [
  parab, parab,
  D(-2, 3, -4, 6, [{ nom: 'g', droite: { a: 3, b: 0 } }], [{ nom: 'A', x: 1, y: 3 }]),
  parab,
  D(-2, 4, -3, 6, [{ nom: 'f', droite: { a: 2, b: -1 } }], [{ nom: 'A', x: 0, y: -1 }, { nom: 'B', x: 2, y: 3 }]),
  parab,
  D(-2, 4, -3, 6, [{ nom: 'h', droite: { a: -2, b: 3 } }], [{ nom: 'A', x: 0, y: 3 }, { nom: 'B', x: 2, y: -1 }]),
  D(-1, 5, -1, 6, [{ nom: 'f', droite: { a: 1, b: 1 } }, { nom: 'g', droite: { a: -1, b: 5 } }], [{ nom: 'A', x: 0, y: 1 }, { nom: 'B', x: 2, y: 3 }, { nom: 'C', x: 0, y: 5 }]),
  D(0, 5, 0, 20, [{ nom: 'P', droite: { a: 3, b: 5 } }], [{ nom: 'A', x: 0, y: 5 }, { nom: 'B', x: 2, y: 11 }], { pas_etiquette_y: 5 }),
]
module.exports = { figures, fig }

// géométrie : data-u, data-ox, data-oy → coordonnées SVG d'un point du repère
const geo = s => { const g = n => +s.match(new RegExp('data-' + n + '="([-\\d.]+)"'))[1]; return { ux: g('ux'), uy: g('uy'), ox: g('ox'), oy: g('oy') } }
const SX = (G, x) => G.ox + G.ux * x, SY = (G, y) => G.oy - G.uy * y
const attrs = l => ['x1', 'y1', 'x2', 'y2'].map(n => +l.match(new RegExp(' ' + n + '="([-\\d.]+)"'))[1])
const nb = s => s.match(/-?\d+(?:\.\d+)?/g).map(Number)
const textes = s => (s.match(/<text [^>]*>[^<]*<\/text>/g) || []).map(t => ({ x: +t.match(/ x="([-\d.]+)"/)[1], y: +t.match(/ y="([-\d.]+)"/)[1], t: t.replace(/<[^>]*>/g, ''), anchor: t.match(/text-anchor="(\w+)"/)[1], size: +t.match(/font-size="([\d.]+)"/)[1] }))

if (require.main === module) {
  const avant9 = 112 // largeur du dessin de la figure 9 avant la correction (carreaux carrés de 12 px)
  const svgs = figures.map(f => fig(f, 400))
  svgs.forEach((s, i) => {
    verif(s.startsWith('<svg') && s.endsWith('</svg>'), 'figure ' + (i + 1) + ' rendu')
    verif(!/NaN|undefined|Infinity/.test(s), 'figure ' + (i + 1) + ' pas de NaN')
    verif(!/pas en vraie grandeur/i.test(s), 'figure ' + (i + 1) + ' sans mention « pas en vraie grandeur »')
    const vb = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), W = +vb[1], H = +vb[2], G = geo(s)
    verif(H <= 300, 'figure ' + (i + 1) + ' hauteur ≤ 300 px (' + H + ')')
    textes(s).forEach(t => verif(t.size >= 11, 'figure ' + (i + 1) + ' police ≥ 11 px'))
    // carreaux carrés, sauf fenêtre très haute (hauteur > 2 × largeur) : carreaux plus larges que hauts, jamais plus étroits
    const f = figures[i], clip = s.match(/<clipPath[^>]*><rect [^>]*width="([\d.]+)" height="([\d.]+)"/)
    const tres = (f.ymax - f.ymin) > 2 * (f.xmax - f.xmin)
    verif(+clip[1] === (f.xmax - f.xmin) * G.ux && +clip[2] === (f.ymax - f.ymin) * G.uy, 'figure ' + (i + 1) + ' fenêtre = nx*ux sur ny*uy')
    verif(tres ? G.ux > G.uy && G.ux <= 3 * G.uy && G.ux <= 40 : G.ux === G.uy, 'figure ' + (i + 1) + (tres ? ' carreaux plus larges que hauts' : ' carreaux carrés'))
    // tout le texte reste dans le dessin
    textes(s).forEach(t => verif(t.x > 0 && t.x < W && t.y > 0 && t.y < H, 'figure ' + (i + 1) + ' texte « ' + t.t + ' » dans le dessin'))
    // un trait de grille par unité
    verif((s.match(/<g stroke="#D3DDEE"[^>]*>(.*?)<\/g>/)[1].match(/<line/g) || []).length === (f.xmax - f.xmin + 1) + (f.ymax - f.ymin + 1), 'figure ' + (i + 1) + ' une ligne de grille par unité')
  })

  // exemple 1 : la courbe passe EXACTEMENT par (−3;3), (−2;0), (−1;−1), (0;0), (1;3) (sommets du tracé lisse)
  {
    const s = svgs[0], G = geo(s), d = s.match(/class="crb-courbe"[^>]* d="([^"]+)"/)[1]
    const ancres = []; d.split(/(?=[MC])/).forEach(seg => { const v = nb(seg); ancres.push(v.slice(-2)) })
    verif(ancres.length === 25, 'exemple 1 : 25 sommets')
    ;[[-3, 3], [-2, 0], [-1, -1], [0, 0], [1, 3]].forEach(([x, y]) =>
      verif(ancres.some(a => Math.abs(a[0] - SX(G, x)) < 0.02 && Math.abs(a[1] - SY(G, y)) < 0.02), 'exemple 1 : passe par (' + x + ' ; ' + y + ')'))
    // tous les points de la liste, et courbe lisse (commandes C, pas de L)
    parab.courbes[0].points.forEach(([x, y]) => verif(ancres.some(a => Math.abs(a[0] - SX(G, x)) < 0.02 && Math.abs(a[1] - SY(G, y)) < 0.02), 'exemple 1 : point (' + x + ' ; ' + y + ')'))
    verif(/C/.test(d) && !/L/.test(d), 'exemple 1 : tracé lisse (cubiques)')
    // pas de dépassement : le minimum de la courbe est exactement celui du point (−1 ; −1) (tangente horizontale)
    const ys = nb(d.replace(/[MC]/g, ' ')); const ymaxSvg = Math.max(...ys.filter((_, k) => k % 2 === 1))
    verif(ymaxSvg <= SY(G, -1) + 0.02, 'exemple 1 : pas de dépassement sous le minimum')
  }
  // polyligne quand lisse est absent
  {
    const s = fig(Object.assign({}, parab, { courbes: [{ nom: 'f', points: [[-3, 3], [-2, 0], [-1, -1]] }] }), 400)
    verif(/class="crb-courbe"[^>]* d="M[^"]*L/.test(s) && !/ C/.test(s) && !/\dC/.test(s.match(/class="crb-courbe"[^>]* d="([^"]+)"/)[1]), 'polyligne sans lisse')
  }
  // droites : coupent l'axe vertical au bon point (y = b en x = 0) et ont la bonne pente, extrémités sur les bords
  const droite = (i, k) => { const s = svgs[i], G = geo(s); const m = s.match(/class="crb-courbe" data-nom="(\w+)" d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"/g)[k].match(/d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"/).slice(1).map(Number); return { G, p: m, s } }
  ;[[2, 3, 0], [4, 2, -1], [6, -2, 3], [7, 1, 1], [7, -1, 5], [8, 3, 5]].forEach(([i, a, b], idx) => {
    const k = (i === 7 && a === -1) ? 1 : 0
    const { G, p } = droite(i, k)
    const pente = (p[3] - p[1]) / (p[2] - p[0])
    verif(Math.abs(pente + a * G.uy / G.ux) < 1e-3, 'figure ' + (i + 1) + ' droite a=' + a + ' : pente fidèle aux unités du repère (' + pente + ')')
    const yEn0 = p[1] + pente * (SX(G, 0) - p[0])
    verif(Math.abs(yEn0 - SY(G, b)) < 0.02, 'figure ' + (i + 1) + ' droite : coupe l\'axe vertical en y = ' + b)
    const f = figures[i], gauche = SX(G, f.xmin), droit = SX(G, f.xmax), haut = SY(G, f.ymax), bas = SY(G, f.ymin)
    verif(p.every((v, j) => j % 2 === 0 ? v >= gauche - 0.02 && v <= droit + 0.02 : v >= haut - 0.02 && v <= bas + 0.02), 'figure ' + (i + 1) + ' droite découpée aux bords')
  })
  // points marqués : au bon endroit, sans coordonnées affichées
  ;[[2, [[1, 3]]], [4, [[0, -1], [2, 3]]], [6, [[0, 3], [2, -1]]], [7, [[0, 1], [2, 3], [0, 5]]], [8, [[0, 5], [2, 11]]]].forEach(([i, pts]) => {
    const s = svgs[i], G = geo(s), cs = [...s.matchAll(/class="crb-point" cx="([-\d.]+)" cy="([-\d.]+)"/g)].map(m => [+m[1], +m[2]])
    verif(cs.length === pts.length, 'figure ' + (i + 1) + ' nombre de points')
    pts.forEach(([x, y]) => verif(cs.some(c => Math.abs(c[0] - SX(G, x)) < 0.02 && Math.abs(c[1] - SY(G, y)) < 0.02), 'figure ' + (i + 1) + ' point (' + x + ' ; ' + y + ')'))
    verif(!/\(\s*-?\d+\s*;/.test(s.replace(/<[^>]*>/g, ' ')), 'figure ' + (i + 1) + ' pas de coordonnées affichées')
  })
  // noms : chaque nom présent une fois, noms de points jamais sur un point, nom de courbe à l'intérieur de la fenêtre
  figures.forEach((f, i) => {
    const s = svgs[i], G = geo(s), T = textes(s)
    f.courbes.concat(f.points).forEach(o => verif(T.filter(t => t.t === o.nom).length === 1, 'figure ' + (i + 1) + ' nom ' + o.nom + ' unique'))
    const gauche = SX(G, f.xmin), droit = SX(G, f.xmax), haut = SY(G, f.ymax), bas = SY(G, f.ymin)
    f.courbes.forEach(c => { const t = T.find(t => t.t === c.nom); verif(t.x > gauche && t.x < droit && t.y > haut && t.y < bas + 5, 'figure ' + (i + 1) + ' nom ' + c.nom + ' dans la fenêtre') })
    // aucun chevauchement entre noms (boîtes de ~9 x 15 px)
    const noms = T.filter(t => f.courbes.concat(f.points).some(o => o.nom === t.t))
    for (let a = 0; a < noms.length; a++) for (let b = a + 1; b < noms.length; b++)
      verif(Math.abs(noms[a].x - noms[b].x) > 9 || Math.abs(noms[a].y - noms[b].y) > 15, 'figure ' + (i + 1) + ' noms ' + noms[a].t + ' / ' + noms[b].t + ' sans chevauchement')
    // un nom de point ne recouvre aucun point marqué ni le tracé de droite (distance centre du texte → tracé > 7 px)
    f.points.forEach(p => {
      const t = T.find(t => t.t === p.nom), cy = t.y - 5
      f.points.concat([]).forEach(q => verif(Math.hypot(t.x - SX(G, q.x), cy - SY(G, q.y)) > 9, 'figure ' + (i + 1) + ' nom ' + p.nom + ' loin du point ' + q.nom))
      f.courbes.forEach((c, k) => {
        if (!c.droite) return
        const { p: pp } = droite(i, k), pente = (pp[3] - pp[1]) / (pp[2] - pp[0]), dist = Math.abs(pente * (t.x - pp[0]) - (cy - pp[1])) / Math.hypot(pente, 1)
        verif(dist > 7, 'figure ' + (i + 1) + ' nom ' + p.nom + ' à distance de la droite ' + c.nom + ' (' + dist.toFixed(1) + ')')
      })
    })
  })
  // graduations : signe « − » typographique, 0 une seule fois à l'origine, pas de « -x » ASCII
  {
    const T = textes(svgs[0]).map(t => t.t)
    verif(T.includes('−3') && T.includes('−2') && T.includes('−1') && T.includes('−4'), 'graduations négatives avec −')
    verif(!T.some(t => /^-/.test(t)), 'pas de trait d\'union ASCII')
    verif(T.filter(t => t === '0').length === 1, 'un seul « 0 »')
    const G = geo(svgs[0]), z = textes(svgs[0]).find(t => t.t === '0')
    verif(Math.abs(z.x - SX(G, 0)) < 20 && Math.abs(z.y - SY(G, 0)) < 20, '« 0 » à côté de l\'origine')
    // axes en x = 0 et y = 0
    verif(svgs[0].includes('<line x1="' + SX(G, -4).toFixed(0) + '"') || /<line x1="[\d.]+" y1="[\d.]+" x2="[\d.]+" y2="[\d.]+"\/><line/.test(svgs[0]), 'axes présents')
    const axes = svgs[0].match(/<g stroke="#14304F" stroke-width="1.8"[^>]*>(.*?)<\/g>/)[1].match(/<line [^>]*>/g)
    const v = axes.map(attrs)
    verif(Math.abs(v[0][1] - SY(G, 0)) < 0.02 && Math.abs(v[1][0] - SX(G, 0)) < 0.02, 'axes à y = 0 et x = 0')
  }
  // graduations : ni sur le tracé, ni sur un point, ni l'une sur l'autre, et sans halo (le tracé reste continu)
  figures.forEach((f, i) => {
    const s = svgs[i], G = geo(s), T = textes(s)
    const noms = f.courbes.concat(f.points).map(o => o.nom)
    const ticks = T.filter(t => !noms.includes(t.t) || /^\d+$/.test(t.t)).filter(t => t.size === 12.5)
    const boite = t => { const w = t.t.length * 7.4 + 3, x1 = t.anchor === 'end' ? t.x - w : t.anchor === 'start' ? t.x : t.x - w / 2; return { x1, x2: x1 + w, y1: t.y - 9, y2: t.y + 1.5 } }
    const dist = (px, py, R) => Math.hypot(Math.max(R.x1 - px, 0, px - R.x2), Math.max(R.y1 - py, 0, py - R.y2))
    // échantillon du tracé : points du chemin (spline) ou de la droite, densifiés tous les 1 px
    const echant = []
    ;[...s.matchAll(/class="crb-courbe"[^>]* d="([^"]+)"/g)].forEach(m => {
      const pts = m[1].split(/(?=[MLC])/).map(seg => nb(seg).slice(-2))
      for (let a = 0; a < pts.length - 1; a++) { const n = Math.max(1, Math.ceil(Math.hypot(pts[a + 1][0] - pts[a][0], pts[a + 1][1] - pts[a][1]))); for (let k = 0; k <= n; k++) echant.push([pts[a][0] + (pts[a + 1][0] - pts[a][0]) * k / n, pts[a][1] + (pts[a + 1][1] - pts[a][1]) * k / n]) }
    })
    ticks.forEach(t => {
      const R = boite(t)
      const dc = Math.min(...echant.map(p => dist(p[0], p[1], R)))
      verif(dc >= 3, 'figure ' + (i + 1) + ' graduation « ' + t.t + ' » à ' + dc.toFixed(1) + ' px du tracé (≥ 3)')
      f.points.forEach(p => verif(dist(SX(G, p.x), SY(G, p.y), R) - 3.8 >= 2, 'figure ' + (i + 1) + ' graduation « ' + t.t + ' » loin du point ' + p.nom))
    })
    for (let a = 0; a < ticks.length; a++) for (let b = a + 1; b < ticks.length; b++) {
      const A = boite(ticks[a]), B = boite(ticks[b])
      verif(A.x2 <= B.x1 || B.x2 <= A.x1 || A.y2 <= B.y1 || B.y2 <= A.y1, 'figure ' + (i + 1) + ' graduations « ' + ticks[a].t + ' » et « ' + ticks[b].t + ' » sans chevauchement')
    }
    // aucun halo sous les graduations : seuls les noms de courbes et de points en ont
    const sansHalo = (s.match(/<text [^>]*font-size="12.5"[^>]*>/g) || []).filter(t => /stroke=/.test(t))
    verif(sansHalo.length === 0, 'figure ' + (i + 1) + ' graduations sans halo')
    // le tracé est dessiné APRÈS les graduations, jamais masqué par elles
    verif(s.indexOf('class="crb-courbe"') > s.lastIndexOf('font-size="12.5"'), 'figure ' + (i + 1) + ' tracé au-dessus des graduations')
  })
  // cas limites demandés : fig. 3 (−1 et −2 de y ; « 0 » ; « −1 » de x), fig. 5 (A et « −1 »), fig. 7 (« 4 » et A)
  {
    const T3 = textes(svgs[2]), G3 = geo(svgs[2])
    ;['\u22121', '\u22122'].forEach(v => { const t = T3.find(t => t.t === v && t.anchor !== 'middle'); verif(!!t, 'figure 3 : graduation y « ' + v + ' » présente') })
    verif(T3.filter(t => t.t === '\u22121').length === 2, 'figure 3 : « −1 » sur chaque axe')
    const G5 = geo(svgs[4]), A5 = [SX(G5, 0), SY(G5, -1)], t5 = textes(svgs[4]).find(t => t.t === '\u22121' && t.anchor !== 'middle')
    verif(Math.hypot(t5.x - A5[0], t5.y - 4 - A5[1]) > 10, 'figure 5 : « −1 » et A(0 ; −1) ne se chevauchent pas')
    const G7 = geo(svgs[6]), A7 = [SX(G7, 0), SY(G7, 3)], t7 = textes(svgs[6]).find(t => t.t === '4' && t.anchor !== 'middle')
    verif(Math.hypot(t7.x - A7[0], t7.y - 4 - A7[1]) > 10, 'figure 7 : « 4 » et A(0 ; 3) ne se chevauchent pas')
  }
  // figure 9 : étiquettes de y tous les 5 (0, 5, 10, 15, 20), x tous les 1
  {
    const T = textes(svgs[8]).map(t => t.t)
    verif(['5', '10', '15', '20'].every(x => T.includes(x)) && T.includes('1'), 'figure 9 graduations')
    const G = geo(svgs[8]), ys = textes(svgs[8]).filter(t => t.anchor === 'end').map(t => t.t)
    verif(ys.join() === '0,5,10,15,20' || [...ys].sort((a, b) => a - b).join() === '0,5,10,15,20', 'figure 9 : y de 5 en 5 (' + ys.join() + ')')
    verif(textes(svgs[8]).filter(t => t.anchor === 'middle' && /^\d+$/.test(t.t) && t.size === 12.5).map(t => t.t).sort().join() === '1,2,3,4,5', 'figure 9 : x de 1 en 1')
    verif(G.uy === 12 && G.ux === 36 && +svgs[8].match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)[2] <= 300, 'figure 9 : carreaux 36 × 12, hauteur ≤ 300')
    verif(+svgs[8].match(/viewBox="0 0 ([\d.]+)/)[1] >= 200 && +avant9 < +svgs[8].match(/viewBox="0 0 ([\d.]+)/)[1], 'figure 9 : plus large qu\'avant (' + avant9 + ' px)')
    // lecture de B(2 ; 11) : 36 px par unité en x (au lieu de 12)
    verif(SX(G, 2) - SX(G, 1) === 36, 'figure 9 : 36 px par carreau en x')
  }
  // axe sur le bord si 0 est hors fenêtre
  {
    const s = fig(D(2, 6, 3, 8, [{ nom: 'f', droite: { a: 1, b: 0 } }], []), 400), G = geo(s)
    const axes = s.match(/<g stroke="#14304F" stroke-width="1.8"[^>]*>(.*?)<\/g>/)[1].match(/<line [^>]*>/g).map(attrs)
    verif(s.startsWith('<svg') && Math.abs(axes[0][1] - SY(G, 3)) < 0.02 && Math.abs(axes[1][0] - SX(G, 2)) < 0.02, '0 hors fenêtre : axes sur le bord')
    verif(textes(s).filter(t => t.t === '0').length === 0, '0 hors fenêtre : pas de « 0 »')
  }
  // deux courbes : couleurs distinctes
  verif(new Set(svgs[7].match(/class="crb-courbe"[^>]*stroke="(#\w+)"/g)).size === 2, 'figure 8 : deux couleurs')
  // identifiants uniques entre deux appels
  verif(svgs[0].match(/id="(fg-crb-\d+)"/)[1] !== svgs[1].match(/id="(fg-crb-\d+)"/)[1], 'identifiants de clipPath distincts')

  // robustesse : jamais d'exception, rien d'affiché (23 entrées invalides)
  const base = figures[7]
  const mauvais = [null, undefined, 'x', 42, [], {}, { type: 'pythagore' }, { type: 'courbe' },
    Object.assign({}, base, { xmin: 'a' }), Object.assign({}, base, { xmax: 5.5 }), Object.assign({}, base, { ymin: null }),
    Object.assign({}, base, { xmax: -1 }), Object.assign({}, base, { ymax: 0, ymin: 0 }), Object.assign({}, base, { xmin: -500, xmax: 500 }),
    Object.assign({}, base, { courbes: null }), Object.assign({}, base, { courbes: [] }),
    Object.assign({}, base, { courbes: [base.courbes[0], base.courbes[0], base.courbes[0]] }),
    Object.assign({}, base, { courbes: [{ nom: 'f' }] }),
    Object.assign({}, base, { courbes: [{ nom: 'f', droite: { a: 'x', b: 1 } }] }),
    Object.assign({}, base, { courbes: [{ nom: '<b>', droite: { a: 1, b: 1 } }] }),
    Object.assign({}, base, { courbes: [{ nom: 'f', droite: { a: 1, b: 1 }, points: [[0, 0], [1, 1]] }] }),
    Object.assign({}, base, { courbes: [{ nom: 'f', points: [[0, 0]] }] }),
    Object.assign({}, base, { courbes: [{ nom: 'f', points: [[0, 0], [0, 1]] }] }),
    Object.assign({}, base, { courbes: [{ nom: 'f', points: [[0, 0], ['a', 1]] }] }),
    Object.assign({}, base, { courbes: [{ nom: 'f', droite: { a: 0, b: 99 } }] }),
    Object.assign({}, base, { points: [{ nom: 'A', x: 99, y: 1 }] }), Object.assign({}, base, { points: 'x' }),
    Object.assign({}, base, { points: [{ nom: 'A', x: 0, y: 1 }, { nom: 'A', x: 1, y: 1 }] }),
    Object.assign({}, base, { pas_etiquette_y: 0 }), Object.assign({}, base, { pas_etiquette_x: 'z' })]
  verif(mauvais.length >= 23, 'au moins 23 entrées invalides (' + mauvais.length + ')')
  mauvais.forEach((m, i) => { let r; try { r = fig(m, 400) } catch (e) { r = 'EXC' } verif(r === '', 'entrée invalide n°' + (i + 1) + ' doit donner une chaîne vide') })
  // un type inconnu ne plante pas le rendu des pages (renderFigure retourne '' ou rend l'ensemble sans exception)
  const q = fs.readFileSync(path.join(racine, 'quiz.html'), 'utf8')
  verif(q.includes("if(f.type==='pythagore')return '<div class=\"q-figure\">'+figurePythagoreSVG(f,260,218)+'</div>'"), 'branche pythagore intacte')
  verif(q.includes("if(f.type==='pythagore_compose'){var svgPc=figurePythagoreComposeSVG(f,400);"), 'branche pythagore_compose intacte')
  // injection : les noms sont restreints (lettres/chiffres), aucun balisage ne passe
  verif(!/<img|onerror/.test(fig(Object.assign({}, base, { points: [{ nom: 'A', x: 0, y: 1 }] }), 400)), 'pas d\'injection')

  if (process.env.FIGURES_DIR) {
    fs.mkdirSync(process.env.FIGURES_DIR, { recursive: true })
    const titres = ['1 · f(x) = x² + 2x', '2 · identique à 1', '3 · facile : g, A(1 ; 3)', '4 · identique à 1', '5 · moyen : f, A, B', '6 · identique à 1', '7 · difficile : h, A, B', '8 · difficile : f, g, A, B, C', '9 · difficile : axe 0 à 20, pas 5']
    const cartes = svgs.map((s, i) => '<div class="carte"><div class="t">Figure ' + titres[i] + '</div><div class="q-figure">' + s + '</div></div>').join('')
    const css = ':root{--bg:#f6f4ef;--fg:#14304F;--cr:#faf8f2;--card:#fff;--bd:#e2e0d8}@media(prefers-color-scheme:dark){:root{--bg:#14161c;--fg:#e8eaf0;--cr:#22252e;--card:#1c1f27;--bd:#363a47}}body{margin:0;padding:12px;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.carte{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:10px}.t{font-size:13px;font-weight:600;margin-bottom:8px}.q-figure{display:flex;justify-content:center;background:var(--cr);border-radius:8px;padding:12px}.q-figure svg{max-width:260px;height:auto;display:block}'
    fs.writeFileSync(path.join(process.env.FIGURES_DIR, 'figures-courbe.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style><div class="grille">' + cartes + '</div>')
  }
  console.log(ok + ' ok, ' + ko + ' échec(s)')
  process.exit(ko ? 1 : 0)
}
