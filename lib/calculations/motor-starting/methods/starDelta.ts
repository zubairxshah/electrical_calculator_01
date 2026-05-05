// Star-Delta (Y-Δ) starting analysis.
// Current = ⅓ × LRA, torque = ⅓ × T_st, requires 6-lead motor.

import type { MethodResult, StarDeltaConfig } from '@/types/motor-starting'
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

const ONE_THIRD = 1 / 3

export function analyzeStarDelta(
  args: CommonAnalyzeArgs & { config: StarDeltaConfig },
): MethodResult {
  const { motor, load, thevenZPu, thevenZUpToPccPu, baseKva, baseVoltageV, voltageDipThresholdPct, thermalDefaults, motorPowerFactorAtStart = 0.30, config } = args

  const lraFull = resolveFullVoltageLra(motor)
  const lraReduced = lraFull * ONE_THIRD
  const startingTorqueFull = resolveFullVoltageStartingTorquePct(motor)
  const startingTorqueReduced = startingTorqueFull * ONE_THIRD

  const dip = computeVoltageDip({
    startingCurrentLineAmps: lraReduced,
    baseKva,
    baseVoltageV,
    thevenZPu,
    thevenZUpToPccPu,
    motorPowerFactorAtStart,
  })

  const accel = computeAccelerationTime({
    motor,
    load,
    // Y connection at start: phase voltage is line/√3, torque scales with V² → ⅓.
    voltageMultiplier: 1 / Math.sqrt(3),
    torqueMultiplier: ONE_THIRD,
  })

  const stallHot = motor.stallTimeHotSec ?? thermalDefaults.stallTimeHotSec
  const thermal = classifyThermal(accel.tAccSec, stallHot)
  const passes = dip.dipAtPccPct <= voltageDipThresholdPct

  const notes = [
    'IEEE Std 141: Y-Δ → ⅓ starting current and torque',
    'Requires 6-lead motor (not always available on small frames)',
  ]
  if (config.starDeltaTransition === 'open') {
    notes.push('Open transition: brief current/torque transient at change-over')
  } else {
    notes.push('Closed transition: smoother change-over (more contactor hardware)')
  }

  const result: MethodResult = {
    ...makeMethodResultBase('STAR_DELTA'),
    startingCurrentLineAmps: lraReduced,
    startingCurrentMotorAmps: lraReduced,
    startingCurrentPctFla: (lraReduced / motor.ratedCurrent) * 100,
    startingTorquePctRated: startingTorqueReduced,
    voltageAtMotorPu: dip.vMotorPu,
    voltageDipAtPccPct: dip.dipAtPccPct,
    voltageDipPasses1668: passes,
    accelerationTimeSec: accel.tAccSec,
    thermalMarginRatio: thermal.ratio,
    thermalVerdict: thermal.verdict,
    torqueVerdict: accel.torqueVerdict,
    qualitativeCost: 'low',
    qualitativeComplexity: 'medium',
    verdictBadge: classifyVerdict({
      voltageDipPasses: passes,
      torqueVerdict: accel.torqueVerdict,
      thermalVerdict: thermal.verdict,
    }),
    methodNotes: notes,
    currentVsTime: buildCurrentSamples(lraReduced, motor.ratedCurrent, accel.tAccSec),
  }
  return result
}
