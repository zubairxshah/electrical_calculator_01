/**
 * TypeScript type definitions for electrical engineering calculations
 *
 * Covers all 6 user stories:
 * - US1: Battery Backup Calculator (P1)
 * - US2: UPS Sizing Tool (P1)
 * - US3: Cable Sizing with Voltage Drop (P1)
 * - US4: Solar Panel Array Sizer (P2)
 * - US5: Charge Controller Selector (P2)
 * - US6: Battery Type Comparison (P3)
 *
 * @see specs/001-electromate-engineering-app/spec.md
 * @see specs/001-electromate-engineering-app/data-model.md
 */

import { math } from '../mathConfig'

/**
 * Calculation types supported by the platform
 */
export type CalculationType = 'battery' | 'ups' | 'cable' | 'solar' | 'charge-controller' | 'battery-comparison'

/**
 * Standards frameworks for dual standards support (Constitution Principle IV)
 */
export type StandardsFramework = 'IEC' | 'NEC'

/**
 * Voltage system classifications (IEC 60038, NEC Article 100)
 */
export type VoltageSystem = 'LV-AC' | 'LV-DC' | 'MV-AC' | 'MV-DC' | 'HV'

/**
 * Battery chemistry types (IEEE 485-2020, IEC 60896/62619).
 *
 * Single source of truth: re-exported from lib/standards/batteryTypes.ts
 * (canonical 9-value union incl. the new FLA profile). Legacy IDs
 * (VRLA-Gel/LiFePO4/Li-ion) are mapped to canonical via
 * lib/standards/batteryChemistryMap.ts. See ADR-006.
 */
export type { BatteryChemistry } from '../standards/batteryTypes'
import type { BatteryChemistry } from '../standards/batteryTypes'

/**
 * UPS topology types (IEEE 1100-2020)
 */
export type UPSTopology =
  | 'line-interactive' // Most common for <10kVA
  | 'double-conversion' // True online UPS for critical loads
  | 'standby' // Offline UPS for non-critical loads

/**
 * Cable conductor materials (IEC 60228, NEC Table 8)
 */
export type ConductorMaterial = 'copper' | 'aluminum'

/**
 * Cable installation methods (IEC 60364-5-52, NEC Chapter 3)
 */
export type InstallationMethod =
  | 'conduit-single' // Single cable in conduit
  | 'conduit-multiple' // Multiple cables in conduit (derating required)
  | 'tray' // Cable tray
  | 'direct-buried' // Direct buried underground
  | 'free-air' // Free air installation

/**
 * Circuit types for voltage drop calculations (NEC 210.19(A), IEC 60364-5-52)
 */
export type CircuitType = 'branch' | 'feeder' | 'service'

/**
 * Solar panel types (IEC 61215, IEC 61646)
 */
export type SolarPanelType = 'monocrystalline' | 'polycrystalline' | 'thin-film' | 'bifacial'

/**
 * Charge controller types (IEC 62109)
 */
export type ChargeControllerType = 'PWM' | 'MPPT'

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Base calculation result interface
 */
export interface CalculationResult {
  /** Calculation type identifier */
  type: CalculationType
  /** Calculation timestamp (ISO 8601) */
  timestamp: string
  /** Standards framework used */
  standards: StandardsFramework
  /** Input values used for calculation */
  inputs: Record<string, unknown>
  /** Validation warnings/errors */
  validations: ValidationResult[]
}

/**
 * Validation result for dangerous conditions (Constitution Principle II)
 */
export interface ValidationResult {
  /** Severity level */
  severity: ValidationSeverity
  /** Affected field (dot notation: "inputs.voltage") */
  field: string
  /** Human-readable message */
  message: string
  /** Standard reference (e.g., "NEC 210.19(A)(1)") */
  standardReference?: string
  /** Recommended action */
  recommendation?: string
}

/**
 * US1: Battery Backup Calculator - Inputs (IEEE 485-2020)
 */
