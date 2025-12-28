/**
 * Breaker Calculator PDF Generator
 *
 * Generates professional PDF reports for circuit breaker sizing calculations.
 * Extends the base PDF generator with breaker-specific sections:
 * - Project information header
 * - Circuit configuration inputs
 * - Load analysis with formula
 * - Breaker sizing recommendations
 * - Voltage drop analysis (if applicable)
 * - Derating factors breakdown (if applicable)
 * - Code section references
 * - Professional disclaimer
 *
 * Uses jsPDF for client-side generation per ADR-004
 *
 * @module breakerPdfGenerator
 */

import jsPDF from 'jspdf';
import type {
  CircuitConfiguration,
  CalculationResults,
  ProjectInformation,
  VoltageDropAnalysis,
  DeratingFactorsResult,
} from '@/types/breaker-calculator';

/**
 * Breaker-specific PDF generation options
 */
export interface BreakerPDFOptions {
  /** Circuit configuration used for the calculation */
  circuit: CircuitConfiguration;
  /** Complete calculation results */
  results: CalculationResults;
  /** Optional project information */
  project?: ProjectInformation;
  /** Include calculation formulas */
  includeFormulas?: boolean;
  /** Include disclaimer footer */
  includeDisclaimer?: boolean;
}

/**
 * Generate breaker sizing calculation PDF report
 *
 * @param options - PDF generation options
 * @returns Blob containing PDF data
 *
 * @example
 * ```typescript
 * const pdf = await generateBreakerPDF({
 *   circuit: { standard: 'NEC', voltage: 240, ... },
 *   results: calculationResults,
 *   project: { projectName: 'Building A', engineerName: 'John Doe' }
 * });
 *
 * // Download
 * const url = URL.createObjectURL(pdf);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'breaker-sizing-2024-12-28.pdf';
 * a.click();
 * ```
 */
