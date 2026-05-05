// Motor Starting reference data
// Sources: NEC 430.7(B), IEC 60034-12, NEMA MG 1, IEEE 1668, NEC Ch.9 Table 9, IEC 60364-5-52

import type {
  CableImpedance,
  CableMaterial,
  CodeLetter,
  ConduitType,
  DipScenario,
  IecDesign,
  IecDesignClass,
  Ieee1668Threshold,
  NemaCodeLetter,
  NemaDesign,
  NemaDesignClass,
  ThermalLimitDefault,
} from '@/types/motor-starting'

// ── NEMA Code Letter table (NEC 430.7(B)) ───────────────────────────
// kVA/HP locked-rotor; midpoint used as default when only letter is provided.

export const NEMA_CODE_LETTERS: NemaCodeLetter[] = [
  { letter: 'A', kvaPerHpMin: 0,    kvaPerHpMax: 3.15, kvaPerHpMid: 1.57 },
  { letter: 'B', kvaPerHpMin: 3.15, kvaPerHpMax: 3.55, kvaPerHpMid: 3.35 },
  { letter: 'C', kvaPerHpMin: 3.55, kvaPerHpMax: 4.0,  kvaPerHpMid: 3.78 },
  { letter: 'D', kvaPerHpMin: 4.0,  kvaPerHpMax: 4.5,  kvaPerHpMid: 4.25 },
  { letter: 'E', kvaPerHpMin: 4.5,  kvaPerHpMax: 5.0,  kvaPerHpMid: 4.75 },
  { letter: 'F', kvaPerHpMin: 5.0,  kvaPerHpMax: 5.6,  kvaPerHpMid: 5.30 },
  { letter: 'G', kvaPerHpMin: 5.6,  kvaPerHpMax: 6.3,  kvaPerHpMid: 5.95 },
  { letter: 'H', kvaPerHpMin: 6.3,  kvaPerHpMax: 7.1,  kvaPerHpMid: 6.70 },
  { letter: 'J', kvaPerHpMin: 7.1,  kvaPerHpMax: 8.0,  kvaPerHpMid: 7.55 },
  { letter: 'K', kvaPerHpMin: 8.0,  kvaPerHpMax: 9.0,  kvaPerHpMid: 8.50 },
  { letter: 'L', kvaPerHpMin: 9.0,  kvaPerHpMax: 10.0, kvaPerHpMid: 9.50 },
  { letter: 'M', kvaPerHpMin: 10.0, kvaPerHpMax: 11.2, kvaPerHpMid: 10.60 },
  { letter: 'N', kvaPerHpMin: 11.2, kvaPerHpMax: 12.5, kvaPerHpMid: 11.85 },
  { letter: 'P', kvaPerHpMin: 12.5, kvaPerHpMax: 14.0, kvaPerHpMid: 13.25 },
  { letter: 'R', kvaPerHpMin: 14.0, kvaPerHpMax: 16.0, kvaPerHpMid: 15.00 },
  { letter: 'S', kvaPerHpMin: 16.0, kvaPerHpMax: 18.0, kvaPerHpMid: 17.00 },
  { letter: 'T', kvaPerHpMin: 18.0, kvaPerHpMax: 20.0, kvaPerHpMid: 19.00 },
  { letter: 'U', kvaPerHpMin: 20.0, kvaPerHpMax: 22.4, kvaPerHpMid: 21.20 },
  { letter: 'V', kvaPerHpMin: 22.4, kvaPerHpMax: 25.0, kvaPerHpMid: 23.70 },
]

export function getNemaCodeLetter(letter: string): NemaCodeLetter | undefined {
  return NEMA_CODE_LETTERS.find((c) => c.letter === letter.toUpperCase())
}

// ── IEC Design Classes (IEC 60034-12) ───────────────────────────────

export const IEC_DESIGN_CLASSES: IecDesignClass[] = [
  { design: 'N', iStartPerIRatedDefault: 6.5, tStartPerTRatedDefault: 1.6, tBreakdownPerTRated: 2.0 },
  { design: 'H', iStartPerIRatedDefault: 6.5, tStartPerTRatedDefault: 2.5, tBreakdownPerTRated: 3.0 },
]

