'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RotateCcw, Plus, Trash2, Calculator } from 'lucide-react'
import {
  CONDUIT_TYPES,
  INSULATION_TYPES,
  WIRE_SIZES,
  getAvailableTradeSizes,
  hasCompactData,
} from '@/lib/calculations/conduit-fill/conduitFillData'
import type {
  ConduitTypeId,
  InsulationTypeId,
  UnitSystem,
  ConductorEntry,
} from '@/types/conduit-fill'

interface Props {
  conduitType: ConduitTypeId
  tradeSize: string
  conductors: ConductorEntry[]
  isNipple: boolean
  unitSystem: UnitSystem
  projectName: string
  projectRef: string
  onConduitTypeChange: (v: ConduitTypeId) => void
  onTradeSizeChange: (v: string) => void
  onAddConductor: (entry: Omit<ConductorEntry, 'id' | 'areaSqIn'>) => void
  onUpdateConductor: (id: string, updates: Partial<ConductorEntry>) => void
  onRemoveConductor: (id: string) => void
  onNippleChange: (v: boolean) => void
  onUnitSystemChange: (v: UnitSystem) => void
  onProjectNameChange: (v: string) => void
  onProjectRefChange: (v: string) => void
  onCalculate: () => void
  onReset: () => void
}

const SQ_IN_TO_MM2 = 645.16

export default function ConduitFillInputForm({
  conduitType,
  tradeSize,
  conductors,
  isNipple,
  unitSystem,
  projectName,
  projectRef,
  onConduitTypeChange,
  onTradeSizeChange,
  onAddConductor,
  onUpdateConductor,
  onRemoveConductor,
  onNippleChange,
  onUnitSystemChange,
  onProjectNameChange,
  onProjectRefChange,
  onCalculate,
  onReset,
}: Props) {
  const tradeSizes = getAvailableTradeSizes(conduitType)

  // New conductor entry state
  const [newWireSize, setNewWireSize] = useState('12')
  const [newInsulation, setNewInsulation] = useState<InsulationTypeId>('THHN')
  const [newQtyStr, setNewQtyStr] = useState('3')
  const [newIsCompact, setNewIsCompact] = useState(false)

  const handleAddConductor = () => {
    const qty = parseInt(newQtyStr, 10)
    if (isNaN(qty) || qty < 1) return
    onAddConductor({
      wireSize: newWireSize,
      insulationType: newInsulation,
      quantity: qty,
      isCompact: newIsCompact,
    })
  }

  const formatArea = (areaSqIn: number) => {
    if (unitSystem === 'metric') {
      return `${(areaSqIn * SQ_IN_TO_MM2).toFixed(1)} mm²`
    }
    return `${areaSqIn.toFixed(4)} in²`
  }

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="projectRef">Reference</Label>
          <Input
            id="projectRef"
            value={projectRef}
            onChange={(e) => onProjectRefChange(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Conduit Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Conduit Type</Label>
          <Select value={conduitType} onValueChange={(v) => onConduitTypeChange(v as ConduitTypeId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDUIT_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Trade Size</Label>
          <Select value={tradeSize} onValueChange={onTradeSizeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tradeSizes.map((s) => (
                <SelectItem key={s.imperial} value={s.imperial}>
                  {s.imperial}&quot; (Metric {s.metric}) — {formatArea(s.internalAreaSqIn)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Options Row */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="nipple"
            checked={isNipple}
            onCheckedChange={onNippleChange}
          />
          <Label htmlFor="nipple" className="cursor-pointer">
            Conduit Nipple (≤ 24&quot;/600mm — 60% fill)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="units"
            checked={unitSystem === 'metric'}
            onCheckedChange={(v) => onUnitSystemChange(v ? 'metric' : 'imperial')}
          />
          <Label htmlFor="units" className="cursor-pointer">
            {unitSystem === 'metric' ? 'Metric (mm²)' : 'Imperial (in²)'}
          </Label>
        </div>
      </div>

      {/* Conductor List */}
      <div>
        <Label className="text-base font-semibold">Conductors</Label>

        {conductors.length > 0 && (
          <div className="mt-2 space-y-2">
            {conductors.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                  <Select
                    value={c.wireSize}
                    onValueChange={(v) => onUpdateConductor(c.id, { wireSize: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WIRE_SIZES.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={c.insulationType}
                    onValueChange={(v) => onUpdateConductor(c.id, { insulationType: v as InsulationTypeId })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSULATION_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <QuantityInput
                    value={c.quantity}
                    onChange={(v) => onUpdateConductor(c.id, { quantity: v })}
                  />

                  <span className="text-xs text-muted-foreground self-center">
                    {formatArea(c.areaSqIn)}/ea
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onRemoveConductor(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Conductor Row */}
        <div className="mt-3 flex items-end gap-2 p-3 border rounded-md border-dashed">
          <div className="flex-1 grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Wire Size</Label>
              <Select value={newWireSize} onValueChange={setNewWireSize}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIRE_SIZES.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Insulation</Label>
              <Select value={newInsulation} onValueChange={(v) => setNewInsulation(v as InsulationTypeId)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSULATION_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input
                className="h-8"
                value={newQtyStr}
                onFocus={(e) => { if (e.target.value === '0') setNewQtyStr('') }}
                onBlur={() => { if (newQtyStr === '') setNewQtyStr('1') }}
                onChange={(e) => setNewQtyStr(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              {hasCompactData(newInsulation, newWireSize) && (
                <div className="flex items-center gap-1 mb-1">
                  <Switch
                    id="compact-new"
                    checked={newIsCompact}
                    onCheckedChange={setNewIsCompact}
                    className="h-4 w-7"
                  />
                  <Label htmlFor="compact-new" className="text-xs cursor-pointer">Compact</Label>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddConductor}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onCalculate}
          disabled={conductors.length === 0}
          className="flex-1"
        >
          <Calculator className="h-4 w-4 mr-2" /> Calculate Fill
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset
        </Button>
      </div>
    </div>
  )
}

/** Numeric input with focus/blur pattern per project convention */
function QuantityInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [str, setStr] = useState(String(value))

  return (
    <Input
      className="h-8"
      value={str}
      onFocus={(e) => { if (e.target.value === '0') setStr('') }}
      onBlur={() => {
        const n = parseInt(str, 10)
        if (isNaN(n) || n < 1) {
          setStr(String(value))
        } else {
          onChange(n)
          setStr(String(n))
        }
      }}
      onChange={(e) => setStr(e.target.value)}
    />
  )
}
