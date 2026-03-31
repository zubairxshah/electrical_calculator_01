'use client'

import { useState, useCallback } from 'react'
import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { hpToKw, STARTING_METHOD_LABELS, LOAD_TYPE_LABELS } from '@/lib/calculations/generator-sizing/generatorData'
import type {
  LoadItem,
  LoadType,
  StartingMethod,
  NemaCodeLetter,
  PowerUnit,
} from '@/types/generator-sizing'

const NEMA_LETTERS: NemaCodeLetter[] = [
  'A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','U','V'
]

function createDefaultLoad(): LoadItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: 'resistive',
    ratedPower: 0,
    powerInputUnit: 'kW',
    isKva: false,
    powerFactor: 0.85,
    quantity: 1,
    diversityFactor: 1.0,
    stepNumber: null,
    isMotor: false,
    motorHp: null,
    nemaCodeLetter: null,
    iecLockedRotorRatio: null,
    startingMethod: 'dol',
    vfdMultiplier: null,
    softStarterMultiplier: null,
  }
}

/**
 * Numeric input that allows clearing the field (no stuck-on-zero problem).
 * Stores local string state while focused, commits number on blur.
 */
function NumericInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState<string | null>(null)
  const isFocused = localValue !== null

  const handleFocus = () => {
    setLocalValue(value === 0 ? '' : String(value))
  }

  const handleBlur = () => {
    const parsed = parseFloat(localValue ?? '')
    if (!isNaN(parsed)) {
      const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed))
      onChange(clamped)
    }
    setLocalValue(null)
  }

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={className}
      value={isFocused ? localValue! : value}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => {
        if (isFocused) {
          setLocalValue(e.target.value)
        } else {
          onChange(Number(e.target.value))
        }
      }}
    />
  )
}

/** Nullable numeric input for optional fields like Motor HP, IEC ratio */
function NullableNumericInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  value: number | null
  onChange: (v: number | null) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  const [localValue, setLocalValue] = useState<string | null>(null)
  const isFocused = localValue !== null

  const handleFocus = () => {
    setLocalValue(value === null ? '' : String(value))
  }

  const handleBlur = () => {
    if (!localValue || localValue.trim() === '') {
      onChange(null)
    } else {
      const parsed = parseFloat(localValue)
      if (!isNaN(parsed)) {
        onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed)))
      }
    }
    setLocalValue(null)
  }

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={isFocused ? localValue! : (value ?? '')}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => {
        if (isFocused) {
          setLocalValue(e.target.value)
        } else {
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      }}
    />
  )
}

export default function LoadTable() {
  const { loads, addLoad, updateLoad, removeLoad, generatorConfig } = useGeneratorSizingStore()

  const handleAddLoad = () => {
    const load = createDefaultLoad()
    addLoad(load)
  }

  const handleTypeChange = (id: string, type: LoadType) => {
    const isMotor = type === 'motor'
    updateLoad(id, {
      type,
      isMotor,
      powerFactor: isMotor ? 0.85 : type === 'resistive' ? 1.0 : type === 'lighting' ? 0.95 : 0.85,
      startingMethod: isMotor ? 'dol' : 'dol',
    })
  }

  const handlePowerChange = (id: string, value: number, unit: PowerUnit) => {
    const kw = unit === 'HP' ? hpToKw(value) : value
    updateLoad(id, { ratedPower: kw })
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="hidden md:grid md:grid-cols-[2fr_1.2fr_1.8fr_0.8fr_0.6fr_0.6fr_0.3fr] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Name</span>
        <span>Type</span>
        <span>Power</span>
        <span>PF</span>
        <span>Qty</span>
        <span>Div.</span>
        <span></span>
      </div>

      {loads.map((load) => (
        <div key={load.id} className="space-y-2 border rounded-lg p-3">
          {/* Main row */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1.8fr_0.8fr_0.6fr_0.6fr_0.3fr] gap-2 items-end">
            <Input
              placeholder="Load name"
              value={load.name}
              onChange={(e) => updateLoad(load.id, { name: e.target.value })}
            />
            <Select
              value={load.type}
              onValueChange={(v) => handleTypeChange(load.id, v as LoadType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOAD_TYPE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 min-w-0">
              <NumericInput
                min={0}
                step={0.1}
                value={load.powerInputUnit === 'HP' ? +(load.ratedPower / 0.7457).toFixed(2) : load.ratedPower}
                onChange={(v) => handlePowerChange(load.id, v, load.powerInputUnit)}
                placeholder="Power"
                className="min-w-0 flex-1"
              />
              <Select
                value={load.powerInputUnit}
                onValueChange={(v) => updateLoad(load.id, { powerInputUnit: v as PowerUnit })}
              >
                <SelectTrigger className="w-[65px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kW">kW</SelectItem>
                  <SelectItem value="HP">HP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumericInput
              min={0.01}
              max={1}
              step={0.01}
              value={load.powerFactor}
              onChange={(v) => updateLoad(load.id, { powerFactor: v })}
            />
            <NumericInput
              min={1}
              step={1}
              value={load.quantity}
              onChange={(v) => updateLoad(load.id, { quantity: Math.max(1, Math.round(v)) })}
            />
            <NumericInput
              min={0.01}
              max={1}
              step={0.01}
              value={load.diversityFactor}
              onChange={(v) => updateLoad(load.id, { diversityFactor: v })}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeLoad(load.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Motor-specific fields */}
          {load.isMotor && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-2 border-l-2 border-yellow-400 ml-1">
              <div className="space-y-1">
                <Label className="text-xs">Motor HP</Label>
                <NullableNumericInput
                  min={0}
                  step={0.5}
                  value={load.motorHp}
                  placeholder="HP"
                  onChange={(v) => updateLoad(load.id, { motorHp: v })}
                />
              </div>
              {generatorConfig.frequency === 60 ? (
                <div className="space-y-1">
                  <Label className="text-xs">NEMA Code Letter</Label>
                  <Select
                    value={load.nemaCodeLetter ?? 'none'}
                    onValueChange={(v) => updateLoad(load.id, { nemaCodeLetter: v === 'none' ? null : v as NemaCodeLetter })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {NEMA_LETTERS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">IEC LR Ratio (kVA/kW)</Label>
                  <NullableNumericInput
                    min={0}
                    step={0.1}
                    value={load.iecLockedRotorRatio}
                    placeholder="e.g. 6.0"
                    onChange={(v) => updateLoad(load.id, { iecLockedRotorRatio: v })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Starting Method</Label>
                <Select
                  value={load.startingMethod}
                  onValueChange={(v) => updateLoad(load.id, { startingMethod: v as StartingMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STARTING_METHOD_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {load.startingMethod === 'vfd' && (
                <div className="space-y-1">
                  <Label className="text-xs">VFD Multiplier (0.02–0.50)</Label>
                  <NumericInput
                    min={0.02}
                    max={0.50}
                    step={0.01}
                    value={load.vfdMultiplier ?? 0.30}
                    onChange={(v) => updateLoad(load.id, { vfdMultiplier: v })}
                  />
                </div>
              )}
              {load.startingMethod === 'soft-starter' && (
                <div className="space-y-1">
                  <Label className="text-xs">Soft Starter Multiplier (0.30–0.70)</Label>
                  <NumericInput
                    min={0.30}
                    max={0.70}
                    step={0.01}
                    value={load.softStarterMultiplier ?? 0.50}
                    onChange={(v) => updateLoad(load.id, { softStarterMultiplier: v })}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" onClick={handleAddLoad} className="w-full">
        <Plus className="h-4 w-4 mr-1" />
        Add Load
      </Button>
    </div>
  )
}
