import { useState } from 'react'

const NPC_SHOP = [
  { id: 's1', name: 'Potion de soin',    emoji: '🧪',  price: 40,   effect: 'hp+30',  type: 'consommable', rarity: 'commun',  stock: 10 },
  { id: 's2', name: 'Grande Potion',     emoji: '💊',  price: 90,   effect: 'hp+70',  type: 'consommable', rarity: 'rare',    stock: 5  },
  { id: 's3', name: 'Antidote',          emoji: '🍵',  price: 30,   effect: 'def+0',  type: 'consommable', rarity: 'commun',  stock: 8  },
  { id: 's4', name: 'Rune de Puissance', emoji: '🔮',  price: 150,  effect: 'atk+3 temp', type: 'rune',   rarity: 'rare',    stock: 3  },
  { id: 's5', name: 'Dague en Os',       emoji: '🦴',  price: 200,  effect: 'atk+5',  type: 'arme',        rarity: 'commun',  stock: 2  },
  { id: 's6', name: 'Bouclier Brisé',    emoji: '🛡️',  price: 180,  effect: 'def+6',  type: 'armure',      rarity: 'commun',  stock: 2  },
  { id: 's7', name: 'Talisman du Voyageur',emoji:'🪬', price: 320,  effect: 'xp+10%', type: 'accessoire',  rarity: 'rare',    stock: 1  },
]

const MARKET_LISTINGS = [
  { id: 'm1', seller: 'Noctis #F1C9',   el: 'terre', name: 'Épée Fantôme',       emoji: '⚔️',  price: 480,  effect: 'atk+8',  rarity: 'epique'  },
  { id: 'm2', seller: 'Maldrak #A3F2',  el: 'feu',   name: 'Cœur de Drake',      emoji: '❤️‍🔥', price: 350,  effect: null,     rarity: 'epique'  },
  { id: 'm3', seller: 'Syrel #0C1E',    el: 'eau',   name: 'Grande Potion x3',   emoji: '💊',  price: 240,  effect: 'hp+70',  rarity: 'rare'    },
  { id: 'm4', seller: 'Thornveil #77B', el: 'terre', name: 'Anneau des Bois',    emoji: '💍',  price: 160,  effect: 'def+3',  rarity: 'rare'    },
  { id: 'm5', seller: 'Vesper #2DA0',   el: 'eau',   name: 'Plume Maudite x5',   emoji: '🪶',  price: 100,  effect: null,     rarity: 'rare'    },
  { id: 'm6', seller: 'Kael #BD22',     el: 'feu',   name: 'Heaume Infernal',    emoji: '⛑️',  price: 750,  effect: 'def+12', rarity: 'epique'  },
]

// id: 'pseudo-dore' est le seul achat fonctionnel (100 Or, pas de gemmes)
const PREMIUM_ITEMS = [
  { id: 'pseudo-dore',  name: 'Pseudo Doré',        emoji: '✦',   price: 100, currency: 'or',     desc: 'Votre pseudo brille en or dans la Taverne. Visible par tous !' },
  { id: 'p1',           name: 'Aura Spectrale',      emoji: '🌟',  price: 50,  currency: 'gemmes', desc: 'Aura lumineuse autour de votre héros' },
  { id: 'p2',           name: 'Titre : L\'Éternel',  emoji: '👑',  price: 80,  currency: 'gemmes', desc: 'Titre rare affiché à la Taverne' },
  { id: 'p3',           name: 'Skin : Chevalier Noir',emoji: '⚫', price: 120, currency: 'gemmes', desc: 'Apparence alternative pour votre héros' },
  { id: 'p4',           name: 'Pack : Fondateur',    emoji: '🎁',  price: 200, currency: 'gemmes', desc: 'Aura + Titre + Skin + badge exclusif' },
]

const RARITY_COLORS = {
  commun:     '#B0B0C8',
  rare:       '#4FC3F7',
  epique:     '#CE93D8',
  legendaire: '#FFD700',
}

