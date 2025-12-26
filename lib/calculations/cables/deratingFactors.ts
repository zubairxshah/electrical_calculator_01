/**
 * Cable Derating Factors Calculation
 * Feature: 001-electromate-engineering-app
 * Task: T087 - Implement calculateDeratingFactors
 *
 * Applies temperature and grouping corrections per:
 * - NEC 310.15(B)(2)(a): Temperature correction
 * - NEC 310.15(C)(1): Bundled conductors
 * - IEC 60364-5-52 Table B.52.14: Temperature correction
 * - IEC 60364-5-52 Table B.52.17: Grouping factors
 *
 * @see SC-009: Cable ampacity 100% compliance with NEC/IEC standards
 */

import {
  getNECTemperatureFactor,
  getNECGroupingFactor,
  getIECTemperatureFactor,
  getIECGroupingFactor,
  type IECInstallationMethod,
} from '@/lib/standards/deratingTables';

/**
 * Derating factors calculation input
 */
export interface DeratingInput {
  /** Ambient temperature in °C */
  ambientTemp: number;
  /** Insulation temperature rating */
  insulationRating: 60 | 70 | 75 | 90;
  /** Number of current-carrying conductors in raceway/cable */
  numberOfConductors: number;
  /** Installation method (for IEC) */
  installationMethod?: 'conduit' | 'cable-tray' | 'direct-burial' | 'free-air';
  /** Standard to use */
  standard: 'IEC' | 'NEC';
}

/**
 * Derating factors calculation result
 */
export interface DeratingResult {
  /** Temperature correction factor */
  temperatureFactor: number;
  /** Grouping/bundling factor */
  groupingFactor: number;
  /** Combined total factor (temp × grouping) */
  totalFactor: number;
  /** Standard reference string */
  standardReference: string;
  /** Whether any derating was applied */
  isDeratied: boolean;
  /** Warning messages */
  warnings: string[];
}

/**
 * Map installation method to IEC method code
 */
function mapToIECMethod(
  method?: 'conduit' | 'cable-tray' | 'direct-burial' | 'free-air'
): IECInstallationMethod {
  switch (method) {
    case 'conduit':
      return 'conduit';
    case 'cable-tray':
      return 'cable-tray';
    case 'direct-burial':
      return 'direct';
    case 'free-air':
      return 'free-air';
    default:
      return 'conduit';
  }
}

/**
 * Calculate combined derating factors
 *
 * @param input - Derating calculation parameters
 * @returns Combined derating factors with standard references
 *
 * @example
 * // NEC derating: 40°C ambient, 75°C insulation, 6 conductors
 * const result = calculateDeratingFactors({
 *   ambientTemp: 40,
 *   insulationRating: 75,
 *   numberOfConductors: 6,
 *   standard: 'NEC',
 * });
 * // result.temperatureFactor === 0.88
 * // result.groupingFactor === 0.80
 * // result.totalFactor === 0.704
 */
