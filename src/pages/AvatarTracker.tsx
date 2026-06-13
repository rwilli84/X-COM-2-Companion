import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { useGameData } from '../hooks/useGameData'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input, Textarea, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { ActiveDarkEvent, ChosenData, CovertAction } from '../data/types'
import { nanoid } from 'nanoid'

const MAX_PIPS = 12

function getDoomStatus(pips: number): { label: string; color: string; advice: string } {
  if (pips <= 3) return { label: 'Stable', color: 'text-green-400', advice: 'Avatar Project is under control. Focus on research and expansion.' }
  if (pips <= 6) return { label: 'Caution', color: 'text-amber-400', advice: 'Plan your next facility assault or covert reduction soon.' }
  if (pips <= 9) return { label: 'Urgent', color: 'text-orange-400', advice: 'Prioritize reducing Avatar pips immediately. Assault facilities and run covert ops.' }
  return { label: 'CRITICAL', color: 'text-red-400', advice: 'GAME OVER IMMINENT. Assault an alien facility immediately to buy time.' }
}

export function AvatarTracker() {
  const { activeCampaign, updateCampaign } = useCampaignStore()
  const { darkEvents, dlc } = useGameData()
  const campaign = activeCampaign()

  const [logOpen, setLogOpen] = useState(false)
  const [deOpen, setDeOpen] = useState(false)
  const [covertOpen, setCovertOpen] = useState(false)
  const [logReason, setLogReason] = useState('')
  const [logChange, setLogChange] = useState(0)

  if (!campaign) return <NoActiveCampaign />

  const pips = campaign.avatarPips
  const doom = getDoomStatus(pips)
  const slack = MAX_PIPS - pips

  const setPips = (newPips: number) => {
    const clamped = Math.max(0, Math.min(MAX_PIPS, newPips))
    updateCampaign(campaign.id, { avatarPips: clamped })
  }

  const addLog = () => {
    if (!logReason.trim()) return
    const entry = { date: new Date().toISOString().split('T')[0], change: logChange, reason: logReason.trim() }
    updateCampaign(campaign.id, {
      avatarLog: [...(campaign.avatarLog ?? []), entry],
      avatarPips: Math.max(0, Math.min(MAX_PIPS, pips + logChange)),
    })
    setLogReason('')
    setLogChange(0)
    setLogOpen(false)
  }

  const toggleDarkEvent = (eventId: string) => {
    const existing = campaign.activeDarkEvents.find(de => de.eventId === eventId)
    if (existing) {
      updateCampaign(campaign.id, {
        activeDarkEvents: campaign.activeDarkEvents.filter(de => de.eventId !== eventId),
      })
    } else {
      updateCampaign(campaign.id, {
        activeDarkEvents: [
          ...campaign.activeDarkEvents,
          { id: nanoid(), eventId, startedAt: new Date().toISOString().split('T')[0], completed: false },
        ],
      })
    }
  }

  const markDarkEventComplete = (id: string) => {
    updateCampaign(campaign.id, {
      activeDarkEvents: campaign.activeDarkEvents.map(de =>
        de.id === id ? { ...de, completed: true } : de
      ),
    })
  }

  return (
    <div className="pb-4 px-4 pt-3 space-y-4">
      {/* Avatar Progress */}
      <Card>
        <CardHeader>
          <div className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest">
            Avatar Project
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <span className={`font-mono font-bold text-lg ${doom.color}`}>{doom.label}</span>
            <span className="font-mono text-2xl font-bold text-neutral-100">{pips} <span className="text-neutral-600 text-sm">/ {MAX_PIPS}</span></span>
          </div>

          {/* Pip grid */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {Array.from({ length: MAX_PIPS }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPips(i < pips ? i : i + 1)}
                className={`w-8 h-8 border rounded-sm font-mono text-xs font-bold transition-colors ${
                  i < pips
                    ? i >= 9 ? 'bg-red-600 border-red-500' : i >= 6 ? 'bg-orange-600 border-orange-500' : 'bg-amber-600 border-amber-500'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-600 hover:border-neutral-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <p className="text-xs text-neutral-500 font-mono mb-3">{doom.advice}</p>
          <p className="text-xs text-neutral-600 font-mono">
            Slack: <span className="text-amber-400 font-bold">{slack} pips</span> remaining before game over.
          </p>

          <div className="flex gap-2 mt-3">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setLogChange(-1); setLogOpen(true) }}>
              − Reduce
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setLogChange(1); setLogOpen(true) }}>
              + Advance
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Avatar Log */}
      {campaign.avatarLog.length > 0 && (
        <Card>
          <CardHeader>
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Change Log</span>
          </CardHeader>
          <CardBody className="space-y-2 max-h-40 overflow-y-auto">
            {[...campaign.avatarLog].reverse().map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-neutral-600">{entry.date}</span>
                <span className={entry.change > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                  {entry.change > 0 ? `+${entry.change}` : entry.change}
                </span>
                <span className="text-neutral-400 flex-1">{entry.reason}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Dark Events */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <span className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest">Dark Events</span>
          <Button variant="ghost" size="sm" onClick={() => setDeOpen(!deOpen)}>
            {deOpen ? '▲' : '▼'}
          </Button>
        </CardHeader>
        {deOpen && (
          <CardBody className="space-y-2 max-h-80 overflow-y-auto">
            {darkEvents.map(de => {
              const active = campaign.activeDarkEvents.find(a => a.eventId === de.id)
              return (
                <button
                  key={de.id}
                  onClick={() => toggleDarkEvent(de.id)}
                  className={`w-full text-left p-3 border rounded-sm transition-colors ${
                    active && !active.completed ? 'bg-red-950 border-red-800' :
                    active?.completed ? 'bg-neutral-800 border-neutral-700 opacity-50' :
                    'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-neutral-100">{de.name}</span>
                    {de.approx && <span className="text-amber-500 text-xs">~</span>}
                    {active && !active.completed && (
                      <Badge variant="red" className="ml-auto">ACTIVE</Badge>
                    )}
                    {active?.completed && (
                      <Badge variant="gray" className="ml-auto">Done</Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 font-mono mt-1">{de.effect}</p>
                  <p className="text-xs text-neutral-600 font-mono mt-0.5">Duration: {de.duration}</p>
                </button>
              )
            })}
          </CardBody>
        )}

        {/* Active dark events summary */}
        {campaign.activeDarkEvents.filter(de => !de.completed).length > 0 && (
          <CardBody className="border-t border-neutral-800">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Currently Active</div>
            <div className="space-y-2">
              {campaign.activeDarkEvents.filter(de => !de.completed).map(ade => {
                const def = darkEvents.find(d => d.id === ade.eventId)
                return (
                  <div key={ade.id} className="flex items-center justify-between p-2 bg-red-950 border border-red-800 rounded-sm">
                    <div>
                      <span className="text-xs font-mono text-red-300 font-bold">{def?.name ?? ade.eventId}</span>
                      <span className="text-xs font-mono text-neutral-600 ml-2">since {ade.startedAt}</span>
                    </div>
                    <button
                      className="text-xs font-mono text-neutral-600 hover:text-green-400 px-2"
                      onClick={() => markDarkEventComplete(ade.id)}
                    >
                      ✓ Expire
                    </button>
                  </div>
                )
              })}
            </div>
          </CardBody>
        )}
      </Card>

      {/* Covert Actions (WotC only) */}
      {dlc.wotc && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest">Covert Actions</span>
            <Button variant="primary" size="sm" onClick={() => setCovertOpen(true)}>+ Log</Button>
          </CardHeader>
          <CardBody className="space-y-2">
            {campaign.covertActions.length === 0 && (
              <div className="text-xs text-neutral-600 font-mono text-center py-2">No covert actions logged.</div>
            )}
            {[...campaign.covertActions].reverse().map(ca => (
              <div key={ca.id} className="p-2 bg-neutral-800 rounded-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-200">{ca.name}</span>
                  <span className="text-xs font-mono text-neutral-600">{ca.date}</span>
                  <Badge variant={ca.outcome.toLowerCase().includes('success') ? 'green' : ca.outcome.toLowerCase().includes('fail') ? 'red' : 'gray'} className="ml-auto">
                    {ca.outcome}
                  </Badge>
                </div>
                {ca.notes && <p className="text-xs text-neutral-600 font-mono mt-1">{ca.notes}</p>}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Log Change Modal */}
      {logOpen && (
        <Modal title="Log Avatar Change" onClose={() => setLogOpen(false)} footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={addLog}>Log</Button>
          </>
        }>
          <div className="space-y-3">
            <div>
              <label className="field-label">Change Amount</label>
              <div className="flex gap-2">
                {[-3,-2,-1,0,1,2,3].map(n => (
                  <button
                    key={n}
                    onClick={() => setLogChange(n)}
                    className={`flex-1 py-2.5 text-sm font-mono font-bold border rounded-sm ${
                      logChange === n
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Reason</label>
              <Input value={logReason} onChange={e => setLogReason(e.target.value)} placeholder="Facility assault, dark event..." />
            </div>
          </div>
        </Modal>
      )}

      {/* Covert Action Modal */}
      {covertOpen && (
        <CovertActionModal
          campaignId={campaign.id}
          existingActions={campaign.covertActions}
          onSave={actions => { updateCampaign(campaign.id, { covertActions: actions }); setCovertOpen(false) }}
          onClose={() => setCovertOpen(false)}
        />
      )}
    </div>
  )
}

function CovertActionModal({ campaignId, existingActions, onSave, onClose }: {
  campaignId: string
  existingActions: CovertAction[]
  onSave: (actions: CovertAction[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [outcome, setOutcome] = useState('Success')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    const newAction: CovertAction = {
      id: nanoid(),
      campaignId,
      name: name.trim(),
      date: new Date().toISOString().split('T')[0],
      outcome,
      notes,
    }
    onSave([...existingActions, newAction])
  }

  return (
    <Modal title="Log Covert Action" onClose={onClose} footer={
      <>
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
      </>
    }>
      <div className="space-y-3">
        <div>
          <label className="field-label">Action Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Recruit Reaper..." autoFocus />
        </div>
        <div>
          <label className="field-label">Outcome</label>
          <div className="flex gap-2">
            {['Success', 'Partial', 'Failure'].map(o => (
              <button key={o} onClick={() => setOutcome(o)}
                className={`flex-1 py-2.5 text-xs font-mono uppercase font-bold border rounded-sm ${
                  outcome === o ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >{o}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Soldier injured, ambush triggered..." />
        </div>
      </div>
    </Modal>
  )
}

function NoActiveCampaign() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-600 font-mono text-sm">
      <div className="text-4xl mb-3">📡</div>
      <div>No active campaign.</div>
    </div>
  )
}
