// PDF Generator for Motor Starting Analysis Calculator
// Multi-page report: cover, inputs, source chain, comparison table, per-method results, citations.

import jsPDF from 'jspdf'
import type { MotorStartingResult } from '@/types/motor-starting'

const FOOTER_DISCLAIMER =
  'This report is provided for engineering reference. Verify all results against local codes and AHJ requirements.'

export function generateMotorStartingPdf(result: MotorStartingResult): jsPDF {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  let y = 20

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage()
      y = 20
    }
  }
  const addLine = (text: string, size = 10, bold = false) => {
    ensureSpace(size * 0.6 + 2)
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(text, 14, y)
    y += size * 0.5 + 2
  }
  const addRow = (label: string, value: string) => {
    ensureSpace(5)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(label, 14, y)
    doc.text(value, 90, y)
    y += 5
  }
  const addParagraph = (text: string, size = 9) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, pageW - 28)
    for (const ln of lines) {
      ensureSpace(size * 0.5 + 1)
      doc.text(ln, 14, y)
      y += size * 0.5 + 1
    }
    y += 2
  }
  const drawTable = (headers: string[], rows: string[][], widths: number[]) => {
    const startX = 14
    const rowH = 6
    ensureSpace(rowH * (rows.length + 1) + 4)
    // Header
    doc.setFillColor(37, 99, 235)
    doc.setTextColor(255, 255, 255)
    doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    let x = startX + 2
    headers.forEach((h, i) => {
      doc.text(h, x, y + 4)
      x += widths[i]
    })
    y += rowH
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    rows.forEach((row, ri) => {
      ensureSpace(rowH)
      if (ri % 2 === 1) {
        doc.setFillColor(245, 247, 250)
        doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH, 'F')
      }
      x = startX + 2
      row.forEach((cell, i) => {
        const text = doc.splitTextToSize(cell, widths[i] - 4)[0] ?? ''
        doc.text(String(text), x, y + 4)
        x += widths[i]
      })
      y += rowH
    })
    y += 2
  }

  // ── Cover ────────────────────────────────────────────────────────
  addLine('Motor Starting Analysis Report', 18, true)
  addLine('ElectroMate Engineering Calculations', 9)
  addRow('Date:', new Date(result.computedAt).toLocaleString())
  addRow('Standard:', `${result.input.standard}  |  Version ${result.version}`)
  if (result.input.projectName) addRow('Project:', result.input.projectName)
  if (result.input.projectRef) addRow('Reference:', result.input.projectRef)
  y += 3

  // ── 1. Inputs ────────────────────────────────────────────────────
  const m = result.input.motor
  const l = result.input.load
  addLine('1. Motor & Load Inputs', 12, true)
  drawTable(
    ['Parameter', 'Value'],
    [
      ['Rated Power', `${m.ratedPower} ${m.powerUnit}`],
      ['Rated Voltage', `${m.ratedVoltage} V`],
      ['FLA', `${m.ratedCurrent} A`],
      ['Poles', String(m.poles)],
      ['Efficiency / PF / SF', `${m.efficiency} / ${m.powerFactor} / ${m.serviceFactor}`],
      ['Design Class', m.designClass],
      ['Code Letter', m.codeLetter ?? '—'],
      ['Load profile', l.torqueProfile],
      ['Break-away torque', `${l.breakawayTorquePerRated} × T_rated`],
      ['Inertia', `${l.inertia} ${l.inertiaUnit}`],
    ],
    [60, 110],
  )

  // ── 2. Source Chain ─────────────────────────────────────────────
  const u = result.input.sourceChain.utility
  const tr = result.input.sourceChain.transformer
  const cab = result.input.sourceChain.cable
  addLine('2. Source Impedance Chain', 12, true)
  drawTable(
    ['Element', 'Value'],
    [
      [
        'Utility',
        u.isInfiniteBus
          ? 'Infinite bus assumed'
          : `${u.shortCircuitMva ?? '—'} MVA at ${u.primaryVoltage} kV (X/R=${u.xOverR})`,
      ],
      ['Transformer', `${tr.ratedKva} kVA, ${tr.primaryVoltageKv}/${(tr.secondaryVoltageV / 1000).toFixed(2)} kV, %Z=${tr.percentZ}, X/R=${tr.xOverR}`],
      ['Cable', `${cab.sizeId} ${cab.material}, ${cab.lengthMeters} m, ${cab.parallelRuns} run(s), ${cab.conduitType}`],
      ['Z_total (pu)', `R = ${result.sourceImpedance.zTotalPu.r.toFixed(4)}, X = ${result.sourceImpedance.zTotalPu.x.toFixed(4)}`],
      ['Z_total (Ω)', `R = ${result.sourceImpedance.zTotalOhms.r.toFixed(5)}, X = ${result.sourceImpedance.zTotalOhms.x.toFixed(5)}`],
      ['Utility', result.sourceImpedance.utilityAssumed === 'infinite_bus' ? 'Infinite bus' : 'Computed from SC data'],
    ],
    [60, 110],
  )

  // ── 3. Comparison Table ──────────────────────────────────────────
  doc.addPage()
  y = 20
  addLine('3. Method Comparison', 12, true)
  drawTable(
    ['Method', 'I% FLA', 'T% rated', 'Dip @ PCC', 'Accel', 'Cost', 'Verdict'],
    result.comparison.methods.map((mr) => [
      mr.methodLabel,
      `${mr.startingCurrentPctFla.toFixed(0)}%`,
      `${mr.startingTorquePctRated.toFixed(0)}%`,
      `${mr.voltageDipAtPccPct.toFixed(1)}%`,
      isFinite(mr.accelerationTimeSec) ? `${mr.accelerationTimeSec.toFixed(2)}s` : '∞',
      mr.qualitativeCost,
      mr.verdictBadge.replaceAll('_', ' '),
    ]),
    [50, 22, 24, 24, 22, 18, 30],
  )
  addLine('Recommendation', 11, true)
  addParagraph(result.comparison.recommendationRationale)
  addRow('Threshold applied:', `${result.comparison.thresholdAppliedPct}% (${result.comparison.thresholdScenario})`)

  // ── 4. Per-Method Detail ─────────────────────────────────────────
  doc.addPage()
  y = 20
  addLine('4. Per-Method Details', 12, true)
  result.comparison.methods.forEach((mr) => {
    addLine(mr.methodLabel, 10, true)
    drawTable(
      ['Parameter', 'Value'],
      [
        ['Starting current (line)', `${mr.startingCurrentLineAmps.toFixed(0)} A`],
        ['Starting current (motor)', `${mr.startingCurrentMotorAmps.toFixed(0)} A`],
        ['Starting torque', `${mr.startingTorquePctRated.toFixed(0)}% rated`],
        ['Voltage at motor', `${mr.voltageAtMotorPu.toFixed(3)} pu`],
        ['Voltage dip at PCC', `${mr.voltageDipAtPccPct.toFixed(1)}%  (${mr.voltageDipPasses1668 ? 'within' : 'exceeds'} threshold)`],
        ['Acceleration time', isFinite(mr.accelerationTimeSec) ? `${mr.accelerationTimeSec.toFixed(2)} s` : '∞'],
        ['Thermal margin', `${(mr.thermalMarginRatio * 100).toFixed(0)}% of t_stall (${mr.thermalVerdict})`],
        ['Verdict', mr.verdictBadge.replaceAll('_', ' ')],
      ],
      [60, 110],
    )
    if (mr.methodNotes.length > 0) {
      mr.methodNotes.forEach((n) => addParagraph(`• ${n}`, 8))
    }
    y += 2
  })

  // ── 5. Citations ─────────────────────────────────────────────────
  doc.addPage()
  y = 20
  addLine('5. Standards & Citations', 12, true)
  const cites = [
    'NEC 430.7(B) — Locked-rotor kVA per HP (NEMA Code Letters A–V)',
    'NEC 430.52 — Branch-circuit short-circuit and ground-fault protection (related)',
    'IEC 60034-12:2016 — Rotating electrical machines — Starting performance',
    'IEC 60364-5-52 — Wiring systems (cable impedance reference)',
    'IEEE 3002.7-2018 — Recommended Practice for Conducting Motor-Starting Studies',
    'IEEE 1668-2017 — Voltage-Sag and Short-Duration Power Quality',
    'NEMA MG 1-2016 — Motors and Generators (thermal limit / stall time)',
  ]
  cites.forEach((c) => addParagraph(`• ${c}`, 9))

  y = Math.max(y, 270)
  doc.setFontSize(8)
  doc.setTextColor(120)
  const lines = doc.splitTextToSize(FOOTER_DISCLAIMER, pageW - 28)
  lines.forEach((ln: string, i: number) => doc.text(ln, 14, 282 + i * 4))

  return doc
}
