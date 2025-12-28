/**
 * Safety Factor Application Module
 *
 * Applies electrical standard-specific safety factors to calculated load current.
 *
 * NEC: 125% continuous load factor per Article 210.20(A)
 * IEC: 1.0 factor (correction factors applied separately)
 *
 * @module safetyFactors
 */

import * as math from 'mathjs';

/**
 * Safety Factor Input
 */
export interface SafetyFactorInput {
  loadCurrent: number;              // Calculated load current in amperes
  standard: 'NEC' | 'IEC';          // Electrical standard
  loadType: 'continuous' | 'intermittent';  // Load duty cycle
}

/**
 * Safety Factor Result
 */
export interface SafetyFactorResult {
  minimumBreakerSize: number;       // Minimum breaker size after safety factor
  safetyFactor: number;             // Applied factor (1.25 for NEC, 1.0 for IEC)
  factorType: 'continuous-load' | 'correction-factor';  // Type of factor applied
  codeReference: string;            // Applicable code section
}

/**
 * Apply safety factor to load current
 *
 * NEC: Continuous loads require 125% overcurrent protection per Article 210.20(A)
 * IEC: No additional safety factor; uses correction factors instead
 *
 * @param input - Load current and standard
 * @returns Minimum breaker size with applied safety factor
 *
 * @example
 * ```typescript
 * // NEC continuous load
 * const result = applySafetyFactor({
 *   loadCurrent: 46.3,
 *   standard: 'NEC',
 *   loadType: 'continuous'
 * });
 * // Returns: {
 * //   minimumBreakerSize: 57.875,  // 46.3 × 1.25
 * //   safetyFactor: 1.25,
 * //   factorType: 'continuous-load',
 * //   codeReference: 'NEC 210.20(A)'
 * // }
 *
 * // IEC continuous load
 * const result2 = applySafetyFactor({
 *   loadCurrent: 50,
 *   standard: 'IEC',
 *   loadType: 'continuous'
 * });
 * // Returns: {
 * //   minimumBreakerSize: 50,  // 50 × 1.0
 * //   safetyFactor: 1.0,
 * //   factorType: 'correction-factor',
 * //   codeReference: 'IEC 60364-5-52'
 * // }
 * ```
 */
export function applySafetyFactor(input: SafetyFactorInput): SafetyFactorResult {
  const { loadCurrent, standard, loadType } = input;

  // Convert to BigNumber for precision
  const loadCurrentBN = math.bignumber(loadCurrent);

  let safetyFactor: number;
  let factorType: 'continuous-load' | 'correction-factor';
  let codeReference: string;

  if (standard === 'NEC') {
    // NEC Article 210.20(A): Continuous loads require 125% factor
    // Definition: Continuous load = maximum current expected for 3+ hours
    if (loadType === 'continuous') {
      safetyFactor = 1.25;
      factorType = 'continuous-load';
      codeReference = 'NEC 210.20(A)';
    } else {
      // Intermittent loads: no additional factor
      safetyFactor = 1.0;
      factorType = 'continuous-load';
      codeReference = 'NEC 210.20(A)';
    }
  } else {
    // IEC: No additional safety factor
    // IEC uses correction factors (Ca, Cg, Cc) applied separately
    safetyFactor = 1.0;
    factorType = 'correction-factor';
    codeReference = 'IEC 60364-5-52';
  }

  // Apply safety factor: Minimum Breaker = Load Current × Safety Factor
  const safetyFactorBN = math.bignumber(safetyFactor);
  const minimumBreakerSizeBN = math.multiply(loadCurrentBN, safetyFactorBN) as math.BigNumber;

  return {
    minimumBreakerSize: math.number(minimumBreakerSizeBN),
    safetyFactor,
    factorType,
    codeReference,
  };
}

/**
 * Get safety factor value without calculation
 *
 * Useful for displaying factor information to user
 *
 * @param standard - Electrical standard
 * @param loadType - Load duty cycle
 * @returns Safety factor value
 */
