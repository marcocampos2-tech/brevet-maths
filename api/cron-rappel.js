// /api/cron-rappel.js
//
// ═══════════════════════════════════════════════════════════
// Réécrit le 24/07/2026 — Academika 2.0
//   - SUPPRIMÉ : branche "période normale" (rappel inactivité 3 jours)
//     → remplacée par le bilan périodique (ci-dessous), moins intrusif
//   - CORRIGÉ : marcocampos2@gmail.com → contact@academika.fr
//   - AJOUTÉ : branche bilan périodique automatique (~3 semaines)
//   - CONSERVÉ tel quel : branches "été" et "fin d'année"
//
// Modifié le 27/07/2026 — Rattrapage récap journalier
//   - AJOUTÉ : bloc de rattrapage en tête de handler(), avant toutes les
//     branches saisonnières. Tourne tous les jours de l'année (y compris
//     août), à chaque exécution du cron (désormais 0 21 * * * UTC).
//   - Détecte les élèves ayant eu au moins une session aujourd'hui dont
//     le récap journalier n'a pas encore été envoyé (alerte_envoyee=false),
//     et déclenche l'envoi via la même logique serveur que le flux normal
//     (api/email.js, type: 'recap-journalier-user'), pour garantir une
//     seule et même source de vérité (pas de recalcul dupliqué ici).
//
// Modifié le 28/07/2026 — Relecture emails
//   - RETIRÉ : mention "Academika Seconde, nouveauté à la rentrée" dans
//     les branches "été" et "fin d'année" — promesse non tenable pour
//     cette année (produit pas encore lancé). À réintroduire l'été 2027
//     sous forme d'invitation réelle, une fois Academika Seconde lancé.
//
// Modifié le 16/08/2026 — Cron seul déclencheur du récap journalier
//   - Le déclenchement côté client (quiz.html, logout/terminer) a été
//     retiré : ce bloc de rattrapage n'est plus un filet, c'est le seul
//     mécanisme d'envoi.
//   - CORRIGÉ : le rattrapage ne filtrait que sur "aujourd'hui" (jour Paris
//     au moment où LE CRON tourne). Le cron ne passe qu'une fois/jour
//     (21h UTC) : une session faite après son passage restait non couverte,
//     et le lendemain "aujourd'hui" avait changé — cette session ne
//     matchait plus jamais le filtre et n'était jamais rattrapée
//     (perdue silencieusement, alerte_envoyee restait false pour toujours).
//   - Le rattrapage groupe maintenant les sessions non couvertes par
//     (user_id, date Paris DE LA SESSION elle-même, pas la date du jour
//     du cron), et appelle recap-journalier-user une fois par couple avec
//     ce jour explicite (nouveau paramètre `date` sur l'endpoint). Toute
//     session dans la fenêtre de 48h est donc rattrapée sous son propre
//     jour, quel que soit le nombre de passages du cron écoulés depuis.
//
// Modifié le 07/10/2026 — Rattrapage observable et appelé via le domaine prod
//   - Constat : le cron du 07/10 (21:32, 200 OK) a fait 4 POST vers
//     /api/email sans qu'aucun email parte ni qu'aucune session soit marquée.
//     Le cron appelait https://${req.headers.host}/api/email (URL propre au
//     déploiement, *.vercel.app), sans en-tête de contournement de la
//     Deployment Protection. Hypothèse, non prouvée : l'appel était bloqué
//     avant d'atteindre api/email.js. Le statut HTTP n'était jamais lu et les
//     skip / erreurs à corps JSON n'étaient pas journalisés.
//   - L'appel passe désormais par BASE_URL_PROD (https://www.academika.fr).
//   - Une ligne de log par POST (statut, type de réponse, skip / erreur /
//     « envoyé »), plus une synthèse de fin de rattrapage. Aucune adresse
//     email dans les logs. Logique de comptage, fenêtre de 48h et
//     regroupement (user_id, date Paris) inchangés.
//
// Modifié le 11/10/2026 — Passage à 21h UTC, date toujours valide
//   - Cron déplacé de 19h à 21h UTC (23h été / 22h hiver, heure de Paris) ;
//     l'expression de la check Healthchecks doit rester identique.
//   - La date postée à /api/email (désormais validée là-bas : 400 sinon) vient
//     de lib/recap-journalier.js (dateParis), qui lit created_at comme UTC.
//
// Modifié le 20/10/2026 — Lot 3 gating : bilan périodique aligné sur les niveaux
//   - Le bilan lit la vue niveaux_sous_theme (même classement que la page
//     parent, js/niveaux.js) et n'affiche plus ni moyenne, ni verdict en %.
//     Rendu, version complète / tronquée et nouveaux niveaux : lib/bilan-email.js
//     (partagé avec le bouton prof, api/email.js type 'bilan').
//   - Garde d'environnement (lib/garde-envoi.js) : hors production, le cron ne
//     traite JAMAIS tous les profils (ni rattrapage, ni saison, ni bilan) ; il
//     exige ?test_user_id=<UUID>, envoie au seul EMAIL_TEST_DESTINATAIRE et
//     n'écrit rien. Une preview partage la base et la clé Resend de la
//     production : sans cela, un appel manuel du cron y enverrait de vrais
//     emails (le rattrapage appelle même la production avec CRON_SECRET).
// ═══════════════════════════════════════════════════════════

