import { z } from 'zod'

const standardSchema = z.enum(['NEC', 'IEC'])
const systemTypeSchema = z.enum(['single-phase-ac', 'three-phase-ac'])
const connectionTypeSchema = z.enum(['star', 'delta'])
const correctionTypeSchema = z.enum(['fixed', 'automatic', 'semi-automatic'])
const loadProfileSchema = z.enum(['constant', 'variable', 'cyclic'])

const voltageSchema = z.number().positive('Voltage must be positive').min(100, 'Voltage must be at least 100V').max(35000, 'Voltage must be 35kV or less')
const frequencySchema = z.number().refine(v => v === 50 || v === 60, 'Frequency must be 50 or 60 Hz')
const activePowerSchema = z.number().positive('Active power must be positive').max(50000, 'Active power must be 50MW or less')
const powerFactorSchema = z.number().min(0.1, 'Power factor must be at least 0.1').max(0.99, 'Current power factor must be less than 1.0')
const targetPowerFactorSchema = z.number().min(0.85, 'Target power factor must be at least 0.85').max(1.0, 'Target power factor cannot exceed 1.0')
const harmonicDistortionSchema = z.number().min(0, 'THD cannot be negative').max(50, 'THD cannot exceed 50%')

export const pfcInputSchema = z.object({
  standard: standardSchema,
  systemType: systemTypeSchema,
  voltage: voltageSchema,
  frequency: frequencySchema,
  activePower: activePowerSchema,
  currentPowerFactor: powerFactorSchema,
  targetPowerFactor: targetPowerFactorSchema,
  connectionType: connectionTypeSchema,
  correctionType: correctionTypeSchema,
  loadProfile: loadProfileSchema,
  harmonicDistortion: harmonicDistortionSchema,
}).refine(
  data => data.targetPowerFactor > data.currentPowerFactor,
  { message: 'Target power factor must be greater than current power factor', path: ['targetPowerFactor'] }
)

export function validatePFCInput(input: unknown) {
  return pfcInputSchema.safeParse(input)
}

// Domain-specific warnings
export interface PFCWarning {
  field: string
  message: string
}

function checkOverCorrection(targetPF: number): PFCWarning | null {
  if (targetPF > 0.98) {
    return { field: 'targetPowerFactor', message: 'Target PF above 0.98 may cause leading power factor during light load conditions. Consider 0.95-0.97.' }
  }
  return null
}

function checkHighHarmonics(thd: number): PFCWarning | null {
  if (thd > 10) {
    return { field: 'harmonicDistortion', message: `THD of ${thd}% is high. Detuned reactors recommended to avoid harmonic resonance.` }
  }
  return null
}

function checkLargeCorrectionGap(currentPF: number, targetPF: number): PFCWarning | null {
  if (targetPF - currentPF > 0.3) {
    return { field: 'currentPowerFactor', message: 'Large PF improvement gap. Automatic stepped correction is strongly recommended.' }
  }
  return null
}

function checkHighVoltage(voltage: number): PFCWarning | null {
  if (voltage > 1000) {
    return { field: 'voltage', message: 'Medium voltage system. Ensure capacitor bank rated for MV application with proper protection.' }
  }
  return null
}

export function validateWithWarnings(input: unknown) {
  const result = pfcInputSchema.safeParse(input)
  const warnings: PFCWarning[] = []

  if (result.success) {
    const d = result.data
    const checks = [
      checkOverCorrection(d.targetPowerFactor),
      checkHighHarmonics(d.harmonicDistortion),
      checkLargeCorrectionGap(d.currentPowerFactor, d.targetPowerFactor),
      checkHighVoltage(d.voltage),
    ]
    checks.forEach(w => { if (w) warnings.push(w) })
  }

  return { ...result, warnings }
}

// ── APFC panel design inputs (stages 2–4) ────────────────────────────────────

const stepOverrideSchema = z.object({
  contactorA: z.number().positive('Contactor rating must be positive').optional(),
  protectionA: z.number().positive('Protection rating must be positive').optional(),
  cableSize: z.string().min(1).optional(),
})

export const pfcDesignInputSchema = z.object({
  sequenceMode: z.enum(['auto', '1:1:1', '1:2:2', '1:2:4', '1:1:2:2', 'custom']),
  customStepsKVAR: z.array(
    z.number().positive('Step kVAR must be positive').max(1000, 'Step kVAR must be 1000 or less')
  ).max(12, 'At most 12 steps'),
  maxOutputs: z.union([z.literal(6), z.literal(8), z.literal(12)]),
  ctPrimaryA: z.number(),
  ctSecondaryA: z.union([z.literal(1), z.literal(5)]),
  minLoadVariationKVAR: z.number().positive('Minimum load variation must be positive').nullable(),
  detuning: z.union([z.literal('auto'), z.literal('none'), z.literal(5.67), z.literal(7), z.literal(14)]),
  thirdHarmonic: z.boolean(),
  protectionType: z.enum(['fuse', 'mccb']).nullable(),
  overrides: z.record(z.string(), stepOverrideSchema),
}).refine(
  d => d.sequenceMode !== 'custom' || d.customStepsKVAR.length >= 1,
  { message: 'Enter at least one custom step', path: ['customStepsKVAR'] }
)

export function validatePFCDesignInput(input: unknown) {
  return pfcDesignInputSchema.safeParse(input)
}
