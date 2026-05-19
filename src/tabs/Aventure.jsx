import { useState, useRef, useEffect } from 'react'
import { ZONES, getEnemyWithHp, runCombatRound } from '../lib/combatEngine'
import { gainXP, addToInventory } from '../lib/playerUtils'

const QUEST_DEFS = [
  { id: 'kills',    label: 'Vaincre des ennemis',         targets: [3,5,10],  reward_gold: 80,  reward_bp: 30 },
  { id: 'gold',     label: 'Gagner de l\'or en combat',   targets: [100,200,500], reward_gold: 50, reward_bp: 25 },
  { id: 'boss',     label: 'Affronter le Donjon Boss',    targets: [1,2,3],   reward_gold: 200, reward_bp: 60 },
]

function getTodayStr() { return new Date().toDateString() }

function getDailyQuests(dateStr) {
  const seed = dateStr.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
  return QUEST_DEFS.map((q,i) => ({ ...q, target: q.targets[(seed*(i+1)) % q.targets.length] }))
}

function initOrResetQuests(player) {
  const today = getTodayStr()
  if (!player.quests || player.quests.date !== today) {
    return { date: today, kills: 0, gold_earned: 0, boss_runs: 0, completed: [] }
  }
  return player.quests
}

export default function Aventure({ player, updatePlayer }) {
  const [selectedZone, setSelectedZone] = useState('foret')
  const [fighting, setFighting]         = useState(false)
  const [combatLog, setCombatLog]       = useState([{ type:'system', text:'⚔️  Choisissez une zone et explorez pour commencer.' }])
  const [showQuests, setShowQuests]     = useState(true)
  const logRef = useRef(null)

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [combatLog])

  function appendLog(entries) { setCombatLog(prev => [...prev.slice(-80), ...entries]) }

  async function startCombat() {
    if (!player || fighting) return
    const zone = ZONES[selectedZone]
    if (player.level < zone.minLevel) { appendLog([{type:'info', text:`🔒 Niveau ${zone.minLevel} requis.`}]); return }
    if (zone.isBoss && player.boss_tickets <= 0) { appendLog([{type:'info', text:'🎫 Plus de tickets aujourd\'hui.'}]); return }

    const quests = initOrResetQuests(player)

    if (zone.isBoss) {
      appendLog([{type:'system', text:`🎫 Ticket utilisé. Reste: ${player.boss_tickets - 1}`}])
    }

    setFighting(true)
    appendLog([{type:'system', text:`\n🗺️  ${zone.emoji} ${zone.name}`}])
    await delay(300)

    const enemy  = getEnemyWithHp(selectedZone)
    const result = runCombatRound({ ...player, _currentZone: selectedZone }, enemy)

    for (const entry of result.log) { appendLog([entry]); await delay(100) }

    let updated = {
      ...player,
      hp: result.playerHpLeft,
      quests,
      boss_tickets: zone.isBoss ? player.boss_tickets - 1 : player.boss_tickets,
    }

    if (result.victory) {
      updated.gold += result.goldEarned
      updated = gainXP(updated, result.xpEarned)
      updated.bp_xp = (updated.bp_xp || 0) + 10

      updated.quests = { ...updated.quests, kills: updated.quests.kills + 1, gold_earned: updated.quests.gold_earned + result.goldEarned }
      if (zone.isBoss) updated.quests.boss_runs = (updated.quests.boss_runs || 0) + 1

      const dailyQuests = getDailyQuests(updated.quests.date)
      for (const q of dailyQuests) {
        if (!updated.quests.completed.includes(q.id)) {
          const progress = q.id==='kills' ? updated.quests.kills : q.id==='gold' ? updated.quests.gold_earned : (updated.quests.boss_runs||0)
          if (progress >= q.target) {
            updated.gold     += q.reward_gold
            updated.bp_xp    += q.reward_bp
            updated.quests.completed = [...updated.quests.completed, q.id]
            appendLog([{type:'win', text:`✅ Quête "${q.label}" terminée ! +${q.reward_gold} Or · +${q.reward_bp} XP Passe`}])
          }
        }
      }

      // Loot — affiche un message si l'inventaire est plein
      for (const item of result.loot) {
        const { player: p, added } = addToInventory(updated, item)
        updated = p
        if (!added) {
          appendLog([{type:'info', text:`📦 Inventaire plein ! ${item.emoji} ${item.name} perdu.`}])
        }
      }
      if (updated.level > player.level) appendLog([{type:'win', text:`🎉 NIVEAU ${updated.level} ATTEINT !`}])
    }

    await updatePlayer(updated)
    setFighting(false)
  }

  const zone      = ZONES[selectedZone]
  const canFight  = player && player.level >= zone.minLevel && (!zone.isBoss || player.boss_tickets > 0)
  const quests    = player ? initOrResetQuests(player) : null
  const dailyQ    = player ? getDailyQuests(getTodayStr()) : []

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', padding:'10px 14px', gap:10 }}>

      {/* Quêtes journalières */}
      <div className="glass" style={{ flexShrink:0 }}>
        <button onClick={() => setShowQuests(v=>!v)} style={{ width:'100%', background:'none', border:'none', color:'#E2E2F0', fontSize:13, fontWeight:700, padding:'10px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>📋 Quêtes Journalières</span>
          <span style={{ color:'#6B6B8A', fontSize:11 }}>{showQuests ? '▲' : '▼'}  {quests ? `${quests.completed.length}/${dailyQ.length}` : ''}</span>
        </button>
        {showQuests && quests && (
          <div style={{ padding:'0 14px 12px', display:'flex', flexDirection:'column', gap:8 }}>
            {dailyQ.map(q => {
              const done     = quests.completed.includes(q.id)
              const progress = q.id==='kills' ? quests.kills : q.id==='gold' ? quests.gold_earned : (quests.boss_runs||0)
              const pct      = Math.min(100, Math.round((progress / q.target) * 100))
              return (
                <div key={q.id} style={{ opacity: done ? 0.6 : 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color: done?'#66BB6A':'#D8D8F0' }}>{done?'✅':'◻️'} {q.label}</span>
                    <span style={{ fontSize:11, color:'#6B6B8A' }}>{done ? 'Terminée' : `${Math.min(progress,q.target)}/${q.target}`} · +{q.reward_gold}💰 +{q.reward_bp}⭐</span>
                  </div>
                  <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width:`${pct}%`, background: done?'#66BB6A':'var(--c-xp)' }} /></div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sélecteur de zones */}
      <div style={{ flexShrink:0 }}>
        <p style={{ margin:'0 0 6px', fontSize:12, color:'#6B6B8A', fontWeight:600, letterSpacing:'0.05em' }}>ZONES</p>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {Object.values(ZONES).map(z => <ZoneCard key={z.id} zone={z} selected={selectedZone===z.id} locked={player&&player.level<z.minLevel} tickets={z.isBoss?player?.boss_tickets:null} onSelect={()=>setSelectedZone(z.id)} />)}
        </div>
      </div>

      {/* PV */}
      <PlayerHpBar player={player} />

      {/* Journal */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
        <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B6B8A', fontWeight:600, letterSpacing:'0.05em' }}>JOURNAL DE COMBAT</p>
        <div className="combat-log" ref={logRef} style={{ flex:1, maxHeight:'none' }}>
          {combatLog.map((e,i) => <div key={i} className={`log-${e.type}`}>{e.text}</div>)}
          {fighting && <div className="log-system">…</div>}
        </div>
      </div>

      {/* Action */}
      <button className={`btn-primary${fighting?' pulse-combat':''}`} onClick={startCombat}
        disabled={fighting||!canFight} style={{ width:'100%', fontSize:15, padding:13, flexShrink:0 }}>
        {fighting ? '⚔️  Combat en cours…'
          : !canFight && zone.isBoss && player?.boss_tickets===0 ? '🎫 Plus de tickets'
          : !canFight ? `🔒 Niv. ${zone.minLevel} requis`
          : `⚔️  Explorer ${zone.name}`}
      </button>
    </div>
  )
}

function ZoneCard({ zone, selected, locked, tickets, onSelect }) {
  const c = { 'active-fire':['rgba(255,107,53,0.5)','rgba(255,107,53,0.08)'], 'active-water':['rgba(79,195,247,0.5)','rgba(79,195,247,0.08)'], 'active-earth':['rgba(129,199,132,0.5)','rgba(129,199,132,0.08)'] }[zone.colorClass]||[]
  return (
    <button className="zone-btn" onClick={onSelect} disabled={locked}
      style={{ opacity:locked?.5:1, ...(selected&&!locked?{borderColor:c[0],background:c[1]}:{}) }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>{zone.emoji}</span>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:600, color:locked?'#4A4A6A':'#E2E2F0' }}>{zone.name}{locked&&<span style={{ marginLeft:6, fontSize:10 }}>Niv.{zone.minLevel}</span>}</p>
            <p style={{ margin:'1px 0 0', fontSize:11, color:'#6B6B8A' }}>{zone.enemies?.length} ennemis · élément dominant</p>
          </div>
        </div>
        {tickets!==null && <div style={{ display:'flex', gap:3 }}>{[0,1,2].map(i=><span key={i} style={{ fontSize:14, opacity:i<tickets?1:0.25 }}>🎫</span>)}</div>}
        {selected&&!locked && <span style={{ color:'#FF6B35' }}>▶</span>}
      </div>
    </button>
  )
}

function PlayerHpBar({ player }) {
  if (!player) return null
  const pct   = Math.round((player.hp/player.hp_max)*100)
  const color = pct>60?'#66BB6A':pct>30?'#FFD700':'#EF5350'
  return <div className="glass" style={{ padding:'8px 14px', flexShrink:0 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
      <span style={{ fontSize:12, color:'#9E9EBE', fontWeight:600 }}>Points de Vie</span>
      <span style={{ fontSize:12, color, fontWeight:700 }}>{player.hp} / {player.hp_max}</span>
    </div>
    <div className="stat-bar-bg"><div className="stat-bar-fill" style={{ width:`${pct}%`, background:color }} /></div>
  </div>
}

function delay(ms) { return new Promise(r=>setTimeout(r,ms)) }
