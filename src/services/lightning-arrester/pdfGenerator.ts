import jsPDF from 'jspdf';
import { CalculationParameters } from '../../models/CalculationParameters';
import { CalculationResult, ComplianceResult } from '../../models/ComplianceResult';
import { IEC_60099_4, NEC_STANDARDS } from '../../constants/standards';

/**
 * Service for generating PDF reports of lightning arrester calculations
 */
export class PdfGeneratorService {

  /**
   * Generate a PDF report for lightning arrester calculations
   * @param calculationParams The input parameters used for calculation
   * @param result The calculation result
   * @returns Blob containing the PDF data
   */
  public async generateReport(calculationParams: CalculationParameters, result: CalculationResult): Promise<Blob> {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(22);
    doc.text('Lightning Arrester Calculation Report', 105, 20, { align: 'center' });

    // Add timestamp and version
    doc.setFontSize(10);
    const timestamp = new Date().toLocaleString();
    doc.text(`Generated: ${timestamp}`, 20, 30);
    doc.text('ElectroMate Engineering Calculator v1.0', 150, 30);

    // Add inputs summary
    doc.setFontSize(14);
    doc.text('Input Parameters:', 20, 45);

    doc.setFontSize(12);
    let yPosition = 55;
    doc.text(`System Voltage: ${calculationParams.systemVoltage} kV`, 20, yPosition);
    yPosition += 5;
    doc.text(`Structure Type: ${calculationParams.structureType}`, 20, yPosition);
    yPosition += 5;
    
    // Add building height for high-rise
    if (calculationParams.buildingHeight) {
      doc.text(`Building Height: ${calculationParams.buildingHeight} m`, 20, yPosition);
      yPosition += 5;
    }
    
    doc.text(`Environmental Conditions:`, 20, yPosition);
    yPosition += 5;
    doc.text(`  Humidity: ${calculationParams.environmentalConditions.humidity}%`, 25, yPosition);
    yPosition += 5;
    doc.text(`  Pollution Level: ${calculationParams.environmentalConditions.pollutionLevel}`, 25, yPosition);
    yPosition += 5;
    doc.text(`  Altitude: ${calculationParams.environmentalConditions.altitude} m`, 25, yPosition);
    yPosition += 5;
    doc.text(`Compliance Requirement: ${calculationParams.complianceRequirement}`, 20, yPosition);
    yPosition += 5;

    // Add results
    doc.setFontSize(14);
    yPosition += 5;
    doc.text('Calculation Results:', 20, yPosition);

    doc.setFontSize(12);
    yPosition += 10;
    doc.text(`Recommended Arrester Type: ${result.arresterType}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Recommended Rating: ${result.rating} kV`, 20, yPosition);
    yPosition += 5;
    doc.text(`Installation: ${result.installationRecommendation}`, 20, yPosition);
    yPosition += 10;

    // Add compliance check results
    doc.setFontSize(14);
    doc.text('Compliance Verification:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    for (const compliance of result.complianceResults) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const statusText = compliance.compliant ? '[PASS]' : '[FAIL]';
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${compliance.standard}: ${compliance.requirement.replace('_', ' ')}`, 20, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`  Required: ${compliance.requiredValue.toFixed(2)} ${compliance.unit}`, 25, yPosition);
      yPosition += 5;
      doc.text(`  Calculated: ${compliance.calculatedValue.toFixed(2)} ${compliance.unit}`, 25, yPosition);
      yPosition += 5;
      
      // Color code the status
      const statusColor = compliance.compliant ? [0, 150, 0] : [200, 0, 0];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`  Status: ${statusText}`, 25, yPosition);
      yPosition += 5;
      doc.setTextColor(0, 0, 0); // Reset to black

      if (compliance.details) {
        const splitDetails = doc.splitTextToSize(`  Details: ${compliance.details}`, 160);
        doc.text(splitDetails, 25, yPosition);
        yPosition += (splitDetails.length * 5) + 2;
      }

      yPosition += 3; // Extra space between checks
    }

    // Add warnings if any
    if (result.warnings && result.warnings.length > 0) {
      yPosition += 5;
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 100, 0); // Orange color
      doc.text('Warnings:', 20, yPosition);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 10;

      for (const warning of result.warnings) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        const splitWarning = doc.splitTextToSize(`• ${warning}`, 160);
        doc.text(splitWarning, 25, yPosition);
        yPosition += (splitWarning.length * 5) + 2;
      }
    }

    // Add standards information
    yPosition += 10;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.text('Applied Standards:', 20, yPosition);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    doc.text(`IEC 60099-4:2018 - ${IEC_60099_4.TITLE}`, 20, yPosition);
    yPosition += 5;
    doc.text(`NEC 2020/2023 - ${NEC_STANDARDS.TITLE}`, 20, yPosition);

    // Add disclaimer
    yPosition += 15;
    
    // Check if we need a new page
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 0, 0); // Dark red color
    const disclaimer = "DISCLAIMER: Calculations for informational purposes only. Professional Engineer (PE) stamp/certification is user's responsibility.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitDisclaimer, 105, yPosition, { align: 'center' });

    // Save as blob
    const pdfData = doc.output('arraybuffer');
    return new Blob([pdfData], { type: 'application/pdf' });
  }

  /**
   * Generate a simplified preview of the calculation for UI display
   * @param calculationParams The input parameters used for calculation
   * @param result The calculation result
   * @returns HTML string for preview display
   */
  public generatePreview(calculationParams: CalculationParameters, result: CalculationResult): string {
    let previewHtml = '<div class="report-preview">';

    previewHtml += '<h3>Lightning Arrester Calculation Report</h3>';
    previewHtml += `<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>`;
    previewHtml += `<p><strong>System Voltage:</strong> ${calculationParams.systemVoltage} kV</p>`;
    previewHtml += `<p><strong>Structure Type:</strong> ${calculationParams.structureType}</p>`;
    previewHtml += `<p><strong>Recommended Arrester:</strong> ${result.arresterType} (${result.rating} kV)</p>`;
    previewHtml += `<p><strong>Installation:</strong> ${result.installationRecommendation}</p>`;

    // Add compliance summary
    const compliantResults = result.complianceResults.filter(cr => cr.compliant);
    const nonCompliantResults = result.complianceResults.filter(cr => !cr.compliant);

    previewHtml += '<div class="compliance-summary">';
    previewHtml += `<p><strong>Compliance Summary:</strong> ${compliantResults.length}/${result.complianceResults.length} checks passed</p>`;

    if (nonCompliantResults.length > 0) {
      previewHtml += '<p style="color: #ff0000;">⚠ Non-compliant requirements detected:</p>';
      previewHtml += '<ul>';
      nonCompliantResults.forEach(cr => {
        previewHtml += `<li>${cr.standard}: ${cr.requirement}</li>`;
      });
      previewHtml += '</ul>';
    }

    previewHtml += '</div>';

    // Add warnings
    if (result.warnings && result.warnings.length > 0) {
      previewHtml += '<div class="warnings">';
      previewHtml += '<p><strong>Warnings:</strong></p>';
      previewHtml += '<ul>';
      result.warnings.forEach(warning => {
        previewHtml += `<li>${warning}</li>`;
      });
      previewHtml += '</ul>';
      previewHtml += '</div>';
    }

    previewHtml += `<p><em>Standards applied: ${IEC_60099_4.STANDARD_NAME}, ${NEC_STANDARDS.STANDARD_NAME}</em></p>`;
    previewHtml += '<p><small>DISCLAIMER: Calculations for informational purposes only. Professional Engineer (PE) stamp/certification is user\'s responsibility.</small></p>';

    previewHtml += '</div>';

    return previewHtml;
  }

  /**
   * Generate a summary report for quick viewing
   * @param calculationParams The input parameters used for calculation
   * @param result The calculation result
   * @returns Object containing summary information
   */
  public generateSummary(calculationParams: CalculationParameters, result: CalculationResult): {
    summary: string;
    complianceScore: number;
    criticalIssues: number;
    recommendations: string[];
  } {
    const totalChecks = result.complianceResults.length;
    const compliantChecks = result.complianceResults.filter(cr => cr.compliant).length;
    const complianceScore = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 100;

    const criticalIssues = result.complianceResults.filter(
      cr => !cr.compliant &&
      (cr.requirement === 'residual_voltage' ||
       cr.requirement === 'withstand_voltage' ||
       cr.requirement === 'tov')
    ).length;

    const recommendations = [result.installationRecommendation, ...result.warnings];

    const summary = `
      Lightning Arrester Calculation Summary:
      - System Voltage: ${calculationParams.systemVoltage} kV
      - Recommended Arrester: ${result.arresterType} (${result.rating} kV)
      - Compliance Score: ${complianceScore.toFixed(1)}%
      - Critical Issues: ${criticalIssues}
      - Structure Type: ${calculationParams.structureType}
    `;

    return {
      summary: summary.trim(),
      complianceScore,
      criticalIssues,
      recommendations
    };
  }
}