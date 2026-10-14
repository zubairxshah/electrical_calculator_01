/**
 * Battery Calculator PDF report generator (US5, T042).
 *
 * Standalone per-calculator generator (same pattern as pdfGenerator.generatorSizing.ts).
 * Takes a BatteryCalculatorResult directly — no session-format mapping needed.
 * Client-side only (jsPDF). Includes inputs, headline, applied factors, bank
 * config, recommendations, standards references, timestamp, and disclaimer
 * (Constitution Principle VI). 015 adds application, design margin/TCF,
 * voltage window, charger, ventilation and installation checks (FR-030).
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
  const pageH = doc.internal.pageSize.getHeight()

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 56) {
      doc.addPage()
      y = 56
    }
  }
  const heading = (text: string) => {
    ensureSpace(lineH * 3)
    y += 6
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(20)
    doc.text(text, left, y)
    y += lineH
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60)
  }
  const row = (label: string, value: string) => {
    ensureSpace(lineH)
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
  row('Application', result.application === 'standby' ? 'Standby / float (IEEE 485)' : 'Cycling (IEEE 1013 / 1561)')
  row('Load type', (i.loadType ?? 'ac') === 'ac' ? 'AC via inverter' : 'DC')
  row('Chemistry', chem)
  row('System voltage', `${i.voltage} V DC`)
  row('Load', `${i.loadWatts} W`)
  if (result.mode === 'runtime') row('Installed capacity', `${i.ampHours ?? '—'} Ah`)
  else row('Target backup time', `${i.targetBackupHours ?? '—'} h`)
  row('Operating temperature', `${i.temperature ?? 25} °C`)

  // Applied factors
  heading('Applied Factors')
  const f = result.appliedFactors
  row(
    'Depth of discharge',
    result.application === 'standby'
      ? '100% — full discharge to end voltage (IEEE 485)'
      : `${(f.dod.value * 100).toFixed(0)}% (${f.dod.source})`
  )
  row(
    'Temperature factor',
    `${(f.temperature.value * 100).toFixed(1)}%${f.temperature.tcf != null ? ` (TCF ${f.temperature.tcf.toFixed(3)})` : ''} (${f.temperature.source})`
  )
  row('Conversion efficiency', `${(f.efficiency.value * 100).toFixed(0)}% (${f.efficiency.source})`)
  row('Aging (EOL)', `${(f.aging.value * 100).toFixed(0)}% (${f.aging.source})`)
  row('Design margin', `×${f.designMargin.value.toFixed(2)} (${f.designMargin.source})`)
  row('Peukert derate', `${(f.peukert.value * 100).toFixed(1)}%`)

  // Voltage window / bank voltages
  const vw = result.voltageWindow
  heading('Bank Voltages')
  row(vw.source === 'window' ? 'Cells in series (from voltage window)' : 'Blocks in series', `${result.bankConfig.cellsInSeries}`)
  row('End voltage per cell', `${vw.endVoltagePerCell} V`)
  row('Nominal / float / end', `${vw.nominalBankV.toFixed(1)} / ${vw.floatBankV.toFixed(1)} / ${vw.endBankV.toFixed(1)} V`)
  row('Stored energy', `${result.bankEnergyKWh.toFixed(1)} kWh`)

  // Charger
  if (result.charger) {
    const c = result.charger
    heading('Charger (IEEE 946)')
    row('Ah removed', `${c.ahRemoved.toFixed(1)} Ah`)
    row('Recharge factor / time', `${c.rechargeFactor.value.toFixed(2)} / ${c.rechargeHours} h`)
    row('Standing load', `${c.standingLoadAmps.toFixed(1)} A`)
    row('Required output', `${c.requiredAmps.toFixed(1)} A`)
    row('Recommended rating', `${c.recommendedRatingA} A`)
  }

  // Ventilation
  heading('Ventilation (IEC 62485-2 / EN 50272-2)')
  const v = result.ventilation
  if (v.applicable) {
    row('Cells × rated Ah', `${v.cells} × ${v.ratedAh.toFixed(0)} Ah`)
    row('I_gas float / boost', `${v.igasFloat} / ${v.igasBoost} mA/Ah`)
    row('Airflow float / boost', `${(v.qFloatM3h ?? 0).toFixed(2)} / ${(v.qBoostM3h ?? 0).toFixed(2)} m³/h`)
    if (v.airChangesPerHour != null) row('Air changes', `${v.airChangesPerHour.toFixed(2)} /h`)
  } else {
    const lines = doc.splitTextToSize(v.note, pageW - left * 2)
    ensureSpace(lineH * lines.length)
    doc.text(lines, left, y)
    y += lineH * lines.length
  }

  // Installation checks
  if (result.installationChecks.length) {
    heading('Installation Checks (informative)')
    for (const c of result.installationChecks) {
      const lines = doc.splitTextToSize(`• ${c.code} [${c.standardReference}]: ${c.message}`, pageW - left * 2)
      ensureSpace(lineH * lines.length)
      doc.text(lines, left, y)
      y += lineH * lines.length
    }
  }

  // Recommendations
  if (result.recommendations.length) {
    heading('Recommendations')
    for (const r of result.recommendations) {
      const lines = doc.splitTextToSize(`• ${r}`, pageW - left * 2)
      ensureSpace(lineH * lines.length)
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
