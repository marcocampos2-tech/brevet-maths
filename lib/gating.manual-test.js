// /lib/gating.manual-test.js
//
// Test manuel isolé, PAS un test automatisé lancé en CI — script à
// exécuter à la main (`node lib/gating.manual-test.js`) pour vérifier
// le comportement des trois fonctions de lib/gating.js avant de les
// brancher sur un fichier appelant.

const assert = require('assert')
const { estAccompagne, apresBascule, estVerrouille, peutRecevoirEmailDetaille, peutPasserExamenBlanc, FIN_OFFRE_LANCEMENT, enPeriodeGratuite } = require('./gating')

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

// ── FIN_OFFRE_LANCEMENT / enPeriodeGratuite ────────────────
// Vérifie que la constante n'a pas dérivé (doit rester identique à celle
// utilisée dans api/stripe-checkout.js) et que enPeriodeGratuite() est
// cohérente avec elle. Ce dernier cas passera au vrai/faux tout seul
// après le 01/12/2026 — normal, c'est le but de cette fonction.
verifier(
  'FIN_OFFRE_LANCEMENT — 01/12/2026 minuit heure de Paris',
  FIN_OFFRE_LANCEMENT.toISOString(),
  new Date('2026-12-01T00:00:00+01:00').toISOString()
)
verifier(
  'enPeriodeGratuite() — cohérente avec la date système au moment du test',
  enPeriodeGratuite(),
  new Date() < FIN_OFFRE_LANCEMENT
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

// ── estAccompagne ──────────────────────────────────────────
// Midi à Paris le 15/10/2026 (été, UTC+2) : le jour même = 2026-10-15.
const MIDI = new Date('2026-10-15T12:00:00+02:00')
const acces = d => ({ plan_actif: false, cours_particuliers_actif: false, acces_offert_jusqu: d })
verifier('estAccompagne — date la veille → Libre', estAccompagne(acces('2026-10-14'), MIDI), false)
verifier('estAccompagne — date le jour même → Accompagné', estAccompagne(acces('2026-10-15'), MIDI), true)
verifier('estAccompagne — date le lendemain → Accompagné', estAccompagne(acces('2026-10-16'), MIDI), true)
verifier('estAccompagne — date null → Libre', estAccompagne(acces(null), MIDI), false)
verifier('estAccompagne — aucune des trois colonnes (undefined) → Libre', estAccompagne({}, MIDI), false)
verifier('estAccompagne — profil null → Libre', estAccompagne(null, MIDI), false)
verifier('estAccompagne — plan_actif seul', estAccompagne({ plan_actif: true }, MIDI), true)
verifier('estAccompagne — cours seul', estAccompagne({ cours_particuliers_actif: true }, MIDI), true)
verifier('estAccompagne — cumul des trois', estAccompagne({ plan_actif: true, cours_particuliers_actif: true, acces_offert_jusqu: '2026-10-16' }, MIDI), true)
verifier('estAccompagne — cumul : accès expiré mais abonnement', estAccompagne({ plan_actif: true, cours_particuliers_actif: false, acces_offert_jusqu: '2026-10-01' }, MIDI), true)
// Bascule à minuit heure de Paris (été) : 23:59 le 15 → encore le 15 ; 00:00 le 16 → le 16.
verifier('estAccompagne — 23:59 Paris, accès jusqu\'au jour même (été)', estAccompagne(acces('2026-10-15'), new Date('2026-10-15T23:59:00+02:00')), true)
verifier('estAccompagne — 00:00 Paris le lendemain, accès expiré (été)', estAccompagne(acces('2026-10-15'), new Date('2026-10-16T00:00:00+02:00')), false)
// Hiver (UTC+1) : 23:59 le 15/12 à Paris = 22:59 UTC, même jour.
verifier('estAccompagne — 23:59 Paris (hiver), jour même', estAccompagne(acces('2026-12-15'), new Date('2026-12-15T23:59:00+01:00')), true)
verifier('estAccompagne — 00:00 Paris (hiver), lendemain', estAccompagne(acces('2026-12-15'), new Date('2026-12-16T00:00:00+01:00')), false)
// 22:30 UTC le 15 = 00:30 le 16 à Paris (été) : le jour à Paris est déjà le 16.
verifier('estAccompagne — 22:30 UTC = lendemain à Paris (été)', estAccompagne(acces('2026-10-15'), new Date('2026-10-15T22:30:00Z')), false)

// ── apresBascule / estVerrouille (lot 2) ───────────────────
const AVANT = new Date('2026-11-30T23:59:00+01:00')
const APRES = new Date('2026-12-01T00:00:00+01:00')
const LIBRE = { plan_actif: false, cours_particuliers_actif: false, acces_offert_jusqu: null }
const envInitial = process.env.VERCEL_ENV
function avecEnv(valeur, f) {
  if (valeur === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = valeur
  try { return f() } finally { if (envInitial === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = envInitial }
}
verifier('estVerrouille — avant la bascule, élève Libre → jamais verrouillé', estVerrouille(LIBRE, { maintenant: AVANT }), false)
verifier('estVerrouille — 01/12 00:00 Paris, élève Libre → verrouillé', estVerrouille(LIBRE, { maintenant: APRES }), true)
verifier('estVerrouille — après, abonnement → débloqué', estVerrouille({ ...LIBRE, plan_actif: true }, { maintenant: APRES }), false)
verifier('estVerrouille — après, cours particuliers → débloqué', estVerrouille({ ...LIBRE, cours_particuliers_actif: true }, { maintenant: APRES }), false)
verifier('estVerrouille — après, accès offert jusqu\'à demain → débloqué', estVerrouille({ ...LIBRE, acces_offert_jusqu: '2026-12-02' }, { maintenant: APRES }), false)
verifier('estVerrouille — après, accès offert jusqu\'au jour même → débloqué', estVerrouille({ ...LIBRE, acces_offert_jusqu: '2026-12-01' }, { maintenant: APRES }), false)
verifier('estVerrouille — après, accès offert expiré hier → verrouillé', estVerrouille({ ...LIBRE, acces_offert_jusqu: '2026-11-30' }, { maintenant: APRES }), true)
verifier('estVerrouille — profil null après la bascule → verrouillé', estVerrouille(null, { maintenant: APRES }), true)
verifier('simulation — VERCEL_ENV=preview + drapeau → après bascule (avant la date réelle)', avecEnv('preview', () => estVerrouille(LIBRE, { maintenant: AVANT, simulerBascule: true })), true)
verifier('simulation — preview sans drapeau → inchangé', avecEnv('preview', () => estVerrouille(LIBRE, { maintenant: AVANT })), false)
verifier('simulation — preview + drapeau + Accompagné → débloqué', avecEnv('preview', () => estVerrouille({ ...LIBRE, plan_actif: true }, { maintenant: AVANT, simulerBascule: true })), false)
verifier('simulation — VERCEL_ENV=production + drapeau → IGNORÉ', avecEnv('production', () => estVerrouille(LIBRE, { maintenant: AVANT, simulerBascule: true })), false)
verifier('simulation — VERCEL_ENV=development + drapeau → ignoré', avecEnv('development', () => estVerrouille(LIBRE, { maintenant: AVANT, simulerBascule: true })), false)
verifier('simulation — VERCEL_ENV absent + drapeau → ignoré', avecEnv(undefined, () => estVerrouille(LIBRE, { maintenant: AVANT, simulerBascule: true })), false)
verifier('simulation — drapeau non booléen (chaîne « true ») → ignoré', avecEnv('preview', () => apresBascule(AVANT, 'true')), false)
verifier('simulation — la simulation ne rend jamais PLUS permissif (après la date réelle, production)', avecEnv('production', () => estVerrouille(LIBRE, { maintenant: APRES, simulerBascule: false })), true)

console.log(`\n${nbCas}/${nbCas} cas passés.`)
