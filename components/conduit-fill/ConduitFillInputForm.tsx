'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { RotateCcw, Plus, Trash2, Calculator, HelpCircle } from 'lucide-react'
import {
  getConduitTypesForStandard,
  getInsulationTypesForStandard,
  getWireSizesForStandard,
  getAvailableTradeSizes,
  hasCompactData,
} from '@/lib/calculations/conduit-fill/conduitFillData'
import type {
  ConduitStandard,
  ConduitTypeId,
  InsulationTypeId,
  UnitSystem,
  ConductorEntry,
} from '@/types/conduit-fill'

interface Props {
  standard: ConduitStandard
  conduitType: ConduitTypeId
  tradeSize: string
  conductors: ConductorEntry[]
  isNipple: boolean
  unitSystem: UnitSystem
  projectName: string
  projectRef: string
  onStandardChange: (v: ConduitStandard) => void
  onConduitTypeChange: (v: ConduitTypeId) => void
  onTradeSizeChange: (v: string) => void
  onAddConductor: (entry: Omit<ConductorEntry, 'id' | 'areaSqIn' | 'areaMm2'>) => void
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

function FieldTip({ tip }: { tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground inline-block ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}

export default function ConduitFillInputForm({
  standard,
  conduitType,
  tradeSize,
  conductors,
  isNipple,
  unitSystem,
  projectName,
  projectRef,
  onStandardChange,
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
  const isIEC = standard === 'IEC'
  const conduitTypes = getConduitTypesForStandard(standard)
  const insulationTypes = getInsulationTypesForStandard(standard)
  const wireSizes = getWireSizesForStandard(standard)
  const tradeSizes = getAvailableTradeSizes(conduitType)

  // New conductor entry state
  const defaultWire = isIEC ? '2.5' : '12'
  const defaultInsulation: InsulationTypeId = isIEC ? 'PVC_V' : 'THHN'
  const [newWireSize, setNewWireSize] = useState(defaultWire)
  const [newInsulation, setNewInsulation] = useState<InsulationTypeId>(defaultInsulation)
  const [newQtyStr, setNewQtyStr] = useState('3')
  const [newIsCompact, setNewIsCompact] = useState(false)

  const handleStandardChange = (std: ConduitStandard) => {
    onStandardChange(std)
    // Reset new-conductor defaults for the new standard
    if (std === 'IEC') {
      setNewWireSize('2.5')
      setNewInsulation('PVC_V')
    } else {
      setNewWireSize('12')
      setNewInsulation('THHN')
    }
    setNewIsCompact(false)
  }

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

  const formatArea = (areaSqIn: number, areaMm2?: number) => {
    if (unitSystem === 'metric' || isIEC) {
      const mm2 = areaMm2 ?? areaSqIn * SQ_IN_TO_MM2
      return `${mm2.toFixed(1)} mm²`
    }
    return `${areaSqIn.toFixed(4)} in²`
  }

  const formatTradeSize = (s: { imperial: string; metric: number; metricLabel?: string; internalAreaSqIn: number; internalAreaMm2: number }) => {
    if (isIEC) {
      return `${s.metricLabel ?? s.imperial + 'mm'} — ${s.internalAreaMm2.toFixed(1)} mm²`
    }
    return `${s.imperial}" (Metric ${s.metric}) — ${formatArea(s.internalAreaSqIn, s.internalAreaMm2)}`
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Getting Started Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How to use this calculator</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Choose your standard (NEC for US, IEC/BS EN for international)</li>
            <li>Select conduit type and size</li>
            <li>Add conductors with wire size, insulation type, and quantity</li>
            <li>Click <strong>Calculate Fill</strong> to check compliance</li>
          </ol>
        </div>

        {/* Standard Switcher */}
        <div>
          <Label className="text-base font-semibold">
            Standard
            <FieldTip tip="NEC (National Electrical Code) is used in the US. IEC/BS EN is the international standard used in UK, EU, and most other countries. Conduit sizes, cable types, and fill rules differ between standards." />
          </Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={standard === 'NEC' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => handleStandardChange('NEC')}
            >
              NEC (US)
            </Button>
            <Button
              variant={standard === 'IEC' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => handleStandardChange('IEC')}
            >
              IEC / BS EN (International)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isIEC
              ? 'Using IEC 61386 conduit sizes and BS 7671 cable data. All dimensions in mm².'
              : 'Using NEC 2020 Chapter 9 tables. Dimensions in square inches (convertible to mm²).'}
          </p>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="projectName">
              Project Name
              <FieldTip tip="Optional. Appears on PDF exports for your records." />
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="projectRef">
              Reference
              <FieldTip tip="Optional reference number, drawing ID, or panel designation for this calculation." />
            </Label>
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
            <Label>
              Conduit Type
              <FieldTip tip={isIEC
                ? 'Select the conduit/trunking type per BS EN 61386. Each type has different internal dimensions.'
                : 'Select the raceway type per NEC Chapter 9 Table 4. Each type has different internal areas.'
              } />
            </Label>
            <Select value={conduitType} onValueChange={(v) => onConduitTypeChange(v as ConduitTypeId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conduitTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>
              {isIEC ? 'Conduit Size' : 'Trade Size'}
              <FieldTip tip={isIEC
                ? 'Nominal conduit diameter in mm per BS EN 61386. Internal area shown for reference.'
                : 'NEC trade size designation. Metric designator and internal area shown for reference.'
              } />
            </Label>
            <Select value={tradeSize} onValueChange={onTradeSizeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tradeSizes.map((s) => (
                  <SelectItem key={s.imperial} value={s.imperial}>
                    {formatTradeSize(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              id="nipple"
              checked={isNipple}
              onCheckedChange={onNippleChange}
            />
            <Label htmlFor="nipple" className="cursor-pointer">
              {isIEC ? 'Short Run (≤600mm — 55% fill)' : 'Conduit Nipple (≤24"/600mm — 60% fill)'}
            </Label>
            <FieldTip tip={isIEC
              ? 'For short conduit runs up to 600mm, a higher space factor of 55% is permitted.'
              : 'NEC 376.22: conduit nipples ≤24 inches allow 60% fill regardless of conductor count.'
            } />
          </div>
          {!isIEC && (
            <div className="flex items-center gap-2">
              <Switch
                id="units"
                checked={unitSystem === 'metric'}
                onCheckedChange={(v) => onUnitSystemChange(v ? 'metric' : 'imperial')}
              />
              <Label htmlFor="units" className="cursor-pointer">
                {unitSystem === 'metric' ? 'Metric (mm²)' : 'Imperial (in²)'}
              </Label>
              <FieldTip tip="Toggle display units. NEC calculations are always performed in square inches internally; metric display converts for reference." />
            </div>
          )}
        </div>

        {/* Conductor List */}
        <div>
          <Label className="text-base font-semibold">
            Conductors
            <FieldTip tip={isIEC
              ? 'Add cables to pull through the conduit. Select conductor cross-section (mm²) and insulation type. The overall cable area (including insulation) is used for fill calculation per BS 7671.'
              : 'Add conductors to pull through the conduit. Select AWG/kcmil size and insulation type. Cross-sectional area from NEC Ch.9 Table 5 is used for fill calculation.'
            } />
          </Label>

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
                        {wireSizes.map((w) => (
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
                        {insulationTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <QuantityInput
                      value={c.quantity}
                      onChange={(v) => onUpdateConductor(c.id, { quantity: v })}
                    />

                    <span className="text-xs text-muted-foreground self-center">
                      {formatArea(c.areaSqIn, c.areaMm2)}/ea
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
                <Label className="text-xs">
                  {isIEC ? 'Size (mm²)' : 'Wire Size'}
                </Label>
                <Select value={newWireSize} onValueChange={setNewWireSize}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wireSizes.map((w) => (
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
                    {insulationTypes.map((t) => (
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
                {!isIEC && hasCompactData(newInsulation, newWireSize) && (
                  <div className="flex items-center gap-1 mb-1">
                    <Switch
                      id="compact-new"
                      checked={newIsCompact}
                      onCheckedChange={setNewIsCompact}
                      className="h-4 w-7"
                    />
                    <Label htmlFor="compact-new" className="text-xs cursor-pointer">Compact</Label>
                    <FieldTip tip="Compact conductors (NEC Table 5A) have smaller cross-sectional area than standard conductors, allowing more conductors in the same conduit." />
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
    </TooltipProvider>
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
