// Transformer Sizing Calculator
// Standards: IEC 60076, IEEE C57, NEC 450

import type {
  TransformerInput,
  TransformerEnvironment,
  TransformerLoadAnalysis,
  TransformerSelection,
  TransformerLosses,
  TransformerVoltageRegulation,
  TransformerImpedance,
  TransformerTapSettings,
  TransformerDerating,
  TransformerAlert,
  TransformerCalculationResults,
} from '@/types/transformer-sizing'
import {
  selectStandardKVA,
  estimateNoLoadLoss,
  estimateFullLoadLoss,
  estimateImpedance,
  getTransformerTempDerating,
  getTransformerAltitudeDerating,
  getAnnualOperatingHours,
  getTypicalLoadFactor,
} from './transformerData'

interface TransformerCalcInput {
  input: TransformerInput
  environment: TransformerEnvironment
}

export async function calculateTransformerSizing(
  calcInput: TransformerCalcInput
): Promise<TransformerCalculationResults> {
  const { input, environment } = calcInput
  const alerts: TransformerAlert[] = []

  // 1. Load Analysis
  const loadAnalysis = calculateLoadAnalysis(input)

  // 2. Derating (if environmental conditions warrant)
  const derating = calculateDerating(input, environment, loadAnalysis.designKVA)

  // 3. Transformer Selection
  const effectiveDesignKVA = derating
    ? loadAnalysis.designKVA / derating.combinedDerating
    : loadAnalysis.designKVA
  const selection = selectTransformer(input, effectiveDesignKVA, loadAnalysis.designKVA)

  // 4. Impedance Analysis
  const impedancePercent = input.impedancePercent ?? estimateImpedance(selection.ratedKVA)
  const impedance = calculateImpedance(input, selection, impedancePercent)

  // 5. Losses
  const losses = calculateLosses(input, selection, loadAnalysis)

  // 6. Voltage Regulation
  const voltageRegulation = calculateVoltageRegulation(input, selection, impedance, loadAnalysis)

  // 7. Tap Settings
  const tapSettings = calculateTapSettings(input, selection)

  // 8. Alerts
  generateAlerts(input, environment, selection, losses, impedance, voltageRegulation, derating, alerts)

  return {
    loadAnalysis,
    selection,
    losses,
    voltageRegulation,
    impedance,
    tapSettings,
    derating,
    alerts,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }
}

// ============================================================================
// Step 1: Load Analysis
// ============================================================================

function calculateLoadAnalysis(input: TransformerInput): TransformerLoadAnalysis {
  const { loadKW, loadPowerFactor, primaryVoltage, secondaryVoltage, phase, demandFactor, futureGrowth } = input

  // Load in kVA
  const loadKVA = loadKW / loadPowerFactor

  // Apply demand factor
  const demandKVA = loadKVA * demandFactor

  // Apply future growth
  const designKVA = demandKVA * futureGrowth

  // Turns ratio
  const turnsRatio = primaryVoltage / secondaryVoltage

  // Currents
  const phaseFactor = phase === 'three-phase' ? Math.sqrt(3) : 1
  const primaryCurrentA = (designKVA * 1000) / (primaryVoltage * phaseFactor)
  const secondaryCurrentA = (designKVA * 1000) / (secondaryVoltage * phaseFactor)

  return {
    loadKW,
    loadKVA: round(loadKVA, 2),
    loadPowerFactor,
    demandKVA: round(demandKVA, 2),
    designKVA: round(designKVA, 2),
    primaryCurrentA: round(primaryCurrentA, 2),
    secondaryCurrentA: round(secondaryCurrentA, 2),
    turnsRatio: round(turnsRatio, 4),
  }
}

// ============================================================================
// Step 2: Derating
// ============================================================================

