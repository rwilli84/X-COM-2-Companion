import { useEffect, useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { ChosenTracker } from './ChosenTracker'
import { Card, CardBody } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { ChosenType } from '../../data/chosen'

type PanelTab = ChosenType | 'endgame'

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'assassin', label: 'Assassin' },
  { id: 'hunter',   label: 'Hunter'   },
  { id: 'warlock',  label: 'Warlock'  },
  { id: 'endgame',  label: 'Endgame'  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--text3)' }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function EndgamePanel() {
  const { campaignChosen, campaignSoldiers } = useCampaignStore()
  const chosenList = campaignChosen()
  const soldiers = campaignSoldiers()

  const assassin = chosenList.find(c => c.chosenType === 'assassin')
  const hunter   = chosenList.find(c => c.chosenType === 'hunter')
  const warlock   = chosenList.find(c => c.chosenType === 'warlock')

  const sacrificeCount = chosenList.filter(c => c.sacrificeUsed).length
  const eliminatedCount = chosenList.filter(c => c.eliminated).length
  const allEliminated = eliminatedCount === 3

  const capturedSoldiers = soldiers.filter(s =>
    s.status === 'captured' &&
    chosenList.some(c => c.capturedSoldierIds.includes(s.id))
  )

  const factionHeroes: Array<{ name: string; class: string; status: string }> = soldiers
    .filter(s => ['reaper', 'skirmisher', 'templar'].includes(s.soldierClass))
    .map(s => ({
      name: s.nickname,
      class: s.soldierClass,
      status: s.status,
    }))

  const heroUsedForSacrifice = chosenList
    .filter(c => c.sacrificeUsed && c.killedByHero)
    .map(c => c.killedByHero!)

  return (
    <div className="space-y-4">

      {/* Active capture alert */}
      {capturedSoldiers.length > 0 && (
        <div className="px-3 py-2.5 border border-red-700 rounded-[2px] bg-red-950/30">
          <div className="text-xs font-mono font-bold text-red-400 mb-1">
            Active Soldier Capture
          </div>
          <p className="text-[10px] font-mono text-red-300 leading-snug">
            {capturedSoldiers.map(s => s.nickname).join(', ')} captured. Prioritize Covert Actions to locate and rescue.
          </p>
        </div>
      )}

      {/* Sacrifice warning */}
      {sacrificeCount > 0 && (
        <div className="px-3 py-2.5 border border-amber-700/60 rounded-[2px] bg-amber-950/20">
          <div className="text-xs font-mono font-bold text-amber-400 mb-1">
            Sacrifice Used ({sacrificeCount}/3)
          </div>
          <p className="text-[10px] font-mono text-amber-300 leading-snug">
            Heroes sacrificed: {heroUsedForSacrifice.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(', ')}.
            Sacrifice permanently eliminates the Chosen but kills the Hero. Track remaining heroes carefully.
          </p>
        </div>
      )}

      {/* Chosen status grid */}
      <Card>
        <CardBody className="space-y-2">
          <SectionHeading>Chosen Status</SectionHeading>
          {[assassin, hunter, warlock].map(c => {
            if (!c) return null
            const name = c.chosenType.charAt(0).toUpperCase() + c.chosenType.slice(1)
            return (
              <div
                key={c.chosenType}
                className="flex items-center gap-2 px-3 py-2.5 rounded-[2px] border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <span className="text-xs font-mono font-bold flex-1" style={{ color: 'var(--text)' }}>
                  {name}
                </span>
                {c.eliminated ? (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="gray">Eliminated</Badge>
                    {c.killedByHero && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                        {c.sacrificeUsed ? 'Sacrifice/' : ''}{c.killedByHero}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="amber">
                    {['Uninitiated', 'Acquainted', 'Familiar', 'Ascendant'][c.knowledgeTier]}
                  </Badge>
                )}
              </div>
            )
          })}
        </CardBody>
      </Card>

      {/* Victory condition note */}
      {allEliminated ? (
        <div className="px-3 py-2.5 border border-green-700/60 rounded-[2px] bg-green-950/20">
          <div className="text-xs font-mono font-bold text-green-400 mb-1">All Chosen Eliminated</div>
          <p className="text-[10px] font-mono text-green-300 leading-snug">
            All three Chosen are eliminated. The Avatar Project no longer gains passive momentum from Chosen activity.
            Focus on the final mission.
          </p>
        </div>
      ) : (
        <div
          className="px-3 py-2.5 rounded-[2px] border text-[10px] font-mono leading-relaxed"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text3)' }}
        >
          Each Chosen Stronghold assault pauses the Avatar Project while the mission is active.
          Eliminating all three Chosen removes them as a threat permanently.
          {eliminatedCount > 0 && ` ${eliminatedCount}/3 eliminated.`}
        </div>
      )}

      {/* Faction hero tracker */}
      {factionHeroes.length > 0 && (
        <Card>
          <CardBody className="space-y-2">
            <SectionHeading>Faction Heroes</SectionHeading>
            {factionHeroes.map((h, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[2px]" style={{ background: 'var(--surface2)' }}>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--text)' }}>{h.name}</span>
                  <span className="text-[10px] font-mono ml-2 capitalize" style={{ color: 'var(--text3)' }}>{h.class}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold capitalize ${
                  h.status === 'dead' ? 'text-red-400' :
                  h.status === 'ready' ? 'text-green-400' :
                  'text-amber-400'
                }`}>
                  {h.status}
                </span>
                {heroUsedForSacrifice.includes(h.class as 'reaper' | 'skirmisher' | 'templar') && (
                  <Badge variant="red">Sacrificed</Badge>
                )}
              </div>
            ))}
            {factionHeroes.length === 0 && (
              <p className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                No faction heroes in roster. Add Reaper, Skirmisher, or Templar soldiers.
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export function ChosenPanel() {
  const { activeCampaign, initChosen, campaignChosen } = useCampaignStore()
  const campaign = activeCampaign()
  const [activeTab, setActiveTab] = useState<PanelTab>('assassin')

  // Initialize Chosen records if not present
  useEffect(() => {
    if (!campaign?.dlc.wotc) return
    const chosen = campaignChosen()
    const types = ['assassin', 'hunter', 'warlock'] as const
    const hasAll = types.every(t => chosen.some(c => c.chosenType === t))
    if (!hasAll) initChosen()
  }, [campaign?.id])

  if (!campaign) {
    return (
      <div className="text-center py-12 font-mono text-sm" style={{ color: 'var(--text3)' }}>
        No active campaign.
      </div>
    )
  }

  if (!campaign.dlc.wotc) {
    return (
      <div className="text-center py-12 font-mono text-sm" style={{ color: 'var(--text3)' }}>
        War of the Chosen DLC not enabled for this campaign.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">The Chosen</h2>

      {/* Sub-tabs */}
      <div className="flex rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-neutral-950'
                : 'hover:text-neutral-300'
            }`}
            style={activeTab !== tab.id ? { background: 'var(--surface)', color: 'var(--text3)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'assassin' && <ChosenTracker chosenType="assassin" />}
      {activeTab === 'hunter'   && <ChosenTracker chosenType="hunter" />}
      {activeTab === 'warlock'  && <ChosenTracker chosenType="warlock" />}
      {activeTab === 'endgame'  && <EndgamePanel />}
    </div>
  )
}
