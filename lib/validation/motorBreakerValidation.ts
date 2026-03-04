/**
 * Motor & HVAC Breaker Sizing Validation
 *
 * Zod schemas for input validation with warning checks.
 *
 * @module motorBreakerValidation
 */

import { z } from 'zod';

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

export const standardSchema = z.enum(['NEC', 'IEC']);
export const systemTypeSchema = z.enum(['dc', 'single-phase-ac', 'three-phase-ac']);
export const loadTypeSchema = z.enum(['general', 'motor', 'hvac']);
export const inputModeSchema = z.enum(['power', 'fla']);
export const powerUnitSchema = z.enum(['kw', 'hp']);

export const voltageSchema = z.number().positive('Voltage must be positive').min(12, 'Minimum 12V').max(1000, 'Maximum 1000V');
export const powerValueSchema = z.number().positive('Power must be positive').max(10000, 'Maximum 10,000 kW/HP');
export const flaSchema = z.number().positive('FLA must be positive').max(10000, 'Maximum 10,000A');
export const powerFactorSchema = z.number().min(0.5, 'Minimum PF 0.5').max(1.0, 'Maximum PF 1.0');
export const mcaSchema = z.number().positive('MCA must be positive').max(10000, 'Maximum 10,000A');
export const mopSchema = z.number().positive('MOP must be positive').max(10000, 'Maximum 10,000A');
export const temperatureSchema = z.number().min(-40, 'Minimum -40°C').max(70, 'Maximum 70°C').optional();
export const groupedCablesSchema = z.number().int().min(1, 'Minimum 1 cable').max(20, 'Maximum 20 cables').optional();

export const protectionDeviceSchema = z.enum([
  'thermal-magnetic',
  'magnetic-only',
  'dual-element-fuse',
  'instantaneous-trip',
]);

export const utilizationCategorySchema = z.enum([
  'AC-1', 'AC-2', 'AC-3', 'AC-4',
  'DC-1', 'DC-2', 'DC-3', 'DC-4', 'DC-5',
]);

// ============================================================================
// COMPOSITE SCHEMAS
// ============================================================================

export const motorBreakerInputSchema = z.object({
  standard: standardSchema,
  systemType: systemTypeSchema,
  loadType: loadTypeSchema,
  voltage: voltageSchema.optional(),
  inputMode: inputModeSchema.optional(),
  powerValue: powerValueSchema.optional(),
  powerUnit: powerUnitSchema.optional(),
  fla: flaSchema.optional(),
  powerFactor: powerFactorSchema.optional(),
  protectionDevice: protectionDeviceSchema.optional(),
  utilizationCategory: utilizationCategorySchema.optional(),
  mca: mcaSchema.optional(),
  mop: mopSchema.optional(),
  ambientTemperature: temperatureSchema,
  groupedCables: groupedCablesSchema,
});

export type MotorBreakerInputValidated = z.infer<typeof motorBreakerInputSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateMotorBreakerInput(input: unknown) {
  return motorBreakerInputSchema.safeParse(input);
}

// ============================================================================
// WARNING CHECKS
// ============================================================================

export function checkMOPvsMCA(mca: number, mop: number): string | null {
  if (mop < mca) {
    return `MOP (${mop}A) is less than MCA (${mca}A). Verify equipment nameplate values.`;
  }
  return null;
}

export function checkDCVoltage(voltage: number): string | null {
  if (voltage < 24) {
    return `Low DC voltage (${voltage}V). Verify system voltage and conductor sizing.`;
  }
  return null;
}

export function checkHighHP(hp: number): string | null {
  if (hp > 200) {
    return `Large motor (${hp} HP). Consider medium-voltage supply or multiple parallel feeders.`;
  }
  return null;
}

/**
 * Combined validation with warnings
 */
export function validateWithWarnings(input: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = motorBreakerInputSchema.safeParse(input);
  const warnings: string[] = [];

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
      warnings,
    };
  }

  const data = result.data;

  // Check warnings
  if (data.mca && data.mop) {
    const w = checkMOPvsMCA(data.mca, data.mop);
    if (w) warnings.push(w);
  }

  if (data.systemType === 'dc' && data.voltage) {
    const w = checkDCVoltage(data.voltage);
    if (w) warnings.push(w);
  }

  if (data.powerUnit === 'hp' && data.powerValue && data.powerValue > 200) {
    const w = checkHighHP(data.powerValue);
    if (w) warnings.push(w);
  }

  return { isValid: true, errors: [], warnings };
}
