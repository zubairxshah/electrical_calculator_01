/**
 * Cable Input Validation
 * Feature: 001-electromate-engineering-app
 * Tasks: T089-T090 - Create cable input validation
 *
 * Zod schema validation for cable sizing calculations.
 * Includes dangerous condition detection per FR-004.
 *
 * @see FR-007a: Comprehensive voltage range support
 * @see FR-009: Voltage drop >3% red highlighting
 */

import { z } from 'zod';

/**
 * Supported system voltages organized by category (FR-007a)
 */
export const SYSTEM_VOLTAGES = {
  'LV AC': [120, 208, 240, 277, 480, 600],
  'MV': [2400, 4160, 13800],
  'DC Telecom': [12, 24, 48],
  'DC Industrial': [125, 250],
  'DC Solar': [400, 600, 800, 1000, 1500],
} as const;

/**
 * All supported voltages (flat array)
 */
export const ALL_VOLTAGES: readonly number[] = Object.values(SYSTEM_VOLTAGES).flat();

/**
 * Conductor materials
 */
export const CONDUCTOR_MATERIALS = ['copper', 'aluminum'] as const;
export type ConductorMaterial = (typeof CONDUCTOR_MATERIALS)[number];

/**
 * Installation methods
 */
export const INSTALLATION_METHODS = [
  'conduit',
  'cable-tray',
  'direct-burial',
  'free-air',
] as const;
export type InstallationMethod = (typeof INSTALLATION_METHODS)[number];

/**
 * Circuit types
 */
export const CIRCUIT_TYPES = ['single-phase', 'three-phase'] as const;
export type CircuitType = (typeof CIRCUIT_TYPES)[number];

/**
 * Standards
 */
export const STANDARDS = ['IEC', 'NEC'] as const;
export type Standard = (typeof STANDARDS)[number];

/**
 * Insulation ratings
 */
export const INSULATION_RATINGS = [60, 70, 75, 90] as const;
export type InsulationRating = (typeof INSULATION_RATINGS)[number];

/**
 * Cable inputs Zod schema (T089)
 *
 * Validates all cable sizing inputs with appropriate ranges
 */
export const cableInputsSchema = z.object({
  /** System voltage - preset or custom value */
  systemVoltage: z
    .number()
    .positive('Voltage must be positive')
    .min(1, 'Voltage must be at least 1V')
    .max(50000, 'Voltage cannot exceed 50,000V'),

  /** Circuit current (A) */
  current: z
    .number()
    .positive('Current must be positive')
    .min(0.1, 'Current must be at least 0.1A')
    .max(10000, 'Current cannot exceed 10,000A'),

  /** Cable length (meters for IEC, feet for NEC) */
  length: z
    .number()
    .positive('Length must be positive')
    .min(0.1, 'Length must be at least 0.1')
    .max(10000, 'Length cannot exceed 10,000'),

  /** Conductor material */
  conductorMaterial: z.enum(CONDUCTOR_MATERIALS),

  /** Installation method */
  installationMethod: z.enum(INSTALLATION_METHODS),

  /** Ambient temperature (°C) */
  ambientTemp: z
    .number()
    .min(-40, 'Temperature cannot be below -40°C')
    .max(90, 'Temperature cannot exceed 90°C')
    .default(30),

  /** Circuit type */
  circuitType: z.enum(CIRCUIT_TYPES).default('single-phase'),

  /** Number of current-carrying conductors */
  numberOfConductors: z
    .number()
    .int('Must be a whole number')
    .min(1, 'At least 1 conductor required')
    .max(50, 'Cannot exceed 50 conductors')
    .default(3),

  /** Insulation temperature rating */
  insulationRating: z
    .number()
    .refine(
      (val): val is InsulationRating => INSULATION_RATINGS.includes(val as InsulationRating),
      { message: 'Invalid insulation rating. Use 60, 70, 75, or 90°C.' }
    )
    .default(75),

  /** Standard to use */
  standard: z.enum(STANDARDS).default('IEC'),

  /** Selected cable size in mm² (optional - for validation) */
  selectedCableSizeMm2: z.number().positive().optional(),

  /** Selected cable size in AWG (optional - for validation) */
  selectedCableSizeAWG: z.string().optional(),
});

export type CableInputs = z.infer<typeof cableInputsSchema>;

/**
 * Validation warning structure
 */
export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'danger' | 'warning' | 'info';
  standardReference: string | null;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: string[];
}

/**
 * Validate cable inputs (T090)
 *
 * Checks for dangerous conditions:
 * - Voltage drop >10% (physically dangerous)
 * - Current exceeds derated ampacity
 * - High ambient temperature
 *
 * @param inputs - Cable calculation inputs
 * @returns Validation result with warnings
 */
