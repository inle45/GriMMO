import { useState } from 'react'

const NPC_SHOP = [
  { id: 's1', name: 'Potion de soin',     emoji: '🧪', price: 40,  effect: 'hp+30',  type: 'consommable', rarity: 'commun', stock: 10 },
  { id: 's2', name: 'Grande Potion',      emoji: '💊', price: 90,  effect: 'hp+70',  type: 'consommable', rarity: 'rare',   stock: 5  },
  { id: 's3', name: 'Rune de Puissance',  emoji: '🔮', price: 150, effect: 'atk+3',  type: 'rune',        rarity: 'rare',   stock: 3  },
  { id: 's4', name: 'Dague en Os',        emoji: '🦴', price: 200, effect: 'atk+5',  type: 'arme',        rarity: 'commun', stock: 2  },
  { id: 's5', name: 'Bouclier Brisé',     emoji: '🛡️', price: 180, effect: 'def+6',  type: 'armure',      rarity: 'commun', stock: 2  },
  { id: 's6', name: 'Talisman du Voyageur',emoji:'🪬', price: 320, effect: 'xp+10%', type: 'accessoire',  rarity: 'rare',   stock: 1  },
  { id: 's7', name: 'Élixir de Force',    emoji: '⚗️', price: 250, effect: 'atk+8',  type: 'consommable', rarity: 'rare',   stock: 3  },
  { id: 's8', name: 'Pierre de Mana',     emoji: '💎', price: 400, effect: 'def+10', type: 'accessoire',  rarity: 'epique', stock: 1  },
]

const MARKET_LISTINGS = [
  { id: 'm1', seller: 'Noctis #F1C9',    el: 'terre', name: 'Épée Fantôme',      emoji: '⚔️',  price: 480, effect: 'atk+8',  rarity: 'epique'  },
  { id: 'm2', seller: 'Maldrak #A3F2',   el: 'feu',   name: 'Cœur de Drake',     emoji: '❤️‍🔥', price: 350, effect: null,     rarity: 'epique'  },
  { id: 'm3', seller: 'Syrel #0C1E',     el: 'eau',   name: 'Grande Potion x3',  emoji: '💊',  price: 240, effect: 'hp+70',  rarity: 'rare'    },
  { id: 'm4', seller: 'Thornveil #77B',  el: 'terre', name: 'Anneau des Bois',   emoji: '💍',  price: 160, effect: 'def+3',  rarity: 'rare'    },
  { id: 'm5', seller: 'Kael #BD22',      el: 'feu',   name: 'Heaume Infernal',   emoji: '⛑️',  price: 750, effect: 'def+12', rarity: 'epique'  },
  { id: 'm6', seller: 'Vesper #2DA0',    el: 'eau',   name: 'Sceptre de Gel',    emoji: '🪄',  price: 520, effect: 'atk+10', rarity: 'epique'  },
]

const PREMIUM_ITEMS = [
  { id: 'pseudo-dore', name: 'Pseudo Doré',       emoji: '✦',  price: 100, currency: 'or',     desc: 'Votre pseudo brille en or dans la Taverne !' },
  { id: 'p1',          name: 'Aura Spectrale',     emoji: '🌟', price: 50,  currency: 'gemmes', desc: 'Aura lumineuse autour de votre héros' },
  { id: 'p2',          name: 'Titre : L\'Éternel', emoji: '👑', price: 80,  currency: 'gemmes', desc: 'Titre rare affiché à la Taverne' },
  { id: 'p3',          name: 'Pack : Fondateur',   emoji: '🎁', price: 200, currency: 'gemmes', desc: 'Aura + Titre + Skin + badge exclusif' },
]

