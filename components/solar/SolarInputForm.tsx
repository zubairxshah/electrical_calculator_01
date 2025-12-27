/**
 * Solar Input Form Component
 *
 * Form inputs with real-time validation for solar array sizing
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

'use client'

import { useSolarStore } from '@/stores/useSolarStore'
import { InputField } from '@/components/shared/InputField'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SolarInputForm() {
  const { inputs, setInputs, validation } = useSolarStore()

  const getFieldValidation = (field: string) => {
    if (!validation) return undefined
    const error = validation.errors.find((e) => e.field === field)
    const warning = validation.warnings.find((w) => w.field === field)
    const result = error || warning
    if (!result) return undefined
    return {
      ...result,
      isValid: !error,
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
      {/* Daily Energy Requirement */}
      <div className="space-y-2">
        <InputField
          label="Daily Energy Requirement"
          value={inputs.dailyEnergyKWh}
          onChange={(value) => setInputs({ dailyEnergyKWh: Number(value) })}
          type="number"
          unit="kWh/day"
          placeholder="10"
          step="0.1"
          validation={getFieldValidation('dailyEnergyKWh')}
          required
        />
        <p className="text-xs text-muted-foreground">
          Average daily energy consumption. US household average: 30 kWh/day
        </p>
      </div>

      {/* Peak Sun Hours */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>
            Peak Sun Hours (PSH)
            <span className="text-destructive ml-1">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Peak Sun Hours represents equivalent hours of full sun (1000 W/m2) per day.
                  US ranges: 3-4 (Seattle, NE), 5-6 (central), 6-7+ (Southwest).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <InputField
          label=""
          value={inputs.peakSunHours}
          onChange={(value) => setInputs({ peakSunHours: Number(value) })}
          type="number"
          unit="hours/day"
          placeholder="5"
          step="0.1"
          validation={getFieldValidation('peakSunHours')}
          required
        />
        <p className="text-xs text-muted-foreground">
          Typical US range: 3-7 hours. Check NREL PVWatts for your location.
        </p>
      </div>

      {/* Panel Wattage */}
      <div className="space-y-2">
        <InputField
          label="Panel Wattage"
          value={inputs.panelWattage}
          onChange={(value) => setInputs({ panelWattage: Number(value) })}
          type="number"
          unit="W"
          placeholder="400"
          validation={getFieldValidation('panelWattage')}
          required
        />
        <p className="text-xs text-muted-foreground">
          Individual panel rating (Wp). Modern panels: 300-450W
        </p>
      </div>

      {/* Panel Efficiency */}
      <div className="space-y-2">
        <InputField
          label="Panel Efficiency"
          value={inputs.panelEfficiency}
          onChange={(value) => setInputs({ panelEfficiency: Number(value) })}
          type="number"
          unit=""
          placeholder="0.20"
          step="0.01"
          validation={getFieldValidation('panelEfficiency')}
        />
        <p className="text-xs text-muted-foreground">
          Typical mono: 18-22%, poly: 15-17%, thin-film: 10-12%
        </p>
      </div>

      {/* Performance Ratio */}
      <div className="space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>
              Performance Ratio (PR)
              <span className="text-destructive ml-1">*</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Performance Ratio accounts for all system losses: temperature, soiling,
                    shading, wiring, inverter efficiency, and module mismatch.
                    Typical range: 0.70-0.85 for grid-tied systems.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-sm font-medium">
            {(inputs.performanceRatio * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          value={[inputs.performanceRatio]}
          onValueChange={([value]) => setInputs({ performanceRatio: value })}
          min={0.5}
          max={1.0}
          step={0.01}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>50% (High losses)</span>
          <span className="font-medium text-primary">75% typical</span>
          <span>100% (Ideal)</span>
        </div>
        {validation?.warnings.find((w) => w.field === 'performanceRatio') && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {validation.warnings.find((w) => w.field === 'performanceRatio')?.message}
          </p>
        )}
      </div>
    </div>
  )
}
