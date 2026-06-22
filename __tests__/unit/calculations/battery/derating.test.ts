/**
 * Derating module tests (T013). Validates per-chemistry factor functions and
 * the Peukert rate-derating against the approved spot-checks.
 */

import { describe, it, expect } from 'vitest'
import {
  dodFactor,
  temperatureFactor,
  agingFactor,
  efficiencyFactor,
  peukertDerate,
  resolveBaseFactors,
  effectivePeukertExponent,
  derivedTemperatureFactor,
  AGING_DEFAULT,
} from '@/lib/calculations/battery/derating'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import type { BatteryCalculatorInputs } from '@/lib/types'

const agm = getBatteryTypeById('VRLA-AGM')!
const lfp = getBatteryTypeById('Li-Ion-LFP')!

function baseInputs(overrides: Partial<BatteryCalculatorInputs> = {}): BatteryCalculatorInputs {
  return { voltage: 48, loadWatts: 480, mode: 'runtime', chemistry: 'VRLA-AGM', ...overrides }
}

describe('dodFactor', () => {
  it('uses chemistry recommended DoD by default', () => {
    const f = dodFactor(baseInputs(), agm)
    expect(f.value).toBeCloseTo(0.5, 6) // AGM recommended 50%
    expect(f.source).toBe('default')
  })
  it('honors a user override and marks it user-sourced', () => {
    const f = dodFactor(baseInputs({ dodOverride: 0.7 }), agm)
    expect(f.value).toBeCloseTo(0.7, 6)
    expect(f.source).toBe('user')
  })
  it('clamps an override above the chemistry maximum', () => {
    const f = dodFactor(baseInputs({ dodOverride: 0.95 }), agm)
    expect(f.value).toBeCloseTo(0.8, 6) // AGM max 80%
  })
})

describe('temperatureFactor', () => {
  it('is 1.0 within/above the optimal band', () => {
    expect(temperatureFactor(baseInputs({ temperature: 25 }), agm).value).toBeCloseTo(1.0, 6)
  })
  it('derates below the optimal band by tempCoefficient', () => {
    // AGM optimal min 20, coeff 2%/°C; at 0°C → 1 - 0.02*20 = 0.60
    expect(temperatureFactor(baseInputs({ temperature: 0 }), agm).value).toBeCloseTo(0.6, 6)
  })
  it('never drops below the floor', () => {
    expect(temperatureFactor(baseInputs({ temperature: -100 }), agm).value).toBeGreaterThanOrEqual(0.4)
  })
})

describe('agingFactor', () => {
  it('defaults to 0.8', () => {
    const f = agingFactor(baseInputs())
    expect(f.value).toBe(AGING_DEFAULT)
    expect(f.source).toBe('default')
  })
  it('marks a non-default value as user-sourced', () => {
    expect(agingFactor(baseInputs({ agingFactor: 0.9 })).source).toBe('user')
  })
})

describe('efficiencyFactor', () => {
  it('defaults to chemistry round-trip typical', () => {
    expect(efficiencyFactor(baseInputs(), agm).value).toBeCloseTo(0.85, 6) // AGM 85%
    expect(efficiencyFactor(baseInputs(), lfp).value).toBeCloseTo(0.95, 6) // LFP 95%
  })
  it('uses a user override when present', () => {
    const f = efficiencyFactor(baseInputs({ efficiency: 0.9 }), agm)
    expect(f.value).toBe(0.9)
    expect(f.source).toBe('user')
  })
})

describe('peukertDerate', () => {
  it('is 1.0 at or below the C/20 reference', () => {
    expect(peukertDerate(0.05, 1.2)).toBeCloseTo(1.0, 6) // exactly C/20
    expect(peukertDerate(0.02, 1.2)).toBeCloseTo(1.0, 6) // below C/20
  })
  it('is ~1.0 for lithium (exponent ~1.02) even at high rate', () => {
    expect(peukertDerate(0.2083, 1.02)).toBeCloseTo(0.972, 2)
  })
  it('derates lead-acid at high rate (exponent 1.2)', () => {
    expect(peukertDerate(0.2083, 1.2)).toBeCloseTo(0.752, 2)
  })
  it('is exactly 1.0 when exponent is 1.0', () => {
    expect(peukertDerate(0.5, 1.0)).toBeCloseTo(1.0, 6)
  })
})

describe('manual overrides (factor table)', () => {
  it('temperatureFactor uses a direct override over the derived value', () => {
    const f = temperatureFactor(baseInputs({ temperature: 0, tempFactorOverride: 0.9 }), agm)
    expect(f.value).toBe(0.9)
    expect(f.source).toBe('user')
    // derived (no override) would be 0.6 at 0°C
    expect(derivedTemperatureFactor(0, agm)).toBeCloseTo(0.6, 6)
  })
  it('effectivePeukertExponent uses an override over the chemistry default', () => {
    expect(effectivePeukertExponent(baseInputs(), agm).value).toBe(agm.peukertExponent)
    const o = effectivePeukertExponent(baseInputs({ peukertExponentOverride: 1.35 }), agm)
    expect(o.value).toBe(1.35)
    expect(o.source).toBe('user')
  })
})

describe('resolveBaseFactors', () => {
  it('multiplies dod × temp × aging × efficiency (AGM @ 25°C = 0.34)', () => {
    const r = resolveBaseFactors(baseInputs({ temperature: 25, agingFactor: 0.8 }), agm)
    expect(r.fraction).toBeCloseTo(0.5 * 1.0 * 0.8 * 0.85, 6) // 0.34
  })
})
