// /lib/gating.js
//
// Fonctions de gating fonctionnalités gratuit/payant (offre Autonomie
// vs Suivi). Pas encore branchées sur aucun fichier appelant — module
// isolé, en attente de validation avant intégration.

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

module.exports = { peutRecevoirEmailDetaille, peutRecevoirBilanComplet, peutPasserExamenBlanc }
