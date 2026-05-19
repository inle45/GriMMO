// Système élémentaire : Feu > Terre > Eau > Feu
const ELEMENT_ADVANTAGE = {
  feu:   'terre',
  terre: 'eau',
  eau:   'feu',
}

export function getElementBonus(attackerEl, defenderEl) {
  if (ELEMENT_ADVANTAGE[attackerEl] === defenderEl) return { mult: 1.5, label: 'BONUS ÉLÉMENTAIRE' }
  if (ELEMENT_ADVANTAGE[defenderEl] === attackerEl) return { mult: 0.7, label: 'résistance élémentaire' }
  return { mult: 1.0, label: null }
}

export const ZONES = {
  foret: {
    id: 'foret',
    name: 'Forêt Maudite',
    emoji: '🌲',
    element: 'terre',
    colorClass: 'active-earth',
    minLevel: 1,
    enemies: [
      { name: 'Loup Spectre',    emoji: '🐺', hp: 40,  atk: 8,  def: 2, xp: 20, gold: [5,15],  element: 'terre' },
      { name: 'Dryade Corrompue',emoji: '🌿', hp: 55,  atk: 10, def: 4, xp: 28, gold: [8,20],  element: 'terre' },
      { name: 'Araignée Géante', emoji: '🕷️', hp: 35,  atk: 12, def: 1, xp: 22, gold: [6,12],  element: 'eau'   },
    ],
    lootTable: [
      { name: 'Baie de Sombre',  emoji: '🍇', type: 'consommable', effect: 'hp+15', rarity: 'commun',  chance: 0.35 },
      { name: 'Écorce Ancienne', emoji: '🪵', type: 'materiau',    effect: null,    rarity: 'commun',  chance: 0.25 },
      { name: 'Plume Maudite',   emoji: '🪶', type: 'materiau',    effect: null,    rarity: 'rare',    chance: 0.10 },
      { name: 'Anneau des Bois', emoji: '💍', type: 'accessoire',  effect: 'def+3', rarity: 'rare',    chance: 0.06 },
    ],
  },
  crypte: {
    id: 'crypte',
    name: 'Crypte des Oubliés',
    emoji: '💀',
    element: 'eau',
    colorClass: 'active-water',
    minLevel: 3,
    enemies: [
      { name: 'Squelette Archer', emoji: '🦴', hp: 70,  atk: 14, def: 6,  xp: 45, gold: [15,30], element: 'eau'  },
      { name: 'Liche Mineure',    emoji: '💀', hp: 90,  atk: 18, def: 8,  xp: 60, gold: [20,40], element: 'eau'  },
      { name: 'Banshee',          emoji: '👻', hp: 60,  atk: 22, def: 3,  xp: 55, gold: [18,35], element: 'feu'  },
    ],
    lootTable: [
      { name: 'Potion de Lich',     emoji: '🧪', type: 'consommable', effect: 'hp+50', rarity: 'commun',  chance: 0.3  },
      { name: 'Os Brisé',           emoji: '🦴', type: 'materiau',    effect: null,    rarity: 'commun',  chance: 0.2  },
      { name: 'Essaim de Spectres', emoji: '💠', type: 'materiau',    effect: null,    rarity: 'rare',    chance: 0.08 },
      { name: 'Épée Fantôme',       emoji: '⚔️', type: 'arme',        effect: 'atk+8', rarity: 'epique',  chance: 0.04 },
    ],
  },
  donjon: {
    id: 'donjon',
    name: 'Donjon du Tyran',
    emoji: '🏰',
    element: 'feu',
    colorClass: 'active-fire',
    minLevel: 5,
    isBoss: true,
    enemies: [
      { name: 'Gardien de Fer',    emoji: '🛡️', hp: 200, atk: 25, def: 15, xp: 150, gold: [60,100], element: 'terre' },
      { name: 'Drake Infernal',    emoji: '🐉', hp: 280, atk: 35, def: 12, xp: 200, gold: [80,140], element: 'feu'   },
      { name: 'Seigneur des Cendres',emoji:'👹',hp: 350, atk: 40, def: 18, xp: 250, gold: [100,180],element: 'feu'   },
    ],
    lootTable: [
      { name: 'Cœur de Drake',     emoji: '❤️‍🔥', type: 'materiau',    effect: null,     rarity: 'epique',     chance: 0.5  },
      { name: 'Heaume Infernal',   emoji: '⛑️',  type: 'armure',      effect: 'def+12', rarity: 'epique',     chance: 0.15 },
      { name: 'Lame du Tyran',     emoji: '🗡️',  type: 'arme',        effect: 'atk+18', rarity: 'legendaire', chance: 0.05 },
      { name: 'Couronne Maudite',  emoji: '👑',  type: 'accessoire',  effect: 'all+5',  rarity: 'legendaire', chance: 0.03 },
    ],
  },
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function rollLoot(lootTable) {
  const drops = []
  for (const item of lootTable) {
    if (Math.random() < item.chance) {
      drops.push({ ...item, id: Date.now() + Math.random(), qty: 1 })
    }
  }
  return drops
}

export function runCombatRound(player, enemy) {
  const log = []
  let pHp  = player.hp
  let eHp  = enemy.hp

  log.push({ type: 'system', text: `⚔️  Rencontre : ${enemy.emoji} ${enemy.name} [${eHp} PV]` })
  log.push({ type: 'system', text: `Éléments : ${formatElement(player.element)} vs ${formatElement(enemy.element)}` })

  let round = 1
  while (pHp > 0 && eHp > 0 && round <= 30) {
    // Attaque du joueur
    const { mult: pm, label: pl } = getElementBonus(player.element, enemy.element)
    let pDmg = Math.max(1, Math.round((player.atk - enemy.def * 0.4) * pm + randInt(-2, 2)))
    const pCrit = Math.random() < 0.12
    if (pCrit) pDmg = Math.round(pDmg * 1.8)

    eHp -= pDmg

    if (pCrit) log.push({ type: 'crit',  text: `💥 CRITIQUE ! Tu infliges ${pDmg} dégâts.` })
    else if (pl) log.push({ type: 'bonus', text: `🔥 ${pl} ! Tu infliges ${pDmg} dégâts.` })
    else log.push({ type: 'dmg', text: `→ Tu infliges ${pDmg} dégâts à ${enemy.name}.` })

    if (eHp <= 0) break

    // Contre-attaque ennemie
    const { mult: em, label: el } = getElementBonus(enemy.element, player.element)
    let eDmg = Math.max(1, Math.round((enemy.atk - player.def * 0.5) * em + randInt(-1, 3)))
    eHp = Math.max(0, eHp)

    pHp -= eDmg
    if (el) log.push({ type: 'heal', text: `${enemy.emoji} ${el} ! Il inflige ${eDmg} dégâts.` })
    else    log.push({ type: 'heal', text: `${enemy.emoji} ${enemy.name} riposte : ${eDmg} dégâts.` })

    round++
  }

  const victory = eHp <= 0

  let goldEarned = 0
  let xpEarned   = 0
  let loot       = []

  if (victory) {
    goldEarned = randInt(enemy.gold[0], enemy.gold[1])
    xpEarned   = enemy.xp
    loot       = rollLoot(ZONES[player._currentZone]?.lootTable || [])
    log.push({ type: 'win', text: `✨ Victoire ! +${xpEarned} XP · +${goldEarned} Or` })
    if (loot.length > 0) {
      log.push({ type: 'win', text: `🎁 Butin : ${loot.map(i => `${i.emoji} ${i.name}`).join(', ')}` })
    }
  } else {
    pHp = 1
    log.push({ type: 'lose', text: `💀 Défaite ! Tu t'effondres mais survis avec 1 PV...` })
  }

  return {
    victory,
    playerHpLeft: Math.max(0, pHp),
    goldEarned,
    xpEarned,
    loot,
    log,
  }
}

function formatElement(el) {
  const map = { feu: '🔥 Feu', terre: '🌿 Terre', eau: '💧 Eau' }
  return map[el] || el
}

export function pickEnemy(zone) {
  const enemies = ZONES[zone]?.enemies || []
  return { ...enemies[randInt(0, enemies.length - 1)], hp: undefined }
}

export function getEnemyWithHp(zone) {
  const enemies = ZONES[zone]?.enemies || []
  const base    = enemies[randInt(0, enemies.length - 1)]
  return { ...base }
}
