// /lib/figure-geo.manual-test.js
//
// Test manuel (`node lib/figure-geo.manual-test.js`) après toute modification de
// js/figure-geo.js, de css/figure-geo.css ou de leurs points d'appel.
// Aucune dépendance, aucun réseau.
//
// 1. Géométrie : projection orthographique (centre, pôles, équateur, face cachée,
//    symétrie est/ouest), distance au bord d'un parallèle.
// 2. Validation : vue et fond inconnus, centre invalide, points cachés ou écrasés contre
//    le bord, noms invalides ou en double, limites → figure vide + erreur lisible.
// 3. Parallèles : filtrés automatiquement par défaut, refusés quand la liste est
//    explicite et qu'un parallèle frôle le bord (cas du 60° S à 20° N, relevé du 18/11/2026).
// 4. Rendu : structure du SVG, équateur et Greenwich colorés, une croix par point,
//    coordonnées d'un point JAMAIS écrites, aucune valeur NaN.
// 5. Chevauchements : sur une grille de centres, toute figure acceptée est relue
//    DEPUIS LE SVG PRODUIT (pas depuis les structures internes) : aucune étiquette ne
//    chevauche une autre étiquette ni une croix. Limite : estimation de largeur de
//    texte, et un trait du quadrillage sous une étiquette n'est pas vu.
// 6. Largeur : lisible à 300 px.
// 7. Câblage : chaque page charge le script et la feuille, et sa fonction de figure
//    traite le type « geo » AVANT les types historiques (un oubli ne se verrait
//    qu'en production, par une figure absente, sans aucune erreur).
const fs = require('fs')
const path = require('path')
const FG = require('../js/figure-geo.js')

let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + JSON.stringify(detail) : '')) }
  else console.log('ok     ' + nom)
}
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
const compte = (h, motif) => (h.match(motif) || []).length
const proche = (a, b, e) => Math.abs(a - b) < (e || 1e-6)
const R = FG.constantes.R

// Scène de la maquette validée le 18/11/2026 : vue sans inclinaison, trois points.
const scene = {
  type: 'geo', vue: 'globe', fond: 'vierge', centre: { lat: 0, lon: 15 },
  points: [{ nom: 'A', lat: 30, lon: 45 }, { nom: 'B', lat: 30, lon: -30 }, { nom: 'C', lat: -30, lon: 45 }]
}
const avec = (modif) => Object.assign({}, scene, modif)

console.log('\n[1] géométrie')
{
  const c0 = { lat: 0, lon: 0 }
  const o = FG.projeter(0, 0, c0)
  verifie('le centre de la vue tombe au milieu, visible', proche(o.x, 0) && proche(o.y, 0) && o.visible)
  const e = FG.projeter(0, 90, c0), w = FG.projeter(0, -90, c0)
  verifie('équateur à 90° E : bord droit du globe', proche(e.x, R) && proche(e.y, 0) && e.visible, e)
  verifie('équateur à 90° O : bord gauche du globe', proche(w.x, -R) && proche(w.y, 0), w)
  const n = FG.projeter(90, 0, c0), s = FG.projeter(-90, 0, c0)
  verifie('pôle nord en haut (y négatif), pôle sud en bas', proche(n.y, -R) && proche(s.y, R) && proche(n.x, 0), [n, s])
  verifie('face cachée : 180° de longitude non visible', !FG.projeter(0, 180, c0).visible)
  verifie('symétrie est/ouest : x(lat, +Δ) = −x(lat, −Δ)', proche(FG.projeter(30, 50, c0).x, -FG.projeter(30, -50, c0).x) && proche(FG.projeter(30, 50, c0).y, FG.projeter(30, -50, c0).y))
  verifie('symétrie nord/sud à 0° d\'inclinaison : y(+lat) = −y(−lat)', proche(FG.projeter(40, 20, c0).y, -FG.projeter(-40, 20, c0).y))
  const c20 = { lat: 20, lon: 15 }
  verifie('inclinée à 20° N : pôle nord visible, pôle sud caché', FG.projeter(90, 0, c20).visible && !FG.projeter(-90, 0, c20).visible)
  verifie('angle au centre : 0° pour le centre, 180° pour son antipode', proche(FG.angleAuCentre(0, 15, { lat: 0, lon: 15 }), 0, 1e-4) && proche(FG.angleAuCentre(0, -165, { lat: 0, lon: 15 }), 180, 1e-4))
  verifie('distance au bord du 60° N à 0° d\'inclinaison : 13,4 px', proche(FG.distanceBordParallele(60, c0), 13.397, 0.01))
  verifie('distance au bord du 60° S à 20° N : 1,5 px (relevé du 18/11/2026)', proche(FG.distanceBordParallele(-60, c20), 1.52, 0.02), FG.distanceBordParallele(-60, c20))
  verifie('parallèle entièrement caché : −1', FG.distanceBordParallele(-60, { lat: 60, lon: 0 }) === -1)
}

