// Zod validation for Motor Starting Analysis inputs.

import { z } from 'zod'

export const motorSchema = z
  .object({
    ratedPower: z.number().positive('Rated power must be > 0'),
    powerUnit: z.enum(['HP', 'kW']),
    ratedVoltage: z.number().positive('Rated voltage must be > 0'),
    ratedCurrent: z.number().positive('Rated current (FLA) must be > 0'),
    poles: z.number().int().min(2).max(12),
    ratedSpeed: z.number().positive().optional(),
    efficiency: z.number().min(0.01).max(1, 'Efficiency must be 0–1'),
    powerFactor: z.number().min(0.01).max(1, 'Power factor must be 0–1'),
    serviceFactor: z.number().min(1).max(2),
    designClass: z.enum(['A', 'B', 'C', 'D', 'N', 'H']),
    codeLetter: z
      .enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V'])
      .optional(),
    lockedRotorAmps: z.number().positive().optional(),
    lockedRotorMultiplier: z.number().positive().optional(),
    startingTorquePerRated: z.number().positive().optional(),
    breakdownTorquePerRated: z.number().positive().optional(),
    stallTimeHotSec: z.number().positive().optional(),
    stallTimeColdSec: z.number().positive().optional(),
  })
  .refine(
    (m) =>
      m.lockedRotorAmps !== undefined ||
      m.lockedRotorMultiplier !== undefined ||
      m.codeLetter !== undefined,
    { message: 'Provide one of: codeLetter, lockedRotorAmps, or lockedRotorMultiplier' },
  )

export const loadSchema = z.object({
  torqueProfile: z.enum(['constant', 'quadratic_fan_pump', 'linear']),
  breakawayTorquePerRated: z.number().min(0).max(2),
  inertia: z.number().min(0),
  inertiaUnit: z.enum(['lb_ft2', 'kg_m2']),
})

export const utilitySchema = z.object({
  primaryVoltage: z.number().positive(),
  shortCircuitMva: z.number().positive().optional(),
  shortCircuitAmps: z.number().positive().optional(),
  xOverR: z.number().min(0),
  isInfiniteBus: z.boolean(),
})

export const transformerSchema = z.object({
  ratedKva: z.number().positive(),
  primaryVoltageKv: z.number().positive(),
  secondaryVoltageV: z.number().positive(),
  percentZ: z.number().min(0.5).max(20),
  xOverR: z.number().min(0),
})

export const cableSchema = z.object({
  sizeId: z.string().min(1),
  material: z.enum(['Cu', 'Al']),
  lengthMeters: z.number().min(0),
  parallelRuns: z.number().int().min(1),
  conduitType: z.enum(['PVC', 'Steel', 'Aluminum']),
})

export const sourceChainSchema = z.object({
  utility: utilitySchema,
  transformer: transformerSchema,
  cable: cableSchema,
  pccLocation: z.enum(['transformer_secondary', 'motor_terminals']),
})

const dolConfigSchema = z.object({ method: z.literal('DOL') })
const starDeltaConfigSchema = z.object({
  method: z.literal('STAR_DELTA'),
  starDeltaTransition: z.enum(['open', 'closed']),
})
const autotransformerConfigSchema = z.object({
  method: z.literal('AUTOTRANSFORMER'),
  autotransformerTap: z.union([z.literal(0.5), z.literal(0.65), z.literal(0.8)]),
})
const softStarterConfigSchema = z.object({
  method: z.literal('SOFT_STARTER'),
  softStarterRampSec: z.number().min(0.5).max(60),
  softStarterInitialVoltagePct: z.number().min(10).max(80),
  softStarterCurrentLimitPctFla: z.number().min(100).max(700),
})
const vfdConfigSchema = z.object({
  method: z.literal('VFD'),
  vfdHasBypass: z.boolean(),
})

export const methodConfigSchema = z.discriminatedUnion('method', [
  dolConfigSchema,
  starDeltaConfigSchema,
  autotransformerConfigSchema,
  softStarterConfigSchema,
  vfdConfigSchema,
])

export const motorStartingInputSchema = z.object({
  standard: z.enum(['NEC', 'IEC']),
  motor: motorSchema,
  load: loadSchema,
  sourceChain: sourceChainSchema,
  methodConfigs: z.array(methodConfigSchema).length(5, 'methodConfigs must have exactly 5 entries'),
  voltageDipThresholdPct: z.number().min(0).max(100).optional(),
  voltageDipScenario: z.enum(['steady_state_common', 'transient_motor_start', 'sensitive_loads']),
  projectName: z.string().optional(),
  projectRef: z.string().optional(),
  createdAt: z.string(),
})

export type MotorStartingInputParsed = z.infer<typeof motorStartingInputSchema>
