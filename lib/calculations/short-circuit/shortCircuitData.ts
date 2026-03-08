// Short Circuit Analysis Reference Data
// Per IEC 60909, IEEE 551, ANSI C37

/** Standard breaker short circuit ratings (kA) */
export const STANDARD_BREAKER_RATINGS_KA = [
  5, 10, 14, 18, 22, 25, 30, 35, 42, 50, 65, 85, 100, 150, 200,
]

/** Select minimum standard breaker rating >= required */
export function selectBreakerRating(requiredKA: number): string {
  for (const rating of STANDARD_BREAKER_RATINGS_KA) {
    if (rating >= requiredKA) return `${rating} kA`
  }
  return `>${STANDARD_BREAKER_RATINGS_KA[STANDARD_BREAKER_RATINGS_KA.length - 1]} kA (special)`
}

/**
 * Peak factor (kp) based on X/R ratio per IEC 60909
 * kp = 1.02 + 0.98 * e^(-3 * R/X)
 */
export function calculatePeakFactor(xrRatio: number): number {
  if (xrRatio <= 0) return 1.0
  const rx = 1 / xrRatio
  return 1.02 + 0.98 * Math.exp(-3 * rx)
}

/**
 * DC decay time constant (ms)
 * tau = (X / R) / (2 * pi * f) * 1000
 */
export function calculateDCTimeConstant(xrRatio: number, frequency: number): number {
  return (xrRatio / (2 * Math.PI * frequency)) * 1000
}

/**
 * Asymmetry factor for RMS
 * Based on X/R ratio, accounts for DC offset in first cycle
 */
export function calculateAsymmetryFactor(xrRatio: number): number {
  const kp = calculatePeakFactor(xrRatio)
  // Asymmetrical RMS factor ≈ sqrt(1 + 2*(kp/sqrt(2))^2) simplified
  return Math.sqrt(1 + 2 * Math.exp(-2 * Math.PI / xrRatio))
}

/**
 * Motor contribution impedance in per-unit
 * Typical subtransient reactance values
 */
export function getMotorSubtransientReactance(motorType: 'induction' | 'synchronous' | 'mixed'): number {
  switch (motorType) {
    case 'synchronous': return 0.15   // Xd" typical
    case 'induction': return 0.17     // Xd" typical for large induction
    case 'mixed': return 0.20         // Weighted average
  }
}

/**
 * Motor contribution multiplier
 * How many times rated current the motor contributes during fault
 */
export function getMotorContributionMultiplier(motorType: 'induction' | 'synchronous' | 'mixed'): number {
  switch (motorType) {
    case 'synchronous': return 6.7    // 1/Xd"
    case 'induction': return 4.0      // Typical for groups of induction motors
    case 'mixed': return 4.8
  }
}

/** Fault type multipliers relative to 3-phase fault */
export const FAULT_TYPE_MULTIPLIERS = {
  'three-phase': 1.0,
  'line-to-line': 0.866,               // sqrt(3)/2
  'single-line-to-ground': 1.0,        // Can be > 1.0 in solidly grounded systems
  'double-line-to-ground': 0.95,       // Approximate
}

/** Typical X/R ratios by equipment */
export const TYPICAL_XR_RATIOS = {
  utility: { min: 5, typical: 10, max: 30 },
  transformer_small: { min: 2, typical: 4, max: 6 },     // <1000 kVA
  transformer_large: { min: 5, typical: 8, max: 15 },    // >1000 kVA
  cable: { min: 0.5, typical: 1.5, max: 3 },
  motor_induction: { min: 3, typical: 6, max: 10 },
  motor_synchronous: { min: 10, typical: 20, max: 40 },
}

/** Standard system voltages for quick selection */
export const SYSTEM_VOLTAGES = {
  NEC: [120, 208, 240, 277, 480, 600, 2400, 4160, 7200, 12470, 13200, 13800],
  IEC: [230, 400, 415, 690, 3300, 6600, 11000, 13800, 22000, 33000],
}
