// /api/email.js
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

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'ACADEMIKA <noreply@academika.fr>',
          to: email_parent,
          subject: '🔑 Réinitialisation de mot de passe — ACADEMIKA',
          html: `
            <h2>Réinitialisation de mot de passe</h2>
            <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte ACADEMIKA.</p>
            <p><a href="${lienReset}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
            <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
            <br>
            <p>Cordialement,<br>ACADEMIKA</p>
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
    const { emailParent, prenom, nom, date, adresse, messageCompl, sousType } = req.body
    if (!emailParent || !prenom) return res.status(400).json({ error: 'Champs manquants' })

    let subject, html
    if (sousType === 'refus') {
      subject = `Inscription Examen Blanc Brevet — ${prenom}`
      html = `
        <h2>Inscription Examen Blanc — Information</h2>
        <p>Bonjour,</p>
        <p>Nous avons bien reçu la demande d'inscription de <strong>${prenom} ${nom}</strong> pour la session du <strong>${date}</strong>.</p>
        <p>Malheureusement, cette session est complète. Nous ne pouvons pas confirmer cette inscription.</p>
        <p>Si l'autre date vous convient, n'hésitez pas à vous réinscrire sur <strong>academika.fr</strong>.</p>
        <p>Contact : <strong>06 26 53 90 13</strong></p>
        <br>
        <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
      `
    } else if (sousType === 'annulation') {
      subject = `Annulation Examen Blanc Brevet — ${prenom}`
      html = `
        <h2>Annulation — Examen Blanc Brevet</h2>
        <p>Bonjour,</p>
        <p>Nous vous informons que l'inscription de <strong>${prenom} ${nom}</strong> pour la session du <strong>${date}</strong> a été annulée.</p>
        <p>Pour toute question, contactez-nous au <strong>06 26 53 90 13</strong>.</p>
        <br>
        <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
      `
    } else {
      if (!adresse) return res.status(400).json({ error: 'Adresse manquante' })
      subject = `✅ Inscription confirmée — Examen Blanc Brevet — ${prenom}`
      html = `
        <h2>✅ Inscription confirmée — Adresse communiquée</h2>
        <p>Bonjour,</p>
        <p>L'inscription de <strong>${prenom} ${nom}</strong> pour l'examen blanc est confirmée :</p>
        <div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0">
          <p><strong>📅 Date :</strong> ${date} · 15h00</p>
          <p><strong>📍 Adresse :</strong> ${adresse}</p>
          ${messageCompl ? `<p><strong>ℹ️ Infos :</strong> ${messageCompl}</p>` : ''}
        </div>
        <p>Merci d'arriver 5 minutes avant. Prévoir stylo et calculatrice.</p>
        <p>Contact : <strong>06 26 53 90 13</strong></p>
        <br>
        <p>Cordialement,<br>Ingénieur · Cours particuliers · ACADEMIKA</p>
      `
    }

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({ from: 'ACADEMIKA <noreply@academika.fr>', to: emailParent, subject, html })
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

      const couleur = moyGlobale >= 80 ? '#16a34a' : moyGlobale >= 60 ? '#3730a3' : moyGlobale >= 40 ? '#f59e0b' : '#dc2626'
      const mention = moyGlobale >= 80 ? '🌟 Excellent !' : moyGlobale >= 60 ? '👍 Bien !' : moyGlobale >= 40 ? '💪 Continue !' : '📚 À retravailler'

      const h = Math.floor(tempsTotal/3600)
      const m = Math.floor((tempsTotal%3600)/60)
      const tempsFormat = h > 0 ? `${h}h ${m}min` : `${m} min`

      const themesHTML = Object.entries(themes).map(([theme, s]) => {
        const pct = Math.round((s.ok/s.tot)*100)
        const couleurTheme = pct >= 80 ? '#16a34a' : pct >= 60 ? '#3730a3' : pct >= 40 ? '#f59e0b' : '#dc2626'
        return `<tr>
          <td style="padding:8px;color:#555;border-bottom:1px solid #f0f0ec">${theme}</td>
          <td style="padding:8px;font-weight:600;color:${couleurTheme};border-bottom:1px solid #f0f0ec">${pct}%</td>
          <td style="padding:8px;color:#999;border-bottom:1px solid #f0f0ec;font-size:12px">${s.n} session(s)</td>
        </tr>`
      }).join('')

      const rateesHTML = topRatees && topRatees.length > 0
        ? `<div style="margin-top:20px">
            <p style="font-weight:600;margin-bottom:8px">📚 Points à améliorer :</p>
            <ul style="padding-left:20px;color:#555;margin:0">
              ${topRatees.map(([q]) => `<li style="margin-bottom:6px">${q}</li>`).join('')}
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
            Voici le bilan de progression de <strong>${prenom}${nom ? ' ' + nom : ''}</strong> sur ACADEMIKA.
          </p>
          <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
            <div style="font-size:56px;font-weight:700;color:${couleur}">${moyGlobale}%</div>
            <div style="font-size:18px;margin-top:8px">${mention}</div>
            <div style="font-size:13px;color:#666;margin-top:8px">${totalSessions} sessions · ${tempsFormat} de révision</div>
          </div>
          <p style="color:#444;margin-bottom:16px;">
            Bonne nouvelle : <strong>${prenom} progresse !</strong><br>
            Encouragez-le à continuer sur les thèmes à améliorer.
          </p>
          <h3 style="font-size:14px;font-weight:600;margin-bottom:8px">📊 Résultats par thème :</h3>
          <table style="width:100%;border-collapse:collapse">${themesHTML}</table>
          ${rateesHTML}
          <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:16px;">
              Pour toute question, contactez-nous : 
              <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="https://academika.fr/api/desabonner?email=${emailParent}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

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
      const mention = pct >= 80 ? '🌟 Très Bien' : pct >= 70 ? '👍 Bien' : pct >= 60 ? '✅ Assez Bien' : pct >= 50 ? '📋 Admis' : '📚 Non admis'
      const messageMotivation = pct >= 50
        ? `Bonne nouvelle : <strong>${prenom}</strong> a réussi son examen blanc ! Encouragez-le à continuer sur les thèmes à améliorer.`
        : `<strong>${prenom}</strong> n'a pas encore le niveau requis. C'est normal — c'est un entraînement ! Encouragez-le à continuer à réviser régulièrement.`

      const m = Math.floor(tempsSecondes / 60)
      const s = tempsSecondes % 60
      const tempsFormat = `${m} min ${s} sec`

      const themesHTML = scoresThemes ? Object.entries(scoresThemes).map(([theme, s]) => {
        const tp = Math.round((s.ok / s.total) * 100)
        const tc = tp >= 60 ? '#16a34a' : tp >= 40 ? '#f59e0b' : '#dc2626'
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0ec">
          <span style="font-size:13px;color:#444">${theme}</span>
          <span style="font-weight:700;color:${tc}">${s.ok}/${s.total} (${tp}%)</span>
        </div>`
      }).join('') : ''

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Examen Blanc</div>
          </div>
          <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">
            Votre enfant <strong>${prenom}${nom ? ' ' + nom : ''}</strong> vient de passer l'Examen Blanc Brevet Maths sur ACADEMIKA.
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
            <a href="https://academika.fr/api/desabonner?email=${emailParent}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: 'noreply@academika.fr', to: emailParent, subject: `📝 ${prenom} a obtenu ${score}/20 à l'Examen Blanc — ACADEMIKA`, html })
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
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Prénom</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${prenom}</td></tr>
              <tr><td style="padding:8px;color:#666;border-bottom:1px solid #e8e8e4">Nom</td><td style="padding:8px;font-weight:600;border-bottom:1px solid #e8e8e4">${nom}</td></tr>
              <tr><td style="padding:8px;color:#666">Email parents</td><td style="padding:8px;font-weight:600;color:#3730a3">${emailParent}</td></tr>
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
            Votre enfant <strong>${prenom} ${nom}</strong> vient de s'inscrire sur ACADEMIKA, 
            une application de révision en mathématiques pour le Brevet des collèges.
          </p>
          <div style="background:#eef2ff;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="font-weight:600;margin-bottom:12px;color:#3730a3">Comment ça fonctionne :</p>
            <p style="margin-bottom:8px;font-size:14px;">🤖 Quiz générés par intelligence artificielle</p>
            <p style="margin-bottom:8px;font-size:14px;">📝 Examen Blanc style vrai brevet</p>
            <p style="margin-bottom:8px;font-size:14px;">📧 Vous recevez les résultats après chaque session</p>
            <p style="margin-bottom:0;font-size:14px;">📊 Suivi de progression personnalisé</p>
          </div>
          <p style="color:#444;margin-bottom:20px;">
            Votre enfant peut commencer maintenant sur :<br>
            <a href="https://www.academika.fr" style="color:#3730a3;font-weight:600;text-decoration:none;">👉 www.academika.fr</a>
          </p>
          <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:8px;">
              Pour toute question, contactez-nous : 
              <a href="mailto:${PROF_EMAIL}" style="color:#3730a3;text-decoration:none;font-weight:500">${PROF_EMAIL}</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="https://academika.fr/api/desabonner?email=${emailParent}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

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
    if (pct >= 80) mention = '🌟 Mention Très Bien'
    else if (pct >= 70) mention = '👍 Mention Bien'
    else if (pct >= 60) mention = '✅ Mention Assez Bien'
    else if (pct >= 50) mention = '📋 Admis'
    else mention = '📚 Non admis — À retravailler'
    const couleur = pct >= 50 ? '#16a34a' : '#dc2626'

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'ACADEMIKA <noreply@academika.fr>',
          to: emailParent,
          subject: `📝 Résultats Examen Blanc Brevet — ${prenom}`,
          html: `
            <h2>📝 Résultats — Examen Blanc Brevet</h2>
            <p>Bonjour,</p>
            <p>Voici les résultats de <strong>${prenom} ${nom}</strong> pour l'examen blanc du <strong>${date}</strong> :</p>
            <div style="background:#f0f7ff;border-radius:8px;padding:20px;margin:16px 0;text-align:center">
              <div style="font-size:48px;font-weight:700;color:${couleur}">${note}/20</div>
              <div style="font-size:18px;color:${couleur};margin-top:8px">${mention}</div>
            </div>
            ${commentaire ? `
            <div style="background:#f7f7f5;border-radius:8px;padding:16px;margin:16px 0">
              <p><strong>💬 Commentaire :</strong></p>
              <p style="color:#555">${commentaire}</p>
            </div>` : ''}
            <p>Continuez à réviser sur <a href="https://academika.fr">academika.fr</a> !</p>
            <p>Contact : <strong>06 26 53 90 13</strong></p>
            <br>
            <p>Cordialement,<br>ACADEMIKA</p>
          `
        })
      })
      return res.status(200).json({ success: true })
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ═══════════════════════════════════════════
  // RÉCAP JOURNALIER — toujours envoyé (≥40% = bref/positif avec badges par sous-thème, <40% = alerte détaillée)
  // ═══════════════════════════════════════════
  try {
    const { emailParent, prenom, nom, score, total, questionsRatees, tempsSecondes,
            resultatsId, sousThemesDetail, totalSessions, moyGlobale } = req.body

    const pct = Math.round((score / total) * 100)
    const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
    const supaHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPA_KEY}`,
      'apikey': SUPA_KEY
    }
    const lienDesabonnement = `https://academika.fr/api/desabonner?email=${encodeURIComponent(emailParent)}`
    const m = Math.floor(tempsSecondes / 60)
    const s = tempsSecondes % 60
    const tempsFormat = m === 0 ? `${s} sec` : `${m} min ${s} sec`

    let html = ''
    let sujet = ''

    if (pct >= 40) {
      // ── Bon score : message bref, positif, badges par sous-thème ──
      const entries = Object.entries(sousThemesDetail || {})
      const badgesData = entries.map(([nom, d]) => {
        const p = Math.round((d.ok / d.total) * 100)
        return { nom, pct: p, acquis: p >= 70 }
      })
      const nbAcquis = badgesData.filter(b => b.acquis).length
      const nbARevoir = badgesData.length - nbAcquis
      const messagePrincipal = badgesData.length === 0
        ? `${prenom} a travaillé aujourd'hui`
        : (nbAcquis >= badgesData.length / 2 ? `${prenom} a bien travaillé aujourd'hui` : `${prenom} a un peu buté aujourd'hui`)

      const badgesHTML = badgesData.map(b => {
        const bg = b.acquis ? '#EAF6EF' : '#FBF4E4'
        const fg = b.acquis ? '#1f7a45' : '#8a6416'
        const label = b.acquis ? 'Acquis' : 'À revoir'
        return `<table style="width:100%;border-collapse:collapse;margin-bottom:8px"><tr style="background:${bg};border-radius:8px">
          <td style="padding:10px 12px;font-size:13px;color:${fg}">${b.nom}</td>
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
      // ── Score faible : alerte détaillée (logique existante conservée) ──
      sujet = `⚠️ ${prenom} a eu des difficultés aujourd'hui — ACADEMIKA`

      const rateesHTML = questionsRatees && questionsRatees.length > 0
        ? `<div style="margin-top:16px">
            <p style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">📚 Points à retravailler :</p>
            ${questionsRatees.slice(0,5).map(q => `
              <div style="font-size:13px;color:#666;padding:4px 0">
                • ${q}
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
            <strong>${prenom}</strong> a passé ${totalSessions} session${totalSessions>1?'s':''} de révision aujourd'hui 
            qui nécessite${totalSessions>1?'nt':''} votre attention :
          </p>
          <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
            <div style="font-size:24px;font-weight:700;color:#dc2626">
              ${score}/${total} — ${pct}%
            </div>
            <div style="font-size:12px;color:#888;margin-top:4px">⏱️ ${tempsFormat}</div>
          </div>
          ${rateesHTML}
          <p style="color:#444;line-height:1.6;margin-top:20px">
            Un encouragement ce soir peut faire toute la différence !
            <strong>10 minutes par jour</strong> suffisent pour progresser.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'noreply@academika.fr',
        to: emailParent,
        subject: sujet,
        html
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(500).json({ error: 'Erreur email : ' + JSON.stringify(err) })
    }

    if (resultatsId) {
      await fetch(
        `${SUPA_URL}/rest/v1/resultats?id=eq.${resultatsId}`,
        {
          method: 'PATCH',
          headers: { ...supaHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ alerte_envoyee: true })
        }
      )
    }

    res.status(200).json({ success: true })

  } catch(e) {
    console.log('Erreur:', e.message)
    res.status(500).json({ error: e.message })
  }
}
