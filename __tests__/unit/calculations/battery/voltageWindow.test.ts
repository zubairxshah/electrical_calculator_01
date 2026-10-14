/**
 * US2 — voltage window, end voltage and cell count (015 T020, G10).
 */

import { describe, it, expect } from 'vitest'
import { computeVoltageWindow } from '@/lib/calculations/battery/voltageWindow'
import { calculateRuntime, sizeForRuntime } from '@/lib/calculations/battery'
import type { BatteryCalculatorInputs } from '@/lib/types'

function inputs(o: Partial<BatteryCalculatorInputs> = {}): BatteryCalculatorInputs {
  return { voltage: 125, loadWatts: 5000, ampHours: 200, mode: 'runtime', chemistry: 'FLA', ...o }
}

describe('computeVoltageWindow', () => {
  it('125 V system, 105 V minimum, lead-acid 1.75 V/cell → 60 cells', () => {
    const w = computeVoltageWindow(inputs({ minLoadVoltage: 105 }))
    expect(w.source).toBe('window')
    expect(w.cellsInSeries).toBe(60)
    expect(w.endVoltagePerCell).toBe(1.75)
    expect(w.nominalBankV).toBeCloseTo(120, 6)
    expect(w.floatBankV).toBeCloseTo(135, 6) // 60 × 2.25
    expect(w.endBankV).toBeCloseTo(105, 6)
  })
  it('uses a user end voltage override', () => {
    const w = computeVoltageWindow(inputs({ minLoadVoltage: 105, endVoltagePerCell: 1.8 }))
    expect(w.cellsInSeries).toBe(58) // floor(105 / 1.8)
  })
  it('falls back to the block count without a window', () => {
    const w = computeVoltageWindow(inputs({ voltage: 48, chemistry: 'VRLA-AGM' }))
    expect(w.source).toBe('block')
    expect(w.cellsInSeries).toBe(24) // 4 blocks × 6 cells
    expect(w.nominalBankV).toBeCloseTo(48, 6)
  })
  it('uses the chemistry default end voltage (NiCd 1.14)', () => {
    const w = computeVoltageWindow(inputs({ chemistry: 'NiCd', minLoadVoltage: 105 }))
    expect(w.endVoltagePerCell).toBe(1.14)
    expect(w.cellsInSeries).toBe(92)
  })
  it('never returns fewer than 1 cell', () => {
    expect(computeVoltageWindow(inputs({ minLoadVoltage: 1 })).cellsInSeries).toBe(1)
  })
})

describe('engine integration', () => {
  it('raises an error-level voltage-window warning when float exceeds max', () => {
    const r = calculateRuntime(inputs({ minLoadVoltage: 105, maxLoadVoltage: 130 })) // 135 V float
    const w = r.warnings.find((x) => x.type === 'voltage-window')
    expect(w?.severity).toBe('error')
    expect(r.verdict).toBe('fail')
    expect(r.voltageWindow.cellsInSeries).toBe(60)
  })
  it('no warning when float is within max', () => {
    const r = calculateRuntime(inputs({ minLoadVoltage: 105, maxLoadVoltage: 140 }))
    expect(r.warnings.some((x) => x.type === 'voltage-window')).toBe(false)
  })
  it('sizing bank cellsInSeries follows the window', () => {
    const r = sizeForRuntime({ ...inputs({ minLoadVoltage: 105 }), mode: 'sizing', targetBackupHours: 2 })
    expect(r.bankConfig.cellsInSeries).toBe(60)
  })
})