export function getIecDesignClass(design: IecDesign): IecDesignClass {
  const found = IEC_DESIGN_CLASSES.find((d) => d.design === design)
  if (!found) throw new Error(`Unknown IEC design class: ${design}`)
  return found
}

// ── NEMA Design Classes (NEMA MG 1) ─────────────────────────────────

export const NEMA_DESIGN_CLASSES: NemaDesignClass[] = [
  { design: 'A', iStartPerIRatedTypical: 6.5, tStartPerTRated: 1.5, slipPercent: 5 },
  { design: 'B', iStartPerIRatedTypical: 6.5, tStartPerTRated: 1.4, slipPercent: 3 },
  { design: 'C', iStartPerIRatedTypical: 6.0, tStartPerTRated: 2.0, slipPercent: 5 },
  { design: 'D', iStartPerIRatedTypical: 5.5, tStartPerTRated: 2.75, slipPercent: 8 },
]

export function getNemaDesignClass(design: NemaDesign): NemaDesignClass {
  const found = NEMA_DESIGN_CLASSES.find((d) => d.design === design)
  if (!found) throw new Error(`Unknown NEMA design class: ${design}`)
  return found
}

// ── Thermal Limit Defaults (NEMA MG 1 typical t6/stall by HP range) ─

export const THERMAL_LIMIT_DEFAULTS: ThermalLimitDefault[] = [
  { hpMin: 1,   hpMax: 10,    stallTimeColdSec: 60, stallTimeHotSec: 30 },
  { hpMin: 11,  hpMax: 50,    stallTimeColdSec: 30, stallTimeHotSec: 15 },
  { hpMin: 51,  hpMax: 250,   stallTimeColdSec: 20, stallTimeHotSec: 10 },
  { hpMin: 251, hpMax: 99999, stallTimeColdSec: 12, stallTimeHotSec: 8 },
]

export function getThermalDefaultByHp(hp: number): ThermalLimitDefault {
  const found = THERMAL_LIMIT_DEFAULTS.find((t) => hp >= t.hpMin && hp <= t.hpMax)
  return found ?? THERMAL_LIMIT_DEFAULTS[THERMAL_LIMIT_DEFAULTS.length - 1]
}

// ── IEEE 1668 Voltage-Dip Thresholds ────────────────────────────────

export const IEEE_1668_THRESHOLDS: Ieee1668Threshold[] = [
  { scenario: 'steady_state_common',   dipPercentMax: 10, label: 'Steady-state common loads (10%)' },
  { scenario: 'transient_motor_start', dipPercentMax: 20, label: 'Transient motor start (20%)' },
  { scenario: 'sensitive_loads',       dipPercentMax: 5,  label: 'Sensitive loads (5%)' },
]

export function getIeee1668Threshold(scenario: DipScenario | string): Ieee1668Threshold {
  const found = IEEE_1668_THRESHOLDS.find((t) => t.scenario === scenario)
  if (!found) throw new Error(`Unknown dip scenario: ${scenario}`)
  return found
}

// ── Cable Impedance Tables ──────────────────────────────────────────
// NEC Ch.9 Table 9 (Cu, 600 V, 60 Hz, 75°C, ohms/1000ft → ohms/meter via ÷ 304.8)
// Steel conduit X is higher than PVC due to magnetic coupling.

interface RawCableEntry {
  sizeId: string
  pvcCu: { r: number; x: number }   // ohms/1000 ft
  steelCu: { r: number; x: number }
}

