import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { DeploymentPlanner } from '../components/advisor/DeploymentPlanner'
import { MissionSelector } from '../components/advisor/MissionSelector'
import { ResearchAdvisorPanel } from '../components/advisor/ResearchAdvisorPanel'
import { BaseAdvisorPanel } from '../components/advisor/BaseAdvisorPanel'
import { EconomyPanel } from '../components/advisor/EconomyPanel'
import { ShotCalculatorPanel } from '../components/ShotCalculator/ShotCalculatorPanel'
import { ChosenPanel } from '../components/Chosen/ChosenPanel'
import { TrainingPanel } from '../components/advisor/TrainingPanel'
import { ArmoryPanel } from '../components/advisor/ArmoryPanel'
import { BattleAdvisorPanel } from '../components/advisor/BattleAdvisorPanel'
import { ADVISOR_GLOSSARY } from '../advisor/config'

type Tab = 'squad' | 'ops' | 'labs' | 'base' | 'econ' | 'shot' | 'train' | 'arms' | 'battle' | 'chosen'

const BASE_TABS: Array<{ id: Tab; label: string; wotcOnly?: boolean }> = [
  { id: 'squad',  label: 'Squad'  },
  { id: 'ops',    label: 'Ops'    },
  { id: 'train',  label: 'Train'  },
  { id: 'arms',   label: 'Arms'   },
  { id: 'battle', label: 'Battle' },
  { id: 'labs',   label: 'Labs'   },
  { id: 'base',   label: 'Base'   },
  { id: 'econ',   label: 'Econ'   },
  { id: 'shot',   label: 'Shot'   },
  { id: 'chosen', label: 'Chosen', wotcOnly: true },
]

function GlossaryPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
      <button
        className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
        style={{ background: 'var(--surface)' }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-mono font-semibold uppercase tracking-wider flex-1" style={{ color: 'var(--text3)' }}>
          Why? Glossary
        </span>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 grid grid-cols-1 gap-2" style={{ background: 'var(--bg)' }}>
          {Object.entries(ADVISOR_GLOSSARY).map(([key, def]) => (
            <div key={key} className="text-xs font-mono">
              <span className="text-amber-600 font-bold">{key}</span>
              <span className="ml-2" style={{ color: 'var(--text3)' }}>{def}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Advisor() {
  const { activeCampaign } = useCampaignStore()
  const campaign = activeCampaign()
  const [activeTab, setActiveTab] = useState<Tab>('squad')

  const visibleTabs = BASE_TABS.filter(t => !t.wotcOnly || campaign?.dlc.wotc)

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-base font-mono font-bold text-amber-500 uppercase tracking-wider">Strategic Advisor</h1>

      {/* Sub-tabs — scrollable when WotC adds 7th tab */}
      <div
        className="flex rounded-[2px] overflow-hidden border overflow-x-auto"
        style={{ borderColor: 'var(--border)' }}
      >
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 shrink-0 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            style={activeTab !== tab.id ? { background: 'var(--surface)', minWidth: '40px' } : { minWidth: '40px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'squad'  && <DeploymentPlanner />}
      {activeTab === 'ops'    && <MissionSelector />}
      {activeTab === 'train'  && <TrainingPanel />}
      {activeTab === 'arms'   && <ArmoryPanel />}
      {activeTab === 'battle' && <BattleAdvisorPanel />}
      {activeTab === 'labs'   && <ResearchAdvisorPanel />}
      {activeTab === 'base'   && <BaseAdvisorPanel />}
      {activeTab === 'econ'   && <EconomyPanel />}
      {activeTab === 'shot'   && <ShotCalculatorPanel />}
      {activeTab === 'chosen' && <ChosenPanel />}

      <GlossaryPanel />
    </div>
  )
}
