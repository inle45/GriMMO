import { useState } from 'react'
import { recalcStats, parseItemBonus } from '../lib/playerUtils'

const AVATARS = ['🧙','⚔️','🗡️','🛡️','🏹','🪄','💀','👹','🧝','🧌','🐉','🦅','🐺','🦇','🧛','🧟','👺','🔱','⚡','🌑']
const ELEMENT_LABELS = { feu: '🔥 Feu', terre: '🌿 Terre', eau: '💧 Eau' }
const ELEMENT_COLORS = { feu: 'var(--c-fire)', terre: 'var(--c-earth)', eau: 'var(--c-water)' }

// Slots d'équipement exclusifs : un seul objet par type
const EQUIP_SLOTS = [
  { type: 'arme',       icon: '⚔️', label: 'Arme'      },
  { type: 'armure',     icon: '🛡️', label: 'Armure'    },
  { type: 'accessoire', icon: '💍', label: 'Accessoire' },
]
const EQUIPPABLE_TYPES = new Set(['arme', 'armure', 'accessoire'])

function elRgb(el) { return el==='feu'?'255,107,53':el==='eau'?'79,195,247':'129,199,132' }

export default function Heros({ player, updatePlayer }) {
  const [selSlot,       setSelSlot]       = useState(null)
  const [showAvatar,    setShowAvatar]    = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!player) return null

  const xpPct   = Math.round((player.xp   / player.xp_next)  * 100)
  const hpPct   = Math.round((player.hp   / player.hp_max)   * 100)
  const hpColor = hpPct > 60 ? '#66BB6A' : hpPct > 30 ? '#FFD700' : '#EF5350'

  // Item actuellement équipé pour chaque type
  const equippedByType = {}
  for (const item of (player.inventory || [])) {
    if (item?.equipped && EQUIPPABLE_TYPES.has(item.type)) {
      equippedByType[item.type] = item
    }
  }

  function selectSlot(i) {
    setSelSlot(selSlot === i ? null : i)
    setConfirmDelete(false)
  }

  function useItem(slot) {
    const item = player.inventory[slot]
    if (!item || item.type !== 'consommable') return
    let updated = { ...player }
    if (item.effect?.startsWith('hp+')) updated.hp = Math.min(updated.hp_max, updated.hp + parseInt(item.effect.replace('hp+', '')))
    const inv = [...updated.inventory]
    inv[slot] = item.qty > 1 ? { ...item, qty: item.qty - 1 } : null
    updated.inventory = inv
    updatePlayer(updated)
    setSelSlot(null)
  }

  // Équipement exclusif : déséquipe tout autre item du même type avant d'équiper
  function toggleEquip(slot) {
    const item = player.inventory[slot]
    if (!item || !EQUIPPABLE_TYPES.has(item.type)) return
    const inv = [...player.inventory]
    if (item.equipped) {
      inv[slot] = { ...item, equipped: false }
    } else {
      for (let i = 0; i < inv.length; i++) {
        if (i !== slot && inv[i]?.type === item.type && inv[i]?.equipped) {
          inv[i] = { ...inv[i], equipped: false }
        }
      }
      inv[slot] = { ...item, equipped: true }
    }
    updatePlayer(recalcStats({ ...player, inventory: inv }))
  }

  function deleteItem(slot) {
    const inv = [...player.inventory]
    inv[slot] = null
    updatePlayer(recalcStats({ ...player, inventory: inv }))
    setSelSlot(null)
    setConfirmDelete(false)
  }

  const selectedItem = selSlot !== null ? player.inventory[selSlot] : null

  // Comparaison : item sélectionné vs item équipé du même type
  const isEquippable   = selectedItem && EQUIPPABLE_TYPES.has(selectedItem.type)
  const rivalEquipped  = isEquippable && !selectedItem.equipped ? equippedByType[selectedItem.type] : null
  const selBonus       = parseItemBonus(selectedItem?.effect)
  const rivalBonus     = parseItemBonus(rivalEquipped?.effect)
  const atkDiff        = selBonus.atk - rivalBonus.atk
  const defDiff        = selBonus.def - rivalBonus.def

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:14 }}>

      {/* Avatar picker overlay */}
      {showAvatar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowAvatar(false)}>
          <div className="glass animate-in" style={{ width:'100%', maxWidth:430, padding:'20px 16px 32px', borderRadius:'20px 20px 0 0' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ margin:'0 0 14px', fontWeight:700, fontSize:15, textAlign:'center' }}>Choisir un Avatar</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
              {AVATARS.map(av => (
                <button key={av} onClick={() => { updatePlayer({ avatar: av }); setShowAvatar(false) }}
                  style={{ fontSize:30, background: player.avatar===av?'rgba(255,107,53,0.2)':'rgba(255,255,255,0.05)',
                    border:`1px solid ${player.avatar===av?'rgba(255,107,53,0.6)':'rgba(255,255,255,0.1)'}`,
                    borderRadius:14, padding:'10px 0', cursor:'pointer', transition:'all 0.15s' }}>
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Identité + Avatar */}
      <div className="glass" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => setShowAvatar(true)} style={{
          width:60, height:60, borderRadius:18, flexShrink:0, cursor:'pointer', transition:'all 0.2s',
          background:`rgba(${elRgb(player.element)},0.15)`,
          border:`2px solid rgba(${elRgb(player.element)},0.6)`,
          boxShadow:`0 0 16px rgba(${elRgb(player.element)},0.3)`,
          fontSize:30, display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
        }}>
          {player.avatar || '🧙'}
          <span style={{ position:'absolute', bottom:-4, right:-4, fontSize:12, background:'rgba(255,107,53,0.8)', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</span>
        </button>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#E2E2F0' }}
            className={player.is_premium_color ? 'premium-username' : ''}>
            {player.username}
          </p>
          <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
            <span className="badge badge-gold">Niv. {player.level}</span>
            <span className={`badge badge-${player.element}`}>{ELEMENT_LABELS[player.element]}</span>
            {player.is_premium_color && <span className="badge badge-gold">✦ Doré</span>}
          </div>
        </div>
      </div>

      {/* Barres PV / XP */}
      <div className="glass" style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <Bar label="❤️  Points de Vie" value={`${player.hp} / ${player.hp_max}`} color={hpColor}    pct={hpPct} />
        <Bar label="✨ Expérience"     value={`${player.xp} / ${player.xp_next}`} color='var(--c-xp)' pct={xpPct} />
      </div>

      {/* Stats */}
      <div>
        <Label>STATISTIQUES</Label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <StatCard icon="⚔️" label="Attaque"     value={player.atk}  base={player.base_atk} color="var(--c-fire)"  />
          <StatCard icon="🛡️" label="Défense"     value={player.def}  base={player.base_def} color="var(--c-water)" />
          <StatCard icon="💰" label="Or"           value={player.gold} color="var(--c-gold)"  />
          <StatCard icon="🎫" label="Tickets Boss" value={`${player.boss_tickets}/3`} color="var(--c-xp)" />
        </div>
      </div>

      {/* Slots d'équipement */}
      <div>
        <Label>ÉQUIPEMENT</Label>
        <div style={{ display:'flex', gap:8 }}>
          {EQUIP_SLOTS.map(({ type, icon, label }) => {
            const eq = equippedByType[type]
            return (
              <div key={type} className="glass" style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:0 }}>
                <span style={{ fontSize:11, color:'#6B6B8A', fontWeight:600, letterSpacing:'0.04em' }}>{label.toUpperCase()}</span>
                {eq ? (
                  <button onClick={() => {
                    const idx = player.inventory.findIndex(i => i?.id === eq.id)
                    if (idx >= 0) selectSlot(idx)
                  }} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <span style={{ fontSize:26 }}>{eq.emoji}</span>
                    <span style={{ fontSize:10, color:'#E2E2F0', fontWeight:600, textAlign:'center', lineHeight:1.2, maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{eq.name}</span>
                    {eq.effect && <span style={{ fontSize:10, color:'#66BB6A', fontWeight:700 }}>{eq.effect}</span>}
                  </button>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:0.35 }}>
                    <span style={{ fontSize:26 }}>{icon}</span>
                    <span style={{ fontSize:10, color:'#6B6B8A' }}>Vide</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Affinité élémentaire */}
      <div>
        <Label>AFFINITÉ ÉLÉMENTAIRE</Label>
        <div style={{ display:'flex', gap:8 }}>
          {['feu','terre','eau'].map(el => (
            <button key={el} onClick={() => updatePlayer({ element: el })}
              style={{ flex:1, padding:'10px 6px', borderRadius:12, cursor:'pointer', transition:'all 0.2s',
                background: player.element===el?`rgba(${elRgb(el)},0.18)`:'rgba(255,255,255,0.04)',
                border:`1px solid ${player.element===el?`rgba(${elRgb(el)},0.6)`:'rgba(255,255,255,0.1)'}`,
                color: player.element===el?ELEMENT_COLORS[el]:'#6B6B8A',
                fontSize:13, fontWeight:600, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
              <span style={{ fontSize:20 }}>{el==='feu'?'🔥':el==='terre'?'🌿':'💧'}</span>
              {el.charAt(0).toUpperCase()+el.slice(1)}
            </button>
          ))}
        </div>
        <p style={{ margin:'6px 0 0', fontSize:11, color:'#4A4A6A', textAlign:'center' }}>Feu &gt; Terre &gt; Eau &gt; Feu</p>
      </div>

      {/* Inventaire */}
      <div>
        <Label>INVENTAIRE <span style={{ color:'#4A4A6A', fontWeight:400 }}>({(player.inventory||[]).filter(Boolean).length}/15)</span></Label>
        <div className="inv-grid">
          {Array.from({ length: 15 }).map((_, i) => {
            const item = player.inventory[i] || null
            return <InventorySlot key={i} item={item} selected={selSlot===i} onClick={() => selectSlot(i)} />
          })}
        </div>

        {selectedItem && (
          <div className="glass animate-in" style={{ marginTop:10, padding:'12px 14px' }}>

            {/* En-tête item */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>{selectedItem.emoji}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#E2E2F0' }}>{selectedItem.name}</p>
                <p style={{ margin:'2px 0 0', fontSize:11, color:'#6B6B8A' }}>
                  {selectedItem.rarity} · {selectedItem.type}
                  {selectedItem.qty > 1 ? ` · x${selectedItem.qty}` : ''}
                </p>
              </div>
              {selectedItem.equipped && (
                <span style={{ fontSize:11, color:'#FF6B35', fontWeight:700, background:'rgba(255,107,53,0.12)', border:'1px solid rgba(255,107,53,0.3)', borderRadius:6, padding:'2px 7px' }}>ÉQUIPÉ</span>
              )}
            </div>

            {selectedItem.effect && (
              <p style={{ margin:'0 0 10px', fontSize:12, color:'#9E9EBE' }}>
                Effet : <span style={{ color:'#66BB6A' }}>{selectedItem.effect}</span>
              </p>
            )}

            {/* Comparaison vs item équipé du même type */}
            {rivalEquipped && (
              <div style={{ margin:'0 0 10px', padding:'8px 10px', background:'rgba(255,255,255,0.04)', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin:'0 0 5px', fontSize:11, color:'#6B6B8A', fontWeight:600 }}>VS {rivalEquipped.emoji} {rivalEquipped.name}</p>
                <div style={{ display:'flex', gap:12 }}>
                  {(selBonus.atk > 0 || rivalBonus.atk > 0) && (
                    <span style={{ fontSize:12, color: atkDiff > 0 ? '#66BB6A' : atkDiff < 0 ? '#EF5350' : '#9E9EBE' }}>
                      ⚔️ {atkDiff > 0 ? `+${atkDiff}` : atkDiff}
                    </span>
                  )}
                  {(selBonus.def > 0 || rivalBonus.def > 0) && (
                    <span style={{ fontSize:12, color: defDiff > 0 ? '#66BB6A' : defDiff < 0 ? '#EF5350' : '#9E9EBE' }}>
                      🛡️ {defDiff > 0 ? `+${defDiff}` : defDiff}
                    </span>
                  )}
                  {atkDiff === 0 && defDiff === 0 && (
                    <span style={{ fontSize:12, color:'#9E9EBE' }}>Statistiques identiques</span>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation suppression */}
            {confirmDelete ? (
              <div style={{ background:'rgba(239,83,80,0.08)', border:'1px solid rgba(239,83,80,0.3)', borderRadius:10, padding:'10px 12px' }}>
                <p style={{ margin:'0 0 8px', fontSize:13, color:'#EF5350', fontWeight:600 }}>Supprimer {selectedItem.name} ?</p>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => deleteItem(selSlot)}
                    style={{ flex:1, fontSize:13, background:'rgba(239,83,80,0.2)', border:'1px solid rgba(239,83,80,0.5)', color:'#EF5350', borderRadius:10, padding:'8px', cursor:'pointer', fontWeight:600 }}>
                    Confirmer
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ flex:1, fontSize:13 }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {selectedItem.type === 'consommable' && (
                  <button className="btn-primary" style={{ flex:1, fontSize:13 }} onClick={() => useItem(selSlot)}>
                    Utiliser
                  </button>
                )}
                {isEquippable && (
                  <button onClick={() => toggleEquip(selSlot)} className="btn-secondary" style={{ flex:1, fontSize:13 }}>
                    {selectedItem.equipped ? '⬇️ Déséquiper' : '⬆️ Équiper'}
                  </button>
                )}
                <button onClick={() => setConfirmDelete(true)}
                  style={{ fontSize:13, background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.35)', color:'#EF5350', borderRadius:10, padding:'9px 14px', cursor:'pointer' }}>
                  🗑️
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ height:8 }} />
    </div>
  )
}

function Label({ children }) {
  return <p style={{ margin:'0 0 8px', fontSize:12, color:'#6B6B8A', fontWeight:600, letterSpacing:'0.05em' }}>{children}</p>
}
function Bar({ label, value, color, pct }) {
  return <div>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
      <span style={{ fontSize:12, color:'#9E9EBE', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:12, color, fontWeight:700 }}>{value}</span>
    </div>
    <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width:`${pct}%`, background:color }} /></div>
  </div>
}
function StatCard({ icon, label, value, base, color }) {
  const bonus = (base !== undefined && value > base) ? value - base : 0
  return <div className="glass" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
    <span style={{ fontSize:20 }}>{icon}</span>
    <div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <p style={{ margin:0, fontSize:18, fontWeight:700, color }}>{value}</p>
        {bonus > 0 && <span style={{ fontSize:11, color:'#66BB6A', fontWeight:700 }}>+{bonus}</span>}
      </div>
      <p style={{ margin:0, fontSize:11, color:'#6B6B8A' }}>{label}</p>
    </div>
  </div>
}
function InventorySlot({ item, selected, onClick }) {
  const rc = item ? `rarity-${item.rarity}` : ''
  return <div className={`inv-slot ${item?'has-item':''} ${rc}`} onClick={onClick}
    style={selected ? { outline:'2px solid rgba(255,107,53,0.6)' } : {}} title={item ? item.name : ''}>
    {item && <>
      <span>{item.emoji}</span>
      {item.qty > 1 && <span style={{ position:'absolute', bottom:2, right:4, fontSize:9, color:'#FFD700', fontWeight:700 }}>{item.qty}</span>}
      {item.equipped && <span style={{ position:'absolute', top:2, right:3, fontSize:8, color:'#FF6B35' }}>✓</span>}
    </>}
  </div>
}
