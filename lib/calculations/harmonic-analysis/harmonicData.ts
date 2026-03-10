// Harmonic Analysis Data Tables & Constants
// IEEE 519-2022, IEC 61000-3-2, IEC 61000-3-12

import type {
  LoadProfile,
  HarmonicOrder,
  VoltageDistortionLimit,
  CurrentDistortionLimit,
  VoltageLevel,
} from '@/types/harmonic-analysis'

// ─── IEEE 519 Table 1: Voltage Distortion Limits ────────────────────────────
export const IEEE519_VOLTAGE_LIMITS: VoltageDistortionLimit[] = [
  { voltageLevel: 'V ≤ 1.0 kV', individualHarmonic: 5.0, thd: 8.0 },
  { voltageLevel: '1.0 kV < V ≤ 69 kV', individualHarmonic: 3.0, thd: 5.0 },
  { voltageLevel: '69 kV < V ≤ 161 kV', individualHarmonic: 1.5, thd: 2.5 },
  { voltageLevel: 'V > 161 kV', individualHarmonic: 1.0, thd: 1.5 },
]

// ─── IEEE 519 Table 2: Current Distortion Limits (% of IL) ─────────────────
// For systems rated 120V through 69kV
export const IEEE519_CURRENT_LIMITS_LV: CurrentDistortionLimit[] = [
  { iscIlRatio: '<20', h3to10: 4.0, h11to16: 2.0, h17to22: 1.5, h23to34: 0.6, h35plus: 0.3, tdd: 5.0 },
  { iscIlRatio: '20-50', h3to10: 7.0, h11to16: 3.5, h17to22: 2.5, h23to34: 1.0, h35plus: 0.5, tdd: 8.0 },
  { iscIlRatio: '50-100', h3to10: 10.0, h11to16: 4.5, h17to22: 4.0, h23to34: 1.5, h35plus: 0.7, tdd: 12.0 },
  { iscIlRatio: '100-1000', h3to10: 12.0, h11to16: 5.5, h17to22: 5.0, h23to34: 2.0, h35plus: 1.0, tdd: 15.0 },
  { iscIlRatio: '>1000', h3to10: 15.0, h11to16: 7.0, h17to22: 6.0, h23to34: 2.5, h35plus: 1.4, tdd: 20.0 },
]

// For systems rated 69.001kV through 161kV
export const IEEE519_CURRENT_LIMITS_MV: CurrentDistortionLimit[] = [
  { iscIlRatio: '<20', h3to10: 2.0, h11to16: 1.0, h17to22: 0.75, h23to34: 0.3, h35plus: 0.15, tdd: 2.5 },
  { iscIlRatio: '20-50', h3to10: 3.5, h11to16: 1.75, h17to22: 1.25, h23to34: 0.5, h35plus: 0.25, tdd: 4.0 },
  { iscIlRatio: '50-100', h3to10: 5.0, h11to16: 2.25, h17to22: 2.0, h23to34: 0.75, h35plus: 0.35, tdd: 6.0 },
  { iscIlRatio: '100-1000', h3to10: 6.0, h11to16: 2.75, h17to22: 2.5, h23to34: 1.0, h35plus: 0.5, tdd: 7.5 },
  { iscIlRatio: '>1000', h3to10: 7.5, h11to16: 3.5, h17to22: 3.0, h23to34: 1.25, h35plus: 0.7, tdd: 10.0 },
]

// For systems rated >161kV
export const IEEE519_CURRENT_LIMITS_HV: CurrentDistortionLimit[] = [
  { iscIlRatio: '<25', h3to10: 1.0, h11to16: 0.5, h17to22: 0.38, h23to34: 0.15, h35plus: 0.1, tdd: 1.5 },
  { iscIlRatio: '25-50', h3to10: 2.0, h11to16: 1.0, h17to22: 0.75, h23to34: 0.3, h35plus: 0.15, tdd: 2.5 },
  { iscIlRatio: '>=50', h3to10: 3.0, h11to16: 1.5, h17to22: 1.15, h23to34: 0.45, h35plus: 0.22, tdd: 3.75 },
]