export interface BatteryCalculatorInputs {
  /** System voltage (1-2000V DC) */
  voltage: number
  /** Calculation direction: forward runtime estimate or reverse capacity sizing */
  mode: BatteryCalcMode
  /** Battery amp-hour capacity at C/20 rate (1-10000 Ah). Required when mode='runtime'. */
  ampHours?: number
  /** Target backup time in hours (>0). Required when mode='sizing'. */
  targetBackupHours?: number
  /** Total load in watts (1-1000000W) */
  loadWatts: number
  /** System/round-trip efficiency (0.1-1.0). Optional override; default = chemistry round-trip typical. */
  efficiency?: number
  /** Battery aging factor (0.5-1.0). Optional; default 0.8 (end-of-life design basis). */
  agingFactor?: number
  /** Battery chemistry type (canonical) */
  chemistry: BatteryChemistry
  /** Ambient/operating temperature (°C). Default 25. */
  temperature?: number
  /** Depth-of-discharge override (fraction 0-1). Default = chemistry recommended; clamped to max. */
  dodOverride?: number
  /** Nominal per-cell/block voltage for series count (V). Default by chemistry. */
  cellBlockVoltage?: number
  /** Capacity of one battery unit/string (Ah) for parallel-string sizing. Default 100. */
  unitCapacityAh?: number
  /** Selected manufacturer datasheet id (or null). */
  datasheetId?: string | null
  /** Minimum voltage cutoff (V, typically 0.85 * nominal for lead-acid) */
  minVoltage?: number
  /** Index signature for compatibility */
  [key: string]: unknown
}

/** Battery calculation direction */
export type BatteryCalcMode = 'runtime' | 'sizing'

/** Provenance of an applied derating factor */
export type FactorSource = 'default' | 'user' | 'datasheet'

/** A single applied derating factor with its value, source, and citation */
export interface FactorValue {
  /** Numeric factor value (fraction or multiplier) */
  value: number
  /** Where the value came from */
  source: FactorSource
  /** Standard reference, if any */
  standardReference?: string
}

/** The full set of derating factors applied to a sizing/runtime result */
export interface AppliedFactors {
  dod: FactorValue
  temperature: FactorValue
  aging: FactorValue
  efficiency: FactorValue
  peukert: FactorValue
}

/** Recommended physical battery bank configuration */
export interface BankConfig {
  /** Cells/blocks in series to meet system voltage */
  cellsInSeries: number
  /** Parallel strings to meet required capacity */
  stringsInParallel: number
  /** Nominal bank voltage (V) */
  nominalBankVoltage: number
  /** Nameplate bank capacity (Ah) */
  nameplateBankAh: number
  /** Usable/delivered capacity after factors (Ah) */
  deliveredCapacityAh: number
  /** Over-capacity from rounding up to whole strings (%) */
  overCapacityPct: number
}

/** Sizing verdict */
export type SizingVerdict = 'pass' | 'marginal' | 'fail'

/**
 * US1: Battery Backup Calculator - Results
 */
export interface BatteryCalculatorResult extends CalculationResult {
  type: 'battery'
  inputs: BatteryCalculatorInputs
  /** Calculation direction this result was produced in */
  mode: BatteryCalcMode
  /** Total backup time in hours (headline when mode='runtime') */
  backupTimeHours: math.BigNumber
  /** Required nameplate capacity in Ah (headline when mode='sizing') */
  requiredCapacityAh?: math.BigNumber
  /** Effective/usable capacity after all factors (Ah) */
  effectiveCapacityAh: math.BigNumber
  /** Discharge rate (C-rate as fraction, e.g., C/5 = 0.2) */
  dischargeRate: math.BigNumber
  /** All derating factors applied, with source + citation */
  appliedFactors: AppliedFactors
  /** Recommended physical bank configuration */
  bankConfig: BankConfig
  /** Plain-language pass/marginal/fail verdict */
  verdict: SizingVerdict
  /** Actionable recommendations */
  recommendations: string[]
  /** Standards actually applied for this result */
  standardsApplied: string[]
  /** Discharge curve data points for Recharts */
  dischargeCurve: DischargeCurvePoint[]
  /** Warnings for dangerous conditions */
  warnings: BatteryWarning[]
}

/**
 * Battery discharge curve data point (for Recharts visualization)
 */
export interface DischargeCurvePoint {
  /** Time in hours from start of discharge */
  timeHours: number
  /** Voltage at this time point (V) */
  voltage: number
  /** State of charge percentage (0-100) */
  socPercent: number
  /** Remaining capacity (Ah) */
  remainingAh: number
}

/**
 * Battery-specific warning types
 */
