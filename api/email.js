// /api/email.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, prenom, nom, theme, difficulte, score, total, 
            questionsRatees, tempsSecondes, resultatsId } = req.body

    const pct = Math.round((score / total) * 100)

    // Ne pas envoyer si score >= 40% — récap hebdo suffisant
    if (pct >= 40) {
      return res.status(200).json({ success: true, skipped: true, reason: 'score >= 40%' })
    }

    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
    const supaHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPA_KEY}`,
      'apikey': SUPA_KEY
    }

    // Vérifier si une alerte a déjà été envoyée aujourd'hui pour cet élève
    const aujourd_hui = new Date().toISOString().split('T')[0]
    const alerteRes = await fetch(
      `${SUPA_URL}/rest/v1/resultats?email_parent=eq.${encodeURIComponent(emailParent)}&alerte_envoyee=eq.true&created_at=gte.${aujourd_hui}T00:00:00&select=id,theme,difficulte,score,total,questions_ratees`,
      { headers: supaHeaders }
    )
    const alertesAujourdhui = await alerteRes.json()

    const couleurScore = '#dc2626'
    const m = Math.floor(tempsSecondes / 60)
    const s = tempsSecondes % 60
    const tempsFormat = m === 0 ? `${s} sec` : `${m} min ${s} sec`

    const lienDesabonnement = `https://academika.fr/api/desabonner?email=${encodeURIComponent(emailParent)}`

    let html = ''
    let sujet = ''

    if (alertesAujourdhui && alertesAujourdhui.length > 0) {
      // 2+ quiz ratés aujourd'hui — email groupé
      const toutesLesSessions = [
        ...alertesAujourdhui,
        { theme, difficulte, score, total, questions_ratees: questionsRatees }
      ]

      sujet = `⚠️ ${prenom} a eu des difficultés aujourd'hui — ACADEMIKA`

      const sessionsHTML = toutesLesSessions.map(s => {
        const sp = Math.round((s.score / s.total) * 100)
        const ratees = (s.questions_ratees || []).slice(0, 3)
        return `
          <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:10px">
            <div style="font-weight:700;color:#dc2626;margin-bottom:6px">
              ❌ ${s.theme} — ${s.difficulte} : ${s.score}/${s.total} (${sp}%)
            </div>
            ${ratees.length > 0 ? `
              <div style="font-size:12px;color:#666">
                ${ratees.map(q => `• ${q.replace(s.theme+' — ','')}`).join('<br>')}
              </div>` : ''}
          </div>`
      }).join('')

      html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
          </div>
          <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444">
            <strong>${prenom}</strong> a passé <strong>${toutesLesSessions.length} sessions</strong> aujourd'hui 
            avec des difficultés :
          </p>
          ${sessionsHTML}
          <p style="color:#444;line-height:1.6;margin-top:20px">
            Ces thèmes nécessitent du travail. Un encouragement ce soir peut faire toute la différence !
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Voir ses résultats complets →
            </a>
          </div>
          <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
            Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
          </p>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="${lienDesabonnement}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

    } else {
      // 1er quiz raté aujourd'hui
      sujet = `⚠️ ${prenom} a eu des difficultés aujourd'hui — ACADEMIKA`

      const rateesHTML = questionsRatees && questionsRatees.length > 0
        ? `<div style="margin-top:16px">
            <p style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">📚 Points à retravailler :</p>
            ${questionsRatees.slice(0,3).map(q => `
              <div style="font-size:13px;color:#666;padding:4px 0">
                • ${q.replace(theme+' — ','')}
              </div>`).join('')}
          </div>`
        : ''

      html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
          </div>
          <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444">
            <strong>${prenom}</strong> a passé une session de révision aujourd'hui 
            qui nécessite votre attention :
          </p>
          <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
            <div style="font-size:16px;font-weight:700;color:#dc2626;margin-bottom:4px">
              ❌ ${theme} — ${difficulte}
            </div>
            <div style="font-size:24px;font-weight:700;color:#dc2626">
              ${score}/${total} — ${pct}%
            </div>
            <div style="font-size:12px;color:#888;margin-top:4px">⏱️ ${tempsFormat}</div>
          </div>
          ${rateesHTML}
          <p style="color:#444;line-height:1.6;margin-top:20px">
            Un encouragement ce soir peut faire toute la différence !
            <strong>10 minutes par jour</strong> suffisent pour progresser.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Voir ses résultats complets →
            </a>
          </div>
          <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
            Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
          </p>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="${lienDesabonnement}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`
    }

    // Envoyer l'email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'noreply@academika.fr',
        to: emailParent,
        subject: sujet,
        html
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(500).json({ error: 'Erreur email : ' + JSON.stringify(err) })
    }

    // Marquer alerte_envoyee = true pour cette session
    if (resultatsId) {
      await fetch(
        `${SUPA_URL}/rest/v1/resultats?id=eq.${resultatsId}`,
        {
          method: 'PATCH',
          headers: { ...supaHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ alerte_envoyee: true })
        }
      )
    }

    res.status(200).json({ success: true })

  } catch(e) {
    console.log('Erreur:', e.message)
    res.status(500).json({ error: e.message })
  }
}
