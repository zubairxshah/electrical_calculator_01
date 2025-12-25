/**
 * PDF Generation Utilities
 *
 * Generates professional calculation reports with:
 * - Input parameters
 * - Calculation formulas with standard references
 * - Results with units
 * - Charts (via html2canvas)
 * - Warnings and recommendations
 * - MZS CodeWorks branding
 *
 * Uses jsPDF for client-side generation (ADR-004)
 *
 * @see specs/001-electromate-engineering-app/spec.md#FR-006
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from './mathConfig'
import type { CalculationSession, StandardsFramework } from './types'

export interface PDFGenerationOptions {
  /** Calculation session data */
  calculation: CalculationSession
  /** Standards framework used */
  standards: StandardsFramework
  /** Optional chart element to include */
  chartElement?: HTMLElement
  /** Include calculation formulas */
  includeFormulas?: boolean
  /** MZS CodeWorks branding */
  includeBranding?: boolean
}

/**
 * Generate PDF calculation report
 *
 * @param options PDF generation options
 * @returns Blob containing PDF data
 *
 * @example
 * const pdf = await generateCalculationPDF({
 *   calculation: batteryResult,
 *   standards: 'IEC',
 *   chartElement: document.getElementById('discharge-chart'),
 * })
 * // Download
 * const url = URL.createObjectURL(pdf)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'battery-calculation.pdf'
 * a.click()
 */
export async function generateCalculationPDF(
  options: PDFGenerationOptions
): Promise<Blob> {
  const {
    calculation,
    standards,
    chartElement,
    includeFormulas = true,
    includeBranding = true,
  } = options

  const startTime = performance.now()

  // Create PDF document (A4, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Header: MZS CodeWorks branding
  if (includeBranding) {
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('ElectroMate', margin, yPosition)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Electrical Engineering Calculations', margin, yPosition + 6)

    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('MZS CodeWorks', pageWidth - margin - 30, yPosition)

    yPosition += 15
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
  }

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  const title = getCalculationTitle(calculation.calculationType)
  doc.text(title, margin, yPosition)
  yPosition += 10

  // Metadata
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(64, 64, 64)
  doc.text(`Date: ${new Date(calculation.createdAt).toLocaleString()}`, margin, yPosition)
  yPosition += 5
  doc.text(`Standards: ${standards === 'IEC' ? 'IEC/SI Units' : 'NEC/US Units'}`, margin, yPosition)
  yPosition += 5
  doc.text(`Standards Used: ${calculation.warnings?.map((v: any) => v.standardReference).filter(Boolean).join(', ') || 'N/A'}`, margin, yPosition)
  yPosition += 10

  // Input Parameters Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Input Parameters', margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const inputs = formatInputsForPDF(calculation.inputs, calculation.calculationType, standards)
  for (const [key, value] of Object.entries(inputs)) {
    doc.text(`${key}: ${value}`, margin + 5, yPosition)
    yPosition += 5
  }
  yPosition += 5

  // Calculation Formulas (if requested)
  if (includeFormulas) {
    yPosition = addFormulasSection(doc, calculation, yPosition, margin, pageWidth)
  }

  // Results Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Results', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const results = formatResultsForPDF(calculation, standards)
  for (const [key, value] of Object.entries(results)) {
    doc.text(`${key}: ${value}`, margin + 5, yPosition)
    yPosition += 6
  }
  yPosition += 5

  // Warnings Section (if any)
  if (calculation.warnings && calculation.warnings.length > 0) {
    yPosition = addWarningsSection(doc, calculation.warnings, yPosition, margin, pageWidth)
  }

  // Chart (if provided)
  if (chartElement) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = margin
    }

    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = pageWidth - 2 * margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Chart', margin, yPosition)
      yPosition += 8

      doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 10
    } catch (error) {
      console.error('Failed to add chart to PDF:', error)
    }
  }

  // Footer: Disclaimer
  const disclaimerY = pageHeight - margin - 15
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(128, 128, 128)
  const disclaimer =
    'This calculation is provided as an engineering tool and must be verified by a licensed professional engineer before use in production systems.'
  doc.text(disclaimer, margin, disclaimerY, { maxWidth: pageWidth - 2 * margin })

  // Footer: Page number and timestamp
  doc.setFontSize(7)
  doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - margin, { align: 'center' })
  doc.text(`Generated: ${new Date().toISOString()}`, pageWidth - margin, pageHeight - margin, { align: 'right' })

  const endTime = performance.now()
  const generationTime = endTime - startTime

  console.log(`PDF generated in ${generationTime.toFixed(0)}ms`)

  // Return as Blob
  return doc.output('blob')
}

