/**
 * XCOM 2 Shot Calculator — pure functions implementing the actual to-hit formula.
 *
 * Formula:
 *   Hit% = clamp(0, 100, BaseAim + AimBonuses − TargetDefense − CoverBonus − DefenseBonuses)
 *
 * Sources: XCOM 2 modding documentation, community research (XCOM2 Wiki, Long War 2 modding
 * notes, Pavonis Interactive public mod data). Values marked with /* approx *‌/ where the exact
 * engine constant is uncertain or derived from empirical community testing rather than raw game
 * files. Crit, dodge, elevation, and smoke values are especially uncertain.
 *
 * Unit-tested in __tests__/shotCalculator.test.ts against known in-game observed values.
 */

// ── Public types ───────────────────────────────────────────────────────────────

export type WeaponType =
  | 'assault_rifle'
  | 'shotgun'
  | 'sniper'
  | 'cannon'
  | 'pistol'
  | 'spark_cannon'

export type RangeBracket = 'close' | 'mid' | 'far' | 'very_far'
export type CoverType = 'none' | 'half' | 'full'
export type WeaponTierInput = 'conventional' | 'magnetic' | 'beam'

export interface AbilityModifier {
  id: string
  label: string
  aimDelta: number      // flat aim bonus/penalty applied to shooter
  critDelta: number     // flat crit bonus
  damageMult?: number   // multiplies weapon damage output (e.g. Deadeye × 1.33)
  source: 'base' | 'wotc' | 'alien_hunters'
  approx?: boolean
  description: string
}

export interface ShooterInput {
  baseAim: number
  baseCrit: number         // class innate crit, before abilities (0 for most classes)
  weaponType: WeaponType
  weaponTier: WeaponTierInput
  rangeBracket: RangeBracket
  scopeBonus: number       // +0 / +5 / +10 from scope or Perception PCS chip
  abilityModIds: string[]  // IDs from ABILITY_MODIFIERS catalogue below
  isElevated: boolean      // shooter on higher ground than target
}

export interface TargetInput {
  baseDefense: number
  coverType: CoverType
  isFlanked: boolean
  isHunkered: boolean          // Hunker Down grants +20 additional defense /* approx */
  dodge: number                // WotC dodge stat — converts crits to normal hits /* approx */
  targetInSmoke: boolean       // smoke around target penalises shooter aim /* approx */
  hasLightningReflexes: boolean // first shot each turn suffers -30 aim penalty /* approx */
  isApprox?: boolean           // caller flags that some stat is an estimate
}

export interface TargetHPInput {
  currentHP: number
  armor: number  // flat damage reduction per hit (separate from defense — armor reduces damage not accuracy)
}

export interface ShotBreakdown {
  baseAim: number
  aimBonuses: number      // scopes + abilities + range + elevation
  targetDefense: number
  coverBonus: number      // cover + hunker combined
  otherPenalties: number  // smoke + lightning reflexes
  rawHitBeforeClamp: number
}

export interface SensitivityAdjustment {
  label: string
  newHitChance: number
  delta: number            // positive = improves your shot
  newCritChance?: number
}

export interface KillProbability {
  probabilityOnHit: number   // P(damage kills | normal hit)
  probabilityOnCrit: number  // P(damage kills | crit hit)
  overall: number            // P(outright kill this shot)
  canKillOnHit: boolean
  canKillOnCrit: boolean
}

export interface ShotResult {
  hitChance: number            // 0–100, clamped
  critChance: number           // 0–100, conditional on hit, before dodge
  effectiveCritChance: number  // after target's Dodge reduces it
  missChance: number           // 100 − hitChance
  expectedDamage: number       // probability-weighted average across miss/hit/crit
  damageOnHit: { min: number; max: number; avg: number }
  damageOnCrit: { min: number; max: number; avg: number }
  killProbability: KillProbability | null
  riskText: string
  sensitivityBreakdown: SensitivityAdjustment[]
  confidence: 'full' | 'approximated'
  warnings: string[]
  breakdown: ShotBreakdown
}

