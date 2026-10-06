import { describe, it, expect } from 'vitest'
import { calculateCase, enclosureCorrection } from '@/lib/calculations/arc-flash/ieee1584'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import type { ArcFlashInput } from '@/types/arc-flash'
import { loadGolden } from './helpers/loadGolden'

// Two places where the IEEE spreadsheet v2.6.6 deviates from the standard's text.
// The engine follows the standard; the golden data agrees with it (research R3).
const rows = loadGolden()

function check(r: (typeof rows)[number], arcingCase: 'nominal' | 'reduced') {
  const enclosed = r.config !== 'VOA' && r.config !== 'HOA'
  const cf = enclosureCorrection(r.config, r.voltageV, enclosed ? { heightMm: r.heightMm, widthMm: r.widthMm, depthMm: r.depthMm } : null).cf
  const got = calculateCase({
    voltageV: r.voltageV, boltedFaultKA: r.boltedFaultKA, config: r.config, gapMm: r.gapMm,
    workingDistanceMm: r.workingDistanceMm, arcingTimeMs: r.timeMs, cf, arcingCase,
  })
  const want = r[arcingCase]
  expect(got.arcingCurrentKA / want.iArcKA).toBeCloseTo(1, 4)
  expect(got.incidentEnergyJcm2 / want.eJcm2).toBeCloseTo(1, 4)
  expect(got.arcFlashBoundaryMm / want.afbMm).toBeCloseTo(1, 4)
}

describe('IEEE spreadsheet v2.6.6 errata', () => {
  it('Voc = 600 V exactly uses the low-voltage path (§4.10: 208 V ≤ Voc ≤ 600 V)', () => {
    const input: ArcFlashInput = {
      equipmentId: '', projectName: '', voltageV: 600, frequencyHz: 60, boltedFaultKA: 20,
      electrodeConfig: 'VCB', gapMm: 25, workingDistanceMm: 457.2,
      enclosure: { heightMm: 508, widthMm: 508, depthMm: 508 },
      arcingTimeNominalMs: 100, arcingTimeReducedMs: 100, sameTimeForBoth: true, applyTwoSecondCap: false,
      equipmentClass: 'custom', ppeMethod: 'incident-energy', tableRowId: null,
    }
    expect(calculateArcFlash(input).modelPath).toBe('LV')
    expect(calculateArcFlash({ ...input, voltageV: 601, gapMm: 25 }).modelPath).toBe('MV')
  })

  it('600 V golden rows match (both cases)', () => {
    const at600 = rows.filter((r) => r.voltageV === 600)
    expect(at600.length).toBeGreaterThan(200)
    for (const r of at600) {
      check(r, 'nominal')
      check(r, 'reduced')
    }
  })

  it('VOA medium-voltage reduced case uses the reduced current in both k3 and k13 terms', () => {
    const voaMv = rows.filter((r) => r.config === 'VOA' && r.voltageV > 600)
    expect(voaMv.length).toBeGreaterThan(200)
    for (const r of voaMv) check(r, 'reduced')
  })
})
