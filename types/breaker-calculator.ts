/**
 * Type Definitions for Circuit Breaker Sizing Calculator
 *
 * Comprehensive TypeScript interfaces for all data structures used in breaker sizing calculations.
 * Ensures type safety and consistency across the application.
 *
 * Based on: specs/003-circuit-breaker-sizing/data-model.md
 *
 * @module breaker-calculator
 */

/**
 * ISO8601 timestamp string type
 */
export type ISO8601 = string;

/**
 * Installation Method Type (IEC 60364-5-52)
 */
export type InstallationMethod =
  | 'A1'  // Single cable in free air
  | 'A2'  // Single cable on wall/support
  | 'B1'  // Multi-cable in conduit in free air
  | 'B2'  // Multi-cable in conduit on wall
  | 'C'   // Multi-cable in conduit in ground
  | 'D'   // Multi-cable in cable tray
  | 'E'   // Multi-cable in earthed metallic conduit
  | 'F'   // Multi-cable in non-earthed metallic conduit
  | 'G';  // Multi-cable in open trays

/**
 * Load Type Classification
 */
export type LoadType = 'resistive' | 'inductive' | 'mixed' | 'capacitive';

/**
 * IEC Trip Curve Types
 */
export type TripCurveType = 'B' | 'C' | 'D' | 'K' | 'Z';

/**
 * NEC Trip Mechanism Types
 */
export type NECTripType = 'thermal-magnetic' | 'electronic' | 'adjustable-magnetic';

// ============================================================================
// INPUT INTERFACES
// ============================================================================

/**
 * Circuit Configuration (User Inputs)
 *
 * Represents the electrical circuit being designed
 */
export interface CircuitConfiguration {
  // Standard Selection
  standard: 'NEC' | 'IEC';

  // Electrical Parameters
  voltage: number;              // Volts (100-1000V range)
  phase: 'single' | 'three';    // Single-phase or three-phase

  // Load Definition
  loadMode: 'kw' | 'amps';      // Input mode (power or current)
  loadValue: number;            // kW or A depending on loadMode

  // Power Factor (optional, defaults to 0.8)
  powerFactor: number;          // 0.5-1.0 range

  // Unit System
  unitSystem: 'metric' | 'imperial';
}

/**
 * Environmental Conditions (Optional Inputs)
 *
 * Factors affecting breaker and cable sizing
 */
export interface EnvironmentalConditions {
  // Temperature Derating
  ambientTemperature?: number;  // °C (-40 to +70°C range)

  // Cable Grouping
  groupedCables?: number;       // Number of cables in same conduit (1-20+)

  // Installation Method (IEC only)
  installationMethod?: InstallationMethod;

  // Voltage Drop Analysis
  circuitDistance?: number;     // Meters or feet (depending on unitSystem)
  conductorMaterial?: 'copper' | 'aluminum';  // Default: copper
  conductorSize?: {
    value: number;
    unit: 'AWG' | 'kcmil' | 'mm²';
  };
}

// ============================================================================
// OUTPUT INTERFACES
// ============================================================================

/**
 * Load Analysis Section
 *
 * Results of load current calculation
 */
export interface LoadAnalysis {
  inputPower?: number;          // kW (if input as power)
  inputCurrent?: number;        // A (if input as current)

  calculatedCurrentAmps: number; // Calculated load current (A)

  // Formulas used (for display/documentation)
  formula: string;              // e.g., "I = P / (V × PF)"
  components: {
    voltage: number;
    phase: string;
    power?: number;
    powerFactor?: number;
  };

  continuousLoadFactor: number; // NEC: 1.25; IEC: 1.0
}

/**
 * Breaker Sizing Result
 *
 * Calculated breaker requirements and recommendations
 */
export interface BreakerSizingResult {
  minimumBreakerSizeAmps: number;  // Calculated minimum (may not be standard)

  // Applied factor
  safetyFactor: number;            // 1.25 (NEC) or 1.0 (IEC)
  safetyFactorType: 'continuous-load' | 'correction-factor';

  // Standard recommendation
  recommendedBreakerAmps: number;  // Next standard rating ≥ minimum
  recommendedStandard: 'NEC' | 'IEC';

  // Candidate options (if multiple available)
  candidateBreakers: BreakerSpecification[];
}

/**
 * Breaker Specification
 *
 * Complete specification of a recommended circuit breaker
 */
export interface BreakerSpecification {
  // Rating
  ratingAmps: number;           // Standard breaker rating (15-4000A)

  // Breaking Capacity
  breakingCapacityKA: number;   // kA rating (e.g., 10, 25, 50)

  // Trip Curve (IEC) or Trip Type (NEC)
  tripCurve?: TripCurveType;    // IEC trip curves
  tripType?: NECTripType;       // NEC types

  // Load Characteristics
  loadType: LoadType;

  // Compliance References
  standard: 'NEC' | 'IEC';
  codeSection: string;          // e.g., "NEC 210.20(A)" or "IEC 60364-5-52"

