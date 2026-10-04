import { describe, it, expect } from 'vitest'
import { calculateCase, enclosureCorrection, variationCorrectionFactor } from '@/lib/calculations/arc-flash/ieee1584'

// IEEE 1584-2018 Annex D worked examples. Expected values carry the standard's equation numbers.
const close = (actual: number | undefined, expected: number, tol = 0.001) =>
  expect(Math.abs((actual ?? NaN) - expected)).toBeLessThanOrEqual(tol)

describe('Annex D.1 — 4.16 kV VCB (medium-voltage interpolation)', () => {
  const cf = enclosureCorrection('VCB', 4160, { heightMm: 1143, widthMm: 762, depthMm: 508 }).cf
  const base = { voltageV: 4160, boltedFaultKA: 15, config: 'VCB' as const, gapMm: 104, workingDistanceMm: 914.4, cf }
  const nominal = calculateCase({ ...base, arcingTimeMs: 197, arcingCase: 'nominal' })
  const reduced = calculateCase({ ...base, arcingTimeMs: 223, arcingCase: 'reduced' })

  it('nominal arcing currents (D.9, D.11, D.13, D.17)', () => {
    close(nominal.intermediates.iArc600KA, 11.117)
    close(nominal.intermediates.iArc2700KA, 12.816)
    close(nominal.intermediates.iArc14300KA, 14.116)
    close(nominal.arcingCurrentKA, 12.979)
  })

  it('nominal incident energy (D.24, D.26, D.28, D.32)', () => {
    close(nominal.intermediates.e600Jcm2, 8.652)
    close(nominal.intermediates.e2700Jcm2, 11.977)
    close(nominal.intermediates.e14300Jcm2, 13.367)
    close(nominal.incidentEnergyJcm2, 12.152)
  })

  it('nominal arc flash boundary (D.34, D.36, D.38, D.42)', () => {
    close(nominal.intermediates.afb600Mm, 1285, 1)
    close(nominal.intermediates.afb2700Mm, 1591, 1)
    close(nominal.intermediates.afb14300Mm, 1707, 1)
    close(nominal.arcFlashBoundaryMm, 1606, 1)
  })

  it('reduced arcing currents (D.45–D.47, D.51)', () => {
    close(reduced.intermediates.iArc600KA, 10.856)
    close(reduced.intermediates.iArc2700KA, 12.515)
    close(reduced.intermediates.iArc14300KA, 13.786)
    close(reduced.arcingCurrentKA, 12.675)
  })

  it('reduced incident energy (D.54, D.56, D.58, D.62)', () => {
    close(reduced.intermediates.e600Jcm2, 8.98)
    close(reduced.intermediates.e2700Jcm2, 13.018)
    close(reduced.intermediates.e14300Jcm2, 15.602)
    close(reduced.incidentEnergyJcm2, 13.343)
  })

  it('reduced arc flash boundary (D.64, D.66, D.68, D.72)', () => {
    close(reduced.intermediates.afb600Mm, 1316, 1)
    close(reduced.intermediates.afb2700Mm, 1678, 1)
    close(reduced.intermediates.afb14300Mm, 1884, 1)
    close(reduced.arcFlashBoundaryMm, 1704, 1)
  })
})

describe('Annex D.2 — 480 V VCB (low-voltage, reduced case governs)', () => {
  const cf = enclosureCorrection('VCB', 480, { heightMm: 610, widthMm: 610, depthMm: 254 }).cf
  const base = { voltageV: 480, boltedFaultKA: 45, config: 'VCB' as const, gapMm: 32, workingDistanceMm: 609.6, cf }
  const nominal = calculateCase({ ...base, arcingTimeMs: 61.3, arcingCase: 'nominal' })
  const reduced = calculateCase({ ...base, arcingTimeMs: 319, arcingCase: 'reduced' })

  it('nominal: I_arc_600 (D.82), I_arc (D.84), E (D.91), AFB (D.95)', () => {
    close(nominal.intermediates.iArc600KA, 32.449)
    close(nominal.arcingCurrentKA, 28.793)
    close(nominal.incidentEnergyJcm2, 11.585)
    close(nominal.arcFlashBoundaryMm, 1029, 1)
  })

  it('variation correction factor (D.96) and reduction factor (D.97)', () => {
    close(variationCorrectionFactor('VCB', 0.48), 0.247)
    close(reduced.intermediates.reductionFactor, 0.877)
  })

  it('reduced: I_arc (D.99), E (D.103), AFB', () => {
    close(reduced.arcingCurrentKA, 25.244)
    close(reduced.incidentEnergyJcm2, 53.156)
    close(reduced.arcFlashBoundaryMm, 2669, 1)
  })

  it('reports energy in cal/cm² as J/cm² ÷ 4.184', () => {
    expect(reduced.incidentEnergyCalcm2).toBeCloseTo(53.156 / 4.184, 2)
  })
})
