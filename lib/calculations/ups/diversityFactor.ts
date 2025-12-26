/**
 * UPS Diversity Factor Calculator
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Implements IEEE 1100 (Emerald Book) diversity factor guidelines
 *
 * Standard: IEEE 1100-2020 - Recommended Practice for Powering and Grounding Electronic Equipment
 */

import { create, all, MathJsStatic } from 'mathjs';

// Configure Math.js with BigNumber for precision
const math: MathJsStatic = create(all, {
  number: 'BigNumber',
  precision: 64,
});

/**
 * Calculate diversity factor based on number of loads per IEEE 1100
 *
 * Formula:
 * - N ≤ 3:  diversity = 1.0 (no diversity benefit)
 * - 3 < N ≤ 10: diversity = 0.9 + 0.1/N
 * - N > 10: diversity = 0.85 (maximum diversity benefit)
 *
 * @param numberOfLoads - Total number of individual load items
 * @returns Diversity factor (0.85 to 1.0)
 *
 * @example
 * calculateDiversityFactor(5)  // Returns 0.92
 * calculateDiversityFactor(15) // Returns 0.85
 *
 * @standard IEEE 1100-2020 Section 4.3.2
 */
export function calculateDiversityFactor(numberOfLoads: number): number {
  // Handle edge cases
  if (numberOfLoads <= 0) {
    return 1.0;
  }

  // N ≤ 3: No diversity benefit
  if (numberOfLoads <= 3) {
    return 1.0;
  }

  // 3 < N ≤ 10: Graduated diversity
  if (numberOfLoads <= 10) {
    const diversity = math.evaluate(`0.9 + 0.1 / ${numberOfLoads}`);
    // Round to 3 decimal places for practical use
    return Number(math.round(diversity, 3));
  }

  // N > 10: Maximum diversity benefit
  return 0.85;
}

/**
 * Get human-readable explanation of diversity factor
 *
 * @param numberOfLoads - Total number of individual load items
 * @returns Explanation string for display
 */
export function getDiversityFactorExplanation(numberOfLoads: number): string {
  if (numberOfLoads <= 0) {
    return 'No loads - diversity factor not applicable';
  }

  if (numberOfLoads <= 3) {
    return `With ${numberOfLoads} load(s), no diversity factor is applied (factor = 1.0). IEEE 1100 recommends considering full load for small systems.`;
  }

  if (numberOfLoads <= 10) {
    const factor = calculateDiversityFactor(numberOfLoads);
    return `With ${numberOfLoads} loads, IEEE 1100 diversity factor = 0.9 + 0.1/${numberOfLoads} = ${factor}. This accounts for the statistical probability that not all loads operate at peak simultaneously.`;
  }

  return `With ${numberOfLoads} loads (>10), IEEE 1100 applies maximum diversity factor of 0.85. Large systems benefit from statistical load averaging.`;
}
