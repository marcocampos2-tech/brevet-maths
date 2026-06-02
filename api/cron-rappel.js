// /api/cron-rappel.js
// Tourne chaque jour à 18h (Paris)
// Envoie un email au parent si l'élève est inactif depuis 3 jours

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // clé SERVICE (pas publishable)
)

export default async function handler(req, res) {

  // Sécurité : seul Vercel peut appeler ce endpoint
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  try {
    // ── 1. Récupérer tous les profils actifs ──────────────────
    const { data: profils, error: errProfils } = await sb
      .from('profils')
      .select('user_id, prenom_affiche, email_parent')

    if (errProfils) throw new Error('Erreur profils: ' + errProfils.message)
    if (!profils || profils.length === 0) {
      return res.status(200).json({ message: 'Aucun profil trouvé' })
    }

    const maintenant = new Date()
    const il_y_a_3_jours = new Date(maintenant - 3 * 24 * 60 * 60 * 1000)
    const il_y_a_10_jours = new Date(maintenant - 10 * 24 * 60 * 60 * 1000)

    let envoyes = 0
    let ignores = 0

    for (const profil of profils) {
      const { user_id, prenom_affiche, email_parent } = profil

      if (!email_parent) { ignores++; continue }

      // ── 2. Dernière session de cet élève ─────────────────────
      const { data: dernierResult } = await sb
        .from('resultats')
        .select('created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)

      const derniereSession = dernierResult && dernierResult.length > 0
        ? new Date(dernierResult[0].created_at)
        : null

      // Jamais fait de quiz → ignorer (ils sont nouveaux)
      if (!derniereSession) { ignores++; continue }

      // A fait un quiz récemment → pas de rappel
      if (derniereSession > il_y_a_3_jours) { ignores++; continue }

      // ── 3. Vérifier qu'on n'a pas déjà envoyé un rappel cette semaine ──
      const { data: dernierRappel } = await sb
        .from('rappels_envoyes')
        .select('created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (dernierRappel && dernierRappel.length > 0) {
        const dateRappel = new Date(dernierRappel[0].created_at)
        // On a déjà envoyé un rappel il y a moins de 7 jours → skip
        if (dateRappel > il_y_a_10_jours) { ignores++; continue }
      }

      // ── 4. Calculer les jours d'inactivité ───────────────────
      const joursInactif = Math.floor(
        (maintenant - derniereSession) / (1000 * 60 * 60 * 24)
      )

      // ── 5. Envoyer l'email au parent ─────────────────────────
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
        // ── 6. Enregistrer le rappel envoyé ──────────────────
        await sb.from('rappels_envoyes').insert({
          user_id,
          email_parent,
          jours_inactif: joursInactif
        })
        envoyes++
        console.log(`✅ Rappel envoyé à ${email_parent} pour ${prenom_affiche}`)
      } else {
        const errData = await emailRes.json()
        console.error(`❌ Erreur email pour ${prenom_affiche}:`, errData)
      }
    }

    return res.status(200).json({
      success: true,
      envoyes,
      ignores,
      total: profils.length
    })

  } catch(e) {
    console.error('Erreur cron:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
