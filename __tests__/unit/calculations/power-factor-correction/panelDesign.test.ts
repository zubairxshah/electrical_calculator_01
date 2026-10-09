import { describe, it, expect } from 'vitest'
import { designPanel, DEFAULT_DESIGN } from '@/lib/calculations/power-factor-correction/panelDesign'
import { calculatePowerFactorCorrection } from '@/lib/calculations/power-factor-correction/pfcCalculator'
import { iecInput, baseDesign, resultsFor } from './fixtures'

describe('designPanel', () => {
  it('DEFAULT_DESIGN matches the documented defaults', () => {
    expect(DEFAULT_DESIGN).toEqual(baseDesign)
  })

  it('no stage 1 results → unavailable', () => {
    const d = designPanel(iecInput, null, DEFAULT_DESIGN)
    expect(d.available).toBe(false)
    expect(d.stepBank).toBeNull()
    expect(d.warnings).toEqual([])
  })

  it('MV systems → unavailable with MV_NOT_SUPPORTED', () => {
    const d = designPanel({ ...iecInput, voltage: 11000 }, resultsFor(500), DEFAULT_DESIGN)
    expect(d.available).toBe(false)
    expect(d.warnings.map(w => w.code)).toEqual(['MV_NOT_SUPPORTED'])
  })

  it('1000 V is still LV', () => {
    expect(designPanel({ ...iecInput, voltage: 1000 }, resultsFor(100), DEFAULT_DESIGN).available).toBe(true)
  })

  it('Example A end-to-end: the chain is consistent', async () => {
    const input = { ...iecInput, voltage: 415 }
    const results = await calculatePowerFactorCorrection({ input, environment: { ambientTemperature: 35, altitude: 0 } })
    const d = designPanel(input, results, DEFAULT_DESIGN)
    expect(d.available).toBe(true)
    const bank = d.stepBank!
    expect(bank.targetKVAR).toBe(55.32)
    expect(bank.totalKVAR).toBeCloseTo(bank.steps.reduce((a, s) => a + s.effectiveKVAR, 0), 9)
    expect(d.detuning!.steps).toHaveLength(bank.steps.length)
    expect(d.switchgear!.steps).toHaveLength(bank.steps.length)
    d.switchgear!.steps.forEach((s, i) => expect(s.ratedCurrentA).toBeCloseTo(d.detuning!.steps[i].currentA, 9))
  })

  it('detuned currents feed the switchgear and contactor notes', () => {
    const d = designPanel({ ...iecInput, harmonicDistortion: 15 }, resultsFor(300), { ...DEFAULT_DESIGN, sequenceMode: '1:2:4', maxOutputs: 6 })
    expect(d.detuning!.applied).toBe(7)
    expect(d.switchgear!.steps[0].contactor.type).toMatch(/reactor/i)
  })

  it('recommended but disabled detuning → DETUNING_RECOMMENDED warning', () => {
    const d = designPanel({ ...iecInput, harmonicDistortion: 15 }, resultsFor(300), { ...DEFAULT_DESIGN, detuning: 'none' })
    expect(d.warnings.find(w => w.code === 'DETUNING_RECOMMENDED')?.severity).toBe('warning')
  })

  it('invalid custom steps → error warning, no throw, empty downstream', () => {
    const d = designPanel(iecInput, resultsFor(55), { ...DEFAULT_DESIGN, sequenceMode: 'custom', customStepsKVAR: [] })
    expect(d.available).toBe(true)
    expect(d.warnings.some(w => w.code === 'INVALID_CUSTOM_STEPS' && w.severity === 'error')).toBe(true)
    expect(d.switchgear!.steps).toEqual([])
    expect(d.switchgear!.incomerA).toBeNull()
  })

  it('warnings are deduplicated and sorted errors first', () => {
    const d = designPanel(iecInput, resultsFor(300), {
      ...DEFAULT_DESIGN, ctPrimaryA: 0, overrides: { 1: { protectionA: 1 }, 2: { protectionA: 1 } },
    })
    const keys = d.warnings.map(w => `${w.code}|${w.stepIndex ?? ''}|${w.message}`)
    expect(new Set(keys).size).toBe(keys.length)
    const sev = d.warnings.map(w => w.severity)
    expect(sev.indexOf('error')).toBe(0)
    expect(sev.lastIndexOf('error')).toBeLessThan(sev.indexOf('info'))
  })
})
