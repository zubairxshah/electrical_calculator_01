/**
 * Solar Input Validation
 *
 * Zod schema validation for solar array sizing inputs
 * with real-time validation (<100ms target per SC-002)
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

import { z } from 'zod'
import type { ValidationResult } from '../types'

/**
 * Solar calculator inputs Zod schema
 *
 * Validates:
 * - dailyEnergyKWh: 0.1-100000 kWh/day
 * - peakSunHours: 1-12 hours
 * - panelWattage: 50-1000 W
 * - performanceRatio: 0.5-1.0
 * - panelEfficiency: 0.05-0.30 (5%-30%)
 */
export const solarInputsSchema = z.object({
  dailyEnergyKWh: z
    .number()
    .min(0.1, 'Daily energy must be at least 0.1 kWh')
    .max(100000, 'Daily energy cannot exceed 100,000 kWh'),
  peakSunHours: z
    .number()
    .min(1, 'Peak sun hours must be at least 1 hour')
    .max(12, 'Peak sun hours cannot exceed 12 hours'),
  panelWattage: z
    .number()
    .min(50, 'Panel wattage must be at least 50W')
    .max(1000, 'Panel wattage cannot exceed 1000W'),
  performanceRatio: z
    .number()
    .min(0.5, 'Performance ratio must be at least 0.5')
    .max(1.0, 'Performance ratio cannot exceed 1.0'),
  panelEfficiency: z
    .number()
    .min(0.05, 'Panel efficiency must be at least 5%')
    .max(0.30, 'Panel efficiency cannot exceed 30%')
    .optional()
    .default(0.20), // Default 20% efficiency
  systemVoltage: z
    .number()
    .min(12, 'System voltage must be at least 12V')
    .max(1500, 'System voltage cannot exceed 1500V DC')
    .optional(),
  panelVmp: z
    .number()
    .min(1, 'Panel Vmp must be positive')
    .max(100, 'Panel Vmp cannot exceed 100V')
    .optional(),
  panelImp: z
    .number()
    .min(0.1, 'Panel Imp must be at least 0.1A')
    .max(30, 'Panel Imp cannot exceed 30A')
    .optional(),
  panelVoc: z
    .number()
    .min(1, 'Panel Voc must be positive')
    .max(120, 'Panel Voc cannot exceed 120V')
    .optional(),
  panelIsc: z
    .number()
    .min(0.1, 'Panel Isc must be at least 0.1A')
    .max(35, 'Panel Isc cannot exceed 35A')
    .optional(),
})

export type SolarInputs = z.infer<typeof solarInputsSchema>

/**
 * Solar validation result
 */
export interface SolarValidationResult {
  isValid: boolean
  errors: ValidationResult[]
  warnings: ValidationResult[]
}

/**
 * Validate solar calculator inputs
 *
 * @param inputs Solar calculation inputs
 * @returns Validation result with errors and warnings
 */
export function validateSolarInputs(inputs: Partial<SolarInputs>): SolarValidationResult {
  const errors: ValidationResult[] = []
  const warnings: ValidationResult[] = []

  // Validate against Zod schema
  const parseResult = solarInputsSchema.safeParse(inputs)

  if (!parseResult.success) {
    // Convert Zod errors to ValidationResult format
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

  // Additional warnings for values outside typical ranges
  const data = parseResult.data

  // Performance ratio warnings
  if (data.performanceRatio < 0.6) {
    warnings.push({
      severity: 'warning',
      field: 'performanceRatio',
      message: `Low performance ratio (${data.performanceRatio}). Typical grid-tied systems achieve 0.7-0.85.`,
      standardReference: 'NREL PVWatts',
      recommendation: 'Review system losses. PR <0.6 may indicate significant shading or equipment issues.',
    })
  } else if (data.performanceRatio > 0.9) {
    warnings.push({
      severity: 'warning',
      field: 'performanceRatio',
      message: `High performance ratio (${data.performanceRatio}). Values >0.9 are rare in real installations.`,
      recommendation: 'Use 0.75-0.85 for realistic estimates. Higher values may undersize the system.',
    })
  }

  // Peak sun hours warnings
  if (data.peakSunHours < 3) {
    warnings.push({
      severity: 'info',
      field: 'peakSunHours',
      message: `Low peak sun hours (${data.peakSunHours}). Consider if solar is cost-effective at this location.`,
      recommendation: 'Locations with <3 PSH may have longer payback periods. Consider wind or other alternatives.',
    })
  }

  // Large system warning
  const estimatedPanels = Math.ceil(
    data.dailyEnergyKWh / ((data.panelWattage / 1000) * data.peakSunHours * data.performanceRatio)
  )

  if (estimatedPanels > 100) {
    warnings.push({
      severity: 'info',
      field: 'dailyEnergyKWh',
      message: `Large array requirement (~${estimatedPanels} panels). This is a commercial-scale installation.`,
      recommendation: 'Consider multiple inverters, string configuration, and professional installation.',
    })
  }

  // Panel efficiency warning
  if (data.panelEfficiency && data.panelEfficiency < 0.15) {
    warnings.push({
      severity: 'info',
      field: 'panelEfficiency',
      message: `Low panel efficiency (${(data.panelEfficiency * 100).toFixed(0)}%). Modern panels typically achieve 18-22%.`,
      recommendation: 'Consider higher efficiency panels to reduce required roof/ground area.',
    })
  }

  return {
    isValid: true,
    errors,
    warnings,
  }
}
