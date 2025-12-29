/**
 * Lighting Design Calculator Validation
 *
 * Zod schemas and validation functions for lighting calculations.
 * Follows Constitution Principle II: Safety-First Validation.
 *
 * @see specs/004-lighting-design/data-model.md for validation rules
 */

import { z } from 'zod';
import {
  SpaceType,
  LuminaireCategory,
  DistributionType,
  LightingStandard,
  UnitSystem,
  type CalculationWarning,
} from '@/lib/types/lighting';

// ============================================================================
// Room Validation Schema
// ============================================================================

export const RoomSchema = z.object({
  length: z
    .number()
    .min(1, 'Room length must be at least 1 meter')
    .max(100, 'Room length must not exceed 100 meters'),
  width: z
    .number()
    .min(1, 'Room width must be at least 1 meter')
    .max(100, 'Room width must not exceed 100 meters'),
  height: z
    .number()
    .min(2, 'Ceiling height must be at least 2 meters')
    .max(20, 'Ceiling height must not exceed 20 meters'),
  workPlaneHeight: z
    .number()
    .min(0, 'Work plane height cannot be negative')
    .default(0.75),
  ceilingReflectance: z
    .number()
    .min(0, 'Reflectance must be at least 0%')
    .max(100, 'Reflectance must not exceed 100%')
    .default(80),
  wallReflectance: z
    .number()
    .min(0, 'Reflectance must be at least 0%')
    .max(100, 'Reflectance must not exceed 100%')
    .default(50),
  floorReflectance: z
    .number()
    .min(0, 'Reflectance must be at least 0%')
    .max(100, 'Reflectance must not exceed 100%')
    .default(20),
  spaceType: z.nativeEnum(SpaceType).default(SpaceType.OFFICE_GENERAL),
}).refine(
  (data) => data.workPlaneHeight < data.height - 0.5,
  {
    message: 'Work plane must be at least 0.5m below ceiling',
    path: ['workPlaneHeight'],
  }
);

export type RoomInput = z.input<typeof RoomSchema>;
export type RoomOutput = z.output<typeof RoomSchema>;

// ============================================================================
// Luminaire Validation Schema
// ============================================================================

export const LuminaireSchema = z.object({
  id: z.string().min(1, 'Luminaire ID is required'),
  manufacturer: z.string().min(1, 'Manufacturer name is required').max(100),
  model: z.string().min(1, 'Model name is required').max(100),
  category: z.nativeEnum(LuminaireCategory),
  watts: z
    .number()
    .positive('Wattage must be positive')
    .max(5000, 'Wattage must not exceed 5000W'),
  lumens: z
    .number()
    .positive('Lumens must be positive')
    .max(100000, 'Lumens must not exceed 100,000'),
  efficacy: z
    .number()
    .min(1, 'Efficacy must be at least 1 lm/W')
    .max(250, 'Efficacy must not exceed 250 lm/W'),
  beamAngle: z
    .number()
    .min(10, 'Beam angle must be at least 10°')
    .max(180, 'Beam angle must not exceed 180°')
    .default(120),
  distributionType: z.nativeEnum(DistributionType).default(DistributionType.DIRECT),
  maxSHR: z
    .number()
    .min(0.5, 'Max SHR must be at least 0.5')
    .max(2.5, 'Max SHR must not exceed 2.5')
    .default(1.5),
  cri: z.number().min(0).max(100).optional(),
  cct: z.number().min(2000).max(10000).optional(),
  dimmable: z.boolean().optional(),
  ipRating: z.string().max(10).optional(),
  ufTableId: z.string().default('generic-led-troffer'),
  isCustom: z.boolean().optional(),
});

export type LuminaireInput = z.input<typeof LuminaireSchema>;
export type LuminaireOutput = z.output<typeof LuminaireSchema>;

// ============================================================================
// Design Parameters Validation Schema
// ============================================================================

export const DesignParametersSchema = z.object({
  requiredIlluminance: z
    .number()
    .min(50, 'Illuminance must be at least 50 lux')
    .max(5000, 'Illuminance must not exceed 5000 lux'),
  utilizationFactor: z
    .number()
    .min(0.3, 'UF must be at least 0.3')
    .max(0.9, 'UF must not exceed 0.9')
    .default(0.6),
  maintenanceFactor: z
    .number()
    .min(0.5, 'MF must be at least 0.5')
    .max(1.0, 'MF must not exceed 1.0')
    .default(0.8),
  operatingHoursPerDay: z
    .number()
    .min(1, 'Operating hours must be at least 1')
    .max(24, 'Operating hours must not exceed 24')
    .default(10),
  standard: z.nativeEnum(LightingStandard).default(LightingStandard.IESNA),
  unitSystem: z.nativeEnum(UnitSystem).default(UnitSystem.SI),
});

export type DesignParametersInput = z.input<typeof DesignParametersSchema>;
export type DesignParametersOutput = z.output<typeof DesignParametersSchema>;

// ============================================================================
// Combined Calculation Input Schema
// ============================================================================

