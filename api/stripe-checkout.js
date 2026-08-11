// /api/stripe-checkout.js
//
// ═══════════════════════════════════════════════════════════
// Créé le 03/08/2026 — Chantier Stripe / abonnement Suivi
//
// Rôle : recevoir la demande d'un parent connecté (depuis suivi-parent.html,
// bouton "Créer le compte de l'enfant" avec offre Suivi choisie, ou bouton
// "Passer à Suivi" sur un enfant existant), et créer une session Stripe
// Checkout pour l'abonnement Suivi (7,90€/mois, sans engagement) au nom
// d'un enfant précis.
//
// Modifié le 03/08/2026 — Adaptation architecture parent-payeur :
//   - La session vérifiée (étape 1) est désormais celle du PARENT
//     (compte OTP créé via espace-parent.html), pas celle de l'élève.
//   - L'enfant ciblé (user_id_enfant) est reçu dans le body, mais
//     TOUJOURS vérifié serveur-side : on confirme qu'il appartient
//     bien à ce parent (email_parent = email de la session) avant
//     toute action. Le client propose, le serveur vérifie — jamais
//     l'inverse.
//   - metadata.user_id (lu par stripe-webhook.js) référence l'ENFANT,
//     pas le parent qui paie — c'est son plan_actif qui doit s'activer.
//
// Sécurité :
//   - Aucun user_id n'est utilisé sans vérification. Celui de la session
//     (parent) vient de Supabase Auth. Celui de l'enfant est vérifié par
//     appartenance avant tout usage.
//   - L'email de facturation vient de la session parent authentifiée,
//     jamais d'une valeur envoyée librement par le client.
//
// Déduplication essai gratuit :
//   - Avant de créer la session, on cherche si un customer Stripe existe
//     déjà pour cet email_parent. Si oui, pas de nouvel essai gratuit
//     (le foyer en a probablement déjà bénéficié sur un autre compte
//     élève) — abonnement facturé dès la création.
//
// Modifié le 11/08/2026 — Anti-doublon d'abonnement :
//   - Avant toute création de session, si un customer Stripe existe déjà
//     pour ce foyer, on vérifie qu'aucun de ses abonnements actifs ne
//     porte déjà metadata.user_id === l'enfant ciblé. Si c'est le cas,
//     refus (409) plutôt que de créer un deuxième abonnement pour le
//     même enfant.
//
// Idempotency :
//   - Clé basée sur user_id + jour, pour éviter la création de deux
//     sessions Checkout en cas de double-clic.
//
// Convention du projet :
//   - Supabase en fetch REST direct (comme cron-rappel.js), pas de SDK.
//   - Stripe via le SDK officiel (form-encoding + future vérification
//     de signature webhook trop risqués à réimplémenter à la main).
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const SUPA_URL = process.env.SUPABASE_URL || 'https://vkkgadwqumqqwpaayjac.supabase.co'
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

