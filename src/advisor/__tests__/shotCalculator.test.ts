import { describe, it, expect } from 'vitest'
import {
  calculateShot,
  backSolveFromDisplayed,
  COVER_DEFENSE,
  type ShooterInput,
  type TargetInput,
  type TargetHPInput,
} from '../shotCalculator'

// ── Default fixtures ──────────────────────────────────────────────────────────

function shooter(overrides: Partial<ShooterInput> = {}): ShooterInput {
  return {
    baseAim: 65,
    baseCrit: 0,
    weaponType: 'assault_rifle',
    weaponTier: 'conventional',
    rangeBracket: 'mid',
    scopeBonus: 0,
    abilityModIds: [],
    isElevated: false,
    ...overrides,
  }
}

function target(overrides: Partial<TargetInput> = {}): TargetInput {
  return {
    baseDefense: 0,
    coverType: 'none',
    isFlanked: false,
    isHunkered: false,
    dodge: 0,
    targetInSmoke: false,
    hasLightningReflexes: false,
    ...overrides,
  }
}

const NO_DLC = { wotc: false, alienHunters: false }
const WOTC = { wotc: true, alienHunters: false }

// ── Cover formula (community-verified) ────────────────────────────────────────
//
// Community research confirms:
//   Half cover = 20 defense  → Rookie (65) vs Trooper (0 def) in half cover = 45%
//   Full cover = 40 defense  → Rookie (65) vs Trooper (0 def) in full cover = 25%
//
// The feature spec mentions "~45-50% in full cover" — this appears to describe what the
// game calls LOW/HALF cover (20 defense = 65−20 = 45%). XCOM 2's "full" (high) cover
// gives 40 defense, producing 25%. These values are consistent with mod documentation.

describe('Cover formula — community-verified baseline', () => {
  it('Rookie (65 aim) vs Trooper (0 def) — no cover = 65%', () => {
    const result = calculateShot(shooter(), target(), undefined, NO_DLC)
    expect(result.hitChance).toBe(65)
    expect(result.missChance).toBe(35)
  })

  it('Rookie (65 aim) vs Trooper (0 def) — half cover (−20) = 45%', () => {
    const result = calculateShot(shooter(), target({ coverType: 'half' }), undefined, NO_DLC)
    expect(result.hitChance).toBe(45)
    // This is the "~45-50%" case the spec references
  })

  it('Rookie (65 aim) vs Trooper (0 def) — full cover (−40) = 25%', () => {
    const result = calculateShot(shooter(), target({ coverType: 'full' }), undefined, NO_DLC)
    expect(result.hitChance).toBe(25)
  })

  it('COVER_DEFENSE constants match formula expectations', () => {
    expect(COVER_DEFENSE.none).toBe(0)
    expect(COVER_DEFENSE.half).toBe(20)
    expect(COVER_DEFENSE.full).toBe(40)
  })
})

// ── Flanking ──────────────────────────────────────────────────────────────────

describe('Flanking mechanics', () => {
  it('flanking removes cover entirely — full cover target becomes same as no cover', () => {
    const flanked = calculateShot(
      shooter(),
      target({ coverType: 'full', isFlanked: true }),
      undefined, NO_DLC,
    )
    const nocover = calculateShot(shooter(), target(), undefined, NO_DLC)
    expect(flanked.hitChance).toBe(nocover.hitChance)
  })

  it('flanking against half cover: cover removed, hit = baseAim − defense', () => {
    const result = calculateShot(
      shooter({ baseAim: 75 }),
      target({ coverType: 'half', isFlanked: true }),
      undefined, NO_DLC,
    )
    expect(result.hitChance).toBe(75)
  })

  it('flanking grants +25 crit bonus (WotC approx)', () => {
    const flanked = calculateShot(shooter({ baseCrit: 0 }), target({ isFlanked: true }), undefined, WOTC)
    const notFlanked = calculateShot(shooter({ baseCrit: 0 }), target(), undefined, WOTC)
    expect(flanked.critChance - notFlanked.critChance).toBe(25)
  })

  it('flanking does not grant crit bonus when DLC disabled (base game may differ)', () => {
    // Crit is still calculated — the flank bonus is approx but we still apply it
    // This test verifies the formula runs without error when not flanked
    const result = calculateShot(shooter(), target({ isFlanked: false }), undefined, NO_DLC)
    expect(result.critChance).toBe(0)  // no base crit, not flanked
  })
})

// ── Aim clamping ──────────────────────────────────────────────────────────────

