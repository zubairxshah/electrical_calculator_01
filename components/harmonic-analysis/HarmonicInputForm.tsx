'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, RotateCcw, Info } from 'lucide-react'
import type {
  HarmonicStandard,
  SystemType,
  VoltageLevel,
  LoadProfile,
  HarmonicOrder,
} from '@/types/harmonic-analysis'
import { LOAD_PROFILES } from '@/lib/calculations/harmonic-analysis/harmonicData'

interface HarmonicInputFormProps {
  standard: HarmonicStandard
  systemType: SystemType
  voltageLevel: VoltageLevel
  systemVoltage: number
  fundamentalFrequency: 50 | 60
  loadProfile: LoadProfile
  fundamentalCurrent: number
  loadPowerKW: number | null
  shortCircuitCurrentKA: number | null
  maxDemandCurrent: number | null
  currentHarmonics: HarmonicOrder[]
  voltageHarmonics: HarmonicOrder[]
  calculateVoltageThd: boolean
  calculateFilterSizing: boolean
  targetThd: number | null
  onStandardChange: (v: HarmonicStandard) => void
  onSystemTypeChange: (v: SystemType) => void
  onVoltageLevelChange: (v: VoltageLevel) => void
  onSystemVoltageChange: (v: number) => void
  onFundamentalFrequencyChange: (v: 50 | 60) => void
  onLoadProfileChange: (v: LoadProfile) => void
  onFundamentalCurrentChange: (v: number) => void
  onLoadPowerKWChange: (v: number | null) => void
  onShortCircuitCurrentKAChange: (v: number | null) => void
  onMaxDemandCurrentChange: (v: number | null) => void
  onCurrentHarmonicChange: (order: number, magnitude: number) => void
  onVoltageHarmonicChange: (order: number, magnitude: number) => void
  onCalculateVoltageThdChange: (v: boolean) => void
  onCalculateFilterSizingChange: (v: boolean) => void
  onTargetThdChange: (v: number | null) => void
  onCalculate: () => void
  onReset: () => void
  isCalculating: boolean
}

const PROFILE_OPTIONS: { value: LoadProfile; label: string }[] = [
  { value: 'custom', label: 'Custom (Manual Entry)' },
  ...Object.entries(LOAD_PROFILES).map(([key, val]) => ({
    value: key as LoadProfile,
    label: val.name,
  })),
]

