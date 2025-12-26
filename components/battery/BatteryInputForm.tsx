/**
 * Battery Input Form Component
 *
 * Form inputs with real-time validation
 */

'use client'

import { useBatteryStore } from '@/stores/useBatteryStore'
import { InputField } from '@/components/shared/InputField'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function BatteryInputForm() {
  const { inputs, setInputs, validation } = useBatteryStore()

  const getFieldValidation = (field: string) => {
    if (!validation) return undefined
    const error = validation.errors.find((e) => e.field === field)
    const warning = validation.warnings.find((w) => w.field === field)
    const result = error || warning
    if (!result) return undefined
    // Adapt ValidationResult to FieldValidation interface expected by InputField
    return {
      ...result,
      isValid: !error, // If there's an error, it's not valid
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
      {/* Voltage */}
      <InputField
        label="System Voltage"
        value={inputs.voltage}
        onChange={(value) => setInputs({ voltage: Number(value) })}
        type="number"
        unit="V"
        placeholder="48"
        validation={getFieldValidation('voltage')}
        required
      />

      {/* Amp Hours */}
      <InputField
        label="Battery Capacity"
        value={inputs.ampHours}
        onChange={(value) => setInputs({ ampHours: Number(value) })}
        type="number"
        unit="Ah"
        placeholder="200"
        validation={getFieldValidation('ampHours')}
        required
      />

      {/* Load Watts */}
      <InputField
        label="Load Power"
        value={inputs.loadWatts}
        onChange={(value) => setInputs({ loadWatts: Number(value) })}
        type="number"
        unit="W"
        placeholder="2000"
        validation={getFieldValidation('loadWatts')}
        required
      />

      {/* Efficiency */}
      <InputField
        label="System Efficiency"
        value={inputs.efficiency}
        onChange={(value) => setInputs({ efficiency: Number(value) })}
        type="number"
        unit=""
        placeholder="0.9"
        step="0.01"
        validation={getFieldValidation('efficiency')}
        required
      />

      {/* Aging Factor */}
      <InputField
        label="Battery Aging Factor"
        value={inputs.agingFactor}
        onChange={(value) => setInputs({ agingFactor: Number(value) })}
        type="number"
        unit=""
        placeholder="0.8"
        step="0.01"
        validation={getFieldValidation('agingFactor')}
        required
      />

      {/* Battery Chemistry */}
      <div className="space-y-2">
        <Label>
          Battery Chemistry
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={inputs.chemistry}
          onValueChange={(value) =>
            setInputs({ chemistry: value as typeof inputs.chemistry })
          }
        >
          <SelectTrigger className="h-12 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VRLA-AGM">VRLA AGM (Sealed Lead-Acid)</SelectItem>
            <SelectItem value="VRLA-Gel">VRLA Gel (Sealed Lead-Acid)</SelectItem>
            <SelectItem value="FLA">FLA (Flooded Lead-Acid)</SelectItem>
            <SelectItem value="LiFePO4">LiFePO4 (Lithium Iron Phosphate)</SelectItem>
            <SelectItem value="Li-ion">Li-ion (Lithium-Ion)</SelectItem>
            <SelectItem value="NiCd">NiCd (Nickel-Cadmium)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select battery chemistry for accurate discharge characteristics
        </p>
      </div>
    </div>
  )
}
