// PDF Generator for Generator Sizing Calculator

import jsPDF from 'jspdf'
import type {
  LoadItem,
  GeneratorConfig,
  SiteConditions,
  FuelConfig,
  SizingResult,
} from '@/types/generator-sizing'

interface GeneratorSizingPDFInput {
  loads: LoadItem[]
  generatorConfig: GeneratorConfig
  siteConditions: SiteConditions
  fuelConfig: FuelConfig | null
  result: SizingResult
}

export async function downloadGeneratorSizingPDF(data: GeneratorSizingPDFInput): Promise<void> {
  const { loads, generatorConfig, siteConditions, fuelConfig, result } = data
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

  // ── Header ──────────────────────────────────────────────────────

  addLine('Generator Sizing Report', 16, true)
  addLine('ElectroMate Engineering Calculations', 9)
  addRow('Date:', new Date().toLocaleDateString())
  addRow('Standards:', 'ISO 8528, IEEE 3006.4, NFPA 110')
  y += 3

  // ── Generator Configuration ─────────────────────────────────────

  addLine('Generator Configuration', 11, true)
  addRow('Duty Type:', generatorConfig.dutyType === 'standby' ? 'Standby' : 'Prime')
  addRow('Voltage:', `${generatorConfig.voltage} V`)
  addRow('Phases:', generatorConfig.phases === 'three' ? '3-Phase' : 'Single Phase')
  addRow('Frequency:', `${generatorConfig.frequency} Hz`)
  addRow('Fuel Type:', generatorConfig.fuelType === 'diesel' ? 'Diesel' : 'Natural Gas')
  addRow('Xd\'\':', `${generatorConfig.subtransientReactance} pu`)
  if (generatorConfig.dutyType === 'prime') {
    addRow('Prime Loading Limit:', `${(generatorConfig.primeLoadingLimit * 100).toFixed(0)}%`)
  }
  if (generatorConfig.necClassification) {
    addRow('NEC Classification:', `Article ${generatorConfig.necClassification}`)
  }
  y += 3

  // ── Load Schedule ───────────────────────────────────────────────

  addLine('Load Schedule', 11, true)
  addLine(`Total loads: ${loads.length}`, 9)
  y += 2

  for (const bd of result.perLoadBreakdown) {
    if (y > 260) { doc.addPage(); y = 20 }
    addRow(`${bd.name} (${bd.type}):`, `${bd.effectiveKw.toFixed(1)} kW / ${bd.kva.toFixed(1)} kVA @ PF ${bd.powerFactor} x${bd.quantity}`)
  }
  y += 3

  // ── Vector Summation Results ────────────────────────────────────

  addLine('Vector Summation (IEEE 3006.4)', 11, true)
  addRow('Total Running kW:', `${result.totalRunningKw} kW`)
  addRow('Total Running kVAR:', `${result.totalRunningKvar} kVAR`)
  addRow('Total Running kVA:', `${result.totalRunningKva} kVA`)
  addRow('Combined Power Factor:', `${result.combinedPowerFactor}`)
  addRow('Formula:', 'kVA = sqrt(sum(kW)^2 + sum(kVAR)^2)')
  y += 3

  // ── Derating ────────────────────────────────────────────────────

  if (result.deratingFactor < 1) {
    addLine('Site Derating (ISO 8528-1)', 11, true)
    addRow('Altitude:', `${siteConditions.altitude} m`)
    addRow('Ambient Temperature:', `${siteConditions.ambientTemperature} C`)
    addRow('Altitude Factor:', `${result.altitudeDeratingFactor}`)
    addRow('Temperature Factor:', `${result.temperatureDeratingFactor}`)
    addRow('Combined Factor:', `${result.deratingFactor}`)
    addRow('Required kVA (before):', `${result.requiredKvaBeforeDerating} kVA`)
    addRow('Required kVA (after):', `${result.requiredKvaAfterDerating} kVA`)
    y += 3
  }

  // ── Generator Selection ─────────────────────────────────────────

  addLine('Recommended Generator', 11, true)
  addRow('Recommended Size:', `${result.recommendedGeneratorKva} kVA`)
  addRow('Loading:', `${result.loadingPercent}%`)
  addRow('Required kVA:', `${result.requiredKvaAfterDerating} kVA`)
  y += 3

  // ── Motor Starting Analysis ─────────────────────────────────────

  if (result.motorStartingAnalysis.length > 0) {
    addLine('Motor Starting Analysis', 11, true)
    for (const ms of result.motorStartingAnalysis) {
      if (y > 260) { doc.addPage(); y = 20 }
      const status = ms.passesThreshold ? 'PASS' : 'FAIL'
      addRow(
        `${ms.motorName} (${ms.motorHp ?? '-'} HP):`,
        `${ms.startingKva} kVA start, ${ms.voltageDipPercent}% dip [${status}]`
      )
      addRow('  Starting Method:', `${ms.startingMethod} (x${ms.startingMethodMultiplier})`)
    }
    addRow('Formula:', 'Vdip% = (Xd\'\' x StartKVA / GenKVA) x 100')
    if (result.worstCaseVoltageDip) {
      addRow('Worst Case:', `${result.worstCaseVoltageDip.motorName} at ${result.worstCaseVoltageDip.voltageDipPercent}%`)
    }
    y += 3
  }

  // ── Step Loading Sequence ───────────────────────────────────────

  if (result.stepLoadingSequence.length > 0) {
    addLine('Step Loading Sequence', 11, true)
    for (const step of result.stepLoadingSequence) {
      if (y > 260) { doc.addPage(); y = 20 }
      addRow(
        `Step ${step.stepNumber}:`,
        `+${step.incrementalKw} kW / Cum: ${step.cumulativeKva.toFixed(1)} kVA (${step.generatorLoadingPercent}%) [${step.status.toUpperCase()}]`
      )
      addRow('  Loads:', step.loadNames.join(', '))
      if (step.motorStartingKvaInStep > 0) {
        addRow('  Motor Starting:', `${step.motorStartingKvaInStep} kVA`)
      }
    }
    y += 3
  }

  // ── Fuel Consumption ────────────────────────────────────────────

  if (result.fuelConsumption) {
    const fuel = result.fuelConsumption
    addLine('Fuel Consumption Estimation', 11, true)
    addRow('Fuel Type:', fuel.fuelType === 'diesel' ? 'Diesel' : 'Natural Gas')
    addRow('Average Loading:', `${fuel.loadingPercent}%`)
    addRow('Runtime:', `${fuel.runtimeHours} hours`)
    addRow('SFC Used:', `${fuel.sfcUsed} ${fuel.fuelType === 'diesel' ? 'L/kW/hr' : 'm3/kW/hr'}`)
    addRow('Consumption Rate:', `${fuel.consumptionRate} ${fuel.fuelType === 'diesel' ? 'L/hr' : 'm3/hr'} (${fuel.consumptionRateImperial} gal/hr)`)
    addRow('Total Fuel Required:', `${fuel.totalFuelRequired} ${fuel.fuelType === 'diesel' ? 'L' : 'm3'} (${fuel.totalFuelRequiredImperial} gal)`)
    addRow('Reserve (10%):', `${fuel.reserveVolume} ${fuel.fuelType === 'diesel' ? 'L' : 'm3'}`)
    y += 3
  }

  // ── NEC Constraints ─────────────────────────────────────────────

  if (result.necConstraints) {
    addLine('NEC Classification', 11, true)
    addRow('Classification:', `NEC Article ${result.necConstraints.classification} — ${result.necConstraints.description}`)
    if (result.necConstraints.startupTimeSeconds !== null) {
      addRow('Max Startup Time:', `${result.necConstraints.startupTimeSeconds} seconds`)
    }
    if (result.necConstraints.minFuelDurationHours !== null) {
      addRow('Min Fuel Duration:', `${result.necConstraints.minFuelDurationHours} hours`)
    }
    y += 3
  }

  // ── Alerts ──────────────────────────────────────────────────────

  if (result.alerts.length > 0) {
    addLine('Alerts & Warnings', 11, true)
    for (const alert of result.alerts) {
      if (y > 265) { doc.addPage(); y = 20 }
      const prefix = alert.severity === 'error' ? 'ERROR' : alert.severity === 'warning' ? 'WARNING' : 'INFO'
      addRow(`[${prefix}]`, alert.message)
      if (alert.standardRef) {
        addRow('', `Ref: ${alert.standardRef}`)
      }
    }
    y += 3
  }

  // ── Standards References ────────────────────────────────────────

  addLine('Standards References', 11, true)
  addLine('- ISO 8528-1: Reciprocating internal combustion engine driven alternating current generating sets', 8)
  addLine('- IEEE 3006.4: Recommended Practice for Determining the Impact of Generator Loading', 8)
  addLine('- NFPA 110: Standard for Emergency and Standby Power Systems', 8)
  addLine('- NEC Articles 700, 701, 702: Emergency, Legally Required, Optional Standby Systems', 8)
  y += 3

  // ── Disclaimer ──────────────────────────────────────────────────

  if (y > 265) { doc.addPage(); y = 20 }
  y += 5
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text('Generated by ElectroMate — For reference only. All generator selections must be verified by a', 14, y)
  y += 3
  doc.text('qualified electrical engineer. Actual generator performance may vary based on site conditions,', 14, y)
  y += 3
  doc.text('manufacturer specifications, and installation factors not accounted for in this simplified analysis.', 14, y)

  doc.save(`generator-sizing-${result.recommendedGeneratorKva}kVA-${new Date().toISOString().slice(0, 10)}.pdf`)
}
