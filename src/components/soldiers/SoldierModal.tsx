import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { useCampaignStore } from '../../store/campaignStore'
import type { Soldier, SoldierClass, SoldierStatus, SoldierRank, WeaponTier, ArmorTier, ClassDefinition, DlcConfig, CombatIntelligence } from '../../data/types'
import { COMBAT_INTEL } from '../../data/types'

interface Props {
  soldier: Soldier
  isNew: boolean
  classes: ClassDefinition[]
  dlc: DlcConfig
  onClose: () => void
}

const STATUSES: SoldierStatus[] = ['ready', 'wounded', 'tired', 'shaken', 'dead', 'captured', 'missing']
const RANKS: SoldierRank[] = ['rookie','squaddie','corporal','sergeant','lieutenant','captain','major','colonel']
const WEAPON_TIERS: WeaponTier[] = ['conventional','magnetic','beam']
const ARMOR_TIERS: ArmorTier[] = ['none','kevlar','predator','warden','powered','spider','wraith','hunter','alien_rulers']

const GRENADES = [
  '', 'Frag Grenade', 'Flashbang', 'Smoke Grenade', 'Incendiary Grenade',
  'EMP Grenade', 'Acid Grenade', 'Plasma Grenade', 'Mindscrew',
]
const UTILITY_ITEMS = [
  '', 'Medikit', 'Mimic Beacon', 'Skulljack', 'Battle Scanner',
  'Mindshield', 'Hellweave', 'Hazmat Vest', 'Overdrive Serum',
  'Scanning Protocol', 'Grapple Hook', 'Vest',
]
const AMMO_TYPES = [
  '', 'AP Rounds', 'Tracer Rounds', 'Venom Rounds', 'Dragon Rounds',
  'Talon Rounds', 'Bluescreen Rounds',
]
const PCS_CHIPS = [
  '', 'Speed PCS', 'Perception PCS', 'Will PCS',
  'Conditioning PCS', 'Focus PCS',
]

const STATUS_COLORS: Record<SoldierStatus, string> = {
  ready:    'border-green-700/60 text-green-400',
  wounded:  'border-amber-700/60 text-amber-400',
  tired:    'border-neutral-600  text-neutral-400',
  shaken:   'border-blue-700/60  text-blue-400',
  dead:     'border-red-900      text-red-500',
  captured: 'border-purple-700/60 text-purple-400',
  missing:  'border-neutral-600  text-neutral-500',
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text3)' }}>{children}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function AbilityRow({ abilities, takenIds, plannedIds, onToggle }: {
  abilities: Array<{ id: string; name: string; description: string }>
  takenIds: string[]
  plannedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex gap-1.5">
      {abilities.map(ab => {
        const taken   = takenIds.includes(ab.id)
        const planned = plannedIds.includes(ab.id)
        return (
          <button
            key={ab.id}
            onClick={() => onToggle(ab.id)}
            title={ab.description}
            className={`flex-1 px-2 py-2 text-[10px] font-mono text-left border rounded-[2px] transition-colors leading-tight ${
              taken
                ? 'border-amber-500/40 bg-amber-500/12 text-amber-400'
                : planned
                ? 'border-blue-500/30 bg-blue-500/8 text-blue-400'
                : 'border-white/8 bg-white/3 text-neutral-600 hover:text-neutral-400 hover:border-white/15'
            }`}
          >
            <span className="block font-semibold">{ab.name}</span>
            {taken   && <span className="block text-amber-600 text-[9px] mt-0.5 uppercase tracking-wide">Taken</span>}
            {planned && <span className="block text-blue-600 text-[9px] mt-0.5 uppercase tracking-wide">Planned</span>}
          </button>
        )
      })}
    </div>
  )
}