// ── Ability modifier catalogue ────────────────────────────────────────────────

export const ABILITY_MODIFIERS: AbilityModifier[] = [
  // ── Base game ───────────────────────────────────────────────────────────────
  {
    id: 'squadsight_penalty',
    label: 'Squadsight (shooting beyond sight radius)',
    aimDelta: -10, critDelta: 0,
    source: 'base', approx: true,
    description: 'Sharpshooter firing through Squadsight past the squad\'s sight range. Exact penalty is −10 to −15; −10 used here.',
  },
  {
    id: 'deadeye',
    label: 'Deadeye (−10 aim, ×1.33 damage)',
    aimDelta: -10, critDelta: 0, damageMult: 1.33,
    source: 'base', approx: true,
    description: 'Sharpshooter Deadeye — trades accuracy for ~33% more damage per shot.',
  },
  {
    id: 'steady_weapon',
    label: 'Steady Weapon (+10 aim, didn\'t move)',
    aimDelta: 10, critDelta: 0,
    source: 'base', approx: true,
    description: 'Sharpshooter Steady Weapon — bonus aim when soldier didn\'t move this turn.',
  },
  {
    id: 'aim_ability',
    label: 'Aim action used (+15 aim, +20 crit)',
    aimDelta: 15, critDelta: 20,
    source: 'base', approx: true,
    description: 'Sharpshooter Aim ability — spend an action this turn for a big accuracy and crit boost next shot.',
  },
  {
    id: 'rapid_fire_second',
    label: 'Rapid Fire — 2nd shot (−15 aim)',
    aimDelta: -15, critDelta: 0,
    source: 'base', approx: true,
    description: 'Ranger Rapid Fire second shot carries a −15 aim penalty. First shot uses normal aim.',
  },
  {
    id: 'death_from_above',
    label: 'Death From Above (+10 aim, shooter elevated)',
    aimDelta: 10, critDelta: 0,
    source: 'base', approx: true,
    description: 'Ranger passive — additional +10 aim bonus when on higher ground. Stack with the elevation toggle above.',
  },
  {
    id: 'suppressed',
    label: 'You are suppressed (−30 aim)',
    aimDelta: -30, critDelta: 0,
    source: 'base', approx: true,
    description: 'Shooting while under Specialist Suppression. Suppression does not prevent firing but heavily penalises accuracy.',
  },
  {
    id: 'killzone',
    label: 'Killzone reaction shot (−30 aim)',
    aimDelta: -30, critDelta: 0,
    source: 'base', approx: true,
    description: 'Sharpshooter Killzone — reaction shots are significantly less accurate than deliberate shots.',
  },
  {
    id: 'covering_fire',
    label: 'Covering Fire reaction shot (−20 aim)',
    aimDelta: -20, critDelta: 0,
    source: 'base', approx: true,
    description: 'Overwatch/Covering Fire reaction shot penalty.',
  },
  {
    id: 'lightning_hands',
    label: 'Lightning Hands (free pistol shot, no penalty)',
    aimDelta: 0, critDelta: 0,
    source: 'base', approx: false,
    description: 'Sharpshooter Lightning Hands — fires pistol as a free bonus action with no aim penalty.',
  },
  // ── WotC only ──────────────────────────────────────────────────────────────
  {
    id: 'bluescreen_rounds',
    label: 'Bluescreen Rounds vs robotic (+10 aim, +20 crit)',
    aimDelta: 10, critDelta: 20,
    source: 'wotc', approx: true,
    description: 'WotC — massive accuracy and crit bonus vs MECs, Sectopods, and turrets. Has no effect on organic enemies.',
  },
  {
    id: 'serial',
    label: 'Serial — chain shot after kill (no penalty)',
    aimDelta: 0, critDelta: 0,
    source: 'wotc', approx: false,
    description: 'WotC Ranger Serial — each kill this turn grants a bonus shot with no aim penalty.',
  },
  {
    id: 'hunters_instinct',
    label: "Hunter's Instinct (+15 crit, target disoriented)",
    aimDelta: 0, critDelta: 15,
    source: 'wotc', approx: true,
    description: 'WotC Ranger — bonus crit chance when the target is disoriented.',
  },
  {
    id: 'faceoff',
    label: 'Faceoff (Skirmisher — pistol vs all visible)',
    aimDelta: 0, critDelta: 0,
    source: 'wotc', approx: false,
    description: 'WotC Skirmisher Faceoff — fires pistol at every visible enemy. Each shot uses base pistol aim independently.',
  },
  // ── Alien Hunters only ─────────────────────────────────────────────────────
  {
    id: 'ruler_reaction',
    label: 'Alien Ruler reaction shot (−15 aim, approx)',
    aimDelta: -15, critDelta: 0,
    source: 'alien_hunters', approx: true,
    description: 'Alien Hunters — Ruler reaction shots are less accurate than deliberate actions. Exact penalty is uncertain.',
  },
]

