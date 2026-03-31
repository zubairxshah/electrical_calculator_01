// Generator Sizing Validation — Zod schemas
import { z } from 'zod'

const loadItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Load name is required').max(100),
  type: z.enum(['motor', 'resistive', 'lighting', 'mixed', 'hvac']),
  ratedPower: z.number().positive('Rated power must be positive'),
  powerInputUnit: z.enum(['kW', 'HP']),
  isKva: z.boolean(),
  powerFactor: z.number().min(0.01, 'Power factor must be ≥ 0.01').max(1.0, 'Power factor must be ≤ 1.0'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  diversityFactor: z.number().min(0.01, 'Diversity factor must be ≥ 0.01').max(1.0, 'Diversity factor must be ≤ 1.0'),
  stepNumber: z.number().int().min(1).nullable(),
  isMotor: z.boolean(),
  motorHp: z.number().positive().nullable(),
  nemaCodeLetter: z.enum(['A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','U','V']).nullable(),
  iecLockedRotorRatio: z.number().positive().nullable(),
  startingMethod: z.enum(['dol', 'star-delta', 'autotransformer-65', 'autotransformer-80', 'soft-starter', 'vfd']),
  vfdMultiplier: z.number().min(0.02).max(0.50).nullable(),
  softStarterMultiplier: z.number().min(0.30).max(0.70).nullable(),
}).superRefine((data, ctx) => {
  if (data.type === 'motor' || data.isMotor) {
    if (!data.motorHp && !data.nemaCodeLetter && !data.iecLockedRotorRatio) {
      // Motor needs at least HP or a code letter or IEC ratio for starting analysis
      // Not blocking — starting analysis will be skipped for this motor
    }
    if (data.startingMethod === 'vfd' && data.vfdMultiplier === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'VFD multiplier is required when starting method is VFD',
        path: ['vfdMultiplier'],
      })
    }
    if (data.startingMethod === 'soft-starter' && data.softStarterMultiplier === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Soft starter multiplier is required when starting method is soft-starter',
        path: ['softStarterMultiplier'],
      })
    }
  }
})

const generatorConfigSchema = z.object({
  dutyType: z.enum(['standby', 'prime']),
  primeLoadingLimit: z.number().min(0.50).max(1.0),
  voltage: z.number().positive('Voltage must be positive'),
  phases: z.enum(['single', 'three']),
  frequency: z.union([z.literal(50), z.literal(60)]),
  subtransientReactance: z.number().min(0.05).max(0.35),
  fuelType: z.enum(['diesel', 'natural-gas']),
  necClassification: z.enum(['700', '701', '702']).nullable(),
})

const siteConditionsSchema = z.object({
  altitude: z.number().min(0, 'Altitude must be ≥ 0').max(5000, 'Altitude must be ≤ 5000m'),
  altitudeUnit: z.enum(['m', 'ft']),
  ambientTemperature: z.number().min(-40, 'Temperature must be ≥ -40°C').max(60, 'Temperature must be ≤ 60°C'),
  temperatureUnit: z.enum(['C', 'F']),
})

const fuelConfigSchema = z.object({
  requiredRuntime: z.number().positive('Runtime must be positive'),
  averageLoadingPercent: z.number().min(30, 'Minimum loading 30% to prevent wet stacking').max(100, 'Loading cannot exceed 100%'),
  volumeUnit: z.enum(['liters', 'gallons']),
})

export const generatorSizingInputSchema = z.object({
  loads: z.array(loadItemSchema).min(1, 'At least one load is required'),
  generatorConfig: generatorConfigSchema,
  siteConditions: siteConditionsSchema,
  fuelConfig: fuelConfigSchema.nullable(),
  voltageDipThreshold: z.number().min(1).max(50).default(15),
})

export type GeneratorSizingInputValidated = z.infer<typeof generatorSizingInputSchema>

/** Validate generator sizing input, return errors or null */
export function validateGeneratorSizingInput(input: unknown): { success: true } | { success: false; errors: string[] } {
  const result = generatorSizingInputSchema.safeParse(input)
  if (result.success) return { success: true }
  return {
    success: false,
    errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}
