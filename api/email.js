export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, emailEleve, prenom, theme, difficulte, score, total, questionsRatees } = req.body

    const pct = Math.round((score / total) * 100)
    const mention = pct >= 80 ? '🌟 Excellent !' : pct >= 60 ? '👍 Bien !' : '💪 À retravailler'

    const rateesHTML = questionsRatees && questionsRatees.length > 0
      ? `<h3 style="color:#dc2626;margin-top:20px">Questions à retravailler :</h3>
         <ul style="color:#555;padding-left:20px">
           ${questionsRatees.map(q => `<li style="margin-bottom:6px">${q}</li>`).join('')}
         </ul>`
      : `<p style="color:#16a34a;margin-top:20px">✅ Toutes les questions sont réussies !</p>`

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h1 style="color:#1a1a1a;border-bottom:2px solid #e8e8e4;padding-bottom:10px">📐 Brevet Maths — Résultat de ${prenom}</h1>
        <p style="color:#666">Bonjour,</p>
        <p style="color:#666"><strong>${prenom}</strong> vient de terminer un quiz de mathématiques !</p>
        <div style="background:#f5f5f0;border-radius:10px;padding:20px;margin:20px 0;text-align:center">
          <div style="font-size:48px;font-weight:700;color:#1a1a1a">${score}/${total}</div>
          <div style="font-size:24px;color:#3730a3">${pct}%</div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;color:#666">Thème</td><td style="padding:8px;font-weight:500">${theme}</td></tr>
          <tr style="background:#f9f9f7"><td style="padding:8px;color:#666">Niveau</td><td style="padding:8px;font-weight:500">${difficulte}</td></tr>
          <tr><td style="padding:8px;color:#666">Élève</td><td style="padding:8px;font-weight:500">${prenom} (${emailEleve})</td></tr>
        </table>
        ${rateesHTML}
        <p style="color:#999;font-size:12px;margin-top:30px;border-top:1px solid #e8e8e4;padding-top:10px">
          Cet email a été envoyé automatiquement par Brevet Maths après la session de révision de ${prenom}.
        </p>
      </div>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Brevet Maths <onboarding@resend.dev>',
        to: emailParent,
        subject: `📐 ${prenom} a obtenu ${score}/${total} en ${theme}`,
        html
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(500).json({ error: 'Erreur envoi email : ' + err.message })
    }

    res.status(200).json({ success: true })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