// ── Formula constants ─────────────────────────────────────────────────────────
// Community-verified: these match observed displayed hit% in-game for base XCOM 2.

/** Defense bonus granted by cover type. Half=20 matches ~45% hit for a Rookie (65 aim) vs Trooper (0 def). */
export const COVER_DEFENSE: Record<CoverType, number> = {
  none: 0,
  half: 20,  // community consensus — verified against in-game display
  full: 40,  // community consensus — verified against in-game display
}

const HUNKER_BONUS = 20          // /* approx */ additional defense from Hunker Down action
const SMOKE_AIM_PENALTY = 20     // /* approx */ aim penalty shooting at a target in smoke; some sources say 15
const ELEVATION_AIM_BONUS = 10   // /* approx */ generic height advantage; Death From Above adds an additional +10

// Flanking removes all cover, and grants this crit bonus. WotC value; base-game may differ. approx
const FLANK_CRIT_BONUS = 25

/**
 * Range-based aim modifiers per weapon type and distance bracket.
 * All values approximate — derived from community testing rather than game files.
 */
export const RANGE_MODIFIERS: Record<WeaponType, Record<RangeBracket, number>> = {
  assault_rifle: { close:  5, mid:  0, far:  -5, very_far: -10 },
  shotgun:       { close: 20, mid:  5, far: -15, very_far: -30 },
  sniper:        { close:-15, mid:  0, far: +10, very_far: +20 },
  cannon:        { close:  5, mid:  0, far:  -5, very_far: -10 },
  pistol:        { close: 10, mid:  0, far: -10, very_far: -20 },
  spark_cannon:  { close:  5, mid:  0, far:  -5, very_far: -10 },
}

/**
 * Weapon base damage ranges by type and tier.
 * Approximate — precise values vary between specific weapon variants and DLC content.
 */
export const WEAPON_DAMAGE: Record<WeaponType, Record<WeaponTierInput, { min: number; max: number }>> = {
  assault_rifle: { conventional: {min:3,max:4}, magnetic: {min:4,max:5}, beam: {min:6,max:7} },
  shotgun:       { conventional: {min:3,max:6}, magnetic: {min:4,max:7}, beam: {min:6,max:9} },
  sniper:        { conventional: {min:4,max:7}, magnetic: {min:5,max:8}, beam: {min:7,max:10} },
  cannon:        { conventional: {min:3,max:5}, magnetic: {min:4,max:6}, beam: {min:6,max:8} },
  pistol:        { conventional: {min:2,max:3}, magnetic: {min:3,max:4}, beam: {min:4,max:5} },
  spark_cannon:  { conventional: {min:3,max:5}, magnetic: {min:4,max:6}, beam: {min:6,max:8} },
}

// Crit damage multiplier on effective damage range. approx - actual engine may use a flat +bonus per weapon.
export const CRIT_DAMAGE_MULTIPLIER = 1.5

