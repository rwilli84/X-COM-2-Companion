import { useState } from 'react'
import { ENEMY_ROSTER, prioritizeActions } from '../../advisor/battleAdvisor'
import type { BattleSituation, ActionPriority } from '../../advisor/battleAdvisor'
import { useCampaignStore } from '../../store/campaignStore'

const PRIORITY_STYLES: Record<ActionPriority['priority'], { border: string; label: string; labelColor: string }> = {
  critical: { border: 'border-red-800/60',   label: 'CRITICAL', labelColor: 'text-red-400' },
  high:     { border: 'border-amber-800/40', label: 'HIGH',     labelColor: 'text-amber-400' },
  normal:   { border: 'border-neutral-800',  label: 'NORMAL',   labelColor: 'text-neutral-500' },
}

const BASE_ENEMIES = ENEMY_ROSTER.filter(e => e.source === 'base')
const WOTC_ENEMIES = ENEMY_ROSTER.filter(e => e.source === 'wotc')

export function BattleAdvisorPanel() {
  const { activeCampaign } = useCampaignStore()
  const campaign = activeCampaign()
  const isWotc = campaign?.dlc?.wotc ?? false

  const [selectedEnemies, setSelectedEnemies] = useState<Set<string>>(new Set())
  const [flags, setFlags] = useState({
    hasMimicBeacon:  false,
    hasEmpGrenade:   false,
    hasStasis:       false,
    hasDomination:   false,
    hasShredder:     false,
    hasArmorShred:   false,
    isTimed:         false,
    turnsRemaining:  3,
  })
  const [priorities, setPriorities] = useState<ActionPriority[] | null>(null)

  const toggleEnemy = (id: string) => {
    setSelectedEnemies(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const setFlag = <K extends keyof typeof flags>(k: K, v: typeof flags[K]) =>
    setFlags(prev => ({ ...prev, [k]: v }))

  const handleAnalyse = () => {
    const situation: BattleSituation = {
      enemyIds: [...selectedEnemies],
      squadClasses: [],
      squadAbilities: [],
      hasMimicBeacon:  flags.hasMimicBeacon,
      hasEmpGrenade:   flags.hasEmpGrenade,
      hasStasis:       flags.hasStasis,
      hasDomination:   flags.hasDomination,
      hasShredder:     flags.hasShredder,
      hasArmorShred:   flags.hasArmorShred || flags.hasShredder,
      turnsRemaining:  flags.isTimed ? flags.turnsRemaining : undefined,
    }
    setPriorities(prioritizeActions(situation))
  }

  const visibleBaseEnemies = BASE_ENEMIES
  const visibleWotcEnemies = isWotc ? WOTC_ENEMIES : []

  return (
    <div className="space-y-5">

      {/* Enemy selector */}
      <div className="space-y-2">
        <Divider>Enemies in the Pod</Divider>
        <p className="text-[10px] font-mono text-neutral-600">Select every enemy type currently visible.</p>
        <EnemyGrid enemies={visibleBaseEnemies} selected={selectedEnemies} onToggle={toggleEnemy} />
        {isWotc && visibleWotcEnemies.length > 0 && (
          <>
            <p className="text-[10px] font-mono text-neutral-600 pt-1">WotC Enemies</p>
            <EnemyGrid enemies={visibleWotcEnemies} selected={selectedEnemies} onToggle={toggleEnemy} />
          </>
        )}
      </div>

      {/* Squad capabilities */}
      <div className="space-y-2">
        <Divider>Squad Capabilities</Divider>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { key: 'hasMimicBeacon' as const,  label: 'Mimic Beacon in squad' },
            { key: 'hasEmpGrenade' as const,   label: 'EMP Grenade in squad' },
            { key: 'hasStasis' as const,       label: 'Psi Stasis available' },
            { key: 'hasDomination' as const,   label: 'Domination available' },
            { key: 'hasShredder' as const,     label: 'Grenadier w/ Shredder' },
            { key: 'hasArmorShred' as const,   label: 'AP/Acid rounds present' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 px-2.5 py-2 border border-neutral-800 rounded-sm cursor-pointer hover:border-neutral-700 bg-neutral-900">
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={e => setFlag(key, e.target.checked)}
                className="accent-amber-500"
              />
              <span className="text-[11px] font-mono text-neutral-400">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Timed mission */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flags.isTimed}
            onChange={e => setFlag('isTimed', e.target.checked)}
            className="accent-amber-500"
          />
          <span className="text-[11px] font-mono text-neutral-400">Timed mission</span>
        </label>
        {flags.isTimed && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-neutral-600">Turns left:</span>
            <input
              type="number"
              min={1}
              max={20}
              value={flags.turnsRemaining}
              onChange={e => setFlag('turnsRemaining', Math.max(1, Number(e.target.value)))}
              className="w-14 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-sm font-mono text-xs text-neutral-200 text-center"
            />
          </div>
        )}
      </div>

      {/* Analyse */}
      <button
        onClick={handleAnalyse}
        disabled={selectedEnemies.size === 0}
        className="w-full py-2 px-4 font-mono text-sm font-bold uppercase tracking-wider bg-amber-500 text-neutral-950 rounded-sm hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Prioritise Actions
      </button>

      {/* Results */}
      {priorities !== null && (
        <div className="space-y-3">
          <Divider>Action Priority Order</Divider>
          {priorities.length === 0 ? (
            <p className="text-center py-6 font-mono text-sm text-neutral-600">
              No specific guidance for this combination. Standard play: shred armor, kill highest threat first, overwatch last.
            </p>
          ) : (
            <div className="space-y-2">
              {priorities.map(p => {
                const style = PRIORITY_STYLES[p.priority]
                return (
                  <div key={p.step} className={`border rounded-sm overflow-hidden ${style.border}`}>
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900">
                      <span className="font-mono font-bold text-amber-400 text-sm w-6 shrink-0">
                        {p.step}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-neutral-100 font-semibold">{p.action}</span>
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${style.labelColor}`}>
                            {style.label}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                          <span className="text-neutral-400">{p.soldierNote}</span>
                          {' → '}
                          <span className="text-neutral-400">{p.targetNote}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800/50">
                      <p className="text-[11px] font-mono text-neutral-400 leading-snug">{p.reason}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Reference cards for selected enemies */}
          {selectedEnemies.size > 0 && (
            <div className="space-y-2 pt-2">
              <Divider>Enemy Reference</Divider>
              {[...selectedEnemies].map(id => {
                const enemy = ENEMY_ROSTER.find(e => e.id === id)
                if (!enemy) return null
                return (
                  <div key={id} className="border border-neutral-800 rounded-sm p-3 space-y-1.5 bg-neutral-900">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-200">{enemy.name}</span>
                      <ThreatBadge threat={enemy.threat} />
                    </div>
                    <p className="text-[11px] font-mono text-red-400 leading-snug">
                      <span className="font-bold">If ignored: </span>{enemy.immediateRisk}
                    </p>
                    {enemy.rulesOverride && (
                      <p className="text-[11px] font-mono text-amber-400 leading-snug font-bold">
                        {enemy.rulesOverride}
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-neutral-500 space-y-0.5">
                      {enemy.counterActions.map((a, i) => (
                        <div key={i} className="flex gap-1.5">
                          <span className="text-green-600 shrink-0">✓</span>
                          <span>{a}</span>
                        </div>
                      ))}
                      {enemy.avoidActions.map((a, i) => (
                        <div key={i} className="flex gap-1.5">
                          <span className="text-red-600 shrink-0">✗</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EnemyGrid({
  enemies,
  selected,
  onToggle,
}: {
  enemies: typeof ENEMY_ROSTER
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {enemies.map(e => {
        const isSelected = selected.has(e.id)
        return (
          <button
            key={e.id}
            onClick={() => onToggle(e.id)}
            className={`px-2.5 py-2 text-left border rounded-sm transition-colors ${
              isSelected
                ? 'border-red-700/60 bg-red-950/20 text-red-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
            }`}
          >
            <div className="text-[11px] font-mono font-semibold leading-tight">{e.name}</div>
            <div className={`text-[10px] font-mono uppercase tracking-wide mt-0.5 ${THREAT_COLORS[e.threat]}`}>
              {e.threat}
            </div>
          </button>
        )
      })}
    </div>
  )
}

const THREAT_COLORS: Record<string, string> = {
  low:      'text-neutral-600',
  medium:   'text-amber-700',
  high:     'text-orange-500',
  critical: 'text-red-500',
}

function ThreatBadge({ threat }: { threat: string }) {
  return (
    <span className={`text-[10px] font-mono uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ${
      threat === 'critical' ? 'border-red-700/50 text-red-400' :
      threat === 'high'     ? 'border-orange-700/50 text-orange-400' :
      threat === 'medium'   ? 'border-amber-700/50 text-amber-500' :
                              'border-neutral-700 text-neutral-600'
    }`}>
      {threat}
    </span>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-500 shrink-0">{children}</span>
      <div className="flex-1 h-px bg-neutral-800" />
    </div>
  )
}
