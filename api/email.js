// /api/email.js

const { peutRecevoirEmailDetaille, enPeriodeGratuite } = require('../lib/gating')
const { verifierToken, verifierUtilisateur, verifierProf } = require('../lib/auth-token')
const { dateParis, dateRecapValide, libelleJour, lignesActivite, resumeJour, formatDuree } = require('../lib/recap-journalier')
const { UUID, lireProfil, lireHistorique, calculerBilan } = require('../lib/bilan-email')
const { resoudreDestinataire, envoyerA } = require('../lib/garde-envoi')
const { formater: formaterPrenom } = require('../js/prenom') // affichage seulement : jamais écrit en base

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Échappe les métacaractères PostgREST/SQL d'un pattern ILIKE (% et _, tous
// deux valides dans un email — ex. prenom_nom@gmail.com) avant de l'utiliser
// comme filtre exact insensible à la casse. Ne couvre que la casse, pas un
// éventuel espace parasite stocké côté email_parent — cf. commentaire au
// point d'appel dans le handler reset-password.
function escapeIlike(s) {
  if (contientJoker(s)) return null // défense en profondeur : les appelants refusent '*' en amont
  return String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

// PostgREST traite '*' comme un joker dans ilike : « * » ou « a*@x.fr » ciblerait
// plusieurs profils. Tout motif ilike construit à partir d'une saisie doit donc
// refuser les valeurs contenant '*' AVANT la requête (contientJoker), avec la
// réponse d'entrée invalide du type. escapeIlike() renvoie null dans ce cas, en
// dernier recours.
function contientJoker(s) {
  return String(s).includes('*')
}

// Un parent est désabonné dès qu'UN profil portant son email_parent a
// email_actif = false (api/desabonner.js désactive tout le foyer d'un coup).
// Sert au type 'bilan', dont le destinataire vient du corps de la requête et
// non d'une ligne profils. Renvoie true / false, ou null si la vérification
// échoue techniquement (l'appelant refuse alors d'envoyer : le consentement
// prime). Une adresse contenant '*' est refusée avant la requête (cf.
// contientJoker) : même résultat qu'une vérification impossible.
async function parentDesabonne(email, supaUrl, supaKey) {
  const adresse = String(email || '').trim().toLowerCase()
  if (!adresse || contientJoker(adresse)) return null
  try {
    const r = await fetch(
      `${supaUrl}/rest/v1/profils?email_parent=ilike.${encodeURIComponent(escapeIlike(adresse))}&email_actif=eq.false&select=user_id&limit=1`,
      { headers: { 'Authorization': `Bearer ${supaKey}`, 'apikey': supaKey } }
    )
    if (!r.ok) {
      console.log('Erreur vérification désabonnement: statut', r.status)
      return null
    }
    const lignes = await r.json()
    return Array.isArray(lignes) && lignes.length > 0
  } catch (e) {
    console.log('Erreur vérification désabonnement:', e.message)
    return null
  }
}

// ═══════════════════════════════════════════
// VALEURS VENANT DU CLIENT — brevet-blanc et inscription
// Ces valeurs ne sont jamais fiables : elles sont bornées ou nettoyées avant
// d'atteindre le sujet ou le HTML d'un email. Une valeur hors bornes est
// ramenée dans les bornes (pas rejetée) ; seul un type absurde donne un 400.
// ═══════════════════════════════════════════
const SCORE_MAX_EXAMEN = 20      // examen en ligne noté sur 20 (cf. api/examen.js : total: 20)
const TEMPS_MAX_EXAMEN_S = 3600  // 60 min : l'examen dure 40 min, marge pour l'écart d'horloge
const THEMES_MAX = 20            // nombre de thèmes retenus dans l'email
const THEME_NOM_MAX = 80         // longueur max d'un nom de thème
const NOM_ELEVE_MAX = 60         // longueur max de prenom / nom

// Entier borné dans [min, max], ou null si la valeur n'est pas numérique
// (nombre fini, ou chaîne purement numérique).
function entierBorne(v, min, max) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

// Chaîne sans caractères de contrôle (retours à la ligne compris), espaces
// réduits, longueur limitée. Sert au sujet comme au HTML (où esc() reste
// appliqué ensuite).
function nettoyerTexte(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

// scoresThemes envoyé par examen.html : { "<thème>": { ok, total }, … }
// (objet issu de lib/examen-score.js). Chaque thème est borné ; ok <= total ;
// un thème dont la forme est inutilisable est ignoré plutôt que de rejeter
// tout l'email.
function themesBornes(scoresThemes) {
  const themes = []
  for (const [nom, s] of Object.entries(scoresThemes)) {
    if (themes.length >= THEMES_MAX) break
    if (!s || typeof s !== 'object') continue
    const total = entierBorne(s.total, 0, SCORE_MAX_EXAMEN)
    const ok = entierBorne(s.ok, 0, SCORE_MAX_EXAMEN)
    if (total === null || ok === null || total === 0) continue
    themes.push({ nom: nettoyerTexte(nom, THEME_NOM_MAX), ok: Math.min(ok, total), total })
  }
  return themes
}

function jetonBearer(enteteAuthorization) {
  return enteteAuthorization.startsWith('Bearer ') ? enteteAuthorization.slice(7) : null
}

// ═══════════════════════════════════════════
// RATE-LIMIT PAR DESTINATAIRE — 10 emails / heure / adresse
// Table email_rate_limit (destinataire text PK, compteur int, fenetre_debut timestamptz)
// ═══════════════════════════════════════════
async function verifierRateLimit(destinataire) {
  if (!destinataire) return true
  const dest = String(destinataire).trim().toLowerCase()
  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/email_rate_limit?destinataire=eq.${encodeURIComponent(dest)}&select=compteur,fenetre_debut`,
      { headers }
    )
    const rows = await r.json()
    const maintenant = new Date()

    if (!Array.isArray(rows) || rows.length === 0) {
      await fetch(`${SUPA_URL}/rest/v1/email_rate_limit`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify({ destinataire: dest, compteur: 1, fenetre_debut: maintenant.toISOString() })
      })
      return true
    }

    const { compteur, fenetre_debut } = rows[0]
    const diffHeures = (maintenant - new Date(fenetre_debut)) / 3600000

    if (diffHeures >= 1) {
      await fetch(`${SUPA_URL}/rest/v1/email_rate_limit?destinataire=eq.${encodeURIComponent(dest)}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ compteur: 1, fenetre_debut: maintenant.toISOString() })
      })
      return true
    }

    if (compteur >= 10) return false

    await fetch(`${SUPA_URL}/rest/v1/email_rate_limit?destinataire=eq.${encodeURIComponent(dest)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ compteur: compteur + 1 })
    })
    return true

  } catch (e) {
    console.log('Erreur verifierRateLimit:', e.message)
    return true
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  // ═══════════════════════════════════════════
  // CONTRÔLE D'IDENTITÉ — avant toute lecture, tout envoi et toute limite
  // de fréquence (verifierRateLimit écrit dans email_rate_limit : un appelant
  // non authentifié ne doit pas pouvoir épuiser le quota d'une adresse).
  //  - types déclenchés par les boutons de prof.html : jeton Supabase valide
  //    dont le rôle serveur est 'prof' (401 sinon invalide, 403 si autre rôle) ;
  //  - brevet-blanc et inscription : jeton Supabase d'un utilisateur, vérifié
  //    dans le bloc de chaque type (le destinataire en est déduit, jamais lu
  //    dans le corps) ;
  //  - resiliation-confirmee (appel interne depuis stripe-webhook.js) :
  //    CRON_SECRET, comparaison exacte. !!process.env.CRON_SECRET évite qu'un
  //    'Bearer undefined' ne passe si la variable n'est pas posée.
  // Les autres types ne sont pas concernés ici (reset-password, contact-cours :
  // publics ; recap-journalier-user : contrôle propre).
  // ═══════════════════════════════════════════
  const TYPES_PROF = ['adresse-brevet', 'stage', 'bilan', 'resultats-brevet']
  const typeRequete = req.body?.type
  const authHeaderEntrant = req.headers['authorization'] || ''
  if (TYPES_PROF.includes(typeRequete)) {
    const jeton = authHeaderEntrant.startsWith('Bearer ') ? authHeaderEntrant.slice(7) : null
    const statut = await verifierProf(jeton, 'https://vkkgadwqumqqwpaayjac.supabase.co', process.env.SUPABASE_SERVICE_KEY)
    if (statut === 'non-authentifie') return res.status(401).json({ error: 'Non autorisé' })
    if (statut !== 'ok') return res.status(403).json({ error: 'Accès réservé' })
  } else if (typeRequete === 'resiliation-confirmee') {
    const estInterne = !!process.env.CRON_SECRET && authHeaderEntrant === `Bearer ${process.env.CRON_SECRET}`
    if (!estInterne) return res.status(401).json({ error: 'Non autorisé' })
  }

  // ═══════════════════════════════════════════
  // RESET MOT DE PASSE — isolé, retour immédiat
  // ═══════════════════════════════════════════
  if (req.body?.type === 'reset-password') {
    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
    const RESEND_KEY = process.env.RESEND_API_KEY
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

    // connexion.html détecte le hash #type=recovery et affiche l'écran
    // "Créer un nouveau mot de passe" (index.html n'a aucune logique de ce
    // genre — un ancien redirectTo vers index.html a laissé ce parcours mort
    // jusqu'au 14/09/2026). Dépendance externe invisible : cette URL doit
    // figurer dans Authentication > URL Configuration > Redirect URLs du
    // projet Supabase, sinon Supabase retombe silencieusement sur l'URL de
    // site par défaut, sans erreur ni log d'aucune sorte — vérifié dans le
    // dashboard avant chaque changement de cette valeur, pas seulement à la
    // première mise en place.
    // Constante unique (plutôt qu'en dur dans le template string plus bas) :
    // un seul endroit à changer le jour où cette URL bouge.
    const URL_REDIRECT_RESET = 'https://www.academika.fr/connexion.html'

    const { email_parent } = req.body
    if (!email_parent) return res.status(400).json({ error: 'Email requis' })

    const reponseUniforme = { success: true, message: 'Si un compte existe avec cet email, un lien a été envoyé.' }

    try {
      // Normalisation côté saisie (casse + espaces) + filtre ILIKE (casse
      // insensible côté colonne) : couvre le cas réel — un parent qui tape
      // son email avec une casse différente de celle enregistrée en base.
      // Ne couvre pas un espace parasite qui serait stocké dans
      // profils.email_parent lui-même (ILIKE ne trim pas la colonne) —
      // contrairement à lower(trim(...)) des deux côtés utilisé dans les
      // fonctions RLS de db/policies.sql, qui nécessiterait une fonction
      // SQL dédiée pour être reproduit à l'identique ici. Résidu accepté :
      // email_parent est renseigné par le parent authentifié (creerEnfant),
      // jamais saisi librement ailleurs, donc un espace parasite stocké est
      // hautement improbable en pratique.
      const emailNormalise = String(email_parent).trim().toLowerCase()

      // '*' = joker ilike côté PostgREST (cf. contientJoker) : « * » ciblerait
      // tous les profils. Réponse uniforme, sans requête ni envoi.
      if (contientJoker(emailNormalise)) return res.status(200).json(reponseUniforme)

      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?email_parent=ilike.${encodeURIComponent(escapeIlike(emailNormalise))}&select=user_id,faux_email,prenom_affiche,nom_affiche,derniere_demande_reset`,
        { headers }
      )
      const profils = await profilRes.json()

      if (!Array.isArray(profils) || profils.length === 0) {
        return res.status(200).json(reponseUniforme)
      }

      // Rate-limit par enfant (3 min) : un enfant récemment sollicité est
      // exclu de cette demande, mais n'empêche plus ses frères et sœurs de
      // recevoir leur propre lien.
      const maintenant = new Date()
      const eligibles = profils.filter(p => {
        if (!p.derniere_demande_reset) return true
        return (maintenant - new Date(p.derniere_demande_reset)) / 60000 >= 3
      })
      if (eligibles.length === 0) {
        return res.status(200).json(reponseUniforme)
      }

      // Tri alphabétique sur prenom_affiche — ordre déterministe pour
      // l'affichage dans l'email ; pas plus parlant pour un parent de trier
      // par date de création du compte.
      eligibles.sort((a, b) => (a.prenom_affiche || '').localeCompare(b.prenom_affiche || '', 'fr', { sensitivity: 'base' }))

      // Un lien par enfant éligible. Un échec de génération pour l'un
      // n'empêche pas les autres de recevoir le leur (fail-open, même
      // logique que verifierRateLimit ci-dessus) : l'enfant en échec est
      // simplement absent de l'email, journalisé, pas de blocage global.
      const enfants = []
      for (const p of eligibles) {
        try {
          // redirect_to en paramètre de query string sur l'URL, pas dans le
          // body JSON : c'est la forme réellement lue par l'API admin
          // GoTrue (vérifié dans le source de gotrue-js — options.redirectTo
          // y est explicitement retiré du body et transmis à part, ajouté
          // ensuite à l'URL via `qs['redirect_to'] = ...`). Un
          // `options: { redirectTo }` dans le body — convention du SDK JS
          // côté appelant, pas celle de l'API REST elle-même — est une clé
          // que le serveur ne reconnaît pas : ignorée silencieusement, sans
          // erreur, avec repli sur la Site URL par défaut du projet. C'est
          // cette confusion précise qui a laissé ce parcours mort jusqu'au
          // 14/09/2026, y compris après le premier correctif (qui avait
          // corrigé la page de destination mais gardé la mauvaise forme).
          const linkRes = await fetch(`${SUPA_URL}/auth/v1/admin/generate_link?redirect_to=${encodeURIComponent(URL_REDIRECT_RESET)}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ type: 'recovery', email: p.faux_email })
          })
          const linkData = await linkRes.json()
          const lienReset = linkData?.action_link || linkData?.properties?.action_link
          if (!lienReset) {
            console.log('Erreur génération lien pour', p.user_id, ':', JSON.stringify(linkData))
            continue
          }
          enfants.push({ user_id: p.user_id, prenom_affiche: formaterPrenom(p.prenom_affiche), nom_affiche: p.nom_affiche, lien: lienReset })
        } catch (e) {
          console.log('Erreur génération lien pour', p.user_id, ':', e.message)
        }
      }

      if (enfants.length === 0) {
        return res.status(200).json(reponseUniforme)
      }

      const rateOk = await verifierRateLimit(email_parent)
      if (!rateOk) return res.status(429).json({ error: 'Trop de demandes pour cette adresse. Réessayez plus tard.' })

      const nomComplet = e => `${e.prenom_affiche} ${e.nom_affiche}`.trim()

      // Un seul enfant : phrase le nommant explicitement — il s'agit de son
      // compte, pas de celui du parent. Plusieurs enfants : une intro qui le
      // dit, puis un bouton par enfant, chacun nommé (prénom + nom, comme
      // dans le bloc "Les accès" de suivi-parent.html — même raison :
      // lever une ambiguïté en cas d'homonymie entre frères et sœurs).
      const blocAcces = enfants.length === 1
        ? `
              <p style="color:#444;line-height:1.6;margin-bottom:20px">Une demande de réinitialisation de mot de passe a été effectuée pour le compte de <strong>${esc(nomComplet(enfants[0]))}</strong> sur ACADEMIKA.</p>
              <div style="text-align:center;margin:28px 0">
                <a href="${enfants[0].lien}" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
                  Choisir un nouveau mot de passe pour ${esc(enfants[0].prenom_affiche)} →
                </a>
              </div>`
        : `
              <p style="color:#444;line-height:1.6;margin-bottom:20px">Une demande de réinitialisation de mot de passe a été effectuée sur ACADEMIKA. Plusieurs comptes enfants sont associés à cette adresse — choisissez celui concerné :</p>
              <div style="margin:20px 0">
                ${enfants.map(e => `
                <div style="text-align:center;margin-bottom:12px">
                  <a href="${e.lien}" style="display:block;background:#1a1a1a;color:white;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                    Choisir un nouveau mot de passe pour ${esc(nomComplet(e))} →
                  </a>
                </div>`).join('')}
              </div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'ACADEMIKA <noreply@academika.fr>',
          to: email_parent,
          subject: '🔑 Réinitialisation de mot de passe — ACADEMIKA',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
              <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
                <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
              </div>
              <p style="margin-bottom:16px">Bonjour,</p>${blocAcces}
              <p style="color:#444;line-height:1.6;margin-bottom:20px">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
              <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
                <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
              </div>
            </div>
          `
        })
      })

      // PATCH uniquement les enfants réellement inclus dans l'email envoyé —
      // ni les enfants filtrés par leur propre rate-limit (déjà exclus plus
      // haut), ni un enfant dont generate_link a échoué (pas de lien reçu,
      // ne doit pas être bloqué 3 min pour rien).
      await fetch(`${SUPA_URL}/rest/v1/profils?user_id=in.(${enfants.map(e => e.user_id).join(',')})`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ derniere_demande_reset: new Date().toISOString() })
      })

      return res.status(200).json(reponseUniforme)

    } catch (e) {
      console.log('Erreur reset-password:', e.message)
      return res.status(200).json(reponseUniforme)
    }
  }

  // ═══════════════════════════════════════════
  // ADRESSE BREVET — confirmation / refus / annulation
  // ═══════════════════════════════════════════
  if (req.body?.type === 'adresse-brevet') {
    const RESEND_KEY = process.env.RESEND_API_KEY
    const { emailParent, prenom: prenomSaisi, nom, date, heure, adresse, messageCompl, sousType } = req.body
    const prenom = formaterPrenom(prenomSaisi)
    if (!emailParent || !prenom) return res.status(400).json({ error: 'Champs manquants' })

    let sujetInterne, contenuInterne
    if (sousType === 'refus') {
      sujetInterne = `Inscription Examen Blanc Brevet — ${prenom}`
      contenuInterne = `
        <p style="margin-bottom:16px">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Nous avons bien reçu la demande d'inscription de <strong>${esc(prenom)} ${esc(nom)}</strong> pour la session du <strong>${esc(date)}</strong>.</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Malheureusement, cette session est complète. Nous ne pouvons pas confirmer cette inscription.</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Si l'autre date vous convient, n'hésitez pas à vous réinscrire sur <strong>academika.fr</strong>.</p>
      `
    } else if (sousType === 'annulation') {
      sujetInterne = `Annulation Examen Blanc Brevet — ${prenom}`
      contenuInterne = `
        <p style="margin-bottom:16px">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Nous vous informons que l'inscription de <strong>${esc(prenom)} ${esc(nom)}</strong> pour la session du <strong>${esc(date)}</strong> a été annulée.</p>
      `
    } else {
      if (!adresse) return res.status(400).json({ error: 'Adresse manquante' })
      sujetInterne = `✅ Inscription confirmée — Examen Blanc Brevet — ${prenom}`
      contenuInterne = `
        <p style="margin-bottom:16px">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">L'inscription de <strong>${esc(prenom)} ${esc(nom)}</strong> pour l'examen blanc est confirmée :</p>
        <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin-bottom:8px"><strong>📅 Date :</strong> ${esc(date)} · ${esc(heure) || '15h00'}</p>
          <p style="margin-bottom:8px"><strong>📍 Adresse :</strong> ${esc(adresse)}</p>
          ${messageCompl ? `<p><strong>ℹ️ Infos :</strong> ${esc(messageCompl)}</p>` : ''}
        </div>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Merci d'arriver 5 minutes avant. Prévoir stylo et calculatrice.</p>
      `
    }

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
        <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
          <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
        </div>
        ${contenuInterne}
        <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
          <p style="color:#444;font-size:13px;margin-bottom:8px;">
            Contact : <strong>06 26 53 90 13</strong> · <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
          </p>
          <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
        </div>
      </div>`

    const rateOk = await verifierRateLimit(emailParent)
    if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({ from: 'ACADEMIKA <noreply@academika.fr>', to: emailParent, subject: sujetInterne, html })
      })
      return res.status(200).json({ success: true })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // STAGE — confirmation / refus / annulation
  // ═══════════════════════════════════════════
  if (req.body?.type === 'stage') {
    const RESEND_KEY = process.env.RESEND_API_KEY
    const { emailParent, prenom: prenomSaisi, nom, libelle, sousType } = req.body
    const prenom = formaterPrenom(prenomSaisi)
    if (!emailParent || !prenom) return res.status(400).json({ error: 'Champs manquants' })

    let sujetInterne, contenuInterne
    if (sousType === 'refus') {
      sujetInterne = `Inscription stage — ${prenom}`
      contenuInterne = `
        <p style="margin-bottom:16px">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Nous avons bien reçu la demande d'inscription de <strong>${esc(prenom)} ${esc(nom)}</strong> pour le stage <strong>${esc(libelle)}</strong>.</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Malheureusement, ce stage est complet. Nous ne pouvons pas confirmer cette inscription.</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">N'hésitez pas à vous inscrire à une autre période sur <strong>academika.fr</strong>.</p>
      `
    } else if (sousType === 'annulation') {
      sujetInterne = `Annulation stage — ${prenom}`
      contenuInterne = `
        <p style="margin-bottom:16px">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Nous vous informons que l'inscription de <strong>${esc(prenom)} ${esc(nom)}</strong> pour le stage <strong>${esc(libelle)}</strong> a été annulée.</p>
      `
    } else {
      sujetInterne = `✅ Inscription confirmée — Stage — ${prenom}`
      contenuInterne = `
        <p style="margin-bottom:16px">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">L'inscription de <strong>${esc(prenom)} ${esc(nom)}</strong> pour le stage <strong>${esc(libelle)}</strong> est confirmée.</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Nous vous recontacterons prochainement pour les modalités pratiques (lien de connexion visio, etc.).</p>
      `
    }

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
        <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
          <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
        </div>
        ${contenuInterne}
        <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
          <p style="color:#444;font-size:13px;margin-bottom:8px;">
            Contact : <strong>06 26 53 90 13</strong> · <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
          </p>
          <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
        </div>
      </div>`

    const rateOk = await verifierRateLimit(emailParent)
    if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({ from: 'ACADEMIKA <noreply@academika.fr>', to: emailParent, subject: sujetInterne, html })
      })
      return res.status(200).json({ success: true })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // BILAN PARENTS (bouton "Envoyer bilan parents" et "Aperçu" de prof.html)
  //
  // Contrat (lot 3, 20/10/2026) : { type:'bilan', user_id, apercu?, version? }
  // avec le jeton du prof (contrôle d'identité en tête de handler). Le
  // navigateur n'envoie plus que l'identifiant de l'élève : destinataire,
  // niveaux et activité sont lus et calculés ICI (lib/bilan-email.js, le même
  // module que le cron de 21 jours). Aucun champ de l'ancien format
  // (emailParent, sousThemes, moyGlobale…) n'est lu.
  //   - période : les 21 derniers jours glissants ; envoi : TOUJOURS la version
  //     complète (échantillon détaillé pour un
  //     parent en offre Libre, cf. CLAUDE.md § bilan manuel) ; n'écrit jamais
  //     historique_bilans (la cadence du cron n'est pas touchée) ; respecte
  //     email_actif (raison:'desabonne', avant le quota) ; quota de 10 par
  //     heure et par destinataire inchangé ;
  //   - apercu:true : renvoie { sujet, html } sans rien envoyer, sans quota ni
  //     écriture ; version:'complet'|'tronque' n'est honorée qu'avec apercu ;
  //   - hors production, le destinataire est l'adresse de test (lib/garde-envoi.js).
  // ═══════════════════════════════════════════
  if (req.body?.type === 'bilan') {
    try {
      const { user_id, apercu, version } = req.body
      if (typeof user_id !== 'string' || !UUID.test(user_id)) {
        return res.status(400).json({ error: 'user_id invalide (le bilan ne prend plus que l\'identifiant de l\'élève : recharge la page)' })
      }
      if (apercu !== undefined && typeof apercu !== 'boolean') return res.status(400).json({ error: 'apercu invalide' })
      if (version !== undefined && version !== 'complet' && version !== 'tronque') return res.status(400).json({ error: 'version invalide' })

      const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
      const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
      const ctx = { supaUrl: SUPA_URL, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY } }

      const profil = await lireProfil(ctx, user_id)
      if (!profil) return res.status(404).json({ error: 'Élève introuvable' })

      let dest = null
      if (apercu !== true) {
        if (!profil.email_parent) return res.status(400).json({ error: "Pas d'email parent pour cet élève." })

        // Désabonnement respecté, avant tout calcul et avant le quota. Le prof
        // lit raison: 'desabonne' dans prof.html (envoyerBilan).
        const desabonne = await parentDesabonne(profil.email_parent, SUPA_URL, SUPA_KEY)
        if (desabonne === null) return res.status(500).json({ error: 'Vérification du désabonnement impossible' })
        if (desabonne) return res.status(200).json({ success: false, raison: 'desabonne' })

        dest = resoudreDestinataire(profil.email_parent)
        if (!dest.to) return res.status(403).json({ error: "Envoi désactivé hors production : EMAIL_TEST_DESTINATAIRE absent ou invalide." })
      }

      // Période : les 21 derniers jours glissants (et non « depuis le dernier
      // bilan » comme le cron). Le dernier bilan du cron ne sert qu'à comparer
      // les niveaux (ligne « Nouveaux niveaux validés »).
      const historique = await lireHistorique(ctx, user_id)
      const maintenant = new Date()
      const dateDebut = new Date(maintenant.getTime() - 21 * 24 * 60 * 60 * 1000)

      const bilan = await calculerBilan(ctx, {
        userId: user_id, profil, historique, dateDebut, maintenant, periodeFixe: true,
        versionForcee: apercu === true ? (version || 'complet') : 'complet',
        test: dest ? dest.test : false,
        // Aperçu : aucun lien de désabonnement exploitable (le HTML est seulement affiché au prof).
        emailPourLien: dest ? dest.to : ''
      })

      if (apercu === true) {
        return res.status(200).json({ success: true, apercu: true, version: bilan.version, sujet: bilan.sujet, html: bilan.html })
      }

      const rateOk = await verifierRateLimit(dest.to)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const envoi = await envoyerA(dest, bilan.sujet, bilan.html)
      if (!envoi.ok) {
        console.log('Erreur bilan: Resend statut', envoi.status)
        return res.status(500).json({ error: 'Erreur d\'envoi (statut ' + envoi.status + ')' })
      }
      return res.status(200).json({ success: true, test: dest.test })
    } catch(e) {
      console.log('Erreur bilan:', e.message)
      return res.status(500).json({ error: 'Bilan impossible à calculer pour le moment' })
    }
  }

  // ═══════════════════════════════════════════
  // BREVET BLANC — résultats examen (envoyé automatiquement depuis examen.html)
  // ═══════════════════════════════════════════
  if (req.body?.type === 'brevet-blanc') {
    try {
      const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
      const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

      // ── Identité : jeton obligatoire. user_id vient du jeton, jamais du
      // corps ; le destinataire est relu dans profils (emailParent, total et
      // pct éventuellement présents dans le corps sont ignorés).
      const userId = await verifierToken(jetonBearer(authHeaderEntrant), SUPA_URL, SUPA_KEY)
      if (!userId) return res.status(401).json({ error: 'Non autorisé' })

      // ── Valeurs du client : bornées, pas rejetées. 400 seulement si le type
      // est absurde.
      const { prenom: prenomBrut, nom: nomBrut, score: scoreBrut, scoresThemes, tempsSecondes: tempsBrut } = req.body
      const score = entierBorne(scoreBrut, 0, SCORE_MAX_EXAMEN)
      if (score === null) return res.status(400).json({ error: 'score invalide' })
      const pct = Math.round((score / SCORE_MAX_EXAMEN) * 100)
      if (scoresThemes != null && typeof scoresThemes !== 'object') return res.status(400).json({ error: 'scoresThemes invalide' })
      // tempsSecondes absent : la ligne de durée est simplement omise
      const tempsSecondes = tempsBrut == null ? null : entierBorne(tempsBrut, 0, TEMPS_MAX_EXAMEN_S)
      if (tempsBrut != null && tempsSecondes === null) return res.status(400).json({ error: 'tempsSecondes invalide' })
      if ((prenomBrut != null && typeof prenomBrut !== 'string') || (nomBrut != null && typeof nomBrut !== 'string')) {
        return res.status(400).json({ error: 'prenom/nom invalides' })
      }
      const prenom = formaterPrenom(nettoyerTexte(prenomBrut, NOM_ELEVE_MAX))
      const nom = nettoyerTexte(nomBrut, NOM_ELEVE_MAX)
      const themes = scoresThemes ? themesBornes(scoresThemes) : []

      // ── Destinataire : profils.email_parent de l'élève authentifié
      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?user_id=eq.${encodeURIComponent(userId)}&select=email_parent,email_actif&limit=1`,
        { headers: { 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY } }
      )
      if (!profilRes.ok) {
        console.log('Erreur brevet-blanc: lecture profils refusée, statut', profilRes.status)
        return res.status(500).json({ error: 'Lecture du profil impossible' })
      }
      const profils = await profilRes.json()
      const emailParent = Array.isArray(profils) && profils[0] && typeof profils[0].email_parent === 'string'
        ? profils[0].email_parent.trim()
        : ''
      if (!emailParent) return res.status(200).json({ success: false, raison: 'pas-de-destinataire' })
      // Parent désabonné : pas d'envoi, avant le quota (le résultat de
      // l'examen est enregistré côté client, indépendamment de cet email).
      if (profils[0].email_actif === false) return res.status(200).json({ success: false, raison: 'desabonne' })

      const couleurScore = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'
      const mention = pct >= 80 ? '🌟 Excellent' : pct >= 70 ? '👍 Très bon' : pct >= 60 ? '✅ Bon' : pct >= 50 ? '📋 Correct' : '📚 À retravailler'
      const messageMotivation = pct >= 50
        ? `Bonne nouvelle : <strong>${esc(prenom)}</strong> a réussi son examen en ligne ! Encouragez-le à continuer sur les thèmes à améliorer.`
        : `<strong>${esc(prenom)}</strong> n'a pas encore le niveau requis. C'est normal — c'est un entraînement ! Encouragez-le à continuer à réviser régulièrement.`

      const tempsFormat = tempsSecondes === null ? '' : `${Math.floor(tempsSecondes / 60)} min ${tempsSecondes % 60} sec`

      const themesHTML = themes.map(t => {
        const tp = Math.round((t.ok / t.total) * 100)
        const tc = tp >= 60 ? '#16a34a' : tp >= 40 ? '#f59e0b' : '#dc2626'
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0ec">
          <span style="font-size:13px;color:#444">${esc(t.nom)}</span>
          <span style="font-weight:700;color:${tc}">${t.ok}/${t.total} (${tp}%)</span>
        </div>`
      }).join('')

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Examen en ligne</div>
          </div>
          <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Votre enfant <strong>${esc(prenom)}${nom ? ' ' + esc(nom) : ''}</strong> vient de passer l'Examen en ligne Brevet Maths sur ACADEMIKA.
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
            <div style="font-size:56px;font-weight:700;color:${couleurScore}">${score}/${SCORE_MAX_EXAMEN}</div>
            <div style="font-size:24px;font-weight:600;color:${couleurScore};margin-top:4px">${pct}%</div>
            <div style="font-size:18px;margin-top:8px">${mention}</div>
            ${tempsFormat ? `<div style="font-size:13px;color:#666;margin-top:8px">⏱️ ${tempsFormat}</div>` : ''}
          </div>
          <p style="color:#444;margin-bottom:16px;">${messageMotivation}</p>
          ${themesHTML ? `<div style="margin-top:20px"><p style="color:#1a1a1a;font-weight:600;margin-bottom:8px">📊 RÉSULTATS PAR THÈME :</p>${themesHTML}</div>` : ''}
          <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:16px;">
              Pour toute question, contactez-nous : 
              <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(emailParent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

      // Clé par compte authentifié (pas par adresse) : l'adresse n'est plus
      // choisie par l'appelant, et ce compteur ne se mélange pas à ceux des
      // autres types d'emails du même parent.
      const rateOk = await verifierRateLimit('brevet-blanc:' + userId)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `📝 ${prenom} a obtenu ${score}/${SCORE_MAX_EXAMEN} à l'Examen en ligne — ACADEMIKA`, html })
      })

      const responseData = await response.json()
      if (!response.ok) return res.status(500).json({ error: 'Erreur envoi email : ' + JSON.stringify(responseData) })
      return res.status(200).json({ success: true })
    } catch(e) {
      console.log('Erreur brevet-blanc:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // INSCRIPTION — bienvenue élève + notification prof
  // ═══════════════════════════════════════════
  if (req.body?.type === 'inscription') {
    try {
      const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
      const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
      const PROF_EMAIL = 'contact@academika.fr'

      // ── Identité : jeton du parent obligatoire, compte à email confirmé.
      // Le destinataire est l'email de ce compte ; emailParent éventuellement
      // présent dans le corps est ignoré.
      const utilisateur = await verifierUtilisateur(jetonBearer(authHeaderEntrant), SUPA_URL, SUPA_KEY)
      if (!utilisateur) return res.status(401).json({ error: 'Non autorisé' })
      if (!utilisateur.emailConfirme || !utilisateur.email) return res.status(403).json({ error: 'Accès réservé' })
      const emailParent = utilisateur.email.trim()
      // '*' = joker ilike côté PostgREST (cf. contientJoker) : refus avant la
      // requête, même réponse que « ce compte n'est pas un parent ».
      if (contientJoker(emailParent)) return res.status(403).json({ error: 'Accès réservé' })

      // ── Ce compte est-il bien un parent ? Au moins une ligne profils portant
      // son email (insensible à la casse, comme le filtre du reset-password ;
      // creerEnfant() vient d'en créer une avec user.email).
      const parentRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?email_parent=ilike.${encodeURIComponent(escapeIlike(emailParent.toLowerCase()))}&select=user_id&limit=1`,
        { headers: { 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY } }
      )
      if (!parentRes.ok) {
        console.log('Erreur inscription: lecture profils refusée, statut', parentRes.status)
        return res.status(500).json({ error: 'Vérification du compte impossible' })
      }
      const lignesParent = await parentRes.json()
      if (!Array.isArray(lignesParent) || lignesParent.length === 0) return res.status(403).json({ error: 'Accès réservé' })

      // ── Texte du client nettoyé avant le sujet comme avant le HTML.
      const { prenom: prenomBrut, nom: nomBrut } = req.body
      if ((prenomBrut != null && typeof prenomBrut !== 'string') || (nomBrut != null && typeof nomBrut !== 'string')) {
        return res.status(400).json({ error: 'prenom/nom invalides' })
      }
      const prenom = formaterPrenom(nettoyerTexte(prenomBrut, NOM_ELEVE_MAX))
      const nom = nettoyerTexte(nomBrut, NOM_ELEVE_MAX)
      if (!prenom) return res.status(400).json({ error: 'prenom requis' })

      const htmlProf = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Nouvel élève inscrit</div>
          </div>
          <p style="margin-bottom:16px;">Bonjour,</p>
          <p style="margin-bottom:20px;color:#444;">Un nouvel élève vient de s'inscrire sur ACADEMIKA :</p>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Prénom</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${esc(prenom)}</td></tr>
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Nom</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${esc(nom)}</td></tr>
              <tr><td style="padding:8px;color:#666">Email parents</td><td style="padding:8px;font-weight:600;color:#3730a3">${esc(emailParent)}</td></tr>
            </table>
          </div>
          <p style="color:#444;font-size:13px;margin-bottom:16px;">
            Connectez-vous sur 
            <a href="https://www.academika.fr/prof.html" style="color:#3730a3;text-decoration:none;font-weight:500">le tableau de bord</a> 
            pour suivre sa progression.
          </p>
          <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
        </div>`

      // Contenu revu et validé le 16/08/2026 (première relecture de cet
      // email depuis sa création — jamais parti à un vrai parent avant
      // câblage dans creerEnfant()). Corrections apportées à cette
      // occasion : retrait de "sans mot de passe à retenir" (inexact —
      // creerEnfant() fait bien saisir un mot de passe pour le compte
      // enfant), précision de l'identifiant de connexion de l'enfant
      // (prénom + nom, vérifié dans connexion.html/verifier_login — pas
      // un email ni un identifiant généré), mention de la gratuité de
      // lancement sans nommer les offres (le parent n'en choisit pas
      // pendant le lancement, cf. CLAUDE.md § Bascule décembre 2026).
      const htmlParents = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Bienvenue !</div>
          </div>
          <p style="margin-bottom:16px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Le compte de <strong>${esc(prenom)}</strong> vient d'être créé sur ACADEMIKA, une plateforme de révision en mathématiques pour préparer le Brevet.
          </p>
          <div style="background:#eef2ff;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="font-weight:600;margin-bottom:12px;color:#3730a3">Comment ça fonctionne</p>
            <p style="margin-bottom:8px;font-size:14px;">🎯 Des quiz ciblés par sous-thème, avec des corrections détaillées étape par étape</p>
            <p style="margin-bottom:8px;font-size:14px;">📝 Un examen en ligne, au format du QCM du Brevet</p>
            <p style="margin-bottom:0;font-size:14px;">🔓 Trois niveaux — Facile, Moyen, Difficile — à débloquer progressivement</p>
          </div>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="font-weight:600;margin-bottom:12px;color:#1a1a1a">Les accès</p>
            <p style="margin-bottom:10px;font-size:14px;color:#444;">👦 <strong>${esc(prenom)}</strong> se connecte sur academika.fr avec son prénom et son nom, et le mot de passe que vous venez de créer.</p>
            <p style="margin:0;font-size:14px;color:#444;">👪 Vous accédez à votre espace parent sans mot de passe : saisissez simplement votre adresse email, vous recevrez un code à usage unique valable quelques minutes.</p>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="https://www.academika.fr/espace-parent.html" style="display:inline-block;background:#3730a3;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Accéder à l'espace parent →</a>
          </div>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="font-weight:600;margin-bottom:12px;color:#1a1a1a">Ce que vous recevrez</p>
            <p style="margin-bottom:8px;font-size:14px;color:#444;">Chaque soir où <strong>${esc(prenom)}</strong> aura travaillé, vous recevrez un récapitulatif : les sous-thèmes acquis et ceux qui restent à consolider.</p>
            <p style="margin-bottom:8px;font-size:14px;color:#444;">Tous les 21 jours, un bilan complet fait le point sur la progression.</p>
            <p style="margin:0;font-size:14px;color:#444;">Vous pouvez aussi télécharger un bilan au format PDF à tout moment depuis votre espace.</p>
          </div>
          <div style="border-top:1px solid #e8e8e4;margin-top:24px;padding-top:16px">
            <p style="color:#666;font-size:12px;line-height:1.6;margin:0">
              ACADEMIKA est gratuit jusqu'en décembre 2026, sans carte bancaire. Le suivi parent passera ensuite à 7,90 €/mois, sans engagement — les quiz resteront gratuits.
            </p>
          </div>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:8px;">
              Pour toute question, contactez-nous :
              <a href="mailto:${PROF_EMAIL}" style="color:#3730a3;text-decoration:none;font-weight:500">${PROF_EMAIL}</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
        </div>`

      // Un seul contrôle, par compte authentifié, couvre l'email vers le parent
      // ET celui vers PROF_EMAIL (qui n'était pas limité jusqu'ici).
      const rateOk = await verifierRateLimit('inscription:' + utilisateur.id)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const reponsesResend = await Promise.all([
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({ from: 'noreply@academika.fr', to: PROF_EMAIL, subject: `🎓 Nouvel élève inscrit : ${prenom} ${nom} — ACADEMIKA`, html: htmlProf })
        }),
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `🎓 Bienvenue sur ACADEMIKA — ${prenom}`, html: htmlParents })
        })
      ])

      // Les deux réponses Resend sont examinées : seul le statut est journalisé
      // (le corps peut contenir des adresses).
      const echecs = reponsesResend.filter(r => !r.ok)
      if (echecs.length > 0) {
        console.log('Erreur inscription: envoi Resend refusé, statuts', echecs.map(r => r.status).join(','))
        return res.status(502).json({ success: false, error: 'Envoi email échoué' })
      }

      return res.status(200).json({ success: true })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // RÉSULTATS BREVET BLANC PRÉSENTIEL (saisis manuellement par le prof)
  // ═══════════════════════════════════════════
  if (req.body?.type === 'resultats-brevet') {
    const RESEND_KEY = process.env.RESEND_API_KEY
    const { emailParent, prenom: prenomSaisi, nom, date, note, commentaire } = req.body
    const prenom = formaterPrenom(prenomSaisi)
    if (!emailParent || !prenom || note === undefined) return res.status(400).json({ error: 'Champs manquants' })

    const pct = Math.round((note / 20) * 100)
    let mention = ''
    if (pct >= 80) mention = '🌟 Excellent'
    else if (pct >= 70) mention = '👍 Très bon'
    else if (pct >= 60) mention = '✅ Bon'
    else if (pct >= 50) mention = '📋 Correct'
    else mention = '📚 À retravailler'
    const couleur = pct >= 50 ? '#16a34a' : '#dc2626'

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
        <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
          <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
          <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Examen blanc présentiel</div>
        </div>
        <p style="margin-bottom:16px;">Bonjour,</p>
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Voici les résultats de <strong>${esc(prenom)} ${esc(nom)}</strong> pour l'examen blanc du <strong>${esc(date)}</strong> :</p>
        <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
          <div style="font-size:56px;font-weight:700;color:${couleur}">${note}<span style="font-size:24px;color:#999">/20</span></div>
          <div style="font-size:18px;margin-top:8px">${mention}</div>
        </div>
        ${commentaire ? `
        <div style="background:#f7f7f5;border-radius:12px;padding:16px 20px;margin:16px 0">
          <p style="font-weight:600;margin-bottom:8px">💬 Commentaire :</p>
          <p style="color:#555;line-height:1.6">${esc(commentaire)}</p>
        </div>` : ''}
        <p style="color:#444;line-height:1.6;margin-bottom:20px">Continuez à réviser sur <a href="https://academika.fr" style="color:#3730a3">academika.fr</a> !</p>
        <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
          <p style="color:#444;font-size:13px;margin-bottom:8px;">
            Contact : <strong>06 26 53 90 13</strong> · <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
          </p>
          <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
        </div>
      </div>`

    const rateOk = await verifierRateLimit(emailParent)
    if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({ from: 'ACADEMIKA <noreply@academika.fr>', to: emailParent, subject: `📝 Résultats Examen Blanc Brevet — ${prenom}`, html })
      })
      return res.status(200).json({ success: true })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // RÉCAP JOURNALIER — recalculé côté serveur (source de vérité unique)
  // Modifié le 21/08/2026 : le déclenchement côté client (logout/terminer
  // dans quiz.html), retiré le 16/08/2026, a été rétabli verbatim — le cron
  // (cron-rappel.js, 0 21 * * * UTC) ne s'était pas déclenché depuis,
  // laissant les élèves sans récap (cf. quiz.html:490-501). Le cron n'est
  // donc plus le seul déclencheur : il redevient un filet de rattrapage,
  // chaque envoi ici marquant les lignes concernées à alerte_envoyee=true
  // pour que le cron ne retrouve plus rien à couvrir après un envoi réussi.
  // Paramètre `date` (YYYY-MM-DD, fuseau Paris) optionnel : permet au cron
  // de traiter un jour antérieur au jour courant (rattrapage d'une session
  // tombée après son unique passage quotidien). Sans ce paramètre,
  // comportement inchangé : le jour Paris courant. Présent, il doit être une
  // date réelle AAAA-MM-JJ (400 sinon, sans email) : il alimente le libellé
  // des phrases adressées au parent (« aujourd'hui » / « hier » / « le mardi
  // 7 octobre »), calculé côté serveur à partir de la date validée.
  // ═══════════════════════════════════════════
  if (req.body?.type === 'recap-journalier-user') {
    const { user_id, date } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id manquant' })

    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

    // ── Identité — cf. docs/TODO.md, item 27. Deux appelants légitimes :
    // le cron (secret partagé, cf. api/cron-rappel.js) ou le client
    // quiz.html avec un jeton dont l'identité correspond au user_id demandé.
    // Sans l'un des deux : 401 AVANT toute lecture de profils, pour ne pas
    // laisser filtrer si l'élève a une session non couverte aujourd'hui
    // (oracle "profil introuvable"/"déjà envoyé"/"aucune session").
    // !!process.env.CRON_SECRET évite qu'un appel sans header ('Bearer
    // undefined' côté comparaison) ne passe si la variable n'est pas posée
    // sur cet environnement.
    const authHeader = req.headers['authorization'] || ''
    const estCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
    let identiteOk = estCron
    if (!identiteOk) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
      const userIdToken = await verifierToken(token, SUPA_URL, SUPA_KEY)
      identiteOk = userIdToken !== null && userIdToken === user_id
    }
    if (!identiteOk) return res.status(401).json({ error: 'Non autorisé' })

    // Absent (undefined / null) = jour Paris courant. Toute autre valeur doit
    // être une date réelle AAAA-MM-JJ ; la valeur reçue n'est jamais renvoyée.
    const dateVisee = (date === undefined || date === null) ? null : dateRecapValide(date)
    if (date !== undefined && date !== null && dateVisee === null) {
      return res.status(400).json({ error: 'date invalide (format AAAA-MM-JJ attendu)' })
    }

    const supaHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPA_KEY}`,
      'apikey': SUPA_KEY
    }

    try {
      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?user_id=eq.${user_id}&select=prenom_affiche,email_parent,email_actif,plan_actif&limit=1`,
        { headers: supaHeaders }
      )
      const profils = await profilRes.json()
      if (!profils || profils.length === 0) {
        return res.status(200).json({ success: true, skip: 'profil introuvable' })
      }
      const { prenom_affiche, email_parent, email_actif, plan_actif } = profils[0]
      if (!email_parent || email_actif === false) {
        return res.status(200).json({ success: true, skip: 'email parent absent ou désactivé' })
      }

      const maintenant = new Date()
      const dateParisStr = dateVisee || dateParis(maintenant)
      const { libelle: quand } = libelleJour(dateParisStr, maintenant)
      const sessionsRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}` +
        `&select=id,theme,sous_theme,difficulte,score,total,temps_secondes,questions_ratees,created_at,alerte_envoyee,abandonne` +
        `&order=created_at.asc`,
        { headers: supaHeaders }
      )
      const toutesSessions = await sessionsRes.json()

      const sessionsDuJour = (toutesSessions || []).filter(s => {
        return dateParis(s.created_at) === dateParisStr
      })

      if (sessionsDuJour.length === 0) {
        return res.status(200).json({ success: true, skip: 'aucune session aujourd\'hui' })
      }

      const sessionsNonCouvertes = sessionsDuJour.filter(s => s.alerte_envoyee !== true)
      if (sessionsNonCouvertes.length === 0) {
        return res.status(200).json({ success: true, skip: 'déjà envoyé aujourd\'hui' })
      }

      // Marque une liste de lignes resultats comme couvertes — utilisé à la
      // fois par l'envoi normal ci-dessous et par le skip "aucune session
      // réelle" (un abandon doit être marqué comme les autres, sinon il
      // reste indéfiniment non couvert pour ce jour). Fail-open loggé,
      // jamais bloquant : quand un email part, il est déjà délivré à ce
      // stade — seul le marquage peut rater.
      async function marquerCouvertes(liste) {
        const patchResultats = await Promise.all(
          liste.map(s =>
            fetch(`${SUPA_URL}/rest/v1/resultats?id=eq.${s.id}`, {
              method: 'PATCH',
              headers: { ...supaHeaders, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ alerte_envoyee: true })
            })
              .then(r => ({ id: s.id, ok: r.ok, status: r.status }))
              .catch(e => ({ id: s.id, ok: false, status: null, error: e.message }))
          )
        )
        patchResultats.filter(r => !r.ok).forEach(r => {
          console.error(
            'Échec PATCH alerte_envoyee — resultats.id=' + r.id +
            (r.status != null ? ' status=' + r.status : '') +
            (r.error ? ' erreur=' + r.error : '')
          )
        })
      }

      // Constat factuel, sans verdict par sous-thème : le « acquis » d'un
      // sous-thème relève de la vue niveaux_sous_theme (espace parent). Une
      // session interrompue (abandonne=true, sans seuil de durée) n'entre ni
      // dans le décompte, ni dans la durée, ni dans la liste des sous-thèmes.
      const { terminees: totalSessions, interrompues, dureeSecondes, sousThemes } = resumeJour(sessionsDuJour)
      if (totalSessions === 0) {
        await marquerCouvertes(sessionsNonCouvertes)
        return res.status(200).json({ success: true, skip: 'aucune session réelle aujourd\'hui' })
      }

      const prenom = formaterPrenom(prenom_affiche)
      const lienDesabonnement = `https://academika.fr/desabonner.html?email=${encodeURIComponent(email_parent)}`
      // Pendant l'offre de lancement, tout le monde reçoit l'email détaillé,
      // indépendamment de plan_actif — Stripe n'est pas encore en service
      // réel (SIRET en attente, cf. CLAUDE.md § Bascule décembre 2026).
      // S'auto-désactive au 01/12/2026 (même FIN_OFFRE_LANCEMENT que
      // api/stripe-checkout.js, source unique dans lib/gating.js).
      const detailComplet = peutRecevoirEmailDetaille({ plan_actif }) || enPeriodeGratuite()

      const activite = lignesActivite(sessionsDuJour)
      const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`
      const resume = `${esc(prenom)} a révisé ${quand} : ${pluriel(totalSessions, 'session')}, ${formatDuree(dureeSecondes)}` +
        (interrompues > 0 ? ` (+ ${pluriel(interrompues, 'interrompue')})` : '')

      const detailHTML = detailComplet
        ? `<p style="font-size:13px;font-weight:600;margin:20px 0 8px">Sous-thèmes travaillés</p>
            ${sousThemes.map(st => `<p style="font-size:13px;color:#444;margin:0 0 4px">· ${esc(st.nom)} (${pluriel(st.sessions, 'session')})</p>`).join('')}
            <p style="color:#444;line-height:1.6;margin-top:14px">Son niveau par sous-thème est détaillé dans votre espace parent.</p>`
        : `<p style="color:#444;line-height:1.6;margin-top:20px">Le détail par sous-thème est disponible avec l'offre Accompagné.</p>`

      const sujet = `${prenom} a révisé ${quand} — ACADEMIKA`

      const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
              <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
            </div>
            <p style="margin-bottom:10px">Bonjour,</p>
            <p style="font-size:15px;font-weight:600;margin:0 0 4px">${resume}</p>
            ${activite.length ? `<p style="font-size:12px;color:#888;margin:0">${activite.join('<br>')}</p>` : ''}
            ${detailHTML}
            <div style="text-align:center;margin:24px 0 4px">
              <a href="https://www.academika.fr/espace-parent.html" style="color:#3730a3;text-decoration:none;font-weight:600;font-size:13px">${detailComplet ? 'Voir son niveau par sous-thème →' : 'Voir son espace parent →'}</a>
            </div>
            <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
              <p style="color:#444;font-size:13px;margin-bottom:16px;">
                Pour toute question, contactez-nous : 
                <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
              </p>
              <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
            </div>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:16px">
              <a href="${lienDesabonnement}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

      const rateOk = await verifierRateLimit(email_parent)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({ from: 'noreply@academika.fr', to: email_parent, subject: sujet, html })
      })

      if (!emailRes.ok) {
        const err = await emailRes.json()
        return res.status(500).json({ error: 'Erreur email : ' + JSON.stringify(err) })
      }

      // L'email est déjà parti à ce stade (emailRes.ok vérifié ci-dessus) —
      // marquerCouvertes() est fail-open et ne fait jamais échouer la
      // réponse (voir sa définition plus haut).
      await marquerCouvertes(sessionsNonCouvertes)

      return res.status(200).json({ success: true, envoye: true, totalSessions })

    } catch (e) {
      console.log('Erreur recap-journalier-user:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // RÉSILIATION CONFIRMÉE — envoyé depuis stripe-webhook.js au moment où
  // le parent programme l'annulation dans le portail client Stripe (pas
  // à la fin effective de la période, trop tardive pour une confirmation)
  // ═══════════════════════════════════════════
  if (req.body?.type === 'resiliation-confirmee') {
    try {
      const { emailParent, prenom: prenomSaisi, dateFin } = req.body
      const prenom = formaterPrenom(prenomSaisi)
      if (!emailParent || !dateFin) return res.status(400).json({ error: 'Champs manquants' })

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Résiliation confirmée</div>
          </div>
          <p style="margin-bottom:16px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Nous confirmons la résiliation de l'abonnement Accompagné${prenom ? ` de <strong>${esc(prenom)}</strong>` : ''}, à votre demande.
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="margin-bottom:8px;font-size:14px;color:#444;">✅ Le service Accompagné reste actif jusqu'au <strong>${esc(dateFin)}</strong>.</p>
            <p style="margin:0;font-size:14px;color:#444;">✅ Aucun prélèvement n'aura lieu après cette date.</p>
          </div>
          <p style="color:#444;margin-bottom:20px;">
            Vous pouvez réactiver l'abonnement à tout moment avant cette date depuis votre espace parent.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="https://www.academika.fr/espace-parent.html" style="background:#3730a3;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
              Accéder à l'espace parent →
            </a>
          </div>
          <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:16px;">
              Pour toute question, contactez-nous :
              <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
        </div>`

      const rateOk = await verifierRateLimit(emailParent)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `Résiliation confirmée — ACADEMIKA`, html })
      })

      if (!response.ok) {
        const responseData = await response.json()
        return res.status(500).json({ error: 'Erreur : ' + JSON.stringify(responseData) })
      }
      return res.status(200).json({ success: true })
    } catch (e) {
      console.log('Erreur resiliation-confirmee:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }


  // ═══════════════════════════════════════════
  // DEMANDE DE COURS PARTICULIERS — formulaire public de cours-particuliers.html
  //
  // Seule branche de ce fichier déclenchée par un visiteur non authentifié,
  // depuis un formulaire ouvert à tous. D'où les trois protections ci-dessous
  // (honeypot, validation stricte, rate-limit) : aucune des autres branches
  // n'en a besoin, toutes étant derrière un compte ou un flux applicatif.
  //
  // Un seul email part, vers PROF_EMAIL. Pas d'accusé de réception au
  // demandeur : envoyer un email à une adresse arbitraire fournie par un
  // inconnu ferait de cet endpoint un relais de spam ouvert. La confirmation
  // est affichée à l'écran, côté client.
  //
  // Le contenu de la demande n'est stocké nulle part : il ne vit que dans
  // l'email envoyé. Seule exception, à garder en tête si la mention RGPD sous
  // le formulaire est un jour retouchée : verifierRateLimit() écrit l'adresse
  // du demandeur dans email_rate_limit, sous la clé 'contact-cours:<email>'.
  // ═══════════════════════════════════════════
  if (req.body?.type === 'contact-cours') {
    try {
      const PROF_EMAIL = 'contact@academika.fr'
      const { prenom, telephone, email, niveau, format, message, societe } = req.body

      // Honeypot : champ caché en CSS, invisible pour un humain, rempli par les
      // robots qui remplissent tout formulaire trouvé. On répond 200 sans rien
      // envoyer — un 4xx apprendrait au robot à contourner le piège.
      if (societe) return res.status(200).json({ success: true })

      const prenomN = formaterPrenom(prenom)
      const telephoneN = String(telephone || '').trim()
      const emailN = String(email || '').trim().toLowerCase()
      const messageN = String(message || '').trim().slice(0, 2000)

      if (!prenomN || prenomN.length > 80) {
        return res.status(400).json({ error: 'Prénom manquant ou invalide.' })
      }
      // L'email sert de reply_to : une chaîne libre y ouvrirait une injection
      // d'en-tête. Validé avant toute utilisation, retour de compréhension pris.
      if (!/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/.test(emailN) || emailN.length > 160) {
        return res.status(400).json({ error: 'Adresse email invalide.' })
      }
      if (!/^[0-9+().\-\s]{6,25}$/.test(telephoneN)) {
        return res.status(400).json({ error: 'Numéro de téléphone invalide.' })
      }

      // Listes closes : les valeurs hors liste sont refusées, jamais réaffichées.
      const NIVEAUX = { '4eme': '4ᵉ', '3eme': '3ᵉ', 'lycee': 'Lycée', 'autre': 'Autre' }
      const FORMATS = { 'visio': 'Visio', 'domicile': 'À domicile' }
      const niveauLibelle = NIVEAUX[String(niveau || '')]
      const formatLibelle = FORMATS[String(format || '')]
      if (!niveauLibelle) return res.status(400).json({ error: 'Niveau invalide.' })
      if (!formatLibelle) return res.status(400).json({ error: 'Format invalide.' })

      // Rate-limit sur une clé préfixée, PAS sur PROF_EMAIL : la clé destinataire
      // étant fixe, dix requêtes suffiraient à bloquer le formulaire pour tous les
      // prospects pendant une heure — la protection deviendrait le déni de service.
      // Le préfixe évite toute collision avec une vraie adresse destinataire.
      const rateOk = await verifierRateLimit('contact-cours:' + emailN)
      if (!rateOk) return res.status(429).json({ error: 'Trop de demandes envoyées depuis cette adresse. Réessayez plus tard.' })

      const ligneMessage = messageN
        ? `<tr><td style="padding:8px;color:#666;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${esc(messageN)}</td></tr>`
        : ''

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Demande de cours particuliers</div>
          </div>
          <p style="margin-bottom:20px;color:#444;">Nouvelle demande de premier échange depuis la page Cours particuliers :</p>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Prénom</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${esc(prenomN)}</td></tr>
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Téléphone</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${esc(telephoneN)}</td></tr>
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Email</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${esc(emailN)}</td></tr>
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Niveau</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${esc(niveauLibelle)}</td></tr>
              <tr><td style="padding:8px;color:#666;${ligneMessage ? 'border-bottom:1px solid #e8e8e4' : ''}">Format</td><td style="padding:8px;font-weight:600;${ligneMessage ? 'border-bottom:1px solid #e8e8e4' : ''}">${esc(formatLibelle)}</td></tr>
              ${ligneMessage}
            </table>
          </div>
          <p style="color:#444;font-size:13px;">Rappel annoncé sous 48 h. Répondre directement à cet email écrit au demandeur.</p>
        </div>`

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'ACADEMIKA <noreply@academika.fr>',
          to: PROF_EMAIL,
          reply_to: emailN,
          subject: `📞 Demande de cours : ${prenomN} (${niveauLibelle} · ${formatLibelle})`,
          html
        })
      })

      if (!response.ok) {
        // Le corps de la réponse Resend ne part pas au client.
        console.log('Erreur contact-cours (Resend):', await response.text())
        return res.status(500).json({ error: "L'envoi a échoué. Réessayez ou appelez le 06 26 53 90 13." })
      }
      return res.status(200).json({ success: true })

    } catch (e) {
      console.log('Erreur contact-cours:', e.message)
      return res.status(500).json({ error: "L'envoi a échoué. Réessayez ou appelez le 06 26 53 90 13." })
    }
  }

  // ═══════════════════════════════════════════
  // Type non reconnu
  // ═══════════════════════════════════════════
  return res.status(400).json({ error: 'Type de requête non reconnu ou manquant' })
}