export function validateCableInputs(inputs: CableInputs): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: string[] = [];

  // Check ambient temperature
  if (inputs.ambientTemp > 50) {
    warnings.push({
      field: 'ambientTemp',
      message: `High ambient temperature (${inputs.ambientTemp}°C) will significantly reduce cable ampacity`,
      severity: 'warning',
      standardReference: inputs.standard === 'NEC' ? 'NEC 310.15(B)(2)(a)' : 'IEC 60364-5-52 Table B.52.14',
    });
  }

  if (inputs.ambientTemp > 70) {
    warnings.push({
      field: 'ambientTemp',
      message: `Extreme ambient temperature (${inputs.ambientTemp}°C) - verify insulation rating is adequate`,
      severity: 'danger',
      standardReference: null,
    });
  }

  // Check for high conductor count
  if (inputs.numberOfConductors > 20) {
    warnings.push({
      field: 'numberOfConductors',
      message: `Large number of conductors (${inputs.numberOfConductors}) results in significant derating`,
      severity: 'warning',
      standardReference: inputs.standard === 'NEC' ? 'NEC 310.15(C)(1)' : 'IEC 60364-5-52 Table B.52.17',
    });
  }

  // Check for very long cable runs
  if (inputs.length > 200 && inputs.standard === 'IEC') {
    warnings.push({
      field: 'length',
      message: 'Long cable run - verify voltage drop is acceptable',
      severity: 'info',
      standardReference: 'IEC 60364-5-52',
    });
  }

  if (inputs.length > 500) {
    warnings.push({
      field: 'length',
      message: 'Very long cable run - consider intermediate substations or voltage step-up',
      severity: 'warning',
      standardReference: null,
    });
  }

  // Check for high current
  if (inputs.current > 500) {
    warnings.push({
      field: 'current',
      message: 'High current load - consider parallel conductors',
      severity: 'info',
      standardReference: inputs.standard === 'NEC' ? 'NEC 310.10(H)' : 'IEC 60364-5-52',
    });
  }

  // Check for DC system concerns
  if (inputs.systemVoltage <= 48) {
    warnings.push({
      field: 'systemVoltage',
      message: 'Low voltage system - voltage drop tolerance may be critical',
      severity: 'info',
      standardReference: null,
    });
  }

  // Check for MV system
  if (inputs.systemVoltage >= 2400) {
    warnings.push({
      field: 'systemVoltage',
      message: 'Medium voltage system - ensure proper insulation and terminations',
      severity: 'info',
      standardReference: inputs.standard === 'NEC' ? 'NEC Article 310' : 'IEC 60502',
    });
  }

  // Aluminum at small sizes
  if (inputs.conductorMaterial === 'aluminum' && inputs.current < 15) {
    warnings.push({
      field: 'conductorMaterial',
      message: 'Aluminum conductors not typically used for small currents - consider copper',
      severity: 'info',
      standardReference: null,
    });
  }

  // Direct burial concerns
  if (inputs.installationMethod === 'direct-burial') {
    warnings.push({
      field: 'installationMethod',
      message: 'Direct burial - ensure proper depth and protection per local codes',
      severity: 'info',
      standardReference: inputs.standard === 'NEC' ? 'NEC Table 300.5' : 'IEC 60364-5-52',
    });
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate voltage drop result
 *
 * @param voltageDropPercent - Calculated voltage drop percentage
 * @param standard - Standard being used
 * @returns Warnings for voltage drop issues
 */
export function validateVoltageDrop(
  voltageDropPercent: number,
  standard: Standard
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (voltageDropPercent > 3) {
    warnings.push({
      field: 'voltageDropPercent',
      message: `Voltage drop ${voltageDropPercent.toFixed(1)}% exceeds 3% limit`,
      severity: voltageDropPercent > 10 ? 'danger' : 'warning',
      standardReference: standard === 'NEC' ? 'NEC 210.19(A) Informational Note No. 4' : 'IEC 60364-5-52',
    });
  }

  if (voltageDropPercent > 10) {
    warnings.push({
      field: 'voltageDropPercent',
      message: 'Voltage drop >10% is physically dangerous and may cause equipment malfunction',
      severity: 'danger',
      standardReference: null,
    });
  }

  return warnings;
}

/**
 * Validate ampacity compliance
 *
 * @param current - Load current
 * @param deratedAmpacity - Cable ampacity after derating
 * @returns Warnings for ampacity issues
 */
export function validateAmpacity(
  current: number,
  deratedAmpacity: number
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const utilization = (current / deratedAmpacity) * 100;

  if (current > deratedAmpacity) {
    warnings.push({
      field: 'current',
      message: `Current ${current}A exceeds derated ampacity ${deratedAmpacity}A - risk of overheating`,
      severity: 'danger',
      standardReference: null,
    });
  } else if (utilization > 80) {
    warnings.push({
      field: 'current',
      message: `High utilization (${utilization.toFixed(0)}%) - consider larger cable for safety margin`,
      severity: 'warning',
      standardReference: null,
    });
  }

  return warnings;
}

/**
 * Get voltage category for a given voltage
 */
export function getVoltageCategory(voltage: number): string {
  for (const [category, voltages] of Object.entries(SYSTEM_VOLTAGES)) {
    if ((voltages as readonly number[]).includes(voltage)) {
      return category;
    }
  }
  return 'Unknown';
}

/**
 * Format voltage for display
 */
export function formatVoltage(voltage: number): string {
  if (voltage >= 1000) {
    return `${(voltage / 1000).toFixed(2)} kV`;
  }
  return `${voltage} V`;
}
