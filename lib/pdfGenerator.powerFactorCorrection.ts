import jsPDF from 'jspdf'
import type {
  PFCInput,
  PFCCalculationResults,
  PFCProjectInfo,
  PFCPanelDesign,
  PFCStandard,
} from '@/types/power-factor-correction'

export interface PFCPDFOptions {
  input: PFCInput
  results: PFCCalculationResults
  project?: PFCProjectInfo
  /** APFC panel design (stages 2–4); omitted for MV or when not designed */
  design?: PFCPanelDesign
}

export const PFC_DISCLAIMER =
  "Calculations for informational purposes; PE stamp/certification is the user's responsibility. " +
  'Switchgear ratings are generic standard series - confirm with the selected manufacturer.'

/** A report section built from plain data so it can be tested without rendering */
export interface PdfSection {
  title: string
  keyValues?: [string, string][]
  table?: { head: string[]; rows: string[][]; widths: number[] }
  notes?: string[]
}

const f = (n: number, d = 1) => n.toFixed(d)

/** Replace symbols the built-in Helvetica font cannot draw */
function toAscii(text: string): string {
  return text
    .replace(/√/g, 'sqrt').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/Σ/g, 'sum')
    .replace(/→/g, '->').replace(/Ω/g, 'ohm').replace(/·/g, 'x').replace(/[—−]/g, '-')
}