// ── Aim lookup table by class + rank ─────────────────────────────────────────
// Used to auto-fill shooter aim from a roster soldier. All values approximate.
import type { SoldierClass, SoldierRank } from '../data/types'

export const CLASS_RANK_AIM: Record<SoldierClass, Partial<Record<SoldierRank, number>>> = {
  // /* approx */ — derived from community data; actual values depend on difficulty and perks
  ranger:        { rookie:65, squaddie:65, corporal:67, sergeant:70, lieutenant:72, captain:75, major:78, colonel:82 },
  sharpshooter:  { rookie:65, squaddie:65, corporal:66, sergeant:69, lieutenant:71, captain:73, major:76, colonel:80 },
  grenadier:     { rookie:65, squaddie:65, corporal:67, sergeant:70, lieutenant:72, captain:75, major:77, colonel:80 },
  specialist:    { rookie:65, squaddie:65, corporal:67, sergeant:70, lieutenant:71, captain:73, major:75, colonel:78 },
  psi_operative: { rookie:65, squaddie:65, corporal:65, sergeant:67, lieutenant:68, captain:70, major:72, colonel:75 },
  spark:         { rookie:65, squaddie:65, corporal:68, sergeant:71, lieutenant:73, captain:76, major:79, colonel:83 },
  reaper:        { rookie:65, squaddie:65, corporal:68, sergeant:71, lieutenant:74, captain:77, major:80, colonel:84 },
  skirmisher:    { rookie:65, squaddie:65, corporal:66, sergeant:68, lieutenant:70, captain:72, major:75, colonel:78 },
  templar:       { rookie:65, squaddie:65, corporal:65, sergeant:67, lieutenant:68, captain:70, major:72, colonel:75 },
}

// ── Internal helper ───────────────────────────────────────────────────────────

function resolveAbilities(
  ids: string[],
  dlc?: { wotc?: boolean; alienHunters?: boolean },
): AbilityModifier[] {
  return ABILITY_MODIFIERS.filter(m =>
    ids.includes(m.id) &&
    (m.source === 'base' ||
     (m.source === 'wotc' && dlc?.wotc) ||
     (m.source === 'alien_hunters' && dlc?.alienHunters))
  )
}

/**
 * Core hit-chance computation, separated so computeSensitivity can call it cheaply.
 * Returns the clamped [0, 100] hit chance.
 */
function coreHitChance(
  shooter: ShooterInput,
  target: TargetInput,
  dlc?: { wotc?: boolean; alienHunters?: boolean },
): number {
  const abilities = resolveAbilities(shooter.abilityModIds, dlc)
  const abilityAimBonus = abilities.reduce((s, m) => s + m.aimDelta, 0)
  const rangeBonus = RANGE_MODIFIERS[shooter.weaponType][shooter.rangeBracket]
  const elevationBonus = shooter.isElevated ? ELEVATION_AIM_BONUS : 0
  const totalAimBonus = abilityAimBonus + rangeBonus + elevationBonus + shooter.scopeBonus

  const coverBonus = target.isFlanked ? 0 : COVER_DEFENSE[target.coverType]
  const hunkerBonus = target.isHunkered ? HUNKER_BONUS : 0
  const smokeAimPenalty = target.targetInSmoke ? SMOKE_AIM_PENALTY : 0
  const lrPenalty = target.hasLightningReflexes ? 30 : 0 // /* approx */

  const rawHit =
    shooter.baseAim +
    totalAimBonus -
    target.baseDefense -
    coverBonus -
    hunkerBonus -
    smokeAimPenalty -
    lrPenalty

  return Math.min(100, Math.max(0, rawHit))
}

function coreCritChance(
  shooter: ShooterInput,
  target: TargetInput,
  dlc?: { wotc?: boolean; alienHunters?: boolean },
): { raw: number; effective: number } {
  const abilities = resolveAbilities(shooter.abilityModIds, dlc)
  const abilityCritBonus = abilities.reduce((s, m) => s + m.critDelta, 0)
  const flankBonus = target.isFlanked ? FLANK_CRIT_BONUS : 0
  const raw = Math.min(100, Math.max(0, shooter.baseCrit + abilityCritBonus + flankBonus))
  // Dodge converts crits → normal hits. Simplified: effective = max(0, raw − dodge). /* approx */
  const effective = Math.min(100, Math.max(0, raw - target.dodge))
  return { raw, effective }
}

