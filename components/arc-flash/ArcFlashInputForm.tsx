'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, RotateCcw } from 'lucide-react'
import type {
  ArcFlashInput,
  ElectrodeConfig,
  EnclosureDimensions,
  FieldError,
} from '@/types/arc-flash'

export const ELECTRODE_CONFIGS: { id: ElectrodeConfig; label: string; description: string }[] = [
  { id: 'VCB', label: 'VCB', description: 'Vertical conductors in a metal box (most switchgear, MCCs, panels)' },
  { id: 'VCBB', label: 'VCBB', description: 'Vertical conductors ending in an insulating barrier, in a box' },
  { id: 'HCB', label: 'HCB', description: 'Horizontal conductors in a metal box (e.g. some switchboards, busway)' },
  { id: 'VOA', label: 'VOA', description: 'Vertical conductors in open air' },
  { id: 'HOA', label: 'HOA', description: 'Horizontal conductors in open air' },
]

interface NumberFieldProps {
  id: string
  label: string
  unit: string
  value: number
  onChange: (value: number) => void
  error?: FieldError
  hint?: string
  step?: number
}

/** Numeric input with focus/blur local string state, so partial typing never fights the store. */
function NumberField({ id, label, unit, value, onChange, error, hint, step }: NumberFieldProps) {
  const [local, setLocal] = useState<string | null>(null)
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label} <span className="text-muted-foreground font-normal">({unit})</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step ?? 'any'}
        value={local !== null ? local : Number.isFinite(value) ? value : ''}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={error ? 'border-destructive' : undefined}
        onFocus={() => setLocal(Number.isFinite(value) ? String(value) : '')}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(local ?? '')
          onChange(Number.isNaN(parsed) ? Number.NaN : parsed)
          setLocal(null)
        }}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error.message} <span className="opacity-75">— {error.clause}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface ArcFlashInputFormProps {
  values: ArcFlashInput
  /** Enclosure kept in the store even for open-air configurations, so switching back restores it */
  enclosure: EnclosureDimensions
  errors: FieldError[]
  onFieldChange: <K extends keyof ArcFlashInput>(key: K, value: ArcFlashInput[K]) => void
  onEnclosureChange: (dim: keyof EnclosureDimensions, value: number) => void
  onElectrodeConfigChange: (config: ElectrodeConfig) => void
  onSameTimeForBothChange: (on: boolean) => void
  onCalculate: () => void
  onReset: () => void
  isCalculating?: boolean
  /** Optional extra controls rendered above the electrical inputs (e.g. equipment class, PPE method) */
  children?: React.ReactNode
}