// ─── IEC 61000-3-2 Current Emission Limits (Equipment ≤16A per phase) ──────
// Class A limits (balanced three-phase and non-household equipment)
export const IEC61000_CLASS_A_LIMITS: { order: number; limit: number }[] = [
  { order: 3, limit: 2.30 },
  { order: 5, limit: 1.14 },
  { order: 7, limit: 0.77 },
  { order: 9, limit: 0.40 },
  { order: 11, limit: 0.33 },
  { order: 13, limit: 0.21 },
  { order: 15, limit: 0.15 }, // odd 15-39: 15/order * 0.15
  { order: 17, limit: 0.132 },
  { order: 19, limit: 0.118 },
  { order: 21, limit: 0.107 },
  { order: 23, limit: 0.098 },
  { order: 25, limit: 0.090 },
  // Even harmonics
  { order: 2, limit: 1.08 },
  { order: 4, limit: 0.43 },
  { order: 6, limit: 0.30 },
  { order: 8, limit: 0.23 },
  { order: 10, limit: 0.18 },
]

// ─── Typical Harmonic Spectra for Common Loads ─────────────────────────────
export const LOAD_PROFILES: Record<Exclude<LoadProfile, 'custom'>, {
  name: string
  description: string
  typicalThdi: number
  harmonics: HarmonicOrder[]
}> = {
  'vfd-6pulse': {
    name: '6-Pulse VFD',
    description: 'Standard 6-pulse variable frequency drive (no input filter)',
    typicalThdi: 80,
    harmonics: [
      { order: 5, magnitude: 23.5 },
      { order: 7, magnitude: 11.1 },
      { order: 11, magnitude: 4.5 },
      { order: 13, magnitude: 2.9 },
      { order: 17, magnitude: 1.5 },
      { order: 19, magnitude: 1.0 },
      { order: 23, magnitude: 0.9 },
      { order: 25, magnitude: 0.8 },
      { order: 29, magnitude: 0.6 },
      { order: 31, magnitude: 0.5 },
      { order: 35, magnitude: 0.4 },
      { order: 37, magnitude: 0.35 },
    ],
  },
  'vfd-12pulse': {
    name: '12-Pulse VFD',
    description: '12-pulse VFD with phase-shifting transformer',
    typicalThdi: 12,
    harmonics: [
      { order: 11, magnitude: 5.2 },
      { order: 13, magnitude: 3.0 },
      { order: 23, magnitude: 1.8 },
      { order: 25, magnitude: 1.3 },
      { order: 35, magnitude: 0.7 },
      { order: 37, magnitude: 0.5 },
    ],
  },
  'vfd-18pulse': {
    name: '18-Pulse VFD',
    description: '18-pulse VFD with autotransformer',
    typicalThdi: 5,
    harmonics: [
      { order: 17, magnitude: 2.5 },
      { order: 19, magnitude: 1.8 },
      { order: 35, magnitude: 1.0 },
      { order: 37, magnitude: 0.7 },
    ],
  },
  'ups-online': {
    name: 'Online UPS (Double Conversion)',
    description: 'Double-conversion UPS with 6-pulse rectifier input',
    typicalThdi: 30,
    harmonics: [
      { order: 5, magnitude: 33.0 },
      { order: 7, magnitude: 2.0 },
      { order: 11, magnitude: 7.7 },
      { order: 13, magnitude: 2.9 },
      { order: 17, magnitude: 1.5 },
      { order: 19, magnitude: 1.0 },
      { order: 23, magnitude: 0.6 },
      { order: 25, magnitude: 0.5 },
    ],
  },
  'ups-offline': {
    name: 'Offline / Line-Interactive UPS',
    description: 'Standby UPS with battery charger harmonics',
    typicalThdi: 45,
    harmonics: [
      { order: 3, magnitude: 35.0 },
      { order: 5, magnitude: 20.0 },
      { order: 7, magnitude: 10.0 },
      { order: 9, magnitude: 6.0 },
      { order: 11, magnitude: 4.0 },
      { order: 13, magnitude: 2.5 },
    ],
  },
  'led-driver': {
    name: 'LED Driver (Switch-Mode)',
    description: 'Typical LED driver / switch-mode power supply',
    typicalThdi: 20,
    harmonics: [
      { order: 3, magnitude: 13.0 },
      { order: 5, magnitude: 9.5 },
      { order: 7, magnitude: 6.5 },
      { order: 9, magnitude: 4.0 },
      { order: 11, magnitude: 2.5 },
      { order: 13, magnitude: 1.5 },
      { order: 15, magnitude: 1.0 },
    ],
  },
  'smps': {
    name: 'Switch-Mode Power Supply',
    description: 'Computer/IT equipment SMPS without PFC',
    typicalThdi: 100,
    harmonics: [
      { order: 3, magnitude: 73.0 },
      { order: 5, magnitude: 52.0 },
      { order: 7, magnitude: 30.0 },
      { order: 9, magnitude: 15.0 },
      { order: 11, magnitude: 9.0 },
      { order: 13, magnitude: 5.5 },
      { order: 15, magnitude: 3.5 },
      { order: 17, magnitude: 2.0 },
      { order: 19, magnitude: 1.5 },
    ],
  },
  'arc-furnace': {
    name: 'Arc Furnace',
    description: 'Electric arc furnace (highly variable)',
    typicalThdi: 58,
    harmonics: [
      { order: 2, magnitude: 8.0 },
      { order: 3, magnitude: 5.0 },
      { order: 4, magnitude: 3.0 },
      { order: 5, magnitude: 19.0 },
      { order: 7, magnitude: 12.0 },
      { order: 11, magnitude: 4.0 },
      { order: 13, magnitude: 3.0 },
      { order: 17, magnitude: 1.5 },
      { order: 19, magnitude: 1.0 },
      { order: 23, magnitude: 0.7 },
    ],
  },
  'welder': {
    name: 'Arc Welder',
    description: 'Single-phase arc welder',
    typicalThdi: 42,
    harmonics: [
      { order: 3, magnitude: 20.0 },
      { order: 5, magnitude: 12.0 },
      { order: 7, magnitude: 8.0 },
      { order: 9, magnitude: 5.0 },
      { order: 11, magnitude: 3.5 },
      { order: 13, magnitude: 2.5 },
    ],
  },
  'fluorescent': {
    name: 'Fluorescent Lighting (Magnetic Ballast)',
    description: 'Fluorescent lamps with magnetic ballasts',
    typicalThdi: 18,
    harmonics: [
      { order: 3, magnitude: 13.0 },
      { order: 5, magnitude: 8.0 },
      { order: 7, magnitude: 3.5 },
      { order: 9, magnitude: 1.5 },
      { order: 11, magnitude: 1.0 },
    ],
  },
  'dc-drive-6pulse': {
    name: '6-Pulse DC Drive',
    description: 'SCR-controlled 6-pulse DC motor drive',
    typicalThdi: 40,
    harmonics: [
      { order: 5, magnitude: 20.0 },
      { order: 7, magnitude: 14.3 },
      { order: 11, magnitude: 9.1 },
      { order: 13, magnitude: 7.7 },
      { order: 17, magnitude: 3.5 },
      { order: 19, magnitude: 2.8 },
      { order: 23, magnitude: 1.8 },
      { order: 25, magnitude: 1.5 },
    ],
  },
  'dc-drive-12pulse': {
    name: '12-Pulse DC Drive',
    description: '12-pulse DC motor drive with phase-shifting transformer',
    typicalThdi: 15,
    harmonics: [
      { order: 11, magnitude: 7.5 },
      { order: 13, magnitude: 4.5 },
      { order: 23, magnitude: 2.5 },
      { order: 25, magnitude: 1.8 },
      { order: 35, magnitude: 0.8 },
      { order: 37, magnitude: 0.6 },
    ],
  },
}

