/**
 * Curated manufacturer battery datasheet library (US4, ADR-006).
 *
 * Each entry maps to a canonical chemistry and pre-fills inputs with published
 * parameters. This also defines the parameter schema the (P3) OCR extraction
 * targets — see datasheetExtract.ts.
 */

import type { BatteryChemistry } from '@/lib/standards/batteryTypes'

export interface DatasheetEntry {
  id: string
  manufacturer: string
  model: string
  chemistry: BatteryChemistry
  /** Nominal block/unit voltage (V) */
  nominalVoltage: number
  /** Nameplate capacity of one unit/string (Ah) at the stated rate */
  nameplateAh: number
  /** Rate the nameplate Ah is quoted at, e.g. 'C/20' */
  ratedAtCRate: string
  /** Override chemistry Peukert exponent when published, else null */
  peukertExponent: number | null
  sourceUrl: string | null
}

export const DATASHEET_LIBRARY: DatasheetEntry[] = [
  // VRLA AGM
  { id: 'csb-gp12120', manufacturer: 'CSB', model: 'GP12120 (12V 12Ah)', chemistry: 'VRLA-AGM', nominalVoltage: 12, nameplateAh: 12, ratedAtCRate: 'C/20', peukertExponent: 1.2, sourceUrl: null },
  { id: 'yuasa-np100-12', manufacturer: 'Yuasa', model: 'NP100-12 (12V 100Ah)', chemistry: 'VRLA-AGM', nominalVoltage: 12, nameplateAh: 100, ratedAtCRate: 'C/20', peukertExponent: 1.2, sourceUrl: null },
  { id: 'eaton-9ah-agm', manufacturer: 'Eaton', model: '9Ah AGM block', chemistry: 'VRLA-AGM', nominalVoltage: 12, nameplateAh: 9, ratedAtCRate: 'C/20', peukertExponent: 1.2, sourceUrl: null },

  // VRLA GEL
  { id: 'sonnenschein-a602', manufacturer: 'Sonnenschein', model: 'A602/200 (2V 200Ah Gel)', chemistry: 'VRLA-GEL', nominalVoltage: 2, nameplateAh: 200, ratedAtCRate: 'C/20', peukertExponent: 1.18, sourceUrl: null },
  { id: 'trojan-31gel', manufacturer: 'Trojan', model: '31-GEL (12V 102Ah)', chemistry: 'VRLA-GEL', nominalVoltage: 12, nameplateAh: 102, ratedAtCRate: 'C/20', peukertExponent: 1.18, sourceUrl: null },

  // Flooded lead-acid
  { id: 'rolls-s550', manufacturer: 'Rolls', model: 'S-550 (6V 428Ah)', chemistry: 'FLA', nominalVoltage: 6, nameplateAh: 428, ratedAtCRate: 'C/20', peukertExponent: 1.25, sourceUrl: null },
  { id: 'trojan-t105', manufacturer: 'Trojan', model: 'T-105 (6V 225Ah)', chemistry: 'FLA', nominalVoltage: 6, nameplateAh: 225, ratedAtCRate: 'C/20', peukertExponent: 1.25, sourceUrl: null },

  // LiFePO4
  { id: 'battleborn-100', manufacturer: 'Battle Born', model: 'BB10012 (12V 100Ah LFP)', chemistry: 'Li-Ion-LFP', nominalVoltage: 12, nameplateAh: 100, ratedAtCRate: 'C/1', peukertExponent: 1.02, sourceUrl: null },
  { id: 'victron-200', manufacturer: 'Victron', model: 'LiFePO4 12.8V 200Ah', chemistry: 'Li-Ion-LFP', nominalVoltage: 12.8, nameplateAh: 200, ratedAtCRate: 'C/1', peukertExponent: 1.02, sourceUrl: null },

  // NMC
  { id: 'lg-resu10', manufacturer: 'LG', model: 'RESU10 (NMC)', chemistry: 'Li-Ion-NMC', nominalVoltage: 51.8, nameplateAh: 189, ratedAtCRate: 'C/1', peukertExponent: 1.02, sourceUrl: null },

  // NiCd
  { id: 'saft-sbm', manufacturer: 'Saft', model: 'SBM 161 (1.2V 161Ah NiCd)', chemistry: 'NiCd', nominalVoltage: 1.2, nameplateAh: 161, ratedAtCRate: 'C/5', peukertExponent: 1.1, sourceUrl: null },
]

export function getDatasheet(id: string): DatasheetEntry | undefined {
  return DATASHEET_LIBRARY.find((d) => d.id === id)
}

export function datasheetsForChemistry(chemistry: BatteryChemistry): DatasheetEntry[] {
  return DATASHEET_LIBRARY.filter((d) => d.chemistry === chemistry)
}
