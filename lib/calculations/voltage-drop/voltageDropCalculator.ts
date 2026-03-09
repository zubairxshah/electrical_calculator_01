// Voltage Drop Calculator - Main Calculation Module
// Standards: IEC 60364-5-52, NEC Chapter 9 Table 8, IEC 61439-6 (Busway)

import { create, all, type BigNumber } from 'mathjs'
import { lookupCableBySize } from '@/lib/standards/cableTables'
import {
  CIRCUIT_MULTIPLIERS,
  VOLTAGE_DROP_LIMITS,
  lookupBusway,
  round,
} from './voltageDropData'
import type {
  VoltageDropInput,
  VoltageDropCalculationResults,
  VoltageDropResult,
  VoltageDropAlert,
  CableSuggestion,
} from '@/types/voltage-drop'
import {
  IEC_COPPER_AMPACITY,
  IEC_ALUMINUM_AMPACITY,
  NEC_COPPER_AMPACITY,
  NEC_ALUMINUM_AMPACITY,
} from '@/lib/standards/cableTables'

// Configure math.js with BigNumber for precision
const math = create(all, {
  number: 'BigNumber',
  precision: 64,
})

/**
 * Main voltage drop calculation
 *
 * Supports both cable and busway conductor types.
 *
 * Cable formula:
 *   IEC: Vd = I × L × multiplier × mV/A/m / 1000
 *   NEC: Vd = I × L × multiplier × Ω/1000ft / 1000
 *
 * Busway formula (includes power factor):
 *   Vd = multiplier × I × L × (R×cosφ + X×sinφ) / 1000
 *   where R, X are in mΩ/m and L in meters
 */
export async function calculateVoltageDrop(
  calcInput: { input: VoltageDropInput }
): Promise<VoltageDropCalculationResults> {
  const { input } = calcInput
  const alerts: VoltageDropAlert[] = []

  const multiplier = CIRCUIT_MULTIPLIERS[input.phase]
  const currentPerRun = input.conductorType === 'cable'
    ? input.current / input.parallelRuns
    : input.current

  let result: VoltageDropResult

  if (input.conductorType === 'busway') {
    result = calculateBuswayDrop(input, multiplier, alerts)
  } else {
    result = calculateCableDrop(input, multiplier, currentPerRun, alerts)
  }

  // Cable size suggestions (only for cable mode)
  let cableSuggestions: CableSuggestion[] = []
  if (input.conductorType === 'cable' && input.includeCableSuggestion) {
    cableSuggestions = findSuitableCableSizes(input, multiplier)
  }

  // Generate alerts
  generateAlerts(input, result, alerts)

  return {
    result,
    cableSuggestions,
    alerts,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }
}

/**
 * Calculate voltage drop for cable conductor
 */
function calculateCableDrop(
  input: VoltageDropInput,
  multiplier: number,
  currentPerRun: number,
  alerts: VoltageDropAlert[]
): VoltageDropResult {
  let resistance: number
  let resistanceUnit: string
  let conductorDescription: string

  // Convert length to standard unit
  const length = input.lengthUnit === 'feet' && input.standard === 'IEC'
    ? input.length * 0.3048  // ft to m
    : input.lengthUnit === 'meters' && input.standard === 'NEC'
      ? input.length / 0.3048  // m to ft
      : input.length

  if (input.cableSizeMode === 'custom' && input.customResistance !== null) {
    resistance = input.customResistance
    resistanceUnit = input.standard === 'IEC' ? 'mV/A/m' : 'Ω/1000ft'
    conductorDescription = `Custom R=${resistance} ${resistanceUnit}`
  } else {
    const cableEntry = lookupCableBySize(
      input.cableSizeMm2,
      input.cableSizeAWG,
      input.conductorMaterial,
      input.standard
    )

    if (!cableEntry) {
      throw new Error(
        `Cable size not found: ${input.standard === 'IEC' ? `${input.cableSizeMm2}mm²` : input.cableSizeAWG} ${input.conductorMaterial}`
      )
    }

    if (input.standard === 'IEC') {
      resistance = cableEntry.resistanceMvAm
      resistanceUnit = 'mV/A/m'
    } else {
      resistance = cableEntry.resistanceOhmPer1000ft
      resistanceUnit = 'Ω/1000ft'
    }
    conductorDescription = `${input.standard === 'IEC' ? `${input.cableSizeMm2}mm²` : input.cableSizeAWG} ${input.conductorMaterial}${input.parallelRuns > 1 ? ` × ${input.parallelRuns} runs` : ''}`
  }

  // Effective resistance per run (parallel reduces resistance)
  const effectiveResistance = resistance / input.parallelRuns

  // Calculate voltage drop using Math.js BigNumber for precision
  const I = math.bignumber(input.current) as BigNumber
  const L = math.bignumber(length) as BigNumber
  const R = math.bignumber(effectiveResistance) as BigNumber
  const M = math.bignumber(multiplier) as BigNumber
  const divisor = math.bignumber(1000) as BigNumber

  const vDrop = math.divide(
    math.multiply(math.multiply(math.multiply(I, L), M), R) as BigNumber,
    divisor
  ) as BigNumber

  const voltageDrop = math.number(vDrop)
  const voltageDropPercent = (voltageDrop / input.systemVoltage) * 100
  const receivingEndVoltage = input.systemVoltage - voltageDrop

  return {
    voltageDrop: round(voltageDrop, 2),
    voltageDropPercent: round(voltageDropPercent, 2),
    receivingEndVoltage: round(receivingEndVoltage, 2),
    currentPerRun: round(currentPerRun, 1),
    resistance: effectiveResistance,
    reactance: null,
    resistanceUnit,
    circuitMultiplier: round(multiplier, 3),
    isWithinLimit: voltageDropPercent <= input.maxDropPercent,
    limitPercent: input.maxDropPercent,
    isViolation3Pct: voltageDropPercent > VOLTAGE_DROP_LIMITS.branchCircuit,
    isDangerous: voltageDropPercent > VOLTAGE_DROP_LIMITS.dangerous,
    standardReference: input.standard === 'IEC'
      ? 'IEC 60364-5-52:2009 Annex G'
      : 'NEC 2020 210.19(A) FPN / 215.2(A) FPN',
    conductorDescription,
  }
}

