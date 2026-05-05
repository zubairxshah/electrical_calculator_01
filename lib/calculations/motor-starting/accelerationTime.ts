// Acceleration-time integration via simplified IEEE 3002.7 quasi-static method.
// Δt = J × Δω / (T_motor − T_load), summed over speed steps from 0 to rated.

import type { Load, Motor, SpeedSample, TorqueProfile } from '@/types/motor-starting'
import { lbFt2ToKgM2, syncSpeedRpm } from './unitConversions'

export interface ComputeAccelerationTimeParams {
  motor: Motor
  load: Load
  /** Voltage multiplier applied to the motor torque curve (a for autotransformer/soft starter). */
  voltageMultiplier: number
  /** Torque multiplier applied directly (e.g., ⅓ for Y-Δ). Defaults to voltageMultiplier². */
  torqueMultiplier?: number
  /** Number of integration steps (default 10). */
  steps?: number
  /** Synchronous speed override (rpm). Default derived from poles × 60 Hz. */
  syncSpeedRpmValue?: number
  /** Frequency in Hz (default 60). */
  frequencyHz?: number
  /** Rated torque multiplier mapping nameplate full-load torque (defaults computed from PF). */
  ratedTorqueNm?: number
  /** Starting torque per rated (defaults to 1.5 = NEMA Design B typical). */
  startingTorquePerRated?: number
  /** Breakdown torque per rated (defaults to 2.5 for Design B). */
  breakdownTorquePerRated?: number
}

export interface ComputeAccelerationTimeResult {
  tAccSec: number
  speedSamples: SpeedSample[]
  torqueVerdict: 'sufficient' | 'insufficient'
}

const PI = Math.PI

export function computeAccelerationTime(
  params: ComputeAccelerationTimeParams,
): ComputeAccelerationTimeResult {
  const {
    motor,
    load,
    voltageMultiplier,
    torqueMultiplier,
    steps = 10,
    frequencyHz = 60,
  } = params

  const ns = params.syncSpeedRpmValue ?? syncSpeedRpm(motor.poles, frequencyHz)
  const slipRated = inferRatedSlipFromDesign(motor.designClass)
  const nRated = ns * (1 - slipRated)

  // Inertia in kg·m²
  const inertiaKgM2 = load.inertiaUnit === 'lb_ft2' ? lbFt2ToKgM2(load.inertia) : load.inertia
  if (inertiaKgM2 <= 0) {
    return { tAccSec: 0, speedSamples: [], torqueVerdict: 'sufficient' }
  }

  // Rated torque from electrical input (kW → N·m)
  const ratedKw =
    motor.powerUnit === 'HP' ? motor.ratedPower * 0.7457 : motor.ratedPower
  const omegaRated = (nRated * 2 * PI) / 60
  const ratedTorqueNm =
    params.ratedTorqueNm ?? (ratedKw * 1000) / omegaRated

  // Method-derated motor torque curve: scale starting/breakdown by torqueMultiplier.
  const tMul = torqueMultiplier ?? voltageMultiplier * voltageMultiplier
  const designStart = motor.startingTorquePerRated ?? params.startingTorquePerRated ?? 1.5
  const designBreakdown = motor.breakdownTorquePerRated ?? params.breakdownTorquePerRated ?? 2.5

  const tStartNm = ratedTorqueNm * designStart * tMul
  const tBreakdownNm = ratedTorqueNm * designBreakdown * tMul
  const tFullLoadNm = ratedTorqueNm

  // Speed at breakdown (s_bd typically 15-25% slip): use 0.20 as default.
  const sBreakdown = 0.20
  const nBreakdown = ns * (1 - sBreakdown)

  // Walk speeds from 0 to 0.95 × nRated. The final 5% takes asymptotic time
  // (motor approaches steady state where T_motor → T_load) and is omitted to
  // avoid a tAcc = 0 endpoint that masquerades as "insufficient torque".
  const nMax = nRated * 0.95
  const samples: SpeedSample[] = []
  const dn = nMax / steps
  let totalT = 0
  let insufficient = false

  // Integrate using trapezoid rule on (T_motor − T_load) at each step boundary.
  let prevT_acc: number | null = null
  let prevN: number | null = null

  for (let i = 0; i <= steps; i++) {
    const n = i * dn
    const tMotor = motorTorqueAt(n, ns, nBreakdown, nRated, tStartNm, tBreakdownNm, tFullLoadNm)
    const tLoad = loadTorqueAt(n, nRated, tFullLoadNm, load.torqueProfile, load.breakawayTorquePerRated)
    samples.push({ rpm: n, tMotor, tLoad })
    const tAcc = tMotor - tLoad
    if (tAcc < 0) insufficient = true

    if (prevT_acc !== null && prevN !== null && !insufficient) {
      const tAvg = (prevT_acc + tAcc) / 2
      const dOmega = ((n - prevN) * 2 * PI) / 60
      if (tAvg > 0) {
        totalT += (inertiaKgM2 * dOmega) / tAvg
      }
    }
    prevT_acc = tAcc
    prevN = n
  }

  if (insufficient) {
    return { tAccSec: Infinity, speedSamples: samples, torqueVerdict: 'insufficient' }
  }
  return { tAccSec: totalT, speedSamples: samples, torqueVerdict: 'sufficient' }
}

function inferRatedSlipFromDesign(designClass: string): number {
  switch (designClass) {
    case 'A':
    case 'C': return 0.05
    case 'B':
    case 'N': return 0.03
    case 'H': return 0.04
    case 'D': return 0.08
    default: return 0.03
  }
}

function motorTorqueAt(
  n: number,
  nSync: number,
  nBreakdown: number,
  nRated: number,
  tStart: number,
  tBreakdown: number,
  tFullLoad: number,
): number {
  if (n <= 0) return tStart
  if (n >= nSync) return 0
  if (n <= nBreakdown) {
    // Linear from start to breakdown
    const f = n / nBreakdown
    return tStart + f * (tBreakdown - tStart)
  }
  if (n <= nRated) {
    // Linear from breakdown down to full-load
    const f = (n - nBreakdown) / (nRated - nBreakdown)
    return tBreakdown + f * (tFullLoad - tBreakdown)
  }
  // Above rated: linear taper to zero at sync speed
  const f = (n - nRated) / (nSync - nRated)
  return tFullLoad * (1 - f)
}

function loadTorqueAt(
  n: number,
  nRated: number,
  tFullLoad: number,
  profile: TorqueProfile,
  breakawayPerRated: number,
): number {
  const breakaway = tFullLoad * breakawayPerRated
  if (nRated <= 0) return breakaway
  const ratio = n / nRated
  switch (profile) {
    case 'constant':
      return Math.max(breakaway, tFullLoad)
    case 'quadratic_fan_pump':
      return Math.max(breakaway, tFullLoad * ratio * ratio)
    case 'linear':
      return Math.max(breakaway, tFullLoad * ratio)
    default:
      return tFullLoad
  }
}
