import { useState, useEffect } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import {
  CHOSEN_DEFINITIONS,
  CHOSEN_STRENGTHS,
  CHOSEN_WEAKNESSES,
  KNOWLEDGE_TIERS,
  type ChosenType,
  type ChosenStrengthId,
  type ChosenWeaknessId,
} from '../../data/chosen'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'

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

function StrengthChip({ id }: { id: string }) {
  const s = CHOSEN_STRENGTHS[id as ChosenStrengthId]
  if (!s) return <Badge variant="gray">{id}</Badge>
  return (
    <div
      className="px-2 py-1 rounded-[2px] border text-[10px] font-mono cursor-help"
      style={{ borderColor: 'var(--border2)', background: 'var(--surface2)', color: 'var(--text2)' }}
      title={s.deploymentNote}
    >
      {s.name}
    </div>
  )
}

function WeaknessChip({ id }: { id: string }) {
  const w = CHOSEN_WEAKNESSES[id as ChosenWeaknessId]
  if (!w) return <Badge variant="gray">{id}</Badge>
  return (
    <div
      className="px-2 py-1 rounded-[2px] border text-[10px] font-mono cursor-help"
      style={{ borderColor: '#16a34a40', background: '#14532d20', color: '#4ade80' }}
      title={w.exploiterNote}
    >
      {w.name}
    </div>
  )
}

function KnowledgeBar({ tier }: { tier: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1">
      {([0, 1, 2, 3] as const).map(t => (
        <div
          key={t}
          className={`flex-1 h-2 rounded-full transition-colors ${t <= tier ? 'bg-amber-500' : ''}`}
          style={t > tier ? { background: 'var(--border2)' } : undefined}
        />
      ))}
    </div>
  )
}

interface ChosenTrackerProps {
  chosenType: ChosenType
}

