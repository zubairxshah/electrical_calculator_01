// Autotransformer starting analysis.
// CRITICAL: line-side current = a² × LRA (both V and I scale by a → power by a²).
// Motor-side current = a × LRA. Starting torque = a² × T_st.

import type { AutotransformerConfig, MethodResult } from '@/types/motor-starting'
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

const ALLOWED_TAPS = [0.50, 0.65, 0.80] as const

export function analyzeAutotransformer(
  args: CommonAnalyzeArgs & { config: AutotransformerConfig },
): MethodResult {
  const { motor, load, thevenZPu, thevenZUpToPccPu, baseKva, baseVoltageV, voltageDipThresholdPct, thermalDefaults, motorPowerFactorAtStart = 0.30, config } = args
  const a = config.autotransformerTap
  if (!ALLOWED_TAPS.includes(a)) {
    throw new Error(`Autotransformer tap must be 0.50, 0.65, or 0.80; got ${a}`)
  }

  const lraFull = resolveFullVoltageLra(motor)
  const lineSideCurrent = lraFull * a * a       // a² on line side
  const motorSideCurrent = lraFull * a          // a on motor side
  const startingTorqueFull = resolveFullVoltageStartingTorquePct(motor)
  const startingTorqueReduced = startingTorqueFull * a * a

  // Voltage dip uses LINE-side current (engineering subtlety we test for).
  const dip = computeVoltageDip({
    startingCurrentLineAmps: lineSideCurrent,
    baseKva,
    baseVoltageV,
    thevenZPu,
    thevenZUpToPccPu,
    motorPowerFactorAtStart,
  })

  const accel = computeAccelerationTime({
    motor,
    load,
    voltageMultiplier: a,
  })

  const stallHot = motor.stallTimeHotSec ?? thermalDefaults.stallTimeHotSec
  const thermal = classifyThermal(accel.tAccSec, stallHot)
  const passes = dip.dipAtPccPct <= voltageDipThresholdPct

  const tapPct = Math.round(a * 100)
  const notes = [
    `IEEE Std 141: tap ${tapPct}% → line-side I = ${(a * a).toFixed(2)}×LRA, motor-side I = ${a.toFixed(2)}×LRA, torque = ${(a * a).toFixed(2)}×T_st`,
    'Closed transition assumed by default',
  ]

  const result: MethodResult = {
    ...makeMethodResultBase('AUTOTRANSFORMER'),
    startingCurrentLineAmps: lineSideCurrent,
    startingCurrentMotorAmps: motorSideCurrent,
    startingCurrentPctFla: (motorSideCurrent / motor.ratedCurrent) * 100,
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
    currentVsTime: buildCurrentSamples(lineSideCurrent, motor.ratedCurrent, accel.tAccSec),
  }
  return result
}
