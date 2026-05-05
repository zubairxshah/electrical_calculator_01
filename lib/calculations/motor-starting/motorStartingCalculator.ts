// Top-level orchestrator for Motor Starting Analysis.
// Validates input, computes Thevenin source impedance, runs the 5 method modules,
// builds the comparison, and returns the full result.

import type {
  MethodConfig,
  MethodResult,
  MotorStartingInput,
  MotorStartingResult,
} from '@/types/motor-starting'
import { motorStartingInputSchema } from '@/lib/validation/motorStartingValidation'
import { buildComparison } from './comparison'
import { analyzeAutotransformer } from './methods/autotransformer'
import { analyzeDol } from './methods/dol'
import { analyzeSoftStarter } from './methods/softStarter'
import { analyzeStarDelta } from './methods/starDelta'
import { analyzeVfd } from './methods/vfd'
import { getIeee1668Threshold, getThermalDefaultByHp } from './motorStartingData'
import { computeSourceImpedance } from './sourceImpedance'

export const MOTOR_STARTING_VERSION = '1.0.0'

export function analyzeMotorStarting(input: MotorStartingInput): MotorStartingResult {
  // Throws ZodError on validation failure (caught by the UI).
  motorStartingInputSchema.parse(input)

  const sourceImpedance = computeSourceImpedance(input.sourceChain)

  // Up-to-PCC subset for PCC dip calc (utility + transformer; excludes cable when PCC is xfmr secondary)
  const thevenZUpToPccPu =
    input.sourceChain.pccLocation === 'transformer_secondary'
      ? {
          r: sourceImpedance.zUtilityPu.r + sourceImpedance.zTransformerPu.r,
          x: sourceImpedance.zUtilityPu.x + sourceImpedance.zTransformerPu.x,
        }
      : sourceImpedance.zTotalPu

  // Resolve dip threshold
  const threshold =
    input.voltageDipThresholdPct ??
    getIeee1668Threshold(input.voltageDipScenario).dipPercentMax

  // Resolve thermal defaults from motor HP (convert kW → HP if needed)
  const hp =
    input.motor.powerUnit === 'HP' ? input.motor.ratedPower : input.motor.ratedPower / 0.7457
  const thermalDefaults = getThermalDefaultByHp(hp)

  const baseArgs = {
    motor: input.motor,
    load: input.load,
    thevenZPu: sourceImpedance.zTotalPu,
    thevenZUpToPccPu,
    baseKva: sourceImpedance.baseKva,
    baseVoltageV: sourceImpedance.baseVoltageV,
    voltageDipThresholdPct: threshold,
    thermalDefaults,
  }

  const results: MethodResult[] = input.methodConfigs.map((cfg) => analyzeMethod(cfg, baseArgs))

  const comparison = buildComparison({
    methods: results,
    thresholdAppliedPct: threshold,
    thresholdScenario: getIeee1668Threshold(input.voltageDipScenario).label,
  })

  return {
    input,
    sourceImpedance,
    comparison,
    computedAt: new Date().toISOString(),
    version: MOTOR_STARTING_VERSION,
  }
}

function analyzeMethod(
  cfg: MethodConfig,
  baseArgs: Parameters<typeof analyzeDol>[0] extends infer A
    ? A extends { config: unknown }
      ? Omit<A, 'config'>
      : never
    : never,
): MethodResult {
  switch (cfg.method) {
    case 'DOL':
      return analyzeDol({ ...baseArgs, config: cfg })
    case 'STAR_DELTA':
      return analyzeStarDelta({ ...baseArgs, config: cfg })
    case 'AUTOTRANSFORMER':
      return analyzeAutotransformer({ ...baseArgs, config: cfg })
    case 'SOFT_STARTER':
      return analyzeSoftStarter({ ...baseArgs, config: cfg })
    case 'VFD':
      return analyzeVfd({ ...baseArgs, config: cfg })
    default: {
      // Should never reach here at runtime due to discriminated union.
      const _exhaustive: never = cfg
      throw new Error(`Method config mismatch: ${(_exhaustive as MethodConfig).method}`)
    }
  }
}
