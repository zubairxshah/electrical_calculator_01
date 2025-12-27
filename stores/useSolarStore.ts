/**
 * Solar Calculator Zustand Store
 *
 * State management for solar array calculator with:
 * - Persistent storage (localStorage)
 * - Real-time calculations
 * - Validation state
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  calculateSolarArraySize,
  type SolarCalculatorInputs,
  type SolarCalculatorResult,
} from '@/lib/calculations/solar'
import { validateSolarInputs, type SolarValidationResult } from '@/lib/validation/solarValidation'

interface SolarStore {
  // Input state
  inputs: SolarCalculatorInputs
  setInputs: (inputs: Partial<SolarCalculatorInputs>) => void
  resetInputs: () => void

  // Results state
  result: SolarCalculatorResult | null
  isCalculating: boolean

  // Validation state
  validation: SolarValidationResult | null

  // Actions
  calculate: () => void
  validateInputs: () => void
}

/**
 * Default input values
 *
 * Based on typical residential installation:
 * - 10 kWh/day (average US household)
 * - 5 PSH (national average)
 * - 400W panels (modern standard)
 * - 0.75 PR (typical)
 * - 20% efficiency (standard monocrystalline)
 */
const defaultInputs: SolarCalculatorInputs = {
  dailyEnergyKWh: 10,
  peakSunHours: 5,
  panelWattage: 400,
  performanceRatio: 0.75,
  panelEfficiency: 0.20,
}

/**
 * Solar calculator store
 */
export const useSolarStore = create<SolarStore>()(
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
        const validation = validateSolarInputs(inputs)
        set({ validation })
      },

      // Calculate solar array size
      calculate: () => {
        const { inputs, validation } = get()

        // Only calculate if validation passed
        if (!validation?.isValid) {
          return
        }

        set({ isCalculating: true })

        try {
          const result = calculateSolarArraySize(inputs)
          set({ result, isCalculating: false })
        } catch (error) {
          console.error('Solar calculation error:', error)
          set({ isCalculating: false })
        }
      },
    }),
    {
      name: 'electromate-solar',
      partialize: (state) => ({
        inputs: state.inputs,
        result: state.result,
      }),
    }
  )
)
