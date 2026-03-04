/**
 * Motor & HVAC Breaker Calculator Zustand Store
 *
 * State management with localStorage persistence.
 * History stored in separate localStorage key.
 *
 * @module useMotorBreakerStore
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  MotorBreakerState,
  MotorBreakerActions,
  MotorBreakerCalculationResults,
  MotorBreakerHistoryEntry,
  MotorBreakerProjectInfo,
  SystemType,
  MotorBreakerLoadType,
  MotorBreakerInputMode,
  PowerUnit,
  NECMotorProtectionDevice,
  IECUtilizationCategory,
  InstallationMethod,
} from '@/types/motor-breaker-calculator';

const HISTORY_KEY = 'electromate-motor-breaker-history';
const MAX_HISTORY = 50;

const initialState: MotorBreakerState = {
  standard: 'NEC',
  systemType: 'three-phase-ac',
  loadType: 'motor',
  voltage: 480,
  inputMode: 'power',
  powerValue: 25,
  powerUnit: 'hp',
  fla: 0,
  powerFactor: 0.85,
  protectionDevice: 'thermal-magnetic',
  utilizationCategory: 'AC-3',
  mca: 28,
  mop: 40,
  ambientTemperature: undefined,
  groupedCables: undefined,
  installationMethod: undefined,
  projectName: undefined,
  projectLocation: undefined,
  engineerName: undefined,
  results: undefined,
  showHistorySidebar: false,
  showEnvironmental: false,
};

export const useMotorBreakerStore = create<MotorBreakerState & MotorBreakerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStandard: (standard) => {
        set({ standard, results: undefined });
      },
      setSystemType: (systemType) => set({ systemType, results: undefined }),
      setLoadType: (loadType) => set({ loadType, results: undefined }),
      setVoltage: (voltage) => set({ voltage }),
      setInputMode: (inputMode) => set({ inputMode }),
      setPowerValue: (powerValue) => set({ powerValue }),
      setPowerUnit: (powerUnit) => set({ powerUnit }),
      setFLA: (fla) => set({ fla }),
      setPowerFactor: (powerFactor) => set({ powerFactor }),
      setProtectionDevice: (protectionDevice) => set({ protectionDevice }),
      setUtilizationCategory: (utilizationCategory) => set({ utilizationCategory }),
      setMCA: (mca) => set({ mca }),
      setMOP: (mop) => set({ mop }),
      setAmbientTemperature: (ambientTemperature) => set({ ambientTemperature }),
      setGroupedCables: (groupedCables) => set({ groupedCables }),
      setInstallationMethod: (installationMethod) => set({ installationMethod }),

      setProjectInformation: (info) =>
        set({
          projectName: info.projectName,
          projectLocation: info.projectLocation,
          engineerName: info.engineerName,
        }),

      toggleHistorySidebar: () =>
        set((state) => ({ showHistorySidebar: !state.showHistorySidebar })),

      toggleEnvironmental: () =>
        set((state) => ({ showEnvironmental: !state.showEnvironmental })),

      saveToHistory: async () => {
        const state = get();
        if (!state.results) return;

        try {
          const existingJson = localStorage.getItem(HISTORY_KEY);
          let history: MotorBreakerHistoryEntry[] = existingJson
            ? JSON.parse(existingJson)
            : [];

          const entry: MotorBreakerHistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            input: {
              standard: state.standard,
              systemType: state.systemType,
              loadType: state.loadType,
              voltage: state.voltage,
              inputMode: state.inputMode,
              powerValue: state.powerValue,
              powerUnit: state.powerUnit,
              fla: state.fla,
              powerFactor: state.powerFactor,
              protectionDevice: state.protectionDevice,
              utilizationCategory: state.utilizationCategory,
              mca: state.mca,
              mop: state.mop,
            },
            environment: state.ambientTemperature || state.groupedCables || state.installationMethod
              ? {
                  ambientTemperature: state.ambientTemperature,
                  groupedCables: state.groupedCables,
                  installationMethod: state.installationMethod,
                }
              : undefined,
            results: state.results,
            project: state.projectName || state.projectLocation || state.engineerName
              ? {
                  projectName: state.projectName,
                  projectLocation: state.projectLocation,
                  engineerName: state.engineerName,
                }
              : undefined,
            sortOrder: history.length,
          };

          if (history.length >= MAX_HISTORY) {
            history.shift();
            history = history.map((h, idx) => ({ ...h, sortOrder: idx }));
          }

          history.push(entry);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
          console.error('Failed to save motor breaker history:', error);
        }
      },

      loadFromHistory: async (id) => {
        try {
          const existingJson = localStorage.getItem(HISTORY_KEY);
          if (!existingJson) return;

          const history: MotorBreakerHistoryEntry[] = JSON.parse(existingJson);
          const entry = history.find((h) => h.id === id);
          if (!entry) return;

          set({
            standard: entry.input.standard,
            systemType: entry.input.systemType,
            loadType: entry.input.loadType,
            voltage: entry.input.voltage,
            inputMode: entry.input.inputMode,
            powerValue: entry.input.powerValue,
            powerUnit: entry.input.powerUnit,
            fla: entry.input.fla,
            powerFactor: entry.input.powerFactor,
            protectionDevice: entry.input.protectionDevice,
            utilizationCategory: entry.input.utilizationCategory,
            mca: entry.input.mca,
            mop: entry.input.mop,
            ambientTemperature: entry.environment?.ambientTemperature,
            groupedCables: entry.environment?.groupedCables,
            installationMethod: entry.environment?.installationMethod,
            projectName: entry.project?.projectName,
            projectLocation: entry.project?.projectLocation,
            engineerName: entry.project?.engineerName,
            results: entry.results,
          });
        } catch (error) {
          console.error('Failed to load motor breaker history:', error);
        }
      },

      deleteFromHistory: async (id) => {
        try {
          const existingJson = localStorage.getItem(HISTORY_KEY);
          if (!existingJson) return;

          let history: MotorBreakerHistoryEntry[] = JSON.parse(existingJson);
          history = history.filter((h) => h.id !== id);
          history = history.map((h, idx) => ({ ...h, sortOrder: idx }));
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
          console.error('Failed to delete motor breaker history:', error);
        }
      },

      getHistory: () => {
        try {
          const existingJson = localStorage.getItem(HISTORY_KEY);
          if (!existingJson) return [];

          const history: MotorBreakerHistoryEntry[] = JSON.parse(existingJson);
          return history.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } catch {
          return [];
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'electromate-motor-breaker',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        standard: state.standard,
        systemType: state.systemType,
        loadType: state.loadType,
        voltage: state.voltage,
        inputMode: state.inputMode,
        powerValue: state.powerValue,
        powerUnit: state.powerUnit,
        fla: state.fla,
        powerFactor: state.powerFactor,
        protectionDevice: state.protectionDevice,
        utilizationCategory: state.utilizationCategory,
        mca: state.mca,
        mop: state.mop,
        ambientTemperature: state.ambientTemperature,
        groupedCables: state.groupedCables,
        installationMethod: state.installationMethod,
        projectName: state.projectName,
        projectLocation: state.projectLocation,
        engineerName: state.engineerName,
      }),
    }
  )
);
