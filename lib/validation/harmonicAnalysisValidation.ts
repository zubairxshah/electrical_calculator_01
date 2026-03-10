// Harmonic Analysis Validation - Zod schemas
import { z } from 'zod'

const harmonicOrderSchema = z.object({
  order: z.number().int().min(2).max(50),
  magnitude: z.number().min(0).max(100),
  phase: z.number().optional(),
})

export const harmonicAnalysisInputSchema = z.object({
  standard: z.enum(['IEEE519', 'IEC61000']),
  systemType: z.enum(['single-phase', 'three-phase']),
  voltageLevel: z.enum(['lv', 'mv', 'hv']),
  systemVoltage: z.number().min(50).max(500000),
  fundamentalFrequency: z.union([z.literal(50), z.literal(60)]),
  loadProfile: z.string(),
  fundamentalCurrent: z.number().min(0.01).max(100000),
  loadPowerKW: z.number().min(0).max(1000000).nullable(),
  shortCircuitCurrentKA: z.number().min(0.1).max(1000).nullable(),
  maxDemandCurrent: z.number().min(0.01).max(100000).nullable(),
  currentHarmonics: z.array(harmonicOrderSchema),
  voltageHarmonics: z.array(harmonicOrderSchema),
  calculateVoltageThd: z.boolean(),
  calculateFilterSizing: z.boolean(),
  targetThd: z.number().min(0.1).max(50).nullable(),
}).superRefine((data, ctx) => {
  // Must have at least one non-zero current harmonic
  const hasHarmonics = data.currentHarmonics.some(h => h.magnitude > 0)
  if (!hasHarmonics) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter at least one harmonic magnitude greater than 0%, or select a load profile.',
      path: ['currentHarmonics'],
    })
  }

  // If voltage THD enabled, need voltage harmonics
  if (data.calculateVoltageThd) {
    const hasVoltageHarmonics = data.voltageHarmonics.some(h => h.magnitude > 0)
    if (!hasVoltageHarmonics) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter voltage harmonic data or disable voltage THD calculation.',
        path: ['voltageHarmonics'],
      })
    }
  }

  // IEEE 519 TDD needs Isc and IL
  if (data.standard === 'IEEE519') {
    if (data.shortCircuitCurrentKA && !data.maxDemandCurrent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Max demand current (IL) is required for TDD calculation when short-circuit current is provided.',
        path: ['maxDemandCurrent'],
      })
    }
    if (!data.shortCircuitCurrentKA && data.maxDemandCurrent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Short-circuit current at PCC is required for TDD calculation when max demand current is provided.',
        path: ['shortCircuitCurrentKA'],
      })
    }
  }

  // Filter sizing needs target THD
  if (data.calculateFilterSizing && !data.targetThd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Specify a target THD for filter sizing.',
      path: ['targetThd'],
    })
  }

  // Voltage level vs system voltage sanity check
  if (data.voltageLevel === 'lv' && data.systemVoltage > 1000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'System voltage exceeds 1 kV but voltage level is set to LV. Check voltage level selection.',
      path: ['systemVoltage'],
    })
  }
  if (data.voltageLevel === 'mv' && (data.systemVoltage <= 1000 || data.systemVoltage > 69000)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'MV voltage level applies to 1 kV - 69 kV range. Check voltage level selection.',
      path: ['systemVoltage'],
    })
  }
})

export function validateHarmonicAnalysisInput(input: unknown) {
  return harmonicAnalysisInputSchema.safeParse(input)
}
