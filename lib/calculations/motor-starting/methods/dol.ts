// Direct-On-Line (DOL) starting analysis.
// Reference baseline: full LRA, full T_st.

import type { DolConfig, MethodResult } from '@/types/motor-starting'
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

export function analyzeDol(
  args: CommonAnalyzeArgs & { config: DolConfig },
): MethodResult {
  const { motor, load, thevenZPu, thevenZUpToPccPu, baseKva, baseVoltageV, voltageDipThresholdPct, thermalDefaults, motorPowerFactorAtStart = 0.30 } = args

  const lra = resolveFullVoltageLra(motor)
  const startingTorquePct = resolveFullVoltageStartingTorquePct(motor)

  const dip = computeVoltageDip({
    startingCurrentLineAmps: lra,
    baseKva,
    baseVoltageV,
    thevenZPu,
    thevenZUpToPccPu,
    motorPowerFactorAtStart,
  })

  const accel = computeAccelerationTime({
    motor,
    load,
    voltageMultiplier: dip.vMotorPu,
  })

  const stallHot = motor.stallTimeHotSec ?? thermalDefaults.stallTimeHotSec
  const thermal = classifyThermal(accel.tAccSec, stallHot)
  const passes = dip.dipAtPccPct <= voltageDipThresholdPct

  const result: MethodResult = {
    ...makeMethodResultBase('DOL'),
    startingCurrentLineAmps: lra,
    startingCurrentMotorAmps: lra,
    startingCurrentPctFla: (lra / motor.ratedCurrent) * 100,
    startingTorquePctRated: startingTorquePct,
    voltageAtMotorPu: dip.vMotorPu,
    voltageDipAtPccPct: dip.dipAtPccPct,
    voltageDipPasses1668: passes,
    accelerationTimeSec: accel.tAccSec,
    thermalMarginRatio: thermal.ratio,
    thermalVerdict: thermal.verdict,
    torqueVerdict: accel.torqueVerdict,
    qualitativeCost: 'low',
    qualitativeComplexity: 'low',
    verdictBadge: classifyVerdict({
      voltageDipPasses: passes,
      torqueVerdict: accel.torqueVerdict,
      thermalVerdict: thermal.verdict,
    }),
    methodNotes: [
      'NEC 430.7(B): full locked-rotor current and torque',
      'Reference baseline (no reduced-voltage method)',
    ],
    currentVsTime: buildCurrentSamples(lra, motor.ratedCurrent, accel.tAccSec),
  }
  return result
}
