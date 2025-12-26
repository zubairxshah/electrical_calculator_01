/**
 * Temperature and Grouping Derating Factor Tables
 * Feature: 001-electromate-engineering-app
 * Task: T083 - Create lib/standards/deratingTables.ts
 *
 * Reference data for ampacity derating from:
 * - NEC 310.15(B)(2)(a): Temperature correction factors
 * - NEC 310.15(C)(1): Adjustment factors for bundled conductors
 * - IEC 60364-5-52 Table B.52.14: Temperature correction
 * - IEC 60364-5-52 Table B.52.17: Grouping factors
 *
 * @see data-model.md - DeratingFactors interface
 */

/**
 * Temperature correction factor entry
 */
export interface TempCorrectionEntry {
  /** Ambient temperature range start (°C) */
  tempMin: number;
  /** Ambient temperature range end (°C) */
  tempMax: number;
  /** Correction factor for 60°C insulation */
  factor60C: number;
  /** Correction factor for 75°C insulation */
  factor75C: number;
  /** Correction factor for 90°C insulation */
  factor90C: number;
}

/**
 * Grouping/bundling factor entry
 */
export interface GroupingFactorEntry {
  /** Minimum number of conductors */
  conductorsMin: number;
  /** Maximum number of conductors */
  conductorsMax: number;
  /** Derating factor */
  factor: number;
}

/**
 * NEC Table 310.15(B)(2)(a) - Temperature Correction Factors
 *
 * For ambient temperatures other than 30°C (86°F).
 * Based on 30°C ambient temperature.
 */
export const NEC_TEMPERATURE_CORRECTION: TempCorrectionEntry[] = [
  { tempMin: -40, tempMax: -31, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: -30, tempMax: -21, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: -20, tempMax: -16, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: -15, tempMax: -11, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: -10, tempMax: -6, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: -5, tempMax: -1, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 0, tempMax: 5, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 6, tempMax: 10, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 11, tempMax: 15, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 16, tempMax: 20, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 21, tempMax: 25, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 26, tempMax: 30, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 31, tempMax: 35, factor60C: 0.91, factor75C: 0.94, factor90C: 0.96 },
  { tempMin: 36, tempMax: 40, factor60C: 0.82, factor75C: 0.88, factor90C: 0.91 },
  { tempMin: 41, tempMax: 45, factor60C: 0.71, factor75C: 0.82, factor90C: 0.87 },
  { tempMin: 46, tempMax: 50, factor60C: 0.58, factor75C: 0.75, factor90C: 0.82 },
  { tempMin: 51, tempMax: 55, factor60C: 0.41, factor75C: 0.67, factor90C: 0.76 },
  { tempMin: 56, tempMax: 60, factor60C: 0.00, factor75C: 0.58, factor90C: 0.71 },
  { tempMin: 61, tempMax: 65, factor60C: 0.00, factor75C: 0.47, factor90C: 0.65 },
  { tempMin: 66, tempMax: 70, factor60C: 0.00, factor75C: 0.33, factor90C: 0.58 },
  { tempMin: 71, tempMax: 75, factor60C: 0.00, factor75C: 0.00, factor90C: 0.50 },
  { tempMin: 76, tempMax: 80, factor60C: 0.00, factor75C: 0.00, factor90C: 0.41 },
  { tempMin: 81, tempMax: 85, factor60C: 0.00, factor75C: 0.00, factor90C: 0.29 },
  { tempMin: 86, tempMax: 90, factor60C: 0.00, factor75C: 0.00, factor90C: 0.00 },
];

/**
 * NEC Table 310.15(C)(1) - Adjustment Factors for Bundled Conductors
 *
 * More than three current-carrying conductors in raceway or cable.
 */
export const NEC_GROUPING_FACTORS: GroupingFactorEntry[] = [
  { conductorsMin: 1, conductorsMax: 3, factor: 1.00 },
  { conductorsMin: 4, conductorsMax: 6, factor: 0.80 },
  { conductorsMin: 7, conductorsMax: 9, factor: 0.70 },
  { conductorsMin: 10, conductorsMax: 20, factor: 0.50 },
  { conductorsMin: 21, conductorsMax: 30, factor: 0.45 },
  { conductorsMin: 31, conductorsMax: 40, factor: 0.40 },
  { conductorsMin: 41, conductorsMax: 999, factor: 0.35 },
];

/**
 * IEC 60364-5-52 Table B.52.14 - Temperature Correction Factors
 *
 * For PVC insulation (70°C) and XLPE/EPR insulation (90°C)
 * Based on 30°C ambient temperature.
 */
