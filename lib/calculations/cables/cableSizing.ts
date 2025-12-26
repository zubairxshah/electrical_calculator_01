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
import { type CableTableEntry, getEarthConductorRecommendation } from '@/lib/standards/cableTables';

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
 * Parallel cable run recommendation
 */
export interface ParallelCableRun {
  /** Number of parallel cables per phase */
  cablesPerPhase: number;
  /** Cable size for each run */
  cableSize: {
    sizeMm2: string;
    sizeAWG: string | null;
    formattedSize: string;
  };
  /** Current per cable */
  currentPerCable: number;
  /** Total ampacity (all parallel cables) */
  totalAmpacity: number;
  /** Derated ampacity per cable */
  deratedAmpacityPerCable: number;
  /** Total derated ampacity */
  totalDeratedAmpacity: number;
  /** Voltage drop with parallel cables */
  voltageDrop: VoltageDrop;
  /** Utilization percentage */
  utilizationPercent: number;
  /** Is this option compliant */
  isCompliant: boolean;
  /** Cost efficiency rating (1-5, higher is more economical) */
  costEfficiency: number;
}

/**
 * Earth/Grounding conductor recommendation
 */
export interface EarthConductorRecommendation {
  /** Size in mm² */
  sizeMm2: number;
  /** Size in AWG (NEC only) */
  sizeAWG: string | null;
  /** Formatted size for display */
  formattedSize: string;
  /** Rule/method applied */
  rule: string;
  /** Standard reference */
  standardReference: string;
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
  /** Parallel cable run options (when single cable insufficient) */
  parallelRunOptions?: ParallelCableRun[];
  /** Whether parallel runs are recommended */
  requiresParallelRuns: boolean;
  /** Earth/Grounding conductor recommendation */
  earthConductor: EarthConductorRecommendation;
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

  // Calculate earth/grounding conductor size
  const earthConductor = getEarthConductorRecommendation(
    parseFloat(recommended.entry.sizeMetric),
    current,
    conductorMaterial,
    standard
  );

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
    requiresParallelRuns: false,
    earthConductor,
  };
}

/**
 * Create result for when no suitable cable is found
 * Includes parallel cable run options
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

  // Calculate parallel cable run options
  const parallelRunOptions = calculateParallelRunOptions(input, deratingFactors, availableSizes);

  const warnings = [
    'No single cable size meets all requirements.',
    parallelRunOptions.length > 0
      ? 'Parallel cable runs are recommended - see options below.'
      : 'Consider alternative installation method or reducing load.',
    ...deratingFactors.warnings,
  ];

  if (vdrop.voltageDropPercent > (input.maxVoltageDropPercent ?? 3)) {
    warnings.push(
      `Voltage drop ${vdrop.voltageDropPercent.toFixed(1)}% exceeds ${input.maxVoltageDropPercent ?? 3}% limit with single largest cable.`
    );
  }

  if (deratedAmpacity < input.current) {
    warnings.push(
      `Single cable derated ampacity ${deratedAmpacity.toFixed(0)}A is less than required ${input.current}A.`
    );
  }

  // Find best parallel option for recommendation
  const bestParallel = parallelRunOptions.find(opt => opt.isCompliant) || parallelRunOptions[0];

  return {
    recommendedSize: bestParallel ? {
      sizeMm2: bestParallel.cableSize.sizeMm2,
      sizeAWG: bestParallel.cableSize.sizeAWG,
      formattedSize: `${bestParallel.cablesPerPhase}× ${bestParallel.cableSize.formattedSize} per phase`,
    } : {
      sizeMm2: largestCable.sizeMetric,
      sizeAWG: largestCable.sizeAWG,
      formattedSize: formatCableSize(largestCable, input.standard) + ' (INSUFFICIENT)',
    },
    voltageDrop: bestParallel?.voltageDrop ?? vdrop,
    ampacity: bestParallel ? {
      baseAmpacity: bestParallel.totalAmpacity,
      deratedAmpacity: bestParallel.totalDeratedAmpacity,
      utilizationPercent: bestParallel.utilizationPercent,
    } : {
      baseAmpacity: ampacity.ampacity,
      deratedAmpacity,
      utilizationPercent: (input.current / deratedAmpacity) * 100,
    },
    deratingFactors,
    compliance: bestParallel ? {
      isVoltageDropCompliant: bestParallel.voltageDrop.voltageDropPercent <= (input.maxVoltageDropPercent ?? 3),
      isAmpacityCompliant: bestParallel.totalDeratedAmpacity >= input.current,
      isFullyCompliant: bestParallel.isCompliant,
    } : {
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
    parallelRunOptions,
    requiresParallelRuns: true,
    earthConductor: getEarthConductorRecommendation(
      bestParallel ? parseFloat(bestParallel.cableSize.sizeMm2) : parseFloat(largestCable.sizeMetric),
      input.current,
      input.conductorMaterial,
      input.standard
    ),
  };
}

/**
 * Calculate parallel cable run options when single cable is insufficient
 *
 * Parallel cables reduce effective resistance and share current:
 * - Total ampacity = single cable ampacity × number of cables
 * - Effective resistance = single cable resistance / number of cables
 * - Voltage drop = (I / n) × L × R (where n = number of parallel cables)
 */
