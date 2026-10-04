// Arc Flash Calculator input validation — IEEE 1584-2018 model applicability ranges (research R7).
// Every message names the violated limit and its source clause (spec SC-004).

import { z } from 'zod'
import type { ArcFlashInput, FieldError } from '@/types/arc-flash'

const RANGE_CLAUSE = 'IEEE 1584-2018 (model range)'

const OPEN_AIR = ['VOA', 'HOA']

/** Model-range rules shared by the Zod schema and the calculator's defensive check. */
export function modelRangeErrors(input: ArcFlashInput): FieldError[] {
  const errors: FieldError[] = []
  const add = (field: string, code: string, message: string, clause = RANGE_CLAUSE) =>
    errors.push({ field, code, message, clause })
  const positive = (field: string, value: number, label: string) => {
    if (!Number.isFinite(value) || value <= 0) {
      add(field, 'POSITIVE', `${label} must be a number greater than 0`, 'Input validation')
      return false
    }
    return true
  }

  const v = input.voltageV
  const lv = v <= 600

  if (positive('voltageV', v, 'Voltage') && (v < 208 || v > 15000)) {
    add('voltageV', 'VOLTAGE_RANGE', `Voltage must be 208–15,000 V (${v} V entered)`)
  }

  if (positive('boltedFaultKA', input.boltedFaultKA, 'Bolted fault current')) {
    const [min, max] = lv ? [0.5, 106] : [0.2, 65]
    if (input.boltedFaultKA < min || input.boltedFaultKA > max) {
      add(
        'boltedFaultKA',
        'IBF_RANGE',
        lv
          ? `For 208–600 V, bolted fault current must be 0.5–106 kA`
          : `For 601 V–15 kV, bolted fault current must be 0.2–65 kA`
      )
    }
  }

  if (positive('gapMm', input.gapMm, 'Conductor gap')) {
    const [min, max] = lv ? [6.35, 76.2] : [19.05, 254]
    if (input.gapMm < min || input.gapMm > max) {
      add(
        'gapMm',
        'GAP_RANGE',
        lv ? `For 208–600 V, gap must be 6.35–76.2 mm` : `For 601 V–15 kV, gap must be 19.05–254 mm`
      )
    }
  }

  if (positive('workingDistanceMm', input.workingDistanceMm, 'Working distance') && input.workingDistanceMm < 305) {
    add('workingDistanceMm', 'WD_MIN', 'Working distance must be at least 305 mm (12 in)')
  }

  positive('arcingTimeNominalMs', input.arcingTimeNominalMs, 'Arcing time at nominal current')
  positive('arcingTimeReducedMs', input.arcingTimeReducedMs, 'Arcing time at reduced current')

  if (!OPEN_AIR.includes(input.electrodeConfig)) {
    if (!input.enclosure) {
      add('enclosure', 'ENCLOSURE_REQUIRED', 'Enclosure dimensions are required for VCB, VCBB and HCB', 'IEEE 1584-2018 Eqs. 11–15')
    } else {
      positive('enclosure.heightMm', input.enclosure.heightMm, 'Enclosure height')
      positive('enclosure.widthMm', input.enclosure.widthMm, 'Enclosure width')
      positive('enclosure.depthMm', input.enclosure.depthMm, 'Enclosure depth')
    }
  }

  if (input.ppeMethod === 'table' && !input.tableRowId) {
    add('tableRowId', 'TABLE_ROW_REQUIRED', 'Select an equipment type for the table method', 'NFPA 70E-2024 Table 130.7(C)(15)(a)')
  }

  return errors
}

const enclosureSchema = z.object({
  heightMm: z.number(),
  widthMm: z.number(),
  depthMm: z.number(),
})

export const arcFlashInputSchema = z
  .object({
    equipmentId: z.string().max(60),
    projectName: z.string().max(100),
    voltageV: z.number(),
    frequencyHz: z.union([z.literal(50), z.literal(60)]),
    boltedFaultKA: z.number(),
    electrodeConfig: z.enum(['VCB', 'VCBB', 'HCB', 'VOA', 'HOA']),
    gapMm: z.number(),
    workingDistanceMm: z.number(),
    enclosure: enclosureSchema.nullable(),
    arcingTimeNominalMs: z.number(),
    arcingTimeReducedMs: z.number(),
    sameTimeForBoth: z.boolean(),
    applyTwoSecondCap: z.boolean(),
    equipmentClass: z.string(),
    ppeMethod: z.enum(['incident-energy', 'table']),
    tableRowId: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    for (const e of modelRangeErrors(value as ArcFlashInput)) {
      ctx.addIssue({ code: 'custom', path: e.field.split('.'), message: e.message, params: { code: e.code, clause: e.clause } })
    }
  })

export type ValidationResult =
  | { success: true; data: ArcFlashInput }
  | { success: false; errors: FieldError[] }

export function validateArcFlashInput(input: unknown): ValidationResult {
  const parsed = arcFlashInputSchema.safeParse(input)
  if (parsed.success) return { success: true, data: parsed.data as ArcFlashInput }
  return {
    success: false,
    errors: parsed.error.issues.map((issue) => {
      const params = (issue as { params?: { code?: string; clause?: string } }).params
      return {
        field: issue.path.join('.'),
        code: params?.code ?? 'INVALID',
        message: issue.message,
        clause: params?.clause ?? 'Input validation',
      }
    }),
  }
}
