/**
 * Earthing Conductor PDF Report Generator
 * Generates professional calculation reports per IEC 60364-5-54 and NEC 250
 */

import jsPDF from 'jspdf'
import type { EarthingInputs, EarthingResult } from '@/lib/calculations/earthing/earthingCalculator'

export interface EarthingReportData {
  inputs: EarthingInputs
  results: EarthingResult
  project?: {
    name?: string
    location?: string
    engineer?: string
    date?: string
  }
}

export async function generateEarthingReport(data: EarthingReportData): Promise<Blob> {
  const { inputs, results, project } = data
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ElectroMate', margin, y)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Electrical Engineering Calculations', margin, y + 6)
  
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('MZS CodeWorks', pageWidth - margin - 30, y)
  
  y += 15
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Earthing Conductor Sizing Calculation', margin, y)
  y += 10

  // Project Info
  if (project) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (project.name) {
      doc.text(`Project: ${project.name}`, margin, y)
      y += 5
    }
    if (project.location) {
      doc.text(`Location: ${project.location}`, margin, y)
      y += 5
    }
    if (project.engineer) {
      doc.text(`Engineer: ${project.engineer}`, margin, y)
      y += 5
    }
  }

  doc.setFontSize(9)
  doc.text(`Date: ${project?.date || new Date().toLocaleDateString()}`, margin, y)
  y += 5
  doc.text(`Standard: ${inputs.standard === 'IEC' ? 'IEC 60364-5-54' : 'NEC 250'}`, margin, y)
  y += 10

  // Input Parameters
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Input Parameters', margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`System Voltage: ${inputs.voltage} V`, margin + 5, y)
  y += 5
  doc.text(`Fault Current: ${inputs.faultCurrent} kA`, margin + 5, y)
  y += 5
  doc.text(`Fault Duration: ${inputs.faultDuration} s`, margin + 5, y)
  y += 5
  doc.text(`Material: ${inputs.material.charAt(0).toUpperCase() + inputs.material.slice(1)}`, margin + 5, y)
  y += 5
  doc.text(`Installation Type: ${inputs.installationType.charAt(0).toUpperCase() + inputs.installationType.slice(1)}`, margin + 5, y)
  y += 5
  
  if (inputs.safetyFactor && inputs.safetyFactor > 0) {
    doc.text(`Safety Factor: ${inputs.safetyFactor}%`, margin + 5, y)
    y += 5
  }
  if (inputs.ambientTemp) {
    doc.text(`Ambient Temperature: ${inputs.ambientTemp}°C`, margin + 5, y)
    y += 5
  }
  if (inputs.soilResistivity) {
    doc.text(`Soil Resistivity: ${inputs.soilResistivity} Ω·m`, margin + 5, y)
    y += 5
  }
  y += 5

  // Calculation Formula
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Calculation Formula', margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('S = I × √t / k', margin + 5, y)
  y += 5
  doc.text('Where:', margin + 5, y)
  y += 5
  doc.text('  S = Minimum cross-sectional area (mm²)', margin + 10, y)
  y += 5
  doc.text('  I = Fault current (A)', margin + 10, y)
  y += 5
  doc.text('  t = Fault duration (s)', margin + 10, y)
  y += 5
  doc.text(`  k = Material constant (${results.kValue})`, margin + 10, y)
  y += 10

  // Calculation Steps
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Calculation Steps', margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setFont('courier', 'normal')
  
  for (const step of results.calculationSteps) {
    if (y > pageHeight - 40) {
      doc.addPage()
      y = margin
    }
    doc.text(step, margin + 5, y, { maxWidth: pageWidth - 2 * margin - 10 })
    y += 5
  }
  y += 5

  // Results
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Results', margin, y)
  y += 8

  // Highlight box for main result
  doc.setFillColor(240, 248, 255)
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 20, 'F')
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 102, 204)
  doc.text(`Recommended Conductor Size: ${results.conductorSize} mm²`, margin + 5, y + 5)
  doc.setTextColor(0, 0, 0)
  y += 20

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Calculated Size: ${results.calculatedSize.toFixed(2)} mm²`, margin + 5, y)
  y += 5
  doc.text(`Safety Margin: ${results.safetyMargin.toFixed(1)}%`, margin + 5, y)
  y += 5
  doc.text(`Material Constant (k): ${results.kValue}`, margin + 5, y)
  y += 5
  doc.text(`Compliance: ${results.compliance}`, margin + 5, y)
  y += 10

  // Alternative Sizes
  if (results.alternatives.smaller || results.alternatives.larger) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Alternative Conductor Sizes', margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (results.alternatives.smaller) {
      doc.text(`One size smaller: ${results.alternatives.smaller} mm² (not recommended)`, margin + 5, y)
      y += 5
    }
    doc.text(`Selected: ${results.conductorSize} mm² ✓`, margin + 5, y)
    y += 5
    if (results.alternatives.larger) {
      doc.text(`One size larger: ${results.alternatives.larger} mm² (additional safety)`, margin + 5, y)
      y += 5
    }
    y += 5
  }

  // Warnings
  if (results.warnings.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(200, 0, 0)
    doc.text('Warnings', margin, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    
    for (const warning of results.warnings) {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = margin
      }
      doc.text(`⚠ ${warning}`, margin + 5, y, { maxWidth: pageWidth - 2 * margin - 10 })
      y += 6
    }
    y += 5
  }

  // Standards Reference
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Standards Reference', margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  if (inputs.standard === 'IEC') {
    doc.text('IEC 60364-5-54: Low-voltage electrical installations', margin + 5, y)
    y += 5
    doc.text('  Section 543.1.3: Earthing arrangements and protective conductors', margin + 5, y)
    y += 5
    doc.text('  Table 54.2: k values for protective conductors', margin + 5, y)
    y += 5
  } else {
    doc.text('NEC 250: Grounding and Bonding', margin + 5, y)
    y += 5
    doc.text('  Section 250.122: Equipment grounding conductor sizing', margin + 5, y)
    y += 5
    doc.text('  Table 250.122: Minimum size equipment grounding conductors', margin + 5, y)
    y += 5
  }
  
  doc.text('IEC 60228: Conductors of insulated cables (standard sizes)', margin + 5, y)
  y += 10

  // Footer - Disclaimer
  const disclaimerY = pageHeight - margin - 15
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(128, 128, 128)
  const disclaimer = 'This calculation is provided as an engineering tool and must be verified by a licensed professional engineer before use in production systems. The results are based on the input parameters provided and applicable standards at the time of generation.'
  doc.text(disclaimer, margin, disclaimerY, { maxWidth: pageWidth - 2 * margin })

  // Footer - Page info
  doc.setFontSize(7)
  doc.text('Page 1 of 1', pageWidth / 2, pageHeight - margin, { align: 'center' })
  doc.text(`Generated: ${new Date().toISOString()}`, pageWidth - margin, pageHeight - margin, { align: 'right' })

  return doc.output('blob')
}
