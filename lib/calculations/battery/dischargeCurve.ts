/**
 * Build a discharge curve for Recharts visualization. Monotonically
 * non-increasing SoC/remaining Ah; voltage falls from nominal plateau to
 * the cutoff over the usable runtime. (contracts/sizing-engine.contract.md.)
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import type { DischargeCurvePoint } from '@/lib/types'

const POINTS = 13

/**
 * @param systemVoltage nominal bank voltage (V)
 * @param nameplateAh   nameplate capacity used as the SoC reference (Ah)
 * @param dod           usable depth of discharge (fraction) — end-of-discharge SoC = 1 - dod
 * @param runtimeHours  usable runtime to span on the time axis
 */
export function buildDischargeCurve(
  systemVoltage: number,
  nameplateAh: number,
  dod: number,
  runtimeHours: number,
  _profile?: BatteryTypeSpec
): DischargeCurvePoint[] {
  const endSoc = Math.max(0, 1 - dod) // fraction remaining at end of usable discharge
  const cutoffVoltage = systemVoltage * 0.85 // typical lead-acid cutoff ≈ 85% nominal
  const points: DischargeCurvePoint[] = []
  for (let i = 0; i < POINTS; i++) {
    const f = i / (POINTS - 1) // 0..1 along discharge
    const socFraction = 1 - f * (1 - endSoc)
    points.push({
      timeHours: Number((f * runtimeHours).toFixed(4)),
      voltage: Number((systemVoltage - f * (systemVoltage - cutoffVoltage)).toFixed(3)),
      socPercent: Number((socFraction * 100).toFixed(2)),
      remainingAh: Number((socFraction * nameplateAh).toFixed(2)),
    })
  }
  return points
}
