import { useState, useMemo } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useGameData } from '../hooks/useGameData'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import type { ResearchProject, Facility } from '../data/types'

const PRIORITY_PATHS = [
  {
    id: 'mag_rush',
    name: 'Mag Rush',
    description: 'Prioritize Magnetic Weapons ASAP for a big early damage spike.',
    steps: ['modular_weapons', 'magnetic_weapons', 'advent_trooper_autopsy', 'plated_armor'],
  },
  {
    id: 'armor_first',
    name: 'Armor First',
    description: 'Get Plated Armor quickly to reduce casualties before weapons.',
    steps: ['alien_biotech', 'muton_autopsy', 'plated_armor', 'modular_weapons', 'magnetic_weapons'],
  },
  {
    id: 'psi_rush',
    name: 'Psi Rush',
    description: 'Train a Psi Operative early for Domination and Stasis wins.',
    steps: ['alien_biotech', 'sectoid_autopsy', 'psi_gate', 'psionics'],
  },
]

export function Research() {
  const { activeCampaign, updateCampaign } = useCampaignStore()
  const { research, difficulty } = useGameData()
  const campaign = activeCampaign()

  const [activeTab, setActiveTab] = useState<'tree' | 'avenger'>('tree')
  const [filter, setFilter] = useState<'all' | 'available' | 'done'>('all')

  if (!campaign) {
    return <div className="flex items-center justify-center h-64 text-neutral-600 font-mono text-sm">No active campaign.</div>
  }

  const completed = campaign.completedResearch ?? []
  const pinned = campaign.pinnedResearchPaths ?? []

  const toggleCompleted = (id: string) => {
    const next = completed.includes(id) ? completed.filter(r => r !== id) : [...completed, id]
    updateCampaign(campaign.id, { completedResearch: next })
  }

  const togglePinPath = (pathId: string) => {
    const next = pinned.includes(pathId) ? pinned.filter(p => p !== pathId) : [...pinned, pathId]
    updateCampaign(campaign.id, { pinnedResearchPaths: next })
  }

  const isAvailable = (project: ResearchProject): boolean => {
    return project.prerequisites.every(prereq => completed.includes(prereq))
  }

  const filtered = research.filter(r => {
    if (filter === 'done') return completed.includes(r.id)
    if (filter === 'available') return isAvailable(r) && !completed.includes(r.id)
    return true
  })

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-4 py-3 space-y-2">
        <div className="flex gap-1">
          {(['tree', 'avenger'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs font-mono uppercase font-bold border rounded-sm min-h-[40px] ${
                activeTab === t ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {t === 'tree' ? 'Research' : 'Avenger'}
            </button>
          ))}
        </div>
        {activeTab === 'tree' && (
          <div className="flex gap-1">
            {(['all', 'available', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-mono uppercase rounded-sm min-h-[32px] ${
                  filter === f ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-neutral-400'
                }`}
              >{f}</button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'tree' ? (
        <div className="px-4 pt-3 space-y-3">
          {/* Priority paths */}
          {(filter === 'all') && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-amber-600 uppercase tracking-wider">Recommended Paths</div>
              {PRIORITY_PATHS.map(path => (
                <Card key={path.id} className={pinned.includes(path.id) ? 'border-amber-700' : ''}>
                  <CardBody className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-neutral-100">{path.name}</span>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">{path.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {path.steps.map(sid => {
                            const r = research.find(r => r.id === sid)
                            return (
                              <span key={sid} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                                completed.includes(sid)
                                  ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                                  : 'border-white/8 bg-white/4 text-neutral-500'
                              }`}>
                                {r?.name ?? sid}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => togglePinPath(path.id)}
                        className={`shrink-0 ml-2 p-1 transition-colors ${pinned.includes(path.id) ? 'text-amber-400' : 'text-neutral-700 hover:text-neutral-500'}`}
                        title={pinned.includes(path.id) ? 'Unpin path' : 'Pin path'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={pinned.includes(path.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                        </svg>
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))}
              <div className="border-b border-neutral-800 my-2" />
            </div>
          )}

          {/* Research list */}
          <div className="space-y-2">
            {filtered.map(r => {
              const done = completed.includes(r.id)
              const available = isAvailable(r)
              return (
                <button
                  key={r.id}
                  onClick={() => toggleCompleted(r.id)}
                  className={`w-full text-left p-3 border rounded-sm transition-colors ${
                    done ? 'opacity-50 border-white/8' :
                    available ? 'border-neutral-700 hover:border-amber-700/60' :
                    'border-neutral-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 border rounded-sm shrink-0 flex items-center justify-center text-xs ${done ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-700'}`}>
                      {done ? '✓' : ''}
                    </span>
                    <span className="font-mono font-bold text-sm text-neutral-100">{r.name}</span>
                    {r.approx && <span className="text-amber-500 text-xs">~</span>}
                    {!available && !done && <Badge variant="gray">Locked</Badge>}
                    <span className="ml-auto text-xs font-mono text-neutral-600">{r.days[difficulty]}d</span>
                  </div>
                  <p className="text-xs text-neutral-500 font-mono mt-1 ml-6">{r.description}</p>
                  {r.prerequisites.length > 0 && !done && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-6">
                      <span className="text-[10px] font-mono text-neutral-600">Needs: </span>
                      {r.prerequisites.map(pid => {
                        const pr = research.find(rr => rr.id === pid)
                        return (
                          <span key={pid} className={`text-[10px] font-mono px-1 py-0.5 rounded-sm ${
                            completed.includes(pid) ? 'text-green-400' : 'text-neutral-500'
                          }`}>
                            {pr?.name ?? pid}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {r.unlocks.length > 0 && (
                    <div className="ml-6 mt-1.5 text-[10px] font-mono text-neutral-600">
                      Unlocks: {r.unlocks.slice(0, 2).join(' · ')}{r.unlocks.length > 2 ? ` +${r.unlocks.length - 2}` : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <AvengerPlanner campaign={campaign} />
      )}
    </div>
  )
}

function AvengerPlanner({ campaign }: { campaign: import('../data/types').Campaign }) {
  const { facilities } = useGameData()
  const { updateCampaign } = useCampaignStore()

  const GRID_COLS = 4
  const GRID_ROWS = 3
  // Exposed coil cells (row 0: col 0 and 3 are power-boosted positions)
  const POWER_CELLS = new Set(['0-0', '0-3', '2-0', '2-3'])

  const placements = campaign.facilityPlacements ?? []

  const getFacilityAt = (col: number, row: number) =>
    placements.find(p => p.col === col && p.row === row)

  const placeFacility = (col: number, row: number, facilityId: string | null) => {
    const filtered = placements.filter(p => !(p.col === col && p.row === row))
    const next = facilityId ? [...filtered, { col, row, facilityId }] : filtered
    updateCampaign(campaign.id, { facilityPlacements: next })
  }

  const totalPower = 12 + placements.reduce((acc, p) => {
    const f = facilities.find(f => f.id === p.facilityId)
    return acc + (f ? -f.powerCost : 0)
  }, 0)

  return (
    <div className="px-4 pt-3 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Avenger Grid (4×3)</span>
        <Badge variant={totalPower < 0 ? 'red' : totalPower < 3 ? 'amber' : 'green'}>
          ⚡ {totalPower} Power
        </Badge>
      </div>

      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
        {Array.from({ length: GRID_ROWS }).flatMap((_, row) =>
          Array.from({ length: GRID_COLS }).map((_, col) => {
            const key = `${row}-${col}`
            const isPowerCell = POWER_CELLS.has(key)
            const placement = getFacilityAt(col, row)
            const facility = placement ? facilities.find(f => f.id === placement.facilityId) : null
            return (
              <AvengerCell
                key={key}
                col={col}
                row={row}
                isPowerCell={isPowerCell}
                facility={facility ?? null}
                facilities={facilities}
                onPlace={(fid) => placeFacility(col, row, fid)}
              />
            )
          })
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs font-mono text-neutral-600">
          Starting power: 12 · Exposed coil cells (corners): marked with ⚡
        </div>
        <div className="text-xs font-mono text-neutral-600">
          Tap a cell to assign or clear a facility.
        </div>
      </div>
    </div>
  )
}

function AvengerCell({ col, row, isPowerCell, facility, facilities, onPlace }: {
  col: number; row: number; isPowerCell: boolean
  facility: Facility | null
  facilities: Facility[]
  onPlace: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`h-16 border rounded-sm flex flex-col items-center justify-center text-xs font-mono transition-colors p-1 ${
          facility ? 'bg-amber-950 border-amber-700 text-amber-300' :
          isPowerCell ? 'bg-neutral-800 border-yellow-800 text-yellow-700' :
          'bg-neutral-900 border-neutral-800 text-neutral-700 hover:border-neutral-700'
        }`}
      >
        {isPowerCell && !facility && <span className="text-yellow-600 text-base mb-0.5">⚡</span>}
        {facility ? (
          <span className="text-center leading-tight text-[10px] font-bold uppercase">{facility.name.replace(' (WotC)', '').substring(0,14)}</span>
        ) : (
          <span className="text-neutral-700">Empty</span>
        )}
      </button>

      {open && (
        <Modal title={`Cell [${col+1},${row+1}]`} onClose={() => setOpen(false)}>
          <div className="space-y-2">
            {facility && (
              <button
                className="w-full py-3 bg-red-950 border border-red-800 text-red-400 font-mono text-sm rounded-sm"
                onClick={() => { onPlace(null); setOpen(false) }}
              >
                ✕ Remove {facility.name}
              </button>
            )}
            {facilities.map(f => (
              <button
                key={f.id}
                onClick={() => { onPlace(f.id); setOpen(false) }}
                className="w-full text-left p-3 bg-neutral-800 border border-neutral-700 rounded-sm hover:border-amber-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-neutral-100">{f.name}</span>
                  <span className={`text-xs font-mono ${f.powerCost > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {f.powerCost > 0 ? `-${f.powerCost}` : `+${Math.abs(f.powerCost)}`} ⚡
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono mt-1">{f.effects[0]}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
