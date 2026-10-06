import { describe, it, expect } from 'vitest'
import { validateArcFlashInput } from '@/lib/validation/arcFlashValidation'
import type { ArcFlashInput } from '@/types/arc-flash'

const LV: ArcFlashInput = {
  equipmentId: '',
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
const MV: ArcFlashInput = { ...LV, voltageV: 4160, boltedFaultKA: 15, gapMm: 104 }

function errorsFor(input: Partial<ArcFlashInput>, base = LV) {
  const r = validateArcFlashInput({ ...base, ...input })
  return r.success ? [] : r.errors
}
const codesFor = (input: Partial<ArcFlashInput>, base = LV) => errorsFor(input, base).map((e) => e.code)

describe('validateArcFlashInput — IEEE 1584-2018 model ranges (research R7)', () => {
  it('accepts the Annex D.1 and D.2 inputs', () => {
    expect(validateArcFlashInput(LV).success).toBe(true)
    expect(validateArcFlashInput(MV).success).toBe(true)
  })

  it.each([
    [207, ['VOLTAGE_RANGE']],
    [208, []],
    [15000, []],
    [15001, ['VOLTAGE_RANGE']],
  ])('voltage %d V', (voltageV, expected) => {
    const base = voltageV > 600 ? MV : LV
    expect(codesFor({ voltageV }, base).filter((c) => c === 'VOLTAGE_RANGE')).toEqual(expected)
  })

  it.each([
    [0.49, true], [0.5, false], [106, false], [106.1, true],
  ])('208–600 V bolted fault %d kA → error: %s', (boltedFaultKA, bad) => {
    expect(codesFor({ boltedFaultKA }).includes('IBF_RANGE')).toBe(bad)
  })

  it.each([
    [0.19, true], [0.2, false], [65, false], [65.1, true],
  ])('601 V–15 kV bolted fault %d kA → error: %s', (boltedFaultKA, bad) => {
    expect(codesFor({ boltedFaultKA }, MV).includes('IBF_RANGE')).toBe(bad)
  })

  it.each([
    [6.34, true], [6.35, false], [76.2, false], [76.3, true],
  ])('208–600 V gap %d mm → error: %s', (gapMm, bad) => {
    expect(codesFor({ gapMm }).includes('GAP_RANGE')).toBe(bad)
  })

  it.each([
    [19.04, true], [19.05, false], [254, false], [254.1, true],
  ])('601 V–15 kV gap %d mm → error: %s', (gapMm, bad) => {
    expect(codesFor({ gapMm }, MV).includes('GAP_RANGE')).toBe(bad)
  })

  it.each([
    [304, true], [305, false],
  ])('working distance %d mm → error: %s', (workingDistanceMm, bad) => {
    expect(codesFor({ workingDistanceMm }).includes('WD_MIN')).toBe(bad)
  })

  it('rejects zero, negative and non-numeric values', () => {
    expect(codesFor({ arcingTimeNominalMs: 0 })).toContain('POSITIVE')
    expect(codesFor({ arcingTimeReducedMs: -5 })).toContain('POSITIVE')
    expect(codesFor({ boltedFaultKA: Number.NaN }).length).toBeGreaterThan(0)
  })

  it('requires enclosure dimensions for enclosed configurations', () => {
    expect(codesFor({ enclosure: null })).toContain('ENCLOSURE_REQUIRED')
    expect(codesFor({ enclosure: { heightMm: 0, widthMm: 610, depthMm: 254 } })).toContain('POSITIVE')
  })

  it('ignores the enclosure for open-air configurations', () => {
    expect(validateArcFlashInput({ ...LV, electrodeConfig: 'VOA', enclosure: null }).success).toBe(true)
    expect(validateArcFlashInput({ ...LV, electrodeConfig: 'HOA', enclosure: { heightMm: 0, widthMm: 0, depthMm: 0 } }).success).toBe(true)
  })

  it('requires a table row when the table method is selected', () => {
    expect(codesFor({ ppeMethod: 'table', tableRowId: null })).toContain('TABLE_ROW_REQUIRED')
    expect(codesFor({ ppeMethod: 'table', tableRowId: 'panelboard-le240' })).not.toContain('TABLE_ROW_REQUIRED')
  })

  it('names the violated limit and its clause in every message (SC-004)', () => {
    const errs = errorsFor({ boltedFaultKA: 120 })
    expect(errs[0].message).toContain('0.5')
    expect(errs[0].message).toContain('106')
    expect(errs[0].clause).toMatch(/IEEE 1584-2018/)
    for (const e of errorsFor({ voltageV: 100, gapMm: 1, workingDistanceMm: 10 })) {
      expect(e.clause.length).toBeGreaterThan(0)
    }
  })
})
