export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { emailParent, prenom, nom, theme, difficulte, score, total, questionsRatees, questionsInconnues, tempsSecondes, aucuneIdee } = req.body

    const pct = Math.round((score / total) * 100)
    const couleurScore = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'
    const mention = pct >= 80 ? '🌟 Excellent !' : pct >= 60 ? '👍 Bien !' : pct >= 40 ? '💪 Continue !' : '📚 À retravailler'

    const messageMotivation = pct >= 80
      ? `Excellent travail ! <strong>${prenom}</strong> maîtrise très bien ce thème. Encouragez-le à continuer !`
      : pct >= 60
      ? `Bon travail ! <strong>${prenom}</strong> progresse bien. Quelques notions restent à consolider.`
      : pct >= 40
      ? `<strong>${prenom}</strong> fait des efforts mais ce thème nécessite encore du travail. Encouragez-le à s'entraîner davantage.`
      : `Ce thème est difficile pour <strong>${prenom}</strong> en ce moment. Il est important de retravailler ces notions régulièrement.`

    const m = Math.floor(tempsSecondes / 60)
    const s = tempsSecondes % 60
    const tempsFormat = m === 0 ? `${s} secondes` : `${m} min ${s} sec`

    const tousLesPoints = [...(questionsRatees||[]), ...(questionsInconnues||[])]
    const pointsHTML = tousLesPoints.length > 0
      ? `<div style="margin-top:20px">
          <p style="color:#1a1a1a;font-weight:600;margin-bottom:8px">📚 Points à améliorer :</p>
          <ul style="padding-left:20px;color:#555;margin:0">
            ${tousLesPoints.map(q => `<li style="margin-bottom:6px">${q}</li>`).join('')}
          </ul>
        </div>`
      : `<p style="color:#16a34a;margin-top:20px;font-weight:600">✅ Toutes les questions sont réussies ! Félicitations !</p>`

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">

        <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
          <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
          <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
        </div>

        <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
        <p style="margin-bottom:20px;color:#444;">
          Votre enfant <strong>${prenom}${nom ? ' ' + nom : ''}</strong> vient de terminer 
          une session de révision sur ACADEMIKA.
        </p>

        <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
          <div style="font-size:56px;font-weight:700;color:${couleurScore}">${score}/${total}</div>
          <div style="font-size:24px;font-weight:600;color:${couleurScore};margin-top:4px">${pct}%</div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
          <div style="font-size:13px;color:#666;margin-top:8px">⏱️ ${tempsFormat} · ${theme} · ${difficulte}</div>
        </div>

        <p style="color:#444;margin-bottom:16px;">${messageMotivation}</p>

        ${pointsHTML}

        ${aucuneIdee > 0 ? `
        <div style="margin-top:16px;padding:12px;background:#fffbeb;border-radius:8px;border-left:3px solid #f59e0b">
          <p style="color:#92400e;font-size:13px;">
            😅 <strong>${aucuneIdee} question(s)</strong> sans réponse — ces notions sont prioritaires à retravailler.
          </p>
        </div>` : ''}

        <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
          <p style="color:#444;font-size:13px;margin-bottom:16px;">
            Pour toute question, contactez-nous : 
            <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3;text-decoration:none;font-weight:500">marcocampos2@gmail.com</a>
          </p>
          <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
        </div>

        <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
          <a href="https://academika.fr/api/desabonner?email=${emailParent}" style="color:#bbb">Se désabonner des emails automatiques</a>
        </p>

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
