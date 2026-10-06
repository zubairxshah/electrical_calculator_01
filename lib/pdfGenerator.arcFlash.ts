// PDF Generator for the Arc Flash Calculator (IEEE 1584-2018 / NFPA 70E-2024 / IEC 61482)

import jsPDF from 'jspdf'
import packageJson from '@/package.json'
import type {
  ArcFlashInput,
  ArcFlashResult,
  ArcFlashStandard,
  CaseResult,
  PpeAssessment,
} from '@/types/arc-flash'
import { buildArcFlashLabel } from '@/lib/calculations/arc-flash/label'
import { formatDistance, formatEnergy, formatTime } from '@/lib/calculations/arc-flash/units'
import { TABLE_130_7_C_15_A } from '@/lib/standards/nfpa70e'

const PAGE_BOTTOM = 275
const LEFT = 14
const VALUE_X = 90
const RIGHT = 196

const DISCLAIMER =
  'Disclaimer: This report supports, but does not replace, an arc flash risk assessment by a qualified person ' +
  '(NFPA 70E-2024 130.5). Results are calculated with the IEEE 1584-2018 empirical model within its stated ' +
  'range and are for informational purposes; verification and PE stamp/certification are the responsibility ' +
  'of the user. AC systems only.'

/** Helvetica (WinAnsi) has no glyphs for these — replace with ASCII equivalents */
const pdfSafe = (s: string) =>
  s.replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/→/g, '->').replace(/⚠/g, '!').replace(/[‘’]/g, "'")

