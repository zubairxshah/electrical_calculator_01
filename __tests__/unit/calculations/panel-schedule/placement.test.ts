import { describe, it, expect } from 'vitest'
import { validatePlacement, autoPlace, occupancyMap, canPlace } from '@/lib/calculations/panel-schedule/placement'
import { getSystem } from '@/lib/calculations/panel-schedule/system'
import { ckt } from './helpers'

const s208 = getSystem({ systemType: 'nec-3ph-4w-208y120', standard: 'NEC', customSystem: null })
const s240 = getSystem({ systemType: 'nec-1ph-3w-120-240', standard: 'NEC', customSystem: null })
const sDelta = getSystem({ systemType: 'nec-3ph-3w-240d', standard: 'NEC', customSystem: null })

const codes = (issues: { code: string }[]) => issues.map((i) => i.code)

describe('validatePlacement', () => {
  it('valid layout has no issues', () => {
    const cs = [ckt({ startSpace: 1 }), ckt({ startSpace: 3, poles: 2 }), ckt({ startSpace: 2, poles: 3 })]
    expect(validatePlacement(cs, 42, s208)).toEqual([])
  })
  it('detects overlap with the second circuit', () => {
    const a = ckt({ id: 'a', startSpace: 3, poles: 2 })
    const b = ckt({ id: 'b', startSpace: 5 })
    const issues = validatePlacement([a, b], 42, s208)
    expect(codes(issues)).toEqual(['OVERLAP'])
    expect(issues[0].circuitId).toBe('b')
  })
  it('detects out of range', () => {
    expect(codes(validatePlacement([ckt({ startSpace: 41, poles: 3 })], 42, s208))).toEqual(['OUT_OF_RANGE'])
    expect(codes(validatePlacement([ckt({ startSpace: 43 })], 42, s208))).toEqual(['OUT_OF_RANGE'])
    expect(codes(validatePlacement([ckt({ startSpace: 0 })], 42, s208))).toEqual(['OUT_OF_RANGE'])
  })
  it('rejects 3-pole on single-phase', () => {
    expect(codes(validatePlacement([ckt({ startSpace: 1, poles: 3 })], 42, s240))).toEqual(['TOO_MANY_POLES'])
  })
  it('rejects 1-pole loads on 3W delta, but allows 1-pole spares', () => {
    expect(codes(validatePlacement([ckt({ startSpace: 1 })], 42, sDelta))).toEqual(['ONE_POLE_ON_DELTA'])
    expect(validatePlacement([ckt({ startSpace: 1, kind: 'spare' })], 42, sDelta)).toEqual([])
  })
  it('spares and spaces occupy spaces too', () => {
    const issues = validatePlacement([ckt({ kind: 'space', startSpace: 1 }), ckt({ startSpace: 1 })], 42, s208)
    expect(codes(issues)).toEqual(['OVERLAP'])
  })
})

describe('autoPlace', () => {
  it('fills the lowest free spaces in number order', () => {
    const { circuits, unplaced } = autoPlace([ckt({ id: 'a' }), ckt({ id: 'b' }), ckt({ id: 'c' })], 42, s208)
    expect(circuits.map((c) => c.startSpace)).toEqual([1, 2, 3])
    expect(unplaced).toEqual([])
  })
  it('multi-pole circuits skip occupied spaces', () => {
    const fixed = ckt({ id: 'f', startSpace: 3 })
    const two = ckt({ id: 't', poles: 2 })
    const { circuits } = autoPlace([fixed, ckt({ id: 'one', startSpace: 1 }), two], 42, s208)
    // 1 and 3 taken: 2-pole on left needs n, n+2 → 5,7; right side 2,4 is free → 2
    expect(circuits.find((c) => c.id === 't')!.startSpace).toBe(2)
  })
  it('keeps already-placed circuits', () => {
    const { circuits } = autoPlace([ckt({ id: 'a', startSpace: 10 }), ckt({ id: 'b' })], 42, s208)
    expect(circuits.map((c) => c.startSpace)).toEqual([10, 1])
  })
  it('reports circuits that do not fit', () => {
    const cs = [ckt({ id: 'a', startSpace: 1 }), ckt({ id: 'b', startSpace: 2 }), ckt({ id: 'c', startSpace: 3 }), ckt({ id: 'd' }), ckt({ id: 'e', poles: 3 })]
    const { circuits, unplaced } = autoPlace(cs, 4, s208)
    expect(circuits.find((c) => c.id === 'd')!.startSpace).toBe(4)
    expect(unplaced).toEqual(['e'])
  })
})

describe('occupancyMap / canPlace', () => {
  it('maps every pole', () => {
    const map = occupancyMap([ckt({ id: 'x', startSpace: 7, poles: 3 })])
    expect([...map.keys()]).toEqual([7, 9, 11])
    expect(map.get(9)).toEqual({ circuitId: 'x', poleIndex: 1 })
  })
  it('canPlace respects range and occupancy, ignoring the circuit itself', () => {
    const cs = [ckt({ id: 'x', startSpace: 1, poles: 2 })]
    expect(canPlace(cs, 'x', 1, 2, 42)).toBe(true)
    expect(canPlace(cs, 'y', 3, 1, 42)).toBe(false)
    expect(canPlace(cs, 'y', 41, 2, 42)).toBe(false)
    expect(canPlace(cs, 'y', 2, 2, 42)).toBe(true)
  })
})
