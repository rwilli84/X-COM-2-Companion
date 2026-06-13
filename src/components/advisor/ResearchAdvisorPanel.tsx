import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { recommendResearch } from '../../advisor/researchAdvisor'
import { computeDoomPressure } from '../../advisor/missionAdvisor'
import type { ResearchRecommendation } from '../../advisor/types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'
import { Input } from '../ui/Input'

const URGENCY_BADGE: Record<ResearchRecommendation['urgency'], { variant: 'red' | 'amber' | 'blue' | 'gray'; label: string }> = {
  critical: { variant: 'red', label: 'Critical' },
  high:     { variant: 'amber', label: 'High' },
  medium:   { variant: 'blue', label: 'Medium' },
  low:      { variant: 'gray', label: 'Low' },
}

export function ResearchAdvisorPanel() {
  const { activeCampaign, campaignSoldiers, campaignBonds } = useCampaignStore()
  const campaign = activeCampaign()

  const [missionCount, setMissionCount] = useState(0)
  const [scientistCount, setScientistCount] = useState(1)
  const [results, setResults] = useState<ResearchRecommendation[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!campaign) return
    const doomPressure = computeDoomPressure(campaign.avatarPips)
    const snap = {
      campaign,
      soldiers: campaignSoldiers(),
      missions: [],
      bonds: campaignBonds(),
      doomPressure,
    }
    setResults(recommendResearch(snap, missionCount, scientistCount))
  }

  if (!campaign) return (
    <div className="text-center py-12 text-neutral-600 font-mono text-sm">No active campaign.</div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Missions completed</label>
              <Input
                type="number"
                value={missionCount}
                onChange={e => setMissionCount(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="field-label">Scientists</label>
              <Input
                type="number"
                value={scientistCount}
                onChange={e => setScientistCount(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          {campaign.completedResearch.length > 0 && (
            <div>
              <div className="field-label">Completed research ({campaign.completedResearch.length})</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.completedResearch.slice(0, 8).map(id => (
                  <span key={id} className="text-xs font-mono text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded-sm">{id}</span>
                ))}
                {campaign.completedResearch.length > 8 && (
                  <span className="text-xs font-mono text-neutral-700">+{campaign.completedResearch.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          <Button variant="primary" className="w-full" onClick={handleGenerate}>
            Get Research Recommendations
          </Button>
        </CardBody>
      </Card>

      {results && results.length === 0 && (
        <div className="text-center py-8 text-neutral-600 font-mono text-sm">
          No available research projects — check DLC settings or completed research.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-amber-600 uppercase tracking-wider">Top Research Priorities</div>
          {results.map((r, i) => {
            const badge = URGENCY_BADGE[r.urgency]
            return (
              <div key={r.researchId} className="border border-neutral-800 rounded-sm bg-neutral-900 overflow-hidden">
                <button
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                  onClick={() => setExpandedId(expandedId === r.researchId ? null : r.researchId)}
                >
                  <span className="text-amber-500 font-mono font-bold text-sm w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-sm text-neutral-100">{r.researchName}</span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="text-xs font-mono text-neutral-500 mt-0.5">
                      ~{r.estimatedDays}d with {scientistCount} scientist{scientistCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span className="text-neutral-600 text-xs ml-1">{expandedId === r.researchId ? '▲' : '▼'}</span>
                </button>
                {expandedId === r.researchId && (
                  <div className="px-3 pb-3 border-t border-neutral-800 pt-2 space-y-2">
                    {r.reasons.map((reason, j) => (
                      <p key={j} className="text-xs font-mono text-neutral-300 leading-relaxed">{reason}</p>
                    ))}
                    <div className="pt-1 border-t border-neutral-800">
                      <span className="text-xs font-mono text-neutral-600">Opportunity cost: </span>
                      <span className="text-xs font-mono text-blue-400">{r.opportunityCost}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
