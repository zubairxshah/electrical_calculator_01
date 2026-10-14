/**
 * G14 — every result-affecting input changes the cache key (015 T009, research D10).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { calculateBattery, clearCalculationCache } from '@/lib/calculations/battery'
import { toNumber } from '@/lib/mathConfig'
import type { BatteryCalculatorInputs } from '@/lib/types'

const base: BatteryCalculatorInputs = {
  voltage: 48, loadWatts: 480, ampHours: 200, mode: 'runtime', chemistry: 'VRLA-AGM', temperature: 0,
}

function hours(i: BatteryCalculatorInputs) {
  return toNumber(calculateBattery(i).backupTimeHours)
}

describe('calculateBattery cache key', () => {
  beforeEach(() => clearCalculationCache())

  const variants: Array<[string, Partial<BatteryCalculatorInputs>]> = [
    ['tempFactorOverride', { tempFactorOverride: 0.5 }],
    ['peukertExponentOverride', { peukertExponentOverride: 1.5 }],
    ['designMargin', { designMargin: 1.4 }],
    ['application', { application: 'cycling' }],
    ['loadType', { loadType: 'dc' }],
  ]
  for (const [field, change] of variants) {
    it(`changing only ${field} changes the result`, () => {
      // High load so the Peukert term is active for the exponent override.
      const reference = { ...base, loadWatts: 4800 }
      const before = hours(reference)
      const after = hours({ ...reference, ...change })
      expect(after).not.toBeCloseTo(before, 6)
    })
  }
})
