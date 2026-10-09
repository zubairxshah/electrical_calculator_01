import { describe, it, expect } from 'vitest'
import { validatePanel, validateCircuit } from '@/lib/validation/panelScheduleValidation'
import { ckt, exampleA, panel } from './helpers'

const paths = (r: { errors: { path: string }[] }) => r.errors.map((e) => e.path)

describe('validatePanel', () => {
  it('Example A is valid', () => {
    expect(validatePanel(exampleA()).errors).toEqual([])
  })
  it('spaces must be even and 2–84', () => {
    expect(paths(validatePanel(panel({ spaces: 41 })))).toContain('spaces')
    expect(paths(validatePanel(panel({ spaces: 86 })))).toContain('spaces')
    expect(paths(validatePanel(panel({ spaces: 0 })))).toContain('spaces')
    expect(validatePanel(panel({ spaces: 84 })).errors).toEqual([])
  })
  it('main breaker requires a rating', () => {
    expect(paths(validatePanel(panel({ mainRatingA: null })))).toContain('mainRatingA')
    expect(validatePanel(panel({ mainType: 'mlo', mainRatingA: null })).errors).toEqual([])
  })
  it('imbalance target 1–50', () => {
    expect(paths(validatePanel(panel({ imbalanceTargetPct: 0 })))).toContain('imbalanceTargetPct')
    expect(paths(validatePanel(panel({ imbalanceTargetPct: 60 })))).toContain('imbalanceTargetPct')
  })
  it('main > bus is a warning, not an error', () => {
    const r = validatePanel(panel({ busRatingA: 100, mainRatingA: 125 }))
    expect(r.errors).toEqual([])
    expect(r.warnings.map((w) => w.path)).toContain('mainRatingA')
  })
  it('placement issues are errors tied to the circuit', () => {
    const r = validatePanel(panel({ systemType: 'nec-1ph-3w-120-240', circuits: [ckt({ id: 'x', poles: 3, startSpace: 1 })] }))
    expect(r.errors).toEqual([expect.objectContaining({ path: 'placement', circuitId: 'x' })])
  })
  it('unplaced circuits are warnings', () => {
    expect(validatePanel(panel({ circuits: [ckt({ id: 'u' })] })).warnings).toEqual([
      expect.objectContaining({ circuitId: 'u' }),
    ])
  })
  it('custom 3φ 4W requires V_LL ≈ √3·V_LN', () => {
    const bad = panel({ systemType: 'custom', customSystem: { phases: 3, wires: 4, vLN: 120, vLL: 240 } })
    expect(paths(validatePanel(bad))).toContain('customSystem.vLL')
    const good = panel({ systemType: 'custom', customSystem: { phases: 3, wires: 4, vLN: 240, vLL: 415 } })
    expect(validatePanel(good).errors).toEqual([])
  })
  it('custom 1φ 3W requires V_LL = 2·V_LN', () => {
    const bad = panel({ systemType: 'custom', customSystem: { phases: 1, wires: 3, vLN: 120, vLL: 208 } })
    expect(paths(validatePanel(bad))).toContain('customSystem.vLL')
  })
})

describe('validateCircuit', () => {
  it('valid circuit', () => expect(validateCircuit(ckt())).toEqual([]))
  it('load must be > 0 for loads only', () => {
    expect(validateCircuit(ckt({ loadValue: 0 })).map((e) => e.path)).toEqual(['loadValue'])
    expect(validateCircuit(ckt({ kind: 'spare', loadValue: 0 }))).toEqual([])
  })
  it('PF range', () => {
    expect(validateCircuit(ckt({ powerFactor: 0.05 })).map((e) => e.path)).toEqual(['powerFactor'])
    expect(validateCircuit(ckt({ powerFactor: 1.1 })).map((e) => e.path)).toEqual(['powerFactor'])
  })
  it('breaker required except for SPACE', () => {
    expect(validateCircuit(ckt({ breakerA: null })).map((e) => e.path)).toEqual(['breakerA'])
    expect(validateCircuit(ckt({ kind: 'spare', breakerA: null })).map((e) => e.path)).toEqual(['breakerA'])
    expect(validateCircuit(ckt({ kind: 'space', breakerA: null }))).toEqual([])
  })
  it('HP only for motors', () => {
    expect(validateCircuit(ckt({ loadUnit: 'HP' })).map((e) => e.path)).toEqual(['loadUnit'])
    expect(validateCircuit(ckt({ loadUnit: 'HP', category: 'motor' }))).toEqual([])
  })
  it('NaN load rejected', () => {
    expect(validateCircuit(ckt({ loadValue: Number.NaN })).length).toBeGreaterThan(0)
  })
})