export async function generateBreakerPDF(
  options: BreakerPDFOptions
): Promise<Blob> {
  const {
    circuit,
    results,
    project,
    includeFormulas = true,
    includeDisclaimer = true,
  } = options;

  const startTime = performance.now();

  // Create PDF document (A4, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // ==========================================================================
  // HEADER
  // ==========================================================================

  // ElectroMate branding
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('ElectroMate', margin, yPosition);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Electrical Engineering Calculations', margin, yPosition + 6);

  doc.setFontSize(8);
  doc.text('Circuit Breaker Sizing Report', pageWidth - margin - 40, yPosition);

  yPosition += 12;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // ==========================================================================
  // PROJECT INFORMATION (if provided)
  // ==========================================================================

  if (project && (project.projectName || project.engineerName || project.projectLocation)) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Project Information', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    if (project.projectName) {
      doc.text(`Project: ${project.projectName}`, margin + 5, yPosition);
      yPosition += 5;
    }
    if (project.projectLocation) {
      doc.text(`Location: ${project.projectLocation}`, margin + 5, yPosition);
      yPosition += 5;
    }
    if (project.engineerName) {
      doc.text(`Engineer: ${project.engineerName}`, margin + 5, yPosition);
      yPosition += 5;
    }

    yPosition += 5;
  }

  // ==========================================================================
  // TITLE AND METADATA
  // ==========================================================================

  // Calculation title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Circuit Breaker Sizing Calculation', margin, yPosition);
  yPosition += 8;

  // Standard badge
  const standardBadge = circuit.standard === 'NEC' ? 'NEC 2020' : 'IEC 60364-5-52';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Standard: ${standardBadge}`, margin, yPosition);
  yPosition += 5;

  // Timestamp
  doc.text(`Date: ${new Date(results.calculatedAt).toLocaleString()}`, margin, yPosition);
  yPosition += 5;

  // Calculation version
  doc.text(`Version: ${results.calculationVersion}`, margin, yPosition);
  yPosition += 10;

  // ==========================================================================
  // INPUT PARAMETERS
  // ==========================================================================

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Input Parameters', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  // Circuit configuration inputs
  const phaseLabel = circuit.phase === 'three' ? 'Three-Phase' : 'Single-Phase';
  doc.text(`Voltage: ${circuit.voltage} V (${phaseLabel})`, margin + 5, yPosition);
  yPosition += 5;

  const loadLabel = circuit.loadMode === 'kw' ? 'Power' : 'Current';
  const loadValue = circuit.loadMode === 'kw'
    ? `${circuit.loadValue} kW`
    : `${circuit.loadValue} A`;
  doc.text(`Load (${loadLabel}): ${loadValue}`, margin + 5, yPosition);
  yPosition += 5;

  doc.text(`Power Factor: ${circuit.powerFactor.toFixed(2)}`, margin + 5, yPosition);
  yPosition += 5;

  doc.text(`Unit System: ${circuit.unitSystem === 'metric' ? 'Metric (IEC)' : 'Imperial (NEC)'}`, margin + 5, yPosition);
  yPosition += 5;

  // Environmental factors (if provided)
  const hasEnvironment = results.deratingFactors?.applied ||
    (results.voltageDropAnalysis && results.voltageDropAnalysis.performed);

  if (hasEnvironment) {
    yPosition += 5;
    doc.setFont('helvetica', 'italic');
    doc.text('Environmental Factors Applied:', margin + 5, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');

    if (results.deratingFactors?.applied) {
      if (results.deratingFactors.temperatureFactor?.ambient !== undefined) {
        doc.text(`  Ambient Temperature: ${results.deratingFactors.temperatureFactor.ambient}°C`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (results.deratingFactors.groupingFactor?.cableCount !== undefined) {
        doc.text(`  Grouped Cables: ${results.deratingFactors.groupingFactor.cableCount}`, margin + 5, yPosition);
        yPosition += 5;
      }
    }

    if (results.voltageDropAnalysis && results.voltageDropAnalysis.performed) {
      doc.text(`  Circuit Distance: ${results.voltageDropAnalysis.circuitDistance}`, margin + 5, yPosition);
      yPosition += 5;
      if (results.voltageDropAnalysis.conductorSize) {
        doc.text(`  Conductor Size: ${results.voltageDropAnalysis.conductorSize}`, margin + 5, yPosition);
        yPosition += 5;
      }
    }
  }

  yPosition += 5;

  // ==========================================================================
  // LOAD ANALYSIS
  // ==========================================================================

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Load Analysis', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  doc.text(`Calculated Load Current: ${results.loadAnalysis.calculatedCurrentAmps.toFixed(2)} A`, margin + 5, yPosition);
  yPosition += 5;

  doc.text(`Continuous Load Factor: ${results.loadAnalysis.continuousLoadFactor.toFixed(2)}× (${circuit.standard === 'NEC' ? 'NEC 125%' : 'IEC standard'})`, margin + 5, yPosition);
  yPosition += 5;

  if (includeFormulas) {
    yPosition += 3;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(`Formula: ${results.loadAnalysis.formula}`, margin + 5, yPosition, {
      maxWidth: pageWidth - 2 * margin - 10,
    });
    yPosition += 6;
  }

  yPosition += 5;

  // ==========================================================================
  // BREAKER SIZING
  // ==========================================================================

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Breaker Sizing Recommendation', margin, yPosition);
  yPosition += 8;

  // Minimum required
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Minimum Required: ${results.breakerSizing.minimumBreakerSizeAmps.toFixed(1)} A`, margin + 5, yPosition);
  yPosition += 7;

  // Recommended size (highlighted)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 0);
  doc.text(`Recommended Breaker: ${results.breakerSizing.recommendedBreakerAmps} A`, margin + 5, yPosition);
  yPosition += 8;

  // Safety factor details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Safety Factor Applied: ${results.breakerSizing.safetyFactor.toFixed(3)}`, margin + 5, yPosition);
  yPosition += 5;

  doc.text(`Code Reference: ${results.recommendations.primaryBreaker.codeSection}`, margin + 5, yPosition);
  yPosition += 5;

  // Breaker specification
  doc.text(`Breaking Capacity: ${results.recommendations.primaryBreaker.breakingCapacityKA} kA`, margin + 5, yPosition);
  yPosition += 5;

  if (results.recommendations.primaryBreaker.tripCurve) {
    doc.text(`Trip Curve: Type ${results.recommendations.primaryBreaker.tripCurve}`, margin + 5, yPosition);
    yPosition += 5;
  } else if (results.recommendations.primaryBreaker.tripType) {
    doc.text(`Trip Type: ${results.recommendations.primaryBreaker.tripType}`, margin + 5, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // ==========================================================================
  // VOLTAGE DROP ANALYSIS (if performed)
  // ==========================================================================

  if (results.voltageDropAnalysis && results.voltageDropAnalysis.performed) {
    // Check if we need a new page
    if (yPosition > pageHeight - 70) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Voltage Drop Analysis', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    doc.text(`Voltage Drop: ${results.voltageDropAnalysis.voltageDrop.toFixed(2)} V (${results.voltageDropAnalysis.voltageDropPercent.toFixed(2)}%)`, margin + 5, yPosition);
    yPosition += 5;

    doc.text(`Status: ${results.voltageDropAnalysis.assessment}`, margin + 5, yPosition);
    yPosition += 5;

    doc.text(`Limit (Branch Circuit): ${results.voltageDropAnalysis.limitBranchCircuit}%`, margin + 5, yPosition);
    yPosition += 5;
    doc.text(`Limit (Combined): ${results.voltageDropAnalysis.limitCombined}%`, margin + 5, yPosition);
    yPosition += 5;

    if (results.voltageDropAnalysis.recommendedCableSize) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 0);
      doc.text(`Recommended Cable Upgrade: ${results.voltageDropAnalysis.recommendedCableSize}`, margin + 5, yPosition);
      yPosition += 5;
      if (results.voltageDropAnalysis.recommendedVDPercent) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`  (Would reduce VD to ${results.voltageDropAnalysis.recommendedVDPercent.toFixed(2)}%)`, margin + 5, yPosition);
        yPosition += 5;
      }
    }

    yPosition += 5;
  }

  // ==========================================================================
  // DERATING FACTORS (if applied)
  // ==========================================================================

  if (results.deratingFactors && results.deratingFactors.applied) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Derating Factors', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    // Temperature factor
    if (results.deratingFactors.temperatureFactor) {
      doc.text(`Temperature Factor: ${(results.deratingFactors.temperatureFactor.factor * 100).toFixed(0)}%`, margin + 5, yPosition);
      yPosition += 5;
      if (results.deratingFactors.temperatureFactor.ambient !== undefined) {
        doc.setFontSize(8);
        doc.text(`  Ambient: ${results.deratingFactors.temperatureFactor.ambient}°C`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (results.deratingFactors.temperatureFactor.codeReference) {
        doc.text(`  Reference: ${results.deratingFactors.temperatureFactor.codeReference}`, margin + 5, yPosition);
        yPosition += 5;
      }
      doc.setFontSize(9);
    }

    // Grouping factor
    if (results.deratingFactors.groupingFactor) {
      doc.text(`Grouping Factor: ${(results.deratingFactors.groupingFactor.factor * 100).toFixed(0)}%`, margin + 5, yPosition);
      yPosition += 5;
      if (results.deratingFactors.groupingFactor.cableCount !== undefined) {
        doc.setFontSize(8);
        doc.text(`  Conductors: ${results.deratingFactors.groupingFactor.cableCount}`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (results.deratingFactors.groupingFactor.codeReference) {
        doc.text(`  Reference: ${results.deratingFactors.groupingFactor.codeReference}`, margin + 5, yPosition);
        yPosition += 5;
      }
      doc.setFontSize(9);
    }

    // Combined factor
    yPosition += 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Combined Derating Factor: ${(results.deratingFactors.combinedFactor * 100).toFixed(0)}%`, margin + 5, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Adjusted Breaker Size: ${results.deratingFactors.adjustedBreakerSizeAmps.toFixed(1)} A`, margin + 5, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // ==========================================================================
  // ENGINEERING RECOMMENDATIONS
  // ==========================================================================

  // Check if we need a new page
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Engineering Recommendations', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  doc.text(`Breaker Type: ${results.recommendations.breakerTypeGuidance.recommendedType}`, margin + 5, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'italic');
  const rationaleLines = doc.splitTextToSize(
    `Rationale: ${results.recommendations.breakerTypeGuidance.rationale}`,
    pageWidth - 2 * margin - 15
  );
  doc.text(rationaleLines, margin + 5, yPosition);
  yPosition += rationaleLines.length * 5 + 2;

  doc.setFont('helvetica', 'normal');
  doc.text(`Inrush Capability: ${results.recommendations.breakerTypeGuidance.inrushCapability}`, margin + 5, yPosition);
  yPosition += 7;

  // General notes
  if (results.recommendations.generalNotes.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes:', margin + 5, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');

    for (const note of results.recommendations.generalNotes) {
      const noteLines = doc.splitTextToSize(note, pageWidth - 2 * margin - 15);
      doc.text(noteLines, margin + 5, yPosition);
      yPosition += noteLines.length * 4 + 2;
    }
  }

  yPosition += 5;

  // ==========================================================================
  // ALERTS AND WARNINGS
  // ==========================================================================

  if (results.alerts && results.alerts.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text('Alerts and Warnings', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    for (const alert of results.alerts) {
      const icon = alert.type === 'error' ? 'ERROR: ' : alert.type === 'warning' ? 'WARNING: ' : 'INFO: ';
      const alertText = `${icon}${alert.message}`;
      const alertLines = doc.splitTextToSize(alertText, pageWidth - 2 * margin - 15);
      doc.text(alertLines, margin + 5, yPosition);
      yPosition += alertLines.length * 5 + 2;
    }

    yPosition += 5;
  }

  // ==========================================================================
  // FOOTER WITH DISCLAIMER
  // ==========================================================================

  if (includeDisclaimer) {
    const disclaimerY = pageHeight - margin - 20;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, disclaimerY - 5, pageWidth - margin, disclaimerY - 5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);

    const disclaimer =
      'This calculation is provided for assistance and educational purposes. Final designs must be reviewed and stamped by licensed Professional Engineers where required by law. ' +
      'Consult applicable codes (NEC, IEC, local amendments) and equipment specifications before implementation.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
    doc.text(disclaimerLines, margin, disclaimerY);

    // Page number and timestamp
    doc.setFontSize(7);
    doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - margin, { align: 'center' });
    doc.text(`Generated: ${new Date().toISOString()}`, pageWidth - margin, pageHeight - margin, { align: 'right' });
  }

  const endTime = performance.now();
  const generationTime = endTime - startTime;
  console.log(`Breaker PDF generated in ${generationTime.toFixed(0)}ms`);

  // Return as Blob
  return doc.output('blob');
}

/**
 * Download breaker calculation PDF
 *
 * Helper function to generate and download the PDF in one call
 *
 * @param options - PDF generation options
 * @param filename - Optional filename (defaults to timestamp-based name)
 */
export async function downloadBreakerPDF(
  options: BreakerPDFOptions,
  filename?: string
): Promise<void> {
  const pdf = await generateBreakerPDF(options);

  const url = URL.createObjectURL(pdf);
  const a = document.createElement('a');
  a.href = url;

  // Generate filename if not provided
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = filename || `breaker-sizing-${dateStr}.pdf`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
