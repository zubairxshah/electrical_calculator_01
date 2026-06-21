/**
 * Battery validation tests (new model: mode-aware + chemistry-aware).
 * Replaces the pre-revamp suite (feature 011-battery-revamp).
 */

import { describe, it, expect } from 'vitest'
import { validateBatteryInputs } from '@/lib/validation/batteryValidation'
import type { BatteryCalculatorInputs } from '@/lib/types'

function inputs(overrides: Partial<BatteryCalculatorInputs> = {}): BatteryCalculatorInputs {
  return {
    voltage: 48,
    mode: 'runtime',
    ampHours: 200,
    loadWatts: 2000,
    agingFactor: 0.8,
    temperature: 25,
    chemistry: 'VRLA-AGM',
    ...overrides,
  }
}

describe('validateBatteryInputs — mode-aware required fields', () => {
  it('accepts a valid runtime input', () => {
    expect(validateBatteryInputs(inputs()).isValid).toBe(true)
  })
  it('requires ampHours in runtime mode', () => {
    const r = validateBatteryInputs(inputs({ ampHours: undefined }))
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.field === 'ampHours')).toBe(true)
  })
  it('requires targetBackupHours in sizing mode', () => {
    const r = validateBatteryInputs(inputs({ mode: 'sizing', ampHours: undefined, targetBackupHours: undefined }))
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.field === 'targetBackupHours')).toBe(true)
  })
  it('accepts a valid sizing input', () => {
    expect(
      validateBatteryInputs(inputs({ mode: 'sizing', ampHours: undefined, targetBackupHours: 4 })).isValid
    ).toBe(true)
  })
})

describe('validateBatteryInputs — bounds & safety', () => {
  it('rejects out-of-range voltage', () => {
    expect(validateBatteryInputs(inputs({ voltage: 5000 })).isValid).toBe(false)
  })
  it('errors when temperature is outside the chemistry operating range', () => {
    const r = validateBatteryInputs(inputs({ temperature: 80 })) // AGM operating max 50
    expect(r.isValid).toBe(false)
    expect(r.errors.some((e) => e.field === 'temperature')).toBe(true)
  })
  it('warns on high discharge rate', () => {
    const r = validateBatteryInputs(inputs({ loadWatts: 5000 }))
    expect(r.warnings.some((w) => w.field === 'loadWatts')).toBe(true)
  })
  it('warns when DoD override exceeds chemistry maximum', () => {
    const r = validateBatteryInputs(inputs({ dodOverride: 0.95 })) // AGM max 80%
    expect(r.warnings.some((w) => w.field === 'dodOverride')).toBe(true)
  })
  it('warns on end-of-life aging factor', () => {
    const r = validateBatteryInputs(inputs({ agingFactor: 0.7 }))
    expect(r.warnings.some((w) => w.field === 'agingFactor')).toBe(true)
  })
  it('accepts canonical FLA chemistry', () => {
    expect(validateBatteryInputs(inputs({ chemistry: 'FLA' })).isValid).toBe(true)
  })
})