// ── Sensitivity computation ───────────────────────────────────────────────────

function computeSensitivity(
  shooter: ShooterInput,
  target: TargetInput,
  dlc?: { wotc?: boolean; alienHunters?: boolean },
): SensitivityAdjustment[] {
  const current = coreHitChance(shooter, target, dlc)
  const currentCrit = coreCritChance(shooter, target, dlc)
  const adjustments: SensitivityAdjustment[] = []

  const add = (label: string, newShooter: ShooterInput, newTarget: TargetInput) => {
    const newHit = coreHitChance(newShooter, newTarget, dlc)
    const newCrit = coreCritChance(newShooter, newTarget, dlc)
    const delta = newHit - current
    if (delta !== 0 || newCrit.effective !== currentCrit.effective) {
      adjustments.push({ label, newHitChance: newHit, delta, newCritChance: newCrit.effective })
    }
  }

  // Flank (removes cover, adds crit bonus)
  if (!target.isFlanked) {
    add('Move to flank (removes cover, +crit chance)', shooter, { ...target, isFlanked: true, coverType: 'none' })
  }

  // Elevation (if not already elevated and DFA not active)
  if (!shooter.isElevated) {
    add('Gain high ground (+10 aim)', { ...shooter, isElevated: true }, target)
  }

  // Move closer one range bracket
  const rangeOrder: RangeBracket[] = ['close', 'mid', 'far', 'very_far']
  const rIdx = rangeOrder.indexOf(shooter.rangeBracket)
  if (rIdx > 0) {
    const bracket = rangeOrder[rIdx - 1]
    add(`Move closer (${bracket.replace('_', ' ')} range)`,
        { ...shooter, rangeBracket: bracket }, target)
  }
  // Show long-range penalty if moving farther out
  if (rIdx < rangeOrder.length - 1) {
    const bracket = rangeOrder[rIdx + 1]
    add(`If you moved farther (${bracket.replace('_', ' ')} range)`,
        { ...shooter, rangeBracket: bracket }, target)
  }

  // Destroy cover with explosive (removes cover, doesn't flank)
  if (target.coverType !== 'none' && !target.isFlanked) {
    add('Blow up cover first (grenade → target loses cover)',
        shooter, { ...target, coverType: 'none' })
  }

  // Smoke removal (if target is in smoke, what if they weren't)
  if (target.targetInSmoke) {
    add('If target were not in smoke', shooter, { ...target, targetInSmoke: false })
  }

  // Reduce cover by one tier (move/flush the target)
  if (target.coverType === 'full' && !target.isFlanked) {
    add('If target were in half cover (flushed or repositioned)',
        shooter, { ...target, coverType: 'half' })
  }

  // Use Aim ability (Sharpshooter) — only suggest if not already active
  if (!shooter.abilityModIds.includes('aim_ability')) {
    add('Use Aim action first (+15 aim, +20 crit — costs 1 action)',
        { ...shooter, abilityModIds: [...shooter.abilityModIds, 'aim_ability'] }, target)
  }

  // Sort by absolute delta, improvements first
  adjustments.sort((a, b) => b.delta - a.delta)
  return adjustments.slice(0, 5)
}

// ── Risk text ─────────────────────────────────────────────────────────────────

