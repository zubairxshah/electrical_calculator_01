/**
 * Solar Array Sizing Calculator
 *
 * Calculates required solar panel count and array specifications
 * based on daily energy requirements and location-specific solar resources.
 *
 * Formula: Panels = Daily_kWh / (Panel_kW × PSH × PR)
 *
 * References:
 * - NREL Solar Resource Standards
 * - IEC 61215 (Photovoltaic modules)
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

import { math, toBigNumber, toNumber } from '../../mathConfig'
import type { ValidationResult } from '../../types'

/**
 * Solar calculator input parameters
 */
export interface SolarCalculatorInputs {
  /** Target daily energy requirement (kWh/day) - Range: 0.1-100000 */
  dailyEnergyKWh: number
  /** Peak Sun Hours at location (hours/day) - Range: 1-12 */
  peakSunHours: number
  /** Individual panel power rating (Wp) - Range: 50-1000 */
  panelWattage: number
  /** System performance ratio (0.5-1.0, typical: 0.75-0.85) */
  performanceRatio: number
  /** Panel efficiency (0.05-0.30, typical: 0.18-0.22) */
  panelEfficiency: number
  /** System voltage (V DC, optional for array configuration) */
  systemVoltage?: number
  /** Panel Vmp - voltage at max power (V, optional) */
  panelVmp?: number
  /** Panel Imp - current at max power (A, optional) */
  panelImp?: number
  /** Panel Voc - open circuit voltage (V, optional) */
  panelVoc?: number
  /** Panel Isc - short circuit current (A, optional) */
  panelIsc?: number
}

/**
 * Solar calculator result
 */
export interface SolarCalculatorResult {
  /** Number of panels required (rounded up) */
  requiredPanels: number
  /** Total array power (kWp) */
  totalArrayPowerKWp: math.BigNumber
  /** Estimated daily generation (kWh/day) */
  estimatedDailyGenKWh: math.BigNumber
  /** Estimated annual generation (kWh/year) */
  estimatedAnnualGenKWh: math.BigNumber
  /** Required roof/ground area (m²) */
  arrayAreaM2: math.BigNumber
  /** Array open circuit voltage (V) - if panel specs provided */
  arrayVoc?: math.BigNumber
  /** Array short circuit current (A) - if panel specs provided */
  arrayIsc?: math.BigNumber
  /** Validation warnings */
  warnings: SolarWarning[]
  /** Standards used in calculation */
  standardsUsed: string[]
  /** Input parameters for reference */
  inputs: SolarCalculatorInputs
}

/**
 * Solar-specific warning types
 */
export type SolarWarningType =
  | 'low-performance-ratio'
  | 'high-performance-ratio'
  | 'low-psh'
  | 'high-psh'
  | 'large-array'

/**
 * Solar warning with type
 */
export interface SolarWarning extends ValidationResult {
  type: SolarWarningType
}

/**
 * Performance ratio loss factors
 */
export interface PerformanceRatioLosses {
  /** Temperature loss (0-0.25, typical 0.05-0.15) */
  temperatureLoss?: number
  /** Soiling loss (0-0.15, typical 0.02-0.05) */
  soilingLoss?: number
  /** Shading loss (0-0.20, typical 0-0.05) */
  shadingLoss?: number
  /** DC wiring losses (0-0.05, typical 0.01-0.03) */
  wiringLoss?: number
  /** Inverter efficiency (0.90-0.99, typical 0.95-0.98) */
  inverterEfficiency?: number
  /** Module mismatch loss (0-0.05, typical 0.01-0.03) */
  mismatchLoss?: number
}

/**
 * Validate solar calculator inputs
 *
 * @param inputs Solar calculation inputs
 * @throws Error if inputs are invalid
 */
function validateInputs(inputs: SolarCalculatorInputs): void {
  if (inputs.dailyEnergyKWh < 0.1 || inputs.dailyEnergyKWh > 100000) {
    throw new Error('dailyEnergyKWh must be between 0.1 and 100000')
  }

  if (inputs.peakSunHours < 1 || inputs.peakSunHours > 12) {
    throw new Error('peakSunHours must be between 1 and 12')
  }

  if (inputs.panelWattage < 50 || inputs.panelWattage > 1000) {
    throw new Error('panelWattage must be between 50 and 1000')
  }

  if (inputs.performanceRatio < 0.5 || inputs.performanceRatio > 1.0) {
    throw new Error('performanceRatio must be between 0.5 and 1.0')
  }

  if (inputs.panelEfficiency < 0.05 || inputs.panelEfficiency > 0.30) {
    throw new Error('panelEfficiency must be between 0.05 and 0.30')
  }
}

/**
 * Calculate required solar array size
 *
 * Uses NREL methodology: Panels = Daily_kWh / (Panel_kW × PSH × PR)
 *
 * @param inputs Solar calculation inputs
 * @returns Calculation results with panel count and specifications
 */
