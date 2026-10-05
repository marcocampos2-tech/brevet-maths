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
    // Adresse normalisée (trim, minuscules) et comparée sans tenir compte de la
    // casse (ilike) : le lien de l'email peut porter une casse différente de
    // celle stockée dans profils.email_parent. '*' est exclu : PostgREST le
    // traite comme un joker dans ilike, et l'échappement ci-dessous ne le couvre
    // pas (une adresse « * » désabonnerait tout le monde).
    const brut = req.body?.email
    const email = typeof brut === 'string' ? brut.trim().toLowerCase() : ''
    if (!email) return res.status(400).json({ error: 'Email requis' })
    if (email.length > 254 || /[\s*]/.test(email) || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' })
    }

    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPA_KEY}`,
      'apikey': SUPA_KEY,
      'Prefer': 'return=representation'
    }

    // Même échappement qu'escapeIlike() d'api/email.js (\ % _), valeur encodée.
    const motif = email.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/profils?email_parent=ilike.${encodeURIComponent(motif)}&select=user_id`,
        { method: 'PATCH', headers, body: JSON.stringify({ email_actif: false }) }
      )
      if (!r.ok) throw new Error('Erreur Supabase, statut ' + r.status)
      const lignes = await r.json()
      // 0 ligne : réponse identique au succès côté page, pour ne pas révéler
      // si une adresse est inscrite. Journal sans l'adresse.
      if (!Array.isArray(lignes) || lignes.length === 0) console.log('Désabonnement : 0 ligne')
      return res.status(200).json({ success: true })
    } catch(e) {
      console.error('Erreur désabonnement:', e.message)
      return res.status(500).json({ error: 'Erreur lors du désabonnement' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
