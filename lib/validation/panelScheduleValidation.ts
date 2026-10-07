/**
 * Panel schedule input validation (spec FR-025): Zod field rules + placement rules.
 */
import { z } from 'zod'
import type { Circuit, Panel } from '@/types/panel-schedule'
import { getSystem } from '@/lib/calculations/panel-schedule/system'
import { validatePlacement } from '@/lib/calculations/panel-schedule/placement'

export interface PanelIssue {
  path: string
  message: string
  circuitId?: string
}

export const circuitSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['load', 'spare', 'space']),
    description: z.string().max(60, 'Description must be 60 characters or fewer'),
    category: z.enum([
      'lighting', 'receptacle', 'motor', 'hvac-heating', 'hvac-cooling',
      'kitchen', 'water-heater', 'ev-charger', 'other-continuous', 'other-noncontinuous',
    ]),
    loadValue: z.number().refine(Number.isFinite, 'Load must be a number'),
    loadUnit: z.enum(['VA', 'W', 'kW', 'kVA', 'HP']),
    powerFactor: z.number().min(0.1, 'Power factor must be 0.1–1.0').max(1, 'Power factor must be 0.1–1.0'),
    efficiency: z.number().min(0.5, 'Efficiency must be 0.5–1.0').max(1, 'Efficiency must be 0.5–1.0'),
    continuous: z.boolean(),
    poles: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    breakerA: z.number().positive('Breaker rating must be positive').max(6000).nullable(),
    startSpace: z.number().int('Space must be a whole number').min(1).nullable(),
    locked: z.boolean(),
    notes: z.string(),
  })
  .superRefine((c, ctx) => {
    if (c.kind === 'load' && !(c.loadValue > 0)) {
      ctx.addIssue({ code: 'custom', path: ['loadValue'], message: 'Load must be greater than zero' })
    }
    if (c.kind !== 'space' && c.breakerA === null) {
      ctx.addIssue({ code: 'custom', path: ['breakerA'], message: 'Breaker rating is required' })
    }
    if (c.loadUnit === 'HP' && c.category !== 'motor') {
      ctx.addIssue({ code: 'custom', path: ['loadUnit'], message: 'HP can only be used for motor loads' })
    }
  })

export const panelSchema = z
  .object({
    name: z.string().max(40, 'Panel name must be 40 characters or fewer'),
    busRatingA: z.number().min(1, 'Bus rating must be at least 1 A').max(6000, 'Bus rating must be at most 6000 A'),
    mainType: z.enum(['main-breaker', 'mlo']),
    mainRatingA: z.number().positive('Main rating must be positive').max(6000).nullable(),
    spaces: z
      .number()
      .int('Spaces must be a whole number')
      .min(2, 'Panel must have 2–84 spaces')
      .max(84, 'Panel must have 2–84 spaces')
      .refine((n) => n % 2 === 0, 'Number of spaces must be even (two-column panel)'),
    imbalanceTargetPct: z.number().min(1, 'Imbalance target must be 1–50 %').max(50, 'Imbalance target must be 1–50 %'),
    sccrKA: z.number().positive().nullable(),
  })
  .passthrough()
  .superRefine((p, ctx) => {
    if (p.mainType === 'main-breaker' && p.mainRatingA === null) {
      ctx.addIssue({ code: 'custom', path: ['mainRatingA'], message: 'Main breaker rating is required' })
    }
  })

function zodIssues(result: z.ZodSafeParseResult<unknown>, prefix = '', circuitId?: string): PanelIssue[] {
  if (result.success) return []
  return result.error.issues.map((i) => ({
    path: prefix + i.path.join('.'),
    message: i.message,
    ...(circuitId ? { circuitId } : {}),
  }))
}

export function validateCircuit(c: Circuit): PanelIssue[] {
  return zodIssues(circuitSchema.safeParse(c), '', c.id)
}

export function validatePanel(panel: Panel): { errors: PanelIssue[]; warnings: PanelIssue[] } {
  const errors: PanelIssue[] = [...zodIssues(panelSchema.safeParse(panel))]
  const warnings: PanelIssue[] = []

  if (panel.systemType === 'custom') {
    const cs = panel.customSystem
    if (!cs || !(cs.vLL > 0)) {
      errors.push({ path: 'customSystem.vLL', message: 'Enter the line-to-line voltage' })
    } else if (cs.wires === 4 || (cs.phases === 1 && cs.wires === 3)) {
      if (!(cs.vLN && cs.vLN > 0)) {
        errors.push({ path: 'customSystem.vLN', message: 'Enter the line-to-neutral voltage' })
      } else {
        const expected = cs.phases === 3 ? cs.vLN * Math.sqrt(3) : cs.vLN * 2
        if (Math.abs(cs.vLL - expected) / expected > 0.02) {
          errors.push({
            path: 'customSystem.vLL',
            message: cs.phases === 3
              ? `For a 3φ 4W wye, V_LL should be √3 × V_LN ≈ ${expected.toFixed(0)} V`
              : `For a 1φ 3W system, V_LL should be 2 × V_LN = ${expected.toFixed(0)} V`,
          })
        }
      }
    }
  }

  panel.circuits.forEach((c, i) => errors.push(...zodIssues(circuitSchema.safeParse(c), `circuits.${i}.`, c.id)))

  if (!errors.some((e) => e.path.startsWith('customSystem'))) {
    const system = getSystem(panel)
    for (const issue of validatePlacement(panel.circuits, panel.spaces, system)) {
      errors.push({ path: 'placement', message: issue.message, circuitId: issue.circuitId })
    }
  }
  for (const c of panel.circuits) {
    if (c.startSpace === null) {
      warnings.push({ path: 'placement', message: `${c.description || c.id} has no space assigned (panel full?)`, circuitId: c.id })
    }
  }
  if (panel.mainType === 'main-breaker' && panel.mainRatingA !== null && panel.mainRatingA > panel.busRatingA) {
    warnings.push({ path: 'mainRatingA', message: 'Main rating is larger than the bus rating (NEC 408.36)' })
  }

  return { errors, warnings }
}
