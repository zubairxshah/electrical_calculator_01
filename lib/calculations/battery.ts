/**
 * Battery Backup Time Calculations
 *
 * Implements IEEE 485-2020 standard for battery sizing
 * Accuracy target: ±2% per SC-005
 *
 * @see specs/001-electromate-engineering-app/spec.md#US1
 */

import { math, toBigNumber, toNumber, round, validateRange } from '../mathConfig'
import type { BatteryCalculatorInputs, BatteryCalculatorResult, BatteryWarning } from '../types'

/**
 * Calculate battery backup time
 *
 * Formula (IEEE 485-2020):
 * Backup Time (hours) = (Voltage × Capacity × Aging Factor × Efficiency) / Load
 *
 * @param inputs Battery calculation inputs
 * @returns Calculation results with backup time, effective capacity, warnings
 */
export function calculateBackupTime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult {
  // Validate inputs
  validateInputs(inputs)

  // Convert to BigNumber for precision
  const voltage = toBigNumber(inputs.voltage)
  const ampHours = toBigNumber(inputs.ampHours)
  const loadWatts = toBigNumber(inputs.loadWatts)
  const efficiency = toBigNumber(inputs.efficiency)
  const agingFactor = toBigNumber(inputs.agingFactor)

  // Calculate effective capacity (Ah after aging)
  const effectiveCapacityAh = math.multiply(ampHours, agingFactor) as math.BigNumber

  // Calculate energy stored (Wh)
  const energyStoredWh = math.multiply(
    math.multiply(voltage, effectiveCapacityAh),
    1
  ) as math.BigNumber

  // Calculate usable energy (Wh after efficiency losses)
  const usableEnergyWh = math.multiply(energyStoredWh, efficiency) as math.BigNumber

  // Calculate backup time (hours)
  const backupTimeHours = math.divide(usableEnergyWh, loadWatts) as math.BigNumber

  // Calculate discharge rate (C-rate)
  const dischargeRate = calculateDischargeRate(inputs)

  // Detect dangerous conditions
  const warnings = detectWarnings(inputs, dischargeRate)

  return {
    type: 'battery',
    timestamp: new Date().toISOString(),
    standards: 'IEC', // Will be determined by UI
    inputs,
    backupTimeHours,
    effectiveCapacityAh,
    dischargeRate,
    dischargeCurve: [], // Will be populated by discharge curve module
    warnings,
    validations: warnings.map((w) => ({
      severity: w.severity || 'warning',
      field: w.field || 'general',
      message: w.message,
      standardReference: w.standardReference,
      recommendation: w.recommendation,
    })),
  }
}

/**
 * Calculate battery discharge rate (C-rate)
 *
 * C-rate = Load / (Voltage × Capacity)
 * Example: C/5 = 0.2 (5-hour discharge rate)
 *
 * @param inputs Battery calculation inputs
 * @returns Discharge rate as C-rate (BigNumber)
 */
export function calculateDischargeRate(inputs: BatteryCalculatorInputs): math.BigNumber {
  const voltage = toBigNumber(inputs.voltage)
  const ampHours = toBigNumber(inputs.ampHours)
  const loadWatts = toBigNumber(inputs.loadWatts)

  // C-rate = Load (W) / (Voltage (V) × Capacity (Ah))
  const batteryPower = math.multiply(voltage, ampHours) as math.BigNumber
  const cRate = math.divide(loadWatts, batteryPower) as math.BigNumber

  return cRate
}

/**
 * Validate battery inputs
 *
 * @param inputs Battery calculation inputs
 * @throws Error if validation fails
 */
function validateInputs(inputs: BatteryCalculatorInputs): void {
  validateRange(toBigNumber(inputs.voltage), 1, 2000, 'voltage')
  validateRange(toBigNumber(inputs.ampHours), 1, 10000, 'ampHours')
  validateRange(toBigNumber(inputs.loadWatts), 1, 1000000, 'loadWatts')
  validateRange(toBigNumber(inputs.efficiency), 0.1, 1.0, 'efficiency')
  validateRange(toBigNumber(inputs.agingFactor), 0.5, 1.0, 'agingFactor')
}

/**
 * Detect dangerous operating conditions (FR-004)
 *
 * @param inputs Battery calculation inputs
 * @param dischargeRate Calculated C-rate
 * @returns Array of warnings
 */
function detectWarnings(
  inputs: BatteryCalculatorInputs,
  dischargeRate: math.BigNumber
): BatteryWarning[] {
  const warnings: BatteryWarning[] = []

  // High discharge rate warning (IEEE 485 Section 5.3)
  const cRate = toNumber(dischargeRate)
  if (cRate > 0.2) {
    warnings.push({
      type: 'high-discharge-rate',
      severity: 'warning',
      field: 'loadWatts',
      message: `High discharge rate detected (C/${(1 / cRate).toFixed(1)}). Discharge rates exceeding C/5 (0.2) may significantly reduce battery capacity and lifespan.`,
      standardReference: 'IEEE 485-2020 Section 5.3',
      recommendation: 'Consider increasing battery capacity or reducing load to achieve C/10 (0.1) or lower discharge rate.',
    })
  }

  // End-of-life warning
  if (inputs.agingFactor < 0.8) {
    warnings.push({
      type: 'end-of-life',
      severity: 'error',
      field: 'agingFactor',
      message: `Battery aging factor (${inputs.agingFactor}) indicates end-of-life. Batteries with capacity below 80% of rated should be replaced.`,
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
      message: `System efficiency (${inputs.efficiency}) is outside typical range (0.7-0.98). Verify inverter/converter specifications.`,
      standardReference: undefined,
      recommendation: 'Typical DC-DC converter efficiency: 0.85-0.95. Typical AC inverter efficiency: 0.90-0.95.',
    })
  }

  return warnings
}
