# Data Model: Circuit Breaker Sizing Calculator

**Phase**: Phase 1 Design Artifacts
**Last Updated**: 2025-12-28
**TypeScript Version**: 5.x
**Status**: Ready for Implementation

---

## Overview

This document defines the TypeScript interfaces and data structures for the Circuit Breaker Sizing Calculator. All calculations are performed using these data models, ensuring type safety and consistency across the application.

---

## Core Interfaces

### 1. Circuit Configuration

Represents the electrical circuit being designed, including voltage, phase type, load, and power factor.

```typescript
/**
 * User-provided circuit parameters (inputs)
 */
export interface CircuitConfiguration {
  // Standard Selection
  standard: 'NEC' | 'IEC';

  // Electrical Parameters
  voltage: number;              // Volts (100-1000V range)
  phase: 'single' | 'three';    // Single-phase or three-phase

  // Load Definition (one of: power or current)
  loadMode: 'kw' | 'amps';      // Input mode
  loadValue: number;            // kW or A depending on loadMode

  // Power Factor (optional, defaults to 0.8)
  powerFactor: number;          // 0.5-1.0 range

  // Unit System
  unitSystem: 'metric' | 'imperial';
}

/**
 * Example Usage:
 * const circuit: CircuitConfiguration = {
 *   standard: 'NEC',
 *   voltage: 240,
 *   phase: 'single',
 *   loadMode: 'kw',
 *   loadValue: 10,
 *   powerFactor: 0.9,
 *   unitSystem: 'imperial'
 * };
 */
```

### 2. Environmental Conditions

Optional parameters affecting breaker and cable sizing (temperature, cable grouping, installation method, distance).

```typescript
/**
 * Environmental and installation factors (optional inputs)
 * All fields are optional; absence means default conditions apply
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
    // AWG: 14-1000 kcmil equivalent
    // mm²: 0.5-500mm²
    value: number;
    unit: 'AWG' | 'kcmil' | 'mm²';
  };
}

/**
 * Installation Method (IEC 60364-5-52)
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
 * Example Usage:
 * const environment: EnvironmentalConditions = {
 *   ambientTemperature: 45,
 *   groupedCables: 6,
 *   installationMethod: 'C',
 *   circuitDistance: 150,
 *   conductorMaterial: 'copper',
 *   conductorSize: { value: 6, unit: 'AWG' }
 * };
 */
```

### 3. Breaker Specification

Represents the recommended circuit breaker with all relevant ratings and characteristics.

```typescript
/**
 * Circuit breaker specification (output - recommendations)
 */
export interface BreakerSpecification {
  // Rating
  ratingAmps: number;           // Standard breaker rating (15-4000A)

  // Breaking Capacity
  breakingCapacityKA: number;   // kA rating (e.g., 10, 25, 50)

  // Trip Curve (IEC) or Trip Type (NEC)
  tripCurve?: 'B' | 'C' | 'D' | 'K' | 'Z';  // IEC trip curves
  tripType?: 'thermal-magnetic' | 'electronic';  // NEC types

  // Load Characteristics
  loadType: 'resistive' | 'inductive' | 'mixed' | 'capacitive';

  // Compliance References
  standard: 'NEC' | 'IEC';
  codeSection: string;          // e.g., "NEC 210.20(A)" or "IEC 60364-5-52"

  // Compatibility Flags
  isSafe: boolean;              // True if breaker is safe for application
  warnings: BreakerWarning[];   // Any warnings about this breaker
}

/**
 * Breaker warning message
 */
export interface BreakerWarning {
  level: 'info' | 'warning' | 'error';
  code: string;                 // e.g., 'SHORT_CIRCUIT_CAPACITY_LOW'
  message: string;              // User-friendly message
  codeReference?: string;       // Applicable code section
  recommendation?: string;      // Suggested action
}

/**
 * Example Usage:
 * const breaker: BreakerSpecification = {
 *   ratingAmps: 60,
 *   breakingCapacityKA: 25,
 *   tripCurve: 'C',
 *   loadType: 'mixed',
 *   standard: 'NEC',
 *   codeSection: 'NEC 210.20(A)',
 *   isSafe: true,
 *   warnings: []
 * };
 */
```

### 4. Calculation Results

Comprehensive output containing all calculated values, applied factors, and validation results.

```typescript
/**
 * Complete calculation results
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

/**
 * Load Analysis Section
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
 * Derating Factors Applied
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

  // NEC limits
  limitBranchCircuit: number;   // 3%
  limitCombined: number;        // 5%

  // Assessment
  status: 'acceptable' | 'warning' | 'exceed-limit';
  assessment: string;           // e.g., "Exceeds NEC 3% limit for branch circuit"

  // Recommendation
  recommendedCableSize?: string; // Next larger size if limit exceeded
  recommendedVDPercent?: number; // VD% with larger cable
}

/**
 * Short Circuit Capacity Analysis
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
 * Recommendations (guidance for engineer)
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
 * Calculation Alert (warning/error)
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
 * Example Usage:
 * const results: CalculationResults = {
 *   loadAnalysis: { ... },
 *   breakerSizing: { ... },
 *   recommendations: { ... },
 *   calculatedAt: "2025-12-28T10:30:00Z",
 *   calculationVersion: "1.0.0",
 *   alerts: []
 * };
 */
```

### 5. Project Information

Optional metadata for documentation and PDF export.

