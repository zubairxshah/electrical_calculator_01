// Generator Sizing Calculator — Main Orchestrator
// Composes: loadSummation → derating → selection → motorStarting → stepLoading → fuelConsumption

import type {
  LoadItem,
  GeneratorConfig,
  SiteConditions,
  FuelConfig,
  SizingResult,
  Alert,
  NecConstraintResult,
} from '@/types/generator-sizing'
import { calculateLoadSummary } from './loadSummation'
import { analyzeMotorStarting } from './motorStarting'
import { calculateStepSequence } from './stepLoading'
import { calculateDerating } from './derating'
import { calculateFuelConsumption } from './fuelConsumption'
import { getNextStandardRating, NEC_CLASSIFICATION_CONSTRAINTS } from './generatorData'

interface GeneratorSizingInput {
  loads: LoadItem[]
  generatorConfig: GeneratorConfig
  siteConditions: SiteConditions
  fuelConfig: FuelConfig | null
  voltageDipThreshold: number
}

export function calculateGeneratorSizing(input: GeneratorSizingInput): SizingResult {
  const { loads, generatorConfig, siteConditions, fuelConfig, voltageDipThreshold } = input
  const alerts: Alert[] = []

  // 1. Load summation (vector power)
  const loadSummary = calculateLoadSummary(loads, generatorConfig)

  // 2. Site derating (ISO 8528-1)
  const derating = calculateDerating(siteConditions)

  // 3. Required kVA after derating
  const requiredKvaBeforeDerating = loadSummary.requiredGeneratorKva
  const requiredKvaAfterDerating = requiredKvaBeforeDerating / derating.combinedFactor

  // 4. Select standard generator size
  const recommendedKva = getNextStandardRating(requiredKvaAfterDerating, generatorConfig.frequency)

  if (recommendedKva === null) {
    alerts.push({
      severity: 'error',
      category: 'overload',
      message: `Total demand (${Math.round(requiredKvaAfterDerating)} kVA after derating) exceeds maximum available standard generator size (3000 kVA). Consider paralleling generators or load shedding.`,
    })
  }

  const effectiveGenKva = recommendedKva ?? requiredKvaAfterDerating
  const loadingPercent = (loadSummary.totalRunningKva / (effectiveGenKva * derating.combinedFactor)) * 100

  // 5. Motor starting analysis
  const motorStarting = analyzeMotorStarting(loads, effectiveGenKva, generatorConfig, voltageDipThreshold)
  const worstCase = motorStarting.length > 0 ? motorStarting[0] : null

  // Motor starting alerts
  for (const ms of motorStarting) {
    if (!ms.passesThreshold) {
      alerts.push({
        severity: 'warning',
        category: 'voltage-dip',
        message: `Motor "${ms.motorName}" causes ${ms.voltageDipPercent}% voltage dip (exceeds ${ms.threshold}% threshold). Consider reduced-voltage starting.`,
        standardRef: 'NFPA 110 / IEEE 3006.4',
      })
    }
  }

  // 6. Step loading sequence (if any loads assigned to steps)
  const stepLoading = calculateStepSequence(loads, effectiveGenKva, generatorConfig)

  for (const step of stepLoading) {
    if (step.status === 'warning') {
      alerts.push({
        severity: 'warning',
        category: 'step-loading',
        message: `Step ${step.stepNumber}: ${step.statusReason}`,
        standardRef: 'ISO 8528 / IEEE 3006.4',
      })
    }
    if (step.status === 'fail') {
      alerts.push({
        severity: 'error',
        category: 'step-loading',
        message: `Step ${step.stepNumber}: ${step.statusReason}`,
        standardRef: 'ISO 8528',
      })
    }
  }

  // 7. Fuel consumption (if config provided)
  let fuelResult = null
  if (fuelConfig) {
    fuelResult = calculateFuelConsumption(
      effectiveGenKva,
      loadSummary.combinedPowerFactor,
      fuelConfig,
      generatorConfig
    )
    // Wet stacking warning
    if (fuelConfig.averageLoadingPercent < 30) {
      alerts.push({
        severity: 'warning',
        category: 'fuel',
        message: `Average loading ${fuelConfig.averageLoadingPercent}% is below 30%. Risk of wet stacking in diesel generators.`,
      })
    }
  }

  // 8. Derating alerts
  if (derating.altitudeApplied || derating.temperatureApplied) {
    alerts.push({
      severity: 'info',
      category: 'derating',
      message: `Site derating applied: ${((1 - derating.combinedFactor) * 100).toFixed(1)}% reduction (altitude: ${derating.altitudeApplied ? `${((1 - derating.altitudeFactor) * 100).toFixed(1)}%` : 'N/A'}, temperature: ${derating.temperatureApplied ? `${((1 - derating.temperatureFactor) * 100).toFixed(1)}%` : 'N/A'})`,
      standardRef: 'ISO 8528-1',
    })
  }

  // 9. NEC constraints
  let necConstraints: NecConstraintResult | null = null
  if (generatorConfig.necClassification) {
    const nec = NEC_CLASSIFICATION_CONSTRAINTS[generatorConfig.necClassification]
    necConstraints = {
      classification: generatorConfig.necClassification,
      startupTimeSeconds: nec.startupTimeSeconds,
      minFuelDurationHours: nec.minFuelDurationHours,
      description: nec.description,
    }
  }

  return {
    totalRunningKw: loadSummary.totalRunningKw,
    totalRunningKvar: loadSummary.totalRunningKvar,
    totalRunningKva: loadSummary.totalRunningKva,
    combinedPowerFactor: loadSummary.combinedPowerFactor,
    perLoadBreakdown: loadSummary.perLoadBreakdown,
    deratingFactor: derating.combinedFactor,
    altitudeDeratingFactor: derating.altitudeFactor,
    temperatureDeratingFactor: derating.temperatureFactor,
    requiredKvaBeforeDerating,
    requiredKvaAfterDerating: Math.round(requiredKvaAfterDerating * 100) / 100,
    recommendedGeneratorKva: effectiveGenKva,
    loadingPercent: Math.round(loadingPercent * 100) / 100,
    motorStartingAnalysis: motorStarting,
    worstCaseVoltageDip: worstCase,
    stepLoadingSequence: stepLoading,
    fuelConsumption: fuelResult,
    necConstraints,
    alerts,
  }
}
