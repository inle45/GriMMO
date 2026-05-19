import { useState, useEffect, useRef } from 'react'

const ELEMENT_EMOJI = { feu: '🔥', terre: '🌿', eau: '💧' }
const ELEMENT_COLOR = { feu: 'var(--c-fire)', terre: 'var(--c-earth)', eau: 'var(--c-water)' }

const FAKE_HISTORY = [
  { id: 1,  user: 'Maldrak #A3F2', el: 'feu',   text: 'Quelqu\'un a tenu le Donjon du Tyran hier soir ?' },
  { id: 2,  user: 'Syrel #0C1E',   el: 'eau',   text: 'Moi ! Drake Infernal en 4 rounds grâce au bonus eau 💧' },
  { id: 3,  user: 'Thornveil #77B',el: 'terre', text: 'gg ! Vous faites équipe pour la prochaine run ?' },
  { id: 4,  user: 'Maldrak #A3F2', el: 'feu',   text: 'Oui ! On cherche un 3e, venez en MP 🔥' },
  { id: 5,  user: 'Vesper #2DA0',  el: 'eau',   text: 'La mise à jour de la Crypte c\'est quand ?' },
  { id: 6,  user: 'Noctis #F1C9',  el: 'terre', text: 'J\'ai drop la Couronne Maudite à ma 3e ticket boss !' },
  { id: 7,  user: 'Syrel #0C1E',   el: 'eau',   text: 'Pas possible 😱 c\'est une légenaire non ?' },
  { id: 8,  user: 'Noctis #F1C9',  el: 'terre', text: 'Si si ! Chance de 3% apparemment. Screenshot à venir' },
  { id: 9,  user: 'Kael #BD22',    el: 'feu',   text: 'Astuce niv.1 : Forêt avec élément Feu, les loups tombent vite' },
  { id: 10, user: 'Thornveil #77B',el: 'terre', text: 'Le marché entre joueurs a des Potions de Lich à 40 Or 🧪' },
]

const BOT_MESSAGES = [
  { user: 'Elindra #88E2', el: 'eau',   text: 'La taverne est animée ce soir !' },
  { user: 'Ragnok #F0A1',  el: 'feu',   text: 'Un boss que personne n\'a encore battu ? Le Sphinx de Cristal 👁️' },
  { user: 'Liriel #34CC',  el: 'terre', text: 'Tu montes comment ton ATK toi ? Arme ou stats ?' },
  { user: 'Varkon #11A9',  el: 'feu',   text: 'L\'Échoppe PNJ vend des Runes de Puissance ce soir seulement !' },
  { user: 'Oria #5F78',    el: 'eau',   text: 'N\'oubliez pas de reset vos tickets Boss à minuit 🕛' },
]

export default function Taverne({ player }) {
  const [messages, setMessages] = useState(FAKE_HISTORY)
  const [input, setInput]       = useState('')
  const bottomRef               = useRef(null)
  const nextId                  = useRef(FAKE_HISTORY.length + 1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulation de messages arrivant automatiquement
  useEffect(() => {
    let idx = 0
    const interval = setInterval(() => {
      if (idx < BOT_MESSAGES.length) {
        const msg = BOT_MESSAGES[idx]
        setMessages(prev => [...prev, { ...msg, id: nextId.current++ }])
        idx++
      }
    }, 8000 + Math.random() * 7000)
    return () => clearInterval(interval)
  }, [])

  function handleSend() {
    const text = input.trim()
    if (!text || !player) return
    setMessages(prev => [...prev, {
      id:   nextId.current++,
      user: player.username,
      el:   player.element,
      text,
      isMe: true,
    }])
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* En-tête onglet */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E2E2F0' }}>
          Taverne des Damnés
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B6B8A' }}>
          <span style={{ color: '#66BB6A' }}>●</span> {messages.length + 120} aventuriers en ligne
        </p>
      </div>

      {/* Liste des messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.isMe} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Envoyer un message..."
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            flexShrink: 0,
            width: 40, height: 40,
            background: input.trim() ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${input.trim() ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12,
            color: input.trim() ? '#FF6B35' : '#4A4A6A',
            fontSize: 18,
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isMe }) {
  const elColor = ELEMENT_COLOR[msg.el] || '#9E9EBE'
  const elEmoji = ELEMENT_EMOJI[msg.el] || '⚪'

  return (
    <div style={{
      display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
      gap: 8, alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: `rgba(${hexToRgb(elColor)}, 0.15)`,
        border: `1px solid rgba(${hexToRgb(elColor)}, 0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
      }}>
        {elEmoji}
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 2,
        alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <span style={{ fontSize: 10, color: elColor, fontWeight: 600 }}>{msg.user}</span>
        <div style={{
          background: isMe
            ? 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(206,147,216,0.12))'
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isMe ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          padding: '8px 12px',
          fontSize: 13,
          lineHeight: 1.5,
          color: '#D8D8F0',
          wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  )
}

function hexToRgb(cssVar) {
  const map = {
    'var(--c-fire)':  '255,107,53',
    'var(--c-water)': '79,195,247',
    'var(--c-earth)': '129,199,132',
  }
  return map[cssVar] || '176,176,200'
}
