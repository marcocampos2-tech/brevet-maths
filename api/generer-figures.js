export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const supaHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPA_KEY}`,
    'apikey': SUPA_KEY
  }

  // Mode test = true par défaut — ne pas écrire en BDD
  const modeTest = req.query.test !== 'false'
  const limite = modeTest ? 3 : 136

  try {
    // Récupérer les questions sans figure
    const questRes = await fetch(
      `${SUPA_URL}/rest/v1/questions_banque?theme=eq.Géométrie&figure=is.null&select=id,question&limit=${limite}`,
      { headers: supaHeaders }
    )
    const questions = await questRes.json()

    if (!questions || questions.length === 0) {
      return res.status(200).json({ message: 'Aucune question sans figure !' })
    }

    const resultats = []

    for (const q of questions) {
      const prompt = `Tu es un expert en géométrie au collège français (niveau 3ème/Brevet).

Analyse cet énoncé de question mathématique et détermine si une figure géométrique aiderait l'élève à visualiser le problème.

Énoncé : "${q.question}"

Si une figure est utile, génère le JSON correspondant selon ces types disponibles :

1. triangle_rect : {"type":"triangle_rect","base":X,"hauteur":Y,"unite":"cm"}
   → Pour : Pythagore, aires de triangles rectangles, échelle contre mur

2. triangle : {"type":"triangle","base":X,"hauteur":Y,"unite":"cm"}
   → Pour : aires de triangles quelconques

3. rectangle : {"type":"rectangle","largeur":X,"hauteur":Y,"unite":"cm"}
   → Pour : aires et périmètres de rectangles

4. cercle : {"type":"cercle","rayon":X,"unite":"cm"}
   → Pour : aires et périmètres de cercles

5. pythagore : {"type":"pythagore","a":X,"b":Y,"c":Z,"unite":"cm"}
   → Pour : théorème de Pythagore (mettre "?" pour la valeur inconnue)
   Exemple côté inconnu : {"type":"pythagore","a":3,"b":"?","c":5,"unite":"cm"}

6. thales : {"type":"thales","am":X,"ab":Y,"an":Z,"ac":W,"unite":"cm"}
   → Pour : théorème de Thalès, ombres, lampadaires, agrandissements

7. trapeze : {"type":"trapeze","grande_base":X,"petite_base":Y,"hauteur":Z,"unite":"cm"}
   → Pour : aires de trapèzes

8. parallelogramme : {"type":"parallelogramme","base":X,"hauteur":Y,"unite":"cm"}
   → Pour : aires de parallélogrammes

RÈGLES IMPORTANTES :
- Extrais les vraies mesures depuis l'énoncé
- Pour Pythagore : mets "?" pour le côté INCONNU (celui qu'on cherche)
- Si la question parle de volume (sphère, prisme, cylindre, cône) → réponds null
- Si la question parle de trigonométrie avec angles → réponds null (pas de figure disponible)
- Si la question parle d'homothétie, agrandissement sans triangle → réponds null
- Si aucune figure n'aide vraiment → réponds null

Réponds UNIQUEMENT avec le JSON ou le mot null. Rien d'autre.`

      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        const aiData = await aiRes.json()
        const texte = aiData.content?.[0]?.text?.trim() || 'null'

        let figure = null
        if (texte !== 'null') {
          try { figure = JSON.parse(texte) } catch(e) { figure = null }
        }

        resultats.push({
          id: q.id,
          question: q.question.substring(0, 80) + '...',
          figure_generee: figure,
          raw: texte
        })

        // Si pas en mode test — écrire en BDD
        if (!modeTest && figure !== null) {
          await fetch(
            `${SUPA_URL}/rest/v1/questions_banque?id=eq.${q.id}`,
            {
              method: 'PATCH',
              headers: { ...supaHeaders, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ figure: figure })
            }
          )
        }

      } catch(e) {
        resultats.push({ id: q.id, question: q.question.substring(0,80), erreur: e.message })
      }

      // Pause 500ms entre chaque appel pour éviter rate limit
      await new Promise(r => setTimeout(r, 500))
    }

    return res.status(200).json({
      mode: modeTest ? 'TEST — rien écrit en BDD' : 'PRODUCTION — figures sauvegardées',
      traite: resultats.length,
      resultats
    })

  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