export default function Economie({ player, updatePlayer }) {
  const [subTab, setSubTab] = useState(0)
  const [notification, setNotification] = useState(null)

  function notify(msg, ok = true) {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2500)
  }

  function buyFromShop(item) {
    if (!player) return
    if (player.gold < item.price) {
      notify('Or insuffisant !', false)
      return
    }
    const newItem = {
      id:     Date.now() + Math.random(),
      name:   item.name,
      emoji:  item.emoji,
      type:   item.type,
      effect: item.effect,
      rarity: item.rarity,
      qty:    1,
    }
    const inv = [...(player.inventory || [])]
    const existIdx = inv.findIndex(s => s && s.name === item.name && item.type === 'consommable')
    if (existIdx >= 0) {
      inv[existIdx] = { ...inv[existIdx], qty: (inv[existIdx].qty || 1) + 1 }
    } else {
      const emptyIdx = inv.findIndex(s => s === null)
      if (emptyIdx >= 0) inv[emptyIdx] = newItem
      else if (inv.length < 20) inv.push(newItem)
      else { notify('Inventaire plein !', false); return }
    }
    updatePlayer({ gold: player.gold - item.price, inventory: inv })
    notify(`${item.emoji} ${item.name} acheté !`)
  }

  function buyFromMarket(listing) {
    if (!player) return
    if (player.gold < listing.price) {
      notify('Or insuffisant !', false)
      return
    }
    notify(`${listing.emoji} ${listing.name} acheté pour ${listing.price} Or !`)
    updatePlayer({ gold: player.gold - listing.price })
  }

  function buyPremium(item) {
    if (!player) return
    if (item.id === 'pseudo-dore') {
      if (player.is_premium_color) { notify('Pseudo Doré déjà activé !', false); return }
      if (player.gold < item.price) { notify('Or insuffisant ! (100 Or requis)', false); return }
      updatePlayer({ gold: player.gold - item.price, is_premium_color: true })
      notify('✦ Pseudo Doré activé ! Il brille dans la Taverne.')
      return
    }
    notify('Bientôt disponible avec les Gemmes !', false)
  }

  const SUBTABS = ['Échoppe', 'Marché', 'Premium']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Notification toast */}
      {notification && (
        <div className="animate-in" style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: notification.ok ? 'rgba(102,187,106,0.15)' : 'rgba(239,83,80,0.15)',
          border: `1px solid ${notification.ok ? 'rgba(102,187,106,0.5)' : 'rgba(239,83,80,0.5)'}`,
          borderRadius: 12, padding: '8px 18px',
          color: notification.ok ? '#66BB6A' : '#EF5350',
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
        }}>
          {notification.ok ? '✓' : '✗'} {notification.msg}
        </div>
      )}

      {/* Solde */}
      <div style={{ padding: '10px 14px 4px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#9E9EBE' }}>Votre solde :</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#FFD700' }}>💰 {player?.gold || 0} Or</span>
          <span style={{ marginLeft: 8, fontSize: 13, color: '#9E9EBE' }}>·</span>
          <span style={{ fontSize: 13, color: '#CE93D8' }}>💎 0 Gemmes</span>
        </div>
      </div>

      {/* Sous-onglets */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, padding: '0 8px' }}>
        {SUBTABS.map((t, i) => (
          <button key={i} className={`sub-tab${subTab === i ? ' active' : ''}`} onClick={() => setSubTab(i)}>
            {i === 0 ? '🏪 ' : i === 1 ? '🤝 ' : '💎 '}{t}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subTab === 0 && (
          <>
            <SectionTitle icon="🏪" title="Échoppe du Marchand" sub="Stocks limités, prix fixes" />
            {NPC_SHOP.map(item => (
              <ShopItem key={item.id} item={item} gold={player?.gold || 0} onBuy={() => buyFromShop(item)} />
            ))}
          </>
        )}

        {subTab === 1 && (
          <>
            <SectionTitle icon="🤝" title="Marché entre Aventuriers" sub="Offres des autres joueurs" />
            {MARKET_LISTINGS.map(listing => (
              <MarketItem key={listing.id} listing={listing} gold={player?.gold || 0} onBuy={() => buyFromMarket(listing)} />
            ))}
          </>
        )}

        {subTab === 2 && (
          <>
            <SectionTitle icon="💎" title="Boutique Premium" sub="Cosmétiques exclusifs · Ne donne aucun avantage" />
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(206,147,216,0.08)',
              border: '1px solid rgba(206,147,216,0.25)',
              fontSize: 12, color: '#CE93D8', marginBottom: 4,
            }}>
              💎 Les gemmes s'achèteront avec de la monnaie réelle. Aucun avantage de gameplay.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PREMIUM_ITEMS.map(item => (
                <PremiumItem key={item.id} item={item} player={player} onBuy={() => buyPremium(item)} />
              ))}
            </div>
          </>
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E2E2F0' }}>{icon} {title}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B6B8A' }}>{sub}</p>
    </div>
  )
}

