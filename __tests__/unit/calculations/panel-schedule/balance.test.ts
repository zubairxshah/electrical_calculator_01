import { describe, it, expect } from 'vitest'
import { proposeBalance, applyProposal } from '@/lib/calculations/panel-schedule/balance'
import { calculateSchedule } from '@/lib/calculations/panel-schedule/schedule'
import { validatePlacement, autoPlace } from '@/lib/calculations/panel-schedule/placement'
import { getSystem } from '@/lib/calculations/panel-schedule/system'
import type { Circuit, Panel, Poles } from '@/types/panel-schedule'
import { ckt, exampleA, panel } from './helpers'

const phaseVA = (p: Panel) => calculateSchedule(p).summary.perPhase.map((x) => x.va)

/** Quickstart Example D — ten 1,500 VA 1-pole circuits all on phase A spaces */
function exampleD(): Panel {
  const aSpaces = [1, 2, 7, 8, 13, 14, 19, 20, 25, 26]
  return panel({
    spaces: 30,
    circuits: aSpaces.map((s, i) => ckt({ id: `d${i}`, loadValue: 1500, startSpace: s })),
  })
}

function assertValidLayout(p: Panel) {
  const system = getSystem(p)
  expect(validatePlacement(p.circuits, p.spaces, system)).toEqual([])
  expect(p.circuits.every((c) => c.startSpace !== null)).toBe(true)
}

describe('proposeBalance — quickstart Example D', () => {
  const p = exampleD()
  const proposal = proposeBalance(p)
  const after = applyProposal(p, proposal)

  it('reaches the optimum (4/3/3 split)', () => {
    const va = phaseVA(after)
    expect(Math.max(...va) - Math.min(...va)).toBeLessThanOrEqual(1500)
    expect(proposal.after.imbalancePct).toBeCloseTo(20, 6)
    expect(proposal.before.imbalancePct).toBeCloseTo(200, 6)
    expect(proposal.improved).toBe(true)
  })
  it('does not mutate the input panel', () => {
    expect(p.circuits.map((c) => c.startSpace)).toEqual([1, 2, 7, 8, 13, 14, 19, 20, 25, 26])
  })
  it('proposal summary matches the applied panel', () => {
    expect(calculateSchedule(after).summary).toEqual(proposal.after)
  })
  it('valid layout and unchanged total', () => {
    assertValidLayout(after)
    expect(proposal.after.totalVA).toBe(15000)
  })
  it('moves as few circuits as needed (6 of 10)', () => {
    expect(proposal.movedCircuitIds.length).toBe(6)
  })
})

