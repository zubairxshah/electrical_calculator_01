// Motor Starting Analysis — Voltage Dip Calculation
// Per IEEE 3006.4, NFPA 110

import type {
  LoadItem,
  GeneratorConfig,
  MotorStartingResult,
} from '@/types/generator-sizing'
import {
  getLrKvaPerHp,
  STARTING_METHOD_MULTIPLIERS,
  hpToKw,
} from './generatorData'

/**
 * Analyze motor starting kVA and voltage dip for each motor-type load.
 * Returns per-motor results sorted by voltage dip (worst first).
 */
export function analyzeMotorStarting(
  loads: LoadItem[],
  generatorKva: number,
  config: GeneratorConfig,
  voltageDipThreshold: number = 15
): MotorStartingResult[] {
  const motors = loads.filter((l) => l.isMotor || l.type === 'motor')
  if (motors.length === 0) return []

  const results: MotorStartingResult[] = []

  for (const motor of motors) {
    let startingKva = 0
    const motorKw = motor.ratedPower // stored in kW

    // Determine starting method multiplier
    let multiplier: number
    if (motor.startingMethod === 'vfd' && motor.vfdMultiplier !== null) {
      multiplier = motor.vfdMultiplier
    } else if (motor.startingMethod === 'soft-starter' && motor.softStarterMultiplier !== null) {
      multiplier = motor.softStarterMultiplier
    } else {
      multiplier = STARTING_METHOD_MULTIPLIERS[motor.startingMethod]
    }

    if (config.frequency === 60 && motor.nemaCodeLetter) {
      // NEMA path: starting kVA = HP × LR kVA/HP × multiplier
      const hp = motor.motorHp ?? motorKw / 0.7457
      const lrKvaPerHp = getLrKvaPerHp(motor.nemaCodeLetter)
      startingKva = hp * lrKvaPerHp * multiplier
    } else if (motor.iecLockedRotorRatio) {
      // IEC path: starting kVA = kW × LR ratio × multiplier
      startingKva = motorKw * motor.iecLockedRotorRatio * multiplier
    } else if (motor.motorHp) {
      // Fallback: use HP with default code G (5.95 kVA/HP)
      startingKva = motor.motorHp * 5.95 * multiplier
    } else {
      // Last resort: estimate starting kVA as 6× running kVA
      const runningKva = motorKw / motor.powerFactor
      startingKva = runningKva * 6 * multiplier
    }

    // Voltage dip calculation per IEEE 3006.4
    // Vdip% = (Xd'' × starting_kVA / generator_kVA) × 100
    const xd = config.subtransientReactance
    const voltageDipPercent = generatorKva > 0
      ? (xd * startingKva / generatorKva) * 100
      : 100

    results.push({
      loadId: motor.id,
      motorName: motor.name || 'Unnamed Motor',
      motorHp: motor.motorHp,
      motorKw,
      startingKva: Math.round(startingKva * 100) / 100,
      voltageDipPercent: Math.round(voltageDipPercent * 100) / 100,
      passesThreshold: voltageDipPercent <= voltageDipThreshold,
      threshold: voltageDipThreshold,
      startingMethod: motor.startingMethod,
      startingMethodMultiplier: multiplier,
    })
  }

  // Sort by voltage dip descending (worst first)
  results.sort((a, b) => b.voltageDipPercent - a.voltageDipPercent)

  return results
}
