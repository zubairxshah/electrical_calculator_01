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

  // Handle UPS-specific formatting
  if (type === 'ups') {
    return formatUPSInputsForPDF(inputs, standards)
  }

  // Handle battery-specific formatting
  if (type === 'battery') {
    return formatBatteryInputsForPDF(inputs, standards)
  }

  // Generic formatting for other types
  for (const [key, value] of Object.entries(inputs)) {
    const label = formatLabel(key)
    const formattedValue = formatValue(value, key, standards)
    formatted[label] = formattedValue
  }

  return formatted
}

/**
 * Format UPS inputs for PDF display
 */
function formatUPSInputsForPDF(
  inputs: Record<string, unknown>,
  standards: StandardsFramework
): Record<string, string> {
  const formatted: Record<string, string> = {}

  // Format loads array
  if (inputs.loads && Array.isArray(inputs.loads)) {
    const loads = inputs.loads as Array<{
      name: string
      powerVA?: number | null
      powerWatts?: number | null
      powerFactor?: number
      quantity: number
    }>

    formatted['Number of Load Types'] = `${loads.length}`

    let totalVA = 0
    let totalItems = 0

    loads.forEach((load, index) => {
      const va = load.powerVA ?? (load.powerWatts ?? 0) / (load.powerFactor ?? 0.8)
      const itemTotal = va * load.quantity
      totalVA += itemTotal
      totalItems += load.quantity

      formatted[`Load ${index + 1}`] = `${load.name}: ${load.quantity}x @ ${load.powerVA ? `${load.powerVA} VA` : `${load.powerWatts} W (PF ${load.powerFactor})`} = ${itemTotal.toLocaleString()} VA`
    })

    formatted['Total Connected Load'] = `${totalVA.toLocaleString()} VA`
    formatted['Total Equipment Count'] = `${totalItems}`
  }

  // Format growth margin
  if (inputs.growthMargin !== undefined) {
    formatted['Growth Margin'] = `${((inputs.growthMargin as number) * 100).toFixed(0)}%`
  }

  return formatted
}

/**
 * Format Battery inputs for PDF display
 */
