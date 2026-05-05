import { describe, it, expect } from 'vitest'
import { analyzeAutotransformer } from '@/lib/calculations/motor-starting/methods/autotransformer'
import { analyzeDol } from '@/lib/calculations/motor-starting/methods/dol'
import { getThermalDefaultByHp } from '@/lib/calculations/motor-starting/motorStartingData'
import type { AutotransformerConfig, DolConfig, Load, Motor } from '@/types/motor-starting'

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

describe('analyzeAutotransformer', () => {
  for (const tap of [0.50, 0.65, 0.80] as const) {
    it(`tap ${tap}: line-side current = a² × LRA, motor-side = a × LRA`, () => {
      const dol = analyzeDol({ ...baseArgs, config: { method: 'DOL' } as DolConfig })
      const at = analyzeAutotransformer({
        ...baseArgs,
        config: { method: 'AUTOTRANSFORMER', autotransformerTap: tap } as AutotransformerConfig,
      })
      expect(at.startingCurrentLineAmps).toBeCloseTo(dol.startingCurrentLineAmps * tap * tap, 1)
      expect(at.startingCurrentMotorAmps).toBeCloseTo(dol.startingCurrentLineAmps * tap, 1)
    })

    it(`tap ${tap}: torque = a² × T_st`, () => {
      const dol = analyzeDol({ ...baseArgs, config: { method: 'DOL' } as DolConfig })
      const at = analyzeAutotransformer({
        ...baseArgs,
        config: { method: 'AUTOTRANSFORMER', autotransformerTap: tap },
      })
      expect(at.startingTorquePctRated).toBeCloseTo(dol.startingTorquePctRated * tap * tap, 2)
    })
  }

  it('voltage dip uses LINE-side current (engineering subtlety)', () => {
    // Compare autotrans dip to DOL dip — autotrans must produce smaller dip due to a² scaling.
    const dol = analyzeDol({ ...baseArgs, config: { method: 'DOL' } as DolConfig })
    const at = analyzeAutotransformer({
      ...baseArgs,
      config: { method: 'AUTOTRANSFORMER', autotransformerTap: 0.65 },
    })
    expect(at.voltageDipAtPccPct).toBeLessThan(dol.voltageDipAtPccPct)
  })

  it('rejects tap outside {0.50, 0.65, 0.80}', () => {
    expect(() =>
      analyzeAutotransformer({
        ...baseArgs,
        // @ts-expect-error intentionally invalid
        config: { method: 'AUTOTRANSFORMER', autotransformerTap: 0.75 },
      }),
    ).toThrow()
  })

  it('cost medium, complexity medium', () => {
    const at = analyzeAutotransformer({
      ...baseArgs,
      config: { method: 'AUTOTRANSFORMER', autotransformerTap: 0.65 },
    })
    expect(at.qualitativeCost).toBe('medium')
    expect(at.qualitativeComplexity).toBe('medium')
  })
})
