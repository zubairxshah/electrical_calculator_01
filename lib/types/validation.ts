/**
 * TypeScript type definitions for real-time validation
 *
 * Supports Constitution Principle II: Safety-First Validation
 * - Real-time warnings for dangerous conditions (<100ms)
 * - Standards-compliant validation rules
 * - Hierarchical severity levels
 *
 * @see specs/001-electromate-engineering-app/spec.md#SC-002
 */

import { StandardsFramework, CalculationType } from './calculations'

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Unique rule identifier */
  id: string
  /** Rule name for display */
  name: string
  /** Severity level */
  severity: 'error' | 'warning' | 'info'
  /** Calculation types this rule applies to */
  applicableTypes: CalculationType[]
  /** Standards framework (if framework-specific) */
  standards?: StandardsFramework
  /** Standard reference (e.g., "NEC 210.19(A)(1)", "IEEE 485-2020 Section 5.3") */
  standardReference?: string
  /** Validation function */
  validate: ValidationFunction
  /** Error message template with {placeholder} support */
  messageTemplate: string
  /** Recommended action */
  recommendation?: string
}

/**
 * Validation function signature
 */
export type ValidationFunction = (
  inputs: Record<string, unknown>,
  context?: ValidationContext
) => boolean

/**
 * Validation context for contextual rules
 */
export interface ValidationContext {
  /** Current standards framework */
  standards: StandardsFramework
  /** Ambient conditions */
  ambientTemperature?: number
  /** User preferences */
  preferences?: {
    conservativeMode?: boolean // Apply stricter limits
    showInfoMessages?: boolean // Display informational hints
  }
}

/**
 * Validation result for a single field
 */
export interface FieldValidation {
  /** Field name (dot notation: "inputs.voltage") */
  field: string
  /** Validation passed? */
  isValid: boolean
  /** Validation rule that failed */
  rule?: ValidationRule
  /** Formatted error message */
  message?: string
  /** Severity level */
  severity?: 'error' | 'warning' | 'info'
  /** Standard reference */
  standardReference?: string
  /** Recommended action */
  recommendation?: string
}

/**
 * Complete validation result for a calculation
 */
export interface ValidationResults {
  /** Overall validation status */
  isValid: boolean
  /** Has blocking errors? */
  hasErrors: boolean
  /** Has warnings? */
  hasWarnings: boolean
  /** Individual field validations */
  fields: Record<string, FieldValidation>
  /** Summary of issues by severity */
  summary: {
    errorCount: number
    warningCount: number
    infoCount: number
  }
  /** Validation execution time (ms) - must be <100ms per SC-002 */
  executionTimeMs: number
}

/**
 * Battery-specific validation rules (IEEE 485-2020)
 */
export const BATTERY_VALIDATION_RULES = {
  /** Discharge rate exceeds C/5 - may reduce capacity */
  HIGH_DISCHARGE_RATE: 'BATTERY_HIGH_DISCHARGE_RATE',
  /** Voltage below minimum safe cutoff for chemistry */
  LOW_VOLTAGE_CUTOFF: 'BATTERY_LOW_VOLTAGE_CUTOFF',
  /** Temperature below recommended range */
  LOW_TEMPERATURE: 'BATTERY_LOW_TEMPERATURE',
  /** Temperature above recommended range */
  HIGH_TEMPERATURE: 'BATTERY_HIGH_TEMPERATURE',
  /** Aging factor indicates end-of-life (<0.8) */
  END_OF_LIFE: 'BATTERY_END_OF_LIFE',
  /** Load exceeds battery continuous discharge rating */
  OVERLOAD: 'BATTERY_OVERLOAD',
  /** Efficiency value unrealistic (<0.7 or >0.98) */
  UNREALISTIC_EFFICIENCY: 'BATTERY_UNREALISTIC_EFFICIENCY',
} as const

/**
 * UPS-specific validation rules (IEEE 1100-2020)
 */
export const UPS_VALIDATION_RULES = {
  /** UPS undersized for load + growth */
  UNDERSIZED: 'UPS_UNDERSIZED',
  /** Power factor outside typical range */
  UNUSUAL_POWER_FACTOR: 'UPS_UNUSUAL_POWER_FACTOR',
  /** Backup time unrealistic (>8 hours typically not feasible) */
  EXCESSIVE_BACKUP_TIME: 'UPS_EXCESSIVE_BACKUP_TIME',
  /** Growth factor too aggressive (>1.5) */
  AGGRESSIVE_GROWTH: 'UPS_AGGRESSIVE_GROWTH',
  /** Diversity factor conflicts with IEEE 1100 Table 8-2 */
  INVALID_DIVERSITY: 'UPS_INVALID_DIVERSITY',
} as const

/**
 * Cable sizing validation rules (NEC/IEC)
 */
