export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const SUPA_URL = 'https://vkkgadwqumqqwpaayjac.supabase.co'
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}`, 'apikey': SUPA_KEY }

  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/inscriptions_brevet?select=date_choisie`, { headers })
    const data = await r.json()
    const places = { '17 juin': 0, '24 juin': 0 }
    data.forEach(d => {
      if (d.date_choisie === '17 juin') places['17 juin']++
      else if (d.date_choisie === '24 juin') places['24 juin']++
      else if (d.date_choisie === 'les deux') { places['17 juin']++; places['24 juin']++ }
    })
    return res.status(200).json({ places })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
