import { useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { ARMORY_CATALOG } from '../../advisor/armory'
import { Badge } from '../ui/Badge'

const CATEGORY_LABELS: Record<string, string> = {
  grenade: 'Grenades',
  utility: 'Utility Items',
  ammo:    'Ammo Types',
  armor:   'Armor Upgrades',
}

function CountStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 flex items-center justify-center border border-neutral-700 rounded-sm text-neutral-400 hover:text-neutral-100 hover:border-neutral-500 text-sm font-mono font-bold"
      >−</button>
      <span className="w-7 text-center font-mono text-sm text-neutral-100">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center border border-neutral-700 rounded-sm text-neutral-400 hover:text-neutral-100 hover:border-neutral-500 text-sm font-mono font-bold"
      >+</button>
    </div>
  )
}

export function ArmoryPanel() {
  const { activeCampaign, updateArmoryItem } = useCampaignStore()
  const campaign = activeCampaign()
  const { dlc } = campaign ?? { dlc: { wotc: false, alienHunters: false, shensLastGift: false, tacticalLegacyPack: false } }

  const armory: Record<string, number> = campaign?.armory ?? {}

  const visibleItems = ARMORY_CATALOG.filter(item => !item.wotcOnly || dlc.wotc)

  const bySlot = useMemo(() => {
    const groups: Record<string, typeof visibleItems> = {}
    for (const item of visibleItems) {
      if (!groups[item.slot]) groups[item.slot] = []
      groups[item.slot].push(item)
    }
    return groups
  }, [visibleItems])

  if (!campaign) {
    return <div className="text-center py-12 text-neutral-600 font-mono text-sm">No active campaign.</div>
  }

  const totalItems = Object.values(armory).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-neutral-500">
          Log what you currently have in stock. The Squad advisor uses this to recommend loadouts.
        </p>
        {totalItems > 0 && (
          <Badge variant="amber">{totalItems} tracked</Badge>
        )}
      </div>

      {(['grenade', 'ammo', 'utility', 'armor'] as const).map(slot => {
        const items = bySlot[slot]
        if (!items?.length) return null
        return (
          <div key={slot} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-500">
                {CATEGORY_LABELS[slot]}
              </span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            <div className="space-y-1">
              {items.map(item => {
                const qty = armory[item.id] ?? 0
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 border rounded-sm transition-colors ${
                      qty > 0 ? 'border-amber-800/50 bg-amber-950/10' : 'border-neutral-800 bg-neutral-900'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-sm text-neutral-100 font-semibold">{item.name}</span>
                        {item.pgCost && (
                          <span className="text-[10px] font-mono text-neutral-600">PG</span>
                        )}
                        {item.wotcOnly && (
                          <Badge variant="gray">WotC</Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-neutral-500 mt-0.5 leading-snug">{item.notes}</p>
                      {item.pgCost && (
                        <p className="text-[10px] font-mono text-neutral-600 mt-0.5">
                          Build cost: {item.pgCost.supplies}$ · {item.pgCost.alloys}alloy
                          {item.pgCost.crystals > 0 ? ` · ${item.pgCost.crystals}crystal` : ''}
                          {item.pgCost.cores > 0 ? ` · ${item.pgCost.cores}core` : ''}
                          {' '}→ Market: ~{item.blackMarketValue}$
                        </p>
                      )}
                    </div>
                    <CountStepper
                      value={qty}
                      onChange={n => updateArmoryItem(item.id, n)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
