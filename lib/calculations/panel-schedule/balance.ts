/**
 * Phase load balancing (research R7; spec FR-014 – FR-016).
 *
 * Deterministic heuristic: two candidate layouts are built and the better one is proposed.
 *   1. "Keep": start from the current layout, place any unplaced circuits greedily, then local search.
 *   2. "Fresh": clear every movable circuit, place largest-first (LPT) on the best phase, then local search.
 * Local search applies the best single move (circuit → free space) or swap (two circuits with the
 * same pole count) until nothing improves. Objective: minimise max |phase VA − average|,
 * then the sum of squared deviations; ties prefer fewer moved circuits.
 *
 * Locked circuits, spares and spaces never move. The input panel is never mutated.
 */
import type { BalanceProposal, Circuit, Panel, SystemDefinition } from '@/types/panel-schedule'
import { calculateSchedule } from './schedule'
import { circuitVA } from './loads'

const EPS = 1e-6
const MAX_ITERATIONS = 500
const FREE = -1
const FIXED = -2

interface Item {
  idx: number
  id: string
  poles: number
  va: number
  /** Start space in the original panel (null if unplaced or invalidly placed) */
  original: number | null
  start: number | null
}

interface Score {
  maxDev: number
  sumSq: number
}

function score(load: number[]): Score {
  const avg = load.reduce((a, b) => a + b, 0) / load.length
  let maxDev = 0
  let sumSq = 0
  for (const v of load) {
    const d = v - avg
    maxDev = Math.max(maxDev, Math.abs(d))
    sumSq += d * d
  }
  return { maxDev, sumSq }
}

function better(a: Score, b: Score): boolean {
  if (a.maxDev < b.maxDev - EPS) return true
  return Math.abs(a.maxDev - b.maxDev) <= EPS && a.sumSq < b.sumSq - EPS
}

class Layout {
  owner: Int32Array
  load: number[]

  constructor(
    public items: Item[],
    public spaces: number,
    public phases: number,
    fixedSpaces: number[],
    fixedLoad: number[],
  ) {
    this.owner = new Int32Array(spaces + 1).fill(FREE)
    for (const s of fixedSpaces) if (s >= 1 && s <= spaces) this.owner[s] = FIXED
    this.load = [...fixedLoad]
  }

  phaseOf(space: number): number {
    return (Math.ceil(space / 2) - 1) % this.phases
  }

  /** Add (sign 1) or remove (sign −1) an item's VA at `start` into `load` */
  apply(load: number[], item: Item, start: number, sign: 1 | -1) {
    const share = item.va / item.poles
    for (let k = 0; k < item.poles; k++) load[this.phaseOf(start + 2 * k)] += sign * share
  }

  fits(item: Item, start: number): boolean {
    for (let k = 0; k < item.poles; k++) {
      const s = start + 2 * k
      if (s > this.spaces) return false
      const o = this.owner[s]
      if (o !== FREE && o !== item.idx) return false
    }
    return true
  }

  place(item: Item, start: number) {
    if (item.start !== null) this.unplace(item)
    for (let k = 0; k < item.poles; k++) this.owner[start + 2 * k] = item.idx
    this.apply(this.load, item, start, 1)
    item.start = start
  }

  unplace(item: Item) {
    if (item.start === null) return
    for (let k = 0; k < item.poles; k++) this.owner[item.start + 2 * k] = FREE
    this.apply(this.load, item, item.start, -1)
    item.start = null
  }

  /** Place one item at the start giving the best score; ties prefer its original space, then the lowest number. */
  placeBest(item: Item): boolean {
    let best: Score | null = null
    let bestStart: number | null = null
    for (let s = 1; s <= this.spaces; s++) {
      if (!this.fits(item, s)) continue
      const tmp = [...this.load]
      this.apply(tmp, item, s, 1)
      const sc = score(tmp)
      const tie = best !== null && !better(sc, best) && !better(best, sc)
      if (best === null || better(sc, best) || (tie && s === item.original)) {
        best = sc
        bestStart = s
      }
    }
    if (bestStart === null) return false
    this.place(item, bestStart)
    return true
  }

  /** Moving this item can never change the phase loads (it spans every phase). */
  inert(item: Item): boolean {
    return item.poles % this.phases === 0
  }

  localSearch() {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const current = score(this.load)
      let best = current
      let action: (() => void) | null = null

      for (const item of this.items) {
        if (item.start === null || this.inert(item)) continue
        const from = item.start
        for (let s = 1; s <= this.spaces; s++) {
          if (s === from || !this.fits(item, s)) continue
          const tmp = [...this.load]
          this.apply(tmp, item, from, -1)
          this.apply(tmp, item, s, 1)
          const sc = score(tmp)
          if (better(sc, best)) {
            best = sc
            action = () => this.place(item, s)
          }
        }
      }

      for (let i = 0; i < this.items.length; i++) {
        const a = this.items[i]
        if (a.start === null || this.inert(a)) continue
        for (let j = i + 1; j < this.items.length; j++) {
          const b = this.items[j]
          if (b.start === null || b.poles !== a.poles) continue
          if (this.phaseOf(a.start) === this.phaseOf(b.start)) continue
          const tmp = [...this.load]
          this.apply(tmp, a, a.start, -1)
          this.apply(tmp, b, b.start, -1)
          this.apply(tmp, a, b.start, 1)
          this.apply(tmp, b, a.start, 1)
          const sc = score(tmp)
          if (better(sc, best)) {
            best = sc
            action = () => this.swap(a, b)
          }
        }
      }

      if (!action) return
      action()
    }
  }

  swap(a: Item, b: Item) {
    const sa = a.start as number
    const sb = b.start as number
    this.unplace(a)
    this.unplace(b)
    this.place(a, sb)
    this.place(b, sa)
  }
}

