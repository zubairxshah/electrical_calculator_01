/**
 * US7 accessibility checks (015 T039, SC-005): every control in the battery
 * form has an accessible name, selectors are radiogroups, collapsibles expose
 * aria-expanded, and the result headline is a polite live region.
 * Also a PDF smoke test for the new sections (T040).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BatteryInputForm } from '@/components/battery/BatteryInputForm'
import { BatteryResults } from '@/components/battery/BatteryResults'
import { useBatteryStore, defaultBatteryInputs } from '@/stores/useBatteryStore'
import { calculateBattery } from '@/lib/calculations/battery'
import { generateBatteryPDF } from '@/lib/pdfGenerator.battery'

beforeEach(() => {
  useBatteryStore.setState({ inputs: { ...defaultBatteryInputs }, result: null, validation: null })
})

function expectAllNamed(container: HTMLElement) {
  const controls = container.querySelectorAll('input, select, textarea, button, [role="combobox"], [role="radio"]')
  expect(controls.length).toBeGreaterThan(0)
  controls.forEach((el) => {
    const id = el.getAttribute('id')
    const labelled =
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      (id && container.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
      (el.textContent ?? '').trim()
    expect(labelled, el.outerHTML.slice(0, 120)).toBeTruthy()
  })
}

describe('BatteryInputForm accessibility', () => {
  it('every control has an accessible name (all sections expanded)', () => {
    const { container } = render(<BatteryInputForm />)
    for (const name of [/voltage window/i, /charger/i]) {
      fireEvent.click(screen.getByRole('button', { name }))
    }
    expectAllNamed(container)
  })

  it('application and load type are radiogroups with one checked option', () => {
    render(<BatteryInputForm />)
    const groups = screen.getAllByRole('radiogroup')
    expect(groups).toHaveLength(2)
    for (const g of groups) {
      expect(within(g).getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
    }
    expect(screen.getByRole('radio', { name: /standby/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('arrow keys move the application selection', () => {
    render(<BatteryInputForm />)
    const group = screen.getByRole('radiogroup', { name: /application/i })
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(useBatteryStore.getState().inputs.application).toBe('cycling')
  })

  it('collapsible sections expose aria-expanded', () => {
    render(<BatteryInputForm />)
    const toggle = screen.getByRole('button', { name: /voltage window/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText(/min load voltage/i)).toBeInTheDocument()
  })

  it('field errors are linked via aria-describedby', () => {
    useBatteryStore.getState().setInputs({ designMargin: 2 })
    render(<BatteryInputForm />)
    const input = screen.getByLabelText(/design margin/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const describedBy = input.getAttribute('aria-describedby')!
    expect(document.getElementById(describedBy)?.textContent).toMatch(/1\.00 and 1\.50/)
  })
})

describe('BatteryResults accessibility + new cards', () => {
  const result = calculateBattery({
    voltage: 120, loadWatts: 5000, ampHours: 400, mode: 'runtime', chemistry: 'VRLA-AGM', roomVolumeM3: 30,
  })

  it('headline is a polite live region; override inputs are named', () => {
    const { container } = render(<BatteryResults result={result} />)
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
    container.querySelectorAll('input').forEach((el) => expect(el.getAttribute('aria-label')).toBeTruthy())
  })

  it('shows design margin, charger, ventilation and installation checks', () => {
    render(<BatteryResults result={result} />)
    expect(screen.getByText('Design margin')).toBeInTheDocument()
    expect(screen.getByText('Charger Sizing')).toBeInTheDocument()
    expect(screen.getByText('Battery Room Ventilation')).toBeInTheDocument()
    expect(screen.getByText('NEC 480.7')).toBeInTheDocument()
  })
})

describe('PDF export (FR-030)', () => {
  it('includes the 015 sections', () => {
    const result = calculateBattery({
      voltage: 120, loadWatts: 5000, ampHours: 400, mode: 'runtime', chemistry: 'Li-Ion-LFP',
    })
    const doc = generateBatteryPDF(result)
    const text = doc.output()
    for (const s of ['Application', 'Design margin', 'Bank Voltages', 'Charger', 'Ventilation', 'Installation Checks', 'NFPA 855']) {
      expect(text).toContain(s)
    }
  })
})
