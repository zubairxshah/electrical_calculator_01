import { LightningArresterValidationService } from '../validation';
import { CalculationParameters, VALIDATION_RULES } from '../../../models/CalculationParameters';

describe('LightningArresterValidationService', () => {
  let validationService: LightningArresterValidationService;

  beforeEach(() => {
    validationService = new LightningArresterValidationService();
  });

  describe('validate', () => {
    it('should return no errors for valid parameters', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid system voltage', () => {
      const params: CalculationParameters = {
        systemVoltage: 50, // Too high
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`System voltage must be between ${VALIDATION_RULES.MIN_VOLTAGE}kV and ${VALIDATION_RULES.MAX_VOLTAGE}kV`);
    });

    it('should return errors for invalid structure type', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'invalid' as any,
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`Structure type must be one of: ${VALIDATION_RULES.STRUCTURE_TYPES.join(', ')}`);
    });

    it('should return errors for invalid humidity', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 120, // Invalid
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`Humidity must be a number between ${VALIDATION_RULES.MIN_HUMIDITY}% and ${VALIDATION_RULES.MAX_HUMIDITY}%`);
    });

    it('should return errors for invalid pollution level', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'invalid' as any,
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`Pollution level must be one of: ${VALIDATION_RULES.POLLUTION_LEVELS.join(', ')}`);
    });

    it('should return errors for invalid altitude', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 3000, // Too high
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`Altitude must be a number between ${VALIDATION_RULES.MIN_ALTITUDE}m and ${VALIDATION_RULES.MAX_ALTITUDE}m`);
    });

    it('should return errors for invalid compliance requirement', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'invalid' as any,
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`Compliance requirement must be one of: ${VALIDATION_RULES.COMPLIANCE_REQUIREMENTS.join(', ')}`);
    });

    it('should return error when environmental conditions are missing', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: undefined as any, // Missing environmental conditions
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain('Environmental conditions are required for accurate calculations');
    });
  });

  describe('getWarnings', () => {
    it('should return warnings for unusual voltage values', () => {
      const params: CalculationParameters = {
        systemVoltage: 40, // Unusually high
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const warnings = validationService.getWarnings(params);
      expect(warnings).toContain(`High voltage detected (${params.systemVoltage}kV). Verify application suitability.`);
    });

    it('should return warnings for low voltage values', () => {
      const params: CalculationParameters = {
        systemVoltage: 0.5, // Unusually low
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const warnings = validationService.getWarnings(params);
      expect(warnings).toContain(`Low voltage detected (${params.systemVoltage}kV). Confirm system type.`);
    });

    it('should return warnings for high altitude', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 1800, // High altitude
        },
        complianceRequirement: 'type1',
      };

      const warnings = validationService.getWarnings(params);
      expect(warnings).toContain(`High altitude detected (${params.environmentalConditions.altitude}m). De-rating may be required.`);
    });

    it('should return warnings for extreme humidity', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 95, // Extreme humidity
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const warnings = validationService.getWarnings(params);
      expect(warnings).toContain(`High humidity detected (${params.environmentalConditions.humidity}%). Consider environmental protection.`);
    });

    it('should return warnings for heavy pollution', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'heavy', // Heavy pollution
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const warnings = validationService.getWarnings(params);
      expect(warnings).toContain('Heavy pollution environment detected. Increased maintenance may be required.');
    });
  });

  describe('validateEnvironmentalConditions', () => {
    it('should return true for valid environmental conditions', () => {
      const envConditions = {
        humidity: 65,
        pollutionLevel: 'medium',
        altitude: 150,
      };

      const result = validationService.validateEnvironmentalConditions(envConditions);
      expect(result).toBe(true);
    });

    it('should return false for undefined environmental conditions', () => {
      const result = validationService.validateEnvironmentalConditions(undefined as any);
      expect(result).toBe(false);
    });

    it('should return false for invalid humidity', () => {
      const envConditions = {
        humidity: 120, // Invalid
        pollutionLevel: 'medium',
        altitude: 150,
      };

      const result = validationService.validateEnvironmentalConditions(envConditions);
      expect(result).toBe(false);
    });

    it('should return false for invalid pollution level', () => {
      const envConditions = {
        humidity: 65,
        pollutionLevel: 'invalid' as any,
        altitude: 150,
      };

      const result = validationService.validateEnvironmentalConditions(envConditions);
      expect(result).toBe(false);
    });

    it('should return false for invalid altitude', () => {
      const envConditions = {
        humidity: 65,
        pollutionLevel: 'medium',
        altitude: 3000, // Invalid
      };

      const result = validationService.validateEnvironmentalConditions(envConditions);
      expect(result).toBe(false);
    });
  });

  describe('validatePhysicalPossibility', () => {
    it('should return true for standard residential voltage', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const result = validationService.validatePhysicalPossibility(params);
      expect(result).toBe(true);
    });

    it('should return false for very high voltage with residential structure', () => {
      const params: CalculationParameters = {
        systemVoltage: 100, // Very high voltage for residential
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const result = validationService.validatePhysicalPossibility(params);
      expect(result).toBe(false);
    });
  });
});