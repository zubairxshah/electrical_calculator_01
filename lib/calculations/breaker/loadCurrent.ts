/**
 * Load Current Calculation Module
 *
 * Calculates electrical load current using Math.js BigNumber precision.
 * Supports single-phase and three-phase systems with power factor correction.
 *
 * Formulas:
 * - Single-phase: I = P / (V × PF)
 * - Three-phase: I = P / (√3 × V × PF)
 *
 * Where:
 * - I = Current in amperes (A)
 * - P = Power in watts (W)
 * - V = Voltage in volts (V)
 * - PF = Power factor (dimensionless, 0.5-1.0)
 * - √3 ≈ 1.732050808... (exact value from Math.js)
 *
 * @module loadCurrent
 */

import * as math from 'mathjs';

/**
 * Load Current Calculation Input
 */
export interface LoadCurrentInput {
  // Either power OR current (mutually exclusive)
  power?: number;         // kW (if calculating from power)
  current?: number;       // A (if user provides current directly)

  // Required parameters
  voltage: number;        // V
  phase: 'single' | 'three';
  standard: 'NEC' | 'IEC';

  // Optional (required if power is specified)
  powerFactor?: number;   // 0.5-1.0
}

/**
 * Load Current Calculation Result
 */
export interface LoadCurrentResult {
  // Calculated current
  currentAmps: number;

  // Formula used
  formula: string;

  // Component values (for display/documentation)
  components: {
    voltage: number;
    phase: string;
    power?: number;
    powerFactor?: number;
  };
}

/**
 * Calculate load current from power or pass through direct current input
 *
 * @param input - Load parameters (power or current, voltage, phase, power factor)
 * @returns Calculated current in amperes with formula and components
 *
 * @example
 * ```typescript
 * // Single-phase from power
 * const result = calculateLoadCurrent({
 *   power: 10,        // 10 kW
 *   voltage: 240,     // 240V
 *   phase: 'single',
 *   powerFactor: 0.9,
 *   standard: 'NEC'
 * });
 * // Returns: { currentAmps: 46.296..., formula: 'I = P / (V × PF)', ... }
 *
 * // Three-phase from power
 * const result2 = calculateLoadCurrent({
 *   power: 50,
 *   voltage: 400,
 *   phase: 'three',
 *   powerFactor: 0.9,
 *   standard: 'IEC'
 * });
 * // Returns: { currentAmps: 80.18..., formula: 'I = P / (√3 × V × PF)', ... }
 *
 * // Direct current input (no calculation needed)
 * const result3 = calculateLoadCurrent({
 *   current: 50,
 *   voltage: 240,
 *   phase: 'single',
 *   standard: 'NEC'
 * });
 * // Returns: { currentAmps: 50, formula: 'I = (user input)', ... }
 * ```
 */
export function calculateLoadCurrent(input: LoadCurrentInput): LoadCurrentResult {
  const { power, current, voltage, phase, powerFactor, standard } = input;

  // Case 1: Direct current input (user provided amperage)
  if (current !== undefined) {
    return {
      currentAmps: current,
      formula: 'I = (user input)',
      components: {
        voltage,
        phase,
      },
    };
  }

  // Case 2: Calculate from power
  if (power === undefined) {
    throw new Error('Either power or current must be provided');
  }

  if (powerFactor === undefined) {
    throw new Error('Power factor is required when calculating from power');
  }

  // Convert kW to W
  const powerWatts = math.bignumber(power * 1000);
  const voltageBN = math.bignumber(voltage);
  const powerFactorBN = math.bignumber(powerFactor);

  let currentBN: math.BigNumber;
  let formula: string;

  if (phase === 'single') {
    // Single-phase formula: I = P / (V × PF)
    const denominator = math.multiply(voltageBN, powerFactorBN);
    currentBN = math.divide(powerWatts, denominator) as math.BigNumber;
    formula = 'I = P / (V × PF)';
  } else {
    // Three-phase formula: I = P / (√3 × V × PF)
    const sqrt3 = math.bignumber(math.sqrt(3));  // 1.732050807568877...
    const denominator = math.multiply(
      math.multiply(sqrt3, voltageBN),
      powerFactorBN
    );
    currentBN = math.divide(powerWatts, denominator) as math.BigNumber;
    formula = 'I = P / (√3 × V × PF)';
  }

  // Convert BigNumber to standard number for output
  const currentAmps = math.number(currentBN);

  return {
    currentAmps,
    formula,
    components: {
      voltage,
      phase,
      power,
      powerFactor,
    },
  };
}

