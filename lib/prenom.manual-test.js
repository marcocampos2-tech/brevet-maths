// /lib/prenom.manual-test.js
//
// Test manuel (`node lib/prenom.manual-test.js`) après toute modification de
// js/prenom.js ou de ses points d'application. Aucune dépendance, aucun réseau.
//
// 1. La fonction (js/prenom.js) : majuscules, prénoms composés, vides, idempotence.
// 2. Le câblage : chaque fichier qui affiche un prénom importe/charge la fonction
//    (un prénom oublié se verrait seulement en minuscules, sans aucune erreur).
//    Les emails, le récap et le bilan sont exercés de bout en bout dans
//    lib/recap-journalier.manual-test.js et lib/bilan-email.manual-test.js.
const fs = require('fs')
const path = require('path')
const { formater } = require('../js/prenom.js')

let echecs = 0
function verifie(nom, ok, detail) {
  if (!ok) { echecs++; console.log('ECHEC  ' + nom + (detail !== undefined ? '  → ' + detail : '')) }
  else console.log('ok     ' + nom)
}
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')

console.log('\n[1] formater()')
const cas = [
  ['divine', 'Divine'],
  ['Divine', 'Divine'],
  ['jean-pierre', 'Jean-Pierre'],
  ['marie claire', 'Marie Claire'],
  ['marie-claire anne', 'Marie-Claire Anne'],
  ["d'artagnan", "D'Artagnan"],
  ['d’artagnan', 'D’Artagnan'],
  ['éloïse', 'Éloïse'],
  ['élie-ann', 'Élie-Ann'],
  ['ÉMILE', 'ÉMILE'],               // le reste du mot est laissé tel que saisi
  ['McKenzie', 'McKenzie'],
  ['  marie   claire  ', 'Marie Claire'], // espaces de bord et doubles nettoyés
  ['x', 'X'],
  ['', ''],
  ['   ', ''],
  [null, ''],
  [undefined, ''],
  [42, '42']
]
for (const [entree, attendu] of cas) {
  const r = formater(entree)
  verifie(`${JSON.stringify(entree)} → ${JSON.stringify(attendu)}`, r === attendu, JSON.stringify(r))
}
verifie('idempotente', cas.every(([e]) => formater(formater(e)) === formater(e)))
verifie('ne modifie pas l\'entrée (chaîne immuable) et ne lève jamais', (() => { try { formater({}); formater([]); formater(Symbol.iterator.description); return true } catch (e) { return false } })())

console.log('\n[2] Câblage : tous les points d\'affichage utilisent la fonction partagée')
const importe = f => /from '\.\.\/js\/prenom\.js'|require\('\.\.\/js\/prenom(\.js)?'\)/.test(lire(f))
for (const f of ['api/email.js', 'api/cron-rappel.js', 'api/inscription-stage.js', 'api/inscription-brevet.js', 'lib/bilan-email.js'])
  verifie(f + ' importe js/prenom.js', importe(f))
for (const f of ['suivi-parent.html', 'prof.html']) {
  const h = lire(f)
  const iPrenom = h.indexOf('<script src="/js/prenom.js'), iPdf = h.indexOf('<script src="/js/bilan-pdf.js')
  verifie(f + ' charge /js/prenom.js avant /js/bilan-pdf.js', iPrenom !== -1 && iPdf !== -1 && iPrenom < iPdf)
  verifie(f + ' : le prénom est mis en forme à la lecture des profils', /Prenom\.formater\(p\.prenom_affiche\)/.test(h))
}
verifie('js/bilan-pdf.js met le prénom en forme (titre du PDF)', /Prenom\.formater\(prenom\)/.test(lire('js/bilan-pdf.js')))
// L'affichage seul : aucune écriture en base avec la forme mise en majuscule.
const ecritures = ['suivi-parent.html', 'prof.html', 'api/inscription-stage.js', 'api/inscription-brevet.js']
  .filter(f => /(insert|update|upsert)\([^)]*formater/.test(lire(f)))
verifie('aucune écriture en base avec la forme mise en forme', ecritures.length === 0, ecritures.join(', '))
const insStage = lire('api/inscription-stage.js'), insBrevet = lire('api/inscription-brevet.js')
verifie('inscriptions : l\'INSERT garde la saisie (prenom, pas prenomAff)', /prenom, nom, email_parent, telephone/.test(insStage) && /prenom, nom, email_parent, telephone/.test(insBrevet))

if (echecs) { console.log('\n' + echecs + ' échec(s)'); process.exit(1) }
console.log('\nTous les contrôles passent.')
