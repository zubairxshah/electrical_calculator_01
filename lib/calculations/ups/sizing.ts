/**
 * UPS Sizing Calculator
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Calculates UPS sizing with diversity factor, growth margin, and standard size recommendation
 *
 * Standards: IEEE 1100-2020, IEC 62040-3:2021
 */

import { create, all, MathJsStatic } from 'mathjs';
import { calculateDiversityFactor, getDiversityFactorExplanation } from './diversityFactor';
import { DEFAULT_POWER_FACTOR, convertWattsToVA } from './powerFactor';

// Configure Math.js with BigNumber for precision
const math: MathJsStatic = create(all, {
  number: 'BigNumber',
  precision: 64,
});

/**
 * Standard UPS sizes available in kVA
 * Per IEEE 1100-2020 Appendix B - Common UPS Ratings
 */
export const STANDARD_UPS_SIZES_KVA = [10, 20, 30, 40, 60, 80, 100, 120, 160, 200] as const;

/**
 * Default growth margin (25%) per IEEE 1100 recommendations
 */
export const DEFAULT_GROWTH_MARGIN = 0.25;

/**
 * Load item interface for UPS sizing
 */
export interface LoadItem {
  name: string;
  powerVA?: number;
  powerWatts?: number;
  powerFactor?: number;
  quantity: number;
}

/**
 * UPS sizing calculation result
 */
export interface UPSSizingResult {
  /** Total load in VA before diversity */
  totalLoadVA: number;
  /** Number of individual load items */
  numberOfLoads: number;
  /** IEEE 1100 diversity factor applied */
  diversityFactor: number;
  /** Effective load after diversity in VA */
  effectiveLoadVA: number;
  /** Growth margin percentage applied */
  growthMargin: number;
  /** Load with growth margin in VA */
  loadWithGrowthVA: number;
  /** Load with growth margin in kVA */
  loadWithGrowthKVA: number;
  /** Recommended standard UPS size in kVA (null if exceeds max) */
  recommendedUPSKVA: number | null;
  /** Explanation of diversity factor */
  diversityExplanation: string;
  /** Standard reference */
  standard: string;
}

/**
 * Calculate total load from load list
 *
 * @param loads - Array of load items
 * @returns Total load in VA
 */
export function calculateTotalLoad(loads: LoadItem[]): number {
  let totalVA = 0;

  for (const load of loads) {
    let loadVA: number;

    if (load.powerVA !== undefined) {
      loadVA = load.powerVA;
    } else if (load.powerWatts !== undefined) {
      const pf = load.powerFactor ?? DEFAULT_POWER_FACTOR;
      loadVA = convertWattsToVA(load.powerWatts, pf);
    } else {
      // Skip invalid loads
      continue;
    }

    totalVA += loadVA * load.quantity;
  }

  return Number(math.round(totalVA, 2));
}

/**
 * Count total number of individual load items
 *
 * @param loads - Array of load items
 * @returns Total count of individual items
 */
export function countLoadItems(loads: LoadItem[]): number {
  return loads.reduce((count, load) => count + load.quantity, 0);
}

/**
 * Calculate effective load after applying diversity factor
 *
 * @param totalLoadVA - Total load in VA
 * @param numberOfLoads - Number of individual load items
 * @returns Effective load in VA
 */
export function calculateEffectiveLoad(totalLoadVA: number, numberOfLoads: number): number {
  const diversityFactor = calculateDiversityFactor(numberOfLoads);
  const effectiveLoad = math.evaluate(`${totalLoadVA} * ${diversityFactor}`);
  return Number(math.round(effectiveLoad, 2));
}

/**
 * Apply growth margin to load
 *
 * @param loadVA - Load in VA
 * @param growthMargin - Growth margin as decimal (0.25 = 25%)
 * @returns Load with growth margin in VA
 */
export function applyGrowthMargin(loadVA: number, growthMargin: number): number {
  const loadWithGrowth = math.evaluate(`${loadVA} * (1 + ${growthMargin})`);
  return Number(math.round(loadWithGrowth, 2));
}

/**
 * Recommend standard UPS size based on required kVA
 *
 * @param requiredKVA - Required capacity in kVA
 * @returns Standard UPS size in kVA, or null if exceeds maximum
 */
export function recommendUPSSize(requiredKVA: number): number | null {
  for (const size of STANDARD_UPS_SIZES_KVA) {
    if (size >= requiredKVA) {
      return size;
    }
  }

  // Required capacity exceeds maximum standard size
  return null;
}

/**
 * Perform complete UPS sizing calculation
 *
 * @param loads - Array of load items
 * @param growthMargin - Growth margin as decimal (default 0.25 = 25%)
 * @returns Complete UPS sizing result
 *
 * @example
 * const loads = [
 *   { name: 'Servers', powerVA: 500, quantity: 5 },
 *   { name: 'Switches', powerVA: 100, quantity: 10 },
 * ];
 * const result = calculateUPSSizing(loads, 0.25);
 * // result.recommendedUPSKVA = 10 kVA
 *
 * @standard IEEE 1100-2020, IEC 62040-3:2021
 */
export function calculateUPSSizing(
  loads: LoadItem[],
  growthMargin: number = DEFAULT_GROWTH_MARGIN
): UPSSizingResult {
  // Step 1: Calculate total load
  const totalLoadVA = calculateTotalLoad(loads);

  // Step 2: Count individual items for diversity
  const numberOfLoads = countLoadItems(loads);

  // Step 3: Apply diversity factor
  const diversityFactor = calculateDiversityFactor(numberOfLoads);
  const effectiveLoadVA = calculateEffectiveLoad(totalLoadVA, numberOfLoads);

  // Step 4: Apply growth margin
  const loadWithGrowthVA = applyGrowthMargin(effectiveLoadVA, growthMargin);
  const loadWithGrowthKVA = Number(math.round(loadWithGrowthVA / 1000, 2));

  // Step 5: Recommend standard UPS size
  const recommendedUPSKVA = recommendUPSSize(loadWithGrowthKVA);

  return {
    totalLoadVA,
    numberOfLoads,
    diversityFactor,
    effectiveLoadVA,
    growthMargin,
    loadWithGrowthVA,
    loadWithGrowthKVA,
    recommendedUPSKVA,
    diversityExplanation: getDiversityFactorExplanation(numberOfLoads),
    standard: 'IEEE 1100-2020, IEC 62040-3:2021',
  };
}

/**
 * Get UPS sizing breakdown for display
 *
 * @param result - UPS sizing calculation result
 * @returns Formatted breakdown string
 */
export function getUPSSizingBreakdown(result: UPSSizingResult): string {
  const lines = [
    `Total Connected Load: ${result.totalLoadVA.toLocaleString()} VA`,
    `Number of Loads: ${result.numberOfLoads}`,
    `Diversity Factor: ${result.diversityFactor} (per IEEE 1100)`,
    `Effective Load: ${result.effectiveLoadVA.toLocaleString()} VA`,
    `Growth Margin: ${(result.growthMargin * 100).toFixed(0)}%`,
    `Required Capacity: ${result.loadWithGrowthKVA.toFixed(2)} kVA`,
    '',
    result.recommendedUPSKVA
      ? `Recommended UPS: ${result.recommendedUPSKVA} kVA`
      : `Required capacity (${result.loadWithGrowthKVA.toFixed(2)} kVA) exceeds maximum standard size (200 kVA). Consider parallel UPS configuration.`,
  ];

  return lines.join('\n');
}
