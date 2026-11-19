import { memoireQuestionsVues, contexteEleve, noterEchec, journaliserEchec } from '../lib/questions-vues.js'
import { tirerParFamille, melanger } from '../lib/tirage-familles.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { theme, sous_theme, difficulte, access_token } = req.body

    // ── BANQUE EN PREMIER ──────────────────────────────────
    const { questions, diag } = await getBanqueSupabase(theme, sous_theme, difficulte, access_token)
    if (questions.length > 0) {
      return res.status(200).json({ questions, source: 'banque', vues: diag })
    }

    // ── BANQUE VIDE ─────────────────────────────────────────
    // Le secours par génération IA a été retiré le 19/11/2026 (décision CM) :
    // les 22 sous-thèmes ont leurs questions en banque, et des questions
    // inventées, non relues, ne doivent jamais être servies à un élève.
    // Le client (quiz.html) affiche ce message et réactive le choix.
    return res.status(503).json({ error: 'Aucune question n\'est disponible pour ce choix pour le moment. Réessaie dans quelques instants.' })

  } catch(e) {
    console.log('Erreur générale:', e.message)
    try {
      const { questions, diag } = await getBanqueSupabase(req.body?.theme, req.body?.sous_theme, req.body?.difficulte, req.body?.access_token)
      if (questions.length > 0) return res.status(200).json({ questions, source: 'banque', vues: diag })
    } catch(e2) {}
    res.status(500).json({ error: '❌ Une erreur est survenue.' })
  }
}

// ═══════════════════════════════════════════════════════════════
// BANQUE + MÉMOIRE DES QUESTIONS VUES (source = 'banque')
// ═══════════════════════════════════════════════════════════════
// Socle commun (contexte élève, lecture, purge, marquage, étanchéité des
// erreurs) dans lib/questions-vues.js. Ce qui suit décrit ce qui est propre
// au quiz normal.
//
// Le pool est filtré des questions déjà servies à cet élève (table
// questions_vues, source='banque'). Quand il reste moins de SEUIL_REBOUCLE
// énoncés non vus, les vues de CE sous-thème/difficulté sont purgées et le
// pool redevient entièrement disponible — les autres sous-thèmes ne sont
// jamais touchés.
//
// Un pool de SEUIL_REBOUCLE énoncés distincts ou moins court-circuite tout
// le mécanisme : le tirage sert le pool entier de toute façon, filtrer puis
// purger puis re-marquer reconstituerait le même ensemble à chaque quiz.
//
// Toutes les opérations sur questions_vues passent par le jeton de l'élève
// (clé anon + Authorization: Bearer <access_token>), donc sous la policy RLS
// `auth.uid() = user_id` : impossible d'écrire ou de purger sur le compte
// d'un tiers, même en forgeant le corps de la requête.
//
// Fail-open assumé : toute panne du mécanisme laisse le quiz partir avec un
// tirage non filtré. Pour que cet échec ne soit jamais silencieux, il est
// journalisé (préfixe [questions_vues]) ET signalé au client dans le champ
// `vues` de la réponse — mais sous une forme strictement close :
//
//   raison  état du tirage : filtre | reboucle | pool_insuffisant |
//           non_filtre | anonyme | config_absente
//   echec   opération fautive, absent si tout va bien : lecture | purge |
//           marquage | inconnu
//   statut  code HTTP nu, absent si l'échec n'est pas une réponse HTTP
//
// `raison` décrit toujours le tirage, `echec` ne l'écrase jamais : un
// marquage refusé après une reboucle réussie doit rester lisible comme tel.
//
// AUCUNE chaîne provenant de PostgREST ou de fetch ne part au client — ni
// corps d'erreur (qui expose noms de contraintes et de colonnes), ni message
// d'exception réseau. Le détail complet ne va que dans le log Vercel.

const SEUIL_REBOUCLE = 5
const SUPABASE_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'

// Source liée une seule fois pour tout le fichier — voir lib/questions-vues.js.
const vues = memoireQuestionsVues('banque')

const texteNormalise = (q) => (q.question || '').trim()

function dedoublonnerParTexte(liste) {
  return liste.filter((q, idx, arr) =>
    arr.findIndex(x => texteNormalise(x) === texteNormalise(q)) === idx
  )
}