export function generateArcFlashPDF(
  input: ArcFlashInput,
  result: ArcFlashResult,
  ppe: PpeAssessment,
  standard: ArcFlashStandard
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const isIEC = standard === 'IEC'
  const dist = (mm: number) => formatDistance(mm, standard)
  const energy = (j: number) => formatEnergy(j, standard)
  let y = 20

  const checkPage = (needed = 6) => {
    if (y + needed > PAGE_BOTTOM) {
      doc.addPage()
      y = 20
    }
  }

  const heading = (text: string) => {
    checkPage(12)
    y += 2
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(pdfSafe(text), LEFT, y)
    y += 2
    doc.setDrawColor(180)
    doc.line(LEFT, y, RIGHT, y)
    y += 5
  }

  const row = (label: string, value: string) => {
    const lines = doc.splitTextToSize(pdfSafe(value), RIGHT - VALUE_X) as string[]
    checkPage(lines.length * 4.5)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(pdfSafe(label), LEFT, y)
    doc.text(lines, VALUE_X, y)
    y += lines.length * 4.5
  }

  const paragraph = (text: string, size = 9, bold = false) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(pdfSafe(text), RIGHT - LEFT) as string[]
    checkPage(lines.length * (size * 0.45 + 0.5))
    doc.text(lines, LEFT, y)
    y += lines.length * (size * 0.45 + 0.5)
  }

  const bullets = (items: string[]) => {
    for (const item of items) paragraph(`- ${item}`)
  }

  // 1. Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Arc Flash Hazard Analysis Report', LEFT, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `ElectroMate Engineering Calculations | IEEE 1584-2018 | NFPA 70E-2024${isIEC ? ' | IEC 61482' : ''}`,
    LEFT,
    y
  )
  y += 6
  if (input.projectName) row('Project:', input.projectName)
  row('Equipment ID:', input.equipmentId || '-')
  row('Calculated:', new Date(result.calculatedAt).toLocaleString())
  row('App version:', `v${packageJson.version}`)
  row('Presentation:', isIEC ? 'IEC (metric first)' : 'NEC / NFPA 70E (imperial first)')

  // 2. Inputs
  heading('Input Parameters')
  row('System voltage (L-L):', `${input.voltageV} V, ${input.frequencyHz} Hz`)
  row('Bolted fault current:', `${input.boltedFaultKA} kA`)
  row('Electrode configuration:', input.electrodeConfig)
  row('Conductor gap:', `${input.gapMm} mm`)
  row('Working distance:', dist(input.workingDistanceMm))
  if (input.enclosure) {
    const e = input.enclosure
    row('Enclosure H x W x D:', `${e.heightMm} x ${e.widthMm} x ${e.depthMm} mm`)
  } else {
    row('Enclosure:', 'Open air')
  }
  row('Arcing time, nominal current:', formatTime(input.arcingTimeNominalMs))
  row('Arcing time, reduced current:', formatTime(input.arcingTimeReducedMs))
  if (input.applyTwoSecondCap) row('2 s arcing time cap:', 'Applied (IEEE 1584-2018 6.9.1)')

  // 3. Enclosure correction
  heading('Enclosure Size Correction (IEEE 1584-2018 4.8)')
  const enc = result.enclosure
  row('Enclosure type:', enc.type)
  if (enc.type !== 'open-air') {
    row('Equivalent width / height:', `${enc.equivalentWidthIn.toFixed(3)} in / ${enc.equivalentHeightIn.toFixed(3)} in`)
    row('Equivalent enclosure size (EES):', enc.ees.toFixed(3))
  }
  row('Correction factor (CF):', enc.cf.toFixed(3))

  // 4. Results
  heading('Incident Energy and Arc Flash Boundary')
  row('Model path:', result.modelPath === 'LV' ? 'LV (Voc <= 600 V, Eq. 25)' : 'MV (Voc > 600 V, interpolated)')
  row('Arc current variation factor (VarCf):', result.varCf.toFixed(4))

  const caseBlock = (title: string, c: CaseResult, governs: boolean) => {
    checkPage(26)
    if (governs) {
      doc.setFillColor(255, 237, 213)
      doc.setDrawColor(234, 88, 12)
      doc.rect(LEFT - 2, y - 4, RIGHT - LEFT + 4, 25, 'FD')
    }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`${title}${governs ? '  -  Governing case' : ''}`, LEFT, y)
    y += 5
    row('Arcing current:', `${c.arcingCurrentKA.toFixed(3)} kA`)
    row('Arcing time:', formatTime(c.arcingTimeMs))
    row('Incident energy:', energy(c.incidentEnergyJcm2))
    row('Arc flash boundary:', dist(c.arcFlashBoundaryMm))
    y += 3
  }
  caseBlock('Nominal arcing current case', result.nominal, result.governingCase === 'nominal')
  caseBlock('Reduced arcing current case', result.reduced, result.governingCase === 'reduced')

  if (result.modelPath === 'MV') {
    const i = result.governing.intermediates
    checkPage(14)
    paragraph('Governing case intermediate values (600 / 2700 / 14300 V):', 9, true)
    row('Arcing current (kA):', [i.iArc600KA, i.iArc2700KA, i.iArc14300KA].map((v) => v?.toFixed(3) ?? '-').join(' / '))
    row('Incident energy (J/cm2):', [i.e600Jcm2, i.e2700Jcm2, i.e14300Jcm2].map((v) => v?.toFixed(3) ?? '-').join(' / '))
    row('Arc flash boundary (mm):', [i.afb600Mm, i.afb2700Mm, i.afb14300Mm].map((v) => v?.toFixed(0) ?? '-').join(' / '))
  }

  if (result.warnings.length > 0) {
    checkPage(10)
    paragraph('Warnings:', 9, true)
    bullets(result.warnings.map((w) => `${w.message} (${w.clause})`))
  }

  // 5. PPE
  heading('PPE Assessment')
  const outcome = ppe.outcome
  if (outcome === 'danger') {
    paragraph(
      'DANGER - incident energy exceeds 40 cal/cm2. No PPE category applies. De-energize the equipment or reduce the hazard (e.g. faster clearing time).',
      10,
      true
    )
  } else if (outcome === 'below-threshold') {
    paragraph('Below 1.2 cal/cm2 - no arc-rated PPE category required; wear non-melting clothing.', 10, true)
  } else if (ppe.iecRequirement) {
    paragraph(`Minimum arc rating (ATPV/ELIM per IEC 61482-1-1) >= ${ppe.iecRequirement.minArcRatingJcm2.toFixed(1)} J/cm2`, 10, true)
  } else {
    paragraph(`PPE Category ${outcome} - minimum arc rating ${ppe.minArcRatingCalcm2} cal/cm2 (${ppe.minArcRatingJcm2} J/cm2)`, 10, true)
  }
  if (ppe.iecRequirement) {
    paragraph(ppe.iecRequirement.text)
    paragraph(ppe.iecRequirement.note, 8)
  }
  if (ppe.tableMethod) {
    const label = TABLE_130_7_C_15_A.find((r) => r.id === ppe.tableMethod!.rowId)?.label ?? ppe.tableMethod.rowId
    if (ppe.tableMethod.applicable) {
      paragraph(`Table method applies (${label}): Category ${ppe.tableMethod.category}, arc flash boundary ${dist(ppe.tableMethod.afbMm)}.`)
    } else {
      paragraph(`Table method not applicable (${label}): ${ppe.tableMethod.failedLimits.join('; ')}. The incident energy analysis result is used.`)
    }
  }
  if (ppe.clothing.length > 0 && !ppe.iecRequirement) {
    paragraph('Arc-rated clothing:', 9, true)
    bullets(ppe.clothing)
  }
  if (ppe.equipment.length > 0 && !ppe.iecRequirement) {
    paragraph('Protective equipment:', 9, true)
    bullets(ppe.equipment)
  }

  const ab = ppe.approachBoundaries
  checkPage(18)
  paragraph('Shock approach boundaries (NFPA 70E-2024 Table 130.4(E)(a)):', 9, true)
  row('Limited approach, movable conductor:', `${ab.limitedMovableText} (${Math.round(ab.limitedMovableMm)} mm)`)
  row('Limited approach, fixed circuit part:', `${ab.limitedFixedText} (${Math.round(ab.limitedFixedMm)} mm)`)
  row('Restricted approach:', ab.restricted === 'avoid-contact' ? 'Avoid contact' : `${ab.restrictedText} (${Math.round(ab.restricted)} mm)`)

  // 6. Label
  heading('Equipment Label (NFPA 70E-2024 130.5(H))')
  const label = buildArcFlashLabel(input, result, ppe, standard)
  const labelRows: [string, string][] = [
    ['Arc flash boundary', dist(label.arcFlashBoundaryMm)],
    [
      'Incident energy',
      `${energy(label.incidentEnergyJcm2)} at ${dist(label.workingDistanceMm)}`,
    ],
    [
      'PPE',
      label.ppeOutcome === 'danger'
        ? 'No PPE category applies - de-energize'
        : label.ppeOutcome === 'below-threshold'
          ? 'Below 1.2 cal/cm2'
          : isIEC && label.minArcRatingJcm2 !== null
            ? `ATPV/ELIM >= ${label.minArcRatingJcm2} J/cm2`
            : `PPE Category ${label.ppeOutcome}`,
    ],
    ['Nominal voltage', `${label.nominalVoltageV} V`],
    ['Limited approach', label.limitedApproachText],
    ['Restricted approach', label.restrictedApproachText],
    ['Equipment ID', label.equipmentId || '-'],
    ['Date', label.date],
  ]
  const labelH = 18 + labelRows.length * 6 + 4
  checkPage(labelH + 4)
  const lx = LEFT + 30
  const lw = 120
  const danger = label.signalWord === 'DANGER'
  doc.setDrawColor(0)
  doc.setLineWidth(0.6)
  doc.rect(lx, y, lw, labelH)
  if (danger) doc.setFillColor(200, 16, 46)
  else doc.setFillColor(255, 121, 0)
  doc.rect(lx, y, lw, 12, 'F')
  doc.setTextColor(danger ? 255 : 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`! ${label.signalWord}`, lx + lw / 2, y + 8.5, { align: 'center' })
  doc.setTextColor(0)
  let ly = y + 18
  doc.setFontSize(11)
  doc.text('Arc Flash and Shock Hazard', lx + lw / 2, ly, { align: 'center' })
  ly += 6
  doc.setFontSize(9)
  for (const [k, v] of labelRows) {
    doc.setFont('helvetica', 'bold')
    doc.text(pdfSafe(k), lx + 4, ly)
    doc.setFont('helvetica', 'normal')
    doc.text(pdfSafe(v), lx + 48, ly)
    ly += 6
  }
  doc.setLineWidth(0.2)
  y += labelH + 6

  // 7. References
  heading('References')
  bullets([
    ...result.standardRefs,
    ...ppe.references,
    'NFPA 70E-2024 130.5(H) (equipment labeling)',
    ...(isIEC ? ['IEC 61482-1-1:2019 (ATPV/ELIM open-arc test)', 'IEC 61482-2:2018 (garment requirements)'] : []),
  ])

  // 8. Disclaimer
  y += 3
  paragraph(DISCLAIMER, 8)

  return doc
}

export function downloadArcFlashPDF(
  input: ArcFlashInput,
  result: ArcFlashResult,
  ppe: PpeAssessment,
  standard: ArcFlashStandard
): void {
  const doc = generateArcFlashPDF(input, result, ppe, standard)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const id = (input.equipmentId || `${input.voltageV}V-${input.electrodeConfig}`).replace(/[^\w.-]+/g, '_')
  a.href = url
  a.download = `arc-flash-${id}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
