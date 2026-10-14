/**
 * Battery reference data for standards-based sizing (feature 015, ADR-008).
 *
 * Kept separate from batteryTypes.ts (shared with Battery Comparison) so the
 * sizing-only electrical, charging and ventilation data does not widen the
 * shared chemistry spec. All values USER-APPROVED 2026-10-15 (T003–T005).
 *
 * @see specs/015-battery-standards/research.md D5–D9
 */

import type { BatteryChemistry, BatteryTypeSpec } from './batteryTypes'

/** Per-chemistry electrical/charging/ventilation profile (research D6–D8). */
export interface BatteryElectricalProfile {
  /** Nominal cell voltage (V/cell) */
  nominalCellVoltage: number
  /** Float charge voltage (V/cell) */
  floatVoltagePerCell: number
  /** Default end-of-discharge voltage (V/cell) */
  endVoltagePerCell: number
  /** Recharge (Ah-return) factor, IEEE 946 approach */
  rechargeFactor: number
  /** Maximum recommended charge rate (C-rate fraction) */
  maxChargeCRate: number
  /** Gas-producing current (mA/Ah) for ventilation; null = not applicable */
  igas: { float: number; boost: number } | null
  /** Use the IEEE 485 lead-acid temperature correction table */
  usesLeadAcidTempTable: boolean
}

export const BATTERY_ELECTRICAL_PROFILES: Record<BatteryChemistry, BatteryElectricalProfile> = {
  FLA: { nominalCellVoltage: 2.0, floatVoltagePerCell: 2.25, endVoltagePerCell: 1.75, rechargeFactor: 1.1, maxChargeCRate: 0.2, igas: { float: 5, boost: 20 }, usesLeadAcidTempTable: true },
  'VRLA-AGM': { nominalCellVoltage: 2.0, floatVoltagePerCell: 2.27, endVoltagePerCell: 1.75, rechargeFactor: 1.1, maxChargeCRate: 0.25, igas: { float: 1, boost: 8 }, usesLeadAcidTempTable: true },
  'VRLA-GEL': { nominalCellVoltage: 2.0, floatVoltagePerCell: 2.27, endVoltagePerCell: 1.75, rechargeFactor: 1.1, maxChargeCRate: 0.25, igas: { float: 1, boost: 8 }, usesLeadAcidTempTable: true },
  'Li-Ion-LFP': { nominalCellVoltage: 3.2, floatVoltagePerCell: 3.4, endVoltagePerCell: 2.8, rechargeFactor: 1.05, maxChargeCRate: 0.5, igas: null, usesLeadAcidTempTable: false },
  'Li-Ion-NMC': { nominalCellVoltage: 3.65, floatVoltagePerCell: 4.1, endVoltagePerCell: 3.0, rechargeFactor: 1.05, maxChargeCRate: 0.5, igas: null, usesLeadAcidTempTable: false },
  'Li-Ion-LTO': { nominalCellVoltage: 2.3, floatVoltagePerCell: 2.65, endVoltagePerCell: 1.8, rechargeFactor: 1.05, maxChargeCRate: 2.0, igas: null, usesLeadAcidTempTable: false },
  NiCd: { nominalCellVoltage: 1.2, floatVoltagePerCell: 1.42, endVoltagePerCell: 1.14, rechargeFactor: 1.4, maxChargeCRate: 0.2, igas: { float: 5, boost: 50 }, usesLeadAcidTempTable: false },
  NiFe: { nominalCellVoltage: 1.2, floatVoltagePerCell: 1.45, endVoltagePerCell: 1.0, rechargeFactor: 1.4, maxChargeCRate: 0.2, igas: { float: 5, boost: 50 }, usesLeadAcidTempTable: false },
  'Flow-Vanadium': { nominalCellVoltage: 1.4, floatVoltagePerCell: 1.55, endVoltagePerCell: 1.1, rechargeFactor: 1.25, maxChargeCRate: 0.25, igas: null, usesLeadAcidTempTable: false },
}

export function getElectricalProfile(id: BatteryChemistry): BatteryElectricalProfile {
  return BATTERY_ELECTRICAL_PROFILES[id]
}

/**
 * IEEE 485 lead-acid cell-size temperature correction factors (research D5).
 * Electrolyte temperature in °C (converted from the published °F rows).
 */
export const LEAD_ACID_TEMP_TABLE: ReadonlyArray<{ c: number; tcf: number }> = [
  { c: -3.9, tcf: 1.52 },
  { c: -1.1, tcf: 1.43 },
  { c: 1.7, tcf: 1.35 },
  { c: 4.4, tcf: 1.3 },
  { c: 7.2, tcf: 1.25 },
  { c: 10.0, tcf: 1.19 },
  { c: 12.8, tcf: 1.15 },
  { c: 15.6, tcf: 1.11 },
  { c: 18.3, tcf: 1.08 },
  { c: 21.1, tcf: 1.04 },
  { c: 23.9, tcf: 1.011 },
  { c: 25.0, tcf: 1.0 },
  { c: 26.7, tcf: 0.98 },
  { c: 29.4, tcf: 0.96 },
  { c: 32.2, tcf: 0.94 },
  { c: 35.0, tcf: 0.93 },
  { c: 37.8, tcf: 0.91 },
  { c: 40.6, tcf: 0.89 },
  { c: 43.3, tcf: 0.88 },
  { c: 46.1, tcf: 0.87 },
  { c: 48.9, tcf: 0.86 },
  { c: 51.7, tcf: 0.85 },
]

/** Common standard battery-charger output ratings (A), research D7. */
export const STANDARD_CHARGER_RATINGS_A: readonly number[] = [
  10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500,
]

/** NFPA 855-2023 threshold quantities (kWh) by chemistry category, research D9. */
export const NFPA855_THRESHOLDS_KWH: Record<BatteryTypeSpec['category'], number> = {
  'Lead-Acid': 70,
  'Nickel-Based': 70,
  'Lithium-Ion': 20,
  Flow: 20,
}

/** NEC 480.7 — disconnecting means required above this nominal DC voltage. */
export const NEC480_DISCONNECT_V = 60

/** NEC 706.1 — ESS article applies above 3.6 MJ (1 kWh). */
export const NEC706_ESS_MIN_KWH = 1

/** Default design margin (IEEE 485 practice, research D3). */
export const DESIGN_MARGIN_DEFAULT = 1.1

/** Default conversion efficiency by load type (research D2). */
export const CONVERSION_EFFICIENCY_DEFAULT = { ac: 0.95, dc: 1.0 } as const

/** Default recharge time (h), research D7. */
export const RECHARGE_HOURS_DEFAULT = 8