export default function HarmonicInputForm(props: HarmonicInputFormProps) {
  const profileInfo = props.loadProfile !== 'custom'
    ? LOAD_PROFILES[props.loadProfile as keyof typeof LOAD_PROFILES]
    : null

  // Show only harmonics with non-zero magnitude for profiles, or key orders for custom
  const visibleCurrentHarmonics = props.currentHarmonics.filter(h => {
    if (props.loadProfile !== 'custom') return h.magnitude > 0
    // For custom, show odd harmonics up to 25th plus any non-zero
    return h.magnitude > 0 || (h.order <= 25 && h.order % 2 === 1) || h.order === 2
  })

  return (
    <div className="space-y-5">
      {/* Standard & System */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Standard</Label>
          <Select value={props.standard} onValueChange={(v) => props.onStandardChange(v as HarmonicStandard)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="IEEE519">IEEE 519-2022</SelectItem>
              <SelectItem value="IEC61000">IEC 61000-3-2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>System Type</Label>
          <Select value={props.systemType} onValueChange={(v) => props.onSystemTypeChange(v as SystemType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single-phase">Single Phase</SelectItem>
              <SelectItem value="three-phase">Three Phase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Voltage Level</Label>
          <Select value={props.voltageLevel} onValueChange={(v) => props.onVoltageLevelChange(v as VoltageLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lv">LV (&lt;1 kV)</SelectItem>
              <SelectItem value="mv">MV (1-69 kV)</SelectItem>
              <SelectItem value="hv">HV (&gt;69 kV)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>System Voltage (V)</Label>
          <Input
            type="number"
            value={props.systemVoltage}
            onChange={(e) => props.onSystemVoltageChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Frequency (Hz)</Label>
          <Select
            value={String(props.fundamentalFrequency)}
            onValueChange={(v) => props.onFundamentalFrequencyChange(Number(v) as 50 | 60)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 Hz</SelectItem>
              <SelectItem value="60">60 Hz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Load Profile */}
      <div className="space-y-2">
        <Label>Load Profile</Label>
        <Select value={props.loadProfile} onValueChange={(v) => props.onLoadProfileChange(v as LoadProfile)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROFILE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {profileInfo && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-blue-700 dark:text-blue-400">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{profileInfo.description} — Typical THDi: ~{profileInfo.typicalThdi}%</span>
          </div>
        )}
      </div>

      {/* Load Current */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fundamental Current (A)</Label>
          <Input
            type="number"
            value={props.fundamentalCurrent}
            onChange={(e) => props.onFundamentalCurrentChange(Number(e.target.value))}
            placeholder="Full load current"
          />
        </div>
        <div className="space-y-2">
          <Label>Load Power (kW) <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            type="number"
            value={props.loadPowerKW ?? ''}
            onChange={(e) => props.onLoadPowerKWChange(e.target.value ? Number(e.target.value) : null)}
            placeholder="For reference"
          />
        </div>
      </div>

      {/* IEEE 519 TDD Inputs */}
      {props.standard === 'IEEE519' && (
        <Card className="border-dashed">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">
              IEEE 519 TDD Analysis <span className="text-muted-foreground font-normal">(optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Short-Circuit Current at PCC (kA)</Label>
                <Input
                  type="number"
                  value={props.shortCircuitCurrentKA ?? ''}
                  onChange={(e) => props.onShortCircuitCurrentKAChange(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Isc"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Demand Current IL (A)</Label>
                <Input
                  type="number"
                  value={props.maxDemandCurrent ?? ''}
                  onChange={(e) => props.onMaxDemandCurrentChange(e.target.value ? Number(e.target.value) : null)}
                  placeholder="15/30 min demand"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Harmonic Spectrum */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">Current Harmonic Spectrum (% of Fundamental)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {visibleCurrentHarmonics.map((h) => (
              <div key={h.order} className="flex items-center gap-1.5">
                <Label className="text-xs w-8 text-right shrink-0">h{h.order}</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={h.magnitude || ''}
                  onChange={(e) => props.onCurrentHarmonicChange(h.order, Number(e.target.value) || 0)}
                  placeholder="0"
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
            ))}
          </div>
          {props.loadProfile !== 'custom' && (
            <p className="text-xs text-muted-foreground mt-2">
              Pre-filled from {profileInfo?.name} profile. Values are editable.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="voltage-thd" className="text-sm">Calculate Voltage THDv</Label>
          <Switch
            id="voltage-thd"
            checked={props.calculateVoltageThd}
            onCheckedChange={props.onCalculateVoltageThdChange}
          />
        </div>

        {props.calculateVoltageThd && (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Voltage Harmonic Spectrum (% of Fundamental)</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {props.voltageHarmonics
                  .filter(h => h.order <= 25 && (h.order % 2 === 1 || h.order === 2 || h.magnitude > 0))
                  .map((h) => (
                    <div key={h.order} className="flex items-center gap-1.5">
                      <Label className="text-xs w-8 text-right shrink-0">h{h.order}</Label>
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        value={h.magnitude || ''}
                        onChange={(e) => props.onVoltageHarmonicChange(h.order, Number(e.target.value) || 0)}
                        placeholder="0"
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="filter-sizing" className="text-sm">Filter Sizing Recommendations</Label>
          <Switch
            id="filter-sizing"
            checked={props.calculateFilterSizing}
            onCheckedChange={props.onCalculateFilterSizingChange}
          />
        </div>

        {props.calculateFilterSizing && (
          <div className="space-y-2">
            <Label>Target THD (%)</Label>
            <Input
              type="number"
              value={props.targetThd ?? ''}
              onChange={(e) => props.onTargetThdChange(e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 5"
              min={0.1}
              max={50}
              step={0.5}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button onClick={props.onCalculate} disabled={props.isCalculating} className="flex-1">
          <Calculator className="h-4 w-4 mr-2" />
          {props.isCalculating ? 'Analyzing...' : 'Analyze Harmonics'}
        </Button>
        <Button variant="outline" onClick={props.onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
