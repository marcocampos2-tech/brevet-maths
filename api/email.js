export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, emailEleve, prenom, theme, difficulte, score, total, questionsRatees, questionsInconnues, tempsSecondes, aucuneIdee } = req.body

    const pct = Math.round((score / total) * 100)
    const mention = pct >= 80 ? '🌟 Excellent !' : pct >= 60 ? '👍 Bien !' : '💪 A retravailler'

    const m = Math.floor(tempsSecondes / 60)
    const s = tempsSecondes % 60
    const tempsFormat = m === 0 ? `${s} secondes` : `${m} min ${s} sec`

    const rateesHTML = questionsRatees && questionsRatees.length > 0
      ? `<h3 style="color:#dc2626;margin-top:20px">Questions mal repondues :</h3>
         <ul style="color:#555;padding-left:20px">
           ${questionsRatees.map(q => `<li style="margin-bottom:6px">${q}</li>`).join('')}
         </ul>`
      : ''

    const inconnuesHTML = questionsInconnues && questionsInconnues.length > 0
      ? `<h3 style="color:#f59e0b;margin-top:20px">Notions a revoir (aucune idee) :</h3>
         <ul style="color:#555;padding-left:20px">
           ${questionsInconnues.map(q => `<li style="margin-bottom:6px">${q}</li>`).join('')}
         </ul>`
      : ''

    const toutCorrectHTML = (!questionsRatees || questionsRatees.length === 0) && (!questionsInconnues || questionsInconnues.length === 0)
      ? `<p style="color:#16a34a;margin-top:20px">✅ Toutes les questions sont reussies !</p>`
      : ''

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h1 style="color:#1a1a1a;border-bottom:2px solid #e8e8e4;padding-bottom:10px">
          📐 Brevet Maths — Resultat de ${prenom}
        </h1>
        <p style="color:#666">Bonjour,</p>
        <p style="color:#e65100;font-weight:500;margin-bottom:8px">⚠️ A transférer aux parents de ${prenom} : <strong>${emailParent}</strong></p>
        <p style="color:#666"><strong>${prenom}</strong> vient de terminer une session de revision en mathematiques !</p>

        <div style="background:#f5f5f0;border-radius:10px;padding:20px;margin:20px 0;text-align:center">
          <div style="font-size:48px;font-weight:700;color:#1a1a1a">${score}/${total}</div>
          <div style="font-size:24px;color:#3730a3">${pct}%</div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Eleve</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">${prenom} (${emailEleve})</td></tr>
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Theme</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">${theme}</td></tr>
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Niveau</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">${difficulte}</td></tr>
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Temps de revision</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">⏱️ ${tempsFormat}</td></tr>
          <tr><td style="padding:8px;color:#666">Aucune idee</td><td style="padding:8px;font-weight:500">${aucuneIdee} question(s)</td></tr>
        </table>

        ${toutCorrectHTML}
        ${rateesHTML}
        ${inconnuesHTML}

        <p style="color:#999;font-size:12px;margin-top:30px;border-top:1px solid #e8e8e4;padding-top:10px">
          Cet email a ete envoye automatiquement par Brevet Maths apres la session de revision de ${prenom}.
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
        to: 'marcocampos2s@gmail.com',
        subject: `📐 [A transférer à ${emailParent}] ${prenom} a obtenu ${score}/${total} en ${theme} — ${tempsFormat}`,
        html
      })
    })

    const responseData = await response.json()
    console.log('Reponse Resend:', JSON.stringify(responseData))

    if (!response.ok) {
      return res.status(500).json({ error: 'Erreur envoi email : ' + JSON.stringify(responseData) })
    }

    res.status(200).json({ success: true })
  } catch(e) {
    console.log('Erreur catch:', e.message)
    res.status(500).json({ error: e.message })
  }
}
