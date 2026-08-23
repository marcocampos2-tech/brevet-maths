// /lib/questions-vues.js
//
// Mémoire des questions déjà servies à un élève — socle commun aux deux
// parcours, extrait de api/generer.js et api/examen.js où il était dupliqué.
//
// Ce module ne connaît PAS les seuils de reboucle : la logique de seuil vit
// dans chaque handler, avec sa justification propre (5 pour la banque,
// 6 pour l'examen — voir le commentaire de SEUIL_REBOUCLE dans api/examen.js,
// où la valeur est imposée par l'arithmétique du découpage en tiers).
// Ici on ne trouve que la lecture, la purge, le marquage et le contexte
// d'authentification.
//
// ── Source liée une seule fois par fichier ─────────────────────────
// L'accès se fait par memoireQuestionsVues('banque') ou ('examen'), qui
// retourne trois opérations déjà liées à cette source. La source n'est donc
// jamais répétée aux points d'appel : une valeur erronée y enverrait un
// DELETE sur les questions vues de L'AUTRE parcours, sans rien signaler.
//
// ── Sécurité ───────────────────────────────────────────────────────
// Toutes les opérations passent par le jeton de l'élève (clé anon +
// Authorization: Bearer), donc sous la policy RLS `auth.uid() = user_id` :
// impossible d'écrire ou de purger sur le compte d'un tiers, même en forgeant
// le corps de la requête. Le user_id vient du `sub` du jeton, jamais du body.
//
// Le filtre user_id explicite des URL est redondant avec la RLS : c'est une
// défense en profondeur délibérée, PAS un oubli. Il borne la lecture et
// surtout le DELETE même si la policy venait à sauter, ou si ces requêtes
// passaient un jour par la clé service (qui contourne la RLS). Ne pas le
// « nettoyer » lors d'un futur passage.
//
// ── Étanchéité des erreurs ─────────────────────────────────────────
// appelVues() est le point de passage unique : chaque échec porte son
// opération, son code HTTP et le corps PostgREST sur des champs DISTINCTS.
// Le corps ne va qu'au log ; les handlers n'exposent au client que le nom
// d'opération et le code HTTP nu. Un corps PostgREST révèle des noms de
// contraintes et de colonnes — il ne doit jamais sortir.

const SUPABASE_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Borne de longueur des filtres `in.()` dans l'URL. La lecture peut perdre ce
// filtre au-delà (user_id + source la bornent déjà) ; le DELETE, lui, n'est
// JAMAIS élargi — c'est sa borne qui porte la sûreté — il est découpé en lots.
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

// Trois opérations liées à une source ('banque' ou 'examen').
function memoireQuestionsVues(source) {
  const base = `${SUPABASE_URL}/rest/v1/questions_vues`
  const perimetre = (ctx) => `user_id=eq.${ctx.userId}&source=eq.${source}`

  return {
    source,

    async lire(ctx, ids) {
      let url = `${base}?${perimetre(ctx)}&select=question_id`
      if (ids.length <= LIMITE_FILTRE_URL) url += `&question_id=in.(${ids.join(',')})`
      const r = await appelVues('lecture', url, { headers: ctx.headers })
      const data = await r.json()
      if (!Array.isArray(data)) {
        const e = new Error('réponse inattendue')
        e.operation = 'lecture'
        throw e
      }
      return new Set(data.map(v => v.question_id))
    },

    async purger(ctx, ids) {
      for (let i = 0; i < ids.length; i += LIMITE_FILTRE_URL) {
        const lot = ids.slice(i, i + LIMITE_FILTRE_URL)
        const url = `${base}?${perimetre(ctx)}&question_id=in.(${lot.join(',')})`
        await appelVues('purge', url, { method: 'DELETE', headers: { ...ctx.headers, 'Prefer': 'return=minimal' } })
      }
    },

    async marquer(ctx, ids) {
      if (ids.length === 0) return
      await appelVues('marquage', base, {
        method: 'POST',
        headers: { ...ctx.headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(ids.map(id => ({ user_id: ctx.userId, question_id: id, source })))
      })
    }
  }
}

module.exports = { memoireQuestionsVues, contexteEleve, noterEchec, journaliserEchec, LIMITE_FILTRE_URL }
