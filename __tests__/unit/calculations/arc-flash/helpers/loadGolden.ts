import fs from 'node:fs'
import path from 'node:path'
import type { ElectrodeConfig } from '@/types/arc-flash'

export interface GoldenCase {
  iArcKA: number
  eJcm2: number
  afbMm: number
}

export interface GoldenRow {
  line: number
  config: ElectrodeConfig
  voltageV: number
  boltedFaultKA: number
  gapMm: number
  workingDistanceMm: number
  timeMs: number
  widthMm: number
  heightMm: number
  depthMm: number
  nominal: GoldenCase
  reduced: GoldenCase
}

const FIXTURE = path.resolve(__dirname, '../../../../fixtures/arc-flash/ieee1584-golden-subset.csv')

/** Loads the IEEE 1584-2018 golden subset (see __tests__/fixtures/arc-flash/README.md). */
export function loadGolden(): GoldenRow[] {
  const [, ...lines] = fs.readFileSync(FIXTURE, 'utf8').replace(/\r/g, '').trim().split('\n')
  return lines.map((l, i) => {
    const c = l.split(',')
    const n = (k: number) => Number(c[k])
    return {
      line: i + 2,
      config: c[0] as ElectrodeConfig,
      // Fixture voltages are in kV with up to 3 decimals; round to avoid 0.208*1000 = 207.99999
      voltageV: Math.round(n(1) * 1000),
      boltedFaultKA: n(2),
      gapMm: n(3),
      workingDistanceMm: n(4),
      timeMs: n(5),
      widthMm: n(6),
      heightMm: n(7),
      depthMm: n(8),
      nominal: { iArcKA: n(9), eJcm2: n(10), afbMm: n(11) },
      reduced: { iArcKA: n(12), eJcm2: n(13), afbMm: n(14) },
    }
  })
}
