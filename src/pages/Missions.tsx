import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input, Textarea, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { Mission, Soldier } from '../data/types'
import { nanoid } from 'nanoid'

const MISSION_TYPES = [
  'Retaliation','Council Mission','Blacksite','Supply Raid','Guerrilla Op',
  'Covert Extraction','Jailbreak','Rescue VIP','Destroy Target','Chosen Mission',
  'Facility Assault','Story Mission','Other',
]

export function Missions() {
  const { campaignMissions, campaignSoldiers, createMission, deleteMission, activeCampaign } = useCampaignStore()
  const campaign = activeCampaign()
  const missions = campaignMissions().sort((a,b) => b.date.localeCompare(a.date))
  const soldiers = campaignSoldiers()
  const [tab, setTab] = useState<'log' | 'memorial'>('log')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Partial<Mission>>({
    type: 'Guerrilla Op',
    date: new Date().toISOString().split('T')[0],
    outcome: 'success',
    deployedSoldierIds: [],
    kiaIds: [],
    woundedIds: [],
    notes: '',
  })

  if (!campaign) return <div className="flex items-center justify-center h-64 text-neutral-600 font-mono text-sm">No active campaign.</div>

  const deadSoldiers = soldiers.filter(s => s.status === 'dead')

  const handleCreate = async () => {
    await createMission({
      campaignId: campaign.id,
      type: form.type ?? 'Other',
      date: form.date ?? new Date().toISOString().split('T')[0],
      outcome: form.outcome as Mission['outcome'] ?? 'success',
      deployedSoldierIds: form.deployedSoldierIds ?? [],
      kiaIds: form.kiaIds ?? [],
      woundedIds: form.woundedIds ?? [],
      notes: form.notes ?? '',
    })
    setCreating(false)
    setForm({ type: 'Guerrilla Op', date: new Date().toISOString().split('T')[0], outcome: 'success', deployedSoldierIds: [], kiaIds: [], woundedIds: [], notes: '' })
  }

  const toggleInArray = (key: 'deployedSoldierIds' | 'kiaIds' | 'woundedIds', id: string) => {
    setForm(prev => {
      const arr = (prev[key] ?? []) as string[]
      return { ...prev, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] }
    })
  }

  const getSoldierName = (id: string) => soldiers.find(s => s.id === id)?.nickname ?? 'Unknown'

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1">
          {(['log', 'memorial'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-mono uppercase font-bold border rounded-sm min-h-[36px] ${
                tab === t ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >{t}</button>
          ))}
        </div>
        {tab === 'log' && <Button variant="primary" size="sm" onClick={() => setCreating(true)}>+ Mission</Button>}
      </div>

      {tab === 'log' ? (
        <div className="px-4 pt-3 space-y-2">
          {missions.length === 0 && (
            <div className="text-center py-12 text-neutral-600 font-mono text-sm">
              <div className="text-4xl mb-3">🗺</div>
              <div>No missions logged yet.</div>
            </div>
          )}
          {missions.map(m => (
            <Card key={m.id}>
              <CardBody className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={m.outcome === 'success' ? 'green' : m.outcome === 'failure' ? 'red' : 'amber'}>
                      {m.outcome}
                    </Badge>
                    <span className="font-mono font-bold text-sm text-neutral-100">{m.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-600">{m.date}</span>
                    <button
                      className="text-neutral-700 hover:text-red-400 text-sm p-1"
                      onClick={() => { if (confirm('Delete mission?')) deleteMission(m.id) }}
                    >✕</button>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 text-xs font-mono flex-wrap">
                  {m.deployedSoldierIds.length > 0 && (
                    <span className="text-neutral-500">
                      Deployed: <span className="text-neutral-300">{m.deployedSoldierIds.map(getSoldierName).join(', ')}</span>
                    </span>
                  )}
                  {m.kiaIds.length > 0 && (
                    <span className="text-red-400">
                      KIA: {m.kiaIds.map(getSoldierName).join(', ')}
                    </span>
                  )}
                  {m.woundedIds.length > 0 && (
                    <span className="text-amber-400">
                      Wounded: {m.woundedIds.map(getSoldierName).join(', ')}
                    </span>
                  )}
                </div>
                {m.notes && <p className="text-xs text-neutral-600 font-mono mt-2">{m.notes}</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3">
          <div className="text-xs font-mono text-amber-600 uppercase tracking-wider mb-2">
            Memorial Wall — {deadSoldiers.length} Fallen
          </div>
          {deadSoldiers.length === 0 && (
            <div className="text-center py-12 text-neutral-600 font-mono text-sm">
              <div className="text-4xl mb-3">🎖</div>
              <div>No casualties. Keep it that way.</div>
            </div>
          )}
          {deadSoldiers.map(s => (
            <Card key={s.id} className="border-red-950">
              <CardBody>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💀</span>
                  <div className="flex-1">
                    <div className="font-mono font-bold text-neutral-100">{s.nickname}</div>
                    <div className="text-xs font-mono text-neutral-500 mt-0.5">
                      {s.rank} · {soldiers.find(r => r.id === s.id) ? 'Killed in action' : ''}
                      {s.killCount > 0 && ` · 💀 ${s.killCount} confirmed kills`}
                      {s.missionCount > 0 && ` · ${s.missionCount} missions`}
                    </div>
                    {s.epitaph && (
                      <p className="text-xs text-neutral-500 font-mono mt-1 italic">"{s.epitaph}"</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <Modal title="Log Mission" onClose={() => setCreating(false)} footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>Save</Button>
          </>
        }>
          <div className="space-y-4">
            <div>
              <label className="field-label">Mission Type</label>
              <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {MISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Outcome</label>
                <div className="flex gap-1.5 h-11">
                  {(['success', 'partial', 'failure'] as Mission['outcome'][]).map(o => (
                    <button key={o} onClick={() => setForm(p => ({ ...p, outcome: o }))}
                      className={`flex-1 text-xs font-mono uppercase font-bold border rounded-sm ${
                        form.outcome === o ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >{o}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="field-label">Deployed Soldiers</label>
              <SoldierMultiSelect soldiers={soldiers} selected={form.deployedSoldierIds ?? []} onToggle={id => toggleInArray('deployedSoldierIds', id)} />
            </div>
            <div>
              <label className="field-label">Wounded</label>
              <SoldierMultiSelect soldiers={soldiers} selected={form.woundedIds ?? []} onToggle={id => toggleInArray('woundedIds', id)} />
            </div>
            <div>
              <label className="field-label">KIA</label>
              <SoldierMultiSelect soldiers={soldiers} selected={form.kiaIds ?? []} onToggle={id => toggleInArray('kiaIds', id)} />
            </div>

            <div>
              <label className="field-label">Notes</label>
              <Textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Objectives, events, debrief..." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SoldierMultiSelect({ soldiers, selected, onToggle }: {
  soldiers: Soldier[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const active = soldiers.filter((s: Soldier) => s.status !== 'dead')
  if (active.length === 0) return <div className="text-xs text-neutral-600 font-mono">No active soldiers.</div>
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(s => (
        <button key={s.id} onClick={() => onToggle(s.id)}
          className={`px-2.5 py-1.5 text-xs font-mono border rounded-sm min-h-[32px] ${
            selected.includes(s.id) ? 'bg-amber-500 text-black border-amber-500 font-bold' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
          }`}
        >
          {s.nickname || 'Unnamed'}
        </button>
      ))}
    </div>
  )
}
