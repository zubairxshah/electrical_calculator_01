/**
 * Cable Size Recommendation
 * Feature: 001-electromate-engineering-app
 * Task: T088 - Implement recommendCableSize
 *
 * Integrates voltage drop, ampacity, and derating to recommend
 * optimal cable size meeting NEC/IEC requirements.
 *
 * @see FR-009: Voltage drop >3% red highlighting
 * @see SC-004: Voltage drop ±0.1% accuracy
 * @see SC-009: Cable ampacity 100% NEC/IEC compliance
 */

import { calculateVoltageDrop, type VoltageDropInput, type VoltageDrop } from './voltageDrop';
import { lookupCableAmpacity, getAvailableSizes, type CableAmpacity } from './ampacity';
import { calculateDeratingFactors, calculateDeratedAmpacity, type DeratingInput, type DeratingResult } from './deratingFactors';
import type { CableTableEntry } from '@/lib/standards/cableTables';

/**
 * Cable sizing input parameters
 */
export interface CableSizingInput {
  /** System voltage in Volts */
  systemVoltage: number;
  /** Circuit current in Amperes */
  current: number;
  /** Cable length in meters (IEC) or feet (NEC) */
  length: number;
  /** Conductor material */
  conductorMaterial: 'copper' | 'aluminum';
  /** Installation method */
  installationMethod: 'conduit' | 'cable-tray' | 'direct-burial' | 'free-air';
  /** Ambient temperature in °C */
  ambientTemp: number;
  /** Circuit type */
  circuitType: 'single-phase' | 'three-phase';
  /** Number of current-carrying conductors */
  numberOfConductors: number;
  /** Insulation temperature rating */
  insulationRating?: 60 | 70 | 75 | 90;
  /** Standard to use */
  standard: 'IEC' | 'NEC';
  /** Maximum acceptable voltage drop percentage (default 3%) */
  maxVoltageDropPercent?: number;
}

/**
 * Cable recommendation result
 */
export interface CableSizingResult {
  /** Recommended cable size */
  recommendedSize: {
    sizeMm2: string;
    sizeAWG: string | null;
    formattedSize: string;
  };
  /** Voltage drop calculation */
  voltageDrop: VoltageDrop;
  /** Ampacity details */
  ampacity: {
    baseAmpacity: number;
    deratedAmpacity: number;
    utilizationPercent: number;
  };
  /** Derating factors applied */
  deratingFactors: DeratingResult;
  /** Compliance status */
  compliance: {
    isVoltageDropCompliant: boolean;
    isAmpacityCompliant: boolean;
    isFullyCompliant: boolean;
  };
  /** Warnings and notes */
  warnings: string[];
  /** Alternative larger sizes that also meet requirements */
  alternativeSizes: CableTableEntry[];
  /** Standard references used */
  standardReferences: string[];
}

/**
 * Recommend optimal cable size based on voltage drop and ampacity requirements
 *
 * @param input - Cable sizing parameters
 * @returns Recommended cable size with full analysis
 *
 * @example
 * const result = recommendCableSize({
 *   systemVoltage: 230,
 *   current: 50,
 *   length: 100,
 *   conductorMaterial: 'copper',
 *   installationMethod: 'conduit',
 *   ambientTemp: 30,
 *   circuitType: 'three-phase',
 *   numberOfConductors: 3,
 *   standard: 'IEC',
 * });
 */
export function recommendCableSize(input: CableSizingInput): CableSizingResult {
  const {
    systemVoltage,
    current,
    length,
    conductorMaterial,
    installationMethod,
    ambientTemp,
    circuitType,
    numberOfConductors,
    insulationRating = 75,
    standard,
    maxVoltageDropPercent = 3,
  } = input;

  // Get derating factors
  const deratingFactors = calculateDeratingFactors({
    ambientTemp,
    insulationRating,
    numberOfConductors,
    installationMethod,
    standard,
  });

  // Get all available cable sizes
  const availableSizes = getAvailableSizes(conductorMaterial, standard);

  // Find cables that meet both voltage drop and ampacity requirements
  const suitableCables: Array<{
    entry: CableTableEntry;
    vdrop: VoltageDrop;
    ampacity: CableAmpacity;
    deratedAmpacity: number;
  }> = [];

  for (const entry of availableSizes) {
    try {
      // Calculate voltage drop for this cable
      const vdropInput: VoltageDropInput = {
        current,
        length,
        cableSizeMm2: standard === 'IEC' ? parseFloat(entry.sizeMetric) : undefined,
        cableSizeAWG: standard === 'NEC' ? entry.sizeAWG ?? undefined : undefined,
        conductorMaterial,
        circuitType,
        systemVoltage,
        standard,
      };
      const vdrop = calculateVoltageDrop(vdropInput);

      // Get ampacity for this cable
      const ampacity = lookupCableAmpacity({
        cableSizeMm2: standard === 'IEC' ? parseFloat(entry.sizeMetric) : undefined,
        cableSizeAWG: standard === 'NEC' ? entry.sizeAWG ?? undefined : undefined,
        conductorMaterial,
        insulationRating,
        standard,
      });

      // Calculate derated ampacity
      const deratedAmpacity = calculateDeratedAmpacity(
        ampacity.ampacity,
        deratingFactors.totalFactor
      );

      // Check if cable meets both requirements
      const meetsVdrop = vdrop.voltageDropPercent <= maxVoltageDropPercent;
      const meetsAmpacity = deratedAmpacity >= current;

      if (meetsVdrop && meetsAmpacity) {
        suitableCables.push({
          entry,
          vdrop,
          ampacity,
          deratedAmpacity,
        });
      }
    } catch {
      // Skip invalid entries
    }
  }

  // Sort by cable size (smallest first) - prefer smallest suitable cable
  suitableCables.sort((a, b) => {
    const sizeA = parseFloat(a.entry.sizeMetric);
    const sizeB = parseFloat(b.entry.sizeMetric);
    return sizeA - sizeB;
  });

  // If no suitable cables found, find the closest option
  if (suitableCables.length === 0) {
    return createFailedResult(input, deratingFactors, availableSizes);
  }

  // Take the smallest suitable cable as recommendation
  const recommended = suitableCables[0];
  const warnings: string[] = [...deratingFactors.warnings];

  // Calculate utilization percentage
  const utilizationPercent = (current / recommended.deratedAmpacity) * 100;

  // Add warnings for high utilization
  if (utilizationPercent > 80) {
    warnings.push(
      `High cable utilization (${utilizationPercent.toFixed(0)}%). Consider next size up for safety margin.`
    );
  }

  // Format cable size for display
  const formattedSize = formatCableSize(recommended.entry, standard);

  return {
    recommendedSize: {
      sizeMm2: recommended.entry.sizeMetric,
      sizeAWG: recommended.entry.sizeAWG,
      formattedSize,
    },
    voltageDrop: recommended.vdrop,
    ampacity: {
      baseAmpacity: recommended.ampacity.ampacity,
      deratedAmpacity: recommended.deratedAmpacity,
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    },
    deratingFactors,
    compliance: {
      isVoltageDropCompliant: !recommended.vdrop.isViolation,
      isAmpacityCompliant: recommended.deratedAmpacity >= current,
      isFullyCompliant: !recommended.vdrop.isViolation && recommended.deratedAmpacity >= current,
    },
    warnings,
    alternativeSizes: suitableCables.slice(1, 4).map((c) => c.entry),
    standardReferences: [
      recommended.vdrop.standardReference,
      recommended.ampacity.standardReference,
      deratingFactors.standardReference,
    ],
  };
}

