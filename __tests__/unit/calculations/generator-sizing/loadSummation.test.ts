// T010 — Unit tests for vector power summation
// Tests: loadSummation.ts calculateLoadSummary()

import { describe, it, expect } from 'vitest'
import { calculateLoadSummary } from '@/lib/calculations/generator-sizing/loadSummation'
import type { LoadItem, GeneratorConfig } from '@/types/generator-sizing'

// ── Helpers ─────────────────────────────────────────────────────────

function makeLoad(overrides: Partial<LoadItem> = {}): LoadItem {
  return {
    id: 'load-1',
    name: 'Test Load',
    type: 'resistive',
    ratedPower: 100,
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
    ...overrides,
  }
}

const standbyConfig: GeneratorConfig = {
  dutyType: 'standby',
  primeLoadingLimit: 0.7,
  voltage: 480,
  phases: 'three',
  frequency: 60,
  subtransientReactance: 0.15,
  fuelType: 'diesel',
  necClassification: '702',
}

const primeConfig: GeneratorConfig = {
  ...standbyConfig,
  dutyType: 'prime',
  primeLoadingLimit: 0.7,
}

// ── Tests ───────────────────────────────────────────────────────────

describe('calculateLoadSummary', () => {
  it('single resistive load: kW = kVA at PF=1.0', () => {
    const loads = [makeLoad({ ratedPower: 100, powerFactor: 1.0 })]
    const result = calculateLoadSummary(loads, standbyConfig)

    expect(result.totalRunningKw).toBe(100)
    expect(result.totalRunningKva).toBe(100)
    expect(result.totalRunningKvar).toBeCloseTo(0, 1)
    expect(result.combinedPowerFactor).toBe(1)
  })

  it('mixed PF loads: kVA < arithmetic sum via vector summation', () => {
    const loads = [
      makeLoad({ id: 'l1', ratedPower: 50, powerFactor: 0.8 }),
      makeLoad({ id: 'l2', ratedPower: 30, powerFactor: 0.9 }),
    ]
    const result = calculateLoadSummary(loads, standbyConfig)

    // Arithmetic kVA sum = 50/0.8 + 30/0.9 = 62.5 + 33.33 = 95.83
    // Vector: kW=80, kVAR = 50*tan(acos(0.8)) + 30*tan(acos(0.9))
    //       = 50*0.75 + 30*0.4843 = 37.5 + 14.53 = 52.03
    // kVA = sqrt(80^2 + 52.03^2) = sqrt(6400 + 2707) = sqrt(9107) ≈ 95.43
    // Vector kVA ≤ arithmetic sum
    const arithmeticSum = 50 / 0.8 + 30 / 0.9
    expect(result.totalRunningKva).toBeLessThanOrEqual(arithmeticSum)
    expect(result.totalRunningKw).toBe(80)
  })

  it('diversity factor reduces effective demand', () => {
    const fullLoad = [makeLoad({ id: 'a', ratedPower: 100, diversityFactor: 1.0 })]
    const diverseLoad = [makeLoad({ id: 'b', ratedPower: 100, diversityFactor: 0.6 })]

    const fullResult = calculateLoadSummary(fullLoad, standbyConfig)
    const diverseResult = calculateLoadSummary(diverseLoad, standbyConfig)

    expect(diverseResult.totalRunningKw).toBe(60)
    expect(diverseResult.totalRunningKw).toBeLessThan(fullResult.totalRunningKw)
  })

  it('quantity multiplier scales demand', () => {
    const single = [makeLoad({ id: 'a', ratedPower: 50, quantity: 1 })]
    const triple = [makeLoad({ id: 'b', ratedPower: 50, quantity: 3 })]

    const singleResult = calculateLoadSummary(single, standbyConfig)
    const tripleResult = calculateLoadSummary(triple, standbyConfig)

    expect(tripleResult.totalRunningKw).toBe(150)
    expect(tripleResult.totalRunningKw).toBe(singleResult.totalRunningKw * 3)
  })

  it('zero loads throws error', () => {
    expect(() => calculateLoadSummary([], standbyConfig)).toThrow(
      'At least one load is required'
    )
  })

  it('boundary: PF=0.01 extreme low power factor', () => {
    const loads = [makeLoad({ ratedPower: 10, powerFactor: 0.01 })]
    const result = calculateLoadSummary(loads, standbyConfig)

    // kVA = kW / PF = 10 / 0.01 = 1000
    expect(result.totalRunningKva).toBeCloseTo(1000, 0)
    expect(result.combinedPowerFactor).toBeCloseTo(0.01, 2)
  })

  it('boundary: PF=1.0 purely resistive', () => {
    const loads = [makeLoad({ ratedPower: 200, powerFactor: 1.0 })]
    const result = calculateLoadSummary(loads, standbyConfig)

    expect(result.totalRunningKw).toBe(200)
    expect(result.totalRunningKva).toBe(200)
    expect(result.totalRunningKvar).toBeCloseTo(0, 1)
  })

  it('standby: loading limit is 1.0 (100%)', () => {
    const loads = [makeLoad({ ratedPower: 100 })]
    const result = calculateLoadSummary(loads, standbyConfig)

    expect(result.loadingLimit).toBe(1.0)
    expect(result.requiredGeneratorKva).toBe(100)
  })

  it('prime: loading limit applies (70% → kVA/0.7)', () => {
    const loads = [makeLoad({ ratedPower: 100 })]
    const result = calculateLoadSummary(loads, primeConfig)

    expect(result.loadingLimit).toBe(0.7)
    // requiredKva = 100 / 0.7 ≈ 142.86
    expect(result.requiredGeneratorKva).toBeCloseTo(142.86, 1)
  })

  it('per-load breakdown has correct entries', () => {
    const loads = [
      makeLoad({ id: 'l1', name: 'Pump', ratedPower: 50, powerFactor: 0.85 }),
      makeLoad({ id: 'l2', name: 'Lights', ratedPower: 20, powerFactor: 1.0, type: 'lighting' }),
    ]
    const result = calculateLoadSummary(loads, standbyConfig)

    expect(result.perLoadBreakdown).toHaveLength(2)
    expect(result.perLoadBreakdown[0].name).toBe('Pump')
    expect(result.perLoadBreakdown[1].name).toBe('Lights')
    expect(result.perLoadBreakdown[1].kvar).toBeCloseTo(0, 1)
  })

  it('isKva flag: converts kVA input to kW using PF', () => {
    const loads = [makeLoad({ ratedPower: 100, isKva: true, powerFactor: 0.8 })]
    const result = calculateLoadSummary(loads, standbyConfig)

    // kW = kVA × PF = 100 × 0.8 = 80
    expect(result.totalRunningKw).toBe(80)
    expect(result.totalRunningKva).toBeCloseTo(100, 0)
  })
})
