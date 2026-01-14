/**
 * Battery Backup Time Calculations
 *
 * Implements IEEE 485-2020 standard for battery sizing
 * Accuracy target: ±2% per SC-005
 * Performance target: <100ms per calculation
 *
 * @see specs/001-electromate-engineering-app/spec.md#US1
 */

import { math, toBigNumber, toNumber, round, validateRange } from '../mathConfig'
import type { BatteryCalculatorInputs, BatteryCalculatorResult, BatteryWarning } from '../types'

// Memoization cache for calculations
const calculationCache = new Map<string, BatteryCalculatorResult>()
const CACHE_SIZE_LIMIT = 100

/**
 * Generate cache key for memoization
 */
function getCacheKey(inputs: BatteryCalculatorInputs): string {
  return `${inputs.voltage}-${inputs.ampHours}-${inputs.loadWatts}-${inputs.efficiency}-${inputs.agingFactor}`
}

/**
 * Calculate battery backup time with memoization
 *
 * Formula (IEEE 485-2020):
 * Backup Time (hours) = (Voltage × Capacity × Aging Factor × Efficiency) / Load
 *
 * @param inputs Battery calculation inputs
 * @returns Calculation results with backup time, effective capacity, warnings
 */
export function calculateBackupTime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult {
  // Check cache first
  const cacheKey = getCacheKey(inputs)
  const cached = calculationCache.get(cacheKey)
  if (cached) {
    return { ...cached, timestamp: new Date().toISOString() }
  }

  // Validate inputs
  validateInputs(inputs)

  // Use native numbers for better performance, convert to BigNumber only for final precision
  const voltage = inputs.voltage
  const ampHours = inputs.ampHours
  const loadWatts = inputs.loadWatts
  const efficiency = inputs.efficiency
  const agingFactor = inputs.agingFactor

  // Calculate effective capacity (Ah after aging)
  const effectiveCapacityAh = toBigNumber(ampHours * agingFactor)

  // Calculate energy stored (Wh)
  const energyStoredWh = voltage * ampHours * agingFactor

  // Calculate usable energy (Wh after efficiency losses)
  const usableEnergyWh = energyStoredWh * efficiency

  // Calculate backup time (hours) - convert to BigNumber for precision
  const backupTimeHours = toBigNumber(usableEnergyWh / loadWatts)

  // Calculate discharge rate (C-rate)
  const dischargeRate = toBigNumber(loadWatts / (voltage * ampHours))

  // Detect dangerous conditions
  const warnings = detectWarnings(inputs, dischargeRate)

  const result: BatteryCalculatorResult = {
    type: 'battery',
    timestamp: new Date().toISOString(),
    standards: 'IEC',
    inputs,
    backupTimeHours,
    effectiveCapacityAh,
    dischargeRate,
    dischargeCurve: [],
    warnings,
    validations: warnings.map((w) => ({
      severity: w.severity || 'warning',
      field: w.field || 'general',
      message: w.message,
      standardReference: w.standardReference,
      recommendation: w.recommendation,
    })),
  }

  // Cache result (limit cache size)
  if (calculationCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = calculationCache.keys().next().value
    if (firstKey !== undefined) {
      calculationCache.delete(firstKey)
    }
  }
  calculationCache.set(cacheKey, result)

  return result
}

/**
 * Calculate battery discharge rate (C-rate) - optimized
 *
 * @param inputs Battery calculation inputs
 * @returns Discharge rate as C-rate (BigNumber)
 */
export function calculateDischargeRate(inputs: BatteryCalculatorInputs): math.BigNumber {
  // Use native calculation for speed, convert to BigNumber for precision
  const cRate = inputs.loadWatts / (inputs.voltage * inputs.ampHours)
  return toBigNumber(cRate)
}

/**
 * Validate battery inputs - optimized
 */
function validateInputs(inputs: BatteryCalculatorInputs): void {
  if (inputs.voltage < 1 || inputs.voltage > 2000) throw new Error('Invalid voltage')
  if (inputs.ampHours < 1 || inputs.ampHours > 10000) throw new Error('Invalid capacity')
  if (inputs.loadWatts < 1 || inputs.loadWatts > 1000000) throw new Error('Invalid load')
  if (inputs.efficiency < 0.1 || inputs.efficiency > 1.0) throw new Error('Invalid efficiency')
  if (inputs.agingFactor < 0.5 || inputs.agingFactor > 1.0) throw new Error('Invalid aging factor')
}

/**
 * Detect dangerous operating conditions (FR-004) - optimized
 */
function detectWarnings(
  inputs: BatteryCalculatorInputs,
  dischargeRate: math.BigNumber
): BatteryWarning[] {
  const warnings: BatteryWarning[] = []
  const cRate = toNumber(dischargeRate)

  // High discharge rate warning
  if (cRate > 0.2) {
    warnings.push({
      type: 'high-discharge-rate',
      severity: 'warning',
      field: 'loadWatts',
      message: `High discharge rate detected (C/${(1 / cRate).toFixed(1)}). May reduce battery capacity.`,
      standardReference: 'IEEE 485-2020 Section 5.3',
      recommendation: 'Consider increasing battery capacity or reducing load.',
    })
  }

  // End-of-life warning
  if (inputs.agingFactor < 0.8) {
    warnings.push({
      type: 'end-of-life',
      severity: 'error',
      field: 'agingFactor',
      message: `Battery aging factor indicates end-of-life. Replace battery bank.`,
      standardReference: 'IEEE 485-2020 Section 4.2',
      recommendation: 'Replace battery bank to ensure reliable backup power.',
    })
  }

  // Unrealistic efficiency warning
  if (inputs.efficiency < 0.7 || inputs.efficiency > 0.98) {
    warnings.push({
      type: 'unrealistic-efficiency',
      severity: 'warning',
      field: 'efficiency',
      message: `Efficiency ${inputs.efficiency} is outside typical range (0.7-0.98).`,
      standardReference: undefined,
      recommendation: 'Verify system specifications. Typical range: 0.85-0.95.',
    })
  }

  return warnings
}

/**
 * Clear calculation cache (for testing/memory management)
 */
export function clearCalculationCache(): void {
  calculationCache.clear()
}
