// Power Factor Correction Calculator
// Standards: IEC 60831, IEEE 18, NEC 460

import type {
  PFCInput,
  PFCEnvironment,
  PFCLoadAnalysis,
  PFCCorrectionSizing,
  PFCCapacitorBank,
  PFCDeratingFactors,
  PFCSavingsEstimate,
  PFCAlert,
  PFCCalculationResults,
  PFCCapacitorType,
} from '@/types/power-factor-correction'
import {
  selectStandardKVAR,
  selectStepSize,
  selectCapacitorVoltageRating,
  getTemperatureDerating,
  getAltitudeDerating,
  getHarmonicDerating,
} from './capacitorData'

interface PFCCalcInput {
  input: PFCInput
  environment: PFCEnvironment
}

export async function calculatePowerFactorCorrection(
  calcInput: PFCCalcInput
): Promise<PFCCalculationResults> {
  const { input, environment } = calcInput
  const alerts: PFCAlert[] = []

  // 1. Validate basics
  if (input.targetPowerFactor <= input.currentPowerFactor) {
    throw new Error('Target power factor must exceed current power factor')
  }

  // 2. Load analysis
  const loadAnalysis = calculateLoadAnalysis(input)

  // 3. Correction sizing
  const correctionSizing = calculateCorrectionSizing(input, loadAnalysis)

  // 4. Derating factors
  const deratingFactors = calculateDeratingFactors(input, environment, correctionSizing.requiredKVAR)

  // 5. Adjusted kVAR after derating
  const effectiveKVAR = deratingFactors
    ? deratingFactors.adjustedKVAR
    : correctionSizing.requiredKVAR

  // 6. Capacitor bank selection
  const capacitorBank = selectCapacitorBank(input, effectiveKVAR, alerts)

  // 7. Savings estimate
  const savings = estimateSavings(loadAnalysis, correctionSizing)

  // 8. Generate alerts
  generateAlerts(input, correctionSizing, capacitorBank, alerts)

  return {
    loadAnalysis,
    correctionSizing,
    capacitorBank,
    deratingFactors,
    savings,
    alerts,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }
}

function calculateLoadAnalysis(input: PFCInput): PFCLoadAnalysis {
  const P = input.activePower // kW
  const pfCurrent = input.currentPowerFactor
  const theta = Math.acos(pfCurrent)

  const currentApparentPowerKVA = P / pfCurrent
  const currentReactivePowerKVAR = P * Math.tan(theta)
  const currentPhaseAngleDeg = (theta * 180) / Math.PI

  // Line current
  let currentLineCurrent: number
  if (input.systemType === 'three-phase-ac') {
    currentLineCurrent = (currentApparentPowerKVA * 1000) / (Math.sqrt(3) * input.voltage)
  } else {
    currentLineCurrent = (currentApparentPowerKVA * 1000) / input.voltage
  }

  return {
    activePowerKW: P,
    currentReactivePowerKVAR: round(currentReactivePowerKVAR, 2),
    currentApparentPowerKVA: round(currentApparentPowerKVA, 2),
    currentPowerFactor: pfCurrent,
    currentPhaseAngleDeg: round(currentPhaseAngleDeg, 2),
    currentLineCurrent: round(currentLineCurrent, 2),
  }
}

