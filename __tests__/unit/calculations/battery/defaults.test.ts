/**
 * Factor provenance (011-T030, carried into 015 T037): unspecified factors
 * resolve to chemistry/standard defaults with source 'default'; an override
 * flips to 'user' and changes the result.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { calculateBattery, clearCalculationCache } from '@/lib/calculations/battery'
import { toNumber } from '@/lib/mathConfig'
import type { BatteryCalculatorInputs } from '@/lib/types'

const base: BatteryCalculatorInputs = {
  voltage: 48, loadWatts: 4800, ampHours: 200, mode: 'runtime', chemistry: 'VRLA-AGM', application: 'cycling',
}

describe('defaults → source "default"', () => {
  beforeEach(() => clearCalculationCache())

  it('every applied factor is default-sourced when unspecified', () => {
    const r = calculateBattery(base)
    const f = r.appliedFactors
    for (const key of ['dod', 'temperature', 'aging', 'efficiency', 'designMargin', 'peukert'] as const) {
      expect(f[key].source, key).toBe('default')
    }
    expect(r.charger!.rechargeFactor.source).toBe('default')
  })
})

describe('override → source "user" and a different result', () => {
  beforeEach(() => clearCalculationCache())

  const cases: Array<[string, Partial<BatteryCalculatorInputs>, (r: ReturnType<typeof calculateBattery>) => string]> = [
    ['dod', { dodOverride: 0.7 }, (r) => r.appliedFactors.dod.source],
    ['temperature', { temperature: 10 }, (r) => r.appliedFactors.temperature.source],
    ['temperature override', { tempFactorOverride: 0.8 }, (r) => r.appliedFactors.temperature.source],
    ['aging', { agingFactor: 0.9 }, (r) => r.appliedFactors.aging.source],
    ['efficiency', { efficiency: 0.9 }, (r) => r.appliedFactors.efficiency.source],
    ['designMargin', { designMargin: 1.25 }, (r) => r.appliedFactors.designMargin.source],
    ['peukert', { peukertExponentOverride: 1.35 }, (r) => r.appliedFactors.peukert.source],
  ]
  for (const [name, change, sourceOf] of cases) {
    it(name, () => {
      const before = toNumber(calculateBattery(base).backupTimeHours)
      const r = calculateBattery({ ...base, ...change })
      expect(sourceOf(r)).toBe('user')
      expect(toNumber(r.backupTimeHours)).not.toBeCloseTo(before, 6)
    })
  }

  it('rechargeFactor override is user-sourced and changes the charger current', () => {
    const before = calculateBattery(base).charger!.requiredAmps
    const r = calculateBattery({ ...base, rechargeFactor: 1.3 })
    expect(r.charger!.rechargeFactor.source).toBe('user')
    expect(r.charger!.requiredAmps).toBeGreaterThan(before)
  })
})