/**
 * Calculate voltage drop for busway / busbar trunking system
 *
 * Formula per IEC 61439-6:
 *   Vd = √3 × I × L × (R×cosφ + X×sinφ) / 1000  (three-phase)
 *   Vd = 2 × I × L × (R×cosφ + X×sinφ) / 1000     (single-phase)
 *
 * Where R and X are in mΩ/m and L is in meters
 */
function calculateBuswayDrop(
  input: VoltageDropInput,
  multiplier: number,
  alerts: VoltageDropAlert[]
): VoltageDropResult {
  let resistanceMOhmPerM: number
  let reactanceMOhmPerM: number
  let impedanceMOhmPerM: number
  let conductorDescription: string

  // Length must be in meters for busway calc
  const lengthM = input.lengthUnit === 'feet'
    ? input.length * 0.3048
    : input.length

  if (input.customBuswayImpedance !== null) {
    // Custom impedance: assume pure resistive for simplicity
    impedanceMOhmPerM = input.customBuswayImpedance
    resistanceMOhmPerM = impedanceMOhmPerM * input.powerFactor
    reactanceMOhmPerM = impedanceMOhmPerM * Math.sin(Math.acos(input.powerFactor))
    conductorDescription = `Custom busway Z=${impedanceMOhmPerM} mΩ/m`
  } else {
    const buswayEntry = lookupBusway(
      input.buswayRating!,
      input.conductorMaterial,
      input.buswayType
    )

    if (!buswayEntry) {
      throw new Error(
        `Busway not found: ${input.buswayRating}A ${input.conductorMaterial} ${input.buswayType}`
      )
    }

    resistanceMOhmPerM = buswayEntry.resistanceMOhmPerM
    reactanceMOhmPerM = buswayEntry.reactanceMOhmPerM
    impedanceMOhmPerM = buswayEntry.impedanceMOhmPerM
    conductorDescription = buswayEntry.description

    // Check if current exceeds busway rating
    if (input.current > buswayEntry.ratingA) {
      alerts.push({
        type: 'error',
        message: `Load current ${input.current}A exceeds busway rating of ${buswayEntry.ratingA}A`,
      })
    }
  }

  // Vd = multiplier × I × L × (R×cosφ + X×sinφ) / 1000
  const cosφ = input.powerFactor
  const sinφ = Math.sin(Math.acos(cosφ))

  const I = math.bignumber(input.current) as BigNumber
  const L = math.bignumber(lengthM) as BigNumber
  const M = math.bignumber(multiplier) as BigNumber
  const R = math.bignumber(resistanceMOhmPerM) as BigNumber
  const X = math.bignumber(reactanceMOhmPerM) as BigNumber
  const cosPhi = math.bignumber(cosφ) as BigNumber
  const sinPhi = math.bignumber(sinφ) as BigNumber
  const divisor = math.bignumber(1000) as BigNumber

  // R×cosφ + X×sinφ
  const effectiveZ = math.add(
    math.multiply(R, cosPhi) as BigNumber,
    math.multiply(X, sinPhi) as BigNumber
  ) as BigNumber

  // Vd = M × I × L × effectiveZ / 1000
  const vDrop = math.divide(
    math.multiply(math.multiply(math.multiply(M, I), L), effectiveZ) as BigNumber,
    divisor
  ) as BigNumber

  const voltageDrop = math.number(vDrop)
  const voltageDropPercent = (voltageDrop / input.systemVoltage) * 100
  const receivingEndVoltage = input.systemVoltage - voltageDrop

  return {
    voltageDrop: round(voltageDrop, 2),
    voltageDropPercent: round(voltageDropPercent, 2),
    receivingEndVoltage: round(receivingEndVoltage, 2),
    currentPerRun: round(input.current, 1),
    resistance: resistanceMOhmPerM,
    reactance: reactanceMOhmPerM,
    resistanceUnit: 'mΩ/m',
    circuitMultiplier: round(multiplier, 3),
    isWithinLimit: voltageDropPercent <= input.maxDropPercent,
    limitPercent: input.maxDropPercent,
    isViolation3Pct: voltageDropPercent > VOLTAGE_DROP_LIMITS.branchCircuit,
    isDangerous: voltageDropPercent > VOLTAGE_DROP_LIMITS.dangerous,
    standardReference: 'IEC 61439-6:2012 / IEC 60364-5-52',
    conductorDescription,
  }
}

