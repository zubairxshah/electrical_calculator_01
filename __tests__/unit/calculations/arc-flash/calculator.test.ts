import { describe, it, expect } from 'vitest'
import { calculateArcFlash, ArcFlashRangeError, pickGoverning } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import type { ArcFlashInput } from '@/types/arc-flash'

// Annex D.2 inputs
const D2: ArcFlashInput = {
  equipmentId: 'SWGR-1',
  projectName: '',
  voltageV: 480,
  frequencyHz: 60,
  boltedFaultKA: 45,
  electrodeConfig: 'VCB',
  gapMm: 32,
  workingDistanceMm: 609.6,
  enclosure: { heightMm: 610, widthMm: 610, depthMm: 254 },
  arcingTimeNominalMs: 61.3,
  arcingTimeReducedMs: 319,
  sameTimeForBoth: false,
  applyTwoSecondCap: false,
  equipmentClass: 'custom',
  ppeMethod: 'incident-energy',
  tableRowId: null,
}

const codes = (input: ArcFlashInput) => calculateArcFlash(input).warnings.map((w) => w.code)

describe('calculateArcFlash', () => {
  it('uses each case’s own arcing time (spec FR-007)', () => {
    const r = calculateArcFlash(D2)
    expect(r.nominal.arcingTimeMs).toBe(61.3)
    expect(r.reduced.arcingTimeMs).toBe(319)
    expect(r.nominal.incidentEnergyJcm2).toBeCloseTo(11.585, 3)
    expect(r.reduced.incidentEnergyJcm2).toBeCloseTo(53.156, 3)
  })

  it('reports the case with the higher incident energy as governing (Annex D.2: reduced)', () => {
    const r = calculateArcFlash(D2)
    expect(r.governingCase).toBe('reduced')
    expect(r.governing).toBe(r.reduced)
  })

  it('reports nominal as governing on a tie, otherwise the higher energy', () => {
    const r = calculateArcFlash(D2)
    const tie = { ...r.reduced, incidentEnergyJcm2: r.nominal.incidentEnergyJcm2 }
    expect(pickGoverning(r.nominal, tie)).toBe('nominal')
    expect(pickGoverning(r.nominal, r.reduced)).toBe('reduced')
    expect(pickGoverning(r.reduced, { ...r.nominal, incidentEnergyJcm2: 1 })).toBe('nominal')
  })

  it('incident energy is linear in arcing time', () => {
    const a = calculateArcFlash(D2)
    const b = calculateArcFlash({ ...D2, arcingTimeNominalMs: 122.6 })
    expect(b.nominal.incidentEnergyJcm2 / a.nominal.incidentEnergyJcm2).toBeCloseTo(2, 9)
  })

  it('reduced arcing current is always below nominal', () => {
    for (const electrodeConfig of ['VCB', 'VCBB', 'HCB', 'VOA', 'HOA'] as const) {
      for (const voltageV of [208, 480, 600, 4160, 13800]) {
        const open = electrodeConfig === 'VOA' || electrodeConfig === 'HOA'
        const gapMm = voltageV > 600 ? 104 : 25
        const r = calculateArcFlash({
          ...D2, voltageV, electrodeConfig, gapMm, boltedFaultKA: 20,
          enclosure: open ? null : { heightMm: 914.4, widthMm: 914.4, depthMm: 914.4 },
        })
        expect(r.reduced.arcingCurrentKA).toBeLessThan(r.nominal.arcingCurrentKA)
      }
    }
  })

  it('caps arcing times at 2 s only when applyTwoSecondCap is set', () => {
    const long = { ...D2, arcingTimeNominalMs: 2500, arcingTimeReducedMs: 3000 }
    expect(calculateArcFlash(long).reduced.arcingTimeMs).toBe(3000)
    const capped = calculateArcFlash({ ...long, applyTwoSecondCap: true })
    expect(capped.nominal.arcingTimeMs).toBe(2000)
    expect(capped.reduced.arcingTimeMs).toBe(2000)
  })

  it('warns when either arcing time exceeds 2 s', () => {
    expect(codes({ ...D2, arcingTimeReducedMs: 2500 })).toContain('TIME_GT_2S')
    expect(codes(D2)).not.toContain('TIME_GT_2S')
  })

  it('warns when the reduced-current time is shorter than the nominal time', () => {
    expect(codes({ ...D2, arcingTimeNominalMs: 100, arcingTimeReducedMs: 50 })).toContain('REDUCED_TIME_SHORTER')
    expect(codes(D2)).not.toContain('REDUCED_TIME_SHORTER')
  })

  it('warns when an enclosure dimension is above 1244.6 mm', () => {
    expect(codes({ ...D2, enclosure: { heightMm: 1500, widthMm: 610, depthMm: 254 } })).toContain('ENCLOSURE_CAPPED')
    expect(codes(D2)).not.toContain('ENCLOSURE_CAPPED')
  })

  it('warns when the enclosure width is less than 4 × gap', () => {
    expect(codes({ ...D2, gapMm: 76.2, enclosure: { heightMm: 610, widthMm: 300, depthMm: 254 } })).toContain('OPENING_LT_4G')
    expect(codes(D2)).not.toContain('OPENING_LT_4G')
  })

  it('adds a sustainability note for 208–240 V systems', () => {
    expect(codes({ ...D2, voltageV: 208, gapMm: 25 })).toContain('LOW_VOLTAGE_SUSTAIN')
    expect(codes(D2)).not.toContain('LOW_VOLTAGE_SUSTAIN')
  })

  it('sets model path, VarCf, enclosure and references', () => {
    const r = calculateArcFlash(D2)
    expect(r.modelPath).toBe('LV')
    expect(r.varCf).toBeCloseTo(0.247, 3)
    expect(r.enclosure.cf).toBeCloseTo(1.085, 3)
    expect(r.standardRefs.join(' ')).toContain('IEEE 1584-2018')
    expect(() => new Date(r.calculatedAt).toISOString()).not.toThrow()
  })

  it('throws ArcFlashRangeError for input outside the model range', () => {
    expect(() => calculateArcFlash({ ...D2, boltedFaultKA: 120 })).toThrow(ArcFlashRangeError)
    expect(() => calculateArcFlash({ ...D2, voltageV: 100 })).toThrow(ArcFlashRangeError)
  })
})