console.log('\n[2] validation')
{
  const refuse = (nom, fig, motif) => {
    const err = FG.erreurs(fig).join(' | ')
    verifie(nom + ' : figure vide', FG.html(fig) === '')
    verifie(nom + ' : message lisible', err.length > 0 && (!motif || new RegExp(motif, 'i').test(err)), err)
  }
  verifie('scène de la maquette : acceptée', FG.html(scene) !== '' && FG.erreurs(scene).length === 0, FG.erreurs(scene))
  verifie('sans points : acceptée', FG.html({ type: 'geo', centre: { lat: 0, lon: 0 } }) !== '')
  verifie('vue et fond facultatifs (globe, vierge par défaut)', FG.html({ type: 'geo', centre: { lat: 0, lon: 0 } }) !== '')
  refuse('type absent', { vue: 'globe', centre: { lat: 0, lon: 0 } })
  refuse('autre type', { type: 'grille', centre: { lat: 0, lon: 0 } })
  refuse('null', null)
  refuse('vue planisphère (pas encore prise en charge)', avec({ vue: 'planisphere' }), 'vue')
  refuse('fond continents (pas encore pris en charge)', avec({ fond: 'continents' }), 'fond')
  refuse('centre absent', { type: 'geo', points: [] }, 'centre')
  refuse('centre en texte', avec({ centre: { lat: '0', lon: '15' } }), 'centre')
  refuse('latitude du centre 51°', avec({ centre: { lat: 51, lon: 0 }, points: [] }), 'latitude du centre')
  refuse('latitude du centre −51°', avec({ centre: { lat: -51, lon: 0 }, points: [] }), 'latitude du centre')
  verifie('latitude du centre ±50° : acceptée sur toutes les longitudes (pas de 5°)', (() => {
    for (const la of [-50, 50]) for (let lo = -180; lo <= 180; lo += 5) if (!FG.html({ type: 'geo', centre: { lat: la, lon: lo } })) return false
    return true
  })())
  refuse('longitude du centre 181°', avec({ centre: { lat: 0, lon: 181 }, points: [] }), 'longitude du centre')
  refuse('point sur la face cachée', avec({ points: [{ nom: 'P', lat: 0, lon: -165 }] }), 'centre')
  refuse('point à 71° du centre', avec({ points: [{ nom: 'P', lat: 0, lon: 86 }] }), '71')
  verifie('point à 69° du centre : accepté', FG.html(avec({ points: [{ nom: 'P', lat: 0, lon: 84 }] })) !== '')
  refuse('latitude de point 91°', avec({ points: [{ nom: 'P', lat: 91, lon: 15 }] }), 'lat')
  refuse('longitude de point en texte', avec({ points: [{ nom: 'P', lat: 10, lon: '15' }] }), 'lat')
  refuse('nom de point avec balise', avec({ points: [{ nom: '<b>', lat: 10, lon: 15 }] }), 'nom')
  refuse('nom de point trop long', avec({ points: [{ nom: 'ABC', lat: 10, lon: 15 }] }), 'nom')
  verifie('nom avec apostrophe accepté (A\')', FG.html(avec({ points: [{ nom: "A'", lat: 10, lon: 15 }] })) !== '')
  refuse('nom en double', avec({ points: [{ nom: 'A', lat: 10, lon: 15 }, { nom: 'A', lat: -10, lon: 15 }] }), 'déjà utilisé')
  refuse('lab inconnu', avec({ points: [{ nom: 'A', lat: 10, lon: 15, lab: 'dessus' }] }), 'lab')
  const neuf = []; for (let i = 0; i < 9; i++) neuf.push({ nom: String(i), lat: -40 + i * 10, lon: 15 })
  refuse('9 points', avec({ points: neuf }), '8 au plus')
  const huit = [[50, 60], [40, -40], [30, 55], [20, -45], [-20, 50], [-30, -40], [-40, 60], [-50, -35]].map((p, i) => ({ nom: String.fromCharCode(65 + i), lat: p[0], lon: p[1] }))
  verifie('8 points bien espacés : acceptés', FG.html(avec({ points: huit })) !== '', FG.erreurs(avec({ points: huit })))
  refuse('graduations en texte', avec({ graduations: 'oui' }), 'graduations')
  refuse('paralleles pas une liste', avec({ paralleles: 30 }), 'liste')
  refuse('parallèle 0 dans la liste (l\'équateur est toujours tracé)', avec({ paralleles: [0] }), 'latitudes possibles')
  refuse('parallèle 45 hors liste', avec({ paralleles: [45] }), 'latitudes possibles')
  refuse('chaîne JSON non décodée', '{"type":"geo"}')
}

