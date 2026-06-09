export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  const RESEND_KEY = process.env.RESEND_API_KEY
  const { emailParent, prenom, nom, date, adresse, messageCompl, type } = req.body
  if (!emailParent || !prenom) return res.status(400).json({ error: 'Champs manquants' })

  let subject, html

  if (type === 'refus') {
    subject = `Inscription Examen Blanc Brevet — ${prenom}`
    html = `
      <h2>Inscription Examen Blanc — Information</h2>
      <p>Bonjour,</p>
      <p>Nous avons bien reçu la demande d'inscription de <strong>${prenom} ${nom}</strong> pour la session du <strong>${date}</strong>.</p>
      <p>Malheureusement, cette session est complète. Nous ne pouvons pas confirmer cette inscription.</p>
      <p>Si l'autre date vous convient, n'hésitez pas à vous réinscrire sur <strong>academika.fr</strong>.</p>
      <p>Contact : <strong>06 26 53 90 13</strong></p>
      <br>
      <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
    `
  } else if (type === 'annulation') {
    subject = `Annulation Examen Blanc Brevet — ${prenom}`
    html = `
      <h2>Annulation — Examen Blanc Brevet</h2>
      <p>Bonjour,</p>
      <p>Nous vous informons que l'inscription de <strong>${prenom} ${nom}</strong> pour la session du <strong>${date}</strong> a été annulée.</p>
      <p>Pour toute question, contactez-nous au <strong>06 26 53 90 13</strong>.</p>
      <br>
      <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
    `
  } else {
    if (!adresse) return res.status(400).json({ error: 'Adresse manquante' })
    subject = `✅ Inscription confirmée — Examen Blanc Brevet — ${prenom}`
    html = `
      <h2>✅ Inscription confirmée — Adresse communiquée</h2>
      <p>Bonjour,</p>
      <p>L'inscription de <strong>${prenom} ${nom}</strong> pour l'examen blanc est confirmée :</p>
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
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: emailParent,
        subject,
        html
      })
    })
    return res.status(200).json({ success: true })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
