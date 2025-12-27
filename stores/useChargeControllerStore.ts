/**
 * Charge Controller Zustand Store
 *
 * State management for charge controller selection tool with:
 * - Persistent storage (localStorage)
 * - Real-time calculations
 * - Validation state
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  recommendChargeController,
  type ChargeControllerInputs,
  type ChargeControllerResult,
} from '@/lib/calculations/solar/chargeController'
import {
  validateChargeControllerInputs,
  type ChargeControllerValidationResult,
} from '@/lib/validation/chargeControllerValidation'

interface ChargeControllerStore {
  // Input state
  inputs: ChargeControllerInputs
  setInputs: (inputs: Partial<ChargeControllerInputs>) => void
  resetInputs: () => void

  // Results state
  result: ChargeControllerResult | null
  isCalculating: boolean

  // Validation state
  validation: ChargeControllerValidationResult | null

  // Actions
  calculate: () => void
  validateInputs: () => void
}

/**
 * Default input values
 *
 * Based on typical residential off-grid installation:
 * - 4 panels in series @ 40V Voc = 160V
 * - Single string @ 9A Isc = 9A
 * - 48V battery bank
 * - ~1200W array
 */
const defaultInputs: ChargeControllerInputs = {
  arrayVoc: 160,
  arrayIsc: 9,
  batteryVoltage: 48,
  arrayMaxPower: 1200,
}

/**
 * Charge controller store
 */
export const useChargeControllerStore = create<ChargeControllerStore>()(
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
        const validation = validateChargeControllerInputs(inputs)
        set({ validation })
      },

      // Calculate charge controller recommendations
      calculate: () => {
        const { inputs, validation } = get()

        // Only calculate if validation passed
        if (!validation?.isValid) {
          return
        }

        set({ isCalculating: true })

        try {
          const result = recommendChargeController(inputs)
          set({ result, isCalculating: false })
        } catch (error) {
          console.error('Charge controller calculation error:', error)
          set({ isCalculating: false })
        }
      },
    }),
    {
      name: 'electromate-charge-controller',
      partialize: (state) => ({
        inputs: state.inputs,
        result: state.result,
      }),
    }
  )
)
