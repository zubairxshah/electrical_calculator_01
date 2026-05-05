import { describe, it, expect } from 'vitest'
import { analyzeDol } from '@/lib/calculations/motor-starting/methods/dol'
import { analyzeStarDelta } from '@/lib/calculations/motor-starting/methods/starDelta'
import { getThermalDefaultByHp } from '@/lib/calculations/motor-starting/motorStartingData'
import type { DolConfig, Load, Motor, StarDeltaConfig } from '@/types/motor-starting'

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

describe('analyzeStarDelta', () => {
  it('current = ⅓ × LRA, torque = ⅓ × T_st', () => {
    const dol = analyzeDol({ ...baseArgs, config: { method: 'DOL' } as DolConfig })
    const yd = analyzeStarDelta({
      ...baseArgs,
      config: { method: 'STAR_DELTA', starDeltaTransition: 'closed' } as StarDeltaConfig,
    })
    expect(yd.startingCurrentLineAmps).toBeCloseTo(dol.startingCurrentLineAmps / 3, 2)
    expect(yd.startingTorquePctRated).toBeCloseTo(dol.startingTorquePctRated / 3, 2)
  })

  it('methodNotes contains "Requires 6-lead motor"', () => {
    const yd = analyzeStarDelta({
      ...baseArgs,
      config: { method: 'STAR_DELTA', starDeltaTransition: 'closed' },
    })
    expect(yd.methodNotes.some((n) => /6-lead/.test(n))).toBe(true)
  })

  it('open transition adds transient note', () => {
    const yd = analyzeStarDelta({
      ...baseArgs,
      config: { method: 'STAR_DELTA', starDeltaTransition: 'open' },
    })
    expect(yd.methodNotes.some((n) => /transient/i.test(n))).toBe(true)
  })

  it('closed transition does not add transient note', () => {
    const yd = analyzeStarDelta({
      ...baseArgs,
      config: { method: 'STAR_DELTA', starDeltaTransition: 'closed' },
    })
    expect(yd.methodNotes.some((n) => /transient/i.test(n))).toBe(false)
  })

  it('cost low, complexity medium', () => {
    const yd = analyzeStarDelta({
      ...baseArgs,
      config: { method: 'STAR_DELTA', starDeltaTransition: 'closed' },
    })
    expect(yd.qualitativeCost).toBe('low')
    expect(yd.qualitativeComplexity).toBe('medium')
  })
})
