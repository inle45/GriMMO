import { useState } from 'react'

const ELEMENT_LABELS = { feu: '🔥 Feu', terre: '🌿 Terre', eau: '💧 Eau' }
const ELEMENT_COLORS = { feu: 'var(--c-fire)', terre: 'var(--c-earth)', eau: 'var(--c-water)' }

export default function Heros({ player, updatePlayer }) {
  const [selectedSlot, setSelectedSlot] = useState(null)

  if (!player) return null

  const xpPct    = Math.round((player.xp / player.xp_next) * 100)
  const hpPct    = Math.round((player.hp / player.hp_max) * 100)
  const hpColor  = hpPct > 60 ? '#66BB6A' : hpPct > 30 ? '#FFD700' : '#EF5350'
  const elColor  = ELEMENT_COLORS[player.element] || '#9E9EBE'

  function changeElement(el) {
    updatePlayer({ element: el })
  }

  function useItem(slot) {
    const item = player.inventory[slot]
    if (!item || item.type !== 'consommable') return

    let updated = { ...player }
    if (item.effect?.startsWith('hp+')) {
      const amount = parseInt(item.effect.replace('hp+', ''))
      updated.hp = Math.min(updated.hp_max, updated.hp + amount)
    }

    const newInv = [...updated.inventory]
    if ((item.qty || 1) <= 1) {
      newInv[slot] = null
    } else {
      newInv[slot] = { ...item, qty: item.qty - 1 }
    }
    updated.inventory = newInv
    updatePlayer(updated)
    setSelectedSlot(null)
  }

  const selectedItem = selectedSlot !== null ? player.inventory[selectedSlot] : null

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Identité */}
      <div className="glass" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: `rgba(${elColor === 'var(--c-fire)' ? '255,107,53' : elColor === 'var(--c-earth)' ? '129,199,132' : '79,195,247'}, 0.15)`,
          border: `2px solid ${elColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
          boxShadow: `0 0 16px rgba(${elColor === 'var(--c-fire)' ? '255,107,53' : elColor === 'var(--c-earth)' ? '129,199,132' : '79,195,247'}, 0.3)`,
        }}>
          🧙
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E2E2F0' }}>{player.username}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span className="badge badge-gold">Niv. {player.level}</span>
            <span className={`badge badge-${player.element}`}>{ELEMENT_LABELS[player.element]}</span>
          </div>
        </div>
      </div>

      {/* Barres PV et XP */}
      <div className="glass" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: '#9E9EBE', fontWeight: 600 }}>❤️  Points de Vie</span>
            <span style={{ fontSize: 12, color: hpColor, fontWeight: 700 }}>{player.hp} / {player.hp_max}</span>
          </div>
          <div className="stat-bar-bg">
            <div className="stat-bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: '#9E9EBE', fontWeight: 600 }}>✨ Expérience</span>
            <span style={{ fontSize: 12, color: 'var(--c-xp)', fontWeight: 700 }}>{player.xp} / {player.xp_next}</span>
          </div>
          <div className="stat-bar-bg">
            <div className="stat-bar-fill" style={{ width: `${xpPct}%`, background: 'var(--c-xp)' }} />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B6B8A', fontWeight: 600, letterSpacing: '0.05em' }}>
          STATISTIQUES
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatCard icon="⚔️"  label="Attaque"  value={player.atk}  color="var(--c-fire)"  />
          <StatCard icon="🛡️"  label="Défense"  value={player.def}  color="var(--c-water)" />
          <StatCard icon="💰"  label="Or"        value={player.gold} color="var(--c-gold)"  />
          <StatCard icon="🎫"  label="Tickets Boss" value={`${player.boss_tickets}/3`} color="var(--c-xp)" />
        </div>
      </div>

      {/* Choix d'élément */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B6B8A', fontWeight: 600, letterSpacing: '0.05em' }}>
          AFFINITÉ ÉLÉMENTAIRE
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {['feu', 'terre', 'eau'].map(el => (
            <button
              key={el}
              onClick={() => changeElement(el)}
              style={{
                flex: 1, padding: '10px 6px', borderRadius: 12,
                background: player.element === el
                  ? `rgba(${el==='feu'?'255,107,53':el==='terre'?'129,199,132':'79,195,247'}, 0.18)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${player.element === el
                  ? (el==='feu'?'rgba(255,107,53,0.6)':el==='terre'?'rgba(129,199,132,0.6)':'rgba(79,195,247,0.6)')
                  : 'rgba(255,255,255,0.1)'}`,
                color: player.element === el ? ELEMENT_COLORS[el] : '#6B6B8A',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 20 }}>{el==='feu'?'🔥':el==='terre'?'🌿':'💧'}</span>
              <span>{el.charAt(0).toUpperCase() + el.slice(1)}</span>
            </button>
          ))}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#4A4A6A', textAlign: 'center' }}>
          Feu &gt; Terre &gt; Eau &gt; Feu — choisissez en fonction de la zone
        </p>
      </div>

      {/* Inventaire */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B6B8A', fontWeight: 600, letterSpacing: '0.05em' }}>
          INVENTAIRE
        </p>
        <div className="inv-grid">
          {Array.from({ length: 15 }).map((_, i) => {
            const item = player.inventory[i] || null
            return (
              <InventorySlot
                key={i}
                item={item}
                selected={selectedSlot === i}
                onClick={() => setSelectedSlot(selectedSlot === i ? null : i)}
              />
            )
          })}
        </div>

        {/* Détail de l'objet sélectionné */}
        {selectedItem && (
          <div className="glass animate-in" style={{ marginTop: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{selectedItem.emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#E2E2F0' }}>{selectedItem.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B6B8A' }}>
                  {selectedItem.rarity?.charAt(0).toUpperCase() + selectedItem.rarity?.slice(1)} · {selectedItem.type}
                  {selectedItem.qty > 1 && ` · x${selectedItem.qty}`}
                </p>
              </div>
            </div>
            {selectedItem.effect && (
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9E9EBE' }}>
                Effet : <span style={{ color: '#66BB6A' }}>{selectedItem.effect}</span>
              </p>
            )}
            {selectedItem.type === 'consommable' && (
              <button className="btn-primary" style={{ width: '100%', fontSize: 13 }}
                onClick={() => useItem(selectedSlot)}>
                Utiliser
              </button>
            )}
            {selectedItem.equipped && (
              <p style={{ margin: 0, fontSize: 12, color: '#FF6B35', textAlign: 'center' }}>✓ Équipé</p>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color }}>{value}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#6B6B8A' }}>{label}</p>
      </div>
    </div>
  )
}

function InventorySlot({ item, selected, onClick }) {
  const rarityClass = item ? `rarity-${item.rarity}` : ''
  return (
    <div
      className={`inv-slot ${item ? 'has-item' : ''} ${rarityClass} ${selected ? 'ring-2' : ''}`}
      onClick={onClick}
      style={selected ? { outline: '2px solid rgba(255,107,53,0.6)' } : {}}
      title={item ? `${item.name}${item.qty > 1 ? ` x${item.qty}` : ''}` : ''}
    >
      {item ? (
        <>
          <span>{item.emoji}</span>
          {item.qty > 1 && (
            <span style={{
              position: 'absolute', bottom: 2, right: 4,
              fontSize: 9, color: '#FFD700', fontWeight: 700,
            }}>{item.qty}</span>
          )}
          {item.equipped && (
            <span style={{
              position: 'absolute', top: 2, right: 3,
              fontSize: 8, color: '#FF6B35',
            }}>✓</span>
          )}
        </>
      ) : null}
    </div>
  )
}