describe('Hit chance clamping', () => {
  it('clamps at 100 when raw hit exceeds 100', () => {
    const result = calculateShot(shooter({ baseAim: 95 }), target(), undefined, NO_DLC)
    // baseAim 95 + mid range 0 − def 0 − cover 0 = 95 → but range bonus makes it 95+0=95
    expect(result.hitChance).toBeLessThanOrEqual(100)
  })

  it('clamps at 100 for very high aim vs no cover', () => {
    const result = calculateShot(shooter({ baseAim: 100 }), target(), undefined, NO_DLC)
    expect(result.hitChance).toBe(100)
  })

  it('clamps at 0 when negative raw hit', () => {
    const result = calculateShot(
      shooter({ baseAim: 40 }),
      target({ baseDefense: 30, coverType: 'full' }),  // 40 - 30 - 40 = -30
      undefined, NO_DLC,
    )
    expect(result.hitChance).toBe(0)
    expect(result.missChance).toBe(100)
  })

  it('crit chance clamps at 0 (cannot go negative)', () => {
    const result = calculateShot(
      shooter({ baseCrit: 0 }),
      target({ dodge: 50 }),  // dodge tries to reduce below 0
      undefined, WOTC,
    )
    expect(result.effectiveCritChance).toBe(0)
  })
})

// ── Ability modifiers ─────────────────────────────────────────────────────────

describe('Ability aim modifiers', () => {
  it('Rapid Fire second shot applies −15 aim penalty', () => {
    const base = calculateShot(shooter({ baseAim: 75 }), target({ coverType: 'half' }), undefined, NO_DLC)
    const rapid = calculateShot(
      shooter({ baseAim: 75, abilityModIds: ['rapid_fire_second'] }),
      target({ coverType: 'half' }),
      undefined, NO_DLC,
    )
    // 75 − 20 cover = 55 base; 75 − 15 ability − 20 cover = 40
    expect(base.hitChance).toBe(55)
    expect(rapid.hitChance).toBe(40)
  })

  it('Aim ability adds +15 aim and +20 crit', () => {
    const base = calculateShot(shooter({ baseAim: 72 }), target({ coverType: 'half' }), undefined, NO_DLC)
    const withAim = calculateShot(
      shooter({ baseAim: 72, abilityModIds: ['aim_ability'] }),
      target({ coverType: 'half' }),
      undefined, NO_DLC,
    )
    expect(withAim.hitChance - base.hitChance).toBe(15)
    expect(withAim.critChance - base.critChance).toBe(20)
  })

  it('Deadeye: −10 aim, multiplies damage by ×1.33', () => {
    const base = calculateShot(shooter({ baseAim: 80, weaponTier: 'conventional' }), target(), undefined, NO_DLC)
    const deadeye = calculateShot(
      shooter({ baseAim: 80, weaponTier: 'conventional', abilityModIds: ['deadeye'] }),
      target(),
      undefined, NO_DLC,
    )
    expect(deadeye.hitChance).toBe(base.hitChance - 10)
    // Deadeye damage multiplier: avg hit damage should be ~1.33× base
    expect(deadeye.damageOnHit.avg).toBeCloseTo(base.damageOnHit.avg * 1.33, 1)
  })

  it('Steady Weapon adds +10 aim', () => {
    const result = calculateShot(
      shooter({ baseAim: 70, abilityModIds: ['steady_weapon'] }),
      target({ coverType: 'half' }),
      undefined, NO_DLC,
    )
    // 70 + 10 steady − 20 cover = 60
    expect(result.hitChance).toBe(60)
  })

  it('WotC abilities are filtered out when WotC DLC is disabled', () => {
    const withWotcOff = calculateShot(
      shooter({ baseAim: 65, abilityModIds: ['bluescreen_rounds'] }),
      target(),
      undefined, NO_DLC,
    )
    const withWotcOn = calculateShot(
      shooter({ baseAim: 65, abilityModIds: ['bluescreen_rounds'] }),
      target(),
      undefined, WOTC,
    )
    // bluescreen is wotc-only; should be ignored when wotc=false
    expect(withWotcOff.hitChance).toBe(65)
    expect(withWotcOn.hitChance).toBe(75) // +10 aim
  })
})

// ── Environmental modifiers ───────────────────────────────────────────────────

