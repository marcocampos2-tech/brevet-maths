// /lib/auth-eleve.js
//
// Gate d'écriture élève : vérifie qu'un user_id correspond à un compte
// élève réel (présence d'une ligne `profils`) avant d'accepter une
// écriture de résultat (quiz ou examen blanc), avec exemption pour le
// compte prof (tests manuels délibérés). Extrait de api/quiz-resultat.js,
// où cette logique allait être dupliquée une troisième fois par l'action
// 'enregistrer' de api/examen.js.
//
// Fail-open ASYMÉTRIQUE — ne pas aligner les deux branches par souci de
// cohérence, elles ne protègent pas contre la même chose :
//   - panne de la lecture `profils` elle-même (réseau, réponse inattendue) →
//     fail-open, l'écriture n'est jamais bloquée à cause d'une erreur
//     technique qui n'a rien à voir avec l'élève.
//   - une fois dans la branche `profilsVide` (signal POSITIF : la lecture a
//     réussi et ne renvoie aucune ligne, pas une panne), un échec de la
//     vérification prof REFUSE l'écriture plutôt que de fail-open une
//     seconde fois — sinon un compte orphelin repasserait silencieusement.
//
// Cette asymétrie est la partie « logique de sécurité subtile » du module :
// une divergence future entre les deux appelants ne produirait aucune
// erreur visible, juste un trou. D'où l'extraction ici plutôt qu'une
// copie par fichier.

export async function verifierGateEleve(user_id, supabaseUrl, serviceKey) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  let email_parent = ''
  let profilsVide = false
  try {
    const profilRes = await fetch(`${supabaseUrl}/rest/v1/profils?user_id=eq.${user_id}&select=email_parent&limit=1`, { headers })
    const profilData = await profilRes.json()
    if (Array.isArray(profilData)) {
      if (profilData.length > 0) {
        email_parent = profilData[0].email_parent || ''
      } else {
        profilsVide = true
      }
    } else {
      console.log('[auth-eleve] réponse profils inattendue, gate non appliqué (fail-open):', JSON.stringify(profilData))
    }
  } catch (e) {
    console.log('[auth-eleve] échec lecture profil, gate non appliqué (fail-open):', e.message)
  }

  if (profilsVide) {
    const estProf = await estCompteProf(user_id, supabaseUrl, serviceKey)
    if (!estProf) {
      console.log(`[auth-eleve] écriture refusée, aucune ligne profils pour user_id=${user_id}`)
      return { ok: false }
    }
  }

  return { ok: true, email_parent }
}

// Vérifie via l'API Admin Supabase (clé service) si user_id porte
// app_metadata.role === 'prof' — jamais user_metadata (modifiable par
// l'utilisateur), jamais un id codé en dur (même principe qu'ailleurs dans
// le dépôt, ex. prof.html). Les appelants de ce module ne reçoivent aucun
// JWT de session à décoder (quiz.html/examen.html postent sans
// Authorization), d'où ce détour par l'API Admin plutôt qu'une lecture
// directe du token côté client.
async function estCompteProf(user_id, supabaseUrl, serviceKey) {
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    })
    if (!r.ok) return false
    const data = await r.json()
    // Double lecture (racine ou sous .user) : la forme exacte de la réponse
    // de l'API Admin a varié selon les versions.
    return (data?.app_metadata?.role || data?.user?.app_metadata?.role) === 'prof'
  } catch (e) {
    console.log('[auth-eleve] échec vérification prof, exemption refusée:', e.message)
    return false
  }
}
