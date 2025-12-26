/**
 * UPS Calculations Module
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Re-exports all UPS calculation functions
 */

export {
  calculateDiversityFactor,
  getDiversityFactorExplanation,
} from './diversityFactor';

export {
  DEFAULT_POWER_FACTOR,
  convertWattsToVA,
  convertVAToWatts,
  validatePowerFactor,
  getPowerFactorExplanation,
} from './powerFactor';

export {
  STANDARD_UPS_SIZES_KVA,
  DEFAULT_GROWTH_MARGIN,
  calculateTotalLoad,
  countLoadItems,
  calculateEffectiveLoad,
  applyGrowthMargin,
  recommendUPSSize,
  calculateUPSSizing,
  getUPSSizingBreakdown,
} from './sizing';

export type { LoadItem, UPSSizingResult } from './sizing';