function calculateParallelRunOptions(
  input: CableSizingInput,
  deratingFactors: DeratingResult,
  availableSizes: CableTableEntry[]
): ParallelCableRun[] {
  const {
    current,
    length,
    conductorMaterial,
    circuitType,
    systemVoltage,
    insulationRating = 75,
    standard,
    maxVoltageDropPercent = 3,
  } = input;

  const parallelOptions: ParallelCableRun[] = [];

  // Consider common cable sizes for parallel runs (not too small)
  // Typically 35mm², 50mm², 70mm², 95mm², 120mm², 150mm², 185mm², 240mm², 300mm², 400mm², 500mm² for IEC
  // Or 2 AWG, 1/0, 2/0, 3/0, 4/0, 250, 300, 350, 400, 500, 750, 1000 kcmil for NEC
  const parallelCandidates = availableSizes.filter(entry => {
    const size = parseFloat(entry.sizeMetric);
    // Select practical sizes for parallel runs (25mm² to 630mm² / 1000 kcmil)
    return size >= 25 && size <= 630;
  });

  // Consider 2, 3, 4, 5, and 6 cables per phase
  const runCounts = [2, 3, 4, 5, 6];

  for (const entry of parallelCandidates) {
    for (const numCables of runCounts) {
      try {
        // Get base ampacity for this cable
        const ampacity = lookupCableAmpacity({
          cableSizeMm2: standard === 'IEC' ? parseFloat(entry.sizeMetric) : undefined,
          cableSizeAWG: standard === 'NEC' ? entry.sizeAWG ?? undefined : undefined,
          conductorMaterial,
          insulationRating,
          standard,
        });

        // Calculate derated ampacity per cable
        const deratedAmpacityPerCable = calculateDeratedAmpacity(
          ampacity.ampacity,
          deratingFactors.totalFactor
        );

        // Total derated ampacity with parallel cables
        const totalDeratedAmpacity = deratedAmpacityPerCable * numCables;

        // Skip if still insufficient ampacity
        if (totalDeratedAmpacity < current) {
          continue;
        }

        // Current per cable
        const currentPerCable = current / numCables;

        // Calculate voltage drop with reduced current per cable
        // Parallel cables effectively reduce resistance
        const vdropInput: VoltageDropInput = {
          current: currentPerCable,
          length,
          cableSizeMm2: standard === 'IEC' ? parseFloat(entry.sizeMetric) : undefined,
          cableSizeAWG: standard === 'NEC' ? entry.sizeAWG ?? undefined : undefined,
          conductorMaterial,
          circuitType,
          systemVoltage,
          standard,
        };
        const vdrop = calculateVoltageDrop(vdropInput);

        // Check compliance
        const isVdropCompliant = vdrop.voltageDropPercent <= maxVoltageDropPercent;
        const isAmpacityCompliant = totalDeratedAmpacity >= current;
        const isCompliant = isVdropCompliant && isAmpacityCompliant;

        // Calculate utilization
        const utilizationPercent = (current / totalDeratedAmpacity) * 100;

        // Calculate cost efficiency (prefer fewer larger cables over many small ones)
        // Also prefer options with 70-85% utilization
        let costEfficiency = 5;
        if (numCables > 4) costEfficiency -= 1;
        if (numCables > 5) costEfficiency -= 1;
        if (utilizationPercent < 50) costEfficiency -= 1;
        if (utilizationPercent > 90) costEfficiency -= 1;
        costEfficiency = Math.max(1, Math.min(5, costEfficiency));

        // Only add if compliant or close to compliant
        if (isCompliant || (utilizationPercent < 120 && vdrop.voltageDropPercent < 5)) {
          parallelOptions.push({
            cablesPerPhase: numCables,
            cableSize: {
              sizeMm2: entry.sizeMetric,
              sizeAWG: entry.sizeAWG,
              formattedSize: formatCableSize(entry, standard),
            },
            currentPerCable: Math.round(currentPerCable * 10) / 10,
            totalAmpacity: ampacity.ampacity * numCables,
            deratedAmpacityPerCable: Math.round(deratedAmpacityPerCable),
            totalDeratedAmpacity: Math.round(totalDeratedAmpacity),
            voltageDrop: vdrop,
            utilizationPercent: Math.round(utilizationPercent * 10) / 10,
            isCompliant,
            costEfficiency,
          });
        }
      } catch {
        // Skip invalid entries
      }
    }
  }

  // Sort by: compliant first, then by cost efficiency, then by fewer cables
  parallelOptions.sort((a, b) => {
    if (a.isCompliant !== b.isCompliant) return a.isCompliant ? -1 : 1;
    if (a.costEfficiency !== b.costEfficiency) return b.costEfficiency - a.costEfficiency;
    return a.cablesPerPhase - b.cablesPerPhase;
  });

  // Return top 6 options
  return parallelOptions.slice(0, 6);
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
