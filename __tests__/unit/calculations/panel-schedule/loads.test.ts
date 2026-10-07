import { describe, it, expect } from 'vitest'
import { circuitVA, branchCurrent, PanelError } from '@/lib/calculations/panel-schedule/loads'
import { getSystem } from '@/lib/calculations/panel-schedule/system'
import { ckt } from './helpers'

const SQRT3 = Math.sqrt(3)
const s208 = getSystem({ systemType: 'nec-3ph-4w-208y120', standard: 'NEC', customSystem: null })
const s240 = getSystem({ systemType: 'nec-1ph-3w-120-240', standard: 'NEC', customSystem: null })
const s400 = getSystem({ systemType: 'iec-3ph-4w-400y230', standard: 'IEC', customSystem: null })
const sDelta = getSystem({ systemType: 'nec-3ph-3w-240d', standard: 'NEC', customSystem: null })

describe('circuitVA — unit conversion', () => {
  it('VA and kVA', () => {
    expect(circuitVA(ckt({ loadValue: 1500, loadUnit: 'VA' }), s208, 'NEC')).toBe(1500)
    expect(circuitVA(ckt({ loadValue: 2.5, loadUnit: 'kVA' }), s208, 'NEC')).toBe(2500)
  })
  it('W and kW divide by PF', () => {
    expect(circuitVA(ckt({ loadValue: 900, loadUnit: 'W', powerFactor: 0.9 }), s208, 'NEC')).toBeCloseTo(1000, 9)
    expect(circuitVA(ckt({ loadValue: 4, loadUnit: 'kW', powerFactor: 0.8 }), s208, 'NEC')).toBeCloseTo(5000, 9)
  })
  it('spare and space carry no load', () => {
    expect(circuitVA(ckt({ kind: 'spare', loadValue: 999 }), s208, 'NEC')).toBe(0)
    expect(circuitVA(ckt({ kind: 'space', loadValue: 999 }), s208, 'NEC')).toBe(0)
  })
})

describe('circuitVA — motors', () => {
  it('NEC 3-pole 10 HP at 208 V uses Table 430.250 (30.8 A)', () => {
    const c = ckt({ category: 'motor', loadValue: 10, loadUnit: 'HP', poles: 3 })
    expect(circuitVA(c, s208, 'NEC')).toBeCloseTo(30.8 * 208 * SQRT3, 6)
  })
  it('NEC 1-pole 1 HP at 120 V uses Table 430.248 (16 A)', () => {
    const c = ckt({ category: 'motor', loadValue: 1, loadUnit: 'HP', poles: 1 })
    expect(circuitVA(c, s208, 'NEC')).toBeCloseTo(16 * 120, 9)
  })
  it('NEC 2-pole 2 HP at 208 V uses Table 430.248 208 V column (13.2 A)', () => {
    const c = ckt({ category: 'motor', loadValue: 2, loadUnit: 'HP', poles: 2 })
    expect(circuitVA(c, s208, 'NEC')).toBeCloseTo(13.2 * 208, 9)
  })
  it('NEC 2-pole 5 HP on 120/240 V uses the 230 V column (28 A × 240 V)', () => {
    const c = ckt({ category: 'motor', loadValue: 5, loadUnit: 'HP', poles: 2 })
    expect(circuitVA(c, s240, 'NEC')).toBeCloseTo(28 * 240, 9)
  })
  it('NEC HP not in table throws MOTOR_HP_NOT_IN_TABLE', () => {
    const c = ckt({ category: 'motor', loadValue: 12, loadUnit: 'HP', poles: 3 })
    expect(() => circuitVA(c, s208, 'NEC')).toThrow(PanelError)
    try { circuitVA(c, s208, 'NEC') } catch (e) { expect((e as PanelError).code).toBe('MOTOR_HP_NOT_IN_TABLE') }
  })
  it('IEC 7.5 kW motor, η 0.9, PF 0.85 → 9,803.9 VA', () => {
    const c = ckt({ category: 'motor', loadValue: 7.5, loadUnit: 'kW', poles: 3, powerFactor: 0.85, efficiency: 0.9 })
    expect(circuitVA(c, s400, 'IEC')).toBeCloseTo(7500 / (0.9 * 0.85), 6)
  })
  it('IEC 10 HP motor → 7.457 kW shaft', () => {
    const c = ckt({ category: 'motor', loadValue: 10, loadUnit: 'HP', poles: 3, powerFactor: 0.85, efficiency: 0.9 })
    expect(circuitVA(c, s400, 'IEC')).toBeCloseTo(7457 / (0.9 * 0.85), 6)
  })
})

describe('branchCurrent (research R2)', () => {
  it('1-pole uses V_LN', () => {
    expect(branchCurrent(1200, 1, s208)).toBeCloseTo(10, 9)
    expect(branchCurrent(2300, 1, s400)).toBeCloseTo(10, 9)
  })
  it('2-pole uses V_LL', () => {
    expect(branchCurrent(4800, 2, s208)).toBeCloseTo(4800 / 208, 9)
    expect(branchCurrent(4800, 2, s240)).toBeCloseTo(20, 9)
  })
  it('3-pole uses √3·V_LL', () => {
    expect(branchCurrent(15000, 3, s208)).toBeCloseTo(15000 / (SQRT3 * 208), 9)
    expect(branchCurrent(15000, 3, sDelta)).toBeCloseTo(15000 / (SQRT3 * 240), 9)
  })
})
