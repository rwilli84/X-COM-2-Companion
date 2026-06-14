import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { db } from '../db/database'
import type { Campaign, Soldier, Mission, BondPair, DlcConfig, Difficulty, ChosenData } from '../data/types'
import { DEFAULT_DLC } from '../data/types'
import { nanoid } from 'nanoid'

interface CampaignState {
  activeCampaignId: string | null
  campaigns: Campaign[]
  soldiers: Soldier[]
  missions: Mission[]
  bonds: BondPair[]
  loaded: boolean

  // Campaign actions
  loadAll: () => Promise<void>
  createCampaign: (name: string, difficulty: Difficulty, dlc: DlcConfig) => Promise<Campaign>
  updateCampaign: (id: string, patch: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  setActiveCampaign: (id: string | null) => void
  activeCampaign: () => Campaign | null

  // Soldier actions
  createSoldier: (partial: Omit<Soldier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Soldier>
  updateSoldier: (id: string, patch: Partial<Soldier>) => Promise<void>
  deleteSoldier: (id: string) => Promise<void>
  campaignSoldiers: () => Soldier[]

  // Mission actions
  createMission: (partial: Omit<Mission, 'id'>) => Promise<Mission>
  updateMission: (id: string, patch: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>
  campaignMissions: () => Mission[]

  // Bond actions
  createBond: (soldier1Id: string, soldier2Id: string, campaignId: string) => Promise<BondPair>
  updateBond: (id: string, patch: Partial<BondPair>) => Promise<void>
  deleteBond: (id: string) => Promise<void>
  campaignBonds: () => BondPair[]

  // Chosen actions (WotC) — stored inside campaign.chosenData[]
  initChosen: () => Promise<void>
  campaignChosen: () => ChosenData[]
  getChosen: (type: 'assassin' | 'hunter' | 'warlock') => ChosenData | undefined
  updateChosen: (type: 'assassin' | 'hunter' | 'warlock', patch: Partial<ChosenData>) => Promise<void>

  // Armory
  updateArmoryItem: (itemId: string, qty: number) => Promise<void>

  // Export/import
  exportCampaign: (id: string) => Promise<string>
  importCampaign: (json: string) => Promise<void>
}

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  activeCampaignId: null,
  campaigns: [],
  soldiers: [],
  missions: [],
  bonds: [],
  loaded: false,

  loadAll: async () => {
    const [campaigns, soldiers, missions, bonds] = await Promise.all([
      db.campaigns.toArray(),
      db.soldiers.toArray(),
      db.missions.toArray(),
      db.bonds.toArray(),
    ])
    set({ campaigns, soldiers, missions, bonds, loaded: true })
  },

  createCampaign: async (name, difficulty, dlc) => {
    const campaign: Campaign = {
      id: nanoid(),
      name,
      difficulty,
      dlc,
      avatarPips: 0,
      avatarLog: [],
      activeDarkEvents: [],
      facilityPlacements: [],
      chosenData: [],
      covertActions: [],
      completedResearch: [],
      pinnedResearchPaths: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.campaigns.add(campaign)
    set(s => ({ campaigns: [...s.campaigns, campaign], activeCampaignId: campaign.id }))
    return campaign
  },

  updateCampaign: async (id, patch) => {
    const updated = { ...patch, updatedAt: Date.now() }
    await db.campaigns.update(id, updated)
    set(s => ({
      campaigns: s.campaigns.map(c => c.id === id ? { ...c, ...updated } : c),
    }))
  },

  deleteCampaign: async (id) => {
    await Promise.all([
      db.campaigns.delete(id),
      db.soldiers.where('campaignId').equals(id).delete(),
      db.missions.where('campaignId').equals(id).delete(),
      db.bonds.where('campaignId').equals(id).delete(),
    ])
    set(s => ({
      campaigns: s.campaigns.filter(c => c.id !== id),
      soldiers: s.soldiers.filter(s2 => s2.campaignId !== id),
      missions: s.missions.filter(m => m.campaignId !== id),
      bonds: s.bonds.filter(b => b.campaignId !== id),
      activeCampaignId: s.activeCampaignId === id ? null : s.activeCampaignId,
    }))
  },

  setActiveCampaign: (id) => set({ activeCampaignId: id }),

  activeCampaign: () => {
    const { activeCampaignId, campaigns } = get()
    return campaigns.find(c => c.id === activeCampaignId) ?? null
  },

  createSoldier: async (partial) => {
    const soldier: Soldier = {
      ...partial,
      id: nanoid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.soldiers.add(soldier)
    set(s => ({ soldiers: [...s.soldiers, soldier] }))
    return soldier
  },

  updateSoldier: async (id, patch) => {
    const updated = { ...patch, updatedAt: Date.now() }
    await db.soldiers.update(id, updated)
    set(s => ({
      soldiers: s.soldiers.map(sol => sol.id === id ? { ...sol, ...updated } : sol),
    }))
  },

  deleteSoldier: async (id) => {
    await db.soldiers.delete(id)
    set(s => ({ soldiers: s.soldiers.filter(sol => sol.id !== id) }))
  },

  campaignSoldiers: () => {
    const { activeCampaignId, soldiers } = get()
    return soldiers.filter(s => s.campaignId === activeCampaignId)
  },

  createMission: async (partial) => {
    const mission: Mission = { ...partial, id: nanoid() }
    await db.missions.add(mission)
    set(s => ({ missions: [...s.missions, mission] }))
    return mission
  },

  updateMission: async (id, patch) => {
    await db.missions.update(id, patch)
    set(s => ({
      missions: s.missions.map(m => m.id === id ? { ...m, ...patch } : m),
    }))
  },

  deleteMission: async (id) => {
    await db.missions.delete(id)
    set(s => ({ missions: s.missions.filter(m => m.id !== id) }))
  },

  campaignMissions: () => {
    const { activeCampaignId, missions } = get()
    return missions.filter(m => m.campaignId === activeCampaignId)
  },

  createBond: async (soldier1Id, soldier2Id, campaignId) => {
    const bond: BondPair = {
      id: nanoid(),
      soldier1Id,
      soldier2Id,
      campaignId,
      level: 1,
      cohesion: 0,
    }
    await db.bonds.add(bond)
    set(s => ({ bonds: [...s.bonds, bond] }))
    return bond
  },

  updateBond: async (id, patch) => {
    await db.bonds.update(id, patch)
    set(s => ({
      bonds: s.bonds.map(b => b.id === id ? { ...b, ...patch } : b),
    }))
  },

  deleteBond: async (id) => {
    await db.bonds.delete(id)
    set(s => ({ bonds: s.bonds.filter(b => b.id !== id) }))
  },

  campaignBonds: () => {
    const { activeCampaignId, bonds } = get()
    return bonds.filter(b => b.campaignId === activeCampaignId)
  },

  initChosen: async () => {
    const { activeCampaign, updateCampaign } = get()
    const campaign = activeCampaign()
    if (!campaign) return
    const types: Array<'assassin' | 'hunter' | 'warlock'> = ['assassin', 'hunter', 'warlock']
    const existing = new Set(campaign.chosenData.map(c => c.chosenType))
    const toAdd: ChosenData[] = types
      .filter(t => !existing.has(t))
      .map(t => ({
        id: `${campaign.id}:${t}`,
        campaignId: campaign.id,
        chosenType: t,
        strengths: [],
        weaknesses: [],
        knowledgeTier: 0 as const,
        knowledgeLog: [],
        strongholdAssaulted: false,
        strongholdCompleted: false,
        sacrificeUsed: false,
        capturedSoldierIds: [],
        eliminated: false,
      }))
    if (toAdd.length === 0) return
    await get().updateCampaign(campaign.id, {
      chosenData: [...campaign.chosenData, ...toAdd],
    })
  },

  campaignChosen: () => {
    const campaign = get().activeCampaign()
    return campaign?.chosenData ?? []
  },

  getChosen: (type) => {
    return get().campaignChosen().find(c => c.chosenType === type)
  },

  updateChosen: async (type, patch) => {
    const { activeCampaign, updateCampaign } = get()
    const campaign = activeCampaign()
    if (!campaign) return
    const updatedChosenData = campaign.chosenData.map(c =>
      c.chosenType === type ? { ...c, ...patch } : c
    )
    await updateCampaign(campaign.id, { chosenData: updatedChosenData })
  },

  updateArmoryItem: async (itemId, qty) => {
    const { activeCampaign, updateCampaign } = get()
    const campaign = activeCampaign()
    if (!campaign) return
    const armory = { ...(campaign.armory ?? {}), [itemId]: Math.max(0, qty) }
    await updateCampaign(campaign.id, { armory })
  },

  exportCampaign: async (id) => {
    const [campaign, soldiers, missions, bonds] = await Promise.all([
      db.campaigns.get(id),
      db.soldiers.where('campaignId').equals(id).toArray(),
      db.missions.where('campaignId').equals(id).toArray(),
      db.bonds.where('campaignId').equals(id).toArray(),
    ])
    return JSON.stringify({ campaign, soldiers, missions, bonds }, null, 2)
  },

  importCampaign: async (json) => {
    const data = JSON.parse(json) as { campaign: Campaign; soldiers: Soldier[]; missions: Mission[]; bonds: BondPair[] }
    const newId = nanoid()
    const campaign = { ...data.campaign, id: newId, name: data.campaign.name + ' (imported)', createdAt: Date.now(), updatedAt: Date.now() }
    const idMap = new Map<string, string>()
    idMap.set(data.campaign.id, newId)
    const soldiers = data.soldiers.map(s => {
      const newSolId = nanoid()
      idMap.set(s.id, newSolId)
      return { ...s, id: newSolId, campaignId: newId }
    })
    const missions = data.missions.map(m => ({ ...m, id: nanoid(), campaignId: newId }))
    const bonds = data.bonds.map(b => ({
      ...b,
      id: nanoid(),
      campaignId: newId,
      soldier1Id: idMap.get(b.soldier1Id) ?? b.soldier1Id,
      soldier2Id: idMap.get(b.soldier2Id) ?? b.soldier2Id,
    }))
    await Promise.all([
      db.campaigns.add(campaign),
      db.soldiers.bulkAdd(soldiers),
      db.missions.bulkAdd(missions),
      db.bonds.bulkAdd(bonds),
    ])
    set(s => ({
      campaigns: [...s.campaigns, campaign],
      soldiers: [...s.soldiers, ...soldiers],
      missions: [...s.missions, ...missions],
      bonds: [...s.bonds, ...bonds],
    }))
  },
}))
