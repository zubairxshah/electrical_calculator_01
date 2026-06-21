/**
 * Battery Calculator Zod Schema
 *
 * Validation schema for battery calculator inputs. The chemistry enum is the
 * canonical 9-value set from lib/standards/batteryTypes.ts (single source of
 * truth). Legacy IDs are mapped to canonical via a preprocess step so old
 * persisted/form values validate. (feature 011-battery-revamp, ADR-006.)
 */

import { z } from 'zod'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'

/**
 * Canonical battery chemistry types
 */
export const BatteryChemistrySchema = z.enum([
  'VRLA-AGM',
  'VRLA-GEL',
  'FLA',
  'Li-Ion-LFP',
  'Li-Ion-NMC',
  'Li-Ion-LTO',
  'NiCd',
  'NiFe',
  'Flow-Vanadium',
])

/** Chemistry with legacy-ID coercion (VRLA-Gel/LiFePO4/Li-ion → canonical). */
export const ChemistryWithCoercion = z.preprocess(
  (val) => (typeof val === 'string' ? toCanonicalChemistry(val) : val),
  BatteryChemistrySchema
)

export const BatteryModeSchema = z.enum(['runtime', 'sizing'])

/**
 * Battery calculator input schema (mode-aware).
 */
export const BatteryInputSchema = z
  .object({
    voltage: z.number().min(1, 'Voltage must be at least 1V').max(2000, 'Voltage must not exceed 2000V'),

    mode: BatteryModeSchema.default('runtime'),

    ampHours: z
      .number()
      .min(1, 'Capacity must be at least 1Ah')
      .max(10000, 'Capacity must not exceed 10000Ah')
      .optional(),

    targetBackupHours: z
      .number()
      .positive('Target backup time must be greater than 0')
      .max(240, 'Target backup time must not exceed 240h')
      .optional(),

    loadWatts: z
      .number()
      .min(1, 'Load must be at least 1W')
      .max(1000000, 'Load must not exceed 1000000W'),

    efficiency: z
      .number()
      .min(0.1, 'Efficiency must be at least 0.1 (10%)')
      .max(1.0, 'Efficiency cannot exceed 1.0 (100%)')
      .optional(),

    agingFactor: z
      .number()
      .min(0.5, 'Aging factor must be at least 0.5')
      .max(1.0, 'Aging factor cannot exceed 1.0')
      .optional(),

    chemistry: ChemistryWithCoercion,

    temperature: z
      .number()
      .min(-40, 'Temperature must be at least -40°C')
      .max(65, 'Temperature must not exceed 65°C')
      .optional(),

    dodOverride: z
      .number()
      .positive('Depth of discharge must be greater than 0')
      .max(1, 'Depth of discharge cannot exceed 1.0 (100%)')
      .optional(),

    cellBlockVoltage: z.number().positive('Cell/block voltage must be greater than 0').optional(),

    unitCapacityAh: z.number().positive('Unit capacity must be greater than 0').optional(),

    datasheetId: z.string().nullable().optional(),

    minVoltage: z.number().min(0.1, 'Minimum voltage must be at least 0.1V').optional(),
  })
  .superRefine((data, ctx) => {
    // Mode-conditional required fields (ampHours XOR targetBackupHours).
    if (data.mode === 'runtime' && data.ampHours == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ampHours'],
        message: 'Installed capacity (Ah) is required in runtime mode.',
      })
    }
    if (data.mode === 'sizing' && data.targetBackupHours == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetBackupHours'],
        message: 'Target backup time (h) is required in sizing mode.',
      })
    }
  })

export type BatteryInputSchemaType = z.infer<typeof BatteryInputSchema>