export function calculateSolarArraySize(inputs: SolarCalculatorInputs): SolarCalculatorResult {
  // Validate inputs first
  validateInputs(inputs)

  const warnings: SolarWarning[] = []

  // Convert to BigNumber for precision
  const dailyEnergy = toBigNumber(inputs.dailyEnergyKWh)
  const psh = toBigNumber(inputs.peakSunHours)
  const panelKW = toBigNumber(inputs.panelWattage).div(1000)
  const pr = toBigNumber(inputs.performanceRatio)
  const efficiency = toBigNumber(inputs.panelEfficiency)

  // Formula: Panels = Daily_kWh / (Panel_kW × PSH × PR)
  const panelCapacity = panelKW.mul(psh).mul(pr)
  const requiredPanelsExact = dailyEnergy.div(panelCapacity)
  const requiredPanels = Math.ceil(toNumber(requiredPanelsExact))

  // Calculate total array power
  const totalArrayPowerKWp = toBigNumber(requiredPanels).mul(panelKW)

  // Calculate estimated daily generation
  // Gen = Total_kWp × PSH × PR
  const estimatedDailyGenKWh = totalArrayPowerKWp.mul(psh).mul(pr)

  // Calculate estimated annual generation
  const estimatedAnnualGenKWh = estimatedDailyGenKWh.mul(365)

  // Calculate panel area
  // Panel area = Panel_Watts / (1000 W/m² × efficiency)
  // 1000 W/m² is standard test condition irradiance
  const panelAreaM2 = toBigNumber(inputs.panelWattage).div(toBigNumber(1000).mul(efficiency))
  const arrayAreaM2 = panelAreaM2.mul(requiredPanels)

  // Calculate array electrical specs if panel specs provided
  let arrayVoc: math.BigNumber | undefined
  let arrayIsc: math.BigNumber | undefined

  if (inputs.panelVoc && inputs.systemVoltage) {
    // For series calculation (simplified - assumes all panels in series)
    arrayVoc = toBigNumber(inputs.panelVoc).mul(requiredPanels)
  }

  if (inputs.panelIsc) {
    // For single string
    arrayIsc = toBigNumber(inputs.panelIsc)
  }

  // Check for warnings
  // Performance ratio warnings
  if (inputs.performanceRatio < 0.6) {
    warnings.push({
      type: 'low-performance-ratio',
      severity: 'warning',
      field: 'performanceRatio',
      message: `Low performance ratio (${inputs.performanceRatio}). Typical grid-tied systems achieve 0.7-0.85.`,
      recommendation: 'Review system losses. PR <0.6 may indicate significant shading or equipment issues.',
    })
  } else if (inputs.performanceRatio > 0.9) {
    warnings.push({
      type: 'high-performance-ratio',
      severity: 'warning',
      field: 'performanceRatio',
      message: `High performance ratio (${inputs.performanceRatio}). Values >0.9 are rare in real installations.`,
      recommendation: 'Use 0.75-0.85 for realistic estimates. Higher values may undersize the system.',
    })
  }

  // PSH warnings
  if (inputs.peakSunHours < 3) {
    warnings.push({
      type: 'low-psh',
      severity: 'info',
      field: 'peakSunHours',
      message: `Low peak sun hours (${inputs.peakSunHours}). Consider if solar is cost-effective.`,
      recommendation: 'Locations with <3 PSH may have longer payback periods.',
    })
  } else if (inputs.peakSunHours > 7) {
    warnings.push({
      type: 'high-psh',
      severity: 'info',
      field: 'peakSunHours',
      message: `High peak sun hours (${inputs.peakSunHours}). Excellent solar resource.`,
    })
  }

  // Large array warning
  if (requiredPanels > 100) {
    warnings.push({
      type: 'large-array',
      severity: 'info',
      field: 'requiredPanels',
      message: `Large array (${requiredPanels} panels). Consider commercial-grade inverters and multiple strings.`,
      recommendation: 'Consult with a certified solar installer for systems >30 kWp.',
    })
  }

  return {
    requiredPanels,
    totalArrayPowerKWp,
    estimatedDailyGenKWh,
    estimatedAnnualGenKWh,
    arrayAreaM2,
    arrayVoc,
    arrayIsc,
    warnings,
    standardsUsed: ['NREL', 'IEC 61215'],
    inputs,
  }
}

/**
 * Calculate performance ratio from individual loss factors
 *
 * PR = (1 - temp) × (1 - soiling) × (1 - shading) × (1 - wiring) × inverterEff × (1 - mismatch)
 *
 * @param losses Individual loss factors
 * @returns Performance ratio (0-1)
 */
export function calculatePerformanceRatio(losses: PerformanceRatioLosses): number {
  // Default values based on NREL typical system
  const temp = losses.temperatureLoss ?? 0.08
  const soiling = losses.soilingLoss ?? 0.03
  const shading = losses.shadingLoss ?? 0.02
  const wiring = losses.wiringLoss ?? 0.02
  const inverter = losses.inverterEfficiency ?? 0.96
  const mismatch = losses.mismatchLoss ?? 0.02

  // If no losses specified, return default PR
  if (Object.keys(losses).length === 0) {
    return 0.75 // Default PR for grid-tied systems
  }

  // Calculate PR as product of all factors
  const pr =
    (1 - temp) * (1 - soiling) * (1 - shading) * (1 - wiring) * inverter * (1 - mismatch)

  return pr
}

// Re-export for convenience
export { math, toBigNumber, toNumber }
