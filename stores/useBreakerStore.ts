/**
 * Breaker Calculator Zustand Store
 *
 * Centralized state management for circuit breaker sizing calculator
 * with localStorage persistence.
 *
 * Features:
 * - Circuit configuration state (voltage, phase, load, standard)
 * - Environmental factors (temperature, grouping, installation method)
 * - Calculation results
 * - History management (50-calculation FIFO limit)
 * - Persistent state across browser sessions
 *
 * @module useBreakerStore
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BreakerCalculatorState,
  BreakerCalculatorActions,
  CalculationResults,
  CalculationHistoryEntry,
  ProjectInformation,
  InstallationMethod,
  LoadType,
} from '@/types/breaker-calculator';

/**
 * Initial state for breaker calculator
 */
const initialState: BreakerCalculatorState = {
  // Circuit Configuration
  standard: 'NEC',
  voltage: 240,
  phase: 'single',
  loadMode: 'kw',
  loadValue: 10,
  powerFactor: 0.9,
  unitSystem: 'imperial',

  // Environmental (optional) - all undefined by default
  ambientTemperature: undefined,
  groupedCables: undefined,
  installationMethod: undefined,
  circuitDistance: undefined,
  conductorMaterial: 'copper',
  conductorSizeValue: undefined,
  conductorSizeUnit: 'AWG',

  // Short Circuit (optional)
  shortCircuitCurrentKA: undefined,

  // Load Type (optional)
  loadType: undefined,

  // Project Info (optional)
  projectName: undefined,
  projectLocation: undefined,
  engineerName: undefined,

  // Calculated Results
  results: undefined,

  // UI State
  showDeratingSidebar: false,
  showHistorySidebar: false,
  showCalculationDetails: false,

  // Errors
  validationErrors: [],
};

/**
 * Breaker Calculator Zustand Store
 *
 * Provides state management and actions for breaker sizing calculations
 */
