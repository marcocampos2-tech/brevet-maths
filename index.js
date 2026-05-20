import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setError('')
    setMsg('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/quiz')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMsg('Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📐</div>
        <h1>Brevet Maths</h1>
        <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Prépare ton brevet avec des QCM IA</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          <button className={`btn btn-full ${mode === 'login' ? 'btn-primary' : ''}`} onClick={() => setMode('login')}>Se connecter</button>
          <button className={`btn btn-full ${mode === 'register' ? 'btn-primary' : ''}`} onClick={() => setMode('register')}>Créer un compte</button>
        </div>

        <label>Email</label>
        <input type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <label>Mot de passe</label>
        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        {error && <p className="error">{error}</p>}
        {msg && <p className="success">{msg}</p>}
      </div>
    </div>
  )
}
