import { useState } from 'react'
import { DeploymentPlanner } from '../components/advisor/DeploymentPlanner'
import { MissionSelector } from '../components/advisor/MissionSelector'
import { ResearchAdvisorPanel } from '../components/advisor/ResearchAdvisorPanel'
import { BaseAdvisorPanel } from '../components/advisor/BaseAdvisorPanel'
import { EconomyPanel } from '../components/advisor/EconomyPanel'
import { ADVISOR_GLOSSARY } from '../advisor/config'

type Tab = 'squad' | 'ops' | 'labs' | 'base' | 'econ'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'squad', label: 'Squad' },
  { id: 'ops',   label: 'Ops'   },
  { id: 'labs',  label: 'Labs'  },
  { id: 'base',  label: 'Base'  },
  { id: 'econ',  label: 'Econ'  },
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
  const [activeTab, setActiveTab] = useState<Tab>('squad')

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-base font-mono font-bold text-amber-500 uppercase tracking-wider">Strategic Advisor</h1>

      {/* Sub-tabs — scrollable row so all 5 fit on narrow screens */}
      <div className="flex rounded-[2px] overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            style={activeTab !== tab.id ? { background: 'var(--surface)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'squad' && <DeploymentPlanner />}
      {activeTab === 'ops'   && <MissionSelector />}
      {activeTab === 'labs'  && <ResearchAdvisorPanel />}
      {activeTab === 'base'  && <BaseAdvisorPanel />}
      {activeTab === 'econ'  && <EconomyPanel />}

      <GlossaryPanel />
    </div>
  )
}
