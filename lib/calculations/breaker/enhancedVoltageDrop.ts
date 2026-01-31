/**
 * Enhanced Voltage Drop Calculation Module
 *
 * Comprehensive voltage drop calculations with improved accuracy and integration
 * with breaker sizing based on NEC and IEC standards.
 *
 * Formulas:
 * - Single-phase: VD% = (2 × L × I × R) / (1000 × V) × 100
 * - Three-phase:  VD% = (√3 × L × I × R) / (1000 × V) × 100
 *
 * Where:
 * - I = Current in amperes (A)
 * - R = Conductor resistance in Ω/1000ft or mΩ/m
 * - L = One-way distance in feet or meters
 * - V = Voltage in volts (V)
 * - √3 ≈ 1.732 (three-phase factor)
 *
 * @module enhancedVoltageDrop
 */

import * as math from 'mathjs';
import {
  lookupCableBySize,
  getAvailableCableSizes,
  findMinimumCableSize,
  type CableTableEntry,
} from '@/lib/standards/cableTables';

/**
 * Enhanced Voltage Drop Input Parameters
 */
export interface EnhancedVoltageDropInput {
  /** Circuit current in amperes */
  current: number;
  /** System voltage in volts */
  voltage: number;
  /** One-way conductor distance */
  distance: number;
  /** Conductor size specification */
  conductorSize: {
    sizeAWG?: string | null;
    sizeMm2?: number | null;
  };
  /** Conductor material */
  material: 'copper' | 'aluminum';
  /** Phase configuration */
  phase: 'single' | 'three';
  /** Power factor (0.5-1.0) */
  powerFactor?: number;
  /** Temperature coefficient adjustment */
  temperature?: number;
  /** Installation method affecting resistance */
  installationMethod?: string;
}

/**
 * Enhanced Voltage Drop Calculation Result
 */
export interface EnhancedVoltageDropResult {
  /** Voltage drop as percentage */
  voltageDropPercent: number;
  /** Voltage drop in volts */
  voltageDropVolts: number;
  /** Total circuit voltage at load end */
  voltageAtLoad: number;
  /** Power loss in watts */
  powerLossWatts: number;
  /** Formula used for calculation */
  formula: string;
  /** Component values for display */
  components: {
    current: number;
    voltage: number;
    distance: number;
    resistance: number;
    powerFactor?: number;
    temperature?: number;
  };
  /** Reference standard */
  standard: 'IEEE 835' | 'IEC 60826' | 'NEC';
  /** Temperature-adjusted resistance */
  tempAdjustedResistance: number;
}

/**
 * Enhanced Voltage Drop Compliance Assessment
 */
export interface EnhancedVoltageDropCompliance {
  /** Status: 'acceptable' | 'warning' | 'exceed-limit' */
  status: 'excellent' | 'good' | 'acceptable' | 'warning' | 'exceed-limit';
  /** Alert level: 'info' | 'warning' | 'error' */
  level: 'info' | 'warning' | 'error';
  /** User-friendly message */
  message: string;
  /** Code reference */
  codeReference: string;
  /** Recommended action */
  recommendedAction: string;
  /** Compliance percentage */
  compliancePercentage: number;
}

/**
 * Enhanced Cable Size Recommendation Result
 */
export interface EnhancedCableSizeRecommendation {
  /** Recommended cable size entry (if needed) */
  recommendedSize: CableTableEntry | null;
  /** Predicted VD% with new cable */
  predictedVoltageDropPercent: number | null;
  /** Percent reduction in VD */
  savingsPercent: number | null;
  /** Reason/message */
  message: string;
  /** Code reference */
  codeReference: string;
  /** Cost impact estimate */
  costImpact?: 'low' | 'medium' | 'high';
  /** Installation difficulty */
  installationDifficulty?: 'easy' | 'moderate' | 'difficult';
}

/**
 * Calculate enhanced voltage drop for a circuit with temperature and installation corrections
 *
 * @param input - Enhanced voltage drop parameters
 * @returns Enhanced voltage drop result with percentage, volts, and additional metrics
 */
