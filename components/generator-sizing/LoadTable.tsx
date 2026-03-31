'use client'

import { useState } from 'react'
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

export default function LoadTable() {
  const { loads, addLoad, updateLoad, removeLoad, generatorConfig } = useGeneratorSizingStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAddLoad = () => {
    const load = createDefaultLoad()
    addLoad(load)
    setEditingId(load.id)
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

  const handlePowerUnitChange = (id: string, unit: PowerUnit, currentPower: number) => {
    // Convert the displayed value
    if (unit === 'HP') {
      // User is switching TO HP display — store value stays in kW
      updateLoad(id, { powerInputUnit: 'HP' })
    } else {
      updateLoad(id, { powerInputUnit: 'kW' })
    }
  }

  const handlePowerChange = (id: string, value: number, unit: PowerUnit) => {
    // Always store in kW internally
    const kw = unit === 'HP' ? hpToKw(value) : value
    updateLoad(id, { ratedPower: kw })
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_0.7fr_0.5fr_0.5fr_0.3fr] gap-2 text-xs font-medium text-muted-foreground px-1">
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
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_0.7fr_0.5fr_0.5fr_0.3fr] gap-2 items-end">
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
            <div className="flex gap-1">
              <Input
                type="number"
                min={0}
                step={0.1}
                value={load.powerInputUnit === 'HP' ? +(load.ratedPower / 0.7457).toFixed(2) : load.ratedPower}
                onChange={(e) => handlePowerChange(load.id, Number(e.target.value), load.powerInputUnit)}
                className="flex-1"
              />
              <Select
                value={load.powerInputUnit}
                onValueChange={(v) => handlePowerUnitChange(load.id, v as PowerUnit, load.ratedPower)}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kW">kW</SelectItem>
                  <SelectItem value="HP">HP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              min={0.01}
              max={1}
              step={0.01}
              value={load.powerFactor}
              onChange={(e) => updateLoad(load.id, { powerFactor: Number(e.target.value) })}
            />
            <Input
              type="number"
              min={1}
              value={load.quantity}
              onChange={(e) => updateLoad(load.id, { quantity: Number(e.target.value) })}
            />
            <Input
              type="number"
              min={0.01}
              max={1}
              step={0.01}
              value={load.diversityFactor}
              onChange={(e) => updateLoad(load.id, { diversityFactor: Number(e.target.value) })}
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
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={load.motorHp ?? ''}
                  placeholder="HP"
                  onChange={(e) => updateLoad(load.id, { motorHp: e.target.value ? Number(e.target.value) : null })}
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
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={load.iecLockedRotorRatio ?? ''}
                    placeholder="e.g. 6.0"
                    onChange={(e) => updateLoad(load.id, { iecLockedRotorRatio: e.target.value ? Number(e.target.value) : null })}
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
                  <Input
                    type="number"
                    min={0.02}
                    max={0.50}
                    step={0.01}
                    value={load.vfdMultiplier ?? 0.30}
                    onChange={(e) => updateLoad(load.id, { vfdMultiplier: Number(e.target.value) })}
                  />
                </div>
              )}
              {load.startingMethod === 'soft-starter' && (
                <div className="space-y-1">
                  <Label className="text-xs">Soft Starter Multiplier (0.30–0.70)</Label>
                  <Input
                    type="number"
                    min={0.30}
                    max={0.70}
                    step={0.01}
                    value={load.softStarterMultiplier ?? 0.50}
                    onChange={(e) => updateLoad(load.id, { softStarterMultiplier: Number(e.target.value) })}
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
