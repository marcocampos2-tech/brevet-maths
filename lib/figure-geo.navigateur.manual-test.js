// /lib/figure-geo.navigateur.manual-test.js
//
// Test manuel, PAS un test automatisé lancé en CI :
//   NODE_PATH=/opt/node-tools/node_modules node lib/figure-geo.navigateur.manual-test.js
// à exécuter après toute modification de js/figure-geo.js (positions d'étiquettes,
// tailles de police) ou de css/figure-geo.css. Environ une minute.
//
// Pourquoi en plus de lib/figure-geo.manual-test.js : le module décide d'accepter ou de
// refuser une figure d'après une ESTIMATION de largeur de texte (0,6 em par signe).
// Ici, chaque figure acceptée est dessinée dans Chromium avec la vraie police, puis
// les boîtes réelles (getBBox) de tous les textes et de toutes les croix sont comparées :
// aucune ne doit se chevaucher ni sortir du viewBox. Ce contrôle a trouvé, le 18/11/2026,
// des chevauchements « Sud » / graduations que l'estimation seule ne voyait pas.
//
// Limite : un trait du quadrillage qui passe sous une étiquette n'est pas détecté.
// Prérequis : le module `playwright` et un Chromium (voir lib/quiz-fin.manual-test.js).
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const FG = require('../js/figure-geo.js')

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'figure-geo.css'), 'utf8')
const figures = []
for (let la = -50; la <= 50; la += 10) for (let lo = -150; lo <= 150; lo += 15) figures.push({ type: 'geo', centre: { lat: la, lon: lo } })
for (const la of [-20, 0, 20]) for (const lo of [0, 15, 60]) {
  for (const q of [[30, 45], [-30, 45], [30, -30], [60, 15], [-60, 15], [0, 60], [0, -45], [45, 0]]) {
    figures.push({ type: 'geo', centre: { lat: la, lon: lo }, points: [{ nom: 'P', lat: q[0], lon: q[1] }] })
  }
}
figures.push({ type: 'geo', centre: { lat: 0, lon: 15 }, points: [{ nom: 'A', lat: 30, lon: 45 }, { nom: 'B', lat: 30, lon: -30 }, { nom: 'C', lat: -30, lon: 45 }] })

;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 340, height: 300 } })
  let rendues = 0
  const defauts = []
  for (const f of figures) {
    const h = FG.html(f)
    if (!h) continue
    rendues++
    await p.setContent('<style>body{margin:8px;font-family:Inter,Arial,sans-serif}' + css + '</style><div class="q-figure" style="width:300px">' + h + '</div>')
    const r = await p.evaluate(() => {
      const t = [...document.querySelectorAll('svg text, svg .fgeo-croix')].map(e => {
        const b = e.getBBox()
        return { n: e.textContent || 'croix', x0: b.x, x1: b.x + b.width, y0: b.y, y1: b.y + b.height }
      })
      const bad = []
      for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
        const a = t[i], d = t[j]
        if (a.x0 < d.x1 && d.x0 < a.x1 && a.y0 < d.y1 && d.y0 < a.y1) bad.push(a.n + '/' + d.n)
      }
      const vb = document.querySelector('svg').viewBox.baseVal
      const hors = t.filter(a => a.x0 < vb.x || a.x1 > vb.x + vb.width || a.y0 < vb.y || a.y1 > vb.y + vb.height).map(a => a.n)
      return { bad, hors }
    })
    if (r.bad.length || r.hors.length) defauts.push({ centre: f.centre, points: !!f.points, chevauchements: r.bad, hors_cadre: r.hors })
  }
  await b.close()
  console.log(rendues + ' figures acceptées, dessinées dans Chromium (sur ' + figures.length + ' essayées)')
  if (defauts.length) { console.log('ECHEC  ' + defauts.length + ' figure(s) avec défaut :'); defauts.slice(0, 10).forEach(d => console.log('  ' + JSON.stringify(d))); process.exit(1) }
  console.log('ok     aucun chevauchement ni débordement du cadre avec les largeurs réelles')
})()
