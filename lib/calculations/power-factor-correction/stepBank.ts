// APFC step bank design — sequences, switching levels, controller C/k
// Standards: IEC 61921 (PFC assemblies), IEEE 18, NEC 460
// Research: specs/014-pfi-panel-design/research.md R1–R5

import type {
  PFCInput,
  PFCCalculationResults,
  PFCDesignInput,
  PFCDesignWarning,
  PFCSequencePreset,
  PFCControllerOutputs,
  PFCStep,
  PFCStepBankDesign,
} from '@/types/power-factor-correction'
import { STANDARD_STEP_SIZES, selectStandardKVAR } from './capacitorData'
import { CONTROLLER_OUTPUTS, nextRating } from './panelRatings'

const MAX_STEPS = 12
const EPS = 1e-9

/** Ratio heads; the last ratio repeats until the target is reached */
export const SEQUENCE_RATIOS: Record<PFCSequencePreset, number[]> = {
  '1:1:1': [1],
  '1:2:2': [1, 2],
  '1:2:4': [1, 2, 4],
  '1:1:2:2': [1, 1, 2],
}

/** Tie-break order when presets are otherwise equal */
const PRESET_ORDER: PFCSequencePreset[] = ['1:2:4', '1:2:2', '1:1:2:2', '1:1:1']

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** R1: the bank is sized against the derated required kVAR */
export function designTargetKVAR(results: PFCCalculationResults): number {
  return results.deratingFactors?.adjustedKVAR ?? results.correctionSizing.requiredKVAR
}

/** u × ratios with the last ratio repeating until Σ ≥ target; null when more than maxSteps are needed */
export function buildSteps(u: number, ratios: number[], target: number, maxSteps: number): number[] | null {
  const steps: number[] = []
  let total = 0
  while (total < target - EPS) {
    if (steps.length >= maxSteps) return null
    const r = ratios[Math.min(steps.length, ratios.length - 1)]
    steps.push(u * r)
    total += u * r
  }
  return steps
}

interface Candidate {
  preset: PFCSequencePreset
  u: number
  steps: number[]
}

/** Smallest standard u for one preset that fits within maxSteps */
function smallestFit(preset: PFCSequencePreset, target: number, maxSteps: number): Candidate | null {
  for (const u of STANDARD_STEP_SIZES) {
    const steps = buildSteps(u, SEQUENCE_RATIOS[preset], target, maxSteps)
    if (steps) return { preset, u, steps }
  }
  return null
}

/**
 * R2 auto-recommendation: best resolution (smallest u), then overshoot within one step,
 * then fewest steps, then smallest overshoot, then preset order.
 */
export function recommendSequence(target: number, maxOutputs: PFCControllerOutputs): Candidate | null {
  const candidates = PRESET_ORDER
    .map(p => smallestFit(p, target, maxOutputs))
    .filter((c): c is Candidate => c !== null)
  if (candidates.length === 0) return null

  const over = (c: Candidate) => sum(c.steps) - target
  const withinStep = (c: Candidate) => (over(c) <= c.u + EPS ? 0 : 1)
  candidates.sort((a, b) =>
    a.u - b.u
    || withinStep(a) - withinStep(b)
    || a.steps.length - b.steps.length
    || over(a) - over(b)
    || PRESET_ORDER.indexOf(a.preset) - PRESET_ORDER.indexOf(b.preset)
  )
  return candidates[0]
}

/** R3: number of distinct non-zero kVAR levels reachable by switching subsets of steps */
export function switchingLevels(steps: number[]): number {
  let levels = new Set<number>([0])
  for (const s of steps) {
    const next = new Set(levels)
    for (const l of levels) next.add(Math.round((l + s) * 1e6) / 1e6)
    levels = next
  }
  return levels.size - 1
}

/** R4: C/k = Q1 / (√3·U·k) three-phase, Q1 / (U·k) single-phase; amperes at the CT secondary */
export function calculateCk(q1KVAR: number, voltage: number, ctRatio: number, threePhase: boolean): number {
  const q1 = q1KVAR * 1000
  return threePhase ? q1 / (Math.sqrt(3) * voltage * ctRatio) : q1 / (voltage * ctRatio)
}

/** Fallback when no standard u fits: u rounded up to 5 kVAR so the whole sequence fits in 12 steps */
function fallbackSteps(preset: PFCSequencePreset, target: number): number[] {
  const ratios = SEQUENCE_RATIOS[preset]
  const ratioSum = sum(Array.from({ length: MAX_STEPS }, (_, i) => ratios[Math.min(i, ratios.length - 1)]))
  const u = Math.ceil(target / ratioSum / 5) * 5
  return buildSteps(u, ratios, target, MAX_STEPS) ?? []
}

function toSteps(values: number[], ratios: (number | null)[]): PFCStep[] {
  let cumulative = 0
  return values.map((v, i) => {
    cumulative += v
    return { index: i + 1, ratio: ratios[i] ?? null, effectiveKVAR: v, cumulativeKVAR: cumulative }
  })
}

