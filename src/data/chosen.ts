// Static definitions for the three Chosen (WotC). All data here is read-only.

export type ChosenType = 'assassin' | 'hunter' | 'warlock'

export type ChosenStrengthId =
  | 'dodge'
  | 'armor'
  | 'regen'
  | 'damage_immunity'
  | 'shadowstep'
  | 'teleport'
  | 'heavy_weapon'
  | 'deflect'
  | 'parting_silk'
  | 'phasing'
  | 'uncanny'
  | 'reaper_strike'
  | 'soul_steal'
  | 'mark_of_the_coil'
  | 'chain_shot'
  | 'cover_generate'

export type ChosenWeaknessId =
  | 'vulnerable_explosives'
  | 'vulnerable_fire'
  | 'vulnerable_melee'
  | 'vulnerable_psionics'
  | 'vulnerable_shotguns'
  | 'faction_reapers'
  | 'faction_templars'
  | 'faction_skirmishers'
  | 'no_regen_cover'
  | 'vulnerable_suppression'

export interface ChosenStrength {
  id: ChosenStrengthId
  name: string
  description: string
  deploymentNote: string
  shotEffect?: 'dodge' | 'armor' | 'regen' | 'damage_immunity'
  armorValue?: number
  regenValue?: number
  dodgeValue?: number
  damageImmunityPhase?: boolean
  condition?: string
}

export interface ChosenWeakness {
  id: ChosenWeaknessId
  name: string
  description: string
  exploiterNote: string
  scoreBonus?: number
  preferredClasses?: string[]
}

export interface ChosenKnowledgeTierAbility {
  tier: 1 | 2 | 3
  name: string
  description: string
}

export interface ChosenDefinition {
  type: ChosenType
  name: string
  description: string
  baseAbilities: Array<{ name: string; description: string }>
  strengthPool: ChosenStrengthId[]
  weaknessPool: ChosenWeaknessId[]
  knowledgeTierAbilities: ChosenKnowledgeTierAbility[]
}

export const KNOWLEDGE_TIERS: Array<{
  tier: 0 | 1 | 2 | 3
  label: string
  description: string
  strongholdUnlocked: boolean
}> = [
  {
    tier: 0,
    label: 'Uninitiated',
    description: 'No intel gathered. Chosen at base difficulty.',
    strongholdUnlocked: false,
  },
  {
    tier: 1,
    label: 'Acquainted',
    description: 'Limited intel. Chosen gains first ability upgrade.',
    strongholdUnlocked: false,
  },
  {
    tier: 2,
    label: 'Familiar',
    description: 'Stronghold region located. Chosen near full strength.',
    strongholdUnlocked: true,
  },
  {
    tier: 3,
    label: 'Ascendant',
    description: 'Chosen at maximum power. Stronghold assault unlocked.',
    strongholdUnlocked: true,
  },
]

