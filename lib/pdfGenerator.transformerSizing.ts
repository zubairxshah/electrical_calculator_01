// PDF Generator for Transformer Sizing Calculator

import jsPDF from 'jspdf'
import type { TransformerInput, TransformerCalculationResults, TransformerProjectInfo } from '@/types/transformer-sizing'

interface TransformerPDFInput {
  input: TransformerInput
  results: TransformerCalculationResults
  project: TransformerProjectInfo
}

export async function downloadTransformerSizingPDF(data: TransformerPDFInput): Promise<void> {
  const { input, results, project } = data
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

  // Header
  addLine('Transformer Sizing Report', 16, true)
  addLine('ElectroMate Engineering Calculations', 9)
  y += 2

  // Project Info
  if (project.projectName || project.engineerName || project.projectLocation) {
    addLine('Project Information', 11, true)
    if (project.projectName) addRow('Project:', project.projectName)
    if (project.projectLocation) addRow('Location:', project.projectLocation)
    if (project.engineerName) addRow('Engineer:', project.engineerName)
    addRow('Date:', new Date().toLocaleDateString())
    addRow('Standard:', input.standard)
    y += 3
  }

  // Input Parameters
  addLine('Input Parameters', 11, true)
  addRow('Phase:', input.phase)
  addRow('Load:', `${input.loadKW} kW @ PF ${input.loadPowerFactor}`)
  addRow('Primary Voltage:', `${input.primaryVoltage.toLocaleString()} V`)
  addRow('Secondary Voltage:', `${input.secondaryVoltage} V`)
  addRow('Transformer Type:', input.transformerType)
  addRow('Cooling Class:', input.coolingClass)
  if (input.phase === 'three-phase') addRow('Vector Group:', input.vectorGroup)
  addRow('Load Profile:', input.loadProfile)
  addRow('Demand Factor:', `${(input.demandFactor * 100).toFixed(0)}%`)
  addRow('Future Growth:', `${(input.futureGrowth * 100).toFixed(0)}%`)
  y += 3

  // Selection
  addLine('Transformer Selection', 11, true)
  const sel = results.selection
  addRow('Rated kVA:', `${sel.ratedKVA} kVA`)
  addRow('Loading:', `${sel.loadingPercent}%`)
  addRow('Overload Margin:', `${sel.overloadMargin}%`)
  addRow('Code Reference:', sel.codeReference)
  y += 3

  // Load Analysis
  addLine('Load Analysis', 11, true)
  const la = results.loadAnalysis
  addRow('Load kVA:', `${la.loadKVA}`)
  addRow('Demand kVA:', `${la.demandKVA}`)
  addRow('Design kVA:', `${la.designKVA}`)
  addRow('Primary Current:', `${la.primaryCurrentA} A`)
  addRow('Secondary Current:', `${la.secondaryCurrentA} A`)
  addRow('Turns Ratio:', `${la.turnsRatio}`)
  y += 3

  // Losses
  addLine('Losses & Efficiency', 11, true)
  const lo = results.losses
  addRow('No-Load Loss:', `${lo.noLoadLossW} W`)
  addRow('Full-Load Loss:', `${lo.fullLoadLossW} W`)
  addRow('Actual Load Loss:', `${lo.actualLoadLossW} W`)
  addRow('Total Loss:', `${lo.totalLossW} W`)
  addRow('Efficiency:', `${lo.efficiencyPercent}%`)
  addRow('Max Efficiency at:', `${lo.maxEfficiencyLoadPercent}% load (${lo.maxEfficiencyPercent}%)`)
  addRow('Annual Energy Loss:', `${lo.annualEnergyLossKWh.toLocaleString()} kWh`)
  y += 3

  // Impedance
  addLine('Impedance & Short Circuit', 11, true)
  const imp = results.impedance
  addRow('%Z:', `${imp.impedancePercent}%`)
  addRow('%R:', `${imp.resistancePercent}%`)
  addRow('%X:', `${imp.reactancePercent}%`)
  addRow('Short Circuit Current:', `${imp.shortCircuitKA} kA`)
  y += 3

  // Voltage Regulation
  addLine('Voltage Regulation', 11, true)
  const vr = results.voltageRegulation
  addRow('Regulation:', `${vr.regulationPercent}%`)
  addRow('Voltage Drop:', `${vr.voltageDrop} V`)
  addRow('V at Load:', `${vr.secondaryVoltageAtLoad} V`)
  y += 3

  // Tap Settings
  if (results.tapSettings.tapPosition !== 'none') {
    addLine('Tap Settings', 11, true)
    const ts = results.tapSettings
    addRow('Type:', ts.tapPosition)
    addRow('Range:', `±${ts.tapRange}%`)
    addRow('Steps:', `${ts.tapSteps}`)
    addRow('V per Tap:', `${ts.voltagePerTap} V`)
    addRow('Min Secondary V:', `${ts.minSecondaryVoltage} V`)
    addRow('Max Secondary V:', `${ts.maxSecondaryVoltage} V`)
    y += 3
  }

  // Derating
  if (results.derating) {
    addLine('Derating Factors', 11, true)
    const dr = results.derating
    addRow('Temperature Derating:', `${(dr.temperatureDerating * 100).toFixed(1)}%`)
    addRow('Altitude Derating:', `${(dr.altitudeDerating * 100).toFixed(1)}%`)
    addRow('Combined Derating:', `${(dr.combinedDerating * 100).toFixed(1)}%`)
    addRow('Effective kVA:', `${dr.effectiveKVA}`)
    addRow('Reference:', dr.codeReference)
    y += 3
  }

  // Alerts
  if (results.alerts.length > 0) {
    addLine('Alerts & Notes', 11, true)
    results.alerts.forEach(alert => {
      const prefix = alert.type === 'error' ? 'ERROR' : alert.type === 'warning' ? 'WARNING' : 'INFO'
      addRow(`[${prefix}]`, alert.message)
    })
  }

  // Footer
  y += 5
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text('Generated by ElectroMate - For reference only. Verify with qualified engineer.', 14, y)

  doc.save(`transformer-sizing-${sel.ratedKVA}kVA-${new Date().toISOString().slice(0, 10)}.pdf`)
}
