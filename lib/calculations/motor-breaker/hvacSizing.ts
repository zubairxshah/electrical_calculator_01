/**
 * NEC 440 HVAC / Compressor Breaker Sizing
 *
 * HVAC equipment nameplates provide MCA (Minimum Circuit Ampacity) and
 * MOP (Maximum Overcurrent Protection). Per NEC 440.22:
 * - Wire sizing is based on MCA
 * - Breaker must be the LARGEST standard rating ≤ MOP (not "next up")
 *
 * @module hvacSizing
 */

import { getBreakerRatings } from '@/lib/standards/breakerRatings';

/**
 * HVAC sizing result
 */
export interface HVACSizingResult {
  mca: number;
  mop: number;
  wireSizingAmps: number;
  breakerAmps: number | null;
  codeReference: string;
  notes: string;
}

/**
 * Find the largest standard breaker rating at or below the given MOP.
 *
 * This is the REVERSE of normal breaker sizing (which finds next size UP).
 * Per NEC 440.22(a), the overcurrent device shall not exceed MOP.
 *
 * @param mop - Maximum Overcurrent Protection from equipment nameplate (amps)
 * @param standard - 'NEC' or 'IEC'
 * @returns Largest standard breaker rating ≤ MOP, or null if none available
 */
export function findLargestRatingAtOrBelow(
  mop: number,
  standard: 'NEC' | 'IEC'
): number | null {
  const ratings = getBreakerRatings(standard);

  // Linear search from largest to smallest for clarity
  // (ratings are sorted ascending)
  let result: number | null = null;
  for (let i = ratings.length - 1; i >= 0; i--) {
    if (ratings[i] <= mop) {
      result = ratings[i];
      break;
    }
  }

  return result;
}

/**
 * Calculate HVAC breaker and wire sizing per NEC 440
 *
 * @param mca - Minimum Circuit Ampacity from nameplate
 * @param mop - Maximum Overcurrent Protection from nameplate
 * @param standard - Electrical standard
 * @returns HVAC sizing result
 */
export function calculateHVACSizing(
  mca: number,
  mop: number,
  standard: 'NEC' | 'IEC'
): HVACSizingResult {
  const breakerAmps = findLargestRatingAtOrBelow(mop, standard);

  return {
    mca,
    mop,
    wireSizingAmps: mca,
    breakerAmps,
    codeReference: 'NEC 440.22(a)',
    notes: `Wire sized for MCA (${mca}A). Breaker must not exceed MOP (${mop}A). ` +
           `Selected: ${breakerAmps !== null ? breakerAmps + 'A' : 'No standard rating available'} ` +
           `(largest standard rating ≤ ${mop}A).`,
  };
}
