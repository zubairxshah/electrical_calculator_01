/**
 * Charge Controller Input Validation
 *
 * Zod schema validation for charge controller selection inputs
 * with real-time validation (<100ms target per SC-002)
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

import { z } from 'zod'
import type { ValidationResult } from '../types'

/**
 * Charge controller inputs Zod schema
 *
 * Validates:
 * - arrayVoc: 1-1500V (solar array open-circuit voltage)
 * - arrayIsc: 0.1-500A (solar array short-circuit current)
 * - batteryVoltage: 12, 24, 48, 96V (standard battery voltages)
 * - arrayMaxPower: 10-100000W (array peak power)
 * - minTemperature: -40 to 25°C (for cold weather V_oc adjustment)
 * - vocTempCoefficient: -0.5% to 0%/°C (V_oc temperature coefficient)
 */
export const chargeControllerInputsSchema = z.object({
  arrayVoc: z
    .number()
    .min(1, 'Array V_oc must be at least 1V')
    .max(1500, 'Array V_oc cannot exceed 1500V'),
  arrayIsc: z
    .number()
    .min(0.1, 'Array I_sc must be at least 0.1A')
    .max(500, 'Array I_sc cannot exceed 500A'),
  batteryVoltage: z
    .number()
    .refine(
      (v) => [12, 24, 48, 96].includes(v),
      'Battery voltage must be 12V, 24V, 48V, or 96V'
    ),
  arrayMaxPower: z
    .number()
    .min(10, 'Array power must be at least 10W')
    .max(100000, 'Array power cannot exceed 100kW'),
  minTemperature: z
    .number()
    .min(-40, 'Minimum temperature cannot be below -40°C')
    .max(25, 'Minimum temperature for cold adjustment should be ≤25°C')
    .optional(),
  vocTempCoefficient: z
    .number()
    .min(-0.005, 'V_oc temperature coefficient cannot be below -0.5%/°C')
    .max(0, 'V_oc temperature coefficient should be negative or zero')
    .optional(),
})

export type ChargeControllerInputs = z.infer<typeof chargeControllerInputsSchema>

/**
 * Charge controller validation result
 */
export interface ChargeControllerValidationResult {
  isValid: boolean
  errors: ValidationResult[]
  warnings: ValidationResult[]
}

/**
 * Validate charge controller inputs
 *
 * @param inputs Charge controller inputs
 * @returns Validation result with errors and warnings
 */
export function validateChargeControllerInputs(
  inputs: Partial<ChargeControllerInputs>
): ChargeControllerValidationResult {
  const errors: ValidationResult[] = []
  const warnings: ValidationResult[] = []

  // Validate against Zod schema
  const parseResult = chargeControllerInputsSchema.safeParse(inputs)

  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push({
        severity: 'error',
        field: issue.path.join('.'),
        message: issue.message,
        standardReference: undefined,
      })
    }

    return {
      isValid: false,
      errors,
      warnings,
    }
  }

  const data = parseResult.data

  // Additional warnings for edge cases

  // High voltage array warning
  if (data.arrayVoc > 600) {
    warnings.push({
      severity: 'warning',
      field: 'arrayVoc',
      message: `Very high array voltage (${data.arrayVoc}V). Ensure controller is rated for this voltage. Consider string inverter for arrays >600V.`,
      standardReference: 'IEC 62109',
      recommendation: 'High-voltage MPPT controllers (>600V input) are specialized equipment.',
    })
  }

  // High current array warning
  if (data.arrayIsc > 100) {
    warnings.push({
      severity: 'info',
      field: 'arrayIsc',
      message: `High array current (${data.arrayIsc}A). Multiple parallel controllers may be needed.`,
      recommendation: 'Consider splitting array into multiple strings with separate controllers.',
    })
  }

  // Voltage ratio check
  const voltageRatio = data.arrayVoc / data.batteryVoltage
  if (voltageRatio > 10) {
    warnings.push({
      severity: 'warning',
      field: 'arrayVoc',
      message: `Large voltage ratio (${voltageRatio.toFixed(1)}:1). High-efficiency MPPT required.`,
      recommendation: 'Select MPPT controller with proven high-voltage conversion efficiency.',
    })
  }

  // Cold weather without temperature coefficient
  if (data.minTemperature !== undefined && data.minTemperature < 0 && data.vocTempCoefficient === undefined) {
    warnings.push({
      severity: 'info',
      field: 'vocTempCoefficient',
      message: 'Cold climate specified but no temperature coefficient provided. Using default -0.3%/°C.',
      recommendation: 'Enter panel V_oc temperature coefficient from datasheet for accurate sizing.',
    })
  }

  // Small system warning
  if (data.arrayMaxPower < 200) {
    warnings.push({
      severity: 'info',
      field: 'arrayMaxPower',
      message: `Small system (${data.arrayMaxPower}W). PWM controller may be cost-effective option.`,
    })
  }

  return {
    isValid: true,
    errors,
    warnings,
  }
}
