'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type {
  ShortCircuitStandard,
  SystemPhase,
  SystemGrounding,
  FaultType,
} from '@/types/short-circuit'
import { SYSTEM_VOLTAGES } from '@/lib/calculations/short-circuit/shortCircuitData'

interface Props {
  standard: ShortCircuitStandard
  phase: SystemPhase
  systemVoltage: number
  frequency: number
  grounding: SystemGrounding
  utilityFaultMVA: number
  utilityXRRatio: number
  hasTransformer: boolean
  transformerKVA: number
  transformerImpedancePercent: number
  transformerXRRatio: number
  hasMotorContribution: boolean
  totalMotorHP: number
  motorType: 'induction' | 'synchronous' | 'mixed'
  hasCableImpedance: boolean
  cableLength: number
  cableResistance: number
  cableReactance: number
  conductorsPerPhase: number
  faultTypes: FaultType[]
  onStandardChange: (v: ShortCircuitStandard) => void
  onPhaseChange: (v: SystemPhase) => void
  onSystemVoltageChange: (v: number) => void
  onFrequencyChange: (v: number) => void
  onGroundingChange: (v: SystemGrounding) => void
  onUtilityFaultMVAChange: (v: number) => void
  onUtilityXRRatioChange: (v: number) => void
  onHasTransformerChange: (v: boolean) => void
  onTransformerKVAChange: (v: number) => void
  onTransformerImpedancePercentChange: (v: number) => void
  onTransformerXRRatioChange: (v: number) => void
  onHasMotorContributionChange: (v: boolean) => void
  onTotalMotorHPChange: (v: number) => void
  onMotorTypeChange: (v: 'induction' | 'synchronous' | 'mixed') => void
  onHasCableImpedanceChange: (v: boolean) => void
  onCableLengthChange: (v: number) => void
  onCableResistanceChange: (v: number) => void
  onCableReactanceChange: (v: number) => void
  onConductorsPerPhaseChange: (v: number) => void
  onFaultTypesChange: (v: FaultType[]) => void
  onCalculate: () => void
  onReset: () => void
  isCalculating: boolean
}

const allFaultTypes: { value: FaultType; label: string }[] = [
  { value: 'three-phase', label: '3-Phase (L-L-L)' },
  { value: 'single-line-to-ground', label: 'Single L-G' },
  { value: 'line-to-line', label: 'Line-to-Line (L-L)' },
  { value: 'double-line-to-ground', label: 'Double L-L-G' },
]

