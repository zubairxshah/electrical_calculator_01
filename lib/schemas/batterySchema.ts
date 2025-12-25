/**
 * Battery Calculator Zod Schema
 *
 * Validation schema for battery calculator inputs
 * Used for form validation and type safety
 */

import { z } from 'zod'

/**
 * Battery chemistry types
 */
export const BatteryChemistrySchema = z.enum([
  'VRLA-AGM',
  'VRLA-Gel',
  'FLA',
  'LiFePO4',
  'Li-ion',
  'NiCd',
])

/**
 * Battery calculator input schema
 */
export const BatteryInputSchema = z.object({
  voltage: z
    .number()
    .min(1, 'Voltage must be at least 1V')
    .max(2000, 'Voltage must not exceed 2000V'),

  ampHours: z
    .number()
    .min(1, 'Capacity must be at least 1Ah')
    .max(10000, 'Capacity must not exceed 10000Ah'),

  loadWatts: z
    .number()
    .min(1, 'Load must be at least 1W')
    .max(1000000, 'Load must not exceed 1000000W'),

  efficiency: z
    .number()
    .min(0.1, 'Efficiency must be at least 0.1 (10%)')
    .max(1.0, 'Efficiency cannot exceed 1.0 (100%)'),

  agingFactor: z
    .number()
    .min(0.5, 'Aging factor must be at least 0.5')
    .max(1.0, 'Aging factor cannot exceed 1.0'),

  chemistry: BatteryChemistrySchema,

  temperature: z
    .number()
    .min(-20, 'Temperature must be at least -20°C')
    .max(60, 'Temperature must not exceed 60°C')
    .optional(),

  minVoltage: z
    .number()
    .min(0.1, 'Minimum voltage must be at least 0.1V')
    .optional(),
})

export type BatteryInputSchemaType = z.infer<typeof BatteryInputSchema>
