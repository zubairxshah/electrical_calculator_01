/**
 * US1 — application mode, conversion efficiency, design margin (015 T011).
 * G6, G7, G8 + approved standby fixtures S1–S3 (±2 %) + SC-002.
 */

import { describe, it, expect } from 'vitest'
import { sizeForRuntime, calculateRuntime } from '@/lib/calculations/battery'
import { resolveBaseFactors, dodFactor, efficiencyFactor, designMarginFactor } from '@/lib/calculations/battery/derating'
import { getBatteryTypeById, ALL_BATTERY_TYPES } from '@/lib/standards/batteryTypes'
import { toNumber } from '@/lib/mathConfig'
import { STANDBY_SIZING_FIXTURES } from '@/lib/calculations/battery/__tests__/fixtures'
import type { BatteryCalculatorInputs, BatteryChemistry } from '@/lib/types'

const agm = getBatteryTypeById('VRLA-AGM')!

function inputs(o: Partial<BatteryCalculatorInputs> = {}): BatteryCalculatorInputs {
  return { voltage: 48, loadWatts: 480, mode: 'runtime', chemistry: 'VRLA-AGM', ...o }
}

describe('G6 — DoD by application', () => {
  it('standby is the default and applies DoD = 1 for every chemistry', () => {
    for (const p of ALL_BATTERY_TYPES) {
      const f = dodFactor(inputs({ chemistry: p.id }), p)
      expect(f.value).toBe(1)
      expect(f.source).toBe('default')
      expect(f.standardReference).toMatch(/IEEE 485/)
    }
  })
  it('cycling applies the chemistry recommended DoD', () => {
    expect(dodFactor(inputs({ application: 'cycling' }), agm).value).toBeCloseTo(0.5, 6)
  })
  it('standby ignores a cycling DoD override', () => {
    expect(dodFactor(inputs({ dodOverride: 0.6 }), agm).value).toBe(1)
  })
})

describe('G7 — conversion efficiency, never round-trip', () => {
  it('defaults to 0.95 for AC loads (default load type)', () => {
    const f = efficiencyFactor(inputs(), agm)
    expect(f.value).toBeCloseTo(0.95, 6)
    expect(f.source).toBe('default')
  })
  it('defaults to 1.00 for DC loads', () => {
    expect(efficiencyFactor(inputs({ loadType: 'dc' }), agm).value).toBe(1)
  })
  it('is independent of chemistry round-trip efficiency', () => {
    for (const p of ALL_BATTERY_TYPES) {
      expect(efficiencyFactor(inputs({ chemistry: p.id }), p).value).toBeCloseTo(0.95, 6)
    }
  })
  it('honours a user override', () => {
    const f = efficiencyFactor(inputs({ efficiency: 0.9 }), agm)
    expect(f.value).toBe(0.9)
    expect(f.source).toBe('user')
  })
})

describe('design margin', () => {
  it('defaults to 1.10', () => {
    const f = designMarginFactor(inputs())
    expect(f.value).toBeCloseTo(1.1, 6)
    expect(f.source).toBe('default')
  })
  it('honours a user value', () => {
    expect(designMarginFactor(inputs({ designMargin: 1.25 })).source).toBe('user')
  })
})

describe('G8 — fraction = dod × temp × aging × eff / designMargin', () => {
  it('standby AGM @ 25 °C, AC load', () => {
    const r = resolveBaseFactors(inputs({ temperature: 25 }), agm)
    expect(r.fraction).toBeCloseTo((1 * 1 * 0.8 * 0.95) / 1.1, 6)
  })
  it('cycling AGM @ 25 °C, DC load, margin 1.0', () => {
    const r = resolveBaseFactors(inputs({ application: 'cycling', loadType: 'dc', designMargin: 1 }), agm)
    expect(r.fraction).toBeCloseTo(0.5 * 0.8, 6)
  })
})

describe('approved standby fixtures (±2 %)', () => {
  for (const fx of STANDBY_SIZING_FIXTURES) {
    it(fx.name, () => {
      const r = sizeForRuntime({
        ...fx.inputs,
        chemistry: fx.inputs.chemistry as BatteryChemistry,
        mode: 'sizing',
      })
      const ah = toNumber(r.requiredCapacityAh!)
      expect(Math.abs(ah - fx.expectedAh) / fx.expectedAh).toBeLessThanOrEqual(0.02)
      expect(r.application).toBe('standby')
    })
  }
})

describe('SC-002 — standby no longer double-counts', () => {
  it('48 V / 2 kW / 2 h VRLA standby needs ≤ 60 % of the 011 (cycling + round-trip) size', () => {
    const common = {
      voltage: 48, loadWatts: 2000, targetBackupHours: 2, chemistry: 'VRLA-AGM' as const,
      mode: 'sizing' as const, temperature: 25,
    }
    const v2 = toNumber(sizeForRuntime(common).requiredCapacityAh!)
    const v1 = toNumber(
      sizeForRuntime({ ...common, application: 'cycling', efficiency: 0.85, designMargin: 1 }).requiredCapacityAh!
    )
    expect(v2 / v1).toBeLessThanOrEqual(0.6)
  })
})

describe('runtime result carries the application', () => {
  it('cycling', () => {
    expect(calculateRuntime(inputs({ ampHours: 200, application: 'cycling' })).application).toBe('cycling')
  })
})
