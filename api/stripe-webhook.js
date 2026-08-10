// /api/stripe-webhook.js
//
// ═══════════════════════════════════════════════════════════
// Créé le 03/08/2026 — Chantier Stripe / abonnement Suivi
//
// Rôle : recevoir la notification de Stripe quand un paiement Suivi
// est confirmé (invoice.payment_succeeded), et activer plan_actif
// dans profils. C'est la SEULE source de vérité pour l'activation
// du plan — jamais le front, jamais stripe-checkout.js.
//
// Sécurité — point critique :
//   - Stripe calcule sa signature contre les octets bruts exacts du
//     corps de la requête. Si Vercel parse le body en JSON avant qu'on
//     le vérifie, la signature ne correspond plus jamais : il faut
//     désactiver le bodyParser automatique (export const config
//     ci-dessous) et lire le corps brut manuellement.
//   - user_id est lu depuis les métadonnées Stripe (posées par
//     stripe-checkout.js au moment de la création de la session),
//     jamais depuis une source côté client. C'est la seule donnée
//     d'identité autoritaire à ce stade de la chaîne.
//
// Événements écoutés :
//   - invoice.payment_succeeded (déjà validé comme événement de
//     référence — pas checkout.session.completed seul, qui ne garantit
//     pas qu'un paiement a effectivement eu lieu) → active plan_actif
//   - customer.subscription.deleted → désactive plan_actif quand
//     l'abonnement est annulé côté Stripe
//
// Convention du projet : Supabase en fetch REST direct (comme
// cron-rappel.js), SDK officiel pour Stripe.
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const SUPA_URL = process.env.SUPABASE_URL || 'https://vkkgadwqumqqwpaayjac.supabase.co'
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

// Désactive le body parsing automatique de Vercel — indispensable pour
// que la vérification de signature Stripe fonctionne en production.
export const config = {
  api: {
    bodyParser: false
  }
}

// Lecture manuelle du corps brut de la requête. Pas de dépendance externe :
// le package "micro" a été envisagé puis écarté — sa propre documentation
// précise qu'il n'est pas nécessaire sur Vercel (pensé pour des containers,
// pas pour le serverless), et il n'est plus maintenu depuis 2021.
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // ── Étape 1 — Lire le corps brut et vérifier la signature Stripe ──
  const signature = req.headers['stripe-signature']
  let event

  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    console.error('Signature webhook invalide:', e.message)
    return res.status(400).json({ error: 'Signature invalide' })
  }

  // ── Étape 2 — Router selon le type d'événement ──

  if (event.type === 'invoice.payment_succeeded') {

    // ── Étape 3 — Extraire user_id depuis les métadonnées de la subscription ──
    let userId
    try {
      const invoice = event.data.object
      // Le champ invoice.subscription est déprécié depuis l'API
      // 2025-03-31.basil, remplacé par invoice.parent.subscription_details.
      // On gère les deux formats pour être robuste indépendamment de la
      // version d'API effectivement utilisée par le SDK au moment de l'appel.
      const subscriptionId = invoice.subscription
        || (invoice.parent?.type === 'subscription_details' ? invoice.parent.subscription_details?.subscription : null)

      if (!subscriptionId) {
        console.error('Facture sans subscription associée, event id:', event.id)
        return res.status(200).json({ received: true, skipped: 'pas de subscription' })
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      userId = subscription.metadata?.user_id

      if (!userId) {
        console.error('Aucun user_id dans les métadonnées de la subscription:', subscriptionId)
        return res.status(200).json({ received: true, skipped: 'pas de user_id' })
      }
    } catch (e) {
      console.error('Erreur récupération subscription Stripe:', e.message)
      return res.status(500).json({ error: 'Erreur lors de la lecture de la subscription' })
    }

    // ── Étape 4 — Activer plan_actif dans Supabase ──
    try {
      const updateRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPA_KEY}`,
            'apikey': SUPA_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ plan_actif: true })
        }
      )

      if (!updateRes.ok) {
        const errText = await updateRes.text()
        console.error('Erreur mise à jour plan_actif:', errText)
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' })
      }
    } catch (e) {
      console.error('Erreur réseau mise à jour Supabase:', e.message)
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' })
    }

    // ── Étape 5 — Répondre rapidement à Stripe ──
    return res.status(200).json({ received: true, user_id: userId, plan_actif: true })
  }

  if (event.type === 'customer.subscription.deleted') {

    // ── Étape 3 — Extraire user_id depuis les métadonnées de la subscription ──
    // L'objet de l'événement EST directement la subscription (contrairement
    // à invoice.payment_succeeded) — pas besoin d'appeler
    // stripe.subscriptions.retrieve().
    const subscription = event.data.object
    const userId = subscription.metadata?.user_id

    if (!userId) {
      console.error('Aucun user_id dans les métadonnées de la subscription supprimée:', subscription.id)
      return res.status(200).json({ received: true, skipped: 'pas de user_id' })
    }

    // ── Étape 4 — Désactiver plan_actif dans Supabase ──
    try {
      const updateRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPA_KEY}`,
            'apikey': SUPA_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ plan_actif: false })
        }
      )

      if (!updateRes.ok) {
        const errText = await updateRes.text()
        console.error('Erreur mise à jour plan_actif (annulation):', errText)
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' })
      }
    } catch (e) {
      console.error('Erreur réseau mise à jour Supabase (annulation):', e.message)
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' })
    }

    // ── Étape 5 — Répondre rapidement à Stripe ──
    return res.status(200).json({ received: true, user_id: userId, plan_actif: false })
  }

  // 200 pour que Stripe ne retente pas — on n'écoute que ces deux
  // événements, recevoir autre chose ici serait une anomalie de
  // configuration, pas une erreur côté serveur.
  return res.status(200).json({ received: true, ignored: event.type })
}