function formatBatteryInputsForPDF(
  inputs: Record<string, unknown>,
  standards: StandardsFramework
): Record<string, string> {
  const formatted: Record<string, string> = {}

  if (inputs.voltage !== undefined) {
    formatted['System Voltage'] = `${inputs.voltage} V DC`
  }
  if (inputs.ampHours !== undefined) {
    formatted['Battery Capacity'] = `${inputs.ampHours} Ah`
  }
  if (inputs.loadWatts !== undefined) {
    formatted['Load Power'] = `${inputs.loadWatts} W`
  }
  if (inputs.efficiency !== undefined) {
    formatted['System Efficiency'] = `${((inputs.efficiency as number) * 100).toFixed(0)}%`
  }
  if (inputs.agingFactor !== undefined) {
    formatted['Aging Factor'] = `${((inputs.agingFactor as number) * 100).toFixed(0)}%`
  }
  if (inputs.chemistry !== undefined) {
    formatted['Battery Chemistry'] = `${inputs.chemistry}`
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
  const results = calculation.results as Record<string, unknown>

  // Handle UPS-specific results
  if (calculation.calculationType === 'ups') {
    return formatUPSResultsForPDF(results, standards)
  }

  // Handle battery-specific results
  if (calculation.calculationType === 'battery') {
    return formatBatteryResultsForPDF(results, standards)
  }

  // Generic formatting for other types
  const formatted: Record<string, string> = {}
  for (const [key, value] of Object.entries(results)) {
    if (typeof value === 'number') {
      formatted[formatLabel(key)] = value.toLocaleString()
    } else if (typeof value === 'string') {
      formatted[formatLabel(key)] = value
    }
  }
  return formatted
}

/**
 * Format UPS results for PDF display
 */
function formatUPSResultsForPDF(
  results: Record<string, unknown>,
  standards: StandardsFramework
): Record<string, string> {
  const formatted: Record<string, string> = {}

  if (results.totalLoadVA !== undefined) {
    formatted['Total Connected Load'] = `${(results.totalLoadVA as number).toLocaleString()} VA`
  }
  if (results.numberOfLoads !== undefined) {
    formatted['Number of Load Items'] = `${results.numberOfLoads}`
  }
  if (results.diversityFactor !== undefined) {
    formatted['IEEE 1100 Diversity Factor'] = `${results.diversityFactor}`
  }
  if (results.effectiveLoadVA !== undefined) {
    formatted['Effective Load (after diversity)'] = `${(results.effectiveLoadVA as number).toLocaleString()} VA`
  }
  if (results.growthMargin !== undefined) {
    formatted['Growth Margin Applied'] = `${((results.growthMargin as number) * 100).toFixed(0)}%`
  }
  if (results.loadWithGrowthVA !== undefined) {
    formatted['Required Capacity (with growth)'] = `${(results.loadWithGrowthVA as number).toLocaleString()} VA`
  }
  if (results.loadWithGrowthKVA !== undefined) {
    formatted['Required Capacity'] = `${(results.loadWithGrowthKVA as number).toFixed(2)} kVA`
  }
  if (results.recommendedUPSKVA !== undefined) {
    if (results.recommendedUPSKVA === null) {
      formatted['Recommended UPS Size'] = 'Exceeds 200 kVA - consider parallel configuration'
    } else {
      formatted['Recommended UPS Size'] = `${results.recommendedUPSKVA} kVA`
    }
  }
  if (results.diversityExplanation !== undefined) {
    formatted['Diversity Factor Explanation'] = results.diversityExplanation as string
  }
  if (results.standard !== undefined) {
    formatted['Standards Reference'] = results.standard as string
  }

  return formatted
}

/**
 * Format Battery results for PDF display
 */
function formatBatteryResultsForPDF(
  results: Record<string, unknown>,
  standards: StandardsFramework
): Record<string, string> {
  const formatted: Record<string, string> = {}

  if (results.backupTimeHours !== undefined) {
    const hours = typeof results.backupTimeHours === 'object'
      ? Number(results.backupTimeHours)
      : results.backupTimeHours as number
    formatted['Backup Time'] = `${hours.toFixed(2)} hours`

    // Also show in hours:minutes format
    const totalMinutes = hours * 60
    const hrs = Math.floor(totalMinutes / 60)
    const mins = Math.round(totalMinutes % 60)
    formatted['Backup Time (formatted)'] = `${hrs}h ${mins}m`
  }
  if (results.effectiveCapacityAh !== undefined) {
    const capacity = typeof results.effectiveCapacityAh === 'object'
      ? Number(results.effectiveCapacityAh)
      : results.effectiveCapacityAh as number
    formatted['Effective Capacity'] = `${capacity.toFixed(2)} Ah`
  }
  if (results.dischargeRate !== undefined) {
    const rate = typeof results.dischargeRate === 'object'
      ? Number(results.dischargeRate)
      : results.dischargeRate as number
    formatted['Discharge Rate (C-rate)'] = `C/${(1/rate).toFixed(1)}`
  }

  return formatted
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
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'number') {
    // Add appropriate units based on key
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('voltage') || lowerKey.includes('volt')) {
      return `${value.toFixed(2)} V`
    }
    if (lowerKey.includes('current') || lowerKey.includes('amp')) {
      return `${value.toFixed(2)} A`
    }
    if (lowerKey.includes('watt') || lowerKey.includes('power')) {
      return `${value.toLocaleString()} W`
    }
    if (lowerKey.includes('percent') || lowerKey.includes('efficiency') || lowerKey.includes('factor')) {
      return `${(value * 100).toFixed(1)}%`
    }
    if (lowerKey.includes('hour') || lowerKey.includes('time')) {
      return `${value.toFixed(2)} hrs`
    }
    return value.toLocaleString()
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'None'
    }
    // For arrays of primitives, join them
    if (typeof value[0] !== 'object') {
      return value.join(', ')
    }
    // For arrays of objects, show count
    return `${value.length} item(s)`
  }

  if (typeof value === 'object') {
    // For objects, try to extract meaningful info
    const obj = value as Record<string, unknown>
    if (obj.name) {
      return String(obj.name)
    }
    if (obj.value !== undefined) {
      return String(obj.value)
    }
    // Fallback: show key count
    return `{${Object.keys(obj).length} properties}`
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
      'Reference: IEEE 485-2020',
    ],
    ups: [
      'Total Load (VA) = Σ(Equipment VA × Quantity)',
      'Diversity Factor: N≤3 → 1.0, 3<N≤10 → 0.9+0.1/N, N>10 → 0.85',
      'Effective Load = Total Load × Diversity Factor',
      'Required Capacity = Effective Load × (1 + Growth Margin)',
      'Reference: IEEE 1100-2020 (Emerald Book), IEC 62040-3:2021',
    ],
    cable: [
      'Voltage Drop (V) = 2 × Length × Current × Resistance',
      'Voltage Drop (%) = (Voltage Drop / System Voltage) × 100',
      'Reference: NEC Table 310.15(B)(16), IEC 60364-5-52',
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
