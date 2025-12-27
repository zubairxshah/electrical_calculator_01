/**
 * Charge Controller Selection Calculator
 *
 * Recommends MPPT or PWM charge controllers based on solar array
 * specifications with appropriate safety margins.
 *
 * Safety Requirements (FR-013):
 * - Controller V_oc rating >= 125% of array V_oc
 * - Controller I_sc rating >= 120-125% of array I_sc
 * - MPPT recommended when voltage mismatch >20%
 *
 * References:
 * - IEC 62109 (Safety of power converters for PV)
 * - Manufacturer guidelines for safety margins
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

import { math, toBigNumber, toNumber } from '../../mathConfig'
import type { ValidationResult } from '../../types'

/**
 * Charge controller types
 */
export type ControllerType = 'MPPT' | 'PWM'

/**
 * Charge controller input parameters
 */
export interface ChargeControllerInputs {
  /** Array open-circuit voltage at STC (V) */
  arrayVoc: number
  /** Array short-circuit current (A) */
  arrayIsc: number
  /** Battery bank nominal voltage (V) - typically 12, 24, 48 */
  batteryVoltage: number
  /** Array maximum power (W) */
  arrayMaxPower: number
  /** Minimum expected temperature (°C) - for V_oc temperature correction */
  minTemperature?: number
  /** V_oc temperature coefficient (%/°C, negative value, e.g., -0.003) */
  vocTempCoefficient?: number
}

/**
 * Recommended controller specification
 */
export interface ControllerRecommendation {
  /** Controller type */
  type: ControllerType
  /** Current rating (A) */
  currentRating: number
  /** Maximum input voltage (V) */
  maxInputVoltage: number
  /** Battery voltage compatibility */
  batteryVoltages: number[]
  /** Estimated efficiency (%) */
  efficiency: number
  /** Suitability score (1-5) */
  suitabilityScore: number
  /** Notes/recommendations */
  notes: string
}

/**
 * Charge controller calculation result
 */
export interface ChargeControllerResult {
  /** Minimum required V_oc rating (V) */
  minimumVocRating: number
  /** Minimum required I_sc rating (A) */
  minimumIscRating: number
  /** V_oc safety margin applied */
  vocSafetyMargin: number
  /** I_sc safety margin applied */
  iscSafetyMargin: number
  /** Cold weather adjusted V_oc (if temperature provided) */
  coldWeatherVoc?: number
  /** Recommended controller type */
  recommendedType: ControllerType
  /** Voltage mismatch ratio */
  voltageMismatch: number
  /** MPPT efficiency gain over PWM (%) */
  mpptEfficiencyGain: number
  /** Explanation of recommendation */
  explanation: string
  /** List of recommended controllers */
  recommendedControllers: ControllerRecommendation[]
  /** Validation warnings */
  warnings: ChargeControllerWarning[]
  /** Standards used */
  standardsUsed: string[]
  /** Input parameters */
  inputs: ChargeControllerInputs
}

/**
 * Controller-specific warning types
 */
export type ChargeControllerWarningType =
  | 'high-voltage-array'
  | 'oversized-array'
  | 'temperature-derate'
  | 'pwm-inefficient'

/**
 * Controller warning
 */
export interface ChargeControllerWarning extends ValidationResult {
  type: ChargeControllerWarningType
}

/**
 * Safety margin calculation result
 */
export interface SafetyMargins {
  vocMargin: number
  iscMargin: number
  minVocRating: number
  minIscRating: number
}

/**
 * Controller type recommendation result
 */
export interface ControllerTypeRecommendation {
  recommendedType: ControllerType
  voltageMismatch: number
  mpptEfficiencyGain: number
  explanation: string
}

// Standard controller sizes (A)
const STANDARD_CURRENT_RATINGS = [10, 20, 30, 40, 50, 60, 80, 100, 150, 200]

