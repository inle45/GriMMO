import { useState } from 'react'
import { recalcStats } from '../lib/playerUtils'

const AVATARS = ['🧙','⚔️','🗡️','🛡️','🏹','🪄','💀','👹','🧝','🧌','🐉','🦅','🐺','🦇','🧛','🧟','👺','🔱','⚡','🌑']
const ELEMENT_LABELS = { feu: '🔥 Feu', terre: '🌿 Terre', eau: '💧 Eau' }
const ELEMENT_COLORS = { feu: 'var(--c-fire)', terre: 'var(--c-earth)', eau: 'var(--c-water)' }

function elRgb(el) { return el==='feu'?'255,107,53':el==='eau'?'79,195,247':'129,199,132' }

export default function Heros({ player, updatePlayer }) {
  const [selSlot,       setSelSlot]       = useState(null)
  const [showAvatar,    setShowAvatar]    = useState(false)
  const [editSetIdx,    setEditSetIdx]    = useState(null)
  const [setNameInput,  setSetNameInput]  = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!player) return null

  const xpPct   = Math.round((player.xp   / player.xp_next)  * 100)
  const hpPct   = Math.round((player.hp   / player.hp_max)   * 100)
  const hpColor = hpPct > 60 ? '#66BB6A' : hpPct > 30 ? '#FFD700' : '#EF5350'

  function useItem(slot) {
    const item = player.inventory[slot]
    if (!item || item.type !== 'consommable') return
    let updated = { ...player }
    if (item.effect?.startsWith('hp+')) updated.hp = Math.min(updated.hp_max, updated.hp + parseInt(item.effect.replace('hp+','')))
    const inv = [...updated.inventory]
    inv[slot] = item.qty > 1 ? { ...item, qty: item.qty - 1 } : null
    updated.inventory = inv
    updatePlayer(updated)
    setSelSlot(null)
  }

  // Gear sets
  function saveGearSet(idx) {
    const equippedIds = player.inventory.filter(i => i?.equipped).map(i => i.id)
    const sets = [...(player.gear_sets || [null,null,null])]
    sets[idx] = { name: setNameInput || `Set ${idx+1}`, equipped_ids: equippedIds }
    updatePlayer({ gear_sets: sets })
    setEditSetIdx(null); setSetNameInput('')
  }
  function loadGearSet(idx) {
    const set = (player.gear_sets || [])[idx]
    if (!set) return
    const inv = (player.inventory || []).map(item =>
      item ? { ...item, equipped: set.equipped_ids.includes(item.id) } : null
    )
    updatePlayer(recalcStats({ ...player, inventory: inv }))
  }
  function deleteGearSet(idx) {
    const sets = [...(player.gear_sets || [null,null,null])]
    sets[idx] = null
    updatePlayer({ gear_sets: sets })
  }

  const selectedItem = selSlot !== null ? player.inventory[selSlot] : null

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
          <p style={{ margin:0, fontSize:16, fontWeight:700 }}
            className={player.is_premium_color ? 'premium-username' : ''}
            style={!player.is_premium_color ? { color:'#E2E2F0', fontSize:16, fontWeight:700 } : {}}>
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
        <Bar label="❤️  Points de Vie" value={`${player.hp} / ${player.hp_max}`} color={hpColor}   pct={hpPct} />
        <Bar label="✨ Expérience"     value={`${player.xp} / ${player.xp_next}`} color='var(--c-xp)' pct={xpPct} />
      </div>

      {/* Stats */}
      <div>
        <Label>STATISTIQUES</Label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <StatCard icon="⚔️" label="Attaque"      value={player.atk}  base={player.base_atk} color="var(--c-fire)"  />
          <StatCard icon="🛡️" label="Défense"      value={player.def}  base={player.base_def} color="var(--c-water)" />
          <StatCard icon="💰" label="Or"            value={player.gold} color="var(--c-gold)"  />
          <StatCard icon="🎫" label="Tickets Boss"  value={`${player.boss_tickets}/3`} color="var(--c-xp)" />
        </div>
      </div>

      {/* Élément */}
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

      {/* Sets d'équipement */}
      <div>
        <Label>SETS D'ÉQUIPEMENT</Label>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {(player.gear_sets || [null,null,null]).map((set, idx) => (
            <div key={idx} className="glass" style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>{idx===0?'⚔️':idx===1?'🛡️':'🌀'}</span>
              {editSetIdx === idx ? (
                <>
                  <input className="chat-input" style={{ flex:1, padding:'6px 10px', fontSize:13 }}
                    placeholder={`Nom du set (ex: Set Attaque)`} value={setNameInput}
                    onChange={e => setSetNameInput(e.target.value)} autoFocus />
                  <button onClick={() => saveGearSet(idx)} className="btn-primary" style={{ padding:'6px 10px', fontSize:12, flexShrink:0 }}>Sauver</button>
                  <button onClick={() => setEditSetIdx(null)} className="btn-secondary" style={{ padding:'6px 8px', fontSize:12, flexShrink:0 }}>✕</button>
                </>
              ) : set ? (
                <>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#E2E2F0' }}>{set.name}</p>
                    <p style={{ margin:0, fontSize:11, color:'#6B6B8A' }}>{set.equipped_ids?.length || 0} objet(s) équipé(s)</p>
                  </div>
                  <button onClick={() => loadGearSet(idx)} className="btn-primary"  style={{ padding:'5px 9px', fontSize:11, flexShrink:0 }}>Activer</button>
                  <button onClick={() => deleteGearSet(idx)} style={{ background:'none', border:'none', color:'#EF5350', cursor:'pointer', fontSize:16, flexShrink:0 }}>🗑️</button>
                </>
              ) : (
                <>
                  <p style={{ flex:1, margin:0, fontSize:13, color:'#4A4A6A' }}>Slot vide</p>
                  <button onClick={() => { setEditSetIdx(idx); setSetNameInput('') }} className="btn-secondary" style={{ padding:'5px 9px', fontSize:11, flexShrink:0 }}>+ Sauver l'équipement actuel</button>
                </>
              )}
            </div>
          ))}
        </div>
        <p style={{ margin:'6px 0 0', fontSize:11, color:'#4A4A6A' }}>Équipez des objets dans l'inventaire puis sauvegardez le set.</p>
      </div>

      {/* Inventaire */}
      <div>
        <Label>INVENTAIRE</Label>
        <div className="inv-grid">
          {Array.from({ length: 15 }).map((_, i) => {
            const item = player.inventory[i] || null
            return <InventorySlot key={i} item={item} selected={selSlot===i} onClick={() => { setSelSlot(selSlot===i?null:i); setConfirmDelete(false) }} />
          })}
        </div>
        {selectedItem && (
          <div className="glass animate-in" style={{ marginTop:10, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>{selectedItem.emoji}</span>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#E2E2F0' }}>{selectedItem.name}</p>
                <p style={{ margin:'2px 0 0', fontSize:11, color:'#6B6B8A' }}>{selectedItem.rarity} · {selectedItem.type}{selectedItem.qty>1?` · x${selectedItem.qty}`:''}</p>
              </div>
            </div>
            {selectedItem.effect && <p style={{ margin:'0 0 10px', fontSize:12, color:'#9E9EBE' }}>Effet : <span style={{ color:'#66BB6A' }}>{selectedItem.effect}</span></p>}

            {confirmDelete ? (
              <div style={{ background:'rgba(239,83,80,0.08)', border:'1px solid rgba(239,83,80,0.3)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
                <p style={{ margin:'0 0 8px', fontSize:13, color:'#EF5350', fontWeight:600 }}>Supprimer {selectedItem.name} ?</p>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => {
                    const inv = [...player.inventory]
                    inv[selSlot] = null
                    updatePlayer(recalcStats({ ...player, inventory: inv }))
                    setSelSlot(null)
                    setConfirmDelete(false)
                  }} style={{ flex:1, fontSize:13, background:'rgba(239,83,80,0.2)', border:'1px solid rgba(239,83,80,0.5)', color:'#EF5350', borderRadius:10, padding:'8px', cursor:'pointer', fontWeight:600 }}>
                    Confirmer
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ flex:1, fontSize:13 }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {selectedItem.type==='consommable' && (
                  <button className="btn-primary" style={{ flex:1, fontSize:13 }} onClick={() => useItem(selSlot)}>Utiliser</button>
                )}
                {selectedItem.type !== 'consommable' && selectedItem.type !== 'materiau' && (
                  <button onClick={() => {
                    const inv = [...player.inventory]
                    if (inv[selSlot]) {
                      inv[selSlot] = { ...inv[selSlot], equipped: !inv[selSlot].equipped }
                      updatePlayer(recalcStats({ ...player, inventory: inv }))
                    }
                  }} className="btn-secondary" style={{ flex:1, fontSize:13 }}>
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
  const rc = item?`rarity-${item.rarity}`:''
  return <div className={`inv-slot ${item?'has-item':''} ${rc}`} onClick={onClick}
    style={selected?{outline:'2px solid rgba(255,107,53,0.6)'}:{}} title={item?item.name:''}>
    {item && <>
      <span>{item.emoji}</span>
      {item.qty>1 && <span style={{ position:'absolute',bottom:2,right:4,fontSize:9,color:'#FFD700',fontWeight:700 }}>{item.qty}</span>}
      {item.equipped && <span style={{ position:'absolute',top:2,right:3,fontSize:8,color:'#FF6B35' }}>✓</span>}
    </>}
  </div>
}
