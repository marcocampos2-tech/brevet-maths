export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, prenom, nom, score, total, pct, scoresThemes, tempsSecondes } = req.body

    const mention = pct >= 80 ? '🌟 Très Bien' : pct >= 70 ? '👍 Bien' : pct >= 60 ? '✅ Assez Bien' : pct >= 50 ? '📚 Admis' : '💪 Non admis'
    const couleur = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'

    const m = Math.floor(tempsSecondes/60)
    const s = tempsSecondes%60
    const tempsFormat = `${m} min ${s} sec`

    const themesHTML = scoresThemes ? Object.entries(scoresThemes).map(([theme, s]) => {
      const tpct = Math.round((s.ok/s.total)*100)
      const tc = tpct >= 80 ? '#16a34a' : tpct >= 60 ? '#3730a3' : tpct >= 40 ? '#f59e0b' : '#dc2626'
      return `<tr>
        <td style="padding:8px;color:#555;border-bottom:1px solid #f0f0ec">${theme}</td>
        <td style="padding:8px;font-weight:600;color:${tc};border-bottom:1px solid #f0f0ec">${s.ok}/${s.total} (${tpct}%)</td>
      </tr>`
    }).join('') : ''

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">

        <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
          <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
          <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Résultat Examen Blanc</div>
        </div>

        <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
        <p style="margin-bottom:20px;color:#444;">
          Votre enfant <strong>${prenom}${nom ? ' ' + nom : ''}</strong> vient de passer 
          l'Examen Blanc Brevet Maths sur ACADEMIKA.
        </p>

        <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
          <div style="font-size:56px;font-weight:700;color:${couleur}">${score}/20</div>
          <div style="font-size:24px;font-weight:600;color:${couleur};margin-top:4px">${pct}%</div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
          <div style="font-size:13px;color:#666;margin-top:8px">⏱️ ${tempsFormat}</div>
        </div>

        <p style="color:#444;margin-bottom:16px;">
          Bonne nouvelle : <strong>${prenom} progresse !</strong><br>
          Encouragez-le à continuer sur les thèmes à améliorer.
        </p>

        ${themesHTML ? `
        <h3 style="font-size:14px;font-weight:600;margin-bottom:8px">📊 Résultats par thème :</h3>
        <table style="width:100%;border-collapse:collapse">${themesHTML}</table>` : ''}

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
        subject: `📝 ${prenom} a obtenu ${score}/20 à l'Examen Blanc — ACADEMIKA`,
        html
      })
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: JSON.stringify(data) })
    res.status(200).json({ success: true })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
