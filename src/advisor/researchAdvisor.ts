import { ADVISOR_CONFIG } from './config'
import type { ResearchRecommendation, CampaignSnapshot } from './types'
import type { ResearchProject } from '../data/types'
import rawResearch from '../data/research.json'

const allResearch = rawResearch as ResearchProject[]
const C = ADVISOR_CONFIG.RESEARCH_ADVISOR

// The canonical "safe" research backbone — deviations are flagged with a reason
const RESEARCH_BACKBONE = [
  'modular_weapons',
  'alien_biotech',
  'advent_trooper_autopsy',
  'magnetic_weapons',
  'plated_armor',
  'muton_autopsy',
  'elerium',
  'plasma_rifle',
  'powered_armor',
]

function gameStage(missionCount: number): 'early' | 'mid' | 'late' {
  if (missionCount < C.earlyGameThreshold) return 'early'
  if (missionCount < C.midGameThreshold) return 'mid'
  return 'late'
}

function getCurrentGearTier(completed: string[]): 'conventional' | 'magnetic' | 'beam' {
  if (completed.includes('plasma_rifle')) return 'beam'
  if (completed.includes('magnetic_weapons')) return 'magnetic'
  return 'conventional'
}

function isAvailable(project: ResearchProject, completed: string[]): boolean {
  return project.prerequisites.every(p => completed.includes(p))
}

export function recommendResearch(
  snapshot: CampaignSnapshot,
  missionCount: number,
  scientistCount?: number,
): ResearchRecommendation[] {
  const { campaign, soldiers } = snapshot
  const { completedResearch, dlc, difficulty } = campaign
  const doom = snapshot.doomPressure
  const stage = gameStage(missionCount)
  const gearTier = getCurrentGearTier(completedResearch)

  const soldierClasses = new Set(soldiers.filter(s => s.campaignId === campaign.id).map(s => s.soldierClass))

  const scored: Array<ResearchRecommendation & { rawScore: number }> = []

  const available = allResearch.filter(r =>
    isAvailable(r, completedResearch) &&
    !completedResearch.includes(r.id) &&
    (r.source === 'base' ||
      (r.source === 'wotc' && dlc.wotc) ||
      (r.source === 'alien_hunters' && dlc.alienHunters) ||
      (r.source === 'shens_last_gift' && dlc.shensLastGift) ||
      (r.source === 'tlp' && dlc.wotc && dlc.tacticalLegacyPack))
  )

  for (const r of available) {
    let rawScore = 0
    const reasons: string[] = []
    let urgency: ResearchRecommendation['urgency'] = 'low'

    // ── Backbone priority ──────────────────────────────────────────────
    const backboneIdx = RESEARCH_BACKBONE.indexOf(r.id)
    if (backboneIdx !== -1) {
      rawScore += (RESEARCH_BACKBONE.length - backboneIdx) * 2
      reasons.push(`Core research backbone (priority #${backboneIdx + 1} in standard progression).`)
    }

    // ── Weapon tier upgrade urgency ────────────────────────────────────
    if (r.id === 'magnetic_weapons' && gearTier === 'conventional') {
      rawScore += 15
      urgency = 'high'
      reasons.push('Magnetic weapons deal ~50% more damage — the single biggest early power spike. Every mission fought with conventional weapons is harder than it needs to be.')
    }
    if (r.id === 'plasma_rifle' && gearTier === 'magnetic') {
      rawScore += 12
      urgency = 'high'
      reasons.push('Beam weapons are required for Chosen Strongholds, Alien Rulers, and the Final Mission. Get here as fast as you can.')
    }

    // ── Armor upgrade ──────────────────────────────────────────────────
    if (r.id === 'plated_armor' && gearTier !== 'beam') {
      rawScore += 10
      urgency = 'medium'
      reasons.push('Plated Armor reduces casualties significantly. EXO/WAR suits also give utility (grenade launcher, flamethrower).')
    }

    // ── Shadow Chamber timing ──────────────────────────────────────────
    if (r.id === 'blacksite_data' || r.id === 'codex_brain' || r.id === 'alien_encryption') {
      if (doom === 'high' || doom === 'critical') {
        rawScore += 14
        urgency = 'critical'
        reasons.push('Story research reduces Avatar Project progress. Under high doom, this is your most important research chain.')
      } else if (doom === 'medium') {
        rawScore += 8
        urgency = 'high'
        reasons.push('Progress the story chain to unlock Avatar-reducing missions before doom climbs further.')
      }
    }

    // ── Psi Lab path (if Psi Op in roster or planned) ──────────────────
    if ((soldierClasses.has('psi_operative') || stage !== 'early') && r.id === 'psionics') {
      rawScore += 8
      urgency = 'medium'
      reasons.push('You have a Psi Operative (or should get one). Stasis and Domination win fights nothing else can.')
    }
    if (r.id === 'psi_gate' && !completedResearch.includes('psi_gate')) {
      rawScore += 5
      reasons.push('Required path to unlock Psi Lab and the Psi Operative class.')
    }

    // ── SPARK research (if SPARK in roster) ───────────────────────────
    if (dlc.shensLastGift && soldierClasses.has('spark')) {
      if (r.id === 'powered_armor') {
        rawScore += 6
        reasons.push('SPARK in your roster benefits from powered-tier research upgrades.')
      }
    }

    // ── Alien Hunters rulers autopsy chain ────────────────────────────
    if (dlc.alienHunters) {
      if (r.id === 'ruler_autopsy_viper' || r.id === 'ruler_autopsy_berserker' || r.id === 'ruler_autopsy_archon') {
        rawScore += 7
        urgency = 'medium'
        reasons.push('Ruler armor is among the best in the game. Research after defeating the corresponding Ruler.')
      }
    }

    // ── Elerium gating ─────────────────────────────────────────────────
    if (r.id === 'elerium') {
      rawScore += 9
      urgency = 'medium'
      reasons.push('Elerium unlocks Powered Armor and gates Plasma research. Research this the moment it\'s available.')
    }

    // ── Stage-based adjustments ────────────────────────────────────────
    if (stage === 'late' && r.id === 'gatekeeper_autopsy') {
      rawScore += 6
      reasons.push('Late game — Gatekeepers and Sectopods are common. Bluescreen rounds from this autopsy counter both.')
    }

    // Opportunity cost
    const days = r.days[difficulty]
    const daysWithScientists = scientistCount ? Math.max(1, Math.round(days / (1 + scientistCount * 0.2))) : days
    const opportunityCost = buildOpportunityCost(r, completedResearch, allResearch)

    scored.push({
      researchId: r.id,
      researchName: r.name,
      score: rawScore,
      rawScore,
      reasons,
      estimatedDays: daysWithScientists,
      opportunityCost,
      urgency,
    })
  }

  // Sort by score descending, return top 5
  return scored
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 5)
    .map(({ rawScore: _r, ...rest }) => rest)
}

function buildOpportunityCost(
  project: ResearchProject,
  completed: string[],
  all: ResearchProject[],
): string {
  // Find what's immediately blocked by NOT doing this research
  const unlockedByThis = all.filter(r =>
    r.prerequisites.includes(project.id) &&
    !completed.includes(r.id) &&
    r.prerequisites.every(p => p === project.id || completed.includes(p))
  )
  if (unlockedByThis.length === 0) return 'No immediate unlock blockers.'
  const names = unlockedByThis.slice(0, 3).map(r => r.name).join(', ')
  return `Unlocks: ${names}${unlockedByThis.length > 3 ? ` +${unlockedByThis.length - 3} more` : ''}`
}