const NEC_RAW: RawCableEntry[] = [
  { sizeId: '12',  pvcCu: { r: 2.0,   x: 0.054 }, steelCu: { r: 2.0,   x: 0.068 } },
  { sizeId: '10',  pvcCu: { r: 1.2,   x: 0.050 }, steelCu: { r: 1.2,   x: 0.063 } },
  { sizeId: '8',   pvcCu: { r: 0.78,  x: 0.052 }, steelCu: { r: 0.78,  x: 0.065 } },
  { sizeId: '6',   pvcCu: { r: 0.49,  x: 0.051 }, steelCu: { r: 0.49,  x: 0.064 } },
  { sizeId: '4',   pvcCu: { r: 0.31,  x: 0.048 }, steelCu: { r: 0.31,  x: 0.060 } },
  { sizeId: '2',   pvcCu: { r: 0.19,  x: 0.045 }, steelCu: { r: 0.20,  x: 0.057 } },
  { sizeId: '1',   pvcCu: { r: 0.15,  x: 0.046 }, steelCu: { r: 0.16,  x: 0.057 } },
  { sizeId: '1/0', pvcCu: { r: 0.12,  x: 0.044 }, steelCu: { r: 0.13,  x: 0.055 } },
  { sizeId: '2/0', pvcCu: { r: 0.10,  x: 0.043 }, steelCu: { r: 0.10,  x: 0.054 } },
  { sizeId: '3/0', pvcCu: { r: 0.077, x: 0.042 }, steelCu: { r: 0.082, x: 0.052 } },
  { sizeId: '4/0', pvcCu: { r: 0.062, x: 0.041 }, steelCu: { r: 0.067, x: 0.051 } },
  { sizeId: '250', pvcCu: { r: 0.052, x: 0.041 }, steelCu: { r: 0.057, x: 0.052 } },
  { sizeId: '300', pvcCu: { r: 0.044, x: 0.041 }, steelCu: { r: 0.049, x: 0.051 } },
  { sizeId: '350', pvcCu: { r: 0.038, x: 0.040 }, steelCu: { r: 0.043, x: 0.050 } },
  { sizeId: '500', pvcCu: { r: 0.027, x: 0.039 }, steelCu: { r: 0.031, x: 0.048 } },
]

// IEC 60364-5-52 / BS 7671 (Cu, 70°C, ohms/km)
interface RawIecEntry {
  sizeId: string         // mm² as string
  rPerKm: number
  xPerKm: number
}

const IEC_RAW: RawIecEntry[] = [
  { sizeId: '2.5', rPerKm: 8.71,   xPerKm: 0.130 },
  { sizeId: '4',   rPerKm: 5.45,   xPerKm: 0.124 },
  { sizeId: '6',   rPerKm: 3.64,   xPerKm: 0.117 },
  { sizeId: '10',  rPerKm: 2.16,   xPerKm: 0.110 },
  { sizeId: '16',  rPerKm: 1.36,   xPerKm: 0.106 },
  { sizeId: '25',  rPerKm: 0.863,  xPerKm: 0.101 },
  { sizeId: '35',  rPerKm: 0.626,  xPerKm: 0.0982 },
  { sizeId: '50',  rPerKm: 0.461,  xPerKm: 0.0955 },
  { sizeId: '70',  rPerKm: 0.317,  xPerKm: 0.0934 },
  { sizeId: '95',  rPerKm: 0.231,  xPerKm: 0.0918 },
  { sizeId: '120', rPerKm: 0.183,  xPerKm: 0.0894 },
  { sizeId: '150', rPerKm: 0.147,  xPerKm: 0.0876 },
  { sizeId: '185', rPerKm: 0.118,  xPerKm: 0.0867 },
  { sizeId: '240', rPerKm: 0.0911, xPerKm: 0.0855 },
  { sizeId: '300', rPerKm: 0.0726, xPerKm: 0.0846 },
]

const FT_PER_M = 3.28084
const M_PER_KFT = 1000 / FT_PER_M  // 304.8 m

function toOhmPerMeter(ohmPer1000ft: number): number {
  return ohmPer1000ft / M_PER_KFT
}

// Aluminum conductors are ~1.6× resistance of copper (NEC Ch.9 Table 9 footnote).
const AL_RESISTANCE_FACTOR = 1.6

