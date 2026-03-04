/**
 * Motor & HVAC Breaker PDF Generator
 *
 * Generates professional PDF reports for motor/HVAC breaker sizing calculations.
 *
 * @module motorBreakerPdfGenerator
 */

import jsPDF from 'jspdf';
import type {
  MotorBreakerInput,
  MotorBreakerCalculationResults,
  MotorBreakerProjectInfo,
} from '@/types/motor-breaker-calculator';

export interface MotorBreakerPDFOptions {
  input: MotorBreakerInput;
  results: MotorBreakerCalculationResults;
  project?: MotorBreakerProjectInfo;
}

const PAGE_WIDTH = 210;  // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export async function generateMotorBreakerPDF(options: MotorBreakerPDFOptions): Promise<Blob> {
  const { input, results, project } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - 30) {
      doc.addPage();
      y = 20;
    }
  };

  const addSectionTitle = (title: string) => {
    checkPage(15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text(title, MARGIN_LEFT, y);
    y += 2;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
    y += 6;
  };

  const addKeyValue = (key: string, value: string) => {
    checkPage(8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(key, MARGIN_LEFT, y);
    doc.setTextColor(33, 33, 33);
    doc.setFont('helvetica', 'bold');
    doc.text(value, MARGIN_LEFT + 70, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  };

  // ====== Header ======
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('ElectroMate', MARGIN_LEFT, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Motor & HVAC Breaker Sizing Report', MARGIN_LEFT, y);
  y += 4;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  y += 10;

  // ====== Project Info (optional) ======
  if (project) {
    addSectionTitle('Project Information');
    if (project.projectName) addKeyValue('Project Name', project.projectName);
    if (project.projectLocation) addKeyValue('Location', project.projectLocation);
    if (project.engineerName) addKeyValue('Engineer', project.engineerName);
    y += 4;
  }

  // ====== Input Parameters ======
  addSectionTitle('Input Parameters');
  addKeyValue('Standard', input.standard);
  addKeyValue('System Type', input.systemType);
  addKeyValue('Load Type', input.loadType);

  if (input.loadType === 'hvac' && input.standard === 'NEC') {
    if (input.voltage) addKeyValue('Voltage', `${input.voltage} V`);
    if (input.mca) addKeyValue('MCA', `${input.mca} A`);
    if (input.mop) addKeyValue('MOP', `${input.mop} A`);
  } else {
    if (input.voltage) addKeyValue('Voltage', `${input.voltage} V`);
    if (input.inputMode === 'fla' && input.fla) {
      addKeyValue('FLA (Input)', `${input.fla} A`);
    } else if (input.powerValue) {
      addKeyValue('Power', `${input.powerValue} ${input.powerUnit?.toUpperCase() ?? 'kW'}`);
    }
    if (input.powerFactor && input.systemType !== 'dc') {
      addKeyValue('Power Factor', `${input.powerFactor}`);
    }
  }

  if (input.protectionDevice && input.loadType === 'motor' && input.standard === 'NEC') {
    addKeyValue('Protection Device', input.protectionDevice);
  }
  if (input.utilizationCategory && input.standard === 'IEC') {
    addKeyValue('Utilization Category', input.utilizationCategory);
  }
  y += 4;

  // ====== Load Analysis ======
  addSectionTitle('Load Analysis');
  const la = results.loadAnalysis;
  addKeyValue('Calculated FLA', `${la.calculatedFLA.toFixed(2)} A`);
  if (la.inputPowerKW) addKeyValue('Input Power', `${la.inputPowerKW.toFixed(2)} kW`);
  if (la.inputPowerHP) addKeyValue('Input Power (HP)', `${la.inputPowerHP.toFixed(1)} HP`);
  addKeyValue('Formula', la.formula);
  y += 4;

  // ====== Protection Sizing ======
  addSectionTitle('Protection Sizing');
  const ps = results.protectionSizing;
  addKeyValue('FLA', `${ps.fla.toFixed(2)} A`);
  addKeyValue('Multiplier', `${(ps.multiplier * 100).toFixed(0)}%`);
  addKeyValue('Minimum Protection', `${ps.minimumAmps.toFixed(1)} A`);
  addKeyValue('Code Reference', ps.codeReference);
  y += 4;

  // ====== Breaker Recommendation (highlighted) ======
  addSectionTitle('Breaker Recommendation');
  checkPage(20);

  // Green highlighted box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN_LEFT, y - 2, CONTENT_WIDTH, 18, 2, 2, 'FD');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`${results.recommendation.recommendedBreakerAmps} A`, MARGIN_LEFT + CONTENT_WIDTH / 2, y + 7, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const badges: string[] = [results.recommendation.standard];
  if (results.recommendation.tripCurve) badges.push(`Trip Curve ${results.recommendation.tripCurve}`);
  if (results.recommendation.tripType) badges.push(results.recommendation.tripType);
  doc.text(badges.join(' | '), MARGIN_LEFT + CONTENT_WIDTH / 2, y + 13, { align: 'center' });

  y += 22;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const rationaleLines = doc.splitTextToSize(results.recommendation.rationale, CONTENT_WIDTH);
  doc.text(rationaleLines, MARGIN_LEFT, y);
  y += rationaleLines.length * 4 + 4;

  // ====== Motor Details (conditional) ======
  if (results.motorDetails) {
    addSectionTitle('Motor Protection Details');
    const md = results.motorDetails;
    if (md.protectionDeviceName) addKeyValue('Device', md.protectionDeviceName);
    addKeyValue('Multiplier', `${(md.multiplier * 100).toFixed(0)}% FLA`);
    addKeyValue('Code Reference', md.codeReference);
    y += 4;
  }

  // ====== HVAC Details (conditional) ======
  if (results.hvacDetails) {
    addSectionTitle('HVAC Equipment Details');
    const hd = results.hvacDetails;
    addKeyValue('MCA (Wire Sizing)', `${hd.mca} A`);
    addKeyValue('MOP (Max Protection)', `${hd.mop} A`);
    addKeyValue('Sizing Basis', hd.breakerSizingBasis);
    addKeyValue('Code Reference', hd.codeReference);
    y += 4;
  }

  // ====== IEC Category (conditional) ======
  if (results.iecCategoryDetails) {
    addSectionTitle('IEC Utilization Category');
    const ic = results.iecCategoryDetails;
    addKeyValue('Category', `${ic.category} — ${ic.description}`);
    addKeyValue('Multiplier', `${(ic.multiplier * 100).toFixed(0)}%`);
    addKeyValue('Trip Curve', `Type ${ic.recommendedTripCurve}`);
    y += 4;
  }

  // ====== Derating Factors (conditional) ======
  if (results.deratingFactors?.applied) {
    addSectionTitle('Derating Factors');
    const df = results.deratingFactors;
    if (df.temperatureFactor) {
      addKeyValue('Temperature Factor', `${df.temperatureFactor.factor.toFixed(2)} (${df.temperatureFactor.ambient}°C)`);
    }
    if (df.groupingFactor) {
      addKeyValue('Grouping Factor', `${df.groupingFactor.factor.toFixed(2)} (${df.groupingFactor.cableCount} cables)`);
    }
    addKeyValue('Combined Factor', df.combinedFactor.toFixed(3));
    addKeyValue('Adjusted Minimum', `${df.adjustedBreakerSizeAmps.toFixed(1)} A`);
    y += 4;
  }

  // ====== Alerts ======
  if (results.alerts.length > 0) {
    addSectionTitle('Alerts & Warnings');
    results.alerts.forEach((alert) => {
      checkPage(10);
      const prefix = alert.type === 'error' ? '[ERROR]' : alert.type === 'warning' ? '[WARNING]' : '[INFO]';
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(
        alert.type === 'error' ? 220 : alert.type === 'warning' ? 180 : 59,
        alert.type === 'error' ? 38 : alert.type === 'warning' ? 120 : 130,
        alert.type === 'error' ? 38 : alert.type === 'warning' ? 0 : 246
      );
      doc.text(prefix, MARGIN_LEFT, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 66, 66);
      const alertLines = doc.splitTextToSize(alert.message, CONTENT_WIDTH - 25);
      doc.text(alertLines, MARGIN_LEFT + 22, y);
      y += alertLines.length * 4 + 3;
    });
    y += 4;
  }

  // ====== Footer/Disclaimer ======
  checkPage(25);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const disclaimer = 'This report is generated for reference only. All calculations must be verified by a qualified electrical engineer. ' +
    'ElectroMate does not accept liability for errors. Standards referenced: NEC 2020, IEC 60364, IEC 60947.';
  const discLines = doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
  doc.text(discLines, MARGIN_LEFT, y);
  y += discLines.length * 3 + 4;

  doc.setFontSize(7);
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, MARGIN_LEFT, y);
  doc.text(`Page 1`, MARGIN_LEFT + CONTENT_WIDTH, y, { align: 'right' });

  return doc.output('blob');
}

export async function downloadMotorBreakerPDF(
  options: MotorBreakerPDFOptions,
  filename?: string
): Promise<void> {
  const blob = await generateMotorBreakerPDF(options);
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const name = filename ?? `motor-breaker-sizing-${date}.pdf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
