import { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { printMessagesSQL } from '../lib/playerUtils'
import ProfilModal from '../components/ProfilModal'

const ELEMENT_EMOJI = { feu: '🔥', terre: '🌿', eau: '💧' }

const DEMO_MSGS = [
  { id: 1,  user_id: 'a', username: 'Maldrak #A3F2', element: 'feu',   text: 'Quelqu\'un a tenu le Donjon du Tyran hier soir ?', is_premium_color: false },
  { id: 2,  user_id: 'b', username: 'Syrel #0C1E',   element: 'eau',   text: 'Moi ! Drake Infernal grâce au bonus eau 💧', is_premium_color: true },
  { id: 3,  user_id: 'c', username: 'Thornveil #77B',element: 'terre', text: 'gg ! Vous faites équipe pour la prochaine run ?', is_premium_color: false },
  { id: 4,  user_id: 'd', username: 'Noctis #F1C9',  element: 'terre', text: 'J\'ai drop la Couronne Maudite à ma 3e ticket boss !', is_premium_color: true },
  { id: 5,  user_id: 'e', username: 'Kael #BD22',    element: 'feu',   text: 'Astuce : Forêt avec Feu, les loups tombent vite', is_premium_color: false },
]

export default function Taverne({ player }) {
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [online, setOnline]         = useState(isSupabaseConfigured)
  const [showBoard, setShowBoard]   = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [viewProfile, setViewProfile] = useState(null)
  const bottomRef  = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => { printMessagesSQL() }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setMessages(DEMO_MSGS); setOnline(false); return
    }
    supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50)
      .then(({ data, error }) => {
        if (error) { setMessages(DEMO_MSGS); setOnline(false); return }
        setMessages(data || [])
      })

    channelRef.current = supabase.channel('grimmo-taverne')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => setMessages(prev => [...prev.slice(-99), payload.new]))
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadLeaderboard() {
    if (!isSupabaseConfigured || !supabase) {
      setLeaderboard([
        { username: 'Noctis #F1C9', level: 12, gold: 3400, is_premium_color: true },
        { username: 'Maldrak #A3F2', level: 10, gold: 2800, is_premium_color: false },
        { username: 'Syrel #0C1E', level: 9, gold: 2100, is_premium_color: true },
        { username: 'Thornveil #77B', level: 8, gold: 1900, is_premium_color: false },
        { username: 'Kael #BD22', level: 7, gold: 1400, is_premium_color: false },
      ])
      return
    }
    const { data } = await supabase.from('profiles').select('username,level,gold,is_premium_color')
      .order('level', { ascending: false }).order('gold', { ascending: false }).limit(10)
    setLeaderboard(data || [])
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !player || sending) return
    setInput(''); setSending(true)

    if (!isSupabaseConfigured || !supabase) {
      setMessages(prev => [...prev, { id: Date.now(), user_id: player.guest_id, username: player.username, element: player.element, text, is_premium_color: player.is_premium_color || false }])
    } else {
      await supabase.from('messages').insert({ user_id: player.guest_id, username: player.username, text, is_premium_color: player.is_premium_color || false })
    }
    setSending(false)
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* En-tête */}
      <div style={{ padding: '10px 16px 6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E2E2F0' }}>Taverne des Damnés</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B6B8A' }}>
            <span style={{ color: online ? '#66BB6A' : '#FFD700' }}>●</span>
            {' '}{online ? 'En ligne · temps réel' : 'Mode démo'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {player?.is_premium_color && <span className="premium-badge">✦ Doré</span>}
          <button onClick={() => { setShowBoard(true); loadLeaderboard() }} style={{
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 14,
          }} title="Classement">🏆</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id ?? i} msg={msg}
            isMe={msg.user_id === player?.guest_id}
            onNameClick={() => msg.user_id !== player?.guest_id && setViewProfile(msg.username)} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey} placeholder={sending ? 'Envoi…' : 'Message...'} maxLength={200} disabled={sending} />
        <button onClick={handleSend} disabled={!input.trim() || sending} style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12, fontSize: 18,
          background: input.trim() ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${input.trim() ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: input.trim() ? '#FF6B35' : '#4A4A6A', cursor: input.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>➤</button>
      </div>

      {/* Classement overlay */}
      {showBoard && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowBoard(false)}>
          <div className="glass animate-in" style={{ width: '100%', padding: '20px 16px 28px', borderRadius: '20px 20px 0 0' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, textAlign: 'center' }}>🏆 Classement Mondial</p>
            {leaderboard.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </span>
                <span className={p.is_premium_color ? 'premium-username' : ''}
                  style={!p.is_premium_color ? { fontSize: 14, fontWeight: 600, color: '#E2E2F0', flex: 1 } : { flex: 1 }}>
                  {p.username}
                </span>
                <span style={{ fontSize: 12, color: '#FFD700' }}>Niv. {p.level}</span>
                <span style={{ fontSize: 12, color: '#9E9EBE' }}>💰 {p.gold}</span>
              </div>
            ))}
            <button className="btn-secondary" onClick={() => setShowBoard(false)} style={{ width: '100%', marginTop: 14 }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Profil modal */}
      {viewProfile && <ProfilModal username={viewProfile} onClose={() => setViewProfile(null)} />}
    </div>
  )
}

function MessageBubble({ msg, isMe, onNameClick }) {
  const el    = msg.element || 'feu'
  const elRgb = el === 'feu' ? '255,107,53' : el === 'eau' ? '79,195,247' : '129,199,132'

  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `rgba(${elRgb},0.15)`, border: `1px solid rgba(${elRgb},0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
        {ELEMENT_EMOJI[el] || '⚔️'}
      </div>
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <span onClick={onNameClick}
          className={msg.is_premium_color ? 'premium-username' : ''}
          style={msg.is_premium_color
            ? { cursor: isMe ? 'default' : 'pointer' }
            : { fontSize: 10, color: `rgb(${elRgb})`, fontWeight: 600, cursor: isMe ? 'default' : 'pointer' }}>
          {msg.username}
        </span>
        <div style={{
          background: isMe ? 'linear-gradient(135deg,rgba(255,107,53,0.2),rgba(206,147,216,0.12))' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isMe ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          padding: '8px 12px', fontSize: 13, lineHeight: 1.5, color: '#D8D8F0', wordBreak: 'break-word',
        }}>{msg.text}</div>
      </div>
    </div>
  )
}
