export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const RESEND_KEY = process.env.RESEND_API_KEY
  const PROF_EMAIL = 'marcocampos2@gmail.com'
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

  const { prenom, nom, email_parent, telephone, date_choisie } = req.body
  if (!prenom || !nom || !email_parent || !date_choisie) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }

  try {
    // Vérifier si déjà inscrit
    const checkRes = await fetch(
      `${SUPA_URL}/rest/v1/inscriptions_brevet?email_parent=eq.${encodeURIComponent(email_parent)}&select=id,date_choisie`,
      { headers }
    )
    const existing = await checkRes.json()
    const dejaInscrit = existing && existing.length > 0
    const prioritaire = !dejaInscrit

    // Vérifier places disponibles
    const placesRes = await fetch(`${SUPA_URL}/rest/v1/inscriptions_brevet?select=date_choisie`, { headers })
    const placesData = await placesRes.json()
    const places = { '17 juin': 0, '24 juin': 0 }
    placesData.forEach(d => {
      if (d.date_choisie === '17 juin') places['17 juin']++
      else if (d.date_choisie === '24 juin') places['24 juin']++
      else if (d.date_choisie === 'les deux') { places['17 juin']++; places['24 juin']++ }
    })

    // Vérifier si complet
    if (date_choisie === '17 juin' && places['17 juin'] >= 5) return res.status(400).json({ error: 'Session du 17 juin complète' })
    if (date_choisie === '24 juin' && places['24 juin'] >= 5) return res.status(400).json({ error: 'Session du 24 juin complète' })
    if (date_choisie === 'les deux' && places['17 juin'] >= 5 && places['24 juin'] >= 5) return res.status(400).json({ error: 'Les deux sessions sont complètes' })

    // Sauvegarder inscription
    const insertRes = await fetch(`${SUPA_URL}/rest/v1/inscriptions_brevet`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ prenom, nom, email_parent, telephone: telephone||'', date_choisie, confirme: false, lieu_envoye: false })
    })
    if (!insertRes.ok) throw new Error('Erreur sauvegarde inscription')

    // Email au prof
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: PROF_EMAIL,
        subject: `📝 Nouvelle inscription brevet blanc — ${prenom} ${nom}`,
        html: `
          <h2>Nouvelle inscription</h2>
          <p><strong>Élève :</strong> ${prenom} ${nom}</p>
          <p><strong>Email parents :</strong> ${email_parent}</p>
          <p><strong>Téléphone :</strong> ${telephone||'Non renseigné'}</p>
          <p><strong>Date souhaitée :</strong> ${date_choisie}</p>
          <p><strong>Prioritaire :</strong> ${prioritaire ? '✅ Oui (nouvel élève)' : '⚠️ Non (déjà inscrit)'}</p>
          <p><strong>Places restantes 17 juin :</strong> ${5 - places['17 juin']}</p>
          <p><strong>Places restantes 24 juin :</strong> ${5 - places['24 juin']}</p>
          <p>→ Confirmez depuis <a href="https://academika.fr/prof.html">prof.html</a></p>
        `
      })
    })

    // Email aux parents
    const msgParents = prioritaire
      ? `<p>Votre inscription est enregistrée. Le lieu exact vous sera communiqué par email après confirmation.</p>`
      : `<p>Votre inscription est bien reçue. Vous serez contacté par email pour confirmation. Priorité sera donnée aux nouveaux élèves.</p>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: email_parent,
        subject: `📝 Inscription Examen Blanc Brevet — ${prenom}`,
        html: `
          <h2>${prioritaire ? '✅ Inscription reçue' : '📋 Inscription reçue'}</h2>
          <p>Bonjour,</p>
          ${msgParents}
          <p><strong>Élève :</strong> ${prenom} ${nom}</p>
          <p><strong>Date :</strong> ${date_choisie} · 15h00</p>
          <p><strong>Lieu :</strong> 77310 Ponthierry (adresse sur confirmation)</p>
          <p><strong>Contact :</strong> 06 26 53 90 13</p>
          <br>
          <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
        `
      })
    })

    return res.status(200).json({ success: true, prioritaire })

  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
