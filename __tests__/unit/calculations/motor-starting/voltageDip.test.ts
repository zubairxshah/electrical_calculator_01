import { describe, it, expect } from 'vitest'
import { computeVoltageDip } from '@/lib/calculations/motor-starting/voltageDip'

describe('computeVoltageDip', () => {
  it('zero source Z → zero dip', () => {
    const r = computeVoltageDip({
      startingCurrentLineAmps: 800,
      baseKva: 1500,
      baseVoltageV: 480,
      thevenZPu: { r: 0, x: 0 },
      motorPowerFactorAtStart: 0.30,
    })
    expect(r.dipAtPccPct).toBeCloseTo(0, 6)
    expect(r.vMotorPu).toBeCloseTo(1, 6)
  })

  it('starting current = 0 → dip = 0', () => {
    const r = computeVoltageDip({
      startingCurrentLineAmps: 0,
      baseKva: 1500,
      baseVoltageV: 480,
      thevenZPu: { r: 0.1, x: 0.1 },
      motorPowerFactorAtStart: 0.30,
    })
    expect(r.dipAtPccPct).toBeCloseTo(0, 6)
    expect(r.vMotorPu).toBeCloseTo(1, 6)
  })

  it('IEEE 3002.7-style case: 100 HP on 1500 kVA with cable produces a non-trivial PCC dip in single-digit %', () => {
    // LRA ≈ 783 A, base I = 1500e3/(√3×480) ≈ 1804 A → 0.434 pu inrush
    // Z up to PCC (transformer-dominated): R ≈ 0.0095, X ≈ 0.057 → |Z| ≈ 0.058 pu
    const r = computeVoltageDip({
      startingCurrentLineAmps: 783,
      baseKva: 1500,
      baseVoltageV: 480,
      thevenZPu: { r: 0.077, x: 0.114 }, // full chain
      thevenZUpToPccPu: { r: 0.0095, x: 0.057 }, // utility + xfmr only
      motorPowerFactorAtStart: 0.30,
    })
    expect(r.dipAtPccPct).toBeGreaterThan(0)
    expect(r.dipAtPccPct).toBeLessThan(15)
  })

  it('motor terminal voltage drops more than PCC dip when cable adds Z', () => {
    const r = computeVoltageDip({
      startingCurrentLineAmps: 783,
      baseKva: 1500,
      baseVoltageV: 480,
      thevenZPu: { r: 0.077, x: 0.114 },
      thevenZUpToPccPu: { r: 0.0095, x: 0.057 },
      motorPowerFactorAtStart: 0.30,
    })
    const dipMotor = (1 - r.vMotorPu) * 100
    expect(dipMotor).toBeGreaterThan(r.dipAtPccPct)
  })

  it('higher PF (0.85) reduces dip vs low PF (0.30)', () => {
    const args = {
      startingCurrentLineAmps: 700,
      baseKva: 1500,
      baseVoltageV: 480,
      thevenZPu: { r: 0.05, x: 0.10 },
    }
    const lowPf = computeVoltageDip({ ...args, motorPowerFactorAtStart: 0.30 })
    const highPf = computeVoltageDip({ ...args, motorPowerFactorAtStart: 0.85 })
    expect(highPf.dipAtPccPct).toBeLessThan(lowPf.dipAtPccPct)
  })
})
