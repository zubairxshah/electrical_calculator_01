// APFC switchgear sizing — contactor, protection, step cable, incomer, busbar
// Standards: IEC 61921, IEC 60831-1, IEC 60947-4-1 (AC-6b), NEC 460.8, NEC 240.6(A),
// NEC Table 310.16 / IEC 60364-5-52 ampacity
// Research: specs/014-pfi-panel-design/research.md R8

import type {
  PFCInput,
  PFCStandard,
  PFCDesignInput,
  PFCDesignWarning,
  PFCDetuningDesign,
  PFCProtectionType,
  PFCStepOverride,
  PFCSwitchgearStep,
  PFCSwitchgearDesign,
} from '@/types/power-factor-correction'
import { recommendStandardBreaker, getBreakerRatings } from '@/lib/standards/breakerRatings'
import { findMinimumCableSize, getAvailableCableSizes, formatCableSize } from '@/lib/standards/cableTables'
import type { CableTableEntry } from '@/lib/standards/cableTables'
import { CONTACTOR_AC6B_FRAMES_A, IEC_GG_FUSE_RATINGS_A, BUSBAR_RATINGS_A, nextRating } from './panelRatings'

const EPS = 1e-9

/** IEC: 1.3 (IEC 60831-1 overcurrent) × 1.1 (capacitance tolerance); NEC 460.8(A): 135 % */
export function designCurrentFactor(standard: PFCStandard): number {
  return standard === 'IEC' ? 1.3 * 1.1 : 1.35
}

export function defaultProtectionType(standard: PFCStandard): PFCProtectionType {
  return standard === 'IEC' ? 'fuse' : 'mccb'
}

function protectionSeries(standard: PFCStandard, type: PFCProtectionType): readonly number[] {
  if (standard === 'NEC') return getBreakerRatings('NEC') // NEC 240.6(A) covers fuses and breakers
  return type === 'fuse' ? IEC_GG_FUSE_RATINGS_A : getBreakerRatings('IEC')
}

/** Cables use the 75 °C column (NEC 110.14(C)) or the 70 °C PVC column (IEC, same key) */
function cableAmpacity(e: CableTableEntry): number {
  return e.ampacity75C
}

function cableKey(e: CableTableEntry, standard: PFCStandard): string {
  return standard === 'NEC' ? (e.sizeAWG ?? e.sizeMetric) : e.sizeMetric
}

function findCable(size: string, standard: PFCStandard): CableTableEntry | undefined {
  return getAvailableCableSizes(standard, 'copper').find(e => cableKey(e, standard) === size)
}

/** Copper cable sizes for override pickers */
export function cableOptions(standard: PFCStandard): { value: string; label: string; ampacityA: number }[] {
  return getAvailableCableSizes(standard, 'copper').map(e => ({
    value: cableKey(e, standard), label: formatCableSize(e), ampacityA: cableAmpacity(e),
  }))
}

export function sizeStep(
  index: number,
  currentA: number,
  standard: PFCStandard,
  protectionType: PFCProtectionType,
  detuned: boolean,
  override?: PFCStepOverride
): PFCSwitchgearStep {
  const designCurrentA = currentA * designCurrentFactor(standard)

  const contactorValue = override?.contactorA ?? nextRating(designCurrentA, CONTACTOR_AC6B_FRAMES_A)
  const protectionValue = override?.protectionA ?? nextRating(designCurrentA, protectionSeries(standard, protectionType))

  let cableEntry: CableTableEntry | undefined
  let cableValue: string | null
  if (override?.cableSize !== undefined) {
    cableEntry = findCable(override.cableSize, standard)
    cableValue = override.cableSize
  } else {
    cableEntry = findMinimumCableSize(designCurrentA, 'copper', 75, standard)
    cableValue = cableEntry ? cableKey(cableEntry, standard) : null
  }
  const ampacityA = cableEntry ? cableAmpacity(cableEntry) : null

  return {
    index,
    ratedCurrentA: currentA,
    designCurrentA,
    contactor: {
      value: contactorValue,
      overridden: override?.contactorA !== undefined,
      ok: contactorValue !== null && contactorValue >= designCurrentA - EPS,
      type: detuned
        ? 'AC-6b capacitor-duty (inrush limited by reactor)'
        : 'AC-6b capacitor-duty with damping resistors',
    },
    protection: {
      value: protectionValue,
      overridden: override?.protectionA !== undefined,
      ok: protectionValue !== null && protectionValue >= designCurrentA - EPS,
      type: protectionType,
    },
    cable: {
      value: cableValue,
      overridden: override?.cableSize !== undefined,
      ok: ampacityA !== null && ampacityA >= designCurrentA - EPS,
      ampacityA,
      label: cableEntry ? formatCableSize(cableEntry) : null,
    },
  }
}

function stepWarnings(s: PFCSwitchgearStep): PFCDesignWarning[] {
  const w: PFCDesignWarning[] = []
  const at = `step ${s.index} (design current ${s.designCurrentA.toFixed(1)} A)`
  const items = [
    { name: 'Contactor', item: s.contactor, missing: 'STEP_ABOVE_MAX_CONTACTOR' as const },
    { name: 'Protection', item: s.protection, missing: 'ABOVE_MAX_RATING' as const },
    { name: 'Cable', item: s.cable, missing: 'ABOVE_MAX_RATING' as const },
  ]
  for (const { name, item, missing } of items) {
    if (item.ok) continue
    if (item.overridden) {
      w.push({
        code: 'OVERRIDE_UNDERSIZED', severity: 'error', stepIndex: s.index,
        message: `${name} override on ${at} is below the required rating`,
      })
    } else if (item.value === null) {
      w.push({
        code: missing, severity: 'error', stepIndex: s.index,
        message: `${name} for ${at} exceeds the largest standard rating — split the step`,
      })
    }
  }
  return w
}

export function designSwitchgear(
  input: PFCInput,
  detuning: PFCDetuningDesign,
  design: PFCDesignInput
): PFCSwitchgearDesign {
  const factor = designCurrentFactor(input.standard)
  const protectionType = design.protectionType ?? defaultProtectionType(input.standard)
  const detuned = detuning.applied !== null

  const steps = detuning.steps.map(d =>
    sizeStep(d.index, d.currentA, input.standard, protectionType, detuned, design.overrides[d.index])
  )
  const totalRatedCurrentA = steps.reduce((a, s) => a + s.ratedCurrentA, 0)
  const totalDesignCurrentA = totalRatedCurrentA * factor
  const incomerA = steps.length > 0 ? recommendStandardBreaker(totalDesignCurrentA, input.standard) : null
  const busbarA = steps.length > 0 ? nextRating(totalDesignCurrentA, BUSBAR_RATINGS_A) : null

  const warnings = steps.flatMap(stepWarnings)
  if (steps.length > 0 && (incomerA === null || busbarA === null)) {
    warnings.push({
      code: 'ABOVE_MAX_RATING', severity: 'error',
      message: `Panel design current ${totalDesignCurrentA.toFixed(0)} A exceeds the largest standard incomer/busbar — split into several panels`,
    })
  }

  return { factor, protectionType, steps, totalRatedCurrentA, totalDesignCurrentA, incomerA, busbarA, warnings }
}
