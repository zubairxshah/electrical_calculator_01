// Power Factor Correction Calculator Types
// Standards: IEC 60831, IEEE 18, NEC 460

export type PFCStandard = 'NEC' | 'IEC'
export type PFCSystemType = 'single-phase-ac' | 'three-phase-ac'
export type PFCConnectionType = 'star' | 'delta'
export type PFCCorrectionType = 'fixed' | 'automatic' | 'semi-automatic'
export type PFCCapacitorType = 'standard' | 'detuned' | 'heavy-duty'
export type PFCLoadProfile = 'constant' | 'variable' | 'cyclic'

export interface PFCInput {
  standard: PFCStandard
  systemType: PFCSystemType
  voltage: number           // System voltage (V)
  frequency: number         // Hz (50 or 60)
  activePower: number       // kW
  currentPowerFactor: number // 0.1 - 0.99
  targetPowerFactor: number  // typically 0.90 - 1.0
  connectionType: PFCConnectionType
  correctionType: PFCCorrectionType
  loadProfile: PFCLoadProfile
  harmonicDistortion: number // THD % (0-50)
}

export interface PFCEnvironment {
  ambientTemperature: number // °C
  altitude: number           // meters
}

export interface PFCProjectInfo {
  projectName: string
  projectLocation: string
  engineerName: string
}

// Calculation result sub-types

export interface PFCLoadAnalysis {
  activePowerKW: number
  currentReactivePowerKVAR: number
  currentApparentPowerKVA: number
  currentPowerFactor: number
  currentPhaseAngleDeg: number
  currentLineCurrent: number // Amps
}

export interface PFCCorrectionSizing {
  requiredKVAR: number
  correctedReactivePowerKVAR: number
  correctedApparentPowerKVA: number
  correctedPowerFactor: number
  correctedPhaseAngleDeg: number
  correctedLineCurrent: number
  currentReduction: number      // Amps saved
  currentReductionPercent: number
  formula: string
}

export interface PFCCapacitorBank {
  totalKVAR: number
  numberOfSteps: number
  kvarPerStep: number
  capacitorType: PFCCapacitorType
  ratedVoltage: number         // V
  ratedCurrent: number         // A per phase
  capacitancePerPhase: number  // µF
  connectionType: PFCConnectionType
  dischargeResistors: boolean
  fusedProtection: boolean
  codeReference: string
}

export interface PFCDeratingFactors {
  temperatureDerating: number
  altitudeDerating: number
  harmonicDerating: number
  combinedDerating: number
  adjustedKVAR: number
}

export interface PFCSavingsEstimate {
  kvaReduction: number
  currentReductionAmps: number
  estimatedLossReductionPercent: number
  demandChargeSavingPercent: number
  penaltyAvoidance: boolean
}

export type PFCAlertType = 'error' | 'warning' | 'info'

export interface PFCAlert {
  type: PFCAlertType
  message: string
}

export interface PFCCalculationResults {
  loadAnalysis: PFCLoadAnalysis
  correctionSizing: PFCCorrectionSizing
  capacitorBank: PFCCapacitorBank
  deratingFactors: PFCDeratingFactors | null
  savings: PFCSavingsEstimate
  alerts: PFCAlert[]
  timestamp: string
  version: string
}

// ── APFC panel design (stages 2–4) ───────────────────────────────────────────

export type PFCSequencePreset = '1:1:1' | '1:2:2' | '1:2:4' | '1:1:2:2'
export type PFCSequenceMode = 'auto' | PFCSequencePreset | 'custom'
export type PFCControllerOutputs = 6 | 8 | 12
export type PFCDetuningFactor = 5.67 | 7 | 14 // percent
export type PFCDetuningChoice = 'auto' | 'none' | PFCDetuningFactor
export type PFCProtectionType = 'fuse' | 'mccb'
export type PFCDesignStage = 1 | 2 | 3 | 4

export interface PFCStepOverride {
  contactorA?: number
  protectionA?: number
  cableSize?: string // sizeMetric (IEC) or sizeAWG (NEC), as in lib/standards/cableTables.ts
}

export interface PFCDesignInput {
  sequenceMode: PFCSequenceMode
  customStepsKVAR: number[]
  maxOutputs: PFCControllerOutputs
  ctPrimaryA: number
  ctSecondaryA: 1 | 5
  minLoadVariationKVAR: number | null // null → 10 % of bank total
  detuning: PFCDetuningChoice
  thirdHarmonic: boolean
  protectionType: PFCProtectionType | null // null → standard default (IEC fuse, NEC MCCB)
  overrides: Record<number, PFCStepOverride> // keyed by 1-based step index
}

export type PFCDesignWarningCode =
  | 'STEP_TOO_COARSE'
  | 'OVERSHOOT'
  | 'NO_STANDARD_STEP_FITS'
  | 'INVALID_CUSTOM_STEPS'
  | 'CK_NEEDS_CT'
  | 'STEP_ABOVE_MAX_CONTACTOR'
  | 'ABOVE_MAX_RATING'
  | 'OVERRIDE_UNDERSIZED'
  | 'MV_NOT_SUPPORTED'
  | 'DETUNING_RECOMMENDED'
  | 'UNDERSIZED_BANK'

