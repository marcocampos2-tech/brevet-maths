export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, prenom, nom, moyGlobale, totalSessions, tempsTotal, themes, topRatees } = req.body

    const couleur = moyGlobale >= 80 ? '#16a34a' : moyGlobale >= 60 ? '#3730a3' : moyGlobale >= 40 ? '#f59e0b' : '#dc2626'
    const mention = moyGlobale >= 80 ? '🌟 Excellent !' : moyGlobale >= 60 ? '👍 Bien !' : moyGlobale >= 40 ? '💪 Continue !' : '📚 À retravailler'

    const h = Math.floor(tempsTotal/3600)
    const m = Math.floor((tempsTotal%3600)/60)
    const tempsFormat = h > 0 ? `${h}h ${m}min` : `${m} min`

    const themesHTML = Object.entries(themes).map(([theme, s]) => {
      const pct = Math.round((s.ok/s.tot)*100)
      const couleurTheme = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'
      return `<tr>
        <td style="padding:8px;color:#555;border-bottom:1px solid #f0f0ec">${theme}</td>
        <td style="padding:8px;font-weight:600;color:${couleurTheme};border-bottom:1px solid #f0f0ec">${pct}%</td>
        <td style="padding:8px;color:#999;border-bottom:1px solid #f0f0ec;font-size:12px">${s.n} session(s)</td>
      </tr>`
    }).join('')

    const rateesHTML = topRatees && topRatees.length > 0
      ? `<div style="margin-top:20px">
          <p style="font-weight:600;margin-bottom:8px">📚 Points à améliorer :</p>
          <ul style="padding-left:20px;color:#555;margin:0">
            ${topRatees.map(([q]) => `<li style="margin-bottom:6px">${q}</li>`).join('')}
          </ul>
        </div>`
      : `<p style="color:#16a34a;margin-top:20px;font-weight:600">✅ Aucune notion particulièrement en difficulté !</p>`

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">

        <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
          <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
          <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Bilan de progression</div>
        </div>

        <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
        <p style="margin-bottom:20px;color:#444;">
          Voici le bilan de progression de <strong>${prenom}${nom ? ' ' + nom : ''}</strong> sur ACADEMIKA.
        </p>

        <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
          <div style="font-size:56px;font-weight:700;color:${couleur}">${moyGlobale}%</div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
          <div style="font-size:13px;color:#666;margin-top:8px">${totalSessions} sessions · ${tempsFormat} de révision</div>
        </div>

        <p style="color:#444;margin-bottom:16px;">
          Bonne nouvelle : <strong>${prenom} progresse !</strong><br>
          Encouragez-le à continuer sur les thèmes à améliorer.
        </p>

        <h3 style="font-size:14px;font-weight:600;margin-bottom:8px">📊 Résultats par thème :</h3>
        <table style="width:100%;border-collapse:collapse">
          ${themesHTML}
        </table>

        ${rateesHTML}

        <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
          <p style="color:#444;font-size:13px;margin-bottom:16px;">
            Pour toute question, contactez-nous : 
            <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3;text-decoration:none;font-weight:500">marcocampos2@gmail.com</a>
          </p>
          <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
        </div>

      </div>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'noreply@academika.fr',
        to: emailParent,
        subject: `📊 Bilan de progression de ${prenom} — ACADEMIKA`,
        html
      })
    })

    const responseData = await response.json()
    if (!response.ok) {
      return res.status(500).json({ error: 'Erreur : ' + JSON.stringify(responseData) })
    }

    res.status(200).json({ success: true })
  } catch(e) {
    console.log('Erreur:', e.message)
    res.status(500).json({ error: e.message })
  }
}
