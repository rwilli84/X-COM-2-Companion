import type { CapabilityTag, MissionProfile } from './types'
import type { SoldierScore } from './soldierScoring'

// ─── Item catalog ─────────────────────────────────────────────────────────────

export interface ArmoryItem {
  id: string
  name: string
  slot: 'grenade' | 'utility' | 'ammo' | 'armor'
  category: 'standard' | 'pg' | 'armor_upgrade'
  missionTags: CapabilityTag[]
  preferredClasses?: string[]
  blackMarketValue: number  // approximate sell price in supplies
  pgCost?: { supplies: number; alloys: number; crystals: number; cores: number }
  notes: string
  wotcOnly?: boolean
}

export const ARMORY_CATALOG: ArmoryItem[] = [
  // ── Standard issue ──────────────────────────────────────────────────────────
  {
    id: 'frag_grenade',      name: 'Frag Grenade',
    slot: 'grenade',         category: 'standard',
    missionTags: ['aoe', 'armorShred'],
    blackMarketValue: 12,
    notes: 'Basic AoE. Destroys cover. Shreds 1 armor per target hit.',
  },
  {
    id: 'smoke_grenade',     name: 'Smoke Grenade',
    slot: 'grenade',         category: 'standard',
    missionTags: ['sustain'],
    preferredClasses: ['specialist'],
    blackMarketValue: 10,
    notes: '+20 defense for all allies in cloud. Strong on extraction and escort missions.',
  },
  {
    id: 'medikit',           name: 'Medikit',
    slot: 'utility',         category: 'standard',
    missionTags: ['sustain'],
    preferredClasses: ['specialist'],
    blackMarketValue: 10,
    notes: 'Heals 4 HP (8 with Field Medic). Always bring at least one per squad.',
  },

  // ── Proving Grounds ─────────────────────────────────────────────────────────
  {
    id: 'mimic_beacon',      name: 'Mimic Beacon',
    slot: 'utility',         category: 'pg',
    missionTags: ['crowdControl', 'actionEconomy'],
    blackMarketValue: 55,
    pgCost: { supplies: 100, alloys: 10, crystals: 5, cores: 0 },
    notes: 'Forces ALL enemies to target the beacon for one turn. Best single CC item in the game.',
  },
  {
    id: 'mindshield',        name: 'Mindshield',
    slot: 'utility',         category: 'pg',
    missionTags: ['psionics', 'sustain'],
    blackMarketValue: 35,
    pgCost: { supplies: 75, alloys: 5, crystals: 2, cores: 0 },
    notes: 'Prevents mind control and panic. Essential once Sectoids, Priests, and Avatars appear.',
  },
  {
    id: 'emp_grenade',       name: 'EMP Grenade',
    slot: 'grenade',         category: 'pg',
    missionTags: ['crowdControl', 'armorShred'],
    preferredClasses: ['grenadier', 'specialist'],
    blackMarketValue: 38,
    pgCost: { supplies: 75, alloys: 10, crystals: 2, cores: 0 },
    notes: 'Stuns and damages robotic enemies (MECs, Sectopods, turrets). Hard mechanical counter.',
  },
  {
    id: 'flashbang',         name: 'Flashbang Grenade',
    slot: 'grenade',         category: 'pg',
    missionTags: ['crowdControl'],
    blackMarketValue: 22,
    pgCost: { supplies: 50, alloys: 5, crystals: 0, cores: 0 },
    notes: 'Disorients multiple enemies (−30 aim, may Shaken). Cheap reliable crowd control.',
  },
  {
    id: 'incendiary_grenade', name: 'Incendiary Grenade',
    slot: 'grenade',          category: 'pg',
    missionTags: ['aoe', 'crowdControl'],
    blackMarketValue: 28,
    pgCost: { supplies: 75, alloys: 5, crystals: 2, cores: 0 },
    notes: 'Burning area denial. Berserkers and Vipers hate fire. Counters Lost clusters.',
  },
  {
    id: 'acid_grenade',      name: 'Acid Grenade',
    slot: 'grenade',         category: 'pg',
    missionTags: ['armorShred'],
    blackMarketValue: 28,
    pgCost: { supplies: 75, alloys: 5, crystals: 2, cores: 0 },
    notes: 'Shreds armor and poisons. Mid-game armor shred before beam weapons arrive.',
  },
  {
    id: 'battle_scanner',    name: 'Battle Scanner',
    slot: 'utility',         category: 'pg',
    missionTags: ['concealment'],
    blackMarketValue: 28,
    pgCost: { supplies: 50, alloys: 5, crystals: 0, cores: 0 },
    notes: 'Throwable scanner — reveals hidden enemies including concealed and elevated. Cheap.',
  },
  {
    id: 'skulljack',         name: 'Skulljack',
    slot: 'utility',         category: 'pg',
    missionTags: ['hacking'],
    preferredClasses: ['specialist', 'ranger'],
    blackMarketValue: 38,
    pgCost: { supplies: 100, alloys: 10, crystals: 5, cores: 0 },
    notes: 'Required for Skulljacking ADVENT Officers (triggers research). Also extracts intel.',
  },
  {
    id: 'ap_rounds',         name: 'AP Rounds',
    slot: 'ammo',            category: 'pg',
    missionTags: ['armorShred'],
    preferredClasses: ['sharpshooter', 'ranger', 'reaper'],
    blackMarketValue: 32,
    pgCost: { supplies: 75, alloys: 5, crystals: 0, cores: 0 },
    notes: 'Shreds 1 armor per hit. Effective Shredder upgrade for any soldier.',
  },
  {
    id: 'bluescreen_rounds', name: 'Bluescreen Rounds',
    slot: 'ammo',            category: 'pg',
    missionTags: ['burst'],
    preferredClasses: ['specialist', 'sharpshooter'],
    blackMarketValue: 42,
    pgCost: { supplies: 100, alloys: 0, crystals: 10, cores: 0 },
    notes: 'Massive bonus damage vs. robotic enemies. Pair with EMP Grenade for mech encounters.',
  },
  {
    id: 'venom_rounds',      name: 'Venom Rounds',
    slot: 'ammo',            category: 'pg',
    missionTags: ['crowdControl'],
    blackMarketValue: 26,
    pgCost: { supplies: 75, alloys: 5, crystals: 0, cores: 0 },
    notes: 'Poisons on hit. Softens Mutons and Archons over turns. Situational.',
  },
  {
    id: 'talon_rounds',      name: 'Talon Rounds',
    slot: 'ammo',            category: 'pg',
    missionTags: ['burst', 'mobility'],
    preferredClasses: ['ranger', 'skirmisher', 'reaper'],
    blackMarketValue: 32,
    wotcOnly: true,
    pgCost: { supplies: 75, alloys: 5, crystals: 0, cores: 0 },
    notes: '(WotC) +15% crit on flanking shots. Excellent on melee/mobile classes that flank regularly.',
  },
  {
    id: 'plasma_blaster',    name: 'Plasma Blaster',
    slot: 'utility',         category: 'pg',
    missionTags: ['burst', 'aoe'],
    blackMarketValue: 95,
    pgCost: { supplies: 150, alloys: 10, crystals: 15, cores: 1 },
    notes: 'Experimental heavy weapon with massive AoE. Very expensive. Build only with surplus cores.',
  },

  // ── Armor upgrades (tracked as upgrade tokens available to distribute) ──────
  {
    id: 'predator_armor',    name: 'Predator Armor',
    slot: 'armor',           category: 'armor_upgrade',
    missionTags: ['sustain'],
    blackMarketValue: 45,
    notes: '+2 HP, +1 armor. First major survivability upgrade. Prioritise frontline soldiers.',
  },
  {
    id: 'warden_armor',      name: 'Warden Armor',
    slot: 'armor',           category: 'armor_upgrade',
    missionTags: ['sustain'],
    blackMarketValue: 58,
    notes: '+3 HP, +1 armor, +1 utility slot. Upgrade from Predator. Research Powered Armor to unlock.',
  },
  {
    id: 'powered_armor',     name: 'Powered Armor (EXO/WAR)',
    slot: 'armor',           category: 'armor_upgrade',
    missionTags: ['sustain', 'burst'],
    blackMarketValue: 85,
    notes: '+4 HP, +2 armor, built-in heavy weapon slot. Best armor for frontline brawlers.',
  },
  {
    id: 'spider_suit',       name: 'Spider Suit',
    slot: 'armor',           category: 'armor_upgrade',
    missionTags: ['mobility', 'concealment'],
    preferredClasses: ['ranger', 'reaper', 'skirmisher'],
    blackMarketValue: 48,
    notes: '+2 HP, free grapple hook action. Massive mobility — best on scouting/flanking soldiers.',
  },
  {
    id: 'wraith_suit',       name: 'Wraith Suit',
    slot: 'armor',           category: 'armor_upgrade',
    missionTags: ['mobility', 'concealment'],
    preferredClasses: ['ranger', 'reaper'],
    blackMarketValue: 58,
    notes: '+2 HP, phase through walls once per turn. Exceptional flanking — ideal on stealth Rangers.',
  },
]

