import { describe, it, expect } from 'vitest'
import {
  approachBoundaries,
  assessPpe,
  evaluateTableMethod,
  ppeCategoryFromEnergy,
} from '@/lib/calculations/arc-flash/ppe'
import { TABLE_130_7_C_15_A, PPE_THRESHOLDS } from '@/lib/standards/nfpa70e'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import type { ArcFlashInput } from '@/types/arc-flash'

const D2: ArcFlashInput = {
  equipmentId: 'SWGR-1', projectName: '', voltageV: 480, frequencyHz: 60, boltedFaultKA: 45,
  electrodeConfig: 'VCB', gapMm: 32, workingDistanceMm: 609.6,
  enclosure: { heightMm: 610, widthMm: 610, depthMm: 254 },
  arcingTimeNominalMs: 61.3, arcingTimeReducedMs: 319, sameTimeForBoth: false, applyTwoSecondCap: false,
  equipmentClass: 'custom', ppeMethod: 'incident-energy', tableRowId: null,
}

describe('ppeCategoryFromEnergy — NFPA 70E-2024 thresholds (inclusive upper bounds)', () => {
  it.each([
    [1.0, 'below-threshold'],
    [1.19, 'below-threshold'],
    [1.2, 1],
    [3.9, 1],
    [4.0, 1],
    [4.01, 2],
    [7.5, 2],
    [8.0, 2],
    [8.01, 3],
    [20, 3],
    [25.0, 3],
    [25.01, 4],
    [39, 4],
    [40.0, 4],
    [40.01, 'danger'],
  ] as const)('%d cal/cm² → %s', (e, expected) => {
    expect(ppeCategoryFromEnergy(e)).toBe(expected)
  })

  it('minimum arc ratings are 4/8/25/40 cal/cm² (16.75/33.5/104.7/167.5 J/cm²)', () => {
    expect(PPE_THRESHOLDS.categories.map((c) => [c.category, c.minArcRatingCalcm2, c.minArcRatingJcm2])).toEqual([
      [1, 4, 16.75],
      [2, 8, 33.5],
      [3, 25, 104.7],
      [4, 40, 167.5],
    ])
  })
})

describe('approachBoundaries — NFPA 70E-2024 Table 130.4(E)(a), AC', () => {
  it('120 V: LAB 10 ft / 3 ft 6 in, RAB avoid contact', () => {
    const b = approachBoundaries(120)
    expect([Math.round(b.limitedMovableMm), Math.round(b.limitedFixedMm), b.restricted]).toEqual([3048, 1067, 'avoid-contact'])
    expect(b.limitedFixedText).toBe('3 ft 6 in')
  })

  it('480 V: LAB 10 ft / 3 ft 6 in, RAB 1 ft 0 in', () => {
    const b = approachBoundaries(480)
    expect([Math.round(b.limitedMovableMm), Math.round(b.limitedFixedMm), Math.round(b.restricted as number)]).toEqual([3048, 1067, 305])
    expect(b.restrictedText).toBe('1 ft 0 in')
  })

  it('4160 V: LAB 10 ft / 5 ft, RAB 2 ft 2 in', () => {
    const b = approachBoundaries(4160)
    expect([Math.round(b.limitedMovableMm), Math.round(b.limitedFixedMm), Math.round(b.restricted as number)]).toEqual([3048, 1524, 660])
  })

  it('boundary voltages: 150 → 50–150 V row, 151 → 151–750 V row, 751 → 751 V–15 kV row', () => {
    expect(approachBoundaries(150).restricted).toBe('avoid-contact')
    expect(Math.round(approachBoundaries(151).restricted as number)).toBe(305)
    expect(Math.round(approachBoundaries(751).restricted as number)).toBe(660)
  })
})

describe('evaluateTableMethod — NFPA 70E-2024 Table 130.7(C)(15)(a)', () => {
  const panel = { ...D2, voltageV: 208, boltedFaultKA: 20, arcingTimeNominalMs: 25, workingDistanceMm: 457.2 }

  it('has the 10 AC equipment rows', () => {
    expect(TABLE_130_7_C_15_A).toHaveLength(10)
  })

  it('panelboard ≤ 240 V within limits → Cat 1, AFB 485 mm', () => {
    expect(evaluateTableMethod('panelboard-le240', panel)).toEqual({
      rowId: 'panelboard-le240', applicable: true, category: 1, afbMm: 485, failedLimits: [],
    })
  })

  it('names each violated limit', () => {
    const r = evaluateTableMethod('panelboard-le240', { ...panel, boltedFaultKA: 30 })
    expect(r.applicable).toBe(false)
    expect(r.failedLimits.join(' ')).toMatch(/25 kA/)
    expect(evaluateTableMethod('panelboard-le240', { ...panel, workingDistanceMm: 400 }).failedLimits.join(' ')).toMatch(/455 mm/)
    expect(evaluateTableMethod('panelboard-le240', { ...panel, arcingTimeNominalMs: 40 }).failedLimits.join(' ')).toMatch(/0\.03 s/)
    expect(evaluateTableMethod('panelboard-le240', { ...panel, voltageV: 480 }).failedLimits.join(' ')).toMatch(/240 V/)
  })

  it('uses the nominal arcing time, not the reduced one', () => {
    const r = evaluateTableMethod('panelboard-le240', { ...panel, arcingTimeReducedMs: 500 })
    expect(r.applicable).toBe(true)
  })

  it('600 V class switchgear → Cat 4, AFB 6 m', () => {
    const r = evaluateTableMethod('switchgear-600', { ...D2, boltedFaultKA: 35, arcingTimeNominalMs: 500, workingDistanceMm: 457.2 })
    expect(r).toMatchObject({ applicable: true, category: 4, afbMm: 6000 })
  })

  it('metal-clad switchgear 1–15 kV needs ≥ 910 mm working distance', () => {
    const mv = { ...D2, voltageV: 13800, boltedFaultKA: 30, gapMm: 152, arcingTimeNominalMs: 200, workingDistanceMm: 914.4 }
    expect(evaluateTableMethod('metal-clad-1-15kv', mv)).toMatchObject({ applicable: true, category: 4, afbMm: 12000 })
    expect(evaluateTableMethod('metal-clad-1-15kv', { ...mv, workingDistanceMm: 600 }).applicable).toBe(false)
  })
})

