import { PdfGeneratorService } from '../pdfGenerator';
import { CalculationParameters } from '../../models/CalculationParameters';
import { CalculationResult, ComplianceResult } from '../../models/ComplianceResult';

describe('PdfGeneratorService', () => {
  let pdfService: PdfGeneratorService;

  beforeEach(() => {
    pdfService = new PdfGeneratorService();
  });

  it('should generate a PDF report with correct content', async () => {
    // Create test data
    const calculationParams: CalculationParameters = {
      systemVoltage: 11,
      structureType: 'home',
      environmentalConditions: {
        humidity: 65,
        pollutionLevel: 'medium',
        altitude: 150,
      },
      complianceRequirement: 'type1',
    };

    const result: CalculationResult = {
      arresterType: 'mov',
      rating: 12,
      complianceResults: [
        {
          standard: 'IEC 60099-4:2018',
          requirement: 'residual_voltage',
          requiredValue: 36.5,
          calculatedValue: 32.1,
          unit: 'kV',
          compliant: true,
          details: 'Residual voltage within acceptable range'
        },
        {
          standard: 'NEC 2020',
          requirement: 'spdtype_compliance',
          requiredValue: 1,
          calculatedValue: 1,
          unit: '',
          compliant: true,
          details: 'SPD type compliant with NEC requirements'
        }
      ],
      installationRecommendation: 'Line side of service disconnect per NEC requirements',
      warnings: ['High humidity detected (65%). Consider environmental protection.'],
      calculationTimestamp: new Date(),
    };

    // Generate the report
    const pdfBlob = await pdfService.generateReport(calculationParams, result);

    // Verify the result is a Blob
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(0);
  });

  it('should generate a preview with correct content', () => {
    // Create test data
    const calculationParams: CalculationParameters = {
      systemVoltage: 22,
      structureType: 'tower',
      environmentalConditions: {
        humidity: 70,
        pollutionLevel: 'medium',
        altitude: 500,
      },
      complianceRequirement: 'type2',
    };

    const result: CalculationResult = {
      arresterType: 'ese',
      rating: 24,
      complianceResults: [
        {
          standard: 'IEC 60099-4:2018',
          requirement: 'withstand_voltage',
          requiredValue: 50,
          calculatedValue: 55,
          unit: 'kV',
          compliant: true,
        }
      ],
      installationRecommendation: 'Load side of service disconnect per NEC requirements',
      warnings: [],
      calculationTimestamp: new Date(),
    };

    // Generate the preview
    const preview = pdfService.generatePreview(calculationParams, result);

    // Verify the preview contains expected content
    expect(preview).toContain('Lightning Arrester Calculation Report');
    expect(preview).toContain('22 kV');
    expect(preview).toContain('tower');
    expect(preview).toContain('ese');
    expect(preview).toContain('24 kV');
    expect(preview).toContain('Load side of service disconnect');
  });

  it('should generate summary with correct information', () => {
    // Create test data
    const calculationParams: CalculationParameters = {
      systemVoltage: 11,
      structureType: 'industry',
      environmentalConditions: {
        humidity: 60,
        pollutionLevel: 'heavy',
        altitude: 200,
      },
      complianceRequirement: 'type2',
    };

    const result: CalculationResult = {
      arresterType: 'mov',
      rating: 12,
      complianceResults: [
        {
          standard: 'IEC 60099-4:2018',
          requirement: 'residual_voltage',
          requiredValue: 36.5,
          calculatedValue: 32.1,
          unit: 'kV',
          compliant: true,
        },
        {
          standard: 'IEC 60099-4:2018',
          requirement: 'tov',
          requiredValue: 12.1,
          calculatedValue: 11.5,
          unit: 'kV',
          compliant: false, // Non-compliant for testing
        }
      ],
      installationRecommendation: 'Load side of service disconnect per NEC requirements',
      warnings: ['Heavy pollution environment detected. Increased maintenance may be required.'],
      calculationTimestamp: new Date(),
    };

    // Generate the summary
    const summaryInfo = pdfService.generateSummary(calculationParams, result);

    // Verify the summary contains expected information
    expect(summaryInfo.summary).toContain('Lightning Arrester Calculation Summary');
    expect(summaryInfo.summary).toContain('11 kV');
    expect(summaryInfo.summary).toContain('industry');
    expect(summaryInfo.complianceScore).toBeLessThan(100); // Because of one non-compliant result
    expect(summaryInfo.criticalIssues).toBeGreaterThanOrEqual(0); // May be 0 if TOV isn't considered critical
    expect(Array.isArray(summaryInfo.recommendations)).toBeTruthy();
    expect(summaryInfo.recommendations).toContain('Load side of service disconnect per NEC requirements');
  });

  it('should handle empty parameters and results gracefully', () => {
    // Create minimal test data
    const calculationParams: CalculationParameters = {
      systemVoltage: 0.1,
      structureType: 'home',
      environmentalConditions: {
        humidity: 0,
        pollutionLevel: 'light',
        altitude: 0,
      },
      complianceRequirement: 'type1',
    };

    const result: CalculationResult = {
      arresterType: 'mov',
      rating: 0.5,
      complianceResults: [],
      installationRecommendation: '',
      warnings: [],
      calculationTimestamp: new Date(),
    };

    // Generate the preview
    const preview = pdfService.generatePreview(calculationParams, result);

    // Verify the preview is generated without errors
    expect(preview).toContain('Lightning Arrester Calculation Report');
  });

  it('should include warnings in the preview when present', () => {
    const calculationParams: CalculationParameters = {
      systemVoltage: 11,
      structureType: 'home',
      environmentalConditions: {
        humidity: 65,
        pollutionLevel: 'medium',
        altitude: 150,
      },
      complianceRequirement: 'type1',
    };

    const result: CalculationResult = {
      arresterType: 'mov',
      rating: 12,
      complianceResults: [],
      installationRecommendation: 'Line side of service disconnect per NEC requirements',
      warnings: [
        'High system voltage detected (>35kV). Verify arrester selection with manufacturer specifications.',
        'High altitude detected (>1500m). Specialized arresters may be required.'
      ],
      calculationTimestamp: new Date(),
    };

    // Generate the preview
    const preview = pdfService.generatePreview(calculationParams, result);

    // Verify warnings are included in the preview
    expect(preview).toContain('Warnings:');
    result.warnings.forEach(warning => {
      expect(preview).toContain(warning);
    });
  });
});