import { ADVISOR_CONFIG } from './config'
import { ABILITY_TAGS, CLASS_INNATE, RULER_STASIS_ABILITIES, PSI_PROTECTION_ABILITIES } from './abilityTags'
import type { MissionProfile, SoldierScore, CampaignSnapshot, CapabilityTag } from './types'
import type { Soldier } from '../data/types'

const C = ADVISOR_CONFIG.SCORING

const RANK_ORDER = ['rookie', 'squaddie', 'corporal', 'sergeant', 'lieutenant', 'captain', 'major', 'colonel']

function rankIndex(rank: string): number {
  return RANK_ORDER.indexOf(rank)
}

// Collect all ability ids this soldier has: planned + taken (planned counts at 0.6 value)
function soldierAbilities(soldier: Soldier): Array<{ id: string; weight: number }> {
  const out: Array<{ id: string; weight: number }> = []
  // taken abilities count fully
  for (const id of soldier.takenAbilities) out.push({ id, weight: 1.0 })
  // planned-but-not-taken count at partial value (they may not be chosen yet)
  for (const id of soldier.plannedAbilities) {
    if (!soldier.takenAbilities.includes(id)) out.push({ id, weight: 0.6 })
  }
  return out
}

export function scoreSoldier(
  soldier: Soldier,
  profile: MissionProfile,
  snapshot: CampaignSnapshot,
): SoldierScore {
  const { dlc } = snapshot.campaign
  const breakdowns: Array<{ label: string; delta: number; tag?: CapabilityTag }> = []
  const warnings: string[] = []

  // ── Hard exclusions ──────────────────────────────────────────────────────
  if (soldier.status === 'wounded') {
    return { soldier, score: C.woundedScore, excluded: true, exclusionReason: 'Wounded — unavailable', breakdowns: [], warnings: [] }
  }
  if (soldier.status === 'dead' || soldier.status === 'captured') {
    return { soldier, score: C.woundedScore, excluded: true, exclusionReason: `Status: ${soldier.status}`, breakdowns: [], warnings: [] }
  }

  let score = 0

  // ── Status penalties ─────────────────────────────────────────────────────
  if (soldier.status === 'tired' && dlc.wotc) {
    score += C.tiredPenalty
    breakdowns.push({ label: 'Tired (WotC penalty)', delta: C.tiredPenalty })
    warnings.push('Tired soldiers risk gaining negative traits if deployed. Rest them if possible.')
  }
  if (soldier.status === 'shaken' && dlc.wotc) {
    score += C.shakenPenalty
    breakdowns.push({ label: 'Shaken (WotC penalty)', delta: C.shakenPenalty })
    warnings.push('Shaken soldiers have very low Will — vulnerable to panic and psionic attacks this mission.')
  }

  // ── Rank bonus ───────────────────────────────────────────────────────────
  const ri = rankIndex(soldier.rank)
  const rankDelta = C.rankBonus[Math.min(ri, C.rankBonus.length - 1)]
  if (rankDelta > 0) {
    score += rankDelta
    breakdowns.push({ label: `Rank: ${soldier.rank}`, delta: rankDelta })
  }

  // ── Gear tier bonus ──────────────────────────────────────────────────────
  if (soldier.weaponTier === 'beam') {
    score += C.beamBonus
    breakdowns.push({ label: 'Beam/Plasma weapons', delta: C.beamBonus })
  } else if (soldier.weaponTier === 'magnetic') {
    score += C.magneticBonus
    breakdowns.push({ label: 'Magnetic weapons', delta: C.magneticBonus })
  }
  if (soldier.armorTier !== 'none') {
    score += C.armorBonus
    breakdowns.push({ label: `Armor: ${soldier.armorTier}`, delta: C.armorBonus })
  }

  // ── Ability contributions ────────────────────────────────────────────────
  const abilities = soldierAbilities(soldier)
  const tagContributed = new Set<CapabilityTag>() // prevent double-counting same tag from multiple abilities

  for (const { id, weight } of abilities) {
    const tags = ABILITY_TAGS[id]
    if (!tags) continue
    for (const tag of tags) {
      const needWeight = (profile.needs[tag] ?? 0)
      if (needWeight === 0) continue
      const delta = Math.round(C.abilityTagBase * needWeight * weight)
      score += delta
      breakdowns.push({ label: `${id} → ${tag}`, delta, tag })
      tagContributed.add(tag)
    }
  }

  // ── Class innate aptitude fallback ───────────────────────────────────────
  // Only applies if the soldier has NO abilities logged (truly blank slate)
  if (abilities.length === 0) {
    const innate = soldier.soldierClass ? CLASS_INNATE[soldier.soldierClass] : null
    let innateTotal = 0
    if (innate) {
      for (const [tag, val] of Object.entries(innate)) {
        const needWeight = (profile.needs[tag as CapabilityTag] ?? 0)
        if (needWeight === 0) continue
        const delta = C.classAptitudeBase * needWeight * (val ?? 0)
        innateTotal += delta
      }
    }
    if (innateTotal > 0) {
      score += innateTotal
      breakdowns.push({ label: `Class aptitude: ${soldier.soldierClass} (no abilities logged)`, delta: innateTotal })
    }
  }

  // ── Required-role bonus ──────────────────────────────────────────────────
  if (profile.requiredRoles?.includes(soldier.soldierClass as 'specialist' | 'grenadier' | 'psi_operative' | 'reaper')) {
    score += C.requiredRoleBonus
    breakdowns.push({ label: `Required role: ${soldier.soldierClass}`, delta: C.requiredRoleBonus })
  }

  // ── Mission-specific warnings ─────────────────────────────────────────────
  if (profile.id === 'alien_ruler_encounter') {
    const hasStasis = [...soldier.takenAbilities, ...soldier.plannedAbilities]
      .some(id => RULER_STASIS_ABILITIES.has(id))
    if (hasStasis) {
      score += 4
      breakdowns.push({ label: 'Has Ruler stasis/hack ability', delta: 4 })
    }
  }

  if (profile.id === 'chosen_stronghold' || profile.id === 'final_mission') {
    const hasPsiProt = [...soldier.takenAbilities, ...soldier.plannedAbilities]
      .some(id => PSI_PROTECTION_ABILITIES.has(id))
    if (hasPsiProt) {
      score += 3
      breakdowns.push({ label: 'Has psi protection', delta: 3 })
    }
  }

  return { soldier, score, excluded: false, breakdowns, warnings }
}

