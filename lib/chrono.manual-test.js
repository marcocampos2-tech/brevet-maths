// /lib/chrono.manual-test.js
//
// Test manuel isolé (PAS lancé en CI) : `node lib/chrono.manual-test.js`.
// Exerce js/chrono.js avec une horloge injectée. Aucune dépendance, aucun réseau.

const { creer } = require('../js/chrono.js')

let ok = 0, ko = 0
function check(nom, cond, detail) {
  if (cond) { ok++; console.log('  ✓', nom) }
  else { ko++; console.log('  ✗', nom, detail !== undefined ? '→ ' + detail : '') }
}
function horloge(t0 = 1_000_000) {
  const h = { t: t0, now: () => h.t, avance: s => { h.t += s * 1000 }, set: ms => { h.t = ms } }
  return h
}

console.log('\n── 1. Cas normal ──')
{
  const h = horloge(), c = creer(h.now)
  check('jamais démarré : 0', c.ecoule() === 0)
  c.demarrer()
  check('juste après démarrage : 0', c.ecoule() === 0)
  h.avance(1); check('1 s : 1', c.ecoule() === 1)
  h.t += 1999 - 1000; // 1,999 s au total
  check('1,999 s : 1 (arrondi à l\'inférieur)', c.ecoule() === 1, c.ecoule())
  h.set(1_000_000 + 239_900)
  check('3 min 59,x : 239', c.ecoule() === 239, c.ecoule())
  const f = c.figer()
  check('figer() rend la valeur courante', f === 239, f)
  h.avance(120)
  check('figé : la valeur ne bouge plus', c.ecoule() === 239, c.ecoule())
  check('figer() est idempotent', c.figer() === 239)
}

console.log('\n── 2. Retour après longue pause (écran verrouillé) ──')
{
  const h = horloge(), c = creer(h.now)
  c.demarrer()
  h.avance(66)              // 1 min 06 actives
  c.ecoule()                // dernier tick avant la veille
  h.avance(5 * 60)          // la page est suspendue : plus aucun appel pendant 5 min
  check('au retour : 6 min 06 (pas 1 min 06)', c.ecoule() === 66 + 300, c.ecoule())
  check('figer() après la pause = temps réel', c.figer() === 366)
}

console.log('\n── 3. Valeur négative ──')
{
  const h = horloge(), c = creer(h.now)
  c.demarrer()
  h.avance(-10)
  check('horloge qui recule : 0, jamais négatif', c.ecoule() === 0, c.ecoule())
  check('figer() avec horloge reculée : 0', c.figer() === 0)

  const c2 = creer(() => NaN)
  c2.demarrer()
  check('horloge illisible (NaN) : 0', c2.ecoule() === 0 && c2.figer() === 0)

  const h2 = horloge(), c3 = creer(h2.now)
  check('figer() sans démarrage : 0', c3.figer() === 0)
  h2.avance(30)
  check('…et reste figé à 0', c3.ecoule() === 0)
}

console.log('\n── 4. Redémarrage (nouvelle ronde) ──')
{
  const h = horloge(), c = creer(h.now)
  c.demarrer(); h.avance(100); c.figer()
  h.avance(500)
  c.demarrer()
  check('demarrer() efface la valeur figée et repart de 0', c.ecoule() === 0, c.ecoule())
  h.avance(7)
  check('nouvelle ronde : 7 s', c.ecoule() === 7, c.ecoule())
}

console.log('\n── 5. Horloge par défaut ──')
{
  const c = creer()
  c.demarrer()
  const v = c.ecoule()
  check('Date.now par défaut : entier ≥ 0', Number.isInteger(v) && v >= 0, v)
}

console.log(`\n${ok} réussis, ${ko} échoués`)
process.exit(ko ? 1 : 0)
