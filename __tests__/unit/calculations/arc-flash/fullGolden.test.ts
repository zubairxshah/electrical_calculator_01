import { describe, it, expect } from 'vitest'
import { calculateCase, enclosureCorrection } from '@/lib/calculations/arc-flash/ieee1584'
import { loadGolden } from './helpers/loadGolden'

// Full 144,000-row check against the official IEEE 1584-2018 spreadsheet results. Not part of CI:
// runs only when scripts/arc-flash/verify-full-golden.mjs sets AF_FULL_GOLDEN to the downloaded CSV.
const FILE = process.env.AF_FULL_GOLDEN

describe.skipIf(!FILE)('full IEEE 1584-2018 golden data (144k rows)', () => {
  it('max relative error per quantity ≤ 1e-4', () => {
    const rows = loadGolden(FILE)
    const max: Record<string, { err: number; line: number }> = {}
    const track = (key: string, got: number, want: number, line: number) => {
      const err = Math.abs(got / want - 1)
      if (!max[key] || !(err <= max[key].err)) max[key] = { err, line }
    }

    for (const r of rows) {
      const enclosed = r.config !== 'VOA' && r.config !== 'HOA'
      const cf = enclosureCorrection(
        r.config,
        r.voltageV,
        enclosed ? { heightMm: r.heightMm, widthMm: r.widthMm, depthMm: r.depthMm } : null
      ).cf
      for (const arcingCase of ['nominal', 'reduced'] as const) {
        const got = calculateCase({
          voltageV: r.voltageV,
          boltedFaultKA: r.boltedFaultKA,
          config: r.config,
          gapMm: r.gapMm,
          workingDistanceMm: r.workingDistanceMm,
          arcingTimeMs: r.timeMs,
          cf,
          arcingCase,
        })
        const want = r[arcingCase]
        track(`${arcingCase} I_arc`, got.arcingCurrentKA, want.iArcKA, r.line)
        track(`${arcingCase} E`, got.incidentEnergyJcm2, want.eJcm2, r.line)
        track(`${arcingCase} AFB`, got.arcFlashBoundaryMm, want.afbMm, r.line)
      }
    }

    console.log(`\nRows checked: ${rows.length} (× 2 cases)`)
    console.table(
      Object.fromEntries(Object.entries(max).map(([k, v]) => [k, { maxRelError: v.err.toExponential(2), csvLine: v.line }]))
    )
    for (const v of Object.values(max)) expect(v.err).toBeLessThanOrEqual(1e-4)
  })
})
