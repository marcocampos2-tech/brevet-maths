export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  const { theme, difficulte } = req.body
  const prompt = `Tu es un professeur de mathématiques préparant des élèves au Brevet des collèges français. Génère exactement 5 questions QCM de niveau "${difficulte}" sur le thème "${theme}". Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown. Format: [{"q":"question","opts":["A","B","C","D"],"answer":0,"explication":"explication"}]`
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
  })
  const data = await response.json()
  const text = data.content.map(i => i.text || '').join('').trim()
  const match = text.match(/\[[\s\S]*\]/)
  const questions = JSON.parse(match[0])
  res.status(200).json({ questions })
}