export type BatteryWarningType =
  | 'high-discharge-rate' // >C/5 may reduce capacity (IEEE 485 Section 5.3)
  | 'low-temperature' // <10°C reduces capacity
  | 'high-temperature' // >40°C reduces lifespan
  | 'end-of-life' // agingFactor <0.8
  | 'deep-discharge' // minVoltage too low for chemistry
  | 'overload' // load exceeds battery C-rating
  | 'unrealistic-efficiency' // efficiency <0.7 or >0.98
  | 'over-c-rate' // discharge above chemistry safe continuous rate
  | 'temperature-out-of-range' // outside chemistry operating range
  | 'dod-exceeds-max' // DoD override above chemistry maximum
  | 'datasheet-chemistry-mismatch' // selected datasheet conflicts with chemistry

export interface BatteryWarning extends ValidationResult {
  type: BatteryWarningType
}

/**
 * US2: UPS Sizing Tool - Inputs (IEEE 1100-2020)
 */
export interface UPSCalculatorInputs {
  /** Total connected load (W) */
  totalLoadWatts: number
  /** Desired backup time (minutes) */
  backupTimeMinutes: number
  /** UPS topology type */
  topology: UPSTopology
  /** Power factor of load (0.6-1.0, typically 0.8 for mixed loads) */
  powerFactor: number
  /** Anticipated load growth factor (1.0-2.0) */
  growthFactor?: number
  /** Diversity factor for multiple loads (0.5-1.0) - auto-calculated if not provided */
  diversityFactor?: number
  /** Input voltage (VAC) */
  inputVoltage: number
  /** Battery voltage (VDC) */
  batteryVoltage: number
  /** Index signature for compatibility */
  [key: string]: unknown
}

/**
 * US2: UPS Sizing Tool - Results
 */
export interface UPSCalculatorResult extends CalculationResult {
  type: 'ups'
  inputs: UPSCalculatorInputs
  /** Recommended UPS VA rating */
  recommendedVA: math.BigNumber
  /** Recommended UPS watt rating */
  recommendedWatts: math.BigNumber
  /** Required battery capacity (Ah) */
  requiredBatteryAh: math.BigNumber
  /** Applied diversity factor (auto-calculated per IEEE 1100 Table 8-2) */
  appliedDiversityFactor: number
  /** Efficiency at specified load percentage */
  efficiency: number
  /** Warnings */
  warnings: ValidationResult[]
}

/**
 * US3: Cable Sizing - Inputs (NEC Chapter 3, IEC 60364-5-52)
 */
export interface CableSizingInputs {
  /** Load current (A) */
  current: number
  /** One-way cable length (m or ft depending on standards) */
  length: number
  /** System voltage (V) */
  voltage: number
  /** Conductor material */
  material: ConductorMaterial
  /** Installation method */
  installationMethod: InstallationMethod
  /** Circuit type */
  circuitType: CircuitType
  /** Ambient temperature (°C) */
  ambientTemperature: number
  /** Number of current-carrying conductors (for derating) */
  conductorCount: number
  /** Power factor (0.6-1.0, 1.0 for DC) */
  powerFactor: number
  /** Maximum allowed voltage drop percentage (typically 3% for branch, 5% total) */
  maxVoltageDrop: number
  /** Index signature for compatibility */
  [key: string]: unknown
}

/**
 * US3: Cable Sizing - Results
 */
export interface CableSizingResult extends CalculationResult {
  type: 'cable'
  inputs: CableSizingInputs
  /** Recommended conductor size (AWG or mm² depending on standards) */
  conductorSize: string
  /** Actual voltage drop (V) */
  voltageDrop: math.BigNumber
  /** Voltage drop percentage */
  voltageDropPercent: math.BigNumber
  /** Temperature derating factor */
  temperatureDeratingFactor: number
  /** Conduit fill derating factor */
  conduitFillDeratingFactor: number
  /** Cable ampacity after derating (A) */
  deratedAmpacity: math.BigNumber
  /** Safety margin percentage */
  safetyMargin: math.BigNumber
  /** Standard reference table used */
  standardTable: string
  /** Warnings for NEC/IEC violations */
  warnings: ValidationResult[]
}

/**
 * US4: Solar Panel Array - Inputs (IEC 61215)
 */
export interface SolarArrayInputs {
  /** Daily energy requirement (kWh) */
  dailyEnergyKWh: number
  /** Average peak sun hours per day at location */
  peakSunHours: number
  /** System voltage (V DC) */
  systemVoltage: number
  /** Panel type */
  panelType: SolarPanelType
  /** Individual panel wattage (W) */
  panelWattage: number
  /** Panel voltage at maximum power point (Vmp) */
  panelVmp: number
  /** Panel current at maximum power point (Imp) */
  panelImp: number
  /** System efficiency losses (0.6-0.9, typically 0.75-0.8) */
  systemEfficiency: number
  /** Desired days of autonomy (battery backup days) */
  daysOfAutonomy?: number
  /** Index signature for compatibility */
  [key: string]: unknown
}

