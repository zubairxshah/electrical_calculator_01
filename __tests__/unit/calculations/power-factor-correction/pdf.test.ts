import { describe, it, expect } from 'vitest'
import { buildPanelDesignSections, PFC_DISCLAIMER } from '@/lib/pdfGenerator.powerFactorCorrection'
import { designPanel, DEFAULT_DESIGN } from '@/lib/calculations/power-factor-correction/panelDesign'
import { iecInput, resultsFor } from './fixtures'

const flatten = (sections: ReturnType<typeof buildPanelDesignSections>) =>
  sections.map(s => [
    s.title,
    ...(s.keyValues ?? []).flat(),
    ...(s.table ? [...s.table.head, ...s.table.rows.flat()] : []),
    ...(s.notes ?? []),
  ].join('\n')).join('\n')

describe('buildPanelDesignSections (FR-018)', () => {
  const detuned = designPanel(
    { ...iecInput, harmonicDistortion: 15 }, resultsFor(300),
    { ...DEFAULT_DESIGN, sequenceMode: '1:2:4', maxOutputs: 6, overrides: { 2: { contactorA: 115 } } }
  )
  const sections = buildPanelDesignSections(detuned, 'IEC')
  const text = flatten(sections)

  it('has the step bank, detuning, switchgear and standards sections', () => {
    const titles = sections.map(s => s.title)
    expect(titles).toEqual(expect.arrayContaining([
      'APFC Step Bank', 'Detuned Reactors', 'Switchgear Schedule', 'Panel Incomer & Busbar', 'Standards References',
    ]))
  })

  it('contains every step row in the step and switchgear tables', () => {
    const bank = sections.find(s => s.title === 'APFC Step Bank')!
    const sg = sections.find(s => s.title === 'Switchgear Schedule')!
    expect(bank.table!.rows).toHaveLength(5)
    expect(sg.table!.rows).toHaveLength(5)
    expect(bank.table!.rows.map(r => r[0])).toEqual(['C1', 'C2', 'C3', 'C4', 'C5'])
  })

  it('includes C/k, tuning frequency and the incomer', () => {
    expect(text).toContain('0.144 A')
    expect(text).toContain('189.0 Hz')
    expect(text).toContain('630 A')
  })

  it('marks overrides', () => {
    expect(text).toContain('(override)')
  })

  it('lists the standards', () => {
    for (const ref of ['IEC 60831', 'IEC 61921', 'IEC 60947-4-1', 'IEEE 18', 'NEC 460']) {
      expect(text).toContain(ref)
    }
  })

  it('uses only characters the built-in PDF font can draw', () => {
    // WinAnsi (Latin-1 + a few) — no √, ≥, Σ, →, Ω
    expect(text).not.toMatch(/[√≥≤Σ→Ω·]/)
  })

  it('states "No detuning applied" when detuning is off', () => {
    const plain = designPanel(iecInput, resultsFor(300), DEFAULT_DESIGN)
    const t = flatten(buildPanelDesignSections(plain, 'IEC'))
    expect(t).toContain('No detuning applied')
  })

  it('exports a disclaimer', () => {
    expect(PFC_DISCLAIMER).toMatch(/informational purposes/i)
  })
})
