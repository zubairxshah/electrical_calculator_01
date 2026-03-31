// Generator Sizing Calculator Types
// Standards: ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702

// ── Enums / Union Types ──────────────────────────────────────────────

export type LoadType = 'motor' | 'resistive' | 'lighting' | 'mixed' | 'hvac'

export type DutyType = 'standby' | 'prime'

export type Phases = 'single' | 'three'

export type Frequency = 50 | 60

export type FuelType = 'diesel' | 'natural-gas'

export type NecClassification = '700' | '701' | '702'

export type StartingMethod =
  | 'dol'
  | 'star-delta'
  | 'autotransformer-65'
  | 'autotransformer-80'
  | 'soft-starter'
  | 'vfd'

export type NemaCodeLetter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J'
  | 'K' | 'L' | 'M' | 'N' | 'P' | 'R' | 'S' | 'T' | 'U' | 'V'

export type PowerUnit = 'kW' | 'HP'
export type AltitudeUnit = 'm' | 'ft'
export type TempUnit = 'C' | 'F'
export type VolumeUnit = 'liters' | 'gallons'
export type StepStatus = 'pass' | 'warning' | 'fail'
export type AlertSeverity = 'info' | 'warning' | 'error'

// ── Input Entities ───────────────────────────────────────────────────

export interface LoadItem {
  id: string
  name: string
  type: LoadType
  ratedPower: number            // stored in kW internally
  powerInputUnit: PowerUnit     // display preference
  isKva: boolean                // if true, ratedPower is kVA not kW
  powerFactor: number           // 0.01–1.0
  quantity: number              // ≥1
  diversityFactor: number       // 0.01–1.0, default 1.0
  stepNumber: number | null     // null = unassigned
  // Motor-specific fields
  isMotor: boolean              // derived from type === 'motor'
  motorHp: number | null        // only for motors
  nemaCodeLetter: NemaCodeLetter | null  // for 60Hz motors
  iecLockedRotorRatio: number | null     // kVA/kW, for 50Hz motors
  startingMethod: StartingMethod         // default 'dol'
  vfdMultiplier: number | null           // 0.02–0.50, only for VFD
  softStarterMultiplier: number | null   // 0.30–0.70, only for soft-starter
}

export interface GeneratorConfig {
  dutyType: DutyType
  primeLoadingLimit: number     // 0.50–1.0, default 0.70
  voltage: number               // system voltage (V)
  phases: Phases
  frequency: Frequency
  subtransientReactance: number // 0.05–0.35, default 0.15 pu (Xd'')
  fuelType: FuelType
  necClassification: NecClassification | null
}

export interface SiteConditions {
  altitude: number              // stored in meters
  altitudeUnit: AltitudeUnit
  ambientTemperature: number    // stored in °C
  temperatureUnit: TempUnit
}

export interface FuelConfig {
  requiredRuntime: number       // hours
  averageLoadingPercent: number // 30–100
  volumeUnit: VolumeUnit
}

// ── Output Entities ──────────────────────────────────────────────────

export interface LoadBreakdownItem {
  loadId: string
  name: string
  type: LoadType
  ratedKw: number
  effectiveKw: number           // rated × qty × diversity
  kvar: number
  kva: number
  powerFactor: number
  quantity: number
  diversityFactor: number
}

export interface LoadSummaryResult {
  totalRunningKw: number
  totalRunningKvar: number
  totalRunningKva: number
  combinedPowerFactor: number
  loadingLimit: number          // 1.0 for standby, config value for prime
  requiredGeneratorKva: number  // totalKVA / loadingLimit
  perLoadBreakdown: LoadBreakdownItem[]
}

export interface MotorStartingResult {
  loadId: string
  motorName: string
  motorHp: number | null
  motorKw: number
  startingKva: number
  voltageDipPercent: number
  passesThreshold: boolean
  threshold: number
  startingMethod: StartingMethod
  startingMethodMultiplier: number
}

export interface StepResult {
  stepNumber: number
  loadIds: string[]
  loadNames: string[]
  incrementalKw: number
  incrementalKva: number
  motorStartingKvaInStep: number
  cumulativeKw: number
  cumulativeKva: number
  generatorLoadingPercent: number
  status: StepStatus
  statusReason: string
}

export interface FuelResult {
  fuelType: FuelType
  consumptionRate: number       // L/hr (or m³/hr for gas)
  consumptionRateImperial: number // gal/hr
  totalFuelRequired: number     // liters
  totalFuelRequiredImperial: number // gallons
  reserveVolume: number         // liters (10%)
  runtimeHours: number
  loadingPercent: number
  sfcUsed: number               // specific fuel consumption used
}

export interface DeratingResult {
  altitudeFactor: number
  temperatureFactor: number
  combinedFactor: number
  altitudeApplied: boolean
  temperatureApplied: boolean
}

export interface NecConstraintResult {
  classification: NecClassification
  startupTimeSeconds: number | null
  minFuelDurationHours: number | null
  description: string
}

export interface Alert {
  severity: AlertSeverity
  category: string              // 'voltage-dip' | 'overload' | 'derating' | 'fuel' | 'step-loading'
  message: string
  standardRef?: string          // e.g. 'NFPA 110 Section 4.2'
}

export interface SizingResult {
  // Load summary
  totalRunningKw: number
  totalRunningKvar: number
  totalRunningKva: number
  combinedPowerFactor: number
  perLoadBreakdown: LoadBreakdownItem[]
  // Derating
  deratingFactor: number
  altitudeDeratingFactor: number
  temperatureDeratingFactor: number
  // Generator selection
  requiredKvaBeforeDerating: number
  requiredKvaAfterDerating: number
  recommendedGeneratorKva: number
  loadingPercent: number
  // Motor starting
  motorStartingAnalysis: MotorStartingResult[]
  worstCaseVoltageDip: MotorStartingResult | null
  // Step loading
  stepLoadingSequence: StepResult[]
  // Fuel
  fuelConsumption: FuelResult | null
  // NEC
  necConstraints: NecConstraintResult | null
  // Alerts
  alerts: Alert[]
}

// ── Store Types ──────────────────────────────────────────────────────

export interface GeneratorSizingHistoryEntry {
  id: string
  timestamp: string
  label: string
  loads: LoadItem[]
  config: GeneratorConfig
  siteConditions: SiteConditions
  fuelConfig: FuelConfig | null
  result: SizingResult
}

export interface GeneratorSizingState {
  // Input state
  loads: LoadItem[]
  generatorConfig: GeneratorConfig
  siteConditions: SiteConditions
  fuelConfig: FuelConfig
  voltageDipThreshold: number   // default 15
  // Output state
  result: SizingResult | null
  // History
  history: GeneratorSizingHistoryEntry[]
}

export interface GeneratorSizingActions {
  // Load management
  addLoad: (load: LoadItem) => void
  updateLoad: (id: string, updates: Partial<LoadItem>) => void
  removeLoad: (id: string) => void
  clearLoads: () => void
  // Config
  setGeneratorConfig: (config: Partial<GeneratorConfig>) => void
  setSiteConditions: (conditions: Partial<SiteConditions>) => void
  setFuelConfig: (config: Partial<FuelConfig>) => void
  setVoltageDipThreshold: (threshold: number) => void
  // Results
  setResult: (result: SizingResult | null) => void
  // History
  saveToHistory: (label: string) => void
  loadFromHistory: (id: string) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  // Reset
  reset: () => void
}
