/**
 * UPS Sizing Store
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Zustand store with localStorage persistence for UPS calculations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoadItem } from '@/lib/validation/upsValidation';
import type { UPSSizingResult } from '@/lib/calculations/ups/sizing';
import { calculateUPSSizing } from '@/lib/calculations/ups/sizing';

/**
 * UPS Store State
 */
interface UPSState {
  // Input state
  loads: LoadItem[];
  growthMargin: number;
  targetRedundancy: 'none' | 'N+1' | '2N';

  // Calculated results
  result: UPSSizingResult | null;
  lastCalculated: string | null;

  // Actions
  addLoad: (load: LoadItem) => void;
  updateLoad: (index: number, load: LoadItem) => void;
  removeLoad: (index: number) => void;
  clearLoads: () => void;
  setGrowthMargin: (margin: number) => void;
  setTargetRedundancy: (redundancy: 'none' | 'N+1' | '2N') => void;
  calculate: () => void;
  reset: () => void;
}

/**
 * Default state values
 */
const defaultState = {
  loads: [] as LoadItem[],
  growthMargin: 0.25,
  targetRedundancy: 'none' as const,
  result: null,
  lastCalculated: null,
};

/**
 * UPS Store with localStorage persistence
 */
export const useUPSStore = create<UPSState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      addLoad: (load: LoadItem) => {
        set((state) => ({
          loads: [...state.loads, load],
          result: null, // Clear result on input change
        }));
      },

      updateLoad: (index: number, load: LoadItem) => {
        set((state) => {
          const newLoads = [...state.loads];
          newLoads[index] = load;
          return {
            loads: newLoads,
            result: null, // Clear result on input change
          };
        });
      },

      removeLoad: (index: number) => {
        set((state) => ({
          loads: state.loads.filter((_, i) => i !== index),
          result: null, // Clear result on input change
        }));
      },

      clearLoads: () => {
        set({
          loads: [],
          result: null,
        });
      },

      setGrowthMargin: (margin: number) => {
        set({
          growthMargin: margin,
          result: null, // Clear result on input change
        });
      },

      setTargetRedundancy: (redundancy: 'none' | 'N+1' | '2N') => {
        set({
          targetRedundancy: redundancy,
          result: null, // Clear result on input change
        });
      },

      calculate: () => {
        const { loads, growthMargin } = get();

        if (loads.length === 0) {
          set({ result: null });
          return;
        }

        // Map LoadItem to the format expected by calculateUPSSizing
        const sizingLoads = loads.map((load) => ({
          name: load.name,
          powerVA: load.powerVA ?? undefined,
          powerWatts: load.powerWatts ?? undefined,
          powerFactor: load.powerFactor,
          quantity: load.quantity,
        }));

        const result = calculateUPSSizing(sizingLoads, growthMargin);

        set({
          result,
          lastCalculated: new Date().toISOString(),
        });
      },

      reset: () => {
        set(defaultState);
      },
    }),
    {
      name: 'electromate-ups',
      partialize: (state) => ({
        loads: state.loads,
        growthMargin: state.growthMargin,
        targetRedundancy: state.targetRedundancy,
      }),
    }
  )
);

/**
 * Selector hooks for specific state slices
 */
export const useUPSLoads = () => useUPSStore((state) => state.loads);
export const useUPSResult = () => useUPSStore((state) => state.result);
export const useUPSGrowthMargin = () => useUPSStore((state) => state.growthMargin);
