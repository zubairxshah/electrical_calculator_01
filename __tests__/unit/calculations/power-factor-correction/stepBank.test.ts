import { describe, it, expect } from 'vitest'
import {
  designTargetKVAR, buildSteps, recommendSequence, switchingLevels, calculateCk, designStepBank,
} from '@/lib/calculations/power-factor-correction/stepBank'
import { iecInput, baseDesign, resultsFor } from './fixtures'

const codes = (w: { code: string }[]) => w.map(x => x.code)

describe('designTargetKVAR (R1)', () => {
  it('uses the required kVAR when there is no derating', () => {
    expect(designTargetKVAR(resultsFor(55.32))).toBe(55.32)
  })
  it('uses the derating-adjusted kVAR when derating applies', () => {
    expect(designTargetKVAR(resultsFor(136.74, 168.35))).toBe(168.35)
  })
})

describe('buildSteps (R2)', () => {
  it('repeats the last ratio until the target is reached', () => {
    expect(buildSteps(20, [1, 2, 4], 300, 6)).toEqual([20, 40, 80, 80, 80])
  })
  it('returns null when more than maxSteps would be needed', () => {
    expect(buildSteps(15, [1, 2, 4], 300, 6)).toBeNull()
  })
  it('12-output variant of Example B', () => {
    expect(buildSteps(10, [1, 2, 4], 300, 12)).toEqual([10, 20, 40, 40, 40, 40, 40, 40, 40])
  })
})

describe('recommendSequence (R2)', () => {
  it('Example B: 300 kVAR with 6 outputs → 1:2:4 at 20 kVAR', () => {
    const r = recommendSequence(300, 6)
    expect(r).not.toBeNull()
    expect(r!.preset).toBe('1:2:4')
    expect(r!.u).toBe(20)
    expect(r!.steps).toEqual([20, 40, 80, 80, 80])
  })
  it('prefers a sequence whose overshoot stays within one smallest step', () => {
    const r = recommendSequence(55.32, 12)!
    expect(r.u).toBe(5)
    const total = r.steps.reduce((a, b) => a + b, 0)
    expect(total - 55.32).toBeLessThanOrEqual(5)
    expect(r.preset).toBe('1:1:2:2')
  })
  it('returns null when no standard smallest step fits within the output limit', () => {
    expect(recommendSequence(5000, 12)).toBeNull()
  })
})

describe('switchingLevels (R3)', () => {
  it('equal steps give one level per step', () => {
    expect(switchingLevels([10, 10, 10, 10])).toBe(4)
  })
  it('binary sequence 1:2:4 gives 7 levels', () => {
    expect(switchingLevels([1, 2, 4])).toBe(7)
  })
  it('Example B gives 15 levels', () => {
    expect(switchingLevels([20, 40, 80, 80, 80])).toBe(15)
  })
  it('non-binary custom steps are counted exactly', () => {
    expect(switchingLevels([10, 50])).toBe(3)
  })
})

describe('calculateCk (R4)', () => {
  it('Example B: 20 kVAR, 400 V, 1000/5 → 0.1443 A', () => {
    expect(calculateCk(20, 400, 200, true)).toBeCloseTo(0.1443, 4)
  })
  it('single-phase uses U·k', () => {
    expect(calculateCk(10, 230, 20, false)).toBeCloseTo(10000 / (230 * 20), 6)
  })
})

