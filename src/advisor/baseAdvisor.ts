import { ADVISOR_CONFIG } from './config'
import type { BasePlan, BaseRecommendation, StaffingRecommendation, CampaignSnapshot } from './types'
import type { Facility } from '../data/types'
import rawFacilities from '../data/facilities.json'

const allFacilities = rawFacilities as Facility[]
const C = ADVISOR_CONFIG.BASE_ADVISOR

// Optimal build-order backbone: facility id → priority weight
// Higher = build sooner. Context adjusts individual values.
const FACILITY_PRIORITY_BASE: Record<string, number> = {
  guerrilla_tactics: 18,    // GTS — squad upgrades multiply every soldier
  training_center: 18,      // WotC replacement for GTS
  shadow_chamber: 15,       // Needed for story chain → Avatar reduction
  resistance_comms: 14,     // Expanding contacts opens supply/mission options
  proving_grounds: 12,      // Experimental items, Ruler weapons (AH)
  power_relay: 10,          // Power management — build before brownout
  advanced_warfare: 9,      // Faster wound recovery, bonus abilities
  infirmary: 9,             // WotC: Will recovery, trait removal
  workshop: 8,              // Free gremlin engineers, adjacency value
  psi_lab: 7,               // Psi Operative class — powerful but niche
  laboratory: 6,            // Extra scientists — value grows with research backlog
  engineering: 5,           // Extra engineers — value grows with build demand
}

// Which cells have "exposed power coil" adjacency bonus for Power Relay
const EXPOSED_COIL_CELLS: Array<{ col: number; row: number }> = [
  { col: 0, row: 0 }, { col: 3, row: 0 },
  { col: 0, row: 2 }, { col: 3, row: 2 },
]