export default function ArcFlashInputForm({
  values,
  enclosure,
  errors,
  onFieldChange,
  onEnclosureChange,
  onElectrodeConfigChange,
  onSameTimeForBothChange,
  onCalculate,
  onReset,
  isCalculating,
  children,
}: ArcFlashInputFormProps) {
  const err = (field: string) => errors.find((e) => e.field === field)
  const openAir = values.electrodeConfig === 'VOA' || values.electrodeConfig === 'HOA'
  const lv = values.voltageV <= 600
  const longTime = values.arcingTimeNominalMs > 2000 || values.arcingTimeReducedMs > 2000
  const configInfo = ELECTRODE_CONFIGS.find((c) => c.id === values.electrodeConfig)

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onCalculate()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="af-equipment-id">Equipment ID</Label>
          <Input
            id="af-equipment-id"
            maxLength={60}
            placeholder="e.g. SWGR-1A"
            value={values.equipmentId}
            onChange={(e) => onFieldChange('equipmentId', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="af-project">Project</Label>
          <Input
            id="af-project"
            maxLength={100}
            value={values.projectName}
            onChange={(e) => onFieldChange('projectName', e.target.value)}
          />
        </div>
      </div>

      {children}

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="text-sm font-semibold mb-2">System</legend>
        <NumberField
          id="af-voltage"
          label="System voltage (line-to-line)"
          unit="V"
          value={values.voltageV}
          onChange={(v) => onFieldChange('voltageV', v)}
          error={err('voltageV')}
          hint="208 V – 15 kV"
        />
        <NumberField
          id="af-ibf"
          label="Bolted fault current"
          unit="kA"
          value={values.boltedFaultKA}
          onChange={(v) => onFieldChange('boltedFaultKA', v)}
          error={err('boltedFaultKA')}
          hint={lv ? '0.5 – 106 kA for ≤ 600 V' : '0.2 – 65 kA above 600 V'}
        />
        <div className="space-y-1">
          <Label htmlFor="af-frequency">Frequency</Label>
          <Select
            value={String(values.frequencyHz)}
            onValueChange={(v) => onFieldChange('frequencyHz', Number(v) as 50 | 60)}
          >
            <SelectTrigger id="af-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">60 Hz</SelectItem>
              <SelectItem value="50">50 Hz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="text-sm font-semibold mb-2">Equipment geometry</legend>
        <div className="space-y-1">
          <Label htmlFor="af-config">Electrode configuration</Label>
          <Select value={values.electrodeConfig} onValueChange={(v) => onElectrodeConfigChange(v as ElectrodeConfig)}>
            <SelectTrigger id="af-config">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ELECTRODE_CONFIGS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label} — {c.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {configInfo && <p className="text-xs text-muted-foreground">{configInfo.description}</p>}
        </div>
        <NumberField
          id="af-gap"
          label="Gap between conductors"
          unit="mm"
          value={values.gapMm}
          onChange={(v) => onFieldChange('gapMm', v)}
          error={err('gapMm')}
          hint={lv ? '6.35 – 76.2 mm for ≤ 600 V' : '19.05 – 254 mm above 600 V'}
        />
        <NumberField
          id="af-wd"
          label="Working distance"
          unit="mm"
          value={values.workingDistanceMm}
          onChange={(v) => onFieldChange('workingDistanceMm', v)}
          error={err('workingDistanceMm')}
          hint="≥ 305 mm (12 in)"
        />
      </fieldset>

      {!openAir && (
        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="text-sm font-semibold mb-2">Enclosure (inside dimensions)</legend>
          <NumberField
            id="af-enc-h"
            label="Height"
            unit="mm"
            value={enclosure.heightMm}
            onChange={(v) => onEnclosureChange('heightMm', v)}
            error={err('enclosure.heightMm') ?? err('enclosure')}
          />
          <NumberField
            id="af-enc-w"
            label="Width"
            unit="mm"
            value={enclosure.widthMm}
            onChange={(v) => onEnclosureChange('widthMm', v)}
            error={err('enclosure.widthMm')}
          />
          <NumberField
            id="af-enc-d"
            label="Depth"
            unit="mm"
            value={enclosure.depthMm}
            onChange={(v) => onEnclosureChange('depthMm', v)}
            error={err('enclosure.depthMm')}
            hint="≤ 203.2 mm (8 in) counts as shallow below 600 V"
          />
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold mb-2">Protective device clearing time</legend>
        <p className="text-xs text-muted-foreground">
          IEEE 1584-2018 evaluates two arcing currents. Read the clearing time for each from the upstream
          device&apos;s time-current curve. At the lower (reduced) current an inverse-time device usually takes
          longer to clear, so its time is normally equal to or longer than the nominal one.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="af-t-nominal"
            label="Arcing time at nominal arcing current"
            unit="ms"
            value={values.arcingTimeNominalMs}
            onChange={(v) => onFieldChange('arcingTimeNominalMs', v)}
            error={err('arcingTimeNominalMs')}
          />
          {values.sameTimeForBoth ? (
            <div className="space-y-1">
              <Label>Arcing time at reduced arcing current (ms)</Label>
              <p className="h-9 flex items-center text-sm text-muted-foreground">
                Same as nominal ({values.arcingTimeNominalMs} ms)
              </p>
            </div>
          ) : (
            <NumberField
              id="af-t-reduced"
              label="Arcing time at reduced arcing current"
              unit="ms"
              value={values.arcingTimeReducedMs}
              onChange={(v) => onFieldChange('arcingTimeReducedMs', v)}
              error={err('arcingTimeReducedMs')}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={values.sameTimeForBoth}
              onCheckedChange={(c) => onSameTimeForBothChange(c === true)}
            />
            Use the same time for both cases
          </label>
          {longTime && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={values.applyTwoSecondCap}
                onCheckedChange={(c) => onFieldChange('applyTwoSecondCap', c === true)}
              />
              Cap arcing time at 2 s (only where a worker can reasonably move away)
            </label>
          )}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={isCalculating}>
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Calculating…' : 'Calculate'}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset
        </Button>
      </div>
    </form>
  )
}
