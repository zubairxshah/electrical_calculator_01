/**
 * Cable Ampacity and Resistance Tables
 * Feature: 001-electromate-engineering-app
 * Task: T082 - Create lib/standards/cableTables.ts
 *
 * Reference data for cable sizing calculations from:
 * - NEC 2020 Table 310.15(B)(16): Conductor ampacity
 * - NEC Chapter 9 Table 8: Conductor resistance
 * - IEC 60364-5-52:2009: Cable sizing tables
 *
 * @see data-model.md - CableTableEntry interface
 */

/**
 * Cable table entry interface
 */
export interface CableTableEntry {
  /** Size in mm² (IEC) */
  sizeMetric: string;
  /** Size in AWG/kcmil (NEC) */
  sizeAWG: string | null;
  /** Conductor material */
  material: 'copper' | 'aluminum';
  /** Resistance in mV/A/m (IEC) */
  resistanceMvAm: number;
  /** Resistance in Ω/1000ft (NEC) - DC at 75°C */
  resistanceOhmPer1000ft: number;
  /** Ampacity at 60°C insulation */
  ampacity60C: number;
  /** Ampacity at 75°C insulation */
  ampacity75C: number;
  /** Ampacity at 90°C insulation */
  ampacity90C: number;
  /** Applicable standard */
  standard: 'IEC' | 'NEC' | 'BOTH';
}

/**
 * NEC Table 310.15(B)(16) - Copper Conductors
 *
 * Allowable ampacities of insulated copper conductors rated up to and
 * including 2000 volts, not more than 3 current-carrying conductors
 * in raceway, cable, or earth (direct buried).
 *
 * Based on ambient temperature of 30°C (86°F)
 */
