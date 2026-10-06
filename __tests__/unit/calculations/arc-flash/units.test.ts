import { describe, it, expect } from 'vitest'
import {
  calToJ,
  formatDistance,
  formatEnergy,
  formatTime,
  inToMm,
  jToCal,
  mmToIn,
} from '@/lib/calculations/arc-flash/units'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import { assessPpe } from '@/lib/calculations/arc-flash/ppe'
import type { ArcFlashInput } from '@/types/arc-flash'

const D2: ArcFlashInput = {
  equipmentId: 'SWGR-1', projectName: '', voltageV: 480, frequencyHz: 60, boltedFaultKA: 45,
  electrodeConfig: 'VCB', gapMm: 32, workingDistanceMm: 609.6,
  enclosure: { heightMm: 610, widthMm: 610, depthMm: 254 },
  arcingTimeNominalMs: 61.3, arcingTimeReducedMs: 319, sameTimeForBoth: false, applyTwoSecondCap: false,
  equipmentClass: 'custom', ppeMethod: 'incident-energy', tableRowId: null,
}

describe('unit conversions', () => {
  it.each([0, 1, 25.4, 609.6, 1029, 12345.678])('mm ↔ in round-trips %d mm', (mm) => {
    expect(inToMm(mmToIn(mm))).toBeCloseTo(mm, 9)
  })

  it('uses 25.4 mm/in and 4.184 J/cal', () => {
    expect(mmToIn(25.4)).toBe(1)
    expect(calToJ(1)).toBe(4.184)
    expect(jToCal(4.184)).toBe(1)
    expect(jToCal(calToJ(12.7))).toBeCloseTo(12.7, 12)
  })
})

describe('formatters', () => {
  it('formats distances imperial-first for NEC and metric-first for IEC', () => {
    expect(formatDistance(1029, 'NEC')).toBe('3 ft 5 in (1029 mm)')
    expect(formatDistance(1029, 'IEC')).toBe('1029 mm (1.03 m)')
  })

  it('carries 12 in into the next foot', () => {
    // 3657 mm = 143.98 in → rounds to 144 in = 12 ft 0 in
    expect(formatDistance(3657, 'NEC')).toBe('12 ft 0 in (3657 mm)')
  })

  it('formats energy cal-first for NEC and J-first for IEC', () => {
    expect(formatEnergy(53.156, 'IEC')).toBe('53.16 J/cm² (12.70 cal/cm²)')
    expect(formatEnergy(53.156, 'NEC')).toBe('12.70 cal/cm² (53.16 J/cm²)')
  })

  it('formats times in ms', () => {
    expect(formatTime(61.3)).toBe('61.3 ms')
    expect(formatTime(319)).toBe('319 ms')
  })
})

describe('SC-006 — the standard changes presentation, never numbers', () => {
  it('calculateArcFlash is independent of the selected standard', () => {
    const r = calculateArcFlash(D2)
    const nec = assessPpe(r, D2, 'NEC')
    const iec = assessPpe(r, D2, 'IEC')
    expect(iec.outcome).toBe(nec.outcome)
    expect(iec.minArcRatingCalcm2).toBe(nec.minArcRatingCalcm2)
    expect(iec.approachBoundaries).toEqual(nec.approachBoundaries)
  })

  it('NEC mode has no IEC requirement', () => {
    const r = calculateArcFlash(D2)
    expect(assessPpe(r, D2, 'NEC').iecRequirement).toBeNull()
  })

  it('IEC mode requires ATPV/ELIM ≥ governing E rounded up to 0.1 J/cm²', () => {
    const r = calculateArcFlash(D2)
    const iec = assessPpe(r, D2, 'IEC').iecRequirement
    expect(iec).not.toBeNull()
    expect(iec!.minArcRatingJcm2).toBe(Math.ceil(r.governing.incidentEnergyJcm2 * 10) / 10)
    expect(iec!.minArcRatingJcm2).toBe(53.2)
    expect(iec!.text).toContain('IEC 61482-1-1')
    expect(iec!.text).toContain('IEC 61482-2')
    expect(iec!.note).toMatch(/APC/)
  })
})