export function SoldierModal({ soldier: init, isNew, classes, dlc, onClose }: Props) {
  const { createSoldier, updateSoldier, deleteSoldier } = useCampaignStore()
  const [s, setS] = useState({ ...init })

  const set = (patch: Partial<Soldier>) => setS(prev => ({ ...prev, ...patch }))

  const classData = classes.find(c => c.id === s.soldierClass)

  // Cycle ability: none → planned → taken → none
  const toggleAbility = (abilityId: string) => {
    const taken   = s.takenAbilities.includes(abilityId)
    const planned = s.plannedAbilities.includes(abilityId)
    if (taken) {
      // taken → none
      set({ takenAbilities: s.takenAbilities.filter(id => id !== abilityId) })
    } else if (planned) {
      // planned → taken
      set({
        plannedAbilities: s.plannedAbilities.filter(id => id !== abilityId),
        takenAbilities: [...s.takenAbilities, abilityId],
      })
    } else {
      // none → planned
      set({ plannedAbilities: [...s.plannedAbilities, abilityId] })
    }
  }

  const setUtility = (idx: number, val: string) => {
    const slots: [string?, string?, string?] = [...(s.utilitySlots ?? ['', '', ''])] as [string?, string?, string?]
    slots[idx] = val || undefined
    set({ utilitySlots: slots })
  }

  const handleSave = async () => {
    if (isNew) {
      await createSoldier({
        campaignId: s.campaignId,
        nickname: s.nickname,
        soldierClass: s.soldierClass,
        rank: s.rank,
        status: s.status,
        woundDaysRemaining: s.woundDaysRemaining,
        plannedAbilities: s.plannedAbilities,
        takenAbilities: s.takenAbilities,
        weaponTier: s.weaponTier,
        armorTier: s.armorTier,
        grenadeSlot: s.grenadeSlot,
        utilitySlots: s.utilitySlots,
        ammoType: s.ammoType,
        pcsChip: s.pcsChip,
        loadoutNotes: '',
        killCount: s.killCount,
        missionCount: s.missionCount,
        epitaph: s.epitaph,
        psiAbilities: s.psiAbilities,
        trainingCenterAbility: s.trainingCenterAbility,
        combatIntelligence: s.combatIntelligence,
      })
    } else {
      await updateSoldier(s.id, s)
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm(`Remove ${s.nickname || 'this soldier'} permanently?`)) return
    await deleteSoldier(s.id)
    onClose()
  }

  // Ranks that have abilities (above squaddie)
  const abilityRanks = classData?.ranks ?? []
  const squaddieFree = classData?.squaddieFreeAbility

  // Only show ranks up to current soldier rank
  const rankOrder = RANKS.indexOf(s.rank)
  const unlockedRanks = abilityRanks.filter(r => RANKS.indexOf(r.rank as SoldierRank) <= rankOrder)

  return (
    <Modal
      title={isNew ? 'New Soldier' : `Edit: ${init.nickname}`}
      onClose={onClose}
      footer={
        <>
          {!isNew && <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>}
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">

        {/* ── Identity ──────────────────────────────────────────── */}
        <SectionHeading>Identity</SectionHeading>

        <div>
          <label className="field-label">Nickname / Callsign</label>
          <Input value={s.nickname} onChange={e => set({ nickname: e.target.value })} placeholder="e.g. Ghost" autoFocus={isNew} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Class</label>
            {s.rank === 'rookie' ? (
              <Select value="" disabled>
                <option value="">Assigned at Squaddie</option>
              </Select>
            ) : (
              <Select value={s.soldierClass ?? ''} onChange={e => set({ soldierClass: (e.target.value || null) as SoldierClass | null, plannedAbilities: [], takenAbilities: [] })}>
                <option value="">— Select class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </div>
          <div>
            <label className="field-label">Rank</label>
            <Select value={s.rank} onChange={e => {
              const newRank = e.target.value as SoldierRank
              if (newRank === 'rookie') set({ rank: newRank, soldierClass: null, plannedAbilities: [], takenAbilities: [] })
              else set({ rank: newRank })
            }}>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
        </div>

        {/* ── Status ────────────────────────────────────────────── */}
        <SectionHeading>Status</SectionHeading>

        <div className="grid grid-cols-4 gap-1.5">
          {STATUSES.map(st => (
            <button
              key={st}
              onClick={() => set({ status: st })}
              className={`py-2 text-[10px] font-mono uppercase tracking-wide font-semibold border rounded-[2px] transition-colors ${
                s.status === st
                  ? st === 'dead' ? 'bg-red-900/60 border-red-700 text-red-300'
                  : 'bg-amber-500 border-amber-500 text-neutral-950'
                  : `bg-transparent ${STATUS_COLORS[st]} hover:opacity-80`
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {s.status === 'wounded' && (
          <div>
            <label className="field-label">Wound Days Remaining</label>
            <Input type="number" min={0} value={s.woundDaysRemaining ?? ''} onChange={e => set({ woundDaysRemaining: Number(e.target.value) })} placeholder="Days" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Kills</label>
            <Input type="number" min={0} value={s.killCount} onChange={e => set({ killCount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="field-label">Missions</label>
            <Input type="number" min={0} value={s.missionCount} onChange={e => set({ missionCount: Number(e.target.value) })} />
          </div>
        </div>

        {/* ── Equipment ─────────────────────────────────────────── */}
        <SectionHeading>Equipment</SectionHeading>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Weapon Tier</label>
            <Select value={s.weaponTier} onChange={e => set({ weaponTier: e.target.value as WeaponTier })}>
              {WEAPON_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <label className="field-label">Armor</label>
            <Select value={s.armorTier} onChange={e => set({ armorTier: e.target.value as ArmorTier })}>
              {ARMOR_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Grenade</label>
            <Select value={s.grenadeSlot ?? ''} onChange={e => set({ grenadeSlot: e.target.value || undefined })}>
              {GRENADES.map(g => <option key={g} value={g}>{g || '—'}</option>)}
            </Select>
          </div>
          <div>
            <label className="field-label">Ammo</label>
            <Select value={s.ammoType ?? ''} onChange={e => set({ ammoType: e.target.value || undefined })}>
              {AMMO_TYPES.map(a => <option key={a} value={a}>{a || '—'}</option>)}
            </Select>
          </div>
        </div>

        <div>
          <label className="field-label">Utility Slots</label>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => (
              <Select key={i} value={s.utilitySlots?.[i] ?? ''} onChange={e => setUtility(i, e.target.value)}>
                {UTILITY_ITEMS.map(u => <option key={u} value={u}>{u || '—'}</option>)}
              </Select>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">PCS Chip</label>
          <Select value={s.pcsChip ?? ''} onChange={e => set({ pcsChip: e.target.value || undefined })}>
            {PCS_CHIPS.map(p => <option key={p} value={p}>{p || '—'}</option>)}
          </Select>
        </div>

        {/* ── Abilities ─────────────────────────────────────────── */}
        <SectionHeading>Abilities</SectionHeading>

        <div className="space-y-2.5">
          <p className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
            Tap once = <span className="text-blue-400">planned</span> · Tap again = <span className="text-amber-400">taken</span> · Tap again = clear
          </p>

          {/* Squaddie free ability */}
          {squaddieFree && s.rank !== 'rookie' && (
            <div>
              <div className="field-label mb-1.5">Squaddie</div>
              <div className="px-2 py-2 border rounded-[2px] border-amber-500/30 bg-amber-500/8">
                <span className="text-[10px] font-mono text-amber-400 font-semibold">{squaddieFree.name}</span>
                <span className="text-[9px] font-mono ml-2 uppercase tracking-wide text-amber-600">Free</span>
              </div>
            </div>
          )}

          {/* Rank ability choices */}
          {unlockedRanks.map(rankRow => (
            <div key={rankRow.rank}>
              <div className="field-label mb-1.5">{rankRow.rank}</div>
              <AbilityRow
                abilities={rankRow.choices}
                takenIds={s.takenAbilities}
                plannedIds={s.plannedAbilities}
                onToggle={toggleAbility}
              />
            </div>
          ))}

          {s.rank === 'rookie' && (
            <p className="text-[10px] font-mono text-neutral-700">Promote to Squaddie to unlock abilities.</p>
          )}
        </div>

        {/* ── WotC Training Center ──────────────────────────────── */}
        {dlc.wotc && (
          <>
            <SectionHeading>Training Center</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Combat Intelligence</label>
                <Select
                  value={s.combatIntelligence ?? ''}
                  onChange={e => set({ combatIntelligence: (e.target.value || undefined) as CombatIntelligence | undefined })}
                >
                  <option value="">— Unknown —</option>
                  {(Object.keys(COMBAT_INTEL) as CombatIntelligence[]).map(k => (
                    <option key={k} value={k}>{COMBAT_INTEL[k].label} · {COMBAT_INTEL[k].apPerPromotion} AP/promo</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="field-label">Bonus Ability (Training Center)</label>
                <Input
                  value={s.trainingCenterAbility ?? ''}
                  onChange={e => set({ trainingCenterAbility: e.target.value || undefined })}
                  placeholder="e.g. Volatile Mix, Shadowstep..."
                />
              </div>
            </div>
          </>
        )}

        {/* ── Epitaph ───────────────────────────────────────────── */}
        {s.status === 'dead' && (
          <>
            <SectionHeading>Memorial</SectionHeading>
            <div>
              <label className="field-label">Epitaph</label>
              <Textarea
                value={s.epitaph ?? ''}
                onChange={e => set({ epitaph: e.target.value })}
                rows={2}
                placeholder="They died so Earth could live..."
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
