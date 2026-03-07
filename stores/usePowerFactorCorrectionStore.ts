import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  PFCState,
  PFCActions,
  PFCHistoryEntry,
  PFCStandard,
  PFCSystemType,
  PFCConnectionType,
  PFCCorrectionType,
  PFCLoadProfile,
  PFCCalculationResults,
} from '@/types/power-factor-correction'

const HISTORY_KEY = 'electromate-pfc-history'
const MAX_HISTORY = 50

const initialState: PFCState = {
  standard: 'IEC',
  systemType: 'three-phase-ac',
  voltage: 415,
  frequency: 50,
  activePower: 100,
  currentPowerFactor: 0.75,
  targetPowerFactor: 0.95,
  connectionType: 'delta',
  correctionType: 'automatic',
  loadProfile: 'variable',
  harmonicDistortion: 5,
  ambientTemperature: 35,
  altitude: 0,
  projectName: '',
  projectLocation: '',
  engineerName: '',
  results: null,
  showHistorySidebar: false,
  showEnvironmental: false,
}

export const usePowerFactorCorrectionStore = create<PFCState & PFCActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Input setters — clear results on change
      setStandard: (v: PFCStandard) => set({ standard: v, results: null }),
      setSystemType: (v: PFCSystemType) => set({ systemType: v, results: null }),
      setVoltage: (v: number) => set({ voltage: v, results: null }),
      setFrequency: (v: number) => set({ frequency: v, results: null }),
      setActivePower: (v: number) => set({ activePower: v, results: null }),
      setCurrentPowerFactor: (v: number) => set({ currentPowerFactor: v, results: null }),
      setTargetPowerFactor: (v: number) => set({ targetPowerFactor: v, results: null }),
      setConnectionType: (v: PFCConnectionType) => set({ connectionType: v, results: null }),
      setCorrectionType: (v: PFCCorrectionType) => set({ correctionType: v, results: null }),
      setLoadProfile: (v: PFCLoadProfile) => set({ loadProfile: v, results: null }),
      setHarmonicDistortion: (v: number) => set({ harmonicDistortion: v, results: null }),

      setAmbientTemperature: (v: number) => set({ ambientTemperature: v, results: null }),
      setAltitude: (v: number) => set({ altitude: v, results: null }),

      setProjectName: (v: string) => set({ projectName: v }),
      setProjectLocation: (v: string) => set({ projectLocation: v }),
      setEngineerName: (v: string) => set({ engineerName: v }),

      setResults: (r: PFCCalculationResults | null) => set({ results: r }),
      setShowHistorySidebar: (v: boolean) => set({ showHistorySidebar: v }),
      setShowEnvironmental: (v: boolean) => set({ showEnvironmental: v }),

      saveToHistory: () => {
        const state = get()
        if (!state.results) return

        const entry: PFCHistoryEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toISOString(),
          input: {
            standard: state.standard,
            systemType: state.systemType,
            voltage: state.voltage,
            frequency: state.frequency,
            activePower: state.activePower,
            currentPowerFactor: state.currentPowerFactor,
            targetPowerFactor: state.targetPowerFactor,
            connectionType: state.connectionType,
            correctionType: state.correctionType,
            loadProfile: state.loadProfile,
            harmonicDistortion: state.harmonicDistortion,
          },
          environment: {
            ambientTemperature: state.ambientTemperature,
            altitude: state.altitude,
          },
          project: {
            projectName: state.projectName,
            projectLocation: state.projectLocation,
            engineerName: state.engineerName,
          },
          results: state.results,
        }

        try {
          const raw = localStorage.getItem(HISTORY_KEY)
          const history: PFCHistoryEntry[] = raw ? JSON.parse(raw) : []
          history.unshift(entry)
          if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
        } catch { /* storage full or unavailable */ }
      },

      loadFromHistory: (id: string) => {
        try {
          const raw = localStorage.getItem(HISTORY_KEY)
          if (!raw) return
          const history: PFCHistoryEntry[] = JSON.parse(raw)
          const entry = history.find(h => h.id === id)
          if (!entry) return
          set({
            ...entry.input,
            ...entry.environment,
            ...entry.project,
            results: entry.results,
          })
        } catch { /* ignore */ }
      },

      deleteFromHistory: (id: string) => {
        try {
          const raw = localStorage.getItem(HISTORY_KEY)
          if (!raw) return
          const history: PFCHistoryEntry[] = JSON.parse(raw)
          const filtered = history.filter(h => h.id !== id)
          localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
        } catch { /* ignore */ }
      },

      getHistory: (): PFCHistoryEntry[] => {
        try {
          const raw = localStorage.getItem(HISTORY_KEY)
          if (!raw) return []
          return JSON.parse(raw) as PFCHistoryEntry[]
        } catch { return [] }
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'electromate-pfc',
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { results, showHistorySidebar, showEnvironmental, ...rest } = state
        return rest
      },
    }
  )
)
