import { describe, it, expect } from 'vitest'
import {
  TABLE_1,
  TABLE_2,
  TABLE_3,
  TABLE_5,
  TABLE_7_TYPICAL,
  TABLE_7_SHALLOW,
  ENERGY_TABLES,
  ENCLOSURE_CONSTANTS,
  TYPICAL_EQUIPMENT,
} from '@/lib/calculations/arc-flash/ieee1584Tables'

const CONFIGS = ['VCB', 'VCBB', 'HCB', 'VOA', 'HOA'] as const

describe('IEEE 1584-2018 coefficient tables', () => {
  it('Table 1 has every configuration at all three voltage levels', () => {
    for (const level of [600, 2700, 14300] as const) {
      expect(Object.keys(TABLE_1[level]).sort()).toEqual([...CONFIGS].sort())
    }
  })

  it('Tables 2, 3, 4, 5 have every configuration', () => {
    expect(Object.keys(TABLE_2).sort()).toEqual([...CONFIGS].sort())
    for (const level of [600, 2700, 14300] as const) {
      expect(Object.keys(ENERGY_TABLES[level]).sort()).toEqual([...CONFIGS].sort())
    }
  })

  it('Table 7 and enclosure constants cover only the enclosed configurations', () => {
    for (const t of [TABLE_7_TYPICAL, TABLE_7_SHALLOW, ENCLOSURE_CONSTANTS]) {
      expect(Object.keys(t).sort()).toEqual(['HCB', 'VCB', 'VCBB'])
    }
  })

  it('spot-checks coefficients against the standard', () => {
    expect(TABLE_1[600].VCB.k1).toBe(-0.04287)
    expect(TABLE_1[14300].HOA.k1).toBe(0.000904)
    expect(TABLE_3.VCB.k12).toBe(-1.598)
    expect(TABLE_5.HOA.k11).toBe(-0.05)
    expect(TABLE_7_TYPICAL.VCB).toEqual({ b1: -0.000302, b2: 0.03441, b3: 0.4325 })
    expect(ENCLOSURE_CONSTANTS.VCBB).toEqual({ A: 10, B: 24 })
  })

  it('uses the verified Table 2 VOA k7 (0.33696, not the 0.334627 typo)', () => {
    expect(TABLE_2.VOA.k7).toBe(0.33696)
  })

  it('typical equipment values follow IEEE 1584-2018 Tables 8 and 10', () => {
    const byId = Object.fromEntries(TYPICAL_EQUIPMENT.map((e) => [e.id, e]))
    expect(byId['kv15-mcc'].gapMm).toBe(152)
    expect(byId['lv-switchgear']).toMatchObject({ gapMm: 32, heightMm: 508, widthMm: 508, depthMm: 508, workingDistanceMm: 609.6 })
    expect(byId['lv-mcc-panel-shallow'].depthMm).toBeLessThanOrEqual(203.2)
    expect(byId['lv-mcc-panel-deep'].depthMm).toBeGreaterThan(203.2)
    expect(TYPICAL_EQUIPMENT).toHaveLength(10)
  })
})
