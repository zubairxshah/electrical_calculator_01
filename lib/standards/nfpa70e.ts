// NFPA 70E-2024 data used by the Arc Flash calculator.
//
// - PPE categories and minimum arc ratings: Table 130.7(C)(15)(c)
// - Arc flash PPE category (table) method, AC equipment: Table 130.7(C)(15)(a)
// - Shock approach boundaries, AC: Table 130.4(E)(a)
//
// Numeric values are encoded as published. Clothing/equipment item names are PARAPHRASED (NFPA text
// is copyrighted) — consult the standard for the full wording and footnotes.

import type { PpeCategory } from '@/types/arc-flash'

const J_PER_CAL = 4.184
const MM_PER_IN = 25.4

export const PPE_THRESHOLDS = {
  /** Incident energy defining the arc flash boundary; below it no arc-rated PPE category applies */
  boundaryCalcm2: 1.2,
  boundaryJcm2: 5.0,
  categories: [
    { category: 1 as PpeCategory, minArcRatingCalcm2: 4, minArcRatingJcm2: 16.75 },
    { category: 2 as PpeCategory, minArcRatingCalcm2: 8, minArcRatingJcm2: 33.5 },
    { category: 3 as PpeCategory, minArcRatingCalcm2: 25, minArcRatingJcm2: 104.7 },
    { category: 4 as PpeCategory, minArcRatingCalcm2: 40, minArcRatingJcm2: 167.5 },
  ],
} as const

export interface PpeItems {
  clothing: string[]
  equipment: string[]
}

const BASE_EQUIPMENT = [
  'Hard hat',
  'Safety glasses or safety goggles',
  'Hearing protection (ear canal inserts)',
]

/** Paraphrased summary of Table 130.7(C)(15)(c) items per category. */
export const PPE_ITEMS: Record<PpeCategory, PpeItems> = {
  1: {
    clothing: [
      'Arc-rated long-sleeve shirt and pants, or arc-rated coverall (≥ 4 cal/cm²)',
      'Arc-rated face shield or arc flash suit hood',
      'Arc-rated outerwear (jacket, parka, rainwear, hard hat liner) as needed',
    ],
    equipment: [
      ...BASE_EQUIPMENT,
      'Heavy-duty leather gloves, arc-rated gloves, or rubber insulating gloves with protectors',
      'Leather footwear as needed',
    ],
  },
  2: {
    clothing: [
      'Arc-rated long-sleeve shirt and pants, or arc-rated coverall (≥ 8 cal/cm²)',
      'Arc-rated flash suit hood, or arc-rated face shield with arc-rated balaclava',
      'Arc-rated outerwear (jacket, parka, rainwear, hard hat liner) as needed',
    ],
    equipment: [
      ...BASE_EQUIPMENT,
      'Heavy-duty leather gloves, arc-rated gloves, or rubber insulating gloves with protectors',
      'Leather footwear',
    ],
  },
  3: {
    clothing: [
      'Arc-rated clothing system with a combined arc rating ≥ 25 cal/cm² (shirt, pants, coverall, flash suit jacket and pants as required)',
      'Arc-rated arc flash suit hood',
      'Arc-rated gloves or rubber insulating gloves with protectors',
      'Arc-rated outerwear as needed',
    ],
    equipment: [...BASE_EQUIPMENT, 'Leather footwear'],
  },
  4: {
    clothing: [
      'Arc-rated clothing system with a combined arc rating ≥ 40 cal/cm² (shirt, pants, coverall, flash suit jacket and pants as required)',
      'Arc-rated arc flash suit hood',
      'Arc-rated gloves or rubber insulating gloves with protectors',
      'Arc-rated outerwear as needed',
    ],
    equipment: [...BASE_EQUIPMENT, 'Leather footwear'],
  },
}

export const BELOW_THRESHOLD_ITEMS: PpeItems = {
  clothing: ['No arc-rated PPE category required — wear non-melting (or untreated natural fibre) clothing'],
  equipment: ['Shock protection and other PPE as required by the task'],
}

export interface TableMethodRow {
  id: string
  label: string
  /** Inclusive nominal voltage range (V); minExclusive marks "greater than" lower bounds */
  minV: number
  maxV: number
  minExclusive?: boolean
  maxFaultKA: number
  maxClearingS: number
  minWorkingDistanceMm: number
  category: 1 | 2 | 4
  afbMm: number
}