// Standard MPPT voltage ratings (V)
const STANDARD_VOLTAGE_RATINGS = [100, 150, 200, 250, 300, 450, 600]

/**
 * Validate charge controller inputs
 */
function validateInputs(inputs: ChargeControllerInputs): void {
  if (inputs.arrayVoc <= 0) {
    throw new Error('arrayVoc must be positive')
  }
  if (inputs.arrayIsc <= 0) {
    throw new Error('arrayIsc must be positive')
  }
  if (inputs.batteryVoltage <= 0) {
    throw new Error('batteryVoltage must be positive')
  }
  if (inputs.arrayMaxPower <= 0) {
    throw new Error('arrayMaxPower must be positive')
  }
}

/**
 * Calculate safety margins for V_oc and I_sc
 *
 * @param arrayVoc Array open-circuit voltage (V)
 * @param arrayIsc Array short-circuit current (A)
 * @returns Safety margins and minimum ratings
 */
export function calculateSafetyMargins(arrayVoc: number, arrayIsc: number): SafetyMargins {
  // Standard safety margins per FR-013 and industry practice
  const vocMargin = 0.25 // 25% V_oc safety margin
  const iscMargin = 0.25 // 25% I_sc safety margin

  const minVocRating = arrayVoc * (1 + vocMargin)
  const minIscRating = arrayIsc * (1 + iscMargin)

  return {
    vocMargin,
    iscMargin,
    minVocRating,
    minIscRating,
  }
}

/**
 * Recommend MPPT vs PWM controller type
 *
 * MPPT is recommended when:
 * - Voltage mismatch >20% (array Vmp significantly higher than battery voltage)
 * - High-voltage arrays (>100V)
 * - Maximum power extraction is critical
 *
 * PWM is acceptable when:
 * - Array Vmp is close to battery charging voltage
 * - Cost is primary concern
 * - Simple systems with minimal mismatch
 *
 * @param arrayVoc Array open-circuit voltage (V)
 * @param batteryVoltage Battery nominal voltage (V)
 * @returns Controller type recommendation
 */
export function recommendControllerType(
  arrayVoc: number,
  batteryVoltage: number
): ControllerTypeRecommendation {
  // Estimate Vmp as ~80% of Voc (typical for silicon cells)
  const estimatedVmp = arrayVoc * 0.8

  // Calculate voltage mismatch ratio
  // For PWM, array Vmp should be close to battery charging voltage (~14.4V for 12V, ~28.8V for 24V, ~57.6V for 48V)
  const batteryChargingVoltage = batteryVoltage * 1.2 // Approximate charging voltage
  const voltageMismatch = Math.abs(estimatedVmp - batteryChargingVoltage) / batteryChargingVoltage

  // MPPT efficiency gain calculation
  // MPPT can harvest power at Vmp regardless of battery voltage
  // PWM clamps array voltage to battery voltage, losing power if Vmp >> battery voltage
  const pwmEfficiency = batteryVoltage / estimatedVmp // Fraction of power captured by PWM
  const mpptEfficiency = 0.95 // Typical MPPT efficiency
  const mpptEfficiencyGain = ((mpptEfficiency / Math.min(pwmEfficiency, 1)) - 1) * 100

  // Decision logic
  let recommendedType: ControllerType
  let explanation: string

  if (voltageMismatch > 0.20 || arrayVoc > 100) {
    recommendedType = 'MPPT'
    explanation = `MPPT recommended: ${
      voltageMismatch > 0.20
        ? `Voltage mismatch of ${(voltageMismatch * 100).toFixed(0)}% exceeds 20% threshold.`
        : `High array voltage (${arrayVoc}V) benefits from MPPT conversion.`
    } Expected ${mpptEfficiencyGain.toFixed(0)}% efficiency gain over PWM.`
  } else {
    recommendedType = 'PWM'
    explanation = `PWM acceptable: Array voltage is well-matched to battery. MPPT would provide ~${mpptEfficiencyGain.toFixed(0)}% efficiency gain but at higher cost.`
  }

  return {
    recommendedType,
    voltageMismatch,
    mpptEfficiencyGain: Math.max(0, mpptEfficiencyGain),
    explanation,
  }
}

