import { describe, it, expect } from 'vitest'
import { buildComparison } from '@/lib/calculations/motor-starting/comparison'
import type { MethodResult, StartingMethodId } from '@/types/motor-starting'

function methodResult(over: Partial<MethodResult>): MethodResult {
  return {
    method: 'DOL',
    methodLabel: 'Direct-On-Line',
    startingCurrentLineAmps: 100,
    startingCurrentMotorAmps: 100,
    startingCurrentPctFla: 600,
    startingTorquePctRated: 150,
    voltageAtMotorPu: 0.95,
    voltageDipAtPccPct: 5,
    voltageDipPasses1668: true,
    accelerationTimeSec: 2,
    thermalMarginRatio: 0.2,
    thermalVerdict: 'safe',
    torqueVerdict: 'sufficient',
    qualitativeCost: 'low',
    qualitativeComplexity: 'low',
    verdictBadge: 'acceptable',
    methodNotes: [],
    currentVsTime: [],
    ...over,
  }
}

describe('buildComparison', () => {
  it('passing methods sorted by cost asc, then complexity asc', () => {
    const results: MethodResult[] = [
      methodResult({ method: 'VFD', qualitativeCost: 'high', qualitativeComplexity: 'high' }),
      methodResult({ method: 'DOL', qualitativeCost: 'low', qualitativeComplexity: 'low' }),
      methodResult({ method: 'SOFT_STARTER', qualitativeCost: 'medium', qualitativeComplexity: 'medium' }),
      methodResult({ method: 'STAR_DELTA', qualitativeCost: 'low', qualitativeComplexity: 'medium' }),
      methodResult({ method: 'AUTOTRANSFORMER', qualitativeCost: 'medium', qualitativeComplexity: 'medium' }),
    ]
    const c = buildComparison({ methods: results, thresholdAppliedPct: 20, thresholdScenario: 'transient' })
    expect(c.recommendedMethod).toBe('DOL') // lowest cost & complexity
  })

  it('first survivor becomes recommendedMethod', () => {
    const results: MethodResult[] = [
      methodResult({ method: 'DOL', voltageDipPasses1668: false, verdictBadge: 'excessive_dip' }),
      methodResult({ method: 'VFD', qualitativeCost: 'high', qualitativeComplexity: 'high' }),
    ]
    const c = buildComparison({ methods: results, thresholdAppliedPct: 20, thresholdScenario: 'transient' })
    expect(c.recommendedMethod).toBe('VFD')
  })

  it('no survivors → recommendedMethod = "none"', () => {
    const results: MethodResult[] = [
      methodResult({ method: 'DOL', voltageDipPasses1668: false, verdictBadge: 'excessive_dip' }),
      methodResult({ method: 'STAR_DELTA', torqueVerdict: 'insufficient', verdictBadge: 'insufficient_torque' }),
    ]
    const c = buildComparison({ methods: results, thresholdAppliedPct: 20, thresholdScenario: 'transient' })
    expect(c.recommendedMethod).toBe('none')
    expect(c.recommendationRationale).toMatch(/no method/i)
  })

  it('rationale paragraph names the chosen method', () => {
    const results: MethodResult[] = [
      methodResult({ method: 'DOL' }),
      methodResult({ method: 'VFD', qualitativeCost: 'high', qualitativeComplexity: 'high' }),
    ]
    const c = buildComparison({ methods: results, thresholdAppliedPct: 20, thresholdScenario: 'transient' })
    expect(c.recommendationRationale).toMatch(/Direct-On-Line/i)
  })

  it('thermal damage_risk excludes a method', () => {
    const results: MethodResult[] = [
      methodResult({ method: 'DOL', thermalVerdict: 'damage_risk' }),
      methodResult({ method: 'VFD', qualitativeCost: 'high', qualitativeComplexity: 'high' }),
    ]
    const c = buildComparison({ methods: results, thresholdAppliedPct: 20, thresholdScenario: 'transient' })
    expect(c.recommendedMethod).toBe('VFD')
  })
})
