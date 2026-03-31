// Generator Sizing Reference Data
// Standards: ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702

import type {
  NemaCodeLetter,
  StartingMethod,
  Frequency,
  FuelType,
  NecClassification,
} from '@/types/generator-sizing'

// ── NEMA Motor Code Letters (kVA/HP locked rotor) ────────────────────

export const NEMA_CODE_LETTERS: Record<NemaCodeLetter, { min: number; max: number; midpoint: number }> = {
  A: { min: 0,     max: 3.14,  midpoint: 1.57  },
  B: { min: 3.15,  max: 3.54,  midpoint: 3.35  },
  C: { min: 3.55,  max: 3.99,  midpoint: 3.77  },
  D: { min: 4.0,   max: 4.49,  midpoint: 4.25  },
  E: { min: 4.5,   max: 4.99,  midpoint: 4.75  },
  F: { min: 5.0,   max: 5.59,  midpoint: 5.30  },
  G: { min: 5.6,   max: 6.29,  midpoint: 5.95  },
  H: { min: 6.3,   max: 7.09,  midpoint: 6.70  },
  J: { min: 7.1,   max: 7.99,  midpoint: 7.55  },
  K: { min: 8.0,   max: 8.99,  midpoint: 8.50  },
  L: { min: 9.0,   max: 9.99,  midpoint: 9.50  },
  M: { min: 10.0,  max: 11.19, midpoint: 10.60 },
  N: { min: 11.2,  max: 12.49, midpoint: 11.85 },
  P: { min: 12.5,  max: 13.99, midpoint: 13.25 },
  R: { min: 14.0,  max: 15.99, midpoint: 15.00 },
  S: { min: 16.0,  max: 17.99, midpoint: 17.00 },
  T: { min: 18.0,  max: 19.99, midpoint: 19.00 },
  U: { min: 20.0,  max: 22.39, midpoint: 21.20 },
  V: { min: 22.4,  max: 22.4,  midpoint: 22.40 },
}

/** Get locked rotor kVA per HP for a NEMA code letter */
export function getLrKvaPerHp(codeLetter: NemaCodeLetter): number {
  return NEMA_CODE_LETTERS[codeLetter].midpoint
}

// ── Starting Method Multipliers ──────────────────────────────────────

export const STARTING_METHOD_MULTIPLIERS: Record<StartingMethod, number> = {
  'dol': 1.00,
  'star-delta': 0.33,
  'autotransformer-65': 0.42,
  'autotransformer-80': 0.64,
  'soft-starter': 0.50,
  'vfd': 0.30,
}

export const STARTING_METHOD_LABELS: Record<StartingMethod, string> = {
  'dol': 'Direct On Line (DOL)',
  'star-delta': 'Star-Delta (Y-Δ)',
  'autotransformer-65': 'Autotransformer 65%',
  'autotransformer-80': 'Autotransformer 80%',
  'soft-starter': 'Soft Starter',
  'vfd': 'Variable Frequency Drive (VFD)',
}

// ── Standard Generator Ratings (kVA) ─────────────────────────────────

export const STANDARD_RATINGS_60HZ: number[] = [
  15, 20, 25, 30, 40, 50, 60, 75, 80, 100,
  125, 150, 175, 200, 250, 300, 350, 400, 500, 600,
  750, 800, 1000, 1250, 1500, 1750, 2000, 2500, 3000,
]

export const STANDARD_RATINGS_50HZ: number[] = [
  15, 20, 25, 30, 40, 50, 63, 75, 100, 125,
  150, 200, 250, 315, 400, 500, 630, 750, 800, 1000,
  1250, 1500, 1600, 2000, 2500, 3000,
]

/** Find the next standard generator size >= required kVA */
export function getNextStandardRating(requiredKva: number, frequency: Frequency): number | null {
  const ratings = frequency === 60 ? STANDARD_RATINGS_60HZ : STANDARD_RATINGS_50HZ
  for (const rating of ratings) {
    if (rating >= requiredKva) return rating
  }
  return null // exceeds maximum available
}