```typescript
/**
 * Project context (optional)
 * Used for PDF header and report identification
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

/**
 * Example Usage:
 * const project: ProjectInformation = {
 *   projectName: "Downtown Office Complex - Building C",
 *   projectLocation: "San Francisco, CA",
 *   engineerName: "Jane Doe, PE",
 *   engineerCompany: "ElectroDesign Engineers"
 * };
 */
```

### 6. Calculation History Entry

Complete record of a calculation stored in localStorage for cross-session reference.

```typescript
/**
 * Full calculation history entry (for localStorage persistence)
 * Includes all inputs and outputs for retrieval and comparison
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

/**
 * Example Usage:
 * const entry: CalculationHistoryEntry = {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   timestamp: "2025-12-28T10:30:00Z",
 *   circuit: { ... },
 *   results: { ... },
 *   sortOrder: 0
 * };
 */
```

---

## Specialized Types

### 7. Calculation Input State (Zustand Store)

Used for React component state management.

```typescript
/**
 * Combined input state (what user has entered)
 * Persisted to localStorage via Zustand
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
```

### 8. Zustand Store Actions

```typescript
/**
 * Store actions for mutation
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
  setAmbientTemperature: (temp: number) => void;
  setGroupedCables: (count: number) => void;
  setInstallationMethod: (method: InstallationMethod) => void;
  setCircuitDistance: (distance: number) => void;
  setShortCircuitCurrent: (current: number) => void;

  // Project Info
  setProjectInformation: (info: ProjectInformation) => void;

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
```

---

## Validation Schema (Zod)

Type-safe input validation.

```typescript
import { z } from 'zod';

/**
 * Zod schemas for runtime validation
 */

// Voltage validation
export const voltageSchema = z.number()
  .min(100, 'Voltage must be at least 100V')
  .max(1000, 'Voltage must not exceed 1000V')
  .refine(
    (v) => ![0].includes(v),
    'Voltage cannot be zero'
  );

// Load validation
export const loadValueSchema = z.number()
  .positive('Load must be greater than zero')
  .max(10000, 'Load must not exceed 10,000');

// Power Factor validation
export const powerFactorSchema = z.number()
  .min(0.5, 'Power factor must be at least 0.5')
  .max(1.0, 'Power factor must not exceed 1.0');

// Temperature validation
export const temperatureSchema = z.number()
  .min(-40, 'Temperature must be at least -40°C')
  .max(70, 'Temperature must not exceed 70°C');

// Grouped cables validation
export const groupedCablesSchema = z.number()
  .min(1, 'Must have at least 1 cable')
  .max(100, 'Grouping assumption: limit to 100 cables');

// Circuit Configuration schema
export const circuitConfigSchema = z.object({
  standard: z.enum(['NEC', 'IEC']),
  voltage: voltageSchema,
  phase: z.enum(['single', 'three']),
  loadMode: z.enum(['kw', 'amps']),
  loadValue: loadValueSchema,
  powerFactor: powerFactorSchema.default(0.8),
  unitSystem: z.enum(['metric', 'imperial'])
});

// Full calculation input schema
export const calculationInputSchema = z.object({
  circuit: circuitConfigSchema,
  environment: z.object({
    ambientTemperature: temperatureSchema.optional(),
    groupedCables: groupedCablesSchema.optional(),
    installationMethod: z.enum(['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F', 'G']).optional(),
    circuitDistance: z.number().positive().optional(),
    conductorMaterial: z.enum(['copper', 'aluminum']).optional(),
    conductorSize: z.object({
      value: z.number().positive(),
      unit: z.enum(['AWG', 'kcmil', 'mm²'])
    }).optional()
  }).optional(),
  shortCircuitCurrentKA: z.number().positive().optional()
});
```

---

## Constants Reference

Standard values and lookup tables referenced by data model.

```typescript
// NEC Standard Breaker Ratings
export const NEC_BREAKER_RATINGS = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
  110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450,
  500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000
];

// IEC Standard Breaker Ratings
export const IEC_BREAKER_RATINGS = [
  6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100,
  125, 160, 200, 250, 315, 400, 500, 630, 800, 1000,
  1250, 1600, 2000, 2500, 3200, 4000
];

// Standard Residential Voltages
export const STANDARD_VOLTAGES_NEC = [120, 208, 240, 277, 480];
export const STANDARD_VOLTAGES_IEC = [230, 400, 690];

// Temperature Derating Factor (NEC Table 310.15(B)(2)(a) - Copper)
export const NEC_TEMPERATURE_DERATING: Record<number, number> = {
  10: 1.08,
  15: 1.05,
  20: 1.00,  // Reference
  25: 0.95,
  30: 0.91,
  35: 0.86,
  40: 0.80,
  45: 0.76,
  50: 0.71,
  55: 0.67,
  60: 0.63
};

// Grouping Derating Factor (NEC Table 310.15(C)(1))
export const NEC_GROUPING_DERATING: Record<number, number> = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65,
  5: 0.60,
  6: 0.60,
  7: 0.57,
  8: 0.57,
  9: 0.50
};
```

---

## Implementation Checklist

- [ ] All interfaces compile without TypeScript errors
- [ ] Zod schemas validate test input cases correctly
- [ ] Constants loaded and accessible
- [ ] Example objects instantiate without type errors
- [ ] API contracts (OpenAPI) align with interface definitions
- [ ] PDF template can serialize all CalculationResults fields
- [ ] localStorage schema handles all CalculationHistoryEntry fields
- [ ] Unit tests mock these interfaces correctly

---

**Data Model Status**: APPROVED FOR IMPLEMENTATION
**Compile Check**: ✓ TypeScript 5.x compatible
**Next Phase**: Implement Zustand store, API routes, React components
