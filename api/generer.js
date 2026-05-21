export default async function handler(req, res) {
  // Gestion des permissions CORS (indispensable sur Vercel)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') { 
    res.status(200).end()
    return 
  }

  try {
    const { theme, difficulte } = req.body

    // Le prompt envoyé à Claude
    const prompt = `Tu es un professeur de mathématiques préparant des élèves au Brevet des collèges français. Génère exactement 5 questions QCM de niveau "${difficulte}" sur le thème "${theme}". Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown. Format: [{"q":"question","opts":["A","B","C","D"],"answer":0,"explication":"explication"}]`

    // Appel à l'API d'Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ 
        model: 'claude-3-5-sonnet-latest', // Modèle mis à jour et corrigé
        max_tokens: 1500, 
        messages: [{ role: 'user', content: prompt }] 
      })
    })

    const data = await response.json()

    // Si Anthropic renvoie une erreur (clé invalide, solde insuffisant, etc.)
    if (data.error) {
      return res.status(500).json({ error: `Erreur Anthropic: ${data.error.message}` })
    }

    // Extraction et nettoyage de la réponse textuelle de Claude
    const text = data.content.map(i => i.text || '').join('').trim()
    const match = text.match(/\[[\s\S]*\]/)

    if (!match) {
      return res.status(500).json({ error: "L'IA n'a pas renvoyé un format de données valide." })
    }

    // Conversion du texte en vrai tableau JSON pour ton application
    const questions = JSON.parse(match[0])
    res.status(200).json({ questions })

  } catch (e) {
    // Si une erreur survient pendant le calcul ou la lecture du code
    res.status(500).json({ error: e.message })
  }
}
