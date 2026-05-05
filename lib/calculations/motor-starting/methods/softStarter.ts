// Soft Starter analysis: linear voltage ramp from initial V to 100%, current capped.

import type { MethodResult, SoftStarterConfig } from '@/types/motor-starting'
import { computeAccelerationTime } from '../accelerationTime'
import { computeVoltageDip } from '../voltageDip'
import {
  buildCurrentSamples,
  classifyThermal,
  classifyVerdict,
  CommonAnalyzeArgs,
  makeMethodResultBase,
  resolveFullVoltageLra,
  resolveFullVoltageStartingTorquePct,
} from './methodHelpers'

export function analyzeSoftStarter(
  args: CommonAnalyzeArgs & { config: SoftStarterConfig },
): MethodResult {
  const { motor, load, thevenZPu, thevenZUpToPccPu, baseKva, baseVoltageV, voltageDipThresholdPct, thermalDefaults, motorPowerFactorAtStart = 0.30, config } = args

  const vInitPct = clamp(config.softStarterInitialVoltagePct, 10, 80)
  const rampSec = clamp(config.softStarterRampSec, 0.5, 60)
  const currentLimitPctFla = clamp(config.softStarterCurrentLimitPctFla, 100, 700)
  const currentLimitAmps = (currentLimitPctFla / 100) * motor.ratedCurrent

  const lraFull = resolveFullVoltageLra(motor)
  const startingTorqueFull = resolveFullVoltageStartingTorquePct(motor)

  // Worst-case current during ramp ≈ LRA × (V_max_during_ramp / V_rated), capped.
  // The peak occurs as the ramp approaches 100% V.
  const peakCurrentUncapped = lraFull * 1.0
  const peakCurrent = Math.min(peakCurrentUncapped, currentLimitAmps)

  // Initial torque scales with V²
  const initialV = vInitPct / 100
  const startingTorqueReduced = startingTorqueFull * initialV * initialV

  const dip = computeVoltageDip({
    startingCurrentLineAmps: peakCurrent,
    baseKva,
    baseVoltageV,
    thevenZPu,
    thevenZUpToPccPu,
    motorPowerFactorAtStart,
  })

  // Effective average voltage during ramp ≈ (V_init + 1)/2 for accel time
  const vAvg = (initialV + 1) / 2
  const accel = computeAccelerationTime({
    motor,
    load,
    voltageMultiplier: vAvg,
  })

  const stallHot = motor.stallTimeHotSec ?? thermalDefaults.stallTimeHotSec
  const thermal = classifyThermal(accel.tAccSec, stallHot)
  const passes = dip.dipAtPccPct <= voltageDipThresholdPct

  const notes = [
    `Linear ramp: V_init=${vInitPct.toFixed(0)}% → 100% over ${rampSec.toFixed(1)}s`,
    `Current limit: ${currentLimitPctFla.toFixed(0)}% FLA (${currentLimitAmps.toFixed(0)} A)`,
    'Solid-state ramp; reduced inrush vs DOL',
  ]
  if (peakCurrentUncapped > currentLimitAmps) {
    notes.push('Peak current limited by soft-starter current ceiling')
  }

  const result: MethodResult = {
    ...makeMethodResultBase('SOFT_STARTER'),
    startingCurrentLineAmps: peakCurrent,
    startingCurrentMotorAmps: peakCurrent,
    startingCurrentPctFla: (peakCurrent / motor.ratedCurrent) * 100,
    startingTorquePctRated: startingTorqueReduced,
    voltageAtMotorPu: dip.vMotorPu,
    voltageDipAtPccPct: dip.dipAtPccPct,
    voltageDipPasses1668: passes,
    accelerationTimeSec: accel.tAccSec,
    thermalMarginRatio: thermal.ratio,
    thermalVerdict: thermal.verdict,
    torqueVerdict: accel.torqueVerdict,
    qualitativeCost: 'medium',
    qualitativeComplexity: 'medium',
    verdictBadge: classifyVerdict({
      voltageDipPasses: passes,
      torqueVerdict: accel.torqueVerdict,
      thermalVerdict: thermal.verdict,
    }),
    methodNotes: notes,
    currentVsTime: buildCurrentSamples(peakCurrent, motor.ratedCurrent, Math.max(rampSec, accel.tAccSec)),
  }
  return result
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}
