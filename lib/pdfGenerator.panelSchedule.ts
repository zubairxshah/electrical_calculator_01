// PDF Generator for the Panel Schedule (NEC 2020 Art. 220/408/430 · IEC 60364 / IEC 61439-2)

import jsPDF from 'jspdf'
import packageJson from '@/package.json'
import type { Circuit, DemandResult, Panel, ScheduleResult } from '@/types/panel-schedule'
import { phaseLabel, phaseOfSpace } from '@/lib/calculations/panel-schedule/system'
import { occupancyMap } from '@/lib/calculations/panel-schedule/placement'
import { OCCUPANCY_LABELS } from '@/lib/calculations/panel-schedule/defaults'

const LEFT = 10
const ROW_H = 4.6

const DISCLAIMER =
  'Disclaimer: Calculations are for informational purposes. Demand factors, motor full-load currents and ' +
  'equipment ratings must be verified against the code edition adopted by the Authority Having Jurisdiction. ' +
  'PE stamp/certification is the responsibility of the user.'

/** Helvetica (WinAnsi) has no glyphs for these — replace with ASCII equivalents */
const pdfSafe = (s: string) =>
  s
    .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/→/g, '->').replace(/√/g, 'sqrt')
    .replace(/φ/g, 'ph').replace(/[‘’]/g, "'").replace(/┃/g, '|')

const fmtVA = (v: number) => Math.round(v).toLocaleString('en-US')

