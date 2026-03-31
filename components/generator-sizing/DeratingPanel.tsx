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
import { mToFt, ftToM, cToF, fToC } from '@/lib/calculations/generator-sizing/generatorData'
import type { AltitudeUnit, TempUnit } from '@/types/generator-sizing'

function NumericInput({
  value, onChange, min, max, step, className,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string
}) {
  const [local, setLocal] = useState<string | null>(null)
  return (
    <Input
      type="number"
      min={min} max={max} step={step} className={className}
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

export default function DeratingPanel() {
  const { siteConditions, setSiteConditions, result } = useGeneratorSizingStore()

  const displayAltitude = siteConditions.altitudeUnit === 'ft'
    ? Math.round(mToFt(siteConditions.altitude))
    : siteConditions.altitude

  const displayTemp = siteConditions.temperatureUnit === 'F'
    ? Math.round(cToF(siteConditions.ambientTemperature) * 10) / 10
    : siteConditions.ambientTemperature

  const handleAltitudeChange = (value: number) => {
    const meters = siteConditions.altitudeUnit === 'ft' ? ftToM(value) : value
    setSiteConditions({ altitude: meters })
  }

  const handleTempChange = (value: number) => {
    const celsius = siteConditions.temperatureUnit === 'F' ? fToC(value) : value
    setSiteConditions({ ambientTemperature: celsius })
  }

  const handleAltitudeUnitChange = (unit: AltitudeUnit) => {
    setSiteConditions({ altitudeUnit: unit })
  }

  const handleTempUnitChange = (unit: TempUnit) => {
    setSiteConditions({ temperatureUnit: unit })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Conditions & Derating (ISO 8528-1)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Altitude */}
          <div className="space-y-1.5">
            <Label>Altitude</Label>
            <div className="flex gap-1">
              <NumericInput
                min={0}
                value={displayAltitude}
                onChange={handleAltitudeChange}
                className="flex-1"
              />
              <Select
                value={siteConditions.altitudeUnit}
                onValueChange={(v) => handleAltitudeUnitChange(v as AltitudeUnit)}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Derating above 1000m / 3281ft</p>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <Label>Ambient Temperature</Label>
            <div className="flex gap-1">
              <NumericInput
                min={-40}
                max={60}
                step={0.5}
                value={displayTemp}
                onChange={handleTempChange}
                className="flex-1"
              />
              <Select
                value={siteConditions.temperatureUnit}
                onValueChange={(v) => handleTempUnitChange(v as TempUnit)}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">°C</SelectItem>
                  <SelectItem value="F">°F</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Derating above 25°C / 77°F</p>
          </div>
        </div>

        {/* Derating results */}
        {result && result.deratingFactor < 1 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Altitude Factor</p>
              <p className="text-lg font-semibold">{result.altitudeDeratingFactor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temperature Factor</p>
              <p className="text-lg font-semibold">{result.temperatureDeratingFactor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Combined Factor</p>
              <p className="text-lg font-semibold text-orange-600">{result.deratingFactor}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
