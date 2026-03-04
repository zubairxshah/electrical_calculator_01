/**
 * Type Definitions for Motor & HVAC Breaker Sizing Calculator
 *
 * Covers motor protection (NEC 430.52), HVAC/Compressor (NEC 440),
 * DC systems, and IEC utilization categories (AC-1..AC-4, DC-1..DC-5).
 *
 * @module motor-breaker-calculator
 */

import type {
  ISO8601,
  InstallationMethod,
  TripCurveType,
  NECTripType,
  CalculationAlert,
  DeratingFactorsResult,
  BreakerSpecification,
} from './breaker-calculator';

// Re-export for convenience
export type { ISO8601, InstallationMethod, TripCurveType, NECTripType, CalculationAlert, DeratingFactorsResult, BreakerSpecification };

// ============================================================================
// ENUMS & UNIONS
// ============================================================================

/** Load type for motor breaker sizing */
export type MotorBreakerLoadType = 'general' | 'motor' | 'hvac';

/** System type (DC or AC single/three-phase) */
export type SystemType = 'dc' | 'single-phase-ac' | 'three-phase-ac';

/** NEC 430.52 protection device types */
export type NECMotorProtectionDevice =
  | 'thermal-magnetic'
  | 'magnetic-only'
  | 'dual-element-fuse'
  | 'instantaneous-trip';

/** IEC utilization category */
export type IECUtilizationCategory =
  | 'AC-1' | 'AC-2' | 'AC-3' | 'AC-4'
  | 'DC-1' | 'DC-2' | 'DC-3' | 'DC-4' | 'DC-5';

/** Power unit selection */
export type PowerUnit = 'kw' | 'hp';

/** Input mode */
export type MotorBreakerInputMode = 'power' | 'fla';

// ============================================================================
// IEC UTILIZATION CATEGORY DATA
// ============================================================================

export interface IECUtilizationCategoryData {
  category: IECUtilizationCategory;
  description: string;
  multiplier: number;
  recommendedTripCurve: TripCurveType;
  systemType: 'ac' | 'dc';
  applications: string[];
  notes: string;
}

// ============================================================================
// NEC 430.52 MOTOR SIZING DATA
// ============================================================================

export interface NECMotorProtectionData {
  device: NECMotorProtectionDevice;
  displayName: string;
  multiplier: number;
  codeReference: string;
  notes: string;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

/** Core input configuration */
export interface MotorBreakerInput {
  standard: 'NEC' | 'IEC';
  systemType: SystemType;
  loadType: MotorBreakerLoadType;

  // Electrical parameters (for general & motor)
  voltage?: number;
  inputMode?: MotorBreakerInputMode;
  powerValue?: number;
  powerUnit?: PowerUnit;
  fla?: number;
  powerFactor?: number;

  // Motor-specific (NEC)
  protectionDevice?: NECMotorProtectionDevice;

  // Motor-specific (IEC)
  utilizationCategory?: IECUtilizationCategory;

  // HVAC-specific (NEC 440)
  mca?: number;  // Minimum Circuit Ampacity
  mop?: number;  // Maximum Overcurrent Protection

