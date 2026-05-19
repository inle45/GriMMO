import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_KEY = 'grimmo_player_v1'

function generateGuestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function generateUsername(guestId) {
  const suffix = guestId.slice(-4).toUpperCase()
  return `Damné #${suffix}`
}

export function createDefaultProfile(guestId) {
  return {
    guest_id:            guestId,
    auth_id:             null,
    username:            generateUsername(guestId),
    level:               1,
    xp:                  0,
    xp_next:             100,
    hp:                  100,
    hp_max:              100,
    atk:                 10,
    def:                 5,
    gold:                500,
    element:             'feu',
    is_premium_color:    false,
    avatar:              '🧙',
    gear_sets:           [null, null, null],
    bp_xp:               0,
    bp_claimed:          [],
    quests:              { date: '', kills: 0, gold_earned: 0, completed: [] },
    inventory:           getStarterInventory(),
    boss_tickets:        3,
    boss_tickets_reset:  new Date().toDateString(),
  }
}

function getStarterInventory() {
  return [
    { id: 1, name: 'Potion de soin', emoji: '🧪', type: 'consommable', effect: 'hp+30', qty: 3, rarity: 'commun' },
    { id: 2, name: 'Glaive rouillé', emoji: '🗡️',  type: 'arme',       effect: 'atk+2', qty: 1, rarity: 'commun', equipped: true },
    null, null, null, null, null, null, null, null,
  ]
}

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function savePlayer(player) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player))
  } catch {}
}

export async function initPlayer() {
  let player = loadPlayer()

  if (!player) {
    const guestId = generateGuestId()
    player = createDefaultProfile(guestId)
    savePlayer(player)
    await syncToSupabase(player, 'INSERT')
    printSQLScript()
  } else {
    resetBossTicketsIfNewDay(player)
    savePlayer(player)
    printSQLScript()
  }

  return player
}

function resetBossTicketsIfNewDay(player) {
  if (player.boss_tickets_reset !== new Date().toDateString()) {
    player.boss_tickets       = 3
    player.boss_tickets_reset = new Date().toDateString()
  }
}

async function syncToSupabase(player, operation) {
  if (!isSupabaseConfigured || !supabase) return

  try {
    if (operation === 'INSERT') {
      await supabase.from('profiles').upsert({
        guest_id:            player.guest_id,
        username:            player.username,
        level:               player.level,
        xp:                  player.xp,
        xp_next:             player.xp_next,
        hp:                  player.hp,
        hp_max:              player.hp_max,
        atk:                 player.atk,
        def:                 player.def,
        gold:                player.gold,
        element:             player.element,
        inventory:           player.inventory,
        boss_tickets:        player.boss_tickets,
        boss_tickets_reset:  player.boss_tickets_reset,
      }, { onConflict: 'guest_id' })
    } else if (operation === 'UPDATE') {
      await supabase.from('profiles').update({
        level:               player.level,
        xp:                  player.xp,
        xp_next:             player.xp_next,
        hp:                  player.hp,
        hp_max:              player.hp_max,
        atk:                 player.atk,
        def:                 player.def,
        gold:                player.gold,
        element:             player.element,
        inventory:           player.inventory,
        boss_tickets:        player.boss_tickets,
        boss_tickets_reset:  player.boss_tickets_reset,
      }).eq('guest_id', player.guest_id)
    }
  } catch (err) {
    console.warn('[GriMMO] Synchronisation Supabase échouée (mode hors-ligne actif):', err.message)
  }
}

export async function persistPlayer(player) {
  savePlayer(player)
  await syncToSupabase(player, 'UPDATE')
}

export function gainXP(player, amount) {
  const p = { ...player }
  p.xp += amount
  while (p.xp >= p.xp_next) {
    p.xp      -= p.xp_next
    p.level   += 1
    p.xp_next  = Math.floor(p.xp_next * 1.5)
    p.hp_max  += 10
    p.hp       = p.hp_max
    p.atk     += 2
    p.def     += 1
  }
  return p
}

export function printMessagesSQL() {
  console.log(
`
╔══════════════════════════════════════════════════════════════════╗
║       GriMMO — SCRIPT SQL SUPABASE (table messages + realtime)  ║
╠══════════════════════════════════════════════════════════════════╣
║  Exécutez ce bloc dans : Supabase > SQL Editor                  ║
╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id           TEXT        NOT NULL REFERENCES public.profiles(guest_id) ON DELETE CASCADE,
  username          TEXT        NOT NULL,
  text              TEXT        NOT NULL CHECK (char_length(text) <= 500),
  is_premium_color  BOOLEAN     NOT NULL DEFAULT false
);

-- Index pour charger les derniers messages rapidement
CREATE INDEX IF NOT EXISTS messages_created_at_idx
  ON public.messages (created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages lisibles par tous"
  ON public.messages FOR SELECT USING (true);

CREATE POLICY "Envoi de message autorisé"
  ON public.messages FOR INSERT WITH CHECK (true);

-- Activer la réplication Realtime sur la table messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ✅ Realtime activé. La Taverne recevra les nouveaux messages en direct.
`
  )
}

export function printSQLScript() {
  console.log(
`
╔══════════════════════════════════════════════════════════════════╗
║          GriMMO — SCRIPT SQL SUPABASE (table profiles)          ║
╠══════════════════════════════════════════════════════════════════╣
║  Copiez et exécutez ce bloc dans : Supabase > SQL Editor        ║
╚══════════════════════════════════════════════════════════════════╝

-- Extension UUID (activée par défaut sur Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table principale des profils joueurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id            TEXT        UNIQUE NOT NULL,
  username            TEXT        NOT NULL DEFAULT 'Damné #0000',
  level               INTEGER     NOT NULL DEFAULT 1,
  xp                  INTEGER     NOT NULL DEFAULT 0,
  xp_next             INTEGER     NOT NULL DEFAULT 100,
  hp                  INTEGER     NOT NULL DEFAULT 100,
  hp_max              INTEGER     NOT NULL DEFAULT 100,
  atk                 INTEGER     NOT NULL DEFAULT 10,
  def                 INTEGER     NOT NULL DEFAULT 5,
  gold                INTEGER     NOT NULL DEFAULT 500,
  element             TEXT        NOT NULL DEFAULT 'feu'
    CHECK (element IN ('feu', 'terre', 'eau')),
  inventory           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  boss_tickets        INTEGER     NOT NULL DEFAULT 3,
  boss_tickets_reset  TEXT        NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les lookups par guest_id
CREATE INDEX IF NOT EXISTS profiles_guest_id_idx
  ON public.profiles (guest_id);

-- Trigger : mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique (affichage du marché entre joueurs)
CREATE POLICY "Profils lisibles par tous"
  ON public.profiles FOR SELECT
  USING (true);

-- Création de profil libre (invités)
CREATE POLICY "Création de profil autorisée"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Mise à jour limitée à son propre profil via app.current_guest_id
CREATE POLICY "Modification de son propre profil"
  ON public.profiles FOR UPDATE
  USING (guest_id = current_setting('app.current_guest_id', true));

-- ✅ Script terminé. Remplacez ensuite les placeholders dans .env.local
`
  )
}