export const NEC_COPPER_AMPACITY: CableTableEntry[] = [
  // Size      AWG     Material  mV/A/m  Ω/1000ft  60°C   75°C   90°C   Standard
  { sizeMetric: '2.08', sizeAWG: '14', material: 'copper', resistanceMvAm: 8.29, resistanceOhmPer1000ft: 3.14, ampacity60C: 15, ampacity75C: 15, ampacity90C: 15, standard: 'NEC' },
  { sizeMetric: '3.31', sizeAWG: '12', material: 'copper', resistanceMvAm: 5.21, resistanceOhmPer1000ft: 1.98, ampacity60C: 20, ampacity75C: 25, ampacity90C: 30, standard: 'NEC' },
  { sizeMetric: '5.26', sizeAWG: '10', material: 'copper', resistanceMvAm: 3.28, resistanceOhmPer1000ft: 1.24, ampacity60C: 30, ampacity75C: 35, ampacity90C: 40, standard: 'NEC' },
  { sizeMetric: '8.37', sizeAWG: '8', material: 'copper', resistanceMvAm: 2.06, resistanceOhmPer1000ft: 0.778, ampacity60C: 40, ampacity75C: 50, ampacity90C: 55, standard: 'NEC' },
  { sizeMetric: '13.3', sizeAWG: '6', material: 'copper', resistanceMvAm: 1.30, resistanceOhmPer1000ft: 0.491, ampacity60C: 55, ampacity75C: 65, ampacity90C: 75, standard: 'NEC' },
  { sizeMetric: '21.2', sizeAWG: '4', material: 'copper', resistanceMvAm: 0.815, resistanceOhmPer1000ft: 0.308, ampacity60C: 70, ampacity75C: 85, ampacity90C: 95, standard: 'NEC' },
  { sizeMetric: '26.7', sizeAWG: '3', material: 'copper', resistanceMvAm: 0.646, resistanceOhmPer1000ft: 0.245, ampacity60C: 85, ampacity75C: 100, ampacity90C: 115, standard: 'NEC' },
  { sizeMetric: '33.6', sizeAWG: '2', material: 'copper', resistanceMvAm: 0.513, resistanceOhmPer1000ft: 0.194, ampacity60C: 95, ampacity75C: 115, ampacity90C: 130, standard: 'NEC' },
  { sizeMetric: '42.4', sizeAWG: '1', material: 'copper', resistanceMvAm: 0.407, resistanceOhmPer1000ft: 0.154, ampacity60C: 110, ampacity75C: 130, ampacity90C: 145, standard: 'NEC' },
  { sizeMetric: '53.5', sizeAWG: '1/0', material: 'copper', resistanceMvAm: 0.323, resistanceOhmPer1000ft: 0.122, ampacity60C: 125, ampacity75C: 150, ampacity90C: 170, standard: 'NEC' },
  { sizeMetric: '67.4', sizeAWG: '2/0', material: 'copper', resistanceMvAm: 0.256, resistanceOhmPer1000ft: 0.0967, ampacity60C: 145, ampacity75C: 175, ampacity90C: 195, standard: 'NEC' },
  { sizeMetric: '85.0', sizeAWG: '3/0', material: 'copper', resistanceMvAm: 0.203, resistanceOhmPer1000ft: 0.0766, ampacity60C: 165, ampacity75C: 200, ampacity90C: 225, standard: 'NEC' },
  { sizeMetric: '107', sizeAWG: '4/0', material: 'copper', resistanceMvAm: 0.161, resistanceOhmPer1000ft: 0.0608, ampacity60C: 195, ampacity75C: 230, ampacity90C: 260, standard: 'NEC' },
  { sizeMetric: '127', sizeAWG: '250', material: 'copper', resistanceMvAm: 0.136, resistanceOhmPer1000ft: 0.0515, ampacity60C: 215, ampacity75C: 255, ampacity90C: 290, standard: 'NEC' },
  { sizeMetric: '152', sizeAWG: '300', material: 'copper', resistanceMvAm: 0.113, resistanceOhmPer1000ft: 0.0429, ampacity60C: 240, ampacity75C: 285, ampacity90C: 320, standard: 'NEC' },
  { sizeMetric: '177', sizeAWG: '350', material: 'copper', resistanceMvAm: 0.0975, resistanceOhmPer1000ft: 0.0367, ampacity60C: 260, ampacity75C: 310, ampacity90C: 350, standard: 'NEC' },
  { sizeMetric: '203', sizeAWG: '400', material: 'copper', resistanceMvAm: 0.0850, resistanceOhmPer1000ft: 0.0321, ampacity60C: 280, ampacity75C: 335, ampacity90C: 380, standard: 'NEC' },
  { sizeMetric: '253', sizeAWG: '500', material: 'copper', resistanceMvAm: 0.0680, resistanceOhmPer1000ft: 0.0258, ampacity60C: 320, ampacity75C: 380, ampacity90C: 430, standard: 'NEC' },
  { sizeMetric: '304', sizeAWG: '600', material: 'copper', resistanceMvAm: 0.0567, resistanceOhmPer1000ft: 0.0214, ampacity60C: 350, ampacity75C: 420, ampacity90C: 475, standard: 'NEC' },
];

/**
 * NEC Table 310.15(B)(16) - Aluminum Conductors
 */
