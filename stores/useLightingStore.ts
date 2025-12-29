/**
 * Lighting Calculator Zustand Store
 *
 * Centralized state management for indoor lighting design calculator
 * with localStorage persistence.
 *
 * Features:
 * - Room configuration state (dimensions, reflectances, space type)
 * - Luminaire selection
 * - Design parameters (illuminance, UF, MF)
 * - Calculation results
 * - History management (50-calculation FIFO limit)
 * - Persistent state across browser sessions
 *
 * @module useLightingStore
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Room,
  Luminaire,
  DesignParameters,
  CalculationResults,
  HistoryEntry,
  SpaceType,
  LightingStandard,
  UnitSystem,
} from '@/lib/types/lighting';

// ============================================================================
// State Types
// ============================================================================

export interface LightingCalculatorState {
  // Room Configuration
  roomLength: number;
  roomWidth: number;
  roomHeight: number;
  workPlaneHeight: number;
  ceilingReflectance: number;
  wallReflectance: number;
  floorReflectance: number;
  spaceType: SpaceType;

  // Selected Luminaire
  selectedLuminaire: Luminaire | null;

  // Design Parameters
  requiredIlluminance: number;
  utilizationFactor: number;
  maintenanceFactor: number;
  operatingHoursPerDay: number;
  standard: LightingStandard;
  unitSystem: UnitSystem;

  // Override flags
  isUFManualOverride: boolean;

  // Calculation Results
  results: CalculationResults | null;

  // UI State
  showHistorySidebar: boolean;
  showLuminaireCatalog: boolean;
  showCalculationDetails: boolean;

  // Validation
  validationErrors: string[];
}

export interface LightingCalculatorActions {
  // Room Setters
  setRoomLength: (length: number) => void;
  setRoomWidth: (width: number) => void;
  setRoomHeight: (height: number) => void;
  setWorkPlaneHeight: (height: number) => void;
  setRoomDimensions: (length: number, width: number, height: number) => void;
  setCeilingReflectance: (value: number) => void;
  setWallReflectance: (value: number) => void;
  setFloorReflectance: (value: number) => void;
  setReflectances: (ceiling: number, wall: number, floor: number) => void;
  setSpaceType: (type: SpaceType) => void;

  // Luminaire Setters
  setSelectedLuminaire: (luminaire: Luminaire | null) => void;

  // Design Parameter Setters
  setRequiredIlluminance: (lux: number) => void;
  setUtilizationFactor: (uf: number, isManual?: boolean) => void;
  setMaintenanceFactor: (mf: number) => void;
  setOperatingHoursPerDay: (hours: number) => void;
  setStandard: (standard: LightingStandard) => void;
  setUnitSystem: (system: UnitSystem) => void;

  // Results
  setResults: (results: CalculationResults | null) => void;
  clearResults: () => void;

  // UI Toggles
  toggleHistorySidebar: () => void;
  toggleLuminaireCatalog: () => void;
  toggleCalculationDetails: () => void;

  // History Management
  saveToHistory: () => Promise<void>;
  loadFromHistory: (id: string) => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  getHistory: () => HistoryEntry[];
  clearHistory: () => void;

  // Utility
  reset: () => void;
  getRoom: () => Room;
  getDesignParameters: () => DesignParameters;
  setValidationErrors: (errors: string[]) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: LightingCalculatorState = {
  // Room Configuration - default office
  roomLength: 10,
  roomWidth: 8,
  roomHeight: 3,
  workPlaneHeight: 0.75,
  ceilingReflectance: 80,
  wallReflectance: 50,
  floorReflectance: 20,
  spaceType: 'office_general' as SpaceType,

  // Luminaire - none selected initially
  selectedLuminaire: null,

  // Design Parameters - IESNA defaults
  requiredIlluminance: 500, // Office standard
  utilizationFactor: 0.6,
  maintenanceFactor: 0.8,
  operatingHoursPerDay: 10,
  standard: 'IESNA' as LightingStandard,
  unitSystem: 'SI' as UnitSystem,

  // Override flags
  isUFManualOverride: false,

  // Results
  results: null,

  // UI State
  showHistorySidebar: false,
  showLuminaireCatalog: false,
  showCalculationDetails: false,

  // Validation
  validationErrors: [],
};

// ============================================================================
// Store
// ============================================================================

const HISTORY_KEY = 'electromate-lighting-history';
const MAX_HISTORY = 50;

export const useLightingStore = create<LightingCalculatorState & LightingCalculatorActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // =========================================================================
      // ROOM SETTERS
      // =========================================================================

      setRoomLength: (length) => {
        set({ roomLength: length, isUFManualOverride: false });
      },

      setRoomWidth: (width) => {
        set({ roomWidth: width, isUFManualOverride: false });
      },

      setRoomHeight: (height) => {
        set({ roomHeight: height, isUFManualOverride: false });
      },

      setWorkPlaneHeight: (height) => {
        set({ workPlaneHeight: height, isUFManualOverride: false });
      },

      setRoomDimensions: (length, width, height) => {
        set({
          roomLength: length,
          roomWidth: width,
          roomHeight: height,
          isUFManualOverride: false,
        });
      },

      setCeilingReflectance: (value) => {
        set({ ceilingReflectance: value, isUFManualOverride: false });
      },

      setWallReflectance: (value) => {
        set({ wallReflectance: value, isUFManualOverride: false });
      },

      setFloorReflectance: (value) => {
        set({ floorReflectance: value, isUFManualOverride: false });
      },

      setReflectances: (ceiling, wall, floor) => {
        set({
          ceilingReflectance: ceiling,
          wallReflectance: wall,
          floorReflectance: floor,
          isUFManualOverride: false,
        });
      },

      setSpaceType: (type) => {
        set({ spaceType: type });
      },

      // =========================================================================
      // LUMINAIRE SETTERS
      // =========================================================================

      setSelectedLuminaire: (luminaire) => {
        set({ selectedLuminaire: luminaire, isUFManualOverride: false });
      },

      // =========================================================================
      // DESIGN PARAMETER SETTERS
      // =========================================================================

      setRequiredIlluminance: (lux) => {
        set({ requiredIlluminance: lux });
      },

      setUtilizationFactor: (uf, isManual = false) => {
        set({ utilizationFactor: uf, isUFManualOverride: isManual });
      },

      setMaintenanceFactor: (mf) => {
        set({ maintenanceFactor: mf });
      },

      setOperatingHoursPerDay: (hours) => {
        set({ operatingHoursPerDay: hours });
      },

      setStandard: (standard) => {
        set({ standard });
      },

      setUnitSystem: (system) => {
        set({ unitSystem: system });
      },

      // =========================================================================
      // RESULTS
      // =========================================================================

      setResults: (results) => {
        set({ results });
      },

      clearResults: () => {
        set({ results: null });
      },

      // =========================================================================
      // UI TOGGLES
      // =========================================================================

      toggleHistorySidebar: () => {
        set((state) => ({ showHistorySidebar: !state.showHistorySidebar }));
      },

      toggleLuminaireCatalog: () => {
        set((state) => ({ showLuminaireCatalog: !state.showLuminaireCatalog }));
      },

      toggleCalculationDetails: () => {
        set((state) => ({ showCalculationDetails: !state.showCalculationDetails }));
      },

      // =========================================================================
      // HISTORY MANAGEMENT
      // =========================================================================

      saveToHistory: async () => {
        const state = get();
        const { results, selectedLuminaire } = state;

        if (!results || !selectedLuminaire) {
          console.warn('No results or luminaire to save to history');
          return;
        }

        try {
          const existingHistoryJson = localStorage.getItem(HISTORY_KEY);
          let history: HistoryEntry[] = existingHistoryJson
            ? JSON.parse(existingHistoryJson)
            : [];

          const room: Room = {
            length: state.roomLength,
            width: state.roomWidth,
            height: state.roomHeight,
            workPlaneHeight: state.workPlaneHeight,
            ceilingReflectance: state.ceilingReflectance,
            wallReflectance: state.wallReflectance,
            floorReflectance: state.floorReflectance,
            spaceType: state.spaceType,
          };

          const entry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            room,
            luminaire: selectedLuminaire,
            results,
          };

          // FIFO eviction
          if (history.length >= MAX_HISTORY) {
            history.shift();
          }

          history.push(entry);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

          console.info(`Lighting calculation saved to history (${history.length}/${MAX_HISTORY})`);
        } catch (error) {
          console.error('Failed to save calculation to history:', error);

          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            try {
              const existingHistoryJson = localStorage.getItem(HISTORY_KEY);
              if (existingHistoryJson) {
                let history: HistoryEntry[] = JSON.parse(existingHistoryJson);
                history = history.slice(10);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
          const existingHistoryJson = localStorage.getItem(HISTORY_KEY);

          if (!existingHistoryJson) {
            console.warn('No history found');
            return;
          }

          const history: HistoryEntry[] = JSON.parse(existingHistoryJson);
          const entry = history.find((h) => h.id === id);

          if (!entry) {
            console.warn(`History entry ${id} not found`);
            return;
          }

          set({
            roomLength: entry.room.length,
            roomWidth: entry.room.width,
            roomHeight: entry.room.height,
            workPlaneHeight: entry.room.workPlaneHeight,
            ceilingReflectance: entry.room.ceilingReflectance,
            wallReflectance: entry.room.wallReflectance,
            floorReflectance: entry.room.floorReflectance,
            spaceType: entry.room.spaceType,
            selectedLuminaire: entry.luminaire,
            results: entry.results,
          });

          console.info(`Loaded calculation from history: ${id}`);
        } catch (error) {
          console.error('Failed to load calculation from history:', error);
        }
      },

      deleteFromHistory: async (id) => {
        try {
          const existingHistoryJson = localStorage.getItem(HISTORY_KEY);

          if (!existingHistoryJson) {
            return;
          }

          let history: HistoryEntry[] = JSON.parse(existingHistoryJson);
          history = history.filter((h) => h.id !== id);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

          console.info(`Deleted calculation from history: ${id}`);
        } catch (error) {
          console.error('Failed to delete calculation from history:', error);
        }
      },

      getHistory: () => {
        try {
          const existingHistoryJson = localStorage.getItem(HISTORY_KEY);

          if (!existingHistoryJson) {
            return [];
          }

          const history: HistoryEntry[] = JSON.parse(existingHistoryJson);

          // Sort by timestamp descending (newest first)
          return history.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } catch (error) {
          console.error('Failed to get history:', error);
          return [];
        }
      },

      clearHistory: () => {
        try {
          localStorage.removeItem(HISTORY_KEY);
          console.info('Cleared lighting calculation history');
        } catch (error) {
          console.error('Failed to clear history:', error);
        }
      },

      // =========================================================================
      // UTILITY
      // =========================================================================

      reset: () => set(initialState),

      getRoom: () => {
        const state = get();
        return {
          length: state.roomLength,
          width: state.roomWidth,
          height: state.roomHeight,
          workPlaneHeight: state.workPlaneHeight,
          ceilingReflectance: state.ceilingReflectance,
          wallReflectance: state.wallReflectance,
          floorReflectance: state.floorReflectance,
          spaceType: state.spaceType,
        };
      },

      getDesignParameters: () => {
        const state = get();
        return {
          requiredIlluminance: state.requiredIlluminance,
          utilizationFactor: state.utilizationFactor,
          maintenanceFactor: state.maintenanceFactor,
          operatingHoursPerDay: state.operatingHoursPerDay,
          standard: state.standard,
          unitSystem: state.unitSystem,
        };
      },

      setValidationErrors: (errors) => {
        set({ validationErrors: errors });
      },
    }),
    {
      name: 'electromate-lighting',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        roomLength: state.roomLength,
        roomWidth: state.roomWidth,
        roomHeight: state.roomHeight,
        workPlaneHeight: state.workPlaneHeight,
        ceilingReflectance: state.ceilingReflectance,
        wallReflectance: state.wallReflectance,
        floorReflectance: state.floorReflectance,
        spaceType: state.spaceType,
        selectedLuminaire: state.selectedLuminaire,
        requiredIlluminance: state.requiredIlluminance,
        utilizationFactor: state.utilizationFactor,
        maintenanceFactor: state.maintenanceFactor,
        operatingHoursPerDay: state.operatingHoursPerDay,
        standard: state.standard,
        unitSystem: state.unitSystem,
        isUFManualOverride: state.isUFManualOverride,
        // Don't persist: results, UI state, validation errors
      }),
    }
  )
);