export function ChosenTracker({ chosenType }: ChosenTrackerProps) {
  const { campaignChosen, getChosen, updateChosen, campaignSoldiers } = useCampaignStore()
  const chosenData = getChosen(chosenType)
  const soldiers = campaignSoldiers()
  const def = CHOSEN_DEFINITIONS[chosenType]

  const [editingSetup, setEditingSetup] = useState(false)
  const [draftStrengths, setDraftStrengths] = useState<string[]>([])
  const [draftWeaknesses, setDraftWeaknesses] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)
  const [strongholdInput, setStrongholdInput] = useState('')
  const [confirmEliminate, setConfirmEliminate] = useState(false)

  const isSetup = !!(chosenData && (chosenData.strengths.length > 0 || chosenData.weaknesses.length > 0))

  useEffect(() => {
    if (chosenData) {
      setDraftStrengths(chosenData.strengths)
      setDraftWeaknesses(chosenData.weaknesses)
      setStrongholdInput(chosenData.strongholdRegion ?? '')
    }
  }, [chosenData?.strengths.join(','), chosenData?.weaknesses.join(',')])

  if (!chosenData) {
    return (
      <div className="py-8 text-center font-mono text-sm" style={{ color: 'var(--text3)' }}>
        Loading...
      </div>
    )
  }

  const tier = KNOWLEDGE_TIERS.find(k => k.tier === chosenData.knowledgeTier)!
  const capturedSoldiers = soldiers.filter(s => chosenData.capturedSoldierIds.includes(s.id))

  const handleSaveSetup = async () => {
    await updateChosen(chosenType, {
      strengths: draftStrengths,
      weaknesses: draftWeaknesses,
    })
    setEditingSetup(false)
  }

  const handleAdvanceTier = async () => {
    if (chosenData.knowledgeTier >= 3) return
    const newTier = (chosenData.knowledgeTier + 1) as 0 | 1 | 2 | 3
    const tierLabel = KNOWLEDGE_TIERS.find(k => k.tier === newTier)!.label
    await updateChosen(chosenType, {
      knowledgeTier: newTier,
      knowledgeLog: [
        ...chosenData.knowledgeLog,
        { timestamp: Date.now(), event: `Tier advanced to ${tierLabel}` },
      ],
    })
  }

  const handleRegressTier = async () => {
    if (chosenData.knowledgeTier <= 0) return
    const newTier = (chosenData.knowledgeTier - 1) as 0 | 1 | 2 | 3
    const tierLabel = KNOWLEDGE_TIERS.find(k => k.tier === newTier)!.label
    await updateChosen(chosenType, {
      knowledgeTier: newTier,
      knowledgeLog: [
        ...chosenData.knowledgeLog,
        { timestamp: Date.now(), event: `Tier corrected to ${tierLabel}` },
      ],
    })
  }

  const handleSaveStronghold = async () => {
    await updateChosen(chosenType, { strongholdRegion: strongholdInput.trim() || undefined })
  }

  const handleEliminate = async (hero?: 'reaper' | 'skirmisher' | 'templar', sacrifice?: boolean) => {
    await updateChosen(chosenType, {
      eliminated: true,
      strongholdCompleted: true,
      strongholdAssaulted: true,
      killedByHero: hero,
      sacrificeUsed: sacrifice ?? false,
      knowledgeLog: [
        ...chosenData.knowledgeLog,
        {
          timestamp: Date.now(),
          event: sacrifice
            ? `Eliminated via Sacrifice by ${hero}`
            : hero
              ? `Eliminated by ${hero}`
              : 'Eliminated',
        },
      ],
    })
    setConfirmEliminate(false)
  }

  const handleRestore = async () => {
    await updateChosen(chosenType, {
      eliminated: false,
      strongholdCompleted: false,
      killedByHero: undefined,
      sacrificeUsed: false,
    })
  }

  const handleRescueSoldier = async (soldierId: string) => {
    const { updateSoldier } = useCampaignStore.getState()
    await updateSoldier(soldierId, { status: 'ready' })
    await updateChosen(chosenType, {
      capturedSoldierIds: chosenData.capturedSoldierIds.filter(id => id !== soldierId),
    })
  }

  const handleAssignCapture = async (soldierId: string) => {
    if (chosenData.capturedSoldierIds.includes(soldierId)) return
    await updateChosen(chosenType, {
      capturedSoldierIds: [...chosenData.capturedSoldierIds, soldierId],
    })
  }

  const toggleDraftStrength = (id: ChosenStrengthId) => {
    setDraftStrengths(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleDraftWeakness = (id: ChosenWeaknessId) => {
    setDraftWeaknesses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Unlocked tier abilities (all tiers up to current)
  const unlockedAbilities = def.knowledgeTierAbilities.filter(
    a => a.tier <= chosenData.knowledgeTier
  )

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-mono font-bold" style={{ color: 'var(--text)' }}>
              {def.name}
            </span>
            <Badge variant={chosenData.eliminated ? 'gray' : 'amber'}>
              {chosenData.eliminated ? 'Eliminated' : tier.label}
            </Badge>
          </div>
          <p className="text-[11px] font-mono mt-0.5 leading-snug" style={{ color: 'var(--text3)' }}>
            {def.description}
          </p>
        </div>
      </div>

      {/* Eliminated banner */}
      {chosenData.eliminated && (
        <div className="px-3 py-2.5 border border-neutral-700 rounded-[2px] bg-neutral-900 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-neutral-400">Chosen Eliminated</div>
            {chosenData.killedByHero && (
              <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                {chosenData.sacrificeUsed ? 'Sacrifice by' : 'Killed by'} {chosenData.killedByHero}
              </div>
            )}
          </div>
          <button
            onClick={handleRestore}
            className="text-[10px] font-mono px-2 py-1 border rounded-[2px] hover:border-amber-600/50 hover:text-amber-400 transition-colors"
            style={{ borderColor: 'var(--border2)', color: 'var(--text3)' }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Setup section */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeading>Strengths & Weaknesses</SectionHeading>
            {isSetup && !editingSetup && (
              <button
                onClick={() => setEditingSetup(true)}
                className="text-[10px] font-mono ml-2 px-2 py-1 border rounded-[2px] hover:border-amber-600/50 hover:text-amber-400 transition-colors"
                style={{ borderColor: 'var(--border2)', color: 'var(--text3)' }}
              >
                Edit
              </button>
            )}
          </div>

          {!isSetup || editingSetup ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
                  Strengths — check all that apply
                </div>
                <div className="space-y-1.5">
                  {def.strengthPool.map(id => {
                    const s = CHOSEN_STRENGTHS[id]
                    return (
                      <label key={id} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-amber-500 shrink-0"
                          checked={draftStrengths.includes(id)}
                          onChange={() => toggleDraftStrength(id)}
                        />
                        <div>
                          <div className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{s.name}</div>
                          <div className="text-[10px] font-mono leading-snug" style={{ color: 'var(--text3)' }}>
                            {s.description}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
                  Weaknesses — check all that apply
                </div>
                <div className="space-y-1.5">
                  {def.weaknessPool.map(id => {
                    const w = CHOSEN_WEAKNESSES[id]
                    return (
                      <label key={id} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-amber-500 shrink-0"
                          checked={draftWeaknesses.includes(id)}
                          onChange={() => toggleDraftWeakness(id)}
                        />
                        <div>
                          <div className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{w.name}</div>
                          <div className="text-[10px] font-mono leading-snug" style={{ color: 'var(--text3)' }}>
                            {w.description}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" onClick={handleSaveSetup}>
                  Save Configuration
                </Button>
                {isSetup && editingSetup && (
                  <Button variant="ghost" onClick={() => {
                    setDraftStrengths(chosenData.strengths)
                    setDraftWeaknesses(chosenData.weaknesses)
                    setEditingSetup(false)
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {chosenData.strengths.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>Strengths</div>
                  <div className="flex flex-wrap gap-1.5">
                    {chosenData.strengths.map(id => <StrengthChip key={id} id={id} />)}
                  </div>
                </div>
              )}
              {chosenData.weaknesses.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>Weaknesses</div>
                  <div className="flex flex-wrap gap-1.5">
                    {chosenData.weaknesses.map(id => <WeaknessChip key={id} id={id} />)}
                  </div>
                </div>
              )}
              {chosenData.strengths.length === 0 && chosenData.weaknesses.length === 0 && (
                <p className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                  No strengths or weaknesses configured.
                </p>
              )}
              {/* Strength notes */}
              {chosenData.strengths.length > 0 && (
                <div className="pt-1 space-y-1">
                  {chosenData.strengths.map(id => {
                    const s = CHOSEN_STRENGTHS[id as ChosenStrengthId]
                    return s ? (
                      <div key={id} className="text-[10px] font-mono leading-snug px-2 py-1.5 rounded-[2px]" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                        <span className="text-amber-500 font-bold">{s.name}:</span> {s.deploymentNote}
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Base abilities */}
      <Card>
        <CardBody className="space-y-2">
          <SectionHeading>Base Abilities</SectionHeading>
          {def.baseAbilities.map(a => (
            <div key={a.name} className="text-xs font-mono" style={{ color: 'var(--text2)' }}>
              <span className="font-bold text-amber-500">{a.name}:</span>{' '}
              <span style={{ color: 'var(--text3)' }}>{a.description}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Knowledge tier */}
      <Card>
        <CardBody className="space-y-3">
          <SectionHeading>Knowledge Tier</SectionHeading>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-sm font-mono font-bold text-amber-400">{tier.label}</span>
                <span className="text-[10px] font-mono ml-2" style={{ color: 'var(--text3)' }}>
                  Tier {chosenData.knowledgeTier}/3
                </span>
              </div>
            </div>
            <KnowledgeBar tier={chosenData.knowledgeTier} />
            <p className="text-[10px] font-mono mt-1.5 leading-snug" style={{ color: 'var(--text3)' }}>
              {tier.description}
            </p>
          </div>

          {tier.strongholdUnlocked && (
            <div className="px-2 py-1.5 rounded-[2px] border border-amber-800/40 bg-amber-950/20">
              <span className="text-[10px] font-mono text-amber-400">
                Stronghold region unlocked at this tier.
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleAdvanceTier}
              disabled={chosenData.knowledgeTier >= 3 || chosenData.eliminated}
            >
              Advance Tier
            </Button>
            <Button
              variant="ghost"
              onClick={handleRegressTier}
              disabled={chosenData.knowledgeTier <= 0}
            >
              Regress
            </Button>
          </div>

          {/* Knowledge log */}
          {chosenData.knowledgeLog.length > 0 && (
            <div>
              <button
                className="flex items-center gap-2 w-full text-left"
                onClick={() => setShowLog(o => !o)}
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text3)' }}>
                  Intel Log ({chosenData.knowledgeLog.length})
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{showLog ? '▲' : '▼'}</span>
              </button>
              {showLog && (
                <div className="mt-2 space-y-1">
                  {[...chosenData.knowledgeLog].reverse().map((entry, i) => (
                    <div key={i} className="text-[10px] font-mono flex gap-2" style={{ color: 'var(--text3)' }}>
                      <span className="shrink-0">{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span>{entry.event}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Unlocked abilities (tier >= 1) */}
      {unlockedAbilities.length > 0 && (
        <Card>
          <CardBody className="space-y-2">
            <SectionHeading>Unlocked by Knowledge Tier</SectionHeading>
            {unlockedAbilities.map(a => (
              <div key={a.name} className="px-2 py-2 rounded-[2px]" style={{ background: 'var(--surface2)' }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant="amber">Tier {a.tier}</Badge>
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--text2)' }}>{a.name}</span>
                </div>
                <p className="text-[10px] font-mono leading-snug" style={{ color: 'var(--text3)' }}>
                  {a.description}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Stronghold (tier >= 2) */}
      {chosenData.knowledgeTier >= 2 && (
        <Card>
          <CardBody className="space-y-3">
            <SectionHeading>Stronghold</SectionHeading>

            <div>
              <div className="field-label mb-1">Region</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. North America, Europe..."
                  value={strongholdInput}
                  onChange={e => setStrongholdInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm font-mono rounded-[2px] border outline-none"
                  style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                />
                <Button variant="secondary" onClick={handleSaveStronghold}>Save</Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`px-2.5 py-1.5 rounded-[2px] border text-[10px] font-mono font-bold uppercase tracking-wider ${
                  chosenData.strongholdCompleted
                    ? 'border-green-700 text-green-400 bg-green-950/30'
                    : chosenData.strongholdAssaulted
                      ? 'border-amber-700 text-amber-400 bg-amber-950/30'
                      : 'border-neutral-700 text-neutral-400 bg-neutral-900'
                }`}
              >
                {chosenData.strongholdCompleted ? 'Completed' : chosenData.strongholdAssaulted ? 'In Progress' : 'Not Assaulted'}
              </div>
              {!chosenData.strongholdAssaulted && (
                <button
                  onClick={() => updateChosen(chosenType, { strongholdAssaulted: true })}
                  className="text-[10px] font-mono px-2 py-1.5 border rounded-[2px] hover:border-amber-600/50 hover:text-amber-400 transition-colors"
                  style={{ borderColor: 'var(--border2)', color: 'var(--text3)' }}
                >
                  Mark Assaulting
                </button>
              )}
            </div>

            {/* Eliminate flow */}
            {!chosenData.eliminated && chosenData.strongholdAssaulted && (
              <div className="space-y-2">
                <SectionHeading>Mark as Eliminated</SectionHeading>
                {!confirmEliminate ? (
                  <Button variant="secondary" className="w-full" onClick={() => setConfirmEliminate(true)}>
                    Chosen Eliminated
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                      Which hero delivered the killing blow?
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['reaper', 'skirmisher', 'templar'] as const).map(hero => (
                        <button
                          key={hero}
                          onClick={() => handleEliminate(hero, false)}
                          className="py-2 text-xs font-mono capitalize border rounded-[2px] hover:border-amber-600/50 hover:text-amber-400 transition-colors"
                          style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface2)' }}
                        >
                          {hero}
                        </button>
                      ))}
                      {(['reaper', 'skirmisher', 'templar'] as const).map(hero => (
                        <button
                          key={`${hero}-sacrifice`}
                          onClick={() => handleEliminate(hero, true)}
                          className="py-2 text-xs font-mono capitalize border rounded-[2px] hover:border-red-600/50 hover:text-red-400 transition-colors col-span-1"
                          style={{ borderColor: 'var(--border2)', color: '#f87171aa', background: 'var(--surface2)' }}
                        >
                          {hero} (Sacrifice)
                        </button>
                      ))}
                      <button
                        onClick={() => handleEliminate(undefined, false)}
                        className="py-2 text-xs font-mono border rounded-[2px] hover:border-amber-600/50 hover:text-amber-400 transition-colors col-span-2"
                        style={{ borderColor: 'var(--border2)', color: 'var(--text3)', background: 'var(--surface2)' }}
                      >
                        Eliminated (no hero specified)
                      </button>
                    </div>
                    <Button variant="ghost" className="w-full" onClick={() => setConfirmEliminate(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Captured soldiers */}
      <Card>
        <CardBody className="space-y-3">
          <SectionHeading>Captured Soldiers</SectionHeading>

          {capturedSoldiers.length > 0 ? (
            <div className="space-y-2">
              {capturedSoldiers.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-[2px] border border-red-800/40 bg-red-950/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold text-red-300">{s.nickname}</div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                      {s.soldierClass} · {s.rank}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRescueSoldier(s.id)}
                    className="text-[10px] font-mono px-2 py-1 border rounded-[2px] hover:border-green-600/50 hover:text-green-400 transition-colors shrink-0"
                    style={{ borderColor: 'var(--border2)', color: 'var(--text3)' }}
                  >
                    Rescued
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
              No soldiers currently captured by this Chosen.
            </p>
          )}

          {/* Assign captured soldier */}
          {soldiers.filter(s => s.status === 'captured' && !chosenData.capturedSoldierIds.includes(s.id)).length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>
                Assign captured soldier
              </div>
              <select
                className="w-full px-3 py-2 text-xs font-mono rounded-[2px] border outline-none"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--text2)' }}
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    handleAssignCapture(e.target.value)
                    e.target.value = ''
                  }
                }}
              >
                <option value="">— pick a captured soldier —</option>
                {soldiers
                  .filter(s => s.status === 'captured' && !chosenData.capturedSoldierIds.includes(s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nickname} ({s.soldierClass})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </CardBody>
      </Card>

    </div>
  )
}
