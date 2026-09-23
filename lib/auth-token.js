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
async function verifierToken(access_token, supabaseUrl, serviceKey) {
  if (!access_token || typeof access_token !== 'string') return null
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${access_token}`, 'apikey': serviceKey }
    })
    if (!r.ok) return null
    const data = await r.json()
    return data && data.id ? data.id : null
  } catch (e) {
    return null
  }
}

module.exports = { verifierToken }