export interface SquadScoreInput {
  profile: MissionProfile
  snapshot: CampaignSnapshot
  squadSize: number
  lockedIds?: string[]
  bannedIds?: string[]
}

export interface SquadResult {
  recommended: SoldierScore[]
  alternates: SoldierScore[]
  squadWarnings: string[]
  missingRoles: string[]
  bondPairsInSquad: Array<{ s1Name: string; s2Name: string; note: string }>
  dataQuality: 'full' | 'partial' | 'minimal'
  missingDataHints: string[]
}

export function recommendSquad(input: SquadScoreInput): SquadResult {
  const { profile, snapshot, squadSize, lockedIds = [], bannedIds = [] } = input
  const { soldiers, bonds, campaign } = snapshot
  const { dlc } = campaign

  const available = soldiers.filter(s =>
    !bannedIds.includes(s.id) &&
    s.campaignId === campaign.id &&
    s.status !== 'dead' && s.status !== 'captured'
  )

  // Score everyone
  const allScores = available.map(s => scoreSoldier(s, profile, snapshot))
  allScores.sort((a, b) => b.score - a.score)

  // Data quality check
  const abilitiesLogged = soldiers.filter(s =>
    s.campaignId === campaign.id &&
    (s.takenAbilities.length + s.plannedAbilities.length) > 0
  ).length
  const totalActive = soldiers.filter(s =>
    s.campaignId === campaign.id && s.status !== 'dead' && s.status !== 'captured'
  ).length

  let dataQuality: 'full' | 'partial' | 'minimal' = 'full'
  const missingDataHints: string[] = []
  if (totalActive === 0) {
    dataQuality = 'minimal'
    missingDataHints.push('Add soldiers to your roster for squad recommendations.')
  } else if (abilitiesLogged < totalActive * 0.5) {
    dataQuality = 'partial'
    missingDataHints.push(`Log abilities in soldiers\' Skill Trees for more accurate scoring (${abilitiesLogged}/${totalActive} done).`)
  }

  const notExcluded = allScores.filter(s => !s.excluded)

  // Build squad: locked soldiers first, then highest scorers
  const lockedScores = notExcluded.filter(s => lockedIds.includes(s.soldier.id))
  const remaining = notExcluded.filter(s => !lockedIds.includes(s.soldier.id))

  const selected: SoldierScore[] = [...lockedScores]
  for (const s of remaining) {
    if (selected.length >= squadSize) break
    selected.push(s)
  }

  const alternates = notExcluded.filter(s => !selected.includes(s)).slice(0, 3)

  // Squad-level warnings
  const squadWarnings: string[] = [...(profile.generalWarnings ?? [])]

  // Check required roles
  const missingRoles: string[] = []
  if (profile.requiredRoles) {
    for (const role of profile.requiredRoles) {
      if (!selected.some(s => s.soldier.soldierClass === role)) {
        missingRoles.push(role)
        squadWarnings.push(`⚠ No ${role} in squad — ${roleWarning(role, profile.id)}`)
      }
    }
  }

  // Armor shred check
  const armorMissions = new Set(['facility_assault', 'alien_ruler_encounter', 'final_mission', 'blacksite', 'forge', 'psi_gate'])
  if (armorMissions.has(profile.id)) {
    const hasShred = selected.some(s =>
      [...s.soldier.takenAbilities, ...s.soldier.plannedAbilities]
        .some(id => ABILITY_TAGS[id]?.includes('armorShred'))
      || s.soldier.soldierClass === 'grenadier'
    )
    if (!hasShred && dataQuality !== 'minimal') {
      squadWarnings.push('⚠ No armor-shred detected — heavily armored enemies will waste most of your shots. Add a Grenadier (Shredder) or consider Rupture rounds.')
    }
  }

  // Grenade check for armored missions
  const hasGrenadier = selected.some(s => s.soldier.soldierClass === 'grenadier')
  if ((profile.needs.armorShred ?? 0) >= 2 && !hasGrenadier && dataQuality !== 'minimal') {
    squadWarnings.push('⚠ No Grenadier in squad — cover destruction and armor shred will be limited.')
  }

  // Ruler-specific: stasis check
  if (profile.id === 'alien_ruler_encounter') {
    const hasStasis = selected.some(s =>
      [...s.soldier.takenAbilities, ...s.soldier.plannedAbilities]
        .some(id => RULER_STASIS_ABILITIES.has(id))
    )
    if (!hasStasis) {
      squadWarnings.push('⚠ No Stasis or Haywire Protocol in squad — you have no way to pause Ruler Reactions. The Psi Operative\'s Stasis is the safest counter. Equip Ruler Reaction items from the Proving Grounds instead.')
    }
  }

  // WotC Chosen stronghold: check the Chosen's weaknesses
  if (profile.id === 'chosen_stronghold') {
    const meleeHeavy = selected.filter(s =>
      [...s.soldier.takenAbilities, ...s.soldier.plannedAbilities]
        .filter(id => ABILITY_TAGS[id]?.includes('melee')).length >= 2
    ).length >= 2
    if (meleeHeavy) {
      squadWarnings.push('⚠ Melee-heavy squad: if this is the Assassin\'s Stronghold, she counters melee attacks. Check her weaknesses in the Intel tab.')
    }
  }

  // WotC bonds
  const bondPairsInSquad: Array<{ s1Name: string; s2Name: string; note: string }> = []
  if (dlc.wotc) {
    const selectedIds = new Set(selected.map(s => s.soldier.id))
    for (const bond of bonds) {
      if (bond.campaignId !== campaign.id) continue
      if (selectedIds.has(bond.soldier1Id) && selectedIds.has(bond.soldier2Id)) {
        const s1 = soldiers.find(s => s.id === bond.soldier1Id)
        const s2 = soldiers.find(s => s.id === bond.soldier2Id)
        if (s1 && s2) {
          bondPairsInSquad.push({
            s1Name: s1.nickname,
            s2Name: s2.nickname,
            note: `Bond Lv.${bond.level} — will share Bond abilities in combat`,
          })
        }
      }
    }
  }

  // Gear tier warning
  const allConventional = selected.every(s => s.soldier.weaponTier === 'conventional')
  if (allConventional && ['facility_assault', 'chosen_stronghold', 'alien_ruler_encounter', 'final_mission'].includes(profile.id)) {
    squadWarnings.push('⚠ All soldiers using conventional weapons — you will struggle to kill reinforced targets. Research Magnetic Weapons as your next priority.')
  }

  return { recommended: selected, alternates, squadWarnings, missingRoles, bondPairsInSquad, dataQuality, missingDataHints }
}

function roleWarning(role: string, missionId: string): string {
  const map: Record<string, string> = {
    specialist: 'terminals, supply crates, and hack objectives cannot be activated',
    grenadier: 'cover destruction and armor shred will be severely limited',
    psi_operative: 'psionic threats cannot be countered effectively',
    reaper: 'concealment scouting advantage lost',
  }
  return map[role] ?? `mission strongly favours this class`
}
