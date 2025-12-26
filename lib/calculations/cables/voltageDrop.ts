/**
 * Voltage Drop Calculation
 * Feature: 001-electromate-engineering-app
 * Task: T085 - Implement calculateVoltageDrop
 *
 * Calculates voltage drop using Math.js BigNumber per ADR-003.
 * Formula: V_drop = I × L × R (per IEC 60364 / NEC)
 *
 * @see IEC 60364-5-52:2009 - Voltage drop calculations
 * @see NEC Chapter 9 Table 8 - Conductor resistance
 */

import { create, all, type BigNumber } from 'mathjs';
import { lookupCableBySize, type CableTableEntry } from '@/lib/standards/cableTables';

// Configure math.js with BigNumber for precision
const math = create(all, {
  number: 'BigNumber',
  precision: 64,
});

/**
 * Voltage drop calculation input parameters
 */
export interface VoltageDropInput {
  /** Circuit current in Amperes */
  current: number;
  /** Cable length in meters (IEC) or feet (NEC) */
  length: number;
  /** Cable size in mm² (for IEC) */
  cableSizeMm2?: number;
  /** Cable size in AWG (for NEC) */
  cableSizeAWG?: string;
  /** Conductor material */
  conductorMaterial: 'copper' | 'aluminum';
  /** Circuit type affects multiplier */
  circuitType: 'single-phase' | 'three-phase';
  /** System voltage for percentage calculation */
  systemVoltage?: number;
  /** Standard to use */
  standard: 'IEC' | 'NEC';
  /** Custom resistance value (mV/A/m for IEC, Ω/1000ft for NEC) */
  customResistance?: number;
}

/**
 * Voltage drop calculation result
 */
export interface VoltageDrop {
  /** Voltage drop in Volts */
  voltageDrop: number;
  /** Voltage drop as percentage of system voltage */
  voltageDropPercent: number;
  /** Whether drop exceeds 3% limit (FR-009) */
  isViolation: boolean;
  /** Whether drop exceeds 10% (dangerous) */
  isDangerous: boolean;
  /** Cable resistance used (mV/A/m or Ω/1000ft) */
  resistance: number;
  /** Resistance unit */
  resistanceUnit: 'mV/A/m' | 'Ω/1000ft';
  /** Cable entry used for calculation */
  cableEntry?: CableTableEntry;
  /** Standard reference */
  standardReference: string;
  /** Circuit multiplier used */
  circuitMultiplier: number;
}

/**
 * Circuit type multipliers
 * - Single-phase: factor of 2 (out and return)
 * - Three-phase: factor of √3 (1.732)
 */
const CIRCUIT_MULTIPLIERS = {
  'single-phase': 2,
  'three-phase': Math.sqrt(3), // 1.732
};

/**
 * Voltage drop limit constants (FR-009)
 * Using conservative 3% for all circuits per spec
 */
const VOLTAGE_DROP_WARNING_PERCENT = 3; // Conservative limit for all circuits
const VOLTAGE_DROP_DANGER_PERCENT = 10; // Physically dangerous

/**
 * Default system voltages if not specified
 */
const DEFAULT_SYSTEM_VOLTAGE = {
  IEC: 230, // Standard EU voltage
  NEC: 120, // Standard US voltage
};

/**
 * Calculate voltage drop for a cable circuit
 *
 * @param input - Calculation input parameters
 * @returns Voltage drop result with all details
 *
 * @example
 * // IEC calculation: 30A, 50m, 6mm² copper, single-phase 230V
 * const result = calculateVoltageDrop({
 *   current: 30,
 *   length: 50,
 *   cableSizeMm2: 6,
 *   conductorMaterial: 'copper',
 *   circuitType: 'single-phase',
 *   systemVoltage: 230,
 *   standard: 'IEC',
 * });
 * // result.voltageDrop ≈ 9.24V
 * // result.voltageDropPercent ≈ 4.02%
 * // result.isViolation === true
 */
