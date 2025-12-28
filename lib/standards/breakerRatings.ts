/**
 * Standard Circuit Breaker Ratings
 *
 * NEC and IEC standard breaker current ratings per:
 * - NEC 240.6(A) (USA/Canada)
 * - IEC 60898-1 (International)
 *
 * @module breakerRatings
 */

/**
 * NEC Standard Breaker Ratings (USA/Canada)
 * Per NEC Article 240.6(A) - Standard Ampere Ratings
 *
 * Reference: NEC 2020, Article 240.6(A)
 * Range: 15A to 4000A
 *
 * @constant
 */
export const NEC_BREAKER_RATINGS = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
  110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450,
  500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000
] as const;

/**
 * IEC Standard Breaker Ratings (International)
 * Per IEC 60898-1 - Preferred ratings for miniature circuit breakers (MCBs)
 *
 * Reference: IEC 60898-1:2015
 * Range: 6A to 4000A
 *
 * Note: IEC ratings have finer resolution in lower ranges compared to NEC
 *
 * @constant
 */
export const IEC_BREAKER_RATINGS = [
  6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100,
  125, 160, 200, 250, 315, 400, 500, 630, 800, 1000,
  1250, 1600, 2000, 2500, 3200, 4000
] as const;

/**
 * Type definitions for breaker rating arrays
 */
export type NECBreakerRating = typeof NEC_BREAKER_RATINGS[number];
export type IECBreakerRating = typeof IEC_BREAKER_RATINGS[number];
export type BreakerRating = NECBreakerRating | IECBreakerRating;

/**
 * Get standard breaker ratings for specified electrical standard
 *
 * @param standard - Electrical standard ('NEC' or 'IEC')
 * @returns Array of standard breaker current ratings in amperes
 *
 * @example
 * ```typescript
 * const necRatings = getBreakerRatings('NEC');
 * // Returns: [15, 20, 25, 30, ..., 4000]
 *
 * const iecRatings = getBreakerRatings('IEC');
 * // Returns: [6, 10, 13, 16, ..., 4000]
 * ```
 */
export function getBreakerRatings(standard: 'NEC' | 'IEC'): readonly number[] {
  return standard === 'NEC' ? NEC_BREAKER_RATINGS : IEC_BREAKER_RATINGS;
}

/**
 * Find the smallest standard breaker rating greater than or equal to the calculated minimum
 *
 * Uses binary search for O(log n) performance
 *
 * @param minimumAmps - Calculated minimum breaker size in amperes
 * @param standard - Electrical standard ('NEC' or 'IEC')
 * @returns Recommended standard breaker rating, or null if exceeds maximum available
 *
 * @example
 * ```typescript
 * // NEC: Minimum 57.9A → recommends 60A
 * const breaker1 = recommendStandardBreaker(57.9, 'NEC');
 * // Returns: 60
 *
 * // IEC: Minimum 52.1A → recommends 63A
 * const breaker2 = recommendStandardBreaker(52.1, 'IEC');
 * // Returns: 63
 *
 * // Exceeds maximum: Minimum 5000A → returns null
 * const breaker3 = recommendStandardBreaker(5000, 'NEC');
 * // Returns: null (recommendation: use parallel breakers)
 * ```
 */
export function recommendStandardBreaker(
  minimumAmps: number,
  standard: 'NEC' | 'IEC'
): number | null {
  const ratings = getBreakerRatings(standard);

  // Binary search for smallest rating ≥ minimumAmps
  let left = 0;
  let right = ratings.length - 1;
  let result: number | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const rating = ratings[mid];

    if (rating >= minimumAmps) {
      result = rating;
      right = mid - 1;  // Continue searching for smaller valid rating
    } else {
      left = mid + 1;   // Search larger ratings
    }
  }

  return result;
}

/**
 * Check if a breaker rating is a standard size for the given electrical standard
 *
 * @param rating - Breaker current rating to validate
 * @param standard - Electrical standard ('NEC' or 'IEC')
 * @returns true if rating is standard, false otherwise
 *
 * @example
 * ```typescript
 * isStandardRating(60, 'NEC');   // Returns: true
 * isStandardRating(65, 'NEC');   // Returns: false (not a standard NEC size)
 * isStandardRating(63, 'IEC');   // Returns: true
 * isStandardRating(65, 'IEC');   // Returns: false
 * ```
 */
export function isStandardRating(rating: number, standard: 'NEC' | 'IEC'): boolean {
  const ratings = getBreakerRatings(standard);
  return ratings.includes(rating);
}

/**
 * Get the next available standard breaker rating larger than the specified rating
 *
 * Useful for voltage drop or derating scenarios where cable size may need upgrading
 *
 * @param currentRating - Current breaker rating in amperes
 * @param standard - Electrical standard ('NEC' or 'IEC')
 * @returns Next larger standard rating, or null if already at maximum
 *
 * @example
 * ```typescript
 * getNextLargerRating(60, 'NEC');   // Returns: 70
 * getNextLargerRating(4000, 'NEC'); // Returns: null (at maximum)
 * ```
 */
export function getNextLargerRating(
  currentRating: number,
  standard: 'NEC' | 'IEC'
): number | null {
  const ratings = getBreakerRatings(standard);
  const index = ratings.findIndex(r => r > currentRating);
  return index !== -1 ? ratings[index] : null;
}
