import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  HarmonicAnalysisState,
  HarmonicAnalysisActions,
  HarmonicInput,
  HarmonicHistoryEntry,
  HarmonicOrder,
} from '@/types/harmonic-analysis'
import { mergeProfileIntoSpectrum, getProfileHarmonics } from '@/lib/calculations/harmonic-analysis/harmonicData'

const MAX_HISTORY = 50
const HISTORY_KEY = 'electromate-harmonic-history'

function getHistory(): HarmonicHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries: HarmonicHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

const defaultHarmonics: HarmonicOrder[] = Array.from({ length: 49 }, (_, i) => ({
  order: i + 2,
  magnitude: 0,
}))

const initialState: HarmonicAnalysisState = {
  standard: 'IEEE519',
  systemType: 'three-phase',
  voltageLevel: 'lv',
  systemVoltage: 400,
  fundamentalFrequency: 50,
  loadProfile: 'custom',
  fundamentalCurrent: 100,
  loadPowerKW: null,
  shortCircuitCurrentKA: null,
  maxDemandCurrent: null,
  currentHarmonics: [...defaultHarmonics],
  voltageHarmonics: [...defaultHarmonics],
  calculateVoltageThd: false,
  calculateFilterSizing: false,
  targetThd: 5,
  projectName: '',
  projectLocation: '',
  engineerName: '',
  results: null,
  showHistorySidebar: false,
}

export const useHarmonicAnalysisStore = create<HarmonicAnalysisState & HarmonicAnalysisActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStandard: (v) => set({ standard: v, results: null }),
      setSystemType: (v) => set({ systemType: v, results: null }),
      setVoltageLevel: (v) => {
        const voltages: Record<string, number> = { lv: 400, mv: 11000, hv: 132000 }
        set({ voltageLevel: v, systemVoltage: voltages[v] || 400, results: null })
      },
      setSystemVoltage: (v) => set({ systemVoltage: v, results: null }),
      setFundamentalFrequency: (v) => set({ fundamentalFrequency: v, results: null }),
      setLoadProfile: (v) => {
        if (v === 'custom') {
          set({ loadProfile: v, currentHarmonics: [...defaultHarmonics], results: null })
        } else {
          const harmonics = mergeProfileIntoSpectrum(getProfileHarmonics(v))
          set({ loadProfile: v, currentHarmonics: harmonics, results: null })
        }
      },
      setFundamentalCurrent: (v) => set({ fundamentalCurrent: v, results: null }),
      setLoadPowerKW: (v) => set({ loadPowerKW: v, results: null }),
      setShortCircuitCurrentKA: (v) => set({ shortCircuitCurrentKA: v, results: null }),
      setMaxDemandCurrent: (v) => set({ maxDemandCurrent: v, results: null }),
      setCurrentHarmonics: (v) => set({ currentHarmonics: v, results: null }),
      setVoltageHarmonics: (v) => set({ voltageHarmonics: v, results: null }),
      setCalculateVoltageThd: (v) => set({ calculateVoltageThd: v, results: null }),
      setCalculateFilterSizing: (v) => set({ calculateFilterSizing: v, results: null }),
      setTargetThd: (v) => set({ targetThd: v, results: null }),
      setProjectName: (v) => set({ projectName: v }),
      setProjectLocation: (v) => set({ projectLocation: v }),
      setEngineerName: (v) => set({ engineerName: v }),
      setResults: (v) => set({ results: v }),
      setShowHistorySidebar: (v) => set({ showHistorySidebar: v }),

      updateCurrentHarmonic: (order, magnitude) => {
        const harmonics = [...get().currentHarmonics]
        const idx = harmonics.findIndex(h => h.order === order)
        if (idx >= 0) {
          harmonics[idx] = { ...harmonics[idx], magnitude }
          set({ currentHarmonics: harmonics, results: null })
        }
      },

      updateVoltageHarmonic: (order, magnitude) => {
        const harmonics = [...get().voltageHarmonics]
        const idx = harmonics.findIndex(h => h.order === order)
        if (idx >= 0) {
          harmonics[idx] = { ...harmonics[idx], magnitude }
          set({ voltageHarmonics: harmonics, results: null })
        }
      },

      saveToHistory: () => {
        const state = get()
        if (!state.results) return
        const entry: HarmonicHistoryEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toISOString(),
          input: {
            standard: state.standard,
            systemType: state.systemType,
            voltageLevel: state.voltageLevel,
            systemVoltage: state.systemVoltage,
            fundamentalFrequency: state.fundamentalFrequency,
            loadProfile: state.loadProfile,
            fundamentalCurrent: state.fundamentalCurrent,
            loadPowerKW: state.loadPowerKW,
            shortCircuitCurrentKA: state.shortCircuitCurrentKA,
            maxDemandCurrent: state.maxDemandCurrent,
            currentHarmonics: state.currentHarmonics,
            voltageHarmonics: state.voltageHarmonics,
            calculateVoltageThd: state.calculateVoltageThd,
            calculateFilterSizing: state.calculateFilterSizing,
            targetThd: state.targetThd,
          },
          project: {
            projectName: state.projectName,
            projectLocation: state.projectLocation,
            engineerName: state.engineerName,
          },
          results: state.results,
        }
        const history = getHistory()
        history.unshift(entry)
        saveHistory(history)
      },

      loadFromHistory: (id) => {
        const entry = getHistory().find(h => h.id === id)
        if (!entry) return
        set({
          ...entry.input,
          ...entry.project,
          results: entry.results,
        })
      },

      deleteFromHistory: (id) => {
        const history = getHistory().filter(h => h.id !== id)
        saveHistory(history)
      },

      getHistory: () => getHistory(),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'electromate-harmonic-analysis',
      partialize: (state) => ({
        standard: state.standard,
        systemType: state.systemType,
        voltageLevel: state.voltageLevel,
        systemVoltage: state.systemVoltage,
        fundamentalFrequency: state.fundamentalFrequency,
        loadProfile: state.loadProfile,
        fundamentalCurrent: state.fundamentalCurrent,
        loadPowerKW: state.loadPowerKW,
        shortCircuitCurrentKA: state.shortCircuitCurrentKA,
        maxDemandCurrent: state.maxDemandCurrent,
        calculateVoltageThd: state.calculateVoltageThd,
        calculateFilterSizing: state.calculateFilterSizing,
        targetThd: state.targetThd,
        projectName: state.projectName,
        projectLocation: state.projectLocation,
        engineerName: state.engineerName,
      }),
    }
  )
)