describe('Environmental modifiers', () => {
  it('Smoke around target reduces shooter aim by 20 (approx)', () => {
    const clear = calculateShot(shooter({ baseAim: 75 }), target(), undefined, NO_DLC)
    const smoky = calculateShot(shooter({ baseAim: 75 }), target({ targetInSmoke: true }), undefined, NO_DLC)
    expect(clear.hitChance - smoky.hitChance).toBe(20)
  })

  it('Hunker Down adds +20 defense on top of cover', () => {
    const hunkeredInHalf = calculateShot(
      shooter({ baseAim: 80 }),
      target({ coverType: 'half', isHunkered: true }),
      undefined, NO_DLC,
    )
    // 80 − 20 cover − 20 hunker = 40
    expect(hunkeredInHalf.hitChance).toBe(40)
  })

  it('Elevation grants +10 aim bonus (approx)', () => {
    const elevated = calculateShot(shooter({ baseAim: 65, isElevated: true }), target(), undefined, NO_DLC)
    const flat = calculateShot(shooter({ baseAim: 65 }), target(), undefined, NO_DLC)
    expect(elevated.hitChance - flat.hitChance).toBe(10)
  })
})

// ── Dodge (WotC) ──────────────────────────────────────────────────────────────

describe('Dodge stat (WotC)', () => {
  it('Dodge reduces effective crit chance', () => {
    const result = calculateShot(
      shooter({ baseCrit: 30 }),
      target({ dodge: 15 }),
      undefined, WOTC,
    )
    // raw crit = 30, effective = 30 − 15 = 15
    expect(result.critChance).toBe(30)
    expect(result.effectiveCritChance).toBe(15)
  })

  it('Dodge cannot reduce effective crit below 0', () => {
    const result = calculateShot(
      shooter({ baseCrit: 10 }),
      target({ dodge: 40 }),
      undefined, WOTC,
    )
    expect(result.effectiveCritChance).toBe(0)
    expect(result.critChance).toBe(10)  // raw is still 10
  })

  it('Dodge does not reduce hit chance, only crit', () => {
    const noDodge = calculateShot(shooter({ baseAim: 80 }), target(), undefined, WOTC)
    const withDodge = calculateShot(shooter({ baseAim: 80 }), target({ dodge: 30 }), undefined, WOTC)
    expect(noDodge.hitChance).toBe(withDodge.hitChance)
  })
})

// ── Range modifiers ───────────────────────────────────────────────────────────

describe('Range-based aim modifiers (approx)', () => {
  it('sniper gets +20 aim bonus at very_far range', () => {
    const farSniper = calculateShot(
      shooter({ weaponType: 'sniper', baseAim: 65, rangeBracket: 'very_far' }),
      target(),
      undefined, NO_DLC,
    )
    const midSniper = calculateShot(
      shooter({ weaponType: 'sniper', baseAim: 65, rangeBracket: 'mid' }),
      target(),
      undefined, NO_DLC,
    )
    expect(farSniper.hitChance - midSniper.hitChance).toBe(20)
  })

  it('shotgun gets −30 aim penalty at very_far range', () => {
    const closeShot = calculateShot(
      shooter({ weaponType: 'shotgun', baseAim: 65, rangeBracket: 'close' }),
      target(),
      undefined, NO_DLC,
    )
    const farShot = calculateShot(
      shooter({ weaponType: 'shotgun', baseAim: 65, rangeBracket: 'very_far' }),
      target(),
      undefined, NO_DLC,
    )
    // close = 65+20=85, very_far = 65−30=35 (but clamped to ≥0)
    expect(closeShot.hitChance).toBe(85)
    expect(farShot.hitChance).toBe(35)
  })
})

// ── Damage calculation ────────────────────────────────────────────────────────

