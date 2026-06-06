// /api/email-hebdo.js
// Envoi chaque lundi à 8h — récap hebdo aux parents
// Uniquement si l'élève a travaillé cette semaine

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
    const mois = maintenant.getMonth() + 1

    // Pas d'email hebdo en août
    if (mois === 8) {
      return res.status(200).json({ message: 'Août — pas d\'email hebdo' })
    }

    // Période de la semaine écoulée (lundi → dimanche)
    const lundiDernier = new Date(maintenant)
    lundiDernier.setDate(maintenant.getDate() - 7)
    lundiDernier.setHours(0, 0, 0, 0)
    const dimanche = new Date(maintenant)
    dimanche.setDate(maintenant.getDate() - 1)
    dimanche.setHours(23, 59, 59, 999)

    const debutSemaine = lundiDernier.toISOString()
    const finSemaine = dimanche.toISOString()

    // Récupérer tous les profils
    const profilsRes = await fetch(
      `${SUPA_URL}/rest/v1/profils?select=user_id,prenom_affiche,nom_affiche,email_parent,email_actif`,
      { headers }
    )
    const profils = await profilsRes.json()
    if (!profils || profils.length === 0) {
      return res.status(200).json({ message: 'Aucun profil' })
    }

    let envoyes = 0, ignores = 0

    for (const profil of profils) {
      const { user_id, prenom_affiche, nom_affiche, email_parent, email_actif } = profil

      // Vérifications
      if (!email_parent) { ignores++; continue }
      if (email_actif === false) { ignores++; continue }

      // Sessions de la semaine
      const sessionsRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}&created_at=gte.${debutSemaine}&created_at=lte.${finSemaine}&select=*&order=created_at.desc`,
        { headers }
      )
      const sessions = await sessionsRes.json()

      // Pas de sessions cette semaine → pas d'email
      if (!sessions || sessions.length === 0) { ignores++; continue }

      // Stats globales
      const totalSessions = sessions.length
      const totalScore = sessions.reduce((a, r) => a + r.score, 0)
      const totalTotal = sessions.reduce((a, r) => a + r.total, 0)
      const totalSecondes = sessions.reduce((a, r) => a + (r.temps_secondes || 0), 0)
      const moyennePct = Math.round((totalScore / totalTotal) * 100)

      // Stats ce mois
      const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString()
      const moisRes = await fetch(
        `${SUPA_URL}/rest/v1/resultats?user_id=eq.${user_id}&created_at=gte.${debutMois}&select=id`,
        { headers }
      )
      const sessionsMois = await moisRes.json()
      const totalMois = sessionsMois?.length || 0

      // Stats par thème et niveau
      const THEMES = ['Nombres et calculs','Géométrie','Algèbre et équations','Statistiques et probabilités','Fonctions','Algorithmique']
      const themeStats = {}
      sessions.forEach(r => {
        if (!themeStats[r.theme]) {
          themeStats[r.theme] = {
            ok: 0, tot: 0,
            niveaux: { facile:{ok:0,tot:0}, moyen:{ok:0,tot:0}, difficile:{ok:0,tot:0} },
            chapitres: {}
          }
        }
        themeStats[r.theme].ok += r.score
        themeStats[r.theme].tot += r.total
        if (r.difficulte && themeStats[r.theme].niveaux[r.difficulte]) {
          themeStats[r.theme].niveaux[r.difficulte].ok += r.score
          themeStats[r.theme].niveaux[r.difficulte].tot += r.total
        }
        ;(r.questions_ratees || []).forEach(q => {
          const chap = q.replace(r.theme + ' — ', '')
          themeStats[r.theme].chapitres[chap] = (themeStats[r.theme].chapitres[chap] || 0) + 1
        })
      })

      // Dernier examen blanc
      const examRes = await fetch(
        `${SUPA_URL}/rest/v1/examens_blancs?user_id=eq.${user_id}&abandonne=eq.false&select=score,total,created_at&order=created_at.desc&limit=1`,
        { headers }
      )
      const examens = await examRes.json()
      const dernierExamen = examens && examens.length > 0 ? examens[0] : null

      // Helpers
      const getStatut = (p) => {
        if (p >= 70) return { label: 'Maîtrisé', emoji: '✅', color: '#16a34a', dot: '🟢' }
        if (p >= 50) return { label: 'En cours', emoji: '⚠️', color: '#d97706', dot: '🟡' }
        return { label: 'À retravailler', emoji: '❌', color: '#dc2626', dot: '🔴' }
      }

      const getMention = (p) => {
        if (p >= 80) return 'Mention Très Bien'
        if (p >= 70) return 'Mention Bien'
        if (p >= 60) return 'Mention Assez Bien'
        if (p >= 50) return 'Admis'
        return 'Non admis'
      }

      const fmtTemps = (s) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        return h > 0 ? h + 'h' + (m > 0 ? m + 'min' : '') : m + ' min'
      }

      const niveauEmoji = { facile: '😊 Facile', moyen: '😐 Moyen', difficile: '😤 Difficile' }

      // Trouver point fort et priorité
      let fortTheme = '', fortPct = -1, faibleTheme = '', faiblePct = 101
      Object.entries(themeStats).forEach(([t, s]) => {
        const p = Math.round((s.ok / s.tot) * 100)
        if (p >= 70 && p > fortPct) { fortPct = p; fortTheme = t }
        if (p < faiblePct) { faiblePct = p; faibleTheme = t }
      })

      const dernierSessionDate = new Date(sessions[0].created_at)
      const aujourd_hui = new Date()
      const diffJours = Math.floor((aujourd_hui - dernierSessionDate) / (1000 * 60 * 60 * 24))
      const dernierSessionLabel = diffJours === 0 ? 'aujourd\'hui' : diffJours === 1 ? 'hier' : `il y a ${diffJours} jours`

      const lienDesabonnement = `https://academika.fr/api/desabonner?email=${encodeURIComponent(email_parent)}`

      // HTML des thèmes
      const themesHTML = THEMES.map(t => {
        const s = themeStats[t]
        if (!s) return ''
        const p = Math.round((s.ok / s.tot) * 100)
        const statut = getStatut(p)

        // Niveaux
        const niveauxHTML = ['facile', 'moyen', 'difficile'].map(niv => {
          const n = s.niveaux[niv]
          if (n.tot === 0) return ''
          const np = Math.round((n.ok / n.tot) * 100)
          const ns = getStatut(np)
          return `<tr>
            <td style="padding:4px 8px 4px 24px;font-size:12px;color:#666">${niveauEmoji[niv]}</td>
            <td style="padding:4px 8px;font-size:12px;color:${ns.color};font-weight:600">${ns.emoji} ${ns.label}</td>
            <td style="padding:4px 8px;font-size:12px;color:${ns.color}">${n.ok}/${n.tot}</td>
          </tr>`
        }).join('')

        // Chapitres ratés
        const topChaps = Object.entries(s.chapitres).sort((a,b) => b[1]-a[1]).slice(0,3)
        const chapsHTML = topChaps.length > 0
          ? `<tr><td colspan="3" style="padding:6px 8px 4px 24px;font-size:11px;color:#dc2626;font-weight:600">Chapitres ratés :</td></tr>` +
            topChaps.map(([chap, nb]) => `<tr><td colspan="3" style="padding:2px 8px 2px 28px;font-size:11px;color:#666">• ${chap} (${nb}×)</td></tr>`).join('')
          : ''

        return `
          <div style="margin-bottom:12px;background:#f9f9f7;border-radius:8px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse">
              <tr style="background:${statut.color}15">
                <td style="padding:8px 12px;font-weight:700;color:#111;font-size:13px">${statut.dot} ${t}</td>
                <td style="padding:8px 12px;font-weight:700;color:${statut.color};font-size:13px;text-align:right">${statut.label}</td>
                <td style="padding:8px 12px;font-weight:700;color:${statut.color};font-size:13px;text-align:right">${s.ok}/${s.tot}</td>
              </tr>
              ${niveauxHTML}
              ${chapsHTML}
            </table>
          </div>`
      }).join('')

      // HTML examen blanc
      const examHTML = dernierExamen ? (() => {
        const ep = Math.round((dernierExamen.score / dernierExamen.total) * 100)
        const mention = getMention(ep)
        const couleur = ep >= 50 ? '#16a34a' : '#dc2626'
        return `
          <div style="background:#eef2ff;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;font-weight:700;color:#3730a3">📝 Dernier examen blanc</div>
            <div style="text-align:right">
              <div style="font-size:18px;font-weight:700;color:${couleur}">${dernierExamen.score}/20</div>
              <div style="font-size:11px;color:${couleur};font-weight:600">${mention}</div>
            </div>
          </div>`
      })() : ''

      // HTML insights
      const insightsHTML = (fortTheme || faibleTheme) ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
          ${fortTheme ? `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #dcfce7;padding:4px 12px;border-radius:20px;font-size:12px">💪 Fort en : ${fortTheme}</span>` : ''}
          ${faibleTheme ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fee2e2;padding:4px 12px;border-radius:20px;font-size:12px">📚 Priorité : ${faibleTheme}</span>` : ''}
        </div>` : ''

      const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1a1a1a">

          <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e8e8e4;margin-bottom:24px">
            <div style="font-size:28px;font-weight:800;">∑ ACADEMIKA</div>
            <div style="font-size:12px;color:#666;margin-top:4px">Brevet Maths — Bilan hebdomadaire</div>
          </div>

          <p style="margin-bottom:6px">Bonjour Madame, Monsieur,</p>
          <p style="margin-bottom:20px;color:#444">
            Voici le bilan de la semaine de <strong>${prenom_affiche}${nom_affiche ? ' ' + nom_affiche : ''}</strong>.
          </p>

          <div style="background:#f5f5f0;border-radius:12px;padding:16px 20px;margin-bottom:20px">
            <div style="font-size:12px;color:#999;margin-bottom:4px">Dernière session : ${dernierSessionLabel}</div>
            <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:8px">
              <div style="text-align:center">
                <div style="font-size:24px;font-weight:700;color:#1a1a1a">${totalSessions}</div>
                <div style="font-size:11px;color:#999">sessions cette semaine</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:24px;font-weight:700;color:#1a1a1a">${totalMois}</div>
                <div style="font-size:11px;color:#999">sessions ce mois</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:24px;font-weight:700;color:#1a1a1a">${fmtTemps(totalSecondes)}</div>
                <div style="font-size:11px;color:#999">temps total</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:24px;font-weight:700;color:${getStatut(moyennePct).color}">${moyennePct}%</div>
                <div style="font-size:11px;color:#999">moyenne semaine</div>
              </div>
            </div>
          </div>

          ${examHTML}

          <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:#111">📊 Résultats par thème :</div>
          ${themesHTML}

          ${insightsHTML}

          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e8e8e4">
            <p style="color:#444;font-size:13px;margin-bottom:8px">
              Pour toute question : <a href="mailto:marcocampos2@gmail.com" style="color:#3730a3">marcocampos2@gmail.com</a>
            </p>
            <p style="color:#444;font-size:13px">Cordialement,<br><strong>L'équipe ACADEMIKA</strong></p>
          </div>

          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:12px">
            <a href="${lienDesabonnement}" style="color:#bbb">Se désabonner des emails automatiques</a>
          </p>

        </div>`

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'noreply@academika.fr',
          to: email_parent,
          subject: `📊 Bilan de ${prenom_affiche} — semaine du ${lundiDernier.toLocaleDateString('fr-FR')} — ACADEMIKA`,
          html
        })
      })

      if (emailRes.ok) {
        envoyes++
        console.log(`✅ Email hebdo envoyé à ${email_parent} pour ${prenom_affiche}`)
      } else {
        const err = await emailRes.json()
        console.error(`❌ Erreur ${prenom_affiche}:`, err)
        ignores++
      }
    }

    return res.status(200).json({ success: true, envoyes, ignores, total: profils.length })

  } catch(e) {
    console.error('Erreur email-hebdo:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
