'use client'

import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NEC_CLASSIFICATION_CONSTRAINTS } from '@/lib/calculations/generator-sizing/generatorData'
import type { DutyType, Phases, Frequency, FuelType, NecClassification } from '@/types/generator-sizing'

export default function GeneratorInputForm() {
  const { generatorConfig, setGeneratorConfig, fuelConfig, setFuelConfig } = useGeneratorSizingStore()

  const handleNecChange = (value: string) => {
    if (value === 'none') {
      setGeneratorConfig({ necClassification: null })
      return
    }
    const nec = value as NecClassification
    setGeneratorConfig({ necClassification: nec })
    // Pre-fill fuel runtime from NEC constraints
    const constraints = NEC_CLASSIFICATION_CONSTRAINTS[nec]
    if (constraints.minFuelDurationHours) {
      setFuelConfig({ requiredRuntime: constraints.minFuelDurationHours })
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Duty Type */}
      <div className="space-y-1.5">
        <Label htmlFor="dutyType">Duty Type</Label>
        <Select
          value={generatorConfig.dutyType}
          onValueChange={(v) => setGeneratorConfig({ dutyType: v as DutyType })}
        >
          <SelectTrigger id="dutyType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standby">Standby (100% loading)</SelectItem>
            <SelectItem value="prime">Prime / Continuous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prime Loading Limit (only for prime) */}
      {generatorConfig.dutyType === 'prime' && (
        <div className="space-y-1.5">
          <Label htmlFor="primeLimit">Prime Loading Limit (%)</Label>
          <Input
            id="primeLimit"
            type="number"
            min={50}
            max={100}
            value={Math.round(generatorConfig.primeLoadingLimit * 100)}
            onChange={(e) =>
              setGeneratorConfig({ primeLoadingLimit: Number(e.target.value) / 100 })
            }
          />
        </div>
      )}

      {/* Voltage */}
      <div className="space-y-1.5">
        <Label htmlFor="voltage">System Voltage (V)</Label>
        <Input
          id="voltage"
          type="number"
          min={100}
          value={generatorConfig.voltage}
          onChange={(e) => setGeneratorConfig({ voltage: Number(e.target.value) })}
        />
      </div>

      {/* Phases */}
      <div className="space-y-1.5">
        <Label htmlFor="phases">Phases</Label>
        <Select
          value={generatorConfig.phases}
          onValueChange={(v) => setGeneratorConfig({ phases: v as Phases })}
        >
          <SelectTrigger id="phases">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="three">Three-Phase</SelectItem>
            <SelectItem value="single">Single-Phase</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Frequency */}
      <div className="space-y-1.5">
        <Label htmlFor="frequency">Frequency (Hz)</Label>
        <Select
          value={String(generatorConfig.frequency)}
          onValueChange={(v) => setGeneratorConfig({ frequency: Number(v) as Frequency })}
        >
          <SelectTrigger id="frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="60">60 Hz</SelectItem>
            <SelectItem value="50">50 Hz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subtransient Reactance */}
      <div className="space-y-1.5">
        <Label htmlFor="xd">Xd&apos;&apos; (pu)</Label>
        <Input
          id="xd"
          type="number"
          step={0.01}
          min={0.05}
          max={0.35}
          value={generatorConfig.subtransientReactance}
          onChange={(e) =>
            setGeneratorConfig({ subtransientReactance: Number(e.target.value) })
          }
        />
      </div>

      {/* Fuel Type */}
      <div className="space-y-1.5">
        <Label htmlFor="fuelType">Fuel Type</Label>
        <Select
          value={generatorConfig.fuelType}
          onValueChange={(v) => setGeneratorConfig({ fuelType: v as FuelType })}
        >
          <SelectTrigger id="fuelType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="natural-gas">Natural Gas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NEC Classification */}
      <div className="space-y-1.5">
        <Label htmlFor="necClass">NEC Classification</Label>
        <Select
          value={generatorConfig.necClassification ?? 'none'}
          onValueChange={handleNecChange}
        >
          <SelectTrigger id="necClass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None / Not Applicable</SelectItem>
            <SelectItem value="700">NEC 700 — Emergency (10s, 2hr fuel)</SelectItem>
            <SelectItem value="701">NEC 701 — Legally Required (60s, 2hr fuel)</SelectItem>
            <SelectItem value="702">NEC 702 — Optional Standby</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
