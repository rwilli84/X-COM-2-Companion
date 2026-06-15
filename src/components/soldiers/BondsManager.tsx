import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { Button } from '../ui/Button'
import { Select } from '../ui/Input'
import { Card, CardBody } from '../ui/Card'

export function BondsManager() {
  const { campaignSoldiers, campaignBonds, createBond, updateBond, deleteBond, activeCampaign } = useCampaignStore()
  const campaign = activeCampaign()
  const soldiers = campaignSoldiers()
  const bonds = campaignBonds()

  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const [error, setError] = useState('')

  // Living soldiers are eligible for new bonds
  const eligible = soldiers.filter(s => s.status !== 'dead')

  const nameOf = (id: string) => {
    const s = soldiers.find(x => x.id === id)
    return s ? (s.nickname || 'Unnamed') : 'Unknown'
  }

  const pairExists = (a: string, b: string) =>
    bonds.some(bd =>
      (bd.soldier1Id === a && bd.soldier2Id === b) ||
      (bd.soldier1Id === b && bd.soldier2Id === a))

  const handleAdd = async () => {
    setError('')
    if (!campaign) return
    if (!s1 || !s2) { setError('Pick two soldiers.'); return }
    if (s1 === s2) { setError('A soldier cannot bond with themselves.'); return }
    if (pairExists(s1, s2)) { setError('These two already share a bond.'); return }
    await createBond(s1, s2, campaign.id)
    setS1(''); setS2(''); setAdding(false)
  }

  return (
    <div className="px-4 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-sm"
      >
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400">
          ✦ Squad Bonds ({bonds.length})
        </span>
        <span className="text-purple-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {bonds.length === 0 && (
            <p className="text-xs font-mono text-neutral-600 px-1 py-2">
              No bonds yet. Pair two soldiers to track their bond level and cohesion.
            </p>
          )}

          {bonds.map(bond => (
            <Card key={bond.id}>
              <CardBody className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-neutral-100 truncate">
                    {nameOf(bond.soldier1Id)} <span className="text-purple-500">✦</span> {nameOf(bond.soldier2Id)}
                  </span>
                  <button
                    className="text-xs font-mono text-red-400 hover:text-red-300 shrink-0 min-h-[32px] px-2"
                    onClick={() => { if (confirm('Remove this bond?')) deleteBond(bond.id) }}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Bond Level</label>
                    <Select
                      value={bond.level}
                      onChange={e => updateBond(bond.id, { level: Number(e.target.value) as 1 | 2 | 3 })}
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                    </Select>
                  </div>
                  <div>
                    <label className="field-label">Cohesion</label>
                    <Select
                      value={bond.cohesion}
                      onChange={e => updateBond(bond.id, { cohesion: Number(e.target.value) })}
                    >
                      {[0, 25, 50, 75, 100].map(v => <option key={v} value={v}>{v}</option>)}
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {!adding ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={eligible.length < 2}
              onClick={() => { setAdding(true); setError('') }}
            >
              {eligible.length < 2 ? 'Need 2+ soldiers to bond' : '+ Add Bond'}
            </Button>
          ) : (
            <Card>
              <CardBody className="py-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Soldier A</label>
                    <Select value={s1} onChange={e => setS1(e.target.value)}>
                      <option value="">— Select —</option>
                      {eligible.map(s => <option key={s.id} value={s.id}>{s.nickname || 'Unnamed'}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="field-label">Soldier B</label>
                    <Select value={s2} onChange={e => setS2(e.target.value)}>
                      <option value="">— Select —</option>
                      {eligible.map(s => <option key={s.id} value={s.id}>{s.nickname || 'Unnamed'}</option>)}
                    </Select>
                  </div>
                </div>
                {error && <p className="text-xs font-mono text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setAdding(false); setError('') }}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={handleAdd}>
                    Create Bond
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
