// Short Circuit Analysis Calculator
// Standards: IEC 60909, IEEE 551, NEC 110.9

import type {
  ShortCircuitInput,
  SystemImpedanceSummary,
  ImpedanceComponent,
  FaultCurrentResult,
  AsymmetryFactors,
  BreakerAdequacy,
  ShortCircuitAlert,
  ShortCircuitCalculationResults,
  FaultType,
} from '@/types/short-circuit'
import {
  calculatePeakFactor,
  calculateDCTimeConstant,
  calculateAsymmetryFactor,
  selectBreakerRating,
  getMotorContributionMultiplier,
  FAULT_TYPE_MULTIPLIERS,
} from './shortCircuitData'

interface ShortCircuitCalcInput {
  input: ShortCircuitInput
}

export async function calculateShortCircuit(
  calcInput: ShortCircuitCalcInput
): Promise<ShortCircuitCalculationResults> {
  const { input } = calcInput
  const alerts: ShortCircuitAlert[] = []

  // Base values
  const baseVoltage = input.systemVoltage // V line-to-line
  const baseMVA = input.utilityFaultMVA
  const baseImpedance = (baseVoltage ** 2) / (baseMVA * 1e6) // ohms

  // 1. Build impedance model (all referred to system voltage)
  const impedanceSummary = calculateImpedances(input, baseVoltage, baseMVA)

  // 2. Asymmetry factors
  const asymmetryFactors = calculateAsymmetryData(impedanceSummary.systemXRRatio, input.frequency)

  // 3. Calculate fault currents for each fault type
  const faultCurrents = calculateFaultCurrents(input, impedanceSummary, asymmetryFactors)

  // 4. Breaker adequacy
  const maxFaultKA = Math.max(...faultCurrents.map(f => f.symmetricalRMSKA))
  const breakerAdequacy = assessBreakerAdequacy(maxFaultKA, input.standard)

  // 5. Generate alerts
  generateAlerts(input, impedanceSummary, faultCurrents, asymmetryFactors, alerts)

  return {
    impedanceSummary,
    faultCurrents,
    asymmetryFactors,
    breakerAdequacy,
    baseVoltage,
    baseMVA,
    alerts,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }
}

// ============================================================================
// Step 1: Impedance Model
// ============================================================================

function calculateImpedances(
  input: ShortCircuitInput,
  baseVoltage: number,
  baseMVA: number
): SystemImpedanceSummary {
  const components: ImpedanceComponent[] = []
  const baseZ = (baseVoltage ** 2) / (baseMVA * 1e6)

  // Utility source impedance
  const utilityZ = baseZ // By definition: Zutil = Vbase² / MVAsc
  const utilityXR = input.utilityXRRatio
  const utilityR = utilityZ / Math.sqrt(1 + utilityXR ** 2)
  const utilityX = utilityR * utilityXR

  components.push({
    name: 'Utility Source',
    resistanceOhm: round(utilityR, 6),
    reactanceOhm: round(utilityX, 6),
    impedanceOhm: round(utilityZ, 6),
    xrRatio: utilityXR,
  })

  // Transformer impedance (series)
  if (input.hasTransformer && input.transformerKVA > 0) {
    const txZ = (input.transformerImpedancePercent / 100) * (baseVoltage ** 2) / (input.transformerKVA * 1000)
    const txXR = input.transformerXRRatio
    const txR = txZ / Math.sqrt(1 + txXR ** 2)
    const txX = txR * txXR

    components.push({
      name: 'Transformer',
      resistanceOhm: round(txR, 6),
      reactanceOhm: round(txX, 6),
      impedanceOhm: round(txZ, 6),
      xrRatio: txXR,
    })
  }

  // Cable impedance (series)
  if (input.hasCableImpedance && input.cableLength > 0) {
    const lengthKm = input.cableLength / 1000
    const cableR = (input.cableResistance * lengthKm) / input.conductorsPerPhase
    const cableX = (input.cableReactance * lengthKm) / input.conductorsPerPhase
    const cableZ = Math.sqrt(cableR ** 2 + cableX ** 2)
    const cableXR = cableX > 0 ? cableX / cableR : 0

    components.push({
      name: 'Cable/Conductor',
      resistanceOhm: round(cableR, 6),
      reactanceOhm: round(cableX, 6),
      impedanceOhm: round(cableZ, 6),
      xrRatio: round(cableXR, 2),
    })
  }

  // Sum series impedances
  let totalR = components.reduce((sum, c) => sum + c.resistanceOhm, 0)
  let totalX = components.reduce((sum, c) => sum + c.reactanceOhm, 0)

  // Motor contribution (parallel source — reduces total impedance)
  if (input.hasMotorContribution && input.totalMotorHP > 0) {
    const motorKVA = input.totalMotorHP * 0.746 / 0.85 // HP to kVA approx
    const motorMultiplier = getMotorContributionMultiplier(input.motorType)
    const motorFaultMVA = (motorKVA / 1000) * motorMultiplier
    const motorZ = (baseVoltage ** 2) / (motorFaultMVA * 1e6)
    const motorXR = input.motorType === 'synchronous' ? 20 : 6
    const motorR = motorZ / Math.sqrt(1 + motorXR ** 2)
    const motorX = motorR * motorXR

    components.push({
      name: 'Motor Contribution',
      resistanceOhm: round(motorR, 6),
      reactanceOhm: round(motorX, 6),
      impedanceOhm: round(motorZ, 6),
      xrRatio: motorXR,
    })

    // Parallel combination: 1/Ztotal = 1/Zsource + 1/Zmotor
    // Using complex arithmetic
    const sourceZ2 = totalR ** 2 + totalX ** 2
    const motorZ2 = motorR ** 2 + motorX ** 2

    if (sourceZ2 > 0 && motorZ2 > 0) {
      // Conductances and susceptances
      const Gs = totalR / sourceZ2
      const Bs = -totalX / sourceZ2
      const Gm = motorR / motorZ2
      const Bm = -motorX / motorZ2

      const Gtotal = Gs + Gm
      const Btotal = Bs + Bm
      const Ytotal2 = Gtotal ** 2 + Btotal ** 2

      totalR = Gtotal / Ytotal2
      totalX = -Btotal / Ytotal2
    }
  }

  const totalZ = Math.sqrt(totalR ** 2 + totalX ** 2)
  const systemXRRatio = totalR > 0 ? totalX / totalR : 10

  return {
    components,
    totalResistanceOhm: round(totalR, 6),
    totalReactanceOhm: round(totalX, 6),
    totalImpedanceOhm: round(totalZ, 6),
    systemXRRatio: round(systemXRRatio, 2),
  }
}

