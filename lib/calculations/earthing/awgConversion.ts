/**
 * AWG (American Wire Gauge) Conversion Utilities
 * For NEC standard wire sizing
 */

// AWG to mm² conversion table (standard values)
export const AWG_TO_MM2: Record<string, number> = {
  '14': 2.08,
  '12': 3.31,
  '10': 5.26,
  '8': 8.37,
  '6': 13.3,
  '4': 21.2,
  '3': 26.7,
  '2': 33.6,
  '1': 42.4,
  '1/0': 53.5,
  '2/0': 67.4,
  '3/0': 85.0,
  '4/0': 107.2,
  '250': 127,
  '300': 152,
  '350': 177,
  '400': 203,
  '500': 253,
  '600': 304,
  '750': 380,
  '1000': 507
}

// mm² to AWG conversion (finds closest AWG size)
export function mm2ToAWG(mm2: number): string {
  const entries = Object.entries(AWG_TO_MM2)
  
  // Find the smallest AWG that is >= the required mm²
  for (const [awg, area] of entries) {
    if (area >= mm2) {
      return awg
    }
  }
  
  // If larger than largest standard, return the largest
  return '1000'
}

// Get AWG size with kcmil notation for large sizes
export function formatAWG(awg: string): string {
  const numericAWG = parseInt(awg)
  if (!isNaN(numericAWG) && numericAWG >= 250) {
    return `${numericAWG} kcmil`
  }
  return `AWG ${awg}`
}

// Strip conductor dimensions calculator
export interface StripDimensions {
  width: number  // mm
  thickness: number  // mm
  area: number  // mm²
}

// Common strip conductor sizes (width × thickness in mm)
export const STANDARD_STRIP_SIZES: StripDimensions[] = [
  { width: 20, thickness: 3, area: 60 },
  { width: 25, thickness: 3, area: 75 },
  { width: 25, thickness: 4, area: 100 },
  { width: 30, thickness: 3, area: 90 },
  { width: 30, thickness: 4, area: 120 },
  { width: 40, thickness: 3, area: 120 },
  { width: 40, thickness: 4, area: 160 },
  { width: 40, thickness: 5, area: 200 },
  { width: 50, thickness: 5, area: 250 },
  { width: 50, thickness: 6, area: 300 },
  { width: 60, thickness: 6, area: 360 },
  { width: 60, thickness: 8, area: 480 },
  { width: 80, thickness: 8, area: 640 },
  { width: 80, thickness: 10, area: 800 },
  { width: 100, thickness: 10, area: 1000 }
]

// Find closest strip size for given area
export function findStripSize(requiredArea: number): StripDimensions {
  for (const strip of STANDARD_STRIP_SIZES) {
    if (strip.area >= requiredArea) {
      return strip
    }
  }
  // Return largest if none found
  return STANDARD_STRIP_SIZES[STANDARD_STRIP_SIZES.length - 1]
}

// Format strip dimensions
export function formatStripSize(strip: StripDimensions): string {
  return `${strip.width}mm × ${strip.thickness}mm (${strip.area} mm²)`
}
