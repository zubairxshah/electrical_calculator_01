// Standard transformer ratings and loss data
// Per IEC 60076 and IEEE C57

/** Standard kVA ratings for power transformers */
export const STANDARD_KVA_RATINGS = [
  // Single-phase
  5, 10, 15, 25, 37.5, 50, 75, 100, 167, 250, 333, 500,
  // Three-phase
  15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750,
  1000, 1500, 2000, 2500, 3000, 3750, 5000, 7500, 10000,
  12500, 15000, 20000, 25000, 30000, 40000, 50000,
]

/** Remove duplicates and sort */
export const UNIQUE_KVA_RATINGS = [...new Set(STANDARD_KVA_RATINGS)].sort((a, b) => a - b)

/** Select next standard kVA rating >= required */
export function selectStandardKVA(requiredKVA: number): number {
  for (const rating of UNIQUE_KVA_RATINGS) {
    if (rating >= requiredKVA) return rating
  }
  return Math.ceil(requiredKVA / 1000) * 1000
}

/** Typical no-load (core) losses by kVA and type (watts) */
export function estimateNoLoadLoss(kva: number, type: 'dry-type' | 'oil-filled' | 'cast-resin'): number {
  // Approximate % of rated kVA based on transformer type
  const lossPercent = type === 'oil-filled' ? 0.2 : type === 'cast-resin' ? 0.3 : 0.35
  return kva * 1000 * (lossPercent / 100)
}

/** Typical full-load (copper) losses by kVA and type (watts) */
export function estimateFullLoadLoss(kva: number, type: 'dry-type' | 'oil-filled' | 'cast-resin'): number {
  const lossPercent = type === 'oil-filled' ? 1.0 : type === 'cast-resin' ? 1.2 : 1.5
  return kva * 1000 * (lossPercent / 100)
}

/** Typical impedance % by kVA rating */
export function estimateImpedance(kva: number): number {
  if (kva <= 50) return 3.0
  if (kva <= 150) return 3.5
  if (kva <= 500) return 4.0
  if (kva <= 1000) return 5.0
  if (kva <= 2500) return 5.5
  if (kva <= 10000) return 6.0
  return 7.0
}

/** Temperature derating for transformers per IEC 60076-2 */
export function getTransformerTempDerating(ambientC: number, type: 'dry-type' | 'oil-filled' | 'cast-resin'): number {
  const baseTemp = type === 'oil-filled' ? 30 : 40 // °C reference
  if (ambientC <= baseTemp) return 1.0
  const excess = ambientC - baseTemp
  // Approximately 1% per °C above reference
  const derating = 1.0 - (excess * 0.01)
  return Math.max(derating, 0.5)
}

/** Altitude derating per IEC 60076-2 / IEEE C57.12 */
export function getTransformerAltitudeDerating(altitudeM: number, type: 'dry-type' | 'oil-filled' | 'cast-resin'): number {
  if (altitudeM <= 1000) return 1.0
  const excessKm = (altitudeM - 1000) / 1000
  // Dry-type: 3% per 500m above 1000m
  // Oil-filled: 2.5% per 500m above 1000m
  const ratePerKm = type === 'oil-filled' ? 0.05 : 0.06
  return Math.max(1.0 - (excessKm * ratePerKm), 0.7)
}

/** Annual operating hours by load profile */
export function getAnnualOperatingHours(profile: 'constant' | 'industrial' | 'commercial' | 'residential'): number {
  switch (profile) {
    case 'constant': return 8760
    case 'industrial': return 6000
    case 'commercial': return 4000
    case 'residential': return 3000
  }
}

/** Typical load factor by profile */
export function getTypicalLoadFactor(profile: 'constant' | 'industrial' | 'commercial' | 'residential'): number {
  switch (profile) {
    case 'constant': return 0.85
    case 'industrial': return 0.65
    case 'commercial': return 0.50
    case 'residential': return 0.40
  }
}

/** Standard primary voltages */
export const PRIMARY_VOLTAGES = {
  NEC: [2400, 4160, 7200, 12470, 13200, 13800, 22900, 34500],
  IEC: [3300, 6600, 11000, 13800, 22000, 33000],
}

/** Standard secondary voltages */
export const SECONDARY_VOLTAGES = {
  NEC: [120, 208, 240, 277, 480, 600],
  IEC: [230, 400, 415, 690],
}
