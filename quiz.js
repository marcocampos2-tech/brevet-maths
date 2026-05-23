import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

const THEMES = [
  { label: 'Nombres & calculs', value: 'Nombres et calculs', icon: '🔢' },
  { label: 'Géométrie', value: 'Géométrie', icon: '📐' },
  { label: 'Algèbre', value: 'Algèbre et équations', icon: '🔣' },
  { label: 'Stats & probas', value: 'Statistiques et probabilités', icon: '📊' },
  { label: 'Fonctions', value: 'Fonctions', icon: '📈' },
  { label: 'Tout mélanger', value: 'Mélange de tous les thèmes', icon: '✨' },
]

export default function Quiz() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(THEMES[0].value)
  const [diff, setDiff] = useState('moyen')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  // 🔐 Écoute dynamique et propre de la session Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function generer() {
    setLoading(true)
    setQuestions([])
    setAnswers({})
    setSubmitted({})
    setSaved(false)
    try {
      const res = await fetch('/api/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, difficulte: diff })
      })
      const data = await res.json()
      if (data.questions) setQuestions(data.questions)
    } catch (e) {
      alert('Erreur lors de la génération. Réessaie.')
    }
    setLoading(false)
  }

  function pick(qi, oi) {
    if (submitted[qi] !== undefined) return
    setAnswers(a => ({ ...a, [qi]: oi }))
  }

  function valider(qi) {
    if (answers[qi] === undefined) return
    const ok = answers[qi] === questions[qi].answer
    setSubmitted(s => ({ ...s, [qi]: ok }))
  }

  async function sauvegarder() {
    if (!user) return alert("Vous devez être connecté pour enregistrer vos résultats.")
    
    const correct = Object.values(submitted).filter(Boolean).length
    const ratees = questions
      .filter((_, i) => submitted[i] === false)
      .map(q => q.q)

    try {
      const { error } = await supabase.from('resultats').insert({
        user_id: user.id,
        email: user.email,
        theme,
        difficulte: diff,
        score: correct,
        total: questions.length,
        questions_ratees: ratees
      })
      
      if (error) throw error
      setSaved(true)
    } catch (error) {
      alert("Erreur lors de la sauvegarde des résultats.")
    }
  }

  const nbSoumis = Object.keys(submitted).length
  const nbCorrects = Object.values(submitted).filter(Boolean).length
  const terminer = nbSoumis === questions.length && questions.length > 0
  
  // 🧮 Sécurisation du pourcentage (évite le NaN et la division par 0)
  const pourcentagereussite = nbSoumis > 0 ? Math.round((nbCorrects / nbSoumis) * 100) : 0

  return (
    <div className="container">
      <nav className="nav">
        <div>
          <span style={{ fontSize: 20 }}>📐</span>
          <strong style={{ marginLeft: 8 }}>Brevet Maths</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#666' }}>{user?.email}</span>
          <button className="btn" onClick={() => router.push('/resultats')}>Mes résultats</button>
          <button className="btn" onClick={logout}>Déconnexion</button>
        </div>
      </nav>

      <div className="card">
        <h2>Choisir un thème</h2>
        <div className="theme-grid">
          {THEMES.map(t => (
            <div key={t.value} className={`theme-card ${theme === t.value ? 'active' : ''}`} onClick={() => setTheme(t.value)}>
              <div className="icon">{t.icon}</div>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label style={{ marginBottom: 8, display: 'block' }}>Niveau de difficulté</label>
          <div className="diff-row">
            {['facile', 'moyen', 'difficile'].map(d => (
              <button key={d} className={`diff-btn ${diff === d ? 'active' : ''}`} onClick={() => setDiff(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={generer} disabled={loading}>
          {loading ? '⏳ Génération en cours...' : '🎲 Générer 5 questions'}
        </button>
      </div>

      {questions.length > 0 && (
        <>
          {nbSoumis > 0 && (
            <div className="score-bar">
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Score</div>
                <div className="score-val">{nbCorrects}/{nbSoumis}</div>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{ width: `${pourcentagereussite}%` }} />
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>{pourcentagereussite}%</div>
            </div>
          )}

          {questions.map((q, i) => {
            const sel = answers[i]
            const done = submitted[i] !== undefined
            const letters = ['A', 'B', 'C', 'D']
            return (
              <div className="card" key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#999' }}>Question {i + 1}/{questions.length}</span>
                  <span className="badge">{diff}</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 14 }}>{q.q}</p>

                {/* 📊 RENDU SÉCURISÉ DU TABLEAU MATHÉMATIQUE */}
                {q.tableau && q.tableau.headers && q.tableau.headers.length > 0 && (
                  <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                    <table className="tableau-maths" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                      <thead>
                        <tr>
                          {q.tableau.headers.map((header, index) => (
                            <th key={index} style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#f9f9f9' }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {q.tableau.rows && q.tableau.rows.length > 0 && (
                        <tbody>
                          {q.tableau.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  </div>
                )}

                <div>
                  {q.opts.map((opt, j) => {
                    let cls = 'option'
                    if (done) {
                      if (j === q.answer) cls += ' correct'
                      else if (j === sel) cls += ' wrong'
                    } else if (j === sel) cls += ' selected'
                    return (
                      <div key={j} className={cls} onClick={() => pick(i, j)} style={done ? { cursor: 'default' } : {}}>
                        <span className="option-letter">{letters[j]}</span>
                        {opt}
                      </div>
                    )
                  })}
                </div>
                {!done && (
                  <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={() => valider(i)} disabled={sel === undefined}>
                    Valider
                  </button>
                )}
                {done && (
                  <div className="explication">
                    <strong>{submitted[i] ? '✓ Bravo !' : '✗ Pas tout à fait.'}</strong> {q.explication}
                  </div>
                )}
              </div>
            )
          })}

          {terminer && !saved && (
            <button className="btn btn-primary btn-full" onClick={sauvegarder}>
              💾 Enregistrer mes résultats
            </button>
          )}
          {saved && (
            <div className="card" style={{ textAlign: 'center', color: '#27ae60' }}>
              ✅ Résultats enregistrés ! Score : {nbCorrects}/{questions.length}
            </div>
          )}
        </>
      )}
    </div>
  )
}
