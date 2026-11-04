// /lib/exposants.manual-test.js
//
// Test manuel (`node lib/exposants.manual-test.js`) après toute modification de
// js/exposants.js ou de ses points d'appel. Aucune dépendance, aucun réseau.
//
// 1. La fonction (js/exposants.js) : suites d'exposants, moins U+2212, parenthèses,
//    indices laissés intacts, texte déjà échappé, idempotence.
// 2. Le câblage : chaque page charge le script et la feuille de style, et chaque
//    point d'affichage passe par Exposants.formater (un point oublié se verrait
//    seulement sur PC, sans aucune erreur). L'équivalence « correction par
//    index » n'est pas à tester ici : la fonction ne touche jamais q.q, q.opts
//    ni q.answer, seulement la chaîne insérée.
const fs = require('fs')
const path = require('path')
const { formater } = require('../js/exposants.js')

let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + detail : '')) }
  else console.log('ok     ' + nom)
}
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
const sup = t => '<sup class="exp">' + t + '</sup>'

console.log('\n[1] formater()')
const cas = [
  ['10¹⁰', '10' + sup('10')],
  ['10⁻³', '10' + sup('−3')],
  ['3 × 10⁻⁶ m', '3 × 10' + sup('−6') + ' m'],
  ['x²', 'x' + sup('2')],
  ['4x² − 7', '4x' + sup('2') + ' − 7'],
  ['7⁶', '7' + sup('6')],
  ['2³ × 2⁴', '2' + sup('3') + ' × 2' + sup('4')],
  ['10⁺²', '10' + sup('+2')],
  ['2⁽ⁿ⁺¹⁾', '2' + sup('(n+1)')],
  ['aᵐ × aⁿ = aᵐ⁺ⁿ', 'a' + sup('m') + ' × a' + sup('n') + ' = a' + sup('m+n')],
  ['eˣ et uᵃ', 'e' + sup('x') + ' et u' + sup('a')],
  ['x²-16', 'x' + sup('2') + '-16'],
  ['u₁ + u₂', 'u₁ + u₂'],
  ['x₁² + 5', 'x₁' + sup('2') + ' + 5'],
  ['x &lt; 10² et a &amp; b', 'x &lt; 10' + sup('2') + ' et a &amp; b'],
  ['<br>Affirmation 1 : 5²', '<br>Affirmation 1 : 5' + sup('2')],
  ['Aucun exposant ici (3,14 × 2) − 1', 'Aucun exposant ici (3,14 × 2) − 1'],
  ['', ''],
]
cas.forEach(([entree, attendu]) => verifie('formater(' + JSON.stringify(entree) + ')', formater(entree) === attendu, formater(entree)))
verifie('null → chaîne vide', formater(null) === '' && formater(undefined) === '')
verifie('nombre → chaîne', formater(12) === '12')
verifie('texte sans exposant : identique, caractère pour caractère', formater('7 + 5 = 12') === '7 + 5 = 12')
verifie('chaque suite continue = un seul <sup>', (formater('10¹⁰ et 10⁻³').match(/<sup/g) || []).length === 2)
cas.forEach(([entree]) => {
  const une = formater(entree)
  verifie('idempotent : ' + JSON.stringify(entree), formater(une) === une)
})
const echappe = '&lt;b&gt; 2² &amp;'
verifie('texte échappé : aucune entité modifiée', formater(echappe) === '&lt;b&gt; 2' + sup('2') + ' &amp;')
const tous = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺⁽⁾ⁿᵐᵃˣ'
verifie('plus aucun caractère exposant après conversion', !/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺⁽⁾ⁿᵐᵃˣ]/.test(formater(tous)), formater(tous))
verifie('les 20 caractères validés donnent 0123456789−+()nmax', formater(tous) === sup('0123456789−+()nmax'))

