import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { rankMissionOptions, computeDoomPressure, generateDoomContextAdvice } from '../../advisor/missionAdvisor'
import type { MissionOption, MissionOptionScore, DoomPressure } from '../../advisor/types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'
import { Input, Select } from '../ui/Input'

type Reward = MissionOption['primaryReward']
type MType = MissionOption['missionType']

const MISSION_TYPES: Array<{ value: MType; label: string }> = [
  { value: 'guerrilla_op_standard', label: 'Guerrilla Op' },
  { value: 'supply_raid', label: 'Supply Raid' },
  { value: 'facility_assault', label: 'Facility Assault' },
  { value: 'retaliation', label: 'Retaliation' },
  { value: 'troop_column', label: 'Troop Column' },
  { value: 'chosen_stronghold', label: 'Chosen Stronghold' },
  { value: 'covert_action', label: 'Covert Action' },
  { value: 'guerrilla_op_timed', label: 'Guerrilla Op (Timed)' },
  { value: 'alien_ruler_encounter', label: 'Alien Ruler' },
]

const REWARD_TYPES: Array<{ value: Reward; label: string }> = [
  { value: 'avatar_reduction', label: 'Avatar Reduction' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'engineers', label: 'Engineers' },
  { value: 'scientists', label: 'Scientists' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'intel', label: 'Intel' },
  { value: 'soldier_rescue', label: 'Soldier Rescue' },
  { value: 'chosen_knowledge', label: 'Chosen Knowledge' },
  { value: 'resistance_ring', label: 'Resistance Ring' },
]

