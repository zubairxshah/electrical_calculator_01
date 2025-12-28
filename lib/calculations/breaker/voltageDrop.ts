/**
 * Voltage Drop Calculation Module
 *
 * Calculates voltage drop for single-phase and three-phase circuits
 * according to IEEE 835 and NEC/IEC standards.
 *
 * Formulas:
 * - Single-phase: VD% = (I × R × L) / (V × 10)
 * - Three-phase:  VD% = (I × R × L × √3) / (V × 10)
 *
 * Where:
 * - I = Current in amperes (A)
 * - R = Conductor resistance in Ω/1000ft or mV/A/m
 * - L = One-way distance in feet or meters
 * - V = Voltage in volts (V)
 * - √3 ≈ 1.732 (three-phase factor)
 *
 * @module voltageDrop
 */

import * as math from 'mathjs';
import {
  lookupCableBySize,
  getAvailableCableSizes,
  type CableTableEntry,
} from '@/lib/standards/cableTables';

/**
 * Voltage Drop Input Parameters
 */
export interface VoltageDropInput {
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
}

/**
 * Voltage Drop Calculation Result
 */
export interface VoltageDropResult {
  /** Voltage drop as percentage */
  voltageDropPercent: number;
  /** Voltage drop in volts */
  voltageDropVolts: number;
  /** Formula used for calculation */
  formula: string;
  /** Component values for display */
  components: {
    current: number;
    voltage: number;
    distance: number;
    resistance: number;
    powerFactor?: number;
  };
  /** Reference standard */
  standard: 'IEEE 835' | 'IEC 60826';
}

/**
 * Voltage Drop Compliance Status
 */
export interface VoltageDropCompliance {
  /** Status: 'acceptable' | 'warning' | 'exceed-limit' */
  status: 'acceptable' | 'warning' | 'exceed-limit';
  /** Alert level: 'info' | 'warning' | 'error' */
  level: 'info' | 'warning' | 'error';
  /** User-friendly message */
  message: string;
  /** Code reference */
  codeReference: string;
}

/**
 * Cable Size Recommendation Result
 */
export interface CableSizeRecommendation {
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
}

/**
 * Calculate voltage drop for a circuit
 *
 * @param input - Voltage drop parameters
 * @returns Voltage drop result with percentage and volts
 *
 * @example
 * ```typescript
 * // Single-phase: 30A @ 240V, 150ft, #6 AWG copper
 * const result = calculateVoltageDrop({
 *   current: 30,
 *   voltage: 240,
 *   distance: 150,
 *   conductorSize: { sizeAWG: '6', sizeMm2: null },
 *   material: 'copper',
 *   phase: 'single',
 *   powerFactor: 0.9,
 * });
 * // Returns: { voltageDropPercent: 0.7425, voltageDropVolts: 1.78, ... }
 * ```
 */
