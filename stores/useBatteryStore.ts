/**
 * Battery Calculator Zustand Store
 *
 * State management for the battery calculator with:
 * - Persistent storage (localStorage) + chemistry-ID migration (ADR-006, C4)
 * - Dual-mode calculation (runtime / sizing)
 * - Real-time validation state
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BatteryCalculatorInputs, BatteryCalculatorResult } from '@/lib/types'
import { calculateBattery } from '@/lib/calculations/battery'
import { validateBatteryInputs } from '@/lib/validation/batteryValidation'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'

interface BatteryStore {
  inputs: BatteryCalculatorInputs
  setInputs: (inputs: Partial<BatteryCalculatorInputs>) => void
  setMode: (mode: BatteryCalculatorInputs['mode']) => void
  resetInputs: () => void

  result: BatteryCalculatorResult | null
  isCalculating: boolean

  validation: ReturnType<typeof validateBatteryInputs> | null

  calculate: () => void
  validateInputs: () => void
}

/** Default input values (canonical chemistry; efficiency left to the load-type default). */
export const defaultBatteryInputs: BatteryCalculatorInputs = {
  voltage: 48,
  mode: 'runtime',
  application: 'standby',
  loadType: 'ac',
  designMargin: 1.1,
  ampHours: 200,
  targetBackupHours: 4,
  loadWatts: 2000,
  agingFactor: 0.8,
  temperature: 25,
  chemistry: 'VRLA-AGM',
  datasheetId: null,
}

/**
 * Migrate persisted state.
 * v0→v1 (011): legacy chemistry IDs, missing mode/temperature.
 * v1→v2 (015, ADR-008): application defaults to standby; the v1 `efficiency`
 * meant round-trip and is dropped (conversion efficiency now); minVoltage →
 * minLoadVoltage.
 */
export function migrateBatteryState(persistedState: unknown, fromVersion: number) {
  const state = persistedState as { inputs?: Partial<BatteryCalculatorInputs> } | undefined
  const oldInputs: Partial<BatteryCalculatorInputs> = { ...(state?.inputs ?? {}) }
  if (fromVersion < 2) {
    delete oldInputs.efficiency
    delete oldInputs.application
    if (oldInputs.minVoltage != null && oldInputs.minLoadVoltage == null) {
      oldInputs.minLoadVoltage = oldInputs.minVoltage
    }
    delete oldInputs.minVoltage
  }
  const migratedInputs: BatteryCalculatorInputs = {
    ...defaultBatteryInputs,
    ...oldInputs,
    mode: (oldInputs.mode as BatteryCalculatorInputs['mode']) ?? 'runtime',
    temperature: oldInputs.temperature ?? 25,
    chemistry: toCanonicalChemistry(String(oldInputs.chemistry ?? 'VRLA-AGM')),
  }
  // Drop any persisted result (BigNumber fields don't round-trip through JSON).
  return { inputs: migratedInputs, result: null }
}

export const useBatteryStore = create<BatteryStore>()(
  persist(
    (set, get) => ({
      inputs: defaultBatteryInputs,
      result: null,
      isCalculating: false,
      validation: null,

      setInputs: (partialInputs) => {
        const newInputs = { ...get().inputs, ...partialInputs }
        set({ inputs: newInputs })
        get().validateInputs()
        if (get().validation?.isValid) get().calculate()
      },

      setMode: (mode) => {
        get().setInputs({ mode })
      },

      resetInputs: () => {
        set({ inputs: defaultBatteryInputs, result: null, validation: null })
      },

      validateInputs: () => {
        set({ validation: validateBatteryInputs(get().inputs) })
      },

      calculate: () => {
        const { inputs, validation } = get()
        if (!validation?.isValid) return
        set({ isCalculating: true })
        try {
          set({ result: calculateBattery(inputs), isCalculating: false })
        } catch (error) {
          console.error('Battery calculation error:', error)
          set({ isCalculating: false })
        }
      },
    }),
    {
      name: 'electromate-battery',
      version: 2,
      migrate: migrateBatteryState,
      partialize: (state) => ({ inputs: state.inputs }),
    }
  )
)
