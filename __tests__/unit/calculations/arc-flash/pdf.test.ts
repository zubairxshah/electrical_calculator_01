import { describe, it, expect } from 'vitest'
import { generateArcFlashPDF } from '@/lib/pdfGenerator.arcFlash'
import { buildArcFlashLabel } from '@/lib/calculations/arc-flash/label'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import { assessPpe } from '@/lib/calculations/arc-flash/ppe'
import type { ArcFlashInput, ArcFlashResult, ArcFlashStandard } from '@/types/arc-flash'

const D2: ArcFlashInput = {
  equipmentId: 'SWGR-1', projectName: 'Plant A', voltageV: 480, frequencyHz: 60, boltedFaultKA: 45,
  electrodeConfig: 'VCB', gapMm: 32, workingDistanceMm: 609.6,
  enclosure: { heightMm: 610, widthMm: 610, depthMm: 254 },
  arcingTimeNominalMs: 61.3, arcingTimeReducedMs: 319, sameTimeForBoth: false, applyTwoSecondCap: false,
  equipmentClass: 'custom', ppeMethod: 'incident-energy', tableRowId: null,
}

/** Raw (uncompressed) PDF source — text-show operators contain the drawn strings */
function pdfText(input: ArcFlashInput, standard: ArcFlashStandard = 'NEC') {
  const result = calculateArcFlash(input)
  const ppe = assessPpe(result, input, standard)
  const doc = generateArcFlashPDF(input, result, ppe, standard)
  return { doc, raw: doc.output(), result }
}

/** Copy of a result with the governing incident energy forced to a given cal/cm² value */
function withGoverningCal(result: ArcFlashResult, cal: number): ArcFlashResult {
  const governing = { ...result.governing, incidentEnergyCalcm2: cal, incidentEnergyJcm2: cal * 4.184 }
  return { ...result, governing }
}

describe('buildArcFlashLabel — NFPA 70E-2024 130.5(H)', () => {
  const result = calculateArcFlash(D2)
  const ppe = assessPpe(result, D2, 'NEC')

  it('WARNING below 40 cal/cm², DANGER at 40 cal/cm² and above', () => {
    expect(buildArcFlashLabel(D2, withGoverningCal(result, 39.99), ppe, 'NEC').signalWord).toBe('WARNING')
    expect(buildArcFlashLabel(D2, withGoverningCal(result, 40.0), ppe, 'NEC').signalWord).toBe('DANGER')
  })

  it('carries every required field', () => {
    const label = buildArcFlashLabel(D2, result, ppe, 'NEC')
    expect(label).toMatchObject({
      signalWord: 'WARNING',
      nominalVoltageV: 480,
      workingDistanceMm: 609.6,
      ppeOutcome: 3,
      minArcRatingCalcm2: 25,
      equipmentId: 'SWGR-1',
      standard: 'NEC',
    })
    expect(label.incidentEnergyJcm2).toBeCloseTo(53.156, 2)
    expect(label.arcFlashBoundaryMm).toBeCloseTo(2669, 0)
    expect(label.limitedApproachText).toBe('3 ft 6 in')
    expect(label.restrictedApproachText).toBe('1 ft 0 in')
    expect(label.date).toBe(result.calculatedAt.slice(0, 10))
  })

  it('uses the table arc flash boundary when the table method applies', () => {
    const input: ArcFlashInput = {
      ...D2, voltageV: 208, boltedFaultKA: 20, gapMm: 25, workingDistanceMm: 457.2,
      arcingTimeNominalMs: 25, arcingTimeReducedMs: 25, ppeMethod: 'table', tableRowId: 'panelboard-le240',
    }
    const r = calculateArcFlash(input)
    const label = buildArcFlashLabel(input, r, assessPpe(r, input, 'NEC'), 'NEC')
    expect(label.ppeOutcome).toBe(1)
    expect(label.arcFlashBoundaryMm).toBe(485)
  })
})

describe('generateArcFlashPDF', () => {
  it('produces at least one page with the required sections (NEC)', () => {
    const { doc, raw, result } = pdfText(D2)
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    for (const s of ['IEEE 1584-2018', 'NFPA 70E-2024', 'Governing', 'WARNING', 'PPE Category 3', 'Disclaimer', 'SWGR-1']) {
      expect(raw).toContain(s)
    }
    expect(raw).toContain(result.nominal.incidentEnergyJcm2.toFixed(2))
    expect(raw).toContain(result.reduced.incidentEnergyJcm2.toFixed(2))
  })

  it('shows DANGER when the governing energy exceeds 40 cal/cm²', () => {
    const { raw } = pdfText({ ...D2, arcingTimeReducedMs: 1500 })
    expect(raw).toContain('DANGER')
  })

  it('uses IEC 61482 wording in IEC mode', () => {
    const { raw } = pdfText(D2, 'IEC')
    expect(raw).toContain('IEC 61482')
    expect(raw).toContain('53.2 J/cm2')
    expect(raw).not.toContain('PPE Category 3')
  })
})