console.log('\n[3] parallèles')
{
  const lats = fig => { const a = FG.analyser(fig); return a.ok ? a.paralleles.slice().sort((x, y) => x - y) : null }
  const c = (la, lo) => ({ type: 'geo', centre: { lat: la, lon: lo || 0 } })
  verifie('sans inclinaison : les quatre parallèles (−60, −30, 30, 60)', JSON.stringify(lats(c(0))) === '[-60,-30,30,60]', lats(c(0)))
  verifie('inclinée à 20° N : le 60° S est écarté (1,5 px du bord)', JSON.stringify(lats(c(20))) === '[-30,30,60]', lats(c(20)))
  verifie('inclinée à 20° S : le 60° N est écarté', JSON.stringify(lats(c(-20))) === '[-60,-30,30]', lats(c(-20)))
  verifie('inclinée à 5° N : le 60° S (9,4 px) est écarté', JSON.stringify(lats(c(5))) === '[-30,30,60]', lats(c(5)))
  verifie('inclinée à 4° N : le 60° S (10,3 px) est gardé', JSON.stringify(lats(c(4))) === '[-60,-30,30,60]', lats(c(4)))
  const he = FG.erreurs({ type: 'geo', centre: { lat: 20, lon: 0 }, paralleles: [-60, -30, 30, 60] }).join(' | ')
  verifie('liste explicite avec le 60° S à 20° N : refusée, la raison est dite', /parallèle -60° : à 1\.5 px du bord/.test(he), he)
  verifie('liste explicite sans le 60° S à 20° N : acceptée', FG.html({ type: 'geo', centre: { lat: 20, lon: 0 }, paralleles: [-30, 30, 60] }) !== '')
  verifie('liste explicite : seuls ces parallèles ont une graduation', (() => {
    const h = FG.html({ type: 'geo', centre: { lat: 0, lon: 0 }, paralleles: [30] })
    return /30°N</.test(h) && !/60°N</.test(h) && !/30°S</.test(h) && !/60°S</.test(h)
  })())
  const hc = FG.erreurs({ type: 'geo', centre: { lat: 50, lon: 0 }, paralleles: [-60] }).join(' | ')
  verifie('parallèle −60° caché depuis une vue à 50° N : refusé comme invisible', /invisible/.test(hc), hc)
  verifie('équateur : refusé hors latitude du centre ±50° (il approche du bord)', FG.erreurs({ type: 'geo', centre: { lat: 70, lon: 0 } }).length > 0)
}