console.log('\n[2] câblage')
const pages = ['quiz.html', 'examen.html', 'prof.html', 'resultats.html']
pages.forEach(p => {
  const h = lire(p)
  verifie(p + ' charge /js/exposants.js', /<script src="\/js\/exposants\.js\?v=\d+"><\/script>/.test(h))
  verifie(p + ' charge /css/exposants.css', /<link rel="stylesheet" href="\/css\/exposants\.css\?v=\d+">/.test(h))
})
const aucun = (p, motif, nom) => verifie(p + ' : ' + nom, !motif.test(lire(p)), motif)
const present = (p, motif, nom, n) => {
  const m = lire(p).match(new RegExp(motif.source, 'g')) || []
  verifie(p + ' : ' + nom + (n ? ' (' + n + ')' : ''), n ? m.length === n : m.length > 0, m.length)
}
// quiz.html
present('quiz.html', /Exposants\.formater\(formaterVVF\(adapterEnonce\(q,i\)\)\)/, 'énoncé (quiz + récapitulatif)', 2)
present('quiz.html', /<span class="opt-texte">\$\{Exposants\.formater\(opt\)\}<\/span>/, 'options (quiz + récapitulatif)', 2)
present('quiz.html', /La bonne réponse est : \$\{Exposants\.formater\(q\.opts\[q\.answer\]\)\}/, 'bonne réponse', 4)
present('quiz.html', /<br><br>\$\{Exposants\.formater\(q\.explication\)\}/, 'explication', 4)
aucun('quiz.html', /\$\{q\.explication\}|\$\{q\.opts\[q\.answer\]\}|<\/span>\$\{opt\}/, 'plus de texte de question inséré tel quel')
present('quiz.html', /Exposants\.formater\(h\)/, 'tableau : en-têtes', 1)
present('quiz.html', /Exposants\.formater\(cell\)/, 'tableau : cellules', 1)
// examen.html
present('examen.html', /Exposants\.formater\(q\.q\)/, 'énoncé (examen + correction)', 2)
present('examen.html', /<span class="opt-texte">'\+Exposants\.formater\(opt\)\+'<\/span>/, 'options', 3)
present('examen.html', /Exposants\.formater\(q\.opts\[bonneReponse\]\)/, 'bonne réponse', 1)
present('examen.html', /Exposants\.formater\(explication\)/, 'explication', 1)
aucun('examen.html', /'<p class="q-text">'\+q\.q\+|<\/span>'\+opt\+'<\/div>|\+q\.opts\[bonneReponse\]\+|\+explication\+'<\/div>'/, 'plus de texte de question inséré tel quel')
present('examen.html', /Exposants\.formater\(h\)/, 'tableau : en-têtes', 1)
present('examen.html', /Exposants\.formater\(cell\)/, 'tableau : cellules', 1)
// prof.html
present('prof.html', /Exposants\.formater\(formaterVVF\(texteAffiche\)\)/, 'énoncé de la banque', 1)
present('prof.html', /Exposants\.formater\(opt\)/, 'options de la banque', 1)
present('prof.html', /Exposants\.formater\(escHtml\(n\.notion\)\)/, 'notion (échappement AVANT)', 1)
present('prof.html', /Exposants\.formater\(h\)/, 'tableau : en-têtes', 1)
present('prof.html', /Exposants\.formater\(cell\)/, 'tableau : cellules', 1)
aucun('prof.html', /Exposants\.formater\([^)]*escHtml\(data\.|edit-question[^;]*Exposants|edit-explication[^;]*Exposants/, 'formulaire d\'édition laissé en Unicode brut')
// resultats.html
present('resultats.html', /Exposants\.formater\(esc\(l\)\)/, 'questions ratées (échappement AVANT)', 1)
// hors périmètre : jamais d'exposants.js dans les chemins non HTML
;['js/bilan-pdf.js', 'api/email.js', 'api/cron-rappel.js', 'lib/bilan-email.js', 'lib/recap-journalier.js'].forEach(f =>
  verifie(f + ' hors périmètre : n\'utilise pas Exposants', !/Exposants/.test(lire(f))))

console.log(echecs ? '\n' + echecs + ' ECHEC(S)' : '\nTout est ok.')
process.exit(echecs ? 1 : 0)
