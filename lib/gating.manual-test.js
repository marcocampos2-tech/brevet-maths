// /lib/gating.manual-test.js
//
// Test manuel isolé, PAS un test automatisé lancé en CI — script à
// exécuter à la main (`node lib/gating.manual-test.js`) pour vérifier
// le comportement des trois fonctions de lib/gating.js avant de les
// brancher sur un fichier appelant.

const assert = require('assert')
const { peutRecevoirEmailDetaille, peutRecevoirBilanComplet, peutPasserExamenBlanc } = require('./gating')

let nbCas = 0
function verifier(libelle, obtenu, attendu) {
  nbCas++
  assert.strictEqual(obtenu, attendu, `${libelle} — attendu ${attendu}, obtenu ${obtenu}`)
  console.log(`✅ ${libelle}`)
}

// ── peutRecevoirEmailDetaille ──────────────────────────────
verifier(
  'peutRecevoirEmailDetaille — plan_actif true',
  peutRecevoirEmailDetaille({ plan_actif: true }),
  true
)
verifier(
  'peutRecevoirEmailDetaille — plan_actif false',
  peutRecevoirEmailDetaille({ plan_actif: false }),
  false
)

// ── peutRecevoirBilanComplet ───────────────────────────────
verifier(
  'peutRecevoirBilanComplet — plan_actif true, dernierBilan null',
  peutRecevoirBilanComplet({ plan_actif: true }, null),
  true
)
verifier(
  'peutRecevoirBilanComplet — plan_actif false, dernierBilan null (jamais de bilan) → autorisé',
  peutRecevoirBilanComplet({ plan_actif: false }, null),
  true
)
verifier(
  'peutRecevoirBilanComplet — plan_actif false, dernierBilan total_sessions:0 (bilan précédent pas utile) → autorisé',
  peutRecevoirBilanComplet({ plan_actif: false }, { total_sessions: 0 }),
  true
)
verifier(
  'peutRecevoirBilanComplet — plan_actif false, dernierBilan total_sessions:5 (bilan utile déjà reçu) → refusé',
  peutRecevoirBilanComplet({ plan_actif: false }, { total_sessions: 5 }),
  false
)

// ── peutPasserExamenBlanc ──────────────────────────────────
verifier(
  'peutPasserExamenBlanc — plan_actif true',
  peutPasserExamenBlanc({ plan_actif: true }),
  true
)
verifier(
  'peutPasserExamenBlanc — plan_actif false, nbExamensDejaPasses 0',
  peutPasserExamenBlanc({ plan_actif: false }, 0),
  false
)
verifier(
  'peutPasserExamenBlanc — plan_actif false, nbExamensDejaPasses 3 (le paramètre n\'a aucun effet actuellement)',
  peutPasserExamenBlanc({ plan_actif: false }, 3),
  false
)

console.log(`\n${nbCas}/${nbCas} cas passés.`)