/** Panel design sections (FR-018). ASCII only: the built-in font has no sqrt/>=/Omega glyphs. */
export function buildPanelDesignSections(design: PFCPanelDesign, standard: PFCStandard): PdfSection[] {
  const sections: PdfSection[] = []
  const bank = design.stepBank
  const det = design.detuning
  const sg = design.switchgear

  if (bank) {
    const keyValues: [string, string][] = [
      ['Target (derated):', `${f(bank.targetKVAR, 2)} kVAR`],
      ['Installed:', `${f(bank.totalKVAR, 2)} kVAR`],
      ['Sequence:', bank.preset ?? (bank.controller ? 'Custom' : 'Fixed (single step)')],
      ['Resolution (smallest step):', `${f(bank.resolutionKVAR, 2)} kVAR`],
      ['Switching levels:', `${bank.switchingLevels}`],
    ]
    if (bank.controller) {
      keyValues.push(['Controller:', `${bank.controller.outputs}-output (${bank.outputsUsed} used)`])
      keyValues.push(['CT ratio:', f(bank.controller.ctRatio, 1)])
      keyValues.push(['C/k setting:', bank.controller.ck !== null ? `${bank.controller.ck.toFixed(3)} A` : 'CT ratio not entered'])
    }
    sections.push({
      title: 'APFC Step Bank',
      keyValues,
      table: {
        head: ['Step', 'Ratio', 'kVAR @ U', 'Cumulative kVAR'],
        rows: bank.steps.map(s => [
          `C${s.index}`, s.ratio !== null ? String(s.ratio) : '-', f(s.effectiveKVAR, 2), f(s.cumulativeKVAR, 2),
        ]),
        widths: [25, 25, 50, 50],
      },
      notes: bank.controller ? ['C/k = Q1 / (sqrt(3) x U x k), k = CT primary / secondary (IEC 61921).'] : [],
    })
  }

  if (det) {
    if (det.applied === null) {
      sections.push({
        title: 'Detuned Reactors',
        keyValues: [
          ['Detuning:', 'No detuning applied'],
          ['Recommended:', det.recommended !== null ? `${det.recommended} %` : 'None'],
          ['Capacitor rated voltage:', `${det.capacitorRatedVoltageV} V`],
          ['Total rated kVAR:', `${f(det.totalRatedKVAR)} kVAR`],
        ],
      })
    } else {
      sections.push({
        title: 'Detuned Reactors',
        keyValues: [
          ['Detuning factor p:', `${det.applied} %`],
          ['Tuning frequency:', `${f(det.tuningFrequencyHz ?? 0)} Hz`],
          ['Capacitor terminal voltage:', `${f(det.capacitorVoltageV)} V`],
          ['Capacitor rated voltage:', `${det.capacitorRatedVoltageV} V`],
          ['Total rated kVAR:', `${f(det.totalRatedKVAR)} kVAR`],
        ],
        table: {
          head: ['Step', 'kVAR @ U', `Rated kVAR @ ${det.capacitorRatedVoltageV} V`, 'L (mH/ph)', 'I (A)'],
          rows: det.steps.map(s => [
            `C${s.index}`, f(s.effectiveKVAR, 2), f(s.ratedKVAR, 2),
            s.reactorInductanceMH !== null ? s.reactorInductanceMH.toFixed(3) : '-', f(s.currentA),
          ]),
          widths: [20, 30, 45, 30, 25],
        },
        notes: [
          'fr = f / sqrt(p); Uc = U / (1 - p); Ur >= 1.1 x Uc (IEC 60831-1).',
          'Xc = U^2 / (Qeff x (1 - p)); L = p x Xc / (2 pi f); Qr = Ur^2 / Xc.',
          'Reactor linearity and thermal ratings to be confirmed with the manufacturer.',
        ],
      })
    }
  }

  if (sg) {
    const mark = (overridden: boolean, ok: boolean) => `${overridden ? ' (override)' : ''}${ok ? '' : ' !'}`
    const iec = standard === 'IEC'
    sections.push({
      title: 'Switchgear Schedule',
      keyValues: [
        ['Design current factor:', iec ? '1.43 x In (1.3 x 1.1, IEC 60831-1 / IEC 61921)' : '1.35 x In (NEC 460.8(A))'],
        ['Protection type:', sg.protectionType === 'fuse' ? (iec ? 'gG fuse' : 'Fuse') : (iec ? 'MCCB' : 'Circuit breaker')],
        ['Contactor:', sg.steps[0]?.contactor.type ?? '-'],
      ],
      table: {
        head: ['Step', 'In (A)', 'Design (A)', 'Contactor (A)', 'Protection (A)', 'Cable (Cu)'],
        rows: sg.steps.map(s => [
          `C${s.index}`, f(s.ratedCurrentA), f(s.designCurrentA),
          `${s.contactor.value ?? 'n/a'}${mark(s.contactor.overridden, s.contactor.ok)}`,
          `${s.protection.value ?? 'n/a'}${mark(s.protection.overridden, s.protection.ok)}`,
          `${s.cable.label ?? s.cable.value ?? 'n/a'}${mark(s.cable.overridden, s.cable.ok)}`,
        ]),
        widths: [16, 22, 26, 34, 34, 38],
      },
      notes: ['"!" marks a rating below the design current.'],
    })
    sections.push({
      title: 'Panel Incomer & Busbar',
      keyValues: [
        ['Sum of step currents:', `${f(sg.totalRatedCurrentA)} A`],
        ['Design current:', `${f(sg.totalDesignCurrentA)} A`],
        ['Main incomer:', sg.incomerA !== null ? `${sg.incomerA} A` : 'n/a'],
        ['Busbar:', sg.busbarA !== null ? `${sg.busbarA} A` : 'n/a'],
      ],
    })
  }

  if (design.warnings.length > 0) {
    sections.push({
      title: 'Panel Design Warnings',
      notes: design.warnings.map(w => `${w.severity.toUpperCase()}: ${toAscii(w.message)}`),
    })
  }

  sections.push({
    title: 'Standards References',
    notes: [
      'IEC 60831-1/-2 - Shunt power capacitors of the self-healing type (up to 1 kV)',
      'IEC 61921 - Power capacitors: low-voltage power factor correction banks',
      'IEC 60947-4-1 - Contactors, utilization category AC-6b (capacitor switching)',
      'IEEE 18 - Shunt power capacitors',
      'NEC 460 - Capacitors (460.8 conductors, overcurrent protection, disconnect)',
      standard === 'IEC'
        ? 'IEC 60364-5-52 - Current-carrying capacity of cables'
        : 'NEC Table 310.16 / 240.6(A) - Ampacity and standard ratings',
    ],
  })
  return sections
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

  // APFC panel design (stages 2–4)
  if (options.design) {
    for (const section of buildPanelDesignSections(options.design, input.standard)) {
      addSectionTitle(section.title)
      section.keyValues?.forEach(([k, v]) => addKeyValue(k, v))
      if (section.table) {
        const { head, rows, widths } = section.table
        const drawRow = (cells: string[], bold: boolean) => {
          checkPage(6)
          doc.setFontSize(8)
          doc.setFont('helvetica', bold ? 'bold' : 'normal')
          doc.setTextColor(33, 33, 33)
          let x = MARGIN_LEFT
          cells.forEach((c, i) => {
            doc.text(c, x, y)
            x += widths[i]
          })
          y += 5
        }
        y += 2
        drawRow(head, true)
        rows.forEach(r => drawRow(r, false))
        doc.setFont('helvetica', 'normal')
      }
      section.notes?.forEach(n => {
        checkPage(8)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        const lines = doc.splitTextToSize(n, CONTENT_WIDTH)
        doc.text(lines, MARGIN_LEFT, y)
        y += lines.length * 4 + 1
      })
      y += 4
    }
  }

  // Footer
  checkPage(28)
  y += 6
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y)
  y += 6
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated by ElectroMate | ${new Date().toLocaleString()} | v${results.version}`, MARGIN_LEFT, y)
  y += 4
  doc.text(doc.splitTextToSize(PFC_DISCLAIMER, CONTENT_WIDTH), MARGIN_LEFT, y)

  return doc.output('blob')
}
