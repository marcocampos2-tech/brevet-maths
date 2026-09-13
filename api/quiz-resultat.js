export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Méthode non autorisée' }); return }

  try {
    const { user_id, email, prenom, theme, sous_theme, difficulte, questions, reponses, temps_secondes, source_questions, abandonne } = req.body

    if (!user_id || !theme || !difficulte) {
      return res.status(400).json({ error: 'Paramètres manquants' })
    }

    // ── Cas abandon : score forcé à 0, pas de recalcul nécessaire ──
    if (abandonne) {
      const result = await insererResultat({
        user_id, email, prenom, theme, sous_theme, difficulte,
        score: 0, total: 5,
        questions_ratees: ['Quiz abandonné'],
        temps_secondes: temps_secondes || 0,
        aucune_idee: 0,
        source_questions: source_questions || 'ia'
      })
      if (result.error) return res.status(500).json({ error: result.error })
      return res.status(200).json({ success: true, score: 0, total: 5 })
    }

    if (!Array.isArray(questions) || !reponses) {
      return res.status(400).json({ error: 'Questions ou réponses manquantes' })
    }

    // ── Recalcul du score côté serveur (source de vérité) ──
    let nbOk = 0, nbAucune = 0
    const ratees = []
    const inconnues = []

    questions.forEach((q, i) => {
      const rep = reponses[i]
      if (rep === 'aucune') {
        nbAucune++
        inconnues.push(`${theme} — ${q.chapitre || q.q.substring(0, 40)}`)
      } else if (typeof rep === 'number' && rep === q.answer) {
        nbOk++
      } else {
        ratees.push(`${theme} — ${q.chapitre || q.q.substring(0, 40)}`)
      }
    })

    const result = await insererResultat({
      user_id, email, prenom, theme, sous_theme, difficulte,
      score: nbOk, total: questions.length,
      questions_ratees: [...ratees, ...inconnues.map(q => `[Aucune idée] ${q}`)],
      temps_secondes: temps_secondes || 0,
      aucune_idee: nbAucune,
      source_questions: source_questions || 'ia'
    })

    if (result.error) {
      return res.status(500).json({ error: result.error })
    }

    res.status(200).json({ success: true, score: nbOk, total: questions.length })

  } catch (e) {
    console.log('Erreur quiz-resultat:', e.message)
    res.status(500).json({ error: 'Une erreur est survenue.' })
  }
}

async function insererResultat({ user_id, email, prenom, theme, sous_theme, difficulte, score, total, questions_ratees, temps_secondes, aucune_idee, source_questions }) {
  try {
    const SUPABASE_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

    // ── Idempotence : ignore une écriture au fingerprint identique déjà
    // enregistrée il y a moins de FENETRE_DOUBLON_MS (double-tap / retry réseau).
    // Fail-open : toute panne de ce contrôle laisse l'insertion se faire normalement.
    const FENETRE_DOUBLON_MS = 5000
    try {
      const dupRes = await fetch(
        `${SUPABASE_URL}/rest/v1/resultats?user_id=eq.${user_id}` +
        `&theme=eq.${encodeURIComponent(theme)}` +
        `&sous_theme=eq.${encodeURIComponent(sous_theme || '')}` +
        `&difficulte=eq.${encodeURIComponent(difficulte)}` +
        `&score=eq.${score}&total=eq.${total}` +
        `&select=created_at&order=created_at.desc&limit=1`,
        { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
      )
      const dupData = await dupRes.json()
      if (Array.isArray(dupData) && dupData.length > 0) {
        const ecartMs = Date.now() - new Date(dupData[0].created_at).getTime()
        if (ecartMs >= 0 && ecartMs < FENETRE_DOUBLON_MS) {
          console.log(`[quiz-resultat] doublon ignoré : user_id=${user_id} ${theme}/${sous_theme}/${difficulte} score=${score}/${total} écart=${ecartMs}ms`)
          return { success: true, doublon: true }
        }
      }
    } catch (e) {
      console.log('[quiz-resultat] échec contrôle doublon, insertion normale (fail-open):', e.message)
    }

    // Récupère email_parent depuis profils
    let email_parent = ''
    try {
      const profilRes = await fetch(`${SUPABASE_URL}/rest/v1/profils?user_id=eq.${user_id}&select=email_parent&limit=1`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
      })
      const profilData = await profilRes.json()
      if (Array.isArray(profilData) && profilData.length > 0) {
        email_parent = profilData[0].email_parent || ''
      }
    } catch (e) { console.log('Erreur récupération profil:', e.message) }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/resultats`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id, email: email || '', prenom: prenom || '', email_parent,
        theme, sous_theme: sous_theme || '', difficulte, score, total,
        questions_ratees, temps_secondes, aucune_idee,
        source_questions, alerte_envoyee: false
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      return { error: errText }
    }
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
