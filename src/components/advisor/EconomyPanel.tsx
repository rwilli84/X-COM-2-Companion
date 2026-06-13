import { useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { adviseEconomy, PROVING_GROUNDS_ITEMS } from '../../advisor/economyAdvisor'
import { computeDoomPressure } from '../../advisor/missionAdvisor'
import type { InventorySnapshot, EconomyPlan } from '../../advisor/types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardBody } from '../ui/Card'
import { Input, Select } from '../ui/Input'
import rawFacilities from '../../data/facilities.json'

const ARMOR_TIERS = ['', 'predator', 'warden', 'powered', 'spider', 'wraith'] as const
const WEAPON_TIERS = ['', 'magnetic', 'beam'] as const

const RISK_BADGE: Record<'safe' | 'caution' | 'hold', { variant: 'green' | 'amber' | 'red'; label: string }> = {
  safe:    { variant: 'green', label: 'Safe to sell' },
  caution: { variant: 'amber', label: 'Caution' },
  hold:    { variant: 'red',   label: 'Hold' },
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        className="text-sm"
      />
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text3)' }}>{children}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

export function EconomyPanel() {
  const { activeCampaign, campaignSoldiers, campaignBonds } = useCampaignStore()
  const campaign = activeCampaign()

  const [inv, setInv] = useState<InventorySnapshot>({
    supplies: 0,
    alloys: 0,
    crystals: 0,
    cores: 0,
    intel: 0,
    contacts: 1,
    provingGroundsActive: false,
    plannedArmorTier: undefined,
    plannedWeaponTier: undefined,
  })
  const [nextFacilityId, setNextFacilityId] = useState('')
  const [plan, setPlan] = useState<EconomyPlan | null>(null)
  const [expandedSell, setExpandedSell] = useState<string | null>(null)
  const [expandedPG, setExpandedPG] = useState<string | null>(null)

  const setField = <K extends keyof InventorySnapshot>(key: K, val: InventorySnapshot[K]) =>
    setInv(prev => ({ ...prev, [key]: val }))

  const handleAnalyse = () => {
    if (!campaign) return
    const doomPressure = computeDoomPressure(campaign.avatarPips)
    const snap = {
      campaign,
      soldiers: campaignSoldiers(),
      missions: [],
      bonds: campaignBonds(),
      doomPressure,
    }
    setPlan(adviseEconomy(inv, snap, nextFacilityId || undefined))
  }

  const notBuiltFacilities = (rawFacilities as Array<{ id: string; name: string }>)
    .filter(f => !campaign?.facilityPlacements.some(p => p.facilityId === f.id))

  if (!campaign) return (
    <div className="text-center py-12 font-mono text-sm" style={{ color: 'var(--text3)' }}>No active campaign.</div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">

          <SectionHeading>Current Inventory</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Supplies" value={inv.supplies}  onChange={v => setField('supplies', v)} />
            <NumberInput label="Intel"    value={inv.intel}     onChange={v => setField('intel', v)} />
            <NumberInput label="Alloys"   value={inv.alloys}    onChange={v => setField('alloys', v)} />
            <NumberInput label="Crystals" value={inv.crystals}  onChange={v => setField('crystals', v)} />
            <NumberInput label="Cores"    value={inv.cores}     onChange={v => setField('cores', v)} />
            <NumberInput label="Contacts" value={inv.contacts}  onChange={v => setField('contacts', v)} />
          </div>

          <label className="flex items-center gap-2.5 text-xs font-mono cursor-pointer" style={{ color: 'var(--text2)' }}>
            <input
              type="checkbox"
              checked={inv.provingGroundsActive}
              onChange={e => setField('provingGroundsActive', e.target.checked)}
              className="accent-amber-500"
            />
            Proving Grounds currently busy
          </label>

          <SectionHeading>Planned Upgrades</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Next Armor Tier</label>
              <Select
                value={inv.plannedArmorTier ?? ''}
                onChange={e => setField('plannedArmorTier', (e.target.value || undefined) as InventorySnapshot['plannedArmorTier'])}
              >
                {ARMOR_TIERS.map(t => <option key={t} value={t}>{t || '—'}</option>)}
              </Select>
            </div>
            <div>
              <label className="field-label">Next Weapon Tier</label>
              <Select
                value={inv.plannedWeaponTier ?? ''}
                onChange={e => setField('plannedWeaponTier', (e.target.value || undefined) as InventorySnapshot['plannedWeaponTier'])}
              >
                {WEAPON_TIERS.map(t => <option key={t} value={t}>{t || '—'}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <label className="field-label">Next Facility to Build (for cost projection)</label>
            <Select value={nextFacilityId} onChange={e => setNextFacilityId(e.target.value)}>
              <option value="">— None —</option>
              {notBuiltFacilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </div>

          <Button variant="primary" className="w-full" onClick={handleAnalyse}>
            Analyse Economy
          </Button>
        </CardBody>
      </Card>

      {plan && (
        <div className="space-y-4">

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <div className="space-y-1.5">
              {plan.warnings.map((w, i) => (
                <div key={i} className="px-3 py-2.5 border border-amber-800/60 bg-amber-950/30 rounded-[2px] text-xs font-mono text-amber-300 leading-relaxed">{w}</div>
              ))}
            </div>
          )}

          {/* Supply Projection */}
          <div>
            <SectionHeading>Supply Projection</SectionHeading>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="px-3 py-2.5 rounded-[2px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>Weekly Income</div>
                <div className="text-xl font-mono font-bold text-amber-400">+{plan.supplyProjection.weeklyIncome}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                  Base {70} + {inv.contacts} contacts × {15}
                </div>
              </div>
              <div className="px-3 py-2.5 rounded-[2px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>In 4 Weeks</div>
                <div className="text-xl font-mono font-bold text-neutral-200">{plan.supplyProjection.projectedIn4Weeks}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                  {plan.supplyProjection.projectedIn8Weeks} in 8 weeks
                </div>
              </div>
            </div>
            {plan.supplyProjection.weeksToAffordNextFacility !== null && plan.supplyProjection.nextFacilityName && (
              <div className="mt-2 px-3 py-2 rounded-[2px] border text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                {plan.supplyProjection.weeksToAffordNextFacility === 0
                  ? `✓ You can already afford ${plan.supplyProjection.nextFacilityName}.`
                  : `${plan.supplyProjection.nextFacilityName} costs ${plan.supplyProjection.nextFacilityCost} supplies — you'll have enough in ~${plan.supplyProjection.weeksToAffordNextFacility} week(s).`
                }
              </div>
            )}
          </div>

          {/* Black Market / Sell Recommendations */}
          <div>
            <SectionHeading>Black Market — What to Sell</SectionHeading>
            <div className="mt-3 space-y-2">
              {plan.sellRecommendations.map(rec => {
                const badge = RISK_BADGE[rec.risk]
                return (
                  <div key={rec.item} className="border rounded-[2px] overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <button
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                      onClick={() => setExpandedSell(expandedSell === rec.item ? null : rec.item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-semibold text-neutral-200">{rec.item}</span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                          Have: {rec.currentStock} · Keep: {rec.keepAmount} · Sell: {rec.safeToSell}
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>{expandedSell === rec.item ? '▲' : '▼'}</span>
                    </button>
                    {expandedSell === rec.item && (
                      <div className="px-3 pb-3 pt-1 border-t text-xs font-mono leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                        {rec.reason}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Proving Grounds Queue */}
          <div>
            <SectionHeading>Proving Grounds — Idle Queue</SectionHeading>
            {inv.provingGroundsActive && (
              <p className="text-[10px] font-mono mt-2 mb-1" style={{ color: 'var(--text3)' }}>
                Proving Grounds is busy — queue these for when the current project finishes.
              </p>
            )}
            <div className="mt-3 space-y-2">
              {plan.provingGroundsQueue.map((item, i) => (
                <div key={item.id} className="border rounded-[2px] overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <button
                    className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                    onClick={() => setExpandedPG(expandedPG === item.id ? null : item.id)}
                  >
                    <span className="text-amber-500 font-mono font-bold text-sm w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-semibold text-neutral-200">{item.name}</span>
                        {item.affordable
                          ? <Badge variant="green">Affordable</Badge>
                          : <Badge variant="gray">Can't afford</Badge>
                        }
                      </div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>
                        {item.supplyCost}§
                        {item.alloyCost > 0 ? ` · ${item.alloyCost} alloys` : ''}
                        {item.crystalCost > 0 ? ` · ${item.crystalCost} crystals` : ''}
                        {item.coreCost > 0 ? ` · ${item.coreCost} core` : ''}
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>{expandedPG === item.id ? '▲' : '▼'}</span>
                  </button>
                  {expandedPG === item.id && (
                    <div className="px-3 pb-3 pt-1 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text2)' }}>{item.usefulnessNote}</p>
                      {!item.affordable && (
                        <p className="text-xs font-mono text-amber-600">{item.reason}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {plan.tips.length > 0 && (
            <div className="space-y-1.5">
              <SectionHeading>Strategic Tips</SectionHeading>
              <div className="mt-2 space-y-1.5">
                {plan.tips.map((tip, i) => (
                  <div key={i} className="px-3 py-2 rounded-[2px] text-xs font-mono leading-relaxed" style={{ background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