// ============================================================================
// Step 2: Asymmetry
// ============================================================================

function calculateAsymmetryData(xrRatio: number, frequency: number): AsymmetryFactors {
  return {
    peakFactor: round(calculatePeakFactor(xrRatio), 3),
    asymmetryFactor: round(calculateAsymmetryFactor(xrRatio), 3),
    dcDecayTimeConstant: round(calculateDCTimeConstant(xrRatio, frequency), 2),
    xrRatio: round(xrRatio, 2),
  }
}

// ============================================================================
// Step 3: Fault Currents
// ============================================================================

function calculateFaultCurrents(
  input: ShortCircuitInput,
  impedanceSummary: SystemImpedanceSummary,
  asymmetry: AsymmetryFactors
): FaultCurrentResult[] {
  const results: FaultCurrentResult[] = []
  const Vln = input.phase === 'three-phase'
    ? input.systemVoltage / Math.sqrt(3)
    : input.systemVoltage
  const Vll = input.systemVoltage

  for (const faultType of input.faultTypes) {
    let symmetricalKA: number
    let multiplier: number
    let codeRef: string

    const Isc3ph = Vln / (impedanceSummary.totalImpedanceOhm * 1000) // kA

    switch (faultType) {
      case 'three-phase':
        symmetricalKA = Isc3ph
        multiplier = 1.0
        codeRef = input.standard === 'IEC' ? 'IEC 60909-0 §4.2' : 'IEEE 551 §5'
        break

      case 'line-to-line':
        symmetricalKA = Isc3ph * FAULT_TYPE_MULTIPLIERS['line-to-line']
        multiplier = FAULT_TYPE_MULTIPLIERS['line-to-line']
        codeRef = input.standard === 'IEC' ? 'IEC 60909-0 §4.4' : 'IEEE 551 §7'
        break

      case 'single-line-to-ground': {
        // SLG fault depends on grounding
        let slgMultiplier = 1.0
        if (input.grounding === 'solidly-grounded') {
          slgMultiplier = 1.0 // Can be up to 1.0 of 3-phase in solidly grounded
        } else if (input.grounding === 'resistance-grounded') {
          slgMultiplier = 0.25 // Limited by grounding resistor
        } else if (input.grounding === 'ungrounded') {
          slgMultiplier = 0.0 // Negligible SLG fault current in ungrounded
        } else {
          slgMultiplier = 0.5
        }
        symmetricalKA = Isc3ph * slgMultiplier
        multiplier = slgMultiplier
        codeRef = input.standard === 'IEC' ? 'IEC 60909-0 §4.5' : 'IEEE 551 §8'
        break
      }

      case 'double-line-to-ground':
        symmetricalKA = Isc3ph * FAULT_TYPE_MULTIPLIERS['double-line-to-ground']
        multiplier = FAULT_TYPE_MULTIPLIERS['double-line-to-ground']
        codeRef = input.standard === 'IEC' ? 'IEC 60909-0 §4.6' : 'IEEE 551 §9'
        break
    }

    const peakKA = symmetricalKA * Math.sqrt(2) * asymmetry.peakFactor
    const asymmetricalRMSKA = symmetricalKA * asymmetry.asymmetryFactor
    // Breaking current (IEC: at contact parting time ~50ms)
    const breakingCurrentKA = symmetricalKA * 0.95 // Simplified
    const steadyStateKA = symmetricalKA * 0.8 // After DC decay

    const faultTypeLabels: Record<FaultType, string> = {
      'three-phase': 'Three-Phase (L-L-L)',
      'line-to-line': 'Line-to-Line (L-L)',
      'single-line-to-ground': 'Single Line-to-Ground (L-G)',
      'double-line-to-ground': 'Double Line-to-Ground (L-L-G)',
    }

    results.push({
      faultType,
      faultTypeLabel: faultTypeLabels[faultType],
      symmetricalRMSKA: round(symmetricalKA, 2),
      peakKA: round(peakKA, 2),
      asymmetricalRMSKA: round(asymmetricalRMSKA, 2),
      breakingCurrentKA: round(breakingCurrentKA, 2),
      steadyStateKA: round(steadyStateKA, 2),
      multiplierFactor: round(multiplier, 3),
      codeReference: codeRef,
    })
  }

  return results
}

