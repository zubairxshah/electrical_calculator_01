import { StandardsComplianceService } from '../standardsCompliance';
import { CalculationParameters } from '../../../models/CalculationParameters';
import { IEC_60099_4, NEC_STANDARDS } from '../../../constants/standards';

describe('StandardsComplianceService', () => {
  let complianceService: StandardsComplianceService;

  beforeEach(() => {
    complianceService = new StandardsComplianceService();
  });

  describe('checkIECCompliance', () => {
    it('should check IEC 60099-4 compliance requirements', () => {
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

      const complianceResults = complianceService.checkIECCompliance(params, 12);

      // Should have multiple IEC compliance checks
      const iecResults = complianceResults.filter(r => r.standard.includes('IEC 60099-4'));
      expect(iecResults.length).toBeGreaterThan(0);

      // Should include checks for residual voltage, withstand voltage, TOV, and cantilever strength
      const requirementTypes = iecResults.map(r => r.requirement);
      expect(requirementTypes).toContain('residual_voltage');
      expect(requirementTypes).toContain('withstand_voltage');
      expect(requirementTypes).toContain('tov');

      // For home structures, cantilever strength should also be checked
      if (params.structureType === 'home' || params.structureType === 'tower') {
        expect(requirementTypes).toContain('cantilever_strength');
      }
    });

    it('should mark compliance as true or false appropriately', () => {
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

      const complianceResults = complianceService.checkIECCompliance(params, 12);

      // Each result should have a compliant property
      complianceResults.forEach(result => {
        expect(typeof result.compliant).toBe('boolean');
      });
    });
  });

  describe('checkNECCompliance', () => {
    it('should check NEC compliance requirements', () => {
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

      const complianceResults = complianceService.checkNECCompliance(params);

      // Should have NEC compliance checks
      const necResults = complianceResults.filter(r => r.standard.includes('NEC'));
      expect(necResults.length).toBeGreaterThan(0);

      // Should include checks for SPD type compliance
      const requirementTypes = necResults.map(r => r.requirement);
      expect(requirementTypes).toContain('spdtype_compliance');
      expect(requirementTypes).toContain('installation_location');
    });

    it('should validate Type 1 SPD compliance', () => {
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

      const complianceResults = complianceService.checkNECCompliance(params);

      const spdTypeResults = complianceResults.filter(r => r.requirement === 'spdtype_compliance');
      expect(spdTypeResults.length).toBeGreaterThan(0);

      // Type 1 should be compliant
      const type1Result = spdTypeResults[0];
      expect(type1Result.compliant).toBe(true);
    });

    it('should validate Type 2 SPD compliance', () => {
      const params: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type2',
      };

      const complianceResults = complianceService.checkNECCompliance(params);

      const spdTypeResults = complianceResults.filter(r => r.requirement === 'spdtype_compliance');
      expect(spdTypeResults.length).toBeGreaterThan(0);

      // Type 2 should be compliant
      const type2Result = spdTypeResults[0];
      expect(type2Result.compliant).toBe(true);
    });
  });

  describe('checkForNonCompliantScenario', () => {
    it('should return recommendations when no compliant solution exists', () => {
      // Mock compliance results with critical failures
      const mockComplianceResults = [
        {
          standard: IEC_60099_4.STANDARD_NAME,
          requirement: 'residual_voltage',
          requiredValue: 36.5,
          calculatedValue: 40, // Exceeds required
          unit: 'kV',
          compliant: false,
          details: 'Residual voltage too high'
        },
        {
          standard: IEC_60099_4.STANDARD_NAME,
          requirement: 'withstand_voltage',
          requiredValue: 28,
          calculatedValue: 25, // Below required
          unit: 'kV',
          compliant: false,
          details: 'Withstand voltage too low'
        }
      ];

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

      const recommendations = complianceService.checkForNonCompliantScenario(params, mockComplianceResults);

      // Should return recommendations
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('No fully compliant arrester type found');
    });

    it('should provide structure-specific recommendations', () => {
      const mockComplianceResults = [
        {
          standard: IEC_60099_4.STANDARD_NAME,
          requirement: 'residual_voltage',
          requiredValue: 36.5,
          calculatedValue: 40,
          unit: 'kV',
          compliant: false,
          details: 'Residual voltage too high'
        }
      ];

      // Test home structure recommendation
      const homeParams: CalculationParameters = {
        systemVoltage: 11,
        structureType: 'home',
        environmentalConditions: {
          humidity: 65,
          pollutionLevel: 'medium',
          altitude: 150,
        },
        complianceRequirement: 'type1',
      };

      const homeRecommendations = complianceService.checkForNonCompliantScenario(homeParams, mockComplianceResults);
      expect(homeRecommendations.some(rec => rec.includes('conventional rods'))).toBe(true);

      // Test tower structure recommendation
      const towerParams: CalculationParameters = {
        systemVoltage: 33,
        structureType: 'tower',
        environmentalConditions: {
          humidity: 70,
          pollutionLevel: 'medium',
          altitude: 500,
        },
        complianceRequirement: 'type2',
      };

      const towerRecommendations = complianceService.checkForNonCompliantScenario(towerParams, mockComplianceResults);
      expect(towerRecommendations.some(rec => rec.includes('ESE rods'))).toBe(true);
    });
  });

  describe('getComplianceSummary', () => {
    it('should return compliance summary with correct counts', () => {
      const mockComplianceResults = [
        {
          standard: IEC_60099_4.STANDARD_NAME,
          requirement: 'residual_voltage',
          requiredValue: 36.5,
          calculatedValue: 32.1,
          unit: 'kV',
          compliant: true
        },
        {
          standard: IEC_60099_4.STANDARD_NAME,
          requirement: 'withstand_voltage',
          requiredValue: 28,
          calculatedValue: 30,
          unit: 'kV',
          compliant: true
        },
        {
          standard: NEC_STANDARDS.STANDARD_NAME,
          requirement: 'spdtype_compliance',
          requiredValue: 1,
          calculatedValue: 1,
          unit: '',
          compliant: true
        }
      ];

      const summary = complianceService.getComplianceSummary(mockComplianceResults);

      expect(summary.iecCompliant).toBe(true);
      expect(summary.necCompliant).toBe(true);
      expect(summary.criticalIssues).toBe(0);
      expect(summary.totalChecks).toBe(3);
    });

    it('should identify non-compliant standards', () => {
      const mockComplianceResults = [
        {
          standard: IEC_60099_4.STANDARD_NAME,
          requirement: 'residual_voltage',
          requiredValue: 36.5,
          calculatedValue: 40, // Non-compliant
          unit: 'kV',
          compliant: false
        },
        {
          standard: NEC_STANDARDS.STANDARD_NAME,
          requirement: 'spdtype_compliance',
          requiredValue: 1,
          calculatedValue: 1,
          unit: '',
          compliant: true
        }
      ];

      const summary = complianceService.getComplianceSummary(mockComplianceResults);

      expect(summary.iecCompliant).toBe(false);
      expect(summary.necCompliant).toBe(true);
      expect(summary.criticalIssues).toBe(1); // residual_voltage is a critical issue
      expect(summary.totalChecks).toBe(2);
    });
  });
});