export function calculateDeratingFactors(input: DeratingInput): DeratingResult {
  const {
    ambientTemp,
    insulationRating,
    numberOfConductors,
    installationMethod,
    standard,
  } = input;

  let temperatureFactor: number;
  let groupingFactor: number;
  let standardReference: string;
  const warnings: string[] = [];

  if (standard === 'NEC') {
    // NEC temperature derating
    // Map IEC 70°C to NEC 75°C equivalent
    const necRating =
      insulationRating === 70 ? 75 : (insulationRating as 60 | 75 | 90);
    temperatureFactor = getNECTemperatureFactor(ambientTemp, necRating);

    // NEC grouping derating
    groupingFactor = getNECGroupingFactor(numberOfConductors);

    standardReference = 'NEC 310.15(B)(2)(a), NEC 310.15(C)(1)';

    // Add warnings for extreme conditions
    if (temperatureFactor === 0) {
      warnings.push(
        `Ambient temperature ${ambientTemp}°C exceeds maximum for ${insulationRating}°C insulation`
      );
    }
    if (temperatureFactor < 0.5 && temperatureFactor > 0) {
      warnings.push(
        `High ambient temperature ${ambientTemp}°C results in significant derating (${(temperatureFactor * 100).toFixed(0)}%)`
      );
    }
    if (groupingFactor < 0.5) {
      warnings.push(
        `Large number of conductors (${numberOfConductors}) results in significant derating (${(groupingFactor * 100).toFixed(0)}%)`
      );
    }
  } else {
    // IEC temperature derating
    // Map NEC ratings to IEC equivalents
    const iecRating =
      insulationRating === 75 ? 70 : (insulationRating as 70 | 90);
    temperatureFactor = getIECTemperatureFactor(ambientTemp, iecRating);

    // IEC grouping derating
    // For IEC, convert conductors to circuits (3 conductors per 3-phase circuit)
    const circuits = Math.ceil(numberOfConductors / 3);
    groupingFactor = getIECGroupingFactor(
      circuits,
      mapToIECMethod(installationMethod)
    );

    standardReference = 'IEC 60364-5-52 Table B.52.14, Table B.52.17';

    // Add warnings
    if (temperatureFactor === 0) {
      warnings.push(
        `Ambient temperature ${ambientTemp}°C exceeds maximum for ${insulationRating}°C insulation`
      );
    }
    if (groupingFactor < 0.5) {
      warnings.push(
        `Large number of circuits (${circuits}) results in significant derating (${(groupingFactor * 100).toFixed(0)}%)`
      );
    }
  }

  // Calculate total factor
  const totalFactor = temperatureFactor * groupingFactor;

  // Determine if any derating is applied
  const isDeratied = totalFactor < 1.0;

  if (totalFactor < 0.4) {
    warnings.push(
      `Combined derating factor ${(totalFactor * 100).toFixed(0)}% is very low. Consider alternative installation method.`
    );
  }

  return {
    temperatureFactor: Math.round(temperatureFactor * 1000) / 1000, // 3 decimal places
    groupingFactor: Math.round(groupingFactor * 1000) / 1000,
    totalFactor: Math.round(totalFactor * 1000) / 1000,
    standardReference,
    isDeratied,
    warnings,
  };
}

/**
 * Calculate derated ampacity
 *
 * @param baseAmpacity - Original ampacity from tables
 * @param totalDeratingFactor - Combined derating factor
 * @returns Derated ampacity
 */
export function calculateDeratedAmpacity(
  baseAmpacity: number,
  totalDeratingFactor: number
): number {
  return Math.floor(baseAmpacity * totalDeratingFactor);
}

/**
 * Check if current exceeds derated ampacity (safety check)
 *
 * @param current - Load current in Amperes
 * @param baseAmpacity - Original cable ampacity
 * @param deratingFactor - Combined derating factor
 * @returns Safety check result
 */
export function checkAmpacityCompliance(
  current: number,
  baseAmpacity: number,
  deratingFactor: number
): {
  deratedAmpacity: number;
  isCompliant: boolean;
  utilizationPercent: number;
  warning?: string;
} {
  const deratedAmpacity = calculateDeratedAmpacity(baseAmpacity, deratingFactor);
  const utilizationPercent = (current / deratedAmpacity) * 100;
  const isCompliant = current <= deratedAmpacity;

  let warning: string | undefined;

  if (!isCompliant) {
    warning = `Current ${current}A exceeds derated ampacity ${deratedAmpacity}A (${utilizationPercent.toFixed(0)}% utilization). Risk of overheating.`;
  } else if (utilizationPercent > 80) {
    warning = `High utilization (${utilizationPercent.toFixed(0)}%). Consider larger cable size.`;
  }

  return {
    deratedAmpacity,
    isCompliant,
    utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    warning,
  };
}

export default calculateDeratingFactors;
