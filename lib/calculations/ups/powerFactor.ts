/**
 * Power Factor Conversion Utilities
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Handles VA ↔ Watts conversions with power factor
 *
 * Standard: IEEE 1100-2020, IEC 62040-3:2021
 */

import { create, all, MathJsStatic } from 'mathjs';

// Configure Math.js with BigNumber for precision
const math: MathJsStatic = create(all, {
  number: 'BigNumber',
  precision: 64,
});

/**
 * Default power factor for UPS calculations
 * 0.8 is a conservative default for mixed IT loads per IEEE 1100
 */
export const DEFAULT_POWER_FACTOR = 0.8;

/**
 * Convert real power (Watts) to apparent power (VA)
 *
 * Formula: VA = W / PF
 *
 * @param watts - Real power in Watts
 * @param powerFactor - Power factor (0.1 to 1.0), defaults to 0.8
 * @returns Apparent power in VA
 *
 * @example
 * convertWattsToVA(1000)       // Returns 1250 (at 0.8 PF)
 * convertWattsToVA(1000, 0.9)  // Returns 1111.11
 *
 * @standard IEC 62040-3:2021 Section 5.2
 */
export function convertWattsToVA(watts: number, powerFactor: number = DEFAULT_POWER_FACTOR): number {
  // Handle edge case
  if (watts === 0) {
    return 0;
  }

  // Validate power factor
  if (powerFactor <= 0 || powerFactor > 1) {
    throw new Error(`Invalid power factor: ${powerFactor}. Must be between 0.1 and 1.0`);
  }

  const va = math.evaluate(`${watts} / ${powerFactor}`);
  return Number(va);
}

/**
 * Convert apparent power (VA) to real power (Watts)
 *
 * Formula: W = VA × PF
 *
 * @param va - Apparent power in VA
 * @param powerFactor - Power factor (0.1 to 1.0)
 * @returns Real power in Watts
 *
 * @example
 * convertVAToWatts(1250, 0.8)  // Returns 1000
 * convertVAToWatts(1000, 0.9)  // Returns 900
 *
 * @standard IEC 62040-3:2021 Section 5.2
 */
export function convertVAToWatts(va: number, powerFactor: number): number {
  // Handle edge case
  if (va === 0) {
    return 0;
  }

  // Validate power factor
  if (powerFactor <= 0 || powerFactor > 1) {
    throw new Error(`Invalid power factor: ${powerFactor}. Must be between 0.1 and 1.0`);
  }

  const watts = math.evaluate(`${va} * ${powerFactor}`);
  return Number(watts);
}

/**
 * Validate power factor and return warnings if unusual
 *
 * @param powerFactor - Power factor to validate
 * @returns Object with isValid flag and optional warning message
 *
 * @standard IEEE 1100-2020 Section 4.2.1
 */
export function validatePowerFactor(powerFactor: number): { isValid: boolean; warning?: string } {
  if (powerFactor <= 0 || powerFactor > 1) {
    return {
      isValid: false,
      warning: `Power factor ${powerFactor} is invalid. Must be between 0.1 and 1.0.`,
    };
  }

  if (powerFactor < 0.7) {
    return {
      isValid: true,
      warning: `Power factor ${powerFactor} is unusually low. Typical IT loads have PF ≥ 0.7. Verify load specifications.`,
    };
  }

  if (powerFactor > 0.95) {
    return {
      isValid: true,
      warning: `Power factor ${powerFactor} is unusually high. Most UPS systems have PF ≤ 0.95. Consider if this is the UPS output PF or load PF.`,
    };
  }

  return { isValid: true };
}

/**
 * Get power factor explanation for display
 *
 * @param powerFactor - Power factor value
 * @returns Human-readable explanation
 */
export function getPowerFactorExplanation(powerFactor: number): string {
  if (powerFactor >= 0.95) {
    return 'Unity power factor - load behaves as pure resistive. Common for modern power supplies with active PFC.';
  }

  if (powerFactor >= 0.9) {
    return 'High power factor - efficient operation with minimal reactive power. Typical for servers with active PFC.';
  }

  if (powerFactor >= 0.8) {
    return 'Standard power factor - typical for mixed IT loads and legacy equipment per IEEE 1100 guidelines.';
  }

  if (powerFactor >= 0.7) {
    return 'Moderate power factor - some reactive power present. Common for motors or older equipment.';
  }

  return 'Low power factor - significant reactive power. Consider power factor correction.';
}
