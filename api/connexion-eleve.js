// /api/connexion-eleve.js
//
// Connexion d'un élève (prénom + nom + mot de passe) EN PASSANT PAR LE SERVEUR.
// Remplace, côté connexion.html, l'enchaînement verifier_login (RPC ouverte à
// anon, qui renvoyait le faux email) + signInWithPassword : le navigateur ne
// voit plus jamais le faux email, et les tentatives sont comptées et bloquées.
//
//   1. blocage   : RPC login_est_bloque(p_cles) — clés 'eleve:<prenom>|<nom>'
//                  et 'ip:<ip>'. S'applique même si l'élève n'existe pas
//                  (sinon la différence de réponse révélerait les comptes).
//   2. recherche : profils (clé service) → faux_email. 0 ou 2 lignes = échec
//                  d'identifiants, traité comme un mot de passe faux.
//   3. connexion : POST /auth/v1/token?grant_type=password. Avec
//                  SUPABASE_SECRET_KEY, l'IP du client est transmise à Supabase
//                  (en-tête Sb-Forwarded-For) pour que ses propres limites
//                  portent sur l'élève et non sur le serveur Vercel.
//   4. échec     : RPC login_enregistrer_echec par clé disponible → 401.
//      succès    : RPC login_reinitialiser (clé élève) → 200 { access_token,
//                  refresh_token } et rien d'autre.
//
// Les RPC de compteur sont FAIL-OPEN : si elles tombent (ou n'existent pas
// encore), la connexion continue sans blocage — jamais d'élève empêché de
// travailler par une panne du mécanisme. Le statut HTTP est journalisé, jamais
// le contenu. Aucun mot de passe, jeton, faux email ni clé n'est journalisé.
//
// Toutes les réponses attendent DUREE_MIN_REPONSE_MS, pour qu'élève inconnu,
// mot de passe faux et succès ne se distinguent pas par le temps de réponse.

import { isIP } from 'net'

const SUPABASE_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'

const DUREE_MIN_REPONSE_MS = 1000
const LONGUEUR_MAX_NOM = 60
const LONGUEUR_MAX_MOT_DE_PASSE = 72

// Seuils de blocage : N échecs dans la fenêtre → clé bloquée pendant blocage_s.
const ELEVE_SEUIL = 5
const ELEVE_FENETRE_S = 900
const ELEVE_BLOCAGE_S = 900
const IP_SEUIL = 20
const IP_FENETRE_S = 900
const IP_BLOCAGE_S = 900

let absenceCleSecreteJournalisee = false

// IP du client : x-real-ip, sinon premier élément de x-forwarded-for. Absente
// ou invalide → null : on ne regroupe JAMAIS les élèves sous une clé commune.
function lireIp(req) {
  const brut = req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0]
  const ip = String(brut || '').trim()
  return ip && isIP(ip) ? ip : null
}