// ─── Loadout recommendation types ────────────────────────────────────────────

export interface LoadoutSlot {
  slot: 'grenade' | 'utility' | 'ammo' | 'armor'
  itemId: string
  itemName: string
  reason: string
  inStock: number
  priority: 'essential' | 'recommended' | 'optional'
}

export interface SoldierLoadout {
  soldierId: string
  soldierName: string
  soldierClass: string
  slots: LoadoutSlot[]
  armorNote?: string
}

// ─── Loadout advisor ──────────────────────────────────────────────────────────

export function recommendLoadouts(
  squad: SoldierScore[],
  armory: Record<string, number>,
  profile: MissionProfile,
): SoldierLoadout[] {
  const active = squad.filter(s => !s.excluded)
  if (active.length === 0) return []

  // Mutable allocation pool — track what's left after each assignment
  const pool: Record<string, number> = {}
  for (const [id, qty] of Object.entries(armory)) {
    if (qty > 0) pool[id] = qty
  }

  const avail = (id: string) => pool[id] ?? 0
  const take  = (id: string): number => {
    const q = pool[id] ?? 0
    if (q > 0) pool[id] = q - 1
    return q
  }

  // Mission context flags
  const needsShred    = (profile.needs.armorShred   ?? 0) >= 2
  const needsCC       = (profile.needs.crowdControl  ?? 0) >= 2
  const needsHack     = (profile.needs.hacking       ?? 0) >= 2
  const needsMobility = (profile.needs.mobility      ?? 0) >= 2
  const mechHeavy     = ['facility_assault', 'supply_raid', 'forge', 'final_mission', 'psi_gate'].includes(profile.id)
  const psiThreat     = ['psi_gate', 'final_mission', 'chosen_stronghold', 'blacksite'].includes(profile.id)
  const isLost        = profile.id === 'lost_abandoned' || profile.id === 'lost_mission'
  const isForge       = profile.id === 'forge'
  const isExtract     = profile.id === 'council_vip_extract' || profile.id === 'avenger_defense'

  const loadouts: SoldierLoadout[] = []

  for (const scored of active) {
    const s   = scored.soldier
    const cls = s.soldierClass
    const slots: LoadoutSlot[] = []

    // ── Armor note ────────────────────────────────────────────────────────
    let armorNote: string | undefined
    if (s.armorTier === 'none' || s.armorTier === 'kevlar') {
      const upgrades: Array<[string, string]> = [
        ['powered_armor', 'Powered Armor'],
        ['warden_armor', 'Warden Armor'],
        ['predator_armor', 'Predator Armor'],
        ...(needsMobility || ['ranger','reaper','skirmisher'].includes(cls)
          ? [['spider_suit','Spider Suit'],['wraith_suit','Wraith Suit']] as Array<[string,string]>
          : []),
      ]
      for (const [id, name] of upgrades) {
        if (avail(id) > 0) {
          armorNote = `${name} available (${avail(id)} in stock) — equip to upgrade from ${s.armorTier}.`
          break
        }
      }
    } else if (s.armorTier === 'predator' || s.armorTier === 'kevlar') {
      if (avail('powered_armor') > 0) armorNote = `Powered Armor available (${avail('powered_armor')}) — upgrade from ${s.armorTier}.`
      else if (avail('warden_armor') > 0) armorNote = `Warden Armor available (${avail('warden_armor')}) — upgrade from ${s.armorTier}.`
    }

    // ── Grenade slot ─────────────────────────────────────────────────────
    if (cls !== 'sharpshooter' && !isLost) {
      // EMP first on mech-heavy missions for Grenadiers/Specialists
      if (mechHeavy && (cls === 'grenadier' || cls === 'specialist') && avail('emp_grenade') > 0) {
        slots.push({ slot: 'grenade', itemId: 'emp_grenade', itemName: 'EMP Grenade',
          inStock: take('emp_grenade'), priority: 'essential',
          reason: 'Stuns and heavily damages Sectopods, MECs, and turrets — top priority on this mission.' })
      } else if (needsCC && avail('flashbang') > 0) {
        slots.push({ slot: 'grenade', itemId: 'flashbang', itemName: 'Flashbang Grenade',
          inStock: take('flashbang'), priority: 'recommended',
          reason: 'Disorients multiple enemies — reliable crowd control for dangerous pods.' })
      } else if (needsShred && cls === 'grenadier' && avail('acid_grenade') > 0) {
        slots.push({ slot: 'grenade', itemId: 'acid_grenade', itemName: 'Acid Grenade',
          inStock: take('acid_grenade'), priority: 'recommended',
          reason: 'Shreds armor and poisons — doubles up with Shredder for fast armor removal.' })
      } else if ((profile.needs.aoe ?? 0) >= 2 && avail('incendiary_grenade') > 0) {
        slots.push({ slot: 'grenade', itemId: 'incendiary_grenade', itemName: 'Incendiary Grenade',
          inStock: take('incendiary_grenade'), priority: 'optional',
          reason: 'Area denial — burning damage over time suits this AoE-heavy mission.' })
      } else if (avail('frag_grenade') > 0) {
        slots.push({ slot: 'grenade', itemId: 'frag_grenade', itemName: 'Frag Grenade',
          inStock: take('frag_grenade'), priority: 'optional',
          reason: 'Standard explosive — destroys cover and applies light armor shred.' })
      }
    }

    // ── Ammo slot ────────────────────────────────────────────────────────
    if (mechHeavy && ['specialist', 'sharpshooter'].includes(cls) && avail('bluescreen_rounds') > 0) {
      slots.push({ slot: 'ammo', itemId: 'bluescreen_rounds', itemName: 'Bluescreen Rounds',
        inStock: take('bluescreen_rounds'), priority: 'essential',
        reason: 'Massive bonus damage vs. robotic enemies — top ammo priority on this mission.' })
    } else if (needsShred && ['sharpshooter','ranger','reaper'].includes(cls) && avail('ap_rounds') > 0) {
      slots.push({ slot: 'ammo', itemId: 'ap_rounds', itemName: 'AP Rounds',
        inStock: take('ap_rounds'), priority: 'recommended',
        reason: 'Shreds 1 armor per hit — effective Shredder upgrade for this non-Grenadier.' })
    } else if (['ranger','skirmisher','reaper'].includes(cls) && avail('talon_rounds') > 0) {
      slots.push({ slot: 'ammo', itemId: 'talon_rounds', itemName: 'Talon Rounds',
        inStock: take('talon_rounds'), priority: 'recommended',
        reason: '+15% crit on flanks — this class flanks regularly, making Talon Rounds high-value.' })
    }

    // ── Utility slots ────────────────────────────────────────────────────
    // Mindshield — psi missions, give to lowest-Will soldiers (simplified: non-Psi Op)
    if (psiThreat && cls !== 'psi_operative' && avail('mindshield') > 0) {
      slots.push({ slot: 'utility', itemId: 'mindshield', itemName: 'Mindshield',
        inStock: take('mindshield'), priority: 'essential',
        reason: 'Psi threats expected — Mindshield prevents mind control and panic.' })
    }

    // Medikit — Specialist is the best carrier; also equip a backup soldier if 2+ medkits
    if (cls === 'specialist' && avail('medikit') > 0) {
      slots.push({ slot: 'utility', itemId: 'medikit', itemName: 'Medikit',
        inStock: take('medikit'), priority: 'essential',
        reason: "Field Medic doubles healing charges and adds +4 HP — Specialist is the best medic." })
    } else if (avail('medikit') > 1 && ['ranger','grenadier'].includes(cls)) {
      slots.push({ slot: 'utility', itemId: 'medikit', itemName: 'Medikit',
        inStock: take('medikit'), priority: 'recommended',
        reason: 'Backup medkit — useful if the Specialist goes down.' })
    }

    // Mimic Beacon — scarce, don't give to flankers who may die early
    if (avail('mimic_beacon') > 0 && !['reaper','ranger'].includes(cls) &&
        !slots.some(sl => sl.slot === 'utility')) {
      slots.push({ slot: 'utility', itemId: 'mimic_beacon', itemName: 'Mimic Beacon',
        inStock: take('mimic_beacon'), priority: 'essential',
        reason: 'Forces all enemies to target the beacon for a full turn — best crowd control in the game.' })
    }

    // Battle scanner for hacking missions / Specialists
    if (needsHack && cls === 'specialist' && avail('battle_scanner') > 0 &&
        slots.filter(s => s.slot === 'utility').length < 2) {
      slots.push({ slot: 'utility', itemId: 'battle_scanner', itemName: 'Battle Scanner',
        inStock: take('battle_scanner'), priority: 'recommended',
        reason: 'Reveal enemies before activating hack objectives — prevents being caught off-guard.' })
    }

    // Skulljack on Forge
    if (isForge && cls === 'specialist' && avail('skulljack') > 0) {
      slots.push({ slot: 'utility', itemId: 'skulljack', itemName: 'Skulljack',
        inStock: take('skulljack'), priority: 'essential',
        reason: 'Required to complete the Forge mission objective.' })
    }

    // Smoke grenade for extractions
    if (isExtract && avail('smoke_grenade') > 0 && slots.filter(s => s.slot === 'grenade').length === 0) {
      slots.push({ slot: 'grenade', itemId: 'smoke_grenade', itemName: 'Smoke Grenade',
        inStock: take('smoke_grenade'), priority: 'recommended',
        reason: 'Defense boost on extraction path — smoke the zone before the VIP/squad moves through.' })
    }

    if (slots.length > 0 || armorNote) {
      loadouts.push({ soldierId: s.id, soldierName: s.nickname || cls, soldierClass: cls, slots, armorNote })
    }
  }

  return loadouts
}

