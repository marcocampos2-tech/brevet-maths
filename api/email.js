// /api/email.js

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
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
  // RESET MOT DE PASSE — isolé, retour immédiat
  // ═══════════════════════════════════════════
  if (req.body?.type === 'reset-password') {
    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
    const RESEND_KEY = process.env.RESEND_API_KEY
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

    const { email_parent } = req.body
    if (!email_parent) return res.status(400).json({ error: 'Email requis' })

    const reponseUniforme = { success: true, message: 'Si un compte existe avec cet email, un lien a été envoyé.' }

    try {
      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?email_parent=eq.${encodeURIComponent(email_parent)}&select=faux_email,derniere_demande_reset`,
        { headers }
      )
      const profils = await profilRes.json()

      if (!profils || profils.length === 0) {
        return res.status(200).json(reponseUniforme)
      }

      const { faux_email, derniere_demande_reset } = profils[0]

      if (derniere_demande_reset) {
        const diffMinutes = (new Date() - new Date(derniere_demande_reset)) / 60000
        if (diffMinutes < 3) {
          return res.status(200).json(reponseUniforme)
        }
      }

      const linkRes = await fetch(`${SUPA_URL}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'recovery',
          email: faux_email,
          options: { redirectTo: 'https://www.academika.fr/index.html' }
        })
      })
      const linkData = await linkRes.json()
      const lienReset = linkData?.action_link || linkData?.properties?.action_link

      if (!lienReset) {
        console.log('Erreur génération lien:', JSON.stringify(linkData))
        return res.status(200).json(reponseUniforme)
      }

      const rateOk = await verifierRateLimit(email_parent)
      if (!rateOk) return res.status(429).json({ error: 'Trop de demandes pour cette adresse. Réessayez plus tard.' })

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
              <p style="margin-bottom:16px">Bonjour,</p>
              <p style="color:#444;line-height:1.6;margin-bottom:20px">Une demande de réinitialisation de mot de passe a été effectuée pour votre compte ACADEMIKA.</p>
              <div style="text-align:center;margin:28px 0">
                <a href="${lienReset}" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
                  Choisir un nouveau mot de passe →
                </a>
              </div>
              <p style="color:#444;line-height:1.6;margin-bottom:20px">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
              <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
                <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
              </div>
            </div>
          `
        })
      })

      await fetch(`${SUPA_URL}/rest/v1/profils?email_parent=eq.${encodeURIComponent(email_parent)}`, {
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
    const { emailParent, prenom, nom, date, heure, adresse, messageCompl, sousType } = req.body
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
    const { emailParent, prenom, nom, libelle, sousType } = req.body
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
  // BILAN PARENTS (bouton "Envoyer bilan" prof.html)
  // ═══════════════════════════════════════════
  if (req.body?.type === 'bilan') {
    try {
      const { emailParent, prenom, nom, moyGlobale, totalSessions, tempsTotal, themes, topRatees } = req.body
      const moyNote20 = (moyGlobale / 100 * 20).toFixed(1).replace('.0', '')

      const couleur = moyGlobale >= 80 ? '#16a34a' : moyGlobale >= 60 ? '#3730a3' : moyGlobale >= 40 ? '#f59e0b' : '#dc2626'
      const mention = moyGlobale >= 80 ? '🌟 Excellent !' : moyGlobale >= 60 ? '👍 Bien !' : moyGlobale >= 40 ? '💪 Continue !' : '📚 À retravailler'

      const h = Math.floor(tempsTotal/3600)
      const m = Math.floor((tempsTotal%3600)/60)
      const tempsFormat = h > 0 ? `${h}h ${m}min` : `${m} min`

      const themesHTML = Object.entries(themes).map(([theme, s]) => {
        const pct = Math.round((s.ok/s.tot)*100)
        const couleurTheme = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'
        return `<tr>
          <td style="padding:8px;color:#555;border-bottom:1px solid #f0f0ec">${esc(theme)}</td>
          <td style="padding:8px;font-weight:600;color:${couleurTheme};border-bottom:1px solid #f0f0ec">${pct}%</td>
          <td style="padding:8px;color:#999;border-bottom:1px solid #f0f0ec;font-size:12px">${s.n} session(s)</td>
        </tr>`
      }).join('')

      const messageMotivation = moyGlobale >= 40
        ? `Bonne nouvelle : <strong>${esc(prenom)} progresse !</strong><br>Encouragez-le à continuer sur les thèmes à améliorer.`
        : `<strong>${esc(prenom)}</strong> traverse une période plus difficile sur ces notions.<br>Un encouragement et un peu de temps supplémentaire sur les thèmes ci-dessous peuvent faire la différence.`

      const rateesHTML = topRatees && topRatees.length > 0
        ? `<div style="margin-top:20px">
            <p style="font-weight:600;margin-bottom:8px">📚 Points à améliorer :</p>
            <ul style="padding-left:20px;color:#555;margin:0">
              ${topRatees.map(([q]) => `<li style="margin-bottom:6px">${esc(q)}</li>`).join('')}
            </ul>
          </div>`
        : `<p style="color:#16a34a;margin-top:20px;font-weight:600">✅ Aucune notion particulièrement en difficulté !</p>`

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Bilan de progression</div>
          </div>
          <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Voici le bilan de progression de <strong>${esc(prenom)}${nom ? ' ' + esc(nom) : ''}</strong> sur ACADEMIKA.
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
            <div style="font-size:56px;font-weight:700;color:${couleur}">${moyNote20}<span style="font-size:24px;color:#999">/20</span></div>
            <div style="font-size:18px;margin-top:8px">${mention} — ${moyGlobale}%</div>
            <div style="font-size:13px;color:#666;margin-top:8px">${totalSessions} sessions · ${tempsFormat} de révision</div>
          </div>
          <p style="color:#444;margin-bottom:16px;">${messageMotivation}</p>
          <h3 style="font-size:14px;font-weight:600;margin-bottom:8px">📊 Résultats par thème :</h3>
          <table style="width:100%;border-collapse:collapse">${themesHTML}</table>
          ${rateesHTML}
          <div style="text-align:center;margin:28px 0">
            <a href="https://www.academika.fr/espace-parent.html" style="background:#3730a3;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
              Voir le suivi complet dans l'espace parent →
            </a>
          </div>
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

      const rateOk = await verifierRateLimit(emailParent)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `📊 Bilan de progression de ${prenom} — ACADEMIKA`, html })
      })

      const responseData = await response.json()
      if (!response.ok) return res.status(500).json({ error: 'Erreur : ' + JSON.stringify(responseData) })
      return res.status(200).json({ success: true })
    } catch(e) {
      console.log('Erreur bilan:', e.message)
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // BREVET BLANC — résultats examen (envoyé automatiquement depuis examen.html)
  // ═══════════════════════════════════════════
  if (req.body?.type === 'brevet-blanc') {
    try {
      const { emailParent, prenom, nom, score, total, pct, scoresThemes, tempsSecondes } = req.body

      const couleurScore = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'
      const mention = pct >= 80 ? '🌟 Excellent' : pct >= 70 ? '👍 Très bon' : pct >= 60 ? '✅ Bon' : pct >= 50 ? '📋 Correct' : '📚 À retravailler'
      const messageMotivation = pct >= 50
        ? `Bonne nouvelle : <strong>${esc(prenom)}</strong> a réussi son examen en ligne ! Encouragez-le à continuer sur les thèmes à améliorer.`
        : `<strong>${esc(prenom)}</strong> n'a pas encore le niveau requis. C'est normal — c'est un entraînement ! Encouragez-le à continuer à réviser régulièrement.`

      const m = Math.floor(tempsSecondes / 60)
      const s = tempsSecondes % 60
      const tempsFormat = `${m} min ${s} sec`

      const themesHTML = scoresThemes ? Object.entries(scoresThemes).map(([theme, s]) => {
        const tp = Math.round((s.ok / s.total) * 100)
        const tc = tp >= 60 ? '#16a34a' : tp >= 40 ? '#f59e0b' : '#dc2626'
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0ec">
          <span style="font-size:13px;color:#444">${esc(theme)}</span>
          <span style="font-weight:700;color:${tc}">${s.ok}/${s.total} (${tp}%)</span>
        </div>`
      }).join('') : ''

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
            <div style="font-size:56px;font-weight:700;color:${couleurScore}">${score}/20</div>
            <div style="font-size:24px;font-weight:600;color:${couleurScore};margin-top:4px">${pct}%</div>
            <div style="font-size:18px;margin-top:8px">${mention}</div>
            <div style="font-size:13px;color:#666;margin-top:8px">⏱️ ${tempsFormat}</div>
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

      const rateOk = await verifierRateLimit(emailParent)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `📝 ${prenom} a obtenu ${score}/20 à l'Examen en ligne — ACADEMIKA`, html })
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
      const { prenom, nom, emailParent } = req.body
      const PROF_EMAIL = 'contact@academika.fr'

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

      const htmlParents = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Bienvenue !</div>
          </div>
          <p style="margin-bottom:16px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Votre enfant <strong>${esc(prenom)} ${esc(nom)}</strong> vient de s'inscrire sur ACADEMIKA,
            une application de révision en mathématiques pour le Brevet des collèges.
          </p>
          <div style="background:#eef2ff;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="font-weight:600;margin-bottom:12px;color:#3730a3">Comment ça fonctionne :</p>
            <p style="margin-bottom:8px;font-size:14px;">🎯 Quiz ciblés par sous-thème, corrections détaillées</p>
            <p style="margin-bottom:8px;font-size:14px;">📝 Examen en ligne, façon QCM du brevet</p>
            <p style="margin-bottom:0;font-size:14px;">🔓 Niveaux Facile, Moyen, Difficile à débloquer progressivement</p>
          </div>
          <p style="color:#444;margin-bottom:20px;">
            Votre enfant peut commencer maintenant sur :<br>
            <a href="https://www.academika.fr" style="color:#3730a3;font-weight:600;text-decoration:none;">👉 www.academika.fr</a>
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="font-weight:600;margin-bottom:8px;color:#1a1a1a">👪 Votre espace parent</p>
            <p style="font-size:14px;color:#444;margin-bottom:14px">Suivez à tout moment l'activité et la progression de votre enfant, sans mot de passe à retenir.</p>
            <a href="https://www.academika.fr/espace-parent.html" style="display:inline-block;background:#3730a3;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Accéder à l'espace parent →</a>
          </div>
          <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:8px;">
              Pour toute question, contactez-nous : 
              <a href="mailto:${PROF_EMAIL}" style="color:#3730a3;text-decoration:none;font-weight:500">${PROF_EMAIL}</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(emailParent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

      // Le rate-limit ne compte que l'email envoyé au parent — l'email interne
      // vers PROF_EMAIL n'est pas une adresse externe soumise à abus.
      const rateOk = await verifierRateLimit(emailParent)
      if (!rateOk) return res.status(429).json({ error: 'Trop d\'emails envoyés à cette adresse. Réessayez plus tard.' })

      await Promise.all([
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({ from: 'noreply@academika.fr', to: PROF_EMAIL, subject: `🎓 Nouvel élève inscrit : ${prenom} ${nom} — ACADEMIKA`, html: htmlProf })
        }),
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `🎓 Bienvenue sur ACADEMIKA — ${prenom} ${nom}`, html: htmlParents })
        })
      ])

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
    const { emailParent, prenom, nom, date, note, commentaire } = req.body
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
        <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
          <a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(emailParent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
        </p>
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
  // Déclenché par : 1) le client (logout/terminer), 2) le job de rattrapage (cron-rappel.js)
  // Remplace le calcul qui était fait côté client dans quiz.html (envoyerRecapJournalier)
  // ═══════════════════════════════════════════
  if (req.body?.type === 'recap-journalier-user') {
    const { user_id } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id manquant' })

    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
    const supaHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPA_KEY}`,
      'apikey': SUPA_KEY
    }

    try {
      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/profils?user_id=eq.${user_id}&select=prenom_affiche,email_parent,email_actif&limit=1`,
        { headers: supaHeaders }
      )
      const profils = await profilRes.json()
      if (!profils || profils.length === 0) {
        return res.status(200).json({ success: true, skip: 'profil introuvable' })
      }
      const { prenom_affiche, email_parent, email_actif } = profils[0]
      if (!email_parent || email_actif === false) {
        return res.status(200).json({ success: true, skip: 'email parent absent ou désactivé' })
      }

      const maintenant = new Date()
      const dateParisStr = maintenant.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      const sessionsRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}` +
        `&select=id,theme,sous_theme,difficulte,score,total,temps_secondes,questions_ratees,created_at,alerte_envoyee` +
        `&order=created_at.asc`,
        { headers: supaHeaders }
      )
      const toutesSessions = await sessionsRes.json()

      const sessionsDuJour = (toutesSessions || []).filter(s => {
        const dateSessionParis = new Date(s.created_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
        return dateSessionParis === dateParisStr
      })

      if (sessionsDuJour.length === 0) {
        return res.status(200).json({ success: true, skip: 'aucune session aujourd\'hui' })
      }

      const sessionsNonCouvertes = sessionsDuJour.filter(s => s.alerte_envoyee !== true)
      if (sessionsNonCouvertes.length === 0) {
        return res.status(200).json({ success: true, skip: 'déjà envoyé aujourd\'hui' })
      }

      const totalSessions = sessionsDuJour.length
      const scoreTotal = sessionsDuJour.reduce((a, s) => a + (s.score || 0), 0)
      const totalTotal = sessionsDuJour.reduce((a, s) => a + (s.total || 0), 0)
      const moyGlobale = totalTotal > 0 ? Math.round((scoreTotal / totalTotal) * 100) : 0
      const tempsSecondes = sessionsDuJour.reduce((a, s) => a + (s.temps_secondes || 0), 0)
      const pct = moyGlobale

      const ORDRE_NIVEAUX = { facile: 1, moyen: 2, difficile: 3 }
      const sousThemesDetail = {}
      sessionsDuJour.forEach(s => {
        if (!s.sous_theme) return
        if (!sousThemesDetail[s.sous_theme]) {
          sousThemesDetail[s.sous_theme] = { ok: 0, total: 0, niveau: s.difficulte }
        }
        sousThemesDetail[s.sous_theme].ok += (s.score || 0)
        sousThemesDetail[s.sous_theme].total += (s.total || 0)
        if (ORDRE_NIVEAUX[s.difficulte] > ORDRE_NIVEAUX[sousThemesDetail[s.sous_theme].niveau]) {
          sousThemesDetail[s.sous_theme].niveau = s.difficulte
        }
      })

      const questionsRatees = sessionsDuJour
        .flatMap(s => s.questions_ratees || [])
        .filter(q => typeof q === 'string' && !q.includes('abandonné'))

      const prenom = prenom_affiche || ''
      const lienDesabonnement = `https://academika.fr/desabonner.html?email=${encodeURIComponent(email_parent)}`
      const m = Math.floor(tempsSecondes / 60)
      const s2 = tempsSecondes % 60
      const tempsFormat = m === 0 ? `${s2} sec` : `${m} min ${s2} sec`

      let html = ''
      let sujet = ''

      if (pct >= 40) {
        const entries = Object.entries(sousThemesDetail)
        const badgesData = entries.map(([nomSt, d]) => {
          const p = d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0
          return { nom: esc(nomSt), pct: p, acquis: p >= 70, niveau: d.niveau }
        })
        const nbAcquis = badgesData.filter(b => b.acquis).length
        const nbARevoir = badgesData.length - nbAcquis
        const messagePrincipal = badgesData.length === 0
          ? `${esc(prenom)} a travaillé aujourd'hui`
          : (nbAcquis >= badgesData.length / 2 ? `${esc(prenom)} a bien travaillé aujourd'hui` : `${esc(prenom)} a un peu buté aujourd'hui`)

        const NIVEAU_LABEL = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' }
        const badgesHTML = badgesData.map(b => {
          const bg = b.acquis ? '#EAF6EF' : '#FBF4E4'
          const fg = b.acquis ? '#1f7a45' : '#8a6416'
          const label = b.acquis ? 'Acquis' : 'À revoir'
          const niveauLabel = NIVEAU_LABEL[b.niveau] || ''
          return `<table style="width:100%;border-collapse:collapse;margin-bottom:8px"><tr style="background:${bg};border-radius:8px">
            <td style="padding:10px 12px;font-size:13px;color:${fg}">${b.nom}${niveauLabel ? ` <span style="font-size:11px;opacity:0.75">· ${niveauLabel}</span>` : ''}</td>
            <td style="padding:10px 12px;font-size:12px;font-weight:600;color:${fg};text-align:right;white-space:nowrap">${label}</td>
          </tr></table>`
        }).join('')

        const listeAcquis = badgesData.filter(b => b.acquis).map(b => b.nom).join(', ')
        const listeARevoir = badgesData.filter(b => !b.acquis).map(b => b.nom).join(', ')
        const phraseSynthese = badgesData.length === 0
          ? `Continuez à l'encourager !`
          : nbARevoir === 0
            ? `Bravo, tout est acquis aujourd'hui !`
            : nbAcquis === 0
              ? `Un petit coup de pouce sur ${listeARevoir} serait utile.`
              : `Bravo pour ${listeAcquis} ! Un petit coup de pouce sur ${listeARevoir} serait utile.`

        sujet = `${prenom} a travaillé aujourd'hui — ACADEMIKA`

        html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
              <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
            </div>
            <p style="margin-bottom:10px">Bonjour,</p>
            <p style="font-size:15px;font-weight:600;margin:0 0 4px">${messagePrincipal}.</p>
            <p style="font-size:12px;color:#888;margin:0 0 20px">${totalSessions} session${totalSessions>1?'s':''} · ${tempsFormat} · moyenne ${moyGlobale}%</p>
            <p style="color:#aaa;font-size:11px;margin:0 0 14px">Acquis : au moins 70% de bonnes réponses aujourd'hui sur ce sous-thème. À revoir : moins de 70%.</p>
            ${badgesHTML}
            <p style="color:#444;line-height:1.6;margin-top:14px">${phraseSynthese}</p>
            <div style="text-align:center;margin:24px 0 4px">
              <a href="https://www.academika.fr/espace-parent.html" style="color:#3730a3;text-decoration:none;font-weight:600;font-size:13px">👪 Consulter le suivi complet dans l'espace parent →</a>
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

      } else {
        sujet = `⚠️ ${prenom} a eu des difficultés aujourd'hui — ACADEMIKA`

        const rateesHTML = questionsRatees.length > 0
          ? `<div style="margin-top:16px">
              <p style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">📚 Points à retravailler :</p>
              ${questionsRatees.slice(0,5).map(q => `
                <div style="font-size:13px;color:#666;padding:4px 0">
                  • ${esc(q)}
                </div>`).join('')}
            </div>`
          : ''

        html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
              <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Suivi de révision</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <p style="margin-bottom:20px;color:#444">
              <strong>${esc(prenom)}</strong> a passé ${totalSessions} session${totalSessions>1?'s':''} de révision aujourd'hui
              qui nécessite${totalSessions>1?'nt':''} votre attention :
            </p>
            <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <div style="font-size:24px;font-weight:700;color:#dc2626">
                ${scoreTotal}/${totalTotal} — ${pct}%
              </div>
              <div style="font-size:12px;color:#888;margin-top:4px">⏱️ ${tempsFormat}</div>
            </div>
            ${rateesHTML}
            <p style="color:#444;line-height:1.6;margin-top:20px">
              Un encouragement ce soir peut faire toute la différence !
              <strong>10 minutes par jour</strong> suffisent pour progresser.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="https://www.academika.fr/espace-parent.html" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
                Voir ses résultats complets →
              </a>
            </div>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:contact@academika.fr" style="color:#3730a3">contact@academika.fr</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="${lienDesabonnement}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`
      }

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

      await Promise.all(
        sessionsNonCouvertes.map(s =>
          fetch(`${SUPA_URL}/rest/v1/resultats?id=eq.${s.id}`, {
            method: 'PATCH',
            headers: { ...supaHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ alerte_envoyee: true })
          })
        )
      )

      return res.status(200).json({ success: true, envoye: true, totalSessions, moyGlobale })

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
      const { emailParent, prenom, dateFin } = req.body
      if (!emailParent || !dateFin) return res.status(400).json({ error: 'Champs manquants' })

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Résiliation confirmée</div>
          </div>
          <p style="margin-bottom:16px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Nous confirmons la résiliation de l'abonnement Suivi${prenom ? ` de <strong>${esc(prenom)}</strong>` : ''}, à votre demande.
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="margin-bottom:8px;font-size:14px;color:#444;">✅ Le service Suivi reste actif jusqu'au <strong>${esc(dateFin)}</strong>.</p>
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
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="https://academika.fr/desabonner.html?email=${encodeURIComponent(emailParent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
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
  // Type non reconnu
  // ═══════════════════════════════════════════
  return res.status(400).json({ error: 'Type de requête non reconnu ou manquant' })
}
