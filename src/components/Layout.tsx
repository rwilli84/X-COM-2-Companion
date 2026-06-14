import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

// Clean SVG icons — stroke-based, consistent weight
function IconRoster() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}
function IconIntel() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="4" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="20" />
      <line x1="4" y1="12" x2="2" y2="12" />
      <line x1="22" y1="12" x2="20" y2="12" />
    </svg>
  )
}
function IconAvatar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}
function IconResearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v6l3 9H6L9 9V3z" />
      <line x1="9" y1="3" x2="15" y2="3" />
    </svg>
  )
}
function IconOps() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function IconAdvisor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function IconBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

const tabs = [
  { to: '/roster',   label: 'Roster',   Icon: IconRoster },
  { to: '/enemies',  label: 'Intel',    Icon: IconIntel },
  { to: '/avatar',   label: 'Avatar',   Icon: IconAvatar },
  { to: '/research', label: 'Avenger', Icon: IconResearch },
  { to: '/missions', label: 'Ops',      Icon: IconOps },
  { to: '/advisor',  label: 'Advisor',  Icon: IconAdvisor },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-neutral-950 max-w-2xl mx-auto relative">
      <header className="shrink-0 px-4 h-12 border-b border-neutral-800 flex items-center justify-between">
        <span className="font-mono font-bold text-amber-500 tracking-[0.15em] text-sm uppercase">
          Resistance HQ
        </span>
        <div className="flex items-center gap-4">
          <NavLink
            to="/campaigns"
            className="flex items-center gap-1 text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <IconBack />
            Campaigns
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `transition-colors ${isActive ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'}`
            }
            title="Settings"
          >
            <IconSettings />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>

      <nav className="shrink-0 border-t border-neutral-800 bg-neutral-950">
        <div className="flex">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[54px] transition-colors ` +
                (isActive
                  ? 'text-amber-400 border-t-2 border-amber-500'
                  : 'text-neutral-600 border-t-2 border-transparent hover:text-neutral-400')
              }
            >
              <Icon />
              <span className="text-[10px] font-mono uppercase tracking-wider leading-none">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
