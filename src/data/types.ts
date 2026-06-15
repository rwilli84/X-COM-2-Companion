// ─── DLC & Source ───────────────────────────────────────────────────────────

export type DlcSource = 'base' | 'wotc' | 'alien_hunters' | 'shens_last_gift' | 'tlp'

export interface DlcConfig {
  wotc: boolean
  alienHunters: boolean
  shensLastGift: boolean
  tacticalLegacyPack: boolean
}

export const DEFAULT_DLC: DlcConfig = {
  wotc: false,
  alienHunters: false,
  shensLastGift: false,
  tacticalLegacyPack: false,
}

// ─── Difficulty ──────────────────────────────────────────────────────────────

export type Difficulty = 'rookie' | 'veteran' | 'commander' | 'legend'

// ─── Soldier ─────────────────────────────────────────────────────────────────

export type SoldierClass =
  | 'ranger' | 'sharpshooter' | 'grenadier' | 'specialist' | 'psi_operative'
  | 'spark'           // shens_last_gift
  | 'reaper' | 'skirmisher' | 'templar'  // wotc

export type SoldierStatus = 'ready' | 'wounded' | 'tired' | 'shaken' | 'dead' | 'captured' | 'missing'

export type SoldierRank =
  | 'rookie' | 'squaddie' | 'corporal' | 'sergeant' | 'lieutenant' | 'captain' | 'major' | 'colonel'

export interface BondPair {
  id: string
  campaignId: string
  soldier1Id: string
  soldier2Id: string
  level: 1 | 2 | 3
  cohesion: number
}

export interface Soldier {
  id: string
  campaignId: string
  nickname: string
  firstName?: string
  lastName?: string
  soldierClass: SoldierClass | null   // null until promoted to Squaddie
  rank: SoldierRank
  status: SoldierStatus
  woundDaysRemaining?: number
  plannedAbilities: string[]   // ability ids the user has planned
  takenAbilities: string[]     // ability ids confirmed taken in-game
  weaponTier: WeaponTier
  armorTier: ArmorTier
  // Structured loadout slots
  grenadeSlot?: string
  utilitySlots?: [string?, string?, string?]
  ammoType?: string
  pcsChip?: string
  /** @deprecated use structured loadout fields */
  loadoutNotes: string
  killCount: number
  missionCount: number
  epitaph?: string
  psiAbilities?: string[]      // psi op training slots
  trainingCenterAbility?: string  // WotC random ability
  createdAt: number
  updatedAt: number
}

export type WeaponTier = 'conventional' | 'magnetic' | 'beam'
export type ArmorTier = 'none' | 'kevlar' | 'predator' | 'warden' | 'powered' | 'spider' | 'wraith' | 'hunter' | 'alien_rulers'

// ─── Ability / Skill Tree ────────────────────────────────────────────────────

export interface Ability {
  id: string
  name: string
  description: string
  source: DlcSource
  passive?: boolean
  approx?: boolean
}

export interface SkillTreeRank {
  rank: SoldierRank
  choices: Ability[]   // usually 2, sometimes 1 or 3
  freeAbility?: Ability  // WotC XCOM-row / AP
}

export interface ClassDefinition {
  id: SoldierClass
  name: string
  description: string
  source: DlcSource
  ranks: SkillTreeRank[]
  squaddieFreeAbility?: Ability   // first ability all get on promotion
}

// ─── Enemies ─────────────────────────────────────────────────────────────────

export interface DifficultyStats {
  hp: number
  armor?: number
  mobility: number
  will?: number
  approx?: boolean
}

export interface EnemyAbility {
  name: string
  description: string
  approx?: boolean
}

export interface Enemy {
  id: string
  name: string
  description: string
  source: DlcSource
  replacedByWotc?: boolean
  faction: string
  difficultyStats: Record<Difficulty, DifficultyStats>
  abilities: EnemyAbility[]
  counterTip: string
  isRuler?: boolean
  rulerReactionNote?: string
  approx?: boolean
}

// ─── Research ────────────────────────────────────────────────────────────────

export interface ResearchProject {
  id: string
  name: string
  description: string
  source: DlcSource
  prerequisites: string[]   // research ids
  days: Record<Difficulty, number>
  unlocks: string[]         // descriptions of what this unlocks
  replacedByWotc?: boolean
  approx?: boolean
}

// ─── Dark Events ──────────────────────────────────────────────────────────────

export interface DarkEvent {
  id: string
  name: string
  description: string
  effect: string
  source: DlcSource
  duration: string
  approx?: boolean
}

// ─── Avenger Facilities ───────────────────────────────────────────────────────

export interface Facility {
  id: string
  name: string
  description: string
  source: DlcSource
  powerCost: number
  buildDays: number
  buildCost: string
  effects: string[]
  replacedByWotc?: boolean
  approx?: boolean
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface AvatarLog {
  date: string
  change: number
  reason: string
}

export interface ActiveDarkEvent {
  id: string
  eventId: string
  startedAt: string
  expiresAt?: string
  completed: boolean
}

export interface KnowledgeLogEntry {
  timestamp: number
  event: string
}

export interface ChosenData {
  id: string
  campaignId: string
  chosenType: 'assassin' | 'hunter' | 'warlock'
  strengths: string[]
  weaknesses: string[]
  knowledgeTier: 0 | 1 | 2 | 3
  knowledgeLog: KnowledgeLogEntry[]
  strongholdRegion?: string
  strongholdAssaulted: boolean
  strongholdCompleted: boolean
  killedByHero?: 'reaper' | 'skirmisher' | 'templar'
  sacrificeUsed: boolean
  capturedSoldierIds: string[]
  eliminated: boolean
}

export interface Mission {
  id: string
  campaignId: string
  type: string
  date: string
  outcome: 'success' | 'failure' | 'partial'
  deployedSoldierIds: string[]
  kiaIds: string[]
  woundedIds: string[]
  notes: string
}

export interface FacilityPlacement {
  col: number   // 0-3
  row: number   // 0-2
  facilityId: string
}

export interface CovertAction {
  id: string
  campaignId: string
  name: string
  date: string
  outcome: string
  notes: string
}

export interface Campaign {
  id: string
  name: string
  difficulty: Difficulty
  dlc: DlcConfig
  avatarPips: number
  avatarLog: AvatarLog[]
  activeDarkEvents: ActiveDarkEvent[]
  facilityPlacements: FacilityPlacement[]
  chosenData: ChosenData[]
  covertActions: CovertAction[]
  completedResearch: string[]
  pinnedResearchPaths: string[]
  armory?: Record<string, number>  // itemId -> quantity in stock
  createdAt: number
  updatedAt: number
}
