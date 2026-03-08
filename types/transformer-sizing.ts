// Transformer Sizing Calculator Types
// Standards: IEC 60076, IEEE C57, NEC 450

export type TransformerStandard = 'NEC' | 'IEC'
export type TransformerPhase = 'single-phase' | 'three-phase'
export type TransformerType = 'dry-type' | 'oil-filled' | 'cast-resin'
export type CoolingClass = 'AA' | 'AN' | 'AF' | 'ONAN' | 'ONAF' | 'OFAF' | 'ODAF'
export type VectorGroup = 'Dyn11' | 'Dyn1' | 'Dyn5' | 'Yyn0' | 'Dd0' | 'Yd1' | 'Yd11' | 'Yz1' | 'Yz11'
export type TapPosition = 'OLTC' | 'off-load' | 'none'
export type LoadProfile = 'constant' | 'industrial' | 'commercial' | 'residential'

export interface TransformerInput {
  standard: TransformerStandard
  phase: TransformerPhase
  // Load
  loadKW: number
  loadPowerFactor: number
  // Voltages
  primaryVoltage: number       // V
  secondaryVoltage: number     // V
  // Transformer configuration
  transformerType: TransformerType
  coolingClass: CoolingClass
  vectorGroup: VectorGroup     // 3-phase only
  // Tap changer
  tapPosition: TapPosition
  tapRange: number             // % (e.g., ±5%)
  // Load characteristics
  loadProfile: LoadProfile
  demandFactor: number         // 0.5-1.0
  futureGrowth: number         // 1.0-1.5
  // Impedance (optional, for losses calc)
  impedancePercent?: number    // %Z (typically 4-6%)
}

export interface TransformerEnvironment {
  ambientTemperature: number   // °C
  altitude: number             // meters
  installationLocation: 'indoor' | 'outdoor' | 'underground-vault'
}

export interface TransformerProjectInfo {
  projectName: string
  projectLocation: string
  engineerName: string
}

// Result sub-types

export interface TransformerLoadAnalysis {
  loadKW: number
  loadKVA: number
  loadPowerFactor: number
  demandKVA: number           // After demand factor
  designKVA: number           // After growth factor
  primaryCurrentA: number
  secondaryCurrentA: number
  turnsRatio: number
}

export interface TransformerSelection {
  ratedKVA: number            // Standard kVA rating selected
  ratedPrimaryVoltage: number
  ratedSecondaryVoltage: number
  loadingPercent: number      // % of rated capacity
  overloadMargin: number      // % available margin
  codeReference: string
}

export interface TransformerLosses {
  noLoadLossW: number         // Core/iron losses (constant)
  fullLoadLossW: number       // Copper losses at rated load
  actualLoadLossW: number     // Copper losses at actual load
  totalLossW: number          // No-load + actual load
  efficiencyPercent: number   // At actual load
  maxEfficiencyLoadPercent: number // Load % where max efficiency occurs
  maxEfficiencyPercent: number
  annualEnergyLossKWh: number // Estimated annual losses
}

export interface TransformerVoltageRegulation {
  regulationPercent: number   // % voltage regulation at load
  secondaryVoltageAtLoad: number // V at actual load
  voltageDrop: number         // V
  regulationFormula: string
}

export interface TransformerImpedance {
  impedancePercent: number    // %Z
  resistancePercent: number   // %R
  reactancePercent: number    // %X
  shortCircuitCurrentA: number // Secondary short circuit current
  shortCircuitKA: number
}

export interface TransformerTapSettings {
  tapPosition: TapPosition
  tapRange: number            // %
  tapSteps: number
  voltagePerTap: number       // V per tap step
  minSecondaryVoltage: number
  maxSecondaryVoltage: number
}

export interface TransformerDerating {
  temperatureDerating: number
  altitudeDerating: number
  combinedDerating: number
  effectiveKVA: number        // Derated capacity
  codeReference: string
}

export type TransformerAlertType = 'error' | 'warning' | 'info'

export interface TransformerAlert {
  type: TransformerAlertType
  message: string
}

export interface TransformerCalculationResults {
  loadAnalysis: TransformerLoadAnalysis
  selection: TransformerSelection
  losses: TransformerLosses
  voltageRegulation: TransformerVoltageRegulation
  impedance: TransformerImpedance
  tapSettings: TransformerTapSettings
  derating: TransformerDerating | null
  alerts: TransformerAlert[]
  timestamp: string
  version: string
}

export interface TransformerHistoryEntry {
  id: string
  timestamp: string
  input: TransformerInput
  environment: TransformerEnvironment
  project: TransformerProjectInfo
  results: TransformerCalculationResults
}

// Store types

export interface TransformerState extends TransformerInput, TransformerEnvironment, TransformerProjectInfo {
  results: TransformerCalculationResults | null
  showHistorySidebar: boolean
  showEnvironmental: boolean
}

export interface TransformerActions {
  setStandard: (v: TransformerStandard) => void
  setPhase: (v: TransformerPhase) => void
  setLoadKW: (v: number) => void
  setLoadPowerFactor: (v: number) => void
  setPrimaryVoltage: (v: number) => void
  setSecondaryVoltage: (v: number) => void
  setTransformerType: (v: TransformerType) => void
  setCoolingClass: (v: CoolingClass) => void
  setVectorGroup: (v: VectorGroup) => void
  setTapPosition: (v: TapPosition) => void
  setTapRange: (v: number) => void
  setLoadProfile: (v: LoadProfile) => void
  setDemandFactor: (v: number) => void
  setFutureGrowth: (v: number) => void
  setImpedancePercent: (v: number | undefined) => void
  setAmbientTemperature: (v: number) => void
  setAltitude: (v: number) => void
  setInstallationLocation: (v: 'indoor' | 'outdoor' | 'underground-vault') => void
  setProjectName: (v: string) => void
  setProjectLocation: (v: string) => void
  setEngineerName: (v: string) => void
  setResults: (r: TransformerCalculationResults | null) => void
  setShowHistorySidebar: (v: boolean) => void
  setShowEnvironmental: (v: boolean) => void
  saveToHistory: () => void
  loadFromHistory: (id: string) => void
  deleteFromHistory: (id: string) => void
  getHistory: () => TransformerHistoryEntry[]
  reset: () => void
}