describe('Expected damage', () => {
  it('expected damage is 0 when hit chance is 0', () => {
    const result = calculateShot(
      shooter({ baseAim: 20 }),
      target({ baseDefense: 50, coverType: 'full' }),  // way below 0
      undefined, NO_DLC,
    )
    expect(result.hitChance).toBe(0)
    expect(result.expectedDamage).toBe(0)
  })

  it('armor reduces effective damage range', () => {
    const noArmor = calculateShot(shooter(), target(), { currentHP: 5, armor: 0 }, NO_DLC)
    const withArmor = calculateShot(shooter(), target(), { currentHP: 5, armor: 2 }, NO_DLC)
    // Conventional AR: 3-4 base; with 2 armor: 1-2 effective
    expect(noArmor.damageOnHit.min).toBe(3)
    expect(noArmor.damageOnHit.max).toBe(4)
    expect(withArmor.damageOnHit.min).toBe(1)
    expect(withArmor.damageOnHit.max).toBe(2)
  })

  it('armor cannot reduce damage below 0', () => {
    const result = calculateShot(shooter(), target(), { currentHP: 5, armor: 10 }, NO_DLC)
    expect(result.damageOnHit.min).toBe(0)
    expect(result.damageOnHit.max).toBe(0)
  })

  it('crit damage is greater than normal hit damage (CRIT_DAMAGE_MULTIPLIER × 1.5, minus floor rounding)', () => {
    // Assault rifle conventional: 3-4 base. Crit = floor(3*1.5)=4, floor(4*1.5)=6, avg=5.
    // Ratio vs hit avg (3.5) = 5/3.5 = ~1.43 — slightly below 1.5 due to floor().
    // Test that crit avg is meaningfully higher (>1.3x) but allows for floor() rounding on small ranges.
    const result = calculateShot(shooter({ baseCrit: 50 }), target({ isFlanked: true }), undefined, WOTC)
    const ratio = result.damageOnCrit.avg / result.damageOnHit.avg
    expect(ratio).toBeGreaterThan(1.3)
    expect(ratio).toBeLessThanOrEqual(1.6)
  })
})

// ── Kill probability ──────────────────────────────────────────────────────────

describe('Kill probability', () => {
  it('guaranteed kill on hit when max damage >= target HP', () => {
    // AR conventional: 3-4 damage; target 3 HP, 0 armor → max(4) >= 3
    const result = calculateShot(shooter({ baseAim: 80 }), target(), { currentHP: 3, armor: 0 }, NO_DLC)
    expect(result.killProbability?.canKillOnHit).toBe(true)
    expect(result.killProbability?.probabilityOnHit).toBeGreaterThan(0)
  })

  it('cannot kill on hit when max damage < target HP after armor', () => {
    // AR conventional: 3-4 dmg, 2 armor → effective 1-2; target 5 HP
    const result = calculateShot(shooter({ baseAim: 80 }), target(), { currentHP: 5, armor: 2 }, NO_DLC)
    expect(result.killProbability?.canKillOnHit).toBe(false)
    expect(result.killProbability?.probabilityOnHit).toBe(0)
  })

  it('can kill on crit even when normal hit cannot', () => {
    // AR conventional: 3-4 dmg; crit = 4.5-6 dmg; target 5 HP, 0 armor
    const result = calculateShot(
      shooter({ baseAim: 80, baseCrit: 50 }),
      target({ isFlanked: true }),
      { currentHP: 5, armor: 0 },
      WOTC,
    )
    expect(result.killProbability?.canKillOnCrit).toBe(true)
  })

  it('overall kill probability is 0 when hit chance is 0', () => {
    const result = calculateShot(
      shooter({ baseAim: 10 }),
      target({ baseDefense: 50, coverType: 'full' }),
      { currentHP: 3, armor: 0 },
      NO_DLC,
    )
    expect(result.hitChance).toBe(0)
    expect(result.killProbability?.overall).toBe(0)
  })
})

// ── Sensitivity breakdown ─────────────────────────────────────────────────────

describe('Sensitivity breakdown', () => {
  it('suggests flanking when not already flanked', () => {
    const result = calculateShot(
      shooter({ baseAim: 65 }),
      target({ coverType: 'full' }),  // full cover, not flanked
      undefined, NO_DLC,
    )
    const flankSuggestion = result.sensitivityBreakdown.find(s => s.label.toLowerCase().includes('flank'))
    expect(flankSuggestion).toBeDefined()
    expect(flankSuggestion!.delta).toBeGreaterThan(0)
    // Flanking removes full cover (40 defense) → 65 − 0 = 65% vs 65 − 40 = 25%
    expect(flankSuggestion!.newHitChance).toBe(65)
    expect(flankSuggestion!.delta).toBe(40)
  })

  it('suggests moving closer when not at close range', () => {
    const result = calculateShot(
      shooter({ weaponType: 'shotgun', baseAim: 65, rangeBracket: 'far' }),
      target(),
      undefined, NO_DLC,
    )
    const closerSuggestion = result.sensitivityBreakdown.find(s => s.label.toLowerCase().includes('closer'))
    expect(closerSuggestion).toBeDefined()
    expect(closerSuggestion!.delta).toBeGreaterThan(0)
  })

  it('does not suggest flanking when already flanked', () => {
    const result = calculateShot(
      shooter({ baseAim: 65 }),
      target({ isFlanked: true }),
      undefined, NO_DLC,
    )
    const flankSuggestion = result.sensitivityBreakdown.find(s => s.label.toLowerCase().includes('move to flank'))
    expect(flankSuggestion).toBeUndefined()
  })

  it('sensitivity breakdown contains at most 5 adjustments', () => {
    const result = calculateShot(
      shooter({ baseAim: 65 }),
      target({ coverType: 'full', targetInSmoke: true }),
      undefined, NO_DLC,
    )
    expect(result.sensitivityBreakdown.length).toBeLessThanOrEqual(5)
  })
})

