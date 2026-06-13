import { useState, useMemo } from 'react'
import { useGameData } from '../hooks/useGameData'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { Enemy, Difficulty } from '../data/types'

const factionColors: Record<string, 'red' | 'amber' | 'blue' | 'purple' | 'gray'> = {
  'ADVENT': 'blue',
  'Alien': 'red',
  'Elder': 'purple',
  'Alien Ruler': 'red',
  'Chosen': 'purple',
  'Lost': 'gray',
}

export function EnemyDatabase() {
  const { enemies, difficulty } = useGameData()
  const [search, setSearch] = useState('')
  const [factionFilter, setFactionFilter] = useState<string>('All')
  const [selected, setSelected] = useState<Enemy | null>(null)

  const factions = useMemo(() => {
    const seen = new Set<string>()
    enemies.forEach(e => seen.add(e.faction))
    return ['All', ...Array.from(seen)]
  }, [enemies])

  const filtered = useMemo(() => {
    return enemies.filter(e => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase())
      const matchFaction = factionFilter === 'All' || e.faction === factionFilter
      return matchSearch && matchFaction
    })
  }, [enemies, search, factionFilter])

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-4 py-3 space-y-2">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search enemies..."
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {factions.map(f => (
            <button
              key={f}
              onClick={() => setFactionFilter(f)}
              className={`shrink-0 px-3 py-1 text-xs font-mono uppercase rounded-sm min-h-[32px] whitespace-nowrap ${
                factionFilter === f ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {filtered.map(enemy => (
          <EnemyCard
            key={enemy.id}
            enemy={enemy}
            difficulty={difficulty}
            onClick={() => setSelected(enemy)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-600 font-mono text-sm">No enemies found.</div>
        )}
      </div>

      {selected && (
        <EnemyDetailModal
          enemy={selected}
          difficulty={difficulty}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function EnemyCard({ enemy, difficulty, onClick }: { enemy: Enemy; difficulty: Difficulty; onClick: () => void }) {
  const stats = enemy.difficultyStats[difficulty]
  return (
    <Card className="cursor-pointer hover:border-neutral-700 transition-colors" onClick={onClick}>
      <CardBody className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-100">{enemy.name}</span>
            {enemy.approx && <span className="text-amber-500 text-xs">~</span>}
            {enemy.isRuler && <Badge variant="red">RULER</Badge>}
          </div>
          <Badge variant={factionColors[enemy.faction] ?? 'gray'}>{enemy.faction}</Badge>
        </div>
        <div className="flex gap-4 mt-2 text-xs font-mono">
          <span className="text-neutral-400">
            HP: <span className="text-red-400 font-bold">{stats.hp}{stats.approx && '~'}</span>
          </span>
          {(stats.armor ?? 0) > 0 && (
            <span className="text-neutral-400">
              Armor: <span className="text-blue-400 font-bold">{stats.armor}{stats.approx && '~'}</span>
            </span>
          )}
          <span className="text-neutral-400">
            Mob: <span className="text-green-400 font-bold">{stats.mobility}{stats.approx && '~'}</span>
          </span>
        </div>
        <p className="text-xs text-neutral-600 font-mono mt-1.5 line-clamp-1">{enemy.description}</p>
      </CardBody>
    </Card>
  )
}

function EnemyDetailModal({ enemy, difficulty, onClose }: { enemy: Enemy; difficulty: Difficulty; onClose: () => void }) {
  const stats = enemy.difficultyStats[difficulty]
  const difficulties: Difficulty[] = ['rookie', 'veteran', 'commander', 'legend']

  return (
    <Modal title={enemy.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={factionColors[enemy.faction] ?? 'gray'}>{enemy.faction}</Badge>
          {enemy.isRuler && <Badge variant="red">ALIEN RULER</Badge>}
          {enemy.approx && <Badge variant="amber">~Approx Stats</Badge>}
        </div>

        <p className="text-sm text-neutral-400 font-mono leading-relaxed">{enemy.description}</p>

        <div>
          <div className="text-xs font-mono text-amber-600 uppercase tracking-wider mb-2">Stats — All Difficulties</div>
          <div className="grid grid-cols-4 gap-1">
            {difficulties.map(d => {
              const s = enemy.difficultyStats[d]
              return (
                <div key={d} className={`p-2 rounded-sm text-center text-xs font-mono ${d === difficulty ? 'bg-amber-950 border border-amber-700' : 'bg-neutral-800'}`}>
                  <div className="text-neutral-500 uppercase mb-1">{d.substring(0,3)}</div>
                  <div className="text-red-400 font-bold">{s.hp}{s.approx ? '~' : ''}</div>
                  <div className="text-neutral-500 text-[10px]">hp</div>
                  {(s.armor ?? 0) > 0 && <div className="text-blue-400">{s.armor}arm</div>}
                  <div className="text-green-400">{s.mobility}mob</div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-mono text-amber-600 uppercase tracking-wider mb-2">Abilities</div>
          <div className="space-y-2">
            {enemy.abilities.map((ability, i) => (
              <div key={i} className="p-3 bg-neutral-800 rounded-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm text-neutral-100">{ability.name}</span>
                  {ability.approx && <span className="text-amber-500 text-xs">~</span>}
                </div>
                <p className="text-xs text-neutral-500 font-mono mt-1">{ability.description}</p>
              </div>
            ))}
          </div>
        </div>

        {enemy.isRuler && enemy.rulerReactionNote && (
          <div className="p-3 bg-red-950 border border-red-800 rounded-sm">
            <div className="text-xs font-mono text-red-400 uppercase tracking-wider mb-1">⚠ Ruler Reaction Mechanic</div>
            <p className="text-xs text-red-300 font-mono leading-relaxed">{enemy.rulerReactionNote}</p>
          </div>
        )}

        <div className="p-3 bg-green-950 border border-green-800 rounded-sm">
          <div className="text-xs font-mono text-green-400 uppercase tracking-wider mb-1">◆ Counter Tip</div>
          <p className="text-xs text-green-300 font-mono leading-relaxed">{enemy.counterTip}</p>
        </div>
      </div>
    </Modal>
  )
}
