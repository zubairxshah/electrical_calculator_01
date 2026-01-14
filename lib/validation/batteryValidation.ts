/**
 * Battery Input Validation
 *
 * Real-time validation with <100ms target (SC-002)
 * Enhanced with security-focused input validation
 */

import { toBigNumber, toNumber } from '../mathConfig'
import { calculateDischargeRate } from '../calculations/battery'
import { validateVoltage, validateCurrent, validatePower, validateEfficiency, ValidationError } from './inputValidation'
import { handleValidationError } from '../utils/errorHandler'
import type { BatteryCalculatorInputs, ValidationResult } from '../types'

export interface BatteryValidationResult {
  isValid: boolean
  errors: ValidationResult[]
  warnings: ValidationResult[]
}

/**
 * Validate battery calculator inputs with security checks
 *
 * @param inputs Battery calculation inputs
 * @returns Validation result with errors and warnings
 */
export function validateBatteryInputs(inputs: BatteryCalculatorInputs): BatteryValidationResult {
  const errors: ValidationResult[] = []
  const warnings: ValidationResult[] = []

  try {
    // Secure voltage validation
    const voltage = validateVoltage(inputs.voltage)
    if (voltage < 1 || voltage > 2000) {
      errors.push({
        severity: 'error',
        field: 'voltage',
        message: `Voltage must be between 1V and 2000V. Got: ${voltage}V`,
        standardReference: undefined,
      })
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push({
        severity: 'error',
        field: error.field,
        message: error.message,
        standardReference: undefined,
      })
    }
  }

  // Amp-hours validation with security checks
  try {
    if (inputs.ampHours < 1 || inputs.ampHours > 10000) {
      errors.push({
        severity: 'error',
        field: 'ampHours',
        message: `Capacity must be between 1Ah and 10000Ah. Got: ${inputs.ampHours}Ah`,
        standardReference: undefined,
      })
    }
  } catch (error) {
    errors.push({
      severity: 'error',
      field: 'ampHours',
      message: 'Invalid capacity value',
      standardReference: undefined,
    })
  }

  // Secure power validation
  try {
    const power = validatePower(inputs.loadWatts)
    if (power > 1000000) {
      errors.push({
        severity: 'error',
        field: 'loadWatts',
        message: `Load must not exceed 1000000W. Got: ${power}W`,
        standardReference: undefined,
      })
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push({
        severity: 'error',
        field: error.field,
        message: error.message,
        standardReference: undefined,
      })
    }
  }

  // Secure efficiency validation
  try {
    const efficiency = validateEfficiency(inputs.efficiency)
    if (efficiency < 0.1) {
      errors.push({
        severity: 'error',
        field: 'efficiency',
        message: `Efficiency must be at least 0.1 (10%). Got: ${efficiency}`,
        standardReference: undefined,
      })
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push({
        severity: 'error',
        field: error.field,
        message: error.message,
        standardReference: undefined,
      })
    }
  }

  // Only check warnings if no errors
  if (errors.length === 0) {
    // High discharge rate warning
    try {
      const dischargeRate = calculateDischargeRate(inputs)
      const cRate = toNumber(dischargeRate)

      if (cRate > 0.2) {
        warnings.push({
          severity: 'warning',
          field: 'loadWatts',
          message: `High discharge rate (C/${(1 / cRate).toFixed(1)}). May reduce battery capacity.`,
          standardReference: 'IEEE 485-2020 Section 5.3',
          recommendation: 'Consider reducing load or increasing battery capacity.',
        })
      }
    } catch (e) {
      // Ignore calculation errors during validation
    }

    // End-of-life warning
    if (inputs.agingFactor < 0.8) {
      warnings.push({
        severity: 'warning',
        field: 'agingFactor',
        message: 'Battery aging factor indicates end-of-life. Battery replacement recommended.',
        standardReference: 'IEEE 485-2020 Section 4.2',
        recommendation: 'Replace battery bank when capacity drops below 80%.',
      })
    }

    // Unrealistic efficiency warning
    if (inputs.efficiency < 0.7 || inputs.efficiency > 0.98) {
      warnings.push({
        severity: 'warning',
        field: 'efficiency',
        message: `efficiency ${inputs.efficiency} is outside typical range (0.7-0.98).`,
        standardReference: undefined,
        recommendation: 'Verify system specifications. Typical range: 0.85-0.95.',
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
