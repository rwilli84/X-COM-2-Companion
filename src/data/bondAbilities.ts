// War of the Chosen soldier-bond abilities. These are granted automatically
// at each bond level (not chosen), so they derive purely from BondPair.level.

export interface BondAbility {
  id: string
  name: string
  level: 1 | 2 | 3
  description: string
  passive?: boolean
}

export const BOND_ABILITIES: BondAbility[] = [
  {
    id: 'teamwork',
    name: 'Teamwork',
    level: 1,
    description: 'Transfer one of your action points to your bondmate. One charge per mission, shared between the pair.',
  },
  {
    id: 'stand_by_me',
    name: 'Stand By Me',
    level: 2,
    passive: true,
    description: 'End a move adjacent to your bondmate to automatically cleanse their negative mental effects (panic, disorient, etc.).',
  },
  {
    id: 'spotter',
    name: 'Spotter',
    level: 2,
    passive: true,
    description: '+10% Aim against any target that has attacked, or been attacked by, your bondmate. +10% more while standing adjacent.',
  },
  {
    id: 'covert_operators',
    name: 'Covert Operators',
    level: 2,
    passive: true,
    description: 'Deploying both bondmates on the same Covert Action reduces its duration by one day.',
  },
  {
    id: 'advanced_teamwork',
    name: 'Advanced Teamwork',
    level: 3,
    description: 'Teamwork upgraded to two charges per mission (still shared between the pair).',
  },
  {
    id: 'dual_strike',
    name: 'Dual Strike',
    level: 3,
    description: 'Both bondmates fire at a single enemy together; the assisting bondmate\u2019s shot is a free action. Requires line of sight for both.',
  },
]

// Abilities unlocked at or below a given bond level.
export function unlockedBondAbilities(level: number): BondAbility[] {
  return BOND_ABILITIES.filter(a => a.level <= level)
}