// Pool Gacha pondéré
const GACHA_POOL = [
  { name: 'Potion de soin',     emoji: '🧪', rarity: 'commun',     effect: 'hp+30',  type: 'consommable', w: 40 },
  { name: 'Baie de Sombre',     emoji: '🍇', rarity: 'commun',     effect: 'hp+15',  type: 'consommable', w: 35 },
  { name: 'Os Brisé',           emoji: '🦴', rarity: 'commun',     effect: null,     type: 'materiau',    w: 30 },
  { name: 'Plume Maudite',      emoji: '🪶', rarity: 'commun',     effect: null,     type: 'materiau',    w: 25 },
  { name: 'Rune de Puissance',  emoji: '🔮', rarity: 'rare',       effect: 'atk+3',  type: 'rune',        w: 15 },
  { name: 'Anneau des Bois',    emoji: '💍', rarity: 'rare',       effect: 'def+3',  type: 'accessoire',  w: 12 },
  { name: 'Sceptre de Gel',     emoji: '🪄', rarity: 'rare',       effect: 'atk+6',  type: 'arme',        w: 10 },
  { name: 'Élixir Ancien',      emoji: '⚗️', rarity: 'rare',       effect: 'hp+60',  type: 'consommable', w: 10 },
  { name: 'Épée Fantôme',       emoji: '⚔️', rarity: 'epique',     effect: 'atk+8',  type: 'arme',        w: 5  },
  { name: 'Heaume Infernal',    emoji: '⛑️', rarity: 'epique',     effect: 'def+12', type: 'armure',      w: 4  },
  { name: 'Orbe du Néant',      emoji: '🔵', rarity: 'epique',     effect: 'atk+10', type: 'accessoire',  w: 3  },
  { name: 'Lame du Tyran',      emoji: '🗡️', rarity: 'legendaire', effect: 'atk+18', type: 'arme',        w: 1  },
  { name: 'Couronne Maudite',   emoji: '👑', rarity: 'legendaire', effect: 'all+5',  type: 'accessoire',  w: 1  },
]

const RARITY_COLORS = { commun: '#B0B0C8', rare: '#4FC3F7', epique: '#CE93D8', legendaire: '#FFD700' }
const RARITY_ANIM   = { commun: null, rare: 'glow-blue', epique: 'glow-purple', legendaire: 'glow-gold' }

function rollOne() {
  const total = GACHA_POOL.reduce((s, i) => s + i.w, 0)
  let r = Math.random() * total
  for (const item of GACHA_POOL) { r -= item.w; if (r <= 0) return { ...item, id: Date.now() + Math.random(), qty: 1 } }
  return { ...GACHA_POOL[0], id: Date.now(), qty: 1 }
}

function addToInventory(player, item) {
  const inv = [...(player.inventory || [])]
  const idx = inv.findIndex(s => s && s.name === item.name && item.type === 'consommable')
  if (idx >= 0) { inv[idx] = { ...inv[idx], qty: (inv[idx].qty || 1) + 1 } }
  else { const e = inv.findIndex(s => s === null); if (e >= 0) inv[e] = item; else if (inv.length < 20) inv.push(item) }
  return inv
}