export function calculateVoltageDrop(input: VoltageDropInput): VoltageDropResult {
  const {
    current,
    voltage,
    distance,
    conductorSize,
    material,
    phase,
    powerFactor = 1.0,
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
  const resistancePer1000ft = cableEntry.resistanceOhmPer1000ft;

  // Calculate resistance for actual distance
  const resistance = (resistancePer1000ft * distance) / 1000;

  // Calculate voltage drop
  let voltageDropVolts: number;
  let formula: string;

  if (phase === 'single') {
    // Single-phase formula: VD = I × R
    voltageDropVolts = current * resistance * powerFactor;
    formula = 'VD = I × R × PF (single-phase)';
  } else {
    // Three-phase formula: VD = I × R × √3 (line-to-line)
    const sqrt3 = '1.7320508075688772935274463415059';
    const vdBN = math.multiply(
      math.multiply(math.bignumber(current), math.bignumber(resistance)),
      math.bignumber(sqrt3)
    );
    // Convert BigNumber to number safely
    const vdNum = Number(vdBN.toString());
    voltageDropVolts = vdNum * powerFactor;
    formula = 'VD = I × R × √3 × PF (three-phase)';
  }

  // Calculate voltage drop percentage
  const voltageDropPercent = (voltageDropVolts / voltage) * 100;

  return {
    voltageDropPercent,
    voltageDropVolts,
    formula,
    components: {
      current,
      voltage,
      distance,
      resistance,
      powerFactor,
    },
    standard: 'IEEE 835',
  };
}

/**
 * Assess voltage drop against NEC/IEC limits
 *
 * Per NEC 210.19(A):
 * - Branch circuit: ≤ 3%
 * - Combined feeder + branch: ≤ 5%
 *
 * @param voltageDropPercent - Calculated voltage drop percentage
 * @returns Compliance status with message
 */
export function assessVoltageDropCompliance(
  voltageDropPercent: number
): VoltageDropCompliance {
  if (voltageDropPercent <= 1.0) {
    return {
      status: 'acceptable',
      level: 'info',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) is excellent (< 1%). Equipment will operate at optimal efficiency.`,
      codeReference: 'NEC 210.19(A) informational note',
    };
  }

  if (voltageDropPercent <= 3.0) {
    return {
      status: 'warning',
      level: 'warning',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) is acceptable but notable (1-3%). Consider larger cable for improved efficiency.`,
      codeReference: 'NEC 210.19(A) - 3% branch circuit limit',
    };
  }

  if (voltageDropPercent <= 5.0) {
    return {
      status: 'warning',
      level: 'error',
      message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) exceeds NEC 3% branch circuit limit. Larger cable size recommended.`,
      codeReference: 'NEC 210.19(A) - 3% branch circuit limit',
    };
  }

  return {
    status: 'exceed-limit',
    level: 'error',
    message: `Voltage drop (${voltageDropPercent.toFixed(2)}%) exceeds NEC 5% combined limit. Must use larger cable to prevent equipment malfunction.`,
    codeReference: 'NEC 210.19(A) - 5% combined limit',
  };
}

/**
 * Recommend larger cable size when voltage drop exceeds limit
 *
 * @param input - Parameters including current size and VD limit
 * @returns Recommendation with new cable size or null if not needed
 */
export function recommendCableSizeForVD(input: {
  current: number;
  voltage: number;
  distance: number;
  material: 'copper' | 'aluminum';
  phase: 'single' | 'three';
  powerFactor?: number;
  currentSize: {
    sizeAWG?: string | null;
    sizeMm2?: number | null;
  };
  vdLimit: number;
}): CableSizeRecommendation {
  // Calculate current VD
  const currentVD = calculateVoltageDrop({
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
    };
  }

  // Try larger sizes until VD is acceptable
  let recommendedEntry: CableTableEntry | null = null;
  let predictedVD: number | null = null;

  for (let i = currentIndex + 1; i < availableCables.length; i++) {
    const nextSize = availableCables[i];
    const vdResult = calculateVoltageDrop({
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
    };
  }

  const savingsPercent =
    ((currentVD.voltageDropPercent - predictedVD!) / currentVD.voltageDropPercent) * 100;

  const sizeFormat = recommendedEntry.sizeAWG
    ? `${recommendedEntry.sizeAWG} AWG`
    : `${recommendedEntry.sizeMetric} mm²`;

  return {
    recommendedSize: recommendedEntry,
    predictedVoltageDropPercent: predictedVD,
    savingsPercent,
    message: `Recommended ${sizeFormat} copper conductor. Reduces voltage drop from ${currentVD.voltageDropPercent.toFixed(2)}% to ${predictedVD!.toFixed(2)}% (${savingsPercent.toFixed(1)}% improvement).`,
    codeReference: 'NEC 210.19(A) - consider larger conductor',
  };
}

/**
 * Validate voltage drop input parameters
 *
 * @param input - Parameters to validate
 * @throws Error if validation fails
 */
export function validateVoltageDropInput(input: VoltageDropInput): void {
  if (input.current <= 0 || input.current > 10000) {
    throw new Error('Current must be between 0 and 10,000 A');
  }

  if (input.voltage < 100 || input.voltage > 1000) {
    throw new Error('Voltage must be between 100V and 1000V');
  }

  if (input.distance <= 0 || input.distance > 10000) {
    throw new Error('Distance must be between 0 and 10,000 (ft or m)');
  }

  if (input.powerFactor !== undefined && (input.powerFactor < 0.5 || input.powerFactor > 1.0)) {
    throw new Error('Power factor must be between 0.5 and 1.0');
  }
}
