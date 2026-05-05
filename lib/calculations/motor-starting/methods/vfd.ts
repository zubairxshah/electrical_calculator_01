// Variable Frequency Drive (VFD) analysis.
// Constant V/Hz keeps motor current near FLA throughout speed-up; near-zero PCC dip.

import type { MethodResult, VfdConfig } from '@/types/motor-starting'
import { computeAccelerationTime } from '../accelerationTime'
import { computeVoltageDip } from '../voltageDip'
import {
  buildCurrentSamples,
  classifyThermal,
  classifyVerdict,
  CommonAnalyzeArgs,
  makeMethodResultBase,
  resolveFullVoltageStartingTorquePct,
} from './methodHelpers'

export function analyzeVfd(
  args: CommonAnalyzeArgs & { config: VfdConfig },
): MethodResult {
  const { motor, load, thevenZPu, thevenZUpToPccPu, baseKva, baseVoltageV, voltageDipThresholdPct, thermalDefaults, motorPowerFactorAtStart = 0.85, config } = args

  // VFD draws ~1.0–1.1× FLA at start (constant V/Hz keeps flux constant).
  const startingCurrent = motor.ratedCurrent * 1.05
  const startingTorqueFull = resolveFullVoltageStartingTorquePct(motor)
  // VFD can produce up to 1.5× T_rated at low speed (motor breakdown torque governed).
  const startingTorqueReduced = Math.min(startingTorqueFull, 150)

  const dip = computeVoltageDip({
    startingCurrentLineAmps: startingCurrent,
    baseKva,
    baseVoltageV,
    thevenZPu,
    thevenZUpToPccPu,
    motorPowerFactorAtStart,
  })

  const accel = computeAccelerationTime({
    motor,
    load,
    voltageMultiplier: 1.0,
    torqueMultiplier: 1.0,
  })

  const stallHot = motor.stallTimeHotSec ?? thermalDefaults.stallTimeHotSec
  const thermal = classifyThermal(accel.tAccSec, stallHot)
  const passes = dip.dipAtPccPct <= voltageDipThresholdPct

  const notes = [
    'Constant V/Hz ramp: current ≈ FLA throughout speed-up',
    'Near-zero PCC dip (DC-bus precharge inrush is brief and outside steady-state scope)',
  ]
  if (config.vfdHasBypass) {
    notes.push('Bypass mode reverts to DOL behavior — re-evaluate with DOL method')
  }

  const result: MethodResult = {
    ...makeMethodResultBase('VFD'),
    startingCurrentLineAmps: startingCurrent,
    startingCurrentMotorAmps: startingCurrent,
    startingCurrentPctFla: (startingCurrent / motor.ratedCurrent) * 100,
    startingTorquePctRated: startingTorqueReduced,
    voltageAtMotorPu: dip.vMotorPu,
    voltageDipAtPccPct: dip.dipAtPccPct,
    voltageDipPasses1668: passes,
    accelerationTimeSec: accel.tAccSec,
    thermalMarginRatio: thermal.ratio,
    thermalVerdict: thermal.verdict,
    torqueVerdict: accel.torqueVerdict,
    qualitativeCost: 'high',
    qualitativeComplexity: 'high',
    verdictBadge: classifyVerdict({
      voltageDipPasses: passes,
      torqueVerdict: accel.torqueVerdict,
      thermalVerdict: thermal.verdict,
    }),
    methodNotes: notes,
    currentVsTime: buildCurrentSamples(startingCurrent, motor.ratedCurrent, accel.tAccSec),
  }
  return result
}
