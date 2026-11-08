// Test manuel : node lib/figure-pythagore-compose-etiquettes.manual-test.js
// Étiquettes des segments obliques issus du sommet (figurePythagoreComposeSVG) : chaque étiquette est CENTRÉE sur son segment
// (distance du centre au segment < 2 px), texte horizontal, fond blanc, et ne recouvre ni une autre étiquette, ni un nom de point,
// ni un point, ni le carré d'angle droit.
// Étiquette de la hauteur : si les points de la base sont d'un seul côté du pied, elle est de l'AUTRE côté de la verticale, à mi-hauteur,
// à 8 px de la ligne, sur fond blanc, sans toucher un segment ni une autre étiquette, et reste dans la figure ; points des deux côtés : inchangée.
// Étiquette d'un segment partiel de la base (AD, DC…) : collée à son segment (à moins de 20 px de la ligne de base, centrée horizontalement sur le
// segment à ±5 px) quand le segment est assez long (≥ 46 px), sans rien chevaucher ; cote totale (plusieurs portions) à sa place.
// Noms de points et étiquettes obliques : comparés à FIGURES_AVANT.
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
  // 3194 reconstituée d'après la description (B sommet, A pied, D à −14, C à −36, AB = 15 cm, BD = 17 cm), puis dessin retourné : points d'un seul côté du pied
  C('B', 'A', [['C', -36], ['D', -14], ['A', 0]], 15, ['BA', 'BD'], { BA: '15 cm', BD: '17 cm' }),
  C('B', 'A', [['A', 0], ['D', 14], ['C', 36]], 15, ['BA', 'BD'], { BA: '15 cm', BD: '17 cm' }),
  // D proche de A, points d'un seul côté du pied (BD = 13 cm), puis dessin retourné ; hauteur « ? »
  C('B', 'A', [['C', -21], ['D', -5], ['A', 0]], 12, ['BA', 'BD'], { BA: '12 cm', BD: '13 cm', AC: '21 cm' }),
  C('B', 'A', [['A', 0], ['D', 5], ['C', 21]], 12, ['BA', 'BD'], { BA: '12 cm', BD: '13 cm', AC: '21 cm' }),
  C('B', 'A', [['A', 0], ['D', 5], ['C', 21]], 12, ['BA', 'BD'], { BA: '?', BD: '13 cm', AC: '21 cm' }),
  // 3191 reconstituée d'après la description (B sommet, A pied, D à −9, C à −16 ; AB = 12 cm, AD = 5 cm, cote AC = 16 cm), puis dessin retourné
  C('B', 'A', [['C', -16], ['D', -9], ['A', 0]], 12, ['BA', 'BD'], { BA: '12 cm', AD: '5 cm', AC: '16 cm' }),
  C('B', 'A', [['A', 0], ['D', 9], ['C', 16]], 12, ['BA', 'BD'], { BA: '12 cm', AD: '5 cm', AC: '16 cm' }),
  // segment partiel court (AD = 48 px) : placé sous la ligne ; très court (19 px) : sur la rangée des noms
  C('B', 'A', [['A', 0], ['D', 5], ['C', 9]], 12, ['BA', 'BD'], { BA: '12 cm', BD: '13 cm', AD: '5 cm' }),
  C('B', 'A', [['A', 0], ['D', 2], ['C', 9]], 12, ['BA', 'BC'], { BA: '12 cm', BC: '15 cm', AD: '2 cm' }),
  // plusieurs segments partiels et cote totale
  C('B', 'C', [['A', -20], ['H', -8], ['C', 0], ['D', 9]], 12, ['BA', 'BC', 'BD'], { BC: '12 cm', AH: '12 cm', HC: '8 cm', CD: '9 cm', AD: '17 cm' }),
]
const noms = ['construit 1', 'construit 2', 'construit 3', 'construit 4', 'étroit 1', 'étroit 2', '3193 (reconstitué)', '3194 (reconstitué)', '3194 retourné', 'D proche de A', 'D proche de A retourné', 'hauteur « ? »', '3191 (reconstitué)', '3191 retourné', 'segment partiel court', 'segment partiel très court', 'plusieurs segments partiels']
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
const ecartRect = (L, R) => Math.min(...Array.from({ length: 61 }, (_, m) => [L[0] + (L[2] - L[0]) * m / 60, L[1] + (L[3] - L[1]) * m / 60]).map(q => Math.hypot(Math.max(R.x1 - q[0], 0, q[0] - R.x2), Math.max(R.y1 - q[1], 0, q[1] - R.y2))))
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
    // hauteur : segment vertical ; étiquette extérieure (fond blanc) quand les points de la base sont d'un seul côté du pied
    const iv = A.segs.findIndex(L => Math.abs(L[0] - L[2]) < 1), vert = A.segs[iv], ax = vert && vert[0]
    const hautLib = iv >= 0 ? (c.longueurs || {})[c.segments[iv]] : undefined
    const xp = c.points.find(p => p.nom === c.pied).x, gaucheDuPied = c.points.some(p => p.x < xp), droiteDuPied = c.points.some(p => p.x > xp)
    const unSeulCote = !(gaucheDuPied && droiteDuPied)
    const hautPair = hautLib === undefined ? undefined : A.paires.find(p => p.texte === hautLib && (Math.abs(p.R.x1 - (ax + 5)) < 0.3 || Math.abs(p.R.x2 - (ax - 5)) < 0.3))
    // étiquettes de portions simples posées SUR la ligne de base (fond blanc, centre à moins de 3 px de la ligne)
    const basePairs = A.paires.filter(p => p !== hautPair && Math.abs((p.R.y1 + p.R.y2) / 2 - A.base[1]) < 3)
    A.paires = A.paires.filter(p => p !== hautPair && !basePairs.includes(p))
    const toutesPaires = A.paires.concat(hautPair ? [hautPair] : [], basePairs)
    // segments partiels de la base : clés « deux noms de points consécutifs », positions des points lues sur les disques de la ligne de base
    const ptsTries = c.points.slice().sort((u, v) => u.x - v.x).map(p => p.nom)
    const cxs = [...s.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="3.5"/g)].filter(m => Math.abs(+m[2] - A.base[1]) < 0.2).map(m => +m[1]).sort((u, v) => u - v)
    const partiels = Object.keys(c.longueurs || {}).filter(k => k.length === 2 && ptsTries.includes(k[0]) && ptsTries.includes(k[1]) && k[0] !== k[1] && Math.abs(ptsTries.indexOf(k[0]) - ptsTries.indexOf(k[1])) === 1)
      .map(k => { const i = Math.min(ptsTries.indexOf(k[0]), ptsTries.indexOf(k[1])); return { k, lib: c.longueurs[k], x1: cxs[i], x2: cxs[i + 1] } })
    const nonPair = A.textes.filter(x => !toutesPaires.some(p => p.brut === x.brut))
    partiels.forEach(q => {
      const mid = (q.x1 + q.x2) / 2, longueur = q.x2 - q.x1
      // l'étiquette : soit une paire fond blanc posée sur la ligne, soit un texte sous la ligne ou sur la rangée des noms
      const cand = basePairs.filter(p => p.texte === q.lib).map(p => ({ cx: (p.R.x1 + p.R.x2) / 2, cy: (p.R.y1 + p.R.y2) / 2, R: p.R })).concat(nonPair.filter(x => x.t === q.lib && x.y < A.base[1] + 30).map(x => ({ cx: (x.R.x1 + x.R.x2) / 2, cy: x.y - 5, R: x.R })))
      verif(cand.length > 0, nom + ' : étiquette du segment partiel ' + q.k + ' « ' + q.lib + ' » présente près de la ligne de base')
      if (longueur >= 46) verif(cand.some(z => Math.abs(z.cx - mid) <= 5 && Math.abs(z.cy - A.base[1]) < 20), nom + ' : « ' + q.lib + ' » (' + q.k + ') centrée sur son segment (±5 px) et à moins de 20 px de la ligne de base')
      // rien ne la chevauche : autres textes, disques, carré d'angle droit, autres étiquettes sur fond blanc
      cand.forEach(z => {
        A.textes.forEach(x => { if (x.R === z.R || (x.R.x1 === z.R.x1 && x.R.y1 === z.R.y1) || toutesPaires.some(p => p.brut === x.brut && p.R === z.R)) return; if (cand.some(w => w.R === x.R)) return; verif(!chev(z.R, x.R), nom + ' : « ' + q.lib + ' » (' + q.k + ') ne recouvre pas le texte « ' + x.t + ' »') })
        toutesPaires.forEach(p => { if (p.R !== z.R) verif(!chev(z.R, p.R), nom + ' : « ' + q.lib + ' » (' + q.k + ') ne recouvre pas l\'étiquette « ' + p.texte + ' »') })
        ;(s.match(/<circle [^>]*>/g) || []).forEach(ci => { const cx = attr(ci, 'cx'), cy = attr(ci, 'cy'); verif(!chev(z.R, { x1: cx - 3.5, x2: cx + 3.5, y1: cy - 3.5, y2: cy + 3.5 }), nom + ' : « ' + q.lib + ' » (' + q.k + ') ne recouvre pas un point') })
        if (A.carre) verif(!chev(z.R, A.carre), nom + ' : « ' + q.lib + ' » (' + q.k + ') ne recouvre pas le carré d\'angle droit')
        verif(z.R.x1 >= 0 && z.R.x2 <= A.W0 && z.R.y2 <= A.H0, nom + ' : « ' + q.lib + ' » (' + q.k + ') dans la figure')
      })
    })
    verif(!!hautPair === (hautLib !== undefined && unSeulCote), nom + ' : étiquette de hauteur sur fond blanc seulement si les points sont d\'un seul côté du pied')
    if (hautPair) {
      const centre = [(hautPair.R.x1 + hautPair.R.x2) / 2, (hautPair.R.y1 + hautPair.R.y2) / 2]
      verif(gaucheDuPied ? centre[0] > ax : centre[0] < ax, nom + ' : hauteur « ' + hautLib + ' » de l\'autre côté de la verticale que les points de la base')
      verif(Math.abs(centre[1] - (vert[1] + vert[3]) / 2) < 1.5, nom + ' : hauteur centrée verticalement au milieu de la hauteur')
      const tx = A.textes.find(x => x.brut === hautPair.brut)
      verif(Math.abs(Math.abs(tx.x - ax) - 8) < 0.2 && tx.t === hautLib && !/rotate/.test(tx.brut), nom + ' : hauteur à 8 px de la ligne, texte horizontal')
      A.segs.forEach((L, k) => verif(ecartRect(L, hautPair.R) >= 2, nom + ' : la hauteur ne touche aucun segment (' + c.segments[k] + ')'))
    }
    const obliques = c.segments.map((sg, i) => ({ sg, i, L: A.segs[i], lib: c.longueurs && c.longueurs[sg] })).filter(o => o.lib !== undefined && Math.abs(o.L[0] - o.L[2]) >= 1)
    verif(A.paires.length === obliques.length, nom + ' : une étiquette sur fond blanc par segment oblique étiqueté (' + A.paires.length + '/' + obliques.length + ')')
    // 1. centrée sur son segment (< 2 px), texte horizontal (aucune rotation), fond blanc sous le texte
    obliques.forEach(o => {
      const ok1 = A.paires.some(p => p.texte === o.lib && dSeg([(p.R.x1 + p.R.x2) / 2, (p.R.y1 + p.R.y2) / 2], o.L) < 2)
      verif(ok1, nom + ' : « ' + o.lib + ' » (' + o.sg + ') centrée sur son segment (< 2 px)')
    })
    verif(!/rotate\(|transform=/.test(s), nom + ' : texte horizontal (aucune rotation)')
    // 2. aucune étiquette oblique ne recouvre un autre texte (étiquette, nom de point, cote), un point, ni le carré d'angle droit
    toutesPaires.forEach((p, k) => {
      A.textes.forEach(x => { if (x.brut === p.brut) return; verif(!chev(p.R, x.R), nom + ' : « ' + p.texte + ' » ne recouvre pas le texte « ' + x.t + ' »') })
      toutesPaires.forEach((q, j) => { if (j !== k) verif(!chev(p.R, q.R), nom + ' : « ' + p.texte + ' » et « ' + q.texte + ' » ne se chevauchent pas') })
      ;(s.match(/<circle [^>]*>/g) || []).forEach(ci => { const cx = attr(ci, 'cx'), cy = attr(ci, 'cy'); verif(!chev(p.R, { x1: cx - 3.5, x2: cx + 3.5, y1: cy - 3.5, y2: cy + 3.5 }), nom + ' : « ' + p.texte + ' » ne recouvre pas un point') })
      if (A.carre) verif(!chev(p.R, A.carre), nom + ' : « ' + p.texte + ' » ne recouvre pas le carré d\'angle droit')
      verif(p.R.x1 >= 0 && p.R.x2 <= A.W0 && p.R.y1 >= 0 && p.R.y2 <= A.H0, nom + ' : « ' + p.texte + ' » dans la figure')
    })
    // 3. étiquette de la hauteur et cotes de base inchangées (tous les textes hors étiquettes obliques) par rapport à FIGURES_AVANT
    if (figAvant) {
      // l'élargissement de la zone de dessin décale tout d'un même écart : on compare les positions RELATIVES au pied de la hauteur
      const sa = figAvant(c, 400), Aa = analyser(sa), va = Aa.segs.find(L => Math.abs(L[0] - L[2]) < 1), axA = va && va[0]
      const sigT = (x, a0) => x.t + '|' + (x.x - a0).toFixed(1) + '|' + x.y + '|' + x.size
      const sigP = (p, a0) => p.texte + '|' + (p.R.x1 - a0).toFixed(1) + '|' + p.R.y1 + '|' + (p.R.x2 - p.R.x1).toFixed(1)
      const estHaut = x => hautPair && x.brut === hautPair.brut
      // cotes de base et noms de points : identiques ; étiquette de la hauteur : identique si points des deux côtés
      const avantT = Aa.textes.filter(x => !Aa.paires.some(p => p.brut === x.brut)).map(x => sigT(x, axA)).sort()
      const apresT = A.textes.filter(x => !toutesPaires.some(p => p.brut === x.brut)).map(x => sigT(x, ax)).sort()
      // les étiquettes de segments partiels de la base ont changé de place (c'est l'objet du changement) : on les retire des deux listes
      // (repérées par leur texte ET leur hauteur sous la ligne de base : la hauteur ou une oblique peuvent porter le même texte)
      const sousBase = (z, a0, yb) => { const y = +z.split('|')[2]; return y > yb + 8 && y < yb + 80 }
      partiels.forEach(q => { const i = avantT.findIndex(z => z.startsWith(q.lib + '|') && sousBase(z, axA, Aa.base[1])); if (i >= 0) avantT.splice(i, 1); const j = apresT.findIndex(z => z.startsWith(q.lib + '|') && sousBase(z, ax, A.base[1])); if (j >= 0) apresT.splice(j, 1) })
      verif(avantT.join('#') === apresT.join('#'), nom + ' : cotes de base, noms de points et étiquette de la hauteur inchangés (positions relatives au pied)')
      // étiquettes obliques : mêmes positions relatives, même fond
      // seule exception : l'ancienne étiquette de hauteur, à l'intérieur, pouvait pousser une étiquette oblique hors de son milieu ; maintenant qu'elle est à l'extérieur,
      // l'étiquette oblique revient alors au MILIEU de son segment (jamais ailleurs)
      const sigAvant = new Set(Aa.paires.map(p => sigP(p, axA)))
      const nbDeplacees = A.paires.filter(p => !sigAvant.has(sigP(p, ax))).length
      A.paires.forEach(p => {
        if (sigAvant.has(sigP(p, ax))) return
        const ctr = [(p.R.x1 + p.R.x2) / 2, (p.R.y1 + p.R.y2) / 2]
        const L = A.segs.filter(L0 => Math.abs(L0[0] - L0[2]) >= 1).sort((u, v) => dSeg(ctr, u) - dSeg(ctr, v))[0]
        verif((!!hautPair || basePairs.length > 0) && Math.hypot(ctr[0] - (L[0] + L[2]) / 2, ctr[1] - (L[1] + L[3]) / 2) < 0.6, nom + ' : « ' + p.texte + ' » ne change de place que pour revenir au milieu de son segment')
      })
      verif(Aa.paires.length === A.paires.length + (hautPair ? 1 : 0), nom + ' : même nombre d\'étiquettes sur fond blanc qu\'avant, hors segments partiels (' + nbDeplacees + ' oblique(s) déplacée(s))')
      // échelle des longueurs inchangée : écart entre le pied et chaque autre extrémité de segment
      verif(A.segs.map(L => (L[2] - L[0]).toFixed(1)).join() === Aa.segs.map(L => (L[2] - L[0]).toFixed(1)).join() && A.base[2] - A.base[0] === Aa.base[2] - Aa.base[0], nom + ' : échelle des longueurs inchangée')
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