export const CABLE_VALIDATION_RULES = {
  /** Voltage drop exceeds standard limits (NEC 210.19(A)) */
  EXCESSIVE_VOLTAGE_DROP: 'CABLE_EXCESSIVE_VOLTAGE_DROP',
  /** Ampacity insufficient after derating */
  INSUFFICIENT_AMPACITY: 'CABLE_INSUFFICIENT_AMPACITY',
  /** Temperature exceeds conductor rating */
  TEMPERATURE_EXCEEDED: 'CABLE_TEMPERATURE_EXCEEDED',
  /** Conduit fill exceeds 40% (NEC 310.15(B)(3)(a)) */
  CONDUIT_OVERFILL: 'CABLE_CONDUIT_OVERFILL',
  /** Cable length excessive for voltage/current */
  EXCESSIVE_LENGTH: 'CABLE_EXCESSIVE_LENGTH',
  /** Aluminum conductor without anti-oxidant compound (NEC 110.14) */
  ALUMINUM_NO_COMPOUND: 'CABLE_ALUMINUM_NO_COMPOUND',
  /** Current too low - oversized conductor may cause issues */
  UNDERSIZED_LOAD: 'CABLE_UNDERSIZED_LOAD',
} as const

/**
 * Solar array validation rules (IEC 61215, IEC 61730)
 */
export const SOLAR_VALIDATION_RULES = {
  /** Array voltage exceeds charge controller maximum */
  VOLTAGE_EXCEEDED: 'SOLAR_VOLTAGE_EXCEEDED',
  /** Array current exceeds charge controller maximum */
  CURRENT_EXCEEDED: 'SOLAR_CURRENT_EXCEEDED',
  /** Panel configuration results in voltage mismatch */
  VOLTAGE_MISMATCH: 'SOLAR_VOLTAGE_MISMATCH',
  /** Insufficient panels for daily energy requirement */
  UNDERSIZED_ARRAY: 'SOLAR_UNDERSIZED_ARRAY',
  /** Peak sun hours unrealistic for location */
  UNREALISTIC_PSH: 'SOLAR_UNREALISTIC_PSH',
  /** System efficiency outside typical range (0.65-0.85) */
  UNUSUAL_EFFICIENCY: 'SOLAR_UNUSUAL_EFFICIENCY',
  /** Days of autonomy excessive (>7 days typically impractical) */
  EXCESSIVE_AUTONOMY: 'SOLAR_EXCESSIVE_AUTONOMY',
} as const

/**
 * Charge controller validation rules (IEC 62109)
 */
export const CHARGE_CONTROLLER_VALIDATION_RULES = {
  /** Controller undersized for array power */
  UNDERSIZED: 'CONTROLLER_UNDERSIZED',
  /** Array voltage exceeds controller Voc rating */
  VOLTAGE_EXCEEDED: 'CONTROLLER_VOLTAGE_EXCEEDED',
  /** Array current exceeds controller rating */
  CURRENT_EXCEEDED: 'CONTROLLER_CURRENT_EXCEEDED',
  /** PWM selected when MPPT would provide significant gain */
  PWM_INEFFICIENT: 'CONTROLLER_PWM_INEFFICIENT',
  /** Battery voltage incompatible with controller */
  VOLTAGE_INCOMPATIBLE: 'CONTROLLER_VOLTAGE_INCOMPATIBLE',
} as const

/**
 * Universal validation rules (all calculation types)
 */
export const UNIVERSAL_VALIDATION_RULES = {
  /** Required field missing */
  REQUIRED_FIELD: 'UNIVERSAL_REQUIRED_FIELD',
  /** Value out of acceptable range */
  OUT_OF_RANGE: 'UNIVERSAL_OUT_OF_RANGE',
  /** Invalid numeric value (NaN, Infinity) */
  INVALID_NUMBER: 'UNIVERSAL_INVALID_NUMBER',
  /** Negative value where positive required */
  NEGATIVE_VALUE: 'UNIVERSAL_NEGATIVE_VALUE',
  /** Value precision exceeds reasonable limits */
  EXCESSIVE_PRECISION: 'UNIVERSAL_EXCESSIVE_PRECISION',
} as const

/**
 * Validation rule registry type
 */
export type ValidationRuleRegistry = Map<string, ValidationRule>

/**
 * Validation error thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public rule: string,
    message: string,
    public severity: 'error' | 'warning' | 'info' = 'error'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Range validation constraint
 */
export interface RangeConstraint {
  /** Minimum value (inclusive) */
  min: number
  /** Maximum value (inclusive) */
  max: number
  /** Unit for display */
  unit?: string
  /** Field label for error messages */
  label: string
}

/**
 * Enum validation constraint
 */
export interface EnumConstraint<T extends string> {
  /** Allowed values */
  values: readonly T[]
  /** Field label for error messages */
  label: string
}

/**
 * Conditional validation rule
 */
export interface ConditionalRule {
  /** Condition that must be met for rule to apply */
  condition: (inputs: Record<string, unknown>) => boolean
  /** Rule to apply if condition is true */
  rule: ValidationRule
}

/**
 * Validation performance metrics (for monitoring SC-002 compliance)
 */
export interface ValidationPerformanceMetrics {
  /** Total validation time (ms) */
  totalTimeMs: number
  /** Time per rule (ms) */
  ruleTimings: Record<string, number>
  /** Rules executed count */
  rulesExecuted: number
  /** Slowest rule */
  slowestRule?: {
    ruleId: string
    timeMs: number
  }
  /** Compliance with <100ms target */
  isCompliant: boolean
}
