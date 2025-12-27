/**
 * Solar Calculations Module
 *
 * Exports all solar-related calculation functions:
 * - Array sizing (NREL methodology)
 * - Performance ratio calculation
 * - Charge controller selection (MPPT/PWM)
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

export {
  calculateSolarArraySize,
  calculatePerformanceRatio,
  type SolarCalculatorInputs,
  type SolarCalculatorResult,
  type SolarWarning,
  type SolarWarningType,
  type PerformanceRatioLosses,
} from './arraySize'

export {
  recommendChargeController,
  calculateSafetyMargins,
  recommendControllerType,
  type ChargeControllerInputs,
  type ChargeControllerResult,
  type ControllerRecommendation,
  type ControllerType,
  type ChargeControllerWarning,
  type ChargeControllerWarningType,
  type SafetyMargins,
  type ControllerTypeRecommendation,
} from './chargeController'
