// Panel Schedule & Phase Load Balancing — NEC 2020 Art. 220/408/430, IEC 60364 / IEC 61439-2
// Units: V, A, VA. Load values are stored as entered (value + unit) and converted by the engine.

export type PanelStandard = 'NEC' | 'IEC'

export type SystemTypeId =
  | 'nec-1ph-3w-120-240'
  | 'nec-3ph-4w-208y120'
  | 'nec-3ph-4w-480y277'
  | 'nec-3ph-3w-240d'
  | 'iec-1ph-2w-230'
  | 'iec-3ph-4w-400y230'
  | 'custom'

export type Phase = 'A' | 'B' | 'C'

export type LoadUnit = 'VA' | 'W' | 'kW' | 'kVA' | 'HP'

export type LoadCategory =
  | 'lighting'
  | 'receptacle'
  | 'motor'
  | 'hvac-heating'
  | 'hvac-cooling'
  | 'kitchen'
  | 'water-heater'
  | 'ev-charger'
  | 'other-continuous'
  | 'other-noncontinuous'

export type Occupancy = 'other' | 'dwelling' | 'hotel' | 'warehouse' | 'hospital'

export type MainType = 'main-breaker' | 'mlo'

export type CircuitKind = 'load' | 'spare' | 'space'

export type Poles = 1 | 2 | 3

export interface CustomSystem {
  phases: 1 | 3
  wires: 2 | 3 | 4
  vLN: number | null
  vLL: number
}

export interface SystemDefinition {
  id: SystemTypeId
  label: string
  /** Length of the phase rotation down the rows: 1φ 2W = 1, 1φ 3W = 2, 3φ = 3 */
  phases: 1 | 2 | 3
  wires: 2 | 3 | 4
  /** null for 3-wire delta (no neutral) */
  vLN: number | null
  vLL: number
  hasNeutral: boolean
  maxPoles: Poles
  allowOnePole: boolean
  phaseLabels: string[]
  /** true for genuinely three-phase supplies */
  threePhase: boolean
}

export interface Circuit {
  id: string
  kind: CircuitKind
  description: string
  category: LoadCategory
  loadValue: number
  loadUnit: LoadUnit
  powerFactor: number
  /** IEC motor efficiency (0.5–1.0) */
  efficiency: number
  continuous: boolean
  poles: Poles
  breakerA: number | null
  /** null = auto-place */
  startSpace: number | null
  locked: boolean
  notes: string
}

export interface Panel {
  name: string
  location: string
  fedFrom: string
  mounting: string
  standard: PanelStandard
  systemType: SystemTypeId
  customSystem: CustomSystem | null
  busRatingA: number
  mainType: MainType
  mainRatingA: number | null
  spaces: number
  sccrKA: number | null
  imbalanceTargetPct: number
  occupancy: Occupancy
  iecDiversity: Record<LoadCategory, number>
  iecApplyRdf: boolean
  iecLargestMotorAdder: boolean
  circuits: Circuit[]
}

export type PlacementIssueCode =
  | 'OVERLAP'
  | 'OUT_OF_RANGE'
  | 'TOO_MANY_POLES'
  | 'ONE_POLE_ON_DELTA'
  | 'NO_FREE_SPACE'

export interface PlacementIssue {
  code: PlacementIssueCode
  circuitId: string
  message: string
}

export type PanelWarningCode =
  | 'BREAKER_UNDERSIZED'
  | 'IMBALANCE_HIGH'
  | 'BUS_EXCEEDED'
  | 'MAIN_EXCEEDED'
  | 'MAIN_OVER_BUS'
  | 'SPACES_FULL'
  | 'LIGHTING_FACTOR_NOTE'
  | 'MOTOR_HP_NOT_IN_TABLE'
  | 'MAIN_ABOVE_MAX_RATING'

export type WarningSeverity = 'error' | 'warning' | 'info'

export interface PanelWarning {
  code: PanelWarningCode
  severity: WarningSeverity
  message: string
  reference?: string
  circuitId?: string
}

export interface CircuitLoad {
  circuitId: string
  va: number
  spaces: number[]
  phases: Phase[]
  vaPerPhase: Partial<Record<Phase, number>>
  currentA: number
  requiredBreakerA: number
  warnings: PanelWarning[]
}

export interface PhaseLoad {
  phase: Phase
  label: string
  va: number
  currentA: number
  deviationPct: number | null
}

export interface PhaseSummary {
  perPhase: PhaseLoad[]
  totalVA: number
  totalCurrentA: number
  averageVA: number
  imbalancePct: number | null
  imbalanceOk: boolean
  neutralCurrentA: number | null
  usedSpaces: number
  freeSpaces: number
}

export interface ScheduleResult {
  system: SystemDefinition
  circuitLoads: CircuitLoad[]
  summary: PhaseSummary
  issues: PlacementIssue[]
  warnings: PanelWarning[]
}

export interface DemandRuleApplication {
  id: string
  label: string
  reference: string
  connectedVA: number
  demandVA: number
  factorText: string
}

export interface DemandResult {
  rules: DemandRuleApplication[]
  connectedVA: number
  demandVA: number
  designCurrentA: number
  recommendedMainA: number | null
  busOk: boolean
  mainOk: boolean | null
  warnings: PanelWarning[]
}

export interface BalanceProposal {
  assignments: Record<string, number>
  before: PhaseSummary
  after: PhaseSummary
  movedCircuitIds: string[]
  improved: boolean
  message: string
}

export interface PanelHistoryEntry {
  id: string
  savedAt: string
  name: string
  panel: Panel
}

export interface PanelScheduleState extends Panel {
  proposal: BalanceProposal | null
}

export interface PanelScheduleActions {
  setPanelField: <K extends keyof Panel>(key: K, value: Panel[K]) => void
  setStandard: (standard: PanelStandard) => void
  addCircuit: (circuit: Omit<Circuit, 'id'>) => PlacementIssue | null
  updateCircuit: (id: string, patch: Partial<Circuit>) => PlacementIssue | null
  duplicateCircuit: (id: string) => PlacementIssue | null
  removeCircuit: (id: string) => void
  toggleLock: (id: string) => void
  setIecDiversity: (category: LoadCategory, factor: number) => void
  clearPanel: () => void
  loadExample: () => void
  loadPanel: (panel: Panel) => void
  runBalance: () => void
  acceptProposal: () => void
  discardProposal: () => void
}
