// /lib/garde-envoi.js
//
// Garde d'envoi des bilans parents. Une preview Vercel partage la base ET la
// clé Resend de la production : sans garde, un test envoyé depuis une preview
// partirait chez de vrais parents. Règle, fail-closed :
//
//   - VERCEL_ENV === 'production' (variable posée par la plateforme, jamais par
//     une requête) : le destinataire est l'email_parent réel ;
//   - tout le reste (preview, development, variable absente) : le seul
//     destinataire possible est EMAIL_TEST_DESTINATAIRE (variable d'environnement
//     du scope Preview, une seule adresse). Absente ou invalide : aucun envoi.
//
// L'adresse de test n'est JAMAIS lue dans une requête. Le chemin production ne
// lit pas EMAIL_TEST_DESTINATAIRE. Tout envoi de bilan passe par envoyerA(), qui
// revérifie la règle au moment d'appeler Resend.
// Tests : node lib/bilan-email.manual-test.js

function estProduction() {
  return process.env.VERCEL_ENV === 'production'
}

// Une seule adresse, sans séparateur : « a@x.fr, b@y.fr » est refusé.
function destinataireTest() {
  const a = String(process.env.EMAIL_TEST_DESTINATAIRE || '').trim()
  return /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(a) ? a : null
}

// { to, test } : to vaut null quand aucun envoi n'est permis (hors production,
// sans adresse de test valide, ou sans adresse réelle en production).
function resoudreDestinataire(emailReel) {
  if (estProduction()) {
    const reel = String(emailReel || '').trim()
    return { to: reel || null, test: false }
  }
  return { to: destinataireTest(), test: true }
}

// Seul point d'appel de Resend pour les bilans. `dest` vient de
// resoudreDestinataire(). Renvoie { ok, status } ; ne lève que sur une
// violation de la règle ci-dessus (bug d'appelant, jamais une panne réseau).
async function envoyerA(dest, sujet, html) {
  if (!dest || !dest.to) throw new Error('garde-envoi : aucun destinataire autorisé')
  if (!estProduction() && dest.to !== destinataireTest()) {
    throw new Error('garde-envoi : hors production, seul EMAIL_TEST_DESTINATAIRE est autorisé')
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: 'noreply@academika.fr', to: dest.to, subject: sujet, html })
  })
  return { ok: r.ok, status: r.status }
}

module.exports = { estProduction, destinataireTest, resoudreDestinataire, envoyerA }
