import { describe, it, expect } from 'vitest'
import { getSystem, phaseOfSpace, spacesFor, rowOfSpace } from '@/lib/calculations/panel-schedule/system'

const sys = (systemType: Parameters<typeof getSystem>[0]['systemType'], standard: 'NEC' | 'IEC' = 'NEC') =>
  getSystem({ systemType, standard, customSystem: null })

describe('getSystem', () => {
  it('208Y/120 3φ 4W', () => {
    expect(sys('nec-3ph-4w-208y120')).toMatchObject({
      phases: 3, wires: 4, vLN: 120, vLL: 208, hasNeutral: true, maxPoles: 3, allowOnePole: true,
      phaseLabels: ['A', 'B', 'C'], threePhase: true,
    })
  })
  it('480Y/277', () => {
    expect(sys('nec-3ph-4w-480y277')).toMatchObject({ vLN: 277, vLL: 480 })
  })
  it('120/240 1φ 3W', () => {
    expect(sys('nec-1ph-3w-120-240')).toMatchObject({
      phases: 2, vLN: 120, vLL: 240, hasNeutral: true, maxPoles: 2, threePhase: false,
    })
  })
  it('240 V delta has no neutral and no 1-pole loads', () => {
    expect(sys('nec-3ph-3w-240d')).toMatchObject({ vLN: null, vLL: 240, hasNeutral: false, allowOnePole: false })
  })
  it('IEC 400Y/230 uses L1/L2/L3', () => {
    expect(sys('iec-3ph-4w-400y230', 'IEC')).toMatchObject({ vLN: 230, vLL: 400, phaseLabels: ['L1', 'L2', 'L3'] })
  })
  it('IEC 230 V 1φ 2W', () => {
    expect(sys('iec-1ph-2w-230', 'IEC')).toMatchObject({ phases: 1, maxPoles: 1, vLN: 230, vLL: 230, phaseLabels: ['L'] })
  })
  it('custom 3φ 4W', () => {
    const s = getSystem({ systemType: 'custom', standard: 'IEC', customSystem: { phases: 3, wires: 4, vLN: 240, vLL: 415 } })
    expect(s).toMatchObject({ phases: 3, vLN: 240, vLL: 415, hasNeutral: true, maxPoles: 3, phaseLabels: ['L1', 'L2', 'L3'] })
  })
  it('custom 3φ 3W has no neutral', () => {
    const s = getSystem({ systemType: 'custom', standard: 'NEC', customSystem: { phases: 3, wires: 3, vLN: null, vLL: 600 } })
    expect(s).toMatchObject({ hasNeutral: false, allowOnePole: false, vLN: null })
  })
  it('custom 1φ 3W', () => {
    const s = getSystem({ systemType: 'custom', standard: 'NEC', customSystem: { phases: 1, wires: 3, vLN: 120, vLL: 240 } })
    expect(s).toMatchObject({ phases: 2, maxPoles: 2 })
  })
})

describe('phaseOfSpace (research R1)', () => {
  const three = sys('nec-3ph-4w-208y120')
  it('3φ rows rotate A, B, C', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((n) => phaseOfSpace(n, three))).toEqual(['A', 'A', 'B', 'B', 'C', 'C', 'A', 'A'])
    expect(phaseOfSpace(42, three)).toBe('C')
    expect(phaseOfSpace(41, three)).toBe('C')
    expect(phaseOfSpace(40, three)).toBe('B')
  })
  it('1φ 3W rows alternate A, B', () => {
    const one = sys('nec-1ph-3w-120-240')
    expect([1, 3, 5, 2, 4].map((n) => phaseOfSpace(n, one))).toEqual(['A', 'B', 'A', 'A', 'B'])
  })
  it('1φ 2W is always A', () => {
    const one = sys('iec-1ph-2w-230', 'IEC')
    expect([1, 2, 3, 10].map((n) => phaseOfSpace(n, one))).toEqual(['A', 'A', 'A', 'A'])
  })
  it('rowOfSpace', () => {
    expect([1, 2, 3, 42].map(rowOfSpace)).toEqual([1, 1, 2, 21])
  })
})

describe('spacesFor', () => {
  it('multi-pole circuits use same-side consecutive spaces', () => {
    expect(spacesFor(1, 1)).toEqual([1])
    expect(spacesFor(3, 2)).toEqual([3, 5])
    expect(spacesFor(7, 3)).toEqual([7, 9, 11])
    expect(spacesFor(8, 3)).toEqual([8, 10, 12])
  })
})