export const NEC_ALUMINUM_AMPACITY: CableTableEntry[] = [
  // Size      AWG     Material    mV/A/m  Ω/1000ft  60°C   75°C   90°C   Standard
  { sizeMetric: '3.31', sizeAWG: '12', material: 'aluminum', resistanceMvAm: 8.57, resistanceOhmPer1000ft: 3.25, ampacity60C: 15, ampacity75C: 20, ampacity90C: 25, standard: 'NEC' },
  { sizeMetric: '5.26', sizeAWG: '10', material: 'aluminum', resistanceMvAm: 5.39, resistanceOhmPer1000ft: 2.04, ampacity60C: 25, ampacity75C: 30, ampacity90C: 35, standard: 'NEC' },
  { sizeMetric: '8.37', sizeAWG: '8', material: 'aluminum', resistanceMvAm: 3.39, resistanceOhmPer1000ft: 1.28, ampacity60C: 35, ampacity75C: 40, ampacity90C: 45, standard: 'NEC' },
  { sizeMetric: '13.3', sizeAWG: '6', material: 'aluminum', resistanceMvAm: 2.13, resistanceOhmPer1000ft: 0.808, ampacity60C: 40, ampacity75C: 50, ampacity90C: 55, standard: 'NEC' },
  { sizeMetric: '21.2', sizeAWG: '4', material: 'aluminum', resistanceMvAm: 1.34, resistanceOhmPer1000ft: 0.508, ampacity60C: 55, ampacity75C: 65, ampacity90C: 75, standard: 'NEC' },
  { sizeMetric: '26.7', sizeAWG: '3', material: 'aluminum', resistanceMvAm: 1.06, resistanceOhmPer1000ft: 0.403, ampacity60C: 65, ampacity75C: 75, ampacity90C: 85, standard: 'NEC' },
  { sizeMetric: '33.6', sizeAWG: '2', material: 'aluminum', resistanceMvAm: 0.843, resistanceOhmPer1000ft: 0.319, ampacity60C: 75, ampacity75C: 90, ampacity90C: 100, standard: 'NEC' },
  { sizeMetric: '42.4', sizeAWG: '1', material: 'aluminum', resistanceMvAm: 0.668, resistanceOhmPer1000ft: 0.253, ampacity60C: 85, ampacity75C: 100, ampacity90C: 115, standard: 'NEC' },
  { sizeMetric: '53.5', sizeAWG: '1/0', material: 'aluminum', resistanceMvAm: 0.530, resistanceOhmPer1000ft: 0.201, ampacity60C: 100, ampacity75C: 120, ampacity90C: 135, standard: 'NEC' },
  { sizeMetric: '67.4', sizeAWG: '2/0', material: 'aluminum', resistanceMvAm: 0.420, resistanceOhmPer1000ft: 0.159, ampacity60C: 115, ampacity75C: 135, ampacity90C: 150, standard: 'NEC' },
  { sizeMetric: '85.0', sizeAWG: '3/0', material: 'aluminum', resistanceMvAm: 0.333, resistanceOhmPer1000ft: 0.126, ampacity60C: 130, ampacity75C: 155, ampacity90C: 175, standard: 'NEC' },
  { sizeMetric: '107', sizeAWG: '4/0', material: 'aluminum', resistanceMvAm: 0.264, resistanceOhmPer1000ft: 0.100, ampacity60C: 150, ampacity75C: 180, ampacity90C: 205, standard: 'NEC' },
  { sizeMetric: '127', sizeAWG: '250', material: 'aluminum', resistanceMvAm: 0.223, resistanceOhmPer1000ft: 0.0847, ampacity60C: 170, ampacity75C: 205, ampacity90C: 230, standard: 'NEC' },
  { sizeMetric: '152', sizeAWG: '300', material: 'aluminum', resistanceMvAm: 0.186, resistanceOhmPer1000ft: 0.0707, ampacity60C: 190, ampacity75C: 230, ampacity90C: 255, standard: 'NEC' },
  { sizeMetric: '177', sizeAWG: '350', material: 'aluminum', resistanceMvAm: 0.160, resistanceOhmPer1000ft: 0.0605, ampacity60C: 210, ampacity75C: 250, ampacity90C: 280, standard: 'NEC' },
  { sizeMetric: '203', sizeAWG: '400', material: 'aluminum', resistanceMvAm: 0.140, resistanceOhmPer1000ft: 0.0529, ampacity60C: 225, ampacity75C: 270, ampacity90C: 305, standard: 'NEC' },
  { sizeMetric: '253', sizeAWG: '500', material: 'aluminum', resistanceMvAm: 0.112, resistanceOhmPer1000ft: 0.0424, ampacity60C: 260, ampacity75C: 310, ampacity90C: 350, standard: 'NEC' },
  { sizeMetric: '304', sizeAWG: '600', material: 'aluminum', resistanceMvAm: 0.0933, resistanceOhmPer1000ft: 0.0353, ampacity60C: 285, ampacity75C: 340, ampacity90C: 385, standard: 'NEC' },
];

