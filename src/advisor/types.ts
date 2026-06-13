import type { Campaign, Soldier, Mission, DlcConfig, Difficulty, BondPair } from '../data/types'

// ─── Capability tags ─────────────────────────────────────────────────────────

export type CapabilityTag =
  | 'aoe'           // area-of-effect damage / cover destruction
  | 'crowdControl'  // stun, disorient, panic, stasis, suppress, mind control
  | 'armorShred'    // flat armor reduction
  | 'mobility'      // extra movement, dash-and-act, free moves
  | 'hacking'       // Gremlin, Haywire, terminal interaction
  | 'sustain'       // healing, damage mitigation, self-repair
  | 'burst'         // high single-target damage spike
  | 'melee'         // sword/blade/psi-blade attacks
  | 'actionEconomy' // free actions, bonus actions, interrupt turns
  | 'ammoEfficiency'// headshot chaining (Lost), multi-hit with limited ammo
  | 'concealment'   // stealth, shadow, phantom
  | 'psionics'      // psi damage/control (counters Psi-vulnerable enemies)

// ─── Mission types ────────────────────────────────────────────────────────────

export type MissionType =
  | 'guerrilla_op_timed'
  | 'guerrilla_op_standard'
  | 'supply_raid'
  | 'retaliation'
  | 'council_vip_extract'
  | 'council_vip_capture'
  | 'facility_assault'
  | 'avenger_defense'
  | 'network_tower'
  | 'chosen_stronghold'
  | 'alien_ruler_encounter'
  | 'lost_abandoned'
  | 'lost_mission'
  | 'final_mission'
  | 'blacksite'
  | 'forge'
  | 'psi_gate'

export interface MissionProfile {
  id: MissionType
  name: string
  description: string
  source: 'base' | 'wotc' | 'alien_hunters'
  needs: Partial<Record<CapabilityTag, number>> // weight 1–3
  requiredRoles?: Array<'specialist' | 'grenadier' | 'psi_operative' | 'reaper'>
  hardCounters?: string[]  // ability ids or items that hard-counter a threat
  generalWarnings?: string[]
  minSquadSize?: number
}

// ─── Scoring output ───────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  label: string
  delta: number
  tag?: CapabilityTag
}

export interface SoldierScore {
  soldier: Soldier
  score: number
  excluded: boolean
  exclusionReason?: string
  breakdowns: ScoreBreakdown[]
  warnings: string[]
}

export interface SquadRecommendation {
  soldiers: SoldierScore[]
  squadWarnings: string[]
  missingRoles: string[]
  bondPairs: Array<{ s1: string; s2: string; note: string }>
  profileName: string
  dataQuality: 'full' | 'partial' | 'minimal'
  missingDataHints: string[]
}

// ─── Mission selection ────────────────────────────────────────────────────────

export type RewardType =
  | 'supplies' | 'intel' | 'alloys' | 'cores' | 'engineers' | 'scientists'
  | 'contacts' | 'avatar_reduction' | 'dark_event_counter' | 'soldier_rescue'
  | 'chosen_knowledge' | 'resistance_ring' | 'xp' | 'unknown'

export interface MissionOption {
  id: string
  label: string
  missionType: MissionType
  primaryReward: RewardType
  secondaryReward?: RewardType
  countersActiveDarkEvent: boolean
  daysRemaining?: number
  chosenTerritory?: boolean
  difficulty?: 'low' | 'medium' | 'high'
}

export interface MissionOptionScore {
  option: MissionOption
  score: number
  rank: number
  reasons: string[]
  warnings: string[]
}

export type DoomPressure = 'low' | 'medium' | 'high' | 'critical'

// ─── Research recommendation ──────────────────────────────────────────────────

export interface ResearchRecommendation {
  researchId: string
  researchName: string
  score: number
  reasons: string[]
  estimatedDays: number
  opportunityCost: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

// ─── Base advisor ─────────────────────────────────────────────────────────────

export interface BaseRecommendation {
  facilityId: string
  facilityName: string
  score: number
  reasons: string[]
  suggestedCell?: { col: number; row: number }
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface StaffingRecommendation {
  role: 'engineer' | 'scientist'
  bestFacility: string
  reason: string
}

export interface BasePlan {
  nextBuilds: BaseRecommendation[]
  warnings: string[]
  staffing: StaffingRecommendation[]
  powerMargin: number
  contactsRemaining: number
}

// ─── Economy advisor ──────────────────────────────────────────────────────────

export interface InventorySnapshot {
  supplies: number
  alloys: number
  crystals: number   // elerium crystals
  cores: number      // elerium cores (very scarce)
  intel: number
  contacts: number   // active resistance contacts
  provingGroundsActive: boolean  // is a PG project already running?
  plannedArmorTier?: 'predator' | 'warden' | 'powered' | 'spider' | 'wraith'
  plannedWeaponTier?: 'magnetic' | 'beam'
}

export interface SellRecommendation {
  item: string
  currentStock: number
  safeToSell: number
  keepAmount: number
  reason: string
  risk: 'safe' | 'caution' | 'hold'
}

export interface ProvingGroundsProject {
  id: string
  name: string
  supplyCost: number
  alloyCost: number
  crystalCost: number
  coreCost: number
  usefulness: number   // 1–10
  usefulnessNote: string
  category: 'grenade' | 'ammo' | 'utility' | 'weapon' | 'armor'
}

export interface EconomyPlan {
  sellRecommendations: SellRecommendation[]
  provingGroundsQueue: Array<ProvingGroundsProject & { affordable: boolean; reason: string }>
  supplyProjection: {
    weeklyIncome: number
    projectedIn4Weeks: number
    projectedIn8Weeks: number
    weeksToAffordNextFacility: number | null
    nextFacilityCost: number | null
    nextFacilityName: string | null
  }
  warnings: string[]
  tips: string[]
}

// ─── Snapshot passed to all advisor functions ─────────────────────────────────

export interface CampaignSnapshot {
  campaign: Campaign
  soldiers: Soldier[]
  missions: Mission[]
  bonds: BondPair[]
  doomPressure: DoomPressure
}