/**
 * Get human-readable calculation title
 */
function getCalculationTitle(type: string): string {
  const titles: Record<string, string> = {
    battery: 'Battery Backup Time Calculation',
    ups: 'UPS Sizing Calculation',
    cable: 'Cable Sizing and Voltage Drop Calculation',
    solar: 'Solar Panel Array Sizing',
    'charge-controller': 'Charge Controller Selection',
    'battery-comparison': 'Battery Type Comparison',
  }
  return titles[type] || 'Electrical Engineering Calculation'
}

/**
 * Format inputs for PDF display
 */
function formatInputsForPDF(
  inputs: Record<string, unknown>,
  type: string,
  standards: StandardsFramework
): Record<string, string> {
  const formatted: Record<string, string> = {}

  for (const [key, value] of Object.entries(inputs)) {
    const label = formatLabel(key)
    const formattedValue = formatValue(value, key, standards)
    formatted[label] = formattedValue
  }

  return formatted
}

/**
 * Format results for PDF display
 */
function formatResultsForPDF(
  calculation: CalculationSession,
  standards: StandardsFramework
): Record<string, string> {
  // Type-specific formatting handled in calculation modules
  return {}
}

/**
 * Format label from camelCase to Title Case
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

/**
 * Format value with appropriate units
 */
function formatValue(value: unknown, key: string, standards: StandardsFramework): string {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

/**
 * Add formulas section to PDF
 */
function addFormulasSection(
  doc: jsPDF,
  calculation: CalculationSession,
  yPosition: number,
  margin: number,
  pageWidth: number
): number {
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Calculation Formulas', margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // Type-specific formulas
  const formulas = getFormulasForType(calculation.calculationType)
  for (const formula of formulas) {
    doc.text(formula, margin + 5, yPosition, { maxWidth: pageWidth - 2 * margin - 10 })
    yPosition += 6
  }

  yPosition += 5
  return yPosition
}

/**
 * Get formulas for calculation type
 */
function getFormulasForType(type: string): string[] {
  const formulas: Record<string, string[]> = {
    battery: [
      'Energy Stored (Wh) = Voltage × Capacity × Aging Factor',
      'Backup Time (hours) = (Energy Stored × Efficiency) / Load',
      'Discharge Rate (C-rate) = Load / (Voltage × Capacity)',
    ],
    ups: [
      'UPS VA Rating = Load Watts / Power Factor',
      'Battery Ah = (Load Watts × Backup Time) / (Battery Voltage × Efficiency)',
    ],
    cable: [
      'Voltage Drop (V) = 2 × Length × Current × Resistance',
      'Voltage Drop (%) = (Voltage Drop / System Voltage) × 100',
    ],
  }
  return formulas[type] || []
}

/**
 * Add warnings section to PDF
 */
function addWarningsSection(
  doc: jsPDF,
  validations: any[],
  yPosition: number,
  margin: number,
  pageWidth: number
): number {
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(200, 0, 0)
  doc.text('Warnings', margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  for (const validation of validations) {
    const icon = validation.severity === 'error' ? '⚠️' : 'ℹ️'
    doc.text(`${icon} ${validation.message}`, margin + 5, yPosition, {
      maxWidth: pageWidth - 2 * margin - 10,
    })
    yPosition += 6
    if (validation.recommendation) {
      doc.setFont('helvetica', 'italic')
      doc.text(`   Recommendation: ${validation.recommendation}`, margin + 5, yPosition, {
        maxWidth: pageWidth - 2 * margin - 10,
      })
      doc.setFont('helvetica', 'normal')
      yPosition += 6
    }
  }

  yPosition += 5
  return yPosition
}
