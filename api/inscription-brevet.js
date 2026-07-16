const ORIGINES_AUTORISEES = ['https://academika.fr', 'https://www.academika.fr']

const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function formatDateFr(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return d.getDate() + ' ' + MOIS_FR[d.getMonth()]
}

export default async function handler(req, res) {
  const origine = req.headers.origin
  if (ORIGINES_AUTORISEES.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine)
  }

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const RESEND_KEY = process.env.RESEND_API_KEY
  const PROF_EMAIL = 'marcocampos2@gmail.com'
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

  // ── GET sessions actives + places ──────────────────────────────
  // Utilisé par brevet-blanc.html, quiz.html, index.html pour afficher les sessions disponibles
  if (req.method === 'GET' || req.query?.action === 'sessions') {
    try {
      const rSessions = await fetch(
        `${SUPA_URL}/rest/v1/sessions_examen_blanc?annulee=eq.false&select=*&order=date_session.asc`,
        { headers }
      )
      const sessions = await rSessions.json()

      const rInscriptions = await fetch(
        `${SUPA_URL}/rest/v1/inscriptions_brevet?select=session_id&session_id=not.is.null`,
        { headers }
      )
      const inscriptions = await rInscriptions.json()

      const compteur = {}
      inscriptions.forEach(i => { compteur[i.session_id] = (compteur[i.session_id] || 0) + 1 })

      const aujourdHui = new Date().toISOString().split('T')[0]

      const sessionsAvecPlaces = sessions
        .filter(s => s.date_session >= aujourdHui)
        .map(s => ({
          id: s.id,
          date_session: s.date_session,
          date_formatee: formatDateFr(s.date_session),
          heure: s.heure,
          max_places: s.max_places,
          places_prises: compteur[s.id] || 0,
          places_restantes: s.max_places - (compteur[s.id] || 0),
          complet: (compteur[s.id] || 0) >= s.max_places
        }))

      return res.status(200).json({ sessions: sessionsAvecPlaces })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── POST inscription ─────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { prenom, nom, email_parent, telephone, session_id } = req.body
  if (!prenom || !nom || !email_parent || !session_id) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }

  try {
    // Vérifier que la session existe, n'est pas annulée, et récupérer ses infos
    const sessionRes = await fetch(
      `${SUPA_URL}/rest/v1/sessions_examen_blanc?id=eq.${session_id}&select=*`,
      { headers }
    )
    const sessionData = await sessionRes.json()
    if (!sessionData || sessionData.length === 0) {
      return res.status(400).json({ error: 'Session introuvable' })
    }
    const session = sessionData[0]
    if (session.annulee) {
      return res.status(400).json({ error: 'Cette session a été annulée' })
    }

    // Vérifier si déjà inscrit à CETTE session précise (bloquant, doublon pur)
    const checkRes = await fetch(
      `${SUPA_URL}/rest/v1/inscriptions_brevet?email_parent=eq.${encodeURIComponent(email_parent)}&session_id=eq.${session_id}&select=id`,
      { headers }
    )
    const existing = await checkRes.json()
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit à cette session' })
    }

    // Vérifier si déjà inscrit à une AUTRE session gratuite (non bloquant, juste pour adapter le message)
    // Seulement pertinent tant que la session actuelle est gratuite — si elle est payante, pas de restriction de priorité
    let dejaInscritAilleurs = false
    if (!session.payant) {
      const autresRes = await fetch(
        `${SUPA_URL}/rest/v1/inscriptions_brevet?email_parent=eq.${encodeURIComponent(email_parent)}&session_id=neq.${session_id}&session_id=not.is.null&select=id`,
        { headers }
      )
      const autresData = await autresRes.json()
      dejaInscritAilleurs = autresData && autresData.length > 0
    }

    // Compter les places prises sur cette session
    const placesRes = await fetch(
      `${SUPA_URL}/rest/v1/inscriptions_brevet?session_id=eq.${session_id}&select=id`,
      { headers }
    )
    const placesData = await placesRes.json()
    const placesPrises = placesData.length

    if (placesPrises >= session.max_places) {
      return res.status(400).json({ error: 'Cette session est complète' })
    }

    // Sauvegarder
    const insertRes = await fetch(`${SUPA_URL}/rest/v1/inscriptions_brevet`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        prenom, nom, email_parent, telephone: telephone || '',
        session_id,
        date_choisie: formatDateFr(session.date_session),
        confirme: false, lieu_envoye: false
      })
    })
    if (!insertRes.ok) throw new Error('Erreur sauvegarde inscription')

    const dateFormatee = formatDateFr(session.date_session)
    const placesRestantes = session.max_places - placesPrises - 1

    // Email prof
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
          <p><strong>Téléphone :</strong> ${telephone || 'Non renseigné'}</p>
          <p><strong>Session :</strong> ${dateFormatee} · ${session.heure}</p>
          <p><strong>Places restantes :</strong> ${placesRestantes}</p>
          ${dejaInscritAilleurs ? '<p style="color:#9E2B25"><strong>⚠️ Déjà inscrit à une autre session gratuite — à arbitrer avant confirmation</strong></p>' : ''}
          <p>→ <a href="https://academika.fr/prof.html">Gérer les inscriptions</a></p>
        `
      })
    })

    // Email parents (sans adresse exacte — communiquée à la confirmation par le prof)
    const msgPriorite = dejaInscritAilleurs
      ? `<p>⚠️ Nous avons noté que vous êtes déjà inscrit à une autre session gratuite. Cette session étant gratuite, la priorité est donnée aux élèves qui ne sont inscrits à aucune autre session. Votre inscription ne sera confirmée que s'il reste de la place après les autres élèves.</p>`
      : `<p>Votre inscription est bien reçue. Vous serez contacté par email pour confirmation et pour recevoir l'adresse exacte.</p>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: email_parent,
        subject: `📝 Inscription Examen Blanc Brevet — ${prenom}`,
        html: `
          <h2>📋 Inscription reçue</h2>
          <p>Bonjour,</p>
          ${msgPriorite}
          <p><strong>Élève :</strong> ${prenom} ${nom}</p>
          <p><strong>Date :</strong> ${dateFormatee} · ${session.heure}</p>
          <p><strong>Lieu :</strong> 77310 Ponthierry (adresse exacte communiquée à la confirmation)</p>
          <p><strong>Contact :</strong> 06 26 53 90 13</p>
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
