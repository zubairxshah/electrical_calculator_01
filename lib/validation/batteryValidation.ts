/**
 * Battery Input Validation
 *
 * Real-time validation with <100ms target (SC-002). Mode-aware (runtime vs
 * sizing) and chemistry-aware (limits drawn from batteryTypes.ts).
 * (feature 011-battery-revamp, ADR-006.)
 */

import { validateVoltage, validatePower, validateEfficiency, ValidationError } from './inputValidation'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import type { BatteryCalculatorInputs, ValidationResult } from '@/lib/types'

export interface BatteryValidationResult {
  isValid: boolean
  errors: ValidationResult[]
  warnings: ValidationResult[]
}

export function validateBatteryInputs(inputs: BatteryCalculatorInputs): BatteryValidationResult {
  const errors: ValidationResult[] = []
  const warnings: ValidationResult[] = []
  const mode = inputs.mode ?? 'runtime'

  // Voltage
  try {
    const voltage = validateVoltage(inputs.voltage)
    if (voltage < 1 || voltage > 2000) {
      errors.push({ severity: 'error', field: 'voltage', message: `Voltage must be between 1V and 2000V. Got: ${voltage}V` })
    }
  } catch (error) {
    if (error instanceof ValidationError) errors.push({ severity: 'error', field: error.field, message: error.message })
  }

  // Load
  try {
    const power = validatePower(inputs.loadWatts)
    if (power > 1000000) {
      errors.push({ severity: 'error', field: 'loadWatts', message: `Load must not exceed 1000000W. Got: ${power}W` })
    }
  } catch (error) {
    if (error instanceof ValidationError) errors.push({ severity: 'error', field: error.field, message: error.message })
  }

  // Mode-conditional required field
  if (mode === 'runtime') {
    if (inputs.ampHours == null) {
      errors.push({ severity: 'error', field: 'ampHours', message: 'Installed capacity (Ah) is required in runtime mode.' })
    } else if (inputs.ampHours < 1 || inputs.ampHours > 10000) {
      errors.push({ severity: 'error', field: 'ampHours', message: `Capacity must be between 1Ah and 10000Ah. Got: ${inputs.ampHours}Ah` })
    }
  } else {
    if (inputs.targetBackupHours == null) {
      errors.push({ severity: 'error', field: 'targetBackupHours', message: 'Target backup time (h) is required in sizing mode.' })
    } else if (inputs.targetBackupHours <= 0 || inputs.targetBackupHours > 240) {
      errors.push({ severity: 'error', field: 'targetBackupHours', message: `Target backup time must be between 0 and 240h. Got: ${inputs.targetBackupHours}h` })
    }
  }

  // Efficiency (optional override)
  if (inputs.efficiency != null) {
    try {
      const efficiency = validateEfficiency(inputs.efficiency)
      if (efficiency < 0.1) {
        errors.push({ severity: 'error', field: 'efficiency', message: `Efficiency must be at least 0.1 (10%). Got: ${efficiency}` })
      } else if (efficiency < 0.6 || efficiency > 0.99) {
        warnings.push({ severity: 'warning', field: 'efficiency', message: `Efficiency ${efficiency} is outside the typical range (0.6–0.99).`, recommendation: 'Verify the system/round-trip efficiency.' })
      }
    } catch (error) {
      if (error instanceof ValidationError) errors.push({ severity: 'error', field: error.field, message: error.message })
    }
  }

  // Chemistry-aware warnings (only when no blocking errors)
  if (errors.length === 0) {
    const profile = getBatteryTypeById(toCanonicalChemistry(inputs.chemistry))
    if (profile) {
      const temp = inputs.temperature ?? 25
      if (temp < profile.temperature.operating.min || temp > profile.temperature.operating.max) {
        errors.push({
          severity: 'error',
          field: 'temperature',
          message: `Operating temperature ${temp}°C is outside ${profile.name}'s rated range (${profile.temperature.operating.min}…${profile.temperature.operating.max}°C).`,
          standardReference: 'IEEE 485-2020 §6',
        })
      }

      if (inputs.dodOverride != null && inputs.dodOverride > profile.depthOfDischarge.maximum / 100) {
        warnings.push({
          severity: 'warning',
          field: 'dodOverride',
          message: `Requested DoD exceeds ${profile.name}'s maximum (${profile.depthOfDischarge.maximum}%); it will be clamped.`,
          standardReference: 'IEEE 485-2020 §5',
          recommendation: 'Deep discharge beyond the recommended limit shortens cycle life.',
        })
      }

      // High discharge rate (runtime mode, capacity known)
      if (mode === 'runtime' && inputs.ampHours) {
        const cRate = inputs.loadWatts / (inputs.voltage * inputs.ampHours)
        const safe = profile.category === 'Lithium-Ion' ? 1.0 : 0.25
        if (cRate > safe) {
          warnings.push({
            severity: 'warning',
            field: 'loadWatts',
            message: `High discharge rate (C/${(1 / cRate).toFixed(1)}). Capacity is Peukert-derated for this rate.`,
            standardReference: 'IEEE 485-2020 §5.3',
            recommendation: 'Consider increasing capacity or reducing load.',
          })
        }
      }

      const aging = inputs.agingFactor ?? 0.8
      if (aging < 0.8) {
        warnings.push({
          severity: 'warning',
          field: 'agingFactor',
          message: 'Aging factor below 0.8 indicates end-of-life. Battery replacement recommended.',
          standardReference: 'IEEE 485-2020 §4.2',
          recommendation: 'Replace the battery bank when capacity drops below 80%.',
        })
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}
