import { describe, it, expect, beforeEach } from 'vitest'
import { usePowerFactorCorrectionStore, migratePFCState } from '@/stores/usePowerFactorCorrectionStore'
import { DEFAULT_DESIGN } from '@/lib/calculations/power-factor-correction/panelDesign'
import type { PFCHistoryEntry } from '@/types/power-factor-correction'
import { resultsFor } from './fixtures'

const HISTORY_KEY = 'electromate-pfc-history'
const store = () => usePowerFactorCorrectionStore.getState()

beforeEach(() => {
  localStorage.clear()
  store().reset()
})

describe('design state', () => {
  it('defaults to DEFAULT_DESIGN on stage 1', () => {
    expect(store().design).toEqual(DEFAULT_DESIGN)
    expect(store().activeStage).toBe(1)
  })

  it('setDesign merges and keeps stage 1 results', () => {
    store().setResults(resultsFor(55))
    store().setDesign({ sequenceMode: '1:2:4', maxOutputs: 6 })
    expect(store().design.sequenceMode).toBe('1:2:4')
    expect(store().design.maxOutputs).toBe(6)
    expect(store().design.ctPrimaryA).toBe(1000)
    expect(store().results).not.toBeNull()
  })

  it('a stage 1 setter still clears results', () => {
    store().setResults(resultsFor(55))
    store().setVoltage(400)
    expect(store().results).toBeNull()
  })

  it('setStepOverride merges per step and null removes it', () => {
    store().setStepOverride(2, { protectionA: 160 })
    store().setStepOverride(2, { contactorA: 185 })
    expect(store().design.overrides[2]).toEqual({ protectionA: 160, contactorA: 185 })
    store().setStepOverride(2, null)
    expect(store().design.overrides[2]).toBeUndefined()
  })

  it('setActiveStage switches stages', () => {
    store().setActiveStage(3)
    expect(store().activeStage).toBe(3)
  })

  it('reset restores the default design', () => {
    store().setDesign({ detuning: 14 })
    store().reset()
    expect(store().design).toEqual(DEFAULT_DESIGN)
  })
})

describe('persistence (FR-004)', () => {
  it('migrates a v0 payload by adding the default design', () => {
    const v0 = { standard: 'NEC', voltage: 480 }
    const migrated = migratePFCState(v0, 0) as Record<string, unknown>
    expect(migrated.voltage).toBe(480)
    expect(migrated.design).toEqual(DEFAULT_DESIGN)
  })

  it('fills missing design fields on later versions', () => {
    const migrated = migratePFCState({ design: { detuning: 7 } }, 1) as { design: typeof DEFAULT_DESIGN }
    expect(migrated.design).toEqual({ ...DEFAULT_DESIGN, detuning: 7 })
  })

  it('saveToHistory stores the design', () => {
    store().setResults(resultsFor(55))
    store().setDesign({ detuning: 7 })
    store().saveToHistory()
    const saved: PFCHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    expect(saved[0].design?.detuning).toBe(7)
  })

  it('loading a pre-upgrade entry (no design) applies defaults without error', () => {
    store().setDesign({ detuning: 14 })
    const { design: _omit, ...legacy } = {
      id: 'old1', timestamp: '2026-01-01T00:00:00.000Z',
      input: {
        standard: 'IEC', systemType: 'three-phase-ac', voltage: 415, frequency: 50, activePower: 100,
        currentPowerFactor: 0.75, targetPowerFactor: 0.95, connectionType: 'delta', correctionType: 'automatic',
        loadProfile: 'variable', harmonicDistortion: 5,
      },
      environment: { ambientTemperature: 35, altitude: 0 },
      project: { projectName: '', projectLocation: '', engineerName: '' },
      results: resultsFor(55),
      design: undefined,
    } satisfies PFCHistoryEntry
    localStorage.setItem(HISTORY_KEY, JSON.stringify([legacy]))
    store().loadFromHistory('old1')
    expect(store().design).toEqual(DEFAULT_DESIGN)
    expect(store().results).not.toBeNull()
  })

  it('loading an entry with a design restores it', () => {
    store().setResults(resultsFor(55))
    store().setDesign({ sequenceMode: 'custom', customStepsKVAR: [10, 20] })
    store().saveToHistory()
    const id = store().getHistory()[0].id
    store().reset()
    store().loadFromHistory(id)
    expect(store().design.customStepsKVAR).toEqual([10, 20])
  })
})
