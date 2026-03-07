import jsPDF from 'jspdf'
import type {
  PFCInput,
  PFCCalculationResults,
  PFCProjectInfo,
} from '@/types/power-factor-correction'

export interface PFCPDFOptions {
  input: PFCInput
  results: PFCCalculationResults
  project?: PFCProjectInfo
}

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 20
const MARGIN_RIGHT = 20
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

export async function downloadPowerFactorCorrectionPDF(options: PFCPDFOptions): Promise<void> {
  const blob = await generatePowerFactorCorrectionPDF(options)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `PFC-Report-${new Date().toISOString().slice(0, 10)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function generatePowerFactorCorrectionPDF(options: PFCPDFOptions): Promise<Blob> {
  const { input, results, project } = options
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = 20

  const checkPage = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - 30) {
      doc.addPage()
      y = 20
    }
  }

  const addSectionTitle = (title: string) => {
    checkPage(15)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(33, 33, 33)
    doc.text(title, MARGIN_LEFT, y)
    y += 2
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y)
    y += 6
  }

  const addKeyValue = (key: string, value: string) => {
    checkPage(8)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(key, MARGIN_LEFT, y)
    doc.setTextColor(33, 33, 33)
    doc.setFont('helvetica', 'bold')
    doc.text(value, MARGIN_LEFT + 80, y)
    doc.setFont('helvetica', 'normal')
    y += 6
  }

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text('ElectroMate', MARGIN_LEFT, y)
  y += 8
  doc.setFontSize(14)
  doc.setTextColor(33, 33, 33)
  doc.text('Power Factor Correction Report', MARGIN_LEFT, y)
  y += 10

  // Project Info
  if (project && (project.projectName || project.engineerName)) {
    addSectionTitle('Project Information')
    if (project.projectName) addKeyValue('Project:', project.projectName)
    if (project.projectLocation) addKeyValue('Location:', project.projectLocation)
    if (project.engineerName) addKeyValue('Engineer:', project.engineerName)
    y += 4
  }

  // Input Parameters
  addSectionTitle('Input Parameters')
  addKeyValue('Standard:', input.standard === 'IEC' ? 'IEC 60831' : 'NEC 460')
  addKeyValue('System Type:', input.systemType === 'three-phase-ac' ? '3-Phase AC' : '1-Phase AC')
  addKeyValue('Voltage:', `${input.voltage} V`)
  addKeyValue('Frequency:', `${input.frequency} Hz`)
  addKeyValue('Active Power:', `${input.activePower} kW`)
  addKeyValue('Current Power Factor:', `${input.currentPowerFactor}`)
  addKeyValue('Target Power Factor:', `${input.targetPowerFactor}`)
  addKeyValue('Connection:', input.connectionType === 'delta' ? 'Delta' : 'Star')
  addKeyValue('Correction Type:', input.correctionType)
  addKeyValue('Load Profile:', input.loadProfile)
  addKeyValue('THD:', `${input.harmonicDistortion}%`)
  y += 4

  // Load Analysis
  addSectionTitle('Load Analysis (Before Correction)')
  const la = results.loadAnalysis
  addKeyValue('Active Power:', `${la.activePowerKW} kW`)
  addKeyValue('Reactive Power:', `${la.currentReactivePowerKVAR} kVAR`)
  addKeyValue('Apparent Power:', `${la.currentApparentPowerKVA} kVA`)
  addKeyValue('Power Factor:', `${la.currentPowerFactor}`)
  addKeyValue('Phase Angle:', `${la.currentPhaseAngleDeg}°`)
  addKeyValue('Line Current:', `${la.currentLineCurrent} A`)
  y += 4

  // Correction Sizing
  addSectionTitle('Correction Results')
  const cs = results.correctionSizing
  addKeyValue('Required kVAR:', `${cs.requiredKVAR} kVAR`)
  addKeyValue('Corrected Reactive Power:', `${cs.correctedReactivePowerKVAR} kVAR`)
  addKeyValue('Corrected Apparent Power:', `${cs.correctedApparentPowerKVA} kVA`)
  addKeyValue('Corrected Power Factor:', `${cs.correctedPowerFactor}`)
  addKeyValue('Corrected Current:', `${cs.correctedLineCurrent} A`)
  addKeyValue('Current Reduction:', `${cs.currentReduction} A (${cs.currentReductionPercent}%)`)
  y += 2
  checkPage(10)
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Formula: ${cs.formula}`, MARGIN_LEFT, y)
  y += 8

  // Capacitor Bank
  addSectionTitle('Capacitor Bank Specification')
  const cb = results.capacitorBank
  addKeyValue('Total Rating:', `${cb.totalKVAR} kVAR`)
  addKeyValue('Steps:', `${cb.numberOfSteps} x ${cb.kvarPerStep} kVAR`)
  addKeyValue('Capacitor Type:', cb.capacitorType)
  addKeyValue('Rated Voltage:', `${cb.ratedVoltage} V`)
  addKeyValue('Rated Current:', `${cb.ratedCurrent} A`)
  addKeyValue('Capacitance/Phase:', `${cb.capacitancePerPhase} µF`)
  addKeyValue('Connection:', cb.connectionType === 'delta' ? 'Delta' : 'Star')
  addKeyValue('Discharge Resistors:', cb.dischargeResistors ? 'Yes (required)' : 'No')
  addKeyValue('Fused Protection:', cb.fusedProtection ? 'Yes' : 'No')
  addKeyValue('Code Reference:', cb.codeReference)
  y += 4

  // Savings
  addSectionTitle('Estimated Savings')
  const sv = results.savings
  addKeyValue('kVA Reduction:', `${sv.kvaReduction} kVA`)
  addKeyValue('Current Saved:', `${sv.currentReductionAmps} A`)
  addKeyValue('I²R Loss Reduction:', `${sv.estimatedLossReductionPercent}%`)
  addKeyValue('Demand Charge Saving:', `${sv.demandChargeSavingPercent}%`)
  addKeyValue('Penalty Avoidance:', sv.penaltyAvoidance ? 'Yes' : 'N/A')
  y += 4

  // Derating
  if (results.deratingFactors) {
    addSectionTitle('Derating Factors')
    const df = results.deratingFactors
    addKeyValue('Temperature Derating:', `${df.temperatureDerating}`)
    addKeyValue('Altitude Derating:', `${df.altitudeDerating}`)
    addKeyValue('Harmonic Derating:', `${df.harmonicDerating}`)
    addKeyValue('Combined Factor:', `${df.combinedDerating}`)
    addKeyValue('Adjusted kVAR:', `${df.adjustedKVAR} kVAR`)
    y += 4
  }

  // Alerts
  if (results.alerts.length > 0) {
    addSectionTitle('Notes & Warnings')
    results.alerts.forEach((alert) => {
      checkPage(10)
      doc.setFontSize(8)
      const prefix = alert.type === 'error' ? '⚠ ERROR: ' : alert.type === 'warning' ? '⚠ WARNING: ' : 'ℹ '
      doc.setTextColor(alert.type === 'error' ? 200 : alert.type === 'warning' ? 180 : 80, alert.type === 'info' ? 80 : 50, 50)
      const lines = doc.splitTextToSize(`${prefix}${alert.message}`, CONTENT_WIDTH)
      doc.text(lines, MARGIN_LEFT, y)
      y += lines.length * 4 + 3
    })
  }

  // Footer
  checkPage(20)
  y += 6
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y)
  y += 6
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated by ElectroMate | ${new Date().toLocaleString()} | v${results.version}`, MARGIN_LEFT, y)

  return doc.output('blob')
}
