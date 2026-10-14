/**
 * US3 — IEEE 485 lead-acid temperature correction table (015 T025, G9).
 */

import { describe, it, expect } from 'vitest'
import { leadAcidTcf, temperatureFactor, derivedTemperatureFactor } from '@/lib/calculations/battery/derating'
import { calculateRuntime } from '@/lib/calculations/battery'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { LEAD_ACID_TEMP_TABLE } from '@/lib/standards/batteryReference'
import type { BatteryCalculatorInputs } from '@/lib/types'

const agm = getBatteryTypeById('VRLA-AGM')!
const nicd = getBatteryTypeById('NiCd')!
const lfp = getBatteryTypeById('Li-Ion-LFP')!

function inputs(o: Partial<BatteryCalculatorInputs> = {}): BatteryCalculatorInputs {
  return { voltage: 48, loadWatts: 480, ampHours: 200, mode: 'runtime', chemistry: 'VRLA-AGM', ...o }
}

describe('leadAcidTcf', () => {
  it('is 1.00 at 25 °C', () => {
    expect(leadAcidTcf(25).tcf).toBe(1)
  })
  it('matches every table row at or below 25 °C exactly', () => {
    for (const row of LEAD_ACID_TEMP_TABLE.filter((r) => r.c <= 25)) {
      expect(leadAcidTcf(row.c).tcf).toBeCloseTo(row.tcf, 9)
    }
  })
  it('interpolates linearly between rows (0 °C ≈ 1.3986)', () => {
    expect(leadAcidTcf(0).tcf).toBeCloseTo(1.3986, 3)
  })
  it('takes no credit above 25 °C (approved conservative rule)', () => {
    expect(leadAcidTcf(35).tcf).toBe(1)
    expect(leadAcidTcf(35).clamped).toBe(false)
  })
  it('clamps below the table and flags it', () => {
    const r = leadAcidTcf(-10)
    expect(r.tcf).toBeCloseTo(1.52, 9)
    expect(r.clamped).toBe(true)
  })
  it('flags temperatures above the table range', () => {
    expect(leadAcidTcf(55).clamped).toBe(true)
  })
})

describe('temperatureFactor for lead-acid', () => {
  it('returns available fraction 1/TCF and exposes tcf', () => {
    const f = temperatureFactor(inputs({ temperature: 10 }), agm)
    expect(f.value).toBeCloseTo(1 / 1.19, 6)
    expect(f.tcf).toBeCloseTo(1.19, 6)
    expect(f.standardReference).toMatch(/IEEE 485/)
  })
  it('override still wins', () => {
    expect(temperatureFactor(inputs({ temperature: 10, tempFactorOverride: 0.9 }), agm).value).toBe(0.9)
  })
})

describe('non-lead-acid chemistries keep the 011 coefficient model', () => {
  it('NiCd at 0 °C → 1 − 0.002 × 15 = 0.97', () => {
    expect(derivedTemperatureFactor(0, nicd)).toBeCloseTo(0.97, 6)
    expect(temperatureFactor(inputs({ chemistry: 'NiCd', temperature: 0 }), nicd).tcf).toBeUndefined()
  })
  it('LFP at 25 °C → 1.0', () => {
    expect(derivedTemperatureFactor(25, lfp)).toBe(1)
  })
})

describe('clamp warning', () => {
  it('raises temperature-table-clamped below the table', () => {
    const r = calculateRuntime(inputs({ temperature: -10 }))
    expect(r.warnings.some((w) => w.type === 'temperature-table-clamped')).toBe(true)
  })
  it('no clamp warning inside the table', () => {
    const r = calculateRuntime(inputs({ temperature: 10 }))
    expect(r.warnings.some((w) => w.type === 'temperature-table-clamped')).toBe(false)
  })
})
