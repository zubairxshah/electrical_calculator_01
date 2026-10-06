// Arc flash equipment label content per NFPA 70E-2024 130.5(H). Derived, never stored.

import type {
  ArcFlashInput,
  ArcFlashLabel,
  ArcFlashResult,
  ArcFlashStandard,
  PpeAssessment,
} from '@/types/arc-flash'

/** ANSI Z535 signal word threshold: DANGER at or above 40 cal/cm² */
export const DANGER_THRESHOLD_CALCM2 = 40

export function buildArcFlashLabel(
  input: ArcFlashInput,
  result: ArcFlashResult,
  ppe: PpeAssessment,
  standard: ArcFlashStandard
): ArcFlashLabel {
  const g = result.governing
  const ab = ppe.approachBoundaries
  // When the PPE category (table) method applies, its arc flash boundary is the one to post.
  const arcFlashBoundaryMm = ppe.tableMethod?.applicable ? ppe.tableMethod.afbMm : g.arcFlashBoundaryMm

  return {
    signalWord: g.incidentEnergyCalcm2 >= DANGER_THRESHOLD_CALCM2 ? 'DANGER' : 'WARNING',
    nominalVoltageV: input.voltageV,
    arcFlashBoundaryMm,
    incidentEnergyJcm2: g.incidentEnergyJcm2,
    incidentEnergyCalcm2: g.incidentEnergyCalcm2,
    workingDistanceMm: input.workingDistanceMm,
    ppeOutcome: ppe.outcome,
    minArcRatingCalcm2: ppe.minArcRatingCalcm2,
    minArcRatingJcm2: ppe.iecRequirement?.minArcRatingJcm2 ?? ppe.minArcRatingJcm2,
    limitedApproachMm: ab.limitedFixedMm,
    limitedApproachText: ab.limitedFixedText,
    restrictedApproachMm: ab.restricted,
    restrictedApproachText: ab.restrictedText,
    equipmentId: input.equipmentId,
    date: result.calculatedAt.slice(0, 10),
    standard,
  }
}
