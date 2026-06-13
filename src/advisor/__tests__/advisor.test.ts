import { describe, it, expect } from 'vitest'
import { recommendSquad } from '../soldierScoring'
import { computeDoomPressure, rankMissionOptions } from '../missionAdvisor'
import { advisePlan } from '../baseAdvisor'
import { getProfile } from '../missionProfiles'
import type { CampaignSnapshot } from '../types'
import type { Soldier, Campaign, BondPair } from '../../data/types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function baseCampaign(): Campaign {
  return {
    id: 'test-campaign',
    name: 'Test',
    difficulty: 'veteran',
    dlc: { wotc: false, alienHunters: false, shensLastGift: false, tacticalLegacyPack: false },
    avatarPips: 0,
    avatarLog: [],
    activeDarkEvents: [],
    facilityPlacements: [],
    chosenData: [],
    covertActions: [],
    completedResearch: [],
    pinnedResearchPaths: [],
    createdAt: 0,
    updatedAt: 0,
  }
}

function soldier(overrides: Partial<Soldier> & { id: string; soldierClass: Soldier['soldierClass'] }): Soldier {
  return {
    campaignId: 'test-campaign',
    nickname: overrides.id,
    rank: 'sergeant',
    status: 'ready',
    plannedAbilities: [],
    takenAbilities: [],
    weaponTier: 'conventional',
    armorTier: 'none',
    loadoutNotes: '',
    killCount: 0,
    missionCount: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

function snapshot(campaign: Campaign, soldiers: Soldier[], bonds: BondPair[] = []): CampaignSnapshot {
  return {
    campaign,
    soldiers,
    missions: [],
    bonds,
    doomPressure: computeDoomPressure(campaign.avatarPips),
  }
}

// ─── Test 1: Timed op favours mobile soldiers ─────────────────────────────────

describe('Squad Recommendation — Timed Op', () => {
  it('picks high-mobility soldiers over slow ones for a timed guerrilla op', () => {
    const campaign = baseCampaign()
    const mobile = soldier({
      id: 'mobile-ranger',
      soldierClass: 'ranger',
      rank: 'captain',
      takenAbilities: ['ranger_run_and_gun', 'ranger_implacable', 'ranger_shadowstep'],
    })
    const slowGrenadier = soldier({
      id: 'slow-gren',
      soldierClass: 'grenadier',
      rank: 'squaddie',
      takenAbilities: [],
    })
    const snap = snapshot(campaign, [mobile, slowGrenadier])
    const profile = getProfile('guerrilla_op_timed')!
    const result = recommendSquad({ profile, snapshot: snap, squadSize: 2 })

    // Mobile ranger should score higher (has mobility/actionEconomy abilities matching the profile)
    expect(result.recommended[0].soldier.id).toBe('mobile-ranger')
    expect(result.recommended[0].score).toBeGreaterThan(result.recommended[1]?.score ?? -1)
  })

  it('excludes wounded soldiers from squad', () => {
    const campaign = baseCampaign()
    const wounded = soldier({ id: 'wounded', soldierClass: 'ranger', status: 'wounded' })
    const ready = soldier({ id: 'ready', soldierClass: 'ranger', status: 'ready' })
    const snap = snapshot(campaign, [wounded, ready])
    const profile = getProfile('guerrilla_op_timed')!
    const result = recommendSquad({ profile, snapshot: snap, squadSize: 2 })

    expect(result.recommended.every(s => s.soldier.id !== 'wounded')).toBe(true)
    const woundedScore = result.recommended.find(s => s.soldier.id === 'wounded')
    expect(woundedScore).toBeUndefined()
  })
})

// ─── Test 2: Alien Ruler encounter — warns about missing stasis ───────────────

describe('Squad Recommendation — Alien Ruler', () => {
  it('warns when no stasis or haywire ability is present in the squad', () => {
    const campaign = { ...baseCampaign(), dlc: { ...baseCampaign().dlc, alienHunters: true } }
    const ranger = soldier({ id: 'r1', soldierClass: 'ranger', rank: 'colonel', takenAbilities: ['ranger_rapid_fire', 'ranger_bladestorm'] })
    const grenadier = soldier({ id: 'g1', soldierClass: 'grenadier', rank: 'colonel', takenAbilities: ['gren_shredder', 'gren_saturation_fire'] })
    const snap = snapshot(campaign, [ranger, grenadier])
    const profile = getProfile('alien_ruler_encounter')!
    const result = recommendSquad({ profile, snapshot: snap, squadSize: 2 })

    expect(result.squadWarnings.some(w => w.includes('Stasis') || w.includes('stasis'))).toBe(true)
  })

  it('does NOT warn when a soldier has Stasis', () => {
    const campaign = { ...baseCampaign(), dlc: { ...baseCampaign().dlc, alienHunters: true } }
    const psiOp = soldier({ id: 'psi', soldierClass: 'psi_operative', rank: 'major', takenAbilities: ['psi_stasis'] })
    const ranger = soldier({ id: 'r1', soldierClass: 'ranger', rank: 'colonel', takenAbilities: ['ranger_rapid_fire'] })
    const snap = snapshot(campaign, [psiOp, ranger])
    const profile = getProfile('alien_ruler_encounter')!
    const result = recommendSquad({ profile, snapshot: snap, squadSize: 2 })

    // Stasis warning should be absent
    expect(result.squadWarnings.every(w => !w.includes('No Stasis'))).toBe(true)
  })
})

// ─── Test 3: Doom pressure flips mission ranking ──────────────────────────────

describe('Mission Option Ranking', () => {
  it('ranks facility assault above supply raid under CRITICAL doom pressure', () => {
    const campaign = { ...baseCampaign(), avatarPips: 11 }
    const snap = snapshot(campaign, [])

    const facilityAssault = {
      id: 'fa', label: 'Facility Assault', missionType: 'facility_assault' as const,
      primaryReward: 'avatar_reduction' as const, countersActiveDarkEvent: false, daysRemaining: 5,
    }
    const supplyRaid = {
      id: 'sr', label: 'Supply Raid', missionType: 'supply_raid' as const,
      primaryReward: 'supplies' as const, countersActiveDarkEvent: false, daysRemaining: 5,
    }
    const ranked = rankMissionOptions([supplyRaid, facilityAssault], snap, 10)

    expect(ranked[0].option.id).toBe('fa')
  })

  it('ranks supply raid above facility assault under LOW doom pressure', () => {
    const campaign = { ...baseCampaign(), avatarPips: 2 }
    const snap = snapshot(campaign, [])

    const facilityAssault = {
      id: 'fa', label: 'Facility Assault', missionType: 'facility_assault' as const,
      primaryReward: 'avatar_reduction' as const, countersActiveDarkEvent: false,
    }
    const supplyRaidWithTimer = {
      id: 'sr', label: 'Supply Raid (urgent)', missionType: 'supply_raid' as const,
      primaryReward: 'engineers' as const,  // engineers have high early-game value
      countersActiveDarkEvent: true,  // plus a dark event counter
      daysRemaining: 2,               // plus expiring soon
    }
    const ranked = rankMissionOptions([facilityAssault, supplyRaidWithTimer], snap, 3)

    // Under low doom, engineer + dark event counter + timer should beat a standard facility assault
    expect(ranked[0].option.id).toBe('sr')
  })

  it('computes doom pressure correctly', () => {
    expect(computeDoomPressure(0)).toBe('low')
    expect(computeDoomPressure(3)).toBe('low')
    expect(computeDoomPressure(4)).toBe('medium')
    expect(computeDoomPressure(6)).toBe('medium')
    expect(computeDoomPressure(7)).toBe('high')
    expect(computeDoomPressure(9)).toBe('high')
    expect(computeDoomPressure(10)).toBe('critical')
    expect(computeDoomPressure(12)).toBe('critical')
  })
})

// ─── Test 4: Base planner — contact cap warning ───────────────────────────────

describe('Base Advisor', () => {
  it('warns about missing Resistance Comms when mission count is high', () => {
    const campaign = { ...baseCampaign(), facilityPlacements: [] }
    const snap = snapshot(campaign, [])

    const plan = advisePlan(snap, 5)  // 5 missions — past early game

    expect(plan.warnings.some(w => w.includes('Comms') || w.includes('contact'))).toBe(true)
  })

  it('warns about power brownout when consumption exceeds supply', () => {
    const campaign = {
      ...baseCampaign(),
      facilityPlacements: [
        { col: 0, row: 0, facilityId: 'psi_lab' },        // -5 power
        { col: 1, row: 0, facilityId: 'shadow_chamber' }, // -5 power
        { col: 2, row: 0, facilityId: 'guerrilla_tactics' }, // -3 power
      ],
    }
    const snap = snapshot(campaign, [])
    const plan = advisePlan(snap, 8)

    expect(plan.powerMargin).toBeLessThan(2)
    expect(plan.warnings.some(w => w.toLowerCase().includes('power'))).toBe(true)
  })

  it('recommends GTS as top priority when none is built', () => {
    const campaign = baseCampaign()
    const snap = snapshot(campaign, [])
    const plan = advisePlan(snap, 0)

    const top = plan.nextBuilds[0]
    expect(top.facilityId === 'guerrilla_tactics' || top.facilityId === 'training_center').toBe(true)
  })

  it('recommends Shadow Chamber urgently under high doom pressure', () => {
    const campaign = { ...baseCampaign(), avatarPips: 8 }
    const snap = snapshot(campaign, [])

    const plan = advisePlan(snap, 6)
    const shadowRec = plan.nextBuilds.find(r => r.facilityId === 'shadow_chamber')

    expect(shadowRec).toBeDefined()
    expect(shadowRec!.urgency === 'high' || shadowRec!.urgency === 'critical').toBe(true)
  })
})

// ─── Test 5: WotC bond bonus ──────────────────────────────────────────────────

describe('Bond Bonus (WotC)', () => {
  it('identifies bonded pairs both in the squad', () => {
    const campaign = { ...baseCampaign(), dlc: { ...baseCampaign().dlc, wotc: true } }
    const s1 = soldier({ id: 's1', soldierClass: 'ranger', rank: 'colonel', takenAbilities: ['ranger_rapid_fire'] })
    const s2 = soldier({ id: 's2', soldierClass: 'specialist', rank: 'captain', takenAbilities: ['spec_haywire', 'spec_field_medic'] })
    const bond: BondPair = { id: 'b1', campaignId: 'test-campaign', soldier1Id: 's1', soldier2Id: 's2', level: 2, cohesion: 50 }
    const snap = snapshot(campaign, [s1, s2], [bond])

    const profile = getProfile('guerrilla_op_standard')!
    const result = recommendSquad({ profile, snapshot: snap, squadSize: 2 })

    expect(result.bondPairsInSquad.length).toBe(1)
    expect(result.bondPairsInSquad[0].note).toContain('Bond')
  })
})
