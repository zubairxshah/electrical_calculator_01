import { CalculationParameters } from '../../models/CalculationParameters';
import { VALIDATION_RULES } from '../../models/CalculationParameters';

/**
 * Validation service for lightning arrester calculation parameters
 */
export class LightningArresterValidationService {

  /**
   * Validates calculation parameters according to IEC and NEC standards
   * @param params The calculation parameters to validate
   * @returns Array of validation errors if any, empty array if valid
   */
  public validate(params: CalculationParameters): string[] {
    const errors: string[] = [];

    // Validate system voltage
    if (!this.isValidVoltage(params.systemVoltage)) {
      errors.push(`System voltage must be between ${VALIDATION_RULES.MIN_VOLTAGE}kV and ${VALIDATION_RULES.MAX_VOLTAGE}kV`);
    }

    // Validate structure type
    if (!VALIDATION_RULES.STRUCTURE_TYPES.includes(params.structureType)) {
      errors.push(`Structure type must be one of: ${VALIDATION_RULES.STRUCTURE_TYPES.join(', ')}`);
    }

    // Validate environmental conditions
    if (params.environmentalConditions) {
      // Validate humidity
      if (typeof params.environmentalConditions.humidity !== 'number' ||
          params.environmentalConditions.humidity < VALIDATION_RULES.MIN_HUMIDITY ||
          params.environmentalConditions.humidity > VALIDATION_RULES.MAX_HUMIDITY) {
        errors.push(`Humidity must be a number between ${VALIDATION_RULES.MIN_HUMIDITY}% and ${VALIDATION_RULES.MAX_HUMIDITY}%`);
      }

      // Validate pollution level
      if (!VALIDATION_RULES.POLLUTION_LEVELS.includes(params.environmentalConditions.pollutionLevel)) {
        errors.push(`Pollution level must be one of: ${VALIDATION_RULES.POLLUTION_LEVELS.join(', ')}`);
      }

      // Validate altitude
      if (typeof params.environmentalConditions.altitude !== 'number' ||
          params.environmentalConditions.altitude < VALIDATION_RULES.MIN_ALTITUDE ||
          params.environmentalConditions.altitude > VALIDATION_RULES.MAX_ALTITUDE) {
        errors.push(`Altitude must be a number between ${VALIDATION_RULES.MIN_ALTITUDE}m and ${VALIDATION_RULES.MAX_ALTITUDE}m`);
      }
    } else {
      errors.push('Environmental conditions are required for accurate calculations');
    }

    // Validate compliance requirement
    if (!VALIDATION_RULES.COMPLIANCE_REQUIREMENTS.includes(params.complianceRequirement)) {
      errors.push(`Compliance requirement must be one of: ${VALIDATION_RULES.COMPLIANCE_REQUIREMENTS.join(', ')}`);
    }

    return errors;
  }

  /**
   * Validates if a voltage value is within acceptable range
   * @param voltage The voltage to validate
   * @returns True if valid, false otherwise
   */
  private isValidVoltage(voltage: number): boolean {
    return typeof voltage === 'number' &&
           voltage >= VALIDATION_RULES.MIN_VOLTAGE &&
           voltage <= VALIDATION_RULES.MAX_VOLTAGE;
  }

  /**
   * Validates if a value is a positive number
   * @param value The value to validate
   * @returns True if valid, false otherwise
   */
  private isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && value > 0;
  }

  /**
   * Validates if a value is within a specified range
   * @param value The value to validate
   * @param min Minimum allowed value
   * @param max Maximum allowed value
   * @returns True if valid, false otherwise
   */
  private isInRange(value: number, min: number, max: number): boolean {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Performs real-time validation with warnings for unusual values
   * @param params The calculation parameters to check
   * @returns Array of warnings for unusual values
   */
  public getWarnings(params: CalculationParameters): string[] {
    const warnings: string[] = [];

    // Check for unusually high voltage
    if (params.systemVoltage > 35) {
      warnings.push(`High voltage detected (${params.systemVoltage}kV). Verify application suitability.`);
    }

    // Check for unusually low voltage
    if (params.systemVoltage < 1) {
      warnings.push(`Low voltage detected (${params.systemVoltage}kV). Confirm system type.`);
    }

    // Check for high altitude
    if (params.environmentalConditions.altitude > 1500) {
      warnings.push(`High altitude detected (${params.environmentalConditions.altitude}m). De-rating may be required.`);
    }

    // Check for extreme humidity
    if (params.environmentalConditions.humidity > 90) {
      warnings.push(`High humidity detected (${params.environmentalConditions.humidity}%). Consider environmental protection.`);
    }

    // Check for heavy pollution
    if (params.environmentalConditions.pollutionLevel === 'heavy') {
      warnings.push('Heavy pollution environment detected. Increased maintenance may be required.');
    }

    return warnings;
  }

  /**
   * Validates that all required environmental conditions are provided
   * @param envConditions The environmental conditions to validate
   * @returns True if all required conditions are provided, false otherwise
   */
  public validateEnvironmentalConditions(envConditions: CalculationParameters['environmentalConditions']): boolean {
    if (!envConditions) {
      return false;
    }

    return (
      typeof envConditions.humidity === 'number' &&
      envConditions.humidity >= VALIDATION_RULES.MIN_HUMIDITY &&
      envConditions.humidity <= VALIDATION_RULES.MAX_HUMIDITY &&
      VALIDATION_RULES.POLLUTION_LEVELS.includes(envConditions.pollutionLevel) &&
      typeof envConditions.altitude === 'number' &&
      envConditions.altitude >= VALIDATION_RULES.MIN_ALTITUDE &&
      envConditions.altitude <= VALIDATION_RULES.MAX_ALTITUDE
    );
  }

  /**
   * Checks if the combination of parameters is physically possible
   * @param params The parameters to validate
   * @returns True if combination is physically possible, false otherwise
   */
  public validatePhysicalPossibility(params: CalculationParameters): boolean {
    // Check if system voltage is compatible with structure type
    if (params.structureType === 'home' && params.systemVoltage > 36) {
      // Residential installations typically have lower voltage systems
      return false;
    }

    // Check if environmental conditions are consistent
    if (params.environmentalConditions.humidity > 95 && params.environmentalConditions.pollutionLevel === 'heavy') {
      // Very high humidity with heavy pollution could indicate special conditions
      // This is not necessarily invalid, but could be flagged for review
    }

    // Additional physical possibility checks can be added here
    return true;
  }
}