export function calculateEnhancedVoltageDrop(input: EnhancedVoltageDropInput): EnhancedVoltageDropResult {
  const {
    current,
    voltage,
    distance,
    conductorSize,
    material,
    phase,
    powerFactor = 1.0,
    temperature = 75, // Default to 75°C for typical conductor temperature
    installationMethod = 'conduit',
  } = input;

  // Validate inputs
  if (current <= 0) {
    throw new Error('Current must be positive');
  }
  if (voltage <= 0) {
    throw new Error('Voltage must be positive');
  }
  if (distance <= 0) {
    throw new Error('Distance must be positive');
  }

  // Lookup conductor resistance from tables
  const cableEntry = lookupCableBySize(
    conductorSize.sizeMm2 ?? null,
    conductorSize.sizeAWG ?? null,
    material,
    conductorSize.sizeAWG ? 'NEC' : 'IEC'
  );

  if (!cableEntry) {
    throw new Error(`Conductor size not found in tables: ${conductorSize.sizeAWG || conductorSize.sizeMm2}`);
  }

  // Get resistance value (Ω/1000ft for imperial, convert from mV/A/m for metric)
  let resistancePer1000ft = cableEntry.resistanceOhmPer1000ft;

  // Apply temperature correction factor
  // R_temp = R_ref × [1 + α(T - T_ref)]
  // For copper: α ≈ 0.00393 per °C
  // For aluminum: α ≈ 0.00403 per °C
  const alpha = material === 'copper' ? 0.00393 : 0.00403;
  const referenceTemp = 75; // Reference temperature for table values
  const tempCorrectionFactor = 1 + alpha * (temperature - referenceTemp);
  const tempAdjustedResistance = resistancePer1000ft * tempCorrectionFactor;

  // Calculate resistance for actual distance
  const resistance = (tempAdjustedResistance * distance) / 1000;

  // Calculate voltage drop
  let voltageDropVolts: number;
  let formula: string;

  if (phase === 'single') {
    // Single-phase formula: VD = (2 × L × I × R) / (1000)
    // Or simplified as VD = I × R (for one-way) with multiplier
    voltageDropVolts = (2 * distance * current * resistancePer1000ft) / 1000;
    // Apply power factor correction
    voltageDropVolts = voltageDropVolts * powerFactor;
    formula = 'VD = (2 × L × I × R) / (1000) × PF (single-phase)';
  } else {
    // Three-phase formula: VD = (√3 × L × I × R) / (1000)
    const sqrt3 = 1.7320508075688772935274463415059;
    voltageDropVolts = (sqrt3 * distance * current * resistancePer1000ft) / 1000;
    // Apply power factor correction
    voltageDropVolts = voltageDropVolts * powerFactor;
    formula = 'VD = (√3 × L × I × R) / (1000) × PF (three-phase)';
  }

  // Calculate voltage drop percentage
  const voltageDropPercent = (voltageDropVolts / voltage) * 100;

  // Calculate voltage at load
  const voltageAtLoad = voltage - voltageDropVolts;

  // Calculate approximate power loss
  const powerLossWatts = voltageDropVolts * current;

  return {
    voltageDropPercent,
    voltageDropVolts,
    voltageAtLoad,
    powerLossWatts,
    formula,
    components: {
      current,
      voltage,
      distance,
      resistance,
      powerFactor,
      temperature,
    },
    standard: 'IEEE 835',
    tempAdjustedResistance,
  };
}

/**
 * Enhanced assessment of voltage drop against NEC/IEC limits with practical considerations
 *
 * Per NEC 210.19(A):
 * - Branch circuit: ≤ 3%
 * - Combined feeder + branch: ≤ 5%
 *
 * @param voltageDropPercent - Calculated voltage drop percentage
 * @param current - Circuit current in amperes
 * @param voltage - System voltage in volts
 * @returns Enhanced compliance status with practical recommendations
 */