/**
 * Find cable sizes that meet the voltage drop target
 */
function findSuitableCableSizes(
  input: VoltageDropInput,
  multiplier: number
): CableSuggestion[] {
  const suggestions: CableSuggestion[] = []
  const targetPercent = input.maxDropPercent

  let cableTable
  if (input.standard === 'IEC') {
    cableTable = input.conductorMaterial === 'copper' ? IEC_COPPER_AMPACITY : IEC_ALUMINUM_AMPACITY
  } else {
    cableTable = input.conductorMaterial === 'copper' ? NEC_COPPER_AMPACITY : NEC_ALUMINUM_AMPACITY
  }

  const length = input.lengthUnit === 'feet' && input.standard === 'IEC'
    ? input.length * 0.3048
    : input.lengthUnit === 'meters' && input.standard === 'NEC'
      ? input.length / 0.3048
      : input.length

  let foundOptimal = false

  for (const entry of cableTable) {
    const resistance = input.standard === 'IEC'
      ? entry.resistanceMvAm
      : entry.resistanceOhmPer1000ft

    const effectiveResistance = resistance / input.parallelRuns
    const vDrop = (input.current * length * multiplier * effectiveResistance) / 1000
    const vDropPercent = (vDrop / input.systemVoltage) * 100

    if (vDropPercent <= targetPercent) {
      const isOptimal = !foundOptimal
      foundOptimal = true

      suggestions.push({
        sizeMm2: entry.sizeMetric,
        sizeAWG: entry.sizeAWG,
        voltageDrop: round(vDrop, 2),
        voltageDropPercent: round(vDropPercent, 2),
        isOptimal,
        description: `${input.standard === 'IEC' ? entry.sizeMetric + 'mm²' : entry.sizeAWG} — ${round(vDropPercent, 2)}% drop`,
      })

      // Show up to 5 suggestions
      if (suggestions.length >= 5) break
    }
  }

  return suggestions
}

/**
 * Generate alerts based on results
 */
function generateAlerts(
  input: VoltageDropInput,
  result: VoltageDropResult,
  alerts: VoltageDropAlert[]
): void {
  if (result.isDangerous) {
    alerts.push({
      type: 'error',
      message: `Voltage drop of ${result.voltageDropPercent}% exceeds 10% — risk of equipment damage, motor stalling, or fire hazard.`,
    })
  } else if (result.isViolation3Pct && result.voltageDropPercent <= 5) {
    alerts.push({
      type: 'warning',
      message: `Voltage drop of ${result.voltageDropPercent}% exceeds the recommended 3% for branch circuits (NEC 210.19 FPN / IEC 60364 Annex G).`,
    })
  } else if (result.voltageDropPercent > 5) {
    alerts.push({
      type: 'warning',
      message: `Voltage drop of ${result.voltageDropPercent}% exceeds the 5% combined feeder+branch limit recommended by NEC 215.2 FPN.`,
    })
  }

  if (result.isWithinLimit) {
    alerts.push({
      type: 'info',
      message: `Voltage drop of ${result.voltageDropPercent}% is within the ${result.limitPercent}% limit.`,
    })
  }

  if (result.receivingEndVoltage < input.systemVoltage * 0.9) {
    alerts.push({
      type: 'error',
      message: `Receiving end voltage ${result.receivingEndVoltage}V is below 90% of nominal (${round(input.systemVoltage * 0.9, 0)}V). Equipment may not operate correctly.`,
    })
  }

  if (input.conductorType === 'cable' && input.parallelRuns > 1) {
    alerts.push({
      type: 'info',
      message: `Using ${input.parallelRuns} parallel runs. Current per conductor: ${result.currentPerRun}A. Ensure equal length and impedance for balanced current sharing.`,
    })
  }

  if (input.conductorType === 'busway' && input.powerFactor < 0.7) {
    alerts.push({
      type: 'warning',
      message: `Low power factor (${input.powerFactor}) increases reactive voltage drop in busway. Consider power factor correction.`,
    })
  }
}

export default calculateVoltageDrop