function calculateCorrectionSizing(
  input: PFCInput,
  loadAnalysis: PFCLoadAnalysis
): PFCCorrectionSizing {
  const P = input.activePower
  const theta1 = Math.acos(input.currentPowerFactor)
  const theta2 = Math.acos(input.targetPowerFactor)

  // Q_c = P × (tan θ₁ - tan θ₂)
  const requiredKVAR = P * (Math.tan(theta1) - Math.tan(theta2))

  const correctedReactivePowerKVAR = loadAnalysis.currentReactivePowerKVAR - requiredKVAR
  const correctedApparentPowerKVA = Math.sqrt(P * P + correctedReactivePowerKVAR * correctedReactivePowerKVAR)
  const correctedPowerFactor = P / correctedApparentPowerKVA
  const correctedPhaseAngleDeg = (Math.acos(correctedPowerFactor) * 180) / Math.PI

  let correctedLineCurrent: number
  if (input.systemType === 'three-phase-ac') {
    correctedLineCurrent = (correctedApparentPowerKVA * 1000) / (Math.sqrt(3) * input.voltage)
  } else {
    correctedLineCurrent = (correctedApparentPowerKVA * 1000) / input.voltage
  }

  const currentReduction = loadAnalysis.currentLineCurrent - correctedLineCurrent
  const currentReductionPercent = (currentReduction / loadAnalysis.currentLineCurrent) * 100

  const formula = `Qc = P × (tan θ₁ - tan θ₂) = ${P} × (tan ${round((theta1 * 180) / Math.PI, 1)}° - tan ${round((theta2 * 180) / Math.PI, 1)}°) = ${round(requiredKVAR, 2)} kVAR`

  return {
    requiredKVAR: round(requiredKVAR, 2),
    correctedReactivePowerKVAR: round(correctedReactivePowerKVAR, 2),
    correctedApparentPowerKVA: round(correctedApparentPowerKVA, 2),
    correctedPowerFactor: round(correctedPowerFactor, 4),
    correctedPhaseAngleDeg: round(correctedPhaseAngleDeg, 2),
    correctedLineCurrent: round(correctedLineCurrent, 2),
    currentReduction: round(currentReduction, 2),
    currentReductionPercent: round(currentReductionPercent, 1),
    formula,
  }
}

function calculateDeratingFactors(
  input: PFCInput,
  env: PFCEnvironment,
  requiredKVAR: number
): PFCDeratingFactors | null {
  const tempDerating = getTemperatureDerating(env.ambientTemperature)
  const altDerating = getAltitudeDerating(env.altitude)
  const harmDerating = getHarmonicDerating(input.harmonicDistortion)

  const combined = tempDerating * altDerating * harmDerating

  // Only apply if there's actual derating
  if (combined >= 0.99) return null

  return {
    temperatureDerating: tempDerating,
    altitudeDerating: altDerating,
    harmonicDerating: harmDerating,
    combinedDerating: round(combined, 3),
    adjustedKVAR: round(requiredKVAR / combined, 2), // Need MORE capacity to compensate
  }
}

function selectCapacitorBank(
  input: PFCInput,
  effectiveKVAR: number,
  alerts: PFCAlert[]
): PFCCapacitorBank {
  const totalKVAR = selectStandardKVAR(effectiveKVAR)

  // Steps for automatic/semi-automatic
  let numberOfSteps = 1
  let kvarPerStep = totalKVAR
  if (input.correctionType !== 'fixed') {
    const stepping = selectStepSize(totalKVAR)
    numberOfSteps = stepping.steps
    kvarPerStep = stepping.kvarPerStep
  }

  // Capacitor type based on harmonics
  let capacitorType: PFCCapacitorType = 'standard'
  if (input.harmonicDistortion > 10) {
    capacitorType = 'detuned'
    alerts.push({
      type: 'info',
      message: `Detuned capacitors with series reactors recommended for THD of ${input.harmonicDistortion}%.`,
    })
  }
  if (input.harmonicDistortion > 20) {
    capacitorType = 'heavy-duty'
  }

  // Rated voltage
  const ratedVoltage = selectCapacitorVoltageRating(input.voltage)

  // Capacitor current per phase (NEC 460.9 / IEC 60831)
  let ratedCurrent: number
  if (input.systemType === 'three-phase-ac') {
    ratedCurrent = (totalKVAR * 1000) / (Math.sqrt(3) * input.voltage)
  } else {
    ratedCurrent = (totalKVAR * 1000) / input.voltage
  }

  // Capacitance per phase (µF)
  // C = Q / (2π f V²) for single-phase
  // For 3-phase star: C = Q / (2π f V_phase²), V_phase = V_line / √3
  // For 3-phase delta: C = Q / (3 × 2π f V_line²)
  let capacitancePerPhase: number
  const omega = 2 * Math.PI * input.frequency
  if (input.systemType === 'single-phase-ac') {
    capacitancePerPhase = (totalKVAR * 1000) / (omega * input.voltage * input.voltage) * 1e6
  } else if (input.connectionType === 'star') {
    const vPhase = input.voltage / Math.sqrt(3)
    capacitancePerPhase = (totalKVAR * 1000) / (3 * omega * vPhase * vPhase) * 1e6
  } else {
    // delta
    capacitancePerPhase = (totalKVAR * 1000) / (3 * omega * input.voltage * input.voltage) * 1e6
  }

  // Code references
  const codeReference = input.standard === 'NEC'
    ? 'NEC 460.8 (Capacitor discharge), NEC 460.9 (Rating)'
    : 'IEC 60831-1 (Self-healing capacitors), IEC 61921 (PFC equipment)'

  return {
    totalKVAR,
    numberOfSteps,
    kvarPerStep,
    capacitorType,
    ratedVoltage,
    ratedCurrent: round(ratedCurrent, 2),
    capacitancePerPhase: round(capacitancePerPhase, 2),
    connectionType: input.connectionType,
    dischargeResistors: true, // Always required per NEC 460.6 / IEC 60831
    fusedProtection: true,
    codeReference,
  }
}