async function getBanqueSupabase(theme, sous_theme, difficulte, access_token) {
  const diag = { actif: false, raison: 'anonyme' }
  try {
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
    const url = `${SUPABASE_URL}/rest/v1/questions_banque?theme=eq.${encodeURIComponent(theme)}&sous_theme=eq.${encodeURIComponent(sous_theme)}&difficulte=eq.${encodeURIComponent(difficulte)}&statut=eq.actif&select=id,question,opts,answer,explication,tableau,figure,famille`
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return { questions: [], diag }

    const uniques = dedoublonnerParTexte(data)
    let candidats = uniques
    let ctx = null

    if (uniques.length <= SEUIL_REBOUCLE) {
      // Court-circuit : le tirage sert le pool entier quoi qu'il arrive.
      // Filtrer n'écarterait rien, et purger puis re-marquer rejouerait un
      // DELETE + INSERT sans changement d'état à chaque quiz.
      diag.raison = 'pool_insuffisant'
      diag.uniques = uniques.length
    } else {
      const contexte = contexteEleve(access_token)
      ctx = contexte.ctx
      if (!ctx) {
        diag.raison = contexte.raison
      } else {
        try {
          const idsPool = data.map(q => q.id)
          const dejaVues = await vues.lire(ctx, idsPool)
          const nonVues = dedoublonnerParTexte(data.filter(q => !dejaVues.has(q.id)))

          if (nonVues.length >= SEUIL_REBOUCLE) {
            candidats = nonVues
            diag.actif = true
            diag.raison = 'filtre'
            diag.non_vues = nonVues.length
          } else {
            // vues.size > 0 est garanti ici : le pool compte plus de
            // SEUIL_REBOUCLE énoncés distincts et il en reste moins que ça.
            // Purge AVANT tirage et marquage, sinon on effacerait ce qu'on sert.
            await vues.purger(ctx, idsPool)
            diag.actif = true
            diag.raison = 'reboucle'
            diag.non_vues = nonVues.length
          }
        } catch (e) {
          // Tirage non filtré plutôt qu'un quiz cassé — mais tracé des deux côtés.
          diag.actif = false
          diag.raison = 'non_filtre'
          noterEchec(diag, e)
          journaliserEchec('filtrage impossible, tirage non filtré', e)
        }
      }
    }

    // Une question par famille tant que possible (voir lib/tirage-familles.js).
    const shuffled = tirerParFamille(candidats, 5)

    // ── Marquage : tous les ids partageant l'énoncé servi ────────
    if (ctx && diag.actif) {
      try {
        const textesServis = new Set(shuffled.map(texteNormalise))
        const idsAMarquer = data.filter(q => textesServis.has(texteNormalise(q))).map(q => q.id)
        await vues.marquer(ctx, idsAMarquer)
        diag.marquees = idsAMarquer.length
      } catch (e) {
        // `raison` garde l'état du tirage : une reboucle réussie suivie d'un
        // marquage refusé doit rester lisible comme telle.
        noterEchec(diag, e)
        journaliserEchec('marquage impossible', e)
      }
    }

    const questions = shuffled.map(q => {
      const opts = typeof q.opts === 'string' ? JSON.parse(q.opts) : q.opts
      const correcte = opts[q.answer]
      const shuffledOpts = melanger(opts)
      const newAnswer = shuffledOpts.indexOf(correcte)
      return {
        id: q.id,   // identifiant questions_banque : renvoyé par le client à api/quiz-resultat.js (questions_ratees_detail)
        q: q.question,
        chapitre: q.chapitre || '',
        opts: shuffledOpts,
        answer: newAnswer,
        explication: q.explication,
        tableau: q.tableau ? (typeof q.tableau === 'string' ? JSON.parse(q.tableau) : q.tableau) : null,
        figure: q.figure ? (typeof q.figure === 'string' ? JSON.parse(q.figure) : q.figure) : null
      }
    })

    return { questions, diag }
  } catch(e) {
    console.log('Erreur Supabase:', e.message)
    return { questions: [], diag: { actif: false, raison: 'non_filtre', echec: 'inconnu' } }
  }
}
