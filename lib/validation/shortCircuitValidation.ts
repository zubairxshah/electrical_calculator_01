// Short Circuit Analysis Validation
// Standards: IEC 60909, IEEE 551

import { z } from 'zod'

export const shortCircuitInputSchema = z.object({
  standard: z.enum(['NEC', 'IEC']),
  phase: z.enum(['single-phase', 'three-phase']),
  systemVoltage: z.number().min(100, 'Voltage must be at least 100V').max(50000, 'Voltage must not exceed 50,000V'),
  frequency: z.number().refine(v => v === 50 || v === 60, 'Frequency must be 50 or 60 Hz'),
  grounding: z.enum(['solidly-grounded', 'resistance-grounded', 'ungrounded', 'reactance-grounded']),
  utilityFaultMVA: z.number().positive('Utility fault MVA must be positive').max(100000, 'Utility fault MVA too high'),
  utilityXRRatio: z.number().min(1, 'X/R ratio must be at least 1').max(50, 'X/R ratio must not exceed 50'),
  hasTransformer: z.boolean(),
  transformerKVA: z.number().min(0).max(100000),
  transformerImpedancePercent: z.number().min(0).max(20),
  transformerXRRatio: z.number().min(0.5).max(20),
  hasMotorContribution: z.boolean(),
  totalMotorHP: z.number().min(0).max(100000),
  motorType: z.enum(['induction', 'synchronous', 'mixed']),
  hasCableImpedance: z.boolean(),
  cableLength: z.number().min(0).max(10000),
  cableResistance: z.number().min(0).max(10),
  cableReactance: z.number().min(0).max(10),
  conductorsPerPhase: z.number().int().min(1).max(10),
  faultTypes: z.array(z.enum(['three-phase', 'single-line-to-ground', 'line-to-line', 'double-line-to-ground'])).min(1, 'Select at least one fault type'),
})

export type ShortCircuitInputValidated = z.infer<typeof shortCircuitInputSchema>

export function validateShortCircuitInput(input: unknown) {
  return shortCircuitInputSchema.safeParse(input)
}