/**
 * IEC 60364-5-52 Table B.52.4 - Copper Conductors in Conduit
 *
 * Current-carrying capacities for PVC insulated cables (70°C)
 * Installation method B1: single-core cables in conduit on wall
 */
export const IEC_COPPER_AMPACITY: CableTableEntry[] = [
  // Size      AWG     Material  mV/A/m  Ω/1000ft  60°C   70°C   90°C   Standard
  { sizeMetric: '1.5', sizeAWG: '16', material: 'copper', resistanceMvAm: 12.1, resistanceOhmPer1000ft: 4.59, ampacity60C: 14, ampacity75C: 17.5, ampacity90C: 22, standard: 'IEC' },
  { sizeMetric: '2.5', sizeAWG: '14', material: 'copper', resistanceMvAm: 7.41, resistanceOhmPer1000ft: 2.81, ampacity60C: 19, ampacity75C: 23, ampacity90C: 30, standard: 'IEC' },
  { sizeMetric: '4', sizeAWG: '12', material: 'copper', resistanceMvAm: 4.61, resistanceOhmPer1000ft: 1.75, ampacity60C: 25, ampacity75C: 31, ampacity90C: 40, standard: 'IEC' },
  { sizeMetric: '6', sizeAWG: '10', material: 'copper', resistanceMvAm: 3.08, resistanceOhmPer1000ft: 1.17, ampacity60C: 32, ampacity75C: 40, ampacity90C: 51, standard: 'IEC' },
  { sizeMetric: '10', sizeAWG: '8', material: 'copper', resistanceMvAm: 1.83, resistanceOhmPer1000ft: 0.695, ampacity60C: 44, ampacity75C: 54, ampacity90C: 70, standard: 'IEC' },
  { sizeMetric: '16', sizeAWG: '6', material: 'copper', resistanceMvAm: 1.15, resistanceOhmPer1000ft: 0.437, ampacity60C: 59, ampacity75C: 68, ampacity90C: 94, standard: 'IEC' },
  { sizeMetric: '25', sizeAWG: '4', material: 'copper', resistanceMvAm: 0.727, resistanceOhmPer1000ft: 0.276, ampacity60C: 77, ampacity75C: 89, ampacity90C: 119, standard: 'IEC' },
  { sizeMetric: '35', sizeAWG: '2', material: 'copper', resistanceMvAm: 0.524, resistanceOhmPer1000ft: 0.199, ampacity60C: 96, ampacity75C: 110, ampacity90C: 148, standard: 'IEC' },
  { sizeMetric: '50', sizeAWG: '1/0', material: 'copper', resistanceMvAm: 0.387, resistanceOhmPer1000ft: 0.147, ampacity60C: 117, ampacity75C: 133, ampacity90C: 180, standard: 'IEC' },
  { sizeMetric: '70', sizeAWG: '2/0', material: 'copper', resistanceMvAm: 0.268, resistanceOhmPer1000ft: 0.102, ampacity60C: 149, ampacity75C: 168, ampacity90C: 232, standard: 'IEC' },
  { sizeMetric: '95', sizeAWG: '3/0', material: 'copper', resistanceMvAm: 0.193, resistanceOhmPer1000ft: 0.0733, ampacity60C: 180, ampacity75C: 201, ampacity90C: 282, standard: 'IEC' },
  { sizeMetric: '120', sizeAWG: '4/0', material: 'copper', resistanceMvAm: 0.153, resistanceOhmPer1000ft: 0.0581, ampacity60C: 208, ampacity75C: 232, ampacity90C: 328, standard: 'IEC' },
  { sizeMetric: '150', sizeAWG: '300', material: 'copper', resistanceMvAm: 0.124, resistanceOhmPer1000ft: 0.0471, ampacity60C: 236, ampacity75C: 258, ampacity90C: 374, standard: 'IEC' },
  { sizeMetric: '185', sizeAWG: '350', material: 'copper', resistanceMvAm: 0.0991, resistanceOhmPer1000ft: 0.0376, ampacity60C: 268, ampacity75C: 289, ampacity90C: 424, standard: 'IEC' },
  { sizeMetric: '240', sizeAWG: '500', material: 'copper', resistanceMvAm: 0.0754, resistanceOhmPer1000ft: 0.0286, ampacity60C: 315, ampacity75C: 341, ampacity90C: 500, standard: 'IEC' },
  { sizeMetric: '300', sizeAWG: '600', material: 'copper', resistanceMvAm: 0.0601, resistanceOhmPer1000ft: 0.0228, ampacity60C: 360, ampacity75C: 384, ampacity90C: 561, standard: 'IEC' },
];

