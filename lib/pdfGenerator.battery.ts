/**
 * Battery Calculator PDF report generator (US5, T042).
 *
 * Standalone per-calculator generator (same pattern as pdfGenerator.generatorSizing.ts).
 * Takes a BatteryCalculatorResult directly — no session-format mapping needed.
 * Client-side only (jsPDF). Includes inputs, headline, applied factors, bank
 * config, recommendations, standards references, timestamp, and disclaimer
 * (Constitution Principle VI).
 */

import { jsPDF } from 'jspdf'
import { toNumber } from '@/lib/mathConfig'
import { chemistryDisplayLabel } from '@/lib/standards/batteryChemistryMap'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import type { BatteryCalculatorResult } from '@/lib/types'

const DISCLAIMER =
  'Calculations are for informational purposes only. Final design verification, PE stamp, and code compliance are the responsibility of the user.'

export function generateBatteryPDF(result: BatteryCalculatorResult): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const left = 48
  let y = 56
  const lineH = 16
  const pageW = doc.internal.pageSize.getWidth()

  const heading = (text: string) => {
    y += 6
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(20)
    doc.text(text, left, y)
    y += lineH
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60)
  }
  const row = (label: string, value: string) => {
    doc.setTextColor(110)
    doc.text(label, left, y)
    doc.setTextColor(30)
    doc.text(value, pageW - left, y, { align: 'right' })
    y += lineH
  }

  // Title
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(15)
  doc.text('Battery Sizing Report', left, y)
  y += 22
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120)
  doc.text(`ElectroMate · Generated ${new Date(result.timestamp).toLocaleString()}`, left, y)
  y += 10
  doc.setDrawColor(220).line(left, y, pageW - left, y)
  y += 12

  const i = result.inputs
  const chem = chemistryDisplayLabel[toCanonicalChemistry(String(i.chemistry))]

  // Headline
  heading(result.mode === 'sizing' ? 'Result — Required Capacity' : 'Result — Backup Time')
  if (result.mode === 'sizing' && result.requiredCapacityAh != null) {
    row('Required capacity', `${toNumber(result.requiredCapacityAh).toFixed(1)} Ah`)
    row('Bank', `${result.bankConfig.cellsInSeries}S × ${result.bankConfig.stringsInParallel}P (${result.bankConfig.nameplateBankAh} Ah nameplate)`)
    row('Delivered backup time', `${toNumber(result.backupTimeHours).toFixed(2)} h`)
  } else {
    row('Backup time', `${toNumber(result.backupTimeHours).toFixed(2)} h`)
    row('Effective capacity', `${toNumber(result.effectiveCapacityAh).toFixed(1)} Ah`)
  }
  row('Discharge rate', `C/${(1 / toNumber(result.dischargeRate)).toFixed(1)}`)
  row('Verdict', result.verdict.toUpperCase())

  // Inputs
  heading('Inputs')
  row('Chemistry', chem)
  row('System voltage', `${i.voltage} V DC`)
  row('Load', `${i.loadWatts} W`)
  if (result.mode === 'runtime') row('Installed capacity', `${i.ampHours ?? '—'} Ah`)
  else row('Target backup time', `${i.targetBackupHours ?? '—'} h`)
  row('Operating temperature', `${i.temperature ?? 25} °C`)

  // Applied factors
  heading('Applied Factors')
  const f = result.appliedFactors
  row('Depth of discharge', `${(f.dod.value * 100).toFixed(0)}% (${f.dod.source})`)
  row('Temperature factor', `${(f.temperature.value * 100).toFixed(0)}% (${f.temperature.source})`)
  row('Efficiency', `${(f.efficiency.value * 100).toFixed(0)}% (${f.efficiency.source})`)
  row('Aging (EOL)', `${(f.aging.value * 100).toFixed(0)}% (${f.aging.source})`)
  row('Peukert derate', `${(f.peukert.value * 100).toFixed(1)}%`)

  // Recommendations
  if (result.recommendations.length) {
    heading('Recommendations')
    for (const r of result.recommendations) {
      const lines = doc.splitTextToSize(`• ${r}`, pageW - left * 2)
      doc.text(lines, left, y)
      y += lineH * lines.length
    }
  }

  // Standards
  heading('Standards Applied')
  const std = doc.splitTextToSize(result.standardsApplied.join(' · '), pageW - left * 2)
  doc.text(std, left, y)
  y += lineH * std.length

  // Disclaimer
  y += 8
  doc.setDrawColor(220).line(left, y, pageW - left, y)
  y += 14
  doc.setFontSize(8).setTextColor(140)
  const disc = doc.splitTextToSize(DISCLAIMER, pageW - left * 2)
  doc.text(disc, left, y)

  return doc
}

export function downloadBatteryPDF(result: BatteryCalculatorResult, filename?: string): void {
  const doc = generateBatteryPDF(result)
  doc.save(filename ?? `electromate-battery-${Date.now()}.pdf`)
}