// ─── Helper Functions ───────────────────────────────────────────────────────

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Get voltage distortion limits for IEEE 519
 */
export function getVoltageLimits(voltageLevel: VoltageLevel): VoltageDistortionLimit {
  switch (voltageLevel) {
    case 'lv': return IEEE519_VOLTAGE_LIMITS[0]
    case 'mv': return IEEE519_VOLTAGE_LIMITS[1]
    case 'hv': return IEEE519_VOLTAGE_LIMITS[2]
  }
}

/**
 * Get current distortion limit row based on Isc/IL ratio
 */
export function getCurrentLimitRow(
  iscIlRatio: number,
  voltageLevel: VoltageLevel
): CurrentDistortionLimit {
  const table = voltageLevel === 'hv'
    ? IEEE519_CURRENT_LIMITS_HV
    : voltageLevel === 'mv'
      ? IEEE519_CURRENT_LIMITS_MV
      : IEEE519_CURRENT_LIMITS_LV

  if (voltageLevel === 'hv') {
    if (iscIlRatio < 25) return table[0]
    if (iscIlRatio < 50) return table[1]
    return table[2]
  }

  if (iscIlRatio < 20) return table[0]
  if (iscIlRatio < 50) return table[1]
  if (iscIlRatio < 100) return table[2]
  if (iscIlRatio < 1000) return table[3]
  return table[4]
}

