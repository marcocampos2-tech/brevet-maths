import { memoireQuestionsVues, contexteEleve, noterEchec, journaliserEchec } from '../lib/questions-vues.js'

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
      const pools = {}

      for (const partie of parties) {
        const r = await fetch(`${SUPA_URL}/rest/v1/examen_questions?partie=eq.${partie}&select=*`, { headers })
        const data = await r.json()
        if (!data || data.length === 0) throw new Error('Questions partie ' + partie + ' introuvables')
        pools[partie] = data
      }

      // ── Filtrage des questions déjà vues, partie par partie ──────
      const diag = { actif: false, raison: 'anonyme' }
      const etats = {}
      const contexte = contexteEleve(req.body.access_token)
      const ctx = contexte.ctx

      if (!ctx) {
        diag.raison = contexte.raison
      } else {
        try {
          const idsTous = parties.reduce((acc, p) => acc.concat(pools[p].map(q => q.id)), [])
          const dejaVues = await vues.lire(ctx, idsTous)

          // Rien n'est appliqué aux pools tant que la purge n'a pas abouti :
          // en cas d'échec on repart des pools complets, jamais d'un état moitié
          // filtré moitié non.
          const selection = {}
          const nonVuesParPartie = {}
          const idsAPurger = []

          for (const partie of parties) {
            const pool = pools[partie]
            if (pool.length < SEUIL_REBOUCLE) {
              // Le découpage en tiers ne rend 5 questions qu'à partir de 6.
              // Sous ce seuil, filtrer ne pourrait que dégrader un tirage déjà
              // incomplet — on laisse la partie intacte.
              etats[partie] = 'pool_insuffisant'
              continue
            }
            const nonVues = pool.filter(q => !dejaVues.has(q.id))
            nonVuesParPartie[partie] = nonVues.length
            if (nonVues.length >= SEUIL_REBOUCLE) {
              etats[partie] = 'filtre'
              selection[partie] = nonVues
            } else {
              // Épuisement de CETTE partie : purge de ses seuls ids, les trois
              // autres parties ne sont pas dans la liste et survivent.
              etats[partie] = 'reboucle'
              idsAPurger.push(...pool.map(q => q.id))
            }
          }

          // Purge AVANT tirage et marquage, sinon on effacerait ce qu'on sert.
          if (idsAPurger.length > 0) await vues.purger(ctx, idsAPurger)

          for (const partie of parties) {
            if (selection[partie]) pools[partie] = selection[partie]
          }
          diag.actif = true
          diag.raison = 'applique'
          diag.parties = etats
          diag.non_vues = nonVuesParPartie
        } catch (e) {
          // Tirage non filtré plutôt qu'un examen cassé — mais tracé des deux côtés.
          diag.actif = false
          diag.raison = 'non_filtre'
          noterEchec(diag, e)
          journaliserEchec('filtrage impossible, tirage non filtré', e)
        }
      }

      let toutesLesQuestions = []
      for (const partie of parties) {
        const data = pools[partie]
        const total = data.length
        const tiers = Math.floor(total / 3)
        const shuffled = data.sort(() => Math.random() - 0.5)
        const acc = shuffled.slice(0, tiers).sort(() => Math.random() - 0.5).slice(0, 2)
        const std = shuffled.slice(tiers, tiers * 2).sort(() => Math.random() - 0.5).slice(0, 2)
        const exp = shuffled.slice(tiers * 2).sort(() => Math.random() - 0.5).slice(0, 1)
        toutesLesQuestions = toutesLesQuestions.concat(acc).concat(std).concat(exp)
      }

      // ── Marquage des questions servies ───────────────────────────
      if (ctx && diag.actif) {
        try {
          // Une partie sous le seuil n'est ni lue ni purgée : la marquer
          // créerait des lignes que rien ne viendrait jamais nettoyer.
          const idsAMarquer = toutesLesQuestions
            .filter(q => etats[q.partie] !== 'pool_insuffisant')
            .map(q => q.id)
          await vues.marquer(ctx, idsAMarquer)
          diag.marquees = idsAMarquer.length
        } catch (e) {
          // `raison` garde l'état du tirage : une reboucle réussie suivie d'un
          // marquage refusé doit rester lisible comme telle.
          noterEchec(diag, e)
          journaliserEchec('marquage impossible', e)
        }
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

      return res.status(200).json({ success: true, questions: questionsFinales, vues: diag })
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

// ═══════════════════════════════════════════════════════════════
// MÉMOIRE DES QUESTIONS VUES (source = 'examen')
// ═══════════════════════════════════════════════════════════════
// Socle commun (contexte élève, lecture, purge, marquage, étanchéité des
// erreurs) dans lib/questions-vues.js. Ce qui suit est propre à l'examen.
//
// SEUIL_REBOUCLE vaut 6 et non 5 : le découpage en tiers du tirage ne rend
// 5 questions qu'à partir d'un pool de 6 (à 5, floor(5/3)=1 donne 1+1+1=3).
// Tirer dans un pool filtré descendu à 5 produirait un examen à 17 questions
// noté sur 20 — le 20 est codé en dur dans examen.html (total des insert
// examens_blancs, pourcentage de l'email parent, libellés). Le seuil à 6
// garantit qu'on ne tire jamais dans un ensemble incapable de rendre un
// tirage complet. NE PAS l'aligner sur les 5 de api/generer.js « par
// cohérence » : ce sont deux contraintes différentes.
//
// Une partie qui compte nativement moins de 6 questions est laissée
// entièrement de côté : ni lue, ni purgée, ni marquée. Son tirage incomplet
// est un défaut préexistant que le filtrage ne doit ni aggraver ni masquer,
// et ne pas la marquer évite des lignes que rien ne viendrait jamais
// nettoyer, puisque cette partie ne reboucle pas.
//
// Trois requêtes au maximum, quel que soit le nombre de parties concernées :
// une lecture groupée, une purge groupée (bornée aux ids des seules parties
// en reboucle), un marquage groupé des questions servies.

const SEUIL_REBOUCLE = 6

// Source liée une seule fois pour tout le fichier — voir lib/questions-vues.js.
const vues = memoireQuestionsVues('examen')
