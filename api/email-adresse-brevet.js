export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const RESEND_KEY = process.env.RESEND_API_KEY

  const { emailParent, prenom, nom, date, adresse, messageCompl } = req.body
  if (!emailParent || !prenom || !adresse) return res.status(400).json({ error: 'Champs manquants' })

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: emailParent,
        subject: `📍 Adresse Examen Blanc Brevet — ${prenom}`,
        html: `
          <h2>✅ Inscription confirmée — Adresse communiquée</h2>
          <p>Bonjour,</p>
          <p>Voici les informations pour l'examen blanc de <strong>${prenom} ${nom}</strong> :</p>
          <div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0">
            <p><strong>📅 Date :</strong> ${date} · 15h00</p>
            <p><strong>📍 Adresse :</strong> ${adresse}</p>
            ${messageCompl ? `<p><strong>ℹ️ Infos :</strong> ${messageCompl}</p>` : ''}
          </div>
          <p>Merci d'arriver 5 minutes avant. Prévoir stylo et calculatrice.</p>
          <p>Contact : <strong>06 26 53 90 13</strong></p>
          <br>
          <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
        `
      })
    })
    return res.status(200).json({ success: true })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
