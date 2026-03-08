import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  TransformerState,
  TransformerActions,
  TransformerHistoryEntry,
  TransformerStandard,
  TransformerPhase,
  TransformerType,
  CoolingClass,
  VectorGroup,
  TapPosition,
  LoadProfile,
  TransformerCalculationResults,
} from '@/types/transformer-sizing'

const HISTORY_KEY = 'electromate-transformer-history'
const MAX_HISTORY = 50

const initialState: TransformerState = {
  standard: 'IEC',
  phase: 'three-phase',
  loadKW: 500,
  loadPowerFactor: 0.85,
  primaryVoltage: 11000,
  secondaryVoltage: 415,
  transformerType: 'oil-filled',
  coolingClass: 'ONAN',
  vectorGroup: 'Dyn11',
  tapPosition: 'off-load',
  tapRange: 5,
  loadProfile: 'industrial',
  demandFactor: 0.8,
  futureGrowth: 1.15,
  impedancePercent: undefined,
  ambientTemperature: 35,
  altitude: 0,
  installationLocation: 'outdoor',
  projectName: '',
  projectLocation: '',
  engineerName: '',
  results: null,
  showHistorySidebar: false,
  showEnvironmental: false,
}

function getHistory(): TransformerHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(entries: TransformerHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

export const useTransformerSizingStore = create<TransformerState & TransformerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Input setters — clear results on change
      setStandard: (v: TransformerStandard) => set({ standard: v, results: null }),
      setPhase: (v: TransformerPhase) => set({ phase: v, results: null }),
      setLoadKW: (v: number) => set({ loadKW: v, results: null }),
      setLoadPowerFactor: (v: number) => set({ loadPowerFactor: v, results: null }),
      setPrimaryVoltage: (v: number) => set({ primaryVoltage: v, results: null }),
      setSecondaryVoltage: (v: number) => set({ secondaryVoltage: v, results: null }),
      setTransformerType: (v: TransformerType) => set({ transformerType: v, results: null }),
      setCoolingClass: (v: CoolingClass) => set({ coolingClass: v, results: null }),
      setVectorGroup: (v: VectorGroup) => set({ vectorGroup: v, results: null }),
      setTapPosition: (v: TapPosition) => set({ tapPosition: v, results: null }),
      setTapRange: (v: number) => set({ tapRange: v, results: null }),
      setLoadProfile: (v: LoadProfile) => set({ loadProfile: v, results: null }),
      setDemandFactor: (v: number) => set({ demandFactor: v, results: null }),
      setFutureGrowth: (v: number) => set({ futureGrowth: v, results: null }),
      setImpedancePercent: (v: number | undefined) => set({ impedancePercent: v, results: null }),
      setAmbientTemperature: (v: number) => set({ ambientTemperature: v, results: null }),
      setAltitude: (v: number) => set({ altitude: v, results: null }),
      setInstallationLocation: (v: 'indoor' | 'outdoor' | 'underground-vault') => set({ installationLocation: v, results: null }),
      setProjectName: (v: string) => set({ projectName: v }),
      setProjectLocation: (v: string) => set({ projectLocation: v }),
      setEngineerName: (v: string) => set({ engineerName: v }),
      setResults: (r: TransformerCalculationResults | null) => set({ results: r }),
      setShowHistorySidebar: (v: boolean) => set({ showHistorySidebar: v }),
      setShowEnvironmental: (v: boolean) => set({ showEnvironmental: v }),

      saveToHistory: () => {
        const state = get()
        if (!state.results) return
        const entry: TransformerHistoryEntry = {
          id: `txfr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          input: {
            standard: state.standard,
            phase: state.phase,
            loadKW: state.loadKW,
            loadPowerFactor: state.loadPowerFactor,
            primaryVoltage: state.primaryVoltage,
            secondaryVoltage: state.secondaryVoltage,
            transformerType: state.transformerType,
            coolingClass: state.coolingClass,
            vectorGroup: state.vectorGroup,
            tapPosition: state.tapPosition,
            tapRange: state.tapRange,
            loadProfile: state.loadProfile,
            demandFactor: state.demandFactor,
            futureGrowth: state.futureGrowth,
            impedancePercent: state.impedancePercent,
          },
          environment: {
            ambientTemperature: state.ambientTemperature,
            altitude: state.altitude,
            installationLocation: state.installationLocation,
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
        const history = getHistory()
        const entry = history.find(h => h.id === id)
        if (!entry) return
        set({
          ...entry.input,
          ...entry.environment,
          ...entry.project,
          results: entry.results,
        })
      },

      deleteFromHistory: (id: string) => {
        const history = getHistory().filter(h => h.id !== id)
        saveHistory(history)
      },

      getHistory: () => getHistory(),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'electromate-transformer-sizing',
      partialize: (state) => ({
        standard: state.standard,
        phase: state.phase,
        loadKW: state.loadKW,
        loadPowerFactor: state.loadPowerFactor,
        primaryVoltage: state.primaryVoltage,
        secondaryVoltage: state.secondaryVoltage,
        transformerType: state.transformerType,
        coolingClass: state.coolingClass,
        vectorGroup: state.vectorGroup,
        tapPosition: state.tapPosition,
        tapRange: state.tapRange,
        loadProfile: state.loadProfile,
        demandFactor: state.demandFactor,
        futureGrowth: state.futureGrowth,
        ambientTemperature: state.ambientTemperature,
        altitude: state.altitude,
        installationLocation: state.installationLocation,
        projectName: state.projectName,
        projectLocation: state.projectLocation,
        engineerName: state.engineerName,
      }),
    }
  )
)