// ── Diesel Specific Fuel Consumption (L/kW/hr) ──────────────────────

const DIESEL_SFC_TABLE: { loadPercent: number; lPerKwHr: number }[] = [
  { loadPercent: 25,  lPerKwHr: 0.30 },
  { loadPercent: 50,  lPerKwHr: 0.24 },
  { loadPercent: 75,  lPerKwHr: 0.21 },
  { loadPercent: 100, lPerKwHr: 0.20 },
]

// ── Natural Gas Specific Fuel Consumption (m³/kW/hr) ─────────────────

const GAS_SFC_TABLE: { loadPercent: number; m3PerKwHr: number }[] = [
  { loadPercent: 25,  m3PerKwHr: 0.42 },
  { loadPercent: 50,  m3PerKwHr: 0.34 },
  { loadPercent: 75,  m3PerKwHr: 0.30 },
  { loadPercent: 100, m3PerKwHr: 0.28 },
]

/** Interpolate specific fuel consumption for a given load percentage */
export function interpolateSfc(loadPercent: number, fuelType: FuelType): number {
  const table = fuelType === 'diesel' ? DIESEL_SFC_TABLE : GAS_SFC_TABLE
  const valueKey = fuelType === 'diesel' ? 'lPerKwHr' : 'm3PerKwHr'

  // Clamp to table range
  if (loadPercent <= table[0].loadPercent) {
    return (table[0] as Record<string, number>)[valueKey]
  }
  if (loadPercent >= table[table.length - 1].loadPercent) {
    return (table[table.length - 1] as Record<string, number>)[valueKey]
  }

  // Linear interpolation
  for (let i = 0; i < table.length - 1; i++) {
    const low = table[i]
    const high = table[i + 1]
    if (loadPercent >= low.loadPercent && loadPercent <= high.loadPercent) {
      const ratio = (loadPercent - low.loadPercent) / (high.loadPercent - low.loadPercent)
      const lowVal = (low as Record<string, number>)[valueKey]
      const highVal = (high as Record<string, number>)[valueKey]
      return lowVal + ratio * (highVal - lowVal)
    }
  }

  return (table[table.length - 1] as Record<string, number>)[valueKey]
}

// ── NEC Emergency Classification Constraints ─────────────────────────

export const NEC_CLASSIFICATION_CONSTRAINTS: Record<NecClassification, {
  startupTimeSeconds: number | null
  minFuelDurationHours: number | null
  description: string
  necArticle: string
}> = {
  '700': {
    startupTimeSeconds: 10,
    minFuelDurationHours: 2,
    description: 'Emergency (Life Safety)',
    necArticle: 'NEC 700.12',
  },
  '701': {
    startupTimeSeconds: 60,
    minFuelDurationHours: 2,
    description: 'Legally Required Standby',
    necArticle: 'NEC 701.12',
  },
  '702': {
    startupTimeSeconds: null,
    minFuelDurationHours: null,
    description: 'Optional Standby',
    necArticle: 'NEC 702.12',
  },
}

// ── Unit Conversion Helpers ──────────────────────────────────────────

export const HP_TO_KW = 0.7457
export const KW_TO_HP = 1 / HP_TO_KW  // ≈ 1.341

export function hpToKw(hp: number): number { return hp * HP_TO_KW }
export function kwToHp(kw: number): number { return kw * KW_TO_HP }

export function mToFt(m: number): number { return m * 3.28084 }
export function ftToM(ft: number): number { return ft / 3.28084 }

export function cToF(c: number): number { return c * 9 / 5 + 32 }
export function fToC(f: number): number { return (f - 32) * 5 / 9 }

export function litersToGallons(l: number): number { return l / 3.78541 }
export function gallonsToLiters(g: number): number { return g * 3.78541 }

// ── Load Type Labels ─────────────────────────────────────────────────

export const LOAD_TYPE_LABELS: Record<string, string> = {
  motor: 'Motor',
  resistive: 'Resistive',
  lighting: 'Lighting',
  mixed: 'Mixed',
  hvac: 'HVAC',
}
