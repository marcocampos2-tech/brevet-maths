// /api/cron-rappel.js
//
// ═══════════════════════════════════════════════════════════
// Réécrit le 24/07/2026 — Academika 2.0
//   - SUPPRIMÉ : branche "période normale" (rappel inactivité 3 jours)
//     → remplacée par le bilan périodique (ci-dessous), moins intrusif
//   - CORRIGÉ : marcocampos2@gmail.com → contact@academika.fr
//   - AJOUTÉ : branche bilan périodique automatique (~3 semaines)
//   - CONSERVÉ tel quel : branches "été" et "fin d'année"
// ═══════════════════════════════════════════════════════════

const ORDRE_DIFFICULTE = { facile: 1, moyen: 2, difficile: 3 }
const NIVEAU_LABEL = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' }
const CADENCE_JOURS = 21

export default async function handler(req, res) {

  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const SUPA_URL = process.env.SUPABASE_URL || 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY
  }

  try {
    const maintenant = new Date()
    const mois = maintenant.getMonth() + 1 // 1-12
    const jour = maintenant.getDate()

    // Récupérer tous les profils
    const profilsRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?select=user_id,prenom_affiche,email_parent,email_actif`,
      { headers }
    )
    const profils = await profilsRes.json()
    if (!profils || profils.length === 0) {
      return res.status(200).json({ message: 'Aucun profil' })
    }

    // ── PÉRIODE FIN D'ANNÉE (27-30 juin) ──────────────────
    if (mois === 6 && jour >= 27) {
      let envoyes = 0
      for (const profil of profils) {
        const { user_id, prenom_affiche, email_parent, email_actif } = profil
        if (!email_parent || email_actif === false) continue

        const rappelRes = await fetch(
          `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&type=eq.fin_annee&select=id&limit=1`,
          { headers }
        )
        const rappels = await rappelRes.json()
        if (rappels && rappels.length > 0) continue

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0;font-size:16px">🎓 Le brevet est passé — bravo à <strong>${prenom_affiche}</strong> pour ses efforts cette année !</p>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              Merci d'avoir fait confiance à Academika cette année.<br><br>
              Le compte de <strong>${prenom_affiche}</strong> reste actif — il peut continuer à réviser pendant l'été s'il le souhaite.
            </p>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              🎓 <strong>Nouveauté à la rentrée :</strong> nous travaillons sur Academika Seconde et vous tiendrons informés très bientôt.
            </p>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:contact@academika.fr" style="color:#3730a3">contact@academika.fr</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'noreply@academika.fr',
            to: email_parent,
            subject: `🎓 Bonne fin d'année — Merci pour cette année sur ACADEMIKA`,
            html
          })
        })

        if (emailRes.ok) {
          await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_id, email_parent, type: 'fin_annee', jours_inactif: 0 })
          })
          envoyes++
        }
      }
      return res.status(200).json({ success: true, type: 'fin_annee', envoyes })
    }

    // ── PÉRIODE ÉTÉ (juillet) — aussi la fenêtre de pause du bilan périodique ──
    if (mois === 7) {
      let envoyes = 0
      for (const profil of profils) {
        const { user_id, prenom_affiche, email_parent, email_actif } = profil
        if (!email_parent || email_actif === false) continue

        const rappelRes = await fetch(
          `${SUPA_URL}/rest/v1/rappels_envoyes?user_id=eq.${user_id}&type=eq.ete&select=id&limit=1`,
          { headers }
        )
        const rappels = await rappelRes.json()
        if (rappels && rappels.length > 0) continue

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
            <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
              <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            </div>
            <p style="margin-bottom:16px">Bonjour Madame, Monsieur,</p>
            <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
              <p style="margin:0;font-size:16px">🌞 Bonnes vacances à toute la famille !</p>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              Academika reste ouvert cet été — <strong>${prenom_affiche}</strong> peut continuer à réviser quand il le souhaite, à son rythme.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="https://academika.fr" style="background:#1a1a1a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
                Continuer à réviser →
              </a>
            </div>
            <p style="color:#444;line-height:1.6;margin-bottom:20px">
              🎓 <strong>Nouveauté à la rentrée :</strong> nous travaillons sur Academika Seconde et vous tiendrons informés très bientôt.
            </p>
            <p style="color:#888;font-size:12px;text-align:center;margin-top:24px">
              Pour toute question : <a href="mailto:contact@academika.fr" style="color:#3730a3">contact@academika.fr</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
              <a href="https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
            </p>
          </div>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'noreply@academika.fr',
            to: email_parent,
            subject: `🌞 Bonnes vacances — Academika reste ouvert cet été !`,
            html
          })
        })

        if (emailRes.ok) {
          await fetch(`${SUPA_URL}/rest/v1/rappels_envoyes`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ user_id, email_parent, type: 'ete', jours_inactif: 0 })
          })
          envoyes++
        }
      }
      return res.status(200).json({ success: true, type: 'ete', envoyes })
    }

    // ── PÉRIODE AOÛT — silence total (bilan périodique aussi en pause) ──
    if (mois === 8) {
      return res.status(200).json({ message: 'Août — pas de rappels ni de bilans' })
    }

    // ── BILAN PÉRIODIQUE AUTOMATIQUE (septembre → 26 juin) ──────────────
    let bilansEnvoyes = 0, bilansIgnores = 0, bilansPauses = 0

    for (const profil of profils) {
      const { user_id, prenom_affiche, email_parent, email_actif } = profil
      if (!email_parent || email_actif === false) { bilansIgnores++; continue }

      // Récupère le dernier bilan périodique envoyé
      const dernierBilanRes = await fetch(
        `${SUPA_URL}/rest/v1/historique_bilans?user_id=eq.${user_id}` +
        `&type_bilan=eq.periodique&select=date_envoi,sous_themes_snapshot,total_sessions` +
        `&order=date_envoi.desc&limit=2`,
        { headers }
      )
      const derniersBilans = await dernierBilanRes.json()
      const dernierBilan = (derniersBilans && derniersBilans.length > 0) ? derniersBilans[0] : null
      const avantDernierBilan = (derniersBilans && derniersBilans.length > 1) ? derniersBilans[1] : null

      // Date de début de la fenêtre : dernier bilan, sinon inscription (approximé par la 1ère session)
      let dateDebut
      if (dernierBilan) {
        dateDebut = new Date(dernierBilan.date_envoi)
      } else {
        const premiereSessionRes = await fetch(
          `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}&select=created_at&order=created_at.asc&limit=1`,
          { headers }
        )
        const premiereSession = await premiereSessionRes.json()
        if (!premiereSession || premiereSession.length === 0) { bilansIgnores++; continue } // jamais utilisé l'app
        dateDebut = new Date(premiereSession[0].created_at)
      }

      // Vérifie si la cadence de 21 jours est atteinte
      const joursDepuisDernier = Math.floor((maintenant - dateDebut) / (1000 * 60 * 60 * 24))
      if (joursDepuisDernier < CADENCE_JOURS) { bilansIgnores++; continue }

      // Pause automatique : si les 2 derniers bilans étaient déjà vides (0 session)
      if (dernierBilan && dernierBilan.total_sessions === 0 &&
          avantDernierBilan && avantDernierBilan.total_sessions === 0) {
        bilansPauses++
        continue
      }

      // ── Calcul des données du bilan ──
      const dateDebutISO = dateDebut.toISOString()
      const dateFinISO = maintenant.toISOString()

      const sessionsRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}` +
        `&created_at=gte.${dateDebutISO}&created_at=lte.${dateFinISO}` +
        `&select=score,total,sous_theme,difficulte,created_at`,
        { headers }
      )
      const sessions = await sessionsRes.json()

      let totalSessions = 0, moyGlobale = 0, joursActifs = 0
      let sousThemesActuel = {}

      if (sessions && sessions.length > 0) {
        totalSessions = sessions.length
        const sommeScore = sessions.reduce((acc, s) => acc + (s.score || 0), 0)
        const sommeTotal = sessions.reduce((acc, s) => acc + (s.total || 0), 0)
        moyGlobale = sommeTotal > 0 ? Math.round((sommeScore / sommeTotal) * 100) : 0

        const joursUniques = new Set(sessions.map(s => new Date(s.created_at).toISOString().slice(0, 10)))
        joursActifs = joursUniques.size

        const parSousTheme = {}
        for (const s of sessions) {
          if (!s.sous_theme || !s.difficulte) continue
          if (!parSousTheme[s.sous_theme]) parSousTheme[s.sous_theme] = []
          parSousTheme[s.sous_theme].push(s)
        }
        for (const [sousTheme, list] of Object.entries(parSousTheme)) {
          let difficulteMax = null
          for (const s of list) {
            const rang = ORDRE_DIFFICULTE[s.difficulte] || 0
            if (!difficulteMax || rang > ORDRE_DIFFICULTE[difficulteMax]) difficulteMax = s.difficulte
          }
          const auNiveauMax = list.filter(s => s.difficulte === difficulteMax)
          const ok = auNiveauMax.reduce((a, s) => a + (s.score || 0), 0)
          const tot = auNiveauMax.reduce((a, s) => a + (s.total || 0), 0)
          const pct = tot > 0 ? Math.round((ok / tot) * 100) : 0
          sousThemesActuel[sousTheme] = { difficulte: difficulteMax, pct, acquis: pct >= 70 }
        }
      }

      // ── Phrase de synthèse comparative ──
      let phraseSynthese = ''
      const premierBilan = !dernierBilan

      if (totalSessions === 0) {
        phraseSynthese = `${prenom_affiche} n'a pas beaucoup avancé depuis le dernier bilan — un petit coup de pouce cette semaine pourrait relancer la dynamique.`
      } else if (!premierBilan && dernierBilan.sous_themes_snapshot) {
        const avant = dernierBilan.sous_themes_snapshot
        const nouveaux = [], progres = [], vigilance = []
        for (const [st, actuel] of Object.entries(sousThemesActuel)) {
          const ancien = avant[st]
          if (!ancien) {
            nouveaux.push(`${st} (${actuel.acquis ? 'déjà acquis' : 'à retravailler'})`)
          } else if (ORDRE_DIFFICULTE[actuel.difficulte] > ORDRE_DIFFICULTE[ancien.difficulte]) {
            progres.push(st)
          } else if (!actuel.acquis) {
            vigilance.push(st)
          }
        }
        const parts = []
        if (progres.length > 0) parts.push(`débloqué le niveau ${NIVEAU_LABEL[sousThemesActuel[progres[0]].difficulte]} sur ${progres.join(', ')}`)
        if (nouveaux.length > 0) parts.push(`commencé un nouveau sous-thème : ${nouveaux.join(', ')}`)
        if (parts.length > 0) {
          phraseSynthese = `${prenom_affiche} a ${parts.join(', et a ')}.`
          if (vigilance.length > 0) phraseSynthese += ` ${vigilance.join(', ')} reste${vigilance.length > 1 ? 'nt' : ''} à consolider.`
        } else if (vigilance.length > 0) {
          phraseSynthese = `${prenom_affiche} continue de travailler sur ${vigilance.join(', ')}.`
        }
      }

      // ── CTA ──
      let cta = ''
      if (!premierBilan) {
        const enPeriodeBrevet = (mois >= 2 && mois <= 6)
        cta = enPeriodeBrevet
          ? `<div style="background:#faf9f6;border:1px solid #e8e8e4;border-radius:10px;padding:16px 18px;margin-top:20px">
               <p style="font-size:13px;color:#444;margin:0 0 8px;font-weight:600">Pour préparer la rentrée sereinement</p>
               <p style="font-size:13px;color:#666;margin:0;line-height:1.5">Pour aborder le Brevet plus sereinement, découvrez nos formules d'accompagnement individuel.</p>
             </div>`
          : `<div style="background:#faf9f6;border:1px solid #e8e8e4;border-radius:10px;padding:16px 18px;margin-top:20px">
               <p style="font-size:13px;color:#666;margin:0;line-height:1.5">Pour aller plus loin, un accompagnement individuel est disponible.</p>
             </div>`
      }

      // ── Assemblage du HTML ──
      const moyNote20 = (moyGlobale / 100 * 20).toFixed(1).replace('.0', '')
      const couleur = moyGlobale >= 80 ? '#16a34a' : moyGlobale >= 60 ? '#3730a3' : moyGlobale >= 40 ? '#f59e0b' : '#dc2626'
      const mention = moyGlobale >= 80 ? '🌟 Excellent !' : moyGlobale >= 60 ? '👍 Bien !' : moyGlobale >= 40 ? '💪 Continue !' : '📚 À retravailler'

      const dateDebutFr = dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      const dateFinFr = maintenant.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

      const introTexte = premierBilan
        ? `Voici le premier bilan de progression de <strong>${prenom_affiche}</strong> sur ACADEMIKA.`
        : `Voici le bilan de progression de <strong>${prenom_affiche}</strong>, du <strong>${dateDebutFr}</strong> au <strong>${dateFinFr}</strong>.`

      const sousThemesHTML = Object.entries(sousThemesActuel).map(([st, d]) => {
        const bg = d.acquis ? '#EAF6EF' : '#FBF4E4'
        const fg = d.acquis ? '#1f7a45' : '#8a6416'
        const label = d.acquis ? 'Acquis' : 'À revoir'
        return `<table style="width:100%;border-collapse:collapse;margin-bottom:6px"><tr style="background:${bg}">
          <td style="padding:10px 12px;font-size:13px;color:${fg};border-radius:6px 0 0 6px">${st} <span style="font-size:11px;opacity:0.75">· ${NIVEAU_LABEL[d.difficulte]}</span></td>
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:${fg};text-align:right;border-radius:0 6px 6px 0">${label}</td>
        </tr></table>`
      }).join('')

      const synthese = phraseSynthese
        ? `<div style="background:#fff8e6;border:1.5px solid #d97706;border-radius:10px;padding:16px 18px;margin:18px 0">
             <p style="font-size:13px;color:#7a5a00;margin:0 0 4px;font-weight:700">📈 Depuis le dernier bilan</p>
             <p style="font-size:14px;color:#3a2e00;margin:0;line-height:1.5">${phraseSynthese}</p>
           </div>`
        : ''

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Bilan de progression</div>
          </div>
          <p style="margin-bottom:6px;">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444;">${introTexte}</p>
          <div style="background:#f5f5f0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
            <div style="font-size:56px;font-weight:700;color:${couleur}">${moyNote20}<span style="font-size:24px;color:#999">/20</span></div>
            <div style="font-size:18px;margin-top:8px">${mention}</div>
          </div>
          <div style="background:#eef2ff;border-radius:10px;padding:14px 18px;margin:16px 0;text-align:center">
            <div style="font-size:14px;color:#3730a3;font-weight:600">📅 ${totalSessions} session${totalSessions > 1 ? 's' : ''} · ${joursActifs} jour${joursActifs > 1 ? 's' : ''} de révision</div>
          </div>
          ${synthese}
          ${Object.keys(sousThemesActuel).length > 0 ? `<h3 style="font-size:14px;font-weight:600;margin-bottom:10px">📊 Par sous-thème :</h3>${sousThemesHTML}` : ''}
          <div style="text-align:center;margin:24px 0 4px">
            <a href="https://www.academika.fr/espace-parent.html" style="background:#3730a3;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
              Voir le suivi complet dans l'espace parent →
            </a>
          </div>
          ${cta}
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e8e8e4;">
            <p style="color:#444;font-size:13px;margin-bottom:16px;">
              Pour toute question, contactez-nous : <a href="mailto:contact@academika.fr" style="color:#3730a3;text-decoration:none;font-weight:500">contact@academika.fr</a>
            </p>
            <p style="color:#444;font-size:13px;">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>
        </div>`

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'noreply@academika.fr',
          to: email_parent,
          subject: `📊 Bilan de progression de ${prenom_affiche} — ACADEMIKA`,
          html
        })
      })

      if (emailRes.ok) {
        await fetch(`${SUPA_URL}/rest/v1/historique_bilans`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            user_id,
            type_bilan: 'periodique',
            date_envoi: maintenant.toISOString(),
            date_debut_periode: dateDebutISO,
            date_fin_periode: dateFinISO,
            moy_globale: moyGlobale,
            total_sessions: totalSessions,
            jours_actifs: joursActifs,
            sous_themes_snapshot: sousThemesActuel
          })
        })
        bilansEnvoyes++
      } else {
        bilansIgnores++
      }
    }

    return res.status(200).json({
      success: true,
      bilans_envoyes: bilansEnvoyes,
      bilans_ignores: bilansIgnores,
      bilans_en_pause: bilansPauses,
      total_profils: profils.length
    })

  } catch(e) {
    console.error('Erreur cron:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
