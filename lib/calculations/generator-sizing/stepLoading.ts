// Step Loading Sequence Analysis
// Per IEEE 3006.4, ISO 8528

import type {
  LoadItem,
  GeneratorConfig,
  StepResult,
} from '@/types/generator-sizing'
import {
  getLrKvaPerHp,
  STARTING_METHOD_MULTIPLIERS,
} from './generatorData'

/**
 * Calculate cumulative demand at each loading step.
 * Includes motor starting kVA impact for motors in each step.
 */
export function calculateStepSequence(
  loads: LoadItem[],
  generatorKva: number,
  config: GeneratorConfig
): StepResult[] {
  // Group loads by step number, skip unassigned
  const assignedLoads = loads.filter((l) => l.stepNumber !== null)
  if (assignedLoads.length === 0) return []

  const stepMap = new Map<number, LoadItem[]>()
  for (const load of assignedLoads) {
    const step = load.stepNumber!
    if (!stepMap.has(step)) stepMap.set(step, [])
    stepMap.get(step)!.push(load)
  }

  const sortedSteps = [...stepMap.keys()].sort((a, b) => a - b)
  const results: StepResult[] = []
  let cumulativeKw = 0
  let cumulativeKva = 0

  for (const stepNum of sortedSteps) {
    const stepLoads = stepMap.get(stepNum)!
    let incrementalKw = 0
    let incrementalKvar = 0
    let motorStartingKva = 0

    for (const load of stepLoads) {
      const effectiveKw = load.ratedPower * load.quantity * load.diversityFactor *
        (load.isKva ? load.powerFactor : 1)
      const kvar = effectiveKw * Math.tan(Math.acos(load.powerFactor))
      incrementalKw += effectiveKw
      incrementalKvar += kvar

      // Motor starting impact
      if (load.isMotor || load.type === 'motor') {
        let startKva = 0
        let multiplier = STARTING_METHOD_MULTIPLIERS[load.startingMethod]
        if (load.startingMethod === 'vfd' && load.vfdMultiplier !== null) multiplier = load.vfdMultiplier
        if (load.startingMethod === 'soft-starter' && load.softStarterMultiplier !== null) multiplier = load.softStarterMultiplier

        if (config.frequency === 60 && load.nemaCodeLetter) {
          const hp = load.motorHp ?? load.ratedPower / 0.7457
          startKva = hp * getLrKvaPerHp(load.nemaCodeLetter) * multiplier
        } else if (load.iecLockedRotorRatio) {
          startKva = load.ratedPower * load.iecLockedRotorRatio * multiplier
        } else if (load.motorHp) {
          startKva = load.motorHp * 5.95 * multiplier
        } else {
          startKva = (load.ratedPower / load.powerFactor) * 6 * multiplier
        }
        motorStartingKva += startKva * load.quantity
      }
    }

    const incrementalKva = Math.sqrt(incrementalKw ** 2 + incrementalKvar ** 2)
    cumulativeKw += incrementalKw
    const totalKvar = cumulativeKva > 0
      ? Math.sqrt(cumulativeKva ** 2) // approximate cumulative kvar
      : 0
    cumulativeKva = cumulativeKva > 0
      ? Math.sqrt((cumulativeKw) ** 2 + totalKvar ** 2)
      : incrementalKva
    // Simpler: just accumulate kVA
    cumulativeKva = cumulativeKva === incrementalKva
      ? incrementalKva
      : cumulativeKva

    // Recalculate properly with cumulative kW and kVAR
    // We need to track cumulative kvar too
    // Fix: track properly
    const allPriorAndCurrent = loads.filter(
      (l) => l.stepNumber !== null && l.stepNumber <= stepNum
    )
    let totalCumKw = 0
    let totalCumKvar = 0
    for (const l of allPriorAndCurrent) {
      const eff = l.ratedPower * l.quantity * l.diversityFactor *
        (l.isKva ? l.powerFactor : 1)
      totalCumKw += eff
      totalCumKvar += eff * Math.tan(Math.acos(l.powerFactor))
    }
    cumulativeKw = totalCumKw
    cumulativeKva = Math.sqrt(totalCumKw ** 2 + totalCumKvar ** 2)

    const generatorLoading = generatorKva > 0
      ? (cumulativeKva / generatorKva) * 100
      : 0

    // Determine status
    let status: 'pass' | 'warning' | 'fail' = 'pass'
    let statusReason = 'Within limits'

    // Check if incremental kVA (including motor starting) > 50% of generator
    const effectiveIncremental = Math.max(incrementalKva, motorStartingKva)
    if (effectiveIncremental > generatorKva * 0.5) {
      status = 'warning'
      statusReason = `Step increment (${Math.round(effectiveIncremental)} kVA) exceeds 50% of generator capacity (${Math.round(generatorKva * 0.5)} kVA) — consider splitting this step`
    }
    if (cumulativeKva > generatorKva) {
      status = 'fail'
      statusReason = `Cumulative demand (${Math.round(cumulativeKva)} kVA) exceeds generator capacity (${generatorKva} kVA)`
    }

    results.push({
      stepNumber: stepNum,
      loadIds: stepLoads.map((l) => l.id),
      loadNames: stepLoads.map((l) => l.name || 'Unnamed'),
      incrementalKw: Math.round(incrementalKw * 100) / 100,
      incrementalKva: Math.round(incrementalKva * 100) / 100,
      motorStartingKvaInStep: Math.round(motorStartingKva * 100) / 100,
      cumulativeKw: Math.round(cumulativeKw * 100) / 100,
      cumulativeKva: Math.round(cumulativeKva * 100) / 100,
      generatorLoadingPercent: Math.round(generatorLoading * 100) / 100,
      status,
      statusReason,
    })
  }

  return results
}

/**
 * Auto-sequence loads: largest motors first, then large resistive, then smaller.
 * Each step increment ≤ 50% of generator kVA per IEEE 3006.4.
 */
export function autoSequenceLoads(
  loads: LoadItem[],
  generatorKva: number
): LoadItem[] {
  const maxPerStep = generatorKva * 0.5

  // Separate motors and non-motors
  const motors = loads
    .filter((l) => l.isMotor || l.type === 'motor')
    .sort((a, b) => b.ratedPower - a.ratedPower)
  const nonMotors = loads
    .filter((l) => !l.isMotor && l.type !== 'motor')
    .sort((a, b) => b.ratedPower - a.ratedPower)

  // Assign steps
  let currentStep = 1
  let currentStepKva = 0
  const updated: LoadItem[] = []

  // Motors first (largest first for best voltage dip recovery)
  for (const motor of motors) {
    const loadKva = motor.ratedPower / motor.powerFactor * motor.quantity * motor.diversityFactor
    if (currentStepKva + loadKva > maxPerStep && currentStepKva > 0) {
      currentStep++
      currentStepKva = 0
    }
    updated.push({ ...motor, stepNumber: currentStep })
    currentStepKva += loadKva
  }

  // Non-motors next
  for (const load of nonMotors) {
    const loadKva = load.ratedPower / load.powerFactor * load.quantity * load.diversityFactor
    if (currentStepKva + loadKva > maxPerStep && currentStepKva > 0) {
      currentStep++
      currentStepKva = 0
    }
    updated.push({ ...load, stepNumber: currentStep })
    currentStepKva += loadKva
  }

  return updated
}
