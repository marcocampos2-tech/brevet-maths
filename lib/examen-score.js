// /lib/examen-score.js
//
// Calcul du score d'un examen blanc à partir des réponses brutes — extrait
// de api/examen.js (action 'corriger'), où cette logique allait être
// dupliquée par l'action 'enregistrer' du même fichier pour la persistance
// du résultat. Les deux appelants passent leurs propres
// supabaseUrl/headers (clé service) : ce module ne connaît aucun secret,
// aucune variable d'environnement.

export async function corrigerExamen({ reponses, supabaseUrl, headers }) {
  const ids = reponses.map(r => r.id).join(',')
  const r = await fetch(`${supabaseUrl}/rest/v1/examen_questions?id=in.(${ids})&select=id,answer,explication,theme,chapitre,opts`, { headers })
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

  return { nbOk, themes, questionsRatees, correction }
}