export default function Economie({ player, updatePlayer }) {
  const [subTab, setSubTab]       = useState(0)
  const [notif, setNotif]         = useState(null)
  const [gachaResult, setGachaResult] = useState(null)
  const [rolling, setRolling]     = useState(false)

  function notify(msg, ok = true) { setNotif({ msg, ok }); setTimeout(() => setNotif(null), 2500) }

  function buyFromShop(item) {
    if (!player || player.gold < item.price) { notify('Or insuffisant !', false); return }
    const newItem = { id: Date.now() + Math.random(), name: item.name, emoji: item.emoji, type: item.type, effect: item.effect, rarity: item.rarity, qty: 1 }
    const inv = [...(player.inventory || [])]
    const ei = inv.findIndex(s => s && s.name === item.name && item.type === 'consommable')
    if (ei >= 0) inv[ei] = { ...inv[ei], qty: (inv[ei].qty || 1) + 1 }
    else { const e = inv.findIndex(s => s === null); if (e >= 0) inv[e] = newItem; else if (inv.length < 20) inv.push(newItem); else { notify('Inventaire plein !', false); return } }
    updatePlayer({ gold: player.gold - item.price, inventory: inv })
    notify(`${item.emoji} ${item.name} acheté !`)
  }

  function buyFromMarket(listing) {
    if (!player || player.gold < listing.price) { notify('Or insuffisant !', false); return }
    notify(`${listing.emoji} ${listing.name} acheté !`)
    updatePlayer({ gold: player.gold - listing.price })
  }

  function buyPremium(item) {
    if (!player) return
    if (item.id === 'pseudo-dore') {
      if (player.is_premium_color) { notify('Déjà activé !', false); return }
      if (player.gold < item.price) { notify('Or insuffisant ! (100 Or)', false); return }
      updatePlayer({ gold: player.gold - item.price, is_premium_color: true })
      notify('✦ Pseudo Doré activé ! Il brille dans la Taverne.')
      return
    }
    notify('Bientôt disponible avec les Gemmes !', false)
  }

  async function doGacha(multi = false) {
    const cost = multi ? 1800 : 200
    if (!player || player.gold < cost) { notify(`Or insuffisant ! (${cost} Or)`, false); return }
    setRolling(true)
    await new Promise(r => setTimeout(r, 600))
    const pulls = multi ? Array.from({ length: 10 }, rollOne) : [rollOne()]
    const bestRarity = ['legendaire','epique','rare','commun'].find(r => pulls.some(p => p.rarity === r))
    let inv = [...(player.inventory || [])]
    pulls.forEach(item => { inv = addToInventory(player, item); })
    updatePlayer({ gold: player.gold - cost, inventory: inv })
    setGachaResult({ pulls, best: bestRarity })
    setRolling(false)
  }

  const SUBTABS = ['🏪 Échoppe', '🤝 Marché', '💎 Premium', '🎰 Gacha']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {notif && (
        <div className="animate-in" style={{
          position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: notif.ok ? 'rgba(102,187,106,0.15)' : 'rgba(239,83,80,0.15)',
          border: `1px solid ${notif.ok ? 'rgba(102,187,106,0.5)' : 'rgba(239,83,80,0.5)'}`,
          borderRadius: 12, padding: '8px 18px',
          color: notif.ok ? '#66BB6A' : '#EF5350',
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
        }}>{notif.ok ? '✓' : '✗'} {notif.msg}</div>
      )}

      {/* Solde */}
      <div style={{ padding: '8px 14px 4px', flexShrink: 0, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#FFD700', fontWeight: 600 }}>💰 {player?.gold || 0} Or</span>
        <span style={{ fontSize: 13, color: '#9E9EBE' }}>·</span>
        <span style={{ fontSize: 13, color: '#CE93D8' }}>💎 0 Gemmes</span>
      </div>

      {/* Sous-onglets */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {SUBTABS.map((t, i) => (
          <button key={i} className={`sub-tab${subTab === i ? ' active' : ''}`} onClick={() => setSubTab(i)}
            style={{ fontSize: 11 }}>{t}</button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {subTab === 0 && <>
          <SectionTitle icon="🏪" title="Échoppe du Marchand" sub="Stocks limités, prix fixes" />
          {NPC_SHOP.map(item => <ShopItem key={item.id} item={item} gold={player?.gold || 0} onBuy={() => buyFromShop(item)} />)}
        </>}

        {subTab === 1 && <>
          <SectionTitle icon="🤝" title="Marché des Aventuriers" sub="Offres des autres joueurs" />
          {MARKET_LISTINGS.map(l => <MarketItem key={l.id} listing={l} gold={player?.gold || 0} onBuy={() => buyFromMarket(l)} />)}
        </>}

        {subTab === 2 && <>
          <SectionTitle icon="💎" title="Boutique Premium" sub="Cosmétiques · Aucun avantage gameplay" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PREMIUM_ITEMS.map(item => <PremiumItem key={item.id} item={item} player={player} onBuy={() => buyPremium(item)} />)}
          </div>
        </>}

        {subTab === 3 && <>
          <SectionTitle icon="🎰" title="Invocation Gacha" sub="Chances : Commun 50% · Rare 20% · Épique 8% · Légendaire 1%" />
          <GachaSection gold={player?.gold || 0} rolling={rolling} result={gachaResult}
            onRoll={() => doGacha(false)} onRoll10={() => doGacha(true)} onClose={() => setGachaResult(null)} />
        </>}

        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}

function SectionTitle({ icon, title, sub }) {
  return <div style={{ marginBottom: 4 }}>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E2E2F0' }}>{icon} {title}</p>
    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B6B8A' }}>{sub}</p>
  </div>
}

function ShopItem({ item, gold, onBuy }) {
  const rColor = RARITY_COLORS[item.rarity] || '#B0B0C8'
  return (
    <div className="glass" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${rColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#E2E2F0' }}>{item.name}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#6B6B8A' }}>
          <span style={{ color: rColor }}>{item.rarity}</span>
          {item.effect && <span style={{ color: '#66BB6A' }}> · {item.effect}</span>}
        </p>
      </div>
      <button className="btn-primary" onClick={onBuy} disabled={gold < item.price} style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12 }}>💰 {item.price}</button>
    </div>
  )
}

function MarketItem({ listing, gold, onBuy }) {
  const rColor   = RARITY_COLORS[listing.rarity] || '#B0B0C8'
  const elEmoji  = { feu: '🔥', terre: '🌿', eau: '💧' }[listing.el] || ''
  return (
    <div className="glass" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${rColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{listing.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#E2E2F0' }}>{listing.name}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#6B6B8A' }}>
          {elEmoji} {listing.seller} · <span style={{ color: rColor }}>{listing.rarity}</span>
          {listing.effect && <span style={{ color: '#66BB6A' }}> · {listing.effect}</span>}
        </p>
      </div>
      <button className="btn-primary" onClick={onBuy} disabled={gold < listing.price} style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12 }}>💰 {listing.price}</button>
    </div>
  )
}

function PremiumItem({ item, player, onBuy }) {
  const isGold    = item.id === 'pseudo-dore'
  const owned     = isGold && player?.is_premium_color
  const canAfford = isGold ? (player?.gold || 0) >= item.price : false
  return (
    <div className="glass" style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center', border: isGold ? '1px solid rgba(255,215,0,0.35)' : undefined, background: isGold ? 'rgba(255,215,0,0.04)' : undefined }}>
      <span style={{ fontSize: 28 }}>{item.emoji}</span>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isGold ? '#FFD700' : '#E2E2F0', textShadow: isGold ? '0 0 10px rgba(255,215,0,0.5)' : 'none' }}>{item.name}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#6B6B8A', lineHeight: 1.4 }}>{item.desc}</p>
      {owned ? <p style={{ margin: 0, fontSize: 12, color: '#FFD700', fontWeight: 700 }}>✦ Activé</p> : (
        <button onClick={onBuy} disabled={!canAfford && isGold} style={{
          padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%',
          opacity: (!canAfford && isGold) ? 0.5 : 1,
          background: isGold ? 'rgba(255,215,0,0.15)' : 'rgba(206,147,216,0.15)',
          border: isGold ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(206,147,216,0.4)',
          color: isGold ? '#FFD700' : '#CE93D8',
        }}>{isGold ? `💰 ${item.price} Or` : `💎 ${item.price}`}</button>
      )}
    </div>
  )
}

function GachaSection({ gold, rolling, result, onRoll, onRoll10, onClose }) {
  if (result) {
    const best  = result.best
    const color = RARITY_COLORS[best] || '#B0B0C8'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="glass animate-in" style={{ padding: 16, border: `1px solid ${color}60`, boxShadow: `0 0 20px ${color}30` }}>
          <p style={{ margin: '0 0 12px', textAlign: 'center', fontWeight: 700, color }}>
            {best === 'legendaire' ? '🌟 LÉGENDAIRE !!!' : best === 'epique' ? '✨ Épique !' : best === 'rare' ? '💙 Rare' : '📦 Résultats'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {result.pulls.map((item, i) => {
              const c = RARITY_COLORS[item.rarity]
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', background: `rgba(0,0,0,0.3)`, borderRadius: 10, border: `1px solid ${c}40` }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <span style={{ fontSize: 8, color: c, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{item.name}</span>
                </div>
              )
            })}
          </div>
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Fermer</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Taux */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {Object.entries(RARITY_COLORS).map(([r, c]) => (
          <div key={r} style={{ padding: '8px 12px', background: `rgba(0,0,0,0.3)`, borderRadius: 10, border: `1px solid ${c}30`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#9E9EBE' }}>{r.charAt(0).toUpperCase()+r.slice(1)}</span>
            <span style={{ fontSize: 12, color: c, fontWeight: 700 }}>{r==='commun'?'50%':r==='rare'?'20%':r==='epique'?'8%':'1%'}</span>
          </div>
        ))}
      </div>

      {/* Boutons */}
      <button className="btn-primary" onClick={onRoll} disabled={rolling || gold < 200}
        style={{ width: '100%', padding: 14, fontSize: 15, opacity: gold < 200 ? 0.5 : 1 }}>
        {rolling ? '✨ Invocation…' : '🎰 Invoquer ×1 — 200 Or'}
      </button>
      <button onClick={onRoll10} disabled={rolling || gold < 1800}
        style={{
          width: '100%', padding: 14, fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: gold >= 1800 ? 'pointer' : 'not-allowed',
          background: 'linear-gradient(135deg,rgba(255,215,0,0.2),rgba(206,147,216,0.15))',
          border: '1px solid rgba(255,215,0,0.4)', color: '#FFD700',
          opacity: gold < 1800 ? 0.5 : 1, transition: 'all 0.2s',
        }}>
        🌟 Invoquer ×10 — 1 800 Or <span style={{ fontSize: 11, color: '#CE93D8' }}>(−200 Or)</span>
      </button>

      {gold < 200 && <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: '#4A4A6A' }}>Farmez en Aventure pour accumuler de l'Or ⚔️</p>}
    </div>
  )
}
