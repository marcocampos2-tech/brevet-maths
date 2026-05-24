export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, prenom, email, note, noteMax, commentaire, qcmMoyenne } = req.body

    const pct = Math.round((note / noteMax) * 100)
    const mention = pct >= 80 ? '🌟 Très Bien' : pct >= 70 ? '👍 Bien' : pct >= 60 ? '✅ Assez Bien' : pct >= 50 ? '📚 Admis' : '💪 À retravailler'

    const comparatifHTML = qcmMoyenne ? `
      <div style="background:#f5f5f0;border-radius:8px;padding:12px;margin-top:16px">
        <h3 style="font-size:14px;color:#1a1a1a;margin-bottom:8px">📊 Comparatif app vs Brevet Blanc</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:6px;color:#666">Brevet Blanc</td><td style="padding:6px;font-weight:600">${note}/${noteMax} (${pct}%)</td></tr>
          <tr style="background:#eef2ff"><td style="padding:6px;color:#666">Moyenne QCM app</td><td style="padding:6px;font-weight:600">${qcmMoyenne}%</td></tr>
          <tr><td style="padding:6px;color:#666">Écart</td><td style="padding:6px;font-weight:600;color:${pct >= qcmMoyenne ? '#16a34a' : '#dc2626'}">${pct >= qcmMoyenne ? '+' : ''}${pct - qcmMoyenne}%</td></tr>
        </table>
      </div>` : ''

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h1 style="color:#1a1a1a;border-bottom:2px solid #e8e8e4;padding-bottom:10px">
          📝 Brevet Blanc — Résultat de ${prenom}
        </h1>
        <p style="color:#666">Bonjour,</p>
        <p style="color:#e65100;font-weight:500;margin-bottom:8px">⚠️ À transférer aux parents de ${prenom} : <strong>${emailParent}</strong></p>
        <p style="color:#666"><strong>${prenom}</strong> vient de passer un Brevet Blanc de mathématiques !</p>

        <div style="background:#f5f5f0;border-radius:10px;padding:20px;margin:20px 0;text-align:center">
          <div style="font-size:52px;font-weight:700;color:#1a1a1a">${note}/${noteMax}</div>
          <div style="font-size:22px;color:#3730a3;margin-top:4px">${pct}%</div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
        </div>

        ${commentaire ? `
        <div style="background:#eef2ff;border-radius:8px;padding:12px;margin-bottom:16px;border-left:3px solid #3730a3">
          <strong style="font-size:13px;color:#3730a3">💬 Commentaire du professeur :</strong>
          <p style="color:#555;font-size:13px;margin-top:4px">${commentaire}</p>
        </div>` : ''}

        ${comparatifHTML}

        <div style="background:#f0fdf4;border-radius:8px;padding:12px;margin-top:16px;font-size:13px;color:#15803d">
          <strong>📋 Format du Brevet Blanc :</strong> Conditions réelles — 2h, 40 points, sans aide.
        </div>

        <p style="color:#999;font-size:12px;margin-top:30px;border-top:1px solid #e8e8e4;padding-top:10px">
          Cet email a été envoyé automatiquement par Brevet Maths.
        </p>
      </div>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'marcocampos2@gmail.com',
        subject: `📝 [À transférer à ${emailParent}] Brevet Blanc ${prenom} — ${note}/40 (${pct}%)`,
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
