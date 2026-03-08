// Short Circuit Analysis Types
// Standards: IEC 60909, IEEE 551 (Violet Book), NEC 110.9

export type ShortCircuitStandard = 'NEC' | 'IEC'
export type FaultType = 'three-phase' | 'single-line-to-ground' | 'line-to-line' | 'double-line-to-ground'
export type SystemPhase = 'single-phase' | 'three-phase'
export type SystemGrounding = 'solidly-grounded' | 'resistance-grounded' | 'ungrounded' | 'reactance-grounded'

export interface ShortCircuitInput {
  standard: ShortCircuitStandard
  phase: SystemPhase
  systemVoltage: number          // V (line-to-line for 3-phase)
  frequency: number              // Hz (50 or 60)
  grounding: SystemGrounding
  // Utility source
  utilityFaultMVA: number        // MVA available at PCC
  utilityXRRatio: number         // X/R ratio of utility source
  // Transformer (optional)
  hasTransformer: boolean
  transformerKVA: number
  transformerImpedancePercent: number  // %Z
  transformerXRRatio: number
  // Motor contribution (optional)
  hasMotorContribution: boolean
  totalMotorHP: number           // Total connected motor HP
  motorType: 'induction' | 'synchronous' | 'mixed'
  // Cable/conductor to fault point (optional)
  hasCableImpedance: boolean
  cableLength: number            // meters
  cableResistance: number        // ohm/km
  cableReactance: number         // ohm/km
  conductorsPerPhase: number     // parallel conductors
  // Fault types to calculate
  faultTypes: FaultType[]
}

export interface ShortCircuitProjectInfo {
  projectName: string
  projectLocation: string
  engineerName: string
}

// Result sub-types

export interface ImpedanceComponent {
  name: string
  resistanceOhm: number       // R in ohms (referred to fault point voltage)
  reactanceOhm: number        // X in ohms
  impedanceOhm: number        // Z in ohms
  xrRatio: number
}

export interface SystemImpedanceSummary {
  components: ImpedanceComponent[]
  totalResistanceOhm: number
  totalReactanceOhm: number
  totalImpedanceOhm: number
  systemXRRatio: number
}

export interface FaultCurrentResult {
  faultType: FaultType
  faultTypeLabel: string
  symmetricalRMSKA: number       // Isc symmetrical (RMS)
  peakKA: number                 // Ip peak (first cycle)
  asymmetricalRMSKA: number     // Isc asymmetrical (RMS, first cycle)
  breakingCurrentKA: number     // Breaking current (for breaker selection)
  steadyStateKA: number         // Steady-state short circuit
  multiplierFactor: number      // Fault type multiplier relative to 3-phase
  codeReference: string
}

export interface AsymmetryFactors {
  peakFactor: number            // kp (IEC) or multiplier (IEEE)
  asymmetryFactor: number       // sqrt(1 + 2*kp²) factor
  dcDecayTimeConstant: number   // L/R time constant in ms
  xrRatio: number
}

export interface BreakerAdequacy {
  requiredBreakingCapacityKA: number
  recommendedBreakerRating: string
  isAdequate: boolean | null     // null if no breaker specified
  codeReference: string
}

export type ShortCircuitAlertType = 'error' | 'warning' | 'info'

export interface ShortCircuitAlert {
  type: ShortCircuitAlertType
  message: string
}

export interface ShortCircuitCalculationResults {
  impedanceSummary: SystemImpedanceSummary
  faultCurrents: FaultCurrentResult[]
  asymmetryFactors: AsymmetryFactors
  breakerAdequacy: BreakerAdequacy
  baseVoltage: number
  baseMVA: number
  alerts: ShortCircuitAlert[]
  timestamp: string
  version: string
}

export interface ShortCircuitHistoryEntry {
  id: string
  timestamp: string
  input: ShortCircuitInput
  project: ShortCircuitProjectInfo
  results: ShortCircuitCalculationResults
}

// Store types

export interface ShortCircuitState extends ShortCircuitInput, ShortCircuitProjectInfo {
  results: ShortCircuitCalculationResults | null
  showHistorySidebar: boolean
}

export interface ShortCircuitActions {
  setStandard: (v: ShortCircuitStandard) => void
  setPhase: (v: SystemPhase) => void
  setSystemVoltage: (v: number) => void
  setFrequency: (v: number) => void
  setGrounding: (v: SystemGrounding) => void
  setUtilityFaultMVA: (v: number) => void
  setUtilityXRRatio: (v: number) => void
  setHasTransformer: (v: boolean) => void
  setTransformerKVA: (v: number) => void
  setTransformerImpedancePercent: (v: number) => void
  setTransformerXRRatio: (v: number) => void
  setHasMotorContribution: (v: boolean) => void
  setTotalMotorHP: (v: number) => void
  setMotorType: (v: 'induction' | 'synchronous' | 'mixed') => void
  setHasCableImpedance: (v: boolean) => void
  setCableLength: (v: number) => void
  setCableResistance: (v: number) => void
  setCableReactance: (v: number) => void
  setConductorsPerPhase: (v: number) => void
  setFaultTypes: (v: FaultType[]) => void
  setProjectName: (v: string) => void
  setProjectLocation: (v: string) => void
  setEngineerName: (v: string) => void
  setResults: (r: ShortCircuitCalculationResults | null) => void
  setShowHistorySidebar: (v: boolean) => void
  saveToHistory: () => void
  loadFromHistory: (id: string) => void
  deleteFromHistory: (id: string) => void
  getHistory: () => ShortCircuitHistoryEntry[]
  reset: () => void
}