export const CHOSEN_STRENGTHS: Record<ChosenStrengthId, ChosenStrength> = {
  dodge: {
    id: 'dodge',
    name: 'Dodge',
    description: 'This Chosen has a high Dodge stat. Many hits are converted to grazes (half damage).',
    deploymentNote: 'High burst-damage is less effective. Focus multiple soldiers on the same target to overcome graze reduction.',
    shotEffect: 'dodge',
    dodgeValue: 40,
  },
  armor: {
    id: 'armor',
    name: 'Armor',
    description: 'This Chosen has significant armor, reducing all incoming damage by a flat amount.',
    deploymentNote: 'Bring armor-shred: Grenadier (Shredder), Magnetic Weapons Rupture, or Skirmisher Justice.',
    shotEffect: 'armor',
    armorValue: 3,
  },
  regen: {
    id: 'regen',
    name: 'Regeneration',
    description: 'This Chosen recovers HP at the start of each turn. Sustained fights favor the Chosen.',
    deploymentNote: 'Kill this Chosen in as few turns as possible. Burst damage and focus fire are essential.',
    shotEffect: 'regen',
    regenValue: 3,
  },
  damage_immunity: {
    id: 'damage_immunity',
    name: 'Damage Immunity',
    description: 'This Chosen phases in and out of immunity. All damage is blocked during the immune phase.',
    deploymentNote: 'Wait out the immunity phase before committing your best abilities. Free actions can still chip.',
    shotEffect: 'damage_immunity',
    damageImmunityPhase: true,
    condition: 'Active for the first action of each Chosen turn — breaks when the Chosen attacks',
  },
  shadowstep: {
    id: 'shadowstep',
    name: 'Shadowstep',
    description: 'This Chosen ignores overwatch fire when moving.',
    deploymentNote: 'Overwatches will not fire on this Chosen. Use active abilities and reaction fire instead.',
  },
  teleport: {
    id: 'teleport',
    name: 'Teleport',
    description: 'This Chosen can teleport anywhere on the map, making positional lockdown impossible.',
    deploymentNote: 'Do not invest turns in positional setups. Keep squad mobile and react to its new location.',
  },
  heavy_weapon: {
    id: 'heavy_weapon',
    name: 'Heavy Weapon',
    description: 'This Chosen wields a heavy weapon capable of area damage.',
    deploymentNote: 'Keep soldiers spread out. Clustered squads will take mass casualties from area fire.',
  },
  deflect: {
    id: 'deflect',
    name: 'Deflect',
    description: 'This Chosen can negate one attack per turn entirely.',
    deploymentNote: 'Open with a low-value attack to burn the Deflect charge, then use your best shot.',
  },
  parting_silk: {
    id: 'parting_silk',
    name: 'Parting Silk',
    description: 'This Chosen retaliates against melee attackers with a powerful sword strike.',
    deploymentNote: 'Do NOT use melee attacks on this Chosen. Rangers and Templars must stay ranged.',
  },
  phasing: {
    id: 'phasing',
    name: 'Phasing',
    description: 'This Chosen can move through walls and terrain freely.',
    deploymentNote: 'Cover provides no positional safety. Treat every flank as potentially exposed.',
  },
  uncanny: {
    id: 'uncanny',
    name: 'Uncanny',
    description: 'This Chosen is hard to predict. Flanking bonuses are significantly reduced.',
    deploymentNote: 'Do not rely on flanking for extra hit chance. Volume of fire and cover destruction instead.',
  },
  reaper_strike: {
    id: 'reaper_strike',
    name: 'Reaper Strike',
    description: 'This Chosen cleaves through multiple soldiers in a single melee swing.',
    deploymentNote: 'Never position two soldiers adjacent to each other anywhere near this Chosen.',
  },
  soul_steal: {
    id: 'soul_steal',
    name: 'Soul Steal',
    description: 'This Chosen drains Will from soldiers, potentially causing panic or mind control.',
    deploymentNote: 'Bring psi protection. Avoid deploying Shaken soldiers who are already low Will.',
  },
  mark_of_the_coil: {
    id: 'mark_of_the_coil',
    name: 'Mark of the Coil',
    description: 'This Chosen marks a soldier. If the marked soldier dies, they may join ADVENT.',
    deploymentNote: 'Prioritize removing the mark via Templar abilities or by eliminating the Chosen quickly.',
  },
  chain_shot: {
    id: 'chain_shot',
    name: 'Chain Shot',
    description: 'This Chosen fires multiple times per turn, targeting different soldiers.',
    deploymentNote: 'Do not rely on one soldier to absorb fire. Keep all soldiers healthy and spread out.',
  },
  cover_generate: {
    id: 'cover_generate',
    name: 'Cover Generation',
    description: 'This Chosen can generate cover for itself or nearby ADVENT forces.',
    deploymentNote: 'Bring Grenadier for cover destruction. Destroying cover may negate this strength.',
  },
}

