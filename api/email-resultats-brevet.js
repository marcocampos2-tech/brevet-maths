export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const RESEND_KEY = process.env.RESEND_API_KEY

  const { emailParent, prenom, nom, date, note, commentaire } = req.body
  if (!emailParent || !prenom || note === undefined) return res.status(400).json({ error: 'Champs manquants' })

  const pct = Math.round((note / 20) * 100)
  let mention = ''
  if (pct >= 80) mention = '🌟 Mention Très Bien'
  else if (pct >= 70) mention = '👍 Mention Bien'
  else if (pct >= 60) mention = '✅ Mention Assez Bien'
  else if (pct >= 50) mention = '📋 Admis'
  else mention = '📚 Non admis — À retravailler'

  const couleur = pct >= 50 ? '#16a34a' : '#dc2626'

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: emailParent,
        subject: `📝 Résultats Examen Blanc Brevet — ${prenom}`,
        html: `
          <h2>📝 Résultats — Examen Blanc Brevet</h2>
          <p>Bonjour,</p>
          <p>Voici les résultats de <strong>${prenom} ${nom}</strong> pour l'examen blanc du <strong>${date}</strong> :</p>
          <div style="background:#f0f7ff;border-radius:8px;padding:20px;margin:16px 0;text-align:center">
            <div style="font-size:48px;font-weight:700;color:${couleur}">${note}/20</div>
            <div style="font-size:18px;color:${couleur};margin-top:8px">${mention}</div>
          </div>
          ${commentaire ? `
          <div style="background:#f7f7f5;border-radius:8px;padding:16px;margin:16px 0">
            <p><strong>💬 Commentaire :</strong></p>
            <p style="color:#555">${commentaire}</p>
          </div>` : ''}
          <p>Continuez à réviser sur <a href="https://academika.fr">academika.fr</a> !</p>
          <p>Contact : <strong>06 26 53 90 13</strong></p>
          <br>
          <p>Cordialement,<br>ACADEMIKA</p>
        `
      })
    })
    return res.status(200).json({ success: true })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
