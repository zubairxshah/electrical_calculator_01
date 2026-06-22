/**
 * Battery Input Form — mode-aware (runtime/sizing), canonical chemistry,
 * datasheet pre-fill, and optional advanced overrides (US1–US4).
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
import { CANONICAL_CHEMISTRY_ORDER, chemistryDisplayLabel, toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import type { BatteryCalculatorInputs, FieldValidation } from '@/lib/types'
import type { ExtractionResult } from '@/lib/datasheets/datasheetExtract'
import { SlidersHorizontal, Check, X } from 'lucide-react'

export function BatteryInputForm() {
  const { inputs, setInputs, validation } = useBatteryStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
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

        {/* Chemistry */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            Battery Chemistry<span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={inputs.chemistry}
            onValueChange={(value) =>
              setInputs({ chemistry: value as BatteryCalculatorInputs['chemistry'], datasheetId: null })
            }
          >
            <SelectTrigger className="h-12">
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
          {profile && (
            <p className="text-xs text-muted-foreground">
              Defaults from datasheet: {profile.depthOfDischarge.recommended}% DoD ·{' '}
              {profile.efficiency.roundTrip.typical}% round-trip · Peukert {profile.peukertExponent}
            </p>
          )}
        </div>
      </div>

      {/* Sizing-only bank configuration (derating factors are edited in the
          Applied Factors results card). */}
      {inputs.mode === 'sizing' && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 px-0 text-muted-foreground"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showAdvanced ? 'Hide' : 'Show'} bank configuration
          </Button>
          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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
