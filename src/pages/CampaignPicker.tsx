import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampaignStore } from '../store/campaignStore'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { Difficulty, DlcConfig } from '../data/types'
import { DEFAULT_DLC } from '../data/types'

const difficultyColors: Record<Difficulty, 'green' | 'amber' | 'red' | 'purple'> = {
  rookie: 'green',
  veteran: 'amber',
  commander: 'red',
  legend: 'purple',
}

export function CampaignPicker() {
  const { campaigns, createCampaign, deleteCampaign, setActiveCampaign, loadAll, loaded } = useCampaignStore()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('veteran')
  const [dlc, setDlc] = useState<DlcConfig>(DEFAULT_DLC)

  useEffect(() => {
    if (!loaded) loadAll()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    const camp = await createCampaign(name.trim(), difficulty, dlc)
    navigate('/roster')
  }

  const handleSelect = (id: string) => {
    setActiveCampaign(id)
    navigate('/roster')
  }

  const toggleDlc = (key: keyof DlcConfig) => {
    setDlc(prev => {
      const next = { ...prev, [key]: !prev[key] }
      if (key === 'wotc' && !next.wotc) next.tacticalLegacyPack = false
      return next
    })
  }

  return (
    <div className="h-screen overflow-y-auto bg-neutral-950 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto">
      <div className="w-full mb-8 text-center">
        <div className="font-mono font-bold text-amber-500 text-2xl tracking-[0.2em] uppercase mb-1">
          Resistance HQ
        </div>
        <div className="text-neutral-600 text-xs font-mono tracking-widest">XCOM 2 Companion</div>
      </div>

      {!creating ? (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">Campaigns</span>
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>+ New Campaign</Button>
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-12 text-neutral-600 font-mono text-sm">
              <div className="text-neutral-700 font-mono text-sm mb-1">No campaigns</div>
              <div className="text-xs text-neutral-600">Create one to begin.</div>
            </div>
          )}

          {campaigns.map(c => (
            <Card key={c.id} className="cursor-pointer hover:border-amber-700 transition-colors" onClick={() => handleSelect(c.id)}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-neutral-100">{c.name}</div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <Badge variant={difficultyColors[c.difficulty]}>{c.difficulty}</Badge>
                    {c.dlc.wotc && <Badge variant="blue">WotC</Badge>}
                    {c.dlc.alienHunters && <Badge variant="red">AH</Badge>}
                    {c.dlc.shensLastGift && <Badge variant="gray">SLG</Badge>}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="text-right">
                    <div className="text-xs text-neutral-500 font-mono">
                      Avatar: {c.avatarPips}/12
                    </div>
                    <div className="text-xs text-neutral-600 font-mono mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="ml-2 text-neutral-700 hover:text-red-400 text-lg transition-colors p-1"
                    onClick={e => { e.stopPropagation(); if (confirm('Delete this campaign?')) deleteCampaign(c.id) }}
                  >✕</button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col" style={{ minHeight: 0 }}>
          <Card className="w-full">
          <CardBody className="space-y-4 pb-24">
            <div className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest mb-4">
              New Campaign
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">Campaign Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate()}
                placeholder="Operation Iron Curtain..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">Difficulty</label>
              <div className="grid grid-cols-2 gap-2">
                {(['rookie', 'veteran', 'commander', 'legend'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 px-3 font-mono text-sm uppercase font-bold border rounded-sm transition-colors ${
                      difficulty === d
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-amber-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-600 font-mono mt-2">
                {difficulty === 'rookie' && 'Reduced enemy HP and damage. Good for learning the ropes.'}
                {difficulty === 'veteran' && 'Standard experience. Balanced challenge.'}
                {difficulty === 'commander' && 'Increased enemy HP, more aggressive AI. Challenging.'}
                {difficulty === 'legend' && 'Maximum difficulty. No Iron Man? Still brutal.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">DLC Content</label>
              <div className="space-y-2">
                {[
                  { key: 'wotc' as const, label: 'War of the Chosen', desc: 'Faction heroes, Chosen, covert actions, bonds' },
                  { key: 'alienHunters' as const, label: 'Alien Hunters', desc: 'Alien Rulers, experimental weapons' },
                  { key: 'shensLastGift' as const, label: "Shen's Last Gift", desc: 'SPARK robotic soldier class' },
                  { key: 'tacticalLegacyPack' as const, label: 'Tactical Legacy Pack', desc: 'WotC only — bonus missions/cosmetics', wotcOnly: true },
                ].map(({ key, label, desc, wotcOnly }) => {
                  const disabled = wotcOnly && !dlc.wotc
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                        disabled ? 'opacity-40 cursor-not-allowed' : ''
                      } ${
                        dlc[key] && !disabled ? 'border-amber-700 bg-amber-950/20' : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-amber-500"
                        checked={dlc[key]}
                        disabled={disabled}
                        onChange={() => !disabled && toggleDlc(key)}
                      />
                      <div>
                        <div className="font-mono text-sm text-neutral-200">{label}</div>
                        <div className="font-mono text-xs text-neutral-600">{desc}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

          </CardBody>
        </Card>
          <div className="h-4" />
          <div className="sticky bottom-0 flex gap-2 p-4 bg-neutral-950 border-t border-neutral-800 -mx-4">
            <Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreate} disabled={!name.trim()}>
              Deploy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