function ShopItem({ item, gold, onBuy }) {
  const canAfford = gold >= item.price
  const rColor = RARITY_COLORS[item.rarity] || '#B0B0C8'
  return (
    <div className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${rColor}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E2E2F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: rColor, fontWeight: 600 }}>{item.rarity}</span>
          {item.effect && <span style={{ fontSize: 11, color: '#66BB6A' }}>{item.effect}</span>}
          <span style={{ fontSize: 11, color: '#4A4A6A' }}>· Stock: {item.stock}</span>
        </div>
      </div>
      <button
        className="btn-primary"
        onClick={onBuy}
        disabled={!canAfford}
        style={{ flexShrink: 0, padding: '7px 12px', fontSize: 13 }}
      >
        💰 {item.price}
      </button>
    </div>
  )
}

function MarketItem({ listing, gold, onBuy }) {
  const canAfford = gold >= listing.price
  const rColor = RARITY_COLORS[listing.rarity] || '#B0B0C8'
  const elEmoji = { feu: '🔥', terre: '🌿', eau: '💧' }[listing.el] || ''
  return (
    <div className="glass" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${rColor}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        boxShadow: listing.rarity === 'epique' ? `0 0 8px ${rColor}40` : 'none',
      }}>{listing.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E2E2F0' }}>{listing.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B6B8A' }}>
          {elEmoji} {listing.seller} · <span style={{ color: rColor }}>{listing.rarity}</span>
          {listing.effect && <span style={{ color: '#66BB6A' }}> · {listing.effect}</span>}
        </p>
      </div>
      <button
        className="btn-primary"
        onClick={onBuy}
        disabled={!canAfford}
        style={{ flexShrink: 0, padding: '7px 12px', fontSize: 13 }}
      >
        💰 {listing.price}
      </button>
    </div>
  )
}

function PremiumItem({ item, player, onBuy }) {
  const isGold    = item.id === 'pseudo-dore'
  const owned     = isGold && player?.is_premium_color
  const canAfford = isGold ? (player?.gold || 0) >= item.price : true

  return (
    <div className="glass" style={{
      padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center', textAlign: 'center',
      border: isGold ? '1px solid rgba(255,215,0,0.35)' : undefined,
      background: isGold ? 'rgba(255,215,0,0.04)' : undefined,
    }}>
      <span style={{ fontSize: 32 }}>{item.emoji}</span>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
        color: isGold ? '#FFD700' : '#E2E2F0',
        textShadow: isGold ? '0 0 10px rgba(255,215,0,0.5)' : 'none' }}>
        {item.name}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: '#6B6B8A', lineHeight: 1.4 }}>{item.desc}</p>
      {owned ? (
        <p style={{ margin: 0, fontSize: 12, color: '#FFD700', fontWeight: 700 }}>✦ Activé</p>
      ) : (
        <button onClick={onBuy} disabled={!canAfford} style={{
          padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          cursor: canAfford ? 'pointer' : 'not-allowed', width: '100%',
          transition: 'all 0.2s', opacity: canAfford ? 1 : 0.5,
          background: isGold ? 'rgba(255,215,0,0.15)' : 'rgba(206,147,216,0.15)',
          border: isGold ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(206,147,216,0.4)',
          color: isGold ? '#FFD700' : '#CE93D8',
        }}>
          {isGold ? `💰 ${item.price} Or` : `💎 ${item.price} Gemmes`}
        </button>
      )}
    </div>
  )
}
