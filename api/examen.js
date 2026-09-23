import { memoireQuestionsVues, contexteEleve, noterEchec, journaliserEchec } from '../lib/questions-vues.js'
import { corrigerExamen } from '../lib/examen-score.js'
import { verifierGateEleve } from '../lib/auth-eleve.js'
import { verifierToken } from '../lib/auth-token.js'

const ACTIONS_VALIDES = ['demarrer', 'progression', 'reprise', 'enregistrer']
const DUREE_EXAMEN_MS = 40 * 60 * 1000
const DUREE_EXAMEN_S = 40 * 60

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
  if (!ACTIONS_VALIDES.includes(action)) return res.status(400).json({ error: 'Action inconnue' })

  // ── Authentification — commune aux 4 actions ─────────────────────────
  // examens_progression n'a AUCUNE policy RLS côté client (cf. db/policies.sql) :
  // sa seule protection est ici. Le user_id du corps de la requête n'est donc
  // plus jamais utilisé comme identité — on vérifie le jeton auprès de
  // Supabase Auth, même mécanisme que api/stripe-checkout.js (fetch
  // /auth/v1/user avec Bearer <token>). Avant ce chantier, 'enregistrer'
  // faisait confiance au user_id du body (cf. docs/TODO.md, item 27, pour le
  // même angle mort probable sur api/quiz-resultat.js, non traité ici).
  const userId = await verifierToken(req.body.access_token, SUPA_URL, SUPA_KEY)
  if (!userId) return res.status(401).json({ error: 'Session invalide' })

  // Un console.log par requête — action/tentative_id/abandonne — pour que
  // deux requêtes concurrentes (ex. reprise + abandon pagehide tardif)
  // soient distinguables dans les logs Vercel. Absent avant l'incident du
  // 22/09/2026 (F5, expiration) : impossible de savoir a posteriori laquelle
  // des deux requêtes loggées correspondait à quelle action.
  console.log('[examen]', action, 'user=' + userId, 'tentative_id=' + (req.body.tentative_id || '-'), 'abandonne=' + (req.body.abandonne === undefined ? '-' : req.body.abandonne))

  // ═══════════════════════════════════════════
  // DEMARRER — sélectionne 20 questions, SANS answer ni explication
  // ═══════════════════════════════════════════
  if (action === 'demarrer') {
    try {
      const parties = [1, 2, 3, 4]
      const pools = {}

      for (const partie of parties) {
        const r = await fetch(`${SUPA_URL}/rest/v1/examen_questions?partie=eq.${partie}&select=${COLONNES_QUESTION_CLIENT}`, { headers })
        if (!r.ok) {
          console.error('[demarrer] lecture examen_questions refusée, partie', partie, ':', r.status, await r.text())
          throw new Error('Questions partie ' + partie + ' introuvables')
        }
        const data = await r.json()
        if (!Array.isArray(data) || data.length === 0) throw new Error('Questions partie ' + partie + ' introuvables')
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

      const questionsFinales = toutesLesQuestions.sort(() => Math.random() - 0.5).map(mapperQuestionPourClient)

      // ── Progression : bootstrap d'une nouvelle tentative ──────────
      // tentative_id/heure_fin ne sont plus jamais modifiables par le client
      // ensuite (cf. 'progression'). Upsert sur user_id (clé primaire) :
      // écrase silencieusement une tentative précédente abandonnée, comme
      // voulu. Best-effort et fail-open : un échec d'écriture ici ne doit pas
      // empêcher l'examen de démarrer, seulement priver cette tentative de
      // la reprise si une coupure survient (dégradation vers le comportement
      // d'avant ce chantier, pas un blocage).
      const tentativeId = crypto.randomUUID()
      const heureFin = new Date(Date.now() + DUREE_EXAMEN_MS).toISOString()
      try {
        const rProg = await fetch(`${SUPA_URL}/rest/v1/examens_progression?on_conflict=user_id`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            user_id: userId,
            tentative_id: tentativeId,
            question_ids: questionsFinales.map(q => q.id),
            reponses: [],
            heure_fin: heureFin,
            updated_at: new Date().toISOString()
          })
        })
        if (!rProg.ok) console.error('[examens_progression] écriture demarrer refusée:', rProg.status, await rProg.text())
      } catch (e) {
        console.error('[examens_progression] écriture demarrer échouée:', e.message)
      }

      return res.status(200).json({ success: true, questions: questionsFinales, vues: diag, tentative_id: tentativeId, heure_fin: heureFin })
    } catch (e) {
      console.error('[demarrer] échec inattendu:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // PROGRESSION — sauvegarde best-effort des réponses en cours, appelée à
  // chaque pick(). Ne touche jamais heure_fin ni question_ids (absents du
  // payload envoyé : rien à "refuser" explicitement, ils ne sont simplement
  // jamais dans la clause PATCH).
  // ═══════════════════════════════════════════
  if (action === 'progression') {
    try {
      const { tentative_id, reponses } = req.body
      if (!tentative_id || !Array.isArray(reponses)) return res.status(400).json({ error: 'Paramètres manquants' })

      const r = await fetch(`${SUPA_URL}/rest/v1/examens_progression?user_id=eq.${userId}&tentative_id=eq.${tentative_id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ reponses, updated_at: new Date().toISOString() })
      })
      if (!r.ok) {
        journaliserEchecProgression('patch', r.status, await r.text())
        return res.status(500).json({ error: 'Sauvegarde échouée' })
      }
      return res.status(200).json({ success: true })
    } catch (e) {
      console.error('[progression] échec inattendu:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // REPRISE — état de la tentative en cours du user (questions sans answer
  // ni explication, comme 'demarrer', + reponses déjà enregistrées +
  // heure_fin), ou soumission automatique si heure_fin est dépassé.
  // ═══════════════════════════════════════════
  if (action === 'reprise') {
    try {
      const prog = await lireProgression(userId, SUPA_URL, headers)
      if (!prog) return res.status(200).json({ success: true, encours: false })

      const finMs = new Date(prog.heure_fin).getTime()
      const reponsesStockees = Array.isArray(prog.reponses) ? prog.reponses : []
      const questionIds = Array.isArray(prog.question_ids) ? prog.question_ids : []

      if (questionIds.length === 0) {
        // Ligne corrompue/vide (ne devrait pas arriver : 'demarrer' écrit
        // toujours 20 ids) — id=in.() est un filtre invalide pour PostgREST,
        // traité comme "rien à reprendre" plutôt que de planter dessus.
        console.error('[reprise] question_ids vide/invalide pour la tentative', prog.tentative_id, '— traité comme aucune tentative en cours')
        return res.status(200).json({ success: true, encours: false })
      }

      // Questions complètes, RÉORDONNÉES exactement selon question_ids : cet
      // ordre conditionne l'indexation answers[i] côté client (construireReponses()
      // s'appuie sur la position dans le tableau `questions`), il ne doit
      // jamais être re-mélangé ici comme au tirage initial.
      const idsStr = questionIds.join(',')
      const rq = await fetch(`${SUPA_URL}/rest/v1/examen_questions?id=in.(${idsStr})&select=${COLONNES_QUESTION_CLIENT}`, { headers })
      if (!rq.ok) {
        console.error('[reprise] lecture examen_questions refusée:', rq.status, await rq.text())
        return res.status(500).json({ error: 'Lecture des questions échouée' })
      }
      const data = await rq.json()
      if (!Array.isArray(data)) {
        console.error('[reprise] réponse examen_questions inattendue (pas un tableau):', JSON.stringify(data).slice(0, 500))
        return res.status(500).json({ error: 'Réponse inattendue' })
      }
      const qMap = {}
      data.forEach(q => { qMap[q.id] = q })
      const questionsFinales = questionIds.map(id => qMap[id]).filter(Boolean).map(mapperQuestionPourClient)

      if (questionsFinales.length !== questionIds.length) {
        console.error('[reprise] questions manquantes pour la tentative', prog.tentative_id, ': demandées=' + questionIds.length, 'trouvées=' + questionsFinales.length)
      }

      if (Date.now() >= finMs) {
        // Temps écoulé pendant l'absence : soumission automatique des
        // réponses enregistrées jusqu'ici — pas un abandon à 0, même chemin
        // que le timeout normal côté client.
        const reponsesValides = filtrerReponsesValides(reponsesStockees, questionIds)
        const { nbOk, themes, questionsRatees, correction } = await corrigerExamen({ reponses: reponsesValides, supabaseUrl: SUPA_URL, headers })

        const result = await enregistrerExamen({
          user_id: userId, email: req.body.email || '', prenom: req.body.prenom || '',
          score: nbOk, total: 20, scores_themes: themes, questions_ratees: questionsRatees,
          questions_posees: reponsesValides.map(r => r.id),
          temps_secondes: DUREE_EXAMEN_S,
          tentative_id: prog.tentative_id, abandonne: false
        })
        if (result.error) {
          console.error('[reprise] soumission automatique échouée:', result.error)
          return res.status(500).json({ error: result.error })
        }

        await supprimerProgression(userId, prog.tentative_id, SUPA_URL, headers)

        return res.status(200).json({
          success: true, encours: true, soumisAuto: true,
          questions: questionsFinales, reponses: reponsesStockees,
          score: nbOk, total: 20, correction, themes, questionsRatees, temps_secondes: DUREE_EXAMEN_S
        })
      }

      return res.status(200).json({
        success: true, encours: true,
        questions: questionsFinales, reponses: reponsesStockees,
        heure_fin: prog.heure_fin, tentative_id: prog.tentative_id
      })
    } catch (e) {
      console.error('[reprise] échec inattendu:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // ENREGISTRER — persiste le résultat final (fin normale, soumission
  // manuelle, ou abandon). Transposition de api/quiz-resultat.js pour
  // examens_blancs, fusionnée ici plutôt qu'un fichier api/examen-resultat.js
  // séparé : le plan Vercel Hobby plafonne à 12 fonctions serverless sous
  // api/, déjà atteint — même contrainte, même résolution que
  // stripe-checkout.js (action 'portal' fusionnée depuis stripe-portal.js,
  // cf. CLAUDE.md).
  //
  // tentative_id (colonne + contrainte UNIQUE côté examens_blancs) est
  // désormais la clé d'upsert : une soumission finale écrase un abandon déjà
  // écrit pour la même tentative, mais jamais l'inverse (cf. transition
  // ci-dessous). client_key reste une colonne à part pour l'idempotence
  // HTTP, sans fusion avec tentative_id comme cible de conflit.
  // ═══════════════════════════════════════════
  if (action === 'enregistrer') {
    try {
      const { tentative_id, email, prenom, reponses, temps_secondes, abandonne, definitif, client_key } = req.body
      if (!tentative_id) return res.status(400).json({ error: 'Paramètres manquants' })

      const prog = await lireProgression(userId, SUPA_URL, headers, tentative_id)

      // Le temps est calculé côté serveur à partir de heure_fin quand la
      // ligne de progression est disponible — jamais d'après le
      // temps_secondes envoyé par le client. Fail-open sur le temps client
      // si la ligne est absente (échec d'écriture au démarrage, ou tentative
      // remplacée par un "Recommencer" lancé dans un autre onglet).
      let tempsSecondesServeur = temps_secondes || 0
      if (prog && prog.heure_fin) {
        const finMs = new Date(prog.heure_fin).getTime()
        tempsSecondesServeur = Math.max(0, Math.min(DUREE_EXAMEN_S, Math.floor((DUREE_EXAMEN_MS - Math.max(0, finMs - Date.now())) / 1000)))
      }

      if (abandonne) {
        // Transition interdite : un abandon ne doit jamais écraser un
        // résultat déjà terminé (retry tardif du beacon pagehide après une
        // soumission réussie, ou course avec la soumission automatique de
        // 'reprise'). Auparavant appliquée ici par une lecture puis une
        // écriture séparées — non atomique, donc battable par une écriture
        // concurrente entre la lecture et l'écriture, quel que soit l'écart
        // observé entre deux requêtes dans les logs (incident F5+expiration
        // du 22/09/2026, score réel écrasé par un abandon malgré ce garde).
        // La garantie est désormais dans enregistrerExamen() elle-même,
        // portée par le WHERE de l'écriture, pas par une lecture préalable.
        const result = await enregistrerExamen({
          user_id: userId, email: email || '', prenom: prenom || '',
          score: 0, total: 20, scores_themes: {}, questions_ratees: [],
          questions_posees: Array.isArray(reponses) ? reponses.map(r => r.id) : [],
          temps_secondes: tempsSecondesServeur, client_key, tentative_id, abandonne: true
        })
        if (result.error) {
          console.error('[enregistrer] abandon échoué:', result.error)
          return res.status(500).json({ error: result.error })
        }

        // Abandon explicite et confirmé (retourAccueil()/logout(), après le
        // confirm() qui prévient l'élève qu'il perd sa progression) : la
        // tentative est définitivement close, la ligne de progression est
        // supprimée — cohérent avec le message déjà affiché, écran d'intro à
        // la prochaine visite. Un abandon incertain (pagehide : F5, onglet
        // fermé, crash) la CONSERVE, pour que la reprise reste possible.
        if (definitif) await supprimerProgression(userId, tentative_id, SUPA_URL, headers)

        return res.status(200).json({ success: true, score: 0, total: 20 })
      }

      if (!reponses || !Array.isArray(reponses)) return res.status(400).json({ error: 'Réponses manquantes' })

      // Écarte les ids absents de question_ids (tentative falsifiée) et les
      // doublons — garde la première occurrence (répéter l'id d'une question
      // facile pour gonfler le score). Fail-open (reponses non filtrées) si
      // la ligne de progression est absente : même compromis que pour le
      // temps ci-dessus.
      const reponsesValides = prog && Array.isArray(prog.question_ids)
        ? filtrerReponsesValides(reponses, prog.question_ids)
        : reponses

      const { nbOk, themes, questionsRatees, correction } = await corrigerExamen({ reponses: reponsesValides, supabaseUrl: SUPA_URL, headers })

      const result = await enregistrerExamen({
        user_id: userId, email: email || '', prenom: prenom || '',
        score: nbOk, total: 20, scores_themes: themes, questions_ratees: questionsRatees,
        questions_posees: reponsesValides.map(r => r.id),
        temps_secondes: tempsSecondesServeur, client_key, tentative_id, abandonne: false
      })
      if (result.error) {
        console.error('[enregistrer] soumission finale échouée:', result.error)
        return res.status(500).json({ error: result.error })
      }

      // Suppression uniquement à la soumission finale réussie — jamais sur
      // abandon (cf. ci-dessus).
      await supprimerProgression(userId, tentative_id, SUPA_URL, headers)

      return res.status(200).json({ success: true, score: nbOk, total: 20, correction, themes, questionsRatees, temps_secondes: tempsSecondesServeur })
    } catch (e) {
      console.error('[enregistrer] échec inattendu:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }
}

// verifierToken est désormais partagé — cf. lib/auth-token.js (docs/TODO.md,
// item 27 : même besoin apparu sur api/quiz-resultat.js et
// api/email.js/recap-journalier-user).

// Colonnes réelles de examen_questions (information_schema, vérifié le
// 21/09/2026) : id, numero, theme, question, opts, answer, explication,
// annee, partie, chapitre, figure, figure_url. Pas de colonne "tableau".
//
// Liste UNIQUE utilisée par 'demarrer' (fetch par partie) ET 'reprise'
// (fetch par question_ids) : deux listes tenues à la main avaient fini par
// diverger — c'est exactement l'origine du 500 constaté sur F5 (colonne
// "tableau" demandée explicitement par 'reprise' seule, jamais par
// 'demarrer' qui utilisait select=*, donc jamais vérifiée par ce chemin-là).
// N'inclut jamais answer/explication (réponse correcte, jamais envoyée
// avant la fin de l'examen) ni numero/annee/figure_url (colonnes réelles
// mais non consommées par mapperQuestionPourClient).
const COLONNES_QUESTION_CLIENT = 'id,question,opts,theme,chapitre,partie,figure'

// Forme envoyée au client : jamais answer/explication avant la fin de
// l'examen. Partagée par 'demarrer' et 'reprise' pour rester identique dans
// les deux cas — mêmes noms de champs que ceux attendus par renderExamen()
// côté client (examen.html).
function mapperQuestionPourClient(q) {
  return {
    id: q.id,
    q: q.question,
    opts: typeof q.opts === 'string' ? JSON.parse(q.opts) : q.opts,
    theme: q.theme,
    chapitre: q.chapitre,
    partie: q.partie,
    figure: q.figure ? (typeof q.figure === 'string' ? JSON.parse(q.figure) : q.figure) : null,
    // Aucune colonne "tableau" dans examen_questions (cf. ci-dessus) :
    // toujours null, comme c'était déjà le cas de fait via demarrer avant
    // ce correctif (select=* n'exposait jamais une colonne qui n'existe
    // pas). Champ conservé dans la forme renvoyée : renderTableau(q.tableau)
    // côté client l'attend, null y est un no-op sans effet visible.
    tableau: null
  }
}

// Écarte les ids absents de questionIds et les doublons (garde la première
// occurrence) — défense contre une tentative de gonfler le score en
// répétant l'id d'une question facile dans les réponses soumises.
function filtrerReponsesValides(reponses, questionIds) {
  if (!Array.isArray(questionIds)) return reponses
  const valides = new Set(questionIds)
  const vues = new Set()
  return reponses.filter(function (r) {
    if (!valides.has(r.id) || vues.has(r.id)) return false
    vues.add(r.id)
    return true
  })
}

function journaliserEchecProgression(operation, statut, corps) {
  console.error('[examens_progression]', operation, statut, corps)
}

async function lireProgression(userId, SUPA_URL, headers, tentativeId) {
  try {
    let url = `${SUPA_URL}/rest/v1/examens_progression?user_id=eq.${userId}`
    if (tentativeId) url += `&tentative_id=eq.${tentativeId}`
    url += '&select=*'
    const r = await fetch(url, { headers })
    if (!r.ok) { journaliserEchecProgression('lecture', r.status, await r.text()); return null }
    const data = await r.json()
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  } catch (e) {
    journaliserEchecProgression('lecture', null, e.message)
    return null
  }
}

async function supprimerProgression(userId, tentativeId, SUPA_URL, headers) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/examens_progression?user_id=eq.${userId}&tentative_id=eq.${tentativeId}`, {
      method: 'DELETE',
      headers: { ...headers, 'Prefer': 'return=minimal' }
    })
    if (!r.ok) journaliserEchecProgression('suppression', r.status, await r.text())
  } catch (e) {
    journaliserEchecProgression('suppression', null, e.message)
  }
}

async function enregistrerExamen({ user_id, email, prenom, score, total, scores_themes, questions_ratees, questions_posees, temps_secondes, client_key, tentative_id, abandonne }) {
  try {
    const SUPABASE_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
    const headersEcriture = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }

    // Gate comptes orphelins + email_parent : voir lib/auth-eleve.js,
    // partagé avec api/quiz-resultat.js.
    const gate = await verifierGateEleve(user_id, SUPABASE_URL, SERVICE_KEY)
    if (!gate.ok) return { error: 'Compte sans profil élève.' }

    // abandonne est TOUJOURS envoyé explicitement dans le corps (jamais
    // omis) : PostgREST, sur un merge/patch, ne touche que les colonnes
    // présentes dans le payload — l'omettre laisserait un abandonne
    // antérieur inchangé.
    const corps = {
      user_id, email: email || '', prenom: prenom || '', email_parent: gate.email_parent,
      score, total, temps_secondes,
      scores_themes, questions_ratees, questions_posees,
      client_key: client_key || null,
      tentative_id: tentative_id || null,
      abandonne: !!abandonne
    }

    if (abandonne) {
      // Transition interdite (jamais terminé → abandon) garantie par le
      // WHERE d'une écriture atomique côté base — PAS par une lecture puis
      // une écriture séparées (ancien garde, retiré : lireExamenParTentative
      // + vérification applicative, battable par toute écriture concurrente
      // entre la lecture et l'écriture, quel que soit l'écart de temps
      // observé entre deux requêtes — incident F5+expiration du 22/09/2026).
      //
      // 1. PATCH filtré sur abandonne=eq.true : ne modifie la ligne QUE si
      // elle existe déjà ET est elle-même un abandon (rejoue un F5 après un
      // F5) — Postgres évalue le WHERE et écrit en une seule opération, il
      // n'existe aucune fenêtre entre "lire" et "écrire" à l'intérieur de
      // cette seule requête.
      const rPatch = await fetch(`${SUPABASE_URL}/rest/v1/examens_blancs?tentative_id=eq.${tentative_id}&abandonne=eq.true`, {
        method: 'PATCH',
        headers: { ...headersEcriture, 'Prefer': 'return=representation' },
        body: JSON.stringify(corps)
      })
      if (!rPatch.ok) return { error: await rPatch.text() }
      const patched = await rPatch.json()
      if (Array.isArray(patched) && patched.length > 0) return { success: true }

      // 2. Rien modifié par le PATCH : soit la ligne n'existe pas encore,
      // soit elle est déjà terminée (abandonne=false) — un INSERT
      // ignore-duplicates est sûr dans les deux cas : crée la ligne si
      // absente, ne touche RIEN si elle existe déjà, quelle que soit sa
      // valeur d'abandonne (si c'était un abandon, le PATCH l'aurait déjà
      // pris ; si c'est un résultat réel, ignore-duplicates ne l'écrase
      // jamais — contrairement à merge-duplicates).
      const rInsert = await fetch(`${SUPABASE_URL}/rest/v1/examens_blancs?on_conflict=tentative_id`, {
        method: 'POST',
        headers: { ...headersEcriture, 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
        body: JSON.stringify(corps)
      })
      if (!rInsert.ok) return { error: await rInsert.text() }
      return { success: true }
    }

    // Soumission finale (abandonne=false) : toujours autorisée à écraser un
    // éventuel abandon de la même tentative, jamais l'inverse (cf.
    // ci-dessus) — merge-duplicates reste correct ici sans garde
    // supplémentaire, une soumission finale gagne toujours.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/examens_blancs?on_conflict=tentative_id`, {
      method: 'POST',
      headers: { ...headersEcriture, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify(corps)
    })
    if (!res.ok) return { error: await res.text() }
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
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
