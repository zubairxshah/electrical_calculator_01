/**
 * Cable Ampacity Lookup
 * Feature: 001-electromate-engineering-app
 * Task: T086 - Implement lookupCableAmpacity
 *
 * Provides type-safe lookup for cable ampacity from:
 * - NEC Table 310.15(B)(16)
 * - IEC 60364-5-52 Table B.52.4
 *
 * @see SC-009: Cable ampacity 100% compliance with NEC/IEC standards
 */

import {
  NEC_COPPER_AMPACITY,
  NEC_ALUMINUM_AMPACITY,
  IEC_COPPER_AMPACITY,
  IEC_ALUMINUM_AMPACITY,
  type CableTableEntry,
} from '@/lib/standards/cableTables';

/**
 * Ampacity lookup input parameters
 */
export interface AmpacityLookupInput {
  /** Cable size in mm² (for IEC) */
  cableSizeMm2?: number;
  /** Cable size in AWG (for NEC) */
  cableSizeAWG?: string;
  /** Conductor material */
  conductorMaterial: 'copper' | 'aluminum';
  /** Insulation temperature rating */
  insulationRating: 60 | 70 | 75 | 90;
  /** Standard to use */
  standard: 'IEC' | 'NEC';
  /** Installation method (for IEC) */
  installationMethod?: 'conduit' | 'cable-tray' | 'direct-burial' | 'free-air';
}

/**
 * Ampacity lookup result
 */
export interface CableAmpacity {
  /** Ampacity in Amperes */
  ampacity: number;
  /** Cable size in mm² */
  sizeMm2: string;
  /** Cable size in AWG (if available) */
  sizeAWG: string | null;
  /** Conductor material */
  material: 'copper' | 'aluminum';
  /** Resistance in mV/A/m (for IEC calculations) */
  resistanceMvAm: number;
  /** Resistance in Ω/1000ft (for NEC calculations) */
  resistanceOhmPer1000ft: number;
  /** Full cable table entry */
  entry: CableTableEntry;
  /** Standard reference */
  standardReference: string;
}

/**
 * Map insulation ratings to cable table property names
 */
function getAmpacityKey(
  insulationRating: number,
  standard: 'IEC' | 'NEC'
): keyof CableTableEntry {
  // IEC uses 70°C for PVC, map to 75°C column
  if (standard === 'IEC' && insulationRating === 70) {
    return 'ampacity75C';
  }

  switch (insulationRating) {
    case 60:
      return 'ampacity60C';
    case 75:
      return 'ampacity75C';
    case 90:
      return 'ampacity90C';
    default:
      return 'ampacity75C';
  }
}

/**
 * Look up cable ampacity from standards tables
 *
 * @param input - Lookup parameters
 * @returns Cable ampacity and related data
 * @throws Error if cable size not found
 *
 * @example
 * // NEC lookup: 10 AWG copper at 75°C
 * const result = lookupCableAmpacity({
 *   cableSizeAWG: '10',
 *   conductorMaterial: 'copper',
 *   insulationRating: 75,
 *   standard: 'NEC',
 * });
 * // result.ampacity === 35
 */