import { dateParis } from '../lib/recap-journalier.js'
import { UUID, lireProfil, lireHistorique, debutPeriode, calculerBilan, ecrireHistorique } from '../lib/bilan-email.js'
import { estProduction, resoudreDestinataire, envoyerA } from '../lib/garde-envoi.js'
import { formater as formaterPrenom } from '../js/prenom.js' // affichage seulement : jamais écrit en base

const CADENCE_JOURS = 21

// Domaine de production (canonique : academika.fr redirige vers www, cf.
// docs/TODO.md n°48 — une redirection ferait perdre l'en-tête Authorization).
// Les appels internes vers /api/email passent par lui et non par l'URL propre
// au déploiement (req.headers.host, en *.vercel.app), soumise à la Deployment
// Protection Vercel qui peut les bloquer avant d'atteindre api/email.js.
const BASE_URL_PROD = 'https://www.academika.fr'

// Texte renvoyé par /api/email avant d'être journalisé : jamais d'adresse
// email dans les logs (un message d'erreur Resend peut en citer une), et
// longueur bornée.
function pourLog(texte) {
  return String(texte ?? '')
    .replace(/[^\s"'<>(),;:]+@[^\s"'<>(),;:]+/g, '[email]')
    .slice(0, 200)
}

// Surveillance Healthchecks.io (heartbeat) — cf. CLAUDE.md. L'URL vient de
// HEALTHCHECK_URL_CRON_RAPPEL (Production uniquement) ; elle contient un
// identifiant secret : jamais en dur, jamais dans un log (on ne journalise ni
// l'URL ni le message d'erreur de fetch, qui peut la citer). Le suffixe vaut
// '/start', '' (succès) ou '/fail'. N'échoue jamais et ne lève jamais : un
// ping raté ne doit ni changer le code de retour ni interrompre le cron.
async function pingHealthcheck(suffixe, corps) {
  const url = process.env.HEALTHCHECK_URL_CRON_RAPPEL
  if (!url) {
    console.log('[cron-rappel][healthcheck] variable absente, ping ignoré')
    return
  }
  const controleur = new AbortController()
  const minuteur = setTimeout(() => controleur.abort(), 5000)
  try {
    const opts = { method: 'POST', signal: controleur.signal }
    if (corps) opts.body = String(corps).slice(0, 500)
    const r = await fetch(`${url}${suffixe}`, opts)
    if (!r.ok) console.log(`[cron-rappel][healthcheck] ping${suffixe || ''} statut=${r.status}`)
  } catch (e) {
    console.log(`[cron-rappel][healthcheck] ping${suffixe || ''} échec (${e?.name || 'erreur'})`)
  } finally {
    clearTimeout(minuteur)
  }
}

// Mode test, SEUL chemin possible hors production (cf. lib/garde-envoi.js).
// Un élève (?test_user_id=<UUID>), un destinataire (EMAIL_TEST_DESTINATAIRE),
// aucune boucle sur les profils, aucune écriture (historique_bilans,
// alerte_envoyee), pas de ping Healthchecks, cadence et pause ignorées.
// ?simuler_bascule=1 : bilan « après le 01/12 » (honoré par apresBascule()
// seulement si VERCEL_ENV === 'preview'). La réponse ne contient aucune adresse.
async function bilanDeTest(req, res, supaUrl, supaKey) {
  const q = req.query || {}
  const userId = typeof q.test_user_id === 'string' ? q.test_user_id.trim() : ''
  if (!UUID.test(userId)) {
    return res.status(400).json({ error: "Hors production, le cron ne traite qu'un élève : ajouter ?test_user_id=<UUID>." })
  }
  const dest = resoudreDestinataire(null)
  if (!dest.to) {
    return res.status(400).json({ error: 'EMAIL_TEST_DESTINATAIRE absent ou invalide (scope Preview) : aucun envoi.' })
  }
  if (!supaKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY absente' })
  const ctx = { supaUrl, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supaKey}`, 'apikey': supaKey } }
  try {
    const profil = await lireProfil(ctx, userId)
    if (!profil) return res.status(404).json({ error: 'Profil introuvable' })
    const historique = await lireHistorique(ctx, userId)
    const dateDebut = await debutPeriode(ctx, userId, historique.derniers[0] || null)
    if (!dateDebut) return res.status(404).json({ error: "Aucune session pour cet élève : pas de bilan" })
    const maintenant = new Date()
    const bilan = await calculerBilan(ctx, {
      userId, profil, historique, dateDebut, maintenant,
      simulerBascule: q.simuler_bascule === '1', test: true, emailPourLien: dest.to
    })
    const envoi = await envoyerA(dest, bilan.sujet, bilan.html)
    console.log(`[cron-rappel][bilan][test] version=${bilan.version} motif=${bilan.motif} statut=${envoi.status}`)
    return res.status(envoi.ok ? 200 : 502).json({
      test: true, envoye: envoi.ok, version: bilan.version, motif: bilan.motif, premier: bilan.premier,
      sessions: bilan.activite.terminees, nouveaux: Array.isArray(bilan.nouveaux) ? bilan.nouveaux.length : null
    })
  } catch (e) {
    console.log(`[cron-rappel][bilan][test] échec : ${pourLog(e.message)}`)
    return res.status(500).json({ error: pourLog(e.message) })
  }
}

export default async function handler(req, res) {

  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const SUPA_URL = process.env.SUPABASE_URL || 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

  // Garde d'environnement : tout ce qui n'est pas la production (preview,
  // development, variable absente) ne peut passer que par le mode test.
  if (!estProduction()) return bilanDeTest(req, res, SUPA_URL, SUPA_KEY)

  await pingHealthcheck('/start')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY
  }

  // ═══════════════════════════════════════════════════════════
  // RATTRAPAGE RÉCAP JOURNALIER — permanent, tourne avant toute branche
  // saisonnière. Non bloquant : une erreur ici n'empêche pas le reste
  // du cron (bilan périodique, fin d'année, été) de s'exécuter.
  // ═══════════════════════════════════════════════════════════
  let rattrapageResume = { traites: 0, ignores: 0, erreurs: 0 }
  let nbCouples = 0 // pour la synthèse du ping Healthchecks uniquement
  let lectureSessionsEchec = false // idem : une lecture en échec ne doit jamais donner un ping de succès
  try {
    const maintenantRattrapage = new Date()

    const depuisRes = await fetch(
      `${SUPA_URL}/rest/v1/resultats?select=id,user_id,created_at,alerte_envoyee` +
      `&created_at=gte.${new Date(maintenantRattrapage.getTime() - 48 * 3600 * 1000).toISOString()}` +
      `&alerte_envoyee=eq.false`,
      { headers }
    )
    const sessionsCandidates = await depuisRes.json()
    const lectureOk = depuisRes.ok && Array.isArray(sessionsCandidates)
    if (!lectureOk) {
      lectureSessionsEchec = true
      rattrapageResume.erreurs++
      console.log(`[cron-rappel][rattrapage] lecture des sessions en échec statut=${depuisRes.status}`)
    }

    // Regroupement par (user_id, date Paris DE LA SESSION) — voir
    // commentaire en tête de fichier (16/08/2026).
    const paires = new Map() // clé "user_id|date" → { user_id, date }
    for (const s of (lectureOk ? sessionsCandidates : [])) {
      // null si created_at est illisible : jamais d'appel avec une date que
      // /api/email refuserait (400). La ligne reste non couverte, sans effet.
      const dateSessionParis = dateParis(s.created_at)
      if (!dateSessionParis) {
        console.log(`[cron-rappel][rattrapage] session ignorée : created_at illisible (resultats.id=${s.id})`)
        continue
      }
      const cle = `${s.user_id}|${dateSessionParis}`
      if (!paires.has(cle)) paires.set(cle, { user_id: s.user_id, date: dateSessionParis })
    }

    nbCouples = paires.size

    for (const { user_id, date } of paires.values()) {
      // Une ligne de log par POST : user_id tronqué, date, statut HTTP, type
      // de réponse, puis motif du skip / erreur / « envoyé ». Jamais d'email.
      const etiquette = `user=${String(user_id ?? '').slice(0, 8)} date=${date}`
      let statutHttp = null
      let typeReponse = 'aucune'
      try {
        const resultRes = await fetch(`${BASE_URL_PROD}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ type: 'recap-journalier-user', user_id, date })
        })
        statutHttp = resultRes.status
        typeReponse = 'non-JSON'
        const resultData = await resultRes.json()
        typeReponse = 'JSON'
        if (resultData.skip) {
          console.log(`[cron-rappel][rattrapage] ${etiquette} statut=${statutHttp} type=${typeReponse} skip="${pourLog(resultData.skip)}"`)
          rattrapageResume.ignores++
        } else if (resultData.success) {
          console.log(`[cron-rappel][rattrapage] ${etiquette} statut=${statutHttp} type=${typeReponse} envoyé`)
          rattrapageResume.traites++
        } else {
          console.log(`[cron-rappel][rattrapage] ${etiquette} statut=${statutHttp} type=${typeReponse} erreur="${pourLog(resultData.error ?? 'réponse inattendue')}"`)
          rattrapageResume.erreurs++
        }
      } catch (e) {
        // Réseau coupé / timeout (aucun statut) ou corps non JSON (page HTML
        // d'une protection, 502...) : pour le second cas on n'imprime pas le
        // message du parseur, qui cite le début du corps reçu.
        const detail = typeReponse === 'non-JSON' ? 'corps non JSON' : pourLog(e.message)
        console.log(`[cron-rappel][rattrapage] ${etiquette} statut=${statutHttp ?? 'aucun'} type=${typeReponse} erreur="${detail}"`)
        rattrapageResume.erreurs++
      }
    }

    console.log(
      `[cron-rappel][rattrapage] synthèse : couples=${paires.size} traites=${rattrapageResume.traites} ` +
      `ignores=${rattrapageResume.ignores} erreurs=${rattrapageResume.erreurs}`
    )
  } catch (e) {
    console.log('Erreur bloc rattrapage récap journalier:', e.message)
    if (!lectureSessionsEchec) {
      lectureSessionsEchec = true
      rattrapageResume.erreurs++
    }
  }

  // Échecs d'envoi de la branche saisonnière (fin d'année, été, bilan).
  let erreursSaison = 0

  // Ping de fin : succès seulement si le rattrapage (lecture des sessions
  // comprise) et la branche saisonnière n'ont eu aucune erreur, sinon /fail.
  // Corps = compteurs uniquement (aucun user_id, prénom ni email).
  const pingFin = (extra) => pingHealthcheck(
    (rattrapageResume.erreurs === 0 && erreursSaison === 0) ? '' : '/fail',
    `couples=${nbCouples} traites=${rattrapageResume.traites} ` +
    `ignores=${rattrapageResume.ignores} erreurs=${rattrapageResume.erreurs}` +
    (lectureSessionsEchec ? ' lecture_sessions=echec' : '') +
    (extra ? ` ${extra}` : '') +
    ` erreurs_saison=${erreursSaison}`
  )

  try {
    const maintenant = new Date()
    const mois = maintenant.getMonth() + 1 // 1-12
    const jour = maintenant.getDate()

    // Récupérer tous les profils
    const profilsRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?select=user_id,prenom_affiche,email_parent,email_actif,plan_actif,cours_particuliers_actif,acces_offert_jusqu`,
      { headers }
    )
    const profils = await profilsRes.json()
    if (!profils || profils.length === 0) {
      await pingFin('saison=aucun_profil')
      return res.status(200).json({ message: 'Aucun profil', rattrapage: rattrapageResume })
    }

    // ── PÉRIODE FIN D'ANNÉE (27-30 juin) ──────────────────
    if (mois === 6 && jour >= 27) {
      let envoyes = 0
      for (const profil of profils) {
        const { user_id, email_parent, email_actif } = profil
        const prenom_affiche = formaterPrenom(profil.prenom_affiche)
        if (!email_parent || email_actif === false) continue

        const rappelRes = await fetch(
          `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&type=eq.fin_annee&select=id&limit=1`,
          { headers }
        )
        const rappels = await rappelRes.json()
        if (rappels && rappels.length > 0) continue

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0;font-size:16px">🎓 Le brevet est passé — bravo à <strong>${prenom_affiche}</strong> pour ses efforts cette année !</p>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              Merci d'avoir fait confiance à Academika cette année.<br><br>
              Le compte de <strong>${prenom_affiche}</strong> reste actif — il peut continuer à réviser pendant l'été s'il le souhaite.
            </p>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:contact@academika.fr" style="color:#3730a3">contact@academika.fr</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'noreply@academika.fr',
            to: email_parent,
            subject: `🎓 Bonne fin d'année — Merci pour cette année sur ACADEMIKA`,
            html
          })
        })

        if (emailRes.ok) {
          await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_id, email_parent, type: 'fin_annee', jours_inactif: 0 })
          })
          envoyes++
        } else {
          erreursSaison++
        }
      }
      await pingFin(`saison=fin_annee emails=${envoyes}`)
      return res.status(200).json({ success: true, type: 'fin_annee', envoyes, rattrapage: rattrapageResume })
    }

    // ── PÉRIODE ÉTÉ (juillet) — aussi la fenêtre de pause du bilan périodique ──
    if (mois === 7) {
      let envoyes = 0
      for (const profil of profils) {
        const { user_id, email_parent, email_actif } = profil
        const prenom_affiche = formaterPrenom(profil.prenom_affiche)
        if (!email_parent || email_actif === false) continue

        const rappelRes = await fetch(
          `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&type=eq.ete&select=id&limit=1`,
          { headers }
        )
        const rappels = await rappelRes.json()
        if (rappels && rappels.length > 0) continue

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0;font-size:16px">🌞 Bonnes vacances à toute la famille !</p>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              Academika reste ouvert cet été — <strong>${prenom_affiche}</strong> peut continuer à réviser quand il le souhaite, à son rythme.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
                Continuer à réviser →
              </a>
            </div>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:contact@academika.fr" style="color:#3730a3">contact@academika.fr</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'noreply@academika.fr',
            to: email_parent,
            subject: `🌞 Bonnes vacances — Academika reste ouvert cet été !`,
            html
          })
        })

        if (emailRes.ok) {
          await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_id, email_parent, type: 'ete', jours_inactif: 0 })
          })
          envoyes++
        } else {
          erreursSaison++
        }
      }
      await pingFin(`saison=ete emails=${envoyes}`)
      return res.status(200).json({ success: true, type: 'ete', envoyes, rattrapage: rattrapageResume })
    }

    // ── PÉRIODE AOÛT — silence total pour les autres emails
    // (le bloc de rattrapage récap journalier ci-dessus reste actif) ──
    if (mois === 8) {
      await pingFin('saison=aout')
      return res.status(200).json({ message: 'Août — pas de rappels ni de bilans', rattrapage: rattrapageResume })
    }

    // ── BILAN PÉRIODIQUE AUTOMATIQUE (septembre → 26 juin) ──────────────
    // Cadence de 21 jours et pause après 2 bilans vides inchangées. Le contenu
    // (niveaux de la vue, version complète ou tronquée, nouveaux niveaux) vient
    // de lib/bilan-email.js, comme pour le bouton prof. Une lecture qui échoue
    // saute l'élève CE SOIR (aucune ligne n'est écrite, le cron repasse demain)
    // et compte une erreur : on ne devine jamais la version.
    let bilansEnvoyes = 0, bilansIgnores = 0, bilansPauses = 0, bilansTronques = 0
    const ctx = { supaUrl: SUPA_URL, headers }

    for (const profil of profils) {
      const { user_id, email_parent, email_actif } = profil
      if (!email_parent || email_actif === false) { bilansIgnores++; continue }
      const etiquette = `user=${String(user_id ?? '').slice(0, 8)}`

      try {
        const historique = await lireHistorique(ctx, user_id)
        const dernierBilan = historique.derniers[0] || null
        const avantDernierBilan = historique.derniers[1] || null

        const dateDebut = await debutPeriode(ctx, user_id, dernierBilan)
        if (!dateDebut) { bilansIgnores++; continue }

        const joursDepuisDernier = Math.floor((maintenant - dateDebut) / (1000 * 60 * 60 * 24))
        if (joursDepuisDernier < CADENCE_JOURS) { bilansIgnores++; continue }

        if (dernierBilan && dernierBilan.total_sessions === 0 &&
            avantDernierBilan && avantDernierBilan.total_sessions === 0) {
          bilansPauses++
          continue
        }

        const dest = resoudreDestinataire(email_parent)
        if (!dest.to) { bilansIgnores++; continue }

        const bilan = await calculerBilan(ctx, {
          userId: user_id, profil, historique, dateDebut, maintenant,
          test: dest.test, emailPourLien: dest.to
        })
        const envoi = await envoyerA(dest, bilan.sujet, bilan.html)

        if (envoi.ok) {
          if (!(await ecrireHistorique(ctx, user_id, bilan, maintenant, dateDebut))) erreursSaison++
          if (bilan.version === 'tronque') bilansTronques++
          console.log(`[cron-rappel][bilan] ${etiquette} version=${bilan.version} motif=${bilan.motif} envoyé`)
          bilansEnvoyes++
        } else {
          console.log(`[cron-rappel][bilan] ${etiquette} envoi Resend en échec statut=${envoi.status}`)
          bilansIgnores++
          erreursSaison++
        }
      } catch (e) {
        console.log(`[cron-rappel][bilan] ${etiquette} ignoré : ${pourLog(e.message)}`)
        bilansIgnores++
        erreursSaison++
      }
    }

    await pingFin(`saison=bilan emails=${bilansEnvoyes}`)
    return res.status(200).json({
      success: true,
      bilans_envoyes: bilansEnvoyes,
      bilans_ignores: bilansIgnores,
      bilans_en_pause: bilansPauses,
      bilans_tronques: bilansTronques,
      total_profils: profils.length,
      rattrapage: rattrapageResume
    })

  } catch(e) {
    console.error('Erreur cron:', e.message)
    await pingHealthcheck('/fail', `exception=${e?.name || 'Error'}`)
    return res.status(500).json({ error: e.message, rattrapage: rattrapageResume })
  }
}
