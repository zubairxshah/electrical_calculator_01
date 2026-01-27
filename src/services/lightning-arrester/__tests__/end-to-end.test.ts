import { LightningArresterCalculationEngine } from '../calculationEngine';
import { LightningArresterValidationService } from '../validation';
import { StandardsComplianceService } from '../standardsCompliance';
import { PdfGeneratorService } from '../pdfGenerator';
import { CalculationParameters } from '../../models/CalculationParameters';

describe('Lightning Arrester Calculator - End to End', () => {
  let calculationEngine: LightningArresterCalculationEngine;
  let validationService: LightningArresterValidationService;
  let complianceService: StandardsComplianceService;
  let pdfService: PdfGeneratorService;

  beforeAll(() => {
    calculationEngine = new LightningArresterCalculationEngine();
    validationService = new LightningArresterValidationService();
    complianceService = new StandardsComplianceService();
    pdfService = new PdfGeneratorService();
  });

  it('should complete a full calculation cycle for home structure', async () => {
    // Input parameters for a home structure
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

    // Step 1: Validate inputs
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Step 2: Get warnings for unusual values
    const warnings = validationService.getWarnings(params);
    expect(Array.isArray(warnings)).toBeTruthy();

    // Step 3: Perform calculation
    const result = calculationEngine.calculate(params);

    // Step 4: Verify calculation results
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(0);
    expect(result.complianceResults).toBeDefined();
    expect(result.complianceResults.length).toBeGreaterThan(0);
    expect(result.installationRecommendation).toBeDefined();
    expect(Array.isArray(result.warnings)).toBeTruthy();
    expect(result.calculationTimestamp).toBeInstanceOf(Date);

    // Step 5: Check compliance
    const iecCompliance = complianceService.checkIECCompliance(params, result.rating);
    const necCompliance = complianceService.checkNECCompliance(params);

    expect(iecCompliance.length).toBeGreaterThan(0);
    expect(necCompliance.length).toBeGreaterThan(0);

    // Step 6: Generate report preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toContain('Lightning Arrester Calculation Report');
    expect(preview).toContain(params.structureType);

    // Step 7: Generate summary
    const summary = pdfService.generateSummary(params, result);
    expect(summary.summary).toContain('Lightning Arrester Calculation Summary');
    expect(typeof summary.complianceScore).toBe('number');
    expect(Array.isArray(summary.recommendations)).toBeTruthy();

    // Step 8: Generate PDF (just verify it doesn't throw)
    const pdfBlob = await pdfService.generateReport(params, result);
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should complete a full calculation cycle for tower structure', async () => {
    // Input parameters for a tower structure
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

    // Validate inputs
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Perform calculation
    const result = calculationEngine.calculate(params);

    // Verify calculation results
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(params.systemVoltage);
    expect(result.complianceResults).toBeDefined();

    // Generate report preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toContain('tower');
    expect(preview).toContain('ESE rods'); // Expected for tower structures

    // Generate PDF
    const pdfBlob = await pdfService.generateReport(params, result);
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should complete a full calculation cycle for industrial structure', async () => {
    // Input parameters for an industrial structure
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

    // Validate inputs
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Perform calculation
    const result = calculationEngine.calculate(params);

    // Verify calculation results
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(params.systemVoltage);
    expect(result.complianceResults).toBeDefined();

    // Generate report preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toContain('industry');
    expect(preview).toContain('MOV arresters'); // Expected for industrial structures

    // Generate PDF
    const pdfBlob = await pdfService.generateReport(params, result);
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should handle edge cases gracefully', async () => {
    // Test with minimum valid values
    const params: CalculationParameters = {
      systemVoltage: 0.23, // Minimum voltage
      structureType: 'home',
      environmentalConditions: {
        humidity: 0, // Minimum humidity
        pollutionLevel: 'light', // Light pollution
        altitude: 0, // Sea level
      },
      complianceRequirement: 'type1',
    };

    // Validate inputs
    const validationErrors = validationService.validate(params);
    expect(validationErrors).toHaveLength(0);

    // Perform calculation - should not throw
    const result = calculationEngine.calculate(params);
    expect(result.arresterType).toBeDefined();
    expect(result.rating).toBeGreaterThan(0);

    // Generate report preview
    const preview = pdfService.generatePreview(params, result);
    expect(preview).toContain('Lightning Arrester Calculation Report');

    // Generate PDF
    const pdfBlob = await pdfService.generateReport(params, result);
    expect(pdfBlob).toBeInstanceOf(Blob);
  });
});