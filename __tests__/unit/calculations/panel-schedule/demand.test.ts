import { describe, it, expect } from 'vitest'
import {
  calculateDemand, lightingDemandNec, receptacleDemandNec, kitchenDemandNec, iecRatedDiversityFactor,
} from '@/lib/calculations/panel-schedule/demand'
import { calculateSchedule } from '@/lib/calculations/panel-schedule/schedule'
import type { Panel } from '@/types/panel-schedule'
import { ckt, panel } from './helpers'

const SQRT3 = Math.sqrt(3)
const demandOf = (p: Panel) => calculateDemand(p, calculateSchedule(p))

/** Quickstart Worked Example B */
function exampleB(): Panel {
  return panel({
    circuits: [
      ckt({ id: 'L', category: 'lighting', continuous: true, loadValue: 20000, poles: 3, breakerA: 100, startSpace: 1 }),
      ckt({ id: 'R', category: 'receptacle', loadValue: 15000, poles: 3, breakerA: 60, startSpace: 2 }),
      ckt({ id: 'M10', category: 'motor', loadValue: 10, loadUnit: 'HP', poles: 3, breakerA: 60, startSpace: 7 }),
      ckt({ id: 'M5', category: 'motor', loadValue: 5, loadUnit: 'HP', poles: 3, breakerA: 30, startSpace: 8 }),
      ckt({ id: 'H', category: 'hvac-heating', loadValue: 10000, poles: 3, breakerA: 40, startSpace: 13 }),
      ckt({ id: 'C', category: 'hvac-cooling', loadValue: 8000, poles: 3, breakerA: 40, startSpace: 14 }),
    ],
  })
}

describe('NEC table functions', () => {
  it('Table 220.42 lighting (quickstart C)', () => {
    expect(lightingDemandNec(150000, 'dwelling')).toBeCloseTo(51450, 6)
    expect(lightingDemandNec(3000, 'dwelling')).toBe(3000)
    expect(lightingDemandNec(20000, 'warehouse')).toBeCloseTo(16250, 6)
    expect(lightingDemandNec(60000, 'hospital')).toBeCloseTo(22000, 6)
    expect(lightingDemandNec(120000, 'hotel')).toBeCloseTo(59000, 6)
    expect(lightingDemandNec(10000, 'hotel')).toBeCloseTo(6000, 6)
    expect(lightingDemandNec(77777, 'other')).toBe(77777)
  })
  it('Table 220.44 receptacles', () => {
    expect(receptacleDemandNec(8000)).toBe(8000)
    expect(receptacleDemandNec(10000)).toBe(10000)
    expect(receptacleDemandNec(15000)).toBe(12500)
  })
  it('Table 220.56 kitchen with two-largest floor', () => {
    expect(kitchenDemandNec([5000, 5000, 5000, 5000])).toBeCloseTo(16000, 6)
    expect(kitchenDemandNec([8000, 8000, 1000, 1000, 1000, 1000])).toBeCloseTo(16000, 6)
    expect(kitchenDemandNec([3000, 2000])).toBe(5000)
    expect(kitchenDemandNec([4000, 4000, 4000])).toBeCloseTo(10800, 6)
    expect(kitchenDemandNec([2000, 2000, 2000, 2000, 2000])).toBeCloseTo(7000, 6)
    expect(kitchenDemandNec([])).toBe(0)
  })
  it('IEC 61439-2 rated diversity factor', () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10, 30].map(iecRatedDiversityFactor)).toEqual([1, 0.9, 0.9, 0.8, 0.8, 0.7, 0.7, 0.6, 0.6])
  })
})

