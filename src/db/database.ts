import Dexie, { type Table } from 'dexie'
import type { Campaign, Soldier, Mission, BondPair } from '../data/types'

export class ResistanceDB extends Dexie {
  campaigns!: Table<Campaign>
  soldiers!: Table<Soldier>
  missions!: Table<Mission>
  bonds!: Table<BondPair>

  constructor() {
    super('ResistanceHQ')
    this.version(1).stores({
      campaigns: 'id, name, createdAt, updatedAt',
      soldiers: 'id, campaignId, soldierClass, status, rank',
      missions: 'id, campaignId, date, outcome',
      bonds: 'id, campaignId, soldier1Id, soldier2Id',
    })
  }
}

export const db = new ResistanceDB()