/**
 * Get individual harmonic current limit from IEEE 519 row
 */
export function getIndividualCurrentLimit(
  order: number,
  limitRow: CurrentDistortionLimit
): number {
  if (order >= 3 && order <= 10) return limitRow.h3to10
  if (order >= 11 && order <= 16) return limitRow.h11to16
  if (order >= 17 && order <= 22) return limitRow.h17to22
  if (order >= 23 && order <= 34) return limitRow.h23to34
  if (order >= 35) return limitRow.h35plus
  // Even harmonics 2 treated same as 3-10 range
  return limitRow.h3to10
}

/**
 * Get IEC 61000-3-2 Class A individual limit for a harmonic order
 */
export function getIECClassALimit(order: number): number | null {
  const entry = IEC61000_CLASS_A_LIMITS.find(l => l.order === order)
  if (entry) return entry.limit
  // Odd harmonics 15-39 not in table: limit = 15/order * 0.15 (simplified)
  if (order % 2 === 1 && order >= 15 && order <= 39) {
    return round(15 / order * 2.25, 3) // IEEE uses different formula; approximate
  }
  return null
}

/**
 * Get default harmonics for a load profile
 */
export function getProfileHarmonics(profile: LoadProfile): HarmonicOrder[] {
  if (profile === 'custom') return []
  const data = LOAD_PROFILES[profile]
  return data ? [...data.harmonics] : []
}

/**
 * Get profile info
 */
export function getProfileInfo(profile: LoadProfile): { name: string; description: string; typicalThdi: number } | null {
  if (profile === 'custom') return null
  return LOAD_PROFILES[profile] || null
}

/**
 * Default empty harmonic spectrum up to order 50
 */
export function createEmptySpectrum(maxOrder: number = 50): HarmonicOrder[] {
  const orders: HarmonicOrder[] = []
  for (let i = 2; i <= maxOrder; i++) {
    orders.push({ order: i, magnitude: 0 })
  }
  return orders
}

/**
 * Merge profile harmonics into a full spectrum
 */
export function mergeProfileIntoSpectrum(
  profile: HarmonicOrder[],
  maxOrder: number = 50
): HarmonicOrder[] {
  const spectrum = createEmptySpectrum(maxOrder)
  for (const h of profile) {
    const idx = spectrum.findIndex(s => s.order === h.order)
    if (idx >= 0) {
      spectrum[idx].magnitude = h.magnitude
    }
  }
  return spectrum
}