console.log('\n[4] rendu')
{
  const h = FG.html(scene)
  const textes = [...h.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1])
  verifie('un seul <svg>, classe fgeo-fig, image décrite', compte(h, /<svg /g) === 1 && /class="fgeo-fig"/.test(h) && /role="img"/.test(h))
  verifie('contour du globe : cercle de 100 px', /<circle class="fgeo-bord" cx="0" cy="0" r="100"\/>/.test(h))
  verifie('équateur tracé (classe rouge) et Greenwich tracé (classe bleue)', /class="fgeo-equateur"/.test(h) && /class="fgeo-greenwich"/.test(h))
  verifie('une croix par point (3)', compte(h, /class="fgeo-croix"/g) === 3, compte(h, /class="fgeo-croix"/g))
  verifie('Nord, Sud, Ouest, Est, Équateur à l\'extérieur', ['Nord', 'Sud', 'Ouest', 'Est', 'Équateur'].every(t => textes.includes(t)), textes)
  verifie('graduations des latitudes (30°N, 60°N, 30°S, 60°S)', ['30°N', '60°N', '30°S', '60°S'].every(t => textes.includes(t)), textes)
  verifie('graduations des longitudes sous l\'équateur (30°O, 0°, 30°E, 60°E)', ['30°O', '0°', '30°E', '60°E'].every(t => textes.includes(t)), textes)
  verifie('noms des points A, B, C présents', ['A', 'B', 'C'].every(t => textes.includes(t)))
  verifie('les coordonnées d\'un point ne sont JAMAIS écrites (aucun « ; », aucun 45°)', !textes.some(t => /;/.test(t) || /45/.test(t)), textes)
  verifie('aucun NaN, undefined ni Infinity dans le SVG', !/NaN|undefined|Infinity/.test(h))
  const hg = FG.html(avec({ graduations: false }))
  const tg = [...hg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1])
  verifie('graduations: false : aucune graduation (plus de « ° »), orientations conservées', !tg.some(t => /°/.test(t)) && tg.includes('Nord') && tg.includes('Équateur'), tg)
  verifie('sans points : aucune croix', compte(FG.html({ type: 'geo', centre: { lat: 0, lon: 0 } }), /fgeo-croix/g) === 0)
  verifie('Greenwich caché (vue centrée sur 150° E) : pas de trait bleu', !/fgeo-greenwich/.test(FG.html({ type: 'geo', centre: { lat: 0, lon: 150 } })))
  verifie('équateur visible : un seul morceau (ligne continue)', compte(h, /class="fgeo-equateur"/g) === 1, compte(h, /class="fgeo-equateur"/g))
  verifie('lab imposé honoré (haut_gauche : nom à gauche de la croix)', (() => {
    const g = FG.html(avec({ points: [{ nom: 'P', lat: 0, lon: 15, lab: 'haut_gauche' }] }))
    return /text-anchor="end"[^>]*>P</.test(g)
  })())
  verifie('lab imposé qui recouvre la croix d\'un autre point : refusé plutôt que superposé', (() => {
    const f = avec({ points: [{ nom: 'A', lat: 0, lon: 15, lab: 'haut_droite' }, { nom: 'B', lat: 5.2, lon: 23.1 }] })
    return FG.html(f) === '' && /chevauche/.test(FG.erreurs(f).join(' | '))
  })(), FG.erreurs(avec({ points: [{ nom: 'A', lat: 0, lon: 15, lab: 'haut_droite' }, { nom: 'B', lat: 5.2, lon: 23.1 }] })))
  verifie('sans lab, le même couple de points est accepté (le nom change de côté)', FG.html(avec({ points: [{ nom: 'A', lat: 0, lon: 15 }, { nom: 'B', lat: 5.2, lon: 23.1 }] })) !== '')
  verifie('le dessin est déterministe (deux appels identiques)', FG.html(scene) === FG.html(scene))
}

