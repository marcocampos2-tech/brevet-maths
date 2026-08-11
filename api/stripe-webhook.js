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
//   - customer.subscription.updated → détecte la transition précise
//     "annulation programmée" (cancel_at_period_end false → true) pour
//     envoyer une confirmation de résiliation immédiate. Nécessaire car
//     le portail client Stripe annule "à la fin de la période de
//     facturation" : customer.subscription.deleted ne se déclenche que
//     des semaines plus tard, trop tard pour une confirmation au moment
//     de la demande.
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

  if (event.type === 'customer.subscription.updated') {

    // ── Étape 3 — Extraire user_id depuis les métadonnées de la subscription ──
    // L'objet de l'événement EST directement la subscription (comme pour
    // customer.subscription.deleted) — pas besoin de
    // stripe.subscriptions.retrieve().
    const subscription = event.data.object
    const userId = subscription.metadata?.user_id

    if (!userId) {
      console.error('Aucun user_id dans les métadonnées de la subscription mise à jour:', subscription.id)
      return res.status(200).json({ received: true, skipped: 'pas de user_id' })
    }

    // ── Étape 4 — Ne réagir qu'à la transition précise "annulation
    //             programmée" (cancel_at_period_end false → true) ──
    // Un customer.subscription.updated se déclenche pour bien d'autres
    // raisons (changement de moyen de paiement, etc.) — on n'agit que sur
    // ce passage précis, jamais sur l'événement en général.
    const estAnnulationProgrammee = subscription.cancel_at_period_end === true
      && event.data.previous_attributes?.cancel_at_period_end === false

    if (!estAnnulationProgrammee) {
      return res.status(200).json({ received: true, skipped: 'pas une transition d\'annulation' })
    }

    // ── Étape 5 — Récupérer email_parent et prenom_affiche de l'enfant ──
    let emailParent, prenom
    try {
      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?user_id=eq.${userId}&select=email_parent,prenom_affiche`,
        {
          headers: {
            'Authorization': `Bearer ${SUPA_KEY}`,
            'apikey': SUPA_KEY
          }
        }
      )
      const profils = await profilRes.json()
      if (!profils || profils.length === 0) {
        console.error('Profil introuvable pour la confirmation de résiliation:', userId)
        return res.status(200).json({ received: true, skipped: 'profil introuvable' })
      }
      emailParent = profils[0].email_parent
      prenom = profils[0].prenom_affiche
    } catch (e) {
      console.error('Erreur récupération profil pour confirmation résiliation:', e.message)
      return res.status(500).json({ error: 'Erreur lors de la lecture du profil' })
    }

    // ── Étape 6 — Envoyer l'email de confirmation de résiliation ──
    // Pas de mécanisme anti-doublon ici (sujet traité globalement dans le
    // futur chantier d'idempotency C1/C2, pas dans ce commit) : un retry
    // Stripe sur cet événement renverrait un second email, risque accepté.
    try {
      const dateFin = new Date(subscription.current_period_end * 1000)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

      const emailRes = await fetch(`https://${req.headers.host}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'resiliation-confirmee', emailParent, prenom, dateFin })
      })

      if (!emailRes.ok) {
        const errText = await emailRes.text()
        console.error('Erreur envoi email confirmation résiliation:', errText)
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation' })
      }
    } catch (e) {
      console.error('Erreur réseau envoi email confirmation résiliation:', e.message)
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation' })
    }

    // ── Étape 7 — Répondre rapidement à Stripe ──
    return res.status(200).json({ received: true, user_id: userId, resiliation_programmee: true })
  }

  // 200 pour que Stripe ne retente pas — on n'écoute que ces trois
  // événements, recevoir autre chose ici serait une anomalie de
  // configuration, pas une erreur côté serveur.
  return res.status(200).json({ received: true, ignored: event.type })
}
