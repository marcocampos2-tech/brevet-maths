// /api/stripe-portal.js
//
// ═══════════════════════════════════════════════════════════
// Créé le 11/08/2026 — Chantier Stripe / gestion d'abonnement
//
// Rôle : recevoir la demande d'un parent connecté (depuis suivi-parent.html)
// souhaitant gérer un abonnement Suivi déjà actif (moyen de paiement,
// annulation, historique de facturation), et créer une session du
// Portail client Stripe (Billing Portal) pointant vers son compte
// customer existant.
//
// Sécurité :
//   - Même pattern d'authentification que stripe-checkout.js (étape 1) :
//     le token du parent est vérifié auprès de Supabase Auth
//     (/auth/v1/user), jamais fait confiance à un email envoyé librement
//     par le client.
//   - Le customer Stripe est recherché par l'email de la session parent
//     authentifiée, jamais par un identifiant transmis dans le body.
//
// Convention du projet : Stripe via le SDK officiel.
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

  let emailParent
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
    emailParent = userData.email
    if (!userData.id || !emailParent) {
      return res.status(401).json({ error: 'Session invalide' })
    }
  } catch (e) {
    console.error('Erreur vérification token Supabase:', e.message)
    return res.status(401).json({ error: 'Session invalide' })
  }

  // ── Étape 2 — Retrouver le customer Stripe de ce parent ──
  let customerId
  try {
    const existingCustomers = await stripe.customers.list({ email: emailParent, limit: 1 })
    if (existingCustomers.data.length === 0) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé pour ce compte.' })
    }
    customerId = existingCustomers.data[0].id
  } catch (e) {
    console.error('Erreur recherche customer Stripe:', e.message)
    return res.status(500).json({ error: 'Erreur lors de la vérification du compte de facturation' })
  }

  // ── Étape 3 — Création de la session du Portail client Stripe ──
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/suivi-parent.html`
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Erreur création session Stripe Billing Portal:', e.message)
    return res.status(500).json({ error: 'Erreur lors de l\'ouverture de l\'espace de gestion' })
  }
}