console.log('\n[5] chevauchements, relus depuis le SVG')
{
  // Relecture indépendante : on lit les <text> et les croix du SVG, avec les mêmes
  // règles d'estimation de largeur (0,6 em par signe, 0,66 en gras).
  function boites(svg) {
    const out = []
    for (const m of svg.matchAll(/<text class="([^"]+)" x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)"[^>]*>([^<]*)<\/text>/g)) {
      const fs = m[1] === 'fgeo-pt' ? 14 : 11, gras = m[1] === 'fgeo-pt'
      const x = parseFloat(m[2]), y = parseFloat(m[3]), w = m[5].length * fs * (gras ? 0.66 : 0.6)
      const x0 = m[4] === 'end' ? x - w : m[4] === 'start' ? x : x - w / 2
      out.push({ n: m[5], x0, x1: x0 + w, y0: y - fs * 0.75, y1: y + fs * 0.75 })
    }
    for (const m of svg.matchAll(/class="fgeo-croix" d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/g)) {
      const cx = (parseFloat(m[1]) + parseFloat(m[3])) / 2, cy = (parseFloat(m[2]) + parseFloat(m[4])) / 2
      out.push({ n: 'croix', x0: cx - 6, x1: cx + 6, y0: cy - 6, y1: cy + 6 })
    }
    return out
  }
  const chevauchements = svg => {
    const b = boites(svg), bad = []
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
      if (b[i].x0 < b[j].x1 && b[j].x0 < b[i].x1 && b[i].y0 < b[j].y1 && b[j].y0 < b[i].y1) bad.push(b[i].n + '/' + b[j].n)
    }
    return bad
  }
  verifie('la relecture trouve les 16 textes et les 3 croix de la scène', boites(FG.html(scene)).length === 19, boites(FG.html(scene)).length)
  verifie('scène de la maquette : aucun chevauchement', chevauchements(FG.html(scene)).length === 0, chevauchements(FG.html(scene)))
  // Contrôle du contrôle : on fabrique un SVG où deux étiquettes se touchent.
  verifie('le contrôle détecte un chevauchement fabriqué', chevauchements('<text class="fgeo-grad" x="0" y="0" text-anchor="middle">30°N</text><text class="fgeo-grad" x="5" y="2" text-anchor="middle">60°S</text>').length === 1)
  let acceptees = 0, refusees = 0, defauts = []
  for (let la = -50; la <= 50; la += 10) {
    for (let lo = -150; lo <= 150; lo += 15) {
      const f = { type: 'geo', centre: { lat: la, lon: lo } }
      const svg = FG.html(f)
      if (!svg) { refusees++; if (la === 0) defauts.push([la, lo, FG.erreurs(f)]); continue }
      acceptees++
      const bad = chevauchements(svg)
      if (bad.length) defauts.push([la, lo, bad])
      if (/NaN|undefined|Infinity/.test(svg)) defauts.push([la, lo, 'NaN'])
    }
  }
  console.log('       (' + acceptees + ' vues acceptées, ' + refusees + ' refusées sur la grille de centres)')
  verifie('sur la grille de centres (lat −50..50 par 10°, lon −150..150 par 15°), aucune figure acceptée ne contient de chevauchement', defauts.length === 0, defauts.slice(0, 5))
  verifie('toutes les vues sans inclinaison sont acceptées (le cas de la maquette)', (() => {
    for (let lo = -150; lo <= 150; lo += 15) if (!FG.html({ type: 'geo', centre: { lat: 0, lon: lo } })) return false
    return true
  })())
  let pointsOk = 0, pointsRefuses = 0, pointsBad = []
  for (const la of [-20, 0, 20]) for (const lo of [0, 15, 60]) {
    for (const p of [[30, 45], [-30, 45], [30, -30], [60, 15], [-60, 15], [0, 60], [0, -45], [45, 0]]) {
      const f = { type: 'geo', centre: { lat: la, lon: lo }, points: [{ nom: 'P', lat: p[0], lon: p[1] }] }
      const svg = FG.html(f)
      if (!svg) { pointsRefuses++; continue }
      pointsOk++
      const bad = chevauchements(svg)
      if (bad.length) pointsBad.push([la, lo, p, bad])
    }
  }
  console.log('       (' + pointsOk + ' figures à un point acceptées, ' + pointsRefuses + ' refusées)')
  verifie('un point : aucune figure acceptée ne contient de chevauchement', pointsBad.length === 0, pointsBad.slice(0, 5))
}

