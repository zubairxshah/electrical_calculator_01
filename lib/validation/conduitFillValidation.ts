// Conduit Fill Calculator Validation
// Standards: NEC 2020 Chapter 9 + IEC 61386 / BS 7671

import { z } from 'zod'

export const conduitFillInputSchema = z.object({
  standard: z.enum(['NEC', 'IEC']).default('NEC'),
  conduitType: z.enum([
    // NEC
    'EMT', 'RMC', 'IMC', 'PVC40', 'PVC80', 'FMC', 'LFMC',
    // IEC
    'RIGID_PVC', 'RIGID_STEEL', 'FLEXIBLE_PVC', 'FLEXIBLE_METAL', 'CORRUGATED',
  ]),
  tradeSize: z.string().min(1, 'Select a trade size'),
  conductors: z.array(z.object({
    id: z.string(),
    wireSize: z.string().min(1, 'Select a wire size'),
    insulationType: z.enum([
      // NEC
      'THHN', 'THWN', 'THW', 'XHHW', 'XHHW2', 'RHH_RHW', 'RHW2', 'USE2', 'BARE',
      // IEC
      'PVC_V', 'PVC_V90', 'XLPE_X', 'EPR_R', 'LSF', 'SWA', 'BARE_IEC',
    ]),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity must not exceed 100'),
    isCompact: z.boolean(),
    areaSqIn: z.number().min(0),
    areaMm2: z.number().min(0).optional(),
  })).min(1, 'Add at least one conductor'),
  isNipple: z.boolean(),
  unitSystem: z.enum(['imperial', 'metric']),
  projectName: z.string(),
  projectRef: z.string(),
})

export type ConduitFillInputValidated = z.infer<typeof conduitFillInputSchema>

export function validateConduitFillInput(input: unknown) {
  return conduitFillInputSchema.safeParse(input)
}