// ============================================================================
// Step 4: Breaker Adequacy
// ============================================================================

function assessBreakerAdequacy(
  maxSymmetricalKA: number,
  standard: ShortCircuitStandard
): BreakerAdequacy {
  const recommendedRating = selectBreakerRating(maxSymmetricalKA)
  const codeRef = standard === 'IEC'
    ? 'IEC 60947-2 / IEC 62271'
    : 'NEC 110.9 / ANSI C37'

  return {
    requiredBreakingCapacityKA: round(maxSymmetricalKA, 2),
    recommendedBreakerRating: recommendedRating,
    isAdequate: null, // No existing breaker specified to compare
    codeReference: codeRef,
  }
}

type ShortCircuitStandard = 'NEC' | 'IEC'

// ============================================================================
// Step 5: Alerts
// ============================================================================

function generateAlerts(
  input: ShortCircuitInput,
  impedanceSummary: SystemImpedanceSummary,
  faultCurrents: FaultCurrentResult[],
  asymmetry: AsymmetryFactors,
  alerts: ShortCircuitAlert[]
): void {
  const maxFault = Math.max(...faultCurrents.map(f => f.symmetricalRMSKA))

  // High fault current
  if (maxFault > 65) {
    alerts.push({ type: 'error', message: `Very high fault current (${maxFault} kA). Verify equipment withstand ratings and consider current-limiting devices.` })
  } else if (maxFault > 42) {
    alerts.push({ type: 'warning', message: `Fault current ${maxFault} kA exceeds common MCCB ratings. Verify breaker interrupting capacity per ${input.standard === 'IEC' ? 'IEC 60947-2' : 'NEC 110.9'}.` })
  }

  // High X/R ratio
  if (asymmetry.xrRatio > 15) {
    alerts.push({ type: 'warning', message: `High X/R ratio (${asymmetry.xrRatio}). Significant DC offset — peak fault current is ${asymmetry.peakFactor.toFixed(2)}× the symmetrical RMS peak.` })
  }

  // Peak current
  const maxPeak = Math.max(...faultCurrents.map(f => f.peakKA))
  if (maxPeak > 100) {
    alerts.push({ type: 'warning', message: `Peak fault current ${maxPeak.toFixed(1)} kA. Verify busbar and switchgear dynamic withstand ratings.` })
  }

  // Ungrounded SLG
  if (input.grounding === 'ungrounded' && input.faultTypes.includes('single-line-to-ground')) {
    alerts.push({ type: 'info', message: 'Ungrounded system: SLG fault current is negligible, but unfaulted phase voltages rise to line-to-line level. Insulation must be rated accordingly.' })
  }

  // Resistance grounded
  if (input.grounding === 'resistance-grounded') {
    alerts.push({ type: 'info', message: 'Resistance-grounded system: SLG fault current is limited by the grounding resistor. Ground fault protection required.' })
  }

  // Motor contribution
  if (input.hasMotorContribution && input.totalMotorHP > 100) {
    alerts.push({ type: 'info', message: `Motor contribution included (${input.totalMotorHP} HP). Motors contribute 4-6× rated current during first few cycles.` })
  }

  // Low impedance warning
  if (impedanceSummary.totalImpedanceOhm < 0.001) {
    alerts.push({ type: 'warning', message: 'Very low system impedance. Results may indicate infinite bus conditions.' })
  }

  // NEC 110.9 reminder
  if (input.standard === 'NEC') {
    alerts.push({ type: 'info', message: 'Per NEC 110.9: Equipment intended to interrupt current at fault levels shall have an interrupting rating not less than the nominal circuit voltage and the current available at the line terminals.' })
  }
}

// ============================================================================
// Utility
// ============================================================================

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