/** Table 130.7(C)(15)(a) — arc flash PPE categories for AC systems (10 equipment rows). */
export const TABLE_130_7_C_15_A: TableMethodRow[] = [
  { id: 'panelboard-le240', label: 'Panelboards or other equipment rated 240 V and below', minV: 0, maxV: 240, maxFaultKA: 25, maxClearingS: 0.03, minWorkingDistanceMm: 455, category: 1, afbMm: 485 },
  { id: 'panelboard-240-600', label: 'Panelboards or other equipment rated > 240 V up to 600 V', minV: 240, minExclusive: true, maxV: 600, maxFaultKA: 25, maxClearingS: 0.03, minWorkingDistanceMm: 455, category: 2, afbMm: 900 },
  { id: 'mcc-600-65ka', label: '600 V class motor control centers (65 kA, 2 cycles)', minV: 277, maxV: 600, maxFaultKA: 65, maxClearingS: 0.03, minWorkingDistanceMm: 455, category: 2, afbMm: 1500 },
  { id: 'other-600-65ka', label: 'Other 600 V class equipment, 277–600 V nominal (65 kA, 2 cycles)', minV: 277, maxV: 600, maxFaultKA: 65, maxClearingS: 0.03, minWorkingDistanceMm: 455, category: 2, afbMm: 1500 },
  { id: 'mcc-600-42ka', label: '600 V class motor control centers (42 kA, 20 cycles)', minV: 277, maxV: 600, maxFaultKA: 42, maxClearingS: 0.33, minWorkingDistanceMm: 455, category: 4, afbMm: 4300 },
  { id: 'switchgear-600', label: '600 V class switchgear (power circuit breakers or fused switches) and switchboards', minV: 277, maxV: 600, maxFaultKA: 35, maxClearingS: 0.5, minWorkingDistanceMm: 455, category: 4, afbMm: 6000 },
  { id: 'nema-e2-starter', label: 'NEMA E2 (fused contactor) motor starters, 2.3–7.2 kV', minV: 2300, maxV: 7200, maxFaultKA: 35, maxClearingS: 0.24, minWorkingDistanceMm: 910, category: 4, afbMm: 12000 },
  { id: 'metal-clad-1-15kv', label: 'Metal-clad switchgear, 1–15 kV', minV: 1000, maxV: 15000, maxFaultKA: 35, maxClearingS: 0.24, minWorkingDistanceMm: 910, category: 4, afbMm: 12000 },
  { id: 'metal-enclosed-1-15kv', label: 'Metal-enclosed interrupter switchgear, fused or unfused, 1–15 kV', minV: 1000, maxV: 15000, maxFaultKA: 35, maxClearingS: 0.24, minWorkingDistanceMm: 910, category: 4, afbMm: 12000 },
  { id: 'other-1-15kv', label: 'Other equipment, 1–15 kV', minV: 1000, maxV: 15000, maxFaultKA: 35, maxClearingS: 0.24, minWorkingDistanceMm: 910, category: 4, afbMm: 12000 },
]

export const TABLE_METHOD_NOTE =
  'For equipment rated 600 V and below protected by upstream current-limiting fuses or current-limiting molded-case breakers rated 200 A or less, the category may be reduced by one (not below Category 1). Not applied automatically.'

interface ImperialDistance {
  ft: number
  in: number
}

export interface ApproachBoundaryRow {
  minV: number
  maxV: number
  limitedMovable: ImperialDistance
  limitedFixed: ImperialDistance
  restricted: ImperialDistance | 'avoid-contact'
}

/**
 * Table 130.4(E)(a) — shock protection approach boundaries, AC, phase-to-phase.
 * Imperial values are the source of truth; mm values are exact conversions.
 * TODO(T031): verify against a licensed NFPA 70E-2024 copy — the 2024 edition revised the published
 * METRIC restricted-boundary values (rounded up to align with OSHA 1910.269, e.g. 0.30 → 0.31 m) and
 * notes that restricted boundaries assume elevations up to 900 m (3000 ft).
 */
export const APPROACH_BOUNDARIES: ApproachBoundaryRow[] = [
  { minV: 50, maxV: 150, limitedMovable: { ft: 10, in: 0 }, limitedFixed: { ft: 3, in: 6 }, restricted: 'avoid-contact' },
  { minV: 151, maxV: 750, limitedMovable: { ft: 10, in: 0 }, limitedFixed: { ft: 3, in: 6 }, restricted: { ft: 1, in: 0 } },
  { minV: 751, maxV: 15000, limitedMovable: { ft: 10, in: 0 }, limitedFixed: { ft: 5, in: 0 }, restricted: { ft: 2, in: 2 } },
]

export const toMm = (d: ImperialDistance) => (d.ft * 12 + d.in) * MM_PER_IN
export const imperialText = (d: ImperialDistance) => `${d.ft} ft ${d.in} in`
export const calToJ = (cal: number) => cal * J_PER_CAL

export const NFPA_REFERENCES = {
  ppeCategories: 'NFPA 70E-2024 Table 130.7(C)(15)(c)',
  tableMethod: 'NFPA 70E-2024 Table 130.7(C)(15)(a)',
  approachBoundaries: 'NFPA 70E-2024 Table 130.4(E)(a)',
  incidentEnergyMethod: 'NFPA 70E-2024 130.5(G) (incident energy analysis method)',
  label: 'NFPA 70E-2024 130.5(H) (equipment labeling)',
}
