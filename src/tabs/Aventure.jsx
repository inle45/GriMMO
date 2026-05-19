import { useState, useRef, useEffect } from 'react'
import { ZONES, getEnemyWithHp, runCombatRound } from '../lib/combatEngine'
import { gainXP } from '../lib/playerUtils'

const ZONE_LIST = Object.values(ZONES)

export default function Aventure({ player, updatePlayer }) {
  const [selectedZone, setSelectedZone] = useState('foret')
  const [fighting, setFighting]         = useState(false)
  const [combatLog, setCombatLog]       = useState([
    { type: 'system', text: '⚔️  Choisissez une zone et lancez l\'exploration pour commencer.' },
  ])
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [combatLog])

  function appendLog(entries) {
    setCombatLog(prev => [...prev.slice(-80), ...entries])
  }

  async function startCombat() {
    if (!player || fighting) return

    const zone = ZONES[selectedZone]

    // Vérification niveau minimum
    if (player.level < zone.minLevel) {
      appendLog([{ type: 'info', text: `🔒 Niveau ${zone.minLevel} requis pour accéder à ${zone.name}.` }])
      return
    }

    // Vérification tickets boss
    if (zone.isBoss) {
      if (player.boss_tickets <= 0) {
        appendLog([{ type: 'info', text: '🎫 Plus de tickets pour aujourd\'hui. Revenez demain !' }])
        return
      }
      await updatePlayer(p => ({ ...p, boss_tickets: p.boss_tickets - 1 }))
      appendLog([{ type: 'system', text: `🎫 Ticket utilisé. Il vous reste ${player.boss_tickets - 1} ticket(s) aujourd'hui.` }])
    }

    setFighting(true)
    appendLog([{ type: 'system', text: `\n🗺️  Exploration : ${zone.emoji} ${zone.name}` }])

    // Légère pause pour l'effet visuel
    await delay(300)

    const enemy = getEnemyWithHp(selectedZone)
    const playerWithZone = { ...player, _currentZone: selectedZone }
    const result = runCombatRound(playerWithZone, enemy)

    // Affichage ligne par ligne avec délai
    for (const entry of result.log) {
      appendLog([entry])
      await delay(120)
    }

    // Mise à jour du joueur
    let updated = { ...player, hp: result.playerHpLeft }

    if (result.victory) {
      updated.gold += result.goldEarned
      updated = gainXP(updated, result.xpEarned)

      // Ajout du butin à l'inventaire
      for (const item of result.loot) {
        updated = addToInventory(updated, item)
      }

      if (updated.level > player.level) {
        appendLog([{ type: 'win', text: `\n🎉 NIVEAU ${updated.level} ATTEINT ! Statistiques augmentées.` }])
      }
    }

    await updatePlayer(updated)
    setFighting(false)
  }

  const zone = ZONES[selectedZone]
  const canFight = player && player.level >= zone.minLevel && (!zone.isBoss || player.boss_tickets > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '12px 14px', gap: 12 }}>

      {/* Sélecteur de zones */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B6B8A', fontWeight: 600, letterSpacing: '0.05em' }}>
          ZONES D'EXPLORATION
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ZONE_LIST.map(z => (
            <ZoneCard
              key={z.id}
              zone={z}
              selected={selectedZone === z.id}
              locked={player && player.level < z.minLevel}
              tickets={z.isBoss ? player?.boss_tickets : null}
              onSelect={() => setSelectedZone(z.id)}
            />
          ))}
        </div>
      </div>

      {/* PV actuels */}
      <PlayerHpBar player={player} />

      {/* Journal de combat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#6B6B8A', fontWeight: 600, letterSpacing: '0.05em' }}>
          JOURNAL DE COMBAT
        </p>
        <div className="combat-log" ref={logRef} style={{ flex: 1, maxHeight: 'none' }}>
          {combatLog.map((entry, i) => (
            <div key={i} className={`log-${entry.type}`}>{entry.text}</div>
          ))}
          {fighting && <div className="log-system">…</div>}
        </div>
      </div>

      {/* Bouton d'action */}
      <button
        className={`btn-primary${fighting ? ' pulse-combat' : ''}`}
        onClick={startCombat}
        disabled={fighting || !canFight}
        style={{ width: '100%', fontSize: 15, padding: '13px', flexShrink: 0 }}
      >
        {fighting
          ? '⚔️  Combat en cours…'
          : !canFight && zone.isBoss && player?.boss_tickets === 0
            ? '🎫 Plus de tickets aujourd\'hui'
            : !canFight
              ? `🔒 Niv. ${zone.minLevel} requis`
              : `⚔️  Explorer ${zone.name}`
        }
      </button>
    </div>
  )
}

function ZoneCard({ zone, selected, locked, tickets, onSelect }) {
  const colorMap = {
    'active-fire':  { border: 'rgba(255,107,53,0.5)', bg: 'rgba(255,107,53,0.08)', glow: '0 0 12px rgba(255,107,53,0.25)' },
    'active-water': { border: 'rgba(79,195,247,0.5)',  bg: 'rgba(79,195,247,0.08)',  glow: '0 0 12px rgba(79,195,247,0.25)'  },
    'active-earth': { border: 'rgba(129,199,132,0.5)', bg: 'rgba(129,199,132,0.08)', glow: '0 0 12px rgba(129,199,132,0.25)' },
  }
  const activeStyle = colorMap[zone.colorClass] || {}

  return (
    <button
      className="zone-btn"
      style={{
        opacity: locked ? 0.5 : 1,
        ...(selected && !locked ? {
          borderColor: activeStyle.border,
          background:  activeStyle.bg,
          boxShadow:   activeStyle.glow,
        } : {}),
      }}
      onClick={onSelect}
      disabled={locked}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{zone.emoji}</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: locked ? '#4A4A6A' : '#E2E2F0' }}>
              {zone.name}
              {locked && <span style={{ marginLeft: 6, fontSize: 11, color: '#4A4A6A' }}>Niv.{zone.minLevel}</span>}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: 11, color: '#6B6B8A' }}>
              Élément dominant · {zone.enemies?.length} ennemis possibles
            </p>
          </div>
        </div>
        {tickets !== null && (
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ fontSize: 16, opacity: i < tickets ? 1 : 0.25 }}>🎫</span>
            ))}
          </div>
        )}
        {selected && !locked && (
          <span style={{ color: '#FF6B35', fontSize: 16 }}>▶</span>
        )}
      </div>
    </button>
  )
}

function PlayerHpBar({ player }) {
  if (!player) return null
  const pct = Math.round((player.hp / player.hp_max) * 100)
  const color = pct > 60 ? '#66BB6A' : pct > 30 ? '#FFD700' : '#EF5350'

  return (
    <div className="glass" style={{ padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#9E9EBE', fontWeight: 600 }}>Points de Vie</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{player.hp} / {player.hp_max} PV</span>
      </div>
      <div className="stat-bar-bg">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function addToInventory(player, item) {
  const inv = [...(player.inventory || [])]
  const existingIdx = inv.findIndex(s => s && s.name === item.name && s.type === 'consommable')
  if (existingIdx >= 0) {
    inv[existingIdx] = { ...inv[existingIdx], qty: (inv[existingIdx].qty || 1) + 1 }
  } else {
    const emptyIdx = inv.findIndex(s => s === null)
    if (emptyIdx >= 0) {
      inv[emptyIdx] = { ...item, id: Date.now() + Math.random() }
    } else {
      inv.push({ ...item, id: Date.now() + Math.random() })
    }
  }
  return { ...player, inventory: inv }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