export default function ShortCircuitInputForm(props: Props) {
  const [showMotor, setShowMotor] = useState(props.hasMotorContribution)
  const [showCable, setShowCable] = useState(props.hasCableImpedance)

  const voltages = SYSTEM_VOLTAGES[props.standard]

  const toggleFaultType = (ft: FaultType) => {
    const current = props.faultTypes
    if (current.includes(ft)) {
      if (current.length > 1) props.onFaultTypesChange(current.filter(f => f !== ft))
    } else {
      props.onFaultTypesChange([...current, ft])
    }
  }

  return (
    <div className="space-y-5">
      {/* Standard & Phase */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Standard</Label>
          <div className="flex mt-1 border rounded-md overflow-hidden">
            {(['NEC', 'IEC'] as ShortCircuitStandard[]).map(s => (
              <button
                key={s}
                onClick={() => props.onStandardChange(s)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  props.standard === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Phase</Label>
          <Select value={props.phase} onValueChange={v => props.onPhaseChange(v as SystemPhase)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single-phase">Single Phase</SelectItem>
              <SelectItem value="three-phase">Three Phase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voltage & Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>System Voltage (V)</Label>
          <Select value={String(props.systemVoltage)} onValueChange={v => props.onSystemVoltageChange(Number(v))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {voltages.map(v => (
                <SelectItem key={v} value={String(v)}>{v.toLocaleString()} V</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Frequency (Hz)</Label>
          <div className="flex mt-1 border rounded-md overflow-hidden">
            {[50, 60].map(f => (
              <button
                key={f}
                onClick={() => props.onFrequencyChange(f)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  props.frequency === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {f} Hz
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grounding */}
      <div>
        <Label>System Grounding</Label>
        <Select value={props.grounding} onValueChange={v => props.onGroundingChange(v as SystemGrounding)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="solidly-grounded">Solidly Grounded</SelectItem>
            <SelectItem value="resistance-grounded">Resistance Grounded</SelectItem>
            <SelectItem value="reactance-grounded">Reactance Grounded</SelectItem>
            <SelectItem value="ungrounded">Ungrounded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Utility Source */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Utility Source</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Fault MVA at PCC</Label>
            <Input
              type="number"
              value={props.utilityFaultMVA || ''}
              onChange={e => props.onUtilityFaultMVAChange(parseFloat(e.target.value) || 0)}
              className="mt-1"
              min={1}
            />
          </div>
          <div>
            <Label className="text-xs">X/R Ratio</Label>
            <Input
              type="number"
              value={props.utilityXRRatio || ''}
              onChange={e => props.onUtilityXRRatioChange(parseFloat(e.target.value) || 0)}
              className="mt-1"
              min={1}
              max={50}
              step={0.5}
            />
          </div>
        </div>
      </div>

      {/* Transformer */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={props.hasTransformer}
            onCheckedChange={v => { props.onHasTransformerChange(!!v) }}
          />
          <Label className="text-base font-semibold cursor-pointer">Transformer</Label>
        </div>
        {props.hasTransformer && (
          <div className="grid grid-cols-3 gap-3 pl-6">
            <div>
              <Label className="text-xs">kVA</Label>
              <Input
                type="number"
                value={props.transformerKVA || ''}
                onChange={e => props.onTransformerKVAChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={1}
              />
            </div>
            <div>
              <Label className="text-xs">%Z</Label>
              <Input
                type="number"
                value={props.transformerImpedancePercent || ''}
                onChange={e => props.onTransformerImpedancePercentChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={1}
                max={15}
                step={0.5}
              />
            </div>
            <div>
              <Label className="text-xs">X/R</Label>
              <Input
                type="number"
                value={props.transformerXRRatio || ''}
                onChange={e => props.onTransformerXRRatioChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={0.5}
                max={20}
                step={0.5}
              />
            </div>
          </div>
        )}
      </div>

      {/* Motor Contribution */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={props.hasMotorContribution}
            onCheckedChange={v => { props.onHasMotorContributionChange(!!v); setShowMotor(!!v) }}
          />
          <Label className="text-base font-semibold cursor-pointer">Motor Contribution</Label>
        </div>
        {props.hasMotorContribution && (
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div>
              <Label className="text-xs">Total Motor HP</Label>
              <Input
                type="number"
                value={props.totalMotorHP || ''}
                onChange={e => props.onTotalMotorHPChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={0}
              />
            </div>
            <div>
              <Label className="text-xs">Motor Type</Label>
              <Select value={props.motorType} onValueChange={v => props.onMotorTypeChange(v as 'induction' | 'synchronous' | 'mixed')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="induction">Induction</SelectItem>
                  <SelectItem value="synchronous">Synchronous</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Cable Impedance */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={props.hasCableImpedance}
            onCheckedChange={v => { props.onHasCableImpedanceChange(!!v); setShowCable(!!v) }}
          />
          <Label className="text-base font-semibold cursor-pointer">Cable/Conductor Impedance</Label>
        </div>
        {props.hasCableImpedance && (
          <div className="grid grid-cols-2 gap-3 pl-6">
            <div>
              <Label className="text-xs">Length (m)</Label>
              <Input
                type="number"
                value={props.cableLength || ''}
                onChange={e => props.onCableLengthChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={0}
              />
            </div>
            <div>
              <Label className="text-xs">Conductors/Phase</Label>
              <Input
                type="number"
                value={props.conductorsPerPhase}
                onChange={e => props.onConductorsPerPhaseChange(parseInt(e.target.value) || 1)}
                className="mt-1"
                min={1}
                max={10}
              />
            </div>
            <div>
              <Label className="text-xs">R (ohm/km)</Label>
              <Input
                type="number"
                value={props.cableResistance || ''}
                onChange={e => props.onCableResistanceChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label className="text-xs">X (ohm/km)</Label>
              <Input
                type="number"
                value={props.cableReactance || ''}
                onChange={e => props.onCableReactanceChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={0}
                step={0.01}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fault Types */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Fault Types to Calculate</Label>
        <div className="grid grid-cols-2 gap-2">
          {allFaultTypes.map(ft => (
            <div key={ft.value} className="flex items-center gap-2">
              <Checkbox
                checked={props.faultTypes.includes(ft.value)}
                onCheckedChange={() => toggleFaultType(ft.value)}
              />
              <Label className="text-sm cursor-pointer">{ft.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button onClick={props.onCalculate} disabled={props.isCalculating} className="flex-1">
          {props.isCalculating ? 'Calculating...' : 'Calculate Fault Currents'}
        </Button>
        <Button variant="outline" onClick={props.onReset} size="icon">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