export const CHOSEN_WEAKNESSES: Record<ChosenWeaknessId, ChosenWeakness> = {
  vulnerable_explosives: {
    id: 'vulnerable_explosives',
    name: 'Vulnerable to Explosives',
    description: 'This Chosen takes significant bonus damage from grenades, rockets, and explosive abilities.',
    exploiterNote: 'Grenades and rockets deal bonus damage. Grenadiers with Shredder or blast-focused builds are priority picks.',
    scoreBonus: 8,
    preferredClasses: ['grenadier'],
  },
  vulnerable_fire: {
    id: 'vulnerable_fire',
    name: 'Vulnerable to Fire',
    description: 'This Chosen takes bonus damage from fire and loses HP while burning.',
    exploiterNote: 'Incendiary grenades and Dragon Rounds deal bonus damage and apply ongoing burn.',
    scoreBonus: 4,
  },
  vulnerable_melee: {
    id: 'vulnerable_melee',
    name: 'Vulnerable to Melee',
    description: 'This Chosen takes bonus damage from melee attacks.',
    exploiterNote: 'Rangers (Run and Gun + blade) and Templars (Rend) deal bonus damage in melee range.',
    scoreBonus: 8,
    preferredClasses: ['ranger', 'templar'],
  },
  vulnerable_psionics: {
    id: 'vulnerable_psionics',
    name: 'Vulnerable to Psionics',
    description: 'This Chosen takes bonus damage from psionic abilities.',
    exploiterNote: 'Psi Operatives with offensive abilities (Null Lance, Void Rift) are strong picks.',
    scoreBonus: 6,
    preferredClasses: ['psi_operative'],
  },
  vulnerable_shotguns: {
    id: 'vulnerable_shotguns',
    name: 'Vulnerable to Shotguns',
    description: 'Rangers using shotguns deal bonus damage to this Chosen at close range.',
    exploiterNote: 'Ranger (shotgun) deals bonus damage at close range. Get close and shoot.',
    scoreBonus: 6,
    preferredClasses: ['ranger'],
  },
  faction_reapers: {
    id: 'faction_reapers',
    name: 'Weakness to Reapers',
    description: 'Reaper soldiers deal significant bonus damage to this Chosen.',
    exploiterNote: 'Bring a Reaper. Their Banish ability in particular devastates this Chosen.',
    scoreBonus: 12,
    preferredClasses: ['reaper'],
  },
  faction_templars: {
    id: 'faction_templars',
    name: 'Weakness to Templars',
    description: 'Templar soldiers deal significant bonus damage to this Chosen.',
    exploiterNote: 'Bring a Templar. Rend and Volt both deal bonus damage.',
    scoreBonus: 12,
    preferredClasses: ['templar'],
  },
  faction_skirmishers: {
    id: 'faction_skirmishers',
    name: 'Weakness to Skirmishers',
    description: 'Skirmisher soldiers deal significant bonus damage to this Chosen.',
    exploiterNote: 'Bring a Skirmisher. Justice and Whiplash both proc bonus damage.',
    scoreBonus: 12,
    preferredClasses: ['skirmisher'],
  },
  no_regen_cover: {
    id: 'no_regen_cover',
    name: 'No Regen in Cover',
    description: 'This Chosen does not regenerate HP while in full cover.',
    exploiterNote: 'Grenade the Chosen out of cover before end of turn to deny regen.',
    scoreBonus: 4,
    preferredClasses: ['grenadier'],
  },
  vulnerable_suppression: {
    id: 'vulnerable_suppression',
    name: 'Vulnerable to Suppression',
    description: 'This Chosen can be suppressed, suffering a large aim penalty while pinned.',
    exploiterNote: 'Specialists with Suppression can pin this Chosen for a full turn.',
    scoreBonus: 6,
    preferredClasses: ['specialist'],
  },
}

