/**
 * Panel schedule: per-circuit loads, per-phase summary, imbalance and neutral estimate
 * (research R2, R3; spec FR-009 – FR-013).
 */
import type {
  Circuit, CircuitLoad, Panel, PanelWarning, Phase, PhaseSummary, ScheduleResult, SystemDefinition,
} from '@/types/panel-schedule'
import { getSystem, phaseOfSpace, spacesFor, systemPhases, phaseLabel } from './system'
import { branchCurrent, circuitVA, PanelError } from './loads'
import { validatePlacement } from './placement'

const SQRT3 = Math.sqrt(3)

/** max |x − avg| / avg × 100; null when fewer than two phases or the average is zero */
export function imbalancePct(phaseVA: number[]): number | null {
  if (phaseVA.length < 2) return null
  const avg = phaseVA.reduce((a, b) => a + b, 0) / phaseVA.length
  if (avg <= 0) return null
  return (Math.max(...phaseVA.map((v) => Math.abs(v - avg))) / avg) * 100
}

/** Neutral current from line-to-neutral currents (unity PF, 120° displacement — research R3). */
export function neutralCurrent(lnCurrents: number[], system: SystemDefinition): number | null {
  if (!system.hasNeutral) return null
  if (system.phases === 3) {
    const [a, b, c] = lnCurrents
    return Math.sqrt(Math.max(0, a * a + b * b + c * c - a * b - b * c - c * a))
  }
  if (system.phases === 2) return Math.abs(lnCurrents[0] - lnCurrents[1])
  return lnCurrents[0]
}

/** Phase current from per-phase VA: VA / V_LN (VA / (V_LL/√3) on a delta). */
function phaseCurrent(va: number, system: SystemDefinition): number {
  return va / (system.vLN ?? system.vLL / SQRT3)
}

function totalCurrent(va: number, system: SystemDefinition): number {
  if (system.threePhase) return va / (SQRT3 * system.vLL)
  return va / system.vLL
}

function circuitLoad(c: Circuit, panel: Panel, system: SystemDefinition): CircuitLoad {
  const spaces = spacesFor(c.startSpace as number, c.poles)
  const phases = spaces.map((s) => phaseOfSpace(s, system))
  const warnings: PanelWarning[] = []

  let va = 0
  try {
    va = circuitVA(c, system, panel.standard)
  } catch (e) {
    if (!(e instanceof PanelError)) throw e
    warnings.push({ code: e.code, severity: 'error', message: e.message, reference: 'NEC 430.6(A)(1)', circuitId: c.id })
  }

  const vaPerPhase: Partial<Record<Phase, number>> = {}
  if (va > 0) for (const p of phases) vaPerPhase[p] = (vaPerPhase[p] ?? 0) + va / c.poles

  const currentA = branchCurrent(va, c.poles, system)
  // Motor branch protection follows 430.52, not the 125 % continuous rule
  const continuous = c.continuous && c.category !== 'motor'
  const requiredBreakerA = continuous ? currentA * 1.25 : currentA

  if (panel.standard === 'NEC' && c.kind === 'load' && c.breakerA !== null && c.category !== 'motor'
    && c.breakerA < requiredBreakerA - 1e-9) {
    warnings.push({
      code: 'BREAKER_UNDERSIZED', severity: 'warning', circuitId: c.id,
      reference: 'NEC 210.20(A)',
      message: `${c.description || c.id}: ${c.breakerA} A breaker is below ${continuous ? '125 % of the continuous load' : 'the load current'} (${requiredBreakerA.toFixed(1)} A required)`,
    })
  }

  return { circuitId: c.id, va, spaces, phases, vaPerPhase, currentA, requiredBreakerA, warnings }
}

export function summarise(
  loads: CircuitLoad[],
  circuits: Circuit[],
  system: SystemDefinition,
  spaces: number,
  targetPct: number,
): PhaseSummary {
  const phases = systemPhases(system)
  const va: Record<Phase, number> = { A: 0, B: 0, C: 0 }
  const lnVA: Record<Phase, number> = { A: 0, B: 0, C: 0 }
  const byId = new Map(circuits.map((c) => [c.id, c]))

  for (const l of loads) {
    for (const [p, v] of Object.entries(l.vaPerPhase) as [Phase, number][]) va[p] += v
    if (byId.get(l.circuitId)?.poles === 1) lnVA[l.phases[0]] += l.va
  }

  const phaseVA = phases.map((p) => va[p])
  const totalVA = phaseVA.reduce((a, b) => a + b, 0)
  const averageVA = totalVA / phases.length
  const imbalance = imbalancePct(phaseVA)
  const showDeviation = phases.length > 1 && averageVA > 0
  const usedSpaces = loads.reduce((n, l) => n + l.spaces.length, 0)

  return {
    perPhase: phases.map((p) => ({
      phase: p,
      label: phaseLabel(p, system),
      va: va[p],
      currentA: phaseCurrent(va[p], system),
      deviationPct: showDeviation ? ((va[p] - averageVA) / averageVA) * 100 : null,
    })),
    totalVA,
    totalCurrentA: totalCurrent(totalVA, system),
    averageVA,
    imbalancePct: imbalance,
    imbalanceOk: imbalance === null || imbalance <= targetPct + 1e-9,
    neutralCurrentA: neutralCurrent(phases.map((p) => phaseCurrent(lnVA[p], system)), system),
    usedSpaces,
    freeSpaces: Math.max(0, spaces - usedSpaces),
  }
}

export function calculateSchedule(panel: Panel): ScheduleResult {
  const system = getSystem(panel)
  const issues = validatePlacement(panel.circuits, panel.spaces, system)
  const invalid = new Set(issues.map((i) => i.circuitId))

  const placed = panel.circuits.filter((c) => c.startSpace !== null && !invalid.has(c.id))
  const circuitLoads = placed.map((c) => circuitLoad(c, panel, system))
  const summary = summarise(circuitLoads, placed, system, panel.spaces, panel.imbalanceTargetPct)

  const warnings: PanelWarning[] = circuitLoads.flatMap((l) => l.warnings)
  if (!summary.imbalanceOk && summary.imbalancePct !== null) {
    warnings.push({
      code: 'IMBALANCE_HIGH', severity: 'warning',
      message: `Phase imbalance ${summary.imbalancePct.toFixed(1)} % exceeds the ${panel.imbalanceTargetPct} % target — consider running Balance`,
    })
  }
  if (summary.freeSpaces === 0 && panel.spaces > 0) {
    warnings.push({ code: 'SPACES_FULL', severity: 'info', message: 'All panel spaces are used — no room for future circuits' })
  }
  if (panel.mainType === 'main-breaker' && panel.mainRatingA !== null && panel.mainRatingA > panel.busRatingA) {
    warnings.push({
      code: 'MAIN_OVER_BUS', severity: 'warning', reference: 'NEC 408.36',
      message: `Main breaker ${panel.mainRatingA} A is larger than the ${panel.busRatingA} A bus — the bus is not protected at its rating`,
    })
  }

  return { system, circuitLoads, summary, issues, warnings }
}
