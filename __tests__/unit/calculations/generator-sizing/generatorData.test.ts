// T011 — Unit tests for standard generator selection and data tables
// Tests: generatorData.ts getNextStandardRating(), getLrKvaPerHp(), interpolateSfc(), unit conversions

import { describe, it, expect } from 'vitest'
import {
  getNextStandardRating,
  getLrKvaPerHp,
  interpolateSfc,
  STANDARD_RATINGS_60HZ,
  STANDARD_RATINGS_50HZ,
  NEMA_CODE_LETTERS,
  STARTING_METHOD_MULTIPLIERS,
  hpToKw,
  kwToHp,
  mToFt,
  ftToM,
  cToF,
  fToC,
  litersToGallons,
  gallonsToLiters,
} from '@/lib/calculations/generator-sizing/generatorData'

// ── getNextStandardRating ───────────────────────────────────────────

describe('getNextStandardRating', () => {
  it('exact match returns same size (60Hz)', () => {
    expect(getNextStandardRating(500, 60)).toBe(500)
  })

  it('exact match returns same size (50Hz)', () => {
    expect(getNextStandardRating(630, 50)).toBe(630)
  })

  it('between sizes returns next up (60Hz)', () => {
    // 501 kVA → next 60Hz rating is 600
    expect(getNextStandardRating(501, 60)).toBe(600)
  })

  it('between sizes returns next up (50Hz)', () => {
    // 501 kVA → next 50Hz rating is 630
    expect(getNextStandardRating(501, 50)).toBe(630)
  })

  it('exceeds max returns null (60Hz)', () => {
    expect(getNextStandardRating(5000, 60)).toBeNull()
  })

  it('exceeds max returns null (50Hz)', () => {
    expect(getNextStandardRating(5000, 50)).toBeNull()
  })

  it('50Hz vs 60Hz ratings differ for same input', () => {
    // 501 kVA: 60Hz → 600, 50Hz → 630
    const rating60 = getNextStandardRating(501, 60)
    const rating50 = getNextStandardRating(501, 50)
    expect(rating60).not.toBe(rating50)
  })

  it('smallest possible request returns smallest rating', () => {
    expect(getNextStandardRating(1, 60)).toBe(15)
    expect(getNextStandardRating(1, 50)).toBe(15)
  })

  it('ratings arrays are sorted ascending', () => {
    for (let i = 1; i < STANDARD_RATINGS_60HZ.length; i++) {
      expect(STANDARD_RATINGS_60HZ[i]).toBeGreaterThan(STANDARD_RATINGS_60HZ[i - 1])
    }
    for (let i = 1; i < STANDARD_RATINGS_50HZ.length; i++) {
      expect(STANDARD_RATINGS_50HZ[i]).toBeGreaterThan(STANDARD_RATINGS_50HZ[i - 1])
    }
  })
})

// ── getLrKvaPerHp ───────────────────────────────────────────────────

describe('getLrKvaPerHp', () => {
  it('code G returns 5.95 kVA/HP', () => {
    expect(getLrKvaPerHp('G')).toBe(5.95)
  })

  it('code A returns 1.57 kVA/HP (lowest)', () => {
    expect(getLrKvaPerHp('A')).toBe(1.57)
  })

  it('code V returns 22.40 kVA/HP (highest)', () => {
    expect(getLrKvaPerHp('V')).toBe(22.40)
  })

  it('all NEMA code letters have midpoints within min-max range', () => {
    for (const [letter, data] of Object.entries(NEMA_CODE_LETTERS)) {
      expect(data.midpoint).toBeGreaterThanOrEqual(data.min)
      expect(data.midpoint).toBeLessThanOrEqual(data.max)
    }
  })
})

// ── Starting Method Multipliers ─────────────────────────────────────

describe('STARTING_METHOD_MULTIPLIERS', () => {
  it('DOL is 1.0 (full starting current)', () => {
    expect(STARTING_METHOD_MULTIPLIERS['dol']).toBe(1.0)
  })

  it('star-delta is 0.33', () => {
    expect(STARTING_METHOD_MULTIPLIERS['star-delta']).toBe(0.33)
  })

  it('VFD is lowest at 0.30', () => {
    expect(STARTING_METHOD_MULTIPLIERS['vfd']).toBe(0.30)
  })

  it('all multipliers are between 0 and 1', () => {
    for (const val of Object.values(STARTING_METHOD_MULTIPLIERS)) {
      expect(val).toBeGreaterThan(0)
      expect(val).toBeLessThanOrEqual(1)
    }
  })
})

// ── interpolateSfc ──────────────────────────────────────────────────

describe('interpolateSfc', () => {
  it('diesel at 75% loading = 0.21 L/kW/hr', () => {
    expect(interpolateSfc(75, 'diesel')).toBe(0.21)
  })

  it('diesel at 100% loading = 0.20 L/kW/hr', () => {
    expect(interpolateSfc(100, 'diesel')).toBe(0.20)
  })

  it('diesel interpolation between 50-75% is between table values', () => {
    const sfc = interpolateSfc(62.5, 'diesel')
    expect(sfc).toBeGreaterThan(0.21)
    expect(sfc).toBeLessThan(0.24)
    // Linear midpoint: (0.24 + 0.21) / 2 = 0.225
    expect(sfc).toBeCloseTo(0.225, 3)
  })

  it('clamps below 25% to 25% value', () => {
    expect(interpolateSfc(10, 'diesel')).toBe(0.30)
  })

  it('clamps above 100% to 100% value', () => {
    expect(interpolateSfc(120, 'diesel')).toBe(0.20)
  })

  it('natural gas at 75% loading = 0.30 m3/kW/hr', () => {
    expect(interpolateSfc(75, 'natural-gas')).toBe(0.30)
  })
})

// ── Unit Conversions ────────────────────────────────────────────────

describe('unit conversions', () => {
  it('hpToKw: 1 HP = 0.7457 kW', () => {
    expect(hpToKw(1)).toBeCloseTo(0.7457, 4)
  })

  it('kwToHp: 1 kW ≈ 1.341 HP', () => {
    expect(kwToHp(1)).toBeCloseTo(1.341, 2)
  })

  it('round-trip: hpToKw(kwToHp(x)) ≈ x', () => {
    expect(hpToKw(kwToHp(100))).toBeCloseTo(100, 6)
  })

  it('mToFt: 1m = 3.28084ft', () => {
    expect(mToFt(1)).toBeCloseTo(3.28084, 4)
  })

  it('ftToM round-trip', () => {
    expect(ftToM(mToFt(100))).toBeCloseTo(100, 6)
  })

  it('cToF: 0°C = 32°F', () => {
    expect(cToF(0)).toBe(32)
  })

  it('cToF: 100°C = 212°F', () => {
    expect(cToF(100)).toBe(212)
  })

  it('fToC round-trip', () => {
    expect(fToC(cToF(25))).toBeCloseTo(25, 6)
  })

  it('litersToGallons: 3.78541L = 1 gal', () => {
    expect(litersToGallons(3.78541)).toBeCloseTo(1, 4)
  })

  it('gallonsToLiters round-trip', () => {
    expect(litersToGallons(gallonsToLiters(10))).toBeCloseTo(10, 6)
  })
})