export interface PFCDesignWarning {
  code: PFCDesignWarningCode
  severity: 'error' | 'warning' | 'info'
  message: string
  reference?: string
  stepIndex?: number
}

export interface PFCStep {
  index: number // 1-based
  ratio: number | null // null for custom/fixed
  effectiveKVAR: number // at system voltage
  cumulativeKVAR: number
}

export interface PFCController {
  outputs: PFCControllerOutputs
  ck: number | null // A (CT secondary); null when the CT ratio is invalid
  ctRatio: number
}

export interface PFCStepBankDesign {
  mode: PFCSequenceMode
  preset: PFCSequencePreset | null
  targetKVAR: number
  steps: PFCStep[]
  totalKVAR: number
  overshootKVAR: number
  resolutionKVAR: number
  switchingLevels: number
  outputsUsed: number
  controller: PFCController | null // null for fixed correction
  warnings: PFCDesignWarning[]
}

export interface PFCDetuningStep {
  index: number
  effectiveKVAR: number
  ratedKVAR: number // nameplate kVAR at the capacitor rated voltage
  capacitorReactanceOhm: number // star-equivalent
  reactorInductanceMH: number | null // null when not detuned
  currentA: number // fundamental step current at system voltage
}

export interface PFCDetuningDesign {
  recommended: PFCDetuningFactor | null
  applied: PFCDetuningFactor | null
  tuningFrequencyHz: number | null
  capacitorVoltageV: number
  capacitorRatedVoltageV: number
  steps: PFCDetuningStep[]
  totalRatedKVAR: number
  notes: string[]
}

export interface PFCSwitchgearItem<T> {
  value: T | null
  overridden: boolean
  ok: boolean
}

export interface PFCSwitchgearStep {
  index: number
  ratedCurrentA: number
  designCurrentA: number
  contactor: PFCSwitchgearItem<number> & { type: string }
  protection: PFCSwitchgearItem<number> & { type: PFCProtectionType }
  cable: PFCSwitchgearItem<string> & { ampacityA: number | null; label: string | null }
}

export interface PFCSwitchgearDesign {
  factor: number // 1.43 IEC | 1.35 NEC
  protectionType: PFCProtectionType
  steps: PFCSwitchgearStep[]
  totalRatedCurrentA: number
  totalDesignCurrentA: number
  incomerA: number | null
  busbarA: number | null
  warnings: PFCDesignWarning[]
}

export interface PFCPanelDesign {
  available: boolean
  stepBank: PFCStepBankDesign | null
  detuning: PFCDetuningDesign | null
  switchgear: PFCSwitchgearDesign | null
  warnings: PFCDesignWarning[]
}

export interface PFCHistoryEntry {
  id: string
  timestamp: string
  input: PFCInput
  environment: PFCEnvironment
  project: PFCProjectInfo
  results: PFCCalculationResults
  design?: PFCDesignInput // absent on entries saved before the APFC panel upgrade
}

// Store types

export interface PFCState extends PFCInput, PFCEnvironment, PFCProjectInfo {
  results: PFCCalculationResults | null
  showHistorySidebar: boolean
  showEnvironmental: boolean
  design: PFCDesignInput
  activeStage: PFCDesignStage
}

export interface PFCActions {
  // Input setters
  setStandard: (v: PFCStandard) => void
  setSystemType: (v: PFCSystemType) => void
  setVoltage: (v: number) => void
  setFrequency: (v: number) => void
  setActivePower: (v: number) => void
  setCurrentPowerFactor: (v: number) => void
  setTargetPowerFactor: (v: number) => void
  setConnectionType: (v: PFCConnectionType) => void
  setCorrectionType: (v: PFCCorrectionType) => void
  setLoadProfile: (v: PFCLoadProfile) => void
  setHarmonicDistortion: (v: number) => void
  // Environment
  setAmbientTemperature: (v: number) => void
  setAltitude: (v: number) => void
  // Project
  setProjectName: (v: string) => void
  setProjectLocation: (v: string) => void
  setEngineerName: (v: string) => void
  // Results & UI
  setResults: (r: PFCCalculationResults | null) => void
  setShowHistorySidebar: (v: boolean) => void
  setShowEnvironmental: (v: boolean) => void
  // APFC panel design
  setDesign: (patch: Partial<PFCDesignInput>) => void
  setStepOverride: (index: number, patch: PFCStepOverride | null) => void
  setActiveStage: (stage: PFCDesignStage) => void
  // History
  saveToHistory: () => void
  loadFromHistory: (id: string) => void
  deleteFromHistory: (id: string) => void
  getHistory: () => PFCHistoryEntry[]
  // Reset
  reset: () => void
}