/**
 * Recommend charge controller(s) for given solar array
 *
 * @param inputs Charge controller calculation inputs
 * @returns Calculation results with recommendations
 */
export function recommendChargeController(
  inputs: ChargeControllerInputs
): ChargeControllerResult {
  // Validate inputs
  validateInputs(inputs)

  const warnings: ChargeControllerWarning[] = []

  // Calculate cold weather V_oc if temperature data provided
  let coldWeatherVoc: number | undefined
  let effectiveVoc = inputs.arrayVoc

  if (inputs.minTemperature !== undefined && inputs.vocTempCoefficient !== undefined) {
    // V_oc increases in cold weather
    // STC is at 25°C, so temperature difference = 25 - minTemp
    const tempDifference = 25 - inputs.minTemperature
    // Temperature coefficient is negative (V_oc increases as temp decreases)
    // So we add the absolute value of the coefficient times temp difference
    const vocIncrease = Math.abs(inputs.vocTempCoefficient) * tempDifference
    coldWeatherVoc = inputs.arrayVoc * (1 + vocIncrease)
    effectiveVoc = coldWeatherVoc

    if (tempDifference > 30) {
      warnings.push({
        type: 'temperature-derate',
        severity: 'info',
        field: 'minTemperature',
        message: `Cold weather increases V_oc to ${coldWeatherVoc.toFixed(1)}V. Controller must handle this higher voltage.`,
        standardReference: 'IEC 62109',
      })
    }
  }

  // Calculate safety margins
  const margins = calculateSafetyMargins(effectiveVoc, inputs.arrayIsc)

  // Get controller type recommendation
  const typeRecommendation = recommendControllerType(inputs.arrayVoc, inputs.batteryVoltage)

  // Generate controller recommendations
  const recommendedControllers: ControllerRecommendation[] = []

  // Find suitable current ratings
  const suitableCurrentRatings = STANDARD_CURRENT_RATINGS.filter(
    (rating) => rating >= margins.minIscRating
  )

  // Find suitable voltage ratings
  const suitableVoltageRatings = STANDARD_VOLTAGE_RATINGS.filter(
    (rating) => rating >= margins.minVocRating
  )

  // If no standard voltage rating is high enough, add a warning
  if (suitableVoltageRatings.length === 0) {
    warnings.push({
      type: 'high-voltage-array',
      severity: 'warning',
      field: 'arrayVoc',
      message: `Array V_oc (${effectiveVoc.toFixed(0)}V) requires controller rated for ${margins.minVocRating.toFixed(0)}V+. High-voltage string inverters may be more appropriate.`,
      standardReference: 'IEC 62109',
    })
  }

  // Generate MPPT recommendations
  if (typeRecommendation.recommendedType === 'MPPT' || suitableVoltageRatings.length > 0) {
    for (const current of suitableCurrentRatings.slice(0, 3)) {
      for (const voltage of suitableVoltageRatings.slice(0, 2)) {
        const suitabilityScore = calculateSuitabilityScore(
          current,
          voltage,
          margins.minIscRating,
          margins.minVocRating,
          'MPPT'
        )

        recommendedControllers.push({
          type: 'MPPT',
          currentRating: current,
          maxInputVoltage: voltage,
          batteryVoltages: getBatteryVoltages(voltage),
          efficiency: 95 + Math.random() * 3, // 95-98% typical
          suitabilityScore,
          notes: `MPPT ${current}A/${voltage}V - ${getSuitabilityText(suitabilityScore)}`,
        })
      }
    }
  }

  // Generate PWM recommendations only if voltage is suitable
  if (
    typeRecommendation.recommendedType === 'PWM' ||
    (typeRecommendation.voltageMismatch < 0.5 && inputs.arrayVoc < 100)
  ) {
    for (const current of suitableCurrentRatings.slice(0, 2)) {
      // PWM controllers typically handle up to ~50V input max
      if (inputs.arrayVoc <= 50) {
        const suitabilityScore = calculateSuitabilityScore(
          current,
          50,
          margins.minIscRating,
          margins.minVocRating,
          'PWM'
        )

        recommendedControllers.push({
          type: 'PWM',
          currentRating: current,
          maxInputVoltage: 50, // Typical PWM max
          batteryVoltages: [12, 24],
          efficiency: 75 + Math.random() * 10, // 75-85% typical
          suitabilityScore: Math.min(suitabilityScore, 3), // Cap PWM score
          notes: `PWM ${current}A - Lower cost option. ${
            typeRecommendation.mpptEfficiencyGain > 10
              ? `Note: ${typeRecommendation.mpptEfficiencyGain.toFixed(0)}% less efficient than MPPT.`
              : 'Suitable for matched voltage systems.'
          }`,
        })
      }
    }

    // Add PWM inefficiency warning if significant
    if (typeRecommendation.mpptEfficiencyGain > 15 && typeRecommendation.recommendedType === 'PWM') {
      warnings.push({
        type: 'pwm-inefficient',
        severity: 'info',
        field: 'controllerType',
        message: `PWM controller would lose ~${typeRecommendation.mpptEfficiencyGain.toFixed(0)}% efficiency due to voltage mismatch. Consider MPPT for better performance.`,
      })
    }
  }

  // Sort by suitability score
  recommendedControllers.sort((a, b) => b.suitabilityScore - a.suitabilityScore)

  return {
    minimumVocRating: margins.minVocRating,
    minimumIscRating: margins.minIscRating,
    vocSafetyMargin: margins.vocMargin,
    iscSafetyMargin: margins.iscMargin,
    coldWeatherVoc,
    recommendedType: typeRecommendation.recommendedType,
    voltageMismatch: typeRecommendation.voltageMismatch,
    mpptEfficiencyGain: typeRecommendation.mpptEfficiencyGain,
    explanation: typeRecommendation.explanation,
    recommendedControllers,
    warnings,
    standardsUsed: ['IEC 62109', 'Manufacturer Guidelines'],
    inputs,
  }
}