export function assessEnhancedVoltageDropCompliance(
  voltageDropPercent: number,
  current: number,
  voltage: number
): EnhancedVoltageDropCompliance {
  // Calculate compliance percentage relative to ideal (0%)
  const compliancePercentage = Math.max(0, 100 - (voltageDropPercent * 20)); // Each 5% represents 100% of tolerance

  if (voltageDropPercent <= 0.5) {
    return {
      status: 'excellent',
      level: 'info',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) is exceptional (< 0.5%). Optimal for sensitive equipment.`,
      codeReference: 'NEC 210.19(A) informational note',
      recommendedAction: 'No action needed. Performance is optimal.',
      compliancePercentage: 100,
    };
  }

  if (voltageDropPercent <= 1.0) {
    return {
      status: 'good',
      level: 'info',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) is excellent (< 1%). Equipment will operate at optimal efficiency.`,
      codeReference: 'NEC 210.19(A) informational note',
      recommendedAction: 'No action needed. Good performance.',
      compliancePercentage: 90,
    };
  }

  if (voltageDropPercent <= 2.0) {
    return {
      status: 'acceptable',
      level: 'info',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) is good (1-2%). Equipment performance is maintained.`,
      codeReference: 'NEC 210.19(A) informational note',
      recommendedAction: 'Acceptable for most applications.',
      compliancePercentage: 75,
    };
  }

  if (voltageDropPercent <= 3.0) {
    return {
      status: 'warning',
      level: 'warning',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) approaching limit (2-3%). Consider larger cable for sensitive loads.`,
      codeReference: 'NEC 210.19(A) - 3% branch circuit limit',
      recommendedAction: `Consider increasing conductor size by one standard size for improved performance. At ${current}A and ${voltage}V, this represents ${voltageDropPercent.toFixed(2)}% drop.`,
      compliancePercentage: 50,
    };
  }

  if (voltageDropPercent <= 5.0) {
    return {
      status: 'warning',
      level: 'error',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) exceeds NEC 3% branch circuit limit. Larger cable size recommended.`,
      codeReference: 'NEC 210.19(A) - 3% branch circuit limit',
      recommendedAction: `Immediate action required. Increase conductor size significantly. At ${current}A and ${voltage}V, this represents ${voltageDropPercent.toFixed(2)}% drop which may cause equipment malfunction.`,
      compliancePercentage: 25,
    };
  }

  return {
    status: 'exceed-limit',
    level: 'error',
    message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) exceeds NEC 5% combined limit. Must use larger cable to prevent equipment malfunction.`,
    codeReference: 'NEC 210.19(A) - 5% combined limit',
    recommendedAction: `Critical issue. Immediate conductor upgrade required. At ${current}A and ${voltage}V, this represents ${voltageDropPercent.toFixed(2)}% drop which will likely cause equipment damage or failure.`,
    compliancePercentage: 0,
  };
}

/**
 * Enhanced recommendation for larger cable size when voltage drop exceeds limit
 * Includes cost and installation considerations
 *
 * @param input - Parameters including current size and VD limit
 * @returns Enhanced recommendation with new cable size, cost impact, and installation difficulty
 */
