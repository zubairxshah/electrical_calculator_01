// Harmonic Analysis / THD Calculator Types
// Standards: IEEE 519-2022, IEC 61000-3-2, IEC 61000-3-12

export type HarmonicStandard = 'IEEE519' | 'IEC61000'

export type SystemType = 'single-phase' | 'three-phase'

export type LoadProfile =
  | 'custom'
  | 'vfd-6pulse'
  | 'vfd-12pulse'
  | 'vfd-18pulse'
  | 'ups-online'
  | 'ups-offline'
  | 'led-driver'
  | 'smps'
  | 'arc-furnace'
  | 'welder'
  | 'fluorescent'
  | 'dc-drive-6pulse'
  | 'dc-drive-12pulse'

export type VoltageLevel = 'lv' | 'mv' | 'hv' // <1kV, 1-69kV, 69-161kV

export type FilterType = 'passive-single' | 'passive-c' | 'active' | 'hybrid'

// Individual harmonic order entry
export interface HarmonicOrder {
  order: number         // 1 = fundamental, 2, 3, ... up to 50
  magnitude: number     // % of fundamental (current or voltage)
  phase?: number        // degrees (optional)
}

// IEEE 519 Table 2 - Voltage distortion limits
export interface VoltageDistortionLimit {
  voltageLevel: string
  individualHarmonic: number  // % max individual
  thd: number                 // % max THD
}

// IEEE 519 Table 3 - Current distortion limits (Isc/IL based)
export interface CurrentDistortionLimit {
  iscIlRatio: string
  h3to10: number
  h11to16: number
  h17to22: number
  h23to34: number
  h35plus: number
  tdd: number
}

export interface HarmonicInput {
  standard: HarmonicStandard
  systemType: SystemType
  voltageLevel: VoltageLevel
  systemVoltage: number           // V
  fundamentalFrequency: 50 | 60   // Hz

  // Load data
  loadProfile: LoadProfile
  fundamentalCurrent: number      // A (fundamental / full load current)
  loadPowerKW: number | null      // kW (optional, for context)

  // IEEE 519 specific - for TDD calculation
  shortCircuitCurrentKA: number | null  // kA at PCC
  maxDemandCurrent: number | null       // A (IL - max demand load current, 15/30 min)

  // Harmonic spectrum
  currentHarmonics: HarmonicOrder[]     // user-entered or from profile
  voltageHarmonics: HarmonicOrder[]     // optional - for voltage THD

  // Analysis options
  calculateVoltageThd: boolean
  calculateFilterSizing: boolean
  targetThd: number | null              // % target THD for filter sizing
}

export interface HarmonicProjectInfo {
  projectName: string
  projectLocation: string
  engineerName: string
}

// Results
export interface THDResult {
  thd: number                     // % Total Harmonic Distortion
  rms: number                     // RMS value including harmonics
  fundamentalRms: number          // RMS of fundamental
  crestFactor: number
  kFactor: number                 // transformer K-factor (current only)
  peakValue: number
  harmonicOrders: HarmonicOrderResult[]
}

export interface HarmonicOrderResult {
  order: number
  magnitude: number               // % of fundamental
  frequency: number               // Hz
  rmsValue: number                // A or V
  complianceStatus: 'pass' | 'fail' | 'warning'
  limit: number | null            // applicable limit %
}

export interface TDDResult {
  tdd: number                     // % Total Demand Distortion
  iscIlRatio: number
  applicableLimitCategory: string
  limit: number                   // applicable TDD limit
  complianceStatus: 'pass' | 'fail' | 'warning'
}

export interface ComplianceResult {
  standard: string
  overallStatus: 'compliant' | 'non-compliant' | 'marginal'
  currentCompliance: {
    thdStatus: 'pass' | 'fail' | 'warning'
    thdValue: number
    thdLimit: number
    individualViolations: { order: number; value: number; limit: number }[]
  }
  voltageCompliance: {
    thdStatus: 'pass' | 'fail' | 'warning'
    thdValue: number
    thdLimit: number
    individualViolations: { order: number; value: number; limit: number }[]
  } | null
  tddCompliance: TDDResult | null
}

export interface FilterRecommendation {
  filterType: FilterType
  targetHarmonics: number[]       // orders to mitigate
  estimatedReduction: number      // % THD reduction
  capacitorKVAR: number | null
  inductorMH: number | null
  tuningFrequency: number | null  // Hz
  description: string
  estimatedCost: 'low' | 'medium' | 'high'
}

export interface HarmonicAlert {
  type: 'error' | 'warning' | 'info'
  message: string
  field?: string
}

export interface HarmonicAnalysisResults {
  currentThd: THDResult
  voltageThd: THDResult | null
  compliance: ComplianceResult
  filterRecommendations: FilterRecommendation[]
  alerts: HarmonicAlert[]
  derating: {
    transformerKFactor: number
    transformerDerating: number     // % derating for standard transformer
    cableDerating: number           // % derating
    capacitorStress: number         // % voltage stress increase
  }
  timestamp: string
  version: string
}

// Store
export interface HarmonicAnalysisState extends HarmonicInput, HarmonicProjectInfo {
  results: HarmonicAnalysisResults | null
  showHistorySidebar: boolean
}

export interface HarmonicAnalysisActions {
  setStandard: (v: HarmonicStandard) => void
  setSystemType: (v: SystemType) => void
  setVoltageLevel: (v: VoltageLevel) => void
  setSystemVoltage: (v: number) => void
  setFundamentalFrequency: (v: 50 | 60) => void
  setLoadProfile: (v: LoadProfile) => void
  setFundamentalCurrent: (v: number) => void
  setLoadPowerKW: (v: number | null) => void
  setShortCircuitCurrentKA: (v: number | null) => void
  setMaxDemandCurrent: (v: number | null) => void
  setCurrentHarmonics: (v: HarmonicOrder[]) => void
  setVoltageHarmonics: (v: HarmonicOrder[]) => void
  setCalculateVoltageThd: (v: boolean) => void
  setCalculateFilterSizing: (v: boolean) => void
  setTargetThd: (v: number | null) => void
  setProjectName: (v: string) => void
  setProjectLocation: (v: string) => void
  setEngineerName: (v: string) => void
  setResults: (v: HarmonicAnalysisResults | null) => void
  setShowHistorySidebar: (v: boolean) => void
  updateCurrentHarmonic: (order: number, magnitude: number) => void
  updateVoltageHarmonic: (order: number, magnitude: number) => void
  saveToHistory: () => void
  loadFromHistory: (id: string) => void
  deleteFromHistory: (id: string) => void
  getHistory: () => HarmonicHistoryEntry[]
  reset: () => void
}

export interface HarmonicHistoryEntry {
  id: string
  timestamp: string
  input: HarmonicInput
  project: HarmonicProjectInfo
  results: HarmonicAnalysisResults
}