export function lookupCableAmpacity(input: AmpacityLookupInput): CableAmpacity {
  const {
    cableSizeMm2,
    cableSizeAWG,
    conductorMaterial,
    insulationRating,
    standard,
  } = input;

  // Select appropriate table based on standard and material
  let cableTable: CableTableEntry[];
  if (standard === 'IEC') {
    cableTable =
      conductorMaterial === 'copper' ? IEC_COPPER_AMPACITY : IEC_ALUMINUM_AMPACITY;
  } else {
    cableTable =
      conductorMaterial === 'copper' ? NEC_COPPER_AMPACITY : NEC_ALUMINUM_AMPACITY;
  }

  // Find the cable entry
  let entry: CableTableEntry | undefined;

  if (standard === 'IEC' && cableSizeMm2 !== undefined) {
    entry = cableTable.find(
      (e) => parseFloat(e.sizeMetric) === cableSizeMm2
    );
  } else if (standard === 'NEC' && cableSizeAWG !== undefined) {
    entry = cableTable.find((e) => e.sizeAWG === cableSizeAWG);
  }

  if (!entry) {
    const sizeStr = standard === 'IEC' ? `${cableSizeMm2}mm²` : cableSizeAWG;
    throw new Error(
      `Cable size not found: ${sizeStr} ${conductorMaterial} (${standard})`
    );
  }

  // Get ampacity for specified insulation rating
  const ampacityKey = getAmpacityKey(insulationRating, standard);
  const ampacity = entry[ampacityKey] as number;

  // Build standard reference
  const standardReference =
    standard === 'NEC'
      ? 'NEC 2020 Table 310.15(B)(16)'
      : 'IEC 60364-5-52 Table B.52.4';

  return {
    ampacity,
    sizeMm2: entry.sizeMetric,
    sizeAWG: entry.sizeAWG,
    material: entry.material,
    resistanceMvAm: entry.resistanceMvAm,
    resistanceOhmPer1000ft: entry.resistanceOhmPer1000ft,
    entry,
    standardReference,
  };
}

/**
 * Find minimum cable size for a given current
 *
 * @param current - Required current in Amperes
 * @param conductorMaterial - Copper or aluminum
 * @param insulationRating - Temperature rating
 * @param standard - IEC or NEC
 * @returns Minimum cable size meeting current requirement
 */
export function findMinimumCableForCurrent(
  current: number,
  conductorMaterial: 'copper' | 'aluminum',
  insulationRating: 60 | 70 | 75 | 90,
  standard: 'IEC' | 'NEC'
): CableAmpacity | null {
  // Select appropriate table
  let cableTable: CableTableEntry[];
  if (standard === 'IEC') {
    cableTable =
      conductorMaterial === 'copper' ? IEC_COPPER_AMPACITY : IEC_ALUMINUM_AMPACITY;
  } else {
    cableTable =
      conductorMaterial === 'copper' ? NEC_COPPER_AMPACITY : NEC_ALUMINUM_AMPACITY;
  }

  const ampacityKey = getAmpacityKey(insulationRating, standard);

  // Find smallest cable that meets current requirement
  for (const entry of cableTable) {
    const ampacity = entry[ampacityKey] as number;
    if (ampacity >= current) {
      const standardReference =
        standard === 'NEC'
          ? 'NEC 2020 Table 310.15(B)(16)'
          : 'IEC 60364-5-52 Table B.52.4';

      return {
        ampacity,
        sizeMm2: entry.sizeMetric,
        sizeAWG: entry.sizeAWG,
        material: entry.material,
        resistanceMvAm: entry.resistanceMvAm,
        resistanceOhmPer1000ft: entry.resistanceOhmPer1000ft,
        entry,
        standardReference,
      };
    }
  }

  return null; // No cable found that can handle the current
}

/**
 * Get all available cable sizes for a standard/material combination
 */
export function getAvailableSizes(
  conductorMaterial: 'copper' | 'aluminum',
  standard: 'IEC' | 'NEC'
): CableTableEntry[] {
  if (standard === 'IEC') {
    return conductorMaterial === 'copper'
      ? IEC_COPPER_AMPACITY
      : IEC_ALUMINUM_AMPACITY;
  }
  return conductorMaterial === 'copper'
    ? NEC_COPPER_AMPACITY
    : NEC_ALUMINUM_AMPACITY;
}

/**
 * Check if current exceeds cable ampacity
 *
 * @param current - Load current in Amperes
 * @param ampacity - Cable ampacity (after derating)
 * @returns Whether current exceeds ampacity (overload condition)
 */
export function isOverloaded(current: number, ampacity: number): boolean {
  return current > ampacity;
}

export default lookupCableAmpacity;
