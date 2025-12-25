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
 * Battery chemistry types (IEEE 485-2020, IEC 61056)
 */
export type BatteryChemistry =
  | 'VRLA-AGM' // Valve-Regulated Lead-Acid Absorbed Glass Mat
  | 'VRLA-Gel' // Valve-Regulated Lead-Acid Gel
  | 'FLA' // Flooded Lead-Acid
  | 'LiFePO4' // Lithium Iron Phosphate
  | 'Li-ion' // Lithium-Ion (NMC/NCA)
  | 'NiCd' // Nickel-Cadmium

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
  /** Battery amp-hour capacity at C/20 rate (1-10000 Ah) */
  ampHours: number
  /** Total load in watts (1-1000000W) */
  loadWatts: number
  /** Inverter/system efficiency (0.1-1.0, typically 0.85-0.95) */
  efficiency: number
  /** Battery aging factor (0.5-1.0, typically 0.8 for end-of-life) */
  agingFactor: number
  /** Battery chemistry type */
  chemistry: BatteryChemistry
  /** Ambient temperature (°C, -20 to 60) */
  temperature?: number
  /** Minimum voltage cutoff (V, typically 0.85 * nominal for lead-acid) */
  minVoltage?: number
  /** Index signature for compatibility */
  [key: string]: unknown
}

/**
 * US1: Battery Backup Calculator - Results
 */
export interface BatteryCalculatorResult extends CalculationResult {
  type: 'battery'
  inputs: BatteryCalculatorInputs
  /** Total backup time in hours (BigNumber for precision) */
  backupTimeHours: math.BigNumber
  /** Effective capacity after efficiency and aging (Ah) */
  effectiveCapacityAh: math.BigNumber
  /** Discharge rate (C-rate, e.g., C/5 = 0.2) */
  dischargeRate: math.BigNumber
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
