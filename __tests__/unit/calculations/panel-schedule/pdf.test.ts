import { describe, it, expect } from 'vitest'
import { generatePanelSchedulePDF } from '@/lib/pdfGenerator.panelSchedule'
import { calculateSchedule } from '@/lib/calculations/panel-schedule/schedule'
import { calculateDemand } from '@/lib/calculations/panel-schedule/demand'
import type { Panel } from '@/types/panel-schedule'
import { ckt, exampleA, panel } from './helpers'

/** Raw (uncompressed) PDF source — text-show operators contain the drawn strings */
function pdfText(p: Panel) {
  const schedule = calculateSchedule(p)
  const demand = calculateDemand(p, schedule)
  const doc = generatePanelSchedulePDF(p, schedule, demand)
  return { doc, raw: doc.output() as string, schedule, demand }
}

describe('generatePanelSchedulePDF', () => {
  const p = exampleA()
  p.circuits.push(ckt({ id: 'SP', kind: 'spare', description: '', startSpace: 8 }))
  const { doc, raw, demand } = pdfText(p)

  it('renders on a landscape Letter page in NEC mode', () => {
    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight())
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(279.4, 0)
  })

  it('contains header, every circuit, totals, demand and references', () => {
    for (const s of [
      'Panel Schedule', 'LP-1', '208Y/120 V 3ph 4W', '225 A', '200 A main breaker',
      'Lighting', 'Receptacles', 'Water heater', 'Copier', 'RTU', 'SPARE',
      '7,640', '9,200', '8,400', '25,240',
      'Total demand', `${demand.designCurrentA.toFixed(1)} A`,
      'NEC 2020 Tables 220.42', 'Disclaimer',
    ]) {
      expect(raw, s).toContain(s)
    }
  })

  it('A4 + IEC references in IEC mode', () => {
    const iec = pdfText(panel({
      standard: 'IEC', systemType: 'iec-3ph-4w-400y230', name: 'DB-2',
      circuits: [ckt({ description: 'Sockets', category: 'receptacle', loadValue: 3000, startSpace: 1 })],
    }))
    expect(iec.doc.internal.pageSize.getWidth()).toBeCloseTo(297, 0)
    expect(iec.raw).toContain('IEC 61439-2')
    expect(iec.raw).toContain('L1')
  })

  it('84-space panel spills onto a second page without throwing', () => {
    const big = panel({ spaces: 84, circuits: Array.from({ length: 84 }, (_, i) => ckt({ description: `Ckt ${i + 1}`, startSpace: i + 1 })) })
    const { doc: d, raw: r } = pdfText(big)
    expect(d.getNumberOfPages()).toBeGreaterThanOrEqual(2)
    expect(r).toContain('Ckt 84')
  })

  it('empty panel renders', () => {
    expect(() => pdfText(panel())).not.toThrow()
  })
})
