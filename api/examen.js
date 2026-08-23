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
          const vues = await lireVues(ctx, idsTous)

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
            const nonVues = pool.filter(q => !vues.has(q.id))
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
          if (idsAPurger.length > 0) await purgerVues(ctx, idsAPurger)

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
          await marquerVues(ctx, idsAMarquer)
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
// Chaque partie est filtrée des questions déjà servies à cet élève. Quand il
// reste moins de SEUIL_REBOUCLE non vues dans UNE partie, seules les vues de
// cette partie sont purgées — les trois autres ne sont pas dans la liste du
// DELETE et survivent.
//
// SEUIL_REBOUCLE vaut 6 et non 5 : le découpage en tiers du tirage ne rend
// 5 questions qu'à partir d'un pool de 6 (à 5, floor(5/3)=1 donne 1+1+1=3).
// Tirer dans un pool filtré descendu à 5 produirait un examen à 17 questions
// noté sur 20 — le 20 est codé en dur dans examen.html (total des insert
// examens_blancs, pourcentage de l'email, libellés). Le seuil à 6 garantit
// qu'on ne tire jamais dans un ensemble incapable de rendre un tirage complet.
// Une partie qui compte nativement moins de 6 questions est laissée
// entièrement de côté : son tirage incomplet est un défaut préexistant, que
// le filtrage ne doit ni aggraver ni masquer.
//
// Trois requêtes au maximum, quel que soit le nombre de parties concernées :
// une lecture groupée, une purge groupée (bornée aux ids des seules parties
// en reboucle), un marquage groupé des 20 questions servies.
//
// Toutes les opérations passent par le jeton de l'élève (clé anon + Bearer),
// donc sous la policy RLS `auth.uid() = user_id`. Le filtre user_id explicite
// est redondant avec elle : défense en profondeur, il borne la lecture et
// surtout le DELETE même si la policy sautait ou si ces requêtes passaient un
// jour par la clé service.
//
// Fail-open assumé, jamais silencieux : l'état réel est journalisé (préfixe
// [questions_vues]) et signalé au client dans `vues`, sous forme close —
//   raison   applique | anonyme | config_absente | non_filtre
//   parties  par partie : filtre | reboucle | pool_insuffisant
//   echec    lecture | purge | marquage | inconnu — n'écrase jamais raison
//   statut   code HTTP nu, absent si l'échec n'est pas une réponse HTTP
// AUCUNE chaîne provenant de PostgREST ou de fetch ne part au client.
//
// Ces helpers sont dupliqués depuis api/generer.js (au `source` près) — une
// extraction dans lib/questions-vues.js est prévue en PR de refactor séparée.

const SEUIL_REBOUCLE = 6
const SUPABASE_URL_VUES = 'https://vkkgadwqumqqwpaayjac.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Le in.() de la lecture porte tous les ids d'examen_questions, table qui
// grossit à chaque brevet blanc généré par api/generer-brevet.js.
const LIMITE_FILTRE_URL = 500

// Lit le `sub` du jeton sans en vérifier la signature : l'autorité reste
// PostgREST, qui rejette un jeton invalide (401) ou un user_id qui ne
// correspond pas au porteur (violation WITH CHECK).
function lireSubJeton(access_token) {
  try {
    const payload = access_token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
    return json.sub || null
  } catch (e) {
    return null
  }
}

// Retourne { ctx, raison } : ctx non nul si le filtrage peut opérer, sinon
// raison dit pourquoi il ne peut pas.
function contexteEleve(access_token) {
  if (!access_token || typeof access_token !== 'string') return { ctx: null, raison: 'anonyme' }
  // Testé après le jeton, pour que le log ne se déclenche que sur une requête
  // où le filtrage aurait réellement dû tourner.
  if (!SUPABASE_ANON_KEY) {
    console.log('[questions_vues] NEXT_PUBLIC_SUPABASE_ANON_KEY absente — filtrage désactivé')
    return { ctx: null, raison: 'config_absente' }
  }
  const userId = lireSubJeton(access_token)
  if (!userId) return { ctx: null, raison: 'anonyme' }
  return {
    ctx: {
      userId,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    },
    raison: null
  }
}

// Point de passage unique de tous les appels à questions_vues : garantit que
// chaque échec porte son opération, et que le corps PostgREST est capturé sur
// l'erreur (destination log) sans jamais transiter par un message d'exception
// susceptible d'être renvoyé au client.
async function appelVues(operation, url, options = {}) {
  let r
  try {
    r = await fetch(url, options)
  } catch (e) {
    e.operation = operation
    throw e
  }
  if (!r.ok) {
    const e = new Error(`${operation} ${r.status}`)
    e.operation = operation
    e.statut = r.status
    e.corps = await r.text()
    throw e
  }
  return r
}

function noterEchec(diag, e) {
  diag.echec = e.operation || 'inconnu'
  if (typeof e.statut === 'number') diag.statut = e.statut
}

function journaliserEchec(contexte, e) {
  console.log(
    `[questions_vues] ${contexte} —`,
    e.operation || 'inconnu',
    typeof e.statut === 'number' ? `HTTP ${e.statut}` : '',
    e.corps || e.message
  )
}

async function lireVues(ctx, ids) {
  let url = `${SUPABASE_URL_VUES}/rest/v1/questions_vues?user_id=eq.${ctx.userId}&source=eq.examen&select=question_id`
  // Au-delà de la limite, le filtre in.() est retiré de la LECTURE seulement :
  // user_id + source bornent déjà ce qu'on lit, le tri se fait en JS.
  if (ids.length <= LIMITE_FILTRE_URL) url += `&question_id=in.(${ids.join(',')})`
  const r = await appelVues('lecture', url, { headers: ctx.headers })
  const data = await r.json()
  if (!Array.isArray(data)) {
    const e = new Error('réponse inattendue')
    e.operation = 'lecture'
    throw e
  }
  return new Set(data.map(v => v.question_id))
}

// Le DELETE n'est jamais élargi : c'est sa borne qui porte la sûreté. S'il
// dépasse la limite d'URL, il est découpé en plusieurs requêtes bornées.
async function purgerVues(ctx, ids) {
  for (let i = 0; i < ids.length; i += LIMITE_FILTRE_URL) {
    const lot = ids.slice(i, i + LIMITE_FILTRE_URL)
    const url = `${SUPABASE_URL_VUES}/rest/v1/questions_vues?user_id=eq.${ctx.userId}&source=eq.examen&question_id=in.(${lot.join(',')})`
    await appelVues('purge', url, { method: 'DELETE', headers: { ...ctx.headers, 'Prefer': 'return=minimal' } })
  }
}

async function marquerVues(ctx, ids) {
  if (ids.length === 0) return
  await appelVues('marquage', `${SUPABASE_URL_VUES}/rest/v1/questions_vues`, {
    method: 'POST',
    headers: { ...ctx.headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(ids.map(id => ({ user_id: ctx.userId, question_id: id, source: 'examen' })))
  })
}
