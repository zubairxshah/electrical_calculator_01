// Voltage-dip computation at the PCC (transformer secondary) and at motor terminals
// using per-unit Thevenin division (IEEE 3002.7 §7).

import type { ImpedanceComplex } from '@/types/motor-starting'

export interface ComputeVoltageDipParams {
  /** Line-side (source-side) starting current in amperes. */
  startingCurrentLineAmps: number
  /** Per-unit base in kVA (typically the transformer kVA). */
  baseKva: number
  /** Per-unit base voltage in V (line-to-line). */
  baseVoltageV: number
  /** Total Thevenin impedance referred to the motor terminals, per-unit. */
  thevenZPu: ImpedanceComplex
  /** Optional Thevenin impedance from utility+transformer only (excludes cable),
   *  used for the dip at PCC if PCC is the transformer secondary. */
  thevenZUpToPccPu?: ImpedanceComplex
  /** Motor power factor at start (typically ≈ 0.30 lag). */
  motorPowerFactorAtStart: number
}

export interface VoltageDipResult {
  vMotorPu: number
  dipAtPccPct: number
}

/**
 * Compute the per-unit voltage at the motor terminals during start, and the
 * dip at the PCC. The motor inrush current is treated as a phasor at lagging
 * angle = arccos(PF), and the dip is computed as the magnitude of the
 * voltage difference across the source impedance.
 */
export function computeVoltageDip(params: ComputeVoltageDipParams): VoltageDipResult {
  const {
    startingCurrentLineAmps,
    baseKva,
    baseVoltageV,
    thevenZPu,
    thevenZUpToPccPu,
    motorPowerFactorAtStart,
  } = params

  if (startingCurrentLineAmps <= 0) {
    return { vMotorPu: 1, dipAtPccPct: 0 }
  }

  // Base current (kA → A)
  const baseAmps = (baseKva * 1000) / (Math.sqrt(3) * baseVoltageV)
  const iPu = startingCurrentLineAmps / baseAmps

  const pf = clamp(motorPowerFactorAtStart, 0.05, 1.0)
  const phi = Math.acos(pf) // lagging angle
  // Current phasor at angle -phi (lagging). With V_th = 1.0 ∠ 0:
  const iR = iPu * Math.cos(-phi)
  const iX = iPu * Math.sin(-phi)

  // Voltage drop across full source Z (motor-terminal dip)
  const dropAtMotor = phasorMul({ r: iR, x: iX }, thevenZPu)
  const vMotor = phasorSub({ r: 1, x: 0 }, dropAtMotor)
  const vMotorPu = phasorMag(vMotor)

  // Dip at PCC — uses up-to-PCC impedance if provided, else full chain.
  const zForPcc = thevenZUpToPccPu ?? thevenZPu
  const dropAtPcc = phasorMul({ r: iR, x: iX }, zForPcc)
  const vPcc = phasorSub({ r: 1, x: 0 }, dropAtPcc)
  const vPccMag = phasorMag(vPcc)
  const dipAtPccPct = (1 - vPccMag) * 100

  return {
    vMotorPu,
    dipAtPccPct: Math.max(0, dipAtPccPct),
  }
}

// ── Phasor helpers ──────────────────────────────────────────────────

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function phasorMul(a: ImpedanceComplex, b: ImpedanceComplex): ImpedanceComplex {
  return {
    r: a.r * b.r - a.x * b.x,
    x: a.r * b.x + a.x * b.r,
  }
}

function phasorSub(a: ImpedanceComplex, b: ImpedanceComplex): ImpedanceComplex {
  return { r: a.r - b.r, x: a.x - b.x }
}

function phasorMag(p: ImpedanceComplex): number {
  return Math.sqrt(p.r * p.r + p.x * p.x)
}