function calculateDerating(
  input: TransformerInput,
  environment: TransformerEnvironment,
  designKVA: number
): TransformerDerating | null {
  const baseTemp = input.transformerType === 'oil-filled' ? 30 : 40
  const needsDerating = environment.ambientTemperature > baseTemp || environment.altitude > 1000

  if (!needsDerating) return null

  const temperatureDerating = getTransformerTempDerating(environment.ambientTemperature, input.transformerType)
  const altitudeDerating = getTransformerAltitudeDerating(environment.altitude, input.transformerType)
  const combinedDerating = temperatureDerating * altitudeDerating
  const effectiveKVA = round(designKVA / combinedDerating, 2)

  const codeRef = input.standard === 'NEC'
    ? 'IEEE C57.12 / NEC 450'
    : 'IEC 60076-2'

  return {
    temperatureDerating: round(temperatureDerating, 4),
    altitudeDerating: round(altitudeDerating, 4),
    combinedDerating: round(combinedDerating, 4),
    effectiveKVA,
    codeReference: codeRef,
  }
}

// ============================================================================
// Step 3: Transformer Selection
// ============================================================================

function selectTransformer(
  input: TransformerInput,
  effectiveDesignKVA: number,
  actualDesignKVA: number
): TransformerSelection {
  const ratedKVA = selectStandardKVA(effectiveDesignKVA)
  const loadingPercent = (actualDesignKVA / ratedKVA) * 100
  const overloadMargin = 100 - loadingPercent

  const codeRef = input.standard === 'NEC'
    ? 'NEC 450.3 / IEEE C57.12'
    : 'IEC 60076-1'

  return {
    ratedKVA,
    ratedPrimaryVoltage: input.primaryVoltage,
    ratedSecondaryVoltage: input.secondaryVoltage,
    loadingPercent: round(loadingPercent, 1),
    overloadMargin: round(overloadMargin, 1),
    codeReference: codeRef,
  }
}

// ============================================================================
// Step 4: Impedance
// ============================================================================

function calculateImpedance(
  input: TransformerInput,
  selection: TransformerSelection,
  impedancePercent: number
): TransformerImpedance {
  // Typical R/X ratio by type
  const rxRatio = input.transformerType === 'oil-filled' ? 0.3 : input.transformerType === 'cast-resin' ? 0.4 : 0.5

  // %R and %X from %Z
  const resistancePercent = impedancePercent * rxRatio / Math.sqrt(1 + rxRatio * rxRatio)
  const reactancePercent = Math.sqrt(impedancePercent ** 2 - resistancePercent ** 2)

  // Short circuit current on secondary
  const phaseFactor = input.phase === 'three-phase' ? Math.sqrt(3) : 1
  const ratedSecondaryCurrentA = (selection.ratedKVA * 1000) / (input.secondaryVoltage * phaseFactor)
  const shortCircuitCurrentA = ratedSecondaryCurrentA * (100 / impedancePercent)
  const shortCircuitKA = shortCircuitCurrentA / 1000

  return {
    impedancePercent: round(impedancePercent, 2),
    resistancePercent: round(resistancePercent, 3),
    reactancePercent: round(reactancePercent, 3),
    shortCircuitCurrentA: round(shortCircuitCurrentA, 0),
    shortCircuitKA: round(shortCircuitKA, 2),
  }
}

// ============================================================================
// Step 5: Losses
// ============================================================================