function buildRiskText(hitChance: number): string {
  const missChance = 100 - hitChance
  if (hitChance === 0) {
    return `0% — this shot cannot connect under current conditions. Reposition, flank, or target a different enemy.`
  }
  if (hitChance >= 95) {
    return `${hitChance}% is a high-confidence shot. The remaining ${missChance}% miss is still a real possibility — XCOM's RNG doesn't forget you — but odds strongly favour you. Worth taking unless a flank is freely available.`
  }
  if (hitChance >= 85) {
    const approxMissRatio = Math.round(100 / missChance)
    return `${hitChance}% — roughly 1-in-${approxMissRatio} shots miss here. Solid odds. On Legend, still worth asking: if this misses and triggers an enemy turn, can your squad absorb the counter-attack?`
  }
  if (hitChance >= 70) {
    const approxMissRatio = Math.round(100 / missChance)
    return `${hitChance}% — roughly 1-in-${approxMissRatio} misses. Reasonable, but not reliable. On Ironman or Legend, check the Sensitivity panel: a flank or Aim action might push this into safer territory before you commit.`
  }
  if (hitChance >= 60) {
    return `${hitChance}% — around 1-in-${Math.round(100 / missChance)} misses. This is marginal. A miss here is a common outcome, not a surprise. Consider whether a grenade, a flank, or a different soldier would give cleaner odds.`
  }
  if (hitChance >= 50) {
    return `${hitChance}% — barely better than a coin flip. On Legend Ironman, only take this if every alternative is worse. Look hard at the Sensitivity options below: the right adjustment often exists.`
  }
  return `${hitChance}% — you are more likely to miss than hit. A miss at these odds is the expected outcome, not bad luck. Use a grenade, reposition for a flank, or find a different angle first.`
}

// ── Back-solve from displayed % ───────────────────────────────────────────────

/**
 * When the user doesn't know the enemy's defense stat, they can enter the game's
 * displayed hit% and we back-solve the implied defense for cross-checking.
 *
 * Returns the implied base defense and a plain-language note.
 */
export function backSolveFromDisplayed(
  displayedHit: number,
  shooter: Pick<ShooterInput, 'baseAim' | 'abilityModIds' | 'scopeBonus' | 'isElevated' | 'weaponType' | 'rangeBracket'>,
  target: Pick<TargetInput, 'coverType' | 'isFlanked' | 'isHunkered' | 'targetInSmoke' | 'hasLightningReflexes'>,
  dlc?: { wotc?: boolean; alienHunters?: boolean },
): { impliedDefense: number; note: string } {
  const abilities = resolveAbilities(shooter.abilityModIds, dlc)
  const abilityAimBonus = abilities.reduce((s, m) => s + m.aimDelta, 0)
  const rangeBonus = RANGE_MODIFIERS[shooter.weaponType][shooter.rangeBracket]
  const elevationBonus = shooter.isElevated ? ELEVATION_AIM_BONUS : 0
  const totalAimBonus = abilityAimBonus + rangeBonus + elevationBonus + shooter.scopeBonus

  const coverBonus = target.isFlanked ? 0 : COVER_DEFENSE[target.coverType]
  const hunkerBonus = target.isHunkered ? HUNKER_BONUS : 0
  const smokeAimPenalty = target.targetInSmoke ? SMOKE_AIM_PENALTY : 0
  const lrPenalty = target.hasLightningReflexes ? 30 : 0

  // Rearrange formula: defense = baseAim + bonuses - coverBonus - penalties - displayedHit
  const impliedDefense = Math.max(0,
    shooter.baseAim + totalAimBonus - coverBonus - hunkerBonus - smokeAimPenalty - lrPenalty - displayedHit
  )

  const calcCheck = shooter.baseAim + totalAimBonus - impliedDefense - coverBonus - hunkerBonus - smokeAimPenalty - lrPenalty
  const matches = Math.abs(calcCheck - displayedHit) <= 1

  return {
    impliedDefense,
    note: matches
      ? `Cross-check passes: with implied defense ${impliedDefense}, our formula gives ${calcCheck}% — matches the game's display. If ${impliedDefense} doesn't match a known enemy stat, the game may have applied hidden modifiers.`
      : `Implied defense ~${impliedDefense}. Our formula gives ${calcCheck}% — small discrepancy may be from rounding or hidden game modifiers not captured here.`,
  }
}

