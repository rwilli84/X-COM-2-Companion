import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { Difficulty, DlcConfig } from '../data/types'

export function Settings() {
  const { activeCampaign, updateCampaign, exportCampaign, importCampaign } = useCampaignStore()
  const campaign = activeCampaign()
  const [exportData, setExportData] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)

  if (!campaign) {
    return <div className="flex items-center justify-center h-64 text-neutral-600 font-mono text-sm">No active campaign.</div>
  }

  const setDifficulty = (d: Difficulty) => updateCampaign(campaign.id, { difficulty: d })

  const toggleDlc = (key: keyof DlcConfig) => {
    const next = { ...campaign.dlc, [key]: !campaign.dlc[key] }
    if (key === 'wotc' && !next.wotc) next.tacticalLegacyPack = false
    updateCampaign(campaign.id, { dlc: next })
  }

  const handleExport = async () => {
    const data = await exportCampaign(campaign.id)
    setExportData(data)
  }

  const handleImport = async () => {
    try {
      setImportError('')
      await importCampaign(importText)
      setImportSuccess(true)
      setImporting(false)
      setImportText('')
    } catch {
      setImportError('Invalid JSON. Check your backup file.')
    }
  }

  const difficulties: Difficulty[] = ['rookie', 'veteran', 'commander', 'legend']

  return (
    <div className="px-4 py-4 space-y-4 pb-8">
      <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">
        Campaign: <span className="text-amber-400">{campaign.name}</span>
      </div>

      {/* Difficulty */}
      <Card>
        <CardHeader>
          <span className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest">Difficulty</span>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-2">
            {difficulties.map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`py-3 px-3 font-mono text-sm uppercase font-bold border rounded-sm transition-colors ${
                  campaign.difficulty === d ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600 font-mono mt-2">
            Changing difficulty updates displayed enemy stats and research times throughout the app.
          </p>
        </CardBody>
      </Card>

      {/* DLC Toggles */}
      <Card>
        <CardHeader>
          <span className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest">DLC Content</span>
        </CardHeader>
        <CardBody className="space-y-3">
          {[
            { key: 'wotc' as const, label: 'War of the Chosen', desc: 'Faction heroes, Chosen enemies, covert actions, bonds, fatigue system' },
            { key: 'alienHunters' as const, label: 'Alien Hunters', desc: 'Alien Rulers with reaction mechanics, experimental weapons' },
            { key: 'shensLastGift' as const, label: "Shen's Last Gift", desc: 'SPARK robotic soldier class' },
            { key: 'tacticalLegacyPack' as const, label: 'Tactical Legacy Pack', desc: 'WotC only — bonus story missions and cosmetics', wotcOnly: true },
          ].map(({ key, label, desc, wotcOnly }) => {
            const disabled = (wotcOnly && !campaign.dlc.wotc) ?? false
            const active = campaign.dlc[key]
            return (
              <label key={key} className={`flex items-start gap-3 p-3 border rounded-sm transition-colors ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              } ${active && !disabled ? 'border-amber-700 bg-amber-950/20' : 'border-neutral-800'}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 accent-amber-500"
                  checked={active}
                  disabled={disabled}
                  onChange={() => !disabled && toggleDlc(key)}
                />
                <div>
                  <div className="font-mono text-sm font-bold text-neutral-200">{label}</div>
                  <div className="font-mono text-xs text-neutral-600">{desc}</div>
                  {wotcOnly && <div className="font-mono text-[10px] text-amber-700 mt-0.5">Requires War of the Chosen</div>}
                </div>
              </label>
            )
          })}
          <p className="text-xs text-neutral-600 font-mono">
            Toggling DLC instantly filters all content — enemies, classes, research, dark events — everywhere in the app.
          </p>
        </CardBody>
      </Card>

      {/* Export / Import */}
      <Card>
        <CardHeader>
          <span className="font-mono font-bold text-amber-400 text-sm uppercase tracking-widest">Backup / Restore</span>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-xs text-neutral-500 font-mono">
            Export your full campaign to JSON for backup. Import a JSON backup to restore a campaign.
          </p>

          <Button variant="secondary" className="w-full" onClick={handleExport}>
            Export Campaign JSON
          </Button>

          {exportData && (
            <div>
              <div className="text-xs font-mono text-neutral-500 mb-1">Copy this JSON:</div>
              <textarea
                readOnly
                value={exportData}
                rows={6}
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-xs rounded-sm px-3 py-2 resize-none"
                onFocus={e => e.target.select()}
              />
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(exportData) }}>
                Copy to Clipboard
              </Button>
            </div>
          )}

          {!importing ? (
            <Button variant="secondary" className="w-full" onClick={() => setImporting(true)}>
              Import Campaign JSON
            </Button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={6}
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-xs rounded-sm px-3 py-2 resize-none"
                placeholder="Paste exported campaign JSON here..."
              />
              {importError && <p className="text-xs text-red-400 font-mono">{importError}</p>}
              {importSuccess && <p className="text-xs text-green-400 font-mono">Campaign imported successfully.</p>}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setImporting(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1" onClick={handleImport}>Import</Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="text-center text-xs text-neutral-700 font-mono pt-2">
        Resistance HQ v1.0 · All data stored locally · No accounts
      </div>
    </div>
  )
}
