import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  VoltageDropState,
  VoltageDropActions,
  VoltageDropHistoryEntry,
  VoltageDropStandard,
  CircuitPhase,
  ConductorMaterial,
  ConductorType,
  LengthUnit,
  CableSizeMode,
  VoltageDropCalculationResults,
} from '@/types/voltage-drop'

const HISTORY_KEY = 'electromate-voltage-drop-history'
const MAX_HISTORY = 50

const initialState: VoltageDropState = {
  standard: 'IEC',
  phase: 'three-phase',
  systemVoltage: 415,
  current: 100,
  length: 50,
  lengthUnit: 'meters',
  conductorType: 'cable',
  conductorMaterial: 'copper',
  powerFactor: 0.85,
  cableSizeMode: 'select',
  cableSizeMm2: 25,
  cableSizeAWG: null,
  customResistance: null,
  parallelRuns: 1,
  buswayRating: null,
  buswayType: 'sandwich',
  customBuswayImpedance: null,
  maxDropPercent: 3,
  includeCableSuggestion: true,
  projectName: '',
  projectLocation: '',
  engineerName: '',
  results: null,
  showHistorySidebar: false,
}

function getHistory(): VoltageDropHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries: VoltageDropHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

export const useVoltageDropStore = create<VoltageDropState & VoltageDropActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStandard: (v: VoltageDropStandard) => set({
        standard: v,
        results: null,
        // Reset cable size when switching standards
        cableSizeMm2: v === 'IEC' ? 25 : null,
        cableSizeAWG: v === 'NEC' ? '4' : null,
        lengthUnit: v === 'IEC' ? 'meters' : 'feet',
        systemVoltage: v === 'IEC' ? 415 : 480,
      }),
      setPhase: (v: CircuitPhase) => set({ phase: v, results: null }),
      setSystemVoltage: (v: number) => set({ systemVoltage: v, results: null }),
      setCurrent: (v: number) => set({ current: v, results: null }),
      setLength: (v: number) => set({ length: v, results: null }),
      setLengthUnit: (v: LengthUnit) => set({ lengthUnit: v, results: null }),
      setConductorType: (v: ConductorType) => set({ conductorType: v, results: null }),
      setConductorMaterial: (v: ConductorMaterial) => set({ conductorMaterial: v, results: null }),
      setPowerFactor: (v: number) => set({ powerFactor: v, results: null }),
      setCableSizeMode: (v: CableSizeMode) => set({ cableSizeMode: v, results: null }),
      setCableSizeMm2: (v: number | null) => set({ cableSizeMm2: v, results: null }),
      setCableSizeAWG: (v: string | null) => set({ cableSizeAWG: v, results: null }),
      setCustomResistance: (v: number | null) => set({ customResistance: v, results: null }),
      setParallelRuns: (v: number) => set({ parallelRuns: v, results: null }),
      setBuswayRating: (v: number | null) => set({ buswayRating: v, results: null }),
      setBuswayType: (v: 'sandwich' | 'non-sandwich') => set({ buswayType: v, results: null }),
      setCustomBuswayImpedance: (v: number | null) => set({ customBuswayImpedance: v, results: null }),
      setMaxDropPercent: (v: number) => set({ maxDropPercent: v, results: null }),
      setIncludeCableSuggestion: (v: boolean) => set({ includeCableSuggestion: v, results: null }),
      setProjectName: (v: string) => set({ projectName: v }),
      setProjectLocation: (v: string) => set({ projectLocation: v }),
      setEngineerName: (v: string) => set({ engineerName: v }),
      setResults: (r: VoltageDropCalculationResults | null) => set({ results: r }),
      setShowHistorySidebar: (v: boolean) => set({ showHistorySidebar: v }),

      saveToHistory: () => {
        const state = get()
        if (!state.results) return
        const entry: VoltageDropHistoryEntry = {
          id: `vd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          input: {
            standard: state.standard,
            phase: state.phase,
            systemVoltage: state.systemVoltage,
            current: state.current,
            length: state.length,
            lengthUnit: state.lengthUnit,
            conductorType: state.conductorType,
            conductorMaterial: state.conductorMaterial,
            powerFactor: state.powerFactor,
            cableSizeMode: state.cableSizeMode,
            cableSizeMm2: state.cableSizeMm2,
            cableSizeAWG: state.cableSizeAWG,
            customResistance: state.customResistance,
            parallelRuns: state.parallelRuns,
            buswayRating: state.buswayRating,
            buswayType: state.buswayType,
            customBuswayImpedance: state.customBuswayImpedance,
            maxDropPercent: state.maxDropPercent,
            includeCableSuggestion: state.includeCableSuggestion,
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

      loadFromHistory: (id: string) => {
        const entry = getHistory().find(h => h.id === id)
        if (!entry) return
        set({ ...entry.input, ...entry.project, results: entry.results })
      },

      deleteFromHistory: (id: string) => {
        saveHistory(getHistory().filter(h => h.id !== id))
      },

      getHistory: () => getHistory(),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'electromate-voltage-drop',
      partialize: (state) => ({
        standard: state.standard,
        phase: state.phase,
        systemVoltage: state.systemVoltage,
        current: state.current,
        length: state.length,
        lengthUnit: state.lengthUnit,
        conductorType: state.conductorType,
        conductorMaterial: state.conductorMaterial,
        powerFactor: state.powerFactor,
        cableSizeMode: state.cableSizeMode,
        cableSizeMm2: state.cableSizeMm2,
        cableSizeAWG: state.cableSizeAWG,
        customResistance: state.customResistance,
        parallelRuns: state.parallelRuns,
        buswayRating: state.buswayRating,
        buswayType: state.buswayType,
        customBuswayImpedance: state.customBuswayImpedance,
        maxDropPercent: state.maxDropPercent,
        includeCableSuggestion: state.includeCableSuggestion,
        projectName: state.projectName,
        projectLocation: state.projectLocation,
        engineerName: state.engineerName,
      }),
    }
  )
)