function ratiosOf(values: number[]): number[] {
  const u = Math.min(...values)
  return values.map(v => Math.round((v / u) * 100) / 100)
}

export function designStepBank(
  input: PFCInput,
  results: PFCCalculationResults,
  design: PFCDesignInput
): PFCStepBankDesign {
  const target = designTargetKVAR(results)
  const warnings: PFCDesignWarning[] = []
  const fixed = input.correctionType === 'fixed'

  let values: number[] = []
  let preset: PFCSequencePreset | null = null
  let ratios: (number | null)[] = []

  if (fixed) {
    values = [selectStandardKVAR(target)]
    ratios = [null]
  } else if (design.sequenceMode === 'custom') {
    const custom = design.customStepsKVAR
    if (custom.length < 1 || custom.length > MAX_STEPS || custom.some(v => !(v > 0))) {
      warnings.push({
        code: 'INVALID_CUSTOM_STEPS', severity: 'error',
        message: 'Custom steps must be 1 to 12 positive kVAR values',
      })
    } else {
      values = [...custom]
      ratios = values.map(() => null)
    }
  } else {
    let chosen: Candidate | null
    if (design.sequenceMode === 'auto') {
      chosen = recommendSequence(target, design.maxOutputs)
    } else {
      chosen = smallestFit(design.sequenceMode, target, design.maxOutputs)
    }
    preset = chosen?.preset ?? (design.sequenceMode === 'auto' ? '1:1:1' : design.sequenceMode)
    if (chosen) {
      values = chosen.steps
    } else {
      values = fallbackSteps(preset, target)
      warnings.push({
        code: 'NO_STANDARD_STEP_FITS', severity: 'warning',
        message: `No standard smallest step reaches ${round(target, 2)} kVAR within ${design.maxOutputs} outputs — a ${values[0]} kVAR non-standard smallest step is used. Consider more outputs or several banks.`,
        reference: 'IEC 61921',
      })
    }
    ratios = values.length > 0 ? ratiosOf(values) : []
  }

  const steps = toSteps(values, ratios)
  const totalKVAR = sum(values)
  const resolutionKVAR = values.length > 0 ? Math.min(...values) : 0
  const overshootKVAR = totalKVAR - target

  let controller: PFCStepBankDesign['controller'] = null
  if (!fixed && values.length > 0) {
    const ctRatio = design.ctPrimaryA > 0 && design.ctSecondaryA > 0 ? design.ctPrimaryA / design.ctSecondaryA : 0
    const outputs = (nextRating(values.length, CONTROLLER_OUTPUTS) ?? 12) as PFCControllerOutputs
    const ck = ctRatio > 0
      ? calculateCk(resolutionKVAR, input.voltage, ctRatio, input.systemType === 'three-phase-ac')
      : null
    if (ck === null) {
      warnings.push({ code: 'CK_NEEDS_CT', severity: 'info', message: 'Enter the CT ratio to calculate the controller C/k setting' })
    }
    controller = { outputs, ck, ctRatio }

    const threshold = design.minLoadVariationKVAR ?? 0.1 * totalKVAR
    if (resolutionKVAR > threshold + EPS) {
      warnings.push({
        code: 'STEP_TOO_COARSE', severity: 'warning',
        message: `Smallest step ${round(resolutionKVAR, 2)} kVAR is larger than the ${design.minLoadVariationKVAR === null ? '10 % of bank' : 'minimum load variation'} threshold (${round(threshold, 2)} kVAR) — use a smaller first step for finer control.`,
        reference: 'IEC 61921',
      })
    }
    if (overshootKVAR > resolutionKVAR + EPS) {
      warnings.push({
        code: 'OVERSHOOT', severity: 'warning',
        message: `Bank total ${round(totalKVAR, 2)} kVAR exceeds the requirement by ${round(overshootKVAR, 2)} kVAR (more than one smallest step) — risk of leading power factor at light load.`,
        reference: 'IEEE 18',
      })
    }
  }

  if (values.length > 0 && totalKVAR < target - EPS) {
    warnings.push({
      code: 'UNDERSIZED_BANK', severity: 'warning',
      message: `Bank total ${round(totalKVAR, 2)} kVAR is below the required ${round(target, 2)} kVAR — the target power factor will not be reached.`,
    })
  }

  return {
    mode: fixed ? 'auto' : design.sequenceMode,
    preset,
    targetKVAR: target,
    steps,
    totalKVAR,
    overshootKVAR,
    resolutionKVAR,
    switchingLevels: switchingLevels(values),
    outputsUsed: fixed ? 0 : values.length,
    controller,
    warnings,
  }
}

function round(value: number, decimals: number): number {
  const f = Math.pow(10, decimals)
  return Math.round(value * f) / f
}
