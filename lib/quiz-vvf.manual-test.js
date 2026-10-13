// /lib/quiz-vvf.manual-test.js
// Test manuel (`node lib/quiz-vvf.manual-test.js`) après toute modification de `formaterVVF`.
// La fonction est extraite de quiz.html ET de prof.html (copies à garder identiques) puis évaluée.
const fs = require('fs')
const path = require('path')
function extraire(fichier) {
  const src = fs.readFileSync(path.join(__dirname, '..', fichier), 'utf8')
  const d = src.indexOf('function formaterVVF(')
  if (d === -1) throw new Error('formaterVVF introuvable dans ' + fichier)
  let i = src.indexOf('{', d), n = 0, f = i
  for (; f < src.length; f++) { if (src[f] === '{') n++; else if (src[f] === '}') { n--; if (n === 0) break } }
  return src.slice(d, f + 1)
}
const codeQuiz = extraire('quiz.html'), codeProf = extraire('prof.html')
let echecs = 0
function verifie(nom, ok) { if (!ok) { echecs++; console.log('ECHEC  ' + nom) } else console.log('ok     ' + nom) }
verifie('copies identiques dans quiz.html et prof.html', codeQuiz === codeProf)
const formater = new Function(codeQuiz + '; return formaterVVF')()
const vvf = "Pour chaque affirmation, indique si elle est vraie (V) ou fausse (F). Affirmation 1 : A. Affirmation 2 : B. Affirmation 3 : C. Quelle suite est correcte pour les affirmations 1, 2 et 3 ?"
const attendu = "Pour chaque affirmation, indique si elle est vraie (V) ou fausse (F).<br>Affirmation 1 : A.<br>Affirmation 2 : B.<br>Affirmation 3 : C.<br>Quelle suite est correcte pour les affirmations 1, 2 et 3 ?"
verifie('VVF : une affirmation par ligne + question finale', formater(vvf) === attendu)
verifie('idempotent sur un texte déjà formaté', formater(attendu) === attendu)
const normal = "Calcule la longueur AB. Donne la valeur arrondie au dixième."
verifie('énoncé ordinaire inchangé', formater(normal) === normal)
verifie('vide / null sans erreur', formater('') === '' && formater(null) === '' && formater(undefined) === '')
verifie('mot « affirmation » isolé inchangé', formater("Cette affirmation est-elle vraie ?") === "Cette affirmation est-elle vraie ?")
if (echecs) { console.log(echecs + ' échec(s)'); process.exit(1) }
console.log('Tout est ok')