describe('calculateDemand — NEC quickstart Example B', () => {
  const d = demandOf(exampleB())
  const m10 = 30.8 * 208 * SQRT3
  const m5 = 16.7 * 208 * SQRT3
  const expected = 20000 + 12500 + m10 + m5 + 0.25 * m10 + 10000 + 5000

  it('demand ≈ 67,386.8 VA', () => {
    expect(d.demandVA).toBeCloseTo(expected, 6)
    expect(d.demandVA).toBeCloseTo(67386.8, 0)
  })
  it('connected', () => {
    expect(d.connectedVA).toBeCloseTo(20000 + 15000 + m10 + m5 + 18000, 6)
  })
  it('design current ≈ 187.0 A → main 200 A, bus 225 OK, main 200 OK', () => {
    expect(d.designCurrentA).toBeCloseTo(expected / (SQRT3 * 208), 6)
    expect(d.designCurrentA).toBeCloseTo(187.0, 1)
    expect(d.recommendedMainA).toBe(200)
    expect(d.busOk).toBe(true)
    expect(d.mainOk).toBe(true)
  })
  it('lists each rule with its reference', () => {
    const refs = d.rules.map((r) => r.reference)
    expect(refs).toEqual(expect.arrayContaining([
      'NEC Table 220.42', 'NEC 220.44', 'NEC 220.60', 'NEC 430.24', 'NEC 215.2(A)(1)',
    ]))
    const sum = d.rules.reduce((a, r) => a + r.demandVA, 0)
    expect(sum).toBeCloseTo(d.demandVA, 6)
  })
})

describe('calculateDemand — NEC rules', () => {
  it('dwelling: receptacles merge into general lighting before Table 220.42', () => {
    const d = demandOf(panel({
      occupancy: 'dwelling',
      circuits: [
        ckt({ category: 'lighting', continuous: false, loadValue: 6000, poles: 3, startSpace: 1 }),
        ckt({ category: 'receptacle', loadValue: 6000, poles: 3, startSpace: 2 }),
      ],
    }))
    expect(d.demandVA).toBeCloseTo(3000 + 0.35 * 9000, 6)
    expect(d.rules.some((r) => r.reference === 'NEC 220.44')).toBe(false)
  })
  it('220.60: only the larger of heating and cooling', () => {
    const d = demandOf(panel({
      circuits: [
        ckt({ category: 'hvac-heating', loadValue: 5000, poles: 3, startSpace: 1 }),
        ckt({ category: 'hvac-cooling', loadValue: 9000, poles: 3, startSpace: 2 }),
      ],
    }))
    expect(d.demandVA).toBe(9000)
  })
  it('motor circuits ignore the continuous flag (430.24 covers them)', () => {
    const d = demandOf(panel({
      circuits: [ckt({ category: 'motor', continuous: true, loadValue: 10000, poles: 3, startSpace: 1 })],
    }))
    expect(d.demandVA).toBeCloseTo(12500, 6)
  })
  it('continuous adder uses demand-adjusted VA (warehouse lighting)', () => {
    const d = demandOf(panel({
      occupancy: 'warehouse',
      circuits: [ckt({ category: 'lighting', continuous: true, loadValue: 20000, poles: 3, startSpace: 1 })],
    }))
    expect(d.demandVA).toBeCloseTo(16250 * 1.25, 6)
  })
  it('continuous heating excluded by 220.60 adds nothing', () => {
    const d = demandOf(panel({
      circuits: [
        ckt({ category: 'hvac-heating', continuous: true, loadValue: 5000, poles: 3, startSpace: 1 }),
        ckt({ category: 'hvac-cooling', loadValue: 9000, poles: 3, startSpace: 2 }),
      ],
    }))
    expect(d.demandVA).toBe(9000)
  })
  it('all non-continuous "other" → demand = connected', () => {
    const d = demandOf(panel({
      circuits: [ckt({ loadValue: 3000, startSpace: 1 }), ckt({ loadValue: 4000, poles: 2, startSpace: 2 })],
    }))
    expect(d.demandVA).toBe(7000)
    expect(d.connectedVA).toBe(7000)
  })
  it('hotel occupancy adds the Table 220.42 note', () => {
    const d = demandOf(panel({
      occupancy: 'hotel', circuits: [ckt({ category: 'lighting', loadValue: 3000, startSpace: 1 })],
    }))
    expect(d.warnings.some((w) => w.code === 'LIGHTING_FACTOR_NOTE')).toBe(true)
  })
  it('bus and main exceeded', () => {
    const d = demandOf(panel({
      busRatingA: 100, mainRatingA: 100,
      circuits: [ckt({ loadValue: 50000, poles: 3, startSpace: 1 })],
    }))
    expect(d.busOk).toBe(false)
    expect(d.mainOk).toBe(false)
    expect(d.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['BUS_EXCEEDED', 'MAIN_EXCEEDED']))
    expect(d.recommendedMainA).toBe(150)
  })
  it('MLO panel: mainOk is null', () => {
    expect(demandOf(panel({ mainType: 'mlo', mainRatingA: null })).mainOk).toBeNull()
  })
  it('recommendation null above the largest standard rating', () => {
    const d = demandOf(panel({
      busRatingA: 6000, mainRatingA: 4000,
      circuits: [ckt({ loadValue: 2_000_000, loadUnit: 'VA', poles: 3, startSpace: 1 })],
    }))
    expect(d.recommendedMainA).toBeNull()
    expect(d.warnings.some((w) => w.code === 'MAIN_ABOVE_MAX_RATING')).toBe(true)
  })
  it('1φ 3W design current = VA / 240', () => {
    const d = demandOf(panel({
      systemType: 'nec-1ph-3w-120-240', circuits: [ckt({ loadValue: 4800, poles: 2, startSpace: 1 })],
    }))
    expect(d.designCurrentA).toBeCloseTo(20, 9)
  })
  it('empty panel → zero demand, no NaN', () => {
    const d = demandOf(panel())
    expect(d.demandVA).toBe(0)
    expect(d.designCurrentA).toBe(0)
    expect(d.rules).toEqual([])
  })
})

