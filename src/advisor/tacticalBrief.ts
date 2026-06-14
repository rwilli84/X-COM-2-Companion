import { ABILITY_TAGS } from './abilityTags'
import type { SquadResult } from './soldierScoring'
import type { MissionProfile, CampaignSnapshot, CapabilityTag } from './types'

export interface TacticalTip {
  phase: 'setup' | 'opening' | 'mid' | 'closing'
  text: string
  priority: 'critical' | 'high' | 'normal'
}

/**
 * Generates concrete tactical tips based on the recommended squad's
 * class makeup, abilities, and the mission profile's objectives.
 */
export function generateTacticalBrief(
  result: SquadResult,
  profile: MissionProfile,
  snapshot: CampaignSnapshot,
): TacticalTip[] {
  const tips: TacticalTip[] = []
  const squad = result.recommended.filter(s => !s.excluded)
  if (squad.length === 0) return tips

  const classes = new Set(squad.map(s => s.soldier.soldierClass))
  const allAbilities = new Set(squad.flatMap(s => [...s.soldier.takenAbilities, ...s.soldier.plannedAbilities]))
  const { dlc } = snapshot.campaign

  // Helper: does the squad cover a capability tag (at least one ability maps to it)?
  const squadHasTag = (tag: CapabilityTag) =>
    squad.some(s =>
      [...s.soldier.takenAbilities, ...s.soldier.plannedAbilities]
        .some(id => ABILITY_TAGS[id]?.includes(tag))
    )

  const hasClass = (c: string) => classes.has(c as never)

  // ── Mission-specific critical tips ─────────────────────────────────────────

  if (profile.id === 'alien_ruler_encounter') {
    const hasStasis = squadHasTag('crowdControl') &&
      [...allAbilities].some(id => ['psi_stasis', 'spec_haywire', 'spec_tyrant'].includes(id))

    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'The Ruler reacts after every XCOM action — not just turns. Get into position before activating it. Once engaged, every soldier action triggers a Ruler Reaction.',
    })
    if (hasStasis) {
      tips.push({
        phase: 'opening',
        priority: 'critical',
        text: 'You have a stasis/haywire ability — use it the moment the Ruler is revealed. This cancels its reactions for that turn and lets you pour in damage safely.',
      })
    } else {
      tips.push({
        phase: 'setup',
        priority: 'critical',
        text: 'No stasis in squad. Minimize actions per turn — every extra action is another Ruler Reaction. Consider equipping Ruler Reaction items (Frost Bomb, Hunter\'s Axe) from the Proving Grounds.',
      })
    }
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Spread your squad across multiple cover tiles — AoE abilities (Freeze Breath, Shockwave) punish clustering. Never group within blast radius of each other.',
    })
    tips.push({
      phase: 'closing',
      priority: 'high',
      text: 'Commit fully — each escape by the Ruler makes future encounters harder. If you can kill it this fight, do so. Retreat only if multiple soldiers are in danger of dying.',
    })
  }

  if (profile.id === 'retaliation') {
    tips.push({
      phase: 'setup',
      priority: 'critical',
      text: 'Identify civilian clusters immediately. Split into two fire teams and send one toward each cluster — ADVENT prioritises them over your soldiers.',
    })
    if (hasClass('ranger') || squadHasTag('mobility')) {
      tips.push({
        phase: 'opening',
        priority: 'high',
        text: 'Use your high-mobility soldiers to dash ahead of ADVENT waves and intercept before they reach civilians. Don\'t wait for perfect shots — positioning wins retaliations.',
      })
    }
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'If Chryssalids appear, prioritise them absolutely — a single infected civilian spawns more. Don\'t let them near any civilian or corpse.',
    })
    if (hasClass('grenadier') || squadHasTag('aoe')) {
      tips.push({
        phase: 'mid',
        priority: 'normal',
        text: 'Your AoE is valuable here for clearing ADVENT clusters approaching civilians, but save grenades if you spot Chryssalids — you may need targeted fire.',
      })
    }
  }

  if (profile.id === 'guerrilla_op_timed') {
    tips.push({
      phase: 'setup',
      priority: 'critical',
      text: 'Count turns before moving. Know how many turns you have and how many you need — rushing into fights wastes turns you don\'t have.',
    })
    tips.push({
      phase: 'opening',
      priority: 'high',
      text: 'Skip pods that aren\'t blocking the objective path. You don\'t need to kill everything — just reach the objective and extract.',
    })
    if (hasClass('ranger') || squadHasTag('actionEconomy')) {
      tips.push({
        phase: 'opening',
        priority: 'high',
        text: 'Run-and-Gun, Implacable, or Skirmisher multi-actions let soldiers dash to the objective and still act. Lead with these soldiers to compress the timeline.',
      })
    }
    if (hasClass('skirmisher')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Skirmisher gets multiple actions per turn — on timed missions this is extremely efficient. Use Reckoning to clear a pod AND keep moving in the same turn.',
      })
    }
  }

  if (profile.id === 'facility_assault') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'Advance room by room — never open sightlines into two separate rooms at once. Pulling two pods simultaneously in corridor maps is how squads wipe.',
    })
    if (hasClass('grenadier') || squadHasTag('armorShred')) {
      tips.push({
        phase: 'mid',
        priority: 'critical',
        text: 'Lead every armored engagement with armor shred — Grenadier Shredder or Rupture rounds should fire FIRST, then everyone else shoots. 1 armor shred = ~2 damage per shot for the whole squad.',
      })
    }
    if (hasClass('specialist')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Hack available targets — turrets and MECs can be disabled or turned with a Specialist\'s Gremlin. A hacked Sectopod changes the fight entirely.',
      })
    }
    tips.push({
      phase: 'closing',
      priority: 'high',
      text: 'Once the facility objective is reached, complete it immediately — reinforcements escalate the longer you stay. Don\'t linger to farm kills.',
    })
  }

  if (profile.id === 'chosen_stronghold') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'The Chosen has enhanced health and abilities that ramp during the fight. Commit high-damage turns immediately when you have LoS — don\'t let it regenerate between encounters.',
    })
    if (result.bondPairsInSquad.length > 0) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: `You have bond pairs active: ${result.bondPairsInSquad.map(b => `${b.s1Name}+${b.s2Name}`).join(', ')}. Save bond abilities for the Chosen phase rather than spending them on regular troops.`,
      })
    }
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Chosen soldiers (their faction troops) will reinforce. Take them down quickly before they flank — they have better abilities than standard ADVENT.',
    })
    if (hasClass('psi_operative')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Psi Operative\'s Stasis can briefly neutralise the Chosen when it uses a particularly dangerous ability. Hold it as a reaction-counter rather than opening with it.',
      })
    }
  }

  if (profile.id === 'lost_abandoned' || profile.id === 'lost_mission') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'Headshot chains are the core mechanic — any kill that takes exactly 1 HP grants a free action. Line up shots on weakened Lost (often 1–3 HP) to chain multiple free kills per turn.',
    })
    tips.push({
      phase: 'setup',
      priority: 'critical',
      text: 'Do NOT throw grenades at Lost clusters unless you need cover destroyed. Explosives kill them but grant no free actions — you waste the headshot chain entirely.',
    })
    if (hasClass('reaper')) {
      tips.push({
        phase: 'opening',
        priority: 'high',
        text: 'Reaper\'s Banish fires multiple shots — each one-hit kill gives a free action. This ability alone can clear an entire Lost wave without spending turns.',
      })
    }
    if (profile.id === 'lost_mission') {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Let ADVENT and the Lost fight each other where possible. Hang back until the pod fight resolves, then engage both weakened sides from cover.',
      })
    }
  }

  if (profile.id === 'supply_raid') {
    if (hasClass('specialist')) {
      tips.push({
        phase: 'opening',
        priority: 'critical',
        text: 'Clear the area around each supply crate before hacking — Specialists are vulnerable while interacting. Use overwatch on nearby soldiers while the hack runs.',
      })
    }
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Armored vehicles and MECs are common on supply raids. Save armor-shredding shots for these — they\'re the toughest targets and gate your damage output.',
    })
    tips.push({
      phase: 'closing',
      priority: 'normal',
      text: 'Once all crates are hacked, head to extract rather than hunting remaining units. Reinforcements increase the longer you stay.',
    })
  }

  if (profile.id === 'council_vip_extract') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'Find the VIP immediately and place a soldier adjacent to them — they need escort the whole mission. Don\'t let them wander into ADVENT fire.',
    })
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Suppress or CC enemies that have LoS to the VIP\'s extraction path. You don\'t need to kill everything — just keep the route clear.',
    })
    if (squadHasTag('sustain') || hasClass('specialist')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Keep a Medikit soldier near the VIP at all times. If the VIP is wounded, stabilise immediately — a bleeding VIP will die before reaching extract.',
      })
    }
  }

  if (profile.id === 'council_vip_capture') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'Eliminate the target\'s escorts before going for the capture. A stunned target surrounded by active enemies is impossible to extract safely.',
    })
    if (hasClass('psi_operative') && allAbilities.has('psi_stasis')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Psi Stasis on the target preserves them safely (no escape attempts, no ability use) while you mop up the escort. Use it after clearing to a manageable number.',
      })
    }
  }

  if (profile.id === 'avenger_defense') {
    tips.push({
      phase: 'setup',
      priority: 'critical',
      text: 'Hold the Avenger objective tile above all else. Enemies converge on it — set overwatch positions around it rather than pushing forward into enemy spawn zones.',
    })
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Enemies come in waves from multiple entry points. Position soldiers to cover at least two entry vectors each — flanks are dangerous when waves hit simultaneously.',
    })
    if (hasClass('grenadier') || squadHasTag('aoe')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'AoE is at maximum value here — waves cluster at entry points. Wait for a full pod to enter before throwing grenades/launching launchers for efficient use.',
      })
    }
  }

  if (profile.id === 'network_tower') {
    if (hasClass('sharpshooter')) {
      tips.push({
        phase: 'opening',
        priority: 'high',
        text: 'The tower\'s elevated position gives the Sharpshooter excellent sight lines across most of the map. Move them there early — they can cover the hack and suppress reinforcements.',
      })
    }
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Reinforcements will drop after the hack activates. Set overwatch on at least 2 soldiers before triggering the hack — the drop points are typically the map edges.',
    })
  }

  if (profile.id === 'final_mission') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'No supply caches, no second chances. Every soldier must be in peak condition with maximum gear. Abort and refit if anyone is sub-optimal.',
    })
    if (hasClass('psi_operative')) {
      tips.push({
        phase: 'mid',
        priority: 'critical',
        text: 'Dominate the first Avatar you encounter — a mind-controlled Avatar turns the fight in your favour and prevents it from using Soul Steal or psi attacks against your squad.',
      })
    }
    if (result.bondPairsInSquad.length > 0) {
      tips.push({
        phase: 'closing',
        priority: 'high',
        text: 'Save bond abilities for the Elder encounter. Bond Lv.2/3 abilities that share actions or revive are life-saving in the final room.',
      })
    }
  }

  if (profile.id === 'blacksite') {
    tips.push({
      phase: 'opening',
      priority: 'high',
      text: 'No turn timer — use concealment to pick your engagement points. Scout forward to identify Viper and Sectoid positions before committing.',
    })
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'If a Viper binds one of your soldiers, prioritise killing or CCing it immediately. A bound soldier can\'t act and will die if you leave it for multiple turns.',
    })
    if (hasClass('psi_operative') || squadHasTag('crowdControl')) {
      tips.push({
        phase: 'mid',
        priority: 'high',
        text: 'Sectoid Psionic abilities (Mindspin, Reanimate) punish low-Will soldiers. CC the Sectoid first — a stunned Sectoid drops any mind control it\'s running.',
      })
    }
  }

  if (profile.id === 'psi_gate') {
    tips.push({
      phase: 'opening',
      priority: 'critical',
      text: 'Gatekeepers close their "eye" and regenerate rapidly — kill in a single activation burst or you waste all your actions. Focus fire one Gatekeeper before engaging others.',
    })
    if (hasClass('psi_operative')) {
      tips.push({
        phase: 'mid',
        priority: 'critical',
        text: 'Psi Stasis on a Gatekeeper locks it in closed-form permanently (it can\'t regenerate while Stasised). Use it to take one threat off the board while you kill the others.',
      })
    }
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Avatars will attempt mind control. Spread your squad so a controlled soldier can\'t fire on multiple friendlies in one action. Soldiers with Fortress resist psi.',
    })
  }

  if (profile.id === 'forge') {
    tips.push({
      phase: 'mid',
      priority: 'critical',
      text: 'Codices clone themselves if not killed in one activation. Kill them immediately and fully — use high-aim soldiers with no miss risk. Do not leave a wounded Codex alive.',
    })
    tips.push({
      phase: 'mid',
      priority: 'high',
      text: 'Andromecdon: destroy the suit, then immediately kill the biological pilot before it has a chance to act — the suit explodes when the pilot dies inside it.',
    })
  }

  // ── Class-based general tips (if not already covered by mission-specific) ────

  if (hasClass('reaper') && !['lost_abandoned', 'lost_mission'].includes(profile.id)) {
    tips.push({
      phase: 'setup',
      priority: 'high',
      text: 'Reaper: open each area in concealment. Scout pod positions before your main squad commits — a scouted pod lets you set overwatch ambushes before activating it.',
    })
  }

  if (hasClass('skirmisher') && !['guerrilla_op_timed'].includes(profile.id)) {
    tips.push({
      phase: 'mid',
      priority: 'normal',
      text: 'Skirmisher gets bonus actions from Reckoning and Judgement — use them to act multiple times in one turn. Best used mid-pod when enemies are exposed in the open.',
    })
  }

  if (hasClass('templar')) {
    tips.push({
      phase: 'setup',
      priority: 'normal',
      text: 'Templar builds Focus from kills and melee. Open aggressively to build Focus, then activate Parry before enemy turns for high-probability deflections. Spend Focus on Volt for ranged psi damage when melee isn\'t available.',
    })
  }

  if (hasClass('sharpshooter') && !['network_tower'].includes(profile.id)) {
    tips.push({
      phase: 'setup',
      priority: 'normal',
      text: 'Sharpshooter: claim elevation early and stay there. Long Watch triggers during enemy turns from overwatch — position on high ground before the first activation, not after.',
    })
  }

  if (hasClass('spark') && dlc.shensLastGift) {
    tips.push({
      phase: 'mid',
      priority: 'normal',
      text: 'SPARK is immune to fire, poison, and acid, and doesn\'t get negative traits. Ideal for point positions and absorbing hazardous-environment fire.',
    })
  }

  // ── Bond pair synergy tip ──────────────────────────────────────────────────

  if (result.bondPairsInSquad.length > 0 && !['chosen_stronghold', 'final_mission'].includes(profile.id)) {
    tips.push({
      phase: 'mid',
      priority: 'normal',
      text: `Bond pairs in squad: ${result.bondPairsInSquad.map(b => `${b.s1Name} + ${b.s2Name}`).join('; ')}. Keep bonded soldiers near each other — bond abilities require adjacency or LoS and trigger in emergencies (Lone Wolf, Come At Me).`,
    })
  }

  // ── Gear gap tips ─────────────────────────────────────────────────────────

  const hasBeamOrMagnetic = squad.some(s => s.soldier.weaponTier === 'beam' || s.soldier.weaponTier === 'magnetic')
  if (!hasBeamOrMagnetic && profile.needs.armorShred && profile.needs.armorShred >= 2) {
    tips.push({
      phase: 'setup',
      priority: 'high',
      text: 'Conventional weapons on a heavily armored mission — every armor point cuts damage significantly. Prioritise Magnetic Weapons research before attempting this again if it goes badly.',
    })
  }

  // ── Missing coverage gap tips ──────────────────────────────────────────────

  const profileNeeds = Object.entries(profile.needs) as Array<[CapabilityTag, number]>
  const highNeedsGaps = profileNeeds
    .filter(([tag, weight]) => weight >= 2 && !squadHasTag(tag))
    .map(([tag]) => tag)

  if (highNeedsGaps.length > 0) {
    const gapLabels: Partial<Record<CapabilityTag, string>> = {
      crowdControl: 'crowd control (stun/disorient/suppress)',
      armorShred: 'armor shred',
      hacking: 'hacking (Specialist/Gremlin)',
      sustain: 'healing/sustain',
      mobility: 'mobility/dash-and-act',
      psionics: 'psionic abilities',
      aoe: 'area damage',
      burst: 'burst single-target damage',
    }
    const gapNames = highNeedsGaps.map(g => gapLabels[g] ?? g).join(', ')
    tips.push({
      phase: 'setup',
      priority: 'high',
      text: `Squad gap: this mission strongly needs ${gapNames}, but no logged abilities cover it. Consider locking in a soldier with these capabilities or equipping utility items to compensate.`,
    })
  }

  return tips
}