interface Candidate {
  starts: (number | null)[]
  unplaced: number
  score: Score
  moved: number
}

function snapshot(layout: Layout): Candidate {
  const starts = layout.items.map((it) => it.start)
  return {
    starts,
    unplaced: starts.filter((s) => s === null).length,
    score: score(layout.load),
    moved: layout.items.filter((it) => it.start !== it.original).length,
  }
}

function preferable(a: Candidate, b: Candidate): boolean {
  if (a.unplaced !== b.unplaced) return a.unplaced < b.unplaced
  if (better(a.score, b.score)) return true
  if (better(b.score, a.score)) return false
  return a.moved < b.moved
}

function safeVA(c: Circuit, system: SystemDefinition, panel: Panel): number {
  try {
    return circuitVA(c, system, panel.standard)
  } catch {
    return 0
  }
}

export function applyProposal(panel: Panel, proposal: BalanceProposal): Panel {
  return {
    ...panel,
    circuits: panel.circuits.map((c) =>
      proposal.assignments[c.id] !== undefined ? { ...c, startSpace: proposal.assignments[c.id] } : c,
    ),
  }
}

export function proposeBalance(panel: Panel): BalanceProposal {
  const before = calculateSchedule(panel)
  const { system } = before
  const unchanged = (message: string): BalanceProposal => ({
    assignments: {}, before: before.summary, after: before.summary, movedCircuitIds: [], improved: false, message,
  })

  if (system.phases < 2) {
    return unchanged('Single-phase 2-wire panel — every circuit is on the same line, so balancing does not apply')
  }

  const issueById = new Map(before.issues.map((i) => [i.circuitId, i.code]))
  const unplaceable = (c: Circuit) => {
    const code = issueById.get(c.id)
    return code === 'TOO_MANY_POLES' || code === 'ONE_POLE_ON_DELTA'
  }
  const movable = panel.circuits.filter((c) => c.kind === 'load' && !c.locked && !unplaceable(c))
  const movableIds = new Set(movable.map((c) => c.id))

  if (!panel.circuits.some((c) => c.kind === 'load')) return unchanged('Nothing to balance — the panel has no load circuits')
  if (movable.length === 0) return unchanged('No unlocked circuits to move — unlock circuits to allow balancing')
  const hasUnplaced = movable.some((c) => c.startSpace === null || issueById.has(c.id))
  if (before.summary.totalVA === 0 && !hasUnplaced) return unchanged('Nothing to balance — the panel has no load')

  // Fixed occupancy and load: everything that is not movable keeps its spaces
  const fixedSpaces: number[] = []
  for (const c of panel.circuits) {
    if (movableIds.has(c.id) || c.startSpace === null || unplaceable(c)) continue
    for (let k = 0; k < c.poles; k++) fixedSpaces.push(c.startSpace + 2 * k)
  }
  const fixedLoad = new Array(system.phases).fill(0)
  const phaseIndex = { A: 0, B: 1, C: 2 } as const
  for (const l of before.circuitLoads) {
    if (movableIds.has(l.circuitId)) continue
    for (const [p, v] of Object.entries(l.vaPerPhase)) fixedLoad[phaseIndex[p as 'A']] += v as number
  }

  const makeItems = (): Item[] =>
    movable.map((c, idx) => {
      const validStart = c.startSpace !== null && !issueById.has(c.id) ? c.startSpace : null
      return { idx, id: c.id, poles: c.poles, va: safeVA(c, system, panel), original: validStart, start: null }
    })
  const lptOrder = (items: Item[]) =>
    [...items].sort((a, b) => b.poles - a.poles || b.va - a.va || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  // Candidate 1 — keep the current layout
  const keepItems = makeItems()
  const keep = new Layout(keepItems, panel.spaces, system.phases, fixedSpaces, fixedLoad)
  for (const it of keepItems) if (it.original !== null) keep.place(it, it.original)
  for (const it of lptOrder(keepItems.filter((i) => i.start === null))) keep.placeBest(it)
  keep.localSearch()

  // Candidate 2 — fresh largest-first placement
  const freshItems = makeItems()
  const fresh = new Layout(freshItems, panel.spaces, system.phases, fixedSpaces, fixedLoad)
  for (const it of lptOrder(freshItems)) fresh.placeBest(it)
  fresh.localSearch()

  const a = snapshot(keep)
  const b = snapshot(fresh)
  const chosen = preferable(b, a) ? b : a

  const assignments: Record<string, number> = {}
  const movedCircuitIds: string[] = []
  movable.forEach((c, idx) => {
    const start = chosen.starts[idx]
    if (start === null) return
    assignments[c.id] = start
    if (start !== c.startSpace) movedCircuitIds.push(c.id)
  })

  const proposal: BalanceProposal = {
    assignments, before: before.summary, after: before.summary, movedCircuitIds, improved: false, message: '',
  }
  const after = calculateSchedule(applyProposal(panel, proposal)).summary
  const bPct = before.summary.imbalancePct
  const aPct = after.imbalancePct
  const improved = bPct !== null && aPct !== null ? aPct < bPct - 0.05 : movedCircuitIds.length > 0 && hasUnplaced

  if (!improved && !hasUnplaced) {
    return unchanged(
      before.summary.imbalanceOk
        ? `Panel is already balanced within the ${panel.imbalanceTargetPct} % target`
        : 'No better arrangement found with the current locked circuits and free spaces',
    )
  }

  const fmt = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)} %`)
  return {
    ...proposal,
    after,
    improved,
    message: `Imbalance ${fmt(bPct)} → ${fmt(aPct)} by moving ${movedCircuitIds.length} circuit${movedCircuitIds.length === 1 ? '' : 's'}`,
  }
}