export function getSafetyFactor(
  standard: 'NEC' | 'IEC',
  loadType: 'continuous' | 'intermittent' = 'continuous'
): number {
  if (standard === 'NEC' && loadType === 'continuous') {
    return 1.25;
  }
  return 1.0;
}

/**
 * Get code reference for safety factor
 *
 * @param standard - Electrical standard
 * @returns Code section reference string
 */
export function getSafetyFactorCodeReference(standard: 'NEC' | 'IEC'): string {
  return standard === 'NEC' ? 'NEC 210.20(A)' : 'IEC 60364-5-52';
}

/**
 * Determine if load should be considered continuous
 *
 * Per NEC Article 100: A continuous load is one where the maximum current
 * is expected to continue for 3 hours or more.
 *
 * @param operatingHours - Expected continuous operating hours
 * @returns true if load should be treated as continuous
 */
export function isLoadContinuous(operatingHours: number): boolean {
  return operatingHours >= 3;
}

/**
 * Calculate breaker size for both continuous and non-continuous loads
 *
 * Useful for comparison or when load type is uncertain
 *
 * @param loadCurrent - Load current in amperes
 * @param standard - Electrical standard
 * @returns Minimum breaker sizes for continuous and non-continuous scenarios
 */
export function calculateBothScenarios(
  loadCurrent: number,
  standard: 'NEC' | 'IEC'
): {
  continuous: SafetyFactorResult;
  intermittent: SafetyFactorResult;
  difference: number;
} {
  const continuous = applySafetyFactor({
    loadCurrent,
    standard,
    loadType: 'continuous',
  });

  const intermittent = applySafetyFactor({
    loadCurrent,
    standard,
    loadType: 'intermittent',
  });

  return {
    continuous,
    intermittent,
    difference: continuous.minimumBreakerSize - intermittent.minimumBreakerSize,
  };
}

/**
 * Apply additional diversity factor (if multiple loads)
 *
 * Diversity factor accounts for the fact that not all loads operate
 * at maximum simultaneously.
 *
 * Common diversity factors:
 * - Residential branch circuits: 0.7-0.8
 * - Commercial lighting: 0.8-0.9
 * - Industrial mixed loads: 0.75-0.85
 *
 * @param loadCurrent - Total connected load current
 * @param diversityFactor - Factor (0.0-1.0) representing simultaneous usage
 * @returns Adjusted load current after diversity
 *
 * @example
 * ```typescript
 * // 100A connected load, but only 80% runs simultaneously
 * const adjustedLoad = applyDiversityFactor(100, 0.8);
 * // Returns: 80A
 * ```
 */
export function applyDiversityFactor(
  loadCurrent: number,
  diversityFactor: number
): number {
  if (diversityFactor < 0 || diversityFactor > 1.0) {
    throw new Error('Diversity factor must be between 0 and 1.0');
  }

  const loadCurrentBN = math.bignumber(loadCurrent);
  const diversityFactorBN = math.bignumber(diversityFactor);

  const adjustedLoadBN = math.multiply(loadCurrentBN, diversityFactorBN) as math.BigNumber;

  return math.number(adjustedLoadBN);
}

/**
 * Calculate total safety margin percentage
 *
 * Shows how much headroom exists between actual load and breaker capacity
 *
 * @param loadCurrent - Actual load current
 * @param breakerRating - Breaker rating
 * @returns Safety margin as percentage (e.g., 25 means 25% headroom)
 *
 * @example
 * ```typescript
 * const margin = calculateSafetyMargin(46.3, 60);
 * // Returns: 29.6% (60A - 46.3A = 13.7A / 46.3A = 0.296 = 29.6%)
 * ```
 */
export function calculateSafetyMargin(
  loadCurrent: number,
  breakerRating: number
): number {
  const loadCurrentBN = math.bignumber(loadCurrent);
  const breakerRatingBN = math.bignumber(breakerRating);

  const marginBN = math.divide(
    math.subtract(breakerRatingBN, loadCurrentBN),
    loadCurrentBN
  ) as math.BigNumber;

  const marginPercent = math.multiply(marginBN, 100) as math.BigNumber;

  return math.number(marginPercent);
}
