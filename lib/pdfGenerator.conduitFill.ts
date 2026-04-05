// PDF Generator for Conduit Fill Calculator

import jsPDF from 'jspdf'
import type { ConduitFillInput, ConduitFillResult } from '@/types/conduit-fill'
import { CONDUIT_TYPES } from '@/lib/calculations/conduit-fill/conduitFillData'

interface ConduitFillPDFInput {
  input: ConduitFillInput
  result: ConduitFillResult
}

const SQ_IN_TO_MM2 = 645.16

export async function downloadConduitFillPDF(data: ConduitFillPDFInput): Promise<void> {
  const { input, result } = data
  const isIEC = input.standard === 'IEC'
  const useMetric = isIEC || input.unitSystem === 'metric'
  const doc = new jsPDF()
  let y = 20

  const addLine = (text: string, size = 10, bold = false) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(text, 14, y)
    y += size * 0.5 + 2
  }

  const addRow = (label: string, value: string) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(label, 14, y)
    doc.text(value, 100, y)
    y += 5
  }

  const fmtArea = (sqIn: number, mm2?: number) => {
    if (useMetric) {
      const val = mm2 ?? sqIn * SQ_IN_TO_MM2
      return `${val.toFixed(1)} mm2`
    }
    return `${sqIn.toFixed(4)} in2`
  }

  // Header
  addLine('Conduit Fill Analysis Report', 16, true)
  addLine('ElectroMate Engineering Calculations', 9)
  y += 2

  // Project info
  addLine('Project Information', 11, true)
  if (input.projectName) addRow('Project:', input.projectName)
  if (input.projectRef) addRow('Reference:', input.projectRef)
  addRow('Date:', new Date().toLocaleDateString())
  addRow('Standard:', isIEC ? 'IEC 61386 / BS 7671' : 'NEC 2020 Chapter 9')
  y += 3

  // Conduit Details
  addLine('Conduit Details', 11, true)
  const conduitLabel = CONDUIT_TYPES.find(t => t.id === input.conduitType)?.label ?? input.conduitType
  addRow('Conduit Type:', conduitLabel)
  addRow('Size:', isIEC ? `${input.tradeSize}mm` : `${input.tradeSize}"`)
  addRow('Internal Area:', fmtArea(result.conduitInternalArea, result.conduitInternalAreaMm2))
  if (input.isNipple) {
    addRow('Short Run/Nipple:', isIEC
      ? 'Yes (55% fill limit per IEC 60364)'
      : 'Yes (60% fill limit per NEC 376.22)')
  }
  y += 3

  // Conductor Table
  addLine('Conductor Details', 11, true)
  y += 2

  // Table header
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(isIEC ? 'Size (mm2)' : 'Wire Size', 14, y)
  doc.text('Insulation', 42, y)
  doc.text('Qty', 82, y)
  doc.text('Area/ea', 96, y)
  doc.text('Total Area', 126, y)
  doc.text('% Fill', 160, y)
  doc.text('Table', 178, y)
  y += 1
  doc.setDrawColor(150)
  doc.line(14, y, 196, y)
  y += 4

  // Table rows
  doc.setFont('helvetica', 'normal')
  for (const d of result.conductorDetails) {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text(d.wireSize, 14, y)
    doc.text(d.insulationType, 42, y)
    doc.text(String(d.quantity), 82, y)
    doc.text(fmtArea(d.areaPerConductor, d.areaPerConductorMm2), 96, y)
    doc.text(fmtArea(d.totalArea, d.totalAreaMm2), 126, y)
    doc.text(`${d.percentOfFill.toFixed(1)}%`, 160, y)
    const shortRef = d.necTableRef
      .replace('NEC Chapter 9 ', '')
      .replace('BS 7671 ', '')
    doc.text(shortRef, 178, y)
    y += 5
  }

  // Total row
  doc.line(14, y, 196, y)
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', 14, y)
  doc.text(String(result.totalConductorCount), 82, y)
  doc.text(fmtArea(result.totalConductorArea, result.totalConductorAreaMm2), 126, y)
  doc.text(`${result.fillPercentage.toFixed(1)}%`, 160, y)
  y += 8

  // Fill Result
  addLine('Fill Calculation Result', 11, true)
  addRow('Total Conductor Area:', fmtArea(result.totalConductorArea, result.totalConductorAreaMm2))
  addRow('Conduit Internal Area:', fmtArea(result.conduitInternalArea, result.conduitInternalAreaMm2))
  addRow('Fill Percentage:', `${result.fillPercentage.toFixed(2)}%`)
  addRow('Fill Limit:', `${result.fillLimit}% (${result.totalConductorCount} conductor${result.totalConductorCount !== 1 ? 's' : ''})`)
  addRow('Result:', result.pass
    ? 'PASS - Compliant'
    : isIEC ? 'FAIL - Exceeds IEC space factor' : 'FAIL - Exceeds NEC fill limit')

  const allowableMm2 = result.conduitInternalAreaMm2 * (result.fillLimit / 100)
  const allowableSqIn = result.conduitInternalArea * (result.fillLimit / 100)
  addRow('Allowable Fill Area:', fmtArea(allowableSqIn, allowableMm2))
  addRow('Remaining Area:', result.remainingArea >= 0
    ? `${fmtArea(result.remainingArea, result.remainingAreaMm2)} available`
    : `${fmtArea(Math.abs(result.remainingArea), Math.abs(result.remainingAreaMm2))} over limit`)
  y += 3

  // Minimum size recommendation
  if (result.minimumConduitSize) {
    addLine('Minimum Size Recommendation', 11, true)
    if (isIEC) {
      addRow('Minimum Conduit:', result.minimumConduitSize.metricLabel ?? `${result.minimumConduitSize.imperial}mm`)
    } else {
      addRow('Minimum Conduit:', `${result.minimumConduitSize.imperial}" (Metric ${result.minimumConduitSize.metric})`)
    }
    addRow('Internal Area:', fmtArea(result.minimumConduitSize.internalAreaSqIn, result.minimumConduitSize.internalAreaMm2))
    y += 3
  }
  if (result.noConduitFits) {
    addLine('No single conduit is sufficient - consider parallel conduit runs.', 9)
    y += 3
  }

  // References
  addLine(isIEC ? 'IEC / BS EN References' : 'NEC References', 11, true)
  for (const ref of result.necReferences) {
    addLine(`  - ${ref}`, 9)
  }
  y += 5

  // Disclaimer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100)
  if (y > 260) { doc.addPage(); y = 20 }
  doc.text(
    isIEC
      ? 'Calculations for informational purposes. Verification by a qualified engineer is the user\'s responsibility.'
      : 'Calculations for informational purposes. PE stamp/certification is user\'s responsibility.',
    14, y
  )
  y += 3
  doc.text(`Generated by ElectroMate - ${new Date().toISOString()}`, 14, y)

  const sizeStr = isIEC ? input.tradeSize + 'mm' : input.tradeSize.replace('/', '-')
  doc.save(`conduit-fill-${input.conduitType}-${sizeStr}.pdf`)
}
