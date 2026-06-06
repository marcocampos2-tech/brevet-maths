export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    const { prenom, nom, emailParent } = req.body
    const PROF_EMAIL = 'marcocampos2@gmail.com'

    // EMAIL 1 — Au prof
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

    // EMAIL 2 — Aux parents
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

  

    // Envoi des 2 emails en parallèle
    await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'noreply@academika.fr',
          to: PROF_EMAIL,
          subject: `🎓 Nouvel élève inscrit : ${prenom} ${nom} — ACADEMIKA`,
          html: htmlProf
        })
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'noreply@academika.fr',
          to: emailParent,
          subject: `🎓 Bienvenue sur ACADEMIKA — ${prenom} ${nom}`,
          html: htmlParents
        })
      })
    ])

    res.status(200).json({ success: true })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
