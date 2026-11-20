// lib/explication.manual-test.js — test de js/explication.js (mise en page des
// explications) et de son câblage dans quiz.html et examen.html.
// Aucune dépendance, aucun réseau : node lib/explication.manual-test.js
'use strict'
const fs = require('fs')
const path = require('path')
const { html } = require('../js/explication.js')

let ok = 0, ko = 0
function verifie(nom, cond, detail) {
  if (cond) { ok++; console.log('  ok   ' + nom) }
  else { ko++; console.log('  ÉCHEC ' + nom + (detail !== undefined ? ' → ' + JSON.stringify(detail) : '')) }
}
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
const lignes = h => (h.match(/<div class="expl-ligne[^"]*">/g) || []).length

console.log('[1] fonction')
const std = html("Idée 1.\nIdée 2.\nAttention : piège.")
verifie('trois lignes', lignes(std) === 3, std)
verifie('enveloppe expl-corps', std.startsWith('<div class="expl-corps">') && std.endsWith('</div></div>'), std)
verifie('Attention marquée', /<div class="expl-ligne expl-attention">Attention : piège\.<\/div>/.test(std), std)
verifie('une seule ligne Attention', (std.match(/expl-attention/g) || []).length === 1, std)
const vide = html("Idée 1.\n\nIdée 2.\n\nAttention : piège.")
verifie('ligne vide ignorée (pas de double espace)', vide === std, vide)
verifie('retour chariot ignoré', html("Idée 1.\r\nIdée 2.\r\nAttention : piège.") === std)
verifie('espaces de bord retirés', html("  Idée 1.  \n Idée 2.\nAttention : piège.\n") === std)
verifie('null → vide', html(null) === '' && html(undefined) === '' && html('') === '' && html('\n\n') === '')
const une = html('Une seule idée.')
verifie('une seule idée → une ligne, sans Attention', lignes(une) === 1 && !/expl-attention/.test(une), une)
verifie('« Attentionnée » n\'est pas une ligne Attention', !/expl-attention/.test(html('Idée.\nAttentionnée.')))
verifie('« Attention » au milieu d\'une ligne non marquée', !/expl-attention/.test(html('Idée. Attention : non.')))
const exp = html('On calcule 10³.\nAttention : 2⁻¹.')
verifie('exposants formatés', exp.includes('10<sup class="exp">3</sup>') && exp.includes('2<sup class="exp">−1</sup>'), exp)
verifie('texte non échappé (comme avant)', html('a &lt; b').includes('a &lt; b'))

console.log('\n[2] câblage')
;['quiz.html', 'examen.html'].forEach(p => {
  const h = lire(p)
  verifie(p + ' charge /js/explication.js après exposants.js',
    /<script src="\/js\/exposants\.js\?v=\d+"><\/script>\s*<script src="\/js\/explication\.js\?v=\d+"><\/script>/.test(h))
  verifie(p + ' charge /css/explication.css', /<link rel="stylesheet" href="\/css\/explication\.css\?v=\d+">/.test(h))
  verifie(p + ' : plus de <br><br> avant l\'explication', !/<br><br>(\$\{|'\+)[^}]{0,30}xplication/.test(h))
})
verifie('quiz.html : 4 explications mises en page', (lire('quiz.html').match(/\$\{Explication\.html\(q\.explication\)\}/g) || []).length === 4)
verifie('examen.html : 1 explication mise en page', (lire('examen.html').match(/Explication\.html\(explication\)/g) || []).length === 1)
const css = lire('css/explication.css')
verifie('css : espace entre les lignes', /\.expl-ligne\s*\{[^}]*margin-bottom:\s*9px/.test(css))
verifie('css : trait pointillé avant Attention', /\.expl-attention\s*\{[^}]*border-top:\s*1px dashed/.test(css))

console.log('\n' + ok + ' ok, ' + ko + ' échec(s)')
process.exit(ko ? 1 : 0)
