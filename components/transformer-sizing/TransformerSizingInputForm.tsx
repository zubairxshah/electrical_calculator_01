'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import type {
  TransformerStandard,
  TransformerPhase,
  TransformerType,
  CoolingClass,
  VectorGroup,
  TapPosition,
  LoadProfile,
} from '@/types/transformer-sizing'
import { PRIMARY_VOLTAGES, SECONDARY_VOLTAGES } from '@/lib/calculations/transformer-sizing/transformerData'

interface Props {
  standard: TransformerStandard
  phase: TransformerPhase
  loadKW: number
  loadPowerFactor: number
  primaryVoltage: number
  secondaryVoltage: number
  transformerType: TransformerType
  coolingClass: CoolingClass
  vectorGroup: VectorGroup
  tapPosition: TapPosition
  tapRange: number
  loadProfile: LoadProfile
  demandFactor: number
  futureGrowth: number
  impedancePercent: number | undefined
  ambientTemperature: number
  altitude: number
  installationLocation: 'indoor' | 'outdoor' | 'underground-vault'
  showEnvironmental: boolean
  onStandardChange: (v: TransformerStandard) => void
  onPhaseChange: (v: TransformerPhase) => void
  onLoadKWChange: (v: number) => void
  onLoadPowerFactorChange: (v: number) => void
  onPrimaryVoltageChange: (v: number) => void
  onSecondaryVoltageChange: (v: number) => void
  onTransformerTypeChange: (v: TransformerType) => void
  onCoolingClassChange: (v: CoolingClass) => void
  onVectorGroupChange: (v: VectorGroup) => void
  onTapPositionChange: (v: TapPosition) => void
  onTapRangeChange: (v: number) => void
  onLoadProfileChange: (v: LoadProfile) => void
  onDemandFactorChange: (v: number) => void
  onFutureGrowthChange: (v: number) => void
  onImpedancePercentChange: (v: number | undefined) => void
  onAmbientTemperatureChange: (v: number) => void
  onAltitudeChange: (v: number) => void
  onInstallationLocationChange: (v: 'indoor' | 'outdoor' | 'underground-vault') => void
  onShowEnvironmentalChange: (v: boolean) => void
  onCalculate: () => void
  onReset: () => void
  isCalculating: boolean
}

const coolingClassesOil: CoolingClass[] = ['ONAN', 'ONAF', 'OFAF', 'ODAF']
const coolingClassesDry: CoolingClass[] = ['AA', 'AN', 'AF']