// Build the lookup table
export const CABLE_IMPEDANCES: CableImpedance[] = (() => {
  const out: CableImpedance[] = []
  for (const entry of NEC_RAW) {
    out.push({
      sizeId: entry.sizeId,
      material: 'Cu',
      conduitType: 'PVC',
      rPerMeterOhms: toOhmPerMeter(entry.pvcCu.r),
      xPerMeterOhms: toOhmPerMeter(entry.pvcCu.x),
      sourceTable: 'NEC Ch.9 Table 9',
    })
    out.push({
      sizeId: entry.sizeId,
      material: 'Cu',
      conduitType: 'Steel',
      rPerMeterOhms: toOhmPerMeter(entry.steelCu.r),
      xPerMeterOhms: toOhmPerMeter(entry.steelCu.x),
      sourceTable: 'NEC Ch.9 Table 9',
    })
    out.push({
      sizeId: entry.sizeId,
      material: 'Cu',
      conduitType: 'Aluminum',
      rPerMeterOhms: toOhmPerMeter(entry.pvcCu.r),
      xPerMeterOhms: toOhmPerMeter(entry.pvcCu.x),
      sourceTable: 'NEC Ch.9 Table 9',
    })
    // Aluminum conductors
    out.push({
      sizeId: entry.sizeId,
      material: 'Al',
      conduitType: 'PVC',
      rPerMeterOhms: toOhmPerMeter(entry.pvcCu.r * AL_RESISTANCE_FACTOR),
      xPerMeterOhms: toOhmPerMeter(entry.pvcCu.x),
      sourceTable: 'NEC Ch.9 Table 9',
    })
    out.push({
      sizeId: entry.sizeId,
      material: 'Al',
      conduitType: 'Steel',
      rPerMeterOhms: toOhmPerMeter(entry.steelCu.r * AL_RESISTANCE_FACTOR),
      xPerMeterOhms: toOhmPerMeter(entry.steelCu.x),
      sourceTable: 'NEC Ch.9 Table 9',
    })
    out.push({
      sizeId: entry.sizeId,
      material: 'Al',
      conduitType: 'Aluminum',
      rPerMeterOhms: toOhmPerMeter(entry.pvcCu.r * AL_RESISTANCE_FACTOR),
      xPerMeterOhms: toOhmPerMeter(entry.pvcCu.x),
      sourceTable: 'NEC Ch.9 Table 9',
    })
  }
  // IEC sizes — overlap on 4/6/10 with NEC by sizeId; IEC entries use mm² convention,
  // but the lookup is keyed on (sizeId, material, conduit) and IEC's mm² strings ('2.5',
  // '16', '25', '35', '50', '70', '95', '120', '150', '185', '240') don't collide with
  // NEC AWG/kcmil identifiers. The shared values ('4', '6', '10', '300') are kept as NEC
  // (AWG/kcmil) here; users in IEC mode pick from a distinct mm²-only list in the UI.
  for (const entry of IEC_RAW) {
    if (NEC_RAW.some((n) => n.sizeId === entry.sizeId)) continue
    const rOhmPerM = entry.rPerKm / 1000
    const xOhmPerM = entry.xPerKm / 1000
    for (const conduit of ['PVC', 'Steel', 'Aluminum'] as ConduitType[]) {
      const xMul = conduit === 'Steel' ? 1.25 : 1.0
      out.push({
        sizeId: entry.sizeId,
        material: 'Cu',
        conduitType: conduit,
        rPerMeterOhms: rOhmPerM,
        xPerMeterOhms: xOhmPerM * xMul,
        sourceTable: 'IEC 60364-5-52',
      })
      out.push({
        sizeId: entry.sizeId,
        material: 'Al',
        conduitType: conduit,
        rPerMeterOhms: rOhmPerM * AL_RESISTANCE_FACTOR,
        xPerMeterOhms: xOhmPerM * xMul,
        sourceTable: 'IEC 60364-5-52',
      })
    }
  }
  return out
})()

export function getCableImpedance(
  sizeId: string,
  material: CableMaterial,
  conduit: ConduitType,
): CableImpedance | undefined {
  return CABLE_IMPEDANCES.find(
    (c) => c.sizeId === sizeId && c.material === material && c.conduitType === conduit,
  )
}

// ── Method default ratings (cost / complexity / labels) ─────────────

export const METHOD_LABELS: Record<string, string> = {
  DOL: 'Direct-On-Line',
  STAR_DELTA: 'Star-Delta (Y-Δ)',
  AUTOTRANSFORMER: 'Autotransformer',
  SOFT_STARTER: 'Soft Starter',
  VFD: 'Variable Frequency Drive',
}

export const COST_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
}

export const COMPLEXITY_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
}