export function recommendEnhancedCableSizeForVD(input: {
  current: number;
  voltage: number;
  distance: number;
  material: 'copper' | 'aluminum';
  phase: 'single' | 'three';
  powerFactor?: number;
  temperature?: number;
  currentSize: {
    sizeAWG?: string | null;
    sizeMm2?: number | null;
  };
  vdLimit: number;
}): EnhancedCableSizeRecommendation {
  // Calculate current VD
  const currentVD = calculateEnhancedVoltageDrop({
    ...input,
    conductorSize: input.currentSize,
  });

  // Check if recommendation is needed
  if (currentVD.voltageDropPercent <= input.vdLimit) {
    return {
      recommendedSize: null,
      predictedVoltageDropPercent: null,
      savingsPercent: null,
      message: `Voltage drop (${currentVD.voltageDropPercent.toFixed(2)}%) is within acceptable limit (${input.vdLimit}%). No larger cable needed.`,
      codeReference: 'NEC 210.19(A)',
      costImpact: undefined,
      installationDifficulty: undefined,
    };
  }

  // Find next larger cable size
  const standard = input.currentSize.sizeAWG ? 'NEC' : 'IEC';
  const material = input.material;

  // Get available cable sizes for this standard/material
  const availableCables = getAvailableCableSizes(standard, material);

  // Find current cable index
  let currentIndex = -1;
  if (standard === 'NEC' && input.currentSize.sizeAWG) {
    currentIndex = availableCables.findIndex(
      (c: CableTableEntry) => c.sizeAWG === input.currentSize.sizeAWG
    );
  } else if (standard === 'IEC' && input.currentSize.sizeMm2) {
    currentIndex = availableCables.findIndex(
      (c: CableTableEntry) => Math.abs(parseFloat(c.sizeMetric) - input.currentSize.sizeMm2!) < 0.1
    );
  }

  if (currentIndex === -1 || currentIndex >= availableCables.length - 1) {
    return {
      recommendedSize: null,
      predictedVoltageDropPercent: null,
      savingsPercent: null,
      message: 'Current cable is already the largest available size. Consider voltage transformation or shorter distance.',
      codeReference: 'NEC Chapter 9 Table 8',
      costImpact: 'high',
      installationDifficulty: 'difficult',
    };
  }

  // Try larger sizes until VD is acceptable
  let recommendedEntry: CableTableEntry | null = null;
  let predictedVD: number | null = null;

  for (let i = currentIndex + 1; i < availableCables.length; i++) {
    const nextSize = availableCables[i];
    const vdResult = calculateEnhancedVoltageDrop({
      ...input,
      conductorSize: {
        sizeAWG: nextSize.sizeAWG ?? null,
        sizeMm2: parseFloat(nextSize.sizeMetric) || null,
      },
    });

    if (vdResult.voltageDropPercent <= input.vdLimit) {
      recommendedEntry = nextSize;
      predictedVD = vdResult.voltageDropPercent;
      break;
    }
  }

  if (!recommendedEntry) {
    return {
      recommendedSize: null,
      predictedVoltageDropPercent: null,
      savingsPercent: null,
      message: `Even the largest available cable (${availableCables[availableCables.length - 1].sizeAWG || availableCables[availableCables.length - 1].sizeMetric}) exceeds ${input.vdLimit}% VD. Consider voltage transformation.`,
      codeReference: 'NEC Chapter 9',
      costImpact: 'high',
      installationDifficulty: 'difficult',
    };
  }

  const savingsPercent =
    ((currentVD.voltageDropPercent - predictedVD!) / currentVD.voltageDropPercent) * 100;

  const sizeFormat = recommendedEntry.sizeAWG
    ? `${recommendedEntry.sizeAWG} AWG`
    : `${recommendedEntry.sizeMetric} mm²`;

  // Determine cost impact based on size jump
  // Find the index of the recommended entry in the available cables
  const recommendedIndex = availableCables.findIndex(cable =>
    cable.sizeAWG === recommendedEntry.sizeAWG ||
    parseFloat(cable.sizeMetric) === parseFloat(recommendedEntry.sizeMetric)
  );

  let costImpact: 'low' | 'medium' | 'high' = 'medium';
  if (recommendedIndex !== -1) {
    const sizeJump = Math.abs(recommendedIndex - currentIndex);
    if (sizeJump <= 2) {
      costImpact = 'low';
    } else if (sizeJump <= 4) {
      costImpact = 'medium';
    } else {
      costImpact = 'high';
    }
  }

  // Determine installation difficulty
  let installationDifficulty: 'easy' | 'moderate' | 'difficult' = 'moderate';
  if (parseFloat(recommendedEntry.sizeMetric) <= 25) {
    installationDifficulty = 'easy';
  } else if (parseFloat(recommendedEntry.sizeMetric) <= 70) {
    installationDifficulty = 'moderate';
  } else {
    installationDifficulty = 'difficult';
  }

  return {
    recommendedSize: recommendedEntry,
    predictedVoltageDropPercent: predictedVD,
    savingsPercent,
    message: `Recommended ${sizeFormat} ${material} conductor. Reduces voltage drop from ${currentVD.voltageDropPercent.toFixed(2)}% to ${predictedVD!.toFixed(2)}% (${savingsPercent.toFixed(1)}% improvement).`,
    codeReference: 'NEC 210.19(A) - consider larger conductor',
    costImpact,
    installationDifficulty,
  };
}

/**
 * Calculate the minimum cable size required to achieve a target voltage drop
 *
 * @param input - Parameters to determine minimum cable size
 * @returns The minimum cable size needed to achieve the target voltage drop
 */
export function calculateMinimumCableSizeForTargetVD(input: {
  current: number;
  voltage: number;
  distance: number;
  material: 'copper' | 'aluminum';
  phase: 'single' | 'three';
  powerFactor?: number;
  targetVDPercent: number;
}): CableTableEntry | null {
  // Start with smallest available cable and work up
  const standard = input.currentSize ? (input.currentSize.sizeAWG ? 'NEC' : 'IEC') : 'NEC';
  const material = input.material;
  const availableCables = getAvailableCableSizes(standard, material);

  // Find the smallest cable that meets the target VD
  for (const cable of availableCables) {
    const testVD = calculateEnhancedVoltageDrop({
      ...input,
      conductorSize: {
        sizeAWG: cable.sizeAWG,
        sizeMm2: cable.sizeMetric ? parseFloat(cable.sizeMetric) : null,
      },
    });

    if (testVD.voltageDropPercent <= input.targetVDPercent) {
      return cable;
    }
  }

  // If no cable meets the requirement, return the largest available
  return availableCables[availableCables.length - 1] || null;
}