import { describe, it, expect } from 'vitest'
import { calculateSchedule, imbalancePct, neutralCurrent } from '@/lib/calculations/panel-schedule/schedule'
import { getSystem } from '@/lib/calculations/panel-schedule/system'
import { ckt, exampleA, panel } from './helpers'

const SQRT3 = Math.sqrt(3)
const phaseVA = (r: ReturnType<typeof calculateSchedule>) => r.summary.perPhase.map((p) => p.va)

describe('calculateSchedule — quickstart Example A (208Y/120)', () => {
  const r = calculateSchedule(exampleA())

  it('per-phase VA', () => {
    expect(phaseVA(r)).toEqual([7640, 9200, 8400])
    expect(r.summary.totalVA).toBe(25240)
    expect(r.summary.averageVA).toBeCloseTo(8413.333, 3)
  })
  it('per-phase current = VA / V_LN', () => {
    const cur = r.summary.perPhase.map((p) => p.currentA)
    expect(cur[0]).toBeCloseTo(63.667, 3)
    expect(cur[1]).toBeCloseTo(76.667, 3)
    expect(cur[2]).toBeCloseTo(70.0, 3)
  })
  it('total current = S / (√3 · V_LL)', () => {
    expect(r.summary.totalCurrentA).toBeCloseTo(25240 / (SQRT3 * 208), 6)
    expect(r.summary.totalCurrentA).toBeCloseTo(70.06, 2)
  })
  it('imbalance 9.35% within the 10% target', () => {
    expect(r.summary.imbalancePct).toBeCloseTo(9.350, 3)
    expect(r.summary.imbalanceOk).toBe(true)
    expect(r.warnings.some((w) => w.code === 'IMBALANCE_HIGH')).toBe(false)
  })
  it('neutral estimate from 1-pole loads only = 11.84 A', () => {
    expect(r.summary.neutralCurrentA).toBeCloseTo(11.837, 3)
  })
  it('circuit loads carry spaces, phases and split VA', () => {
    const wh = r.circuitLoads.find((c) => c.circuitId === 'WH3')!
    expect(wh.spaces).toEqual([3, 5])
    expect(wh.phases).toEqual(['B', 'C'])
    expect(wh.vaPerPhase).toEqual({ B: 2400, C: 2400 })
    expect(wh.currentA).toBeCloseTo(4800 / 208, 9)
    const rtu = r.circuitLoads.find((c) => c.circuitId === 'RTU7')!
    expect(rtu.phases).toEqual(['A', 'B', 'C'])
    expect(rtu.vaPerPhase).toEqual({ A: 5000, B: 5000, C: 5000 })
  })
  it('space counts', () => {
    expect(r.summary.usedSpaces).toBe(9)
    expect(r.summary.freeSpaces).toBe(33)
  })
  it('deviation per phase', () => {
    expect(r.summary.perPhase[1].deviationPct).toBeCloseTo(9.350, 3)
    expect(r.summary.perPhase[0].deviationPct).toBeCloseTo(-9.192, 3)
  })
})

describe('calculateSchedule — other systems', () => {
  it('120/240 1φ 3W splits 2-pole loads across A and B', () => {
    const r = calculateSchedule(panel({
      systemType: 'nec-1ph-3w-120-240',
      circuits: [ckt({ loadValue: 1200, startSpace: 1 }), ckt({ loadValue: 4800, poles: 2, startSpace: 2 })],
    }))
    expect(phaseVA(r)).toEqual([3600, 2400])
    expect(r.summary.perPhase.map((p) => p.label)).toEqual(['A', 'B'])
    expect(r.summary.totalCurrentA).toBeCloseTo(6000 / 240, 9)
    expect(r.summary.neutralCurrentA).toBeCloseTo(10, 9) // |10 − 0|
  })
  it('IEC 400Y/230 labels L1/L2/L3 and uses 230 V', () => {
    const r = calculateSchedule(panel({
      standard: 'IEC', systemType: 'iec-3ph-4w-400y230',
      circuits: [ckt({ loadValue: 2300, startSpace: 1 })],
    }))
    expect(r.summary.perPhase.map((p) => p.label)).toEqual(['L1', 'L2', 'L3'])
    expect(r.summary.perPhase[0].currentA).toBeCloseTo(10, 9)
  })
  it('3W delta has no neutral', () => {
    const r = calculateSchedule(panel({
      systemType: 'nec-3ph-3w-240d', circuits: [ckt({ loadValue: 9000, poles: 3, startSpace: 1 })],
    }))
    expect(r.summary.neutralCurrentA).toBeNull()
    expect(r.summary.perPhase[0].currentA).toBeCloseTo(3000 / (240 / SQRT3), 9)
  })
  it('1φ 2W: single phase, imbalance not applicable, neutral = line current', () => {
    const r = calculateSchedule(panel({
      standard: 'IEC', systemType: 'iec-1ph-2w-230', circuits: [ckt({ loadValue: 2300, startSpace: 1 })],
    }))
    expect(r.summary.perPhase).toHaveLength(1)
    expect(r.summary.imbalancePct).toBeNull()
    expect(r.summary.neutralCurrentA).toBeCloseTo(10, 9)
  })
})

