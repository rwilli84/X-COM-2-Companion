import { useState, useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { useGameData } from '../../hooks/useGameData'
import { recommendSquad } from '../../advisor/soldierScoring'
import { computeDoomPressure } from '../../advisor/missionAdvisor'
import { MISSION_PROFILES } from '../../advisor/missionProfiles'
import { ADVISOR_GLOSSARY } from '../../advisor/config'
import type { CampaignSnapshot, SoldierScore } from '../../advisor/types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'
import { Select } from '../ui/Input'

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

export function DeploymentPlanner() {
  const { activeCampaign, campaignSoldiers, campaignBonds } = useCampaignStore()
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

  const result = useMemo(() => {
    if (!snapshot || !generated) return null
    const profile = availableProfiles.find(p => p.id === missionTypeId)
    if (!profile) return null
    return recommendSquad({ profile, snapshot, squadSize, lockedIds, bannedIds })
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
        </>
      )}
    </div>
  )
}
