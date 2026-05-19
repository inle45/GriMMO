import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const EL_LABEL = { feu: '🔥 Feu', terre: '🌿 Terre', eau: '💧 Eau' }

export default function ProfilModal({ username, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return }
    supabase.from('profiles').select('username,level,xp,atk,def,gold,element,is_premium_color')
      .eq('username', username).single()
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [username])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div className="glass animate-in" style={{ width: '100%', maxWidth: 430, padding: '24px 20px 32px', borderRadius: '20px 20px 0 0' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6B6B8A', fontSize: 14 }}>Chargement…</p>
        ) : !profile ? (
          <p style={{ textAlign: 'center', color: '#6B6B8A', fontSize: 14 }}>Profil introuvable</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,107,53,0.15)', border: '2px solid rgba(255,107,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🧙</div>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}
                  className={profile.is_premium_color ? 'premium-username' : ''}
                  style={!profile.is_premium_color ? { color: '#E2E2F0', fontSize: 17, fontWeight: 700 } : {}}>
                  {profile.username}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span className="badge badge-gold">Niv. {profile.level}</span>
                  <span className={`badge badge-${profile.element}`}>{EL_LABEL[profile.element]}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { icon: '⚔️', label: 'ATK', value: profile.atk, color: 'var(--c-fire)' },
                { icon: '🛡️', label: 'DEF', value: profile.def, color: 'var(--c-water)' },
                { icon: '💰', label: 'Or',  value: profile.gold, color: 'var(--c-gold)' },
              ].map(s => (
                <div key={s.label} className="glass" style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#6B6B8A' }}>{s.icon} {s.label}</p>
                </div>
              ))}
            </div>

            <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  )
}
