// /api/stripe-checkout.js
//
// ═══════════════════════════════════════════════════════════
// Créé le 03/08/2026 — Chantier Stripe / abonnement Suivi
//
// Rôle : recevoir la demande d'un parent connecté ("Commencer mon essai
// gratuit"), et créer une session Stripe Checkout pour l'abonnement
// Suivi (7,90€/mois, sans engagement).
//
// Sécurité :
//   - Le user_id n'est JAMAIS lu depuis le body de la requête. Il est
//     dérivé du token de session Supabase, vérifié ici côté serveur
//     via l'API Auth Supabase (/auth/v1/user).
//   - L'email de facturation vient de la table profils (email_parent),
//     jamais d'une valeur envoyée par le client.
//
// Déduplication essai gratuit :
//   - Avant de créer la session, on cherche si un customer Stripe existe
//     déjà pour cet email_parent. Si oui, pas de nouvel essai gratuit
//     (le foyer en a probablement déjà bénéficié sur un autre compte
//     élève) — abonnement facturé dès la création.
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
    if (!userId) {
      return res.status(401).json({ error: 'Session invalide' })
    }
  } catch (e) {
    console.error('Erreur vérification token Supabase:', e.message)
    return res.status(401).json({ error: 'Session invalide' })
  }

  // ── Étape 2 — Récupération du profil (email de facturation réel) ──
  let emailParent
  try {
    const profilRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?user_id=eq.${userId}&select=email_parent,prenom_affiche&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${SUPA_KEY}`,
          'apikey': SUPA_KEY
        }
      }
    )
    const profils = await profilRes.json()
    if (!profils || profils.length === 0 || !profils[0].email_parent) {
      return res.status(404).json({ error: 'Profil introuvable' })
    }
    emailParent = profils[0].email_parent
  } catch (e) {
    console.error('Erreur récupération profil:', e.message)
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil' })
  }

  // ── Étape 3 — Déduplication : essai gratuit déjà utilisé pour cet email ? ──
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

  // ── Étape 4 — Idempotency (anti double-clic) ──
  const jour = new Date().toISOString().slice(0, 10)
  const idempotencyKey = `checkout_${userId}_${jour}`

  // ── Étape 5 — Création de la session Stripe Checkout ──
  try {
    const sessionParams = {
      mode: 'subscription',
      line_items: [
        { price: process.env.STRIPE_PRICE_SUIVI, quantity: 1 }
      ],
      metadata: { user_id: userId },
      success_url: `${SITE_URL}/abonnement-confirme.html`,
      cancel_url: `${SITE_URL}/abonnement.html`
    }

    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = emailParent
    }

    if (premierEssai) {
      sessionParams.subscription_data = { trial_period_days: 14 }
    }

    const session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Erreur création session Stripe Checkout:', e.message)
    return res.status(500).json({ error: 'Erreur lors de la création du paiement' })
  }
}