const SITE_URL = 'https://www.academika.fr'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // ── Étape 1 — Authentification : vérifier le token Supabase côté serveur ──
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  let userId
  let emailSessionParent
  try {
    const userRes = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPA_KEY
      }
    })
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Session invalide' })
    }
    const userData = await userRes.json()
    userId = userData.id
    emailSessionParent = userData.email
    if (!userId || !emailSessionParent) {
      return res.status(401).json({ error: 'Session invalide' })
    }
  } catch (e) {
    console.error('Erreur vérification token Supabase:', e.message)
    return res.status(401).json({ error: 'Session invalide' })
  }

  // ── Étape 2 — Lire l'enfant ciblé, et vérifier qu'il appartient bien
  //             au parent authentifié (jamais de confiance aveugle dans
  //             le body : le client PROPOSE un user_id_enfant, le serveur
  //             VÉRIFIE qu'il est légitimement rattaché à ce parent) ──
  const userIdEnfant = req.body?.user_id_enfant
  if (!userIdEnfant) {
    return res.status(400).json({ error: 'user_id_enfant manquant' })
  }

  let emailParent
  try {
    // La session vérifiée à l'étape 1 est celle du PARENT (compte OTP,
    // email réel).
    emailParent = emailSessionParent

    const profilRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?user_id=eq.${userIdEnfant}&email_parent=eq.${encodeURIComponent(emailParent)}&select=email_parent&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${SUPA_KEY}`,
          'apikey': SUPA_KEY
        }
      }
    )
    const profils = await profilRes.json()
    if (!profils || profils.length === 0) {
      // Soit l'enfant n'existe pas, soit il n'appartient pas à ce parent —
      // dans les deux cas, refus. Ne jamais préciser lequel (évite de
      // révéler l'existence d'un profil à un tiers qui devine des IDs).
      return res.status(403).json({ error: 'Accès refusé à ce profil' })
    }
  } catch (e) {
    console.error('Erreur vérification appartenance profil:', e.message)
    return res.status(500).json({ error: 'Erreur lors de la vérification du profil' })
  }

  // ── Étape 3 — Recherche du customer Stripe du foyer (email_parent) ──
  // Une seule recherche Stripe, réutilisée pour deux vérifications :
  //   3a. cet enfant n'a-t-il pas déjà un abonnement Suivi actif ?
  //   3b. déduplication de l'essai gratuit (le foyer en a-t-il déjà
  //       bénéficié sur un autre compte élève ?)
  let customerId
  let premierEssai = true
  try {
    const existingCustomers = await stripe.customers.list({ email: emailParent, limit: 1 })
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
      premierEssai = false
    }
  } catch (e) {
    console.error('Erreur recherche customer Stripe:', e.message)
    return res.status(500).json({ error: 'Erreur lors de la vérification du compte de facturation' })
  }

  // ── Étape 3a — Cet enfant a-t-il déjà un abonnement Suivi actif ? ──
  // Empêche la création d'un doublon si le parent reclique sur "Passer à
  // Suivi" (ex. avant que plan_actif ne soit repassé à true côté Supabase
  // par le webhook, ou par onglet dupliqué).
  if (customerId) {
    try {
      const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active' })
      const dejaAbonne = activeSubs.data.some(sub => sub.metadata?.user_id === userIdEnfant)
      if (dejaAbonne) {
        return res.status(409).json({ error: 'Cet enfant a déjà un abonnement Suivi actif.' })
      }
    } catch (e) {
      console.error('Erreur vérification abonnements actifs Stripe:', e.message)
      return res.status(500).json({ error: 'Erreur lors de la vérification de l\'abonnement' })
    }
  }

  // ── Étape 4 — Idempotency (anti double-clic) ──
  // Granularité fine (timestamp), pas par jour : le bouton désactivé au clic
  // protège déjà du double-clic. Une clé basée sur le jour causait des
  // conflits Stripe entre tentatives successives avec des paramètres
  // différents (ex. dédup changeant l'essai gratuit d'un essai à l'autre).
  const idempotencyKey = `checkout_${userIdEnfant}_${Date.now()}`

  // ── Étape 5 — Création de la session Stripe Checkout ──
  try {
    const sessionParams = {
      mode: 'subscription',
      locale: 'fr',
      line_items: [
        { price: process.env.STRIPE_PRICE_SUIVI, quantity: 1 }
      ],
      metadata: { user_id: userIdEnfant },
      subscription_data: {
        metadata: { user_id: userIdEnfant }
      },
      success_url: `${SITE_URL}/abonnement-confirme.html?enfant=${userIdEnfant}`,
      cancel_url: `${SITE_URL}/suivi-parent.html`
    }

    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = emailParent
    }

    if (premierEssai) {
      sessionParams.subscription_data.trial_period_days = 14
    }

    const session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Erreur création session Stripe Checkout:', e.message)
    return res.status(500).json({ error: 'Erreur lors de la création du paiement' })
  }
}
