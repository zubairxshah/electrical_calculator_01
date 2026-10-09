import type {
  PFCInput, PFCCalculationResults, PFCDesignInput,
} from '@/types/power-factor-correction'

export const iecInput: PFCInput = {
  standard: 'IEC', systemType: 'three-phase-ac', voltage: 400, frequency: 50, activePower: 100,
  currentPowerFactor: 0.75, targetPowerFactor: 0.95, connectionType: 'delta', correctionType: 'automatic',
  loadProfile: 'variable', harmonicDistortion: 5,
}

export const necInput: PFCInput = { ...iecInput, standard: 'NEC', voltage: 480, frequency: 60 }

export const baseDesign: PFCDesignInput = {
  sequenceMode: 'auto',
  customStepsKVAR: [],
  maxOutputs: 12,
  ctPrimaryA: 1000,
  ctSecondaryA: 5,
  minLoadVariationKVAR: null,
  detuning: 'auto',
  thirdHarmonic: false,
  protectionType: null,
  overrides: {},
}

/** Minimal stage 1 result carrying only what the design modules read */
export function resultsFor(requiredKVAR: number, adjustedKVAR?: number): PFCCalculationResults {
  return {
    loadAnalysis: {
      activePowerKW: 0, currentReactivePowerKVAR: 0, currentApparentPowerKVA: 0,
      currentPowerFactor: 0.75, currentPhaseAngleDeg: 0, currentLineCurrent: 0,
    },
    correctionSizing: {
      requiredKVAR, correctedReactivePowerKVAR: 0, correctedApparentPowerKVA: 0, correctedPowerFactor: 0.95,
      correctedPhaseAngleDeg: 0, correctedLineCurrent: 0, currentReduction: 0, currentReductionPercent: 0, formula: '',
    },
    capacitorBank: {
      totalKVAR: 0, numberOfSteps: 1, kvarPerStep: 0, capacitorType: 'standard', ratedVoltage: 0, ratedCurrent: 0,
      capacitancePerPhase: 0, connectionType: 'delta', dischargeResistors: true, fusedProtection: true, codeReference: '',
    },
    deratingFactors: adjustedKVAR === undefined ? null : {
      temperatureDerating: 1, altitudeDerating: 1, harmonicDerating: 1, combinedDerating: 1, adjustedKVAR,
    },
    savings: {
      kvaReduction: 0, currentReductionAmps: 0, estimatedLossReductionPercent: 0,
      demandChargeSavingPercent: 0, penaltyAvoidance: false,
    },
    alerts: [],
    timestamp: '2026-10-10T00:00:00.000Z',
    version: '1.0.0',
  }
}