export const useBreakerStore = create<BreakerCalculatorState & BreakerCalculatorActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // =========================================================================
      // INPUT SETTERS
      // =========================================================================

      setStandard: (standard) => {
        set({ standard });
        // When standard changes, recalculate if results exist
        const { results } = get();
        if (results) {
          // Trigger recalculation (will be handled by component)
          set({ results: undefined });
        }
      },

      setVoltage: (voltage) => set({ voltage }),

      setPhase: (phase) => set({ phase }),

      setLoadMode: (loadMode) => set({ loadMode }),

      setLoadValue: (loadValue) => set({ loadValue }),

      setPowerFactor: (powerFactor) => set({ powerFactor }),

      setUnitSystem: (unitSystem) => set({ unitSystem }),

      // Environmental Setters
      setAmbientTemperature: (ambientTemperature) => set({ ambientTemperature }),

      setGroupedCables: (groupedCables) => set({ groupedCables }),

      setInstallationMethod: (installationMethod) => set({ installationMethod }),

      setCircuitDistance: (circuitDistance) => set({ circuitDistance }),

      setShortCircuitCurrent: (shortCircuitCurrentKA) => set({ shortCircuitCurrentKA }),

      setLoadType: (loadType) => set({ loadType }),

      // Project Info Setter
      setProjectInformation: (info) =>
        set({
          projectName: info.projectName,
          projectLocation: info.projectLocation,
          engineerName: info.engineerName,
        }),

      // =========================================================================
      // CALCULATION
      // =========================================================================

      calculate: async () => {
        // This will be called by the UI component, which will:
        // 1. Get current state
        // 2. Validate inputs
        // 3. Call calculation functions
        // 4. Update results via set({ results })
        //
        // We don't implement the calculation logic here to keep store pure
        // and allow for better testing/separation of concerns
      },

      // =========================================================================
      // UI TOGGLES
      // =========================================================================

      toggleDeratingSidebar: () =>
        set((state) => ({ showDeratingSidebar: !state.showDeratingSidebar })),

      toggleHistorySidebar: () =>
        set((state) => ({ showHistorySidebar: !state.showHistorySidebar })),

      toggleCalculationDetails: () =>
        set((state) => ({ showCalculationDetails: !state.showCalculationDetails })),

      // =========================================================================
      // HISTORY MANAGEMENT
      // =========================================================================

      saveToHistory: async () => {
        const state = get();
        const { results } = state;

        if (!results) {
          console.warn('No results to save to history');
          return;
        }

        try {
          // Get existing history from localStorage
          const historyKey = 'electromate-breaker-history';
          const existingHistoryJson = localStorage.getItem(historyKey);
          let history: CalculationHistoryEntry[] = existingHistoryJson
            ? JSON.parse(existingHistoryJson)
            : [];

          // Create new entry
          const entry: CalculationHistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            circuit: {
              standard: state.standard,
              voltage: state.voltage,
              phase: state.phase,
              loadMode: state.loadMode,
              loadValue: state.loadValue,
              powerFactor: state.powerFactor,
              unitSystem: state.unitSystem,
            },
            environment: state.ambientTemperature || state.groupedCables || state.installationMethod
              ? {
                  ambientTemperature: state.ambientTemperature,
                  groupedCables: state.groupedCables,
                  installationMethod: state.installationMethod,
                  circuitDistance: state.circuitDistance,
                  conductorMaterial: state.conductorMaterial,
                  conductorSize: state.conductorSizeValue
                    ? {
                        value: state.conductorSizeValue,
                        unit: state.conductorSizeUnit!,
                      }
                    : undefined,
                }
              : undefined,
            shortCircuitCurrentKA: state.shortCircuitCurrentKA,
            results,
            project: state.projectName || state.projectLocation || state.engineerName
              ? {
                  projectName: state.projectName,
                  projectLocation: state.projectLocation,
                  engineerName: state.engineerName,
                }
              : undefined,
            sortOrder: history.length,
          };

          // FIFO eviction: if history >= 50, remove oldest
          if (history.length >= 50) {
            history.shift();
            // Reindex sortOrder
            history = history.map((h, idx) => ({ ...h, sortOrder: idx }));
          }

          // Add new entry
          history.push(entry);

          // Save back to localStorage
          localStorage.setItem(historyKey, JSON.stringify(history));

          console.info(`Calculation saved to history (${history.length}/50)`);
        } catch (error) {
          console.error('Failed to save calculation to history:', error);

          // Handle QuotaExceededError
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            // Try to clear oldest 10 entries
            try {
              const historyKey = 'electromate-breaker-history';
              const existingHistoryJson = localStorage.getItem(historyKey);
              if (existingHistoryJson) {
                let history: CalculationHistoryEntry[] = JSON.parse(existingHistoryJson);
                history = history.slice(10); // Remove first 10 entries
                localStorage.setItem(historyKey, JSON.stringify(history));
                console.warn('Cleared 10 oldest history entries due to quota exceeded');
              }
            } catch (cleanupError) {
              console.error('Failed to cleanup history:', cleanupError);
            }
          }
        }
      },

      loadFromHistory: async (id) => {
        try {
          const historyKey = 'electromate-breaker-history';
          const existingHistoryJson = localStorage.getItem(historyKey);

          if (!existingHistoryJson) {
            console.warn('No history found');
            return;
          }

          const history: CalculationHistoryEntry[] = JSON.parse(existingHistoryJson);
          const entry = history.find((h) => h.id === id);

          if (!entry) {
            console.warn(`History entry ${id} not found`);
            return;
          }

          // Restore state from history entry
          set({
            standard: entry.circuit.standard,
            voltage: entry.circuit.voltage,
            phase: entry.circuit.phase,
            loadMode: entry.circuit.loadMode,
            loadValue: entry.circuit.loadValue,
            powerFactor: entry.circuit.powerFactor,
            unitSystem: entry.circuit.unitSystem,
            ambientTemperature: entry.environment?.ambientTemperature,
            groupedCables: entry.environment?.groupedCables,
            installationMethod: entry.environment?.installationMethod,
            circuitDistance: entry.environment?.circuitDistance,
            conductorMaterial: entry.environment?.conductorMaterial,
            conductorSizeValue: entry.environment?.conductorSize?.value,
            conductorSizeUnit: entry.environment?.conductorSize?.unit,
            shortCircuitCurrentKA: entry.shortCircuitCurrentKA,
            projectName: entry.project?.projectName,
            projectLocation: entry.project?.projectLocation,
            engineerName: entry.project?.engineerName,
            results: entry.results,
          });

          console.info(`Loaded calculation from history: ${id}`);
        } catch (error) {
          console.error('Failed to load calculation from history:', error);
        }
      },

      deleteFromHistory: async (id) => {
        try {
          const historyKey = 'electromate-breaker-history';
          const existingHistoryJson = localStorage.getItem(historyKey);

          if (!existingHistoryJson) {
            return;
          }

          let history: CalculationHistoryEntry[] = JSON.parse(existingHistoryJson);
          history = history.filter((h) => h.id !== id);

          // Reindex sortOrder
          history = history.map((h, idx) => ({ ...h, sortOrder: idx }));

          localStorage.setItem(historyKey, JSON.stringify(history));

          console.info(`Deleted calculation from history: ${id}`);
        } catch (error) {
          console.error('Failed to delete calculation from history:', error);
        }
      },

      getHistory: () => {
        try {
          const historyKey = 'electromate-breaker-history';
          const existingHistoryJson = localStorage.getItem(historyKey);

          if (!existingHistoryJson) {
            return [];
          }

          const history: CalculationHistoryEntry[] = JSON.parse(existingHistoryJson);

          // Sort by timestamp descending (newest first)
          return history.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } catch (error) {
          console.error('Failed to get history:', error);
          return [];
        }
      },

      // =========================================================================
      // RESET
      // =========================================================================

      reset: () => set(initialState),

      // =========================================================================
      // PERSISTENCE HYDRATION
      // =========================================================================

      hydrate: () => {
        // Zustand persist middleware handles this automatically
        // This is a no-op but kept for API consistency
      },
    }),
    {
      name: 'electromate-breaker', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        standard: state.standard,
        voltage: state.voltage,
        phase: state.phase,
        loadMode: state.loadMode,
        loadValue: state.loadValue,
        powerFactor: state.powerFactor,
        unitSystem: state.unitSystem,
        ambientTemperature: state.ambientTemperature,
        groupedCables: state.groupedCables,
        installationMethod: state.installationMethod,
        circuitDistance: state.circuitDistance,
        conductorMaterial: state.conductorMaterial,
        conductorSizeValue: state.conductorSizeValue,
        conductorSizeUnit: state.conductorSizeUnit,
        shortCircuitCurrentKA: state.shortCircuitCurrentKA,
        loadType: state.loadType,
        projectName: state.projectName,
        projectLocation: state.projectLocation,
        engineerName: state.engineerName,
        // Don't persist: results, UI state, validation errors
      }),
    }
  )
);
