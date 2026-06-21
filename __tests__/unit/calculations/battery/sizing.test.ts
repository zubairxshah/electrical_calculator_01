/**
 * Sizing engine tests (T023) — reverse sizing accuracy and the round-trip
 * guarantee (G2): a sized bank fed back through runtime meets/exceeds target.
 */

import { describe, it, expect } from 'vitest'
import { calculateRuntime, sizeForRuntime } from '@/lib/calculations/battery'
import { toNumber } from '@/lib/mathConfig'
import { SIZING_FIXTURES } from '@/lib/calculations/battery/__tests__/fixtures'
import type { BatteryCalculatorInputs, BatteryChemistry } from '@/lib/types'

function withinPct(actual: number, expected: number, pct: number) {
  expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(pct / 100)
}

describe('sizeForRuntime — approved sizing fixtures', () => {
  for (const fx of SIZING_FIXTURES) {
    it(fx.name, () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: fx.inputs.voltage,
        loadWatts: fx.inputs.loadWatts,
        targetBackupHours: fx.inputs.targetBackupHours,
        chemistry: fx.inputs.chemistry as BatteryChemistry,
        temperature: fx.inputs.temperature,
        agingFactor: fx.inputs.agingFactor,
        cellBlockVoltage: fx.inputs.cellBlockVoltage,
        unitCapacityAh: fx.inputs.perUnitAh,
        mode: 'sizing',
      }
      const r = sizeForRuntime(inputs)
      withinPct(toNumber(r.requiredCapacityAh!), fx.expected.requiredCapacityAh, fx.tolerancePct)
      expect(r.bankConfig.cellsInSeries).toBe(fx.expected.cellsInSeries)
      expect(r.bankConfig.stringsInParallel).toBe(fx.expected.stringsInParallel)
    })
  }
})

describe('G2 — round-trip (sizing → runtime ≥ target)', () => {
  const cases: Array<{ chemistry: BatteryChemistry; target: number }> = [
    { chemistry: 'VRLA-AGM', target: 4 },
    { chemistry: 'Li-Ion-LFP', target: 8 },
    { chemistry: 'NiCd', target: 2 },
    { chemistry: 'FLA', target: 6 },
  ]
  for (const c of cases) {
    it(`${c.chemistry} sized for ${c.target}h delivers >= ${c.target}h`, () => {
      const sized = sizeForRuntime({
        voltage: 48, loadWatts: 1000, targetBackupHours: c.target, chemistry: c.chemistry, mode: 'sizing',
      })
      const back = calculateRuntime({
        voltage: 48, loadWatts: 1000, ampHours: sized.bankConfig.nameplateBankAh, chemistry: c.chemistry, mode: 'runtime',
      })
      expect(toNumber(back.backupTimeHours)).toBeGreaterThanOrEqual(c.target - 1e-6)
    })
  }
})
