/**
 * Validation service for power calculation inputs
 */

import {
  PowerCalculationParameters,
  POWER_VALIDATION_RULES,
} from '../../models/PowerCalculationParameters';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation warning structure
 */
export interface ValidationWarning {
  field: string;
  message: string;
  recommendation?: string;
}

/**
 * Power Validation Service
 */
export class PowerValidationService {
  /**
   * Validate power calculation parameters
   */
  public validate(params: PowerCalculationParameters): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate system type
    if (!params.systemType || !POWER_VALIDATION_RULES.SYSTEM_TYPES.includes(params.systemType)) {
      errors.push({
        field: 'systemType',
        message: `System type must be one of: ${POWER_VALIDATION_RULES.SYSTEM_TYPES.join(', ')}`,
        value: params.systemType,
      });
    }

    // Validate voltage
    if (params.voltage === undefined || params.voltage === null) {
      errors.push({
        field: 'voltage',
        message: 'Voltage is required',
      });
    } else if (params.voltage < POWER_VALIDATION_RULES.MIN_VOLTAGE) {
      errors.push({
        field: 'voltage',
        message: `Voltage must be at least ${POWER_VALIDATION_RULES.MIN_VOLTAGE}V per IEC 60038`,
        value: params.voltage,
      });
    } else if (params.voltage > POWER_VALIDATION_RULES.MAX_VOLTAGE) {
      errors.push({
        field: 'voltage',
        message: `Voltage must not exceed ${POWER_VALIDATION_RULES.MAX_VOLTAGE}V per IEC 60038`,
        value: params.voltage,
      });
    }

    // Validate current
    if (params.current === undefined || params.current === null) {
      errors.push({
        field: 'current',
        message: 'Current is required',
      });
    } else if (params.current < POWER_VALIDATION_RULES.MIN_CURRENT) {
      errors.push({
        field: 'current',
        message: `Current must be at least ${POWER_VALIDATION_RULES.MIN_CURRENT}A`,
        value: params.current,
      });
    } else if (params.current > POWER_VALIDATION_RULES.MAX_CURRENT) {
      errors.push({
        field: 'current',
        message: `Current must not exceed ${POWER_VALIDATION_RULES.MAX_CURRENT.toLocaleString()}A`,
        value: params.current,
      });
    }

    // Validate power factor
    if (params.powerFactor === undefined || params.powerFactor === null) {
      errors.push({
        field: 'powerFactor',
        message: 'Power factor is required',
      });
    } else if (params.powerFactor < POWER_VALIDATION_RULES.MIN_POWER_FACTOR) {
      errors.push({
        field: 'powerFactor',
        message: `Power factor must be at least ${POWER_VALIDATION_RULES.MIN_POWER_FACTOR}`,
        value: params.powerFactor,
      });
    } else if (params.powerFactor > POWER_VALIDATION_RULES.MAX_POWER_FACTOR) {
      errors.push({
        field: 'powerFactor',
        message: `Power factor must not exceed ${POWER_VALIDATION_RULES.MAX_POWER_FACTOR}`,
        value: params.powerFactor,
      });
    } else if (params.powerFactor < POWER_VALIDATION_RULES.POWER_FACTOR_WARNING_THRESHOLD) {
      warnings.push({
        field: 'powerFactor',
        message: `Low power factor (${params.powerFactor}) detected`,
        recommendation: 'Consider power factor correction to improve efficiency',
      });
    }

    // Validate frequency (optional)
    if (params.frequency !== undefined) {
      if (!POWER_VALIDATION_RULES.FREQUENCIES.includes(params.frequency)) {
        errors.push({
          field: 'frequency',
          message: `Frequency must be ${POWER_VALIDATION_RULES.FREQUENCIES.join(' or ')} Hz`,
          value: params.frequency,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Quick validation - returns true if valid
   */
  public isValid(params: PowerCalculationParameters): boolean {
    return this.validate(params).isValid;
  }

  /**
   * Get validation error messages only
   */
  public getErrors(params: PowerCalculationParameters): string[] {
    return this.validate(params).errors.map((e) => e.message);
  }

  /**
   * Get validation warning messages only
   */
  public getWarnings(params: PowerCalculationParameters): string[] {
    return this.validate(params).warnings.map((w) => w.message);
  }
}

/**
 * Convenience function for quick validation
 */
export function validatePowerInputs(params: PowerCalculationParameters): ValidationResult {
  const validator = new PowerValidationService();
  return validator.validate(params);
}
