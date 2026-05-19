import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal({ onSuccess, onGuest }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)

    if (mode === 'register') {
      if (username.trim().length < 3) { setError('Pseudo trop court (min 3 caractères)'); setLoading(false); return }
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() } } })
      if (err) { setError(err.message); setLoading(false); return }
      onSuccess(data.user, username.trim())
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      onSuccess(data.user, null)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 360, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🗡️</div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#FF6B35', letterSpacing: '0.1em' }}>GriMMO</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B6B8A' }}>Royaume des Damnés</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null) }} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: mode === m ? 'rgba(255,107,53,0.2)' : 'transparent',
              color: mode === m ? '#FF6B35' : '#6B6B8A',
              fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
            }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input className="chat-input" placeholder="Pseudo (ex: Maldrak)" value={username}
              onChange={e => setUsername(e.target.value)} required maxLength={20} />
          )}
          <input className="chat-input" type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <input className="chat-input" type="password" placeholder="Mot de passe (min 6 car.)" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6} />

          {error && <p style={{ margin: 0, fontSize: 12, color: '#EF5350', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 15 }}>
            {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 11, color: '#4A4A6A' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button className="btn-secondary" onClick={onGuest} style={{ width: '100%', padding: 11, fontSize: 13 }}>
          👻 Jouer en invité (progression non sauvegardée)
        </button>
      </div>
    </div>
  )
}
