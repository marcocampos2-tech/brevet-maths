// /lib/auth-token.js
//
// Vérifie un jeton d'accès Supabase Auth auprès de /auth/v1/user et renvoie
// le user_id qu'il porte réellement, ou null sur tout échec (jeton absent,
// invalide, expiré, ou panne réseau) — jamais d'exception propagée. Ne fait
// jamais confiance à un user_id lu dans le corps de la requête.
//
// Extrait de api/examen.js (chantier reprise de session, PR #84) et partagé
// avec api/quiz-resultat.js et api/email.js (recap-journalier-user) — cf.
// docs/TODO.md, item 27. Volontairement séparé de lib/auth-eleve.js (qui
// répond à une question différente : "ce user_id est-il un compte élève
// réel ?", pas "qui est réellement l'appelant ?") et écrit en CommonJS pour
// rester importable tel quel depuis api/email.js (CJS) sans dépendre d'une
// interop ESM→CJS non éprouvée ailleurs dans ce dépôt.

// Utilisateur renvoyé par /auth/v1/user pour ce jeton, ou null sur tout
// échec. Source unique des deux fonctions ci-dessous : ce que contient
// l'objet (id, app_metadata…) vient du serveur Supabase, jamais du client.
async function lireUtilisateur(access_token, supabaseUrl, serviceKey) {
  if (!access_token || typeof access_token !== 'string') return null
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${access_token}`, 'apikey': serviceKey }
    })
    if (!r.ok) return null
    const data = await r.json()
    return data && data.id ? data : null
  } catch (e) {
    return null
  }
}

async function verifierToken(access_token, supabaseUrl, serviceKey) {
  const user = await lireUtilisateur(access_token, supabaseUrl, serviceKey)
  return user ? user.id : null
}

// Identité complète portée par le jeton : { id, email, emailConfirme } ou null
// sur tout échec (même politique que verifierToken : jamais d'exception).
// emailConfirme vaut true si email_confirmed_at est présent dans l'objet
// renvoyé par Supabase — même exigence que est_parent_de() /
// email_parent_valide() côté base (db/policies.sql). email est null si le
// compte n'en porte pas.
async function verifierUtilisateur(access_token, supabaseUrl, serviceKey) {
  const user = await lireUtilisateur(access_token, supabaseUrl, serviceKey)
  if (!user) return null
  return {
    id: user.id,
    email: typeof user.email === 'string' && user.email ? user.email : null,
    emailConfirme: !!user.email_confirmed_at
  }
}

// Le jeton est-il valide ET celui du prof ? Le rôle est lu dans
// app_metadata de l'objet renvoyé par Supabase (champ posé uniquement via
// service_role, non modifiable par l'utilisateur) — jamais dans user_metadata
// ni dans le corps de la requête. Renvoie 'ok', 'non-authentifie' (jeton
// absent, invalide, expiré ou panne → 401) ou 'non-prof' (jeton valide, autre
// rôle → 403).
async function verifierProf(access_token, supabaseUrl, serviceKey) {
  const user = await lireUtilisateur(access_token, supabaseUrl, serviceKey)
  if (!user) return 'non-authentifie'
  return user.app_metadata && user.app_metadata.role === 'prof' ? 'ok' : 'non-prof'
}

module.exports = { verifierToken, verifierUtilisateur, verifierProf }