function estimateSavings(
  loadAnalysis: PFCLoadAnalysis,
  correctionSizing: PFCCorrectionSizing
): PFCSavingsEstimate {
  const kvaReduction = loadAnalysis.currentApparentPowerKVA - correctionSizing.correctedApparentPowerKVA

  // I²R losses reduce proportional to current² reduction
  const currentRatio = correctionSizing.correctedLineCurrent / loadAnalysis.currentLineCurrent
  const lossReductionPercent = (1 - currentRatio * currentRatio) * 100

  // Demand charge savings proportional to kVA reduction
  const demandSavingPercent = (kvaReduction / loadAnalysis.currentApparentPowerKVA) * 100

  // Penalty avoidance if PF corrected above 0.90
  const penaltyAvoidance = loadAnalysis.currentPowerFactor < 0.90 && correctionSizing.correctedPowerFactor >= 0.90

  return {
    kvaReduction: round(kvaReduction, 2),
    currentReductionAmps: correctionSizing.currentReduction,
    estimatedLossReductionPercent: round(lossReductionPercent, 1),
    demandChargeSavingPercent: round(demandSavingPercent, 1),
    penaltyAvoidance,
  }
}

function generateAlerts(
  input: PFCInput,
  sizing: PFCCorrectionSizing,
  bank: PFCCapacitorBank,
  alerts: PFCAlert[]
): void {
  // Over-correction warning
  if (input.targetPowerFactor > 0.98) {
    alerts.push({
      type: 'warning',
      message: 'Target PF > 0.98 may result in leading power factor during light load. Consider automatic stepped correction.',
    })
  }

  // Large bank warning
  if (bank.totalKVAR > 500) {
    alerts.push({
      type: 'info',
      message: `Large capacitor bank (${bank.totalKVAR} kVAR). Automatic switching with PF controller recommended.`,
    })
  }

  // Fixed correction with variable load
  if (input.correctionType === 'fixed' && input.loadProfile === 'variable') {
    alerts.push({
      type: 'warning',
      message: 'Fixed correction on variable load may cause leading PF. Consider automatic correction.',
    })
  }

  // Significant current reduction
  if (sizing.currentReductionPercent > 20) {
    alerts.push({
      type: 'info',
      message: `Current reduction of ${sizing.currentReductionPercent}% achieved — consider downsizing cables/transformer.`,
    })
  }

  // Discharge resistors
  alerts.push({
    type: 'info',
    message: `Discharge resistors required to reduce voltage to ≤50V within ${input.standard === 'NEC' ? '1 minute (NEC 460.6)' : '3 minutes (IEC 60831)'}.`,
  })

  // Resonance risk
  if (input.harmonicDistortion > 5) {
    const resonanceOrder = Math.round(Math.sqrt(bank.totalKVAR / input.activePower) * 10) / 10
    if (resonanceOrder > 0) {
      alerts.push({
        type: 'warning',
        message: `Check for harmonic resonance. Perform resonance analysis before installation.`,
      })
    }
  }
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
