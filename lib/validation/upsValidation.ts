/**
 * UPS Input Validation
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Zod validation schemas and validation functions for UPS sizing inputs
 */

import { z } from 'zod';
import { validatePowerFactor } from '@/lib/calculations/ups/powerFactor';

/**
 * Load item schema - at least one power value required (VA or Watts)
 */
export const loadItemSchema = z.object({
  name: z.string().min(1, 'Load name is required').max(100, 'Load name too long'),
  powerVA: z.number().min(1).max(1000000).nullable().optional(),
  powerWatts: z.number().min(1).max(1000000).nullable().optional(),
  powerFactor: z.number().min(0.1).max(1.0).default(0.8),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000, 'Quantity too high'),
}).refine(
  (data) => data.powerVA !== null && data.powerVA !== undefined || data.powerWatts !== null && data.powerWatts !== undefined,
  { message: 'Either Power VA or Power Watts is required' }
);

/**
 * UPS inputs schema
 */
export const upsInputsSchema = z.object({
  loads: z.array(loadItemSchema).min(1, 'At least one load is required').max(100, 'Maximum 100 loads allowed'),
  growthMargin: z.number().min(0).max(1).default(0.25),
  targetRedundancy: z.enum(['none', 'N+1', '2N']).default('none'),
});

/**
 * Inferred types from schemas
 */
export type LoadItem = z.infer<typeof loadItemSchema>;
export type UPSInputs = z.infer<typeof upsInputsSchema>;

/**
 * Validation result interface
 */
export interface UPSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate UPS inputs with business logic checks
 *
 * @param inputs - UPS inputs to validate
 * @returns Validation result with errors and warnings
 */
export function validateUPSInputs(inputs: UPSInputs): UPSValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate using Zod schema first
  const zodResult = upsInputsSchema.safeParse(inputs);
  if (!zodResult.success) {
    zodResult.error.issues.forEach((issue) => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    });
  }

  // Check power factor warnings for each load
  for (const load of inputs.loads) {
    if (load.powerFactor !== undefined) {
      const pfValidation = validatePowerFactor(load.powerFactor);
      if (pfValidation.warning) {
        warnings.push(`${load.name}: ${pfValidation.warning}`);
      }
    }
  }

  // Check for very high total load
  const totalVA = inputs.loads.reduce((sum, load) => {
    const va = load.powerVA ?? (load.powerWatts ?? 0) / (load.powerFactor ?? 0.8);
    return sum + va * load.quantity;
  }, 0);

  if (totalVA > 200000) {
    warnings.push(`Total load (${(totalVA / 1000).toFixed(1)} kVA) exceeds standard UPS sizes (200 kVA max). Consider parallel UPS configuration.`);
  }

  // Check for high growth margin
  if (inputs.growthMargin > 0.5) {
    warnings.push(`Growth margin of ${(inputs.growthMargin * 100).toFixed(0)}% is unusually high. Typical range is 20-30%.`);
  }

  // Check for very low growth margin
  if (inputs.growthMargin < 0.1 && inputs.growthMargin > 0) {
    warnings.push(`Growth margin of ${(inputs.growthMargin * 100).toFixed(0)}% may not allow for future expansion. Consider at least 10-25%.`);
  }

  // Check for duplicate load names
  const loadNames = inputs.loads.map((l) => l.name.toLowerCase());
  const duplicates = loadNames.filter((name, index) => loadNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate load names found: ${[...new Set(duplicates)].join(', ')}. Consider unique names for clarity.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create empty load item
 */
export function createEmptyLoadItem(): LoadItem {
  return {
    name: '',
    powerVA: null,
    powerWatts: null,
    powerFactor: 0.8,
    quantity: 1,
  };
}

/**
 * Common load presets for quick entry
 */
export const LOAD_PRESETS = [
  { name: 'Server (1U)', powerVA: 500, quantity: 1 },
  { name: 'Server (2U)', powerVA: 800, quantity: 1 },
  { name: 'Blade Chassis', powerVA: 6000, quantity: 1 },
  { name: 'Network Switch (24-port)', powerVA: 100, quantity: 1 },
  { name: 'Network Switch (48-port)', powerVA: 200, quantity: 1 },
  { name: 'Core Router', powerVA: 500, quantity: 1 },
  { name: 'SAN Storage', powerVA: 1200, quantity: 1 },
  { name: 'NAS Storage', powerVA: 300, quantity: 1 },
  { name: 'Workstation', powerVA: 400, quantity: 1 },
  { name: 'Monitor (24")', powerVA: 50, quantity: 1 },
  { name: 'Monitor (27")', powerVA: 75, quantity: 1 },
] as const;
