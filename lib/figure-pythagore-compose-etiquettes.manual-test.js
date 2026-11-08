// Test manuel : node lib/figure-pythagore-compose-etiquettes.manual-test.js
// Étiquettes des segments obliques issus du sommet (figurePythagoreComposeSVG) : chaque étiquette est CENTRÉE sur son segment
// (distance du centre au segment < 2 px), texte horizontal, fond blanc, et ne recouvre ni une autre étiquette, ni un nom de point,
// ni un point, ni le carré d'angle droit. Étiquette de la hauteur et cotes de base : inchangées (comparaison avec FIGURES_AVANT).
// Cas : 8 figures réelles de lib/figure-pythagore-compose.manual-test.js ; cas construits ; reconstitution de 3193 ;
// et, s'il est présent, le fichier figures_banque_pythagore_compose.json (figures de la banque : brouillons et actives).
// Variables : FIGURES_SRC=<html> (fonction à tester, défaut quiz.html), FIGURES_AVANT=<html> (version de référence pour les textes inchangés),
// FIGURES_BANQUE=<json> (chemin du fichier de la banque), FIGURES_DIR / FIGURES_NOM (page HTML pour captures).
const fs = require('fs'), path = require('path'), vm = require('vm')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }
const extraire = fichier => { const s = fs.readFileSync(fichier, 'utf8'); const d = s.indexOf('function figurePythagoreComposeSVG('); return s.slice(d, s.indexOf('\n}\n', d) + 3) }
const charger = fichier => { const c = {}; vm.createContext(c); vm.runInContext(extraire(fichier), c); return c.figurePythagoreComposeSVG }
const fichiers = ['quiz.html', 'prof.html', 'examen.html'].map(f => path.join(racine, f))
const src = extraire(process.env.FIGURES_SRC || fichiers[0])
if (!process.env.FIGURES_SRC) verif(fichiers.map(extraire).every(x => x === src), 'les trois copies doivent être identiques')
const fig = charger(process.env.FIGURES_SRC || fichiers[0])
const figAvant = process.env.FIGURES_AVANT ? charger(process.env.FIGURES_AVANT) : null
const { cas: reels } = require('./figure-pythagore-compose.manual-test.js')

const base = { type: 'pythagore_compose', mode: 'hauteur', angle_droit: 'A', unite: 'cm' }
const C = (sommet, pied, points, h, segments, longueurs) => Object.assign({}, base, { sommet, pied, angle_droit: pied, points: points.map(([nom, x]) => ({ nom, x })), h, segments, longueurs })
const construits = [
  C('B', 'A', [['C', -21], ['A', 0], ['D', 16]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '20 cm', AC: '21 cm' }),
  C('B', 'A', [['D', -16], ['A', 0], ['C', 21]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '20 cm', AC: '21 cm' }),
  C('B', 'A', [['A', 0], ['D', 8], ['C', 20]], 15, ['BA', 'BD', 'BC'], { BA: '15 cm', BD: '17 cm', BC: '25 cm' }),
  C('B', 'A', [['C', -20], ['D', -8], ['A', 0]], 15, ['BA', 'BD', 'BC'], { BA: '15 cm', BD: '17 cm', BC: '25 cm' }),
  // figures étroites (hypoténuses presque collées)
  C('B', 'A', [['A', 0], ['D', 5], ['C', 9]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '13 cm', BC: '15 cm' }),
  C('B', 'A', [['C', -9], ['D', -5], ['A', 0]], 12, ['BA', 'BD', 'BC'], { BA: '12 cm', BD: '13 cm', BC: '15 cm' }),
  // 3193 reconstituée d'après la description (B sommet, A pied, points A, D, C ; BD = 20, AB = 12, AC = 21, D proche de A) : le JSON réel est dans le fichier de la banque
  C('B', 'A', [['C', -21], ['A', 0], ['D', 16]], 12, ['BA', 'BD'], { BA: '12 cm', BD: '20 cm', AC: '21 cm' }),
]
const noms = ['construit 1', 'construit 2', 'construit 3', 'construit 4', 'étroit 1', 'étroit 2', '3193 (reconstitué)']
const tous = reels.map((c, i) => ({ nom: 'réel ' + (i + 1), c })).concat(construits.map((c, i) => ({ nom: noms[i], c })))

