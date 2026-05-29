export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, prenom, nom, theme, difficulte, score, total, questionsRatees, questionsInconnues, tempsSecondes, aucuneIdee } = req.body

    const pct = Math.round((score / total) * 100)
    const mention = pct >= 80 ? '🌟 Excellent !' : pct >= 60 ? '👍 Bien !' : pct >= 40 ? '💪 Continue !' : '📚 À retravailler'

    const m = Math.floor(tempsSecondes / 60)
    const s = tempsSecondes % 60
    const tempsFormat = m === 0 ? `${s} secondes` : `${m} min ${s} sec`

    const rateesHTML = questionsRatees && questionsRatees.length > 0
      ? `<h3 style="color:#dc2626;margin-top:20px">❌ Questions à retravailler :</h3>
         <ul style="color:#555;padding-left:20px">
           ${questionsRatees.map(q => `<li style="margin-bottom:6px">${q}</li>`).join('')}
         </ul>`
      : ''

    const inconnuesHTML = questionsInconnues && questionsInconnues.length > 0
      ? `<h3 style="color:#f59e0b;margin-top:20px">💡 Notions à revoir :</h3>
         <ul style="color:#555;padding-left:20px">
           ${questionsInconnues.map(q => `<li style="margin-bottom:6px">${q}</li>`).join('')}
         </ul>`
      : ''

    const toutCorrectHTML = (!questionsRatees || questionsRatees.length === 0) && (!questionsInconnues || questionsInconnues.length === 0)
      ? `<p style="color:#16a34a;margin-top:20px;font-weight:600">✅ Toutes les questions sont réussies ! Félicitations !</p>`
      : ''

    const couleurScore = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'

    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <div style="text-align:center;padding:20px 0;border-bottom:2px solid #e8e8e4;margin-bottom:20px">
          <div style="font-size:36px;font-weight:800;color:#1a1a1a">∑ ACADEMIKA</div>
          <div style="font-size:14px;color:#666;margin-top:4px">Brevet Maths — Résultats de session</div>
        </div>

        <p style="color:#666;margin-bottom:8px">Bonjour,</p>
        <p style="color:#444;margin-bottom:20px"><strong>${prenom}${nom ? ' ' + nom : ''}</strong> vient de terminer une session de révision en mathématiques !</p>

        <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
          <div style="font-size:56px;font-weight:700;color:${couleurScore}">${score}/${total}</div>
          <div style="font-size:28px;font-weight:600;color:${couleurScore};margin-top:4px">${pct}%</div>
          <div style="font-size:20px;margin-top:8px">${mention}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Élève</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">${prenom}${nom ? ' ' + nom : ''}</td></tr>
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Thème</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">${theme}</td></tr>
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Niveau</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">${difficulte}</td></tr>
          <tr><td style="padding:8px;color:#666;border-bottom:1px solid #f0f0ec">Temps de révision</td><td style="padding:8px;font-weight:500;border-bottom:1px solid #f0f0ec">⏱️ ${tempsFormat}</td></tr>
          <tr><td style="padding:8px;color:#666">Aucune idée 😅</td><td style="padding:8px;font-weight:500">${aucuneIdee} question(s) <span style="color:#666;font-size:12px">— questions où votre enfant a déclaré ne pas connaître la réponse. Ces notions sont prioritaires à retravailler.</span></td></tr>
          
        </table>

        ${toutCorrectHTML}
        ${rateesHTML}
        ${inconnuesHTML}

        <div style="margin-top:30px;padding-top:10px;border-top:1px solid #e8e8e4;text-align:center">
          <p style="color:#999;font-size:12px">
            Cet email a été envoyé automatiquement par <strong>∑ ACADEMIKA</strong> après la session de révision de ${prenom}.
          </p>
          <a href="https://www.academika.fr" style="color:#3730a3;font-size:12px;text-decoration:none">www.academika.fr</a>
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
        subject: `📊 ${prenom} a obtenu ${score}/${total} en ${theme} — ACADEMIKA`,
        html
      })
    })

    const responseData = await response.json()
    if (!response.ok) {
      return res.status(500).json({ error: 'Erreur envoi email : ' + JSON.stringify(responseData) })
    }

    res.status(200).json({ success: true })
  } catch(e) {
    console.log('Erreur catch:', e.message)
    res.status(500).json({ error: e.message })
  }
}