function calculateLosses(
  input: TransformerInput,
  selection: TransformerSelection,
  loadAnalysis: TransformerLoadAnalysis
): TransformerLosses {
  const noLoadLossW = estimateNoLoadLoss(selection.ratedKVA, input.transformerType)
  const fullLoadLossW = estimateFullLoadLoss(selection.ratedKVA, input.transformerType)

  // Actual load loss scales with square of loading
  const loadFraction = loadAnalysis.designKVA / selection.ratedKVA
  const actualLoadLossW = fullLoadLossW * loadFraction ** 2
  const totalLossW = noLoadLossW + actualLoadLossW

  // Efficiency at actual load
  const outputW = loadAnalysis.designKVA * 1000 * loadAnalysis.loadPowerFactor
  const efficiencyPercent = outputW > 0
    ? (outputW / (outputW + totalLossW)) * 100
    : 0

  // Maximum efficiency occurs when no-load loss = load loss
  // P_NL = P_FL * k^2 => k = sqrt(P_NL / P_FL)
  const maxEffLoadFraction = Math.sqrt(noLoadLossW / fullLoadLossW)
  const maxEfficiencyLoadPercent = maxEffLoadFraction * 100

  // Max efficiency value
  const maxEffOutputW = selection.ratedKVA * 1000 * maxEffLoadFraction * input.loadPowerFactor
  const maxEffLossW = noLoadLossW + fullLoadLossW * maxEffLoadFraction ** 2
  const maxEfficiencyPercent = maxEffOutputW > 0
    ? (maxEffOutputW / (maxEffOutputW + maxEffLossW)) * 100
    : 0

  // Annual energy loss
  const hours = getAnnualOperatingHours(input.loadProfile)
  const typicalLoadFactor = getTypicalLoadFactor(input.loadProfile)
  // Core loss is constant, copper loss scales with load factor squared
  const annualCoreLoss = noLoadLossW * 8760 / 1000 // Core loss runs 24/7
  const annualCopperLoss = fullLoadLossW * typicalLoadFactor ** 2 * hours / 1000
  const annualEnergyLossKWh = annualCoreLoss + annualCopperLoss

  return {
    noLoadLossW: round(noLoadLossW, 0),
    fullLoadLossW: round(fullLoadLossW, 0),
    actualLoadLossW: round(actualLoadLossW, 0),
    totalLossW: round(totalLossW, 0),
    efficiencyPercent: round(efficiencyPercent, 2),
    maxEfficiencyLoadPercent: round(maxEfficiencyLoadPercent, 1),
    maxEfficiencyPercent: round(maxEfficiencyPercent, 2),
    annualEnergyLossKWh: round(annualEnergyLossKWh, 0),
  }
}

// ============================================================================
// Step 6: Voltage Regulation
// ============================================================================

function calculateVoltageRegulation(
  input: TransformerInput,
  selection: TransformerSelection,
  impedance: TransformerImpedance,
  loadAnalysis: TransformerLoadAnalysis
): TransformerVoltageRegulation {
  const loadFraction = loadAnalysis.designKVA / selection.ratedKVA
  const pf = loadAnalysis.loadPowerFactor
  const sinPhi = Math.sqrt(1 - pf ** 2)

  // Approximate voltage regulation formula
  // VR% = k * (%R * cos(phi) + %X * sin(phi)) + (k^2 / 200) * (%X * cos(phi) - %R * sin(phi))^2
  const term1 = loadFraction * (impedance.resistancePercent * pf + impedance.reactancePercent * sinPhi)
  const term2 = (loadFraction ** 2 / 200) * (impedance.reactancePercent * pf - impedance.resistancePercent * sinPhi) ** 2
  const regulationPercent = term1 + term2

  const voltageDrop = input.secondaryVoltage * regulationPercent / 100
  const secondaryVoltageAtLoad = input.secondaryVoltage - voltageDrop

  const regulationFormula = `VR% = k(%R·cosφ + %X·sinφ) + (k²/200)·(%X·cosφ - %R·sinφ)²`

  return {
    regulationPercent: round(regulationPercent, 2),
    secondaryVoltageAtLoad: round(secondaryVoltageAtLoad, 1),
    voltageDrop: round(voltageDrop, 1),
    regulationFormula,
  }
}

// ============================================================================
// Step 7: Tap Settings
// ============================================================================

function calculateTapSettings(
  input: TransformerInput,
  selection: TransformerSelection
): TransformerTapSettings {
  const tapRange = input.tapRange
  const tapSteps = input.tapPosition === 'OLTC' ? Math.round(tapRange / 1.25) * 2 : Math.round(tapRange / 2.5) * 2

  const voltagePerTap = tapSteps > 0
    ? (selection.ratedSecondaryVoltage * tapRange / 100) / (tapSteps / 2)
    : 0

  const maxSecondaryVoltage = selection.ratedSecondaryVoltage * (1 + tapRange / 100)
  const minSecondaryVoltage = selection.ratedSecondaryVoltage * (1 - tapRange / 100)

  return {
    tapPosition: input.tapPosition,
    tapRange,
    tapSteps,
    voltagePerTap: round(voltagePerTap, 1),
    minSecondaryVoltage: round(minSecondaryVoltage, 1),
    maxSecondaryVoltage: round(maxSecondaryVoltage, 1),
  }
}