/**
 * IEC 60364-5-52 - Aluminum Conductors
 */
export const IEC_ALUMINUM_AMPACITY: CableTableEntry[] = [
  { sizeMetric: '2.5', sizeAWG: '14', material: 'aluminum', resistanceMvAm: 12.1, resistanceOhmPer1000ft: 4.59, ampacity60C: 14.5, ampacity75C: 18, ampacity90C: 23, standard: 'IEC' },
  { sizeMetric: '4', sizeAWG: '12', material: 'aluminum', resistanceMvAm: 7.54, resistanceOhmPer1000ft: 2.86, ampacity60C: 19.5, ampacity75C: 24, ampacity90C: 31, standard: 'IEC' },
  { sizeMetric: '6', sizeAWG: '10', material: 'aluminum', resistanceMvAm: 5.03, resistanceOhmPer1000ft: 1.91, ampacity60C: 25, ampacity75C: 31, ampacity90C: 40, standard: 'IEC' },
  { sizeMetric: '10', sizeAWG: '8', material: 'aluminum', resistanceMvAm: 3.00, resistanceOhmPer1000ft: 1.14, ampacity60C: 34, ampacity75C: 42, ampacity90C: 54, standard: 'IEC' },
  { sizeMetric: '16', sizeAWG: '6', material: 'aluminum', resistanceMvAm: 1.88, resistanceOhmPer1000ft: 0.714, ampacity60C: 46, ampacity75C: 53, ampacity90C: 73, standard: 'IEC' },
  { sizeMetric: '25', sizeAWG: '4', material: 'aluminum', resistanceMvAm: 1.19, resistanceOhmPer1000ft: 0.452, ampacity60C: 60, ampacity75C: 69, ampacity90C: 92, standard: 'IEC' },
  { sizeMetric: '35', sizeAWG: '2', material: 'aluminum', resistanceMvAm: 0.858, resistanceOhmPer1000ft: 0.326, ampacity60C: 75, ampacity75C: 86, ampacity90C: 115, standard: 'IEC' },
  { sizeMetric: '50', sizeAWG: '1/0', material: 'aluminum', resistanceMvAm: 0.633, resistanceOhmPer1000ft: 0.240, ampacity60C: 92, ampacity75C: 104, ampacity90C: 140, standard: 'IEC' },
  { sizeMetric: '70', sizeAWG: '2/0', material: 'aluminum', resistanceMvAm: 0.439, resistanceOhmPer1000ft: 0.167, ampacity60C: 116, ampacity75C: 131, ampacity90C: 180, standard: 'IEC' },
  { sizeMetric: '95', sizeAWG: '3/0', material: 'aluminum', resistanceMvAm: 0.316, resistanceOhmPer1000ft: 0.120, ampacity60C: 140, ampacity75C: 157, ampacity90C: 219, standard: 'IEC' },
  { sizeMetric: '120', sizeAWG: '4/0', material: 'aluminum', resistanceMvAm: 0.250, resistanceOhmPer1000ft: 0.0950, ampacity60C: 162, ampacity75C: 181, ampacity90C: 254, standard: 'IEC' },
  { sizeMetric: '150', sizeAWG: '300', material: 'aluminum', resistanceMvAm: 0.203, resistanceOhmPer1000ft: 0.0771, ampacity60C: 184, ampacity75C: 201, ampacity90C: 290, standard: 'IEC' },
  { sizeMetric: '185', sizeAWG: '350', material: 'aluminum', resistanceMvAm: 0.162, resistanceOhmPer1000ft: 0.0615, ampacity60C: 209, ampacity75C: 225, ampacity90C: 329, standard: 'IEC' },
  { sizeMetric: '240', sizeAWG: '500', material: 'aluminum', resistanceMvAm: 0.123, resistanceOhmPer1000ft: 0.0467, ampacity60C: 246, ampacity75C: 266, ampacity90C: 388, standard: 'IEC' },
];