export function advisePlan(snapshot: CampaignSnapshot, missionCount: number, engineerCount?: number, scientistCount?: number): BasePlan {
  const { campaign } = snapshot
  const { facilityPlacements, dlc, completedResearch } = campaign
  const doom = snapshot.doomPressure

  const builtFacilityIds = new Set(facilityPlacements.map(p => p.facilityId))
  const availableFacilities = allFacilities.filter(f =>
    !builtFacilityIds.has(f.id) && (
      f.source === 'base' ||
      (f.source === 'wotc' && dlc.wotc)
    )
  )

  // ── Power budget ─────────────────────────────────────────────────────────
  const startingPower = 12
  const totalConsumption = facilityPlacements.reduce((acc, p) => {
    const f = allFacilities.find(f => f.id === p.facilityId)
    return acc + (f ? f.powerCost : 0)
  }, 0)
  const powerMargin = startingPower - totalConsumption
  const warnings: string[] = []

  if (powerMargin <= 0) {
    warnings.push(`⚠ POWER BROWNOUT: using ${totalConsumption}/${startingPower} power. Build a Power Relay immediately — all facilities stop working at 0 power.`)
  } else if (powerMargin < C.minPowerMarginWarning) {
    warnings.push(`⚠ Low power margin (${powerMargin} remaining). Build a Power Relay before your next facility or you\'ll brownout.`)
  }

  // ── Contact tracking ─────────────────────────────────────────────────────
  const commsBuilt = facilityPlacements.filter(p => p.facilityId === 'resistance_comms').length
  const contactsAvailable = 1 + commsBuilt * 2 // base 1 + 2 per comms
  const contactsRemaining = contactsAvailable
  if (commsBuilt === 0 && missionCount >= 3) {
    warnings.push('⚠ No Resistance Comms built — you\'re approaching your contact cap. Build Comms to unlock new regions and supply drops.')
  }

  // ── WotC: Training Center replaces AWC ──────────────────────────────────
  const gtsBuilt = builtFacilityIds.has('guerrilla_tactics') || builtFacilityIds.has('training_center')
  if (!gtsBuilt) {
    warnings.push('⚠ No GTS / Training Center built — you cannot upgrade squad size beyond 4. This is the highest-leverage early build.')
  }

  // ── Shadow Chamber timing ────────────────────────────────────────────────
  const shadowBuilt = builtFacilityIds.has('shadow_chamber')
  if (!shadowBuilt && doom === 'high' || !shadowBuilt && doom === 'critical') {
    warnings.push('⚠ No Shadow Chamber — you cannot research story items (Blacksite Vial, Codex Brain) to reduce Avatar Project pips. Build this soon.')
  }

  // ── Score and recommend facilities ──────────────────────────────────────
  const recommendations: BaseRecommendation[] = []

  for (const facility of availableFacilities) {
    let score = FACILITY_PRIORITY_BASE[facility.id] ?? 3
    const reasons: string[] = []
    let urgency: BaseRecommendation['urgency'] = 'low'

    // Power relay gets highest urgency if we're near brownout
    if (facility.id === 'power_relay') {
      if (powerMargin < C.minPowerMarginWarning) {
        score += 12
        urgency = 'critical'
        reasons.push(`Power margin is ${powerMargin} — you need this before your next build or facilities will shut down.`)
      } else {
        reasons.push(`+${startingPower - totalConsumption} power remaining. A Power Relay gives you headroom for 2–3 more facilities.`)
      }
    }

    // GTS/Training Center
    if (facility.id === 'guerrilla_tactics' || facility.id === 'training_center') {
      if (!gtsBuilt) {
        score += 10
        urgency = 'critical'
        reasons.push('Squad size upgrades (5-soldier, 6-soldier) are the single highest force-multiplier in the game. Build first.')
      }
    }

    // Resistance Comms
    if (facility.id === 'resistance_comms') {
      if (commsBuilt === 0 && missionCount >= 3) {
        score += 8
        urgency = 'high'
        reasons.push('You need more contacts to access additional regions. Each Comms opens 2 more contact slots → more supply missions → more resources.')
      }
    }

    // Shadow Chamber: urgent under doom pressure
    if (facility.id === 'shadow_chamber') {
      if (doom === 'high' || doom === 'critical') {
        score += 9
        urgency = 'critical'
        reasons.push('Required to research the Avatar-reducing story items (Blacksite Vial, Codex Brain). Under doom pressure, this is critical.')
      } else if (doom === 'medium') {
        score += 5
        urgency = 'medium'
        reasons.push('Build the Shadow Chamber before doom climbs — it unlocks the story missions that reduce Avatar pips.')
      }
    }

    // Proving Grounds: scales with AH DLC
    if (facility.id === 'proving_grounds') {
      if (dlc.alienHunters) {
        score += 3
        reasons.push('Alien Hunters: Proving Grounds builds the Ruler Reaction items (Hunter\'s Axe, Alien Ruler armor after autopsies).')
      }
      reasons.push('Experimental items (EMP grenades, Bluescreen rounds, Mindshield) substantially improve mission outcomes.')
    }

    // WotC Infirmary
    if (facility.id === 'infirmary' && dlc.wotc) {
      score += 2
      reasons.push('(WotC) Removes negative soldier traits and manages Will recovery. Build after Training Center and Comms.')
    }

    // Workshop adjacency hint
    if (facility.id === 'workshop') {
      const powerRelayBuilt = builtFacilityIds.has('power_relay')
      const suggestedCell = findWorkshopCell(facilityPlacements)
      reasons.push('Place adjacent to power-hungry facilities — Gremlins provide free engineer slots to neighbours.')
      if (suggestedCell) {
        recommendations.push({
          facilityId: facility.id,
          facilityName: facility.name,
          score,
          reasons,
          suggestedCell,
          urgency,
        })
        continue
      }
    }

    // Suggest placing Power Relay on exposed coil cells
    if (facility.id === 'power_relay') {
      const suggestedCell = findExposedCoilCell(facilityPlacements)
      recommendations.push({
        facilityId: facility.id,
        facilityName: facility.name,
        score,
        reasons: [...reasons, suggestedCell ? `Place at column ${suggestedCell.col + 1}, row ${suggestedCell.row + 1} for the exposed power coil bonus (+2 extra power).` : ''],
        suggestedCell: suggestedCell ?? undefined,
        urgency,
      })
      continue
    }

    recommendations.push({ facilityId: facility.id, facilityName: facility.name, score, reasons, urgency })
  }

  recommendations.sort((a, b) => b.score - a.score)

  // ── Staffing advice ──────────────────────────────────────────────────────
  const staffing: StaffingRecommendation[] = []

  if (engineerCount !== undefined && engineerCount > 0) {
    if (!builtFacilityIds.has('proving_grounds') || !builtFacilityIds.has('workshop')) {
      staffing.push({
        role: 'engineer',
        bestFacility: 'Proving Grounds / Workshop',
        reason: 'Assign engineers to Proving Grounds for experimental items, or Workshop for Gremlin adjacency multiplier.',
      })
    } else {
      staffing.push({
        role: 'engineer',
        bestFacility: 'Avenger (general)',
        reason: 'With Workshop and Proving Grounds staffed, additional engineers reduce build times on active construction.',
      })
    }
  }

  if (scientistCount !== undefined && scientistCount > 0) {
    if (builtFacilityIds.has('shadow_chamber') && doom === 'high' || doom === 'critical') {
      staffing.push({
        role: 'scientist',
        bestFacility: 'Shadow Chamber',
        reason: 'Under doom pressure, assign scientists to the Shadow Chamber to rush story research (Blacksite Vial, Codex Brain).',
      })
    } else {
      staffing.push({
        role: 'scientist',
        bestFacility: 'Research Lab',
        reason: 'Assign to the active research project — each scientist reduces research time proportionally.',
      })
    }
  }

  return {
    nextBuilds: recommendations.slice(0, 4),
    warnings,
    staffing,
    powerMargin,
    contactsRemaining,
  }
}

function findExposedCoilCell(placements: CampaignSnapshot['campaign']['facilityPlacements']): { col: number; row: number } | null {
  const occupied = new Set(placements.map(p => `${p.col}-${p.row}`))
  return EXPOSED_COIL_CELLS.find(c => !occupied.has(`${c.col}-${c.row}`)) ?? null
}

function findWorkshopCell(placements: CampaignSnapshot['campaign']['facilityPlacements']): { col: number; row: number } | null {
  // Find a cell adjacent to a power-consuming facility
  const occupied = new Set(placements.map(p => `${p.col}-${p.row}`))
  const powerFacilities = new Set(['psi_lab', 'shadow_chamber', 'guerrilla_tactics', 'training_center'])
  for (const p of placements) {
    if (!powerFacilities.has(p.facilityId)) continue
    const neighbours = [
      { col: p.col - 1, row: p.row }, { col: p.col + 1, row: p.row },
      { col: p.col, row: p.row - 1 }, { col: p.col, row: p.row + 1 },
    ].filter(n => n.col >= 0 && n.col < 4 && n.row >= 0 && n.row < 3)
    const free = neighbours.find(n => !occupied.has(`${n.col}-${n.row}`))
    if (free) return free
  }
  return null
}
