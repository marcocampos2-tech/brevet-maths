// /lib/gating.js
//
// Fonctions de gating fonctionnalités gratuit/payant (offre Autonomie
// vs Suivi).

// FIN_OFFRE_LANCEMENT — source unique de la date de fin de l'offre de
// lancement, réutilisée par api/stripe-checkout.js (durée de l'essai
// Stripe) et api/email.js (recap-journalier-user : detailComplet = ... ||
// enPeriodeGratuite(), pendant le lancement tout le monde reçoit l'email
// détaillé). Ne PAS dupliquer une nouvelle fois ailleurs côté serveur —
// importer depuis ici. Exception : suivi-parent.html a sa propre constante
// identique côté client (fichier HTML statique, pas de bundler pour
// importer ce module) — à garder synchronisée manuellement si cette date
// change.
const FIN_OFFRE_LANCEMENT = new Date('2026-12-01T00:00:00+01:00') // minuit heure de Paris, pas UTC

function enPeriodeGratuite() {
  return new Date() < FIN_OFFRE_LANCEMENT
}

function peutRecevoirEmailDetaille(profil) {
  return profil.plan_actif === true
}

function peutRecevoirBilanComplet(profil, dernierBilan) {
  if (profil.plan_actif) return true
  const aDejaEuUnBilanUtile = dernierBilan && dernierBilan.total_sessions > 0
  return !aDejaEuUnBilanUtile
}

function peutPasserExamenBlanc(profil, nbExamensDejaPasses = 0) {
  return profil.plan_actif === true
}

module.exports = { peutRecevoirEmailDetaille, peutRecevoirBilanComplet, peutPasserExamenBlanc, FIN_OFFRE_LANCEMENT, enPeriodeGratuite }
