// /api/desabonner.js
export default async function handler(req, res) {

  const email = req.query.email || req.body?.email
  if (!email) {
    return res.redirect(302, '/desabonner.html?error=1')
  }

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY,
    'Prefer': 'return=minimal'
  }

  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/profils?email_parent=eq.${encodeURIComponent(email)}`,
      { method: 'PATCH', headers, body: JSON.stringify({ email_actif: false }) }
    )
    if (!r.ok) throw new Error('Erreur Supabase')
    res.redirect(302, '/desabonner.html?success=1')
  } catch(e) {
    console.error('Erreur désabonnement:', e.message)
    res.redirect(302, '/desabonner.html?error=1')
  }
}
