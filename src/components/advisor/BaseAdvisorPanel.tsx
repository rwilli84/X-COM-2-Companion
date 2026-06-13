import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { advisePlan } from '../../advisor/baseAdvisor'
import { computeDoomPressure } from '../../advisor/missionAdvisor'
import type { BasePlan, BaseRecommendation } from '../../advisor/types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'
import { Input } from '../ui/Input'

const URGENCY_BADGE: Record<BaseRecommendation['urgency'], { variant: 'red' | 'amber' | 'blue' | 'gray'; label: string }> = {
  critical: { variant: 'red', label: 'Critical' },
  high:     { variant: 'amber', label: 'High' },
  medium:   { variant: 'blue', label: 'Medium' },
  low:      { variant: 'gray', label: 'Low' },
}

export function BaseAdvisorPanel() {
  const { activeCampaign, campaignSoldiers, campaignBonds } = useCampaignStore()
  const campaign = activeCampaign()

  const [missionCount, setMissionCount] = useState(0)
  const [engineerCount, setEngineerCount] = useState(2)
  const [scientistCount, setScientistCount] = useState(1)
  const [plan, setPlan] = useState<BasePlan | null>(null)
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
    setPlan(advisePlan(snap, missionCount, engineerCount, scientistCount))
  }

  if (!campaign) return (
    <div className="text-center py-12 text-neutral-600 font-mono text-sm">No active campaign.</div>
  )

  const builtFacilityIds = campaign.facilityPlacements.map(p => p.facilityId)

  return (
    <div className="space-y-4">
      {/* Built facilities summary */}
      {builtFacilityIds.length > 0 && (
        <div className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-sm">
          <div className="text-xs font-mono text-neutral-600 uppercase tracking-wider mb-1.5">Current Avenger ({builtFacilityIds.length} facilities)</div>
          <div className="flex flex-wrap gap-1">
            {builtFacilityIds.map(id => (
              <span key={id} className="text-xs font-mono text-amber-700 bg-neutral-800 px-1.5 py-0.5 rounded-sm">{id.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="field-label text-xs">Missions</label>
              <Input type="number" value={missionCount} onChange={e => setMissionCount(Number(e.target.value))} min={0} className="text-sm" />
            </div>
            <div>
              <label className="field-label text-xs">Engineers</label>
              <Input type="number" value={engineerCount} onChange={e => setEngineerCount(Number(e.target.value))} min={0} className="text-sm" />
            </div>
            <div>
              <label className="field-label text-xs">Scientists</label>
              <Input type="number" value={scientistCount} onChange={e => setScientistCount(Number(e.target.value))} min={0} className="text-sm" />
            </div>
          </div>
          <Button variant="primary" className="w-full" onClick={handleGenerate}>
            Analyse Base
          </Button>
        </CardBody>
      </Card>

      {plan && (
        <>
          {/* Power & Contacts summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`px-3 py-2.5 border rounded-sm ${plan.powerMargin < 2 ? 'bg-red-950 border-red-800' : plan.powerMargin < 4 ? 'bg-amber-950 border-amber-800' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Power Margin</div>
              <div className={`text-2xl font-mono font-bold mt-1 ${plan.powerMargin < 2 ? 'text-red-400' : plan.powerMargin < 4 ? 'text-amber-400' : 'text-green-400'}`}>
                {plan.powerMargin >= 0 ? '+' : ''}{plan.powerMargin}
              </div>
            </div>
            <div className="px-3 py-2.5 border border-neutral-800 rounded-sm bg-neutral-900">
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Contacts Available</div>
              <div className="text-2xl font-mono font-bold mt-1 text-blue-400">{plan.contactsRemaining}</div>
            </div>
          </div>

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <div className="space-y-1.5">
              {plan.warnings.map((w, i) => (
                <div key={i} className="px-3 py-2 bg-amber-950/40 border border-amber-800 rounded-sm text-xs font-mono text-amber-300 leading-relaxed">{w}</div>
              ))}
            </div>
          )}

          {/* Next Builds */}
          {plan.nextBuilds.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-amber-600 uppercase tracking-wider">Next Build Priorities</div>
              {plan.nextBuilds.map((rec) => {
                const badge = URGENCY_BADGE[rec.urgency]
                return (
                  <div key={rec.facilityId} className="border border-neutral-800 rounded-sm bg-neutral-900 overflow-hidden">
                    <button
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                      onClick={() => setExpandedId(expandedId === rec.facilityId ? null : rec.facilityId)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-sm text-neutral-100">{rec.facilityName}</span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        {rec.suggestedCell && (
                          <div className="text-xs font-mono text-neutral-600 mt-0.5">
                            Suggested: col {rec.suggestedCell.col + 1}, row {rec.suggestedCell.row + 1}
                          </div>
                        )}
                      </div>
                      <span className="text-amber-600 text-xs font-mono shrink-0">Score: {rec.score}</span>
                      <span className="text-neutral-600 text-xs ml-1">{expandedId === rec.facilityId ? '▲' : '▼'}</span>
                    </button>
                    {expandedId === rec.facilityId && rec.reasons.filter(Boolean).length > 0 && (
                      <div className="px-3 pb-3 border-t border-neutral-800 pt-2 space-y-1.5">
                        {rec.reasons.filter(Boolean).map((reason, i) => (
                          <p key={i} className="text-xs font-mono text-neutral-300 leading-relaxed">{reason}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Staffing */}
          {plan.staffing.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-amber-600 uppercase tracking-wider">Staffing Recommendations</div>
              {plan.staffing.map((s, i) => (
                <div key={i} className="px-3 py-2.5 border border-neutral-800 rounded-sm bg-neutral-900">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="blue">{s.role}</Badge>
                    <span className="text-xs font-mono text-neutral-400">→ {s.bestFacility}</span>
                  </div>
                  <p className="text-xs font-mono text-neutral-500 leading-relaxed">{s.reason}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
