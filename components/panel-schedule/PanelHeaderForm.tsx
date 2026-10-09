'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CustomSystem, Panel } from '@/types/panel-schedule'
import type { PanelIssue } from '@/lib/validation/panelScheduleValidation'
import { IEC_SYSTEM_TYPES, NEC_SYSTEM_TYPES, SYSTEM_PRESETS } from '@/lib/calculations/panel-schedule/system'
import { OCCUPANCY_LABELS, SPACE_PRESETS } from '@/lib/calculations/panel-schedule/defaults'
import NumberField from './NumberField'

interface Props {
  panel: Panel
  errors: PanelIssue[]
  onFieldChange: <K extends keyof Panel>(key: K, value: Panel[K]) => void
}

const DEFAULT_CUSTOM: CustomSystem = { phases: 3, wires: 4, vLN: 240, vLL: 415 }

export default function PanelHeaderForm({ panel, errors, onFieldChange }: Props) {
  const err = (path: string) => errors.find((e) => e.path === path)?.message
  const systemTypes = panel.standard === 'NEC' ? NEC_SYSTEM_TYPES : IEC_SYSTEM_TYPES
  const custom = panel.customSystem ?? DEFAULT_CUSTOM
  const setCustom = (patch: Partial<CustomSystem>) => onFieldChange('customSystem', { ...custom, ...patch })
  const spaceOptions = SPACE_PRESETS.includes(panel.spaces as (typeof SPACE_PRESETS)[number])
    ? [...SPACE_PRESETS]
    : [...SPACE_PRESETS, panel.spaces].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="ps-name">Panel name / tag</Label>
          <Input id="ps-name" value={panel.name} maxLength={40} onChange={(e) => onFieldChange('name', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ps-location">Location</Label>
          <Input id="ps-location" value={panel.location} onChange={(e) => onFieldChange('location', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ps-fedfrom">Fed from</Label>
          <Input id="ps-fedfrom" value={panel.fedFrom} onChange={(e) => onFieldChange('fedFrom', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ps-mounting">Mounting</Label>
          <Select value={panel.mounting || 'Surface'} onValueChange={(v) => onFieldChange('mounting', v)}>
            <SelectTrigger id="ps-mounting"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Surface', 'Flush', 'Free-standing'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="ps-system">System</Label>
          <Select
            value={panel.systemType}
            onValueChange={(v) => {
              onFieldChange('systemType', v as Panel['systemType'])
              if (v === 'custom' && !panel.customSystem) onFieldChange('customSystem', DEFAULT_CUSTOM)
            }}
          >
            <SelectTrigger id="ps-system"><SelectValue /></SelectTrigger>
            <SelectContent>
              {systemTypes.map((id) => (
                <SelectItem key={id} value={id}>{id === 'custom' ? 'Custom voltage…' : SYSTEM_PRESETS[id].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ps-spaces">Spaces</Label>
          <Select value={String(panel.spaces)} onValueChange={(v) => onFieldChange('spaces', Number(v))}>
            <SelectTrigger id="ps-spaces"><SelectValue /></SelectTrigger>
            <SelectContent>
              {spaceOptions.map((n) => <SelectItem key={n} value={String(n)}>{n} spaces</SelectItem>)}
            </SelectContent>
          </Select>
          {err('spaces') && <p className="text-xs text-destructive">{err('spaces')}</p>}
        </div>
        <NumberField
          id="ps-imbalance" label="Imbalance target" unit="%" value={panel.imbalanceTargetPct}
          onChange={(v) => onFieldChange('imbalanceTargetPct', v ?? Number.NaN)} error={err('imbalanceTargetPct')}
        />
      </div>

      {panel.systemType === 'custom' && (
        <div className="grid gap-4 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="ps-c-phases">Phases</Label>
            <Select
              value={String(custom.phases)}
              onValueChange={(v) => setCustom({ phases: Number(v) as 1 | 3, wires: Number(v) === 3 ? 4 : 3 })}
            >
              <SelectTrigger id="ps-c-phases"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Three-phase</SelectItem>
                <SelectItem value="1">Single-phase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ps-c-wires">Wires</Label>
            <Select value={String(custom.wires)} onValueChange={(v) => setCustom({ wires: Number(v) as 2 | 3 | 4 })}>
              <SelectTrigger id="ps-c-wires"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(custom.phases === 3 ? [4, 3] : [3, 2]).map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w}-wire{custom.phases === 3 ? (w === 4 ? ' (wye + N)' : ' (delta, no N)') : w === 3 ? ' (split-phase)' : ' (L + N)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!(custom.phases === 3 && custom.wires === 3) && (
            <NumberField
              id="ps-c-vln" label="V line-neutral" unit="V" value={custom.vLN}
              onChange={(v) => setCustom({ vLN: v, ...(custom.phases === 1 && custom.wires === 2 && v ? { vLL: v } : {}) })}
              error={err('customSystem.vLN')}
            />
          )}
          {!(custom.phases === 1 && custom.wires === 2) && (
            <NumberField
              id="ps-c-vll" label="V line-line" unit="V" value={custom.vLL}
              onChange={(v) => setCustom({ vLL: v ?? Number.NaN })} error={err('customSystem.vLL')}
            />
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          id="ps-bus" label="Bus rating" unit="A" value={panel.busRatingA}
          onChange={(v) => onFieldChange('busRatingA', v ?? Number.NaN)} error={err('busRatingA')}
        />
        <div className="space-y-1">
          <Label htmlFor="ps-maintype">Main</Label>
          <Select value={panel.mainType} onValueChange={(v) => onFieldChange('mainType', v as Panel['mainType'])}>
            <SelectTrigger id="ps-maintype"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="main-breaker">Main breaker</SelectItem>
              <SelectItem value="mlo">Main lugs only (MLO)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {panel.mainType === 'main-breaker' && (
          <NumberField
            id="ps-main" label="Main rating" unit="A" value={panel.mainRatingA} nullable
            onChange={(v) => onFieldChange('mainRatingA', v)} error={err('mainRatingA')}
          />
        )}
        <NumberField
          id="ps-sccr" label="SCCR (informational)" unit="kA" value={panel.sccrKA} nullable
          onChange={(v) => onFieldChange('sccrKA', v)}
        />
      </div>

      {panel.standard === 'NEC' && (
        <div className="space-y-1 max-w-md">
          <Label htmlFor="ps-occupancy">Occupancy (general lighting demand, NEC Table 220.42)</Label>
          <Select value={panel.occupancy} onValueChange={(v) => onFieldChange('occupancy', v as Panel['occupancy'])}>
            <SelectTrigger id="ps-occupancy"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(OCCUPANCY_LABELS).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