describe('assessPpe', () => {
  it('Annex D.2 governing 12.70 cal/cm² → Category 3, min 25 cal/cm²', () => {
    const p = assessPpe(calculateArcFlash(D2), D2, 'NEC')
    expect(p.method).toBe('incident-energy')
    expect(p.outcome).toBe(3)
    expect(p.minArcRatingCalcm2).toBe(25)
    expect(p.minArcRatingJcm2).toBe(104.7)
    expect(p.clothing.length).toBeGreaterThan(0)
    expect(p.equipment.length).toBeGreaterThan(0)
    expect(Math.round(p.approachBoundaries.restricted as number)).toBe(305)
    expect(p.references.join(' ')).toMatch(/NFPA 70E-2024/)
  })

  it('above 40 cal/cm² → DANGER with no arc rating', () => {
    const input = { ...D2, arcingTimeReducedMs: 1500 }
    const p = assessPpe(calculateArcFlash(input), input, 'NEC')
    expect(p.outcome).toBe('danger')
    expect(p.minArcRatingCalcm2).toBeNull()
    expect(p.minArcRatingJcm2).toBeNull()
  })

  it('below 1.2 cal/cm² → below-threshold, non-melting clothing advice', () => {
    const input: ArcFlashInput = { ...D2, voltageV: 208, boltedFaultKA: 2, gapMm: 25, arcingTimeNominalMs: 5, arcingTimeReducedMs: 5 }
    const p = assessPpe(calculateArcFlash(input), input, 'NEC')
    expect(p.outcome).toBe('below-threshold')
    expect(p.minArcRatingCalcm2).toBeNull()
    expect(p.clothing.join(' ')).toMatch(/non-melting/i)
  })

  it('table method: applicable row sets the outcome from the table', () => {
    const input: ArcFlashInput = {
      ...D2, voltageV: 208, boltedFaultKA: 20, gapMm: 25, workingDistanceMm: 457.2,
      arcingTimeNominalMs: 25, arcingTimeReducedMs: 25, ppeMethod: 'table', tableRowId: 'panelboard-le240',
    }
    const p = assessPpe(calculateArcFlash(input), input, 'NEC')
    expect(p.method).toBe('table')
    expect(p.tableMethod).toMatchObject({ applicable: true, category: 1, afbMm: 485 })
    expect(p.outcome).toBe(1)
  })

  it('table method not applicable: keeps the incident energy outcome and reports why', () => {
    const input: ArcFlashInput = { ...D2, ppeMethod: 'table', tableRowId: 'panelboard-le240' }
    const p = assessPpe(calculateArcFlash(input), input, 'NEC')
    expect(p.tableMethod?.applicable).toBe(false)
    expect(p.tableMethod?.failedLimits.length).toBeGreaterThan(0)
    expect(p.outcome).toBe(3)
  })
})

describe('quickstart §3 scenarios — calculator → PPE end to end', () => {
  const run = (input: ArcFlashInput) => assessPpe(calculateArcFlash(input), input, 'NEC')

  it('§3A Annex D.2: reduced case governs → Category 3', () => {
    expect(run(D2).outcome).toBe(3)
  })

  it('§3B Annex D.1 (MV) → Category 1', () => {
    const d1: ArcFlashInput = {
      ...D2, voltageV: 4160, boltedFaultKA: 15, gapMm: 104, workingDistanceMm: 914.4,
      enclosure: { heightMm: 1143, widthMm: 762, depthMm: 508 },
      arcingTimeNominalMs: 197, arcingTimeReducedMs: 223,
    }
    expect(run(d1).outcome).toBe(1)
  })

  it('§3C D.2 with a 1500 ms reduced time → DANGER, no category', () => {
    const ppe = run({ ...D2, arcingTimeReducedMs: 1500 })
    expect(ppe.outcome).toBe('danger')
    expect(ppe.minArcRatingCalcm2).toBeNull()
    expect(ppe.clothing).toEqual([])
  })

  it('§3F table method: panelboard ≤ 240 V applies at 20 kA, not at 30 kA', () => {
    const table: ArcFlashInput = {
      ...D2, voltageV: 208, boltedFaultKA: 20, gapMm: 25, workingDistanceMm: 457.2,
      enclosure: { heightMm: 355.6, widthMm: 304.8, depthMm: 101.6 },
      arcingTimeNominalMs: 25, arcingTimeReducedMs: 25, ppeMethod: 'table', tableRowId: 'panelboard-le240',
    }
    const ok = run(table)
    expect(ok.outcome).toBe(1)
    expect(ok.tableMethod).toMatchObject({ applicable: true, afbMm: 485 })

    const notOk = run({ ...table, boltedFaultKA: 30 })
    expect(notOk.tableMethod?.applicable).toBe(false)
    expect(notOk.tableMethod?.failedLimits.join(' ')).toMatch(/exceeds 25 kA/)
    expect(notOk.references[0]).toMatch(/130\.5\(G\)/)
  })
})
