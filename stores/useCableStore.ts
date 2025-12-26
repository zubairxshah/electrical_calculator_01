/**
 * Cable Sizing Zustand Store
 * Feature: 001-electromate-engineering-app
 * Task: T091 - Create cableStore.ts
 *
 * Manages cable sizing calculator state with localStorage persistence.
 * Key: "electromate-cable"
 *
 * @see Zustand 5.x with persist middleware
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recommendCableSize, type CableSizingResult } from '@/lib/calculations/cables';
import type {
  ConductorMaterial,
  InstallationMethod,
  CircuitType,
  Standard,
  InsulationRating,
} from '@/lib/validation/cableValidation';

/**
 * Cable store state
 */
interface CableState {
  // Input parameters
  systemVoltage: number;
  current: number;
  length: number;
  conductorMaterial: ConductorMaterial;
  installationMethod: InstallationMethod;
  ambientTemp: number;
  circuitType: CircuitType;
  numberOfConductors: number;
  insulationRating: InsulationRating;
  standard: Standard;

  // Calculation result
  result: CableSizingResult | null;
  lastCalculated: Date | null;

  // UI state
  isCalculating: boolean;
  showDetails: boolean;
}

/**
 * Cable store actions
 */
interface CableActions {
  // Input setters
  setSystemVoltage: (voltage: number) => void;
  setCurrent: (current: number) => void;
  setLength: (length: number) => void;
  setConductorMaterial: (material: ConductorMaterial) => void;
  setInstallationMethod: (method: InstallationMethod) => void;
  setAmbientTemp: (temp: number) => void;
  setCircuitType: (type: CircuitType) => void;
  setNumberOfConductors: (count: number) => void;
  setInsulationRating: (rating: InsulationRating) => void;
  setStandard: (standard: Standard) => void;

  // Bulk update
  setInputs: (inputs: Partial<CableState>) => void;

  // Calculation
  calculate: () => void;
  clearResult: () => void;

  // UI actions
  setShowDetails: (show: boolean) => void;

  // Reset
  reset: () => void;
}

/**
 * Initial state with sensible defaults
 */
const initialState: CableState = {
  // Default to IEC 230V single-phase, 20A, 30m run
  systemVoltage: 230,
  current: 20,
  length: 30,
  conductorMaterial: 'copper',
  installationMethod: 'conduit',
  ambientTemp: 30,
  circuitType: 'single-phase',
  numberOfConductors: 3,
  insulationRating: 75,
  standard: 'IEC',
  result: null,
  lastCalculated: null,
  isCalculating: false,
  showDetails: false,
};

/**
 * Cable sizing Zustand store
 */
export const useCableStore = create<CableState & CableActions>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Input setters
      setSystemVoltage: (voltage) => set({ systemVoltage: voltage }),
      setCurrent: (current) => set({ current }),
      setLength: (length) => set({ length }),
      setConductorMaterial: (material) => set({ conductorMaterial: material }),
      setInstallationMethod: (method) => set({ installationMethod: method }),
      setAmbientTemp: (temp) => set({ ambientTemp: temp }),
      setCircuitType: (type) => set({ circuitType: type }),
      setNumberOfConductors: (count) => set({ numberOfConductors: count }),
      setInsulationRating: (rating) => set({ insulationRating: rating }),
      setStandard: (standard) => {
        // When switching standards, adjust default voltage
        const newVoltage = standard === 'NEC' ? 120 : 230;
        set({ standard, systemVoltage: newVoltage });
      },

      // Bulk update
      setInputs: (inputs) => set(inputs),

      // Calculate cable sizing
      calculate: () => {
        const state = get();

        set({ isCalculating: true });

        try {
          const result = recommendCableSize({
            systemVoltage: state.systemVoltage,
            current: state.current,
            length: state.length,
            conductorMaterial: state.conductorMaterial,
            installationMethod: state.installationMethod,
            ambientTemp: state.ambientTemp,
            circuitType: state.circuitType,
            numberOfConductors: state.numberOfConductors,
            insulationRating: state.insulationRating,
            standard: state.standard,
          });

          set({
            result,
            lastCalculated: new Date(),
            isCalculating: false,
          });
        } catch (error) {
          console.error('Cable calculation error:', error);
          set({ isCalculating: false });
        }
      },

      // Clear result
      clearResult: () => set({ result: null, lastCalculated: null }),

      // UI actions
      setShowDetails: (show) => set({ showDetails: show }),

      // Reset to initial state
      reset: () => set(initialState),
    }),
    {
      name: 'electromate-cable',
      partialize: (state) => ({
        // Persist only input values, not UI state or results
        systemVoltage: state.systemVoltage,
        current: state.current,
        length: state.length,
        conductorMaterial: state.conductorMaterial,
        installationMethod: state.installationMethod,
        ambientTemp: state.ambientTemp,
        circuitType: state.circuitType,
        numberOfConductors: state.numberOfConductors,
        insulationRating: state.insulationRating,
        standard: state.standard,
      }),
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useCableInputs = () =>
  useCableStore((state) => ({
    systemVoltage: state.systemVoltage,
    current: state.current,
    length: state.length,
    conductorMaterial: state.conductorMaterial,
    installationMethod: state.installationMethod,
    ambientTemp: state.ambientTemp,
    circuitType: state.circuitType,
    numberOfConductors: state.numberOfConductors,
    insulationRating: state.insulationRating,
    standard: state.standard,
  }));

export const useCableResult = () =>
  useCableStore((state) => state.result);

export const useCableActions = () =>
  useCableStore((state) => ({
    setSystemVoltage: state.setSystemVoltage,
    setCurrent: state.setCurrent,
    setLength: state.setLength,
    setConductorMaterial: state.setConductorMaterial,
    setInstallationMethod: state.setInstallationMethod,
    setAmbientTemp: state.setAmbientTemp,
    setCircuitType: state.setCircuitType,
    setNumberOfConductors: state.setNumberOfConductors,
    setInsulationRating: state.setInsulationRating,
    setStandard: state.setStandard,
    setInputs: state.setInputs,
    calculate: state.calculate,
    clearResult: state.clearResult,
    reset: state.reset,
  }));

export default useCableStore;
