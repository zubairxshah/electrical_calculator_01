// Voltage Drop Calculator Types
// Standards: IEC 60364-5-52, NEC Chapter 9, IEC 61439-6 (busway)

export type VoltageDropStandard = 'NEC' | 'IEC'
export type CircuitPhase = 'single-phase' | 'three-phase'
export type ConductorMaterial = 'copper' | 'aluminum'
export type ConductorType = 'cable' | 'busway'
export type LengthUnit = 'meters' | 'feet'
export type CableSizeMode = 'select' | 'custom'

// Busway ratings (standard busbar trunking sizes)
export type BuswayCurrent = 225 | 400 | 630 | 800 | 1000 | 1250 | 1600 | 2000 | 2500 | 3200 | 4000 | 5000 | 6300

export interface BuswayEntry {
  ratingA: number
  material: ConductorMaterial
  /** Impedance in mOhm/m (milliohms per meter) */
  impedanceMOhmPerM: number
  /** Resistance in mOhm/m */
  resistanceMOhmPerM: number
  /** Reactance in mOhm/m */
  reactanceMOhmPerM: number
  /** Power factor of busway impedance */
  powerFactor: number
  type: 'sandwich' | 'non-sandwich'
  description: string
}

export interface VoltageDropInput {
  standard: VoltageDropStandard
  phase: CircuitPhase
  systemVoltage: number
  current: number
  length: number
  lengthUnit: LengthUnit
  conductorType: ConductorType
  conductorMaterial: ConductorMaterial
  powerFactor: number
  // Cable-specific
  cableSizeMode: CableSizeMode
  cableSizeMm2: number | null
  cableSizeAWG: string | null
  customResistance: number | null
  parallelRuns: number
  // Busway-specific
  buswayRating: number | null
  buswayType: 'sandwich' | 'non-sandwich'
  customBuswayImpedance: number | null
  // Limits
  maxDropPercent: number
  includeCableSuggestion: boolean
}

export interface VoltageDropProjectInfo {
  projectName: string
  projectLocation: string
  engineerName: string
}

// Result types

export interface VoltageDropResult {
  voltageDrop: number          // V
  voltageDropPercent: number   // %
  receivingEndVoltage: number  // V
  currentPerRun: number        // A (per parallel cable/busway)
  resistance: number           // used resistance value
  reactance: number | null     // used reactance value (busway)
  resistanceUnit: string
  circuitMultiplier: number
  isWithinLimit: boolean
  limitPercent: number
  isViolation3Pct: boolean     // exceeds conservative 3%
  isDangerous: boolean         // exceeds 10%
  standardReference: string
  conductorDescription: string
}

export interface CableSuggestion {
  sizeMm2: string
  sizeAWG: string | null
  voltageDrop: number
  voltageDropPercent: number
  isOptimal: boolean
  description: string
}

export type VoltageDropAlertType = 'error' | 'warning' | 'info'

export interface VoltageDropAlert {
  type: VoltageDropAlertType
  message: string
}

export interface VoltageDropCalculationResults {
  result: VoltageDropResult
  cableSuggestions: CableSuggestion[]
  alerts: VoltageDropAlert[]
  timestamp: string
  version: string
}

export interface VoltageDropHistoryEntry {
  id: string
  timestamp: string
  input: VoltageDropInput
  project: VoltageDropProjectInfo
  results: VoltageDropCalculationResults
}

// Store types

export interface VoltageDropState extends VoltageDropInput, VoltageDropProjectInfo {
  results: VoltageDropCalculationResults | null
  showHistorySidebar: boolean
}

export interface VoltageDropActions {
  setStandard: (v: VoltageDropStandard) => void
  setPhase: (v: CircuitPhase) => void
  setSystemVoltage: (v: number) => void
  setCurrent: (v: number) => void
  setLength: (v: number) => void
  setLengthUnit: (v: LengthUnit) => void
  setConductorType: (v: ConductorType) => void
  setConductorMaterial: (v: ConductorMaterial) => void
  setPowerFactor: (v: number) => void
  setCableSizeMode: (v: CableSizeMode) => void
  setCableSizeMm2: (v: number | null) => void
  setCableSizeAWG: (v: string | null) => void
  setCustomResistance: (v: number | null) => void
  setParallelRuns: (v: number) => void
  setBuswayRating: (v: number | null) => void
  setBuswayType: (v: 'sandwich' | 'non-sandwich') => void
  setCustomBuswayImpedance: (v: number | null) => void
  setMaxDropPercent: (v: number) => void
  setIncludeCableSuggestion: (v: boolean) => void
  setProjectName: (v: string) => void
  setProjectLocation: (v: string) => void
  setEngineerName: (v: string) => void
  setResults: (r: VoltageDropCalculationResults | null) => void
  setShowHistorySidebar: (v: boolean) => void
  saveToHistory: () => void
  loadFromHistory: (id: string) => void
  deleteFromHistory: (id: string) => void
  getHistory: () => VoltageDropHistoryEntry[]
  reset: () => void
}
