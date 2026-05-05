import { describe, it, expect } from 'vitest'
import { analyzeDol } from '@/lib/calculations/motor-starting/methods/dol'
import { analyzeVfd } from '@/lib/calculations/motor-starting/methods/vfd'
import { getThermalDefaultByHp } from '@/lib/calculations/motor-starting/motorStartingData'
import type { DolConfig, Load, Motor, VfdConfig } from '@/types/motor-starting'

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

describe('analyzeVfd', () => {
  it('current ≈ 1.0–1.1 × FLA at start', () => {
    const r = analyzeVfd({ ...baseArgs, config: { method: 'VFD', vfdHasBypass: false } })
    expect(r.startingCurrentLineAmps).toBeGreaterThanOrEqual(motor.ratedCurrent)
    expect(r.startingCurrentLineAmps).toBeLessThanOrEqual(motor.ratedCurrent * 1.2)
  })

  it('PCC dip < DOL dip (near-zero)', () => {
    const dol = analyzeDol({ ...baseArgs, config: { method: 'DOL' } as DolConfig })
    const vfd = analyzeVfd({ ...baseArgs, config: { method: 'VFD', vfdHasBypass: false } })
    expect(vfd.voltageDipAtPccPct).toBeLessThan(dol.voltageDipAtPccPct)
  })

  it('bypass flag adds note', () => {
    const r = analyzeVfd({ ...baseArgs, config: { method: 'VFD', vfdHasBypass: true } as VfdConfig })
    expect(r.methodNotes.some((n) => /bypass/i.test(n))).toBe(true)
  })

  it('cost high, complexity high', () => {
    const r = analyzeVfd({ ...baseArgs, config: { method: 'VFD', vfdHasBypass: false } })
    expect(r.qualitativeCost).toBe('high')
    expect(r.qualitativeComplexity).toBe('high')
  })

  it('passes 1668 even with strict 5% threshold for sensitive loads', () => {
    const r = analyzeVfd({ ...baseArgs, voltageDipThresholdPct: 5, config: { method: 'VFD', vfdHasBypass: false } })
    expect(r.voltageDipPasses1668).toBe(true)
  })
})