/**
 * US4: Solar Panel Array - Results
 */
export interface SolarArrayResult extends CalculationResult {
  type: 'solar'
  inputs: SolarArrayInputs
  /** Total required array wattage */
  requiredArrayWatts: math.BigNumber
  /** Number of panels in series */
  panelsInSeries: number
  /** Number of parallel strings */
  parallelStrings: number
  /** Total panel count */
  totalPanels: number
  /** Total array voltage (V) */
  arrayVoltage: math.BigNumber
  /** Total array current (A) */
  arrayCurrent: math.BigNumber
  /** Required battery bank capacity (Ah) */
  batteryBankAh?: math.BigNumber
  /** Warnings */
  warnings: ValidationResult[]
}

/**
 * US5: Charge Controller - Inputs (IEC 62109)
 */
export interface ChargeControllerInputs {
  /** Solar array maximum power (W) */
  arrayMaxPower: number
  /** Solar array open-circuit voltage (Voc) */
  arrayVoc: number
  /** Solar array short-circuit current (Isc) */
  arrayIsc: number
  /** Battery bank voltage (V) */
  batteryVoltage: number
  /** Controller type */
  controllerType: ChargeControllerType
  /** Temperature compensation factor (V/°C per cell) */
  temperatureCompensation?: number
  /** Index signature for compatibility */
  [key: string]: unknown
}

/**
 * US5: Charge Controller - Results
 */
export interface ChargeControllerResult extends CalculationResult {
  type: 'charge-controller'
  inputs: ChargeControllerInputs
  /** Recommended controller current rating (A) */
  recommendedCurrentRating: math.BigNumber
  /** Recommended controller voltage rating (V) */
  recommendedVoltageRating: math.BigNumber
  /** MPPT efficiency gain over PWM (percentage, only for MPPT) */
  mpptEfficiencyGain?: number
  /** Warnings */
  warnings: ValidationResult[]
}

/**
 * US6: Battery Type Comparison - Inputs
 */
export interface BatteryComparisonInputs {
  /** System voltage (V) */
  voltage: number
  /** Required capacity (Ah) */
  requiredCapacityAh: number
  /** Expected daily cycles */
  dailyCycles: number
  /** Expected lifespan (years) */
  expectedLifespanYears: number
  /** Ambient temperature range (°C) */
  temperatureRange: { min: number; max: number }
  /** Battery chemistries to compare */
  chemistriesToCompare: BatteryChemistry[]
  /** Index signature for compatibility */
  [key: string]: unknown
}

/**
 * US6: Battery Type Comparison - Results
 */
export interface BatteryComparisonResult extends CalculationResult {
  type: 'battery-comparison'
  inputs: BatteryComparisonInputs
  /** Comparison matrix for each chemistry */
  comparisons: BatteryTypeComparison[]
  /** Recommended chemistry based on use case */
  recommendation: BatteryChemistry
  /** Recommendation rationale */
  recommendationReason: string
}

/**
 * Individual battery chemistry comparison
 */
export interface BatteryTypeComparison {
  /** Battery chemistry */
  chemistry: BatteryChemistry
  /** Initial cost estimate (USD) */
  initialCost: number
  /** Estimated cycle life at specified depth of discharge */
  cycleLife: number
  /** Total lifecycle cost (USD) */
  lifecycleCost: number
  /** Energy density (Wh/kg) */
  energyDensity: number
  /** Temperature tolerance rating (0-10) */
  temperatureTolerance: number
  /** Maintenance requirement level (0-10, 0=none, 10=high) */
  maintenanceLevel: number
  /** Advantages */
  advantages: string[]
  /** Disadvantages */
  disadvantages: string[]
  /** Recommended use cases */
  useCases: string[]
}

/**
 * Calculation session for database storage (data-model.md)
 */
export interface CalculationSession {
  /** UUID */
  id: string
  /** User ID (null for anonymous) */
  userId: string | null
  /** Calculation type */
  calculationType: CalculationType
  /** Standards framework used */
  standards: StandardsFramework
  /** Raw input data (JSON) */
  inputs: Record<string, unknown>
  /** Raw result data (JSON) */
  results: Record<string, unknown>
  /** Validation warnings */
  warnings: ValidationResult[]
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}
