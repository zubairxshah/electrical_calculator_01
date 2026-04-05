// Conduit Fill Calculator Validation
// Standards: NEC 2020 Chapter 9

import { z } from 'zod'

export const conduitFillInputSchema = z.object({
  conduitType: z.enum(['EMT', 'RMC', 'IMC', 'PVC40', 'PVC80', 'FMC', 'LFMC']),
  tradeSize: z.string().min(1, 'Select a trade size'),
  conductors: z.array(z.object({
    id: z.string(),
    wireSize: z.string().min(1, 'Select a wire size'),
    insulationType: z.enum(['THHN', 'THWN', 'THW', 'XHHW', 'XHHW2', 'RHH_RHW', 'RHW2', 'USE2', 'BARE']),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity must not exceed 100'),
    isCompact: z.boolean(),
    areaSqIn: z.number().min(0),
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
