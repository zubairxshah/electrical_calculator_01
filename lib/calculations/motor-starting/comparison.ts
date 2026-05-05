// Aggregate the 5 method results, rank, and pick a recommendation.

import type {
  ComparisonResult,
  MethodResult,
  StartingMethodId,
} from '@/types/motor-starting'
import { COMPLEXITY_RANK, COST_RANK, METHOD_LABELS } from './motorStartingData'

export interface BuildComparisonParams {
  methods: MethodResult[]
  thresholdAppliedPct: number
  thresholdScenario: string
}

export function buildComparison(params: BuildComparisonParams): ComparisonResult {
  const { methods, thresholdAppliedPct, thresholdScenario } = params

  const survivors = methods.filter(
    (m) =>
      m.voltageDipPasses1668 &&
      m.torqueVerdict === 'sufficient' &&
      m.thermalVerdict !== 'damage_risk',
  )

  const ranked = [...survivors].sort((a, b) => {
    const costDiff = (COST_RANK[a.qualitativeCost] ?? 99) - (COST_RANK[b.qualitativeCost] ?? 99)
    if (costDiff !== 0) return costDiff
    return (
      (COMPLEXITY_RANK[a.qualitativeComplexity] ?? 99) -
      (COMPLEXITY_RANK[b.qualitativeComplexity] ?? 99)
    )
  })

  let recommendedMethod: StartingMethodId | 'none'
  let rationale: string
  if (ranked.length === 0) {
    recommendedMethod = 'none'
    const reasons = methods
      .map((m) => `${METHOD_LABELS[m.method]}: ${badgeToReason(m)}`)
      .join('; ')
    rationale = `No method passes all checks against the active thresholds. ${reasons}.`
  } else {
    const winner = ranked[0]
    recommendedMethod = winner.method
    // Annotate the winner's badge as 'recommended'
    winner.verdictBadge = 'recommended'
    const others = ranked
      .slice(1)
      .map((m) => METHOD_LABELS[m.method])
      .join(', ')
    rationale = others.length
      ? `${winner.methodLabel} is the lowest-cost method that passes voltage-dip, torque, and thermal checks. Other passing methods (ranked lower by cost/complexity): ${others}.`
      : `${winner.methodLabel} is the only method that passes voltage-dip, torque, and thermal checks at the active thresholds.`
  }

  return {
    methods,
    recommendedMethod,
    recommendationRationale: rationale,
    thresholdAppliedPct,
    thresholdScenario,
  }
}

function badgeToReason(m: MethodResult): string {
  switch (m.verdictBadge) {
    case 'excessive_dip': return `dip ${m.voltageDipAtPccPct.toFixed(1)}% exceeds threshold`
    case 'insufficient_torque': return 'starting torque below load break-away'
    case 'thermal_risk': return 'acceleration exceeds motor thermal limit'
    default: return m.verdictBadge
  }
}