  // Compatibility Flags
  isSafe: boolean;              // True if breaker is safe for application
  warnings: BreakerWarning[];   // Any warnings about this breaker
}

/**
 * Breaker Warning Message
 */
export interface BreakerWarning {
  level: 'info' | 'warning' | 'error';
  code: string;                 // e.g., 'SHORT_CIRCUIT_CAPACITY_LOW'
  message: string;              // User-friendly message
  codeReference?: string;       // Applicable code section
  recommendation?: string;      // Suggested action
}

/**
 * Derating Factors Result
 *
 * Environmental derating factors applied to calculation
 */
export interface DeratingFactorsResult {
  applied: boolean;

  // Individual factors
  temperatureFactor?: {
    label: string;              // "Ca (Temperature)"
    ambient?: number;           // °C
    factor: number;
    codeReference?: string;     // "NEC Table 310.15(B)(2)(a)"
  };

  groupingFactor?: {
    label: string;              // "Cg (Grouping)"
    cableCount?: number;
    factor: number;
    codeReference?: string;     // "NEC Table 310.15(C)(1)"
  };

  installationMethodFactor?: {
    label: string;              // "Cc (Installation Method)"
    method?: InstallationMethod;
    factor: number;
    codeReference?: string;     // "IEC 60364-5-52 Table B.52.5"
  };

  // Combined effect
  combinedFactor: number;       // Product of all factors
  adjustedBreakerSizeAmps: number;  // After derating applied
}

/**
 * Voltage Drop Analysis
 *
 * Results of voltage drop calculation and compliance assessment
 */
export interface VoltageDropAnalysis {
  performed: boolean;

  // Circuit parameters
  loadCurrentAmps: number;
  circuitDistance: number;      // m or ft
  conductorSize?: string;       // e.g., "#6 AWG" or "10mm²"
  conductorResistance?: number; // Ω per 1000 ft or Ω per km

  // Calculation result
  voltageDrop: number;          // Volts
  voltageDropPercent: number;   // VD%
  voltageAtLoad?: number;       // Voltage at load end (enhanced)
  powerLossWatts?: number;      // Power loss due to voltage drop (enhanced)

  // NEC limits
  limitBranchCircuit: number;   // 3%
  limitCombined: number;        // 5%

  // Assessment
  status: 'excellent' | 'good' | 'acceptable' | 'warning' | 'exceed-limit';
  assessment: string;           // e.g., "Exceeds NEC 3% limit for branch circuit"

  // Recommendation
  recommendedCableSize?: string; // Next larger size if limit exceeded
  recommendedVDPercent?: number; // VD% with larger cable

  // Enhanced properties
  costImpact?: 'low' | 'medium' | 'high' | 'none';  // Cost impact of upsizing
  installationDifficulty?: 'easy' | 'moderate' | 'difficult' | 'none';  // Installation difficulty
  recommendedAction?: string;  // Recommended action based on compliance
}

/**
 * Short Circuit Analysis
 *
 * Breaking capacity adequacy assessment
 */
export interface ShortCircuitAnalysis {
  performed: boolean;

  // User-specified fault current
  faultCurrentKA: number;       // kA

  // Breaker suitability
  breakerBreakingCapacityKA: number;
  isSuitableCapacity: boolean;  // True if ≥ fault current

  // Assessment
  assessment: string;           // "Breaker breaking capacity adequate" or warning
  warning?: string;             // If breaking capacity insufficient
}

/**
 * Recommendations (Guidance for Engineer)
 *
 * Professional recommendations and guidance
 */
export interface Recommendations {
  primaryBreaker: BreakerSpecification;

  alternativeBreakers?: BreakerSpecification[];  // Other options

  breakerTypeGuidance: {
    recommendedType: string;    // e.g., "Type C (IEC)" or "Thermal-Magnetic (NEC)"
    rationale: string;          // Why this type suitable
    inrushCapability: string;   // e.g., "5-10× rated current"
  };

  cableGuidance?: {
    minimumSize: string;        // e.g., "#6 AWG" or "10mm²"
    recommendedSize?: string;   // If voltage drop warrants upgrade
    rationale?: string;
  };

  generalNotes: string[];       // Additional engineering notes
}

/**
 * Calculation Alert (Warning/Error)
 */
export interface CalculationAlert {
  type: 'error' | 'warning' | 'info';
  code: string;                 // Machine-readable code
  message: string;              // User-friendly message
  field?: string;               // Which field triggered this
  codeReference?: string;       // e.g., "NEC 210.19(A)"
  severity: 'critical' | 'major' | 'minor';
}

/**
 * Complete Calculation Results
 *
 * Comprehensive output containing all calculated values and assessments
 */
export interface CalculationResults {
  // Load Analysis
  loadAnalysis: LoadAnalysis;

  // Breaker Sizing
  breakerSizing: BreakerSizingResult;

  // Derating Factors (if applied)
  deratingFactors?: DeratingFactorsResult;

  // Voltage Drop Analysis (if performed)
  voltageDropAnalysis?: VoltageDropAnalysis;

