import { describe, it, expect } from 'vitest'
import { analyzeDol } from '@/lib/calculations/motor-starting/methods/dol'
import { getThermalDefaultByHp } from '@/lib/calculations/motor-starting/motorStartingData'
import type { DolConfig, Load, Motor } from '@/types/motor-starting'

function quickArgs(overrides?: Partial<{ motor: Motor; load: Load; thevenZPu: { r: number; x: number }; voltageDipThresholdPct: number }>) {
  const motor: Motor =
    overrides?.motor ?? {
      ratedPower: 100,
      powerUnit: 'HP',
      ratedVoltage: 460,
      ratedCurrent: 124,
      poles: 4,
      efficiency: 0.93,
      powerFactor: 0.86,
      serviceFactor: 1.15,
      designClass: 'B',
      codeLetter: 'G',
    }
  const load: Load = overrides?.load ?? {
    torqueProfile: 'quadratic_fan_pump',
    breakawayTorquePerRated: 0.20,
    inertia: 45,
    inertiaUnit: 'lb_ft2',
  }
  return {
    motor,
    load,
    thevenZPu: overrides?.thevenZPu ?? { r: 0.05, x: 0.08 },
    thevenZUpToPccPu: { r: 0.01, x: 0.057 },
    baseKva: 1500,
    baseVoltageV: 480,
    voltageDipThresholdPct: overrides?.voltageDipThresholdPct ?? 20,
    thermalDefaults: getThermalDefaultByHp(100),
    config: { method: 'DOL' } as DolConfig,
  }
}

describe('analyzeDol', () => {
  it('returns full LRA with code G ≈ 5.95 kVA/HP × 100 HP / (√3 × 460) ≈ 746 A', () => {
    const r = analyzeDol(quickArgs())
    expect(r.startingCurrentLineAmps).toBeGreaterThan(700)
    expect(r.startingCurrentLineAmps).toBeLessThan(800)
  })

  it('starting current % FLA ≈ kvaPerHp / (FLA × √3 × V / 1000)', () => {
    const r = analyzeDol(quickArgs())
    expect(r.startingCurrentPctFla).toBeGreaterThan(550)
    expect(r.startingCurrentPctFla).toBeLessThan(700)
  })

  it('starting torque pct rated > 0', () => {
    const r = analyzeDol(quickArgs())
    expect(r.startingTorquePctRated).toBeGreaterThan(0)
  })

  it('cost low, complexity low', () => {
    const r = analyzeDol(quickArgs())
    expect(r.qualitativeCost).toBe('low')
    expect(r.qualitativeComplexity).toBe('low')
  })

  it('verdictBadge passes when threshold high', () => {
    const r = analyzeDol(quickArgs({ voltageDipThresholdPct: 50 }))
    expect(r.voltageDipPasses1668).toBe(true)
  })

  it('verdictBadge fails when threshold tiny', () => {
    const r = analyzeDol(quickArgs({ voltageDipThresholdPct: 0.1 }))
    expect(r.voltageDipPasses1668).toBe(false)
    expect(r.verdictBadge).toBe('excessive_dip')
  })

  it('uses lockedRotorAmps override when provided', () => {
    const motor: Motor = {
      ratedPower: 100,
      powerUnit: 'HP',
      ratedVoltage: 460,
      ratedCurrent: 124,
      poles: 4,
      efficiency: 0.93,
      powerFactor: 0.86,
      serviceFactor: 1.15,
      designClass: 'B',
      lockedRotorAmps: 900,
    }
    const r = analyzeDol(quickArgs({ motor }))
    expect(r.startingCurrentLineAmps).toBe(900)
  })
})