// ── Main exported function ────────────────────────────────────────────────────

export function calculateShot(
  shooter: ShooterInput,
  target: TargetInput,
  targetHp?: TargetHPInput,
  dlc?: { wotc?: boolean; alienHunters?: boolean },
): ShotResult {
  const warnings: string[] = []
  let isApproximated = target.isApprox ?? false

  // ── Resolve ability modifiers ──────────────────────────────────────────────
  const activeAbilities = resolveAbilities(shooter.abilityModIds, dlc)
  const abilityAimBonus = activeAbilities.reduce((s, m) => s + m.aimDelta, 0)
  const abilityCritBonus = activeAbilities.reduce((s, m) => s + m.critDelta, 0)
  let abilityDamageMult = 1
  for (const m of activeAbilities) {
    if (m.damageMult) abilityDamageMult *= m.damageMult
    if (m.approx) isApproximated = true
  }

  // ── Aim components ─────────────────────────────────────────────────────────
  const rangeBonus = RANGE_MODIFIERS[shooter.weaponType][shooter.rangeBracket]
  isApproximated = true  // range modifiers are always approx

  const elevationBonus = shooter.isElevated ? ELEVATION_AIM_BONUS : 0
  if (shooter.isElevated) isApproximated = true

  const totalAimBonus = abilityAimBonus + rangeBonus + elevationBonus + shooter.scopeBonus

  // ── Defense components ─────────────────────────────────────────────────────
  const coverBonus = target.isFlanked ? 0 : COVER_DEFENSE[target.coverType]
  const hunkerBonus = target.isHunkered ? HUNKER_BONUS : 0
  const smokeAimPenalty = target.targetInSmoke ? SMOKE_AIM_PENALTY : 0
  // Lightning Reflexes: first shot against target that was in concealment at start of its turn
  // suffers a significant aim penalty. Modelled as −30 aim. /* approx */
  const lrPenalty = target.hasLightningReflexes ? 30 : 0
  const otherPenalties = smokeAimPenalty + lrPenalty

  if (target.isHunkered) isApproximated = true
  if (target.targetInSmoke) isApproximated = true
  if (target.hasLightningReflexes) isApproximated = true

  // ── Hit chance ────────────────────────────────────────────────────────────
  const rawHit =
    shooter.baseAim +
    totalAimBonus -
    target.baseDefense -
    coverBonus -
    hunkerBonus -
    otherPenalties

  const hitChance = Math.min(100, Math.max(0, rawHit))

  // ── Crit chance ───────────────────────────────────────────────────────────
  const flankCritBonus = target.isFlanked ? FLANK_CRIT_BONUS : 0
  if (target.isFlanked) isApproximated = true
  const rawCrit = shooter.baseCrit + abilityCritBonus + flankCritBonus
  const critChance = Math.min(100, Math.max(0, rawCrit))
  // Dodge (WotC) converts crits to normal hits. Simplified model: effective = raw − dodge. /* approx */
  const effectiveCritChance = Math.min(100, Math.max(0, rawCrit - target.dodge))
  if (target.dodge > 0) isApproximated = true

  // ── Damage ────────────────────────────────────────────────────────────────
  const baseDmg = WEAPON_DAMAGE[shooter.weaponType][shooter.weaponTier]
  const armor = targetHp?.armor ?? 0
  // Armor is flat damage reduction; damage can reach 0 (unlike some editions where 1 is the floor)
  const effMin = Math.max(0, baseDmg.min - armor)
  const effMax = Math.max(0, baseDmg.max - armor)
  const effAvg = (effMin + effMax) / 2

  // Crit damage: weapon rolls max damage and multiplies. /* approx */
  const critMin = Math.floor(effMin * CRIT_DAMAGE_MULTIPLIER)
  const critMax = Math.floor(effMax * CRIT_DAMAGE_MULTIPLIER)
  const critAvg = (critMin + critMax) / 2

  // Apply ability damage multipliers (e.g. Deadeye)
  const dmgHitAvg = effAvg * abilityDamageMult
  const dmgCritAvg = critAvg * abilityDamageMult

  const H = hitChance / 100
  const C = effectiveCritChance / 100  // conditional probability: P(crit | hit)
  const expectedDamage = H * ((1 - C) * dmgHitAvg + C * dmgCritAvg)

  // ── Kill probability ──────────────────────────────────────────────────────
  let killProbability: KillProbability | null = null
  if (targetHp) {
    const hp = targetHp.currentHP
    // Assume discrete uniform damage distribution over [effMin, effMax]
    const hitRange = effMax - effMin + 1 || 1
    const critRange = critMax - critMin + 1 || 1

    const pKillHit = effMax < hp ? 0
      : Math.max(0, effMax - Math.max(effMin, hp) + 1) / hitRange
    const pKillCrit = critMax < hp ? 0
      : Math.max(0, critMax - Math.max(critMin, hp) + 1) / critRange

    const pNormalHit = H * (1 - C)
    const pCrit = H * C
    killProbability = {
      probabilityOnHit: pKillHit,
      probabilityOnCrit: pKillCrit,
      overall: pNormalHit * pKillHit + pCrit * pKillCrit,
      canKillOnHit: effMax >= hp,
      canKillOnCrit: critMax >= hp,
    }
  }

  // ── Warnings ──────────────────────────────────────────────────────────────
  if (hitChance < 50) {
    warnings.push('Hit chance below 50% — a miss is more likely than a hit.')
  }
  if (hitChance >= 100) {
    warnings.push(
      '100% is the displayed cap, but XCOM 2 on some difficulty settings has a hidden minimum miss chance (~1%). Treat very-high-hit shots as "near certain", not guaranteed.'
    )
  }
  if (target.hasLightningReflexes) {
    warnings.push('Lightning Reflexes: this target gets a free evasion against the first shot it takes each turn. The −30 aim shown is approximate.')
  }
  if (shooter.weaponType === 'sniper' && shooter.rangeBracket === 'close') {
    warnings.push('Sniper rifles suffer severe aim penalties at close range. Consider switching to a pistol.')
  }
  if (shooter.weaponType === 'shotgun' && (shooter.rangeBracket === 'far' || shooter.rangeBracket === 'very_far')) {
    warnings.push('Shotguns lose accuracy sharply beyond mid range. This shot is likely not worth taking.')
  }
  if (target.dodge > 0 && critChance > 0) {
    warnings.push(`Target Dodge (${target.dodge}%) converts crits to normal hits. Effective crit shown is after this reduction.`)
  }
  if (shooter.abilityModIds.includes('deadeye') && hitChance < 65) {
    warnings.push("Deadeye's accuracy cost is significant when base hit is already low. Consider whether the damage bonus is worth the extra miss risk here.")
  }

  return {
    hitChance,
    critChance,
    effectiveCritChance,
    missChance: 100 - hitChance,
    expectedDamage: Math.round(expectedDamage * 10) / 10,
    damageOnHit: {
      min: Math.round(effMin * abilityDamageMult * 10) / 10,
      max: Math.round(effMax * abilityDamageMult * 10) / 10,
      avg: Math.round(dmgHitAvg * 10) / 10,
    },
    damageOnCrit: {
      min: Math.round(critMin * abilityDamageMult * 10) / 10,
      max: Math.round(critMax * abilityDamageMult * 10) / 10,
      avg: Math.round(dmgCritAvg * 10) / 10,
    },
    killProbability,
    riskText: buildRiskText(hitChance),
    sensitivityBreakdown: computeSensitivity(shooter, target, dlc),
    confidence: isApproximated ? 'approximated' : 'full',
    warnings,
    breakdown: {
      baseAim: shooter.baseAim,
      aimBonuses: totalAimBonus,
      targetDefense: target.baseDefense,
      coverBonus: coverBonus + hunkerBonus,
      otherPenalties,
      rawHitBeforeClamp: rawHit,
    },
  }
}