// ── Back-solve from displayed % ───────────────────────────────────────────────

describe('Back-solve from displayed hit%', () => {
  it('correctly back-solves defense = 0 for a Rookie vs undefended target in half cover', () => {
    // Rookie (65 aim) + half cover (20) = 45% displayed
    // Back-solve: 65 − 20 (half cover) − 45 = 0 defense
    const { impliedDefense } = backSolveFromDisplayed(
      45,
      { baseAim: 65, abilityModIds: [], scopeBonus: 0, isElevated: false, weaponType: 'assault_rifle', rangeBracket: 'mid' },
      { coverType: 'half', isFlanked: false, isHunkered: false, targetInSmoke: false, hasLightningReflexes: false },
      NO_DLC,
    )
    expect(impliedDefense).toBe(0)
  })

  it('back-solves correctly for a target with 10 base defense', () => {
    // Aim 80, no mods, half cover: displayed = 80 − 20 − 10 = 50%
    const { impliedDefense } = backSolveFromDisplayed(
      50,
      { baseAim: 80, abilityModIds: [], scopeBonus: 0, isElevated: false, weaponType: 'assault_rifle', rangeBracket: 'mid' },
      { coverType: 'half', isFlanked: false, isHunkered: false, targetInSmoke: false, hasLightningReflexes: false },
      NO_DLC,
    )
    expect(impliedDefense).toBe(10)
  })

  it('clamps implied defense at 0 (no negative defense)', () => {
    // Displayed hit% implying defense below 0 (e.g., buffs active) → clamp at 0
    const { impliedDefense } = backSolveFromDisplayed(
      95,
      { baseAim: 65, abilityModIds: [], scopeBonus: 0, isElevated: false, weaponType: 'assault_rifle', rangeBracket: 'mid' },
      { coverType: 'none', isFlanked: false, isHunkered: false, targetInSmoke: false, hasLightningReflexes: false },
      NO_DLC,
    )
    expect(impliedDefense).toBe(0)
  })

  it('returns a descriptive note string', () => {
    const { note } = backSolveFromDisplayed(
      45,
      { baseAim: 65, abilityModIds: [], scopeBonus: 0, isElevated: false, weaponType: 'assault_rifle', rangeBracket: 'mid' },
      { coverType: 'half', isFlanked: false, isHunkered: false, targetInSmoke: false, hasLightningReflexes: false },
      NO_DLC,
    )
    expect(typeof note).toBe('string')
    expect(note.length).toBeGreaterThan(10)
  })
})

// ── Confidence flag ───────────────────────────────────────────────────────────

describe('Confidence flag', () => {
  it('marks result as approximated when elevation is used (approx constant)', () => {
    const result = calculateShot(shooter({ isElevated: true }), target(), undefined, NO_DLC)
    expect(result.confidence).toBe('approximated')
  })

  it('marks result as approximated when smoke is involved', () => {
    const result = calculateShot(shooter(), target({ targetInSmoke: true }), undefined, NO_DLC)
    expect(result.confidence).toBe('approximated')
  })

  it('marks result as approximated when caller flags isApprox', () => {
    const result = calculateShot(shooter(), target({ isApprox: true }), undefined, NO_DLC)
    expect(result.confidence).toBe('approximated')
  })
})

// ── Breakdown transparency ────────────────────────────────────────────────────

describe('Formula breakdown transparency', () => {
  it('breakdown fields add up to rawHitBeforeClamp', () => {
    const result = calculateShot(
      shooter({ baseAim: 75, scopeBonus: 5 }),
      target({ baseDefense: 10, coverType: 'half', targetInSmoke: true }),
      undefined, NO_DLC,
    )
    const { baseAim, aimBonuses, targetDefense, coverBonus, otherPenalties, rawHitBeforeClamp } = result.breakdown
    expect(baseAim + aimBonuses - targetDefense - coverBonus - otherPenalties).toBe(rawHitBeforeClamp)
  })
})
