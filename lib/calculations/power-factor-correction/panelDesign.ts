// APFC panel design orchestrator: stage 1 results → step bank → detuning → switchgear
// Pure and synchronous; never throws (invalid design input becomes error warnings).

import type {
  PFCInput,
  PFCCalculationResults,
  PFCDesignInput,
  PFCDesignWarning,
  PFCPanelDesign,
} from '@/types/power-factor-correction'
import { designStepBank } from './stepBank'
import { designDetuning } from './detuning'
import { designSwitchgear } from './switchgear'

/** Panel design covers LV APFC panels only (research R9) */
export const MAX_LV_VOLTAGE = 1000

export const DEFAULT_DESIGN: PFCDesignInput = {
  sequenceMode: 'auto',
  customStepsKVAR: [],
  maxOutputs: 12,
  ctPrimaryA: 1000,
  ctSecondaryA: 5,
  minLoadVariationKVAR: null,
  detuning: 'auto',
  thirdHarmonic: false,
  protectionType: null,
  overrides: {},
}

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const

function dedupeAndSort(warnings: PFCDesignWarning[]): PFCDesignWarning[] {
  const seen = new Set<string>()
  const out: PFCDesignWarning[] = []
  for (const w of warnings) {
    const key = `${w.code}|${w.stepIndex ?? ''}|${w.message}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(w)
  }
  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

export function designPanel(
  input: PFCInput,
  results: PFCCalculationResults | null,
  design: PFCDesignInput
): PFCPanelDesign {
  if (!results) {
    return { available: false, stepBank: null, detuning: null, switchgear: null, warnings: [] }
  }
  if (input.voltage > MAX_LV_VOLTAGE) {
    return {
      available: false, stepBank: null, detuning: null, switchgear: null,
      warnings: [{
        code: 'MV_NOT_SUPPORTED', severity: 'info',
        message: 'APFC panel design (step bank, detuning, switchgear) covers LV systems up to 1,000 V. Stage 1 sizing still applies to MV banks.',
      }],
    }
  }

  const stepBank = designStepBank(input, results, design)
  const detuning = designDetuning(input, stepBank, design)
  const switchgear = designSwitchgear(input, detuning, design)

  const extra: PFCDesignWarning[] = []
  if (detuning.recommended !== null && detuning.applied === null) {
    extra.push({
      code: 'DETUNING_RECOMMENDED', severity: 'warning',
      message: `Detuned reactors (${detuning.recommended} %) are recommended for THD ${input.harmonicDistortion} %${design.thirdHarmonic ? ' with a significant 3rd harmonic' : ''} — plain capacitors risk harmonic resonance.`,
      reference: 'IEC 61921',
    })
  }

  return {
    available: true,
    stepBank,
    detuning,
    switchgear,
    warnings: dedupeAndSort([...stepBank.warnings, ...extra, ...switchgear.warnings]),
  }
}
