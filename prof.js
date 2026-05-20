import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Prof() {
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(true)
  const [autho, setAutho] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/'); return }
      const profEmail = process.env.NEXT_PUBLIC_PROF_EMAIL
      if (data.session.user.email !== profEmail) {
        router.push('/quiz'); return
      }
      setAutho(true)
      const { data: rows } = await supabase
        .from('resultats')
        .select('*')
        .order('created_at', { ascending: false })
      setResultats(rows || [])
      setLoading(false)
    })
  }, [])

  const eleves = [...new Set(resultats.map(r => r.email))]
  const themeStats = resultats.reduce((acc, r) => {
    if (!acc[r.theme]) acc[r.theme] = { total: 0, correct: 0, sessions: 0 }
    acc[r.theme].correct += r.score
    acc[r.theme].total += r.total
    acc[r.theme].sessions += 1
    return acc
  }, {})

  const questionsRatees = resultats
    .flatMap(r => r.questions_ratees || [])
    .reduce((acc, q) => { acc[q] = (acc[q] || 0) + 1; return acc }, {})
  const topRatees = Object.entries(questionsRatees).sort((a, b) => b[1] - a[1]).slice(0, 5)

  if (!autho) return null

  return (
    <div className="container">
      <nav className="nav">
        <div>
          <span style={{ fontSize: 20 }}>🎓</span>
          <strong style={{ marginLeft: 8 }}>Tableau de bord professeur</strong>
        </div>
        <button className="btn" onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>Déconnexion</button>
      </nav>

      {loading && <div className="loader">Chargement...</div>}

      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
            {[
              { label: 'Élèves actifs', val: eleves.length },
              { label: 'Sessions totales', val: resultats.length },
              { label: 'Moyenne générale', val: resultats.length ? Math.round((resultats.reduce((a, r) => a + r.score / r.total, 0) / resultats.length) * 100) + '%' : '-' }
            ].map(s => (
              <div className="card" key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 600 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2>Résultats par thème</h2>
            <table>
              <thead>
                <tr>
                  <th>Thème</th>
                  <th>Sessions</th>
                  <th>Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(themeStats).map(([t, s]) => (
                  <tr key={t}>
                    <td>{t}</td>
                    <td>{s.sessions}</td>
                    <td><strong>{Math.round((s.correct / s.total) * 100)}%</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {topRatees.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2>Questions les plus ratées</h2>
              {topRatees.map(([q, n]) => (
                <div key={q} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0ec', fontSize: 13 }}>
                  <span style={{ color: '#333', flex: 1 }}>{q}</span>
                  <span style={{ color: '#c0392b', fontWeight: 600, marginLeft: 12 }}>{n}× ratée</span>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h2>Dernières sessions</h2>
            <table>
              <thead>
                <tr><th>Élève</th><th>Thème</th><th>Niveau</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {resultats.slice(0, 20).map(r => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td style={{ fontSize: 12 }}>{r.theme}</td>
                    <td><span className="badge">{r.difficulte}</span></td>
                    <td><strong>{r.score}/{r.total}</strong></td>
                    <td style={{ fontSize: 12, color: '#999' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
