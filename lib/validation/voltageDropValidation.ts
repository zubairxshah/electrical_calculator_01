// Voltage Drop Calculator Validation
// Standards: IEC 60364-5-52, NEC Chapter 9, IEC 61439-6

import { z } from 'zod'

export const voltageDropInputSchema = z.object({
  standard: z.enum(['NEC', 'IEC']),
  phase: z.enum(['single-phase', 'three-phase']),
  systemVoltage: z.number().min(50, 'Voltage must be at least 50V').max(50000, 'Voltage must not exceed 50,000V'),
  current: z.number().positive('Current must be positive').max(10000, 'Current must not exceed 10,000A'),
  length: z.number().positive('Length must be positive').max(100000, 'Length exceeds practical maximum'),
  lengthUnit: z.enum(['meters', 'feet']),
  conductorType: z.enum(['cable', 'busway']),
  conductorMaterial: z.enum(['copper', 'aluminum']),
  powerFactor: z.number().min(0.1, 'Power factor must be at least 0.1').max(1, 'Power factor cannot exceed 1.0'),
  // Cable fields
  cableSizeMode: z.enum(['select', 'custom']),
  cableSizeMm2: z.number().nullable(),
  cableSizeAWG: z.string().nullable(),
  customResistance: z.number().nullable(),
  parallelRuns: z.number().int().min(1, 'At least 1 run').max(10, 'Maximum 10 parallel runs'),
  // Busway fields
  buswayRating: z.number().nullable(),
  buswayType: z.enum(['sandwich', 'non-sandwich']),
  customBuswayImpedance: z.number().nullable(),
  // Limits
  maxDropPercent: z.number().min(0.5).max(20, 'Max drop must not exceed 20%'),
  includeCableSuggestion: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.conductorType === 'cable') {
    if (data.cableSizeMode === 'select') {
      if (data.standard === 'IEC' && !data.cableSizeMm2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a cable size (mm²)',
          path: ['cableSizeMm2'],
        })
      }
      if (data.standard === 'NEC' && !data.cableSizeAWG) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a cable size (AWG)',
          path: ['cableSizeAWG'],
        })
      }
    } else {
      if (data.customResistance === null || data.customResistance <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid custom resistance value',
          path: ['customResistance'],
        })
      }
    }
  }

  if (data.conductorType === 'busway') {
    if (data.buswayRating === null && data.customBuswayImpedance === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a busway rating or enter custom impedance',
        path: ['buswayRating'],
      })
    }
  }
})

export type VoltageDropInputValidated = z.infer<typeof voltageDropInputSchema>

export function validateVoltageDropInput(input: unknown) {
  return voltageDropInputSchema.safeParse(input)
}
