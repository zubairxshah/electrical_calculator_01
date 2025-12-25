/**
 * Battery Calculator Zustand Store
 *
 * State management for battery calculator with:
 * - Persistent storage (localStorage)
 * - Real-time calculations
 * - Validation state
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BatteryCalculatorInputs, BatteryCalculatorResult } from '@/lib/types'
import { calculateBackupTime } from '@/lib/calculations/battery'
import { validateBatteryInputs } from '@/lib/validation/batteryValidation'

interface BatteryStore {
  // Input state
  inputs: BatteryCalculatorInputs
  setInputs: (inputs: Partial<BatteryCalculatorInputs>) => void
  resetInputs: () => void

  // Results state
  result: BatteryCalculatorResult | null
  isCalculating: boolean

  // Validation state
  validation: ReturnType<typeof validateBatteryInputs> | null

  // Actions
  calculate: () => void
  validateInputs: () => void
}

/**
 * Default input values
 */
const defaultInputs: BatteryCalculatorInputs = {
  voltage: 48,
  ampHours: 200,
  loadWatts: 2000,
  efficiency: 0.9,
  agingFactor: 0.8,
  chemistry: 'VRLA-AGM',
}

/**
 * Battery calculator store
 */
export const useBatteryStore = create<BatteryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      inputs: defaultInputs,
      result: null,
      isCalculating: false,
      validation: null,

      // Set inputs (partial update)
      setInputs: (partialInputs) => {
        const newInputs = { ...get().inputs, ...partialInputs }
        set({ inputs: newInputs })

        // Auto-validate
        get().validateInputs()

        // Auto-calculate if valid
        const validation = get().validation
        if (validation?.isValid) {
          get().calculate()
        }
      },

      // Reset to defaults
      resetInputs: () => {
        set({
          inputs: defaultInputs,
          result: null,
          validation: null,
        })
      },

      // Validate inputs
      validateInputs: () => {
        const { inputs } = get()
        const validation = validateBatteryInputs(inputs)
        set({ validation })
      },

      // Calculate backup time
      calculate: () => {
        const { inputs, validation } = get()

        // Only calculate if validation passed
        if (!validation?.isValid) {
          return
        }

        set({ isCalculating: true })

        try {
          const result = calculateBackupTime(inputs)
          set({ result, isCalculating: false })
        } catch (error) {
          console.error('Calculation error:', error)
          set({ isCalculating: false })
        }
      },
    }),
    {
      name: 'electromate-battery',
      partialize: (state) => ({
        inputs: state.inputs,
        result: state.result,
      }),
    }
  )
)
