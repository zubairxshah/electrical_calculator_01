/**
 * Input Validation Schemas for Circuit Breaker Sizing Calculator
 *
 * Zod schemas for type-safe runtime validation of user inputs.
 * Ensures all inputs meet electrical engineering constraints before calculation.
 *
 * Based on: specs/003-circuit-breaker-sizing/data-model.md
 *
 * @module breakerValidation
 */

import { z } from 'zod';

/**
 * Voltage Validation Schema
 *
 * Valid range: 100V to 1000V
 * Common voltages: NEC (120, 208, 240, 277, 480), IEC (230, 400, 690)
 */
export const voltageSchema = z
  .number()
  .positive('Voltage must be positive')
  .min(100, { message: 'Voltage must be at least 100V' })
  .max(1000, { message: 'Voltage must not exceed 1000V' })
  .describe('Voltage in volts (100V - 1000V)');

/**
 * Load Value Validation Schema
 *
 * Valid range: >0 to 10,000 (kW or A depending on mode)
 */
export const loadValueSchema = z
  .number()
  .positive({ message: 'Load must be greater than zero' })
  .max(10000, { message: 'Load must not exceed 10,000 (kW or A)' })
  .describe('Load value in kW or Amperes');

/**
 * Power Factor Validation Schema
 *
 * Valid range: 0.5 to 1.0
 * Typical values: 0.8-0.95 (industrial), 0.9-1.0 (residential)
 */
export const powerFactorSchema = z
  .number()
  .min(0.5, { message: 'Power factor must be at least 0.5' })
  .max(1.0, { message: 'Power factor must not exceed 1.0' })
  .default(0.8)
  .describe('Power factor (0.5 - 1.0)');

/**
 * Temperature Validation Schema
 *
 * Valid range: -40°C to +70°C
 * Typical range: 20°C to 40°C (ambient)
 */
export const temperatureSchema = z
  .number()
  .min(-40, { message: 'Temperature must be at least -40°C' })
  .max(70, { message: 'Temperature must not exceed 70°C' })
  .optional()
  .describe('Ambient temperature in Celsius');

/**
 * Grouped Cables Validation Schema
 *
 * Valid range: 1 to 100
 * Note: >20 cables requires special thermal analysis
 */
export const groupedCablesSchema = z
  .number()
  .int({ message: 'Number of cables must be an integer' })
  .min(1, { message: 'Must have at least 1 cable' })
  .max(100, { message: 'Grouping assumption: limit to 100 cables' })
  .optional()
  .describe('Number of grouped cables');

/**
 * Circuit Distance Validation Schema
 *
 * Valid range: >0 (meters or feet)
 */
export const circuitDistanceSchema = z
  .number()
  .positive({ message: 'Distance must be greater than zero' })
  .max(10000, { message: 'Distance must not exceed 10,000 (m or ft)' })
  .optional()
  .describe('Circuit distance in meters or feet');

/**
 * Short Circuit Current Validation Schema
 *
 * Valid range: >0 kA (typically 5-100 kA)
 */
export const shortCircuitCurrentSchema = z
  .number()
  .positive({ message: 'Short circuit current must be greater than zero' })
  .max(200, { message: 'Short circuit current must not exceed 200 kA' })
  .optional()
  .describe('Short circuit current in kA');

/**
 * Installation Method Schema (IEC)
 */
export const installationMethodSchema = z
  .enum(['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F', 'G'])
  .optional()
  .describe('IEC installation method type');

/**
 * Conductor Size Schema
 */
export const conductorSizeSchema = z
  .object({
    value: z.number().positive({ message: 'Conductor size must be positive' }),
    unit: z.enum(['AWG', 'kcmil', 'mm²']),
  })
  .optional()
  .describe('Conductor size with unit');

/**
 * Circuit Configuration Schema
 *
 * Primary user inputs for breaker sizing calculation
 */
