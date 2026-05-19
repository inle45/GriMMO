import { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { printMessagesSQL } from '../lib/playerUtils'

const ELEMENT_EMOJI = { feu: '🔥', terre: '🌿', eau: '💧' }

// Messages de démonstration quand Supabase n'est pas encore configuré
const DEMO_MSGS = [
  { id: 1,  user_id: 'demo', username: 'Maldrak #A3F2', element: 'feu',   text: 'Quelqu\'un a tenu le Donjon du Tyran hier soir ?', is_premium_color: false },
  { id: 2,  user_id: 'demo', username: 'Syrel #0C1E',   element: 'eau',   text: 'Moi ! Drake Infernal en 4 rounds grâce au bonus eau 💧', is_premium_color: true },
  { id: 3,  user_id: 'demo', username: 'Thornveil #77B',element: 'terre', text: 'gg ! Vous faites équipe pour la prochaine run ?', is_premium_color: false },
  { id: 4,  user_id: 'demo', username: 'Noctis #F1C9',  element: 'terre', text: 'J\'ai drop la Couronne Maudite à ma 3e ticket boss !', is_premium_color: true },
  { id: 5,  user_id: 'demo', username: 'Kael #BD22',    element: 'feu',   text: 'Astuce niv.1 : Forêt avec Feu, les loups tombent vite', is_premium_color: false },
]

export default function Taverne({ player }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [sending, setSending]     = useState(false)
  const [online, setOnline]       = useState(isSupabaseConfigured)
  const bottomRef                 = useRef(null)
  const channelRef                = useRef(null)

  // Affichage du SQL au premier montage
  useEffect(() => { printMessagesSQL() }, [])

  // Chargement initial + abonnement Realtime
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setMessages(DEMO_MSGS)
      setOnline(false)
      return
    }

    // Charger les 50 derniers messages
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data, error }) => {
        if (error) { setMessages(DEMO_MSGS); setOnline(false); return }
        setMessages(data || [])
      })

    // Abonnement Realtime aux nouveaux messages
    channelRef.current = supabase
      .channel('grimmo-taverne')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => setMessages(prev => [...prev.slice(-99), payload.new])
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || !player || sending) return
    setInput('')
    setSending(true)

    if (!isSupabaseConfigured || !supabase) {
      // Mode démo : ajout local
      setMessages(prev => [...prev, {
        id:               Date.now(),
        user_id:          player.guest_id,
        username:         player.username,
        element:          player.element,
        text,
        is_premium_color: player.is_premium_color || false,
        created_at:       new Date().toISOString(),
      }])
    } else {
      await supabase.from('messages').insert({
        user_id:          player.guest_id,
        username:         player.username,
        text,
        is_premium_color: player.is_premium_color || false,
      })
    }
    setSending(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* En-tête */}
      <div style={{ padding: '10px 16px 6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E2E2F0' }}>Taverne des Damnés</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B6B8A' }}>
            <span style={{ color: online ? '#66BB6A' : '#FFD700' }}>●</span>
            {' '}{online ? 'En ligne · temps réel' : 'Mode démo (configurez Supabase)'}
          </p>
        </div>
        {player?.is_premium_color && (
          <span className="premium-badge">✦ Doré</span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id ?? i} msg={msg} isMe={msg.user_id === player?.guest_id} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(0,0,0,0.2)', flexShrink: 0,
      }}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={sending ? 'Envoi…' : 'Envoyer un message...'}
          maxLength={200}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 12, fontSize: 18,
            background: input.trim() ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${input.trim() ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: input.trim() ? '#FF6B35' : '#4A4A6A',
            cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >➤</button>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isMe }) {
  const el      = msg.element || 'feu'
  const elEmoji = ELEMENT_EMOJI[el] || '⚔️'
  const elRgb   = el === 'feu' ? '255,107,53' : el === 'eau' ? '79,195,247' : '129,199,132'

  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: `rgba(${elRgb}, 0.15)`, border: `1px solid rgba(${elRgb}, 0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
      }}>{elEmoji}</div>

      {/* Bulle */}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <span className={msg.is_premium_color ? 'premium-username' : ''} style={!msg.is_premium_color ? { fontSize: 10, color: `rgb(${elRgb})`, fontWeight: 600 } : { fontSize: 10 }}>
          {msg.username}
        </span>
        <div style={{
          background: isMe ? 'linear-gradient(135deg,rgba(255,107,53,0.2),rgba(206,147,216,0.12))' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isMe ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
          color: '#D8D8F0', wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  )
}
