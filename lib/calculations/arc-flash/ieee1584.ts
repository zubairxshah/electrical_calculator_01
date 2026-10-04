// IEEE 1584-2018 arc flash model core.
//
// Equations follow the standard's text (Eqs. 1–25). Where the IEEE spreadsheet v2.6.6 deviates
// (Voc = 600 V branch; VOA MV reduced case), we follow the standard — see research R3.
// Native number arithmetic is used deliberately (research R5 / plan Complexity Tracking).
// Units: V, kA, mm, ms, J/cm² (inputs); enclosure equivalent sizes are in inches as in the standard.

import type {
  ArcingCase,
  CaseResult,
  ElectrodeConfig,
  EnclosureCorrection,
  EnclosureDimensions,
  IntermediateValues,
} from '@/types/arc-flash'
import {
  ENCLOSURE_CONSTANTS,
  ENERGY_TABLES,
  TABLE_1,
  TABLE_2,
  TABLE_7_SHALLOW,
  TABLE_7_TYPICAL,
  type EnclosedConfig,
  type EnergyRow,
  type VoltageLevel,
} from './ieee1584Tables'

const MM_PER_IN = 25.4
const J_PER_CAL = 4.184
const LEVELS: VoltageLevel[] = [600, 2700, 14300]

export const isOpenAir = (config: ElectrodeConfig) => config === 'VOA' || config === 'HOA'

/** Eq. 2 / Table 2 — arcing current variation correction factor; voltageKV = Voc in kV. */
export function variationCorrectionFactor(config: ElectrodeConfig, voltageKV: number): number {
  const k = TABLE_2[config]
  const v = voltageKV
  return k.k1 * v ** 6 + k.k2 * v ** 5 + k.k3 * v ** 4 + k.k4 * v ** 3 + k.k5 * v ** 2 + k.k6 * v + k.k7
}

/** Eq. 1 / Table 1 — intermediate average arcing current (kA) at one voltage level. */
export function intermediateArcingCurrent(
  level: VoltageLevel,
  config: ElectrodeConfig,
  boltedFaultKA: number,
  gapMm: number
): number {
  const k = TABLE_1[level][config]
  const i = boltedFaultKA
  const poly = k.k4 * i ** 6 + k.k5 * i ** 5 + k.k6 * i ** 4 + k.k7 * i ** 3 + k.k8 * i ** 2 + k.k9 * i + k.k10
  return 10 ** (k.k1 + k.k2 * Math.log10(i) + k.k3 * Math.log10(gapMm)) * poly
}

/** Eqs. 11–15, Tables 6 and 7 — enclosure size correction factor. */
export function enclosureCorrection(
  config: ElectrodeConfig,
  voltageV: number,
  enclosure: EnclosureDimensions | null
): EnclosureCorrection {
  if (isOpenAir(config) || !enclosure) {
    return { type: 'open-air', equivalentWidthIn: 0, equivalentHeightIn: 0, ees: 0, cf: 1 }
  }
  const enclosed = config as EnclosedConfig
  const { heightMm, widthMm, depthMm } = enclosure
  const shallow = voltageV < 600 && heightMm < 508 && widthMm < 508 && depthMm <= 203.2
  const { A, B } = ENCLOSURE_CONSTANTS[enclosed]
  const voltageKV = voltageV / 1000

  // Eqs. 11/12: equivalent dimension (in) for 660.4–1244.6 mm, using the capped value above that
  const eq1112 = (dimMm: number) =>
    (660.4 + (Math.min(dimMm, 1244.6) - 660.4) * ((voltageKV + A) / B)) / MM_PER_IN

  const equivalent = (dimMm: number, isHeight: boolean): number => {
    if (dimMm < 508) return shallow ? 0.03937 * dimMm : 20
    if (dimMm <= 660.4) return 0.03937 * dimMm
    // VCB height uses the actual dimension (no Eq. 12) and 49 in above the 1244.6 mm limit
    if (isHeight && enclosed === 'VCB') return dimMm <= 1244.6 ? 0.03937 * dimMm : 49
    return eq1112(dimMm)
  }

  const equivalentWidthIn = equivalent(widthMm, false)
  const equivalentHeightIn = equivalent(heightMm, true)
  const ees = (equivalentWidthIn + equivalentHeightIn) / 2 // Eq. 13

  const cf = shallow
    ? 1 / (TABLE_7_SHALLOW[enclosed].b1 * ees ** 2 + TABLE_7_SHALLOW[enclosed].b2 * ees + TABLE_7_SHALLOW[enclosed].b3) // Eq. 15
    : TABLE_7_TYPICAL[enclosed].b1 * ees ** 2 + TABLE_7_TYPICAL[enclosed].b2 * ees + TABLE_7_TYPICAL[enclosed].b3 // Eq. 14

  return { type: shallow ? 'shallow' : 'typical', equivalentWidthIn, equivalentHeightIn, ees, cf }
}

/**
 * Common exponent of the incident energy and AFB equations (Eqs. 3–10), without the k12 distance term.
 * iK3 is the current in the k3 term; iK13 the current in the k13 term.
 */
