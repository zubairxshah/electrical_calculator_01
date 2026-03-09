'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { SYSTEM_VOLTAGES, IEC_CABLE_SIZES, NEC_CABLE_SIZES } from '@/lib/calculations/voltage-drop/voltageDropData'
import { getAvailableBuswayRatings } from '@/lib/calculations/voltage-drop/voltageDropData'
import type {
  VoltageDropStandard,
  CircuitPhase,
  ConductorMaterial,
  ConductorType,
  LengthUnit,
  CableSizeMode,
} from '@/types/voltage-drop'

interface Props {
  standard: VoltageDropStandard
  phase: CircuitPhase
  systemVoltage: number
  current: number
  length: number
  lengthUnit: LengthUnit
  conductorType: ConductorType
  conductorMaterial: ConductorMaterial
  powerFactor: number
  cableSizeMode: CableSizeMode
  cableSizeMm2: number | null
  cableSizeAWG: string | null
  customResistance: number | null
  parallelRuns: number
  buswayRating: number | null
  buswayType: 'sandwich' | 'non-sandwich'
  customBuswayImpedance: number | null
  maxDropPercent: number
  includeCableSuggestion: boolean
  onStandardChange: (v: VoltageDropStandard) => void
  onPhaseChange: (v: CircuitPhase) => void
  onSystemVoltageChange: (v: number) => void
  onCurrentChange: (v: number) => void
  onLengthChange: (v: number) => void
  onLengthUnitChange: (v: LengthUnit) => void
  onConductorTypeChange: (v: ConductorType) => void
  onConductorMaterialChange: (v: ConductorMaterial) => void
  onPowerFactorChange: (v: number) => void
  onCableSizeModeChange: (v: CableSizeMode) => void
  onCableSizeMm2Change: (v: number | null) => void
  onCableSizeAWGChange: (v: string | null) => void
  onCustomResistanceChange: (v: number | null) => void
  onParallelRunsChange: (v: number) => void
  onBuswayRatingChange: (v: number | null) => void
  onBuswayTypeChange: (v: 'sandwich' | 'non-sandwich') => void
  onCustomBuswayImpedanceChange: (v: number | null) => void
  onMaxDropPercentChange: (v: number) => void
  onIncludeCableSuggestionChange: (v: boolean) => void
  onCalculate: () => void
  onReset: () => void
  isCalculating: boolean
}

