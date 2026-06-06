// /api/cron-rappel.js
export default async function handler(req, res) {

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
    const maintenant = new Date()
    const mois = maintenant.getMonth() + 1 // 1-12
    const jour = maintenant.getDate()

    // Récupérer tous les profils
    const profilsRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?select=user_id,prenom_affiche,email_parent,email_actif`,
      { headers }
    )
    const profils = await profilsRes.json()
    if (!profils || profils.length === 0) {
      return res.status(200).json({ message: 'Aucun profil' })
    }

    // ── PÉRIODE FIN D'ANNÉE (27-30 juin) ──────────────────
    if (mois === 6 && jour >= 27) {
      let envoyes = 0
      for (const profil of profils) {
        const { user_id, prenom_affiche, email_parent, email_actif } = profil
        if (!email_parent || email_actif === false) continue

        // Vérifier qu'on n'a pas déjà envoyé l'email de fin d'année
        const rappelRes = await fetch(
          `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&type=eq.fin_annee&select=id&limit=1`,
          { headers }
        )
        const rappels = await rappelRes.json()
        if (rappels && rappels.length > 0) continue

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0;font-size:16px">🎓 Le brevet est passé — bravo à <strong>${prenom_affiche}</strong> pour ses efforts cette année !</p>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              Merci d'avoir fait confiance à Academika cette année.<br><br>
              Le compte de <strong>${prenom_affiche}</strong> reste actif — il peut continuer à réviser pendant l'été s'il le souhaite.
            </p>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              🎓 <strong>Nouveauté à la rentrée :</strong> nous travaillons sur Academika Seconde et vous tiendrons informés très bientôt.
            </p>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'noreply@academika.fr',
            to: email_parent,
            subject: `🎓 Bonne fin d'année — Merci pour cette année sur ACADEMIKA`,
            html
          })
        })

        if (emailRes.ok) {
          await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_id, email_parent, type: 'fin_annee', jours_inactif: 0 })
          })
          envoyes++
        }
      }
      return res.status(200).json({ success: true, type: 'fin_annee', envoyes })
    }

    // ── PÉRIODE ÉTÉ (juillet) ──────────────────────────────
    if (mois === 7) {
      let envoyes = 0
      for (const profil of profils) {
        const { user_id, prenom_affiche, email_parent, email_actif } = profil
        if (!email_parent || email_actif === false) continue

        // Vérifier qu'on n'a pas déjà envoyé l'email été
        const rappelRes = await fetch(
          `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&type=eq.ete&select=id&limit=1`,
          { headers }
        )
        const rappels = await rappelRes.json()
        if (rappels && rappels.length > 0) continue

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0;font-size:16px">🌞 Bonnes vacances à toute la famille !</p>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              Academika reste ouvert cet été — <strong>${prenom_affiche}</strong> peut continuer à réviser quand il le souhaite, à son rythme.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
                Continuer à réviser →
              </a>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              🎓 <strong>Nouveauté à la rentrée :</strong> nous travaillons sur Academika Seconde et vous tiendrons informés très bientôt.
            </p>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'noreply@academika.fr',
            to: email_parent,
            subject: `🌞 Bonnes vacances — Academika reste ouvert cet été !`,
            html
          })
        })

        if (emailRes.ok) {
          await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_id, email_parent, type: 'ete', jours_inactif: 0 })
          })
          envoyes++
        }
      }
      return res.status(200).json({ success: true, type: 'ete', envoyes })
    }

    // ── PÉRIODE AOÛT — silence total ──────────────────────
    if (mois === 8) {
      return res.status(200).json({ message: 'Août — pas de rappels' })
    }

    // ── PÉRIODE NORMALE (sept → 26 juin) ─────────────────
    const il_y_a_3_jours = new Date(maintenant - 3 * 24 * 60 * 60 * 1000).toISOString()
    const il_y_a_7_jours = new Date(maintenant - 7 * 24 * 60 * 60 * 1000).toISOString()

    let envoyes = 0, ignores = 0

    for (const profil of profils) {
      const { user_id, prenom_affiche, email_parent, email_actif } = profil
      if (!email_parent) { ignores++; continue }
      if (email_actif === false) { ignores++; continue }

      // Dernière session
      const sessionRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}&select=created_at&order=created_at.desc&limit=1`,
        { headers }
      )
      const sessions = await sessionRes.json()
      if (!sessions || sessions.length === 0) { ignores++; continue }

      const derniereSession = new Date(sessions[0].created_at)
      if (derniereSession.toISOString() > il_y_a_3_jours) { ignores++; continue }

      // Dernier rappel
      const rappelRes = await fetch(
        `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&select=created_at&order=created_at.desc&limit=1`,
        { headers }
      )
      const rappels = await rappelRes.json()
      if (rappels && rappels.length > 0) {
        const dernierRappel = new Date(rappels[0].created_at)
        if (dernierRappel.toISOString() > il_y_a_7_jours) { ignores++; continue }
      }

      const joursInactif = Math.floor((maintenant - derniereSession) / (1000 * 60 * 60 * 24))
      const lienDesabonnement = `https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}`

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
            <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Encourager ${prenom_affiche} à réviser →
            </a>
          </div>
          <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
            Vous recevez ce message car votre enfant est inscrit sur academika.fr<br>
            Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
          </p>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="${lienDesabonnement}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'noreply@academika.fr',
          to: email_parent,
          subject: `📚 ${prenom_affiche} n'a pas révisé depuis ${joursInactif} jours — ACADEMIKA`,
          html
        })
      })

      if (emailRes.ok) {
        await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ user_id, email_parent, type: 'rappel', jours_inactif: joursInactif })
        })
        envoyes++
      } else {
        ignores++
      }
    }

    return res.status(200).json({ success: true, envoyes, ignores, total: profils.length })

  } catch(e) {
    console.error('Erreur cron:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
