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

export interface PFCHistoryEntry {
  id: string
  timestamp: string
  input: PFCInput
  environment: PFCEnvironment
  project: PFCProjectInfo
  results: PFCCalculationResults
}

// Store types

export interface PFCState extends PFCInput, PFCEnvironment, PFCProjectInfo {
  results: PFCCalculationResults | null
  showHistorySidebar: boolean
  showEnvironmental: boolean
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
  // History
  saveToHistory: () => void
  loadFromHistory: (id: string) => void
  deleteFromHistory: (id: string) => void
  getHistory: () => PFCHistoryEntry[]
  // Reset
  reset: () => void
}
