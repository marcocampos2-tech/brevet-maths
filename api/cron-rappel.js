// /api/cron-rappel.js
export default async function handler(req, res) {

  // Sécurité : seul Vercel peut appeler ce endpoint
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const SUPA_URL = process.env.SUPABASE_URL || 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY
  }

  try {
    // 1. Récupérer tous les profils
    const profilsRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?select=user_id,prenom_affiche,email_parent`,
      { headers }
    )
    const profils = await profilsRes.json()

    if (!profils || profils.length === 0) {
      return res.status(200).json({ message: 'Aucun profil' })
    }

    const maintenant = new Date()
    const il_y_a_3_jours = new Date(maintenant - 3 * 24 * 60 * 60 * 1000).toISOString()
    const il_y_a_7_jours = new Date(maintenant - 7 * 24 * 60 * 60 * 1000).toISOString()

    let envoyes = 0, ignores = 0

    for (const profil of profils) {
      const { user_id, prenom_affiche, email_parent } = profil
      if (!email_parent) { ignores++; continue }

      // 2. Dernière session
      const sessionRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}&select=created_at&order=created_at.desc&limit=1`,
        { headers }
      )
      const sessions = await sessionRes.json()

      if (!sessions || sessions.length === 0) { ignores++; continue }

      const derniereSession = new Date(sessions[0].created_at)
      if (derniereSession.toISOString() > il_y_a_3_jours) { ignores++; continue }

      // 3. Dernier rappel envoyé
      const rappelRes = await fetch(
        `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&select=created_at&order=created_at.desc&limit=1`,
        { headers }
      )
      const rappels = await rappelRes.json()

      if (rappels && rappels.length > 0) {
        const dernierRappel = new Date(rappels[0].created_at)
        if (dernierRappel.toISOString() > il_y_a_7_jours) { ignores++; continue }
      }

      // 4. Jours d'inactivité
      const joursInactif = Math.floor((maintenant - derniereSession) / (1000 * 60 * 60 * 24))

      // 5. Envoyer email
      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
          </div>
          <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
          <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
            <p style="margin:0;font-size:16px">
              📚 <strong>${prenom_affiche}</strong> n'a pas révisé depuis 
              <strong>${joursInactif} jours</strong>.
            </p>
          </div>
          <p style="color:#444;line-height:1.6;margin-bottom:20px">
            Un petit coup de pouce peut faire toute la différence avant le brevet !
            <strong>10 minutes par jour</strong> suffisent pour progresser régulièrement.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="https://academika.fr" 
               style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Encourager ${prenom_affiche} à réviser →
            </a>
          </div>
          <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
            Vous recevez ce message car votre enfant est inscrit sur academika.fr<br>
            Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
          </p>
        </div>`

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'noreply@academika.fr',
          to: email_parent,
          subject: `📚 ${prenom_affiche} n'a pas révisé depuis ${joursInactif} jours — ACADEMIKA`,
          html
        })
      })

      if (emailRes.ok) {
        // 6. Enregistrer le rappel
        await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ user_id, email_parent, jours_inactif: joursInactif })
        })
        envoyes++
        console.log(`✅ Rappel envoyé à ${email_parent} pour ${prenom_affiche}`)
      } else {
        const err = await emailRes.json()
        console.error(`❌ Erreur email ${prenom_affiche}:`, err)
      }
    }

    return res.status(200).json({ success: true, envoyes, ignores, total: profils.length })

  } catch(e) {
    console.error('Erreur cron:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
