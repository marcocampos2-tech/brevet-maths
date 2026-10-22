const ORIGINES_AUTORISEES = ['https://academika.fr', 'https://www.academika.fr']

const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function formatDateFr(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return d.getDate() + ' ' + MOIS_FR[d.getMonth()]
}

// '*' = joker ilike côté PostgREST : une saisie qui en contient est refusée
// AVANT la requête (même règle que api/email.js, contientJoker / escapeIlike).
function contientJoker(s) {
  return String(s).includes('*')
}

// Échappe \ % _ (métacaractères ILIKE, valides dans un email ou un prénom)
// pour utiliser ilike comme égalité exacte insensible à la casse.
function motifIlike(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export default async function handler(req, res) {
  const origine = req.headers.origin
  if (ORIGINES_AUTORISEES.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine)
  }

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const RESEND_KEY = process.env.RESEND_API_KEY
  const PROF_EMAIL = 'contact@academika.fr'
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

  if (req.method === 'GET' || req.query?.action === 'sessions') {
    try {
      const rSessions = await fetch(
        `${SUPA_URL}/rest/v1/sessions_stages?annulee=eq.false&select=*&order=date_debut.asc`,
        { headers }
      )
      const sessions = await rSessions.json()

      const rInscriptions = await fetch(
        `${SUPA_URL}/rest/v1/inscriptions_stages?select=session_id`,
        { headers }
      )
      const inscriptions = await rInscriptions.json()

      const compteur = {}
      inscriptions.forEach(i => { compteur[i.session_id] = (compteur[i.session_id] || 0) + 1 })

      const aujourdHui = new Date().toISOString().split('T')[0]

      const sessionsAvecPlaces = sessions
        .map(s => ({
          id: s.id,
          periode: s.periode,
          domaine: s.domaine,
          date_debut: s.date_debut,
          date_fin: s.date_fin,
          date_debut_formatee: formatDateFr(s.date_debut),
          date_fin_formatee: formatDateFr(s.date_fin),
          heure: s.heure,
          max_places: s.max_places,
          places_prises: compteur[s.id] || 0,
          places_restantes: s.max_places - (compteur[s.id] || 0),
          complet: (compteur[s.id] || 0) >= s.max_places,
          termine: s.date_debut < aujourdHui
        }))

      return res.status(200).json({ sessions: sessionsAvecPlaces })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const corps = req.body || {}
  const prenom = String(corps.prenom ?? '').trim()
  const nom = String(corps.nom ?? '').trim()
  const email_parent = String(corps.email_parent ?? '').trim()
  const telephone = String(corps.telephone ?? '').trim()
  const session_id = corps.session_id
  if (!prenom || !nom || !email_parent || !session_id) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }
  if (contientJoker(prenom) || contientJoker(email_parent)) {
    return res.status(400).json({ error: 'Saisie invalide' })
  }

  try {
    const sessionRes = await fetch(
      `${SUPA_URL}/rest/v1/sessions_stages?id=eq.${session_id}&select=*`,
      { headers }
    )
    const sessionData = await sessionRes.json()
    if (!sessionData || sessionData.length === 0) {
      return res.status(400).json({ error: 'Session introuvable' })
    }
    const session = sessionData[0]
    if (session.annulee) {
      return res.status(400).json({ error: 'Ce stage a été annulé' })
    }

    // Doublon = même email parent ET même prénom d'enfant sur cette session
    // (sans tenir compte de la casse). Un parent peut donc inscrire plusieurs
    // enfants avec la même adresse ; seul un même prénom est refusé.
    const checkRes = await fetch(
      `${SUPA_URL}/rest/v1/inscriptions_stages?email_parent=ilike.${encodeURIComponent(motifIlike(email_parent))}&prenom=ilike.${encodeURIComponent(motifIlike(prenom))}&session_id=eq.${session_id}&select=id`,
      { headers }
    )
    if (!checkRes.ok) throw new Error('Erreur vérification inscription')
    const existing = await checkRes.json()
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: `Une inscription existe déjà pour ${prenom} sur ce stage.` })
    }

    const placesRes = await fetch(
      `${SUPA_URL}/rest/v1/inscriptions_stages?session_id=eq.${session_id}&select=id`,
      { headers }
    )
    const placesData = await placesRes.json()
    const placesPrises = placesData.length

    if (placesPrises >= session.max_places) {
      return res.status(400).json({ error: 'Ce stage est complet' })
    }

    const insertRes = await fetch(`${SUPA_URL}/rest/v1/inscriptions_stages`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        prenom, nom, email_parent, telephone: telephone || '',
        session_id, confirme: false
      })
    })
    if (!insertRes.ok) throw new Error('Erreur sauvegarde inscription')

    const dateDebutFormatee = formatDateFr(session.date_debut)
    const dateFinFormatee = formatDateFr(session.date_fin)
    const placesRestantes = session.max_places - placesPrises - 1

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: PROF_EMAIL,
        subject: `📝 Nouvelle inscription stage — ${prenom} ${nom}`,
        html: `
          <h2>Nouvelle inscription au stage</h2>
          <p><strong>Élève :</strong> ${esc(prenom)} ${esc(nom)}</p>
          <p><strong>Email parents :</strong> ${esc(email_parent)}</p>
          <p><strong>Téléphone :</strong> ${esc(telephone) || 'Non renseigné'}</p>
          <p><strong>Stage :</strong> ${esc(session.periode)} — ${esc(session.domaine)}</p>
          <p><strong>Dates :</strong> Du ${dateDebutFormatee} au ${dateFinFormatee} · ${session.heure}</p>
          <p><strong>Places restantes :</strong> ${placesRestantes}</p>
          <p>→ <a href="https://academika.fr/prof.html">Gérer les inscriptions</a></p>
        `
      })
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'ACADEMIKA <noreply@academika.fr>',
        to: email_parent,
        subject: `📝 Inscription stage — ${prenom}`,
        html: `
          <h2>📋 Inscription reçue</h2>
          <p>Bonjour,</p>
          <p>Votre inscription est bien reçue. Vous serez contacté par email pour confirmation.</p>
          <p><strong>Élève :</strong> ${esc(prenom)} ${esc(nom)}</p>
          <p><strong>Stage :</strong> ${esc(session.periode)} — ${esc(session.domaine)}</p>
          <p><strong>Dates :</strong> Du ${dateDebutFormatee} au ${dateFinFormatee} · ${session.heure}</p>
          <p><strong>Contact :</strong> 06 26 53 90 13</p>
          <br>
          <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
        `
      })
    })

    return res.status(200).json({ success: true })

  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