describe('edge cases', () => {
  it('empty panel: zeros, null imbalance, no NaN', () => {
    const r = calculateSchedule(panel())
    expect(r.summary.totalVA).toBe(0)
    expect(r.summary.imbalancePct).toBeNull()
    expect(r.summary.imbalanceOk).toBe(true)
    expect(r.summary.neutralCurrentA).toBe(0)
    expect(r.summary.perPhase.every((p) => p.deviationPct === null && p.currentA === 0)).toBe(true)
  })
  it('high imbalance raises IMBALANCE_HIGH', () => {
    const r = calculateSchedule(panel({ circuits: [ckt({ loadValue: 5000, startSpace: 1 })] }))
    expect(r.summary.imbalancePct).toBeCloseTo(200, 9)
    expect(r.warnings.some((w) => w.code === 'IMBALANCE_HIGH')).toBe(true)
  })
  it('invalid placements are reported and excluded from totals', () => {
    const r = calculateSchedule(panel({
      circuits: [ckt({ id: 'a', loadValue: 1000, startSpace: 1 }), ckt({ id: 'b', loadValue: 500, startSpace: 1 })],
    }))
    expect(r.issues.map((i) => i.code)).toEqual(['OVERLAP'])
    expect(r.summary.totalVA).toBe(1000)
  })
  it('unplaced circuits (startSpace null) are excluded', () => {
    const r = calculateSchedule(panel({ circuits: [ckt({ loadValue: 1000, startSpace: null })] }))
    expect(r.summary.totalVA).toBe(0)
  })
  it('HP not in table becomes an error warning with zero load', () => {
    const r = calculateSchedule(panel({
      circuits: [ckt({ id: 'm', category: 'motor', loadValue: 12, loadUnit: 'HP', poles: 3, startSpace: 1 })],
    }))
    expect(r.warnings.find((w) => w.code === 'MOTOR_HP_NOT_IN_TABLE')?.severity).toBe('error')
    expect(r.summary.totalVA).toBe(0)
  })
  it('spaces full warning', () => {
    const r = calculateSchedule(panel({ spaces: 2, circuits: [ckt({ startSpace: 1 }), ckt({ kind: 'space', startSpace: 2 })] }))
    expect(r.warnings.some((w) => w.code === 'SPACES_FULL')).toBe(true)
  })
  it('main larger than bus warns', () => {
    const r = calculateSchedule(panel({ busRatingA: 100, mainRatingA: 125 }))
    expect(r.warnings.some((w) => w.code === 'MAIN_OVER_BUS')).toBe(true)
  })
})

describe('FR-013 continuous-load breaker check (NEC 210.20(A))', () => {
  it('1,920 VA continuous on 20 A: 16 A × 1.25 = 20 A → OK', () => {
    const r = calculateSchedule(panel({ circuits: [ckt({ loadValue: 1920, continuous: true, breakerA: 20, startSpace: 1 })] }))
    expect(r.warnings.some((w) => w.code === 'BREAKER_UNDERSIZED')).toBe(false)
  })
  it('2,000 VA continuous on 20 A → warning', () => {
    const r = calculateSchedule(panel({ circuits: [ckt({ id: 'x', loadValue: 2000, continuous: true, breakerA: 20, startSpace: 1 })] }))
    const w = r.warnings.find((w) => w.code === 'BREAKER_UNDERSIZED')
    expect(w?.circuitId).toBe('x')
    expect(r.circuitLoads[0].requiredBreakerA).toBeCloseTo(2000 / 120 * 1.25, 9)
  })
  it('non-continuous 2,300 VA on 20 A → OK (19.2 A)', () => {
    const r = calculateSchedule(panel({ circuits: [ckt({ loadValue: 2300, breakerA: 20, startSpace: 1 })] }))
    expect(r.warnings.some((w) => w.code === 'BREAKER_UNDERSIZED')).toBe(false)
  })
  it('not applied in IEC mode', () => {
    const r = calculateSchedule(panel({
      standard: 'IEC', systemType: 'iec-3ph-4w-400y230',
      circuits: [ckt({ loadValue: 4500, continuous: true, breakerA: 20, startSpace: 1 })],
    }))
    expect(r.warnings.some((w) => w.code === 'BREAKER_UNDERSIZED')).toBe(false)
  })
})

describe('helpers', () => {
  it('imbalancePct', () => {
    expect(imbalancePct([0, 0, 0])).toBeNull()
    expect(imbalancePct([100, 100, 100])).toBe(0)
    expect(imbalancePct([5])).toBeNull()
  })
  it('neutralCurrent balanced = 0', () => {
    const s = getSystem({ systemType: 'nec-3ph-4w-208y120', standard: 'NEC', customSystem: null })
    expect(neutralCurrent([10, 10, 10], s)).toBeCloseTo(0, 9)
    expect(neutralCurrent([10, 0, 0], s)).toBeCloseTo(10, 9)
  })
})
