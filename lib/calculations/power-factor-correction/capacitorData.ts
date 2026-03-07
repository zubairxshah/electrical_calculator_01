// Standard capacitor bank ratings per IEC 60831 and IEEE 18

/** Standard kVAR ratings for LV capacitor banks */
export const STANDARD_KVAR_RATINGS = [
  5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100,
  125, 150, 175, 200, 250, 300, 350, 400, 450, 500,
  600, 750, 800, 1000, 1200, 1500, 2000, 2500, 3000
]

/** Standard step sizes for automatic banks */
export const STANDARD_STEP_SIZES = [
  5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 100
]

/** Voltage ratings for capacitor banks (V) */
export const CAPACITOR_VOLTAGE_RATINGS = [
  230, 240, 400, 415, 440, 480, 525, 600, 690,
  3300, 6600, 11000, 13800, 22000, 33000
]

/** Select the next standard kVAR rating >= required */
export function selectStandardKVAR(requiredKVAR: number): number {
  for (const rating of STANDARD_KVAR_RATINGS) {
    if (rating >= requiredKVAR) return rating
  }
  // If exceeds max standard, round up to nearest 100
  return Math.ceil(requiredKVAR / 100) * 100
}

/** Select appropriate step size for automatic banks */
export function selectStepSize(totalKVAR: number): { steps: number; kvarPerStep: number } {
  // Target 4-12 steps for automatic banks
  for (const stepSize of STANDARD_STEP_SIZES) {
    const steps = Math.ceil(totalKVAR / stepSize)
    if (steps >= 4 && steps <= 12) {
      return { steps, kvarPerStep: stepSize }
    }
  }
  // Default: 6 steps
  const kvarPerStep = Math.ceil(totalKVAR / 6)
  const roundedStep = STANDARD_STEP_SIZES.find(s => s >= kvarPerStep) || kvarPerStep
  return { steps: Math.ceil(totalKVAR / roundedStep), kvarPerStep: roundedStep }
}

/** Select capacitor voltage rating >= system voltage with margin */
export function selectCapacitorVoltageRating(systemVoltage: number): number {
  const minRating = systemVoltage * 1.1 // 10% margin per IEC 60831
  for (const rating of CAPACITOR_VOLTAGE_RATINGS) {
    if (rating >= minRating) return rating
  }
  return CAPACITOR_VOLTAGE_RATINGS[CAPACITOR_VOLTAGE_RATINGS.length - 1]
}

/** Temperature derating per IEC 60831 */
export function getTemperatureDerating(tempC: number): number {
  if (tempC <= 40) return 1.0
  if (tempC <= 45) return 0.95
  if (tempC <= 50) return 0.90
  if (tempC <= 55) return 0.85
  return 0.80 // above 55°C
}

/** Altitude derating (above 1000m) */
export function getAltitudeDerating(altitudeM: number): number {
  if (altitudeM <= 1000) return 1.0
  if (altitudeM <= 2000) return 0.95
  if (altitudeM <= 3000) return 0.90
  if (altitudeM <= 4000) return 0.85
  return 0.80
}

/** Harmonic derating factor — detuned reactor recommended above 10% THD */
export function getHarmonicDerating(thdPercent: number): number {
  if (thdPercent <= 5) return 1.0
  if (thdPercent <= 10) return 0.95
  if (thdPercent <= 15) return 0.90
  if (thdPercent <= 20) return 0.85
  if (thdPercent <= 30) return 0.75
  return 0.65
}
