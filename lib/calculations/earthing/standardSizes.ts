/**
 * Standard Conductor Sizes
 * Based on IEC 60228 and ANSI/NEMA standards
 */

/**
 * Standard conductor sizes in mm² (IEC 60228)
 */
export const STANDARD_SIZES_MM2 = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000
]

/**
 * Round calculated size to next standard conductor size
 */
export function roundToStandardSize(calculatedSize: number): number {
  for (const size of STANDARD_SIZES_MM2) {
    if (size >= calculatedSize) {
      return size
    }
  }
  return STANDARD_SIZES_MM2[STANDARD_SIZES_MM2.length - 1]
}

/**
 * Get alternative conductor sizes (one size up and down)
 */
export function getAlternativeSizes(conductorSize: number): { smaller?: number; larger?: number } {
  const index = STANDARD_SIZES_MM2.indexOf(conductorSize)
  
  return {
    smaller: index > 0 ? STANDARD_SIZES_MM2[index - 1] : undefined,
    larger: index < STANDARD_SIZES_MM2.length - 1 ? STANDARD_SIZES_MM2[index + 1] : undefined
  }
}
