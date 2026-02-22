import { LightningArresterCalculationEngine } from '../calculationEngine';
import { LightningArresterValidationService } from '../validation';
import { CalculationParameters, VALIDATION_RULES } from '../../../models/CalculationParameters';

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

    it('should calculate ESE arrester for high-rise structure', () => {
      const params: CalculationParameters = {
        systemVoltage: 33,
        structureType: 'highrise',
        buildingHeight: 80, // 80 meters tall building
        environmentalConditions: {
          humidity: 60,
          pollutionLevel: 'medium',
          altitude: 100,
        },
        complianceRequirement: 'type1',
      };

      const result = calculationEngine.calculate(params);

      // For high-rise structures, we expect ESE type
      expect(result.arresterType).toBe('ese');
      expect(result.rating).toBeGreaterThan(33); // Rating should be higher than system voltage
      expect(result.complianceResults).toBeDefined();
      
      // Should have wind load compliance check for high-rise
      const windLoadCheck = result.complianceResults.find(r => r.requirement === 'wind_load_factor');
      expect(windLoadCheck).toBeDefined();
      expect(windLoadCheck?.calculatedValue).toBeGreaterThan(1.0); // Wind load factor > 1 for 80m building
      
      // Should have higher cantilever strength requirement (1000 kg vs 500 kg)
      const cantileverCheck = result.complianceResults.find(r => r.requirement === 'cantilever_strength');
      expect(cantileverCheck).toBeDefined();
      expect(cantileverCheck?.requiredValue).toBe(1000); // High-rise requires 1000 kg
    });

    it('should generate side flash warning for very tall buildings', () => {
      const params: CalculationParameters = {
        systemVoltage: 33,
        structureType: 'highrise',
        buildingHeight: 100, // Above 60m side flash threshold
        environmentalConditions: {
          humidity: 60,
          pollutionLevel: 'light',
          altitude: 100,
        },
        complianceRequirement: 'type1',
      };

      const result = calculationEngine.calculate(params);

      // Should have side flash warning
      expect(result.warnings).toContainEqual(
        expect.stringContaining('SIDE FLASH RISK')
      );
      expect(result.warnings).toContainEqual(
        expect.stringContaining('60m')
      );
    });

    it('should apply enhanced pollution factors for high-rise', () => {
      const params: CalculationParameters = {
        systemVoltage: 33,
        structureType: 'highrise',
        buildingHeight: 30,
        environmentalConditions: {
          humidity: 60,
          pollutionLevel: 'heavy',
          altitude: 100,
        },
        complianceRequirement: 'type1',
      };

      const result = calculationEngine.calculate(params);

      // Heavy pollution for high-rise should apply 2.5 factor
      // Rating should be significantly higher due to pollution factor
      expect(result.rating).toBeGreaterThan(33 * 1.35); // Base multiplier is 1.35 for high-rise
    });
  });
});