function energyExponent(k: EnergyRow, gapMm: number, boltedFaultKA: number, iK3: number, iK13: number, cf: number) {
  const i = boltedFaultKA
  const denom = k.k4 * i ** 7 + k.k5 * i ** 6 + k.k6 * i ** 5 + k.k7 * i ** 4 + k.k8 * i ** 3 + k.k9 * i ** 2 + k.k10 * i
  return (
    k.k1 +
    k.k2 * Math.log10(gapMm) +
    (k.k3 * iK3) / denom +
    k.k11 * Math.log10(i) +
    k.k13 * Math.log10(iK13) +
    Math.log10(1 / cf)
  )
}

/** Eqs. 3–6: incident energy (J/cm²) */
function incidentEnergy(k: EnergyRow, x: number, workingDistanceMm: number, arcingTimeMs: number) {
  return (12.552 / 50) * arcingTimeMs * 10 ** (x + k.k12 * Math.log10(workingDistanceMm))
}

/** Eqs. 7–10: arc flash boundary (mm) — distance where E = 5.0 J/cm² */
function arcFlashBoundary(k: EnergyRow, x: number, arcingTimeMs: number) {
  return 10 ** ((x - Math.log10(20 / arcingTimeMs)) / -k.k12)
}

/** Eqs. 16–24: interpolation between the 600 / 2700 / 14 300 V results for 600 V < Voc ≤ 15 kV. */
function interpolate(voltageKV: number, x600: number, x2700: number, x14300: number): number {
  const x1 = ((x2700 - x600) / 2.1) * (voltageKV - 2.7) + x2700
  const x2 = ((x14300 - x2700) / 11.6) * (voltageKV - 14.3) + x14300
  if (voltageKV > 2.7) return x2
  return (x1 * (2.7 - voltageKV)) / 2.1 + (x2 * (voltageKV - 0.6)) / 2.1
}

export interface CaseParams {
  voltageV: number
  boltedFaultKA: number
  config: ElectrodeConfig
  gapMm: number
  workingDistanceMm: number
  arcingTimeMs: number
  cf: number
  arcingCase: ArcingCase
}

/** Arcing current, incident energy and arc flash boundary for one arcing case. */
export function calculateCase(p: CaseParams): CaseResult {
  const voltageKV = p.voltageV / 1000
  const reductionFactor =
    p.arcingCase === 'reduced' ? 1 - 0.5 * variationCorrectionFactor(p.config, voltageKV) : 1
  const iArc600Full = intermediateArcingCurrent(600, p.config, p.boltedFaultKA, p.gapMm)

  let arcingCurrentKA: number
  let incidentEnergyJcm2: number
  let arcFlashBoundaryMm: number
  let intermediates: IntermediateValues

  if (p.voltageV <= 600) {
    // §4.10 (208 V ≤ Voc ≤ 600 V): Eq. 25, then reduce the final current only.
    // The k3 term keeps the unreduced 600 V intermediate current.
    const v = voltageKV
    const iArcFull =
      1 / Math.sqrt((0.6 / v) ** 2 * (1 / iArc600Full ** 2 - (0.6 ** 2 - v ** 2) / (0.6 ** 2 * p.boltedFaultKA ** 2)))
    arcingCurrentKA = iArcFull * reductionFactor
    const k = ENERGY_TABLES[600][p.config]
    const x = energyExponent(k, p.gapMm, p.boltedFaultKA, iArc600Full, arcingCurrentKA, p.cf)
    incidentEnergyJcm2 = incidentEnergy(k, x, p.workingDistanceMm, p.arcingTimeMs)
    arcFlashBoundaryMm = arcFlashBoundary(k, x, p.arcingTimeMs)
    intermediates = { iArc600KA: iArc600Full, reductionFactor }
  } else {
    // 600 V < Voc ≤ 15 kV (Eqs. 16–24): reduce each intermediate current, use it in both the k3 and k13
    // terms at its level, then interpolate current, energy and boundary.
    const at = LEVELS.map((level) => {
      const i =
        (level === 600 ? iArc600Full : intermediateArcingCurrent(level, p.config, p.boltedFaultKA, p.gapMm)) *
        reductionFactor
      const k = ENERGY_TABLES[level][p.config]
      const x = energyExponent(k, p.gapMm, p.boltedFaultKA, i, i, p.cf)
      return {
        i,
        e: incidentEnergy(k, x, p.workingDistanceMm, p.arcingTimeMs),
        afb: arcFlashBoundary(k, x, p.arcingTimeMs),
      }
    })
    const [a600, a2700, a14300] = at
    arcingCurrentKA = interpolate(voltageKV, a600.i, a2700.i, a14300.i)
    incidentEnergyJcm2 = interpolate(voltageKV, a600.e, a2700.e, a14300.e)
    arcFlashBoundaryMm = interpolate(voltageKV, a600.afb, a2700.afb, a14300.afb)
    intermediates = {
      iArc600KA: a600.i,
      iArc2700KA: a2700.i,
      iArc14300KA: a14300.i,
      e600Jcm2: a600.e,
      e2700Jcm2: a2700.e,
      e14300Jcm2: a14300.e,
      afb600Mm: a600.afb,
      afb2700Mm: a2700.afb,
      afb14300Mm: a14300.afb,
      reductionFactor,
    }
  }

  return {
    case: p.arcingCase,
    arcingCurrentKA,
    arcingTimeMs: p.arcingTimeMs,
    incidentEnergyJcm2,
    incidentEnergyCalcm2: incidentEnergyJcm2 / J_PER_CAL,
    arcFlashBoundaryMm,
    intermediates,
  }
}
