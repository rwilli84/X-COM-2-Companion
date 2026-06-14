// ─── Enemy types ──────────────────────────────────────────────────────────────

export interface EnemyEntry {
  id: string
  name: string
  source: 'base' | 'wotc' | 'alien_hunters'
  threat: 'low' | 'medium' | 'high' | 'critical'
  immediateRisk: string    // what it does if ignored this turn
  counterActions: string[] // best actions to take against it
  avoidActions: string[]   // what NOT to do
  hardCounters?: string[]  // ability / item IDs that specifically counter it
  rulesOverride?: string   // overrides generic priority (e.g., "kill this turn or it clones")
}

export const ENEMY_ROSTER: EnemyEntry[] = [
  {
    id: 'advent_trooper',    name: 'ADVENT Trooper',
    source: 'base',          threat: 'low',
    immediateRisk: 'Standard fire — dangerous in numbers but individually weak.',
    counterActions: ['Suppress with Grenadier if clustered.', 'Single shot from any soldier to finish.'],
    avoidActions: ['Wasting grenades or high-value abilities.'],
  },
  {
    id: 'advent_officer',    name: 'ADVENT Officer',
    source: 'base',          threat: 'medium',
    immediateRisk: 'Marks an ally (flanking target) — increases all ADVENT aim vs. that soldier.',
    counterActions: ['Prioritise over troopers — killing the officer removes the Mark.', 'Skulljack for key research.'],
    avoidActions: ['Leaving it alive while other ADVENT still have actions.'],
    hardCounters: ['skulljack'],
  },
  {
    id: 'advent_shieldbearer', name: 'ADVENT Shieldbearer',
    source: 'base',           threat: 'medium',
    immediateRisk: 'Grants HP shield to all nearby ADVENT — makes the whole pod tankier.',
    counterActions: ['Kill the Shieldbearer FIRST before shooting anything else in the pod.', 'AoE grenades that hit both it and shielded units.'],
    avoidActions: ['Shooting shielded units before the Shieldbearer is dead.'],
    rulesOverride: 'Kill before all other ADVENT or shields waste your shots.',
  },
  {
    id: 'sectoid',           name: 'Sectoid',
    source: 'base',          threat: 'high',
    immediateRisk: 'Mindspin (panic/mind control allies), Reanimate (corpses as zombies). Acts early.',
    counterActions: ['CC or kill immediately.', 'Psi Stasis removes it from the equation safely.', 'Killing a mind-controlled sectoid breaks the control.'],
    avoidActions: ['Leaving it alive while your soldiers are low Will.', 'Leaving corpses near it.'],
    hardCounters: ['psi_stasis', 'flashbang', 'mindshield'],
    rulesOverride: 'CC or kill this turn — mind control on a colonel is devastating.',
  },
  {
    id: 'viper',             name: 'Viper',
    source: 'base',          threat: 'high',
    immediateRisk: 'Bind removes a soldier from the fight — they can\'t act and take damage each turn.',
    counterActions: ['Kill it before it acts.', 'If it has already Bound someone: kill the Viper to free them.', 'Incendiary grenade prevents Bind (burning stops melee).'],
    avoidActions: ['Letting it close to melee range.', 'Leaving it alive at close range.'],
    hardCounters: ['incendiary_grenade'],
    rulesOverride: 'Kill or CC before it acts — a Bound colonel is a turn wasted.',
  },
  {
    id: 'muton',             name: 'Muton',
    source: 'base',          threat: 'medium',
    immediateRisk: 'High HP and armor. Counter-attacks on missed melee. Blood Call can buff ADVENT.',
    counterActions: ['Shred armor first (Grenadier Shredder or acid grenade).', 'Don\'t use melee unless you can guarantee the kill.'],
    avoidActions: ['Melee if it has Counter ability.', 'Engaging without armor shred.'],
  },
  {
    id: 'berserker',         name: 'Berserker',
    source: 'base',          threat: 'high',
    immediateRisk: 'Charges directly at soldiers after taking any damage. High melee damage. Enrages.',
    counterActions: ['Kill in one activation.', 'Incendiary grenade stops movement (burning prevents charge).', 'Stasis removes it from the fight safely.'],
    avoidActions: ['Wounding but not killing — it charges.', 'Melee soldiers in its path.'],
    hardCounters: ['incendiary_grenade', 'psi_stasis'],
    rulesOverride: 'Kill this turn or CC it — a wounded Berserker charges and is very dangerous.',
  },
  {
    id: 'chryssalid',        name: 'Chryssalid',
    source: 'base',          threat: 'critical',
    immediateRisk: 'Infects any unit it kills (civilian or soldier) — spawns more Chryssalids from the corpse.',
    counterActions: ['Kill IMMEDIATELY before it reaches anyone.', 'Incendiary grenade prevents corpse conversion (burning destroys the body).', 'Never let it near civilians on retaliations.'],
    avoidActions: ['Leaving any infected corpse.', 'Grouping soldiers near civilians when Chryssalids are nearby.'],
    hardCounters: ['incendiary_grenade'],
    rulesOverride: 'CRITICAL: Kill before any movement toward civilians or corpses. Highest threat on retaliations.',
  },
  {
    id: 'sectopod',          name: 'Sectopod',
    source: 'base',          threat: 'critical',
    immediateRisk: 'Massive HP/armor. Overwatches with high-damage chain gun. Wrath Cannon one-shots.',
    counterActions: ['EMP Grenade — stuns and deals heavy damage.', 'Bluescreen Rounds (Specialist/Sharpshooter) for massive bonus damage.', 'Haywire Protocol — chance to hack and turn it against ADVENT.', 'Shred armor with Grenadier before others fire.'],
    avoidActions: ['Engaging without EMP or armor shred.', 'Clustering soldiers in its Wrath Cannon arc.'],
    hardCounters: ['emp_grenade', 'bluescreen_rounds', 'spec_haywire'],
    rulesOverride: 'Spend multiple soldiers\' actions on this. EMP → Bluescreen → Shred → shoot.',
  },
  {
    id: 'gatekeeper',        name: 'Gatekeeper',
    source: 'base',          threat: 'critical',
    immediateRisk: 'Open: fires powerful psi blasts and mind controls. Closed: regenerates HP rapidly.',
    counterActions: ['Open state: kill in ONE activation — focus fire everything.', 'Closed state: Stasis locks it so it can\'t regen. Kill others, return to it.', 'Null Lance and psi damage ignore its armor.'],
    avoidActions: ['Wounding it and leaving it to close.', 'Splitting damage across it and other enemies when it\'s open.'],
    hardCounters: ['psi_stasis', 'psi_null_lance'],
    rulesOverride: 'When open: commit everything to a kill. When closed: Stasis it and ignore.',
  },
  {
    id: 'codex',             name: 'Codex',
    source: 'base',          threat: 'high',
    immediateRisk: 'Clones itself if not killed in one activation. Each clone has full HP.',
    counterActions: ['Kill in one activation — no exceptions.', 'High-aim soldiers to avoid misses that trigger the clone.', 'Don\'t use grenades (they can reduce HP without killing, triggering clone).'],
    avoidActions: ['Grenades if the Codex survives.', 'Low-aim shots that might miss.', 'Activating without a reliable kill shot lined up.'],
    rulesOverride: 'KILL THIS TURN or it becomes two — budget enough actions to guarantee the kill before activating.',
  },
  {
    id: 'andromedon',        name: 'Andromedon',
    source: 'base',          threat: 'high',
    immediateRisk: 'Heavily armored. When suit is destroyed, pilot continues fighting AND the suit explodes.',
    counterActions: ['Destroy the suit (standard fire + armor shred).', 'After suit dies: IMMEDIATELY kill the biological pilot before it acts.', 'EMP grenade on the suit for heavy damage.'],
    avoidActions: ['Leaving the pilot alive after the suit is destroyed.', 'Engaging without armor shred.'],
    hardCounters: ['emp_grenade'],
    rulesOverride: 'After suit explodes: spend ALL remaining actions to kill the pilot this turn.',
  },
  {
    id: 'avatar',            name: 'Avatar (Ethereal)',
    source: 'base',          threat: 'critical',
    immediateRisk: 'Soul Steal (steals Will and kills low-Will soldiers), mind control, psi attacks.',
    counterActions: ['Psi Stasis immediately — nullifies all its abilities for a turn.', 'Domination: permanently mind control it (Psi Operative).', 'Mindshield soldiers resist its Will attacks.'],
    avoidActions: ['Leaving low-Will soldiers in its line of sight.', 'Fighting it without a Psi Operative if possible.'],
    hardCounters: ['psi_stasis', 'psi_domination', 'mindshield'],
    rulesOverride: 'Stasis or Dominate immediately. Dominated Avatar can one-shot other Avatars.',
  },
  {
    id: 'priest',            name: 'ADVENT Priest',
    source: 'wotc',          threat: 'high',
    immediateRisk: 'Sustain (invulnerable once per mission), Stasis (removes a soldier), and mind-related debuffs.',
    counterActions: ['Kill it before it can use Sustain (needs very high damage burst).', 'Or CC it so it can\'t act after Sustain triggers.', 'Flashbang or Stasis to prevent it acting.'],
    avoidActions: ['Low-damage shots that just trigger Sustain.'],
    hardCounters: ['flashbang', 'psi_stasis'],
    rulesOverride: 'Either burst it dead before Sustain, or CC after Sustain — don\'t leave it free to act.',
  },
  {
    id: 'spectre',           name: 'Spectre',
    source: 'wotc',          threat: 'high',
    immediateRisk: 'Shadow Clone: creates a dark copy of your soldier that fights against you.',
    counterActions: ['Kill the Spectre before it Shadow Clones.', 'Kill cloned soldier copies immediately (they deal full damage).', 'Scanners reveal Spectres hiding in concealment.'],
    avoidActions: ['Letting it clone a high-value colonel.', 'Ignoring shadow copies.'],
    rulesOverride: 'KILL before cloning. If it clones: kill the clone copy first (easier to kill), then the Spectre.',
  },
  {
    id: 'lost',              name: 'The Lost',
    source: 'wotc',          threat: 'medium',
    immediateRisk: 'Swarm in waves. Each one that reaches a soldier bites. Endless until objective.',
    counterActions: ['HEADSHOTS: one-hit kills grant free actions — chain as many as possible.', 'Never use grenades on Lost (kills without free action).', 'Pistols and precise weapons are efficient for headshot chains.'],
    avoidActions: ['Grenades on Lost clusters.', 'Multi-shot abilities that over-kill.'],
    rulesOverride: 'Headshot chains are the mechanic — position soldiers to one-tap multiple Lost per turn.',
  },
]

