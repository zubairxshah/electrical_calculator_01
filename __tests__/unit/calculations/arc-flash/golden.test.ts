import { describe, it, expect } from 'vitest'
import { calculateCase, enclosureCorrection } from '@/lib/calculations/arc-flash/ieee1584'
import { loadGolden, type GoldenRow } from './helpers/loadGolden'

// 2,000 results from the official IEEE 1584-2018 spreadsheet (see fixture README).
// Tolerance is far stricter than the user-facing ±2% (spec SC-001); research measured 2.4e-6.
const REL_TOL = 1e-4
const rows = loadGolden()

function compute(r: GoldenRow, arcingCase: 'nominal' | 'reduced') {
  const enclosed = r.config !== 'VOA' && r.config !== 'HOA'
  const cf = enclosureCorrection(
    r.config,
    r.voltageV,
    enclosed ? { heightMm: r.heightMm, widthMm: r.widthMm, depthMm: r.depthMm } : null
  ).cf
  return calculateCase({
    voltageV: r.voltageV,
    boltedFaultKA: r.boltedFaultKA,
    config: r.config,
    gapMm: r.gapMm,
    workingDistanceMm: r.workingDistanceMm,
    arcingTimeMs: r.timeMs,
    cf,
    arcingCase,
  })
}

const relErr = (a: number, b: number) => Math.abs(a / b - 1)

describe('golden data — IEEE 1584-2018 official spreadsheet subset', () => {
  it('fixture has 2,000 rows covering all 5 configurations', () => {
    expect(rows).toHaveLength(2000)
    expect(new Set(rows.map((r) => r.config)).size).toBe(5)
  })

  for (const config of ['VCB', 'VCBB', 'HCB', 'VOA', 'HOA'] as const) {
    describe(config, () => {
      const subset = rows.filter((r) => r.config === config)
      for (const arcingCase of ['nominal', 'reduced'] as const) {
        it(`${arcingCase} case: I_arc, E and AFB within ${REL_TOL * 100}%`, () => {
          const failures: string[] = []
          for (const r of subset) {
            const got = compute(r, arcingCase)
            const want = r[arcingCase]
            const errs = {
              I_arc: relErr(got.arcingCurrentKA, want.iArcKA),
              E: relErr(got.incidentEnergyJcm2, want.eJcm2),
              AFB: relErr(got.arcFlashBoundaryMm, want.afbMm),
            }
            for (const [q, e] of Object.entries(errs)) {
              if (!(e <= REL_TOL)) failures.push(`line ${r.line} ${q} rel.err ${e}`)
            }
          }
          expect(failures.slice(0, 10)).toEqual([])
        })
      }
    })
  }
})
