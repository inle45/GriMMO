import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { initPlayer, persistPlayer, gainXP, createDefaultProfile, savePlayer, recalcStats } from './lib/playerUtils'
import AuthModal  from './components/AuthModal'
import BottomNav  from './components/BottomNav'
import Taverne    from './tabs/Taverne'
import Aventure   from './tabs/Aventure'
import Heros      from './tabs/Heros'
import Economie   from './tabs/Economie'

export default function App() {
  const [tab,     setTab]     = useState(1)
  const [player,  setPlayer]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Mode hors-ligne : profil invité localStorage
      initPlayer().then(p => { setPlayer(p); setLoading(false) })
      return
    }

    // Vérifier la session Supabase Auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await loadOrCreateProfile(session.user, null)
      } else {
        setShowAuth(true)
        setLoading(false)
      }
    })

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') { setPlayer(null); setShowAuth(true) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadOrCreateProfile(user, usernameOverride) {
    const { data: existing } = await supabase.from('profiles')
      .select('*').eq('auth_id', user.id).single()

    if (existing) {
      setPlayer(recalcStats(existing))
    } else {
      const guestId = user.id
      const username = usernameOverride || user.user_metadata?.username || `Damné #${guestId.slice(-4).toUpperCase()}`
      const profile  = { ...createDefaultProfile(guestId), auth_id: user.id, username, guest_id: guestId }
      const { data: created } = await supabase.from('profiles').upsert(profile, { onConflict: 'guest_id' }).select().single()
      setPlayer(created || profile)
      savePlayer(created || profile)
    }
    setShowAuth(false)
    setLoading(false)
  }

  async function handleAuthSuccess(user, username) {
    setLoading(true)
    await loadOrCreateProfile(user, username)
  }

  async function handleGuest() {
    setShowAuth(false)
    const p = await initPlayer()
    setPlayer(p)
    setLoading(false)
  }

  async function updatePlayer(patch) {
    let next
    setPlayer(prev => {
      next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      return next
    })
    await persistPlayer(next)
  }

  async function handleSignOut() {
    if (supabase && isSupabaseConfigured) await supabase.auth.signOut()
    setPlayer(null); setShowAuth(true)
  }

  if (loading) {
    return (
      <div className="phone-frame" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🗡️</div>
        <p style={{ color: '#FF6B35', fontSize: 18, fontWeight: 700, letterSpacing: '0.1em' }}>GriMMO</p>
        <p style={{ color: '#4A4A6A', fontSize: 13 }}>Initialisation du royaume…</p>
      </div>
    )
  }

  const TABS = [
    <Taverne  key="taverne"  player={player} />,
    <Aventure key="aventure" player={player} updatePlayer={updatePlayer} />,
    <Heros    key="heros"    player={player} updatePlayer={updatePlayer} />,
    <Economie key="economie" player={player} updatePlayer={updatePlayer} />,
  ]

  return (
    <div className="phone-frame">
      {showAuth && <AuthModal onSuccess={handleAuthSuccess} onGuest={handleGuest} />}

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px',
        background: 'rgba(12,12,20,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🗡️</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#FF6B35', letterSpacing: '0.08em' }}>GriMMO</span>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(255,107,53,0.15)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)', fontWeight: 600 }}>ALPHA</span>
        </div>
        {player && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9E9EBE' }}><span style={{ color: '#FFD700' }}>⚜</span> Niv.{player.level}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 10px' }}>
              <span style={{ fontSize: 12 }}>💰</span>
              <span style={{ fontSize: 12, color: '#FFD700', fontWeight: 600 }}>{player.gold}</span>
            </div>
            {isSupabaseConfigured && (
              <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#4A4A6A', fontSize: 16, cursor: 'pointer', padding: 4 }} title="Déconnexion">⏏</button>
            )}
          </div>
        )}
      </header>

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {player ? TABS[tab] : null}
      </main>

      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