export const CHOSEN_DEFINITIONS: Record<ChosenType, ChosenDefinition> = {
  assassin: {
    type: 'assassin',
    name: 'The Assassin',
    description: 'An agile close-combat specialist who uses shadow and melee to destroy XCOM squads.',
    baseAbilities: [
      { name: 'Shadowstep', description: 'Ignores overwatch fire when moving.' },
      { name: 'Parting Silk', description: 'Retaliates with a sword strike when attacked in melee.' },
      { name: 'Shadowfall', description: 'Enters concealment when damaged, repositioning freely.' },
      { name: 'Imprison', description: 'Can capture a soldier instead of killing them.' },
    ],
    strengthPool: [
      'dodge', 'armor', 'regen', 'damage_immunity', 'shadowstep', 'teleport',
      'deflect', 'parting_silk', 'phasing', 'uncanny', 'reaper_strike',
    ],
    weaknessPool: [
      'vulnerable_explosives', 'vulnerable_fire', 'faction_reapers',
      'faction_skirmishers', 'no_regen_cover', 'vulnerable_suppression',
    ],
    knowledgeTierAbilities: [
      {
        tier: 1,
        name: 'Advanced Shadowfall',
        description: 'Returns to concealment even after taking multiple hits per turn.',
      },
      {
        tier: 2,
        name: 'Bladestorm',
        description: 'Attacks any soldier who moves adjacent — effectively a permanent overwatch.',
      },
      {
        tier: 3,
        name: 'Death from Shadows',
        description: 'Attacks from concealment cannot miss and deal significant bonus damage.',
      },
    ],
  },
  hunter: {
    type: 'hunter',
    name: 'The Hunter',
    description: 'A long-range sniper who scouts ahead, deploys traps, and picks off soldiers from safety.',
    baseAbilities: [
      { name: 'Suppression', description: 'Applies suppression to any soldier who ends their turn in the open.' },
      { name: 'Traps', description: 'Deploys traps that immobilize soldiers.' },
      { name: 'Chain Shot', description: 'Fires at multiple targets in a single action.' },
      { name: 'Imprison', description: 'Can capture a soldier instead of killing them.' },
    ],
    strengthPool: [
      'dodge', 'armor', 'regen', 'damage_immunity', 'heavy_weapon', 'chain_shot',
      'teleport', 'deflect', 'uncanny', 'cover_generate',
    ],
    weaknessPool: [
      'vulnerable_explosives', 'vulnerable_melee', 'vulnerable_psionics',
      'faction_templars', 'faction_skirmishers', 'no_regen_cover',
    ],
    knowledgeTierAbilities: [
      {
        tier: 1,
        name: 'Long Watch',
        description: 'Overwatch shots suffer no aim penalty.',
      },
      {
        tier: 2,
        name: 'Serial',
        description: 'Killing a soldier grants one additional action immediately.',
      },
      {
        tier: 3,
        name: 'Apex Predator',
        description: 'Gains a bonus action at the start of every active phase turn.',
      },
    ],
  },
  warlock: {
    type: 'warlock',
    name: 'The Warlock',
    description: 'A psionic force multiplier who summons Specters, mind-controls soldiers, and applies devastating buffs to ADVENT forces.',
    baseAbilities: [
      { name: 'Psionic Storm', description: 'Deals psionic damage in an area and drains Will from soldiers.' },
      { name: 'Summon Specters', description: 'Summons Specter units that can shadow-bind soldiers.' },
      { name: 'Null Lance', description: 'Fires a piercing psionic projectile through cover.' },
      { name: 'Imprison', description: 'Can capture a soldier instead of killing them.' },
    ],
    strengthPool: [
      'dodge', 'armor', 'regen', 'damage_immunity', 'soul_steal', 'mark_of_the_coil',
      'teleport', 'deflect', 'phasing',
    ],
    weaknessPool: [
      'vulnerable_explosives', 'vulnerable_fire', 'vulnerable_shotguns',
      'faction_reapers', 'faction_templars', 'vulnerable_suppression',
    ],
    knowledgeTierAbilities: [
      {
        tier: 1,
        name: 'Psionic Ward',
        description: 'Gains passive resistance to psionic abilities used by XCOM.',
      },
      {
        tier: 2,
        name: 'Rift',
        description: 'Creates a reality rift that pulls nearby soldiers into melee range and deals damage.',
      },
      {
        tier: 3,
        name: 'Avatar Protocol',
        description: 'Can temporarily convert soldiers into psionic-empowered avatar threats.',
      },
    ],
  },
}

// Returns the 2 default strengths each Chosen rolls (the ones listed in base abilities)
export function getDefaultStrengths(type: ChosenType): ChosenStrengthId[] {
  const defaults: Record<ChosenType, ChosenStrengthId[]> = {
    assassin: ['shadowstep', 'parting_silk'],
    hunter: ['chain_shot', 'cover_generate'],
    warlock: ['soul_steal', 'phasing'],
  }
  return defaults[type]
}