  // Short Circuit Capacity (if specified)
  shortCircuitAnalysis?: ShortCircuitAnalysis;

  // Recommendations
  recommendations: Recommendations;

  // Metadata
  calculatedAt: ISO8601;        // When this was calculated
  calculationVersion: string;   // e.g., "1.0.0"

  // Warnings and Alerts
  alerts: CalculationAlert[];   // All warnings/errors during calculation
}

// ============================================================================
// PROJECT METADATA
// ============================================================================

/**
 * Project Information (Optional)
 *
 * Metadata for documentation and PDF export
 */
export interface ProjectInformation {
  projectName?: string;         // e.g., "High-Rise Building A - Riser 3"
  projectLocation?: string;     // e.g., "New York, NY"

  engineerName?: string;        // Professional engineer
  engineerCompany?: string;     // Company/firm name

  approvalDate?: ISO8601;       // When approved
  expirationDate?: ISO8601;     // Any review expiration

  notes?: string;               // Additional documentation notes

  // Standards context
  jurisdictionalCode?: string;  // e.g., "NEC 2023", "IEC 60364:2016"
}

// ============================================================================
// HISTORY AND PERSISTENCE
// ============================================================================

/**
 * Calculation History Entry
 *
 * Complete record of a calculation stored in localStorage
 */
export interface CalculationHistoryEntry {
  // Unique Identification
  id: string;                   // UUID
  timestamp: ISO8601;           // When calculated

  // Circuit Configuration
  circuit: CircuitConfiguration;

  // Environmental Conditions
  environment?: EnvironmentalConditions;

  // Optional: Short Circuit Current
  shortCircuitCurrentKA?: number;

  // Calculation Results
  results: CalculationResults;

  // Project Information
  project?: ProjectInformation;

  // Storage Metadata
  sortOrder: number;            // For FIFO ordering (oldest=0, newest=49)
}

// ============================================================================
// STATE MANAGEMENT (Zustand Store)
// ============================================================================

/**
 * Breaker Calculator State (Zustand)
 *
 * Combined input state managed by Zustand store
 */
export interface BreakerCalculatorState {
  // Circuit Configuration
  standard: 'NEC' | 'IEC';
  voltage: number;
  phase: 'single' | 'three';
  loadMode: 'kw' | 'amps';
  loadValue: number;
  powerFactor: number;
  unitSystem: 'metric' | 'imperial';

  // Environmental (optional)
  ambientTemperature?: number;
  groupedCables?: number;
  installationMethod?: InstallationMethod;
  circuitDistance?: number;
  conductorMaterial?: 'copper' | 'aluminum';
  conductorSizeValue?: number;
  conductorSizeUnit?: 'AWG' | 'kcmil' | 'mm²';

  // Short Circuit (optional)
  shortCircuitCurrentKA?: number;

  // Load Type (for trip curve recommendation)
  loadType?: LoadType;

  // Project Info (optional)
  projectName?: string;
  projectLocation?: string;
  engineerName?: string;

  // Calculated Results
  results?: CalculationResults;

  // UI State
  showDeratingSidebar: boolean;
  showHistorySidebar: boolean;
  showCalculationDetails: boolean;

  // Errors
  validationErrors: ValidationError[];
}

/**
 * Validation Error Details
 */
export interface ValidationError {
  field: string;
  message: string;
  value: any;
  constraint: string;            // e.g., "must be 100-1000"
}

/**
 * Zustand Store Actions
 *
 * Mutation methods for state management
 */
export interface BreakerCalculatorActions {
  // Input updates
  setStandard: (standard: 'NEC' | 'IEC') => void;
  setVoltage: (voltage: number) => void;
  setPhase: (phase: 'single' | 'three') => void;
  setLoadMode: (mode: 'kw' | 'amps') => void;
  setLoadValue: (value: number) => void;
  setPowerFactor: (pf: number) => void;
  setUnitSystem: (system: 'metric' | 'imperial') => void;

  // Environmental
  setAmbientTemperature: (temp: number | undefined) => void;
  setGroupedCables: (count: number | undefined) => void;
  setInstallationMethod: (method: InstallationMethod | undefined) => void;
  setCircuitDistance: (distance: number | undefined) => void;
  setShortCircuitCurrent: (current: number | undefined) => void;
  setLoadType: (type: LoadType | undefined) => void;

  // Project Info
  setProjectInformation: (info: Partial<ProjectInformation>) => void;

  // Calculation
  calculate: () => Promise<void>;

  // UI
  toggleDeratingSidebar: () => void;
  toggleHistorySidebar: () => void;
  toggleCalculationDetails: () => void;

  // History
  saveToHistory: () => Promise<void>;
  loadFromHistory: (id: string) => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  getHistory: () => CalculationHistoryEntry[];

  // Reset
  reset: () => void;

  // Persistence
  hydrate: () => void;  // Load from localStorage on app start
}

/**
 * Combined Zustand Store Type
 */
export type BreakerCalculatorStore = BreakerCalculatorState & BreakerCalculatorActions;