export const circuitConfigSchema = z.object({
  standard: z.enum(['NEC', 'IEC']),
  voltage: voltageSchema,
  phase: z.enum(['single', 'three']),
  loadMode: z.enum(['kw', 'amps']),
  loadValue: loadValueSchema,
  powerFactor: powerFactorSchema,
  unitSystem: z.enum(['metric', 'imperial']),
});

/**
 * Environmental Conditions Schema
 *
 * Optional parameters for derating and voltage drop analysis
 */
export const environmentalConditionsSchema = z
  .object({
    ambientTemperature: temperatureSchema,
    groupedCables: groupedCablesSchema,
    installationMethod: installationMethodSchema,
    circuitDistance: circuitDistanceSchema,
    conductorMaterial: z.enum(['copper', 'aluminum']).optional(),
    conductorSize: conductorSizeSchema,
  })
  .optional();

/**
 * Full Calculation Input Schema
 *
 * Combines circuit configuration, environmental conditions, and optional parameters
 */
export const calculationInputSchema = z.object({
  circuit: circuitConfigSchema,
  environment: environmentalConditionsSchema,
  shortCircuitCurrentKA: shortCircuitCurrentSchema,
  loadType: z.enum(['resistive', 'inductive', 'mixed', 'capacitive']).optional(),
});

/**
 * Project Information Schema
 *
 * Optional metadata for PDF reports
 */
export const projectInformationSchema = z
  .object({
    projectName: z.string().max(200, { message: 'Project name too long' }).optional(),
    projectLocation: z.string().max(200, { message: 'Location too long' }).optional(),
    engineerName: z.string().max(100, { message: 'Engineer name too long' }).optional(),
    engineerCompany: z.string().max(200, { message: 'Company name too long' }).optional(),
    notes: z.string().max(1000, { message: 'Notes too long' }).optional(),
    jurisdictionalCode: z.string().max(50, { message: 'Code reference too long' }).optional(),
  })
  .optional();

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CircuitConfigInput = z.infer<typeof circuitConfigSchema>;
export type EnvironmentalConditionsInput = z.infer<typeof environmentalConditionsSchema>;
export type CalculationInput = z.infer<typeof calculationInputSchema>;
export type ProjectInformationInput = z.infer<typeof projectInformationSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate circuit configuration inputs
 *
 * @param input - User-provided circuit configuration
 * @returns Validation result with parsed data or errors
 *
 * @example
 * ```typescript
 * const result = validateCircuitConfig({
 *   standard: 'NEC',
 *   voltage: 240,
 *   phase: 'single',
 *   loadMode: 'kw',
 *   loadValue: 10,
 *   powerFactor: 0.9,
 *   unitSystem: 'imperial'
 * });
 *
 * if (result.success) {
 *   console.log('Valid input:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.errors);
 * }
 * ```
 */
export function validateCircuitConfig(input: unknown) {
  return circuitConfigSchema.safeParse(input);
}

/**
 * Validate environmental conditions
 *
 * @param input - User-provided environmental parameters
 * @returns Validation result with parsed data or errors
 */
export function validateEnvironmentalConditions(input: unknown) {
  return environmentalConditionsSchema.safeParse(input);
}

/**
 * Validate complete calculation input
 *
 * @param input - Complete calculation input object
 * @returns Validation result with parsed data or errors
 */
export function validateCalculationInput(input: unknown) {
  return calculationInputSchema.safeParse(input);
}

/**
 * Validate project information
 *
 * @param input - Project metadata
 * @returns Validation result with parsed data or errors
 */
export function validateProjectInformation(input: unknown) {
  return projectInformationSchema.safeParse(input);
}

// ============================================================================
// EDGE CASE VALIDATORS
// ============================================================================

/**
 * Check if voltage is a standard value for the selected electrical standard
 *
 * @param voltage - Voltage in volts
 * @param standard - Electrical standard ('NEC' or 'IEC')
 * @returns Warning message if unusual voltage, null if standard
 */