describe('calculateDemand — IEC', () => {
  const iec = (partial: Partial<Panel>) => panel({ standard: 'IEC', systemType: 'iec-3ph-4w-400y230', ...partial })

  it('default factors 1.0 → demand = connected (no 125 %), motor adder on', () => {
    const d = demandOf(iec({
      circuits: [
        ckt({ category: 'lighting', continuous: true, loadValue: 10000, poles: 3, startSpace: 1 }),
        ckt({ category: 'receptacle', loadValue: 6000, poles: 3, startSpace: 2 }),
      ],
    }))
    expect(d.demandVA).toBe(16000)
    expect(d.designCurrentA).toBeCloseTo(16000 / (SQRT3 * 400), 9)
  })
  it('edited factor applied', () => {
    const p = iec({ circuits: [ckt({ category: 'receptacle', loadValue: 10000, poles: 3, startSpace: 1 })] })
    p.iecDiversity = { ...p.iecDiversity, receptacle: 0.4 }
    const d = demandOf(p)
    expect(d.demandVA).toBeCloseTo(4000, 9)
    expect(d.rules[0].factorText).toContain('0.4')
  })
  it('largest motor +25 % toggle', () => {
    const circuits = [ckt({ category: 'motor', loadValue: 10000, poles: 3, startSpace: 1 })]
    expect(demandOf(iec({ circuits })).demandVA).toBeCloseTo(12500, 9)
    expect(demandOf(iec({ circuits, iecLargestMotorAdder: false })).demandVA).toBeCloseTo(10000, 9)
  })
  it('RDF applied to the subtotal when enabled', () => {
    const circuits = Array.from({ length: 4 }, (_, i) => ckt({ loadValue: 1000, startSpace: i + 1 }))
    const d = demandOf(iec({ circuits, iecApplyRdf: true }))
    expect(d.demandVA).toBeCloseTo(3200, 9)
    expect(d.rules.some((r) => r.reference === 'IEC 61439-2')).toBe(true)
  })
  it('IEC main recommendation uses the IEC series', () => {
    const d = demandOf(iec({ circuits: [ckt({ loadValue: 40000, poles: 3, startSpace: 1 })] }))
    expect(d.designCurrentA).toBeCloseTo(57.735, 3)
    expect(d.recommendedMainA).toBe(63)
  })
})