export const LightingCalculationInputSchema = z.object({
  room: RoomSchema,
  luminaire: LuminaireSchema,
  designParameters: DesignParametersSchema,
});

export type LightingCalculationInputType = z.infer<typeof LightingCalculationInputSchema>;

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: CalculationWarning[];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate room input and generate warnings
 */
export function validateRoom(input: unknown): ValidationResult {
  const result = RoomSchema.safeParse(input);
  const warnings: CalculationWarning[] = [];

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map((e) => e.message),
      warnings: [],
    };
  }

  const room = result.data;

  // Warning: Very high ceiling
  if (room.height > 10) {
    warnings.push({
      severity: 'warning',
      code: 'HIGH_CEILING',
      message: `Ceiling height of ${room.height}m is very high. Consider high-bay fixtures.`,
      recommendation: 'Select luminaires designed for high mounting heights.',
    });
  }

  // Warning: Low reflectances
  if (room.ceilingReflectance < 50 || room.wallReflectance < 30) {
    warnings.push({
      severity: 'info',
      code: 'LOW_REFLECTANCE',
      message: 'Low surface reflectances will reduce light utilization.',
      recommendation: 'Consider lighter surface finishes to improve efficiency.',
    });
  }

  // Warning: Large room
  if (room.length * room.width > 500) {
    warnings.push({
      severity: 'info',
      code: 'LARGE_ROOM',
      message: 'Large room area may require zone-based lighting design.',
      recommendation: 'Consider dividing into calculation zones for better uniformity.',
    });
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}

/**
 * Validate luminaire input and generate warnings
 */
export function validateLuminaire(input: unknown): ValidationResult {
  const result = LuminaireSchema.safeParse(input);
  const warnings: CalculationWarning[] = [];

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map((e) => e.message),
      warnings: [],
    };
  }

  const luminaire = result.data;

  // Warning: Low efficacy (inefficient)
  if (luminaire.efficacy < 80) {
    warnings.push({
      severity: 'warning',
      code: 'LOW_EFFICACY',
      message: `Efficacy of ${luminaire.efficacy} lm/W is below modern LED standards.`,
      recommendation: 'Consider higher efficacy luminaires (>100 lm/W) for energy savings.',
    });
  }

  // Warning: Very high wattage
  if (luminaire.watts > 200) {
    warnings.push({
      severity: 'info',
      code: 'HIGH_WATTAGE',
      message: `High wattage fixture (${luminaire.watts}W) may have significant energy costs.`,
    });
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}

/**
 * Validate design parameters and generate warnings
 */
export function validateDesignParameters(input: unknown): ValidationResult {
  const result = DesignParametersSchema.safeParse(input);
  const warnings: CalculationWarning[] = [];

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map((e) => e.message),
      warnings: [],
    };
  }

  const params = result.data;

  // Warning: Very high illuminance
  if (params.requiredIlluminance > 1000) {
    warnings.push({
      severity: 'warning',
      code: 'HIGH_ILLUMINANCE',
      message: `${params.requiredIlluminance} lux is very high. Typical offices require 300-500 lux.`,
      recommendation: 'Verify illuminance requirement per IESNA recommendations.',
    });
  }

  // Warning: Very low illuminance
  if (params.requiredIlluminance < 100) {
    warnings.push({
      severity: 'warning',
      code: 'LOW_ILLUMINANCE',
      message: `${params.requiredIlluminance} lux is low. May not meet code requirements.`,
      recommendation: 'Check minimum illuminance requirements for the space type.',
    });
  }

  // Warning: Long operating hours
  if (params.operatingHoursPerDay > 16) {
    warnings.push({
      severity: 'info',
      code: 'LONG_OPERATING_HOURS',
      message: `${params.operatingHoursPerDay} hours/day operating time is above typical commercial use.`,
      recommendation: 'Consider occupancy sensors or daylight harvesting for energy savings.',
    });
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}

/**
 * Validate complete lighting calculation input with all warnings
 *
 * Implements Constitution Principle II: Safety-First Validation
 * with <300ms debounced latency target.
 */
export function validateWithWarnings(input: unknown): ValidationResult {
  const roomResult = validateRoom((input as Record<string, unknown>)?.room);
  const luminaireResult = validateLuminaire((input as Record<string, unknown>)?.luminaire);
  const paramsResult = validateDesignParameters((input as Record<string, unknown>)?.designParameters);

  const allErrors = [
    ...roomResult.errors,
    ...luminaireResult.errors,
    ...paramsResult.errors,
  ];

  const allWarnings = [
    ...roomResult.warnings,
    ...luminaireResult.warnings,
    ...paramsResult.warnings,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Parse and validate room input, returning typed result
 */
export function parseRoom(input: unknown): RoomOutput {
  return RoomSchema.parse(input);
}

/**
 * Parse and validate luminaire input, returning typed result
 */
export function parseLuminaire(input: unknown): LuminaireOutput {
  return LuminaireSchema.parse(input);
}

/**
 * Parse and validate design parameters, returning typed result
 */
export function parseDesignParameters(input: unknown): DesignParametersOutput {
  return DesignParametersSchema.parse(input);
}
