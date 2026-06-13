import { ADVISOR_CONFIG } from './config'
import type { InventorySnapshot, EconomyPlan, SellRecommendation, ProvingGroundsProject } from './types'
import type { CampaignSnapshot } from './types'
import rawFacilities from '../data/facilities.json'

const C = ADVISOR_CONFIG.ECONOMY_ADVISOR

// ── Proving Grounds catalogue ────────────────────────────────────────────────
// Costs are approximate; usefulness rated 1–10 for idle queue prioritisation.
export const PROVING_GROUNDS_ITEMS: ProvingGroundsProject[] = [
  {
    id: 'mimic_beacon',     name: 'Mimic Beacon',
    supplyCost: 100, alloyCost: 10, crystalCost: 5, coreCost: 0,
    usefulness: 10, category: 'utility',
    usefulnessNote: 'Forces all enemies to target the beacon for a full turn — the single best crowd-control item in the game.',
  },
  {
    id: 'mindshield',       name: 'Mindshield',
    supplyCost: 75,  alloyCost: 5,  crystalCost: 2, coreCost: 0,
    usefulness: 9,  category: 'utility',
    usefulnessNote: 'Prevents mind control and panic on the equipped soldier. Essential once Sectoids and Priests appear.',
  },
  {
    id: 'emp_grenade',      name: 'EMP Grenade',
    supplyCost: 75,  alloyCost: 10, crystalCost: 2, coreCost: 0,
    usefulness: 8,  category: 'grenade',
    usefulnessNote: 'Stuns and damages robotic enemies (MECs, Sectopods, turrets). Hard counter to the toughest mechanical units.',
  },
  {
    id: 'bluescreen_rounds', name: 'Bluescreen Rounds',
    supplyCost: 100, alloyCost: 0,  crystalCost: 10, coreCost: 0,
    usefulness: 8,  category: 'ammo',
    usefulnessNote: 'Massive bonus damage vs. robotic enemies. Pairs with EMP grenade for devastating anti-mech loadouts.',
  },
  {
    id: 'skulljack',        name: 'Skulljack',
    supplyCost: 100, alloyCost: 10, crystalCost: 5, coreCost: 0,
    usefulness: 7,  category: 'utility',
    usefulnessNote: 'Required for Skulljacking ADVENT Officers (triggers key research). Also useful for intel gathering mid-campaign.',
  },
  {
    id: 'battle_scanner',   name: 'Battle Scanner',
    supplyCost: 50,  alloyCost: 5,  crystalCost: 0, coreCost: 0,
    usefulness: 7,  category: 'utility',
    usefulnessNote: 'Throwable scanner that reveals a wide area including concealed and elevated enemies. Strong on unknown maps.',
  },
  {
    id: 'ap_rounds',        name: 'AP Rounds',
    supplyCost: 75,  alloyCost: 5,  crystalCost: 0, coreCost: 0,
    usefulness: 7,  category: 'ammo',
    usefulnessNote: 'Shreds 1 point of armor on hit. Effectively a free Shredder upgrade for any soldier — excellent on Sharpshooters.',
  },
  {
    id: 'incendiary_grenade', name: 'Incendiary Grenade',
    supplyCost: 75,  alloyCost: 5,  crystalCost: 2, coreCost: 0,
    usefulness: 6,  category: 'grenade',
    usefulnessNote: 'Sets an area on fire, denying movement and dealing persistent damage. Strong area denial vs. Lost clusters.',
  },
  {
    id: 'acid_grenade',     name: 'Acid Grenade',
    supplyCost: 75,  alloyCost: 5,  crystalCost: 2, coreCost: 0,
    usefulness: 6,  category: 'grenade',
    usefulnessNote: 'Shreds armor and poisons. Useful in mid-game before beam weapons arrive to deal with armored ADVENT.',
  },
  {
    id: 'venom_rounds',     name: 'Venom Rounds',
    supplyCost: 75,  alloyCost: 5,  crystalCost: 0, coreCost: 0,
    usefulness: 5,  category: 'ammo',
    usefulnessNote: 'Poisons on hit. Useful for softening tough enemies over multiple turns, especially Archons and Mutons.',
  },
  {
    id: 'flashbang',        name: 'Flashbang',
    supplyCost: 50,  alloyCost: 5,  crystalCost: 0, coreCost: 0,
    usefulness: 7,  category: 'grenade',
    usefulnessNote: 'Disorients multiple enemies, reducing their aim and triggering Shaken. Cheap, reliable crowd control.',
  },
  {
    id: 'talon_rounds',     name: 'Talon Rounds',
    supplyCost: 75,  alloyCost: 5,  crystalCost: 0, coreCost: 0,
    usefulness: 6,  category: 'ammo',
    usefulnessNote: '(WotC) +15% crit chance on flanking shots. Strong on Rangers and Skirmishers who regularly flank.',
  },
  {
    id: 'plasma_blaster',   name: 'Plasma Blaster',
    supplyCost: 150, alloyCost: 10, crystalCost: 15, coreCost: 1,
    usefulness: 9,  category: 'weapon',
    usefulnessNote: 'Experimental heavy weapon with massive AoE. Costs a core — only build when you have surplus cores and beam weapons unlocked.',
  },
]

