// Arc Flash Calculator orchestration: both arcing cases (each with its own clearing time,
// spec FR-007), governing case, and non-blocking warnings (research R7).

import type {
  ArcFlashInput,
  ArcFlashResult,
  ArcFlashWarning,
  ArcingCase,
  CaseResult,
} from '@/types/arc-flash'
import { modelRangeErrors } from '@/lib/validation/arcFlashValidation'
import { calculateCase, enclosureCorrection, isOpenAir, variationCorrectionFactor } from './ieee1584'

const TWO_SECONDS_MS = 2000
const ENCLOSURE_LIMIT_MM = 1244.6

export class ArcFlashRangeError extends Error {
  constructor(public readonly details: string[]) {
    super(`Arc flash input outside the IEEE 1584-2018 model range: ${details.join('; ')}`)
    this.name = 'ArcFlashRangeError'
  }
}

/** The case with the higher incident energy governs; a tie goes to the nominal case. */
export function pickGoverning(nominal: CaseResult, reduced: CaseResult): ArcingCase {
  return reduced.incidentEnergyJcm2 > nominal.incidentEnergyJcm2 ? 'reduced' : 'nominal'
}

function collectWarnings(input: ArcFlashInput): ArcFlashWarning[] {
  const warnings: ArcFlashWarning[] = []
  const { enclosure } = input
  const enclosed = !isOpenAir(input.electrodeConfig) && enclosure

  if (enclosed && (enclosure.heightMm > ENCLOSURE_LIMIT_MM || enclosure.widthMm > ENCLOSURE_LIMIT_MM)) {
    warnings.push({
      code: 'ENCLOSURE_CAPPED',
      severity: 'warning',
      message: 'Enclosure height or width above 1244.6 mm (49 in) — the model uses the 1244.6 mm limit value.',
      clause: 'IEEE 1584-2018 Eqs. 11–15 (enclosure size correction)',
    })
  }
  if (enclosed && enclosure.widthMm < 4 * input.gapMm) {
    warnings.push({
      code: 'OPENING_LT_4G',
      severity: 'warning',
      message: `Enclosure width is less than 4 × gap (${(4 * input.gapMm).toFixed(1)} mm) — outside the tested enclosure geometry.`,
      clause: 'IEEE 1584-2018 (model range and test configurations)',
    })
  }
  if (input.arcingTimeNominalMs > TWO_SECONDS_MS || input.arcingTimeReducedMs > TWO_SECONDS_MS) {
    warnings.push({
      code: 'TIME_GT_2S',
      severity: 'warning',
      message: input.applyTwoSecondCap
        ? 'Arcing time capped at 2 s. Confirm a worker could reasonably move away from the arc within 2 s.'
        : 'Arcing time exceeds 2 s. IEEE 1584 guidance allows a 2 s cap only where a worker can reasonably escape.',
      clause: 'IEEE 1584-2018 (arc duration guidance)',
    })
  }
  if (input.arcingTimeReducedMs < input.arcingTimeNominalMs) {
    warnings.push({
      code: 'REDUCED_TIME_SHORTER',
      severity: 'warning',
      message:
        'The reduced-current clearing time is shorter than the nominal one. Inverse-time devices normally clear more slowly at lower current — check the time-current curve.',
      clause: 'IEEE 1584-2018 Eq. 2 (arcing current variation)',
    })
  }
  if (input.voltageV >= 208 && input.voltageV <= 240) {
    warnings.push({
      code: 'LOW_VOLTAGE_SUSTAIN',
      severity: 'info',
      message:
        'Arcs are less likely to be sustained at 208–240 V, but IEEE 1584-2018 does not exempt these systems; the result is calculated as normal.',
      clause: 'IEEE 1584-2018 (model range and test configurations)',
    })
  }
  return warnings
}

export function calculateArcFlash(input: ArcFlashInput): ArcFlashResult {
  const rangeErrors = modelRangeErrors(input).filter((e) => e.code !== 'TABLE_ROW_REQUIRED')
  if (rangeErrors.length > 0) throw new ArcFlashRangeError(rangeErrors.map((e) => e.message))

  const enclosure = enclosureCorrection(input.electrodeConfig, input.voltageV, input.enclosure)
  const cap = (ms: number) => (input.applyTwoSecondCap ? Math.min(ms, TWO_SECONDS_MS) : ms)
  const base = {
    voltageV: input.voltageV,
    boltedFaultKA: input.boltedFaultKA,
    config: input.electrodeConfig,
    gapMm: input.gapMm,
    workingDistanceMm: input.workingDistanceMm,
    cf: enclosure.cf,
  }

  const nominal = calculateCase({ ...base, arcingTimeMs: cap(input.arcingTimeNominalMs), arcingCase: 'nominal' })
  const reduced = calculateCase({ ...base, arcingTimeMs: cap(input.arcingTimeReducedMs), arcingCase: 'reduced' })
  const governingCase = pickGoverning(nominal, reduced)
  const modelPath = input.voltageV <= 600 ? 'LV' : 'MV'

  return {
    nominal,
    reduced,
    governingCase,
    governing: governingCase === 'nominal' ? nominal : reduced,
    varCf: variationCorrectionFactor(input.electrodeConfig, input.voltageV / 1000),
    enclosure,
    warnings: collectWarnings(input),
    modelPath,
    standardRefs: [
      'IEEE 1584-2018 §4.10 (Voc ≤ 600 V) / interpolation method (Voc > 600 V)',
      modelPath === 'LV' ? 'IEEE 1584-2018 Eq. 1, 2, 25' : 'IEEE 1584-2018 Eq. 1, 2, 16–24',
      'IEEE 1584-2018 Eqs. 3–15, Tables 1–5, 7',
    ],
    calculatedAt: new Date().toISOString(),
  }
}
