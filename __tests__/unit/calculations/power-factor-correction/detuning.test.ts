import { describe, it, expect } from 'vitest'
import {
  recommendDetuning, tuningFrequency, capacitorRatedVoltage, detuneStep, designDetuning,
} from '@/lib/calculations/power-factor-correction/detuning'
import { designStepBank } from '@/lib/calculations/power-factor-correction/stepBank'
import { iecInput, baseDesign, resultsFor } from './fixtures'

describe('recommendDetuning (R6, clarified 2026-10-10)', () => {
  it('THD ≤ 10 % → none', () => {
    expect(recommendDetuning(5, false)).toBeNull()
    expect(recommendDetuning(10, false)).toBeNull()
  })
  it('THD > 10 % → 7 %', () => {
    expect(recommendDetuning(10.1, false)).toBe(7)
  })
  it('significant 3rd harmonic → 14 % regardless of THD', () => {
    expect(recommendDetuning(2, true)).toBe(14)
    expect(recommendDetuning(25, true)).toBe(14)
  })
})

describe('tuningFrequency = f / √p', () => {
  it.each([
    [50, 7, 189.0], [60, 7, 226.8],
    [50, 5.67, 210.0], [60, 5.67, 252.0],
    [50, 14, 133.6], [60, 14, 160.4],
  ])('%i Hz, p = %f %% → %f Hz', (f, p, fr) => {
    expect(tuningFrequency(f, p)).toBeCloseTo(fr, 1)
  })
})

describe('capacitorRatedVoltage (R7)', () => {
  it('Example C: 400 V, 7 % → 480 V (1.1 × 430.1 = 473.1)', () => {
    expect(capacitorRatedVoltage(400, 7)).toBe(480)
  })
  it('not detuned → existing selection (≥ 1.1 U)', () => {
    expect(capacitorRatedVoltage(400, null)).toBe(440)
    expect(capacitorRatedVoltage(415, null)).toBe(480)
  })
  it('14 % at 400 V → 525 V (1.1 × 465.1 = 511.6)', () => {
    expect(capacitorRatedVoltage(400, 14)).toBe(525)
  })
  it('never jumps to an MV rating for an LV system', () => {
    expect(capacitorRatedVoltage(690, 14)).toBeLessThan(1000)
    expect(capacitorRatedVoltage(690, 14)).toBeGreaterThanOrEqual(1.1 * 690 / 0.86)
  })
})

describe('detuneStep — Example C', () => {
  const s = detuneStep(50, 400, 50, 7, 480, true)
  it('capacitor reactance 3.4409 Ω', () => expect(s.capacitorReactanceOhm).toBeCloseTo(3.4409, 4))
  it('reactor inductance 0.7667 mH', () => expect(s.reactorInductanceMH!).toBeCloseTo(0.7667, 4))
  it('capacitor rated kVAR 66.96', () => expect(s.ratedKVAR).toBeCloseTo(66.96, 2))
  it('step current 72.17 A', () => expect(s.currentA).toBeCloseTo(72.17, 2))
  it('keeps the effective kVAR', () => expect(s.effectiveKVAR).toBe(50))
})

describe('detuneStep — not detuned', () => {
  it('Qr = Qeff · (Ur/U)², no reactor', () => {
    const s = detuneStep(50, 400, 50, null, 440, true)
    expect(s.reactorInductanceMH).toBeNull()
    expect(s.ratedKVAR).toBeCloseTo(50 * 1.21, 6)
    expect(s.capacitorReactanceOhm).toBeCloseTo(3.2, 6)
  })
  it('single-phase current = Q / U', () => {
    expect(detuneStep(10, 230, 50, null, 250, false).currentA).toBeCloseTo(43.48, 2)
  })
})

describe('designDetuning', () => {
  const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, sequenceMode: '1:2:4', maxOutputs: 6 })

  it("'auto' applies the recommendation (THD 15 % → 7 %)", () => {
    const d = designDetuning({ ...iecInput, harmonicDistortion: 15 }, bank, baseDesign)
    expect(d.recommended).toBe(7)
    expect(d.applied).toBe(7)
    expect(d.tuningFrequencyHz).toBeCloseTo(189.0, 1)
    expect(d.capacitorVoltageV).toBeCloseTo(430.1, 1)
    expect(d.capacitorRatedVoltageV).toBe(480)
    expect(d.steps).toHaveLength(5)
    expect(d.steps.map(s => s.index)).toEqual([1, 2, 3, 4, 5])
    expect(d.totalRatedKVAR).toBeCloseTo(300 * 0.93 * 1.44, 6)
  })

  it("'auto' with THD 5 % → not detuned", () => {
    const d = designDetuning(iecInput, bank, baseDesign)
    expect(d.recommended).toBeNull()
    expect(d.applied).toBeNull()
    expect(d.tuningFrequencyHz).toBeNull()
    expect(d.capacitorVoltageV).toBe(400)
    expect(d.capacitorRatedVoltageV).toBe(440)
  })

  it('an explicit choice overrides the recommendation', () => {
    const d = designDetuning(iecInput, bank, { ...baseDesign, detuning: 14 })
    expect(d.recommended).toBeNull()
    expect(d.applied).toBe(14)
  })

  it("'none' disables detuning even when recommended", () => {
    const d = designDetuning({ ...iecInput, harmonicDistortion: 20 }, bank, { ...baseDesign, detuning: 'none' })
    expect(d.recommended).toBe(7)
    expect(d.applied).toBeNull()
  })
})