// ============================================================================
// Step 8: Alerts
// ============================================================================

function generateAlerts(
  input: TransformerInput,
  environment: TransformerEnvironment,
  selection: TransformerSelection,
  losses: TransformerLosses,
  impedance: TransformerImpedance,
  voltageRegulation: TransformerVoltageRegulation,
  derating: TransformerDerating | null,
  alerts: TransformerAlert[]
): void {
  // Loading alerts
  if (selection.loadingPercent > 100) {
    alerts.push({ type: 'error', message: `Transformer is overloaded at ${selection.loadingPercent}% of rated capacity.` })
  } else if (selection.loadingPercent > 80) {
    alerts.push({ type: 'warning', message: `Transformer loading at ${selection.loadingPercent}%. Consider next size up for future growth.` })
  }

  if (selection.overloadMargin < 10) {
    alerts.push({ type: 'warning', message: `Only ${selection.overloadMargin}% overload margin. Limited capacity for future expansion.` })
  }

  // Voltage regulation
  if (voltageRegulation.regulationPercent > 5) {
    alerts.push({ type: 'error', message: `Voltage regulation ${voltageRegulation.regulationPercent}% exceeds typical 5% limit.` })
  } else if (voltageRegulation.regulationPercent > 3) {
    alerts.push({ type: 'warning', message: `Voltage regulation ${voltageRegulation.regulationPercent}% is above the 3% guideline for sensitive loads.` })
  }

  // Short circuit
  if (impedance.shortCircuitKA > 50) {
    alerts.push({ type: 'warning', message: `High short-circuit current (${impedance.shortCircuitKA} kA). Verify downstream equipment ratings.` })
  }

  // Efficiency
  if (losses.efficiencyPercent < 95) {
    alerts.push({ type: 'warning', message: `Efficiency ${losses.efficiencyPercent}% is below 95%. Consider higher-efficiency transformer.` })
  }

  // Environmental
  if (derating) {
    if (derating.temperatureDerating < 0.9) {
      alerts.push({ type: 'warning', message: `Ambient temperature ${environment.ambientTemperature}°C requires ${((1 - derating.temperatureDerating) * 100).toFixed(0)}% derating.` })
    }
    if (derating.altitudeDerating < 0.95) {
      alerts.push({ type: 'warning', message: `Altitude ${environment.altitude}m requires ${((1 - derating.altitudeDerating) * 100).toFixed(0)}% derating per ${derating.codeReference}.` })
    }
  }

  // Phase/vector group
  if (input.phase === 'single-phase' && input.vectorGroup !== 'Yyn0') {
    alerts.push({ type: 'info', message: 'Vector group is not applicable for single-phase transformers.' })
  }

  // Tap changer
  if (input.tapPosition === 'none' && voltageRegulation.regulationPercent > 3) {
    alerts.push({ type: 'info', message: 'Consider adding a tap changer to compensate for voltage regulation.' })
  }

  // Indoor vault
  if (environment.installationLocation === 'underground-vault' && input.transformerType === 'oil-filled') {
    const ref = input.standard === 'NEC' ? 'NEC 450.46' : 'IEC 60076'
    alerts.push({ type: 'warning', message: `Oil-filled transformer in vault requires fire suppression per ${ref}.` })
  }

  // Annual energy loss
  if (losses.annualEnergyLossKWh > 50000) {
    alerts.push({ type: 'info', message: `Estimated annual energy loss: ${losses.annualEnergyLossKWh.toLocaleString()} kWh. Evaluate total cost of ownership.` })
  }
}

// ============================================================================
// Utility
// ============================================================================

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