/**
 * Create result for when no suitable cable is found
 */
function createFailedResult(
  input: CableSizingInput,
  deratingFactors: DeratingResult,
  availableSizes: CableTableEntry[]
): CableSizingResult {
  // Use largest available cable
  const largestCable = availableSizes[availableSizes.length - 1];

  // Calculate what we can show
  const vdropInput: VoltageDropInput = {
    current: input.current,
    length: input.length,
    cableSizeMm2: input.standard === 'IEC' ? parseFloat(largestCable.sizeMetric) : undefined,
    cableSizeAWG: input.standard === 'NEC' ? largestCable.sizeAWG ?? undefined : undefined,
    conductorMaterial: input.conductorMaterial,
    circuitType: input.circuitType,
    systemVoltage: input.systemVoltage,
    standard: input.standard,
  };
  const vdrop = calculateVoltageDrop(vdropInput);

  const ampacity = lookupCableAmpacity({
    cableSizeMm2: input.standard === 'IEC' ? parseFloat(largestCable.sizeMetric) : undefined,
    cableSizeAWG: input.standard === 'NEC' ? largestCable.sizeAWG ?? undefined : undefined,
    conductorMaterial: input.conductorMaterial,
    insulationRating: input.insulationRating ?? 75,
    standard: input.standard,
  });

  const deratedAmpacity = calculateDeratedAmpacity(
    ampacity.ampacity,
    deratingFactors.totalFactor
  );

  const warnings = [
    'No standard cable size meets all requirements.',
    'Consider parallel conductors or alternative installation method.',
    ...deratingFactors.warnings,
  ];

  if (vdrop.voltageDropPercent > (input.maxVoltageDropPercent ?? 3)) {
    warnings.push(
      `Voltage drop ${vdrop.voltageDropPercent.toFixed(1)}% exceeds ${input.maxVoltageDropPercent ?? 3}% limit even with largest cable.`
    );
  }

  if (deratedAmpacity < input.current) {
    warnings.push(
      `Derated ampacity ${deratedAmpacity}A is less than required ${input.current}A even with largest cable.`
    );
  }

  return {
    recommendedSize: {
      sizeMm2: largestCable.sizeMetric,
      sizeAWG: largestCable.sizeAWG,
      formattedSize: formatCableSize(largestCable, input.standard) + ' (INSUFFICIENT)',
    },
    voltageDrop: vdrop,
    ampacity: {
      baseAmpacity: ampacity.ampacity,
      deratedAmpacity,
      utilizationPercent: (input.current / deratedAmpacity) * 100,
    },
    deratingFactors,
    compliance: {
      isVoltageDropCompliant: false,
      isAmpacityCompliant: false,
      isFullyCompliant: false,
    },
    warnings,
    alternativeSizes: [],
    standardReferences: [
      vdrop.standardReference,
      ampacity.standardReference,
      deratingFactors.standardReference,
    ],
  };
}

/**
 * Format cable size for display
 */
function formatCableSize(entry: CableTableEntry, standard: 'IEC' | 'NEC'): string {
  if (standard === 'IEC') {
    return `${entry.sizeMetric} mm²`;
  }

  if (entry.sizeAWG) {
    const size = parseInt(entry.sizeAWG);
    if (!isNaN(size) && size >= 250) {
      return `${entry.sizeAWG} kcmil`;
    }
    return `${entry.sizeAWG} AWG`;
  }

  return `${entry.sizeMetric} mm²`;
}

export default recommendCableSize;