// figures de la banque (fichier fourni par Marco), format tolérant : tableau ou objet, figure en objet ou en chaîne JSON
const cheminBanque = [process.env.FIGURES_BANQUE, path.join(__dirname, 'figures_banque_pythagore_compose.json'), path.join(racine, 'figures_banque_pythagore_compose.json'), path.join(racine, 'docs', 'figures_banque_pythagore_compose.json')].filter(Boolean).find(p => fs.existsSync(p))
let nbBanque = 0
if (cheminBanque) {
  let donnees = JSON.parse(fs.readFileSync(cheminBanque, 'utf8'))
  const lignes = Array.isArray(donnees) ? donnees.map((d, i) => [d.id !== undefined ? d.id : i, d]) : Object.keys(donnees).map(k => [k, donnees[k]])
  lignes.forEach(([id, d]) => {
    let f = d && typeof d === 'object' && d.figure !== undefined ? d.figure : d
    if (typeof f === 'string') { try { f = JSON.parse(f) } catch (e) { return } }
    if (f && f.type === 'pythagore_compose') { tous.push({ nom: 'banque ' + id + (d && d.statut ? ' (' + d.statut + ')' : ''), c: f, banque: true }); nbBanque++ }
  })
}
module.exports = { tous, fig }

const attr = (l, n) => +l.match(new RegExp(' ' + n + '="([-\\d.]+)"'))[1]
const chev = (A, B) => A.x1 < B.x2 && B.x1 < A.x2 && A.y1 < B.y2 && B.y1 < A.y2
const dSeg = (P, L) => { const dx = L[2] - L[0], dy = L[3] - L[1], u = Math.max(0, Math.min(1, ((P[0] - L[0]) * dx + (P[1] - L[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(P[0] - L[0] - u * dx, P[1] - L[1] - u * dy) }
const analyser = s => {
  const lignes = (s.match(/<line [^>]*stroke-width="2.5"[^>]*>/g) || []).map(l => [attr(l, 'x1'), attr(l, 'y1'), attr(l, 'x2'), attr(l, 'y2')])
  const textes = (s.match(/<text [^>]*>[^<]*<\/text>/g) || []).map(t => { const x = attr(t, 'x'), y = attr(t, 'y'), a = t.match(/text-anchor="(\w+)"/)[1], size = +t.match(/font-size="([\d.]+)"/)[1], tt = t.replace(/<[^>]*>/g, ''), w = tt.length * (size >= 15 ? 9.5 : 7.4) + 2, x1 = a === 'end' ? x - w : a === 'start' ? x : x - w / 2; return { t: tt, x, y, size, R: { x1, x2: x1 + w, y1: y - size * 0.8, y2: y + 3 }, brut: t } })
  const paires = [...s.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)" rx="3" fill="#fff"\/>(<text [^>]*>[^<]*<\/text>)/g)].map(m => ({ R: { x1: +m[1], y1: +m[2], x2: +m[1] + +m[3], y2: +m[2] + +m[4] }, texte: m[5].replace(/<[^>]*>/g, ''), brut: m[5] }))
  const [W0, H0] = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number)
  const carre = s.match(/<polyline points="([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+)"/)
  return { lignes, base: lignes[0], segs: lignes.slice(1), textes, paires, W0, H0, carre: carre && { x1: Math.min(+carre[1], +carre[5]), x2: Math.max(+carre[1], +carre[5]), y1: +carre[4], y2: +carre[2] } }
}

if (require.main === module) {
  tous.forEach(({ nom, c, banque }) => {
    const s = fig(c, 400)
    if (s === '') { verif(false, nom + ' : la figure ne s\'affiche pas'); return }
    verif(s.startsWith('<svg') && s.endsWith('</svg>'), nom + ' rendu')
    verif(!/NaN|undefined|Infinity/.test(s), nom + ' pas de NaN')
    const A = analyser(s)
    const obliques = c.segments.map((sg, i) => ({ sg, i, L: A.segs[i], lib: c.longueurs && c.longueurs[sg] })).filter(o => o.lib !== undefined && Math.abs(o.L[0] - o.L[2]) >= 1)
    verif(A.paires.length === obliques.length, nom + ' : une étiquette sur fond blanc par segment oblique étiqueté (' + A.paires.length + '/' + obliques.length + ')')
    // 1. centrée sur son segment (< 2 px), texte horizontal (aucune rotation), fond blanc sous le texte
    obliques.forEach(o => {
      const ok1 = A.paires.some(p => p.texte === o.lib && dSeg([(p.R.x1 + p.R.x2) / 2, (p.R.y1 + p.R.y2) / 2], o.L) < 2)
      verif(ok1, nom + ' : « ' + o.lib + ' » (' + o.sg + ') centrée sur son segment (< 2 px)')
    })
    verif(!/rotate\(|transform=/.test(s), nom + ' : texte horizontal (aucune rotation)')
    // 2. aucune étiquette oblique ne recouvre un autre texte (étiquette, nom de point, cote), un point, ni le carré d'angle droit
    A.paires.forEach((p, k) => {
      const centre = [(p.R.x1 + p.R.x2) / 2, (p.R.y1 + p.R.y2) / 2 + 5]
      A.textes.forEach(x => { if (x.t === p.texte && Math.hypot(x.x - centre[0], x.y - centre[1]) < 0.6) return; verif(!chev(p.R, x.R), nom + ' : « ' + p.texte + ' » ne recouvre pas le texte « ' + x.t + ' »') })
      A.paires.forEach((q, j) => { if (j !== k) verif(!chev(p.R, q.R), nom + ' : « ' + p.texte + ' » et « ' + q.texte + ' » ne se chevauchent pas') })
      ;(s.match(/<circle [^>]*>/g) || []).forEach(ci => { const cx = attr(ci, 'cx'), cy = attr(ci, 'cy'); verif(!chev(p.R, { x1: cx - 3.5, x2: cx + 3.5, y1: cy - 3.5, y2: cy + 3.5 }), nom + ' : « ' + p.texte + ' » ne recouvre pas un point') })
      if (A.carre) verif(!chev(p.R, A.carre), nom + ' : « ' + p.texte + ' » ne recouvre pas le carré d\'angle droit')
      verif(p.R.x1 >= 0 && p.R.x2 <= A.W0 && p.R.y1 >= 0 && p.R.y2 <= A.H0, nom + ' : « ' + p.texte + ' » dans la figure')
    })
    // 3. étiquette de la hauteur et cotes de base inchangées (tous les textes hors étiquettes obliques) par rapport à FIGURES_AVANT
    if (figAvant) {
      const sa = figAvant(c, 400), Aa = analyser(sa)
      // mêmes contenus de texte qu'avant (hauteur, cotes de base, noms de points, étiquettes obliques)
      const contenus = L => L.map(b => b.replace(/<[^>]*>/g, '')).sort().join('|')
      verif(contenus(Aa.textes.map(x => x.brut)) === contenus(A.textes.map(x => x.brut)), nom + ' : mêmes textes qu\'avant (hauteur, cotes, noms)')
      // position inchangée de tout texte qui n'est pas une étiquette oblique : l'élément <text> est identique caractère pour caractère
      const nonObl = A.textes.filter(x => !A.paires.some(p => p.brut === x.brut))
      const idsAvant = new Set(Aa.textes.map(x => x.brut))
      const nouveaux = nonObl.filter(x => !idsAvant.has(x.brut))
      const obliqueAvant = Aa.textes.filter(x => !new Set(A.textes.map(y => y.brut)).has(x.brut))
      verif(nouveaux.length === 0, nom + ' : aucun texte de hauteur, de cote ou de nom de point n\'a bougé (' + nouveaux.map(x => x.t).join(', ') + ')')
      verif(obliqueAvant.length <= obliques.length, nom + ' : seules les étiquettes obliques ont changé')
    }
  })
  if (!cheminBanque) console.log('NOTE : figures_banque_pythagore_compose.json introuvable : les figures de la banque ne sont pas testées (FIGURES_BANQUE=<fichier> ou lib/figures_banque_pythagore_compose.json).')
  else console.log('Figures de la banque testées : ' + nbBanque + ' (' + cheminBanque + ')')
  // champs facultatifs absents : s'affiche quand même ; type invalide : jamais d'exception
  ;[null, undefined, 'x', 42, {}, { type: 'pythagore_compose' }, Object.assign({}, construits[0], { points: null }), Object.assign({}, construits[0], { segments: ['BZ'] })].forEach((m, i) => { let r; try { r = fig(m, 400) } catch (e) { r = 'EXC' } verif(r === '', 'entrée invalide n°' + (i + 1) + ' : chaîne vide') })

  if (process.env.FIGURES_DIR) {
    fs.mkdirSync(process.env.FIGURES_DIR, { recursive: true })
    const cartes = tous.map(({ nom, c }) => '<div class="carte"><div class="t">' + nom + '</div><div class="q-figure">' + fig(c, 400) + '</div></div>').join('')
    const css = ':root{--bg:#f6f4ef;--fg:#14304F;--cr:#faf8f2;--card:#fff;--bd:#e2e0d8}@media(prefers-color-scheme:dark){:root{--bg:#14161c;--fg:#e8eaf0;--cr:#22252e;--card:#1c1f27;--bd:#363a47}}body{margin:0;padding:12px;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}.grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.carte{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:10px}.t{font-size:13px;font-weight:600;margin-bottom:8px}.q-figure{display:flex;justify-content:center;background:var(--cr);border-radius:8px;padding:12px}.q-figure svg{max-width:400px;height:auto;display:block}'
    fs.writeFileSync(path.join(process.env.FIGURES_DIR, process.env.FIGURES_NOM || 'figures.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style><div class="grille">' + cartes + '</div>')
  }
  console.log(ok + ' ok, ' + ko + ' échec(s)')
  process.exit(ko ? 1 : 0)
}