  // Environmental
  ambientTemperature?: number;
  groupedCables?: number;
  installationMethod?: InstallationMethod;
}

/** Environmental conditions for derating */
export interface MotorBreakerEnvironment {
  ambientTemperature?: number;
  groupedCables?: number;
  installationMethod?: InstallationMethod;
}

// ============================================================================
// OUTPUT INTERFACES
// ============================================================================

/** Load analysis section */
export interface MotorBreakerLoadAnalysis {
  inputPowerKW?: number;
  inputPowerHP?: number;
  inputFLA?: number;
  calculatedFLA: number;
  formula: string;
  components: {
    voltage?: number;
    systemType: string;
    power?: number;
    powerUnit?: string;
    powerFactor?: number;
  };
}

/** Protection sizing section */
export interface MotorBreakerProtectionSizing {
  fla: number;
  multiplier: number;
  multiplierSource: string;
  minimumAmps: number;
  codeReference: string;
  notes: string;
}

/** Breaker recommendation section */
export interface MotorBreakerRecommendation {
  recommendedBreakerAmps: number;
  standard: 'NEC' | 'IEC';
  tripCurve?: TripCurveType;
  tripType?: NECTripType;
  rationale: string;
  breakerSpec: BreakerSpecification;
}

/** Motor-specific details */
export interface MotorDetails {
  protectionDevice?: NECMotorProtectionDevice;
  protectionDeviceName?: string;
  multiplier: number;
  codeReference: string;
}

/** HVAC-specific details */
export interface HVACDetails {
  mca: number;
  mop: number;
  wireSizingBasis: string;
  breakerSizingBasis: string;
  codeReference: string;
}

/** IEC category details */
export interface IECCategoryDetails {
  category: IECUtilizationCategory;
  description: string;
  multiplier: number;
  recommendedTripCurve: TripCurveType;
  applications: string[];
}

/** Complete calculation results */
export interface MotorBreakerCalculationResults {
  loadAnalysis: MotorBreakerLoadAnalysis;
  protectionSizing: MotorBreakerProtectionSizing;
  recommendation: MotorBreakerRecommendation;
  motorDetails?: MotorDetails;
  hvacDetails?: HVACDetails;
  iecCategoryDetails?: IECCategoryDetails;
  deratingFactors?: DeratingFactorsResult;
  alerts: CalculationAlert[];
  calculatedAt: ISO8601;
  calculationVersion: string;
}

// ============================================================================
// HISTORY
// ============================================================================

export interface MotorBreakerHistoryEntry {
  id: string;
  timestamp: ISO8601;
  input: MotorBreakerInput;
  environment?: MotorBreakerEnvironment;
  results: MotorBreakerCalculationResults;
  project?: MotorBreakerProjectInfo;
  sortOrder: number;
}

export interface MotorBreakerProjectInfo {
  projectName?: string;
  projectLocation?: string;
  engineerName?: string;
}

// ============================================================================
// STORE
// ============================================================================

export interface MotorBreakerState {
  // Core
  standard: 'NEC' | 'IEC';
  systemType: SystemType;
  loadType: MotorBreakerLoadType;

  // Electrical
  voltage: number;
  inputMode: MotorBreakerInputMode;
  powerValue: number;
  powerUnit: PowerUnit;
  fla: number;
  powerFactor: number;

  // Motor NEC
  protectionDevice: NECMotorProtectionDevice;

  // Motor IEC
  utilizationCategory: IECUtilizationCategory;

  // HVAC
  mca: number;
  mop: number;

  // Environmental
  ambientTemperature?: number;
  groupedCables?: number;
  installationMethod?: InstallationMethod;

  // Project
  projectName?: string;
  projectLocation?: string;
  engineerName?: string;

  // Results
  results?: MotorBreakerCalculationResults;

  // UI
  showHistorySidebar: boolean;
  showEnvironmental: boolean;
}

export interface MotorBreakerActions {
  setStandard: (standard: 'NEC' | 'IEC') => void;
  setSystemType: (systemType: SystemType) => void;
  setLoadType: (loadType: MotorBreakerLoadType) => void;
  setVoltage: (voltage: number) => void;
  setInputMode: (mode: MotorBreakerInputMode) => void;
  setPowerValue: (value: number) => void;
  setPowerUnit: (unit: PowerUnit) => void;
  setFLA: (fla: number) => void;
  setPowerFactor: (pf: number) => void;
  setProtectionDevice: (device: NECMotorProtectionDevice) => void;
  setUtilizationCategory: (category: IECUtilizationCategory) => void;
  setMCA: (mca: number) => void;
  setMOP: (mop: number) => void;
  setAmbientTemperature: (temp: number | undefined) => void;
  setGroupedCables: (count: number | undefined) => void;
  setInstallationMethod: (method: InstallationMethod | undefined) => void;
  setProjectInformation: (info: Partial<MotorBreakerProjectInfo>) => void;
  toggleHistorySidebar: () => void;
  toggleEnvironmental: () => void;
  saveToHistory: () => Promise<void>;
  loadFromHistory: (id: string) => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  getHistory: () => MotorBreakerHistoryEntry[];
  reset: () => void;
}

export type MotorBreakerStore = MotorBreakerState & MotorBreakerActions;
