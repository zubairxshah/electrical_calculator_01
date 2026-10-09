import { describe, it, expect } from 'vitest'
import { designCurrentFactor, sizeStep, designSwitchgear } from '@/lib/calculations/power-factor-correction/switchgear'
import { designDetuning } from '@/lib/calculations/power-factor-correction/detuning'
import { designStepBank } from '@/lib/calculations/power-factor-correction/stepBank'
import { iecInput, baseDesign, resultsFor } from './fixtures'

const IN_400V_50KVAR = 50000 / (Math.sqrt(3) * 400) // 72.17 A
const IN_480V_50KVAR = 50000 / (Math.sqrt(3) * 480) // 60.14 A

describe('designCurrentFactor (R8)', () => {
  it('IEC: 1.3 × 1.1 = 1.43', () => expect(designCurrentFactor('IEC')).toBeCloseTo(1.43, 10))
  it('NEC 460.8(A): 1.35', () => expect(designCurrentFactor('NEC')).toBe(1.35))
})

describe('sizeStep — Example D', () => {
  it('IEC, 400 V, 50 kVAR, fuse', () => {
    const s = sizeStep(1, IN_400V_50KVAR, 'IEC', 'fuse', false)
    expect(s.ratedCurrentA).toBeCloseTo(72.17, 2)
    expect(s.designCurrentA).toBeCloseTo(103.2, 1)
    expect(s.protection.value).toBe(125)
    expect(s.protection.type).toBe('fuse')
    expect(s.contactor.value).toBe(115)
    expect(s.cable.value).toBe('35')
    expect(s.cable.label).toBe('35 mm²')
    expect(s.cable.ampacityA).toBe(110)
    expect([s.contactor.ok, s.protection.ok, s.cable.ok]).toEqual([true, true, true])
  })

  it('IEC MCCB uses the IEC breaker series', () => {
    expect(sizeStep(1, IN_400V_50KVAR, 'IEC', 'mccb', false).protection.value).toBe(125)
  })

  it('NEC, 480 V, 50 kVAR', () => {
    const s = sizeStep(1, IN_480V_50KVAR, 'NEC', 'mccb', false)
    expect(s.designCurrentA).toBeCloseTo(81.19, 2)
    expect(s.protection.value).toBe(90)
    expect(s.contactor.value).toBe(95)
    expect(s.cable.value).toBe('4')
    expect(s.cable.label).toBe('4 AWG')
    expect(s.cable.ampacityA).toBe(85)
  })

  it('contactor type text depends on detuning (FR-017)', () => {
    expect(sizeStep(1, 50, 'IEC', 'fuse', false).contactor.type).toMatch(/damping resistors/i)
    expect(sizeStep(1, 50, 'IEC', 'fuse', true).contactor.type).toMatch(/reactor/i)
  })

  it('an override below the design current is flagged (FR-015a)', () => {
    const s = sizeStep(1, IN_400V_50KVAR, 'IEC', 'fuse', false, { protectionA: 63 })
    expect(s.protection.value).toBe(63)
    expect(s.protection.overridden).toBe(true)
    expect(s.protection.ok).toBe(false)
  })

  it('a valid override is kept and marked', () => {
    const s = sizeStep(1, IN_400V_50KVAR, 'IEC', 'fuse', false, { contactorA: 150, cableSize: '50' })
    expect(s.contactor).toMatchObject({ value: 150, overridden: true, ok: true })
    expect(s.cable).toMatchObject({ value: '50', overridden: true, ok: true, ampacityA: 133 })
  })

  it('an undersized or unknown cable override fails', () => {
    expect(sizeStep(1, IN_400V_50KVAR, 'IEC', 'fuse', false, { cableSize: '16' }).cable.ok).toBe(false)
    expect(sizeStep(1, IN_400V_50KVAR, 'IEC', 'fuse', false, { cableSize: 'xx' }).cable.ok).toBe(false)
  })
})

describe('designSwitchgear', () => {
  const bank = designStepBank(iecInput, resultsFor(300), { ...baseDesign, sequenceMode: '1:2:4', maxOutputs: 6 })
  const detuning = designDetuning(iecInput, bank, baseDesign)

  it('panel totals for Example B (IEC 400 V)', () => {
    const sg = designSwitchgear(iecInput, detuning, baseDesign)
    expect(sg.steps).toHaveLength(5)
    expect(sg.factor).toBeCloseTo(1.43, 10)
    expect(sg.protectionType).toBe('fuse')
    expect(sg.totalRatedCurrentA).toBeCloseTo(433.0, 1)
    expect(sg.totalDesignCurrentA).toBeCloseTo(619.2, 1)
    expect(sg.incomerA).toBe(630)
    expect(sg.busbarA).toBe(630)
    expect(sg.warnings).toEqual([])
  })

  it('NEC defaults to circuit breakers', () => {
    const nec = { ...iecInput, standard: 'NEC' as const, voltage: 480, frequency: 60 }
    const d = designDetuning(nec, designStepBank(nec, resultsFor(300), baseDesign), baseDesign)
    expect(designSwitchgear(nec, d, baseDesign).protectionType).toBe('mccb')
  })

  it('undersized override → OVERRIDE_UNDERSIZED error with the step index', () => {
    const sg = designSwitchgear(iecInput, detuning, { ...baseDesign, overrides: { 3: { protectionA: 100 } } })
    const w = sg.warnings.find(x => x.code === 'OVERRIDE_UNDERSIZED')
    expect(w?.severity).toBe('error')
    expect(w?.stepIndex).toBe(3)
  })

  it('a step above the largest contactor frame → STEP_ABOVE_MAX_CONTACTOR', () => {
    const big = designStepBank({ ...iecInput, correctionType: 'fixed' }, resultsFor(300), baseDesign)
    const sg = designSwitchgear(iecInput, designDetuning(iecInput, big, baseDesign), baseDesign)
    expect(sg.steps[0].contactor.value).toBeNull()
    expect(sg.warnings.map(w => w.code)).toContain('STEP_ABOVE_MAX_CONTACTOR')
  })

  it('single-phase step current = Q / U (230 V, 10 kVAR → 43.48 A)', () => {
    const one = { ...iecInput, systemType: 'single-phase-ac' as const, voltage: 230 }
    const b = designStepBank(one, resultsFor(10), { ...baseDesign, sequenceMode: 'custom', customStepsKVAR: [10] })
    const sg = designSwitchgear(one, designDetuning(one, b, baseDesign), baseDesign)
    expect(sg.steps[0].ratedCurrentA).toBeCloseTo(43.48, 2)
  })
})
