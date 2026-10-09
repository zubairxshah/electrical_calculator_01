/**
 * Circuit placement rules: range, overlap, pole count vs system.
 */
import type { Circuit, PlacementIssue, SystemDefinition } from '@/types/panel-schedule'
import { spacesFor } from './system'

export interface OccupiedSpace {
  circuitId: string
  poleIndex: number
}

/** Space → occupying circuit pole, for every placed circuit (first claimant wins). */
export function occupancyMap(circuits: Circuit[]): Map<number, OccupiedSpace> {
  const map = new Map<number, OccupiedSpace>()
  for (const c of circuits) {
    if (c.startSpace === null) continue
    spacesFor(c.startSpace, c.poles).forEach((s, poleIndex) => {
      if (!map.has(s)) map.set(s, { circuitId: c.id, poleIndex })
    })
  }
  return map
}

/** True when a circuit (`circuitId`, ignored as an occupant) fits at `start` with `poles` poles. */
export function canPlace(circuits: Circuit[], circuitId: string, start: number, poles: number, spaces: number): boolean {
  const wanted = spacesFor(start, poles)
  if (start < 1 || wanted[wanted.length - 1] > spaces) return false
  const others = occupancyMap(circuits.filter((c) => c.id !== circuitId))
  return wanted.every((s) => !others.has(s))
}

export function validatePlacement(circuits: Circuit[], spaces: number, system: SystemDefinition): PlacementIssue[] {
  const issues: PlacementIssue[] = []
  const taken = new Map<number, string>()
  const name = (c: Circuit) => c.description || c.id

  for (const c of circuits) {
    if (c.startSpace === null) continue

    if (c.poles > system.maxPoles) {
      issues.push({
        code: 'TOO_MANY_POLES', circuitId: c.id,
        message: `${name(c)}: a ${c.poles}-pole circuit cannot be used on a ${system.label} panel (max ${system.maxPoles} poles)`,
      })
      continue
    }
    if (c.poles === 1 && !system.allowOnePole && c.kind === 'load') {
      issues.push({
        code: 'ONE_POLE_ON_DELTA', circuitId: c.id,
        message: `${name(c)}: ${system.label} has no neutral — line-to-neutral (1-pole) loads are not possible`,
      })
      continue
    }

    const occupied = spacesFor(c.startSpace, c.poles)
    if (c.startSpace < 1 || occupied[occupied.length - 1] > spaces) {
      issues.push({
        code: 'OUT_OF_RANGE', circuitId: c.id,
        message: `${name(c)}: needs space${occupied.length > 1 ? 's' : ''} ${occupied.join(', ')} but the panel has ${spaces} spaces`,
      })
      continue
    }

    const clash = occupied.find((s) => taken.has(s))
    if (clash !== undefined) {
      const other = circuits.find((x) => x.id === taken.get(clash))
      issues.push({
        code: 'OVERLAP', circuitId: c.id,
        message: `${name(c)}: space ${clash} is already used by ${other ? name(other) : 'another circuit'}`,
      })
      continue
    }
    occupied.forEach((s) => taken.set(s, c.id))
  }
  return issues
}

/**
 * Place every circuit without a start space at the lowest-numbered start that fits.
 * Already-placed circuits keep their spaces. Returns new circuit objects (input is not mutated).
 */
export function autoPlace(
  circuits: Circuit[],
  spaces: number,
  system: SystemDefinition,
): { circuits: Circuit[]; unplaced: string[] } {
  const taken = new Set<number>()
  for (const c of circuits) {
    if (c.startSpace !== null) spacesFor(c.startSpace, c.poles).forEach((s) => taken.add(s))
  }

  const unplaced: string[] = []
  const placed = circuits.map((c) => {
    if (c.startSpace !== null) return c
    if (c.poles > system.maxPoles) {
      unplaced.push(c.id)
      return c
    }
    for (let start = 1; start <= spaces; start++) {
      const wanted = spacesFor(start, c.poles)
      if (wanted[wanted.length - 1] > spaces) continue
      if (wanted.every((s) => !taken.has(s))) {
        wanted.forEach((s) => taken.add(s))
        return { ...c, startSpace: start }
      }
    }
    unplaced.push(c.id)
    return c
  })
  return { circuits: placed, unplaced }
}
