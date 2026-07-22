export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const {
    prenom_eleve,
    niveau,
    format,
    dispo_semaine,
    dispo_dimanche,
    parent_nom,
    parent_email,
    parent_telephone,
    precisions
  } = req.body

  if (!prenom_eleve || !parent_nom || !parent_email) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' })
  }

  const disponibilites = [
    dispo_semaine ? 'Semaine, 18h-20h' : null,
    dispo_dimanche ? 'Dimanche' : null
  ].filter(Boolean).join(' · ') || 'Non précisé'

  const formatLabel = format === 'presentiel' ? 'Présentiel' : 'Visio'

  try {
    // Email à Marco — demande reçue
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Academika <contact@academika.fr>',
        to: 'contact@academika.fr',
        reply_to: parent_email,
        subject: `Demande de cours — ${prenom_eleve} (${niveau})`,
        html: `
          <h2>Nouvelle demande de cours particulier</h2>
          <p><strong>Élève :</strong> ${prenom_eleve} (${niveau})</p>
          <p><strong>Format souhaité :</strong> ${formatLabel}</p>
          <p><strong>Disponibilités :</strong> ${disponibilites}</p>
          <hr>
          <p><strong>Parent :</strong> ${parent_nom}</p>
          <p><strong>Email :</strong> ${parent_email}</p>
          <p><strong>Téléphone :</strong> ${parent_telephone || 'Non renseigné'}</p>
          ${precisions ? `<p><strong>Précisions :</strong> ${precisions}</p>` : ''}
        `
      })
    })

    // Email de confirmation au parent
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Academika <contact@academika.fr>',
        to: parent_email,
        subject: 'Votre demande de cours a bien été reçue',
        html: `
          <p>Bonjour ${parent_nom},</p>
          <p>Nous avons bien reçu votre demande de cours particulier pour ${prenom_eleve} (${niveau}, ${formatLabel}).</p>
          <p>Vous recevrez une réponse sous 24h.</p>
          <p>À bientôt,<br>Academika</p>
        `
      })
    })

    return res.status(200).json({ success: true })
  } catch (e) {
    console.error('Erreur envoi email contact-cours:', e.message)
    return res.status(500).json({ error: 'Erreur lors de l\'envoi. Réessayez ou écrivez directement à contact@academika.fr.' })
  }
}