export function checkStandardVoltage(
  voltage: number,
  standard: 'NEC' | 'IEC'
): string | null {
  const standardVoltagesNEC = [120, 208, 240, 277, 480];
  const standardVoltagesIEC = [230, 400, 690];

  const standardVoltages = standard === 'NEC' ? standardVoltagesNEC : standardVoltagesIEC;

  if (!standardVoltages.includes(voltage)) {
    const suggestions = standardVoltages.join('V, ') + 'V';
    return `Warning: ${voltage}V is not a standard ${standard} voltage. Common values: ${suggestions}`;
  }

  return null;
}

/**
 * Check if temperature is extreme and requires special consideration
 *
 * @param temperature - Ambient temperature in °C
 * @returns Warning message if extreme, null if normal
 */
export function checkExtremeTemperature(temperature: number): string | null {
  if (temperature > 60) {
    return `Warning: Temperature ${temperature}°C is extremely high. Special breakers and enclosures may be required. Consult manufacturer specifications.`;
  }

  if (temperature < -20) {
    return `Warning: Temperature ${temperature}°C is extremely low. Cold-rated equipment may be required. Check breaker operating temperature range.`;
  }

  return null;
}

/**
 * Check if power factor is low and may require correction
 *
 * @param powerFactor - Power factor (0.5-1.0)
 * @returns Warning message if low, null if acceptable
 */
export function checkPowerFactor(powerFactor: number): string | null {
  if (powerFactor < 0.7) {
    return `Warning: Power factor ${powerFactor} is very low. Consider power factor correction to reduce current draw and improve efficiency. Typical industrial: 0.85-0.95.`;
  }

  return null;
}

/**
 * Check if circuit distance is very long and may cause excessive voltage drop
 *
 * @param distance - Circuit distance in meters or feet
 * @param unitSystem - 'metric' or 'imperial'
 * @returns Warning message if very long, null if acceptable
 */
export function checkCircuitDistance(
  distance: number,
  unitSystem: 'metric' | 'imperial'
): string | null {
  const longDistance = unitSystem === 'metric' ? 300 : 1000; // 300m or 1000ft

  if (distance > longDistance) {
    const unit = unitSystem === 'metric' ? 'm' : 'ft';
    return `Warning: Circuit distance ${distance}${unit} is very long. Voltage drop analysis strongly recommended. Consider larger cable size or higher voltage.`;
  }

  return null;
}

/**
 * Validate all inputs and collect warnings
 *
 * @param input - Complete calculation input
 * @returns Object containing validation errors and warnings
 */
export function validateWithWarnings(input: CalculationInput): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate schema
  const validationResult = validateCalculationInput(input);
  if (!validationResult.success) {
    validationResult.error.issues.forEach((err) => {
      errors.push(`${err.path.join('.')}: ${err.message}`);
    });
  }

  if (!validationResult.success) {
    return { isValid: false, errors, warnings };
  }

  const data = validationResult.data;

  // Check for unusual voltages
  const voltageWarning = checkStandardVoltage(data.circuit.voltage, data.circuit.standard);
  if (voltageWarning) warnings.push(voltageWarning);

  // Check power factor
  const pfWarning = checkPowerFactor(data.circuit.powerFactor);
  if (pfWarning) warnings.push(pfWarning);

  // Check extreme temperatures
  if (data.environment?.ambientTemperature !== undefined) {
    const tempWarning = checkExtremeTemperature(data.environment.ambientTemperature);
    if (tempWarning) warnings.push(tempWarning);
  }

  // Check long circuit distances
  if (data.environment?.circuitDistance !== undefined) {
    const distanceWarning = checkCircuitDistance(
      data.environment.circuitDistance,
      data.circuit.unitSystem
    );
    if (distanceWarning) warnings.push(distanceWarning);
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}

/**
 * Format validation errors for user display
 *
 * @param errors - Zod validation errors
 * @returns Array of user-friendly error messages
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.issues.map((err) => {
    const field = err.path.join('.');
    return `${field}: ${err.message}`;
  });
}
