/**
 * Battery Input Form — mode-aware (runtime/sizing), canonical chemistry,
 * datasheet pre-fill, and optional advanced overrides (011 US1–US4).
 * 015: application (standby/cycling), load type, design margin, voltage
 * window + end voltage, charger and battery-room inputs.
 */

'use client'

import { useState } from 'react'
import { useBatteryStore } from '@/stores/useBatteryStore'
import { InputField } from '@/components/shared/InputField'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DatasheetPicker } from './DatasheetPicker'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { getElectricalProfile } from '@/lib/standards/batteryReference'
import { CANONICAL_CHEMISTRY_ORDER, chemistryDisplayLabel, toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import type { BatteryCalculatorInputs, FieldValidation } from '@/lib/types'
import type { ExtractionResult } from '@/lib/datasheets/datasheetExtract'
import { SlidersHorizontal, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Accessible segmented choice (radiogroup) — arrow keys move between options. */
function ChoiceGroup<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  hint,
}: {
  id: string
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
  hint?: string
}) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value)
    const next = options[(i + dir + options.length) % options.length]
    onChange(next.value)
    document.getElementById(`${id}-${next.value}`)?.focus()
  }
  return (
    <div className="space-y-2">
      <div id={`${id}-label`} className="text-sm font-medium">
        {label}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault()
            move(1)
          }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault()
            move(-1)
          }
        }}
      >
        {options.map((o) => {
          const checked = o.value === value
          return (
            <button
              key={o.value}
              id={`${id}-${o.value}`}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={cn(
                'h-10 rounded-md px-3 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                checked ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Collapsible section toggle with aria-expanded/controls. */
function SectionToggle({
  open,
  controls,
  label,
  onToggle,
}: {
  open: boolean
  controls: string
  label: string
  onToggle: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 px-0 text-muted-foreground"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      {open ? 'Hide' : 'Show'} {label}
    </Button>
  )
}

export function BatteryInputForm() {
  const { inputs, setInputs, validation } = useBatteryStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showWindow, setShowWindow] = useState(false)
  const [showCharger, setShowCharger] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)

  // US6: read a datasheet via OCR, then REQUIRE confirmation before applying (C6).
  const handleUpload = async (file: File) => {
    setUploading(true)
    setExtraction(null)
    try {
      const { extractFromFile } = await import('@/lib/datasheets/datasheetExtract')
      setExtraction(await extractFromFile(file))
    } finally {
      setUploading(false)
    }
  }

  const applyExtraction = () => {
    if (!extraction) return
    const f = extraction.fields
    setInputs({
      ...(f.chemistry ? { chemistry: f.chemistry } : {}),
      ...(f.nameplateAh != null ? { unitCapacityAh: f.nameplateAh, ampHours: f.nameplateAh } : {}),
      ...(f.nominalVoltage != null ? { cellBlockVoltage: f.nominalVoltage } : {}),
      datasheetId: null,
    })
    setExtraction(null)
  }

  const profile = getBatteryTypeById(toCanonicalChemistry(String(inputs.chemistry)))

  const getFieldValidation = (field: string): FieldValidation | undefined => {
    if (!validation) return undefined
    const error = validation.errors.find((e) => e.field === field)
    const warning = validation.warnings.find((w) => w.field === field)
    const result = error || warning
    if (!result) return undefined
    return { ...result, isValid: !error }
  }

  const num = (v: number | undefined) => (v == null ? '' : v)
  const optional = (v: string) => (v === '' ? undefined : Number(v))
  const electrical = profile ? getElectricalProfile(profile.id) : undefined
  const application = inputs.application ?? 'standby'
  const loadType = inputs.loadType ?? 'ac'

  return (
    <div className="space-y-5">
      {/* Datasheet pre-fill */}
      <DatasheetPicker
        value={inputs.datasheetId}
        uploading={uploading}
        onUpload={handleUpload}
        onSelect={(entry) =>
          entry
            ? setInputs({
                datasheetId: entry.id,
                chemistry: entry.chemistry,
                cellBlockVoltage: entry.nominalVoltage,
                unitCapacityAh: entry.nameplateAh,
              })
            : setInputs({ datasheetId: null })
        }
      />

      {/* OCR confirmation panel (US6) — detected values require explicit confirmation */}
      {extraction && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
          <div className="mb-2 font-medium">
            Detected from datasheet{' '}
            <span className="text-muted-foreground">({(extraction.confidence * 100).toFixed(0)}% confidence)</span>
          </div>
          {Object.keys(extraction.fields).length === 0 ? (
            <p className="text-muted-foreground">Nothing reliable detected — enter values manually.</p>
          ) : (
            <ul className="mb-3 space-y-0.5 text-muted-foreground">
              {extraction.fields.chemistry && <li>Chemistry: {chemistryDisplayLabel[extraction.fields.chemistry]}</li>}
              {extraction.fields.nominalVoltage != null && <li>Nominal voltage: {extraction.fields.nominalVoltage} V</li>}
              {extraction.fields.nameplateAh != null && <li>Capacity: {extraction.fields.nameplateAh} Ah</li>}
              {extraction.fields.ratedAtCRate && <li>Rated at: {extraction.fields.ratedAtCRate}</li>}
            </ul>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={applyExtraction} disabled={Object.keys(extraction.fields).length === 0}>
              <Check className="h-3.5 w-3.5" /> Apply
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setExtraction(null)}>
              <X className="h-3.5 w-3.5" /> Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Application + load type (015, ADR-008) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChoiceGroup
          id="battery-application"
          label="Application"
          value={application}
          options={[
            { value: 'standby', label: 'Standby / float' },
            { value: 'cycling', label: 'Cycling' },
          ]}
          onChange={(v) => setInputs({ application: v })}
          hint={
            application === 'standby'
              ? 'UPS / DC backup — IEEE 485: full discharge to end voltage.'
              : 'Daily cycling — chemistry DoD limit applied (IEEE 1013 / 1561).'
          }
        />
        <ChoiceGroup
          id="battery-load-type"
          label="Load type"
          value={loadType}
          options={[
            { value: 'ac', label: 'AC via inverter' },
            { value: 'dc', label: 'DC load' },
          ]}
          onChange={(v) => setInputs({ loadType: v })}
          hint={loadType === 'ac' ? 'Conversion efficiency default 95%.' : 'No conversion loss (100%).'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
        {/* System voltage + load (both modes) */}
        <InputField
          label="System Voltage"
          value={num(inputs.voltage)}
          onChange={(v) => setInputs({ voltage: Number(v) })}
          unit="V"
          placeholder="48"
          validation={getFieldValidation('voltage')}
          required
        />
        <InputField
          label="Load Power"
          value={num(inputs.loadWatts)}
          onChange={(v) => setInputs({ loadWatts: Number(v) })}
          unit="W"
          placeholder="2000"
          validation={getFieldValidation('loadWatts')}
          required
        />

        {/* Mode-specific field */}
        {inputs.mode === 'runtime' ? (
          <InputField
            label="Installed Capacity"
            value={num(inputs.ampHours)}
            onChange={(v) => setInputs({ ampHours: Number(v) })}
            unit="Ah"
            placeholder="200"
            validation={getFieldValidation('ampHours')}
            required
          />
        ) : (
          <InputField
            label="Target Backup Time"
            value={num(inputs.targetBackupHours)}
            onChange={(v) => setInputs({ targetBackupHours: Number(v) })}
            unit="h"
            placeholder="4"
            validation={getFieldValidation('targetBackupHours')}
            required
          />
        )}

        {/* Operating temperature */}
        <InputField
          label="Operating Temperature"
          value={num(inputs.temperature)}
          onChange={(v) => setInputs({ temperature: Number(v) })}
          unit="°C"
          placeholder="25"
          validation={getFieldValidation('temperature')}
        />

        {/* Design margin (015) */}
        <InputField
          label="Design margin"
          value={num(inputs.designMargin)}
          onChange={(v) => setInputs({ designMargin: optional(v) })}
          unit="×"
          placeholder="1.10"
          validation={getFieldValidation('designMargin')}
        />

        {/* Chemistry */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="battery-chemistry">
            Battery Chemistry<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={inputs.chemistry}
            onValueChange={(value) =>
              setInputs({ chemistry: value as BatteryCalculatorInputs['chemistry'], datasheetId: null })
            }
          >
            <SelectTrigger id="battery-chemistry" className="h-12" aria-describedby="battery-chemistry-hint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANONICAL_CHEMISTRY_ORDER.map((id) => (
                <SelectItem key={id} value={id}>
                  {chemistryDisplayLabel[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {profile && electrical && (
            <p id="battery-chemistry-hint" className="text-xs text-muted-foreground">
              Defaults: end {electrical.endVoltagePerCell} V/cell · float {electrical.floatVoltagePerCell} V/cell ·{' '}
              {application === 'cycling' ? `${profile.depthOfDischarge.recommended}% DoD · ` : ''}Peukert{' '}
              {profile.peukertExponent}
            </p>
          )}
        </div>
      </div>

      {/* Voltage window & end voltage (015 US2) */}
      <div>
        <SectionToggle
          open={showWindow}
          controls="battery-voltage-window"
          label="voltage window & end voltage"
          onToggle={() => setShowWindow((s) => !s)}
        />
        {showWindow && (
          <div id="battery-voltage-window" className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
            <InputField
              label="Min load voltage"
              value={num(inputs.minLoadVoltage)}
              onChange={(v) => setInputs({ minLoadVoltage: optional(v) })}
              unit="V"
              placeholder="e.g. 42"
              validation={getFieldValidation('minLoadVoltage')}
            />
            <InputField
              label="Max load voltage"
              value={num(inputs.maxLoadVoltage)}
              onChange={(v) => setInputs({ maxLoadVoltage: optional(v) })}
              unit="V"
              placeholder="e.g. 56"
              validation={getFieldValidation('maxLoadVoltage')}
            />
            <InputField
              label="End voltage per cell"
              value={num(inputs.endVoltagePerCell)}
              onChange={(v) => setInputs({ endVoltagePerCell: optional(v) })}
              unit="V/cell"
              placeholder={electrical ? String(electrical.endVoltagePerCell) : ''}
              validation={getFieldValidation('endVoltagePerCell')}
            />
          </div>
        )}
      </div>

      {/* Charger & battery room (015 US4/US5) */}
      <div>
        <SectionToggle
          open={showCharger}
          controls="battery-charger-room"
          label="charger & battery room"
          onToggle={() => setShowCharger((s) => !s)}
        />
        {showCharger && (
          <div id="battery-charger-room" className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Recharge time"
              value={num(inputs.rechargeHours)}
              onChange={(v) => setInputs({ rechargeHours: optional(v) })}
              unit="h"
              placeholder="8"
              validation={getFieldValidation('rechargeHours')}
            />
            <InputField
              label="Standing DC load"
              value={num(inputs.standingLoadAmps)}
              onChange={(v) => setInputs({ standingLoadAmps: optional(v) })}
              unit="A"
              placeholder="0"
              validation={getFieldValidation('standingLoadAmps')}
            />
            <InputField
              label="Recharge factor"
              value={num(inputs.rechargeFactor)}
              onChange={(v) => setInputs({ rechargeFactor: optional(v) })}
              unit="×"
              placeholder={electrical ? electrical.rechargeFactor.toFixed(2) : ''}
              validation={getFieldValidation('rechargeFactor')}
            />
            <InputField
              label="Battery room volume"
              value={num(inputs.roomVolumeM3)}
              onChange={(v) => setInputs({ roomVolumeM3: optional(v) })}
              unit="m³"
              placeholder="optional"
              validation={getFieldValidation('roomVolumeM3')}
            />
          </div>
        )}
      </div>

      {/* Sizing-only bank configuration (derating factors are edited in the
          Applied Factors results card). */}
      {inputs.mode === 'sizing' && (
        <div>
          <SectionToggle
            open={showAdvanced}
            controls="battery-bank-config"
            label="bank configuration"
            onToggle={() => setShowAdvanced((s) => !s)}
          />
          {showAdvanced && (
            <div id="battery-bank-config" className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Cell/block voltage"
                value={num(inputs.cellBlockVoltage)}
                onChange={(v) => setInputs({ cellBlockVoltage: v === '' ? undefined : Number(v) })}
                unit="V"
                placeholder="12"
              />
              <InputField
                label="Unit capacity (per string)"
                value={num(inputs.unitCapacityAh)}
                onChange={(v) => setInputs({ unitCapacityAh: v === '' ? undefined : Number(v) })}
                unit="Ah"
                placeholder="100"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