describe('designStepBank', () => {
  it('Example B with preset 1:2:4 and 6 outputs', () => {
    const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, sequenceMode: '1:2:4', maxOutputs: 6 })
    expect(bank.steps.map(s => s.effectiveKVAR)).toEqual([20, 40, 80, 80, 80])
    expect(bank.steps.map(s => s.cumulativeKVAR)).toEqual([20, 60, 140, 220, 300])
    expect(bank.steps.map(s => s.ratio)).toEqual([1, 2, 4, 4, 4])
    expect(bank.totalKVAR).toBe(300)
    expect(bank.overshootKVAR).toBeCloseTo(0, 9)
    expect(bank.resolutionKVAR).toBe(20)
    expect(bank.switchingLevels).toBe(15)
    expect(bank.outputsUsed).toBe(5)
    expect(bank.controller!.outputs).toBe(6)
    expect(bank.controller!.ctRatio).toBe(200)
    expect(bank.controller!.ck).toBeCloseTo(0.1443, 4)
    expect(bank.warnings).toEqual([])
  })

  it('auto mode resolves a preset', () => {
    const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, maxOutputs: 6 })
    expect(bank.mode).toBe('auto')
    expect(bank.preset).toBe('1:2:4')
  })

  it('fixed correction → one standard-rated step and no controller', () => {
    const bank = designStepBank({ ...iecInput, correctionType: 'fixed' }, resultsFor(55.32), baseDesign)
    expect(bank.steps).toHaveLength(1)
    expect(bank.totalKVAR).toBe(60)
    expect(bank.controller).toBeNull()
    expect(bank.switchingLevels).toBe(1)
  })

  it('custom steps are used as entered', () => {
    const bank = designStepBank(iecInput, resultsFor(55.32), { ...baseDesign, sequenceMode: 'custom', customStepsKVAR: [10, 25, 25] })
    expect(bank.steps.map(s => s.effectiveKVAR)).toEqual([10, 25, 25])
    expect(bank.preset).toBeNull()
    expect(bank.totalKVAR).toBe(60)
    expect(bank.resolutionKVAR).toBe(10)
  })

  it('custom steps below the target raise UNDERSIZED_BANK', () => {
    const bank = designStepBank(iecInput, resultsFor(55.32), { ...baseDesign, sequenceMode: 'custom', customStepsKVAR: [10, 20] })
    expect(codes(bank.warnings)).toContain('UNDERSIZED_BANK')
  })

  it('invalid custom steps give an error and an empty bank', () => {
    const bank = designStepBank(iecInput, resultsFor(55.32), { ...baseDesign, sequenceMode: 'custom', customStepsKVAR: [] })
    expect(bank.steps).toEqual([])
    expect(bank.warnings.find(w => w.code === 'INVALID_CUSTOM_STEPS')?.severity).toBe('error')
  })

  it('overshoot above one smallest step raises OVERSHOOT', () => {
    const bank = designStepBank(iecInput, resultsFor(55.32), { ...baseDesign, sequenceMode: '1:2:4' })
    expect(bank.overshootKVAR).toBeGreaterThan(bank.resolutionKVAR)
    expect(codes(bank.warnings)).toContain('OVERSHOOT')
  })

  it('first step larger than the minimum load variation raises STEP_TOO_COARSE', () => {
    const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, sequenceMode: '1:2:4', maxOutputs: 6, minLoadVariationKVAR: 15 })
    expect(codes(bank.warnings)).toContain('STEP_TOO_COARSE')
  })

  it('default variation threshold is 10 % of the bank total', () => {
    // 1:1:1 with 6 outputs at 300 kVAR → u = 50 > 30
    const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, sequenceMode: '1:1:1', maxOutputs: 6 })
    expect(bank.resolutionKVAR).toBe(50)
    expect(codes(bank.warnings)).toContain('STEP_TOO_COARSE')
  })

  it('invalid CT ratio → ck null and CK_NEEDS_CT', () => {
    const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, ctPrimaryA: 0 })
    expect(bank.controller!.ck).toBeNull()
    expect(codes(bank.warnings)).toContain('CK_NEEDS_CT')
  })

  it('no standard step fits → fallback step and NO_STANDARD_STEP_FITS', () => {
    const bank = designStepBank(iecInput, resultsFor(5000), { ...baseDesign, sequenceMode: '1:1:1' })
    expect(codes(bank.warnings)).toContain('NO_STANDARD_STEP_FITS')
    expect(bank.steps.length).toBeLessThanOrEqual(12)
    expect(bank.totalKVAR).toBeGreaterThanOrEqual(5000)
  })
})