export default function VoltageDropInputForm(props: Props) {
  const voltages = SYSTEM_VOLTAGES[props.standard]
  const isCable = props.conductorType === 'cable'
  const isBusway = props.conductorType === 'busway'
  const buswayRatings = getAvailableBuswayRatings(props.conductorMaterial, props.buswayType)

  return (
    <div className="space-y-4">
      {/* Standard & Phase */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Standard</Label>
          <Select value={props.standard} onValueChange={v => props.onStandardChange(v as VoltageDropStandard)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="IEC">IEC 60364</SelectItem>
              <SelectItem value="NEC">NEC 2020</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Phase</Label>
          <Select value={props.phase} onValueChange={v => props.onPhaseChange(v as CircuitPhase)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single-phase">Single Phase</SelectItem>
              <SelectItem value="three-phase">Three Phase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voltage & Current */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">System Voltage (V)</Label>
          <Select value={String(props.systemVoltage)} onValueChange={v => props.onSystemVoltageChange(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {voltages.map(v => (
                <SelectItem key={v} value={String(v)}>{v} V</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Load Current (A)</Label>
          <Input
            type="number"
            value={props.current || ''}
            onChange={e => props.onCurrentChange(Number(e.target.value))}
            min={0}
            step={0.1}
          />
        </div>
      </div>

      {/* Length & Unit */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Cable/Busway Length</Label>
          <Input
            type="number"
            value={props.length || ''}
            onChange={e => props.onLengthChange(Number(e.target.value))}
            min={0}
            step={1}
          />
        </div>
        <div>
          <Label className="text-xs">Unit</Label>
          <Select value={props.lengthUnit} onValueChange={v => props.onLengthUnitChange(v as LengthUnit)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="meters">Meters</SelectItem>
              <SelectItem value="feet">Feet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conductor Type & Material */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Conductor Type</Label>
          <Select value={props.conductorType} onValueChange={v => props.onConductorTypeChange(v as ConductorType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cable">Cable</SelectItem>
              <SelectItem value="busway">Busway (Busbar Trunking)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Material</Label>
          <Select value={props.conductorMaterial} onValueChange={v => props.onConductorMaterialChange(v as ConductorMaterial)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="copper">Copper</SelectItem>
              <SelectItem value="aluminum">Aluminum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Power Factor (shown for busway, optional for cable) */}
      {isBusway && (
        <div>
          <Label className="text-xs">Power Factor (cos φ)</Label>
          <Input
            type="number"
            value={props.powerFactor || ''}
            onChange={e => props.onPowerFactorChange(Number(e.target.value))}
            min={0.1}
            max={1}
            step={0.01}
          />
          <p className="text-[10px] text-muted-foreground mt-1">Load power factor affects voltage drop in busway systems</p>
        </div>
      )}

      {/* Cable-specific options */}
      {isCable && (
        <div className="space-y-3 border rounded-md p-3">
          <h4 className="text-sm font-medium">Cable Parameters</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Size Entry</Label>
              <Select value={props.cableSizeMode} onValueChange={v => props.onCableSizeModeChange(v as CableSizeMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select from Table</SelectItem>
                  <SelectItem value="custom">Custom Resistance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {props.cableSizeMode === 'select' ? (
              <div>
                <Label className="text-xs">Cable Size</Label>
                {props.standard === 'IEC' ? (
                  <Select
                    value={props.cableSizeMm2 !== null ? String(props.cableSizeMm2) : ''}
                    onValueChange={v => props.onCableSizeMm2Change(Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      {IEC_CABLE_SIZES.map(s => (
                        <SelectItem key={s} value={String(s)}>{s} mm²</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={props.cableSizeAWG || ''}
                    onValueChange={v => props.onCableSizeAWGChange(v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      {NEC_CABLE_SIZES.map(s => (
                        <SelectItem key={s} value={s}>{s} AWG</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div>
                <Label className="text-xs">
                  Resistance ({props.standard === 'IEC' ? 'mV/A/m' : 'Ω/1000ft'})
                </Label>
                <Input
                  type="number"
                  value={props.customResistance ?? ''}
                  onChange={e => props.onCustomResistanceChange(e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  step={0.001}
                />
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs">Parallel Runs</Label>
            <Input
              type="number"
              value={props.parallelRuns}
              onChange={e => props.onParallelRunsChange(Math.max(1, Number(e.target.value)))}
              min={1}
              max={10}
            />
          </div>
        </div>
      )}

      {/* Busway-specific options */}
      {isBusway && (
        <div className="space-y-3 border rounded-md p-3">
          <h4 className="text-sm font-medium">Busway Parameters</h4>
          <div>
            <Label className="text-xs">Busway Type</Label>
            <Select value={props.buswayType} onValueChange={v => props.onBuswayTypeChange(v as 'sandwich' | 'non-sandwich')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandwich">Sandwich (Compact/Interleaved)</SelectItem>
                <SelectItem value="non-sandwich">Non-Sandwich (Conventional)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              Sandwich type has lower reactance — preferred for long runs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Busway Rating (A)</Label>
              <Select
                value={props.buswayRating !== null ? String(props.buswayRating) : 'custom'}
                onValueChange={v => {
                  if (v === 'custom') {
                    props.onBuswayRatingChange(null)
                  } else {
                    props.onBuswayRatingChange(Number(v))
                    props.onCustomBuswayImpedanceChange(null)
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                <SelectContent>
                  {buswayRatings.map(r => (
                    <SelectItem key={r} value={String(r)}>{r} A</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Impedance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {props.buswayRating === null && (
              <div>
                <Label className="text-xs">Custom Z (mΩ/m)</Label>
                <Input
                  type="number"
                  value={props.customBuswayImpedance ?? ''}
                  onChange={e => props.onCustomBuswayImpedanceChange(e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  step={0.001}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voltage Drop Limit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Max Allowed Drop (%)</Label>
          <Select value={String(props.maxDropPercent)} onValueChange={v => props.onMaxDropPercentChange(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3% (Branch Circuit)</SelectItem>
              <SelectItem value="5">5% (Feeder + Branch)</SelectItem>
              <SelectItem value="2">2% (Sensitive Loads)</SelectItem>
              <SelectItem value="1">1% (Data Centers)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isCable && (
          <div className="flex items-end pb-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cableSuggest"
                checked={props.includeCableSuggestion}
                onCheckedChange={v => props.onIncludeCableSuggestionChange(v === true)}
              />
              <label htmlFor="cableSuggest" className="text-xs cursor-pointer">
                Suggest cable sizes
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={props.onCalculate} disabled={props.isCalculating} className="flex-1">
          {props.isCalculating ? 'Calculating...' : 'Calculate Voltage Drop'}
        </Button>
        <Button variant="outline" onClick={props.onReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
