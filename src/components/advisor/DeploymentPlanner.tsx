import { useState, useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { useGameData } from '../../hooks/useGameData'
import { recommendSquad } from '../../advisor/soldierScoring'
import { computeDoomPressure } from '../../advisor/missionAdvisor'
import { MISSION_PROFILES } from '../../advisor/missionProfiles'
import { ADVISOR_GLOSSARY } from '../../advisor/config'
import type { CampaignSnapshot, SoldierScore } from '../../advisor/types'
import {
  CHOSEN_STRENGTHS,
  CHOSEN_WEAKNESSES,
  KNOWLEDGE_TIERS,
  type ChosenType,
  type ChosenStrengthId,
  type ChosenWeaknessId,
} from '../../data/chosen'
import type { ChosenData } from '../../data/types'
import { generateTacticalBrief, type TacticalTip } from '../../advisor/tacticalBrief'
import { recommendLoadouts, type SoldierLoadout } from '../../advisor/armory'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'
import { Select } from '../ui/Input'

// ── Chosen threat helpers ─────────────────────────────────────────────────────

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical'

const THREAT_CONFIG: Record<ThreatLevel, { label: string; color: string; bg: string; border: string }> = {
  low:      { label: 'Low',      color: '#4ade80', bg: '#14532d20', border: '#16a34a40' },
  medium:   { label: 'Medium',   color: '#fbbf24', bg: '#78350f20', border: '#d9770640' },
  high:     { label: 'High',     color: '#f97316', bg: '#7c2d1220', border: '#ea580c40' },
  critical: { label: 'Critical', color: '#f87171', bg: '#450a0a20', border: '#dc262640' },
}

function computeThreatLevel(chosen: ChosenData): ThreatLevel {
  let score = chosen.knowledgeTier * 2
  const dangerous = new Set<string>(['damage_immunity', 'regen', 'armor', 'chain_shot', 'reaper_strike', 'soul_steal', 'mark_of_the_coil'])
  score += chosen.strengths.filter(s => dangerous.has(s)).length * 2
  score += chosen.strengths.length
  if (score >= 11) return 'critical'
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

interface ChosenThreatCardProps {
  chosen: ChosenData
  squad: SoldierScore[]
}

function ChosenThreatCard({ chosen, squad }: ChosenThreatCardProps) {
  const [expanded, setExpanded] = useState(true)
  const threat = computeThreatLevel(chosen)
  const cfg = THREAT_CONFIG[threat]
  const tierLabel = KNOWLEDGE_TIERS.find(k => k.tier === chosen.knowledgeTier)?.label ?? 'Unknown'
  const chosenTypeName = chosen.chosenType.charAt(0).toUpperCase() + chosen.chosenType.slice(1)

  // Active strengths with definitions
  const activeStrengths = chosen.strengths
    .map(id => CHOSEN_STRENGTHS[id as ChosenStrengthId])
    .filter(Boolean)

  // Active weaknesses with exploitation check against squad
  const activeWeaknesses = chosen.weaknesses
    .map(id => {
      const w = CHOSEN_WEAKNESSES[id as ChosenWeaknessId]
      if (!w) return null
      const exploiters = squad
        .filter(s => !s.excluded && w.preferredClasses?.includes(s.soldier.soldierClass))
        .map(s => s.soldier.nickname)
      return { weakness: w, exploiters }
    })
    .filter(Boolean) as Array<{ weakness: typeof CHOSEN_WEAKNESSES[ChosenWeaknessId]; exploiters: string[] }>

  const hasExploiters = activeWeaknesses.some(x => x.exploiters.length > 0)
  const unexploitedWeaknesses = activeWeaknesses.filter(x => x.exploiters.length === 0)

  return (
    <div className="rounded-[2px] overflow-hidden border" style={{ borderColor: cfg.border, background: cfg.bg }}>
      <button
        className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold" style={{ color: cfg.color }}>
              {chosenTypeName} Encounter
            </span>
            <span
              className="px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono font-bold uppercase tracking-wider"
              style={{ background: cfg.color + '20', color: cfg.color }}
            >
              {cfg.label} threat
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
              {tierLabel}
            </span>
          </div>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: cfg.border }}>

          {/* Strengths to watch */}
          {activeStrengths.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>
                Active Strengths — watch out
              </div>
              <div className="space-y-1.5">
                {activeStrengths.map(s => (
                  <div key={s.id} className="text-[10px] font-mono leading-snug" style={{ color: 'var(--text3)' }}>
                    <span className="font-bold" style={{ color: cfg.color }}>{s.name}:</span>{' '}{s.deploymentNote}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses + exploitation */}
          {activeWeaknesses.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>
                Exploitable Weaknesses
              </div>
              <div className="space-y-1.5">
                {activeWeaknesses.map(({ weakness, exploiters }) => (
                  <div key={weakness.id} className="text-[10px] font-mono leading-snug">
                    <div className="flex items-start gap-1.5">
                      <span style={{ color: '#4ade80' }}>
                        {exploiters.length > 0 ? '✓' : '○'}
                      </span>
                      <div>
                        <span className="font-bold" style={{ color: '#4ade80' }}>{weakness.name}:</span>
                        {' '}
                        <span style={{ color: 'var(--text3)' }}>{weakness.exploiterNote}</span>
                        {exploiters.length > 0 && (
                          <div className="mt-0.5" style={{ color: '#86efac' }}>
                            In squad: {exploiters.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No exploiters warning */}
          {unexploitedWeaknesses.length > 0 && (
            <div className="px-2 py-1.5 rounded-[2px] border border-amber-800/40 bg-amber-950/20">
              <div className="text-[10px] font-mono text-amber-400 leading-snug">
                No squad members exploit: {unexploitedWeaknesses.map(x => x.weakness.name).join(', ')}.
                Consider locking in a {unexploitedWeaknesses[0].weakness.preferredClasses?.join(' or ') ?? 'specialist'}.
              </div>
            </div>
          )}

          {/* No weaknesses configured */}
          {activeWeaknesses.length === 0 && (
            <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
              No weaknesses configured for this Chosen. Set them in the Chosen tab.
            </div>
          )}

          {/* No strengths configured */}
          {activeStrengths.length === 0 && (
            <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
              No strengths configured. Set them in the Chosen tab to get tactical warnings.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100))
  return (
    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function SoldierCard({
  ranked, rank, max, locked, banned, onLock, onBan,
}: {
  ranked: SoldierScore
  rank: number
  max: number
  locked: boolean
  banned: boolean
  onLock: () => void
  onBan: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const s = ranked.soldier

  return (
    <div className={`border rounded-sm transition-colors ${
      banned ? 'opacity-30 border-neutral-800' :
      locked ? 'border-amber-600 bg-amber-950/20' :
      'border-neutral-800 bg-neutral-900'
    }`}>
      <div className="px-3 py-2.5 flex items-center gap-2">
        <span className="text-amber-500 font-mono font-bold text-sm w-5 shrink-0">#{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-sm text-neutral-100 truncate">{s.nickname || 'Unnamed'}</span>
            {ranked.excluded && <Badge variant="red">Excluded</Badge>}
            {locked && <Badge variant="amber">Locked</Badge>}
          </div>
          <div className="text-xs font-mono text-neutral-500 mt-0.5">
            {s.rank} · {s.soldierClass} · {s.weaponTier}
          </div>
          <ScoreBar score={ranked.score} max={max} />
          <div className="text-xs font-mono text-amber-600 mt-0.5">Score: {ranked.score}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-mono text-neutral-600 hover:text-neutral-400 p-1.5 min-h-[32px]"
            title="Show score breakdown"
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={onLock}
            className={`text-xs font-mono p-1.5 min-h-[32px] ${locked ? 'text-amber-400' : 'text-neutral-700 hover:text-amber-600'}`}
            title={locked ? 'Unlock soldier' : 'Lock in squad'}
          >
            {locked ? '🔒' : '🔓'}
          </button>
          <button
            onClick={onBan}
            className={`text-xs font-mono p-1.5 min-h-[32px] ${banned ? 'text-red-400' : 'text-neutral-700 hover:text-red-600'}`}
            title={banned ? 'Unban soldier' : 'Remove from suggestions'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Warnings */}
      {ranked.warnings.length > 0 && (
        <div className="px-3 pb-2 space-y-1">
          {ranked.warnings.map((w, i) => (
            <div key={i} className="text-xs font-mono text-amber-500 bg-amber-950/30 px-2 py-1 rounded-sm">{w}</div>
          ))}
        </div>
      )}

      {/* Score breakdown */}
      {expanded && ranked.breakdowns.length > 0 && (
        <div className="px-3 pb-2.5 border-t border-neutral-800 pt-2 space-y-1">
          <div className="text-xs font-mono text-neutral-600 uppercase tracking-wider mb-1">Score breakdown</div>
          {ranked.breakdowns.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              <span className={b.delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                {b.delta >= 0 ? '+' : ''}{b.delta}
              </span>
              <span className="text-neutral-500">{b.label}</span>
              {b.tag && ADVISOR_GLOSSARY[b.tag] && (
                <span className="text-neutral-700 ml-auto cursor-help" title={ADVISOR_GLOSSARY[b.tag]}>?</span>
              )}
            </div>
          ))}
        </div>
      )}

      {ranked.exclusionReason && (
        <div className="px-3 pb-2 text-xs font-mono text-red-400">{ranked.exclusionReason}</div>
      )}
    </div>
  )
}

const PHASE_LABEL: Record<TacticalTip['phase'], string> = {
  setup:   'Pre-Mission',
  opening: 'Opening',
  mid:     'Mid-Game',
  closing: 'Closing',
}

const SLOT_PRIORITY_STYLE: Record<string, string> = {
  essential:    'text-red-400',
  recommended:  'text-amber-400',
  optional:     'text-neutral-500',
}

function LoadoutPanel({ loadouts }: { loadouts: SoldierLoadout[] }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="border border-neutral-700 rounded-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-900 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-300">
          Armory Loadout Recommendations
        </span>
        <span className="text-neutral-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="divide-y divide-neutral-800">
          {loadouts.map(l => (
            <div key={l.soldierId} className="px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-neutral-200">{l.soldierName}</span>
                <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wide">{l.soldierClass}</span>
              </div>
              {l.armorNote && (
                <p className="text-[10px] font-mono text-blue-400 leading-snug">{l.armorNote}</p>
              )}
              {l.slots.length === 0 ? (
                <p className="text-[10px] font-mono text-neutral-600">No specific items to assign from current stock.</p>
              ) : (
                <div className="space-y-1">
                  {l.slots.map((slot, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase shrink-0 w-12 ${SLOT_PRIORITY_STYLE[slot.priority]}`}>
                        {slot.priority.slice(0, 3).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono text-neutral-300">{slot.itemName}</span>
                        {!slot.inStock && (
                          <span className="ml-1.5 text-[10px] font-mono text-red-600">(out of stock)</span>
                        )}
                        <p className="text-[10px] font-mono text-neutral-600 leading-snug">{slot.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PRIORITY_STYLE: Record<TacticalTip['priority'], { dot: string; text: string }> = {
  critical: { dot: '#f87171', text: '#fca5a5' },
  high:     { dot: '#fbbf24', text: '#fde68a' },
  normal:   { dot: '#6b7280', text: 'var(--text3)' },
}

function TacticalBriefPanel({ tips }: { tips: TacticalTip[] }) {
  const [expanded, setExpanded] = useState(true)
  if (tips.length === 0) return null

  const byPhase: Record<TacticalTip['phase'], TacticalTip[]> = {
    setup: [], opening: [], mid: [], closing: [],
  }
  for (const tip of tips) byPhase[tip.phase].push(tip)
  const phases = (['setup', 'opening', 'mid', 'closing'] as const).filter(p => byPhase[p].length > 0)

  return (
    <div className="border border-neutral-700 rounded-sm overflow-hidden">
      <button
        className="w-full px-3 py-2.5 flex items-center gap-2 bg-neutral-800/60 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-xs font-mono font-bold uppercase tracking-wider flex-1" style={{ color: 'var(--text2)' }}>
          Tactical Brief
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 py-3 space-y-4">
          {phases.map(phase => (
            <div key={phase}>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
                {PHASE_LABEL[phase]}
              </div>
              <div className="space-y-2">
                {byPhase[phase].map((tip, i) => {
                  const style = PRIORITY_STYLE[tip.priority]
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="mt-[5px] shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                      <p className="text-[11px] font-mono leading-snug" style={{ color: style.text }}>
                        {tip.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DeploymentPlanner() {
  const { activeCampaign, campaignSoldiers, campaignBonds, campaignChosen } = useCampaignStore()
  const { dlc } = useGameData()
  const campaign = activeCampaign()
  const soldiers = campaignSoldiers()
  const bonds = campaignBonds()

  const [missionTypeId, setMissionTypeId] = useState<string>('guerrilla_op_standard')
  const [squadSize, setSquadSize] = useState(4)
  const [lockedIds, setLockedIds] = useState<string[]>([])
  const [bannedIds, setBannedIds] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)
  const [expandedWarnings, setExpandedWarnings] = useState(false)
  const [chosenEncounter, setChosenEncounter] = useState(false)
  const [selectedChosenType, setSelectedChosenType] = useState<ChosenType>('assassin')

  const availableProfiles = MISSION_PROFILES.filter(p =>
    p.source === 'base' ||
    (p.source === 'wotc' && dlc.wotc) ||
    (p.source === 'alien_hunters' && dlc.alienHunters)
  )

  const snapshot: CampaignSnapshot | null = campaign ? {
    campaign,
    soldiers,
    missions: [],
    bonds,
    doomPressure: computeDoomPressure(campaign.avatarPips),
  } : null

  const { result, tacticalBrief, loadouts } = useMemo(() => {
    if (!snapshot || !generated) return { result: null, tacticalBrief: [], loadouts: [] }
    const profile = availableProfiles.find(p => p.id === missionTypeId)
    if (!profile) return { result: null, tacticalBrief: [], loadouts: [] }
    const squadResult = recommendSquad({ profile, snapshot, squadSize, lockedIds, bannedIds })
    const armory = campaign?.armory ?? {}
    const hasArmory = Object.values(armory).some(v => v > 0)
    return {
      result: squadResult,
      tacticalBrief: generateTacticalBrief(squadResult, profile, snapshot),
      loadouts: hasArmory ? recommendLoadouts(squadResult.recommended, armory, profile) : [],
    }
  }, [missionTypeId, squadSize, lockedIds, bannedIds, generated, soldiers, bonds, campaign])

  const maxScore = result ? Math.max(...result.recommended.map(s => s.score), 1) : 1

  const toggleLock = (id: string) => setLockedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleBan = (id: string) => {
    setBannedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setLockedIds(prev => prev.filter(x => x !== id))
  }

  if (!campaign) return (
    <div className="text-center py-12 text-neutral-600 font-mono text-sm">No active campaign.</div>
  )

  return (
    <div className="space-y-4">
      {/* Config */}
      <Card>
        <CardBody className="space-y-3">
          <div>
            <label className="field-label">Mission Type</label>
            <Select value={missionTypeId} onChange={e => { setMissionTypeId(e.target.value); setGenerated(false) }}>
              {availableProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            {availableProfiles.find(p => p.id === missionTypeId) && (
              <p className="text-xs text-neutral-600 font-mono mt-1">
                {availableProfiles.find(p => p.id === missionTypeId)!.description}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Squad Size</label>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => { setSquadSize(n); setGenerated(false) }}
                  className={`flex-1 py-2.5 text-sm font-mono font-bold border rounded-sm ${
                    squadSize === n ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>

          {/* Chosen encounter toggle (WotC only) */}
          {dlc.wotc && (
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={chosenEncounter}
                    onChange={e => setChosenEncounter(e.target.checked)}
                  />
                  <div
                    className={`w-8 h-4 rounded-full transition-colors ${chosenEncounter ? 'bg-amber-500' : ''}`}
                    style={!chosenEncounter ? { background: 'var(--border2)' } : undefined}
                  />
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform ${chosenEncounter ? 'translate-x-4 bg-neutral-950' : 'translate-x-0.5 bg-neutral-400'}`}
                  />
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text2)' }}>
                  Chosen encounter expected
                </span>
              </label>
              {chosenEncounter && (
                <div className="flex rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border2)' }}>
                  {(['assassin', 'hunter', 'warlock'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedChosenType(t)}
                      className={`flex-1 py-2 text-[11px] font-mono font-semibold capitalize transition-colors ${
                        selectedChosenType === t
                          ? 'bg-amber-500 text-neutral-950'
                          : 'hover:text-neutral-300'
                      }`}
                      style={selectedChosenType !== t ? { background: 'var(--surface2)', color: 'var(--text3)' } : undefined}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button variant="primary" className="w-full" onClick={() => setGenerated(true)}>
            Generate Recommendations
          </Button>
        </CardBody>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Data quality notice */}
          {result.dataQuality !== 'full' && (
            <div className="px-3 py-2 bg-blue-950 border border-blue-800 rounded-sm">
              <div className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider mb-1">
                {result.dataQuality === 'minimal' ? 'Minimal data' : 'Partial data'}
              </div>
              {result.missingDataHints.map((h, i) => (
                <p key={i} className="text-xs text-blue-300 font-mono">{h}</p>
              ))}
            </div>
          )}

          {/* Squad warnings */}
          {result.squadWarnings.length > 0 && (
            <div className="border border-amber-800 rounded-sm overflow-hidden">
              <button
                className="w-full px-3 py-2.5 flex items-center gap-2 bg-amber-950/30"
                onClick={() => setExpandedWarnings(e => !e)}
              >
                <span className="text-amber-400 text-sm">⚠</span>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex-1 text-left">
                  {result.squadWarnings.length} Squad Warning{result.squadWarnings.length > 1 ? 's' : ''}
                </span>
                <span className="text-amber-600 text-xs">{expandedWarnings ? '▲' : '▼'}</span>
              </button>
              {expandedWarnings && (
                <div className="px-3 pb-3 pt-1 space-y-1.5">
                  {result.squadWarnings.map((w, i) => (
                    <div key={i} className="text-xs font-mono text-amber-300 leading-relaxed">{w}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Missing roles */}
          {result.missingRoles.length > 0 && (
            <div className="px-3 py-2.5 bg-red-950 border border-red-800 rounded-sm">
              <div className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider mb-1">Missing Required Roles</div>
              {result.missingRoles.map(r => (
                <p key={r} className="text-xs text-red-300 font-mono">✕ No {r} available</p>
              ))}
            </div>
          )}

          {/* Bond pairs */}
          {result.bondPairsInSquad.length > 0 && (
            <div className="px-3 py-2.5 bg-purple-950 border border-purple-800 rounded-sm">
              <div className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider mb-1">Bond Synergies ✦</div>
              {result.bondPairsInSquad.map((b, i) => (
                <p key={i} className="text-xs text-purple-300 font-mono">{b.s1Name} + {b.s2Name}: {b.note}</p>
              ))}
            </div>
          )}

          {/* Recommended squad */}
          <div>
            <div className="text-xs font-mono text-amber-600 uppercase tracking-wider mb-2">
              Recommended Squad ({result.recommended.length}/{squadSize})
            </div>
            <div className="space-y-2">
              {result.recommended.map((s, i) => (
                <SoldierCard
                  key={s.soldier.id}
                  ranked={s}
                  rank={i + 1}
                  max={maxScore}
                  locked={lockedIds.includes(s.soldier.id)}
                  banned={bannedIds.includes(s.soldier.id)}
                  onLock={() => toggleLock(s.soldier.id)}
                  onBan={() => toggleBan(s.soldier.id)}
                />
              ))}
            </div>
          </div>

          {/* Alternates */}
          {result.alternates.length > 0 && (
            <div>
              <div className="text-xs font-mono text-neutral-600 uppercase tracking-wider mb-2">Alternates</div>
              <div className="space-y-2">
                {result.alternates.map((s, i) => (
                  <SoldierCard
                    key={s.soldier.id}
                    ranked={s}
                    rank={result.recommended.length + i + 1}
                    max={maxScore}
                    locked={lockedIds.includes(s.soldier.id)}
                    banned={bannedIds.includes(s.soldier.id)}
                    onLock={() => toggleLock(s.soldier.id)}
                    onBan={() => toggleBan(s.soldier.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tactical brief */}
          <TacticalBriefPanel tips={tacticalBrief} />

          {/* Loadout recommendations */}
          {loadouts.length > 0 && <LoadoutPanel loadouts={loadouts} />}

          {/* Chosen threat card */}
          {chosenEncounter && dlc.wotc && (() => {
            const chosenRecord = campaignChosen().find(c => c.chosenType === selectedChosenType)
            if (!chosenRecord) return null
            return (
              <ChosenThreatCard
                chosen={chosenRecord}
                squad={result.recommended}
              />
            )
          })()}
        </>
      )}
    </div>
  )
}