export const IEC_TEMPERATURE_CORRECTION: TempCorrectionEntry[] = [
  // Note: IEC uses different temperature ratings (70°C PVC, 90°C XLPE)
  // factor75C here represents 70°C PVC, factor90C represents XLPE/EPR
  { tempMin: 10, tempMax: 10, factor60C: 1.22, factor75C: 1.22, factor90C: 1.15 },
  { tempMin: 11, tempMax: 15, factor60C: 1.17, factor75C: 1.17, factor90C: 1.12 },
  { tempMin: 16, tempMax: 20, factor60C: 1.12, factor75C: 1.12, factor90C: 1.08 },
  { tempMin: 21, tempMax: 25, factor60C: 1.06, factor75C: 1.06, factor90C: 1.04 },
  { tempMin: 26, tempMax: 30, factor60C: 1.00, factor75C: 1.00, factor90C: 1.00 },
  { tempMin: 31, tempMax: 35, factor60C: 0.94, factor75C: 0.94, factor90C: 0.96 },
  { tempMin: 36, tempMax: 40, factor60C: 0.87, factor75C: 0.87, factor90C: 0.91 },
  { tempMin: 41, tempMax: 45, factor60C: 0.79, factor75C: 0.79, factor90C: 0.87 },
  { tempMin: 46, tempMax: 50, factor60C: 0.71, factor75C: 0.71, factor90C: 0.82 },
  { tempMin: 51, tempMax: 55, factor60C: 0.61, factor75C: 0.61, factor90C: 0.76 },
  { tempMin: 56, tempMax: 60, factor60C: 0.50, factor75C: 0.50, factor90C: 0.71 },
  { tempMin: 61, tempMax: 65, factor60C: 0.35, factor75C: 0.35, factor90C: 0.65 },
  { tempMin: 66, tempMax: 70, factor60C: 0.00, factor75C: 0.00, factor90C: 0.58 },
  { tempMin: 71, tempMax: 75, factor60C: 0.00, factor75C: 0.00, factor90C: 0.50 },
  { tempMin: 76, tempMax: 80, factor60C: 0.00, factor75C: 0.00, factor90C: 0.41 },
];

/**
 * IEC 60364-5-52 Table B.52.17 - Grouping Factors
 *
 * Reduction factors for cables installed in groups.
 * Depends on installation method and number of circuits.
 */
export interface IECGroupingFactorEntry {
  circuits: number;
  /** Method A: Enclosed in conduit in thermally insulated wall */
  methodA: number;
  /** Method B: Enclosed in conduit on wall */
  methodB: number;
  /** Method C: Clipped direct to wall */
  methodC: number;
  /** Method E: In free air, single layer */
  methodE: number;
}

export const IEC_GROUPING_FACTORS: IECGroupingFactorEntry[] = [
  { circuits: 1, methodA: 1.00, methodB: 1.00, methodC: 1.00, methodE: 1.00 },
  { circuits: 2, methodA: 0.80, methodB: 0.85, methodC: 0.85, methodE: 0.88 },
  { circuits: 3, methodA: 0.70, methodB: 0.79, methodC: 0.79, methodE: 0.82 },
  { circuits: 4, methodA: 0.65, methodB: 0.75, methodC: 0.75, methodE: 0.77 },
  { circuits: 5, methodA: 0.60, methodB: 0.73, methodC: 0.73, methodE: 0.75 },
  { circuits: 6, methodA: 0.57, methodB: 0.72, methodC: 0.72, methodE: 0.73 },
  { circuits: 7, methodA: 0.54, methodB: 0.70, methodC: 0.70, methodE: 0.73 },
  { circuits: 8, methodA: 0.52, methodB: 0.70, methodC: 0.70, methodE: 0.72 },
  { circuits: 9, methodA: 0.50, methodB: 0.70, methodC: 0.70, methodE: 0.72 },
  { circuits: 12, methodA: 0.45, methodB: 0.65, methodC: 0.65, methodE: 0.70 },
  { circuits: 16, methodA: 0.41, methodB: 0.60, methodC: 0.60, methodE: 0.68 },
  { circuits: 20, methodA: 0.38, methodB: 0.57, methodC: 0.57, methodE: 0.66 },
];

/**
 * Get temperature correction factor for NEC
 */
