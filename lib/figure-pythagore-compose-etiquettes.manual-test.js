// Test manuel : node lib/figure-pythagore-compose-etiquettes.manual-test.js
// Étiquettes des segments issus du sommet (figurePythagoreComposeSVG) : chaque étiquette est collée à son segment
// (à son milieu, côté du pied de la hauteur si la place le permet) et ne croise aucun autre segment.
// Cas : les 8 figures réelles de lib/figure-pythagore-compose.manual-test.js + cas construits (deux hypothénuses du même côté, dessin retourné).
// Avec FIGURES_DIR=<dossier> écrit en plus une page HTML (captures) ; avec FIGURES_SRC=<fichier html> utilise la fonction de ce fichier (comparaison avant/après).
const fs = require('fs'), path = require('path'), vm = require('vm')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }
const extraire = fichier => { const s = fs.readFileSync(fichier, 'utf8'); const d = s.indexOf('function figurePythagoreComposeSVG('); return s.slice(d, s.indexOf('\n}\n', d) + 3) }
const fichiers = ['quiz.html', 'prof.html', 'examen.html'].map(f => path.join(racine, f))
const src = extraire(process.env.FIGURES_SRC || fichiers[0])
if (!process.env.FIGURES_SRC) verif(fichiers.map(extraire).every(x => x === src), 'les trois copies doivent être identiques')
const ctx = {}; vm.createContext(ctx); vm.runInContext(src, ctx)
const fig = ctx.figurePythagoreComposeSVG
const { cas: reels } = require('./figure-pythagore-compose.manual-test.js')

const base = { type: 'pythagore_compose', mode: 'hauteur', angle_droit: 'A', unite: 'cm' }
const C = (sommet, pied, points, h, segments, longueurs) => Object.assign({}, base, { sommet, pied, angle_droit: pied, points: points.map(([nom, x]) => ({ nom, x })), h, segments, longueurs })
const construits = [
  // sommet B au-dessus de A ; deux hypoténuses BD et BC de part et d'autre de la hauteur (cas signalé), puis dessin retourné
  C('B', 'A', [['C', -21], ['A', 0], ['D', 16]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '20 cm', AC: '21 cm' }),
  C('B', 'A', [['D', -16], ['A', 0], ['C', 21]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '20 cm', AC: '21 cm' }),
  // deux hypoténuses du même côté de la hauteur : la plus proche ne doit pas porter l'étiquette de la plus éloignée
  C('B', 'A', [['A', 0], ['D', 8], ['C', 20]], 15, ['BA', 'BD', 'BC'], { BA: '15 cm', BD: '17 cm', BC: '25 cm' }),
  C('B', 'A', [['C', -20], ['D', -8], ['A', 0]], 15, ['BA', 'BD', 'BC'], { BA: '15 cm', BD: '17 cm', BC: '25 cm' }),
]
// Limite connue : figure très étroite (87 px de large pour 116 de haut, hypoténuses presque collées) : aucun emplacement n'est sans ambiguïté
// sans changer l'échelle de la figure. On garantit seulement que les étiquettes ne se recouvrent pas et restent dans la figure.
const etroits = [
  C('B', 'A', [['A', 0], ['D', 5], ['C', 9]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '13 cm', BC: '15 cm' }),
  C('B', 'A', [['C', -9], ['D', -5], ['A', 0]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '13 cm', BC: '15 cm' }),
]
const tous = reels.map((c, i) => ({ nom: 'réel ' + (i + 1), c })).concat(construits.map((c, i) => ({ nom: 'construit ' + (i + 1), c })), etroits.map((c, i) => ({ nom: 'étroit ' + (i + 1) + ' (limite connue)', c, etroit: true })))
module.exports = { tous, fig }

