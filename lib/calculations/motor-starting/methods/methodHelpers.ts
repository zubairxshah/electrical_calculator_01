// Shared helpers for the 5 starting-method modules.

import type {
  ImpedanceComplex,
  Motor,
  MethodResult,
  StartingMethodId,
  ThermalLimitDefault,
  ThermalVerdict,
  TorqueVerdict,
  VerdictBadge,
} from '@/types/motor-starting'
import { METHOD_LABELS, getNemaCodeLetter } from '../motorStartingData'

export interface CommonAnalyzeArgs {
  motor: Motor
  load: import('@/types/motor-starting').Load
  thevenZPu: ImpedanceComplex
  thevenZUpToPccPu?: ImpedanceComplex
  baseKva: number
  baseVoltageV: number
  voltageDipThresholdPct: number
  thermalDefaults: ThermalLimitDefault
  motorPowerFactorAtStart?: number
}

/**
 * Returns the locked-rotor amperage at full voltage, derived from (in priority order):
 *  1. motor.lockedRotorAmps (direct)
 *  2. motor.lockedRotorMultiplier × FLA
 *  3. NEMA Code Letter midpoint (NEC mode)
 *  4. Design-class typical (fallback ~6.5×)
 */
export function resolveFullVoltageLra(motor: Motor): number {
  if (motor.lockedRotorAmps && motor.lockedRotorAmps > 0) {
    return motor.lockedRotorAmps
  }
  if (motor.lockedRotorMultiplier && motor.lockedRotorMultiplier > 0) {
    return motor.lockedRotorMultiplier * motor.ratedCurrent
  }
  if (motor.codeLetter) {
    const c = getNemaCodeLetter(motor.codeLetter)
    if (c) {
      const ratedKva =
        (motor.powerUnit === 'HP' ? motor.ratedPower : motor.ratedPower / 0.7457) *
        c.kvaPerHpMid
      const lra = (ratedKva * 1000) / (Math.sqrt(3) * motor.ratedVoltage)
      return lra
    }
  }
  // Design-class typical fallback (~6.5× FLA)
  return 6.5 * motor.ratedCurrent
}

export function resolveFullVoltageStartingTorquePct(motor: Motor): number {
  // % of rated full-load torque
  if (motor.startingTorquePerRated) return motor.startingTorquePerRated * 100
  switch (motor.designClass) {
    case 'A': return 150
    case 'B':
    case 'N': return 140
    case 'C': return 200
    case 'D': return 275
    case 'H': return 250
    default: return 150
  }
}

export function classifyVerdict(args: {
  voltageDipPasses: boolean
  torqueVerdict: TorqueVerdict
  thermalVerdict: ThermalVerdict
}): VerdictBadge {
  if (args.torqueVerdict === 'insufficient') return 'insufficient_torque'
  if (args.thermalVerdict === 'damage_risk') return 'thermal_risk'
  if (!args.voltageDipPasses) return 'excessive_dip'
  if (args.thermalVerdict === 'caution') return 'acceptable'
  return 'acceptable'
}

export function classifyThermal(accelerationTimeSec: number, stallHotSec: number): {
  ratio: number
  verdict: ThermalVerdict
} {
  if (!isFinite(accelerationTimeSec) || stallHotSec <= 0) {
    return { ratio: Infinity, verdict: 'damage_risk' }
  }
  const ratio = accelerationTimeSec / stallHotSec
  if (ratio >= 1) return { ratio, verdict: 'damage_risk' }
  if (ratio >= 0.8) return { ratio, verdict: 'caution' }
  return { ratio, verdict: 'safe' }
}

export function methodLabel(method: StartingMethodId): string {
  return METHOD_LABELS[method] ?? method
}

/**
 * Build a current-vs-time sample series for the chart. Simple two-segment
 * curve: starting current for `tStart` seconds, then drop to FLA at end.
 */
export function buildCurrentSamples(
  startingAmps: number,
  fla: number,
  tEndSec: number,
): { tSec: number; iAmps: number }[] {
  const t = isFinite(tEndSec) && tEndSec > 0 ? tEndSec : 5
  const samples: { tSec: number; iAmps: number }[] = []
  const steps = 12
  for (let i = 0; i <= steps; i++) {
    const tSec = (i / steps) * t * 1.2
    const iAmps = tSec < t * 0.95 ? startingAmps : fla
    samples.push({ tSec, iAmps })
  }
  return samples
}

export function makeMethodResultBase(method: StartingMethodId): Pick<MethodResult, 'method' | 'methodLabel' | 'methodNotes'> {
  return {
    method,
    methodLabel: methodLabel(method),
    methodNotes: [],
  }
}
