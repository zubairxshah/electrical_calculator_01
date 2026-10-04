import { describe, it, expect } from 'vitest'
import { enclosureCorrection } from '@/lib/calculations/arc-flash/ieee1584'

describe('enclosureCorrection (IEEE 1584-2018 §4.8, Eqs. 11–15, Table 7)', () => {
  it('Annex D.1 — 4.16 kV VCB, 1143 H × 762 W × 508 D mm', () => {
    const r = enclosureCorrection('VCB', 4160, { heightMm: 1143, widthMm: 762, depthMm: 508 })
    expect(r.type).toBe('typical')
    expect(r.equivalentWidthIn).toBeCloseTo(27.632, 3) // D.19
    expect(r.equivalentHeightIn).toBeCloseTo(45.0, 3) // D.20
    expect(r.ees).toBeCloseTo(36.316, 3) // D.21
    expect(r.cf).toBeCloseTo(1.284, 3) // D.22
  })

  it('Annex D.2 — 480 V VCB, 610 × 610 × 254 mm', () => {
    const r = enclosureCorrection('VCB', 480, { heightMm: 610, widthMm: 610, depthMm: 254 })
    expect(r.type).toBe('typical')
    expect(r.equivalentWidthIn).toBeCloseTo(24.016, 3) // D.86
    expect(r.equivalentHeightIn).toBeCloseTo(24.016, 3) // D.87
    expect(r.ees).toBeCloseTo(24.016, 3) // D.88
    expect(r.cf).toBeCloseTo(1.085, 3) // D.89
  })

  it('is "shallow" when Voc < 600 V, H and W < 508 mm and depth ≤ 203.2 mm', () => {
    expect(enclosureCorrection('VCB', 480, { heightMm: 300, widthMm: 300, depthMm: 200 }).type).toBe('shallow')
    expect(enclosureCorrection('VCB', 480, { heightMm: 300, widthMm: 300, depthMm: 203.2 }).type).toBe('shallow')
  })

  it('is "typical" when depth > 203.2 mm or Voc is not below 600 V', () => {
    expect(enclosureCorrection('VCB', 480, { heightMm: 300, widthMm: 300, depthMm: 203.3 }).type).toBe('typical')
    expect(enclosureCorrection('VCB', 600, { heightMm: 300, widthMm: 300, depthMm: 200 }).type).toBe('typical')
  })

  it('uses CF = 1 and no equivalent size for open-air configurations', () => {
    for (const config of ['VOA', 'HOA'] as const) {
      const r = enclosureCorrection(config, 480, null)
      expect(r).toEqual({ type: 'open-air', equivalentWidthIn: 0, equivalentHeightIn: 0, ees: 0, cf: 1 })
    }
  })

  it('caps width above 1244.6 mm at the 1244.6 mm value', () => {
    const capped = enclosureCorrection('VCBB', 4160, { heightMm: 1000, widthMm: 1500, depthMm: 600 })
    const atLimit = enclosureCorrection('VCBB', 4160, { heightMm: 1000, widthMm: 1244.6, depthMm: 600 })
    expect(capped.equivalentWidthIn).toBeCloseTo(atLimit.equivalentWidthIn, 9)
  })

  it('uses 49 in for VCB height above 1244.6 mm', () => {
    const r = enclosureCorrection('VCB', 4160, { heightMm: 1500, widthMm: 762, depthMm: 508 })
    expect(r.equivalentHeightIn).toBe(49)
  })

  it('uses 20 in for a typical enclosure dimension below 508 mm', () => {
    const r = enclosureCorrection('VCB', 4160, { heightMm: 400, widthMm: 400, depthMm: 400 })
    expect(r.equivalentWidthIn).toBe(20)
    expect(r.equivalentHeightIn).toBe(20)
  })
})
