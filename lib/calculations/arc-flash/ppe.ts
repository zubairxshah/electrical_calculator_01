// PPE assessment per NFPA 70E-2024: incident energy method, arc flash PPE category (table) method,
// and shock approach boundaries. IEC 61482 presentation is added on top in IEC mode.

import type {
  ApproachBoundaries,
  ArcFlashInput,
  ArcFlashResult,
  ArcFlashStandard,
  PpeAssessment,
  PpeOutcome,
  TableMethodResult,
} from '@/types/arc-flash'
import {
  APPROACH_BOUNDARIES,
  BELOW_THRESHOLD_ITEMS,
  NFPA_REFERENCES,
  PPE_ITEMS,
  PPE_THRESHOLDS,
  TABLE_130_7_C_15_A,
  imperialText,
  toMm,
} from '@/lib/standards/nfpa70e'

/** Incident energy (cal/cm²) → PPE outcome. Category upper bounds are inclusive (4.0 → Cat 1). */
export function ppeCategoryFromEnergy(energyCalcm2: number): PpeOutcome {
  if (energyCalcm2 < PPE_THRESHOLDS.boundaryCalcm2) return 'below-threshold'
  for (const c of PPE_THRESHOLDS.categories) {
    if (energyCalcm2 <= c.minArcRatingCalcm2) return c.category
  }
  return 'danger'
}

/** Table 130.4(E)(a) row for a nominal phase-to-phase voltage. */
export function approachBoundaries(voltageV: number): ApproachBoundaries {
  const row =
    APPROACH_BOUNDARIES.find((r) => voltageV >= r.minV && voltageV <= r.maxV) ??
    APPROACH_BOUNDARIES[APPROACH_BOUNDARIES.length - 1]
  return {
    limitedMovableMm: toMm(row.limitedMovable),
    limitedFixedMm: toMm(row.limitedFixed),
    restricted: row.restricted === 'avoid-contact' ? 'avoid-contact' : toMm(row.restricted),
    limitedMovableText: imperialText(row.limitedMovable),
    limitedFixedText: imperialText(row.limitedFixed),
    restrictedText: row.restricted === 'avoid-contact' ? 'Avoid contact' : imperialText(row.restricted),
  }
}

/**
 * Table 130.7(C)(15)(a). Compares voltage, available fault current, clearing time and working
 * distance with the row's parameters. Uses the NOMINAL-case clearing time, i.e. the time for the
 * available (bolted) fault current the table is expressed in.
 */
export function evaluateTableMethod(rowId: string, input: ArcFlashInput): TableMethodResult {
  const row = TABLE_130_7_C_15_A.find((r) => r.id === rowId)
  if (!row) throw new Error(`Unknown NFPA 70E table row: ${rowId}`)

  const failedLimits: string[] = []
  const v = input.voltageV
  const belowMin = row.minExclusive ? v <= row.minV : v < row.minV
  if (belowMin || v > row.maxV) {
    const range = row.minV === 0 ? `${row.maxV} V and below` : `${row.minExclusive ? '>' : ''}${row.minV}–${row.maxV} V`
    failedLimits.push(`Voltage ${v} V is outside this row (${range})`)
  }
  if (input.boltedFaultKA > row.maxFaultKA) {
    failedLimits.push(`Available fault current exceeds ${row.maxFaultKA} kA`)
  }
  const clearingS = input.arcingTimeNominalMs / 1000
  if (clearingS > row.maxClearingS) {
    failedLimits.push(`Fault clearing time exceeds ${row.maxClearingS} s`)
  }
  if (input.workingDistanceMm < row.minWorkingDistanceMm) {
    failedLimits.push(`Working distance is below the ${row.minWorkingDistanceMm} mm minimum`)
  }

  return { rowId, applicable: failedLimits.length === 0, category: row.category, afbMm: row.afbMm, failedLimits }
}

/**
 * IEC 61482 presentation (User Story 4); null in NEC mode. IEC 61482 rates garments by ATPV/ELIM
 * (IEC 61482-1-1 open-arc test), so the requirement is the governing incident energy rounded up to
 * 0.1 J/cm². Box-test classes (IEC 61482-1-2) are not derived from incident energy.
 */
function iecRequirement(result: ArcFlashResult, standard: ArcFlashStandard): PpeAssessment['iecRequirement'] {
  if (standard !== 'IEC') return null
  const minArcRatingJcm2 = Math.ceil(result.governing.incidentEnergyJcm2 * 10) / 10
  return {
    minArcRatingJcm2,
    text: `Arc-rated clothing with ATPV or ELIM (IEC 61482-1-1) ≥ ${minArcRatingJcm2.toFixed(1)} J/cm²; garments conforming to IEC 61482-2`,
    note: 'IEC 61482-1-2 box-test classes APC 1 / APC 2 are not selected from incident energy; confirm the garment ATPV/ELIM rating.',
  }
}

export function assessPpe(result: ArcFlashResult, input: ArcFlashInput, standard: ArcFlashStandard): PpeAssessment {
  const tableMethod =
    input.ppeMethod === 'table' && input.tableRowId ? evaluateTableMethod(input.tableRowId, input) : null

  // The table result is used only when every row parameter is satisfied; otherwise the incident
  // energy method applies (spec FR-012).
  const outcome: PpeOutcome =
    tableMethod?.applicable ? tableMethod.category : ppeCategoryFromEnergy(result.governing.incidentEnergyCalcm2)

  const rating =
    typeof outcome === 'number' ? PPE_THRESHOLDS.categories.find((c) => c.category === outcome) ?? null : null
  const items =
    typeof outcome === 'number' ? PPE_ITEMS[outcome] : outcome === 'below-threshold' ? BELOW_THRESHOLD_ITEMS : null

  const references = [
    tableMethod?.applicable ? NFPA_REFERENCES.tableMethod : NFPA_REFERENCES.incidentEnergyMethod,
    NFPA_REFERENCES.ppeCategories,
    NFPA_REFERENCES.approachBoundaries,
  ]

  return {
    method: input.ppeMethod,
    outcome,
    minArcRatingCalcm2: rating?.minArcRatingCalcm2 ?? null,
    minArcRatingJcm2: rating?.minArcRatingJcm2 ?? null,
    clothing: items?.clothing ?? [],
    equipment: items?.equipment ?? [],
    iecRequirement: iecRequirement(result, standard),
    tableMethod,
    approachBoundaries: approachBoundaries(input.voltageV),
    references,
  }
}