console.log('\n[6] largeur')
{
  const h = FG.html(scene)
  const W = parseInt((h.match(/width="(\d+)"/) || [])[1], 10)
  const vb = (h.match(/viewBox="(-?\d+) (-?\d+) (\d+) (\d+)"/) || []).slice(1).map(Number)
  verifie('largeur de la scène : 310 px au plus', W <= 310, W)
  verifie('viewBox cohérent avec width et height', vb[2] === W && vb[3] === parseInt((h.match(/height="(\d+)"/) || [])[1], 10), vb)
  verifie('le globe (200 px) tient dans le cadre avec ses marges', vb[0] <= -R && vb[0] + vb[2] >= R && vb[1] <= -R && vb[1] + vb[3] >= R, vb)
  verifie('texte de 11 px conservé à 300 px de large (échelle ≥ 0,95)', 300 / W >= 0.95 || W <= 300, 300 / W)
  verifie('le plafond de largeur est en ligne (max-width = largeur du SVG)', new RegExp('style="max-width:' + W + 'px"').test(h))
}

console.log('\n[7] câblage')
const css = lire('css/figure-geo.css')
verifie('la feuille écrase le plafond « .q-figure svg » des pages', /\.q-figure \.fgeo-fig\s*\{[^}]*max-width:\s*none/.test(css))
verifie('la feuille définit équateur rouge et Greenwich bleu', /--fgeo-equateur:\s*#D8442A/.test(css) && /--fgeo-greenwich:\s*#2B7BD0/.test(css))
verifie('toutes les classes du SVG ont une règle', ['fgeo-bord', 'fgeo-trait', 'fgeo-equateur', 'fgeo-greenwich', 'fgeo-croix', 'fgeo-grad', 'fgeo-orient', 'fgeo-equateur-t', 'fgeo-greenwich-t', 'fgeo-pt'].every(c => new RegExp('\\.fgeo-fig \\.' + c + '\\s*\\{').test(css)))
{
  const classes = new Set([...FG.html(scene).matchAll(/class="([^"]+)"/g)].map(m => m[1]))
  const manquantes = [...classes].filter(c => c !== 'fgeo-fig' && !new RegExp('\\.fgeo-fig \\.' + c + '\\s*\\{').test(css))
  verifie('aucune classe du SVG produit n\'est sans style', manquantes.length === 0, manquantes)
}
for (const [page, motifBranche, motifHistorique] of [
  ['quiz.html', "f.type==='geo'", "f.type==='triangle_rect'&&f.base==='?'"],
  ['examen.html', "f.type === 'geo'", "f.type === 'triangle_rect' && f.base === '?'"],
  ['prof.html', "f.type === 'geo'", "f.type === 'triangle_rect' && f.base === '?'"]
]) {
  const src = lire(page)
  verifie(page + ' charge js/figure-geo.js', /<script src="\/js\/figure-geo\.js\?v=\d+"><\/script>/.test(src))
  verifie(page + ' charge css/figure-geo.css', /<link rel="stylesheet" href="\/css\/figure-geo\.css\?v=\d+">/.test(src))
  const i = src.indexOf(motifBranche), j = src.indexOf(motifHistorique)
  verifie(page + ' traite « geo » avant les types historiques', i > 0 && j > 0 && i < j, [i, j])
  verifie(page + ' : le script est chargé avant la première utilisation', src.indexOf('figure-geo.js') < src.indexOf('FigureGeo.html'))
  verifie(page + ' : « grille » est toujours traitée (aucune régression de câblage)', /f\.type ?=== ?'grille'/.test(src) && /figure-grille\.js/.test(src))
}
{
  const versions = ['quiz.html', 'examen.html', 'prof.html'].map(p => (lire(p).match(/figure-geo\.js\?v=(\d+)/) || [])[1])
  verifie('même version de script dans les trois pages', new Set(versions).size === 1, versions)
  const versionsCss = ['quiz.html', 'examen.html', 'prof.html'].map(p => (lire(p).match(/figure-geo\.css\?v=(\d+)/) || [])[1])
  verifie('même version de feuille dans les trois pages', new Set(versionsCss).size === 1, versionsCss)
}
verifie('prof.html : badge « Globe » et message d\'erreur lisible', /🌍 Globe/.test(lire('prof.html')) && /Globe invalide/.test(lire('prof.html')))
verifie('aucune figure geo n\'est lue par les API (le jsonb passe tel quel)', !/figure-geo|FigureGeo/.test(lire('api/generer.js') + lire('api/examen.js')))

console.log(echecs ? '\n' + echecs + ' échec(s)' : '\nTout est ok')
process.exit(echecs ? 1 : 0)
