// T017 — Unit tests for motor starting analysis
// Tests: motorStarting.ts analyzeMotorStarting()

import { describe, it, expect } from 'vitest'
import { analyzeMotorStarting } from '@/lib/calculations/generator-sizing/motorStarting'
import type { LoadItem, GeneratorConfig } from '@/types/generator-sizing'

// ── Helpers ─────────────────────────────────────────────────────────

function makeMotor(overrides: Partial<LoadItem> = {}): LoadItem {
  return {
    id: 'motor-1',
    name: 'Test Motor',
    type: 'motor',
    ratedPower: 37.285, // 50HP in kW
    powerInputUnit: 'kW',
    isKva: false,
    powerFactor: 0.85,
    quantity: 1,
    diversityFactor: 1.0,
    stepNumber: null,
    isMotor: true,
    motorHp: 50,
    nemaCodeLetter: 'G',
    iecLockedRotorRatio: null,
    startingMethod: 'dol',
    vfdMultiplier: null,
    softStarterMultiplier: null,
    ...overrides,
  }
}

const config60Hz: GeneratorConfig = {
  dutyType: 'standby',
  primeLoadingLimit: 0.7,
  voltage: 480,
  phases: 'three',
  frequency: 60,
  subtransientReactance: 0.15,
  fuelType: 'diesel',
  necClassification: '702',
}

const config50Hz: GeneratorConfig = {
  ...config60Hz,
  frequency: 50,
}

// ── Tests ───────────────────────────────────────────────────────────

describe('analyzeMotorStarting', () => {
  it('DOL start: full LR kVA (50HP code G = 50 x 5.95 = 297.5 kVA)', () => {
    const motors = [makeMotor()]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    expect(results).toHaveLength(1)
    expect(results[0].startingKva).toBeCloseTo(297.5, 0)
    expect(results[0].startingMethodMultiplier).toBe(1.0)
  })

  it('star-delta: 0.33× reduction', () => {
    const motors = [makeMotor({ startingMethod: 'star-delta' })]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    // 50 × 5.95 × 0.33 = 98.175
    expect(results[0].startingKva).toBeCloseTo(98.18, 0)
    expect(results[0].startingMethodMultiplier).toBe(0.33)
  })

  it('VFD with custom multiplier', () => {
    const motors = [makeMotor({ startingMethod: 'vfd', vfdMultiplier: 0.10 })]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    // 50 × 5.95 × 0.10 = 29.75
    expect(results[0].startingKva).toBeCloseTo(29.75, 0)
    expect(results[0].startingMethodMultiplier).toBe(0.10)
  })

  it('soft-starter with custom multiplier', () => {
    const motors = [makeMotor({ startingMethod: 'soft-starter', softStarterMultiplier: 0.45 })]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    // 50 × 5.95 × 0.45 = 133.875
    expect(results[0].startingKva).toBeCloseTo(133.88, 0)
    expect(results[0].startingMethodMultiplier).toBe(0.45)
  })

  it('NEMA code letter G lookup = 5.95 kVA/HP', () => {
    const motors = [makeMotor({ motorHp: 10, nemaCodeLetter: 'G' })]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    // 10 × 5.95 × 1.0 = 59.5
    expect(results[0].startingKva).toBeCloseTo(59.5, 0)
  })

  it('voltage dip calculation with Xd\'\'=0.15', () => {
    const motors = [makeMotor()]
    // startingKVA = 297.5, genKVA = 500
    // voltageDip = (0.15 × 297.5 / 500) × 100 = 8.925%
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    expect(results[0].voltageDipPercent).toBeCloseTo(8.93, 0)
  })

  it('threshold pass at 15%: motor within limit passes', () => {
    const motors = [makeMotor()]
    const results = analyzeMotorStarting(motors, 500, config60Hz, 15)

    // 8.93% < 15% → passes
    expect(results[0].passesThreshold).toBe(true)
    expect(results[0].threshold).toBe(15)
  })

  it('threshold fail at 20%: large motor on small generator fails', () => {
    // 100HP code K motor on 200kVA generator
    const motors = [makeMotor({ motorHp: 100, nemaCodeLetter: 'K' })]
    // startingKVA = 100 × 8.50 × 1.0 = 850 kVA
    // voltageDip = (0.15 × 850 / 200) × 100 = 63.75%
    const results = analyzeMotorStarting(motors, 200, config60Hz, 20)

    expect(results[0].voltageDipPercent).toBeGreaterThan(20)
    expect(results[0].passesThreshold).toBe(false)
  })

  it('IEC locked rotor ratio path (50Hz)', () => {
    const motors = [makeMotor({
      nemaCodeLetter: null,
      iecLockedRotorRatio: 6.5,
      ratedPower: 37,
    })]
    const results = analyzeMotorStarting(motors, 500, config50Hz)

    // startingKVA = 37 × 6.5 × 1.0 = 240.5
    expect(results[0].startingKva).toBeCloseTo(240.5, 0)
  })

  it('no motors returns empty array', () => {
    const loads: LoadItem[] = [{
      id: 'light-1',
      name: 'Lights',
      type: 'lighting',
      ratedPower: 50,
      powerInputUnit: 'kW',
      isKva: false,
      powerFactor: 1.0,
      quantity: 1,
      diversityFactor: 1.0,
      stepNumber: null,
      isMotor: false,
      motorHp: null,
      nemaCodeLetter: null,
      iecLockedRotorRatio: null,
      startingMethod: 'dol',
      vfdMultiplier: null,
      softStarterMultiplier: null,
    }]
    const results = analyzeMotorStarting(loads, 500, config60Hz)
    expect(results).toHaveLength(0)
  })

  it('multiple motors sorted by voltage dip (worst first)', () => {
    const motors = [
      makeMotor({ id: 'm1', motorHp: 10, name: 'Small Motor' }),
      makeMotor({ id: 'm2', motorHp: 100, name: 'Large Motor' }),
    ]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    expect(results).toHaveLength(2)
    expect(results[0].motorName).toBe('Large Motor')
    expect(results[0].voltageDipPercent).toBeGreaterThan(results[1].voltageDipPercent)
  })

  it('fallback: motor without NEMA code or IEC ratio uses HP × 5.95', () => {
    const motors = [makeMotor({
      nemaCodeLetter: null,
      iecLockedRotorRatio: null,
      motorHp: 25,
    })]
    const results = analyzeMotorStarting(motors, 500, config60Hz)

    // 25 × 5.95 × 1.0 = 148.75
    expect(results[0].startingKva).toBeCloseTo(148.75, 0)
  })
})