// ── Material requirements for planned upgrades ───────────────────────────────
const ARMOR_MATERIAL_COSTS: Record<string, { alloys: number; crystals: number; cores: number }> = {
  predator: { alloys: 25, crystals: 10, cores: 0 },
  warden:   { alloys: 30, crystals: 15, cores: 0 },
  powered:  { alloys: 40, crystals: 20, cores: 1 },
  spider:   { alloys: 20, crystals: 5,  cores: 0 },
  wraith:   { alloys: 30, crystals: 10, cores: 0 },
}
const WEAPON_MATERIAL_COSTS: Record<string, { alloys: number; crystals: number; cores: number }> = {
  magnetic: { alloys: 30, crystals: 0,  cores: 0 },
  beam:     { alloys: 10, crystals: 25, cores: 1 },
}

export function adviseEconomy(
  inv: InventorySnapshot,
  snapshot: CampaignSnapshot,
  nextFacilityId?: string,
): EconomyPlan {
  const warnings: string[] = []
  const tips: string[] = []

  // ── How much do we need to keep? ────────────────────────────────────────────
  let alloysNeeded   = C.alloysKeepBuffer
  let crystalsNeeded = C.crystalsKeepBuffer
  let coresNeeded    = C.coresKeepBuffer

  if (inv.plannedArmorTier) {
    const cost = ARMOR_MATERIAL_COSTS[inv.plannedArmorTier]
    if (cost) {
      alloysNeeded   = Math.max(alloysNeeded,   C.alloysKeepBuffer + cost.alloys)
      crystalsNeeded = Math.max(crystalsNeeded, C.crystalsKeepBuffer + cost.crystals)
      coresNeeded    = Math.max(coresNeeded,    C.coresKeepBuffer + cost.cores)
    }
  }
  if (inv.plannedWeaponTier) {
    const cost = WEAPON_MATERIAL_COSTS[inv.plannedWeaponTier]
    if (cost) {
      alloysNeeded   = Math.max(alloysNeeded,   C.alloysKeepBuffer + cost.alloys)
      crystalsNeeded = Math.max(crystalsNeeded, C.crystalsKeepBuffer + cost.crystals)
      coresNeeded    = Math.max(coresNeeded,    C.coresKeepBuffer + cost.cores)
    }
  }

  // ── Sell recommendations ────────────────────────────────────────────────────
  const sellRecs: SellRecommendation[] = []

  // Alloys
  const alloySafe = Math.max(0, inv.alloys - alloysNeeded)
  sellRecs.push({
    item: 'Alien Alloys',
    currentStock: inv.alloys,
    safeToSell: alloySafe,
    keepAmount: alloysNeeded,
    risk: alloySafe > 0 ? 'safe' : inv.alloys >= alloysNeeded * 0.75 ? 'caution' : 'hold',
    reason: alloySafe > 0
      ? `You have ${inv.alloys} alloys. After reserving ${alloysNeeded} for armor/weapons you can safely sell ${alloySafe}.`
      : `Keep all alloys — you need them for ${inv.plannedArmorTier ?? 'upcoming armor'} (${alloysNeeded} required).`,
  })

  // Crystals
  const crystalSafe = Math.max(0, inv.crystals - crystalsNeeded)
  sellRecs.push({
    item: 'Elerium Crystals',
    currentStock: inv.crystals,
    safeToSell: crystalSafe,
    keepAmount: crystalsNeeded,
    risk: crystalSafe > 0 ? 'safe' : inv.crystals >= crystalsNeeded * 0.75 ? 'caution' : 'hold',
    reason: crystalSafe > 0
      ? `You have ${inv.crystals} crystals. Reserve ${crystalsNeeded} for weapon/armor upgrades, sell the rest (${crystalSafe}).`
      : `Hold all elerium crystals — stocks are below the recommended buffer of ${crystalsNeeded}.`,
  })

  // Cores — almost never sell
  const coreSafe = Math.max(0, inv.cores - Math.max(coresNeeded, 3))
  sellRecs.push({
    item: 'Elerium Cores',
    currentStock: inv.cores,
    safeToSell: coreSafe,
    keepAmount: Math.max(coresNeeded, 3),
    risk: coreSafe > 0 ? 'caution' : 'hold',
    reason: coreSafe > 0
      ? `You have ${inv.cores} cores — more than your buffer. Selling ${coreSafe} is cautiously possible but cores fund late-game items (Plasma Blaster, powered armor).`
      : `Never sell Elerium Cores unless desperate. You only find ~5–8 per campaign; they gate powered armor and experimental heavy weapons.`,
  })

  // Intel
  const intelSafe = Math.max(0, inv.intel - C.intelKeepBuffer)
  sellRecs.push({
    item: 'Intel',
    currentStock: inv.intel,
    safeToSell: intelSafe,
    keepAmount: C.intelKeepBuffer,
    risk: intelSafe > 20 ? 'safe' : 'caution',
    reason: intelSafe > 0
      ? `Reserve ${C.intelKeepBuffer} intel for covert actions and resistance orders. You can sell the surplus (${intelSafe}).`
      : `Intel is low — focus on gathering before spending. Covert actions and resistance orders cost 20–40 intel each.`,
  })

  // ── Supply projection ────────────────────────────────────────────────────────
  const weeklyIncome = C.suppliesBase + inv.contacts * C.suppliesPerContact
  const projected4  = inv.supplies + weeklyIncome * 4
  const projected8  = inv.supplies + weeklyIncome * 8

  // Next facility cost
  let nextFacilityCost: number | null = null
  let nextFacilityName: string | null = null
  if (nextFacilityId) {
    const fac = (rawFacilities as Array<{ id: string; name: string; supplyCost?: number; buildCost?: number }>)
      .find(f => f.id === nextFacilityId)
    if (fac) {
      nextFacilityCost = fac.supplyCost ?? fac.buildCost ?? null
      nextFacilityName = fac.name
    }
  }

  const weeksToAfford = nextFacilityCost !== null && weeklyIncome > 0
    ? Math.ceil(Math.max(0, nextFacilityCost - inv.supplies) / weeklyIncome)
    : null

  // ── Income warnings ──────────────────────────────────────────────────────────
  if (inv.contacts === 0) {
    warnings.push('⚠ No resistance contacts active — your only income is the base HQ stipend. Expand contacts immediately.')
  } else if (inv.contacts <= 2) {
    warnings.push(`⚠ Only ${inv.contacts} active contact(s). Each additional contact adds ${C.suppliesPerContact} supplies/week. Expanding regions is a strong economic multiplier.`)
  }

  if (inv.supplies < 50) {
    warnings.push('⚠ Critically low supplies. Avoid queuing facility builds or Proving Grounds projects until the next supply drop.')
  }

  if (inv.cores === 0) {
    warnings.push('⚠ No Elerium Cores in stock. Without cores you cannot build Powered Armor or the Plasma Blaster — prioritise missions that reward cores.')
  }

  // ── Tips ─────────────────────────────────────────────────────────────────────
  tips.push(`Each new resistance contact adds ${C.suppliesPerContact} supplies/week (~${C.suppliesPerContact * 4}/month). Expanding contacts compounds throughout the campaign.`)

  if (!inv.provingGroundsActive) {
    tips.push('Your Proving Grounds is idle. Queueing experimental items uses materials that are otherwise sitting — even a Flashbang or Battle Scanner can swing a mission.')
  }

  if (snapshot.doomPressure === 'low' || snapshot.doomPressure === 'medium') {
    tips.push('Under low doom pressure, use idle supply cycles to stockpile materials. The late-game gear spike (beam weapons + powered armor) costs significantly more than early tiers.')
  }

  // ── Proving Grounds queue ────────────────────────────────────────────────────
  const pgQueue = PROVING_GROUNDS_ITEMS
    .filter(p => p.usefulness >= C.provingGroundsLowPriorityThreshold)
    .sort((a, b) => b.usefulness - a.usefulness)
    .map(p => {
      const affordable =
        inv.supplies  >= p.supplyCost  &&
        inv.alloys    >= p.alloyCost   &&
        inv.crystals  >= p.crystalCost &&
        inv.cores     >= p.coreCost

      const shortfalls: string[] = []
      if (inv.supplies  < p.supplyCost)  shortfalls.push(`${p.supplyCost - inv.supplies} more supplies`)
      if (inv.alloys    < p.alloyCost)   shortfalls.push(`${p.alloyCost - inv.alloys} more alloys`)
      if (inv.crystals  < p.crystalCost) shortfalls.push(`${p.crystalCost - inv.crystals} more crystals`)
      if (inv.cores     < p.coreCost)    shortfalls.push(`${p.coreCost - inv.cores} more cores`)

      return {
        ...p,
        affordable,
        reason: affordable
          ? 'You can build this now.'
          : `Need ${shortfalls.join(', ')}.`,
      }
    })

  return {
    sellRecommendations: sellRecs,
    provingGroundsQueue: pgQueue,
    supplyProjection: {
      weeklyIncome,
      projectedIn4Weeks: projected4,
      projectedIn8Weeks: projected8,
      weeksToAffordNextFacility: weeksToAfford,
      nextFacilityCost,
      nextFacilityName,
    },
    warnings,
    tips,
  }
}