const DOOM_COLORS: Record<DoomPressure, string> = {
  low: 'text-green-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}
const DOOM_BG: Record<DoomPressure, string> = {
  low: 'bg-green-950 border-green-800',
  medium: 'bg-amber-950 border-amber-800',
  high: 'bg-orange-950 border-orange-800',
  critical: 'bg-red-950 border-red-800',
}

function emptyOption(id: string): MissionOption {
  return {
    id,
    label: '',
    missionType: 'guerrilla_op_standard',
    primaryReward: 'supplies',
    countersActiveDarkEvent: false,
  }
}

export function MissionSelector() {
  const { activeCampaign, campaignSoldiers, campaignBonds } = useCampaignStore()
  const campaign = activeCampaign()

  const [options, setOptions] = useState<MissionOption[]>([emptyOption('1'), emptyOption('2')])
  const [missionCount, setMissionCount] = useState(0)
  const [ranked, setRanked] = useState<MissionOptionScore[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const doomPressure = campaign ? computeDoomPressure(campaign.avatarPips) : 'low'
  const doomAdvice = campaign
    ? generateDoomContextAdvice({
        campaign,
        soldiers: campaignSoldiers(),
        missions: [],
        bonds: campaignBonds(),
        doomPressure,
      }, missionCount)
    : []

  const addOption = () => setOptions(prev => [...prev, emptyOption(String(Date.now()))])
  const removeOption = (id: string) => setOptions(prev => prev.filter(o => o.id !== id))
  const updateOption = (id: string, patch: Partial<MissionOption>) =>
    setOptions(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))

  const handleRank = () => {
    if (!campaign) return
    const snap = {
      campaign,
      soldiers: campaignSoldiers(),
      missions: [],
      bonds: campaignBonds(),
      doomPressure,
    }
    setRanked(rankMissionOptions(options.filter(o => o.label.trim()), snap, missionCount))
  }

  if (!campaign) return (
    <div className="text-center py-12 text-neutral-600 font-mono text-sm">No active campaign.</div>
  )

  return (
    <div className="space-y-4">
      {/* Doom Pressure */}
      <div className={`px-3 py-2.5 border rounded-sm ${DOOM_BG[doomPressure]}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-mono font-bold uppercase tracking-wider ${DOOM_COLORS[doomPressure]}`}>
            Doom Pressure: {doomPressure}
          </span>
          <span className="text-xs font-mono text-neutral-500">({campaign.avatarPips}/12 pips)</span>
        </div>
        {doomAdvice.map((a, i) => (
          <p key={i} className="text-xs font-mono text-neutral-400 leading-relaxed">{a}</p>
        ))}
      </div>

      {/* Mission Count */}
      <div className="flex items-center gap-3">
        <label className="field-label mb-0 shrink-0">Missions completed:</label>
        <Input
          type="number"
          value={missionCount}
          onChange={e => setMissionCount(Number(e.target.value))}
          className="w-20"
          min={0}
        />
      </div>

      {/* Mission options */}
      <Card>
        <CardBody className="space-y-3">
          <div className="text-xs font-mono text-amber-600 uppercase tracking-wider">Available Missions</div>
          {options.map((opt, idx) => (
            <div key={opt.id} className="border border-neutral-800 rounded-sm p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-600">#{idx + 1}</span>
                <Input
                  placeholder="Mission name / label"
                  value={opt.label}
                  onChange={e => updateOption(opt.id, { label: e.target.value })}
                  className="flex-1 text-sm"
                />
                {options.length > 1 && (
                  <button onClick={() => removeOption(opt.id)} className="text-neutral-700 hover:text-red-500 text-sm p-1">✕</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label text-xs">Type</label>
                  <Select value={opt.missionType} onChange={e => updateOption(opt.id, { missionType: e.target.value as MType })} className="text-xs">
                    {MISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="field-label text-xs">Primary Reward</label>
                  <Select value={opt.primaryReward} onChange={e => updateOption(opt.id, { primaryReward: e.target.value as Reward })} className="text-xs">
                    {REWARD_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-mono text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.countersActiveDarkEvent}
                    onChange={e => updateOption(opt.id, { countersActiveDarkEvent: e.target.checked })}
                    className="accent-amber-500"
                  />
                  Counters active Dark Event
                </label>
                <label className="flex items-center gap-2 text-xs font-mono text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!opt.chosenTerritory}
                    onChange={e => updateOption(opt.id, { chosenTerritory: e.target.checked })}
                    className="accent-amber-500"
                  />
                  Chosen territory
                </label>
              </div>
              <div>
                <label className="field-label text-xs">Days remaining (optional)</label>
                <Input
                  type="number"
                  placeholder="—"
                  value={opt.daysRemaining ?? ''}
                  onChange={e => updateOption(opt.id, { daysRemaining: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-24 text-sm"
                  min={0}
                />
              </div>
            </div>
          ))}
          <button onClick={addOption} className="w-full py-2 text-xs font-mono text-neutral-600 hover:text-amber-500 border border-dashed border-neutral-800 rounded-sm transition-colors">
            + Add mission option
          </button>
          <Button variant="primary" className="w-full" onClick={handleRank}>
            Rank Opportunities
          </Button>
        </CardBody>
      </Card>

      {/* Results */}
      {ranked && ranked.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-amber-600 uppercase tracking-wider">Priority Order</div>
          {ranked.map(r => (
            <div key={r.option.id} className="border border-neutral-800 rounded-sm bg-neutral-900 overflow-hidden">
              <button
                className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                onClick={() => setExpandedId(expandedId === r.option.id ? null : r.option.id)}
              >
                <span className="text-amber-500 font-mono font-bold text-sm w-5 shrink-0">#{r.rank}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm text-neutral-100">{r.option.label || '(unnamed)'}</span>
                  <div className="text-xs font-mono text-neutral-600 mt-0.5">
                    {MISSION_TYPES.find(t => t.value === r.option.missionType)?.label} · {REWARD_TYPES.find(t => t.value === r.option.primaryReward)?.label}
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-600 shrink-0">Score: {r.score}</span>
                <span className="text-neutral-600 text-xs ml-1">{expandedId === r.option.id ? '▲' : '▼'}</span>
              </button>
              {expandedId === r.option.id && (
                <div className="px-3 pb-3 border-t border-neutral-800 pt-2 space-y-1.5">
                  {r.reasons.map((reason, i) => (
                    <div key={i} className="text-xs font-mono text-green-400 leading-relaxed">{reason}</div>
                  ))}
                  {r.warnings.map((w, i) => (
                    <div key={i} className="text-xs font-mono text-amber-400 leading-relaxed">⚠ {w}</div>
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
