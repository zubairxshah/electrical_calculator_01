// Arc Flash Calculator — IEEE 1584-2018 / NFPA 70E-2024 / IEC 61482
// Internal units are SI: V, kA, mm, ms, J/cm². Convert only at the UI/PDF boundary.

export type ArcFlashStandard = 'NEC' | 'IEC'

export type ElectrodeConfig = 'VCB' | 'VCBB' | 'HCB' | 'VOA' | 'HOA'

export type EnclosureType = 'typical' | 'shallow' | 'open-air'

export type ArcingCase = 'nominal' | 'reduced'

export type PpeCategory = 1 | 2 | 3 | 4

export type PpeOutcome = 'below-threshold' | PpeCategory | 'danger'

export type PpeMethod = 'incident-energy' | 'table'

export type EquipmentClassId =
  | 'kv15-switchgear'
  | 'kv15-mcc'
  | 'kv5-switchgear-large'
  | 'kv5-switchgear-small'
  | 'kv5-mcc'
  | 'lv-switchgear'
  | 'lv-mcc-panel-shallow'
  | 'lv-mcc-panel-deep'
  | 'cable-jb-shallow'
  | 'cable-jb-deep'
  | 'custom'

export interface EnclosureDimensions {
  heightMm: number
  widthMm: number
  depthMm: number
}

export interface ArcFlashInput {
  equipmentId: string
  projectName: string
  voltageV: number
  frequencyHz: 50 | 60
  boltedFaultKA: number
  electrodeConfig: ElectrodeConfig
  gapMm: number
  workingDistanceMm: number
  /** null iff electrodeConfig is VOA or HOA */
  enclosure: EnclosureDimensions | null
  arcingTimeNominalMs: number
  arcingTimeReducedMs: number
  sameTimeForBoth: boolean
  applyTwoSecondCap: boolean
  equipmentClass: EquipmentClassId
  ppeMethod: PpeMethod
  tableRowId: string | null
}

export interface IntermediateValues {
  iArc600KA: number
  iArc2700KA?: number
  iArc14300KA?: number
  e600Jcm2?: number
  e2700Jcm2?: number
  e14300Jcm2?: number
  afb600Mm?: number
  afb2700Mm?: number
  afb14300Mm?: number
  /** 1 − 0.5·VarCf for the reduced case; 1 for nominal */
  reductionFactor: number
}

export interface CaseResult {
  case: ArcingCase
  arcingCurrentKA: number
  arcingTimeMs: number
  incidentEnergyJcm2: number
  incidentEnergyCalcm2: number
  arcFlashBoundaryMm: number
  intermediates: IntermediateValues
}

export interface EnclosureCorrection {
  type: EnclosureType
  /** Equivalent width/height in inches (IEEE 1584-2018 Eqs. 11–13); 0 for open air */
  equivalentWidthIn: number
  equivalentHeightIn: number
  ees: number
  cf: number
}

export type ArcFlashWarningCode =
  | 'ENCLOSURE_CAPPED'
  | 'OPENING_LT_4G'
  | 'TIME_GT_2S'
  | 'REDUCED_TIME_SHORTER'
  | 'LOW_VOLTAGE_SUSTAIN'
  | 'TABLE_METHOD_NOT_APPLICABLE'

export interface ArcFlashWarning {
  code: ArcFlashWarningCode
  severity: 'warning' | 'info'
  message: string
  clause: string
}

export type ModelPath = 'LV' | 'MV'

export interface ArcFlashResult {
  nominal: CaseResult
  reduced: CaseResult
  governingCase: ArcingCase
  governing: CaseResult
  varCf: number
  enclosure: EnclosureCorrection
  warnings: ArcFlashWarning[]
  modelPath: ModelPath
  standardRefs: string[]
  calculatedAt: string
}

export interface ApproachBoundaries {
  limitedMovableMm: number
  limitedFixedMm: number
  restricted: number | 'avoid-contact'
  /** Imperial source text, e.g. "3 ft 6 in" */
  limitedMovableText: string
  limitedFixedText: string
  restrictedText: string
}

export interface TableMethodResult {
  rowId: string
  applicable: boolean
  category: 1 | 2 | 4
  afbMm: number
  failedLimits: string[]
}

export interface PpeAssessment {
  method: PpeMethod
  outcome: PpeOutcome
  minArcRatingCalcm2: number | null
  minArcRatingJcm2: number | null
  clothing: string[]
  equipment: string[]
  iecRequirement: { minArcRatingJcm2: number; text: string; note: string } | null
  tableMethod: TableMethodResult | null
  approachBoundaries: ApproachBoundaries
  references: string[]
}

export interface ArcFlashLabel {
  signalWord: 'WARNING' | 'DANGER'
  nominalVoltageV: number
  arcFlashBoundaryMm: number
  incidentEnergyJcm2: number
  incidentEnergyCalcm2: number
  workingDistanceMm: number
  ppeOutcome: PpeOutcome
  minArcRatingCalcm2: number | null
  minArcRatingJcm2: number | null
  limitedApproachMm: number
  limitedApproachText: string
  restrictedApproachMm: number | 'avoid-contact'
  restrictedApproachText: string
  equipmentId: string
  date: string
  standard: ArcFlashStandard
}

export interface FieldError {
  field: string
  code: string
  message: string
  clause: string
}

export interface ArcFlashHistoryEntry {
  id: string
  timestamp: string
  title: string
  governingEnergyCalcm2: number
  outcome: PpeOutcome
  input: ArcFlashInput
  result: ArcFlashResult
  ppe: PpeAssessment | null
}

export interface ArcFlashState extends ArcFlashInput {
  standard: ArcFlashStandard
  result: ArcFlashResult | null
  ppe: PpeAssessment | null
  validationErrors: FieldError[]
  isStale: boolean
  history: ArcFlashHistoryEntry[]
}

export interface ArcFlashActions {
  setField: <K extends keyof ArcFlashInput>(key: K, value: ArcFlashInput[K]) => void
  setEnclosure: (dim: keyof EnclosureDimensions, value: number) => void
  setElectrodeConfig: (config: ElectrodeConfig) => void
  setSameTimeForBoth: (on: boolean) => void
  setStandard: (standard: ArcFlashStandard) => void
  setValidationErrors: (errors: FieldError[]) => void
  setResult: (result: ArcFlashResult | null, ppe: PpeAssessment | null) => void
  applyEquipmentClass: (id: EquipmentClassId) => void
  addToHistory: (entry: ArcFlashHistoryEntry) => void
  loadFromHistory: (id: string) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  reset: () => void
}
