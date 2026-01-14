/**
 * Material Constants for Earthing Conductor Calculations
 * Based on IEC 60364-5-54 and NEC 250
 */

export type Material = 'copper' | 'aluminum' | 'steel'
export type InstallationType = 'cable' | 'bare' | 'strip'
export type Standard = 'IEC' | 'NEC'

export interface MaterialConstant {
  bare: number
  cable: number
  strip: number
}

/**
 * k-values for different materials and standards
 * IEC 60364-5-54 Table 54.2 and NEC 250
 */
export const MATERIAL_CONSTANTS: Record<Standard, Record<Material, MaterialConstant>> = {
  IEC: {
    copper: { bare: 226, cable: 143, strip: 226 },
    aluminum: { bare: 135, cable: 94, strip: 135 },
    steel: { bare: 52, cable: 52, strip: 52 }
  },
  NEC: {
    copper: { bare: 226, cable: 143, strip: 226 },
    aluminum: { bare: 135, cable: 94, strip: 135 },
    steel: { bare: 52, cable: 52, strip: 52 }
  }
}

/**
 * Get k-value for specific material, installation type, and standard
 */
export function getKValue(
  material: Material,
  installationType: InstallationType,
  standard: Standard
): number {
  return MATERIAL_CONSTANTS[standard][material][installationType]
}
