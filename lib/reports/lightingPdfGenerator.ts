/**
 * Lighting Design PDF Report Generator
 *
 * Generates professional PDF reports for lighting calculations
 * using jsPDF library.
 *
 * @module lightingPdfGenerator
 */

import { jsPDF } from 'jspdf';
import type {
  Room,
  Luminaire,
  DesignParameters,
  CalculationResults,
  FixturePosition,
} from '@/lib/types/lighting';
import { percentToMeters } from '@/lib/calculations/lighting/layoutAlgorithm';

// ============================================================================
// Types
// ============================================================================

export interface LightingReportData {
  room: Room;
  luminaire: Luminaire;
  designParameters: DesignParameters;
  results: CalculationResults;
  projectInfo?: {
    projectName?: string;
    projectLocation?: string;
    engineerName?: string;
    date?: string;
  };
  // Layout visualization (Feature: 005-lighting-layout-viz)
  layoutCanvas?: HTMLCanvasElement;
  layoutPositions?: FixturePosition[];
}

// ============================================================================
// PDF Generation
// ============================================================================

/**
 * Generate a professional PDF report for lighting calculation
 *
 * @param data - Report data including room, luminaire, and results
 * @returns Blob of the generated PDF
 */
export function generateLightingPdf(data: LightingReportData): Blob {
  const { room, luminaire, designParameters, results, projectInfo } = data;

  // Create PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Helper function to add text
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(text, margin, y);
    y += fontSize * 0.5;
  };

  // Helper function to add key-value pair
  const addKeyValue = (key: string, value: string, indent: number = 0) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(key + ':', margin + indent, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 55 + indent, y);
    y += 6;
  };

  // Helper function to add horizontal line
  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Helper function to check page break
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (y > doc.internal.pageSize.getHeight() - requiredSpace) {
      doc.addPage();
      y = margin;
    }
  };

  // =========================================================================
  // Header Section
  // =========================================================================

  // Logo placeholder
  doc.setFillColor(59, 130, 246); // Primary blue
  doc.rect(margin, y, 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ElectroMate', margin + 3, y + 7);
  doc.setTextColor(0, 0, 0);

  // Report title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Lighting Design Report', pageWidth / 2, y + 7, { align: 'center' });

  y += 20;
  addLine();

  // Project Information
  if (projectInfo) {
    addText('PROJECT INFORMATION', 12, true);
    y += 3;

    if (projectInfo.projectName) {
      addKeyValue('Project Name', projectInfo.projectName);
    }
    if (projectInfo.projectLocation) {
      addKeyValue('Location', projectInfo.projectLocation);
    }
    if (projectInfo.engineerName) {
      addKeyValue('Engineer', projectInfo.engineerName);
    }
    addKeyValue('Report Date', projectInfo.date || new Date().toLocaleDateString());

    y += 5;
    addLine();
  }

  // =========================================================================
  // Room Configuration Section
  // =========================================================================

  checkPageBreak();
  addText('ROOM CONFIGURATION', 12, true);
  y += 3;

  addKeyValue('Dimensions (L×W×H)', `${room.length} × ${room.width} × ${room.height} m`);
  addKeyValue('Floor Area', `${(room.length * room.width).toFixed(1)} m²`);
  addKeyValue('Work Plane Height', `${room.workPlaneHeight} m`);
  addKeyValue('Mounting Height', `${results.roomIndex.mountingHeight.toFixed(2)} m`);

  y += 3;
  addText('Surface Reflectances:', 10, true);
  y += 2;
  addKeyValue('Ceiling', `${room.ceilingReflectance}%`, 5);
  addKeyValue('Walls', `${room.wallReflectance}%`, 5);
  addKeyValue('Floor', `${room.floorReflectance}%`, 5);

  y += 5;
  addLine();

  // =========================================================================
  // Luminaire Section
  // =========================================================================

  checkPageBreak();
  addText('LUMINAIRE SPECIFICATION', 12, true);
  y += 3;

  addKeyValue('Manufacturer', luminaire.manufacturer);
  addKeyValue('Model', luminaire.model);
  addKeyValue('Category', luminaire.category);
  addKeyValue('Power', `${luminaire.watts} W`);
  addKeyValue('Lumen Output', `${luminaire.lumens.toLocaleString()} lm`);
  addKeyValue('Efficacy', `${luminaire.efficacy} lm/W`);
  addKeyValue('Distribution', luminaire.distributionType);
  addKeyValue('Max SHR', luminaire.maxSHR.toString());

  if (luminaire.cri) {
    addKeyValue('CRI', luminaire.cri.toString());
  }
  if (luminaire.cct) {
    addKeyValue('CCT', `${luminaire.cct} K`);
  }

  y += 5;
  addLine();

  // =========================================================================
  // Design Parameters Section
  // =========================================================================

  checkPageBreak();
  addText('DESIGN PARAMETERS', 12, true);
  y += 3;

  addKeyValue('Required Illuminance', `${designParameters.requiredIlluminance} lux`);
  addKeyValue('Utilization Factor (UF)', results.utilizationFactor.toFixed(2));
  addKeyValue('Maintenance Factor (MF)', designParameters.maintenanceFactor.toFixed(2));
  addKeyValue('Operating Hours', `${designParameters.operatingHoursPerDay} hrs/day`);
  addKeyValue('Standard Reference', results.standardReference);

  y += 5;
  addLine();

  // =========================================================================
  // Results Section (Highlighted)
  // =========================================================================

  checkPageBreak(60);
  addText('CALCULATION RESULTS', 12, true);
  y += 5;

  // Primary result box
  doc.setFillColor(240, 249, 255); // Light blue background
  doc.rect(margin, y, contentWidth, 25, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.rect(margin, y, contentWidth, 25, 'S');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Luminaires Required:', margin + 5, y + 8);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(results.luminairesRounded.toString(), margin + 55, y + 10);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`(exact: ${results.luminairesRequired.toFixed(2)})`, margin + 55, y + 17);

  doc.setFontSize(11);
  doc.text('Average Illuminance:', margin + contentWidth / 2 + 5, y + 8);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${results.averageIlluminance.toFixed(0)} lux`, margin + contentWidth / 2 + 60, y + 10);

  y += 30;

  // Secondary results
  addKeyValue('Room Index (RI)', results.roomIndex.value.toFixed(2));
  addKeyValue('Spacing-to-Height Ratio', `${results.spacingToHeightRatio.toFixed(2)} ${results.shrCompliant ? '✓' : '⚠ (exceeds max)'}`);

  y += 5;
  addText('Power & Energy:', 10, true);
  y += 2;
  addKeyValue('Total Power', `${results.totalWatts} W`, 5);
  addKeyValue('Total Lumens', `${results.totalLumens.toLocaleString()} lm`, 5);
  addKeyValue('Power Density', `${(results.totalWatts / (room.length * room.width)).toFixed(1)} W/m²`, 5);
  addKeyValue('Annual Energy', `${results.energyConsumptionKwhYear.toLocaleString()} kWh/year`, 5);

  y += 5;
  addLine();

  // =========================================================================
  // Formulas Section
  // =========================================================================

  checkPageBreak(50);
  addText('CALCULATION FORMULAS', 12, true);
  y += 5;

  for (const formula of results.formulas) {
    checkPageBreak(20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(formula.name + ':', margin, y);
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(formula.formula, margin + 5, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    const varsText = formula.variables.map((v) => `${v.symbol}=${v.value}${v.unit}`).join(', ');
    doc.text(`Where: ${varsText}`, margin + 5, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`Result: ${formula.result} ${formula.unit}`, margin + 5, y);
    y += 8;
  }

  addLine();

  // =========================================================================
  // Warnings & Recommendations
  // =========================================================================

  if (results.warnings.length > 0) {
    checkPageBreak(30);
    addText('WARNINGS', 12, true);
    y += 3;

    for (const warning of results.warnings) {
      checkPageBreak(15);
      const icon = warning.severity === 'error' ? '✗' : warning.severity === 'warning' ? '⚠' : 'ℹ';
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${icon} ${warning.message}`, margin + 5, y);
      y += 5;
      if (warning.recommendation) {
        doc.setTextColor(100, 100, 100);
        doc.text(`  → ${warning.recommendation}`, margin + 5, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }
    }
    y += 3;
  }

  if (results.recommendations.length > 0) {
    checkPageBreak(30);
    addText('RECOMMENDATIONS', 12, true);
    y += 3;

    for (const rec of results.recommendations) {
      checkPageBreak(10);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${rec}`, margin + 5, y);
      y += 5;
    }
    y += 3;
    addLine();
  }

  // =========================================================================
  // Layout Visualization Section (Feature: 005-lighting-layout-viz)
  // =========================================================================

  if (data.layoutCanvas && data.layoutPositions && data.layoutPositions.length > 0) {
    checkPageBreak(100);

    // Section header
    addText('Room Layout', 12, true);
    y += 3;

    // Add canvas image
    try {
      const canvasDataUrl = data.layoutCanvas.toDataURL('image/png', 1.0);
      const imgWidth = contentWidth * 0.8;
      const imgHeight = (data.layoutCanvas.height / data.layoutCanvas.width) * imgWidth;

      doc.addImage(canvasDataUrl, 'PNG', margin + (contentWidth - imgWidth) / 2, y, imgWidth, imgHeight);
      y += imgHeight + 5;
    } catch (error) {
      console.error('Failed to add canvas to PDF:', error);
      addText('Layout visualization not available', 9);
      y += 5;
    }

    // Add fixture positions table
    checkPageBreak(50);
    addText('Fixture Positions', 11, true);
    y += 3;

    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Fixture', margin, y);
    doc.text('X Position (m)', margin + 30, y);
    doc.text('Y Position (m)', margin + 70, y);
    doc.text('X Position (ft)', margin + 110, y);
    doc.text('Y Position (ft)', margin + 150, y);
    y += 5;
    addLine();

    // Table rows
    doc.setFont('helvetica', 'normal');
    for (let i = 0; i < data.layoutPositions.length; i++) {
      checkPageBreak(10);
      const position = data.layoutPositions[i];
      const meters = percentToMeters(position.x, position.y, room.width, room.length);
      const feet = { x: meters.x * 3.28084, y: meters.y * 3.28084 };

      doc.text(`#${i + 1}`, margin, y);
      doc.text(meters.x.toFixed(2), margin + 30, y);
      doc.text(meters.y.toFixed(2), margin + 70, y);
      doc.text(feet.x.toFixed(2), margin + 110, y);
      doc.text(feet.y.toFixed(2), margin + 150, y);
      y += 5;
    }
    y += 3;
    addLine();
  }

  // =========================================================================
  // Footer Section
  // =========================================================================

  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);

  doc.text(
    'Generated by ElectroMate - Professional Electrical Engineering Calculations',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    'Disclaimer: This report is for reference purposes. Final designs require professional engineering review.',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );
  doc.text(
    `Report generated: ${new Date().toISOString()}`,
    pageWidth / 2,
    footerY + 8,
    { align: 'center' }
  );

  // Return as blob
  return doc.output('blob');
}

/**
 * Download the PDF report
 *
 * @param data - Report data
 * @param filename - Optional custom filename
 */
export function downloadLightingPdf(
  data: LightingReportData,
  filename?: string
): void {
  const blob = generateLightingPdf(data);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `lighting-report-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
