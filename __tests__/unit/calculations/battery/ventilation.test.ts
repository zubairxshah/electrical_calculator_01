/**
 * US5 — battery-room ventilation, EN 50272-2 / IEC 62485-2 (015 T031, G12).
 */

import { describe, it, expect } from 'vitest'
import { computeVentilation } from '@/lib/calculations/battery/ventilation'
import { calculateRuntime } from '@/lib/calculations/battery'

describe('computeVentilation', () => {
  it('VRLA, 24 cells, 200 Ah → Q float 0.24 m³/h, boost 1.92 m³/h', () => {
    const v = computeVentilation('VRLA-AGM', 24, 200)
    expect(v.applicable).toBe(true)
    expect(v.qFloatM3h).toBeCloseTo(0.24, 6)
    expect(v.qBoostM3h).toBeCloseTo(1.92, 6)
    expect(v.igasFloat).toBe(1)
    expect(v.igasBoost).toBe(8)
  })
  it('FLA uses vented I_gas (5 / 20 mA/Ah)', () => {
    const v = computeVentilation('FLA', 60, 400)
    expect(v.qFloatM3h).toBeCloseTo((0.05 * 60 * 5 * 400) / 1000, 6)
    expect(v.qBoostM3h).toBeCloseTo((0.05 * 60 * 20 * 400) / 1000, 6)
  })
  it('NiCd uses 5 / 50 mA/Ah', () => {
    expect(computeVentilation('NiCd', 92, 100).qBoostM3h).toBeCloseTo((0.05 * 92 * 50 * 100) / 1000, 6)
  })
  it('lithium and flow are not applicable', () => {
    expect(computeVentilation('Li-Ion-LFP', 15, 100).applicable).toBe(false)
    expect(computeVentilation('Flow-Vanadium', 40, 100).applicable).toBe(false)
    expect(computeVentilation('Li-Ion-LFP', 15, 100).note).toMatch(/NFPA 855/)
  })
  it('air changes per hour = Q boost / room volume', () => {
    expect(computeVentilation('VRLA-AGM', 24, 200, 30).airChangesPerHour).toBeCloseTo(1.92 / 30, 6)
  })
})

describe('engine integration', () => {
  it('counts total cells across parallel strings with per-string Ah', () => {
    // 48 V VRLA blocks → 24 cells per string; runtime describes one string of 200 Ah
    const r = calculateRuntime({ voltage: 48, loadWatts: 480, ampHours: 200, mode: 'runtime', chemistry: 'VRLA-AGM' })
    expect(r.ventilation.cells).toBe(24)
    expect(r.ventilation.ratedAh).toBe(200)
    expect(r.ventilation.qFloatM3h).toBeCloseTo(0.24, 6)
  })
})