/**
 * Validate load current input parameters
 *
 * @param input - Load parameters to validate
 * @throws Error if validation fails
 */
export function validateLoadCurrentInput(input: LoadCurrentInput): void {
  const { power, current, voltage, powerFactor } = input;

  // Must have either power or current
  if (power === undefined && current === undefined) {
    throw new Error('Either power or current must be provided');
  }

  // Cannot have both power and current
  if (power !== undefined && current !== undefined) {
    throw new Error('Cannot specify both power and current');
  }

  // Voltage validation
  if (voltage <= 0) {
    throw new Error('Voltage must be positive');
  }

  if (voltage < 100 || voltage > 1000) {
    throw new Error('Voltage must be between 100V and 1000V');
  }

  // Power factor validation (required if calculating from power)
  if (power !== undefined) {
    if (powerFactor === undefined) {
      throw new Error('Power factor is required when calculating from power');
    }

    if (powerFactor < 0.5 || powerFactor > 1.0) {
      throw new Error('Power factor must be between 0.5 and 1.0');
    }
  }

  // Power validation
  if (power !== undefined && power <= 0) {
    throw new Error('Power must be positive');
  }

  // Current validation
  if (current !== undefined && current <= 0) {
    throw new Error('Current must be positive');
  }
}

/**
 * Calculate apparent power (VA) from real power (W) and power factor
 *
 * Formula: S = P / PF
 *
 * @param realPowerKW - Real power in kilowatts
 * @param powerFactor - Power factor (0.5-1.0)
 * @returns Apparent power in kilovolt-amperes (kVA)
 *
 * @example
 * ```typescript
 * const apparentPower = calculateApparentPower(10, 0.9);
 * // Returns: 11.11 kVA
 * ```
 */
export function calculateApparentPower(
  realPowerKW: number,
  powerFactor: number
): number {
  const realPowerBN = math.bignumber(realPowerKW);
  const powerFactorBN = math.bignumber(powerFactor);

  const apparentPowerBN = math.divide(realPowerBN, powerFactorBN) as math.BigNumber;

  return math.number(apparentPowerBN);
}

/**
 * Calculate reactive power (VAR) from real power (W) and power factor
 *
 * Formula: Q = P × tan(arccos(PF))
 *
 * @param realPowerKW - Real power in kilowatts
 * @param powerFactor - Power factor (0.5-1.0)
 * @returns Reactive power in kilovolt-amperes reactive (kVAR)
 *
 * @example
 * ```typescript
 * const reactivePower = calculateReactivePower(10, 0.9);
 * // Returns: 4.84 kVAR
 * ```
 */
export function calculateReactivePower(
  realPowerKW: number,
  powerFactor: number
): number {
  const realPowerBN = math.bignumber(realPowerKW);
  const powerFactorBN = math.bignumber(powerFactor);

  // Q = P × tan(arccos(PF))
  const angleBN = math.acos(powerFactorBN);
  const tanBN = math.tan(angleBN);
  const reactivePowerBN = math.multiply(realPowerBN, tanBN) as math.BigNumber;

  return math.number(reactivePowerBN);
}

/**
 * Convert current between single-phase and three-phase equivalent
 *
 * @param current - Current in amperes
 * @param fromPhase - Source phase type
 * @param toPhase - Target phase type
 * @param voltage - Voltage (must be same for both phases)
 * @returns Equivalent current in target phase type
 *
 * @example
 * ```typescript
 * // Convert 100A single-phase to three-phase equivalent
 * const threePhaseCurrent = convertPhaseType(100, 'single', 'three', 240);
 * // Returns: ~57.7A (100 / √3)
 * ```
 */
export function convertPhaseType(
  current: number,
  fromPhase: 'single' | 'three',
  toPhase: 'single' | 'three',
  voltage: number
): number {
  if (fromPhase === toPhase) {
    return current;
  }

  const currentBN = math.bignumber(current);
  const sqrt3 = math.bignumber(math.sqrt(3));

  if (fromPhase === 'single' && toPhase === 'three') {
    // Single to three: divide by √3
    return math.number(math.divide(currentBN, sqrt3) as math.BigNumber);
  } else {
    // Three to single: multiply by √3
    return math.number(math.multiply(currentBN, sqrt3) as math.BigNumber);
  }
}
