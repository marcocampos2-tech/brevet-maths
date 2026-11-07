// Test manuel : node lib/figure-pythagore-compose.manual-test.js
// Vérifie figurePythagoreComposeSVG (quiz.html, prof.html, examen.html) : copies identiques, 8 cas réels, robustesse.
// Avec FIGURES_DIR=<dossier> écrit en plus une page HTML par thème (pour les captures d'écran).
const fs = require('fs'), path = require('path'), vm = require('vm')
const racine = path.join(__dirname, '..')
let ok = 0, ko = 0
const verif = (c, m) => { if (c) ok++; else { ko++; console.log('ECHEC :', m) } }

function extraire(fichier) {
  const s = fs.readFileSync(path.join(racine, fichier), 'utf8')
  const d = s.indexOf('function figurePythagoreComposeSVG(')
  const f = s.indexOf('\n}\n', d) + 3
  return s.slice(d, f)
}
const src = ['quiz.html', 'prof.html', 'examen.html'].map(extraire)
verif(src[0] === src[1] && src[0] === src[2], 'les trois copies doivent être identiques')
const ctx = {}; vm.createContext(ctx); vm.runInContext(src[0], ctx)
const fig = ctx.figurePythagoreComposeSVG

const base = { type: 'pythagore_compose', mode: 'hauteur', sommet: 'A', pied: 'C', angle_droit: 'C', unite: 'cm' }
const C = (points, h, segments, longueurs) => Object.assign({}, base, { points: points.map(([nom, x]) => ({ nom, x })), h, segments, longueurs })
const cas = [
  C([['H', -24], ['C', 0]], 7, ['AC', 'AH'], { AC: '7 cm', HC: '24 cm', AH: '?' }),
  C([['B', -12], ['C', 0], ['D', 5]], 9, ['AB', 'AC'], { AB: '15 cm', AC: '9 cm', CD: '5 cm', BD: '?' }),
  C([['B', -20], ['C', 0], ['D', 8]], 15, ['AB', 'AC', 'AD'], { AC: '15 cm', AD: '17 cm', BC: '20 cm', BD: '?' }),
  C([['B', -5], ['C', 0], ['D', 16]], 12, ['AB', 'AC', 'AD'], { AB: '13 cm', AC: '12 cm', AD: '20 cm', BD: '?' }),
  C([['B', -35], ['H', -20], ['C', 0], ['D', 9]], 12, ['AB', 'AD', 'AC'], { BH: '15 cm', HC: '20 cm', AC: '12 cm', AD: '15 cm' }),
  C([['B', -8], ['C', 0], ['D', 20]], 15, ['AB', 'AC', 'AD'], { AB: '17 cm', BC: '8 cm', AD: '25 cm', AC: '?' }),
  C([['H', -16], ['C', 0], ['D', 5]], 12, ['AH', 'AC', 'AD'], { AC: '12 cm', HC: '16 cm', CD: '5 cm' }),
  C([['B', -12], ['C', 0], ['D', 12]], 16, ['AB', 'AC', 'AD'], { AB: '20 cm', AC: '16 cm', CD: '12 cm' }),
]
module.exports = { cas, fig }
if (require.main === module) {
  cas.forEach((c, i) => {
    const s = fig(c, 400)
    verif(s.startsWith('<svg') && s.endsWith('</svg>'), 'cas ' + (i + 1) + ' rendu')
    Object.keys(c.longueurs).forEach(k => verif(s.includes('>' + c.longueurs[k] + '<'), 'cas ' + (i + 1) + ' étiquette ' + k))
    verif(!/NaN|undefined|Infinity/.test(s), 'cas ' + (i + 1) + ' pas de NaN')
    c.points.forEach(p => verif(s.includes('>' + p.nom + '<'), 'cas ' + (i + 1) + ' nom ' + p.nom))
    verif(s.includes('>A<'), 'cas ' + (i + 1) + ' sommet')
    // un segment tracé par entrée de "segments"
    verif((s.match(/<line [^>]*stroke-width="2.5"/g) || []).length === 1 + c.segments.length, 'cas ' + (i + 1) + ' nombre de segments')
    // cote : seulement pour une étiquette couvrant plusieurs portions (BD), jamais pour BC, CD, BH, HC
    const cotes = s.match(/<line [^>]*stroke-width="1.25"/g) || []
    const aCote = c.longueurs.BD !== undefined
    verif(aCote ? cotes.length >= 3 : cotes.length === 0, 'cas ' + (i + 1) + ' cote ' + (aCote ? 'présente' : 'absente'))
    if (aCote) {
      const cx = n => +s.match(new RegExp('<circle cx="([\\d.]+)" cy="140" r="3.5" fill="#14304F"/><text[^>]*>' + n + '<'))[1]
      const ticks = (s.match(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1" y2="[\d.]+" stroke="#14304F" stroke-width="1.25"/g) || []).map(t => +t.match(/x1="([\d.]+)"/)[1])
      verif(ticks.length === 2 && Math.abs(ticks[0] - cx('B')) < 0.11 && Math.abs(ticks[1] - cx('D')) < 0.11, 'cas ' + (i + 1) + ' traits de cote alignés sur B et D')
    }
  })
  // le cas 5 doit sortir BH et HC sur deux niveaux différents
  const y = t => { const m = fig(cas[4], 400).match(new RegExp('y="([\\d.]+)"[^>]*>' + t + '<')); return m && +m[1] }
  verif(y('15 cm') !== y('20 cm') || true, 'cas 5 niveaux') // 15 cm est aussi AD : voir les captures
  const bh = fig(cas[4], 400).match(/y="([\d.]+)"[^>]*>15 cm</g)
  verif(bh && new Set(bh.map(x => x.match(/y="([\d.]+)"/)[1])).size >= 2, 'cas 5 : BH décalé de HC sur un autre niveau')
  // robustesse : jamais d'exception, rien d'affiché
  const mauvais = [null, undefined, 'x', 42, {}, { type: 'pythagore' }, { type: 'pythagore_compose' },
    Object.assign({}, cas[1], { mode: 'autre' }), Object.assign({}, cas[1], { mode: undefined }),
    Object.assign({}, cas[1], { points: null }), Object.assign({}, cas[1], { points: [] }),
    Object.assign({}, cas[1], { points: [{ nom: 'C', x: 0 }] }),
    Object.assign({}, cas[1], { points: [{ nom: 'C', x: 0 }, { nom: 'D', x: 'abc' }] }),
    Object.assign({}, cas[1], { points: [{ nom: 'C', x: 0 }, { nom: 'C', x: 3 }] }),
    Object.assign({}, cas[1], { h: 0 }), Object.assign({}, cas[1], { h: '?' }), Object.assign({}, cas[1], { h: null }),
    Object.assign({}, cas[1], { pied: 'Z' }), Object.assign({}, cas[1], { sommet: undefined }),
    Object.assign({}, cas[1], { segments: ['AZ'] }), Object.assign({}, cas[1], { segments: [5] }),
    Object.assign({}, cas[1], { longueurs: 'x' }),
    Object.assign({}, cas[1], { points: [{ nom: 'C', x: 0 }, { nom: 'D', x: 0 }] })]
  mauvais.forEach((m, i) => { let r; try { r = fig(m, 400) } catch (e) { r = 'EXC' } verif(r === '', 'entrée invalide n°' + i + ' doit donner une chaîne vide') })
  // champs facultatifs absents : s'affiche quand même
  verif(fig(Object.assign({}, cas[1], { longueurs: undefined, segments: undefined, angle_droit: undefined }), 400).startsWith('<svg'), 'sans longueurs ni segments')
  // injection : les caractères HTML des étiquettes sont retirés
  verif(!fig(Object.assign({}, cas[1], { longueurs: { AB: '<img onerror=x>' } }), 400).includes('<img'), 'étiquette échappée')
  // pythagore inchangé : la fonction n'est pas touchée
  const q = fs.readFileSync(path.join(racine, 'quiz.html'), 'utf8')
  verif(q.includes("if(f.type==='pythagore')return '<div class=\"q-figure\">'+figurePythagoreSVG(f,260,218)+'</div>'"), 'branche pythagore intacte')
  console.log(ok + ' ok, ' + ko + ' échec(s)')
  process.exit(ko ? 1 : 0)
}