async function appelerRpc(nom, params, headersService) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nom}`, {
      method: 'POST',
      headers: { ...headersService, 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    if (!r.ok) {
      console.log(`[connexion-eleve] ${nom} : statut ${r.status}`)
      return { ok: false, data: null }
    }
    const texte = await r.text()
    return { ok: true, data: texte ? JSON.parse(texte) : null }
  } catch (e) {
    console.log(`[connexion-eleve] ${nom} : échec technique`)
    return { ok: false, data: null }
  }
}

function lireCorps(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch (e) { return {} }
  }
  return {}
}

export default async function handler(req, res) {
  const debut = Date.now()
  async function repondre(statut, corps) {
    const reste = DUREE_MIN_REPONSE_MS - (Date.now() - debut)
    if (reste > 0) await new Promise(resolve => setTimeout(resolve, reste))
    res.setHeader('Cache-Control', 'no-store')
    return res.status(statut).json(corps)
  }

  if (req.method !== 'POST') return repondre(405, { error: 'methode' })

  try {
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
    const SECRET_KEY = process.env.SUPABASE_SECRET_KEY
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // ── Validation de la saisie
    const corps = lireCorps(req)
    const { prenom: prenomBrut, nom: nomBrut, password } = corps
    if (typeof prenomBrut !== 'string' || typeof nomBrut !== 'string' || typeof password !== 'string') {
      return repondre(400, { error: 'saisie' })
    }
    const prenom = prenomBrut.trim().toLowerCase()
    const nom = nomBrut.trim().toLowerCase()
    if (!prenom || !nom || !password
      || prenom.length > LONGUEUR_MAX_NOM || nom.length > LONGUEUR_MAX_NOM
      || password.length > LONGUEUR_MAX_MOT_DE_PASSE) {
      return repondre(400, { error: 'saisie' })
    }

    const ip = lireIp(req)
    const cleEleve = 'eleve:' + prenom + '|' + nom
    const cleIp = ip ? 'ip:' + ip : null
    const cles = cleIp ? [cleEleve, cleIp] : [cleEleve]

    const headersService = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }

    // ── Étape 1 : blocage (même si l'élève n'existe pas)
    const blocage = await appelerRpc('login_est_bloque', { p_cles: cles }, headersService)
    if (blocage.ok && blocage.data === true) return repondre(429, { error: 'bloque' })

    // ── Étape 2 : recherche de l'élève (clé service, valeurs encodées)
    const rProfil = await fetch(
      `${SUPABASE_URL}/rest/v1/profils?prenom=eq.${encodeURIComponent(prenom)}&nom=eq.${encodeURIComponent(nom)}&select=faux_email&limit=2`,
      { headers: headersService }
    )
    if (!rProfil.ok) {
      console.log(`[connexion-eleve] lecture profils : statut ${rProfil.status}`)
      return repondre(503, { error: 'technique' })
    }
    const lignes = await rProfil.json()
    const fauxEmail = Array.isArray(lignes) && lignes.length === 1 ? lignes[0].faux_email : null

    // ── Étape 3 : connexion auprès de Supabase Auth
    let identifiantsRefuses = !fauxEmail
    let jetons = null

    if (fauxEmail) {
      const headersAuth = { 'Content-Type': 'application/json' }
      if (SECRET_KEY) {
        headersAuth['apikey'] = SECRET_KEY
        if (ip) headersAuth['Sb-Forwarded-For'] = ip
      } else {
        if (!absenceCleSecreteJournalisee) {
          absenceCleSecreteJournalisee = true
          console.log('[connexion-eleve] SUPABASE_SECRET_KEY absente — clé anon utilisée, IP du client non transmise à Supabase')
        }
        if (!ANON_KEY) {
          console.log('[connexion-eleve] NEXT_PUBLIC_SUPABASE_ANON_KEY absente — connexion impossible')
          return repondre(503, { error: 'technique' })
        }
        headersAuth['apikey'] = ANON_KEY
      }

      let rAuth
      try {
        rAuth = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: headersAuth,
          body: JSON.stringify({ email: fauxEmail, password })
        })
      } catch (e) {
        console.log('[connexion-eleve] auth/token : échec réseau')
        return repondre(503, { error: 'technique' })
      }

      if (rAuth.status === 200) {
        const data = await rAuth.json().catch(() => null)
        if (!data || !data.access_token || !data.refresh_token) {
          console.log('[connexion-eleve] auth/token : réponse 200 sans jetons')
          return repondre(503, { error: 'technique' })
        }
        jetons = { access_token: data.access_token, refresh_token: data.refresh_token }
      } else if (rAuth.status === 400) {
        // Seul le 400 (invalid_credentials) est un échec d'identifiants. Un 401
        // signale une apikey invalide (ex. SUPABASE_SECRET_KEY mal copiée) :
        // erreur technique, jamais comptée comme un mot de passe faux — sinon
        // une clé mal posée bloquerait les élèves.
        identifiantsRefuses = true
      } else if (rAuth.status === 429) {
        console.log('[connexion-eleve] auth/token : statut 429')
        return repondre(503, { error: 'sature' })
      } else {
        console.log(`[connexion-eleve] auth/token : statut ${rAuth.status}`)
        return repondre(503, { error: 'technique' })
      }
    }

    // ── Étape 4 : échec d'identifiants → compteurs, puis réponse unique
    if (identifiantsRefuses || !jetons) {
      const enregistrements = [
        appelerRpc('login_enregistrer_echec',
          { p_cle: cleEleve, p_seuil: ELEVE_SEUIL, p_fenetre_s: ELEVE_FENETRE_S, p_blocage_s: ELEVE_BLOCAGE_S }, headersService)
      ]
      if (cleIp) {
        enregistrements.push(appelerRpc('login_enregistrer_echec',
          { p_cle: cleIp, p_seuil: IP_SEUIL, p_fenetre_s: IP_FENETRE_S, p_blocage_s: IP_BLOCAGE_S }, headersService))
      }
      await Promise.all(enregistrements)
      return repondre(401, { error: 'identifiants' })
    }

    // ── Succès : remise à zéro du compteur élève (pas celui de l'IP)
    await appelerRpc('login_reinitialiser', { p_cle: cleEleve }, headersService)
    return repondre(200, jetons)

  } catch (e) {
    // Le message d'une exception (ex. JSON.parse) peut citer un extrait de la
    // réponse lue : seul le type d'erreur est journalisé.
    console.log('[connexion-eleve] erreur inattendue :', e && e.name)
    return repondre(500, { error: 'technique' })
  }
}
