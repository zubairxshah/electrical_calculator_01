/**
 * Runtime engine tests (T015) — IEEE 485 accuracy fixtures (±2%), chemistry
 * sensitivity (G1), and performance (G4).
 */

import { describe, it, expect } from 'vitest'
import { calculateRuntime } from '@/lib/calculations/battery'
import { toNumber } from '@/lib/mathConfig'
import { RUNTIME_FIXTURES } from '@/lib/calculations/battery/__tests__/fixtures'
import type { BatteryCalculatorInputs, BatteryChemistry } from '@/lib/types'

function withinPct(actual: number, expected: number, pct: number) {
  expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(pct / 100)
}

describe('calculateRuntime — approved IEEE 485 accuracy fixtures (±2%)', () => {
  for (const fx of RUNTIME_FIXTURES) {
    it(fx.name, () => {
      const inputs: BatteryCalculatorInputs = {
        ...fx.inputs,
        chemistry: fx.inputs.chemistry as BatteryChemistry,
        mode: 'runtime',
      }
      const r = calculateRuntime(inputs)
      withinPct(toNumber(r.backupTimeHours), fx.expected.backupTimeHours, fx.tolerancePct)
      withinPct(toNumber(r.effectiveCapacityAh), fx.expected.effectiveCapacityAh, fx.tolerancePct)
      expect(toNumber(r.dischargeRate)).toBeCloseTo(fx.expected.dischargeRate, 4)
    })
  }
})

describe('G1 — chemistry sensitivity (the core defect fix)', () => {
  const base = { voltage: 48, ampHours: 200, loadWatts: 480, mode: 'runtime' as const }
  it('different chemistries produce different effective capacity / runtime', () => {
    const agm = calculateRuntime({ ...base, chemistry: 'VRLA-AGM' })
    const lfp = calculateRuntime({ ...base, chemistry: 'Li-Ion-LFP' })
    expect(toNumber(agm.effectiveCapacityAh)).not.toBeCloseTo(toNumber(lfp.effectiveCapacityAh), 1)
    expect(toNumber(lfp.backupTimeHours)).toBeGreaterThan(toNumber(agm.backupTimeHours))
  })
})

describe('G4 — performance', () => {
  it('computes in well under 100ms', () => {
    const t0 = performance.now()
    calculateRuntime({ voltage: 48, ampHours: 200, loadWatts: 2000, mode: 'runtime', chemistry: 'VRLA-AGM' })
    expect(performance.now() - t0).toBeLessThan(100)
  })
})

describe('dischargeCurve population', () => {
  it('returns a monotonic non-increasing curve with >=12 points', () => {
    const r = calculateRuntime({ voltage: 48, ampHours: 200, loadWatts: 480, mode: 'runtime', chemistry: 'VRLA-AGM' })
    expect(r.dischargeCurve.length).toBeGreaterThanOrEqual(12)
    for (let i = 1; i < r.dischargeCurve.length; i++) {
      expect(r.dischargeCurve[i].socPercent).toBeLessThanOrEqual(r.dischargeCurve[i - 1].socPercent)
      expect(r.dischargeCurve[i].voltage).toBeLessThanOrEqual(r.dischargeCurve[i - 1].voltage + 1e-9)
    }
  })
})