// ─── Black Market income analysis ────────────────────────────────────────────

export interface ItemIncomeEntry {
  item: ArmoryItem
  supplyEquivalentCost: number  // PG material costs converted to supply equivalent
  profitMargin: number          // blackMarketValue - supplyEquivalentCost
  roi: number                   // profitMargin / supplyCost × 100 (%)
  verdict: 'sell' | 'keep' | 'build-to-sell'
  note: string
}

// Rough supply equivalents for materials (alloys ~3, crystals ~4, cores ~50)
const ALLOY_VALUE   = 3
const CRYSTAL_VALUE = 4
const CORE_VALUE    = 50

export function analyzeItemIncome(armory: Record<string, number>): ItemIncomeEntry[] {
  return ARMORY_CATALOG
    .filter(item => item.category === 'pg')
    .map(item => {
      const pg = item.pgCost
      if (!pg) return null
      const materialCost = pg.alloys * ALLOY_VALUE + pg.crystals * CRYSTAL_VALUE + pg.cores * CORE_VALUE
      const totalCost    = pg.supplies + materialCost
      const profit       = item.blackMarketValue - totalCost
      const roi          = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0
      const inStock      = armory[item.id] ?? 0

      let verdict: ItemIncomeEntry['verdict'] = 'keep'
      let note = ''
      if (profit > 0 && roi >= 20) {
        verdict = inStock > 1 ? 'sell' : 'build-to-sell'
        note = `+${profit} supply profit per unit (${roi}% ROI). ${inStock > 1 ? `You have ${inStock} — sell excess.` : 'Build and sell surplus.'}`
      } else if (profit > 0) {
        verdict = 'build-to-sell'
        note = `Low margin (+${profit}) — only build to sell if Proving Grounds is completely idle.`
      } else {
        verdict = 'keep'
        note = `At a loss at current market rates. Build for use, not income.`
      }

      return { item, supplyEquivalentCost: totalCost, profitMargin: profit, roi, verdict, note }
    })
    .filter((x): x is ItemIncomeEntry => x !== null)
    .sort((a, b) => b.roi - a.roi)
}
