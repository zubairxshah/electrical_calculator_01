'use client'

import { useState } from 'react'
import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { VolumeUnit } from '@/types/generator-sizing'

function NumericInput({
  value, onChange, min, max, step,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  const [local, setLocal] = useState<string | null>(null)
  return (
    <Input
      type="number"
      min={min} max={max} step={step}
      value={local !== null ? local : value}
      onFocus={() => setLocal(value === 0 ? '' : String(value))}
      onBlur={() => {
        const p = parseFloat(local ?? '')
        if (!isNaN(p)) onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, p)))
        setLocal(null)
      }}
      onChange={(e) => local !== null ? setLocal(e.target.value) : onChange(Number(e.target.value))}
    />
  )
}

export default function FuelEstimationPanel() {
  const { fuelConfig, setFuelConfig, result } = useGeneratorSizingStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Consumption Estimation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Runtime */}
          <div className="space-y-1.5">
            <Label>Required Runtime (hours)</Label>
            <NumericInput
              min={1}
              value={fuelConfig.requiredRuntime}
              onChange={(v) => setFuelConfig({ requiredRuntime: v })}
            />
          </div>

          {/* Average Loading */}
          <div className="space-y-1.5">
            <Label>Average Loading (%)</Label>
            <NumericInput
              min={30}
              max={100}
              value={fuelConfig.averageLoadingPercent}
              onChange={(v) => setFuelConfig({ averageLoadingPercent: v })}
            />
            <p className="text-xs text-muted-foreground">Min 30% (wet stacking)</p>
          </div>

          {/* Volume Unit */}
          <div className="space-y-1.5">
            <Label>Volume Unit</Label>
            <Select
              value={fuelConfig.volumeUnit}
              onValueChange={(v) => setFuelConfig({ volumeUnit: v as VolumeUnit })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liters">Liters</SelectItem>
                <SelectItem value="gallons">US Gallons</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fuel results */}
        {result?.fuelConsumption && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Consumption Rate</p>
                <p className="text-lg font-semibold">
                  {fuelConfig.volumeUnit === 'liters'
                    ? `${result.fuelConsumption.consumptionRate} L/hr`
                    : `${result.fuelConsumption.consumptionRateImperial} gal/hr`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Fuel Required</p>
                <p className="text-lg font-semibold">
                  {fuelConfig.volumeUnit === 'liters'
                    ? `${result.fuelConsumption.totalFuelRequired} L`
                    : `${result.fuelConsumption.totalFuelRequiredImperial} gal`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reserve (10%)</p>
                <p className="text-lg font-semibold">
                  {fuelConfig.volumeUnit === 'liters'
                    ? `${result.fuelConsumption.reserveVolume} L`
                    : `${(result.fuelConsumption.reserveVolume / 3.78541).toFixed(1)} gal`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Runtime</p>
                <p className="text-lg font-semibold">{result.fuelConsumption.runtimeHours} hr</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              SFC: {result.fuelConsumption.sfcUsed} {result.fuelConsumption.fuelType === 'diesel' ? 'L/kW/hr' : 'm³/kW/hr'} at {result.fuelConsumption.loadingPercent}% loading — per ISO 8528-5
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
