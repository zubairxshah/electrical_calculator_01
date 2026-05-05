// Motor Starting Analysis Calculator Types
// Standards: NEC 430, IEC 60034-12, IEEE 3002.7-2018, IEEE 1668-2017, NEMA MG 1

// ── Enums / Union Types ──────────────────────────────────────────────

export type Standard = 'NEC' | 'IEC'

export type StartingMethodId =
  | 'DOL'
  | 'STAR_DELTA'
  | 'AUTOTRANSFORMER'
  | 'SOFT_STARTER'
  | 'VFD'

export type CodeLetter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J'
  | 'K' | 'L' | 'M' | 'N' | 'P' | 'R' | 'S' | 'T' | 'U' | 'V'

export type IecDesign = 'N' | 'H'

export type NemaDesign = 'A' | 'B' | 'C' | 'D'

export type MotorDesignClass = NemaDesign | IecDesign

export type PowerUnit = 'HP' | 'kW'
export type InertiaUnit = 'lb_ft2' | 'kg_m2'

export type CableMaterial = 'Cu' | 'Al'
export type ConduitType = 'PVC' | 'Steel' | 'Aluminum'

export type TorqueProfile = 'constant' | 'quadratic_fan_pump' | 'linear'

export type StarDeltaTransition = 'open' | 'closed'

export type AutotransformerTap = 0.50 | 0.65 | 0.80

export type DipScenario =
  | 'steady_state_common'
  | 'transient_motor_start'
  | 'sensitive_loads'

export type PccLocation = 'transformer_secondary' | 'motor_terminals'

export type UtilityAssumed = 'computed' | 'infinite_bus'

export type QualitativeCost = 'low' | 'medium' | 'high' | 'very_high'
export type QualitativeComplexity = 'low' | 'medium' | 'high'

export type ThermalVerdict = 'safe' | 'caution' | 'damage_risk'
export type TorqueVerdict = 'sufficient' | 'insufficient'

export type VerdictBadge =
  | 'recommended'
  | 'acceptable'
  | 'excessive_dip'
  | 'insufficient_torque'
  | 'thermal_risk'
  | 'not_applicable'

// ── Reference Entities ───────────────────────────────────────────────

export interface NemaCodeLetter {
  letter: CodeLetter
  kvaPerHpMin: number
  kvaPerHpMax: number
  kvaPerHpMid: number
}

export interface IecDesignClass {
  design: IecDesign
  iStartPerIRatedDefault: number
  tStartPerTRatedDefault: number
  tBreakdownPerTRated: number
}

export interface NemaDesignClass {
  design: NemaDesign
  iStartPerIRatedTypical: number
  tStartPerTRated: number
  slipPercent: number
}

export interface ThermalLimitDefault {
  hpMin: number
  hpMax: number
  stallTimeColdSec: number
  stallTimeHotSec: number
}

export interface Ieee1668Threshold {
  scenario: DipScenario
  dipPercentMax: number
  label: string
}

export interface CableImpedance {
  sizeId: string
  material: CableMaterial
  conduitType: ConduitType
  rPerMeterOhms: number
  xPerMeterOhms: number
  sourceTable: string
}

// ── Input Entities ───────────────────────────────────────────────────

export interface Motor {
  ratedPower: number
  powerUnit: PowerUnit
  ratedVoltage: number
  ratedCurrent: number
  poles: number
  ratedSpeed?: number
  efficiency: number
  powerFactor: number
  serviceFactor: number
  designClass: MotorDesignClass
  codeLetter?: CodeLetter
  lockedRotorAmps?: number
  lockedRotorMultiplier?: number
  startingTorquePerRated?: number
  breakdownTorquePerRated?: number
  stallTimeHotSec?: number
  stallTimeColdSec?: number
}

export interface Load {
  torqueProfile: TorqueProfile
  breakawayTorquePerRated: number
  inertia: number
  inertiaUnit: InertiaUnit
}

export interface UtilitySource {
  primaryVoltage: number
  shortCircuitMva?: number
  shortCircuitAmps?: number
  xOverR: number
  isInfiniteBus: boolean
}

export interface Transformer {
  ratedKva: number
  primaryVoltageKv: number
  secondaryVoltageV: number
  percentZ: number
  xOverR: number
}

export interface CableSegment {
  sizeId: string
  material: CableMaterial
  lengthMeters: number
  parallelRuns: number
  conduitType: ConduitType
}

export interface SourceChain {
  utility: UtilitySource
  transformer: Transformer
  cable: CableSegment
  pccLocation: PccLocation
}

export interface DolConfig {
  method: 'DOL'
}

export interface StarDeltaConfig {
  method: 'STAR_DELTA'
  starDeltaTransition: StarDeltaTransition
}

export interface AutotransformerConfig {
  method: 'AUTOTRANSFORMER'
  autotransformerTap: AutotransformerTap
}

export interface SoftStarterConfig {
  method: 'SOFT_STARTER'
  softStarterRampSec: number
  softStarterInitialVoltagePct: number
  softStarterCurrentLimitPctFla: number
}

export interface VfdConfig {
  method: 'VFD'
  vfdHasBypass: boolean
}

export type MethodConfig =
  | DolConfig
  | StarDeltaConfig
  | AutotransformerConfig
  | SoftStarterConfig
  | VfdConfig

export interface MotorStartingInput {
  standard: Standard
  motor: Motor
  load: Load
  sourceChain: SourceChain
  methodConfigs: MethodConfig[]
  voltageDipThresholdPct?: number
  voltageDipScenario: DipScenario
  projectName?: string
  projectRef?: string
  createdAt: string
}

// ── Computed Entities ────────────────────────────────────────────────

export interface ImpedanceComplex {
  r: number
  x: number
}

export interface ThevenZResult {
  baseKva: number
  baseVoltageV: number
  zUtilityPu: ImpedanceComplex
  zTransformerPu: ImpedanceComplex
  zCablePu: ImpedanceComplex
  zTotalPu: ImpedanceComplex
  zTotalOhms: ImpedanceComplex
  utilityAssumed: UtilityAssumed
  notes?: string[]
}

export interface CurrentSample {
  tSec: number
  iAmps: number
}

export interface SpeedSample {
  rpm: number
  tMotor: number
  tLoad: number
}

export interface MethodResult {
  method: StartingMethodId
  methodLabel: string
  startingCurrentLineAmps: number
  startingCurrentMotorAmps: number
  startingCurrentPctFla: number
  startingTorquePctRated: number
  voltageAtMotorPu: number
  voltageDipAtPccPct: number
  voltageDipPasses1668: boolean
  accelerationTimeSec: number
  thermalMarginRatio: number
  thermalVerdict: ThermalVerdict
  torqueVerdict: TorqueVerdict
  qualitativeCost: QualitativeCost
  qualitativeComplexity: QualitativeComplexity
  verdictBadge: VerdictBadge
  methodNotes: string[]
  currentVsTime: CurrentSample[]
}

export interface ComparisonResult {
  methods: MethodResult[]
  recommendedMethod: StartingMethodId | 'none'
  recommendationRationale: string
  thresholdAppliedPct: number
  thresholdScenario: string
}

export interface MotorStartingResult {
  input: MotorStartingInput
  sourceImpedance: ThevenZResult
  comparison: ComparisonResult
  computedAt: string
  version: string
}

export interface MotorStartingHistoryEntry {
  id: string
  result: MotorStartingResult
  createdAt: string
  label: string
}
