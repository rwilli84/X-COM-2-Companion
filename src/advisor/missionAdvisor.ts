import { ADVISOR_CONFIG } from './config'
import type { MissionOption, MissionOptionScore, DoomPressure, CampaignSnapshot } from './types'

const C = ADVISOR_CONFIG.MISSION_ADVISOR

export function computeDoomPressure(avatarPips: number): DoomPressure {
  const { DOOM_PRESSURE } = ADVISOR_CONFIG
  if (avatarPips > DOOM_PRESSURE.HIGH_MAX) return 'critical'
  if (avatarPips > DOOM_PRESSURE.MEDIUM_MAX) return 'high'
  if (avatarPips > DOOM_PRESSURE.LOW_MAX) return 'medium'
  return 'low'
}

export function rankMissionOptions(
  options: MissionOption[],
  snapshot: CampaignSnapshot,
  missionCount: number,
): MissionOptionScore[] {
  const { campaign } = snapshot
  const doom = snapshot.doomPressure
  const earlyGame = missionCount <= C.engineerMissionThreshold

  return options
    .map((opt): MissionOptionScore => {
      let score = 0
      const reasons: string[] = []
      const warnings: string[] = []

      // ── Avatar-reduction priority ──────────────────────────────────────
      if (opt.primaryReward === 'avatar_reduction' || opt.secondaryReward === 'avatar_reduction') {
        if (doom === 'critical') {
          score += C.avatarReductionBonusCritical
          reasons.push(`+${C.avatarReductionBonusCritical} Avatar reduction is critical right now — you need this pip off the board immediately.`)
        } else if (doom === 'high') {
          score += C.avatarReductionBonusHigh
          reasons.push(`+${C.avatarReductionBonusHigh} Avatar Project is at HIGH pressure — pip reduction is the highest-value action.`)
        } else {
          score += 3
          reasons.push('+3 Reducing Avatar pips always has long-term value.')
        }
      }

      // ── Facility assault (explicit avatar reduction source) ────────────
      if (opt.missionType === 'facility_assault') {
        if (doom === 'critical' || doom === 'high') {
          score += 6
          reasons.push('+6 Assaulting a facility directly reduces Avatar pips and removes a doom-accelerating structure.')
        } else {
          score += 2
          reasons.push('+2 Facility assaults are always worth doing when feasible.')
        }
      }

      // ── Dark Event counter priority ────────────────────────────────────
      if (opt.countersActiveDarkEvent) {
        score += C.deCounterBonus
        reasons.push(`+${C.deCounterBonus} This mission counters an active Dark Event — removing persistent negative effects is high value.`)

        // Compound DE types get extra priority
        const compoundTypes: Array<MissionOption['primaryReward']> = ['supplies', 'engineers', 'contacts']
        if (compoundTypes.includes(opt.primaryReward)) {
          score += C.compoundDeBonus
          reasons.push(`+${C.compoundDeBonus} The Dark Event being countered affects income — compound penalty if left active.`)
        }
      }

      // ── Resource-type priority ─────────────────────────────────────────
      if (opt.primaryReward === 'engineers' && earlyGame) {
        score += C.engineerBonusEarlyGame
        reasons.push(`+${C.engineerBonusEarlyGame} Engineers multiply Avenger build speed early — each one enables more facilities faster.`)
      } else if (opt.primaryReward === 'scientists' && !earlyGame) {
        score += C.scientistBonusLateGame
        reasons.push(`+${C.scientistBonusLateGame} Later in the campaign, research speed matters more — scientists accelerate plasma weapons and story missions.`)
      } else if (opt.primaryReward === 'contacts') {
        if (snapshot.campaign.avatarPips <= 4) {
          score += 3
          reasons.push('+3 Expanding contacts opens more supply drops and mission options — valuable under low doom pressure.')
        }
      } else if (opt.primaryReward === 'intel') {
        score += 2
        reasons.push('+2 Intel enables covert actions, resistance orders, and Guerrilla Op choices.')
      } else if (opt.primaryReward === 'supplies') {
        score += 2
        reasons.push('+2 Supplies fund the next tier of equipment and construction.')
      } else if (opt.primaryReward === 'soldier_rescue') {
        score += 10
        reasons.push('+10 Rescuing a captured soldier prevents their permanent loss — always urgent.')
      } else if (opt.primaryReward === 'chosen_knowledge') {
        // High value when a Chosen is close to max knowledge
        score += 4
        reasons.push('+4 Chosen knowledge reduces their strength each encounter and enables the Stronghold mission.')
      } else if (opt.primaryReward === 'resistance_ring') {
        score += 3
        reasons.push('+3 Upgrading the Resistance Ring unlocks better covert actions.')
      }

      // ── Timer pressure penalty ─────────────────────────────────────────
      if (opt.daysRemaining !== undefined && opt.daysRemaining <= 3) {
        score += 5
        reasons.push(`+5 Only ${opt.daysRemaining} day(s) left on the timer — this opportunity disappears soon.`)
      }

      // ── Chosen territory warning ───────────────────────────────────────
      if (opt.chosenTerritory) {
        score -= 2
        warnings.push('This mission is in a Chosen\'s territory — expect an ambush. Ensure your squad can handle both the mission AND the Chosen.')
      }

      // ── Doom pressure context adjustments ─────────────────────────────
      if (doom === 'critical') {
        // Under critical doom, only avatar-reducing actions and soldier rescue compete
        if (opt.primaryReward !== 'avatar_reduction' && opt.missionType !== 'facility_assault' && opt.primaryReward !== 'soldier_rescue') {
          score -= 4
          warnings.push('CRITICAL doom pressure — non-avatar-reducing missions should generally wait. Prioritise facility assaults.')
        }
      }

      return { option: opt, score, rank: 0, reasons, warnings }
    })
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }))
}

export function generateDoomContextAdvice(snapshot: CampaignSnapshot, missionCount: number): string[] {
  const { campaign } = snapshot
  const doom = snapshot.doomPressure
  const earlyGame = missionCount <= C.engineerMissionThreshold
  const advice: string[] = []

  if (doom === 'critical') {
    advice.push('CRITICAL: Assault an alien facility this mission cycle or the Avatar Project completes.')
    advice.push('Every non-facility action is secondary. If no facility is available, scan for one immediately.')
  } else if (doom === 'high') {
    advice.push(`HIGH pressure (${campaign.avatarPips}/12 pips): Plan a facility assault within the next 2 cycles.`)
    advice.push('Prioritise missions that counter Dark Events accelerating the Avatar Project.')
  } else if (doom === 'medium') {
    advice.push('MEDIUM pressure: Keep facilities and Dark Events on your radar. You have a turn or two.')
  } else {
    advice.push('LOW pressure: Safe to focus on expansion, research, and equipment for now.')
  }

  if (earlyGame) {
    advice.push('Early campaign: prioritise engineers and contact expansion over raw supplies.')
  } else {
    advice.push('Mid/late campaign: research speed and plasma weapons are now the primary bottleneck.')
  }

  return advice
}