export function getNECTemperatureFactor(
  ambientTemp: number,
  insulationRating: 60 | 75 | 90
): number {
  const entry = NEC_TEMPERATURE_CORRECTION.find(
    (e) => ambientTemp >= e.tempMin && ambientTemp <= e.tempMax
  );

  if (!entry) {
    // Temperature out of range
    if (ambientTemp < -40) return 1.0;
    return 0.0; // Too hot
  }

  switch (insulationRating) {
    case 60:
      return entry.factor60C;
    case 75:
      return entry.factor75C;
    case 90:
      return entry.factor90C;
    default:
      return entry.factor75C;
  }
}

/**
 * Get grouping factor for NEC
 */
export function getNECGroupingFactor(numberOfConductors: number): number {
  const entry = NEC_GROUPING_FACTORS.find(
    (e) =>
      numberOfConductors >= e.conductorsMin &&
      numberOfConductors <= e.conductorsMax
  );

  return entry?.factor ?? 0.35;
}

/**
 * Get temperature correction factor for IEC
 */
export function getIECTemperatureFactor(
  ambientTemp: number,
  insulationRating: 70 | 90
): number {
  const entry = IEC_TEMPERATURE_CORRECTION.find(
    (e) => ambientTemp >= e.tempMin && ambientTemp <= e.tempMax
  );

  if (!entry) {
    if (ambientTemp < 10) return 1.22;
    return 0.0; // Too hot
  }

  // IEC uses 70°C for PVC (mapped to factor75C) and 90°C for XLPE
  return insulationRating === 70 ? entry.factor75C : entry.factor90C;
}

/**
 * Installation method type for IEC
 */
export type IECInstallationMethod = 'A' | 'B' | 'C' | 'E' | 'conduit' | 'cable-tray' | 'direct' | 'free-air';

/**
 * Map user-friendly installation method to IEC method
 */
function mapInstallationMethod(method: IECInstallationMethod): 'A' | 'B' | 'C' | 'E' {
  switch (method) {
    case 'A':
    case 'conduit':
      return 'A';
    case 'B':
      return 'B';
    case 'C':
    case 'cable-tray':
    case 'direct':
      return 'C';
    case 'E':
    case 'free-air':
      return 'E';
    default:
      return 'B'; // Default to conduit on wall
  }
}

/**
 * Get grouping factor for IEC
 */
export function getIECGroupingFactor(
  numberOfCircuits: number,
  installationMethod: IECInstallationMethod = 'B'
): number {
  const method = mapInstallationMethod(installationMethod);

  // Find the entry with exact match or next higher
  const entry = IEC_GROUPING_FACTORS.find((e) => e.circuits >= numberOfCircuits);

  if (!entry) {
    // More than 20 circuits - use lowest factor
    return 0.38;
  }

  switch (method) {
    case 'A':
      return entry.methodA;
    case 'B':
      return entry.methodB;
    case 'C':
      return entry.methodC;
    case 'E':
      return entry.methodE;
    default:
      return entry.methodB;
  }
}

/**
 * Calculate combined derating factors
 */
export interface DeratingInput {
  ambientTemp: number;
  insulationRating: 60 | 70 | 75 | 90;
  numberOfConductors: number;
  installationMethod?: IECInstallationMethod;
  standard: 'NEC' | 'IEC';
}

export interface DeratingResult {
  temperatureFactor: number;
  groupingFactor: number;
  totalFactor: number;
  standardReference: string;
}

export function calculateCombinedDerating(input: DeratingInput): DeratingResult {
  let temperatureFactor: number;
  let groupingFactor: number;
  let standardReference: string;

  if (input.standard === 'NEC') {
    // Map IEC insulation ratings to NEC equivalents
    const necRating =
      input.insulationRating === 70 ? 75 : (input.insulationRating as 60 | 75 | 90);
    temperatureFactor = getNECTemperatureFactor(input.ambientTemp, necRating);
    groupingFactor = getNECGroupingFactor(input.numberOfConductors);
    standardReference = 'NEC 310.15(B)(2)(a), NEC 310.15(C)(1)';
  } else {
    // IEC standard
    const iecRating = input.insulationRating === 75 ? 70 : (input.insulationRating as 70 | 90);
    temperatureFactor = getIECTemperatureFactor(input.ambientTemp, iecRating);
    // For IEC, convert conductors to circuits (assuming 3 conductors per circuit)
    const circuits = Math.ceil(input.numberOfConductors / 3);
    groupingFactor = getIECGroupingFactor(
      circuits,
      input.installationMethod ?? 'B'
    );
    standardReference = 'IEC 60364-5-52 Table B.52.14, Table B.52.17';
  }

  return {
    temperatureFactor,
    groupingFactor,
    totalFactor: temperatureFactor * groupingFactor,
    standardReference,
  };
}
