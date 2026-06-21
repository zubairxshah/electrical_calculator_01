/**
 * Safety/standards assessment for battery results: warnings, verdict, and
 * plain-language recommendations. (Constitution Principle II; ADR-006.)
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import type { BatteryCalculatorInputs, BatteryWarning, SizingVerdict } from '@/lib/types'

/** Subset of derating results the assessment needs. */
export interface AssessmentContext {
  inputs: BatteryCalculatorInputs
  profile: BatteryTypeSpec
  /** discharge rate as a fraction (C-rate) */
  cRate: number
  /** temperature factor applied (1.0 == no derate) */
  tempFactorValue: number
  /** over-capacity from rounding strings (sizing mode), if any */
  overCapacityPct?: number
}

/** Safe continuous C-rate threshold by chemistry family. */
function safeContinuousCRate(profile: BatteryTypeSpec): number {
  return profile.category === 'Lithium-Ion' ? 1.0 : 0.25 // lead-acid/nickel ≈ C/4
}

export function buildWarnings(ctx: AssessmentContext): BatteryWarning[] {
  const { inputs, profile, cRate, tempFactorValue } = ctx
  const warnings: BatteryWarning[] = []
  const temp = inputs.temperature ?? 25

  // High discharge rate
  const safeRate = safeContinuousCRate(profile)
  if (cRate > safeRate) {
    warnings.push({
      type: 'over-c-rate',
      severity: 'warning',
      field: 'loadWatts',
      message: `Discharge rate C/${(1 / cRate).toFixed(1)} exceeds the safe continuous rate (~C/${(1 / safeRate).toFixed(0)}) for ${profile.name}.`,
      standardReference: 'IEEE 485-2020 §5.3',
      recommendation: 'Increase capacity or reduce load; capacity has been Peukert-derated for this rate.',
    })
  }

  // Temperature outside operating range (error) or below optimal (info via warning)
  if (temp < profile.temperature.operating.min || temp > profile.temperature.operating.max) {
    warnings.push({
      type: 'temperature-out-of-range',
      severity: 'error',
      field: 'temperature',
      message: `Operating temperature ${temp}°C is outside ${profile.name}'s rated range (${profile.temperature.operating.min}…${profile.temperature.operating.max}°C).`,
      standardReference: 'IEEE 485-2020 §6',
      recommendation: 'Provide temperature control or select a chemistry rated for this environment.',
    })
  } else if (tempFactorValue < 1) {
    warnings.push({
      type: 'low-temperature',
      severity: 'warning',
      field: 'temperature',
      message: `Low temperature reduces available capacity to ${(tempFactorValue * 100).toFixed(0)}% of nominal.`,
      standardReference: 'IEEE 485-2020 §6',
      recommendation: 'Size at the lowest expected temperature (already applied).',
    })
  }

  // End of life
  const aging = inputs.agingFactor ?? 0.8
  if (aging < 0.8) {
    warnings.push({
      type: 'end-of-life',
      severity: 'warning',
      field: 'agingFactor',
      message: 'Aging factor below 0.8 indicates the bank is near or past end-of-life.',
      standardReference: 'IEEE 485-2020 §4.2',
      recommendation: 'Plan battery replacement; verify the design margin.',
    })
  }

  // DoD override above maximum (was clamped)
  if (inputs.dodOverride != null && inputs.dodOverride > profile.depthOfDischarge.maximum / 100) {
    warnings.push({
      type: 'dod-exceeds-max',
      severity: 'warning',
      field: 'dodOverride',
      message: `Requested DoD exceeds ${profile.name}'s maximum (${profile.depthOfDischarge.maximum}%); clamped to maximum.`,
      standardReference: 'IEEE 485-2020 §5',
      recommendation: 'Deep discharge beyond the recommended limit shortens cycle life.',
    })
  }

  return warnings
}

export function computeVerdict(warnings: BatteryWarning[]): SizingVerdict {
  if (warnings.some((w) => w.severity === 'error')) return 'fail'
  if (warnings.some((w) => w.severity === 'warning')) return 'marginal'
  return 'pass'
}

export function buildRecommendations(
  ctx: AssessmentContext,
  warnings: BatteryWarning[],
  verdict: SizingVerdict
): string[] {
  const recs: string[] = []
  if (verdict === 'pass') {
    recs.push(`Design is sound for ${ctx.profile.name} under the stated conditions.`)
  } else if (verdict === 'marginal') {
    recs.push('Design is workable but has cautions — review the warnings below.')
  } else {
    recs.push('Design is not acceptable as specified — resolve the flagged errors before proceeding.')
  }
  // Carry the actionable recommendation from each warning
  for (const w of warnings) {
    if (w.recommendation) recs.push(w.recommendation)
  }
  if (ctx.overCapacityPct != null && ctx.overCapacityPct > 15) {
    recs.push(
      `Bank rounds up to ${ctx.overCapacityPct.toFixed(0)}% over the required capacity — consider a unit size closer to the requirement.`
    )
  }
  return recs
}