/**
 * Combined cable tables for lookup
 */
export const ALL_CABLE_TABLES: CableTableEntry[] = [
  ...NEC_COPPER_AMPACITY,
  ...NEC_ALUMINUM_AMPACITY,
  ...IEC_COPPER_AMPACITY,
  ...IEC_ALUMINUM_AMPACITY,
];

/**
 * Standard cable sizes in mm² (IEC)
 */
export const IEC_CABLE_SIZES_MM2 = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630,
];

/**
 * Standard cable sizes in AWG (NEC)
 * Includes kcmil sizes for larger conductors
 */
export const NEC_CABLE_SIZES_AWG = [
  '14', '12', '10', '8', '6', '4', '3', '2', '1',
  '1/0', '2/0', '3/0', '4/0',
  '250', '300', '350', '400', '500', '600', '750', '1000',
];

/**
 * Lookup cable entry by size and material
 */
export function lookupCableBySize(
  sizeMm2: number | null,
  sizeAWG: string | null,
  material: 'copper' | 'aluminum',
  standard: 'IEC' | 'NEC'
): CableTableEntry | undefined {
  if (standard === 'IEC' && sizeMm2 !== null) {
    const tables = material === 'copper' ? IEC_COPPER_AMPACITY : IEC_ALUMINUM_AMPACITY;
    return tables.find(
      (entry) => parseFloat(entry.sizeMetric) === sizeMm2
    );
  }

  if (standard === 'NEC' && sizeAWG !== null) {
    const tables = material === 'copper' ? NEC_COPPER_AMPACITY : NEC_ALUMINUM_AMPACITY;
    return tables.find((entry) => entry.sizeAWG === sizeAWG);
  }

  return undefined;
}

/**
 * Get available cable sizes for a given standard and material
 */
export function getAvailableCableSizes(
  standard: 'IEC' | 'NEC',
  material: 'copper' | 'aluminum'
): CableTableEntry[] {
  if (standard === 'IEC') {
    return material === 'copper' ? IEC_COPPER_AMPACITY : IEC_ALUMINUM_AMPACITY;
  }
  return material === 'copper' ? NEC_COPPER_AMPACITY : NEC_ALUMINUM_AMPACITY;
}

/**
 * Find minimum cable size for given current and conditions
 */
export function findMinimumCableSize(
  requiredCurrent: number,
  material: 'copper' | 'aluminum',
  insulationRating: 60 | 75 | 90,
  standard: 'IEC' | 'NEC'
): CableTableEntry | undefined {
  const tables = getAvailableCableSizes(standard, material);

  // Get ampacity for the given insulation rating
  const ampacityKey = `ampacity${insulationRating}C` as keyof CableTableEntry;

  // Find smallest cable that meets current requirement
  return tables.find(
    (entry) => (entry[ampacityKey] as number) >= requiredCurrent
  );
}

/**
 * Format cable size for display
 */
export function formatCableSize(entry: CableTableEntry): string {
  if (entry.standard === 'IEC') {
    return `${entry.sizeMetric} mm²`;
  }
  if (entry.standard === 'NEC') {
    const size = entry.sizeAWG ?? entry.sizeMetric;
    if (size && parseInt(size) >= 250) {
      return `${size} kcmil`;
    }
    return `${size} AWG`;
  }
  return `${entry.sizeMetric} mm² (${entry.sizeAWG} AWG)`;
}
