import { LightningArresterCalculationEngine } from '../calculationEngine';
import { LightningArresterValidationService } from '../validation';
import { CalculationParameters } from '../../models/CalculationParameters';
import { VALIDATION_RULES } from '../../models/CalculationParameters';

describe('LightningArresterCalculationEngine', () => {
  let calculationEngine: LightningArresterCalculationEngine;
  let validationService: LightningArresterValidationService;

  beforeEach(() => {
    calculationEngine = new LightningArresterCalculationEngine();
    validationService = new LightningArresterValidationService();
  });

  describe('Validation', () => {
    it('should validate valid calculation parameters', () => {
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

    it('should reject invalid system voltage', () => {
      const params: CalculationParameters = {
        systemVoltage: 50, // Above max allowed
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

    it('should reject invalid humidity values', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 120, // Above max allowed
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const errors = validationService.validate(params);
      expect(errors).toContain(`Humidity must be a number between ${VALIDATION_RULES.MIN_HUMIDITY}% and ${VALIDATION_RULES.MAX_HUMIDITY}%`);
    });

    it('should return warnings for unusual values', () => {
      const params: CalculationParameters = {
        systemVoltage: 40, // Unusually high
        structureType: 'home',
        environmentalConditions: {
          humidity: 95, // High humidity
          pollutionLevel: 'heavy',
          altitude: 1800, // High altitude
        },
        complianceRequirement: 'type1',
      };

      const warnings = validationService.getWarnings(params);
      expect(warnings).toContain(`High voltage detected (${params.systemVoltage}kV). Verify application suitability.`);
      expect(warnings).toContain(`High humidity detected (${params.environmentalConditions.humidity}%). Consider environmental protection.`);
      expect(warnings).toContain(`High altitude detected (${params.environmentalConditions.altitude}m). De-rating may be required.`);
    });
  });

  describe('Calculation', () => {
    it('should calculate appropriate arrester for home structure', () => {
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

      const result = calculationEngine.calculate(params);

      // Verify basic properties exist
      expect(result.arresterType).toBeDefined();
      expect(result.rating).toBeGreaterThan(0);
      expect(result.complianceResults).toBeDefined();
      expect(Array.isArray(result.complianceResults)).toBeTruthy();
      expect(result.installationRecommendation).toBeDefined();
      expect(Array.isArray(result.warnings)).toBeTruthy();
      expect(result.calculationTimestamp).toBeInstanceOf(Date);

      // For home structures, we expect conventional or MOV type
      expect(['conventional', 'mov']).toContain(result.arresterType);
    });

    it('should calculate appropriate arrester for tower structure', () => {
      const params: CalculationParameters = {
        systemVoltage: 33,
        structureType: 'tower',
        environmentalConditions: {
          humidity: 70,
          pollutionLevel: 'medium',
          altitude: 500,
        },
        complianceRequirement: 'type2',
      };

      const result = calculationEngine.calculate(params);

      // Verify basic properties exist
      expect(result.arresterType).toBeDefined();
      expect(result.rating).toBeGreaterThan(0);
      expect(result.complianceResults).toBeDefined();
      expect(Array.isArray(result.complianceResults)).toBeTruthy();
      expect(result.installationRecommendation).toBeDefined();
      expect(Array.isArray(result.warnings)).toBeTruthy();
      expect(result.calculationTimestamp).toBeInstanceOf(Date);

      // For tower structures, we expect ESE or MOV type
      expect(['ese', 'mov']).toContain(result.arresterType);
    });

    it('should perform compliance checks', () => {
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

      const result = calculationEngine.calculate(params);

      // Should have compliance results for IEC and NEC standards
      expect(result.complianceResults.length).toBeGreaterThan(0);

      // Check that some results are for IEC 60099-4
      const iecResults = result.complianceResults.filter(r => r.standard.includes('IEC 60099-4'));
      expect(iecResults.length).toBeGreaterThan(0);

      // Check that some results are for NEC
      const necResults = result.complianceResults.filter(r => r.standard.includes('NEC'));
      expect(necResults.length).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
      // Test with minimum valid values
      const params: CalculationParameters = {
        systemVoltage: VALIDATION_RULES.MIN_VOLTAGE,
        structureType: 'home',
        environmentalConditions: {
          humidity: VALIDATION_RULES.MIN_HUMIDITY,
          pollutionLevel: 'light',
          altitude: VALIDATION_RULES.MIN_ALTITUDE,
        },
        complianceRequirement: 'type1',
      };

      expect(() => calculationEngine.calculate(params)).not.toThrow();
    });
  });
});