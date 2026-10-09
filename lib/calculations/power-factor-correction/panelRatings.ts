// Generic rating series for APFC panel switchgear (research R8).
// These are standard rating steps, not manufacturer catalogue data; users can override per step.

import type { PFCControllerOutputs } from '@/types/power-factor-correction'

/** Capacitor-duty contactor current classes (IEC 60947-4-1 utilisation category AC-6b) */
export const CONTACTOR_AC6B_FRAMES_A = [
  12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265, 330, 400,
] as const

/** gG fuse-link rated currents (IEC 60269 preferred series) */
export const IEC_GG_FUSE_RATINGS_A = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250,
] as const

/** Busbar system rated currents */
export const BUSBAR_RATINGS_A = [
  100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000,
] as const

/** Standard PF controller output counts */
export const CONTROLLER_OUTPUTS: readonly PFCControllerOutputs[] = [6, 8, 12]

/** Smallest rating in the series that is ≥ min, or null when min exceeds the series */
export function nextRating(min: number, series: readonly number[]): number | null {
  for (const r of series) {
    if (r >= min - 1e-9) return r
  }
  return null
}
