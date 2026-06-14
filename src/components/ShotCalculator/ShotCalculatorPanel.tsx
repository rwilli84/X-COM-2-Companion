import { useState, useEffect, useMemo } from 'react'
import { nanoid } from 'nanoid'
import { useCampaignStore } from '../../store/campaignStore'
import { db } from '../../db/database'
import type { ShotProfile } from '../../db/database'
import {
  CHOSEN_STRENGTHS,
  CHOSEN_WEAKNESSES,
  type ChosenType,
  type ChosenStrengthId,
  type ChosenWeaknessId,
} from '../../data/chosen'
import {
  calculateShot,
  backSolveFromDisplayed,
  ABILITY_MODIFIERS,
  CLASS_RANK_AIM,
  WEAPON_DAMAGE,
  type ShooterInput,
  type TargetInput,
  type TargetHPInput,
  type ShotResult,
  type WeaponType,
  type WeaponTierInput,
  type RangeBracket,
  type CoverType,
} from '../../advisor/shotCalculator'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'

// ── Internal sub-components ───────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text3)' }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function Stepper({
  label, value, onChange, min = 0, max = 100, step = 1, unit = '',
}: {
  label: string; value: number; onChange: (n: number) => void
  min?: number; max?: number; step?: number; unit?: string
}) {
  return (
    <div>
      <div className="field-label mb-1">{label}</div>
      <div className="flex items-center gap-0 rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border2)' }}>
        <button
          className="px-3 py-2.5 text-base font-mono font-bold leading-none transition-colors"
          style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`Decrease ${label}`}
        >−</button>
        <div
          className="flex-1 text-center text-base font-mono font-bold"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          {value}{unit}
        </div>
        <button
          className="px-3 py-2.5 text-base font-mono font-bold leading-none transition-colors"
          style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          onClick={() => onChange(Math.min(max, value + step))}
          aria-label={`Increase ${label}`}
        >+</button>
      </div>
    </div>
  )
}

function ButtonGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="field-label mb-1">{label}</div>
      <div className="flex rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border2)' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 text-[11px] font-mono font-semibold uppercase tracking-wide transition-colors ${
              value === opt.value
                ? 'bg-amber-500 text-neutral-950'
                : 'hover:text-neutral-300'
            }`}
            style={value !== opt.value ? { background: 'var(--surface2)', color: 'var(--text3)' } : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Toggle({
  label, checked, onChange, note,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; note?: string
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <div className="mt-px relative shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div
          className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-amber-500' : ''}`}
          style={!checked ? { background: 'var(--border2)' } : undefined}
        />
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform ${checked ? 'translate-x-4 bg-neutral-950' : 'translate-x-0.5 bg-neutral-400'}`}
        />
      </div>
      <div>
        <span className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{label}</span>
        {note && <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{note}</div>}
      </div>
    </label>
  )
}

// ── Stat display cards ────────────────────────────────────────────────────────

function BigStat({
  label, value, sub, color = 'amber',
}: {
  label: string; value: string; sub?: string; color?: 'amber' | 'red' | 'green' | 'muted'
}) {
  const textColor = color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : undefined
  return (
    <div className="px-3 py-2.5 rounded-[2px] border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className={`text-2xl font-mono font-bold ${textColor ?? ''}`} style={!textColor ? { color: 'var(--text2)' } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

// ── Compare slot type ────────────────────────────────────────────────────────

interface CompareSlot {
  id: string
  label: string
  result: ShotResult
}

// ── Default input values ──────────────────────────────────────────────────────

const DEFAULT_SHOOTER: ShooterInput = {
  baseAim: 65,
  baseCrit: 0,
  weaponType: 'assault_rifle',
  weaponTier: 'conventional',
  rangeBracket: 'mid',
  scopeBonus: 0,
  abilityModIds: [],
  isElevated: false,
}

const DEFAULT_TARGET: TargetInput = {
  baseDefense: 0,
  coverType: 'none',
  isFlanked: false,
  isHunkered: false,
  dodge: 0,
  targetInSmoke: false,
  hasLightningReflexes: false,
}

// ── Main component ────────────────────────────────────────────────────────────

type CalcMode = 'full' | 'quick'

export function ShotCalculatorPanel() {
  const { activeCampaign, campaignSoldiers, campaignChosen } = useCampaignStore()
  const campaign = activeCampaign()
  const dlc = campaign?.dlc ?? { wotc: false, alienHunters: false }
  const soldiers = campaignSoldiers().filter(s => s.status === 'ready' || s.status === 'tired')

  const [mode, setMode] = useState<CalcMode>('full')
  const [shooter, setShooter] = useState<ShooterInput>(DEFAULT_SHOOTER)
  const [target, setTarget] = useState<TargetInput>(DEFAULT_TARGET)
  const [targetHp, setTargetHp] = useState<TargetHPInput>({ currentHP: 4, armor: 0 })
  const [useHp, setUseHp] = useState(false)
  const [displayedHit, setDisplayedHit] = useState(65) // quick mode input
  const [result, setResult] = useState<ShotResult | null>(null)
  const [compareSlots, setCompareSlots] = useState<CompareSlot[]>([])
  const [profiles, setProfiles] = useState<ShotProfile[]>([])
  const [saveName, setSaveName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showAbilities, setShowAbilities] = useState(false)
  const [isChosenTarget, setIsChosenTarget] = useState(false)
  const [chosenTargetType, setChosenTargetType] = useState<ChosenType>('assassin')

  // Load profiles for this campaign from IndexedDB
  useEffect(() => {
    if (!campaign) return
    db.shotProfiles.where('campaignId').equals(campaign.id).toArray().then(setProfiles)
  }, [campaign?.id])

  const setS = <K extends keyof ShooterInput>(k: K, v: ShooterInput[K]) =>
    setShooter(p => ({ ...p, [k]: v }))
  const setT = <K extends keyof TargetInput>(k: K, v: TargetInput[K]) =>
    setTarget(p => ({ ...p, [k]: v }))

  const toggleAbilityMod = (id: string) => {
    setShooter(p => ({
      ...p,
      abilityModIds: p.abilityModIds.includes(id)
        ? p.abilityModIds.filter(x => x !== id)
        : [...p.abilityModIds, id],
    }))
  }

  // Filter ability modifiers by DLC
  const availableAbilities = ABILITY_MODIFIERS.filter(m =>
    m.source === 'base' ||
    (m.source === 'wotc' && dlc.wotc) ||
    (m.source === 'alien_hunters' && dlc.alienHunters)
  )

  // Chosen target data (WotC Feature 3)
  const chosenRecord = isChosenTarget && dlc.wotc
    ? campaignChosen().find(c => c.chosenType === chosenTargetType)
    : null
  const chosenStrengths = chosenRecord
    ? chosenRecord.strengths.map(id => CHOSEN_STRENGTHS[id as ChosenStrengthId]).filter(Boolean)
    : []
  const chosenWeaknesses = chosenRecord
    ? chosenRecord.weaknesses.map(id => CHOSEN_WEAKNESSES[id as ChosenWeaknessId]).filter(Boolean)
    : []
  const hasDamageImmunity = chosenStrengths.some(s => s.id === 'damage_immunity')
  const hasRegen = chosenStrengths.find(s => s.id === 'regen')
  const hasArmor = chosenStrengths.find(s => s.id === 'armor')
  const hasDodgeStrength = chosenStrengths.find(s => s.id === 'dodge')

  // Graze computation when Chosen has Dodge strength
  const chosenDodgeValue = hasDodgeStrength?.dodgeValue ?? 0
  const rawCritForGraze = shooter.baseCrit
  const overflowDodge = Math.max(0, chosenDodgeValue - rawCritForGraze)
  const nonCritHitChance = result ? (result.hitChance - result.effectiveCritChance) : 0
  const grazeChance = Math.min(overflowDodge, nonCritHitChance)
  const cleanHitChance = nonCritHitChance - grazeChance

  // Weakness match check against current shooter config
  const weaponWeaknessMatch = chosenWeaknesses.find(w => {
    if (w.id === 'vulnerable_shotguns' && shooter.weaponType === 'shotgun') return true
    return false
  })

  const handleCalculate = () => {
    if (mode === 'full') {
      const r = calculateShot(shooter, target, useHp ? targetHp : undefined, dlc)
      setResult(r)
    } else {
      // Quick mode: back-solve defense then compute normally
      const solved = backSolveFromDisplayed(displayedHit, shooter, target, dlc)
      const syntheticTarget = { ...target, baseDefense: solved.impliedDefense, isApprox: true }
      const r = calculateShot(shooter, syntheticTarget, useHp ? targetHp : undefined, dlc)
      setResult(r)
    }
  }

  const handleLoadFromRoster = (soldierId: string) => {
    const s = soldiers.find(x => x.id === soldierId)
    if (!s) return
    const aimMap = CLASS_RANK_AIM[s.soldierClass]
    const baseAim = aimMap?.[s.rank] ?? 65
    const weaponType: WeaponType =
      s.soldierClass === 'sharpshooter' ? 'sniper' :
      s.soldierClass === 'grenadier' ? 'cannon' :
      s.soldierClass === 'spark' ? 'spark_cannon' : 'assault_rifle'
    setShooter(p => ({
      ...p,
      baseAim,
      weaponType,
      weaponTier: s.weaponTier,
    }))
  }

  const handleLoadProfile = (profileId: string) => {
    const p = profiles.find(x => x.id === profileId)
    if (!p) return
    setShooter({
      baseAim: p.baseAim,
      baseCrit: p.baseCrit,
      weaponType: p.weaponType,
      weaponTier: p.weaponTier,
      rangeBracket: p.rangeBracket,
      scopeBonus: p.scopeBonus,
      abilityModIds: p.abilityModIds,
      isElevated: p.isElevated,
    })
  }

  const handleSaveProfile = async () => {
    if (!campaign || !saveName.trim()) return
    const profile: ShotProfile = {
      id: nanoid(),
      campaignId: campaign.id,
      name: saveName.trim(),
      baseAim: shooter.baseAim,
      baseCrit: shooter.baseCrit,
      weaponType: shooter.weaponType,
      weaponTier: shooter.weaponTier,
      rangeBracket: shooter.rangeBracket,
      scopeBonus: shooter.scopeBonus,
      abilityModIds: shooter.abilityModIds,
      isElevated: shooter.isElevated,
      createdAt: Date.now(),
    }
    await db.shotProfiles.add(profile)
    setProfiles(p => [...p, profile])
    setSaveName('')
    setShowSaveForm(false)
  }

  const handleDeleteProfile = async (id: string) => {
    await db.shotProfiles.delete(id)
    setProfiles(p => p.filter(x => x.id !== id))
  }

  const handleAddToCompare = () => {
    if (!result || compareSlots.length >= 3) return
    const slot: CompareSlot = {
      id: nanoid(),
      label: `Shot ${compareSlots.length + 1}`,
      result,
    }
    setCompareSlots(p => [...p, slot])
  }

  const handleRemoveCompare = (id: string) =>
    setCompareSlots(p => p.filter(x => x.id !== id))

  if (!campaign) {
    return (
      <div className="text-center py-12 font-mono text-sm" style={{ color: 'var(--text3)' }}>
        No active campaign.
      </div>
    )
  }

  // ── Derived weapon damage hint ────────────────────────────────────────────
  const dmgRange = WEAPON_DAMAGE[shooter.weaponType][shooter.weaponTier]
  const armorReduction = useHp ? targetHp.armor : 0
  const effDmgMin = Math.max(0, dmgRange.min - armorReduction)
  const effDmgMax = Math.max(0, dmgRange.max - armorReduction)

  return (
    <div className="space-y-4">

      {/* Mode toggle */}
      <div className="flex rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {([
          { id: 'full' as CalcMode, label: 'Full Breakdown' },
          { id: 'quick' as CalcMode, label: 'Quick Check' },
        ] as const).map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null) }}
            className={`flex-1 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors ${
              mode === m.id ? 'bg-amber-500 text-neutral-950' : 'hover:text-neutral-300'
            }`}
            style={mode !== m.id ? { background: 'var(--surface)', color: 'var(--text3)' } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Presets bar */}
      {profiles.length > 0 && (
        <Card>
          <CardBody className="space-y-2">
            <SectionHeading>Saved Shooter Profiles</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleLoadProfile(p.id)}
                    className="px-2.5 py-1 rounded-[2px] text-xs font-mono border transition-colors hover:border-amber-500/50 hover:text-amber-400"
                    style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface2)' }}
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(p.id)}
                    className="text-[10px] font-mono px-1"
                    style={{ color: 'var(--text3)' }}
                    title="Delete preset"
                  >×</button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Shooter section */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeading>Shooter</SectionHeading>

          {/* Auto-fill from roster */}
          {soldiers.length > 0 && (
            <div>
              <div className="field-label mb-1">Fill from Roster</div>
              <select
                className="w-full px-3 py-2 text-sm font-mono rounded-[2px] border outline-none"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--text2)' }}
                defaultValue=""
                onChange={e => { if (e.target.value) handleLoadFromRoster(e.target.value) }}
              >
                <option value="">— pick a soldier —</option>
                {soldiers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nickname} ({s.soldierClass} · {s.rank})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Base Aim" value={shooter.baseAim} onChange={v => setS('baseAim', v)} min={30} max={100} />
            <Stepper label="Base Crit %" value={shooter.baseCrit} onChange={v => setS('baseCrit', v)} min={0} max={60} step={5} unit="%" />
          </div>

          <ButtonGroup
            label="Weapon Type"
            value={shooter.weaponType}
            onChange={v => setS('weaponType', v)}
            options={[
              { value: 'assault_rifle', label: 'Rifle' },
              { value: 'shotgun', label: 'Shotgun' },
              { value: 'sniper', label: 'Sniper' },
              { value: 'cannon', label: 'Cannon' },
              { value: 'pistol', label: 'Pistol' },
              { value: 'spark_cannon', label: 'SPARK' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <ButtonGroup
              label="Weapon Tier"
              value={shooter.weaponTier}
              onChange={v => setS('weaponTier', v as WeaponTierInput)}
              options={[
                { value: 'conventional', label: 'Conv' },
                { value: 'magnetic', label: 'Mag' },
                { value: 'beam', label: 'Beam' },
              ]}
            />
            <div>
              <div className="field-label mb-1">Scope Bonus</div>
              <select
                className="w-full px-3 py-2.5 text-sm font-mono rounded-[2px] border outline-none"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--text2)' }}
                value={shooter.scopeBonus}
                onChange={e => setS('scopeBonus', Number(e.target.value))}
              >
                <option value={0}>None (+0)</option>
                <option value={5}>Scope (+5)</option>
                <option value={10}>Adv. Scope (+10)</option>
              </select>
            </div>
          </div>

          <ButtonGroup
            label="Range Bracket"
            value={shooter.rangeBracket}
            onChange={v => setS('rangeBracket', v as RangeBracket)}
            options={[
              { value: 'close', label: 'Close' },
              { value: 'mid', label: 'Mid' },
              { value: 'far', label: 'Far' },
              { value: 'very_far', label: 'V.Far' },
            ]}
          />

          <Toggle
            label="Elevated (higher ground than target)"
            checked={shooter.isElevated}
            onChange={v => setS('isElevated', v)}
            note="+10 aim approx — stack with Death From Above if you have the ability"
          />

          {/* Ability modifiers */}
          <div>
            <button
              className="flex items-center gap-2 w-full text-left"
              onClick={() => setShowAbilities(o => !o)}
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text3)' }}>
                Situational Modifiers
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{showAbilities ? '▲' : '▼'}</span>
            </button>
            {shooter.abilityModIds.length > 0 && !showAbilities && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {shooter.abilityModIds.map(id => {
                  const m = ABILITY_MODIFIERS.find(x => x.id === id)
                  return m ? (
                    <Badge key={id} variant="amber">{m.label.split('(')[0].trim()}</Badge>
                  ) : null
                })}
              </div>
            )}
            {showAbilities && (
              <div className="mt-2 space-y-1.5">
                {availableAbilities.map(mod => (
                  <label
                    key={mod.id}
                    className="flex items-start gap-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-amber-500 shrink-0"
                      checked={shooter.abilityModIds.includes(mod.id)}
                      onChange={() => toggleAbilityMod(mod.id)}
                    />
                    <div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text2)' }}>
                        {mod.label}
                        {mod.approx && <span className="ml-1 text-[9px]" style={{ color: 'var(--text3)' }}>~approx</span>}
                      </div>
                      <div className="text-[10px] font-mono leading-snug mt-0.5" style={{ color: 'var(--text3)' }}>
                        {mod.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Target section */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeading>Target</SectionHeading>

          {/* Chosen target toggle (WotC) */}
          {dlc.wotc && (
            <div className="space-y-2">
              <Toggle
                label="Target is a Chosen (WotC)"
                checked={isChosenTarget}
                onChange={v => {
                  setIsChosenTarget(v)
                  if (v && hasDodgeStrength) {
                    setT('dodge', chosenDodgeValue)
                  }
                }}
              />
              {isChosenTarget && (
                <div className="flex rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border2)' }}>
                  {(['assassin', 'hunter', 'warlock'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setChosenTargetType(t)}
                      className={`flex-1 py-2 text-[11px] font-mono font-semibold capitalize transition-colors ${
                        chosenTargetType === t ? 'bg-amber-500 text-neutral-950' : 'hover:text-neutral-300'
                      }`}
                      style={chosenTargetType !== t ? { background: 'var(--surface2)', color: 'var(--text3)' } : undefined}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Damage immunity banner */}
          {isChosenTarget && hasDamageImmunity && (
            <div className="px-3 py-2.5 border border-red-700/60 rounded-[2px] bg-red-950/30">
              <div className="text-xs font-mono font-bold text-red-400 mb-0.5">
                Damage Immunity Active
              </div>
              <p className="text-[10px] font-mono text-red-300 leading-snug">
                {CHOSEN_STRENGTHS.damage_immunity.condition}. Shots deal zero damage during the immune phase.
                Wait for the Chosen to attack before committing your best abilities.
              </p>
            </div>
          )}

          {/* Chosen strength notes */}
          {isChosenTarget && chosenStrengths.length > 0 && (hasArmor || hasRegen || hasDodgeStrength) && (
            <div className="space-y-1.5">
              {hasDodgeStrength && (
                <div className="text-[10px] font-mono px-2 py-1.5 rounded-[2px] border border-amber-800/30 bg-amber-950/20 text-amber-400 leading-snug">
                  Dodge ({chosenDodgeValue}%) auto-applied. Hits convert to grazes — see Graze Breakdown below.
                </div>
              )}
              {hasArmor && (
                <div className="text-[10px] font-mono px-2 py-1.5 rounded-[2px] border border-amber-800/30 bg-amber-950/20 text-amber-400 leading-snug">
                  Armor ({hasArmor.armorValue ?? 3}): flat reduction — enter in the Armor field below or bring Shredder.
                </div>
              )}
              {hasRegen && (
                <div className="text-[10px] font-mono px-2 py-1.5 rounded-[2px] border border-amber-800/30 bg-amber-950/20 text-amber-400 leading-snug">
                  Regeneration ({hasRegen.regenValue ?? 3} HP/turn): kill in one burst or regen undoes your damage.
                </div>
              )}
            </div>
          )}

          {mode === 'quick' ? (
            <>
              <Stepper
                label="Game-displayed Hit %"
                value={displayedHit}
                onChange={setDisplayedHit}
                min={0} max={100} unit="%"
              />
              <p className="text-[10px] font-mono leading-relaxed" style={{ color: 'var(--text3)' }}>
                Quick Check mode: enter the hit% the game shows. We'll back-solve the target's implied defense and run full sensitivity analysis.
              </p>
            </>
          ) : (
            <>
              <ButtonGroup
                label="Cover"
                value={target.coverType}
                onChange={v => setT('coverType', v as CoverType)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'half', label: 'Half −20' },
                  { value: 'full', label: 'Full −40' },
                ]}
              />
              <Stepper
                label="Target Defense (0 for most ADVENT)"
                value={target.baseDefense}
                onChange={v => setT('baseDefense', v)}
                min={0} max={60} step={5}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Toggle label="Flanked" checked={target.isFlanked} onChange={v => setT('isFlanked', v)} note="Removes cover; +25% crit approx" />
            <Toggle label="Hunkered Down" checked={target.isHunkered} onChange={v => setT('isHunkered', v)} note="+20 additional defense approx" />
            <Toggle label="Target in Smoke" checked={target.targetInSmoke} onChange={v => setT('targetInSmoke', v)} note="−20 to your aim approx" />
            {dlc.wotc && (
              <Toggle label="Lightning Reflexes" checked={target.hasLightningReflexes} onChange={v => setT('hasLightningReflexes', v)} note="−30 aim on first shot approx" />
            )}
          </div>

          {dlc.wotc && (
            <Stepper
              label="Target Dodge % (WotC — converts crits → hits)"
              value={target.dodge}
              onChange={v => setT('dodge', v)}
              min={0} max={60} step={5} unit="%"
            />
          )}

          {/* HP / Armor for kill probability */}
          <Toggle
            label="Enter HP & Armor for kill probability"
            checked={useHp}
            onChange={setUseHp}
          />
          {useHp && (
            <div className="grid grid-cols-2 gap-3">
              <Stepper label="Target HP" value={targetHp.currentHP} onChange={v => setTargetHp(p => ({ ...p, currentHP: v }))} min={1} max={30} />
              <Stepper label="Armor (flat reduction)" value={targetHp.armor} onChange={v => setTargetHp(p => ({ ...p, armor: v }))} min={0} max={10} />
            </div>
          )}

          {/* Effective damage hint */}
          <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
            Weapon damage: {dmgRange.min}–{dmgRange.max}
            {armorReduction > 0 && ` → ${effDmgMin}–${effDmgMax} after armor`}
          </div>
        </CardBody>
      </Card>

      {/* Calculate button */}
      <Button variant="primary" className="w-full" onClick={handleCalculate}>
        Calculate Shot
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4">

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="px-3 py-2.5 border border-amber-800/60 bg-amber-950/30 rounded-[2px] text-xs font-mono leading-relaxed text-amber-300">
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Hit / Crit / Miss stats */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SectionHeading>Shot Odds</SectionHeading>
              {result.confidence === 'approximated' && (
                <Badge variant="gray">~approx</Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <BigStat label="Hit" value={`${result.hitChance}%`} color="amber" />
              <BigStat
                label={result.effectiveCritChance !== result.critChance ? 'Crit (eff.)' : 'Crit'}
                value={`${result.effectiveCritChance}%`}
                sub={result.effectiveCritChance !== result.critChance ? `raw ${result.critChance}%` : 'if hit'}
                color="amber"
              />
              <BigStat label="Miss" value={`${result.missChance}%`} color={result.missChance > 40 ? 'red' : 'muted'} />
            </div>
          </div>

          {/* Graze breakdown (Chosen Dodge strength) */}
          {isChosenTarget && hasDodgeStrength && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <SectionHeading>Graze Breakdown (Chosen Dodge)</SectionHeading>
                <Badge variant="gray">~approx</Badge>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <BigStat label="Crit" value={`${result.effectiveCritChance}%`} color="amber" />
                <BigStat label="Hit" value={`${cleanHitChance}%`} color="muted" />
                <BigStat
                  label="Graze"
                  value={`${grazeChance}%`}
                  sub="half dmg"
                  color={grazeChance > 20 ? 'red' : 'muted'}
                />
                <BigStat label="Miss" value={`${result.missChance}%`} color={result.missChance > 40 ? 'red' : 'muted'} />
              </div>
              <p className="text-[10px] font-mono mt-1.5 leading-snug" style={{ color: 'var(--text3)' }}>
                Overflow dodge ({Math.max(0, chosenDodgeValue - rawCritForGraze)}%) converts hits to grazes.
                Graze deals half the rolled damage and does not trigger Kill confirmation.
              </p>
            </div>
          )}

          {/* Weakness exploiter note */}
          {isChosenTarget && chosenWeaknesses.length > 0 && (
            <div>
              <SectionHeading>Chosen Weaknesses</SectionHeading>
              <div className="mt-2 space-y-1.5">
                {chosenWeaknesses.map(w => {
                  const isMatch = w.id === 'vulnerable_shotguns' && shooter.weaponType === 'shotgun'
                  return (
                    <div
                      key={w.id}
                      className="px-3 py-2 rounded-[2px] border text-[10px] font-mono leading-snug"
                      style={{
                        borderColor: isMatch ? '#16a34a40' : 'var(--border)',
                        background: isMatch ? '#14532d20' : 'var(--surface)',
                        color: isMatch ? '#4ade80' : 'var(--text3)',
                      }}
                    >
                      {isMatch && <span className="font-bold text-green-400">EXPLOITING: </span>}
                      <span className="font-bold" style={{ color: isMatch ? '#4ade80' : 'var(--text2)' }}>{w.name}:</span>{' '}
                      {w.exploiterNote}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Chosen data configured note */}
          {isChosenTarget && chosenRecord && chosenRecord.strengths.length === 0 && chosenRecord.weaknesses.length === 0 && (
            <div className="px-3 py-2 rounded-[2px] border border-amber-800/30 bg-amber-950/10 text-[10px] font-mono text-amber-400">
              Configure this Chosen's strengths and weaknesses in the Chosen tab for detailed analysis.
            </div>
          )}

          {/* Expected damage */}
          <div>
            <SectionHeading>Damage</SectionHeading>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <BigStat
                label="Exp. Damage"
                value={String(result.expectedDamage)}
                sub="weighted avg"
                color="amber"
              />
              <BigStat
                label="On Hit"
                value={`${result.damageOnHit.min}–${result.damageOnHit.max}`}
                sub={`avg ${result.damageOnHit.avg}`}
                color="muted"
              />
              <BigStat
                label="On Crit"
                value={`${result.damageOnCrit.min}–${result.damageOnCrit.max}`}
                sub={`avg ${result.damageOnCrit.avg}`}
                color="amber"
              />
            </div>
          </div>

          {/* Kill probability */}
          {result.killProbability && (
            <div>
              <SectionHeading>Kill Confirmation</SectionHeading>
              <div className="mt-2 space-y-1.5">
                <div
                  className="px-3 py-2.5 rounded-[2px] border text-xs font-mono"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text2)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>Overall kill probability</span>
                    <span className={`font-bold text-sm ${result.killProbability.overall > 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(result.killProbability.overall * 100)}%
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[10px]" style={{ color: 'var(--text3)' }}>
                    <div className="flex justify-between">
                      <span>Kill on normal hit</span>
                      <span>
                        {result.killProbability.canKillOnHit
                          ? `${Math.round(result.killProbability.probabilityOnHit * 100)}% of hits kill`
                          : 'Cannot kill on hit (damage too low)'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kill on crit</span>
                      <span>
                        {result.killProbability.canKillOnCrit
                          ? `${Math.round(result.killProbability.probabilityOnCrit * 100)}% of crits kill`
                          : 'Cannot kill even on crit'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                {!result.killProbability.canKillOnHit && result.killProbability.canKillOnCrit && (
                  <div className="px-3 py-2 rounded-[2px] text-[10px] font-mono border border-amber-800/40 bg-amber-950/20 text-amber-400">
                    This shot wounds but rarely kills — the enemy will still act. Consider a grenade or a flanking soldier to confirm the kill.
                  </div>
                )}
                {!result.killProbability.canKillOnCrit && (
                  <div className="px-3 py-2 rounded-[2px] text-[10px] font-mono border border-red-800/40 bg-red-950/20 text-red-400">
                    This weapon cannot kill the target in one shot regardless of RNG. You will need a follow-up action.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reality Check */}
          <div>
            <SectionHeading>Reality Check</SectionHeading>
            <div
              className="mt-2 px-3 py-3 rounded-[2px] border text-xs font-mono leading-relaxed"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text2)' }}
            >
              {result.riskText}
            </div>
          </div>

          {/* Sensitivity breakdown */}
          {result.sensitivityBreakdown.length > 0 && (
            <div>
              <SectionHeading>What Would Help Most</SectionHeading>
              <div className="mt-2 space-y-1.5">
                {result.sensitivityBreakdown.map((adj, i) => (
                  <div
                    key={i}
                    className="px-3 py-2.5 rounded-[2px] border flex items-center gap-3"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{adj.label}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                        {result.hitChance}% → {adj.newHitChance}%
                        {adj.newCritChance !== undefined && ` · crit ${adj.newCritChance}%`}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-mono font-bold shrink-0 ${adj.delta > 0 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {adj.delta > 0 ? '+' : ''}{adj.delta}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formula breakdown (expandable) */}
          <div className="rounded-[2px] border" style={{ borderColor: 'var(--border)' }}>
            <button
              className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
              style={{ background: 'var(--surface)' }}
              onClick={() => setShowBreakdown(o => !o)}
            >
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] flex-1" style={{ color: 'var(--text3)' }}>
                Formula Breakdown
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{showBreakdown ? '▲' : '▼'}</span>
            </button>
            {showBreakdown && (
              <div className="px-3 pb-3 pt-1 space-y-1 text-xs font-mono" style={{ background: 'var(--bg)' }}>
                {[
                  { label: 'Base Aim', value: `+${result.breakdown.baseAim}` },
                  { label: 'Aim Bonuses (scope + range + abilities + elevation)', value: result.breakdown.aimBonuses >= 0 ? `+${result.breakdown.aimBonuses}` : String(result.breakdown.aimBonuses) },
                  { label: 'Target Defense', value: `−${result.breakdown.targetDefense}` },
                  { label: 'Cover + Hunker', value: `−${result.breakdown.coverBonus}` },
                  { label: 'Other Penalties (smoke, LR, etc.)', value: `−${result.breakdown.otherPenalties}` },
                  { label: 'Raw Hit (before clamp)', value: String(result.breakdown.rawHitBeforeClamp) },
                  { label: 'Final Hit (clamped 0–100)', value: `${result.hitChance}%` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span style={{ color: 'var(--text3)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text2)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to compare / Save preset buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleAddToCompare}
              disabled={compareSlots.length >= 3}
            >
              {compareSlots.length >= 3 ? 'Compare Full (3/3)' : 'Add to Compare'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSaveForm(o => !o)}
            >
              Save Preset
            </Button>
          </div>

          {/* Inline save form */}
          {showSaveForm && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Preset name (e.g. Skirmisher vs Trooper)"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                className="flex-1 px-3 py-2 text-sm font-mono rounded-[2px] border outline-none"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                autoFocus
              />
              <Button variant="primary" onClick={handleSaveProfile} disabled={!saveName.trim()}>Save</Button>
              <Button variant="ghost" onClick={() => setShowSaveForm(false)}>Cancel</Button>
            </div>
          )}
        </div>
      )}

      {/* Compare panel */}
      {compareSlots.length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeading>Compare Shots</SectionHeading>
            <button
              onClick={() => setCompareSlots([])}
              className="text-[10px] font-mono ml-2"
              style={{ color: 'var(--text3)' }}
            >
              Clear all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="py-2 px-2 text-left" style={{ color: 'var(--text3)' }}>Stat</th>
                  {compareSlots.map(slot => (
                    <th key={slot.id} className="py-2 px-2 text-right" style={{ color: 'var(--text2)' }}>
                      <div className="flex items-center justify-end gap-1">
                        {slot.label}
                        <button onClick={() => handleRemoveCompare(slot.id)} style={{ color: 'var(--text3)' }}>×</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Hit %', getValue: (r: ShotResult) => `${r.hitChance}%` },
                  { label: 'Crit %', getValue: (r: ShotResult) => `${r.effectiveCritChance}%` },
                  { label: 'Miss %', getValue: (r: ShotResult) => `${r.missChance}%` },
                  { label: 'Exp. Damage', getValue: (r: ShotResult) => String(r.expectedDamage) },
                  { label: 'Kill Prob.', getValue: (r: ShotResult) => r.killProbability ? `${Math.round(r.killProbability.overall * 100)}%` : '—' },
                ].map(row => (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 px-2" style={{ color: 'var(--text3)' }}>{row.label}</td>
                    {compareSlots.map(slot => {
                      const val = row.getValue(slot.result)
                      // Highlight best hit% and exp damage
                      const isHitRow = row.label === 'Hit %'
                      const isExpDmg = row.label === 'Exp. Damage'
                      const isMiss = row.label === 'Miss %'
                      const numVal = parseFloat(val)
                      const allNums = compareSlots.map(s => parseFloat(row.getValue(s.result)))
                      const isBest = isHitRow || isExpDmg
                        ? numVal === Math.max(...allNums)
                        : isMiss
                          ? numVal === Math.min(...allNums)
                          : false
                      return (
                        <td
                          key={slot.id}
                          className={`py-2 px-2 text-right font-bold ${isBest ? 'text-amber-400' : ''}`}
                          style={!isBest ? { color: 'var(--text2)' } : undefined}
                        >
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
