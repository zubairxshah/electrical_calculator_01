import { LightningArresterCalculationEngine } from '../calculationEngine';
import { LightningArresterValidationService } from '../validation';
import { StandardsComplianceService } from '../standardsCompliance';
import { PdfGeneratorService } from '../pdfGenerator';
import { CalculationParameters } from '../../../models/CalculationParameters';

describe('End-to-End Integration Test', () => {
  let calculationEngine: LightningArresterCalculationEngine;
  let validationService: LightningArresterValidationService;
  let complianceService: StandardsComplianceService;
  let pdfService: PdfGeneratorService;

  beforeEach(() => {
    calculationEngine = new LightningArresterCalculationEngine();
    validationService = new LightningArresterValidationService();
    complianceService = new StandardsComplianceService();
    pdfService = new PdfGeneratorService();
  });

  it('should successfully process a complete lightning arrester calculation workflow', () => {
    // Define test parameters
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

    // Step 1: Validate parameters
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Step 2: Perform calculation
    const result = calculationEngine.calculate(params);

    // Verify calculation result structure
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(0);
    expect(result.complianceResults).toBeDefined();
    expect(result.complianceResults.length).toBeGreaterThan(0);
    expect(result.installationRecommendation).toBeDefined();
    expect(Array.isArray(result.warnings)).toBeTruthy();
    expect(result.calculationTimestamp).toBeInstanceOf(Date);

    // Step 3: Check compliance
    const iecCompliance = complianceService.checkIECCompliance(params, result.rating);
    const necCompliance = complianceService.checkNECCompliance(params);

    // Combine compliance results
    const allCompliance = [...iecCompliance, ...necCompliance];
    expect(allCompliance.length).toBeGreaterThan(0);

    // Get compliance summary
    const summary = complianceService.getComplianceSummary(result.complianceResults);
    expect(summary.totalChecks).toBeGreaterThan(0);

    // Step 4: Generate report preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toBeDefined();
    expect(typeof preview).toBe('string');
    expect(preview).toContain('Lightning Arrester Calculation Report');

    // Step 5: Generate summary
    const summaryInfo = pdfService.generateSummary(params, result);
    expect(summaryInfo.summary).toBeDefined();
    expect(typeof summaryInfo.complianceScore).toBe('number');
    expect(Array.isArray(summaryInfo.recommendations)).toBeTruthy();
  });

  it('should handle tower structure type correctly', () => {
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

    // Validate parameters
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Perform calculation
    const result = calculationEngine.calculate(params);

    // Verify result
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(params.systemVoltage);
    expect(result.complianceResults).toBeDefined();

    // Generate preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toContain('Tower');

    // Generate summary
    const summaryInfo = pdfService.generateSummary(params, result);
    expect(summaryInfo.summary).toContain('tower');
  });

  it('should handle industrial structure type correctly', () => {
    const params: CalculationParameters = {
      systemVoltage: 22,
      structureType: 'industry',
      environmentalConditions: {
        humidity: 60,
        pollutionLevel: 'heavy',
        altitude: 200,
      },
      complianceRequirement: 'type2',
    };

    // Validate parameters
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Perform calculation
    const result = calculationEngine.calculate(params);

    // Verify result
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(params.systemVoltage);
    expect(result.complianceResults).toBeDefined();

    // Generate preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toContain('Industrial');

    // Generate summary
    const summaryInfo = pdfService.generateSummary(params, result);
    expect(summaryInfo.summary).toContain('industry');
  });

  it('should generate warnings for unusual parameters', () => {
    const params: CalculationParameters = {
      systemVoltage: 45, // Unusually high for home
      structureType: 'home',
      environmentalConditions: {
        humidity: 95, // High humidity
        pollutionLevel: 'heavy', // Heavy pollution
        altitude: 1800, // High altitude
      },
      complianceRequirement: 'type1',
    };

    // Get warnings
    const warnings = validationService.getWarnings(params);
    expect(warnings).toContain(`High voltage detected (${params.systemVoltage}kV). Verify application suitability.`);
    expect(warnings).toContain(`High altitude detected (${params.environmentalConditions.altitude}m). De-rating may be required.`);
    expect(warnings).toContain('Heavy pollution environment detected. Increased maintenance may be required.');

    // Perform calculation (should still work despite warnings)
    const result = calculationEngine.calculate(params);
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(0);
  });

  it('should handle non-compliant scenarios gracefully', () => {
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

    // Perform calculation
    const result = calculationEngine.calculate(params);

    // Check for non-compliant scenarios
    const recommendations = complianceService.checkForNonCompliantScenario(params, result.complianceResults);

    // Even if compliant, the function should return an array without errors
    expect(Array.isArray(recommendations)).toBeTruthy();
  });
});