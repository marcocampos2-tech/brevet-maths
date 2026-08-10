// /api/desabonner.js
export default async function handler(req, res) {

  // ═══════════════════════════════════════════
  // GET — n'effectue plus aucune modification. Sert uniquement à
  // rediriger les anciens liens déjà envoyés vers la page de
  // confirmation, où une action explicite (POST) est requise.
  // ═══════════════════════════════════════════
  if (req.method === 'GET') {
    const email = req.query.email
    const suffix = email ? `?email=${encodeURIComponent(email)}` : ''
    return res.redirect(302, `/desabonner.html${suffix}`)
  }

  // ═══════════════════════════════════════════
  // POST — déclenché uniquement par le bouton de confirmation sur
  // desabonner.html. Seul point qui modifie réellement la base.
  // ═══════════════════════════════════════════
  if (req.method === 'POST') {
    const email = req.body?.email
    if (!email) return res.status(400).json({ error: 'Email requis' })

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
      return res.status(200).json({ success: true })
    } catch(e) {
      console.error('Erreur désabonnement:', e.message)
      return res.status(500).json({ error: 'Erreur lors du désabonnement' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
