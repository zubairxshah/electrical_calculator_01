'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type {
  PFCStandard,
  PFCSystemType,
  PFCConnectionType,
  PFCCorrectionType,
  PFCLoadProfile,
} from '@/types/power-factor-correction'

interface Props {
  standard: PFCStandard
  systemType: PFCSystemType
  voltage: number
  frequency: number
  activePower: number
  currentPowerFactor: number
  targetPowerFactor: number
  connectionType: PFCConnectionType
  correctionType: PFCCorrectionType
  loadProfile: PFCLoadProfile
  harmonicDistortion: number
  ambientTemperature: number
  altitude: number
  showEnvironmental: boolean
  onStandardChange: (v: PFCStandard) => void
  onSystemTypeChange: (v: PFCSystemType) => void
  onVoltageChange: (v: number) => void
  onFrequencyChange: (v: number) => void
  onActivePowerChange: (v: number) => void
  onCurrentPowerFactorChange: (v: number) => void
  onTargetPowerFactorChange: (v: number) => void
  onConnectionTypeChange: (v: PFCConnectionType) => void
  onCorrectionTypeChange: (v: PFCCorrectionType) => void
  onLoadProfileChange: (v: PFCLoadProfile) => void
  onHarmonicDistortionChange: (v: number) => void
  onAmbientTemperatureChange: (v: number) => void
  onAltitudeChange: (v: number) => void
  onShowEnvironmentalChange: (v: boolean) => void
  onCalculate: () => void
  onReset: () => void
  isCalculating: boolean
}

export default function PowerFactorCorrectionInputForm(props: Props) {
  const isThreePhase = props.systemType === 'three-phase-ac'

  return (
    <div className="space-y-6">
      {/* Standard Selection */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Standard</Label>
        <Tabs
          value={props.standard}
          onValueChange={(v) => props.onStandardChange(v as PFCStandard)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="IEC">IEC 60831</TabsTrigger>
            <TabsTrigger value="NEC">NEC 460</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* System Type */}
      <div>
        <Label className="text-sm font-medium mb-2 block">System Type</Label>
        <Tabs
          value={props.systemType}
          onValueChange={(v) => props.onSystemTypeChange(v as PFCSystemType)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="three-phase-ac">3-Phase AC</TabsTrigger>
            <TabsTrigger value="single-phase-ac">1-Phase AC</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* Electrical Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="voltage">System Voltage (V)</Label>
          <Input
            id="voltage"
            type="number"
            value={props.voltage}
            onChange={(e) => props.onVoltageChange(parseFloat(e.target.value) || 0)}
            min={100}
            max={35000}
          />
        </div>
        <div>
          <Label htmlFor="frequency">Frequency (Hz)</Label>
          <Select
            value={String(props.frequency)}
            onValueChange={(v) => props.onFrequencyChange(parseInt(v))}
          >
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 Hz</SelectItem>
              <SelectItem value="60">60 Hz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="activePower">Active Power (kW)</Label>
        <Input
          id="activePower"
          type="number"
          value={props.activePower}
          onChange={(e) => props.onActivePowerChange(parseFloat(e.target.value) || 0)}
          min={0.1}
          max={50000}
          step={0.1}
        />
      </div>

      {/* Power Factor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentPF">Current PF</Label>
          <Input
            id="currentPF"
            type="number"
            value={props.currentPowerFactor}
            onChange={(e) => props.onCurrentPowerFactorChange(parseFloat(e.target.value) || 0)}
            min={0.1}
            max={0.99}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground mt-1">Existing (lagging)</p>
        </div>
        <div>
          <Label htmlFor="targetPF">Target PF</Label>
          <Input
            id="targetPF"
            type="number"
            value={props.targetPowerFactor}
            onChange={(e) => props.onTargetPowerFactorChange(parseFloat(e.target.value) || 0)}
            min={0.85}
            max={1.0}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground mt-1">Desired (0.90-0.99)</p>
        </div>
      </div>

      <Separator />

      {/* Correction Configuration */}
      {isThreePhase && (
        <div>
          <Label>Connection Type</Label>
          <Tabs
            value={props.connectionType}
            onValueChange={(v) => props.onConnectionTypeChange(v as PFCConnectionType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="delta">Delta (Δ)</TabsTrigger>
              <TabsTrigger value="star">Star (Y)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div>
        <Label>Correction Type</Label>
        <Select
          value={props.correctionType}
          onValueChange={(v) => props.onCorrectionTypeChange(v as PFCCorrectionType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed (single capacitor)</SelectItem>
            <SelectItem value="automatic">Automatic (stepped bank)</SelectItem>
            <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Load Profile</Label>
        <Select
          value={props.loadProfile}
          onValueChange={(v) => props.onLoadProfileChange(v as PFCLoadProfile)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="constant">Constant Load</SelectItem>
            <SelectItem value="variable">Variable Load</SelectItem>
            <SelectItem value="cyclic">Cyclic Load</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="thd">Total Harmonic Distortion (%)</Label>
        <Input
          id="thd"
          type="number"
          value={props.harmonicDistortion}
          onChange={(e) => props.onHarmonicDistortionChange(parseFloat(e.target.value) || 0)}
          min={0}
          max={50}
          step={0.5}
        />
      </div>

      <Separator />

      {/* Environmental (collapsible) */}
      <div>
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          onClick={() => props.onShowEnvironmentalChange(!props.showEnvironmental)}
        >
          {props.showEnvironmental ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Environmental Conditions
        </button>
        {props.showEnvironmental && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <Label htmlFor="ambTemp">Ambient Temp (°C)</Label>
              <Input
                id="ambTemp"
                type="number"
                value={props.ambientTemperature}
                onChange={(e) => props.onAmbientTemperatureChange(parseFloat(e.target.value) || 0)}
                min={-20}
                max={70}
              />
            </div>
            <div>
              <Label htmlFor="altitude">Altitude (m)</Label>
              <Input
                id="altitude"
                type="number"
                value={props.altitude}
                onChange={(e) => props.onAltitudeChange(parseFloat(e.target.value) || 0)}
                min={0}
                max={5000}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={props.onCalculate}
          disabled={props.isCalculating}
        >
          {props.isCalculating ? 'Calculating...' : 'Calculate'}
        </Button>
        <Button variant="outline" onClick={props.onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}