describe('proposeBalance — constraints', () => {
  it('locked circuits, spares and spaces never move', () => {
    const p = exampleD()
    p.circuits[0] = { ...p.circuits[0], locked: true }
    p.circuits[1] = { ...p.circuits[1], locked: true }
    p.circuits.push(ckt({ id: 'sp', kind: 'spare', startSpace: 3 }), ckt({ id: 'gap', kind: 'space', startSpace: 5 }))
    const prop = proposeBalance(p)
    const after = applyProposal(p, prop)
    const start = (id: string) => after.circuits.find((c) => c.id === id)!.startSpace
    expect(start('d0')).toBe(1)
    expect(start('d1')).toBe(2)
    expect(start('sp')).toBe(3)
    expect(start('gap')).toBe(5)
    expect(prop.movedCircuitIds).not.toContain('d0')
    assertValidLayout(after)
  })

  it('multi-pole circuits stay on valid same-side consecutive spaces', () => {
    const p = panel({
      spaces: 24,
      circuits: [
        ckt({ id: 'a', loadValue: 6000, poles: 2, startSpace: 1 }),   // A,B
        ckt({ id: 'b', loadValue: 6000, poles: 2, startSpace: 2 }),   // A,B
        ckt({ id: 'c', loadValue: 6000, poles: 2, startSpace: 7 }),   // A,B
        ckt({ id: 'd', loadValue: 9000, poles: 3, startSpace: 13 }),
        ckt({ id: 'e', loadValue: 1000, startSpace: 8 }),             // A
      ],
    })
    const prop = proposeBalance(p)
    const after = applyProposal(p, prop)
    assertValidLayout(after)
    expect(prop.after.imbalancePct!).toBeLessThan(prop.before.imbalancePct!)
    // three 2-pole loads can each take a different phase pair → perfectly balanced apart from the 1 kVA
    const va = phaseVA(after)
    expect(Math.max(...va) - Math.min(...va)).toBeLessThanOrEqual(1000 + 1e-9)
  })

  it('never makes the panel worse', () => {
    const prop = proposeBalance(exampleA())
    expect(prop.after.imbalancePct!).toBeLessThanOrEqual(prop.before.imbalancePct! + 1e-9)
  })

  it('already-balanced panel → improved=false with a message', () => {
    const p = panel({
      circuits: [ckt({ loadValue: 1000, startSpace: 1 }), ckt({ loadValue: 1000, startSpace: 3 }), ckt({ loadValue: 1000, startSpace: 5 })],
    })
    const prop = proposeBalance(p)
    expect(prop.improved).toBe(false)
    expect(prop.movedCircuitIds).toEqual([])
    expect(prop.message).toMatch(/balanced|within/i)
  })

  it('all circuits locked → no change', () => {
    const p = exampleD()
    p.circuits = p.circuits.map((c) => ({ ...c, locked: true }))
    const prop = proposeBalance(p)
    expect(prop.movedCircuitIds).toEqual([])
    expect(prop.message).toMatch(/no unlocked/i)
  })

  it('empty panel → nothing to balance', () => {
    const prop = proposeBalance(panel())
    expect(prop.improved).toBe(false)
    expect(prop.message).toMatch(/nothing/i)
  })

  it('single-phase 2W panel → not applicable', () => {
    const prop = proposeBalance(panel({
      standard: 'IEC', systemType: 'iec-1ph-2w-230', circuits: [ckt({ loadValue: 1000, startSpace: 1 })],
    }))
    expect(prop.improved).toBe(false)
    expect(prop.message).toMatch(/single/i)
  })

  it('places unplaced circuits too', () => {
    const p = panel({ spaces: 12, circuits: [ckt({ id: 'x', loadValue: 2000, startSpace: 1 }), ckt({ id: 'y', loadValue: 2000 })] })
    const after = applyProposal(p, proposeBalance(p))
    assertValidLayout(after)
    const va = phaseVA(after)
    expect(va.filter((v) => v === 2000)).toHaveLength(2)
  })

  it('120/240 1φ 3W balances across A and B', () => {
    const p = panel({
      systemType: 'nec-1ph-3w-120-240', spaces: 12,
      circuits: [1, 2, 5, 6].map((s, i) => ckt({ id: `s${i}`, loadValue: 1000, startSpace: s })),
    })
    const prop = proposeBalance(p)
    expect(prop.after.imbalancePct).toBe(0)
  })

  it('is deterministic', () => {
    expect(proposeBalance(exampleD())).toEqual(proposeBalance(exampleD()))
  })
})

// ── SC-003 / SC-004 ────────────────────────────────────────────────────────────

function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function randomPanel(seed: number): Panel {
  const rnd = lcg(seed)
  const range = (lo: number, hi: number) => Math.round(lo + rnd() * (hi - lo))
  const circuits: Circuit[] = []
  const add = (n: number, poles: Poles, lo: number, hi: number) => {
    for (let i = 0; i < n; i++) circuits.push(ckt({ id: `r${seed}-${circuits.length}`, poles, loadValue: range(lo, hi) }))
  }
  add(range(14, 22), 1, 300, 2000)
  add(range(2, 5), 2, 1500, 6000)
  add(range(0, 2), 3, 3000, 12000)
  // shuffle so the auto-placed starting layout is arbitrary
  for (let i = circuits.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[circuits[i], circuits[j]] = [circuits[j], circuits[i]]
  }
  const system = getSystem({ systemType: 'nec-3ph-4w-208y120', standard: 'NEC', customSystem: null })
  return panel({ spaces: 42, circuits: autoPlace(circuits, 42, system).circuits })
}

describe('SC-003: random unbalanced panels', () => {
  it('reaches ≤ 5 % imbalance in at least 95 % of 200 cases, always with a valid layout', () => {
    let ok = 0
    for (let seed = 1; seed <= 200; seed++) {
      const p = randomPanel(seed)
      const prop = proposeBalance(p)
      const after = applyProposal(p, prop)
      assertValidLayout(after)
      expect(prop.after.imbalancePct!).toBeLessThanOrEqual(prop.before.imbalancePct! + 1e-9)
      if (prop.after.imbalancePct! <= 5) ok++
    }
    expect(ok).toBeGreaterThanOrEqual(190)
  })
})

describe('SC-004: performance', () => {
  it('balances a full 84-space panel in under 1 s', () => {
    const rnd = lcg(42)
    const circuits = Array.from({ length: 84 }, (_, i) => ckt({ id: `f${i}`, loadValue: Math.round(200 + rnd() * 1800), startSpace: i + 1 }))
    const p = panel({ spaces: 84, circuits })
    const t0 = performance.now()
    const prop = proposeBalance(p)
    const ms = performance.now() - t0
    expect(ms).toBeLessThan(1000)
    assertValidLayout(applyProposal(p, prop))
    expect(prop.after.imbalancePct!).toBeLessThan(1)
  })
})
