'use client'

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
            <Input
              type="number"
              min={1}
              value={fuelConfig.requiredRuntime}
              onChange={(e) => setFuelConfig({ requiredRuntime: Number(e.target.value) })}
            />
          </div>

          {/* Average Loading */}
          <div className="space-y-1.5">
            <Label>Average Loading (%)</Label>
            <Input
              type="number"
              min={30}
              max={100}
              value={fuelConfig.averageLoadingPercent}
              onChange={(e) => setFuelConfig({ averageLoadingPercent: Number(e.target.value) })}
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
