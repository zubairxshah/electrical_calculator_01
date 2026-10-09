import { describe, it, expect } from 'vitest'
import { necMotorFlc, NEC_TABLE_430_248, NEC_TABLE_430_250 } from '@/lib/standards/motorFlc'

describe('NEC 2020 Table 430.250 — three-phase motor FLC', () => {
  it('spot checks', () => {
    expect(necMotorFlc(10, 3, 208)).toBe(30.8)
    expect(necMotorFlc(5, 3, 208)).toBe(16.7)
    expect(necMotorFlc(50, 3, 460)).toBe(65)
    expect(necMotorFlc(100, 3, 480)).toBe(124)
    expect(necMotorFlc(500, 3, 480)).toBe(590)
    expect(necMotorFlc(0.5, 3, 600)).toBe(0.9)
  })

  it('maps system voltage to the motor column', () => {
    expect(necMotorFlc(10, 3, 240)).toBe(28)
    expect(necMotorFlc(10, 3, 600)).toBe(11)
    expect(necMotorFlc(10, 3, 200)).toBe(32.2)
  })

  it('returns null outside the table', () => {
    expect(necMotorFlc(12, 3, 480)).toBeNull()
    expect(necMotorFlc(300, 3, 208)).toBeNull()
    expect(necMotorFlc(10, 3, 400)).toBeNull()
  })

  it('every row is monotonic in voltage (higher V → lower A)', () => {
    for (const row of Object.values(NEC_TABLE_430_250)) {
      const vals = [200, 208, 230, 460, 575].map((v) => row[v as 200]).filter((x): x is number => x != null)
      for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeLessThan(vals[i - 1])
    }
  })
})

describe('NEC 2020 Table 430.248 — single-phase motor FLC', () => {
  it('spot checks', () => {
    expect(necMotorFlc(1, 1, 120)).toBe(16)
    expect(necMotorFlc(5, 1, 240)).toBe(28)
    expect(necMotorFlc(2, 1, 208)).toBe(13.2)
    expect(necMotorFlc(0.5, 1, 115)).toBe(9.8)
  })

  it('returns null for 277 V (not tabulated) and out-of-table HP', () => {
    expect(necMotorFlc(1, 1, 277)).toBeNull()
    expect(necMotorFlc(15, 1, 240)).toBeNull()
  })

  it('covers 1/6 to 10 HP', () => {
    expect(Object.keys(NEC_TABLE_430_248).map(Number).sort((a, b) => a - b)[0]).toBeCloseTo(1 / 6, 6)
    expect(NEC_TABLE_430_248[10][230]).toBe(50)
  })
})
