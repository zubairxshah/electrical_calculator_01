// Transformer Sizing Validation Schemas
// Standards: IEC 60076, IEEE C57, NEC 450

import { z } from 'zod'

export const transformerInputSchema = z.object({
  standard: z.enum(['NEC', 'IEC']),
  phase: z.enum(['single-phase', 'three-phase']),
  loadKW: z.number().positive('Load must be greater than zero').max(100000, 'Load must not exceed 100,000 kW'),
  loadPowerFactor: z.number().min(0.5, 'Power factor must be at least 0.5').max(1.0, 'Power factor must not exceed 1.0'),
  primaryVoltage: z.number().min(100, 'Primary voltage must be at least 100V').max(50000, 'Primary voltage must not exceed 50,000V'),
  secondaryVoltage: z.number().min(100, 'Secondary voltage must be at least 100V').max(1000, 'Secondary voltage must not exceed 1,000V'),
  transformerType: z.enum(['dry-type', 'oil-filled', 'cast-resin']),
  coolingClass: z.enum(['AA', 'AN', 'AF', 'ONAN', 'ONAF', 'OFAF', 'ODAF']),
  vectorGroup: z.enum(['Dyn11', 'Dyn1', 'Dyn5', 'Yyn0', 'Dd0', 'Yd1', 'Yd11', 'Yz1', 'Yz11']),
  tapPosition: z.enum(['OLTC', 'off-load', 'none']),
  tapRange: z.number().min(0, 'Tap range must be non-negative').max(20, 'Tap range must not exceed 20%'),
  loadProfile: z.enum(['constant', 'industrial', 'commercial', 'residential']),
  demandFactor: z.number().min(0.3, 'Demand factor must be at least 0.3').max(1.0, 'Demand factor must not exceed 1.0'),
  futureGrowth: z.number().min(1.0, 'Growth factor must be at least 1.0').max(2.0, 'Growth factor must not exceed 2.0'),
  impedancePercent: z.number().min(1, 'Impedance must be at least 1%').max(15, 'Impedance must not exceed 15%').optional(),
})

export const transformerEnvironmentSchema = z.object({
  ambientTemperature: z.number().min(-40, 'Temperature must be at least -40°C').max(70, 'Temperature must not exceed 70°C'),
  altitude: z.number().min(0, 'Altitude must be non-negative').max(5000, 'Altitude must not exceed 5,000m'),
  installationLocation: z.enum(['indoor', 'outdoor', 'underground-vault']),
})

export type TransformerInputValidated = z.infer<typeof transformerInputSchema>
export type TransformerEnvironmentValidated = z.infer<typeof transformerEnvironmentSchema>

export function validateTransformerInput(input: unknown) {
  return transformerInputSchema.safeParse(input)
}

export function validateTransformerEnvironment(env: unknown) {
  return transformerEnvironmentSchema.safeParse(env)
}

export interface TransformerValidationWarning {
  field: string
  message: string
}

export function getTransformerWarnings(input: TransformerInputValidated): TransformerValidationWarning[] {
  const warnings: TransformerValidationWarning[] = []

  if (input.loadPowerFactor < 0.7) {
    warnings.push({ field: 'loadPowerFactor', message: 'Very low power factor. Consider power factor correction before sizing transformer.' })
  }

  if (input.demandFactor < 0.5) {
    warnings.push({ field: 'demandFactor', message: 'Low demand factor. Verify load diversity assumptions.' })
  }

  if (input.futureGrowth > 1.3) {
    warnings.push({ field: 'futureGrowth', message: 'High growth factor may lead to oversized transformer with poor efficiency at initial load.' })
  }

  if (input.primaryVoltage <= input.secondaryVoltage) {
    warnings.push({ field: 'primaryVoltage', message: 'Primary voltage is not higher than secondary. Verify this is a step-up transformer.' })
  }

  // Cooling class vs type mismatch
  const oilCooling = ['ONAN', 'ONAF', 'OFAF', 'ODAF']
  const dryCooling = ['AA', 'AN', 'AF']
  if (input.transformerType === 'oil-filled' && dryCooling.includes(input.coolingClass)) {
    warnings.push({ field: 'coolingClass', message: 'Dry-type cooling class selected for oil-filled transformer.' })
  }
  if (input.transformerType !== 'oil-filled' && oilCooling.includes(input.coolingClass)) {
    warnings.push({ field: 'coolingClass', message: 'Oil cooling class selected for dry-type/cast-resin transformer.' })
  }

  return warnings
}
