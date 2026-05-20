import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Resultats() {
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/'); return }
      const { data: rows } = await supabase
        .from('resultats')
        .select('*')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setResultats(rows || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="container">
      <nav className="nav">
        <button className="btn" onClick={() => router.push('/quiz')}>← Retour au quiz</button>
        <h2 style={{ margin: 0 }}>Mes résultats</h2>
      </nav>

      {loading && <div className="loader">Chargement...</div>}

      {!loading && resultats.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#666' }}>
          Pas encore de résultats. Lance ton premier quiz !
        </div>
      )}

      {resultats.map(r => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <strong>{r.theme}</strong>
              <span className="badge" style={{ marginLeft: 8 }}>{r.difficulte}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{r.score}/{r.total}</div>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: r.questions_ratees?.length ? 10 : 0 }}>
            {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          {r.questions_ratees?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 4 }}>Questions ratées :</div>
              {r.questions_ratees.map((q, i) => (
                <div key={i} style={{ fontSize: 12, color: '#666', padding: '4px 0', borderTop: '1px solid #f0f0ec' }}>• {q}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