// ─── Battle situation input ───────────────────────────────────────────────────

export interface BattleSituation {
  enemyIds: string[]
  squadClasses: string[]
  squadAbilities: string[]      // key ability ids present in squad
  hasMimicBeacon: boolean
  hasEmpGrenade: boolean
  hasStasis: boolean
  hasDomination: boolean
  hasShredder: boolean          // Grenadier with Shredder
  hasArmorShred: boolean        // any shred source (shredder, ap rounds, acid grenade)
  turnsRemaining?: number       // if timed mission
}

// ─── Action priority output ───────────────────────────────────────────────────

export interface ActionPriority {
  step: number
  action: string
  soldierNote: string   // which class / who should do this
  targetNote: string    // which enemy / what
  reason: string
  priority: 'critical' | 'high' | 'normal'
}

// ─── Priority engine ──────────────────────────────────────────────────────────

export function prioritizeActions(situation: BattleSituation): ActionPriority[] {
  const actions: Omit<ActionPriority, 'step'>[] = []
  const enemies = situation.enemyIds
    .map(id => ENEMY_ROSTER.find(e => e.id === id))
    .filter((e): e is EnemyEntry => e !== null && e !== undefined)

  const has = (id: string) => situation.enemyIds.includes(id)
  const hasClass = (cls: string) => situation.squadClasses.includes(cls)
  const hasAbility = (id: string) => situation.squadAbilities.includes(id)

  // ── Override rules — must happen first ───────────────────────────────────
  if (has('chryssalid')) {
    actions.push({ priority: 'critical',
      action: 'Kill ALL Chryssalids before any other action',
      soldierNote: 'Any available soldier with a reliable shot',
      targetNote: 'Chryssalid(s)',
      reason: 'Chryssalids infect corpses and spawn more — one alive next turn becomes three.' })
  }

  if (has('codex')) {
    actions.push({ priority: 'critical',
      action: 'Guarantee kill on Codex this turn',
      soldierNote: 'High-aim soldier (Sharpshooter, or Serial-eligible)',
      targetNote: 'Codex',
      reason: 'A Codex that survives ANY activation clones itself. Budget enough actions before engaging.' })
  }

  if (has('spectre')) {
    actions.push({ priority: 'critical',
      action: 'Kill Spectre before it Shadow Clones',
      soldierNote: 'Burst-damage soldier',
      targetNote: 'Spectre',
      reason: 'A Shadow Clone of a colonel is extremely dangerous. Kill before it clones.' })
  }

  // ── Crowd control / disable priority ─────────────────────────────────────
  if (has('avatar') && situation.hasStasis) {
    actions.push({ priority: 'critical',
      action: 'Psi Stasis the Avatar',
      soldierNote: 'Psi Operative',
      targetNote: 'Avatar',
      reason: 'Stasis neutralises Soul Steal and mind control for a full turn. Buy time to kill others.' })
  }

  if (has('avatar') && situation.hasDomination && !situation.hasStasis) {
    actions.push({ priority: 'critical',
      action: 'Dominate the Avatar',
      soldierNote: 'Psi Operative',
      targetNote: 'Avatar',
      reason: 'Dominated Avatar can fire on other Avatars and Sectopods — massive action economy swing.' })
  }

  if (has('gatekeeper') && situation.hasStasis) {
    actions.push({ priority: 'high',
      action: 'Stasis the Gatekeeper if it closes — focus fire if open',
      soldierNote: 'Psi Operative',
      targetNote: 'Gatekeeper',
      reason: 'Open Gatekeeper: commit all damage to kill this turn. Closed: Stasis stops regeneration.' })
  }

  if (has('sectoid')) {
    if (situation.hasStasis) {
      actions.push({ priority: 'high',
        action: 'Stasis or kill the Sectoid',
        soldierNote: 'Psi Operative or any high-aim soldier',
        targetNote: 'Sectoid',
        reason: 'Stasis is safest — prevents Mindspin and Reanimate without leaving a corpse to reanimate.' })
    } else if (situation.hasMimicBeacon) {
      actions.push({ priority: 'high',
        action: 'Deploy Mimic Beacon near the Sectoid',
        soldierNote: 'Any soldier adjacent to Sectoid sightline',
        targetNote: 'Sectoid',
        reason: 'Beacon draws Sectoid fire and prevents mind control for one full turn.' })
    } else {
      actions.push({ priority: 'high',
        action: 'Kill the Sectoid this turn',
        soldierNote: 'Reliable-aim soldier',
        targetNote: 'Sectoid',
        reason: 'Sectoid mind control on a colonel is a disaster. Prioritise over most other enemies.' })
    }
  }

  if (has('viper')) {
    actions.push({ priority: 'high',
      action: 'Kill the Viper before it acts',
      soldierNote: 'Nearest reliable-aim soldier',
      targetNote: 'Viper',
      reason: 'A Bound soldier is out of the fight and takes damage each turn. Kill before it acts.' })
  }

  if (has('priest')) {
    actions.push({ priority: 'high',
      action: 'Burst the Priest dead or CC it before Sustain',
      soldierNote: 'Two soldiers focusing fire, OR Psi Stasis / Flashbang',
      targetNote: 'ADVENT Priest',
      reason: 'Sustain makes it invulnerable once per mission. Burst it down before the proc, or CC after.' })
  }

  // ── Shieldbearer — kill first in the pod ─────────────────────────────────
  if (has('advent_shieldbearer')) {
    actions.push({ priority: 'high',
      action: 'Kill the Shieldbearer FIRST',
      soldierNote: 'Any soldier with a reliable shot',
      targetNote: 'ADVENT Shieldbearer',
      reason: 'Shieldbearer gives all nearby ADVENT a HP shield. Kill it before shooting anything else.' })
  }

  // ── Armor shred sequence ─────────────────────────────────────────────────
  const armoredEnemies = enemies.filter(e => ['sectopod','muton','andromedon','berserker','avatar','gatekeeper'].some(id => e.id === id))
  if (armoredEnemies.length > 0 && situation.hasArmorShred) {
    actions.push({ priority: 'high',
      action: 'Lead with armor shred before other soldiers fire',
      soldierNote: 'Grenadier (Shredder) or soldier with AP/Acid rounds',
      targetNote: `${armoredEnemies.map(e => e.name).join(', ')}`,
      reason: 'Every point of armor shred = ~2 extra damage per shot from ALL other soldiers this turn. Always shred first.' })
  }

  // ── Sectopod sequence ────────────────────────────────────────────────────
  if (has('sectopod')) {
    if (situation.hasEmpGrenade) {
      actions.push({ priority: 'critical',
        action: 'EMP Grenade → Bluescreen Rounds → Shred → fire',
        soldierNote: 'Grenadier/Specialist with EMP; Specialist/Sharpshooter with Bluescreen',
        targetNote: 'Sectopod',
        reason: 'EMP stuns and halves armor. Bluescreen Rounds then deal massive bonus damage. Commit 3–4 soldiers.' })
    } else {
      actions.push({ priority: 'critical',
        action: 'Shred armor first, then commit 3–4 soldiers to focus fire',
        soldierNote: 'Grenadier leads; Specialist Combat Protocol for armor-ignoring damage',
        targetNote: 'Sectopod',
        reason: 'Sectopod\'s Wrath Cannon can one-shot a soldier. Kill it this turn or it will wreak havoc.' })
    }
  }

  // ── High-threat enemies ───────────────────────────────────────────────────
  if (has('berserker')) {
    actions.push({ priority: 'high',
      action: 'Kill or Incendiary-grenade the Berserker',
      soldierNote: 'High-damage soldier or grenadier with Incendiary',
      targetNote: 'Berserker',
      reason: 'Wounding it triggers a charge. Either kill this turn or trap it in burning terrain.' })
  }

  if (has('andromedon')) {
    actions.push({ priority: 'high',
      action: 'Destroy the suit, then IMMEDIATELY kill the pilot',
      soldierNote: 'Multiple soldiers — save actions for the pilot follow-up',
      targetNote: 'Andromedon suit → pilot',
      reason: 'The pilot exits the suit and acts immediately. Budget actions to kill it the same turn the suit dies.' })
  }

  if (has('gatekeeper') && !situation.hasStasis) {
    actions.push({ priority: 'high',
      action: 'Commit full burst to kill Gatekeeper while open',
      soldierNote: 'All available soldiers with LoS',
      targetNote: 'Gatekeeper',
      reason: 'Open Gatekeeper must die this activation. If it closes it starts regenerating rapidly.' })
  }

  // ── Mimic Beacon deployment ───────────────────────────────────────────────
  if (situation.hasMimicBeacon && enemies.some(e => e.threat === 'high' || e.threat === 'critical')) {
    if (!actions.some(a => a.action.includes('Mimic Beacon'))) {
      actions.push({ priority: 'high',
        action: 'Deploy Mimic Beacon to neutralise the pod',
        soldierNote: 'Any soldier at safe distance',
        targetNote: 'Full pod',
        reason: 'All enemies target the beacon for one full turn — lets you reposition and burst without return fire.' })
    }
  }

  // ── Lost-specific rules ───────────────────────────────────────────────────
  if (has('lost')) {
    actions.push({ priority: 'high',
      action: 'Chain headshots — use precise single shots, never grenades',
      soldierNote: 'All soldiers: prioritise 1-shot kills for free actions',
      targetNote: 'Lost swarm',
      reason: 'Any 1-HP kill grants a free action. Grenades kill without free actions — wasted efficiency.' })
  }

  // ── Officer — Skulljack opportunity ──────────────────────────────────────
  if (has('advent_officer') && situation.squadAbilities.includes('skulljack')) {
    actions.push({ priority: 'normal',
      action: 'Skulljack the ADVENT Officer',
      soldierNote: 'Ranger or Specialist with Skulljack',
      targetNote: 'ADVENT Officer',
      reason: 'Skulljacking an Officer triggers the ADVENT Officer autopsy research. Do this before killing it.' })
  }

  // ── Timed pressure ───────────────────────────────────────────────────────
  if (situation.turnsRemaining !== undefined && situation.turnsRemaining <= 2) {
    actions.push({ priority: 'critical',
      action: 'SKIP COMBAT — dash to objective immediately',
      soldierNote: 'All soldiers',
      targetNote: 'Objective',
      reason: `Only ${situation.turnsRemaining} turn(s) left. Don't engage enemies you don't have to.` })
  }

  // ── Default: overwatch wrap-up ────────────────────────────────────────────
  if (actions.length === 0 || enemies.every(e => e.threat === 'low')) {
    actions.push({ priority: 'normal',
      action: 'Fire on highest-HP enemy, then overwatch remaining soldiers',
      soldierNote: 'Shooter → overwatchers',
      targetNote: 'Remaining enemies',
      reason: 'Standard pod — no special threats. Kill exposed targets, overwatch for enemy movement.' })
  }

  // ── Overwatch reminder for timed gaps ────────────────────────────────────
  if (actions.some(a => a.priority === 'critical' || a.priority === 'high') &&
      !situation.turnsRemaining) {
    actions.push({ priority: 'normal',
      action: 'Set remaining soldiers on overwatch after burst',
      soldierNote: 'Soldiers with actions remaining after priority targets handled',
      targetNote: 'Enemy movement lanes',
      reason: 'Overwatch punishes any enemy that moves after your burst — free damage on their turn.' })
  }

  return actions.map((a, i) => ({ ...a, step: i + 1 }))
}