const nb = t => (t.match(/-?\d+(?:\.\d+)?/g) || []).map(Number)
const attr = (l, n) => +l.match(new RegExp(' ' + n + '="([-\\d.]+)"'))[1]
if (require.main === module) {
  tous.forEach(({ nom, c, etroit }) => {
    const s = fig(c, 400)
    verif(s.startsWith('<svg'), nom + ' rendu')
    verif(!/NaN|undefined|Infinity/.test(s), nom + ' pas de NaN')
    // segments tracés (trait 2,5) : le premier est la base, les suivants suivent c.segments
    const lignes = (s.match(/<line [^>]*stroke-width="2.5"[^>]*>/g) || []).map(l => [attr(l, 'x1'), attr(l, 'y1'), attr(l, 'x2'), attr(l, 'y2')])
    const baseL = lignes[0], segs = lignes.slice(1)
    const echant = L => { const n = Math.max(2, Math.ceil(Math.hypot(L[2] - L[0], L[3] - L[1]))); return Array.from({ length: n + 1 }, (_, k) => [L[0] + (L[2] - L[0]) * k / n, L[1] + (L[3] - L[1]) * k / n]) }
    const dist = (L, R) => Math.min(...echant(L).map(p => Math.hypot(Math.max(R.x1 - p[0], 0, p[0] - R.x2), Math.max(R.y1 - p[1], 0, p[1] - R.y2))))
    // textes : boîte (anchor, largeur ≈ 7,4 px par caractère)
    const textes = (s.match(/<text [^>]*>[^<]*<\/text>/g) || []).map(t => { const x = attr(t, 'x'), y = attr(t, 'y'), a = t.match(/text-anchor="(\w+)"/)[1], tt = t.replace(/<[^>]*>/g, ''), w = tt.length * 7.4 + 2; const x1 = a === 'end' ? x - w : a === 'start' ? x : x - w / 2; return { t: tt, R: { x1, x2: x1 + w, y1: y - 11, y2: y + 3 } } })
    c.segments.forEach((sg, i) => {
      const lib = c.longueurs[sg]; if (lib === undefined) return
      const pied = c.points.find(p => p.nom === c.pied)
      const verticale = Math.abs(segs[i][0] - segs[i][2]) < 1
      if (verticale || etroit) return // étiquette de la hauteur : comportement inchangé (non testé ici)
      const candidats = textes.filter(x => x.t === lib)
      // au moins une occurrence du texte est collée à CE segment (la plus proche de tous) et à ≥ 2 px de tout autre segment et de la base
      const bon = candidats.some(x => {
        const d = segs.map(L => dist(L, x.R))
        const mien = d[i], autres = d.filter((_, j) => j !== i)
        return mien <= 8 && Math.min(...autres) >= 2 && dist(baseL, x.R) >= 2
      })
      verif(bon, nom + ' : étiquette « ' + lib + ' » (' + sg + ') proche de son segment et sans croiser un autre segment')
      // côté du pied : le centre du texte est entre le segment et la hauteur quand la place le permet (non exigé si un autre segment gêne)
    })
    // jamais deux étiquettes (segments, base, noms) qui se recouvrent, et tout reste dans la figure
    const W0 = +s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)[1], H0 = +s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)[2]
    textes.forEach(x => verif(x.R.x1 >= 0 && x.R.x2 <= W0 && x.R.y1 >= 0 && x.R.y2 <= H0, nom + ' : « ' + x.t + ' » dans la figure'))
    const sl = c.segments.filter(sg => c.longueurs[sg] !== undefined).map(sg => c.longueurs[sg])
    const tl = textes.filter(x => sl.includes(x.t))
    for (let a = 0; a < tl.length; a++) for (let b = a + 1; b < tl.length; b++) { const A = tl[a].R, B = tl[b].R; verif(A.x2 <= B.x1 || B.x2 <= A.x1 || A.y2 <= B.y1 || B.y2 <= A.y1, nom + ' : « ' + tl[a].t + ' » et « ' + tl[b].t + ' » ne se recouvrent pas') }
    // étiquettes de base (cotes) : toujours présentes, comportement inchangé
    Object.keys(c.longueurs).forEach(k => { if (!c.segments.includes(k)) verif(s.includes('>' + c.longueurs[k] + '<'), nom + ' : cote ' + k + ' présente') })
    // halo blanc autour des étiquettes de segment
    c.segments.forEach(sg => { const lib = c.longueurs[sg]; if (lib !== undefined) verif(new RegExp('stroke="#fff"[^>]*>' + lib.replace(/[?]/g, '\\?') + '<').test(s), nom + ' : halo sur « ' + lib + ' »') })
  })
  // étiquette du segment éloigné ≠ étiquette du segment proche : jamais sur le mauvais segment (cas construits 3 et 4)
  ;[2, 3].forEach(k => {
    const s = fig(construits[k], 400)
    const lignes = (s.match(/<line [^>]*stroke-width="2.5"[^>]*>/g) || []).map(l => [attr(l, 'x1'), attr(l, 'y1'), attr(l, 'x2'), attr(l, 'y2')]).slice(1)
    // distance de la BOÎTE du texte (et non de son centre : l'étiquette est large) à chaque segment
    const boite = t => { const m = s.match(new RegExp('<text x="([-\\d.]+)" y="([-\\d.]+)" text-anchor="(\\w+)"[^>]*>' + t + '<')); const x = +m[1], y = +m[2], w = t.length * 7.4 + 2, x1 = m[3] === 'end' ? x - w : m[3] === 'start' ? x : x - w / 2; return { x1, x2: x1 + w, y1: y - 11, y2: y + 3 } }
    const dp = (R, L) => { const n = Math.max(2, Math.ceil(Math.hypot(L[2] - L[0], L[3] - L[1]))); return Math.min(...Array.from({ length: n + 1 }, (_, i) => [L[0] + (L[2] - L[0]) * i / n, L[1] + (L[3] - L[1]) * i / n]).map(p => Math.hypot(Math.max(R.x1 - p[0], 0, p[0] - R.x2), Math.max(R.y1 - p[1], 0, p[1] - R.y2)))) }
    verif(dp(boite('17 cm'), lignes[1]) < dp(boite('17 cm'), lignes[2]), 'construit ' + (k + 1) + ' : « 17 cm » plus proche de BD que de BC')
    verif(dp(boite('25 cm'), lignes[2]) < dp(boite('25 cm'), lignes[1]), 'construit ' + (k + 1) + ' : « 25 cm » plus proche de BC que de BD')
  })
  if (process.env.FIGURES_DIR) {
    fs.mkdirSync(process.env.FIGURES_DIR, { recursive: true })
    const cartes = tous.map(({ nom, c }) => '<div class="carte"><div class="t">' + nom + '</div><div class="q-figure">' + fig(c, 400) + '</div></div>').join('')
    const css = ':root{--bg:#f6f4ef;--fg:#14304F;--cr:#faf8f2;--card:#fff;--bd:#e2e0d8}@media(prefers-color-scheme:dark){:root{--bg:#14161c;--fg:#e8eaf0;--cr:#22252e;--card:#1c1f27;--bd:#363a47}}body{margin:0;padding:12px;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.carte{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:10px}.t{font-size:13px;font-weight:600;margin-bottom:8px}.q-figure{display:flex;justify-content:center;background:var(--cr);border-radius:8px;padding:12px}.q-figure svg{max-width:400px;height:auto;display:block}'
    fs.writeFileSync(path.join(process.env.FIGURES_DIR, process.env.FIGURES_NOM || 'figures.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style><div class="grille">' + cartes + '</div>')
  }
  console.log(ok + ' ok, ' + ko + ' échec(s)')
  process.exit(ko ? 1 : 0)
}
