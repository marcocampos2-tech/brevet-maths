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

// Date du jour à Paris, « AAAA-MM-JJ » (en-CA formate ainsi). Comparée en
// chaînes à acces_offert_jusqu (colonne date, renvoyée « AAAA-MM-JJ »).
function dateParis(maintenant) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(maintenant)
}

// Accompagné = abonnement payé OU cours particuliers en cours OU accès offert
// jusqu'à une date (incluse, heure de Paris). Même règle que la fonction SQL
// public.est_accompagne() (db/accompagne.sql) ; copie dans prof.html
// (statutOffre). Statut par élève (ligne profils). Pas encore branchée
// ailleurs (lot 2).
function estAccompagne(profil, maintenant = new Date()) {
  const p = profil || {}
  if (p.plan_actif === true || p.cours_particuliers_actif === true) return true
  return typeof p.acces_offert_jusqu === 'string' && p.acces_offert_jusqu.slice(0, 10) >= dateParis(maintenant)
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

module.exports = { estAccompagne, peutRecevoirEmailDetaille, peutRecevoirBilanComplet, peutPasserExamenBlanc, FIN_OFFRE_LANCEMENT, enPeriodeGratuite }
