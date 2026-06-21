/**
 * Bank configuration tests (T024) — series/parallel rounding and over-capacity.
 */

import { describe, it, expect } from 'vitest'
import { computeBankConfig } from '@/lib/calculations/battery/bankConfig'

describe('computeBankConfig', () => {
  it('series = ceil(systemVoltage / cellBlockVoltage)', () => {
    expect(computeBankConfig(200, 48, 12, 100).cellsInSeries).toBe(4)
    expect(computeBankConfig(200, 48, 2, 100).cellsInSeries).toBe(24)
  })
  it('parallel strings round up to whole units', () => {
    expect(computeBankConfig(250, 48, 12, 100).stringsInParallel).toBe(3) // ceil(250/100)
    expect(computeBankConfig(200, 48, 12, 100).stringsInParallel).toBe(2)
  })
  it('discloses over-capacity from rounding up', () => {
    const cfg = computeBankConfig(250, 48, 12, 100)
    expect(cfg.nameplateBankAh).toBe(300)
    expect(cfg.overCapacityPct).toBeCloseTo(20, 5) // (300-250)/250
  })
  it('never returns zero series or strings', () => {
    const cfg = computeBankConfig(10, 12, 48, 100)
    expect(cfg.cellsInSeries).toBeGreaterThanOrEqual(1)
    expect(cfg.stringsInParallel).toBeGreaterThanOrEqual(1)
  })
})