/**
 * Calculate suitability score for a controller
 */
function calculateSuitabilityScore(
  currentRating: number,
  voltageRating: number,
  minCurrent: number,
  minVoltage: number,
  type: ControllerType
): number {
  let score = 3 // Base score

  // Current headroom (not too much, not too little)
  const currentHeadroom = currentRating / minCurrent
  if (currentHeadroom >= 1.0 && currentHeadroom <= 1.5) score += 1
  if (currentHeadroom > 2.0) score -= 1 // Oversized

  // Voltage headroom
  const voltageHeadroom = voltageRating / minVoltage
  if (voltageHeadroom >= 1.0 && voltageHeadroom <= 1.3) score += 1

  // MPPT bonus for efficiency
  if (type === 'MPPT') score += 0.5

  return Math.min(5, Math.max(1, score))
}

/**
 * Get battery voltages supported by controller voltage rating
 */
function getBatteryVoltages(maxInputVoltage: number): number[] {
  if (maxInputVoltage >= 450) return [12, 24, 48, 96]
  if (maxInputVoltage >= 150) return [12, 24, 48]
  if (maxInputVoltage >= 100) return [12, 24]
  return [12]
}

/**
 * Get human-readable suitability text
 */
function getSuitabilityText(score: number): string {
  if (score >= 4.5) return 'Excellent match'
  if (score >= 3.5) return 'Good match'
  if (score >= 2.5) return 'Acceptable'
  if (score >= 1.5) return 'Marginal'
  return 'Not recommended'
}

// Re-export for convenience
export { math, toBigNumber, toNumber }
