/**
 * Persisted-state migration v1 → v2 (015 T017, FR-010).
 */

import { describe, it, expect } from 'vitest'
import { migrateBatteryState, defaultBatteryInputs } from '@/stores/useBatteryStore'

describe('migrateBatteryState', () => {
  it('v1 → v2: keeps inputs, sets standby, drops round-trip efficiency', () => {
    const v1 = { inputs: { voltage: 24, mode: 'sizing', efficiency: 0.85, chemistry: 'VRLA-AGM', loadWatts: 2000, targetBackupHours: 2 } }
    const { inputs } = migrateBatteryState(v1, 1)
    expect(inputs.voltage).toBe(24)
    expect(inputs.mode).toBe('sizing')
    expect(inputs.loadWatts).toBe(2000)
    expect(inputs.application).toBe('standby')
    expect(inputs.efficiency).toBeUndefined()
    expect(inputs.designMargin).toBe(1.1)
    expect(inputs.loadType).toBe('ac')
  })
  it('maps the unused v1 minVoltage to minLoadVoltage', () => {
    const { inputs } = migrateBatteryState({ inputs: { minVoltage: 42 } }, 1)
    expect(inputs.minLoadVoltage).toBe(42)
    expect(inputs.minVoltage).toBeUndefined()
  })
  it('v0 legacy chemistry IDs still map to canonical', () => {
    const { inputs } = migrateBatteryState({ inputs: { chemistry: 'LiFePO4' } }, 0)
    expect(inputs.chemistry).toBe('Li-Ion-LFP')
  })
  it('v2 state keeps a user conversion efficiency and cycling choice', () => {
    const { inputs } = migrateBatteryState({ inputs: { efficiency: 0.9, application: 'cycling' } }, 2)
    expect(inputs.efficiency).toBe(0.9)
    expect(inputs.application).toBe('cycling')
  })
  it('defaults are standby / AC / margin 1.10', () => {
    expect(defaultBatteryInputs.application).toBe('standby')
    expect(defaultBatteryInputs.loadType).toBe('ac')
    expect(defaultBatteryInputs.designMargin).toBe(1.1)
  })
})