export function calculateVoltageDrop(input: VoltageDropInput): VoltageDrop {
  const {
    current,
    length,
    cableSizeMm2,
    cableSizeAWG,
    conductorMaterial,
    circuitType,
    systemVoltage,
    standard,
    customResistance,
  } = input;

  // Get circuit multiplier
  const multiplier = CIRCUIT_MULTIPLIERS[circuitType];

  // Look up cable data or use custom resistance
  let resistance: number;
  let resistanceUnit: 'mV/A/m' | 'Ω/1000ft';
  let cableEntry: CableTableEntry | undefined;

  if (customResistance !== undefined) {
    resistance = customResistance;
    resistanceUnit = standard === 'IEC' ? 'mV/A/m' : 'Ω/1000ft';
  } else {
    cableEntry = lookupCableBySize(
      cableSizeMm2 ?? null,
      cableSizeAWG ?? null,
      conductorMaterial,
      standard
    );

    if (!cableEntry) {
      throw new Error(
        `Cable size not found: ${
          standard === 'IEC' ? `${cableSizeMm2}mm²` : cableSizeAWG
        } ${conductorMaterial}`
      );
    }

    if (standard === 'IEC') {
      resistance = cableEntry.resistanceMvAm;
      resistanceUnit = 'mV/A/m';
    } else {
      resistance = cableEntry.resistanceOhmPer1000ft;
      resistanceUnit = 'Ω/1000ft';
    }
  }

  // Calculate voltage drop using Math.js BigNumber for precision
  let voltageDrop: number;

  if (standard === 'IEC') {
    // IEC formula: V_drop = I × L × 2 × mV/A/m / 1000 (single-phase)
    // or V_drop = I × L × √3 × mV/A/m / 1000 (three-phase)
    const I = math.bignumber(current) as BigNumber;
    const L = math.bignumber(length) as BigNumber;
    const R = math.bignumber(resistance) as BigNumber;
    const M = math.bignumber(multiplier) as BigNumber;
    const divisor = math.bignumber(1000) as BigNumber;

    const vDrop = math.divide(
      math.multiply(math.multiply(math.multiply(I, L), M), R) as BigNumber,
      divisor
    ) as BigNumber;

    voltageDrop = math.number(vDrop);
  } else {
    // NEC formula: V_drop = 2 × I × L × R / 1000 (single-phase)
    // or V_drop = √3 × I × L × R / 1000 (three-phase)
    // where R is in Ω/1000ft and L is in feet
    const I = math.bignumber(current) as BigNumber;
    const L = math.bignumber(length) as BigNumber;
    const R = math.bignumber(resistance) as BigNumber;
    const M = math.bignumber(multiplier) as BigNumber;
    const divisor = math.bignumber(1000) as BigNumber;

    const vDrop = math.divide(
      math.multiply(math.multiply(math.multiply(I, L), M), R) as BigNumber,
      divisor
    ) as BigNumber;

    voltageDrop = math.number(vDrop);
  }

  // Calculate percentage
  const voltage = systemVoltage ?? DEFAULT_SYSTEM_VOLTAGE[standard];
  const voltageDropPercent = (voltageDrop / voltage) * 100;

  // Determine violation status
  const isViolation = voltageDropPercent > VOLTAGE_DROP_WARNING_PERCENT;
  const isDangerous = voltageDropPercent > VOLTAGE_DROP_DANGER_PERCENT;

  // Build standard reference
  const standardReference =
    standard === 'IEC'
      ? 'IEC 60364-5-52:2009'
      : 'NEC 2020 Chapter 9 Table 8';

  return {
    voltageDrop: Math.round(voltageDrop * 100) / 100, // Round to 2 decimal places
    voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
    isViolation,
    isDangerous,
    resistance,
    resistanceUnit,
    cableEntry,
    standardReference,
    circuitMultiplier: multiplier,
  };
}

/**
 * Calculate minimum cable size for target voltage drop
 *
 * @param input - Base calculation parameters
 * @param targetDropPercent - Maximum acceptable voltage drop (default 3%)
 * @returns Array of suitable cable sizes
 */
export function findCableSizesForTargetDrop(
  input: Omit<VoltageDropInput, 'cableSizeMm2' | 'cableSizeAWG' | 'customResistance'>,
  targetDropPercent: number = 3
): VoltageDrop[] {
  const { standard, conductorMaterial } = input;
  const results: VoltageDrop[] = [];

  // Import cable tables
  const {
    IEC_COPPER_AMPACITY,
    IEC_ALUMINUM_AMPACITY,
    NEC_COPPER_AMPACITY,
    NEC_ALUMINUM_AMPACITY,
  } = require('@/lib/standards/cableTables');

  // Select appropriate table
  let cableTable;
  if (standard === 'IEC') {
    cableTable = conductorMaterial === 'copper' ? IEC_COPPER_AMPACITY : IEC_ALUMINUM_AMPACITY;
  } else {
    cableTable = conductorMaterial === 'copper' ? NEC_COPPER_AMPACITY : NEC_ALUMINUM_AMPACITY;
  }

  // Test each cable size
  for (const entry of cableTable) {
    try {
      const calcInput: VoltageDropInput = {
        ...input,
        cableSizeMm2: standard === 'IEC' ? parseFloat(entry.sizeMetric) : undefined,
        cableSizeAWG: standard === 'NEC' ? entry.sizeAWG : undefined,
      };

      const result = calculateVoltageDrop(calcInput);

      // Include if voltage drop is acceptable
      if (result.voltageDropPercent <= targetDropPercent) {
        results.push(result);
      }
    } catch {
      // Skip invalid entries
    }
  }

  // Sort by voltage drop (smallest first)
  return results.sort((a, b) => b.voltageDropPercent - a.voltageDropPercent);
}

export default calculateVoltageDrop;
