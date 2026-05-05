import { describe, it, expect } from 'vitest'
import { analyzeSoftStarter } from '@/lib/calculations/motor-starting/methods/softStarter'
import { getThermalDefaultByHp } from '@/lib/calculations/motor-starting/motorStartingData'
import type { Load, Motor, SoftStarterConfig } from '@/types/motor-starting'

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
  codeLetter: 'G',
}

const load: Load = {
  torqueProfile: 'quadratic_fan_pump',
  breakawayTorquePerRated: 0.10,
  inertia: 30,
  inertiaUnit: 'lb_ft2',
}

const baseArgs = {
  motor,
  load,
  thevenZPu: { r: 0.05, x: 0.08 },
  thevenZUpToPccPu: { r: 0.01, x: 0.057 },
  baseKva: 1500,
  baseVoltageV: 480,
  voltageDipThresholdPct: 20,
  thermalDefaults: getThermalDefaultByHp(100),
}

const cfg = (over: Partial<SoftStarterConfig> = {}): SoftStarterConfig => ({
  method: 'SOFT_STARTER',
  softStarterRampSec: 10,
  softStarterInitialVoltagePct: 30,
  softStarterCurrentLimitPctFla: 350,
  ...over,
})

describe('analyzeSoftStarter', () => {
  it('peak current capped at currentLimitPctFla × FLA', () => {
    const r = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterCurrentLimitPctFla: 200 }) })
    expect(r.startingCurrentLineAmps).toBeLessThanOrEqual(200 * motor.ratedCurrent / 100 + 0.001)
  })

  it('higher current limit allows higher peak current', () => {
    const low = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterCurrentLimitPctFla: 200 }) })
    const high = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterCurrentLimitPctFla: 500 }) })
    expect(high.startingCurrentLineAmps).toBeGreaterThanOrEqual(low.startingCurrentLineAmps)
  })

  it('initial voltage of 30% → starting torque ≈ 0.09 × T_st', () => {
    const r = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterInitialVoltagePct: 30 }) })
    // Compare ratio to a 50% initial-voltage variant
    const r50 = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterInitialVoltagePct: 50 }) })
    expect(r50.startingTorquePctRated).toBeGreaterThan(r.startingTorquePctRated)
    // V² scaling: 50²/30² = 2500/900 ≈ 2.78
    expect(r50.startingTorquePctRated / r.startingTorquePctRated).toBeCloseTo(2.78, 1)
  })

  it('clamps initial voltage outside 10–80% range', () => {
    const tooLow = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterInitialVoltagePct: 5 }) })
    const at10 = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterInitialVoltagePct: 10 }) })
    expect(tooLow.startingTorquePctRated).toBeCloseTo(at10.startingTorquePctRated, 6)
  })

  it('clamps ramp time to 0.5–60 seconds', () => {
    const r = analyzeSoftStarter({ ...baseArgs, config: cfg({ softStarterRampSec: 0 }) })
    expect(r.methodNotes.some((n) => /ramp/i.test(n))).toBe(true)
  })

  it('cost medium, complexity medium', () => {
    const r = analyzeSoftStarter({ ...baseArgs, config: cfg() })
    expect(r.qualitativeCost).toBe('medium')
    expect(r.qualitativeComplexity).toBe('medium')
  })
})
