/**
 * Validation service for maximum demand calculation inputs
 */

import { DemandCalculationParameters, DEMAND_VALIDATION_RULES } from '../../models/DemandCalculationParameters';

/**
 * Validation service for demand calculation parameters
 */
export class DemandValidationService {

  /**
   * Validate calculation parameters
   * Returns array of error messages (empty if valid)
   */
  public validate(params: DemandCalculationParameters): string[] {
    const errors: string[] = [];

    // Validate project type
    if (!params.projectType || !DEMAND_VALIDATION_RULES.PROJECT_TYPES.includes(params.projectType)) {
      errors.push(`Invalid project type. Must be one of: ${DEMAND_VALIDATION_RULES.PROJECT_TYPES.join(', ')}`);
    }

    // Validate standard
    if (!params.standard || !DEMAND_VALIDATION_RULES.STANDARDS.includes(params.standard)) {
      errors.push(`Invalid standard. Must be one of: ${DEMAND_VALIDATION_RULES.STANDARDS.join(', ')}`);
    }

    // Validate voltage
    if (!params.voltage || 
        params.voltage < DEMAND_VALIDATION_RULES.MIN_VOLTAGE || 
        params.voltage > DEMAND_VALIDATION_RULES.MAX_VOLTAGE) {
      errors.push(`Voltage must be between ${DEMAND_VALIDATION_RULES.MIN_VOLTAGE}V and ${DEMAND_VALIDATION_RULES.MAX_VOLTAGE}V`);
    }

    // Validate phases
    if (!params.phases || (params.phases !== 1 && params.phases !== 3)) {
      errors.push('Phases must be either 1 (single-phase) or 3 (three-phase)');
    }

    // Validate frequency
    if (!params.frequency || !DEMAND_VALIDATION_RULES.FREQUENCIES.includes(params.frequency)) {
      errors.push(`Frequency must be ${DEMAND_VALIDATION_RULES.FREQUENCIES.join(' or ')} Hz`);
    }

    // Validate loads
    const loadErrors = this.validateLoads(params.loads, params.projectType);
    errors.push(...loadErrors);

    // Validate custom factors if provided
    if (params.customFactors) {
      const factorErrors = this.validateCustomFactors(params.customFactors);
      errors.push(...factorErrors);
    }

    // Validate future expansion if provided
    if (params.futureExpansion !== undefined) {
      if (params.futureExpansion < 0 || params.futureExpansion > 1) {
        errors.push('Future expansion must be between 0 and 1 (0-100%)');
      }
    }

    return errors;
  }

  /**
   * Validate load inputs based on project type
   */
  private validateLoads(loads: any, projectType: string): string[] {
    const errors: string[] = [];

    // Check if at least one load category has a value
    const loadValues = Object.values(loads).filter(v => {
      if (v === undefined || v === null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === 'number' && v > 0;
    });
    
    if (loadValues.length === 0) {
      errors.push('At least one load category must have a positive value');
      return errors;
    }

    // Validate individual load values
    for (const [key, value] of Object.entries(loads)) {
      if (value === undefined || value === null) {
        continue;
      }

      // Skip array values (motorLoads) - they're validated separately
      if (Array.isArray(value)) {
        continue;
      }

      const numValue = Number(value);

      if (isNaN(numValue)) {
        errors.push(`${this.formatCategoryName(key)} must be a valid number`);
        continue;
      }

      if (numValue < DEMAND_VALIDATION_RULES.MIN_LOAD) {
        errors.push(`${this.formatCategoryName(key)} cannot be negative`);
        continue;
      }

      if (numValue > DEMAND_VALIDATION_RULES.MAX_LOAD_PER_CATEGORY) {
        errors.push(`${this.formatCategoryName(key)} exceeds maximum of ${DEMAND_VALIDATION_RULES.MAX_LOAD_PER_CATEGORY.toLocaleString()} kW`);
      }
    }

    // Validate motor loads for industrial projects
    if (projectType === 'industrial' && loads.motorLoads) {
      const motorErrors = this.validateMotorLoads(loads.motorLoads);
      errors.push(...motorErrors);
    }

    return errors;
  }

  /**
   * Validate motor load array for industrial projects
   */
  private validateMotorLoads(motors: any[]): string[] {
    const errors: string[] = [];

    if (!Array.isArray(motors) || motors.length === 0) {
      errors.push('Industrial projects must have at least one motor load defined');
      return errors;
    }

    for (let i = 0; i < motors.length; i++) {
      const motor = motors[i];
      const prefix = `Motor ${i + 1}`;

      if (!motor.name || typeof motor.name !== 'string') {
        errors.push(`${prefix}: Name is required`);
      }

      if (!motor.power || motor.power <= 0) {
        errors.push(`${prefix}: Power must be greater than 0 kW`);
      }

      if (motor.powerFactor === undefined || motor.powerFactor < DEMAND_VALIDATION_RULES.MIN_POWER_FACTOR || 
          motor.powerFactor > DEMAND_VALIDATION_RULES.MAX_POWER_FACTOR) {
        errors.push(`${prefix}: Power factor must be between ${DEMAND_VALIDATION_RULES.MIN_POWER_FACTOR} and ${DEMAND_VALIDATION_RULES.MAX_POWER_FACTOR}`);
      }

      if (!motor.dutyCycle || !['continuous', 'intermittent', 'short-time'].includes(motor.dutyCycle)) {
        errors.push(`${prefix}: Duty cycle must be 'continuous', 'intermittent', or 'short-time'`);
      }
    }

    // Check that exactly one motor is marked as largest
    const largestMotors = motors.filter(m => m.isLargest);
    if (largestMotors.length === 0) {
      errors.push('One motor must be marked as the largest for NEC calculation');
    } else if (largestMotors.length > 1) {
      errors.push('Only one motor should be marked as the largest');
    }

    return errors;
  }

  /**
   * Validate custom factors
   */
  private validateCustomFactors(factors: { [key: string]: number }): string[] {
    const errors: string[] = [];

    for (const [category, factor] of Object.entries(factors)) {
      if (factor < 0 || factor > 1) {
        errors.push(`Custom factor for ${category} must be between 0 and 1`);
      }
    }

    return errors;
  }

  /**
   * Format category name for error messages
   */
  private formatCategoryName(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  /**
   * Get warnings for unusual values (non-blocking)
   */
  public getWarnings(params: DemandCalculationParameters): string[] {
    const warnings: string[] = [];

    // Check for high total connected load
    const loads = params.loads;
    let totalLoad = 0;
    for (const value of Object.values(loads)) {
      if (typeof value === 'number') {
        totalLoad += value;
      }
      if (Array.isArray(value)) {
        // Motor loads
        totalLoad += value.reduce((sum, m) => sum + (m.power || 0), 0);
      }
    }

    if (totalLoad > 500) {
      warnings.push(`High connected load detected (${totalLoad.toFixed(1)} kW) - verify service capacity`);
    }

    if (totalLoad > 1000) {
      warnings.push(`Very high connected load (${totalLoad.toFixed(1)} kW) - consider consulting utility company`);
    }

    // Check for unusual voltage
    if (params.voltage > 480) {
      warnings.push(`High voltage system (${params.voltage}V) - ensure proper safety measures`);
    }

    return warnings;
  }
}
