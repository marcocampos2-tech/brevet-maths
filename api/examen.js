export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

  const { action } = req.body

  // ═══════════════════════════════════════════
  // DEMARRER — sélectionne 20 questions, SANS answer ni explication
  // ═══════════════════════════════════════════
  if (action === 'demarrer') {
    try {
      const parties = [1, 2, 3, 4]
      let toutesLesQuestions = []

      for (const partie of parties) {
        const r = await fetch(`${SUPA_URL}/rest/v1/examen_questions?partie=eq.${partie}&select=*`, { headers })
        const data = await r.json()
        if (!data || data.length === 0) throw new Error('Questions partie ' + partie + ' introuvables')

        const total = data.length
        const tiers = Math.floor(total / 3)
        const shuffled = data.sort(() => Math.random() - 0.5)
        const acc = shuffled.slice(0, tiers).sort(() => Math.random() - 0.5).slice(0, 2)
        const std = shuffled.slice(tiers, tiers * 2).sort(() => Math.random() - 0.5).slice(0, 2)
        const exp = shuffled.slice(tiers * 2).sort(() => Math.random() - 0.5).slice(0, 1)
        toutesLesQuestions = toutesLesQuestions.concat(acc).concat(std).concat(exp)
      }

      const questionsFinales = toutesLesQuestions.sort(() => Math.random() - 0.5).map(q => ({
        id: q.id,
        q: q.question,
        opts: typeof q.opts === 'string' ? JSON.parse(q.opts) : q.opts,
        theme: q.theme,
        chapitre: q.chapitre,
        partie: q.partie,
        figure: q.figure ? (typeof q.figure === 'string' ? JSON.parse(q.figure) : q.figure) : null,
        tableau: q.tableau ? (typeof q.tableau === 'string' ? JSON.parse(q.tableau) : q.tableau) : null
      }))

      return res.status(200).json({ success: true, questions: questionsFinales })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // CORRIGER — reçoit les réponses choisies, renvoie score + corrections
  // ═══════════════════════════════════════════
  if (action === 'corriger') {
    try {
      const { reponses } = req.body // [{ id, choix }, ...] choix peut être null si pas répondu
      if (!reponses || !Array.isArray(reponses)) return res.status(400).json({ error: 'Réponses manquantes' })

      const ids = reponses.map(r => r.id).join(',')
      const r = await fetch(`${SUPA_URL}/rest/v1/examen_questions?id=in.(${ids})&select=id,answer,explication,theme,chapitre,opts`, { headers })
      const questionsCompletes = await r.json()

      const questionsMap = {}
      questionsCompletes.forEach(q => { questionsMap[q.id] = q })

      let nbOk = 0
      const themes = {}
      const questionsRatees = []
      const correction = {}

      reponses.forEach(rep => {
        const q = questionsMap[rep.id]
        if (!q) return
        const opts = typeof q.opts === 'string' ? JSON.parse(q.opts) : q.opts
        const bonneReponse = q.answer
        const correct = rep.choix === bonneReponse

        if (correct) nbOk++

        const key = q.theme || 'Partie'
        if (!themes[key]) themes[key] = { ok: 0, total: 0 }
        themes[key].total++
        if (correct) themes[key].ok++

        if (rep.choix !== null && rep.choix !== undefined && !correct) {
          questionsRatees.push(q.theme + ' — ' + (q.chapitre || ''))
        }

        correction[rep.id] = { answer: bonneReponse, explication: q.explication, opts }
      })

      return res.status(200).json({ success: true, nbOk, themes, questionsRatees, correction })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(400).json({ error: 'Action inconnue' })
}
