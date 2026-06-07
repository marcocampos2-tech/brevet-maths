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

  const modeTest = req.query.test !== 'false'
  const table = req.query.table === 'examen' ? 'examen_questions' : 'questions_banque'
  const limite = modeTest ? 3 : 500

  try {
    // Récupérer questions sans figure selon la table
    const champQuestion = table === 'examen_questions' ? 'question' : 'question'
    const url = `${SUPA_URL}/rest/v1/${table}?figure=is.null&select=id,question&limit=${limite}`
    
    const questRes = await fetch(url, { headers: supaHeaders })
    const questions = await questRes.json()

    if (!questions || questions.length === 0) {
      return res.status(200).json({ message: 'Aucune question sans figure !' })
    }

    const resultats = []

    for (const q of questions) {
      const prompt = `Tu es un expert en géométrie au collège français (niveau 3ème/Brevet).

Analyse cet énoncé et détermine si une figure géométrique aiderait l'élève à visualiser le problème.

Énoncé : "${q.question}"

Types de figures disponibles :

1. triangle_rect : {"type":"triangle_rect","base":X,"hauteur":Y,"unite":"cm"}
   → Pour : Pythagore, aires triangles rectangles, échelle contre mur
   → AUSSI pour trigonométrie avec angle : phare+bateau, drone+sol, cerf-volant, skieur, câble+pylône, randonneur+pente
   → Mettre "?" pour la valeur INCONNUE (celle qu'on cherche)

2. triangle : {"type":"triangle","base":X,"hauteur":Y,"unite":"cm"}
   → Pour : aires de triangles quelconques

3. rectangle : {"type":"rectangle","largeur":X,"hauteur":Y,"unite":"cm"}
   → Pour : aires et périmètres de rectangles

4. cercle : {"type":"cercle","rayon":X,"unite":"cm"}
   → Pour : aires et périmètres de cercles

5. pythagore : {"type":"pythagore","a":X,"b":Y,"c":Z,"unite":"cm"}
   → Pour : théorème de Pythagore explicite
   → Mettre "?" pour le côté inconnu

6. thales : {"type":"thales","am":X,"ab":Y,"an":Z,"ac":W,"unite":"cm"}
   → Pour : Thalès, ombres, lampadaires, poteaux, agrandissements avec triangles semblables

7. trapeze : {"type":"trapeze","grande_base":X,"petite_base":Y,"hauteur":Z,"unite":"cm"}
   → Pour : aires de trapèzes

8. parallelogramme : {"type":"parallelogramme","base":X,"hauteur":Y,"unite":"cm"}
   → Pour : aires de parallélogrammes

EXEMPLES TRIGONOMÉTRIE → triangle_rect :
- "Du haut d'un phare de 50 m, angle de 30°, distance au bateau ?" → {"type":"triangle_rect","base":"?","hauteur":50,"unite":"m"}
- "Drone à 80 m, angle 45°, distance horizontale ?" → {"type":"triangle_rect","base":"?","hauteur":80,"unite":"m"}
- "Cerf-volant fil 50 m, angle 60°, hauteur ?" → {"type":"triangle_rect","base":"?","hauteur":"?","unite":"m"}
- "Skieur pente 30°, 400 m sur piste, dénivelé ?" → {"type":"triangle_rect","base":"?","hauteur":"?","unite":"m"}
- "Câble pylône 15 m, point sol à 20 m, angle ?" → {"type":"triangle_rect","base":20,"hauteur":15,"unite":"m"}
- "Randonneur angle 35°, distance horizontale 200 m, altitude ?" → {"type":"triangle_rect","base":200,"hauteur":"?","unite":"m"}

RÈGLES :
- Trigonométrie avec angle ET distance/hauteur → triangle_rect avec mesures connues et "?" pour l'inconnue
- Volumes (sphère, cylindre, pyramide, prisme, cône, boule) → null
- Rotation, translation, symétrie → null
- Homothétie sans triangle visible → null
- Échelle/carte sans figure → null
- Coordonnées → null
- Probabilités, statistiques, algèbre → null

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

        if (!modeTest && figure !== null) {
          await fetch(
            `${SUPA_URL}/rest/v1/${table}?id=eq.${q.id}`,
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

      await new Promise(r => setTimeout(r, 500))
    }

    const avecFigure = resultats.filter(r => r.figure_generee !== null).length
    const sansFigure = resultats.filter(r => r.figure_generee === null).length

    return res.status(200).json({
      mode: modeTest ? 'TEST — rien écrit en BDD' : 'PRODUCTION — figures sauvegardées',
      table,
      traite: resultats.length,
      avec_figure: avecFigure,
      sans_figure: sansFigure,
      resultats
    })

  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