export default function TransformerSizingInputForm(props: Props) {
  const {
    standard, phase, loadKW, loadPowerFactor, primaryVoltage, secondaryVoltage,
    transformerType, coolingClass, vectorGroup, tapPosition, tapRange,
    loadProfile, demandFactor, futureGrowth, impedancePercent,
    ambientTemperature, altitude, installationLocation, showEnvironmental,
  } = props

  const primaryVoltages = PRIMARY_VOLTAGES[standard]
  const secondaryVoltages = SECONDARY_VOLTAGES[standard]
  const coolingOptions = transformerType === 'oil-filled' ? coolingClassesOil : coolingClassesDry

  return (
    <div className="space-y-5">
      {/* Standard & Phase */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Standard</Label>
          <div className="flex mt-1 border rounded-md overflow-hidden">
            {(['NEC', 'IEC'] as TransformerStandard[]).map(s => (
              <button
                key={s}
                onClick={() => props.onStandardChange(s)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  standard === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Phase</Label>
          <Select value={phase} onValueChange={v => props.onPhaseChange(v as TransformerPhase)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single-phase">Single Phase</SelectItem>
              <SelectItem value="three-phase">Three Phase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Load */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Load (kW)</Label>
          <Input
            type="number"
            value={loadKW || ''}
            onChange={e => props.onLoadKWChange(parseFloat(e.target.value) || 0)}
            className="mt-1"
            min={0}
          />
        </div>
        <div>
          <Label>Power Factor</Label>
          <Input
            type="number"
            value={loadPowerFactor || ''}
            onChange={e => props.onLoadPowerFactorChange(parseFloat(e.target.value) || 0)}
            className="mt-1"
            min={0.5}
            max={1.0}
            step={0.01}
          />
        </div>
      </div>

      {/* Voltages */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Primary Voltage (V)</Label>
          <Select value={String(primaryVoltage)} onValueChange={v => props.onPrimaryVoltageChange(Number(v))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {primaryVoltages.map(v => (
                <SelectItem key={v} value={String(v)}>{v.toLocaleString()} V</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Secondary Voltage (V)</Label>
          <Select value={String(secondaryVoltage)} onValueChange={v => props.onSecondaryVoltageChange(Number(v))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {secondaryVoltages.map(v => (
                <SelectItem key={v} value={String(v)}>{v} V</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transformer Type & Cooling */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Transformer Type</Label>
          <Select value={transformerType} onValueChange={v => props.onTransformerTypeChange(v as TransformerType)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dry-type">Dry Type</SelectItem>
              <SelectItem value="oil-filled">Oil Filled</SelectItem>
              <SelectItem value="cast-resin">Cast Resin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cooling Class</Label>
          <Select value={coolingClass} onValueChange={v => props.onCoolingClassChange(v as CoolingClass)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {coolingOptions.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vector Group & Tap Changer (3-phase only) */}
      {phase === 'three-phase' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Vector Group</Label>
            <Select value={vectorGroup} onValueChange={v => props.onVectorGroupChange(v as VectorGroup)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Dyn11', 'Dyn1', 'Dyn5', 'Yyn0', 'Dd0', 'Yd1', 'Yd11', 'Yz1', 'Yz11'].map(vg => (
                  <SelectItem key={vg} value={vg}>{vg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tap Changer</Label>
            <Select value={tapPosition} onValueChange={v => props.onTapPositionChange(v as TapPosition)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="off-load">Off-Load</SelectItem>
                <SelectItem value="OLTC">OLTC (On-Load)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Tap Range */}
      {tapPosition !== 'none' && (
        <div>
          <Label>Tap Range: ±{tapRange}%</Label>
          <Slider
            value={[tapRange]}
            onValueChange={([v]) => props.onTapRangeChange(v)}
            min={2.5}
            max={15}
            step={2.5}
            className="mt-2"
          />
        </div>
      )}

      {/* Load Profile & Demand Factor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Load Profile</Label>
          <Select value={loadProfile} onValueChange={v => props.onLoadProfileChange(v as LoadProfile)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="constant">Constant (24/7)</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Demand Factor: {(demandFactor * 100).toFixed(0)}%</Label>
          <Slider
            value={[demandFactor * 100]}
            onValueChange={([v]) => props.onDemandFactorChange(v / 100)}
            min={30}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>
      </div>

      {/* Growth Factor & Impedance */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Future Growth: {(futureGrowth * 100).toFixed(0)}%</Label>
          <Slider
            value={[futureGrowth * 100]}
            onValueChange={([v]) => props.onFutureGrowthChange(v / 100)}
            min={100}
            max={200}
            step={5}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Impedance %Z (optional)</Label>
          <Input
            type="number"
            value={impedancePercent ?? ''}
            onChange={e => {
              const val = e.target.value
              props.onImpedancePercentChange(val ? parseFloat(val) : undefined)
            }}
            className="mt-1"
            placeholder="Auto-estimated"
            min={1}
            max={15}
            step={0.5}
          />
        </div>
      </div>

      {/* Environmental Section */}
      <button
        onClick={() => props.onShowEnvironmentalChange(!showEnvironmental)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {showEnvironmental ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Environmental Conditions
      </button>

      {showEnvironmental && (
        <div className="space-y-4 pl-2 border-l-2 border-muted">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ambient Temperature (°C)</Label>
              <Input
                type="number"
                value={ambientTemperature}
                onChange={e => props.onAmbientTemperatureChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={-40}
                max={70}
              />
            </div>
            <div>
              <Label>Altitude (m)</Label>
              <Input
                type="number"
                value={altitude}
                onChange={e => props.onAltitudeChange(parseFloat(e.target.value) || 0)}
                className="mt-1"
                min={0}
                max={5000}
              />
            </div>
          </div>
          <div>
            <Label>Installation Location</Label>
            <Select value={installationLocation} onValueChange={v => props.onInstallationLocationChange(v as 'indoor' | 'outdoor' | 'underground-vault')}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="underground-vault">Underground Vault</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button onClick={props.onCalculate} disabled={props.isCalculating} className="flex-1">
          {props.isCalculating ? 'Calculating...' : 'Calculate Transformer Size'}
        </Button>
        <Button variant="outline" onClick={props.onReset} size="icon">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
