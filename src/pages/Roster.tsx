import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useGameData } from '../hooks/useGameData'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardBody } from '../components/ui/Card'
import { SoldierModal } from '../components/soldiers/SoldierModal'
import { SkillTreeModal } from '../components/soldiers/SkillTreeModal'
import type { Soldier, SoldierStatus, SoldierClass } from '../data/types'

const statusColors: Record<SoldierStatus, 'green' | 'amber' | 'gray' | 'red' | 'purple' | 'blue'> = {
  ready: 'green',
  wounded: 'amber',
  tired: 'gray',
  shaken: 'blue',
  dead: 'red',
  captured: 'purple',
  missing: 'gray',
}

const statusIcon: Record<SoldierStatus, string> = {
  ready: '●',
  wounded: '✚',
  tired: '◑',
  shaken: '⚠',
  dead: '✕',
  captured: '⛓',
  missing: '?',
}

const rankOrder = ['rookie','squaddie','corporal','sergeant','lieutenant','captain','major','colonel']

function rankShort(r: string) {
  const map: Record<string, string> = {
    rookie: 'RKT', squaddie: 'SQD', corporal: 'CPL', sergeant: 'SGT',
    lieutenant: 'LT', captain: 'CPT', major: 'MAJ', colonel: 'COL',
  }
  return map[r] ?? r.substring(0,3).toUpperCase()
}

type FilterStatus = 'all' | 'active' | 'dead'

export function Roster() {
  const { campaignSoldiers, createSoldier, activeCampaign } = useCampaignStore()
  const { classes, dlc } = useGameData()
  const campaign = activeCampaign()
  const soldiers = campaignSoldiers()

  const [filter, setFilter] = useState<FilterStatus>('active')
  const [editingSoldier, setEditingSoldier] = useState<Soldier | null>(null)
  const [treeForSoldier, setTreeForSoldier] = useState<Soldier | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = soldiers.filter(s => {
    if (filter === 'active') return s.status !== 'dead'
    if (filter === 'dead') return s.status === 'dead'
    return true
  }).sort((a, b) => rankOrder.indexOf(b.rank) - rankOrder.indexOf(a.rank))

  const handleNewSoldier = () => {
    setEditingSoldier({
      id: '',
      campaignId: campaign?.id ?? '',
      nickname: '',
      soldierClass: 'ranger',
      rank: 'rookie',
      status: 'ready',
      plannedAbilities: [],
      takenAbilities: [],
      weaponTier: 'conventional',
      armorTier: 'none',
      loadoutNotes: '',
      killCount: 0,
      missionCount: 0,
      createdAt: 0,
      updatedAt: 0,
    })
    setCreating(true)
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1">
          {(['active', 'all', 'dead'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded-sm min-h-[36px] ${
                filter === f ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={handleNewSoldier}>+ Soldier</Button>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-600 font-mono text-sm">
            <div className="text-neutral-700 font-mono text-sm mb-1">No soldiers</div>
            <div className="text-xs text-neutral-600">Add your squad to get started.</div>
          </div>
        )}

        {filtered.map(soldier => (
          <Card
            key={soldier.id}
            className={`cursor-pointer hover:border-neutral-700 transition-colors ${
              soldier.status === 'dead' ? 'opacity-60' : ''
            }`}
          >
            <CardBody className="flex items-center gap-3 py-3">
              <div className={`text-2xl font-mono font-bold w-10 text-center ${
                soldier.status === 'dead' ? 'text-red-500' : 'text-amber-400'
              }`}>
                {statusIcon[soldier.status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-100 truncate">{soldier.nickname || 'Unnamed'}</span>
                  <Badge variant={statusColors[soldier.status]} className="shrink-0">
                    {soldier.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono text-amber-600 font-bold">{rankShort(soldier.rank)}</span>
                  <span className="text-xs font-mono text-neutral-500">
                    {classes.find(c => c.id === soldier.soldierClass)?.name ?? soldier.soldierClass}
                  </span>
                  <span className="text-xs font-mono text-neutral-600">{soldier.weaponTier} / {soldier.armorTier}</span>
                  {soldier.killCount > 0 && (
                    <span className="text-xs font-mono text-red-400">💀 {soldier.killCount}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  className="text-xs font-mono text-neutral-500 hover:text-amber-400 transition-colors min-h-[32px] px-2"
                  onClick={() => { setEditingSoldier(soldier); setCreating(false) }}
                >
                  Edit
                </button>
                <button
                  className="text-xs font-mono text-neutral-500 hover:text-blue-400 transition-colors min-h-[32px] px-2"
                  onClick={() => setTreeForSoldier(soldier)}
                >
                  Skills
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {editingSoldier && (
        <SoldierModal
          soldier={editingSoldier}
          isNew={creating}
          classes={classes}
          dlc={dlc}
          onClose={() => { setEditingSoldier(null); setCreating(false) }}
        />
      )}

      {treeForSoldier && (
        <SkillTreeModal
          soldier={treeForSoldier}
          classes={classes}
          onClose={() => setTreeForSoldier(null)}
        />
      )}
    </div>
  )
}
