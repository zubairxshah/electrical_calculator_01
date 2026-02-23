/**
 * Input parameters for Active, Reactive & Apparent Power calculations
 */

/**
 * System type for power calculations
 */
export type SystemType = 'single-phase' | 'three-phase';

/**
 * Power calculation input parameters
 */
export interface PowerCalculationParameters {
  /** System type: single-phase or three-phase */
  systemType: SystemType;
  
  /** Voltage in volts (V) */
  voltage: number;
  
  /** Current in amperes (A) */
  current: number;
  
  /** Power factor (cosφ), range 0.1 to 1.0 */
  powerFactor: number;
  
  /** Frequency in Hz (50 or 60) */
  frequency?: 50 | 60;
  
  /** Optional project name for saving */
  projectName?: string;
}

/**
 * Validation rules for power calculation parameters
 */
export const POWER_VALIDATION_RULES = {
  /** Minimum voltage (V) per IEC 60038 */
  MIN_VOLTAGE: 100,
  
  /** Maximum voltage (V) per IEC 60038 */
  MAX_VOLTAGE: 1000,
  
  /** Minimum current (A) */
  MIN_CURRENT: 0.1,
  
  /** Maximum current (A) */
  MAX_CURRENT: 10000,
  
  /** Minimum power factor */
  MIN_POWER_FACTOR: 0.1,
  
  /** Maximum power factor */
  MAX_POWER_FACTOR: 1.0,
  
  /** Standard power factor threshold for warnings */
  POWER_FACTOR_WARNING_THRESHOLD: 0.85,
  
  /** Valid system types */
  SYSTEM_TYPES: ['single-phase', 'three-phase'] as const,
  
  /** Valid frequencies (Hz) */
  FREQUENCIES: [50, 60] as const,
} as const;
