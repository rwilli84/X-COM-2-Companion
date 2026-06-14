import Dexie, { type Table } from 'dexie'
import type { Campaign, Soldier, Mission, BondPair } from '../data/types'
import type { WeaponType, WeaponTierInput, RangeBracket } from '../advisor/shotCalculator'

export interface ShotProfile {
  id: string
  campaignId: string
  name: string
  soldierId?: string       // optional link to a roster soldier
  baseAim: number
  baseCrit: number
  weaponType: WeaponType
  weaponTier: WeaponTierInput
  rangeBracket: RangeBracket
  scopeBonus: number
  abilityModIds: string[]
  isElevated: boolean
  createdAt: number
}

export class ResistanceDB extends Dexie {
  campaigns!: Table<Campaign>
  soldiers!: Table<Soldier>
  missions!: Table<Mission>
  bonds!: Table<BondPair>
  shotProfiles!: Table<ShotProfile>

  constructor() {
    super('ResistanceHQ')
    this.version(1).stores({
      campaigns: 'id, name, createdAt, updatedAt',
      soldiers: 'id, campaignId, soldierClass, status, rank',
      missions: 'id, campaignId, date, outcome',
      bonds: 'id, campaignId, soldier1Id, soldier2Id',
    })
    this.version(2).stores({
      shotProfiles: 'id, campaignId, name, createdAt',
    })
  }
}

export const db = new ResistanceDB()
