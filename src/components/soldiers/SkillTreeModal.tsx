import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useCampaignStore } from '../../store/campaignStore'
import type { Soldier, ClassDefinition, Ability } from '../../data/types'

interface Props {
  soldier: Soldier
  classes: ClassDefinition[]
  onClose: () => void
}

export function SkillTreeModal({ soldier, classes, onClose }: Props) {
  const { updateSoldier } = useCampaignStore()
  const classDef = classes.find(c => c.id === soldier.soldierClass)
  const [planned, setPlanned] = useState<string[]>(soldier.plannedAbilities)
  const [taken, setTaken] = useState<string[]>(soldier.takenAbilities)

  if (!classDef) {
    return (
      <Modal title="Skill Tree" onClose={onClose}>
        <div className="text-neutral-500 font-mono text-sm py-4 text-center">No skill tree available for this class.</div>
      </Modal>
    )
  }

  const togglePlanned = (abilityId: string) => {
    setPlanned(prev =>
      prev.includes(abilityId)
        ? prev.filter(id => id !== abilityId)
        : [...prev, abilityId]
    )
  }

  const toggleTaken = (abilityId: string) => {
    setTaken(prev =>
      prev.includes(abilityId)
        ? prev.filter(id => id !== abilityId)
        : [...prev, abilityId]
    )
  }

  const handleSave = async () => {
    await updateSoldier(soldier.id, { plannedAbilities: planned, takenAbilities: taken })
    onClose()
  }

  const getAbilityState = (id: string): 'taken' | 'planned' | 'none' => {
    if (taken.includes(id)) return 'taken'
    if (planned.includes(id)) return 'planned'
    return 'none'
  }

  return (
    <Modal
      title={`${soldier.nickname} — ${classDef.name} Skill Tree`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span>Taken</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-800 border border-blue-500 inline-block"></span>Planned</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-700 inline-block"></span>None</span>
        </div>
        <p className="text-xs text-neutral-600 font-mono">Tap once to plan, twice to mark taken, third to clear.</p>

        {classDef.squaddieFreeAbility && (
          <AbilityCard
            ability={classDef.squaddieFreeAbility}
            state="taken"
            onCycle={() => {}}
            rankLabel="Squaddie (free)"
            isFree
          />
        )}

        {classDef.ranks.map(rankDef => (
          <div key={rankDef.rank}>
            <div className="text-xs font-mono text-amber-600 uppercase tracking-widest mb-2 border-b border-neutral-800 pb-1">
              {rankDef.rank}
            </div>
            <div className="space-y-2">
              {rankDef.choices.map(ability => {
                const state = getAbilityState(ability.id)
                const cycleState = () => {
                  if (state === 'none') togglePlanned(ability.id)
                  else if (state === 'planned') { togglePlanned(ability.id); toggleTaken(ability.id) }
                  else { toggleTaken(ability.id) }
                }
                return (
                  <AbilityCard
                    key={ability.id}
                    ability={ability}
                    state={state}
                    onCycle={cycleState}
                    rankLabel=""
                  />
                )
              })}
              {rankDef.freeAbility && (
                <AbilityCard
                  key={rankDef.freeAbility.id}
                  ability={rankDef.freeAbility}
                  state={getAbilityState(rankDef.freeAbility.id)}
                  onCycle={() => {}}
                  rankLabel=""
                  isFree
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function AbilityCard({ ability, state, onCycle, rankLabel, isFree }: {
  ability: Ability
  state: 'taken' | 'planned' | 'none'
  onCycle: () => void
  rankLabel: string
  isFree?: boolean
}) {
  const bg =
    state === 'taken' ? 'bg-amber-950 border-amber-700' :
    state === 'planned' ? 'bg-blue-950 border-blue-700' :
    'bg-neutral-900 border-neutral-800'

  return (
    <button
      className={`w-full text-left p-3 border rounded-sm transition-colors ${bg} ${isFree ? 'cursor-default' : 'hover:border-neutral-600 active:scale-[0.99]'}`}
      onClick={!isFree ? onCycle : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-sm text-neutral-100">{ability.name}</span>
        {ability.approx && <span className="text-amber-500 text-xs">~</span>}
        {isFree && <span className="text-xs font-mono text-neutral-600">(free)</span>}
        {ability.passive && <span className="text-xs font-mono text-purple-400">passive</span>}
        {state === 'taken' && <span className="ml-auto text-amber-400 text-xs font-mono">✓ TAKEN</span>}
        {state === 'planned' && <span className="ml-auto text-blue-400 text-xs font-mono">◆ PLAN</span>}
      </div>
      <p className="text-xs text-neutral-500 font-mono mt-1 leading-relaxed">{ability.description}</p>
    </button>
  )
}