export function generatePanelSchedulePDF(panel: Panel, schedule: ScheduleResult, demand: DemandResult): jsPDF {
  const nec = panel.standard === 'NEC'
  const doc = new jsPDF({ unit: 'mm', format: nec ? 'letter' : 'a4', orientation: 'landscape' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const RIGHT = pageW - LEFT
  const BOTTOM = pageH - 12
  const { system, summary } = schedule
  let y = 14

  const text = (s: string, x: number, yy: number, opts?: { align?: 'left' | 'right' | 'center' }) =>
    doc.text(pdfSafe(s), x, yy, opts)

  const newPage = () => {
    doc.addPage()
    y = 14
  }
  const checkPage = (needed: number) => {
    if (y + needed > BOTTOM) newPage()
  }
  const heading = (s: string) => {
    checkPage(12)
    y += 2
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    text(s, LEFT, y)
    y += 1.5
    doc.setDrawColor(160)
    doc.line(LEFT, y, RIGHT, y)
    y += 4.5
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  text(`Panel Schedule — ${panel.name || 'Untitled'}`, LEFT, y)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  text(`ElectroMate v${packageJson.version} · ${new Date().toLocaleString()}`, RIGHT, y, { align: 'right' })
  y += 6

  const header: [string, string][] = [
    ['System', system.label],
    ['Bus rating', `${panel.busRatingA} A`],
    ['Main', panel.mainType === 'main-breaker' ? `${panel.mainRatingA ?? '—'} A main breaker` : 'Main lugs only (MLO)'],
    ['Spaces', String(panel.spaces)],
    ['Location', panel.location || '—'],
    ['Fed from', panel.fedFrom || '—'],
    ['Mounting', panel.mounting || '—'],
    ['SCCR', panel.sccrKA ? `${panel.sccrKA} kA` : '—'],
  ]
  doc.setFontSize(8.5)
  const colW = (RIGHT - LEFT) / 4
  header.forEach(([k, v], i) => {
    const x = LEFT + (i % 4) * colW
    const yy = y + Math.floor(i / 4) * 4.5
    doc.setFont('helvetica', 'bold')
    text(`${k}:`, x, yy)
    doc.setFont('helvetica', 'normal')
    text(v, x + 20, yy)
  })
  y += 11

  // ── Schedule table ──────────────────────────────────────────────────────────
  // Columns: Ckt | Description | Bkr | VA | Phase | VA | Bkr | Description | Ckt
  const w = RIGHT - LEFT
  const cols = { ckt: 9, bkr: 14, va: 16, phase: 12 }
  const descW = (w - 2 * (cols.ckt + cols.bkr + cols.va) - cols.phase) / 2
  const x = {
    lCkt: LEFT, lDesc: LEFT + cols.ckt, lBkr: LEFT + cols.ckt + descW, lVa: LEFT + cols.ckt + descW + cols.bkr,
  }
  const mid = x.lVa + cols.va
  const r = { va: mid + cols.phase, bkr: mid + cols.phase + cols.va, desc: mid + cols.phase + cols.va + cols.bkr }
  const rCkt = r.desc + descW

  const occ = occupancyMap(panel.circuits)
  const byId = new Map(panel.circuits.map((c) => [c.id, c]))
  const loadById = new Map(schedule.circuitLoads.map((l) => [l.circuitId, l]))
  const invalid = new Set(schedule.issues.map((i) => i.circuitId))

  const tableHeader = () => {
    doc.setFillColor(235, 235, 235)
    doc.rect(LEFT, y - 3.4, w, ROW_H, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    text('Ckt', x.lCkt + 1, y)
    text('Description', x.lDesc + 1, y)
    text('Bkr/P', x.lBkr + 1, y)
    text('VA', x.lVa + cols.va - 1, y, { align: 'right' })
    text('Phase', mid + cols.phase / 2, y, { align: 'center' })
    text('VA', r.va + 1, y)
    text('Bkr/P', r.bkr + 1, y)
    text('Description', r.desc + descW - 1, y, { align: 'right' })
    text('Ckt', RIGHT - 1, y, { align: 'right' })
    y += ROW_H
  }

  const cellFor = (space: number) => {
    const o = occ.get(space)
    const c: Circuit | undefined = o ? byId.get(o.circuitId) : undefined
    if (!c || space > panel.spaces) return { desc: '', bkr: '', va: '' }
    const first = o!.poleIndex === 0
    const phase = phaseOfSpace(space, system)
    const load = loadById.get(c.id)
    const share = load?.vaPerPhase[phase] ?? 0
    const name = c.kind === 'spare' ? (c.description || 'SPARE') : c.kind === 'space' ? (c.description || 'SPACE') : c.description
    return {
      desc: first ? `${name}${invalid.has(c.id) ? ' (INVALID)' : ''}` : '  |',
      bkr: first && c.kind !== 'space' ? `${c.breakerA ?? '—'}/${c.poles}` : '',
      va: share > 0 ? fmtVA(share) : '',
    }
  }

  const fit = (s: string, width: number) => {
    const safe = pdfSafe(s)
    if (doc.getTextWidth(safe) <= width - 2) return safe
    let t = safe
    while (t.length > 1 && doc.getTextWidth(`${t}...`) > width - 2) t = t.slice(0, -1)
    return `${t}...`
  }

  tableHeader()
  doc.setFont('helvetica', 'normal')
  const rows = Math.ceil(panel.spaces / 2)
  for (let row = 1; row <= rows; row++) {
    if (y + ROW_H > BOTTOM) {
      newPage()
      tableHeader()
      doc.setFont('helvetica', 'normal')
    }
    const ls = 2 * row - 1
    const rs = 2 * row
    const L = cellFor(ls)
    const R = cellFor(rs)
    doc.setDrawColor(215)
    doc.line(LEFT, y + 1.2, RIGHT, y + 1.2)
    doc.setFontSize(7.5)
    doc.text(String(ls), x.lCkt + 1, y)
    doc.text(fit(L.desc, descW), x.lDesc + 1, y)
    doc.text(L.bkr, x.lBkr + 1, y)
    doc.text(L.va, x.lVa + cols.va - 1, y, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(phaseLabel(phaseOfSpace(ls, system), system), mid + cols.phase / 2, y, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    if (rs <= panel.spaces) {
      doc.text(R.va, r.va + 1, y)
      doc.text(R.bkr, r.bkr + 1, y)
      doc.text(fit(R.desc, descW), r.desc + descW - 1, y, { align: 'right' })
      doc.text(String(rs), RIGHT - 1, y, { align: 'right' })
    }
    y += ROW_H
  }

  // ── Phase totals ────────────────────────────────────────────────────────────
  heading('Connected load by phase')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  const pc = [LEFT, LEFT + 30, LEFT + 70, LEFT + 105]
  text('Phase', pc[0], y)
  text('VA', pc[1] + 30, y, { align: 'right' })
  text('Current (A)', pc[2] + 25, y, { align: 'right' })
  text('Deviation', pc[3] + 20, y, { align: 'right' })
  y += 4.5
  doc.setFont('helvetica', 'normal')
  for (const p of summary.perPhase) {
    text(p.label, pc[0], y)
    text(fmtVA(p.va), pc[1] + 30, y, { align: 'right' })
    text(p.currentA.toFixed(1), pc[2] + 25, y, { align: 'right' })
    text(p.deviationPct === null ? '—' : `${p.deviationPct >= 0 ? '+' : ''}${p.deviationPct.toFixed(1)} %`, pc[3] + 20, y, { align: 'right' })
    y += 4.5
  }
  doc.setFont('helvetica', 'bold')
  text('Total', pc[0], y)
  text(fmtVA(summary.totalVA), pc[1] + 30, y, { align: 'right' })
  text(summary.totalCurrentA.toFixed(1), pc[2] + 25, y, { align: 'right' })
  y += 5.5
  doc.setFont('helvetica', 'normal')
  text(
    `Imbalance: ${summary.imbalancePct === null ? '—' : `${summary.imbalancePct.toFixed(1)} %`} (target ${panel.imbalanceTargetPct} %)` +
      ` · Neutral (est., L-N loads, no harmonics): ${summary.neutralCurrentA === null ? 'no neutral' : `${summary.neutralCurrentA.toFixed(1)} A`}` +
      ` · Spaces used: ${summary.usedSpaces} of ${panel.spaces}`,
    LEFT, y,
  )
  y += 5

  // ── Demand ──────────────────────────────────────────────────────────────────
  heading(nec ? `Demand load — NEC 2020 Article 220 (occupancy: ${OCCUPANCY_LABELS[panel.occupancy]})` : 'Demand load — IEC diversity')
  const dc = [LEFT, LEFT + 75, LEFT + 115, LEFT + 150, RIGHT - 60]
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  text('Rule', dc[0], y)
  text('Reference', dc[1], y)
  text('Connected VA', dc[2] + 30, y, { align: 'right' })
  text('Factor', dc[3], y)
  text('Demand VA', RIGHT, y, { align: 'right' })
  y += 4.5
  doc.setFont('helvetica', 'normal')
  for (const rule of demand.rules) {
    checkPage(5)
    text(rule.label, dc[0], y)
    text(rule.reference, dc[1], y)
    text(fmtVA(rule.connectedVA), dc[2] + 30, y, { align: 'right' })
    text(fit(rule.factorText, RIGHT - 25 - dc[3]), dc[3], y)
    text(fmtVA(rule.demandVA), RIGHT, y, { align: 'right' })
    y += 4.5
  }
  checkPage(16)
  doc.setFont('helvetica', 'bold')
  text('Total demand', dc[0], y)
  text(fmtVA(demand.connectedVA), dc[2] + 30, y, { align: 'right' })
  text(fmtVA(demand.demandVA), RIGHT, y, { align: 'right' })
  y += 5.5
  text(
    `Design current: ${demand.designCurrentA.toFixed(1)} A · Recommended main/feeder OCPD: ${demand.recommendedMainA ? `${demand.recommendedMainA} A` : 'above largest standard rating'}` +
      ` (${nec ? 'NEC 240.6(A)' : 'IEC preferred ratings'}) · Bus: ${demand.busOk ? 'OK' : 'EXCEEDED'}` +
      (demand.mainOk === null ? '' : ` · Main: ${demand.mainOk ? 'OK' : 'EXCEEDED'}`),
    LEFT, y,
  )
  y += 5
  doc.setFont('helvetica', 'normal')

  const warnings = [...schedule.warnings, ...demand.warnings, ...schedule.issues.map((i) => ({ message: i.message, reference: undefined }))]
  if (warnings.length > 0) {
    heading('Warnings and notes')
    doc.setFontSize(8)
    for (const wn of warnings) {
      const lines = doc.splitTextToSize(pdfSafe(`• ${wn.message}${wn.reference ? ` (${wn.reference})` : ''}`), RIGHT - LEFT) as string[]
      checkPage(lines.length * 4)
      doc.text(lines, LEFT, y)
      y += lines.length * 4
    }
  }

  heading('References')
  doc.setFontSize(8)
  const refs = nec
    ? ['NEC 2020 408.3(E) phase arrangement', 'NEC 2020 Tables 220.42, 220.44, 220.56; 220.60; 215.2(A)(1)', 'NEC 2020 430.6(A)(1), 430.24, Tables 430.248 / 430.250', 'NEC 2020 240.6(A) standard ampere ratings; 210.20(A); 408.30; 408.36']
    : ['IEC 60364 (designer diversity factors)', 'IEC 61439-2 rated diversity factor (assumed loading)', 'IEC 60898-1 / IEC 60947-2 preferred ratings']
  for (const ref of refs) {
    checkPage(4)
    text(`• ${ref}`, LEFT, y)
    y += 4
  }

  y += 2
  const lines = doc.splitTextToSize(pdfSafe(DISCLAIMER), RIGHT - LEFT) as string[]
  checkPage(lines.length * 3.6)
  doc.setFontSize(7.5)
  doc.text(lines, LEFT, y)

  return doc
}

export function downloadPanelSchedulePDF(panel: Panel, schedule: ScheduleResult, demand: DemandResult): void {
  const doc = generatePanelSchedulePDF(panel, schedule, demand)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `panel-schedule-${(panel.name || 'panel').replace(/[^\w.-]+/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
