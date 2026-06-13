import { useMemo } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import type { DlcConfig, DlcSource, ClassDefinition, Enemy, ResearchProject, DarkEvent, Facility } from '../data/types'

import rawClasses from '../data/classes.json'
import rawEnemies from '../data/enemies.json'
import rawResearch from '../data/research.json'
import rawDarkEvents from '../data/darkevents.json'
import rawFacilities from '../data/facilities.json'

const classes = rawClasses as ClassDefinition[]
const enemies = rawEnemies as Enemy[]
const research = rawResearch as ResearchProject[]
const darkEvents = rawDarkEvents as DarkEvent[]
const facilities = rawFacilities as Facility[]

function isSourceEnabled(source: DlcSource, dlc: DlcConfig): boolean {
  switch (source) {
    case 'base': return true
    case 'wotc': return dlc.wotc
    case 'alien_hunters': return dlc.alienHunters
    case 'shens_last_gift': return dlc.shensLastGift
    case 'tlp': return dlc.wotc && dlc.tacticalLegacyPack
    default: return false
  }
}

export function useGameData() {
  const campaign = useCampaignStore(s => s.activeCampaign())
  const dlc: DlcConfig = campaign?.dlc ?? { wotc: false, alienHunters: false, shensLastGift: false, tacticalLegacyPack: false }
  const difficulty = campaign?.difficulty ?? 'veteran'

  const filteredClasses = useMemo(() =>
    classes.filter(c => isSourceEnabled(c.source, dlc)),
    [dlc.wotc, dlc.alienHunters, dlc.shensLastGift, dlc.tacticalLegacyPack]
  )

  const filteredEnemies = useMemo(() =>
    enemies.filter(e => isSourceEnabled(e.source, dlc) && !e.replacedByWotc),
    [dlc.wotc, dlc.alienHunters, dlc.shensLastGift]
  )

  const filteredResearch = useMemo(() =>
    research.filter(r => isSourceEnabled(r.source, dlc) && !r.replacedByWotc),
    [dlc.wotc, dlc.alienHunters, dlc.shensLastGift]
  )

  const filteredDarkEvents = useMemo(() =>
    darkEvents.filter(de => isSourceEnabled(de.source, dlc)),
    [dlc.wotc]
  )

  const filteredFacilities = useMemo(() => {
    if (dlc.wotc) {
      return facilities.filter(f => isSourceEnabled(f.source, dlc))
    }
    return facilities.filter(f => isSourceEnabled(f.source, dlc) && f.source !== 'wotc')
  }, [dlc.wotc, dlc.alienHunters, dlc.shensLastGift])

  return {
    dlc,
    difficulty,
    classes: filteredClasses,
    enemies: filteredEnemies,
    research: filteredResearch,
    darkEvents: filteredDarkEvents,
    facilities: filteredFacilities,
    isSourceEnabled: (source: DlcSource) => isSourceEnabled(source, dlc),
  }
}
